# API & MCP Integration Guide for n8n Workflows

## Available APIs & Services

| Service | Purpose | Auth Method | n8n Node |
|---------|---------|-------------|----------|
| **Gemini AI** | AI text generation | API Key | HTTP Request |
| **Supabase** | Database + Auth | API Key | Supabase Node / HTTP |
| **Firebase FCM** | Push notifications | Service Account | HTTP Request |
| **SendGrid** | Email delivery | API Key | HTTP Request |
| **Twilio** | SMS | Account SID + Token | HTTP Request |
| **Razorpay** | Payments (India) | Key + Secret | HTTP Request |

---

## MCP Tools Available

```javascript
// n8n MCP Tools
mcp__n8n-mcp__search_workflows     // Search workflows
mcp__n8n-mcp__get_workflow_details // Get workflow details
mcp__n8n-mcp__execute_workflow     // Execute workflow via MCP
```

---

## 1. Gemini AI Integration

### HTTP Request Node Config
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "googlePalmApi",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"contents\": [{\"role\": \"user\", \"parts\": [{\"text\": \"{{ $json.prompt }}\"}]}],\n  \"generationConfig\": {\"temperature\": 0.8, \"maxOutputTokens\": 500}\n}",
  "options": {"timeout": 15000},
  "onError": "continueErrorOutput"
}
```

### Pattern: AI Call with Cost Tracking
```javascript
// After Gemini response
const PRICING = {
  model: 'gemini-2.5-flash',
  input_per_million: 0.15,
  output_per_million: 0.60
};

const usage = $json.usageMetadata || {};
const inputTokens = usage.promptTokenCount || 0;
const outputTokens = usage.candidatesTokenCount || 0;

const cost = {
  tokens: { input: inputTokens, output: outputTokens },
  cost_usd: ((inputTokens + outputTokens * 4) / 1000000) * 0.15
};

// Extract response
const message = $json.candidates?.[0]?.content?.parts?.[0]?.text || 'Fallback message';

return { message, _cost: cost };
```

---

## 2. Supabase Integration

### Option A: Supabase Node (Recommended)
```json
{
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "getAll",
    "tableId": "students",
    "filterByFormula": "student_id=eq.{{ $json.student_id }}"
  }
}
```

### Option B: HTTP Request
```json
{
  "method": "GET",
  "url": "={{ 'https://YOUR_PROJECT.supabase.co/rest/v1/students?student_id=eq.' + $json.student_id }}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": {
    "headers": {
      "apikey": "YOUR_ANON_KEY",
      "Authorization": "Bearer YOUR_ANON_KEY"
    }
  }
}
```

### Pattern: Supabase Insert with Logging
```javascript
// Prepare log entry for Supabase
const logEntry = {
  correlation_id: $json._trace.correlation_id,
  workflow_name: $workflow.name,
  execution_id: $execution.id,
  event_type: $json._log.event_type,
  level: $json._log.level,
  message: $json._log.message,
  payload: JSON.stringify($json),
  created_at: new Date().toISOString()
};

return logEntry;
```

---

## 3. Firebase FCM (Push Notifications)

### HTTP Request Node Config
```json
{
  "method": "POST",
  "url": "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "googleFirebaseCloudFirestore",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"message\": {\n    \"token\": \"{{ $json.fcm_token }}\",\n    \"notification\": {\n      \"title\": \"{{ $json.notification.title }}\",\n      \"body\": \"{{ $json.notification.body }}\"\n    },\n    \"data\": {\n      \"correlation_id\": \"{{ $json._trace.correlation_id }}\",\n      \"action\": \"{{ $json.action || 'open_app' }}\"\n    }\n  }\n}",
  "options": {"timeout": 10000},
  "onError": "continueErrorOutput"
}
```

### Pattern: Multi-Recipient FCM
```javascript
// Prepare FCM payloads for multiple recipients
const recipients = [
  { type: 'student', token: $json.student_fcm_token, name: $json.student_name },
  { type: 'parent', token: $json.parent_fcm_token, name: $json.parent_name },
  { type: 'teacher', token: $json.teacher_fcm_token, name: $json.teacher_name }
];

return recipients
  .filter(r => r.token) // Only valid tokens
  .map(r => ({
    fcm_token: r.token,
    recipient_type: r.type,
    recipient_name: r.name,
    notification: $json.notification,
    _trace: $json._trace
  }));
```

---

## 4. SendGrid (Email)

### HTTP Request Node Config
```json
{
  "method": "POST",
  "url": "https://api.sendgrid.com/v3/mail/send",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "sendGridApi",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"personalizations\": [{\"to\": [{\"email\": \"{{ $json.email }}\"}]}],\n  \"from\": {\"email\": \"noreply@manushicoaching.com\", \"name\": \"Manushi Coaching\"},\n  \"subject\": \"{{ $json.subject }}\",\n  \"content\": [{\"type\": \"text/html\", \"value\": \"{{ $json.html_body }}\"}]\n}",
  "options": {"timeout": 10000}
}
```

---

## 5. Twilio (SMS)

### HTTP Request Node Config
```json
{
  "method": "POST",
  "url": "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "twilioApi",
  "sendBody": true,
  "bodyContentType": "form-urlencoded",
  "bodyParameters": {
    "parameters": [
      {"name": "To", "value": "={{ $json.phone }}"},
      {"name": "From", "value": "+1234567890"},
      {"name": "Body", "value": "={{ $json.sms_message }}"}
    ]
  }
}
```

---

## 6. Razorpay (Payments)

### Create Payment Link
```json
{
  "method": "POST",
  "url": "https://api.razorpay.com/v1/payment_links",
  "authentication": "httpBasicAuth",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"amount\": {{ $json.amount * 100 }},\n  \"currency\": \"INR\",\n  \"description\": \"{{ $json.description }}\",\n  \"customer\": {\n    \"name\": \"{{ $json.customer_name }}\",\n    \"email\": \"{{ $json.email }}\",\n    \"contact\": \"{{ $json.phone }}\"\n  },\n  \"notify\": {\"sms\": true, \"email\": true},\n  \"callback_url\": \"https://yourapp.com/payment/callback\",\n  \"callback_method\": \"get\"\n}"
}
```

---

## Complete Workflow Pattern

### Multi-Channel Notification Flow

```
[Webhook]
    |
[Entry Config] - correlation_id, _trace
    |
[Validate Input] - schema validation
    |
[IF Valid?]
    |-- YES --> [Supabase: Get User Details]
    |               |
    |           [Gemini: Generate Message]
    |               |
    |           [Split: Prepare Channels]
    |               |
    |       +-------+-------+-------+
    |       |       |       |       |
    |     [FCM]  [Email] [SMS]  [Supabase: Log]
    |       |       |       |       |
    |       +-------+-------+-------+
    |               |
    |           [Merge Results]
    |               |
    |           [Respond Success]
    |
    |-- NO --> [Respond Error]
```

### Node: Split for Multi-Channel
```javascript
// Prepare payloads for each channel
const channels = [];
const config = $json;

// Push notification
if (config.fcm_token) {
  channels.push({
    channel: 'push',
    fcm_token: config.fcm_token,
    notification: config.notification,
    _trace: config._trace
  });
}

// Email
if (config.email) {
  channels.push({
    channel: 'email',
    email: config.email,
    subject: config.notification.title,
    html_body: config.notification.body,
    _trace: config._trace
  });
}

// SMS (high priority only)
if (config.phone && config.priority === 'high') {
  channels.push({
    channel: 'sms',
    phone: config.phone,
    sms_message: config.notification.body.substring(0, 160),
    _trace: config._trace
  });
}

return channels;
```

---

## MCP Execution Pattern

### Execute Workflow via MCP
```javascript
// From Claude Code or external system
mcp__n8n-mcp__execute_workflow({
  workflowId: "WORKFLOW_ID",
  inputs: {
    type: "webhook",
    webhookData: {
      method: "POST",
      body: {
        // Your payload
        student_id: "stu123",
        event_type: "test_completed",
        score: 85
      }
    }
  }
});
```

### Search & Execute Pattern
```javascript
// 1. Search for workflow
const workflows = await mcp__n8n-mcp__search_workflows({ query: "streak" });

// 2. Get details
const details = await mcp__n8n-mcp__get_workflow_details({
  workflowId: workflows.data[0].id
});

// 3. Execute
const result = await mcp__n8n-mcp__execute_workflow({
  workflowId: workflows.data[0].id,
  inputs: { type: "webhook", webhookData: { body: payload } }
});
```

---

## Credential Setup in n8n

| Service | Credential Type | Required Fields |
|---------|-----------------|-----------------|
| Gemini | Google PaLM API | API Key |
| Supabase | Supabase API | Host, API Key |
| Firebase | Google Firebase | Project ID, Service Account JSON |
| SendGrid | SendGrid API | API Key |
| Twilio | Twilio API | Account SID, Auth Token |
| Razorpay | HTTP Basic Auth | Key ID, Key Secret |

---

## Quick Reference: Response Structure

```json
{
  "success": true,
  "data": {
    // Business response
  },
  "_trace": {
    "correlation_id": "corr_xxx",
    "workflow_id": "xxx",
    "execution_id": "xxx",
    "started_at": "ISO timestamp",
    "completed_at": "ISO timestamp",
    "duration_ms": 245,
    "path": "success|fallback|error",
    "authenticated": true
  },
  "_cost": {
    "model": "gemini-2.5-flash",
    "tokens": { "input": 50, "output": 30 },
    "cost_usd": { "total": 0.00001 }
  },
  "_log": {
    "timestamp": "ISO timestamp",
    "level": "info",
    "message": "Operation description",
    "event_type": "notification_sent"
  }
}
```

---

## Required Supabase Tables

```sql
-- Automation Logs
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

-- Dead Letter Queue
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

-- Indexes
CREATE INDEX idx_logs_correlation ON automation_logs(correlation_id);
CREATE INDEX idx_logs_created ON automation_logs(created_at DESC);
CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
```

---

## v5 Enterprise Workflow

**File:** `ai_streak_v5_enterprise.json`

**Features:**
- Webhook authentication (X-API-KEY header)
- Input validation with sanitization
- Duplicate detection (5-min window)
- HTTP retry with exponential backoff
- Supabase logging
- Dead letter queue
- Slack failure alerts

**Test Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/streak-v5" `
  -Method POST -ContentType "application/json" `
  -Headers @{"X-API-KEY"="sk_test_manushi_2025"} `
  -Body '{"student_id":"stu123","student_name":"Rahul","current_streak":15}'
```
```
