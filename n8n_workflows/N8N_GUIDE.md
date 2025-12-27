# n8n Workflow Development Guide

Complete reference for building automation workflows in n8n for ManushiCoaching EdTech Platform.

---

## Table of Contents

### Core Reference
1. [Available Core Nodes](#available-core-nodes)
2. [Created Workflows](#created-workflows)

### Production Fundamentals (Phase 1)
3. [Production-Ready Checklist](#production-ready-checklist)
4. [Error Handling](#error-handling)
5. [Retry Logic & Backoff](#retry-logic--backoff)
6. [Fallback Strategies](#fallback-strategies)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Rate Limiting](#rate-limiting)
9. [Data Validation](#data-validation)
10. [Idempotency](#idempotency)
11. [Security](#security)
12. [Timeouts](#timeouts)

### Enterprise Production (Phase 2)
13. [Config & Environment Management](#config--environment-management)
14. [Release & Change Management](#release--change-management)
15. [Concurrency Control](#concurrency-control)
16. [Data Mapping Contracts](#data-mapping-contracts)
17. [Observability Beyond Logs](#observability-beyond-logs)
18. [Cost Controls](#cost-controls)
19. [Data Persistence & Replayability](#data-persistence--replayability)
20. [Compliance & Privacy](#compliance--privacy)
21. [Dependency Management](#dependency-management)
22. [UX for Operations](#ux-for-operations)
23. [Workflow Performance Engineering](#workflow-performance-engineering)
24. [Documentation Standards](#documentation-standards)

### Implementation Reference
25. [Workflow Enhancement Patterns](#workflow-enhancement-patterns)
26. [Reusable Sub-Workflows](#reusable-sub-workflows)
27. [Integration Credentials](#integration-credentials)
28. [Webhook Payload Formats](#webhook-payload-formats)
29. [Testing & Debugging](#testing--debugging)
30. [Database Tables Required](#database-tables-required)

---

## Available Core Nodes

### Trigger Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.webhook` | Trigger | Receive HTTP requests | App sends events to n8n |
| `n8n-nodes-base.scheduleTrigger` | Trigger | Cron-based execution | Daily reports, reminders |
| `n8n-nodes-base.errorTrigger` | Trigger | Catch workflow failures | Error handling workflows |
| `n8n-nodes-base.manualTrigger` | Trigger | Manual execution | Testing |
| `n8n-nodes-base.executeWorkflowTrigger` | Trigger | Called by other workflows | Sub-workflows |
| `n8n-nodes-base.formTrigger` | Trigger | Form submissions | User input forms |
| `n8n-nodes-base.chatTrigger` | Trigger | Chat interactions | AI chat workflows |

### Flow Control Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.if` | Logic | Binary condition (true/false) | Is absent? Is score < 40%? |
| `n8n-nodes-base.switch` | Logic | Multi-branch routing | Route by role, status, type |
| `n8n-nodes-base.merge` | Logic | Combine multiple branches | Collect parallel results |
| `n8n-nodes-base.splitOut` | Logic | Split array to individual items | Process each student |
| `n8n-nodes-base.splitInBatches` | Logic | Process in chunks | Bulk notifications |
| `n8n-nodes-base.filter` | Logic | Remove items not matching | Filter active users only |
| `n8n-nodes-base.limit` | Logic | Limit items processed | Rate limiting |

### Data Transformation Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.set` | Transform | Edit/add fields | Prepare notification payload |
| `n8n-nodes-base.renameKeys` | Transform | Rename object keys | API format conversion |
| `n8n-nodes-base.removeDuplicates` | Transform | Deduplicate items | Prevent duplicate alerts |
| `n8n-nodes-base.aggregate` | Transform | Summarize data | Calculate batch average |
| `n8n-nodes-base.sort` | Transform | Sort items | Priority ordering |
| `n8n-nodes-base.compareDatasets` | Transform | Compare two datasets | Find changes |

### Execution Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.code` | Execution | Custom JavaScript | Complex logic |
| `n8n-nodes-base.executeCommand` | Execution | Shell commands | System operations |
| `n8n-nodes-base.executeWorkflow` | Execution | Call another workflow | Reusable sub-workflows |
| `n8n-nodes-base.wait` | Execution | Pause execution | Delayed notifications |

### Error Handling Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.errorTrigger` | Error | Catch workflow errors | Error notification |
| `n8n-nodes-base.stopAndError` | Error | Force workflow failure | Validation failures |
| `n8n-nodes-base.noOp` | Utility | Do nothing | Placeholder, skip branch |

### HTTP & Communication Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.httpRequest` | HTTP | Make API calls | FCM, external APIs |
| `n8n-nodes-base.respondToWebhook` | HTTP | Send webhook response | Return status to app |
| `n8n-nodes-base.sendEmail` | Email | Send emails | Email notifications |
| `n8n-nodes-base.graphql` | HTTP | GraphQL queries | GraphQL APIs |

### Database Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.supabase` | Database | Supabase operations | Read/write app data |
| `n8n-nodes-base.postgres` | Database | PostgreSQL queries | Direct DB access |
| `n8n-nodes-base.redis` | Database | Redis operations | Caching, queues |

### Utility Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `n8n-nodes-base.dateTime` | Utility | Date/time operations | Time calculations |
| `n8n-nodes-base.crypto` | Utility | Cryptographic operations | Token generation |
| `n8n-nodes-base.jwt` | Utility | JWT handling | Auth tokens |
| `n8n-nodes-base.markdown` | Utility | Markdown processing | Format messages |
| `n8n-nodes-base.html` | Utility | HTML parsing | Parse web content |
| `n8n-nodes-base.xml` | Utility | XML processing | XML APIs |
| `n8n-nodes-base.compression` | Utility | Compress/decompress | File handling |

### AI Nodes

| Node | Type | Description | Use Case |
|------|------|-------------|----------|
| `@n8n/n8n-nodes-langchain.openAi` | AI | OpenAI API | AI responses |
| `@n8n/n8n-nodes-langchain.agent` | AI | AI Agent | Complex AI tasks |
| `n8n-nodes-base.aiTransform` | AI | AI data transformation | Smart formatting |

---

## Created Workflows

### Workflow 1: 360 Performance Loop

| Property | Value |
|----------|-------|
| **ID** | `BdvFtJyC6vsUk7ih` |
| **Status** | Inactive |
| **Webhook Path** | `/webhook/test-completed` |
| **Full URL** | `http://localhost:5678/webhook/test-completed` |

#### Flow Diagram
```
[Webhook: test-completed]
         |
         v
[Supabase: Get Test Result]
         |
         +---> [HTTP: Notify Student (FCM)]
         |
         +---> [HTTP: Notify Parent (FCM)]
         |
         +---> [HTTP: Notify Teacher (FCM)]
         |
         v
[Supabase: Log for Admin Dashboard]
         |
         v
[Respond: Success]
```

#### Expected Payload
```json
{
  "test_result_id": "uuid",
  "student_id": "uuid",
  "student_name": "Rahul Sharma",
  "student_fcm_token": "fcm_token_here",
  "parent_id": "uuid",
  "parent_fcm_token": "fcm_token_here",
  "teacher_id": "uuid",
  "teacher_fcm_token": "fcm_token_here",
  "test_name": "Physics Chapter 5",
  "score": 85,
  "batch_avg": 72
}
```

#### Nodes Used
| Node | Type | Purpose |
|------|------|---------|
| Test Completed Webhook | Webhook | Entry point |
| Get Test Result | Supabase | Fetch test details |
| Notify Student (FCM) | HTTP Request | Push to student |
| Notify Parent (FCM) | HTTP Request | Push to parent |
| Notify Teacher (FCM) | HTTP Request | Push to teacher |
| Log for Admin Dashboard | Supabase | Save for admin |
| Respond Success | Respond to Webhook | Return result |

---

### Workflow 2: Instant Attendance Alert

| Property | Value |
|----------|-------|
| **ID** | `DhyO1XDrCkBAkzD4` |
| **Status** | Inactive |
| **Webhook Path** | `/webhook/attendance-marked` |
| **Full URL** | `http://localhost:5678/webhook/attendance-marked` |

#### Flow Diagram
```
[Webhook: attendance-marked]
         |
         v
[If: Is Absent?]
    |         |
   Yes        No
    |         |
    v         v
[HTTP: Notify Parent]  [Respond: Present]
    |
    v
[Supabase: Save Notification]
    |
    v
[Respond: Absent]
```

#### Expected Payload
```json
{
  "student_id": "uuid",
  "student_name": "Rahul Sharma",
  "parent_id": "uuid",
  "parent_fcm_token": "fcm_token_here",
  "class_id": "uuid",
  "class_name": "Physics - Batch A",
  "status": "absent",
  "marked_at": "2024-12-25T10:00:00Z",
  "marked_by": "teacher_uuid"
}
```

#### Nodes Used
| Node | Type | Purpose |
|------|------|---------|
| Attendance Webhook | Webhook | Entry point |
| Is Absent? | If | Check status |
| Notify Parent (Push) | HTTP Request | Send FCM |
| Save to Notifications | Supabase | Log notification |
| Respond Absent | Respond to Webhook | Return for absent |
| Respond Present | Respond to Webhook | Return for present |

---

## Production-Ready Checklist

Before deploying any workflow to production, ensure you have addressed all items:

### Pre-Deployment Checklist

| Category | Item | Status | Priority |
|----------|------|--------|----------|
| **Error Handling** | Global error workflow configured | Required | P0 |
| **Error Handling** | All nodes have onError handling | Required | P0 |
| **Error Handling** | Dead letter queue for failed items | Recommended | P1 |
| **Retry Logic** | HTTP requests have retry enabled | Required | P0 |
| **Retry Logic** | Exponential backoff configured | Recommended | P1 |
| **Fallbacks** | Alternative notification channels | Recommended | P1 |
| **Fallbacks** | Default values for missing data | Required | P0 |
| **Monitoring** | Execution logging to database | Required | P0 |
| **Monitoring** | Failure alerting configured | Required | P0 |
| **Rate Limiting** | Batch processing with delays | Recommended | P1 |
| **Validation** | Input schema validation | Required | P0 |
| **Validation** | Type checking on all fields | Required | P0 |
| **Idempotency** | Unique request IDs | Required | P0 |
| **Idempotency** | Duplicate detection | Recommended | P1 |
| **Security** | Webhook authentication | Required | P0 |
| **Security** | Input sanitization | Required | P0 |
| **Timeouts** | Per-node timeouts set | Required | P0 |
| **Testing** | Test mode available | Recommended | P1 |

---

## Error Handling

### 1. Global Error Workflow

Create a dedicated error handler workflow that catches all failures:

```json
{
  "name": "Global Error Handler",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [240, 300]
    },
    {
      "name": "Extract Error Details",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const error = $input.first().json;\n\nreturn {\n  workflow_id: error.workflow?.id,\n  workflow_name: error.workflow?.name,\n  execution_id: error.execution?.id,\n  error_message: error.execution?.error?.message,\n  error_stack: error.execution?.error?.stack,\n  node_name: error.execution?.lastNodeExecuted,\n  failed_at: new Date().toISOString(),\n  severity: determineSeverity(error),\n  input_data: JSON.stringify(error.execution?.data?.resultData?.runData || {})\n};\n\nfunction determineSeverity(error) {\n  const criticalWorkflows = ['360 Performance Loop', 'Payment Processing'];\n  if (criticalWorkflows.includes(error.workflow?.name)) return 'critical';\n  return 'warning';\n}"
      },
      "position": [460, 300]
    },
    {
      "name": "Save to Error Log",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "tableId": "automation_errors"
      },
      "position": [680, 300]
    },
    {
      "name": "Is Critical?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "conditions": [{
            "leftValue": "={{ $json.severity }}",
            "rightValue": "critical",
            "operator": { "operation": "equals" }
          }]
        }
      },
      "position": [900, 300]
    },
    {
      "name": "Alert Admin",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "FCM_OR_SLACK_WEBHOOK_URL"
      },
      "position": [1120, 200]
    }
  ]
}
```

### 2. Node-Level Error Handling

Configure `onError` for each node:

| onError Value | Behavior | Use Case |
|---------------|----------|----------|
| `stopWorkflow` | Stops entire workflow | Critical operations |
| `continueRegularOutput` | Continues to next node | Non-critical logging |
| `continueErrorOutput` | Routes to error branch | Graceful degradation |

**Example: Graceful FCM Failure**
```json
{
  "name": "Send FCM",
  "type": "n8n-nodes-base.httpRequest",
  "onError": "continueErrorOutput",
  "position": [500, 300]
}
```

### 3. Try-Catch in Code Nodes

```javascript
// Wrap risky operations in try-catch
try {
  const response = await someRiskyOperation();
  return {
    success: true,
    data: response
  };
} catch (error) {
  return {
    success: false,
    error: error.message,
    fallback: true,
    timestamp: new Date().toISOString()
  };
}
```

### 4. Dead Letter Queue Pattern

For failed items that need manual review:

```
[Main Process]
      |
  [On Error]
      |
      v
[Save to Dead Letter Queue (Supabase)]
      |
      v
[Schedule Retry] --> [Retry Workflow]
```

**Dead Letter Table Schema:**
```sql
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  failed_node TEXT,
  input_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending', -- pending, retrying, failed, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ
);
```

---

## Retry Logic & Backoff

### 1. Built-in Retry Configuration

```json
{
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

### 2. Exponential Backoff Pattern

```javascript
// Code node for exponential backoff
const retryCount = $json.retryCount || 0;
const maxRetries = 5;
const baseDelay = 1000; // 1 second

if (retryCount >= maxRetries) {
  return {
    ...$json,
    shouldRetry: false,
    status: 'max_retries_exceeded'
  };
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s
const delay = baseDelay * Math.pow(2, retryCount);

// Add jitter to prevent thundering herd
const jitter = Math.random() * 1000;
const totalDelay = delay + jitter;

return {
  ...$json,
  retryCount: retryCount + 1,
  shouldRetry: true,
  delayMs: totalDelay,
  nextRetryAt: new Date(Date.now() + totalDelay).toISOString()
};
```

### 3. Retry Flow Diagram

```
[Initial Request]
      |
      v
[HTTP Request] --[Success]--> [Continue]
      |
   [Failure]
      |
      v
[Calculate Backoff]
      |
      v
[Wait Node: Dynamic Delay]
      |
      v
[Retry Count < Max?]
    |        |
   Yes       No
    |        |
    v        v
[Retry]   [Dead Letter Queue]
```

### 4. Circuit Breaker Pattern

Prevent cascading failures when external service is down:

```javascript
// Check circuit breaker state
const circuitKey = 'fcm_circuit';
const failureThreshold = 5;
const resetTimeMs = 60000; // 1 minute

// Get from Redis or in-memory cache
const circuitState = await getCircuitState(circuitKey);

if (circuitState.isOpen) {
  const timeSinceOpen = Date.now() - circuitState.openedAt;

  if (timeSinceOpen < resetTimeMs) {
    // Circuit is open - skip request
    return {
      status: 'circuit_open',
      message: 'Service temporarily unavailable',
      retryAfter: resetTimeMs - timeSinceOpen
    };
  } else {
    // Try half-open state
    circuitState.isHalfOpen = true;
  }
}

// Proceed with request
return { proceed: true, circuitState };
```

---

## Fallback Strategies

### 1. Notification Channel Fallback

```
[Send FCM Push]
      |
   [Failed?]
      |
     Yes
      |
      v
[Has Email?] --Yes--> [Send Email]
      |
      No
      |
      v
[Has Phone?] --Yes--> [Send SMS (Critical Only)]
      |
      No
      |
      v
[Save to In-App Notifications]
```

**Code Implementation:**
```javascript
const channels = [
  { type: 'push', token: $json.fcm_token, priority: 1 },
  { type: 'email', address: $json.email, priority: 2 },
  { type: 'sms', phone: $json.phone, priority: 3, criticalOnly: true },
  { type: 'in_app', userId: $json.user_id, priority: 4, alwaysAvailable: true }
];

// Filter available channels
const availableChannels = channels.filter(ch => {
  if (ch.type === 'push') return !!ch.token;
  if (ch.type === 'email') return !!ch.address;
  if (ch.type === 'sms') return !!ch.phone && $json.isCritical;
  if (ch.type === 'in_app') return true;
  return false;
});

return {
  ...$json,
  channels: availableChannels,
  primaryChannel: availableChannels[0]
};
```

### 2. API Fallback

```javascript
// Try primary API, fallback to secondary
const primaryUrl = 'https://api.primary.com/endpoint';
const fallbackUrl = 'https://api.fallback.com/endpoint';

async function tryWithFallback(data) {
  try {
    return await callApi(primaryUrl, data);
  } catch (primaryError) {
    console.log('Primary failed, trying fallback');
    try {
      return await callApi(fallbackUrl, data);
    } catch (fallbackError) {
      throw new Error(`Both APIs failed: ${primaryError.message}, ${fallbackError.message}`);
    }
  }
}
```

### 3. Default Values Pattern

```javascript
// Ensure all required fields have defaults
const defaults = {
  score: 0,
  batch_avg: 0,
  student_name: 'Student',
  notification_priority: 'normal',
  retry_count: 0
};

const data = { ...defaults, ...$json };

// Validate after defaults applied
if (!data.student_id) {
  throw new Error('student_id is required and has no default');
}

return data;
```

### 4. Cached Response Fallback

```javascript
// Use cached data when live fetch fails
const cacheKey = `student_${$json.student_id}`;
const cacheTTL = 300000; // 5 minutes

try {
  const liveData = await fetchFromDatabase($json.student_id);
  // Update cache
  await setCache(cacheKey, liveData, cacheTTL);
  return liveData;
} catch (error) {
  // Try cache
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      _fromCache: true,
      _cacheAge: Date.now() - cachedData._cachedAt
    };
  }
  throw error; // No cache available
}
```

---

## Monitoring & Alerting

### 1. Execution Logging Table

```sql
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  notification_id TEXT,
  event_type TEXT,
  status TEXT, -- processing, completed, partial, failed
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX idx_automation_logs_status ON automation_logs(status);
CREATE INDEX idx_automation_logs_workflow ON automation_logs(workflow_name, created_at DESC);
```

### 2. Log at Start and End

```
[Webhook]
    |
    v
[Log: status='processing'] <-- START
    |
    v
[... Main Workflow ...]
    |
    v
[Log: status='completed/failed'] <-- END
    |
    v
[Respond]
```

### 3. Failure Alerting Workflow

Create a scheduled workflow to check for failures:

```json
{
  "name": "Failure Monitor",
  "nodes": [
    {
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 5 }] }
      }
    },
    {
      "name": "Check Recent Failures",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "select",
        "tableId": "automation_logs",
        "filterString": "status=eq.failed&created_at=gte.{{ new Date(Date.now() - 300000).toISOString() }}"
      }
    },
    {
      "name": "Has Failures?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "conditions": [{
            "leftValue": "={{ $json.length }}",
            "rightValue": 0,
            "operator": { "operation": "larger" }
          }]
        }
      }
    },
    {
      "name": "Alert Admin",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "SLACK_OR_FCM_WEBHOOK",
        "body": {
          "text": "{{ $json.length }} workflow failures in last 5 minutes"
        }
      }
    }
  ]
}
```

### 4. Metrics Dashboard Query

```sql
-- Execution summary for admin dashboard
SELECT
  workflow_name,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'partial') as partial,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
FROM automation_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY workflow_name, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

### 5. Health Check Endpoint

Create a workflow that serves as health check:

```json
{
  "name": "Health Check",
  "nodes": [
    {
      "name": "Health Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "health",
        "httpMethod": "GET",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Check Supabase",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "select",
        "tableId": "automation_logs",
        "limit": 1
      },
      "onError": "continueErrorOutput"
    },
    {
      "name": "Build Response",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const supabaseOk = !$json.error;\n\nreturn {\n  status: supabaseOk ? 'healthy' : 'degraded',\n  timestamp: new Date().toISOString(),\n  checks: {\n    supabase: supabaseOk ? 'ok' : 'error'\n  }\n};"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      }
    }
  ]
}
```

---

## Rate Limiting

### 1. Batch Processing with Delays

```
[Get All Students: 1000 records]
         |
         v
[Split In Batches: 50 items]
         |
         v
[Process Batch] --> [Wait: 1 second] --> [Next Batch]
```

**Configuration:**
```json
{
  "name": "Split In Batches",
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 50,
    "options": {}
  }
}
```

### 2. API Quota Management

```javascript
// Track API usage
const quotaKey = 'fcm_daily_quota';
const dailyLimit = 10000;

const currentUsage = await getQuotaUsage(quotaKey);

if (currentUsage >= dailyLimit) {
  return {
    status: 'quota_exceeded',
    message: 'Daily FCM quota exceeded',
    resetAt: getNextMidnight()
  };
}

// Increment usage
await incrementQuota(quotaKey);

return { proceed: true, remainingQuota: dailyLimit - currentUsage - 1 };
```

### 3. Throttling for Burst Protection

```javascript
// Limit to 100 requests per minute
const windowMs = 60000; // 1 minute
const maxRequests = 100;
const throttleKey = 'fcm_throttle';

const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
const requestCount = await getRequestCount(throttleKey, windowStart);

if (requestCount >= maxRequests) {
  const waitTime = windowStart + windowMs - Date.now();
  return {
    status: 'throttled',
    retryAfter: waitTime,
    message: `Rate limit exceeded. Retry in ${Math.ceil(waitTime/1000)}s`
  };
}

await incrementRequestCount(throttleKey, windowStart);
return { proceed: true };
```

### 4. Priority Queue Pattern

```javascript
// Prioritize critical notifications
const priorities = {
  payment_failed: 1,      // Highest
  attendance_absent: 2,
  test_result: 3,
  reminder: 4,
  marketing: 5            // Lowest
};

const items = $input.all().map(item => ({
  ...item.json,
  priority: priorities[item.json.type] || 3
}));

// Sort by priority (lower number = higher priority)
items.sort((a, b) => a.priority - b.priority);

return items;
```

---

## Data Validation

### 1. JSON Schema Validation

```javascript
// Validate input against schema
const schema = {
  type: 'object',
  required: ['student_id', 'test_name', 'score'],
  properties: {
    student_id: { type: 'string', format: 'uuid' },
    student_name: { type: 'string', minLength: 1, maxLength: 100 },
    test_name: { type: 'string', minLength: 1 },
    score: { type: 'number', minimum: 0, maximum: 100 },
    batch_avg: { type: 'number', minimum: 0, maximum: 100 }
  }
};

function validate(data, schema) {
  const errors = [];

  // Check required fields
  for (const field of schema.required || []) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check types
  for (const [field, rules] of Object.entries(schema.properties || {})) {
    if (data[field] !== undefined) {
      if (rules.type === 'string' && typeof data[field] !== 'string') {
        errors.push(`${field} must be a string`);
      }
      if (rules.type === 'number' && typeof data[field] !== 'number') {
        errors.push(`${field} must be a number`);
      }
      if (rules.minimum !== undefined && data[field] < rules.minimum) {
        errors.push(`${field} must be >= ${rules.minimum}`);
      }
      if (rules.maximum !== undefined && data[field] > rules.maximum) {
        errors.push(`${field} must be <= ${rules.maximum}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

const result = validate($json, schema);
if (!result.valid) {
  throw new Error(`Validation failed: ${result.errors.join(', ')}`);
}

return $json;
```

### 2. Type Coercion & Sanitization

```javascript
// Sanitize and coerce types
function sanitize(data) {
  return {
    student_id: String(data.student_id || '').trim(),
    student_name: String(data.student_name || '').trim().substring(0, 100),
    score: Number(data.score) || 0,
    test_name: String(data.test_name || '').trim(),
    // Ensure score is within bounds
    score: Math.max(0, Math.min(100, Number(data.score) || 0)),
    // Sanitize HTML/script injection
    message: escapeHtml(data.message || '')
  };
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

return sanitize($json);
```

### 3. Size Limits

```javascript
// Enforce payload size limits
const MAX_PAYLOAD_SIZE = 1024 * 100; // 100KB
const MAX_ARRAY_LENGTH = 1000;

const payloadSize = JSON.stringify($json).length;

if (payloadSize > MAX_PAYLOAD_SIZE) {
  throw new Error(`Payload too large: ${payloadSize} bytes (max: ${MAX_PAYLOAD_SIZE})`);
}

if (Array.isArray($json.items) && $json.items.length > MAX_ARRAY_LENGTH) {
  throw new Error(`Too many items: ${$json.items.length} (max: ${MAX_ARRAY_LENGTH})`);
}

return $json;
```

---

## Idempotency

### 1. Unique Request IDs

```javascript
// Generate idempotency key at entry point
const idempotencyKey = $json.idempotency_key ||
  `${$json.event_type}_${$json.student_id}_${Date.now()}`;

return {
  ...$json,
  idempotency_key: idempotencyKey,
  request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};
```

### 2. Duplicate Detection

```
[Webhook]
    |
    v
[Generate Idempotency Key]
    |
    v
[Check: Already Processed?] --Yes--> [Return Cached Response]
    |
    No
    |
    v
[Process Request]
    |
    v
[Save to Processed Cache]
    |
    v
[Respond]
```

**Implementation:**
```javascript
// Check if request was already processed
const idempotencyKey = $json.idempotency_key;
const cacheTable = 'idempotency_cache';
const cacheTTL = 24 * 60 * 60; // 24 hours

// Check cache
const existing = await supabase
  .from(cacheTable)
  .select('response')
  .eq('key', idempotencyKey)
  .single();

if (existing.data) {
  return {
    status: 'duplicate',
    cached_response: existing.data.response,
    original_processed_at: existing.data.created_at
  };
}

return { status: 'new', proceed: true };
```

### 3. Idempotency Cache Table

```sql
CREATE TABLE idempotency_cache (
  key TEXT PRIMARY KEY,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Auto-cleanup expired entries
CREATE INDEX idx_idempotency_expires ON idempotency_cache(expires_at);
```

---

## Security

### 1. Webhook Authentication (HMAC Signature)

```javascript
// Verify webhook signature
const crypto = require('crypto');

const SECRET = process.env.WEBHOOK_SECRET;
const signature = $request.headers['x-signature'];
const payload = JSON.stringify($json);

const expectedSignature = crypto
  .createHmac('sha256', SECRET)
  .update(payload)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid webhook signature');
}

return $json;
```

### 2. App-Side Signature Generation

```typescript
// React Native - Generate signature before calling webhook
import CryptoJS from 'crypto-js';

const WEBHOOK_SECRET = Config.WEBHOOK_SECRET;

function callWebhook(endpoint: string, payload: object) {
  const payloadString = JSON.stringify(payload);
  const signature = CryptoJS.HmacSHA256(payloadString, WEBHOOK_SECRET).toString();

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': `sha256=${signature}`,
      'X-Timestamp': Date.now().toString()
    },
    body: payloadString
  });
}
```

### 3. IP Whitelisting

```javascript
// Allow only known IPs
const allowedIPs = [
  '10.0.0.0/8',      // Internal network
  '192.168.1.0/24',  // Office network
  // Add your app server IPs
];

const clientIP = $request.headers['x-forwarded-for'] || $request.ip;

function isIPAllowed(ip, allowList) {
  // Simple check - in production use proper CIDR matching
  return allowList.some(allowed => {
    if (allowed.includes('/')) {
      // CIDR notation - implement proper matching
      return ip.startsWith(allowed.split('/')[0].split('.').slice(0, 3).join('.'));
    }
    return ip === allowed;
  });
}

if (!isIPAllowed(clientIP, allowedIPs)) {
  throw new Error(`Access denied from IP: ${clientIP}`);
}

return $json;
```

### 4. Input Sanitization (Prevent Injection)

```javascript
// Sanitize all string inputs
function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    // Remove potential SQL injection
    return obj
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names too
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      sanitized[safeKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return obj;
}

return sanitizeInput($json);
```

### 5. Credential Security

| Practice | Implementation |
|----------|----------------|
| Never hardcode secrets | Use n8n credentials store |
| Rotate API keys regularly | Set calendar reminders |
| Use least privilege | Create separate keys per workflow |
| Audit credential access | Log credential usage |
| Encrypt at rest | n8n encrypts credentials automatically |

---

## Timeouts

### 1. Per-Node Timeout Configuration

```json
{
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "options": {
      "timeout": 10000
    }
  }
}
```

### 2. Recommended Timeouts

| Operation | Timeout | Reason |
|-----------|---------|--------|
| FCM Push | 10s | Fast API |
| Email Send | 30s | May queue |
| Database Query | 15s | Normal queries |
| External API | 30s | Variable latency |
| File Upload | 60s | Large payloads |
| Report Generation | 120s | Complex processing |

### 3. Overall Workflow Timeout

```json
{
  "settings": {
    "executionTimeout": 180,
    "timezone": "Asia/Kolkata"
  }
}
```

### 4. Graceful Timeout Handling

```javascript
// Wrap operations with timeout
async function withTimeout(promise, timeoutMs, operationName) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage
try {
  const result = await withTimeout(
    fetchData(),
    10000,
    'Database fetch'
  );
  return { success: true, data: result };
} catch (error) {
  if (error.message.includes('timed out')) {
    return {
      success: false,
      error: 'timeout',
      fallback: true
    };
  }
  throw error;
}
```

---

## Config & Environment Management

### 1. Environment Separation

```
environments/
  dev.json       # Development settings
  staging.json   # Staging settings
  prod.json      # Production settings
```

**Environment Config Node:**
```javascript
// Code node at start of every workflow
const ENV = process.env.N8N_ENVIRONMENT || 'dev';

const configs = {
  dev: {
    supabase_url: 'https://dev-xxx.supabase.co',
    fcm_project: 'manushi-dev',
    log_level: 'debug',
    retry_enabled: false,
    mock_notifications: true
  },
  staging: {
    supabase_url: 'https://staging-xxx.supabase.co',
    fcm_project: 'manushi-staging',
    log_level: 'info',
    retry_enabled: true,
    mock_notifications: false
  },
  prod: {
    supabase_url: 'https://prod-xxx.supabase.co',
    fcm_project: 'manushi-prod',
    log_level: 'warn',
    retry_enabled: true,
    mock_notifications: false
  }
};

return {
  ...$json,
  _env: ENV,
  _config: configs[ENV]
};
```

### 2. Feature Flags

```javascript
// Feature flags for gradual rollout
const featureFlags = {
  new_notification_format: {
    enabled: true,
    rollout_percentage: 50, // 50% of users
    whitelist: ['user_123', 'user_456'] // Always enabled for these
  },
  sms_fallback: {
    enabled: false, // Disabled in current release
    rollout_percentage: 0
  },
  ai_summary: {
    enabled: true,
    rollout_percentage: 10 // Testing with 10%
  }
};

function isFeatureEnabled(feature, userId) {
  const flag = featureFlags[feature];
  if (!flag || !flag.enabled) return false;
  if (flag.whitelist?.includes(userId)) return true;

  // Consistent rollout based on user ID hash
  const hash = hashCode(userId) % 100;
  return hash < flag.rollout_percentage;
}

return {
  ...$json,
  features: {
    new_notification_format: isFeatureEnabled('new_notification_format', $json.user_id),
    sms_fallback: isFeatureEnabled('sms_fallback', $json.user_id),
    ai_summary: isFeatureEnabled('ai_summary', $json.user_id)
  }
};
```

### 3. Secrets Rotation Handling

```javascript
// Handle secret rotation gracefully
async function callWithSecretRotation(apiCall, secretKey) {
  try {
    return await apiCall(getSecret(secretKey));
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
      // Try refreshed secret
      refreshSecret(secretKey);
      try {
        return await apiCall(getSecret(secretKey));
      } catch (retryError) {
        // Both failed - alert ops team
        await alertSecretRotationFailure(secretKey, retryError);
        throw retryError;
      }
    }
    throw error;
  }
}
```

### 4. Multi-Tenant Config (Future)

```javascript
// Per-tenant configuration
const tenantConfigs = {
  'tenant_abc': {
    name: 'ABC Coaching',
    fcm_project: 'abc-coaching-prod',
    notification_branding: {
      title_prefix: '[ABC]',
      icon_url: 'https://abc.com/icon.png'
    },
    features: {
      sms_enabled: true,
      whatsapp_enabled: false
    }
  },
  'tenant_xyz': {
    name: 'XYZ Academy',
    fcm_project: 'xyz-academy-prod',
    notification_branding: {
      title_prefix: '[XYZ]',
      icon_url: 'https://xyz.com/icon.png'
    },
    features: {
      sms_enabled: false,
      whatsapp_enabled: true
    }
  }
};

const tenantId = $json.tenant_id || 'default';
const config = tenantConfigs[tenantId] || tenantConfigs['default'];

return { ...$json, _tenant: config };
```

---

## Release & Change Management

### 1. Workflow Versioning

**Version Naming Convention:**
```
{workflow_name}_v{major}.{minor}.{patch}

Examples:
- 360_performance_loop_v1.0.0  (Initial release)
- 360_performance_loop_v1.1.0  (New feature: batch comparison)
- 360_performance_loop_v1.1.1  (Bug fix: score validation)
- 360_performance_loop_v2.0.0  (Breaking change: new payload format)
```

**Version in Workflow Settings:**
```json
{
  "name": "360 Performance Loop",
  "settings": {
    "executionOrder": "v1"
  },
  "meta": {
    "version": "1.2.0",
    "changelog": [
      "1.2.0 - Added retry logic for FCM",
      "1.1.0 - Added parent notification with batch average",
      "1.0.0 - Initial release"
    ],
    "last_modified_by": "developer@manushi.com",
    "last_modified_at": "2024-12-25"
  }
}
```

### 2. Promotion Flow

```
[DEV] --> [STAGING] --> [PROD]
  |           |           |
  v           v           v
Auto-deploy  Manual     Manual + Approval
             Review     Required
```

**Promotion Checklist:**
```markdown
## DEV -> STAGING Promotion
- [ ] All unit tests pass
- [ ] Manual testing completed
- [ ] No hardcoded dev values
- [ ] Logs reviewed for errors

## STAGING -> PROD Promotion
- [ ] Staging ran for 24+ hours without errors
- [ ] Performance benchmarks acceptable
- [ ] Rollback plan documented
- [ ] On-call team notified
- [ ] Approval from: _____________
```

### 3. Rollback Strategy

```javascript
// Workflow selector based on version
const WORKFLOW_VERSIONS = {
  '360_performance_loop': {
    current: 'NUUO1egUyhrSDkGP',     // v1.2.0
    previous: 'JcDKohlA3fLpOX6p',    // v1.1.0
    rollback_enabled: true
  }
};

// Emergency rollback trigger
async function rollback(workflowName) {
  const versions = WORKFLOW_VERSIONS[workflowName];
  if (!versions.rollback_enabled) {
    throw new Error('Rollback not enabled for this workflow');
  }

  // Deactivate current
  await deactivateWorkflow(versions.current);

  // Activate previous
  await activateWorkflow(versions.previous);

  // Log rollback
  await logRollback(workflowName, versions.current, versions.previous);

  // Alert team
  await alertRollback(workflowName);
}
```

### 4. Breaking Change Policy

```markdown
## Breaking Change Guidelines

### What Constitutes a Breaking Change:
1. Removing or renaming a required field in webhook payload
2. Changing response format/structure
3. Changing error codes
4. Removing an endpoint

### Breaking Change Process:
1. Announce 2 weeks before deployment
2. Provide migration guide
3. Support old format for 30 days (deprecation period)
4. Add `X-API-Version` header support
5. Log usage of deprecated format

### Payload Versioning:
```json
{
  "version": "2",  // Payload version
  "data": { ... }
}
```

**Version Handling:**
```javascript
const payloadVersion = $json.version || '1';

if (payloadVersion === '1') {
  // Transform v1 to v2 format (backward compatibility)
  return transformV1ToV2($json);
} else if (payloadVersion === '2') {
  return $json;
} else {
  throw new Error(`Unsupported payload version: ${payloadVersion}`);
}
```

---

## Concurrency Control

### 1. Parallelism Limits

```javascript
// Limit concurrent API calls
const MAX_CONCURRENT = 10;
const BATCH_DELAY_MS = 100;

const items = $input.all();
const batches = [];

for (let i = 0; i < items.length; i += MAX_CONCURRENT) {
  batches.push(items.slice(i, i + MAX_CONCURRENT));
}

// Process each batch with delay
const results = [];
for (const batch of batches) {
  const batchResults = await Promise.all(
    batch.map(item => processItem(item))
  );
  results.push(...batchResults);

  // Rate limiting delay between batches
  await sleep(BATCH_DELAY_MS);
}

return results;
```

### 2. Mutual Exclusion (User-Level Locking)

```javascript
// Prevent concurrent processing for same user
const lockTable = 'processing_locks';
const lockKey = `user_${$json.user_id}_notification`;
const lockTTL = 60; // seconds

// Try to acquire lock
const lockAcquired = await acquireLock(lockKey, lockTTL);

if (!lockAcquired) {
  return {
    status: 'skipped',
    reason: 'concurrent_processing',
    message: 'Another notification is being processed for this user'
  };
}

try {
  // Process notification
  const result = await processNotification($json);
  return result;
} finally {
  // Always release lock
  await releaseLock(lockKey);
}
```

**Lock Table Schema:**
```sql
CREATE TABLE processing_locks (
  lock_key TEXT PRIMARY KEY,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  owner TEXT -- workflow execution ID
);

-- Auto-cleanup expired locks
CREATE INDEX idx_locks_expires ON processing_locks(expires_at);
```

### 3. Queue Worker Deduplication

```javascript
// Ensure job processed only once
const jobId = $json.job_id;
const jobTable = 'job_processing';

// Check if already processed
const existing = await supabase
  .from(jobTable)
  .select('status')
  .eq('job_id', jobId)
  .single();

if (existing.data) {
  if (existing.data.status === 'completed') {
    return { status: 'duplicate', message: 'Job already processed' };
  }
  if (existing.data.status === 'processing') {
    return { status: 'in_progress', message: 'Job currently being processed' };
  }
}

// Mark as processing
await supabase.from(jobTable).upsert({
  job_id: jobId,
  status: 'processing',
  started_at: new Date().toISOString()
});

// Process job...
```

### 4. Database Connection Pooling

```javascript
// Avoid overwhelming database with connections
const DB_POOL_SIZE = 20;
const QUERY_TIMEOUT_MS = 15000;

// Use connection pool (configured at n8n level)
// In workflow, batch database operations:

const items = $input.all();
const BATCH_SIZE = 100;

// Batch inserts instead of individual
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await supabase.from('notifications').insert(batch);
}
```

---

## Data Mapping Contracts

### 1. Canonical Internal Schema

```javascript
// Define canonical schema once, use everywhere
const CANONICAL_NOTIFICATION = {
  // Required fields
  notification_id: { type: 'string', required: true },
  recipient_id: { type: 'string', required: true },
  recipient_type: { type: 'enum', values: ['student', 'parent', 'teacher', 'admin'], required: true },

  // Content
  title: { type: 'string', required: true, maxLength: 100 },
  body: { type: 'string', required: true, maxLength: 500 },

  // Delivery
  channel: { type: 'enum', values: ['push', 'email', 'sms', 'in_app'], required: true },
  priority: { type: 'enum', values: ['low', 'normal', 'high', 'critical'], default: 'normal' },

  // Metadata
  event_type: { type: 'string', required: true },
  source_workflow: { type: 'string', required: true },
  created_at: { type: 'datetime', required: true },

  // Optional
  fcm_token: { type: 'string', required: false },
  email: { type: 'string', required: false },
  phone: { type: 'string', required: false },
  data: { type: 'object', required: false },

  // Tracking
  correlation_id: { type: 'string', required: true },
  attempt: { type: 'number', default: 1 }
};
```

### 2. Input Normalization Node

```javascript
// Single normalization point - use at workflow entry
function normalizeTestCompletedPayload(raw) {
  return {
    // Map external field names to internal canonical names
    notification_id: raw.notification_id || generateId(),
    correlation_id: raw.correlation_id || raw.request_id || generateCorrelationId(),

    // Normalize recipient data
    recipients: [
      {
        recipient_id: raw.student_id,
        recipient_type: 'student',
        fcm_token: raw.student_fcm_token,
        name: raw.student_name
      },
      {
        recipient_id: raw.parent_id,
        recipient_type: 'parent',
        fcm_token: raw.parent_fcm_token,
        name: raw.parent_name
      },
      {
        recipient_id: raw.teacher_id,
        recipient_type: 'teacher',
        fcm_token: raw.teacher_fcm_token,
        name: raw.teacher_name
      }
    ],

    // Normalize event data
    event: {
      type: 'test_completed',
      test_id: raw.test_id || raw.test_result_id,
      test_name: raw.test_name,
      score: Number(raw.score) || 0,
      max_score: Number(raw.max_score) || 100,
      batch_avg: Number(raw.batch_avg) || 0
    },

    // Metadata
    source_workflow: '360 Performance Loop',
    created_at: new Date().toISOString(),
    priority: determineProirity(raw.score)
  };
}

function determineProirity(score) {
  if (score < 40) return 'high';    // Alert for low scores
  if (score >= 90) return 'high';   // Celebrate high scores
  return 'normal';
}

return normalizeTestCompletedPayload($json);
```

### 3. Schema Evolution & Versioning

```javascript
// Support multiple payload versions
const PAYLOAD_TRANSFORMERS = {
  '1': (data) => ({
    // v1 format (legacy)
    notification_id: data.id,
    recipient_id: data.user,
    title: data.msg_title,
    body: data.msg_body
  }),

  '2': (data) => ({
    // v2 format (current)
    notification_id: data.notification_id,
    recipient_id: data.recipient.id,
    title: data.content.title,
    body: data.content.body
  }),

  '3': (data) => ({
    // v3 format (upcoming)
    ...data // Already in canonical format
  })
};

const version = $json._version || '2';
const transformer = PAYLOAD_TRANSFORMERS[version];

if (!transformer) {
  throw new Error(`Unsupported payload version: ${version}`);
}

return transformer($json);
```

### 4. Field Contract Documentation

```markdown
## Notification Payload Contract

### Required Fields (will fail if missing):
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| recipient_id | UUID | User receiving notification | "abc-123" |
| recipient_type | Enum | Role of recipient | "student" |
| title | String(100) | Notification title | "Test Result" |
| body | String(500) | Notification body | "You scored 85%" |

### Optional Fields (will use defaults):
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| priority | Enum | "normal" | low/normal/high/critical |
| channel | Enum | "push" | Delivery channel |
| data | Object | {} | Custom payload data |

### Deprecated Fields (will be removed in v3):
| Field | Replacement | Removal Date |
|-------|-------------|--------------|
| user_id | recipient_id | 2025-03-01 |
| message | body | 2025-03-01 |
```

---

## Observability Beyond Logs

### 1. Correlation ID Propagation

```javascript
// Generate or extract correlation ID at entry point
const correlationId =
  $json.correlation_id ||
  $request?.headers?.['x-correlation-id'] ||
  `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Attach to all items flowing through workflow
return {
  ...$json,
  _trace: {
    correlation_id: correlationId,
    workflow_id: $workflow.id,
    workflow_name: $workflow.name,
    execution_id: $execution.id,
    started_at: new Date().toISOString()
  }
};
```

### 2. Structured Logging Format

```javascript
// Consistent log structure for all entries
function createStructuredLog(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level: level, // debug, info, warn, error

    // Identifiers
    correlation_id: $json._trace?.correlation_id,
    workflow: $workflow.name,
    execution_id: $execution.id,
    node: $node.name,

    // Content
    message: message,

    // Context
    item_id: $json.notification_id || $json.id,
    recipient_type: $json.recipient_type,
    event_type: $json.event_type,

    // Metrics
    attempt: $json._trace?.attempt || 1,
    duration_ms: data.duration_ms,

    // Error details (if applicable)
    error_code: data.error_code,
    error_message: data.error_message,

    // Custom data
    ...data
  };
}

// Usage examples:
const infoLog = createStructuredLog('info', 'Notification sent successfully', {
  duration_ms: 245,
  fcm_message_id: 'msg_123'
});

const errorLog = createStructuredLog('error', 'FCM delivery failed', {
  error_code: 'INVALID_TOKEN',
  error_message: 'The registration token is not valid',
  attempt: 3
});

return [infoLog]; // Save to logs table
```

### 3. Metrics Collection

```javascript
// Collect metrics for dashboard/alerting
const METRICS = {
  // Counters
  notification_sent_total: 0,
  notification_failed_total: 0,
  notification_skipped_total: 0,

  // Gauges
  queue_depth: 0,

  // Histograms (track distributions)
  delivery_latency_ms: [],

  // Labels for grouping
  labels: {
    workflow: $workflow.name,
    recipient_type: $json.recipient_type,
    channel: $json.channel,
    priority: $json.priority
  }
};

// Record metric helper
async function recordMetric(name, value, labels = {}) {
  await supabase.from('workflow_metrics').insert({
    metric_name: name,
    metric_value: value,
    labels: { ...METRICS.labels, ...labels },
    recorded_at: new Date().toISOString()
  });
}

// Usage
await recordMetric('notification_sent_total', 1);
await recordMetric('delivery_latency_ms', 245);
await recordMetric('notification_failed_total', 1, { error_code: 'INVALID_TOKEN' });
```

### 4. Dashboard Queries & SLOs

```sql
-- Success Rate (SLO: 99%)
SELECT
  DATE_TRUNC('hour', recorded_at) as hour,
  SUM(CASE WHEN metric_name = 'notification_sent_total' THEN metric_value ELSE 0 END) as sent,
  SUM(CASE WHEN metric_name = 'notification_failed_total' THEN metric_value ELSE 0 END) as failed,
  ROUND(
    SUM(CASE WHEN metric_name = 'notification_sent_total' THEN metric_value ELSE 0 END)::numeric /
    NULLIF(SUM(metric_value), 0) * 100, 2
  ) as success_rate
FROM workflow_metrics
WHERE metric_name IN ('notification_sent_total', 'notification_failed_total')
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', recorded_at)
ORDER BY hour DESC;

-- Latency Percentiles (SLO: P95 < 2000ms)
SELECT
  labels->>'workflow' as workflow,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY metric_value) as p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99_ms,
  MAX(metric_value) as max_ms
FROM workflow_metrics
WHERE metric_name = 'delivery_latency_ms'
  AND recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY labels->>'workflow';

-- Error Rate by Type
SELECT
  labels->>'error_code' as error_code,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
FROM workflow_metrics
WHERE metric_name = 'notification_failed_total'
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY labels->>'error_code'
ORDER BY count DESC;
```

### 5. Metrics Table Schema

```sql
CREATE TABLE workflow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_metrics_name_time ON workflow_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_metrics_labels ON workflow_metrics USING GIN(labels);

-- Partition by time for performance (optional for scale)
-- CREATE TABLE workflow_metrics_2024_12 PARTITION OF workflow_metrics
--   FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

---

## Cost Controls

### 1. Retry Caps per Time Window

```javascript
// Prevent runaway retry costs
const RETRY_LIMITS = {
  per_user_per_hour: 10,
  per_workflow_per_hour: 1000,
  global_per_hour: 10000
};

async function checkRetryLimits(userId, workflowName) {
  const hourAgo = new Date(Date.now() - 3600000).toISOString();

  // Check per-user limit
  const userRetries = await supabase
    .from('automation_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('status', 'retry')
    .gte('created_at', hourAgo);

  if (userRetries.count >= RETRY_LIMITS.per_user_per_hour) {
    return { allowed: false, reason: 'user_retry_limit', limit: RETRY_LIMITS.per_user_per_hour };
  }

  // Check per-workflow limit
  const workflowRetries = await supabase
    .from('automation_logs')
    .select('count')
    .eq('workflow_name', workflowName)
    .eq('status', 'retry')
    .gte('created_at', hourAgo);

  if (workflowRetries.count >= RETRY_LIMITS.per_workflow_per_hour) {
    return { allowed: false, reason: 'workflow_retry_limit', limit: RETRY_LIMITS.per_workflow_per_hour };
  }

  return { allowed: true };
}
```

### 2. Volume Spike Alerting

```javascript
// Detect abnormal volume (potential fraud/bug)
const VOLUME_THRESHOLDS = {
  notifications_per_minute: 100,
  notifications_per_user_per_minute: 5,
  spike_multiplier: 3 // 3x normal is suspicious
};

async function checkVolumeSpike() {
  const minuteAgo = new Date(Date.now() - 60000).toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();

  // Current minute volume
  const currentVolume = await getVolumeCount(minuteAgo);

  // Average minute volume over past hour
  const hourlyVolume = await getVolumeCount(hourAgo);
  const avgMinuteVolume = hourlyVolume / 60;

  if (currentVolume > avgMinuteVolume * VOLUME_THRESHOLDS.spike_multiplier) {
    await alertVolumeSpike({
      current: currentVolume,
      average: avgMinuteVolume,
      multiplier: currentVolume / avgMinuteVolume
    });
    return { spike_detected: true, action: 'alert_sent' };
  }

  return { spike_detected: false };
}
```

### 3. Backpressure Rules

```javascript
// Pause ingestion if downstream is unhealthy
async function checkBackpressure() {
  const healthChecks = {
    fcm: await checkFCMHealth(),
    supabase: await checkSupabaseHealth(),
    queue_depth: await getQueueDepth()
  };

  // Pause if queue too deep
  if (healthChecks.queue_depth > 10000) {
    return {
      action: 'pause',
      reason: 'queue_depth_exceeded',
      resume_when: 'queue_depth < 5000'
    };
  }

  // Pause if FCM is down
  if (!healthChecks.fcm.healthy) {
    return {
      action: 'pause',
      reason: 'fcm_unhealthy',
      resume_when: 'fcm_health_restored'
    };
  }

  // Slow down if approaching limits
  if (healthChecks.queue_depth > 5000) {
    return {
      action: 'throttle',
      delay_ms: 1000,
      reason: 'approaching_queue_limit'
    };
  }

  return { action: 'proceed' };
}
```

### 4. Cost Tracking Table

```sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'fcm', 'sms', 'email', 'api_call'
  unit_cost NUMERIC(10,6), -- Cost per operation
  quantity INTEGER DEFAULT 1,
  total_cost NUMERIC(10,4),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily cost summary
SELECT
  DATE(recorded_at) as date,
  workflow_name,
  operation_type,
  SUM(quantity) as operations,
  SUM(total_cost) as total_cost
FROM cost_tracking
WHERE recorded_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(recorded_at), workflow_name, operation_type
ORDER BY date DESC, total_cost DESC;
```

---

## Data Persistence & Replayability

### 1. Payload Storage Strategy

```javascript
// Store all payloads for replay capability
async function persistPayloads(stage, data) {
  await supabase.from('workflow_payloads').insert({
    execution_id: $execution.id,
    correlation_id: data._trace?.correlation_id,
    workflow_name: $workflow.name,
    stage: stage, // 'raw_input', 'normalized', 'processed', 'final_output'
    payload: data,
    created_at: new Date().toISOString()
  });
}

// At workflow entry
await persistPayloads('raw_input', $json);

// After normalization
const normalized = normalizePayload($json);
await persistPayloads('normalized', normalized);

// After processing
const result = await processNotification(normalized);
await persistPayloads('final_output', result);
```

### 2. Checkpoint-Based Replay

```javascript
// Replay from a specific checkpoint
async function replayFromCheckpoint(executionId, checkpoint) {
  // Get saved payload at checkpoint
  const saved = await supabase
    .from('workflow_payloads')
    .select('payload')
    .eq('execution_id', executionId)
    .eq('stage', checkpoint)
    .single();

  if (!saved.data) {
    throw new Error(`Checkpoint ${checkpoint} not found for execution ${executionId}`);
  }

  // Trigger workflow with saved payload
  const replayPayload = {
    ...saved.data.payload,
    _replay: {
      original_execution_id: executionId,
      checkpoint: checkpoint,
      replayed_at: new Date().toISOString()
    }
  };

  return await triggerWorkflow($workflow.id, replayPayload);
}
```

### 3. Vendor Response Storage

```javascript
// Store all external API responses
async function storeVendorResponse(vendor, request, response, duration) {
  await supabase.from('vendor_responses').insert({
    correlation_id: $json._trace?.correlation_id,
    execution_id: $execution.id,
    vendor: vendor, // 'fcm', 'sendgrid', 'twilio'
    request_payload: request,
    response_payload: response,
    http_status: response.status,
    duration_ms: duration,
    success: response.status >= 200 && response.status < 300,
    created_at: new Date().toISOString()
  });
}

// Usage
const startTime = Date.now();
const response = await callFCM(payload);
await storeVendorResponse('fcm', payload, response, Date.now() - startTime);
```

### 4. Retention Policy

```sql
-- Data retention configuration
CREATE TABLE retention_policies (
  table_name TEXT PRIMARY KEY,
  retention_days INTEGER NOT NULL,
  archive_before_delete BOOLEAN DEFAULT TRUE,
  last_cleanup TIMESTAMPTZ
);

INSERT INTO retention_policies VALUES
  ('workflow_payloads', 30, true, NULL),
  ('vendor_responses', 90, true, NULL),
  ('automation_logs', 180, true, NULL),
  ('idempotency_cache', 1, false, NULL),
  ('processing_locks', 1, false, NULL);

-- Cleanup job (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN SELECT * FROM retention_policies LOOP
    IF policy.archive_before_delete THEN
      -- Archive to cold storage first
      EXECUTE format(
        'INSERT INTO %I_archive SELECT * FROM %I WHERE created_at < NOW() - INTERVAL ''%s days''',
        policy.table_name, policy.table_name, policy.retention_days
      );
    END IF;

    -- Delete old data
    EXECUTE format(
      'DELETE FROM %I WHERE created_at < NOW() - INTERVAL ''%s days''',
      policy.table_name, policy.retention_days
    );

    -- Update last cleanup
    UPDATE retention_policies SET last_cleanup = NOW() WHERE table_name = policy.table_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## Compliance & Privacy

### 1. PII Handling

```javascript
// PII fields that need protection
const PII_FIELDS = [
  'fcm_token',
  'email',
  'phone',
  'student_name',
  'parent_name',
  'address'
];

// Redact PII for logging
function redactPII(obj, fieldsToRedact = PII_FIELDS) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    if (fieldsToRedact.includes(key)) {
      redacted[key] = redactValue(redacted[key]);
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactPII(redacted[key], fieldsToRedact);
    }
  }

  return redacted;
}

function redactValue(value) {
  if (!value) return value;
  if (typeof value === 'string') {
    if (value.includes('@')) {
      // Email: show first 2 chars
      return value.substring(0, 2) + '***@***';
    }
    if (value.length > 4) {
      // Show last 4 chars only
      return '***' + value.slice(-4);
    }
    return '***';
  }
  return '***';
}

// Usage: Before logging
const safePayload = redactPII($json);
console.log(JSON.stringify(safePayload));
```

### 2. Encryption Standards

```javascript
// Encrypt sensitive data before storage
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Encrypt PII before storing
const encryptedPhone = encrypt($json.phone);
```

### 3. Access Control Matrix

```markdown
## Workflow Access Control

| Role | View Executions | View Payloads | View PII | Edit Workflows | Delete Data |
|------|-----------------|---------------|----------|----------------|-------------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Developer | Yes | Yes | Redacted | Yes | No |
| Support | Yes | Limited | No | No | No |
| Viewer | Summary Only | No | No | No | No |

## Credential Access

| Credential | Who Can View | Who Can Edit |
|------------|--------------|--------------|
| Supabase API Key | DevOps | DevOps |
| FCM Service Account | DevOps | DevOps |
| SendGrid API Key | DevOps | DevOps |
```

### 4. Audit Log for Sensitive Operations

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'view_pii', 'export_data', 'delete_record', 'modify_workflow'
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL, -- 'user', 'system', 'workflow'
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
```

---

## Dependency Management

### 1. Vendor Health Monitoring

```javascript
// Check vendor status before sending
const VENDOR_HEALTH = {
  fcm: {
    health_url: 'https://status.firebase.google.com/incidents.json',
    cache_ttl: 60000, // 1 minute
    last_check: null,
    healthy: true
  },
  supabase: {
    health_url: 'https://status.supabase.com/api/v2/status.json',
    cache_ttl: 60000,
    last_check: null,
    healthy: true
  }
};

async function checkVendorHealth(vendor) {
  const config = VENDOR_HEALTH[vendor];
  const now = Date.now();

  // Use cached result if fresh
  if (config.last_check && (now - config.last_check) < config.cache_ttl) {
    return config.healthy;
  }

  try {
    const response = await fetch(config.health_url);
    const status = await response.json();
    config.healthy = status.indicator !== 'critical';
    config.last_check = now;
  } catch (error) {
    // If we can't check, assume healthy but log
    console.warn(`Failed to check ${vendor} health: ${error.message}`);
  }

  return config.healthy;
}
```

### 2. Feature Toggles for Integrations

```javascript
// Disable non-critical integrations during incidents
const INTEGRATION_TOGGLES = {
  fcm_notifications: { enabled: true, critical: true },
  email_notifications: { enabled: true, critical: false },
  sms_notifications: { enabled: false, critical: false },
  analytics_tracking: { enabled: true, critical: false },
  ai_summaries: { enabled: true, critical: false }
};

function isIntegrationEnabled(integration) {
  const toggle = INTEGRATION_TOGGLES[integration];
  if (!toggle) return false;

  // Critical integrations are always attempted
  if (toggle.critical) return true;

  // Non-critical can be disabled
  return toggle.enabled;
}

// Usage
if (isIntegrationEnabled('email_notifications')) {
  await sendEmail(payload);
} else {
  console.log('Email notifications disabled');
}
```

### 3. Vendor Contract Tests

```json
{
  "name": "FCM Smoke Test",
  "nodes": [
    {
      "name": "Schedule: Every 5 min",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 5 }] }
      }
    },
    {
      "name": "Send Test Notification",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "FCM_URL",
        "method": "POST",
        "body": {
          "message": {
            "token": "TEST_TOKEN",
            "notification": { "title": "Health Check", "body": "Test" }
          }
        }
      }
    },
    {
      "name": "Check Response",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "conditions": [{
            "leftValue": "={{ $json.statusCode }}",
            "rightValue": 200,
            "operator": { "operation": "equals" }
          }]
        }
      }
    },
    {
      "name": "Alert on Failure",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "SLACK_WEBHOOK",
        "body": { "text": "FCM health check failed!" }
      }
    }
  ]
}
```

---

## UX for Operations

### 1. Error Classification

```javascript
// Classify errors for operations team
const ERROR_TAXONOMY = {
  // Retryable errors
  'NETWORK_TIMEOUT': { retryable: true, category: 'transient', action: 'auto_retry' },
  'RATE_LIMITED': { retryable: true, category: 'transient', action: 'backoff_retry' },
  'SERVICE_UNAVAILABLE': { retryable: true, category: 'transient', action: 'wait_retry' },

  // Non-retryable errors
  'INVALID_TOKEN': { retryable: false, category: 'data', action: 'mark_user_invalid' },
  'INVALID_PAYLOAD': { retryable: false, category: 'bug', action: 'alert_dev' },
  'UNAUTHORIZED': { retryable: false, category: 'config', action: 'check_credentials' },

  // Requires investigation
  'UNKNOWN': { retryable: false, category: 'unknown', action: 'manual_review' }
};

function classifyError(error) {
  const code = error.code || error.error_code || 'UNKNOWN';
  const taxonomy = ERROR_TAXONOMY[code] || ERROR_TAXONOMY['UNKNOWN'];

  return {
    error_code: code,
    ...taxonomy,
    human_message: getHumanMessage(code, error),
    suggested_action: getSuggestedAction(code)
  };
}

function getHumanMessage(code, error) {
  const messages = {
    'INVALID_TOKEN': 'User device token is invalid. They may have uninstalled the app or logged out.',
    'RATE_LIMITED': 'Too many requests sent. Will automatically retry in a few minutes.',
    'NETWORK_TIMEOUT': 'Network issue detected. Retrying automatically.',
    'UNAUTHORIZED': 'API credentials may have expired. Check n8n credentials configuration.'
  };
  return messages[code] || `Unexpected error: ${error.message}`;
}
```

### 2. Operations Dashboard Queries

```sql
-- Failed items needing attention
SELECT
  id,
  workflow_name,
  error_code,
  error_message,
  created_at,
  retry_count,
  CASE
    WHEN retry_count >= 3 THEN 'Needs Manual Review'
    WHEN error_code IN ('INVALID_TOKEN', 'INVALID_PAYLOAD') THEN 'Non-Retryable'
    ELSE 'Will Auto-Retry'
  END as status
FROM dead_letter_queue
WHERE status = 'pending'
ORDER BY
  CASE WHEN error_code = 'INVALID_PAYLOAD' THEN 0 ELSE 1 END, -- Bugs first
  created_at DESC
LIMIT 100;

-- Requeue failed items (operations action)
UPDATE dead_letter_queue
SET
  status = 'pending',
  retry_count = retry_count + 1,
  next_retry_at = NOW() + INTERVAL '5 minutes'
WHERE id IN ('uuid1', 'uuid2', 'uuid3')
  AND retry_count < 5;
```

### 3. Admin Actions API

```javascript
// Bulk operations for admin tooling
const ADMIN_ACTIONS = {
  // Requeue failed items
  requeue: async (itemIds) => {
    return await supabase
      .from('dead_letter_queue')
      .update({
        status: 'pending',
        retry_count: supabase.raw('retry_count + 1'),
        next_retry_at: new Date(Date.now() + 300000).toISOString()
      })
      .in('id', itemIds);
  },

  // Mark as resolved (won't retry)
  resolve: async (itemIds, resolution) => {
    return await supabase
      .from('dead_letter_queue')
      .update({
        status: 'resolved',
        resolution_notes: resolution,
        resolved_at: new Date().toISOString()
      })
      .in('id', itemIds);
  },

  // Bulk delete (with audit log)
  delete: async (itemIds, reason, adminId) => {
    // Audit first
    await supabase.from('audit_log').insert({
      action: 'bulk_delete',
      actor_id: adminId,
      resource_type: 'dead_letter_queue',
      details: { item_ids: itemIds, reason: reason }
    });

    return await supabase
      .from('dead_letter_queue')
      .delete()
      .in('id', itemIds);
  }
};
```

### 4. Runbook Template

```markdown
## Runbook: FCM Delivery Failures

### Symptoms
- High failure rate on 360 Performance Loop workflow
- Error code: INVALID_TOKEN or UNAUTHORIZED

### Diagnosis Steps
1. Check FCM status: https://status.firebase.google.com/
2. Check n8n credentials expiry
3. Query recent failures:
   ```sql
   SELECT error_code, COUNT(*)
   FROM automation_logs
   WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY error_code;
   ```

### Resolution

#### If INVALID_TOKEN (many users):
1. This is normal - users uninstall/logout
2. Mark affected items as resolved
3. Trigger token refresh job if available

#### If UNAUTHORIZED:
1. Check Firebase Console for API key status
2. Regenerate service account if needed
3. Update n8n credentials
4. Test with: `curl -X POST ... `

#### If SERVICE_UNAVAILABLE:
1. Check Firebase status page
2. Wait 15 minutes
3. If persists, enable email fallback

### Escalation
- After 30 min of failures: Alert Dev on-call
- After 2 hours: Page Engineering Lead
```

---

## Workflow Performance Engineering

### 1. Node Selection Guidelines

```markdown
## When to Use Built-in Nodes vs Code Nodes

### Use Built-in Nodes When:
- Simple data transformation (Set, Rename Keys)
- Standard logic (If, Switch, Merge)
- Supported integrations (Supabase, HTTP Request)

### Use Code Nodes When:
- Complex business logic
- Multiple conditional transformations
- Array manipulations not supported by built-ins
- Custom validation logic

### Avoid:
- Code nodes for simple field mapping (use Set)
- Multiple HTTP Request nodes when batching possible
- Storing large data in workflow context
```

### 2. Memory-Safe Chunking

```javascript
// Handle large payloads safely
const MAX_CHUNK_SIZE = 1000;
const items = $input.all();

if (items.length > MAX_CHUNK_SIZE) {
  // Process in chunks to avoid memory issues
  const chunks = [];
  for (let i = 0; i < items.length; i += MAX_CHUNK_SIZE) {
    chunks.push(items.slice(i, i + MAX_CHUNK_SIZE));
  }

  // Return first chunk, queue rest
  await queueRemainingChunks(chunks.slice(1));
  return chunks[0];
}

return items;
```

### 3. Workflow Splitting Pattern

```
Main Orchestrator Workflow:
[Webhook] --> [Validate] --> [Determine Recipients] --> [Queue Workers]

Worker Workflow (called multiple times):
[Execute Workflow Trigger] --> [Send Single Notification] --> [Log Result]
```

**Benefits:**
- Better error isolation
- Easier debugging
- Independent scaling
- Cleaner logs

### 4. Performance Checklist

```markdown
## Performance Review Checklist

- [ ] No unnecessary database queries (batch where possible)
- [ ] HTTP requests have appropriate timeouts
- [ ] Large arrays are chunked
- [ ] No synchronous loops with async operations inside
- [ ] Code nodes don't duplicate built-in functionality
- [ ] Merge nodes wait only for required branches
- [ ] Split workflows for complex operations
- [ ] Logging doesn't include large payloads
```

---

## Documentation Standards

### 1. Workflow Documentation Template

```markdown
# Workflow: [Name]

## Overview
Brief description of what this workflow does.

## Trigger
- **Type:** Webhook / Schedule / Manual
- **Endpoint:** `/webhook/xxx`
- **Method:** POST

## Data Flow
```
[Node 1] --> [Node 2] --> [Node 3]
                |
                +--> [Error Handler]
```

## Input Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field1 | string | Yes | ... |

## Output Schema
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | ... |

## Error Handling
| Error Code | Cause | Action |
|------------|-------|--------|
| INVALID_INPUT | Missing field | Return 400 |

## Dependencies
- Supabase (tables: x, y)
- FCM

## SLOs
- Success rate: 99%
- P95 latency: < 2s
```

### 2. Node Documentation Standard

Each sticky note should contain:
```markdown
## [NODE NAME]
**Purpose:** One-line description

**Input:** Expected data structure
**Output:** What this node produces

**Error Handling:** What happens on failure
**Notes:** Any special considerations
```

### 3. Error Taxonomy Document

```markdown
# Error Taxonomy

## Category: Transient
Errors that resolve on their own with retry.

| Code | Description | Auto-Retry | Backoff |
|------|-------------|------------|---------|
| NETWORK_TIMEOUT | Request timed out | Yes | Exponential |
| RATE_LIMITED | API quota exceeded | Yes | Fixed 60s |

## Category: Data
Errors caused by invalid input data.

| Code | Description | Action |
|------|-------------|--------|
| INVALID_TOKEN | FCM token expired | Mark user inactive |
| MISSING_FIELD | Required field missing | Log & skip |

## Category: Configuration
Errors caused by system misconfiguration.

| Code | Description | Action |
|------|-------------|--------|
| UNAUTHORIZED | Invalid API key | Alert DevOps |
| INVALID_CREDENTIAL | Credential expired | Rotate credential |
```

### 4. Onboarding Checklist for New Maintainers

```markdown
# n8n Workflow Maintainer Onboarding

## Week 1: Basics
- [ ] Read this N8N_GUIDE.md completely
- [ ] Set up local n8n instance
- [ ] Import and run test workflows
- [ ] Understand node types (triggers, logic, execution)

## Week 2: Our Workflows
- [ ] Review each production workflow
- [ ] Understand data flow diagrams
- [ ] Run each workflow in dev mode
- [ ] Review error handling patterns

## Week 3: Operations
- [ ] Access to monitoring dashboards
- [ ] Understand alerting setup
- [ ] Practice runbook procedures
- [ ] Shadow on-call rotation

## Week 4: Independence
- [ ] Make a small workflow change
- [ ] Deploy to staging
- [ ] Handle a simulated incident
- [ ] Complete certification checklist
```

---

## Workflow Enhancement Patterns

### Pattern 1: Input Validation

Add validation before processing:

```
[Webhook] --> [If: Has Required Fields?]
                    |           |
                   Yes          No
                    |           |
                    v           v
              [Continue]   [Stop And Error: "Missing required fields"]
```

**Code Example:**
```javascript
// In Code node
const required = ['student_id', 'parent_fcm_token', 'status'];
const missing = required.filter(field => !$json[field]);

if (missing.length > 0) {
  throw new Error(`Missing required fields: ${missing.join(', ')}`);
}

return $json;
```

### Pattern 2: Error Handling with Retry

```
[Main Workflow]
      |
      v
[HTTP Request: FCM] --[On Error]--> [Wait: 5 seconds]
      |                                    |
      v                                    v
[Continue]                          [Retry Counter < 3?]
                                          |        |
                                         Yes       No
                                          |        |
                                          v        v
                                    [Retry]   [Log Failure]
```

### Pattern 3: Parallel Execution with Merge

```
[Get Data]
     |
     +---> [Notify Student] ---+
     |                         |
     +---> [Notify Parent] ----+--> [Merge: Wait for All] --> [Log Results]
     |                         |
     +---> [Notify Teacher] ---+
```

### Pattern 4: Batch Processing with Loop

```
[Get All Students]
        |
        v
[Split In Batches: 10 items]
        |
        v
[Loop: For Each Student]
        |
        v
[Send Notification]
        |
        v
[Wait: 1 second] --> [Next Batch]
```

### Pattern 5: Quiet Hours Check

```javascript
// Code node to check quiet hours
const now = new Date();
const hour = now.getHours();

// Quiet hours: 10 PM to 7 AM
const isQuietHours = hour >= 22 || hour < 7;

return {
  ...items[0].json,
  isQuietHours,
  shouldDelay: isQuietHours
};
```

### Pattern 6: Duplicate Prevention

```
[Webhook] --> [Supabase: Check Recent Notifications]
                        |
                        v
              [If: Sent in last 5 minutes?]
                    |           |
                   Yes          No
                    |           |
                    v           v
            [Respond: Already Sent]  [Continue]
```

---

## Reusable Sub-Workflows

### Sub-Workflow 1: Send FCM Notification

**Purpose:** Unified push notification sending with retry logic

**Input:**
```json
{
  "fcm_token": "device_token",
  "title": "Notification Title",
  "body": "Notification body text",
  "data": { "type": "attendance", "id": "123" }
}
```

**Output:**
```json
{
  "success": true,
  "message_id": "fcm_message_id",
  "sent_at": "2024-12-25T10:00:00Z"
}
```

### Sub-Workflow 2: Log Automation Event

**Purpose:** Standard logging for all automation events

**Input:**
```json
{
  "workflow_name": "360 Performance Loop",
  "event_type": "notification_sent",
  "user_id": "uuid",
  "data": { "score": 85 },
  "status": "success"
}
```

### Sub-Workflow 3: Check User Preferences

**Purpose:** Verify notification settings before sending

**Input:**
```json
{
  "user_id": "uuid",
  "notification_type": "attendance"
}
```

**Output:**
```json
{
  "can_send": true,
  "preferred_channel": "push",
  "is_quiet_hours": false
}
```

---

## Integration Credentials

### Required Credentials

| Service | Credential Type | Where to Get |
|---------|----------------|--------------|
| **Supabase** | API Key | Supabase Dashboard > Settings > API |
| **Firebase FCM** | OAuth2 / Service Account | Firebase Console > Project Settings |
| **SendGrid** | API Key | SendGrid Dashboard > Settings > API Keys |
| **OpenAI** | API Key | OpenAI Platform > API Keys |

### Supabase Credential Setup

1. Go to n8n > Credentials > New
2. Select "Supabase API"
3. Enter:
   - **Host:** `https://qwgpqdpfxjkygyouwgdr.supabase.co`
   - **API Key:** Your Supabase anon/service key

### FCM Setup (HTTP Request)

Since n8n doesn't have native FCM node, use HTTP Request:

**URL:** `https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "message": {
    "token": "device_fcm_token",
    "notification": {
      "title": "Title",
      "body": "Body"
    },
    "data": {
      "type": "notification_type",
      "id": "resource_id"
    }
  }
}
```

---

## Webhook Payload Formats

### Test Completed Event

**Endpoint:** `POST /webhook/test-completed`

```json
{
  "event": "test_completed",
  "timestamp": "2024-12-25T10:00:00Z",
  "data": {
    "test_result_id": "uuid",
    "test_id": "uuid",
    "test_name": "Physics Chapter 5 Quiz",
    "student": {
      "id": "uuid",
      "name": "Rahul Sharma",
      "fcm_token": "token"
    },
    "parent": {
      "id": "uuid",
      "name": "Mr. Sharma",
      "fcm_token": "token"
    },
    "teacher": {
      "id": "uuid",
      "name": "Dr. Gupta",
      "fcm_token": "token"
    },
    "score": 85,
    "max_score": 100,
    "percentage": 85,
    "batch_average": 72,
    "rank": 3,
    "total_students": 25
  }
}
```

### Attendance Marked Event

**Endpoint:** `POST /webhook/attendance-marked`

```json
{
  "event": "attendance_marked",
  "timestamp": "2024-12-25T10:00:00Z",
  "data": {
    "attendance_id": "uuid",
    "student": {
      "id": "uuid",
      "name": "Rahul Sharma"
    },
    "parent": {
      "id": "uuid",
      "fcm_token": "token"
    },
    "class": {
      "id": "uuid",
      "name": "Physics - Batch A",
      "subject": "Physics"
    },
    "status": "absent",
    "marked_by": {
      "id": "uuid",
      "name": "Dr. Gupta",
      "role": "teacher"
    }
  }
}
```

### Live Class Reminder Event

**Endpoint:** `POST /webhook/class-reminder`

```json
{
  "event": "class_reminder",
  "reminder_type": "30_min",
  "timestamp": "2024-12-25T09:30:00Z",
  "data": {
    "class_id": "uuid",
    "class_name": "Physics - Electromagnetic Waves",
    "starts_at": "2024-12-25T10:00:00Z",
    "join_url": "https://stream.app/class/xyz",
    "teacher": {
      "id": "uuid",
      "name": "Dr. Gupta"
    },
    "students": [
      {
        "id": "uuid",
        "name": "Rahul Sharma",
        "fcm_token": "token"
      }
    ]
  }
}
```

---

## Testing & Debugging

### Test Webhook Locally

```bash
# Test 360 Performance Loop
curl -X POST http://localhost:5678/webhook/test-completed \
  -H "Content-Type: application/json" \
  -d '{
    "test_result_id": "test-123",
    "student_name": "Test Student",
    "student_fcm_token": "fake_token",
    "parent_fcm_token": "fake_token",
    "teacher_fcm_token": "fake_token",
    "test_name": "Demo Test",
    "score": 85,
    "batch_avg": 72
  }'

# Test Attendance Alert
curl -X POST http://localhost:5678/webhook/attendance-marked \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-123",
    "student_name": "Test Student",
    "parent_id": "parent-123",
    "parent_fcm_token": "fake_token",
    "class_name": "Physics",
    "status": "absent"
  }'
```

### Debug Mode

Enable debug logging in n8n:
1. Go to workflow settings
2. Enable "Save Execution Progress"
3. Enable "Save Manual Executions"

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not receiving | Workflow not active | Activate workflow |
| FCM failing | Invalid token | Validate token before sending |
| Supabase error | Wrong credentials | Check API key and URL |
| Timeout | Long operations | Add Wait nodes, increase timeout |

---

## Workflow Activation

### Activate via API

```bash
# Activate 360 Performance Loop
curl -X PATCH "http://localhost:5678/api/v1/workflows/BdvFtJyC6vsUk7ih" \
  -H "X-N8N-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# Activate Attendance Alert
curl -X PATCH "http://localhost:5678/api/v1/workflows/DhyO1XDrCkBAkzD4" \
  -H "X-N8N-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

### Activate via UI

1. Open n8n at http://localhost:5678
2. Go to Workflows
3. Click on workflow
4. Toggle "Active" switch in top-right

---

## Quick Reference

### Workflow Status

| Workflow | ID | Webhook Path | Status |
|----------|-----|--------------|--------|
| 360 Performance Loop | `BdvFtJyC6vsUk7ih` | `/webhook/test-completed` | Inactive |
| Instant Attendance Alert | `DhyO1XDrCkBAkzD4` | `/webhook/attendance-marked` | Inactive |

### Node Type Reference

| Category | Common Nodes |
|----------|--------------|
| **Triggers** | webhook, scheduleTrigger, errorTrigger |
| **Logic** | if, switch, merge, filter |
| **Loop** | splitInBatches, splitOut |
| **HTTP** | httpRequest, respondToWebhook |
| **Database** | supabase, postgres |
| **Transform** | set, code, aggregate |
| **Error** | errorTrigger, stopAndError |
| **Utility** | wait, dateTime, noOp |

---

## Next Steps

1. **Configure Supabase credential** in n8n
2. **Set up FCM authentication** (OAuth2 or Service Account)
3. **Activate workflows** for testing
4. **Test with sample payloads** using curl
5. **Add error handling** workflow
6. **Integrate webhook calls** in React Native app

---

## Database Tables Required

Create these tables in Supabase for production workflows:

```sql
-- Automation execution logs
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  notification_id TEXT,
  event_type TEXT,
  status TEXT DEFAULT 'processing',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Error tracking
CREATE TABLE automation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT,
  workflow_name TEXT,
  execution_id TEXT,
  node_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  severity TEXT DEFAULT 'warning',
  input_data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT UNIQUE,
  workflow_name TEXT,
  total_recipients INTEGER,
  sent_count INTEGER,
  failed_count INTEGER,
  skipped_count INTEGER,
  status TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dead letter queue for failed items
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  failed_node TEXT,
  input_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ
);

-- Idempotency cache
CREATE TABLE idempotency_cache (
  key TEXT PRIMARY KEY,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Admin notifications feed
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_automation_logs_status ON automation_logs(status);
CREATE INDEX idx_automation_logs_workflow ON automation_logs(workflow_name, created_at DESC);
CREATE INDEX idx_automation_errors_severity ON automation_errors(severity, created_at DESC);
CREATE INDEX idx_dead_letter_status ON dead_letter_queue(status, next_retry_at);
CREATE INDEX idx_idempotency_expires ON idempotency_cache(expires_at);
CREATE INDEX idx_admin_notifications_read ON admin_notifications(read, created_at DESC);
```

---

*Guide created: December 2024*
*n8n Version: Latest*
*Last updated: December 2024*
*Production-Ready Sections Added: December 2024*
