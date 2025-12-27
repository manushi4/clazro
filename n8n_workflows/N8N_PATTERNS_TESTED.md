# n8n Workflow Patterns - Tested & Working

This document contains TESTED patterns that work correctly in n8n. All patterns were validated through actual execution.

## Critical n8n Sandbox Limitations

### ERRORS DISCOVERED (DO NOT USE)

| Pattern | Error | Fix |
|---------|-------|-----|
| `process.env.VARIABLE` | `process is not defined` | Use hardcoded values or n8n credentials |
| `$request?.headers` | `$request is not defined` | Not available in Code nodes |
| `require('module')` | `require is not defined` | n8n sandbox has no module access |
| `$json.field` for webhook | Returns `undefined` | Use `$json.body.field` for POST data |

### Webhook Data Access Pattern

```javascript
// CORRECT: Webhook POST data is in $json.body
const body = $json.body || $json;  // Fallback for manual execution

// WRONG: Direct access doesn't work for webhooks
const data = $json;  // This gives webhook wrapper, not body

// CORRECT: Headers are in $json.headers
const headers = $json.headers || {};
const apiKey = headers['x-api-key'] || '';
```

---

## Pattern 1: Webhook Authentication

```javascript
// ============================================
// PATTERN: Webhook Authentication
// ============================================
const headers = $json.headers || {};
const body = $json.body || $json;

// Get API key from header (case-insensitive)
const apiKey = headers['x-api-key'] || headers['X-API-KEY'] ||
               headers['authorization'] || '';

// Valid API keys (in production, store securely)
const VALID_KEYS = ['sk_test_manushi_2025', 'sk_prod_manushi_2025'];

// Check if key is valid
const isAuthenticated = VALID_KEYS.some(key => apiKey.includes(key));

if (!isAuthenticated) {
  return {
    _auth_failed: true,
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key',
      hint: 'Include X-API-KEY header with valid key'
    }
  };
}

// Continue with authenticated request
return {
  ...body,
  _auth_passed: true
};
```

---

## Pattern 2: Entry Point with Correlation ID

```javascript
// ============================================
// PATTERN: Entry Point with Correlation ID
// ============================================
const body = $json.body || $json;

const correlationId = body.correlation_id ||
  'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

const trace = {
  correlation_id: correlationId,
  workflow_id: $workflow.id,
  workflow_name: $workflow.name,
  execution_id: $execution.id,
  started_at: new Date().toISOString(),
  authenticated: true
};

return {
  student_id: body.student_id,
  student_name: body.student_name,
  _trace: trace
};
```

**Available n8n Variables:**
- `$workflow.id` - Workflow UUID
- `$workflow.name` - Workflow name
- `$execution.id` - Current execution ID
- `$node.name` - Current node name
- `$json` - Input data from previous node
- `$getWorkflowStaticData('global')` - Persistent storage

---

## Pattern 3: Input Validation

```javascript
// ============================================
// PATTERN: Input Validation
// ============================================
const data = $json;
const errors = [];

const schema = {
  required: ['student_id', 'student_name', 'current_streak'],
  properties: {
    student_id: { type: 'string', minLength: 1, maxLength: 50 },
    student_name: { type: 'string', minLength: 1, maxLength: 100 },
    current_streak: { type: 'number', minimum: 0, maximum: 9999 }
  }
};

// Check required fields
for (const field of schema.required) {
  if (data[field] === undefined || data[field] === null || data[field] === '') {
    errors.push('Missing required field: ' + field);
  }
}

// Type validation
if (data.student_id && typeof data.student_id !== 'string') {
  errors.push('student_id must be string');
}

if (errors.length > 0) {
  return {
    _validation_failed: true,
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Input validation failed', details: errors },
    _trace: { ...data._trace, path: 'validation_error' }
  };
}

// Sanitize and return
return {
  student_id: String(data.student_id).trim().substring(0, 50),
  student_name: String(data.student_name).trim().substring(0, 100),
  current_streak: Math.max(0, Math.min(9999, Number(data.current_streak))),
  _trace: data._trace,
  _validation_passed: true
};
```

---

## Pattern 4: Duplicate Detection

```javascript
// ============================================
// PATTERN: Duplicate Detection
// ============================================
// Uses workflow static data for deduplication

const data = $json;
const dedupeKey = data._trace.correlation_id + '_' + data.student_id;

// Get workflow-level cache
const processed = $getWorkflowStaticData('global');
const recentRequests = processed.recentRequests || {};

// Clean old entries (older than 5 minutes)
const now = Date.now();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

for (const key in recentRequests) {
  if (now - recentRequests[key] > DEDUP_WINDOW_MS) {
    delete recentRequests[key];
  }
}

// Check for duplicate
if (recentRequests[dedupeKey]) {
  return {
    _duplicate: true,
    success: true,
    message: 'Request already processed',
    dedupe_key: dedupeKey,
    _trace: { ...data._trace, path: 'duplicate_skipped' }
  };
}

// Mark as processed
recentRequests[dedupeKey] = now;
processed.recentRequests = recentRequests;

return {
  ...data,
  _dedupe_key: dedupeKey,
  _duplicate_checked: true
};
```

---

## Pattern 5: HTTP Request with Retry

```json
{
  "method": "POST",
  "url": "https://api.example.com/endpoint",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "googlePalmApi",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify($json) }}",
  "options": {
    "timeout": 15000,
    "retry": {
      "maxTries": 3,
      "retryInterval": 1000,
      "retryIntervalMultiplier": 2
    }
  },
  "onError": "continueErrorOutput"
}
```

**Retry Settings:**
- `maxTries`: Number of attempts (3 recommended)
- `retryInterval`: Initial wait in ms (1000 = 1s)
- `retryIntervalMultiplier`: Exponential backoff (2 = double each time)

---

## Pattern 6: Gemini API Call

```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "googlePalmApi",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"contents\": [{\"role\": \"user\", \"parts\": [{\"text\": \"{{ $json.prompt }}\"}]}],\n  \"generationConfig\": {\"temperature\": 0.8, \"maxOutputTokens\": 500}\n}",
  "options": {
    "timeout": 15000,
    "retry": { "maxTries": 3, "retryInterval": 1000, "retryIntervalMultiplier": 2 }
  },
  "onError": "continueErrorOutput"
}
```

**Key Settings:**
- `maxOutputTokens`: Set to 500+ (100 is too low)
- `onError: "continueErrorOutput"`: Routes errors to fallback
- Credential type: `googlePalmApi`

---

## Pattern 7: Cost Tracking

```javascript
// ============================================
// PATTERN: Cost Tracking for AI APIs
// ============================================
const PRICING = {
  model: 'gemini-2.5-flash',
  input_per_million: 0.15,
  output_per_million: 0.60
};

const response = $json;
const usage = response.usageMetadata || {};
const inputTokens = usage.promptTokenCount || 0;
const outputTokens = usage.candidatesTokenCount || 0;

const totalCost = ((inputTokens * 0.15) + (outputTokens * 0.60)) / 1000000;

const cost = {
  model: PRICING.model,
  tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
  cost_usd: Number(totalCost.toFixed(8))
};

return { ...response, _cost: cost };
```

---

## Pattern 8: Structured Logging

```javascript
// ============================================
// PATTERN: Structured Logging
// ============================================
const config = $('Previous Node').first().json;
const startTime = new Date(config._trace.started_at).getTime();
const duration_ms = Date.now() - startTime;

const log = {
  timestamp: new Date().toISOString(),
  level: 'info',  // debug, info, warn, error
  correlation_id: config._trace.correlation_id,
  workflow: $workflow.name,
  execution_id: $execution.id,
  node: $node.name,
  message: 'Operation completed',
  event_type: 'notification_sent',
  recipient_id: config.student_id,
  duration_ms: duration_ms,
  tokens_used: config._cost?.tokens || 0,
  cost_usd: config._cost?.cost_usd || 0
};

return { ...$json, _log: log };
```

---

## Pattern 9: Supabase Logging

```json
{
  "method": "POST",
  "url": "https://YOUR_PROJECT.supabase.co/rest/v1/automation_logs",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "apikey", "value": "YOUR_ANON_KEY" },
      { "name": "Authorization", "value": "Bearer YOUR_ANON_KEY" },
      { "name": "Prefer", "value": "return=minimal" }
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"correlation_id\": \"{{ $json._trace.correlation_id }}\",\n  \"workflow_name\": \"{{ $json._trace.workflow_name }}\",\n  \"execution_id\": \"{{ $json._trace.execution_id }}\",\n  \"level\": \"{{ $json._log.level }}\",\n  \"message\": \"{{ $json._log.message }}\",\n  \"duration_ms\": {{ $json._trace.duration_ms || 0 }},\n  \"payload\": {{ JSON.stringify($json) }}\n}",
  "options": { "timeout": 5000 },
  "onError": "continueRegularOutput"
}
```

**Supabase Table Schema:**
```sql
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  level TEXT DEFAULT 'info',
  message TEXT,
  event_type TEXT,
  recipient_id TEXT,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,8),
  path TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Pattern 10: Dead Letter Queue

```javascript
// ============================================
// PATTERN: Dead Letter Queue Entry
// ============================================
const config = $json;
const errorInfo = config._error_info || {};

return {
  correlation_id: config._trace.correlation_id,
  workflow_name: config._trace.workflow_name,
  execution_id: config._trace.execution_id,
  error_code: 'AI_FAILURE',
  error_message: errorInfo.message || 'Unknown error',
  original_payload: JSON.stringify(config),
  retry_count: 0,
  status: 'pending',
  created_at: new Date().toISOString()
};
```

**DLQ Table Schema:**
```sql
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  error_code TEXT,
  error_message TEXT,
  original_payload JSONB,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

---

## Pattern 11: Slack Alerting

```json
{
  "method": "POST",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"text\": \":warning: *Workflow Alert*\",\n  \"attachments\": [{\n    \"color\": \"warning\",\n    \"fields\": [\n      {\"title\": \"Workflow\", \"value\": \"{{ $json._trace.workflow_name }}\", \"short\": true},\n      {\"title\": \"Execution\", \"value\": \"{{ $json._trace.execution_id }}\", \"short\": true},\n      {\"title\": \"Error\", \"value\": \"{{ $json._error_info.message || 'Unknown' }}\", \"short\": false}\n    ]\n  }]\n}",
  "options": { "timeout": 5000 },
  "onError": "continueRegularOutput"
}
```

---

## Pattern 12: Fallback Handler

```javascript
// ============================================
// PATTERN: Fallback with DLQ Flag
// ============================================
const config = $('Previous Node').first().json;
const errorInfo = $json.error || {};
const duration_ms = Date.now() - new Date(config._trace.started_at).getTime();

const fallback = 'Hey ' + config.student_name + '! Your streak is amazing!';

return {
  success: true,
  notification: { title: 'Streak Alert', body: fallback },
  student: { id: config.student_id, name: config.student_name },
  ai_used: false,
  _cost: { tokens: 0, cost_usd: 0 },
  _log: {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: 'AI failed, using fallback',
    error_code: 'AI_FALLBACK'
  },
  _trace: { ...config._trace, duration_ms, path: 'ai_fallback' },
  _needs_dlq: true,
  _error_info: errorInfo
};
```

---

## Workflow Files Created

### AI Study Streak Series
| Version | File | Features |
|---------|------|----------|
| v1 | `ai_streak_v1_correlation.json` | Correlation ID, _trace |
| v2 | `ai_streak_v2_validation.json` | + Validation, IF branching |
| v3 | `ai_streak_v3_cost.json` | + Cost tracking |
| v4 | `ai_streak_v4_production.json` | + Structured logging |
| **v5** | **`ai_streak_v5_enterprise.json`** | **+ Auth, Dedupe, Retry, DLQ, Slack** |

### Smart Doubt Chain
| Version | File | Features |
|---------|------|----------|
| **v1** | **`smart_doubt_chain_v1.json`** | **Full Enterprise: Auth, Validation, Dedupe, AI Routing, FAQ Detection, Teacher Queue, DLQ, Slack** |

---

## v5 Enterprise Flow

```
Webhook
  -> Auth Check (401 if fail)
  -> Validate Input (400 if fail)
  -> Duplicate Check (skip if dup)
  -> Call Gemini (with retry)
      |-> Success -> Log to Supabase -> Respond
      |-> Error -> Fallback -> DLQ -> Slack Alert -> Respond
```

---

## Testing Commands

### PowerShell - With Auth
```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/streak-v5" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-API-KEY"="sk_test_manushi_2025"} `
  -Body '{"student_id":"stu123","student_name":"Rahul","current_streak":15}'
```

### MCP Execution
```javascript
mcp__n8n-mcp__execute_workflow({
  workflowId: "WORKFLOW_ID",
  inputs: {
    type: "webhook",
    webhookData: {
      method: "POST",
      headers: { "x-api-key": "sk_test_manushi_2025" },
      body: {
        student_id: "stu123",
        student_name: "Rahul",
        current_streak: 15
      }
    }
  }
});
```

---

## Production Checklist (All 22 Requirements)

| # | Requirement | Pattern | Status |
|---|-------------|---------|--------|
| 1 | Webhook authentication | Pattern 1 | Done |
| 2 | Input validation | Pattern 3 | Done |
| 3 | Type checking | Pattern 3 | Done |
| 4 | Input sanitization | Pattern 3 | Done |
| 5 | Unique request IDs | Pattern 2 | Done |
| 6 | Duplicate detection | Pattern 4 | Done |
| 7 | HTTP retry enabled | Pattern 5 | Done |
| 8 | Exponential backoff | Pattern 5 | Done |
| 9 | Per-node timeouts | Pattern 5/6 | Done |
| 10 | Default values | Pattern 3 | Done |
| 11 | Fallback handlers | Pattern 12 | Done |
| 12 | Cost tracking | Pattern 7 | Done |
| 13 | Structured logging | Pattern 8 | Done |
| 14 | Execution logging to DB | Pattern 9 | Done |
| 15 | Dead letter queue | Pattern 10 | Done |
| 16 | Failure alerting | Pattern 11 | Done |
| 17 | Correlation ID propagation | Pattern 2 | Done |
| 18 | Duration tracking | Pattern 8 | Done |
| 19 | Error codes | All patterns | Done |
| 20 | HTTP status codes | Respond nodes | Done |
| 21 | onError handling | Pattern 5/6 | Done |
| 22 | Test mode | webhook-test | Done |

---

## Smart Doubt Chain - Enterprise Flow

```
Webhook (POST /doubt-chain)
  -> Auth Check (401 if fail)
  -> Validate Input (400 if fail)
  -> Duplicate + FAQ Check (skip if dup, count for FAQ)
  -> Call Gemini AI (with confidence rating)
      |-> HIGH Confidence -> AI Direct Answer -> Log to Supabase -> Respond
      |-> MEDIUM/LOW Confidence -> Route to Teacher -> Save to Queue -> Respond
      |-> Error -> AI Fallback -> Needs DLQ? -> Dead Letter Queue -> Slack Alert -> Respond
```

### Smart Doubt Chain Features

| Feature | Description |
|---------|-------------|
| **AI Confidence Routing** | AI rates confidence (HIGH/MEDIUM/LOW), routes to teacher if not HIGH |
| **FAQ Detection** | Counts repeated doubts, flags for FAQ creation after 3x |
| **Teacher Queue** | Saves to Supabase doubt_queue table with priority |
| **AI Suggestions** | Even when routing to teacher, provides AI suggestion to help |

### Testing Smart Doubt Chain

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/doubt-chain" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-API-KEY"="sk_test_manushi_2025"} `
  -Body '{
    "doubt_id": "doubt_001",
    "doubt_text": "What is the difference between velocity and speed in physics?",
    "subject": "Physics",
    "topic": "Kinematics",
    "student_id": "stu123",
    "student_name": "Rahul",
    "student_class": "11th"
  }'
```

### Required Supabase Table: doubt_queue

```sql
CREATE TABLE doubt_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id TEXT NOT NULL,
  doubt_text TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT,
  student_class TEXT,
  ai_suggestion TEXT,
  ai_confidence TEXT,
  ai_reason TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  faq_candidate BOOLEAN DEFAULT false,
  doubt_frequency INTEGER DEFAULT 1,
  assigned_teacher_id TEXT,
  teacher_answer TEXT,
  answered_at TIMESTAMPTZ,
  correlation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doubt_queue_status ON doubt_queue(status);
CREATE INDEX idx_doubt_queue_priority ON doubt_queue(priority);
CREATE INDEX idx_doubt_queue_student ON doubt_queue(student_id);
```
