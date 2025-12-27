# n8n API Control Guide

Complete guide for programmatically managing n8n workflows via REST API.

## Authentication

```bash
# All requests require API key header
-H "X-N8N-API-KEY: YOUR_API_KEY"
```

**Get API Key:** n8n UI > Settings > API > Create API Key

---

## Workflow Management APIs

### 1. List All Workflows

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" `
  -Method GET `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

```bash
# curl
curl -s "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: YOUR_API_KEY"
```

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "name": "My Workflow",
      "active": true,
      "createdAt": "2025-12-26T...",
      "updatedAt": "2025-12-26T..."
    }
  ],
  "nextCursor": null
}
```

---

### 2. Get Workflow Details

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/WORKFLOW_ID" `
  -Method GET `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

### 3. Create/Import Workflow

```powershell
# From JSON file
$workflow = Get-Content "workflow.json" -Raw
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" `
  -Method POST `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"; "Content-Type"="application/json"} `
  -Body $workflow
```

```bash
# curl
curl -s -X POST "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

**Response:** Returns created workflow with `id`

---

### 4. Activate Workflow

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/WORKFLOW_ID/activate" `
  -Method POST `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

```bash
curl -s -X POST "http://localhost:5678/api/v1/workflows/WORKFLOW_ID/activate" \
  -H "X-N8N-API-KEY: YOUR_API_KEY"
```

---

### 5. Deactivate Workflow

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/WORKFLOW_ID/deactivate" `
  -Method POST `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

### 6. Delete Workflow

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/WORKFLOW_ID" `
  -Method DELETE `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

## Execution APIs

### 7. Get Executions List

```powershell
# Get recent executions
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions" `
  -Method GET `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}

# Filter by workflow
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions?workflowId=WORKFLOW_ID" `
  -Method GET `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

### 8. Get Execution Details

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions/EXECUTION_ID" `
  -Method GET `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

### 9. Delete Execution

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions/EXECUTION_ID" `
  -Method DELETE `
  -Headers @{"X-N8N-API-KEY"="YOUR_API_KEY"}
```

---

## Webhook Execution

### Test Webhook (requires clicking "Execute" in UI first)

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/YOUR_PATH" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"key": "value"}'
```

### Production Webhook (workflow must be active)

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook/YOUR_PATH" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"key": "value"}'
```

---

## MCP Tools (Claude Code)

### Search Workflows
```javascript
mcp__n8n-mcp__search_workflows({
  query: "streak",      // Optional: filter by name
  limit: 50             // Optional: max results
})
```

### Get Workflow Details
```javascript
mcp__n8n-mcp__get_workflow_details({
  workflowId: "abc123"
})
```

### Execute Workflow
```javascript
mcp__n8n-mcp__execute_workflow({
  workflowId: "abc123",
  inputs: {
    type: "webhook",
    webhookData: {
      method: "POST",
      body: {
        student_id: "stu123",
        student_name: "Rahul"
      }
    }
  }
})
```

---

## PowerShell Helper Functions

```powershell
# Save as n8n-helpers.ps1

$N8N_URL = "http://localhost:5678"
$N8N_API_KEY = "YOUR_API_KEY"

function Get-N8nHeaders {
    @{
        "X-N8N-API-KEY" = $N8N_API_KEY
        "Content-Type" = "application/json"
    }
}

# List workflows
function Get-N8nWorkflows {
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
        -Method GET -Headers (Get-N8nHeaders)
}

# Import workflow from file
function Import-N8nWorkflow {
    param([string]$FilePath)
    $body = Get-Content $FilePath -Raw
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
        -Method POST -Headers (Get-N8nHeaders) -Body $body
}

# Activate workflow
function Enable-N8nWorkflow {
    param([string]$WorkflowId)
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$WorkflowId/activate" `
        -Method POST -Headers (Get-N8nHeaders)
}

# Deactivate workflow
function Disable-N8nWorkflow {
    param([string]$WorkflowId)
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$WorkflowId/deactivate" `
        -Method POST -Headers (Get-N8nHeaders)
}

# Delete workflow
function Remove-N8nWorkflow {
    param([string]$WorkflowId)
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$WorkflowId" `
        -Method DELETE -Headers (Get-N8nHeaders)
}

# Test webhook
function Test-N8nWebhook {
    param(
        [string]$Path,
        [hashtable]$Body
    )
    Invoke-RestMethod -Uri "$N8N_URL/webhook-test/$Path" `
        -Method POST -ContentType "application/json" `
        -Body ($Body | ConvertTo-Json)
}

# Get executions
function Get-N8nExecutions {
    param([string]$WorkflowId)
    $uri = "$N8N_URL/api/v1/executions"
    if ($WorkflowId) { $uri += "?workflowId=$WorkflowId" }
    Invoke-RestMethod -Uri $uri -Method GET -Headers (Get-N8nHeaders)
}
```

### Usage Examples

```powershell
# Load helpers
. .\n8n-helpers.ps1

# List all workflows
Get-N8nWorkflows

# Import and activate new workflow
$wf = Import-N8nWorkflow -FilePath ".\ai_streak_v4_production.json"
Enable-N8nWorkflow -WorkflowId $wf.id

# Test the webhook
Test-N8nWebhook -Path "streak-v4" -Body @{
    student_id = "stu123"
    student_name = "Rahul"
    current_streak = 15
    preferred_subject = "Physics"
}

# Check executions
Get-N8nExecutions -WorkflowId $wf.id

# Deactivate when done
Disable-N8nWorkflow -WorkflowId $wf.id
```

---

## Complete Deployment Script

```powershell
# deploy-workflow.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$WorkflowFile,
    [switch]$Activate
)

$N8N_URL = "http://localhost:5678"
$N8N_API_KEY = "YOUR_API_KEY"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type" = "application/json"
}

# Read workflow file
$workflow = Get-Content $WorkflowFile -Raw
$workflowObj = $workflow | ConvertFrom-Json

Write-Host "Deploying: $($workflowObj.name)"

# Check if workflow exists (by name)
$existing = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
    -Method GET -Headers $headers

$found = $existing.data | Where-Object { $_.name -eq $workflowObj.name }

if ($found) {
    Write-Host "Workflow exists (ID: $($found.id)), deleting..."
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$($found.id)" `
        -Method DELETE -Headers $headers | Out-Null
}

# Create new workflow
Write-Host "Creating workflow..."
$created = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
    -Method POST -Headers $headers -Body $workflow

Write-Host "Created with ID: $($created.id)"

# Activate if requested
if ($Activate) {
    Write-Host "Activating..."
    Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$($created.id)/activate" `
        -Method POST -Headers $headers | Out-Null
    Write-Host "Workflow active!"
}

Write-Host "Done. Webhook URL: $N8N_URL/webhook/$($workflowObj.nodes[0].parameters.path)"
```

### Usage
```powershell
# Deploy and activate
.\deploy-workflow.ps1 -WorkflowFile ".\ai_streak_v4_production.json" -Activate

# Deploy without activating
.\deploy-workflow.ps1 -WorkflowFile ".\ai_streak_v4_production.json"
```

---

## API Endpoints Summary

| Action | Method | Endpoint |
|--------|--------|----------|
| List workflows | GET | `/api/v1/workflows` |
| Get workflow | GET | `/api/v1/workflows/{id}` |
| Create workflow | POST | `/api/v1/workflows` |
| Update workflow | PUT | `/api/v1/workflows/{id}` |
| Delete workflow | DELETE | `/api/v1/workflows/{id}` |
| Activate | POST | `/api/v1/workflows/{id}/activate` |
| Deactivate | POST | `/api/v1/workflows/{id}/deactivate` |
| List executions | GET | `/api/v1/executions` |
| Get execution | GET | `/api/v1/executions/{id}` |
| Delete execution | DELETE | `/api/v1/executions/{id}` |
| Test webhook | POST | `/webhook-test/{path}` |
| Prod webhook | POST | `/webhook/{path}` |

---

## Workflow Settings for MCP Access

To enable MCP execution, include in workflow JSON:

```json
{
  "settings": {
    "executionOrder": "v1",
    "availableInMCP": true
  }
}
```

---

## Workflow Versions Reference

### AI Study Streak
| Version | File | ID | Features |
|---------|------|----|----------|
| v1 | `ai_streak_v1_correlation.json` | `ix1Aw0HsAa4JvgzY` | Correlation ID |
| v2 | `ai_streak_v2_validation.json` | `Sl6ZkZWfE94eZCD8` | + Validation |
| v3 | `ai_streak_v3_cost.json` | `7RkT9n7L2gyu9btC` | + Cost tracking |
| v4 | `ai_streak_v4_production.json` | `1s42BQodfKFNAryq` | + Logging |
| **v5** | `ai_streak_v5_enterprise.json` | `suyqK7DkyB2gCI1u` | **Full Enterprise** |

### Smart Doubt Chain
| Version | File | ID | Features |
|---------|------|----|----------|
| **v1** | `smart_doubt_chain_v1.json` | `JpC6Wj2QGIIXBzxv` | **AI Routing, FAQ Detection, Teacher Queue** |

---

## v5 Enterprise Features

```
All 22 Production Requirements:
- Webhook authentication (X-API-KEY)
- Input validation & sanitization
- Duplicate detection (5-min window)
- HTTP retry with exponential backoff
- Per-node timeouts
- Fallback handlers
- Cost tracking
- Structured logging
- Supabase logging
- Dead letter queue
- Slack failure alerts
- Correlation ID propagation
- Duration tracking
```

---

## Quick Deploy Script

```powershell
# Deploy any workflow
$N8N_KEY = "YOUR_API_KEY"
$workflow = Get-Content "smart_doubt_chain_v1.json" -Raw

# Import
$result = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" `
  -Method POST -Headers @{"X-N8N-API-KEY"=$N8N_KEY; "Content-Type"="application/json"} `
  -Body $workflow

# Activate
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$($result.id)/activate" `
  -Method POST -Headers @{"X-N8N-API-KEY"=$N8N_KEY}

Write-Host "Deployed: $($result.id)"
```

---

## Smart Doubt Chain Test

```powershell
# Test Smart Doubt Chain
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

### Expected Responses

**AI Answers (HIGH Confidence):**
```json
{
  "success": true,
  "resolution": "ai_answered",
  "answer": {
    "text": "Speed is a scalar quantity...",
    "source": "ai",
    "confidence": "HIGH"
  }
}
```

**Routed to Teacher (MEDIUM/LOW Confidence):**
```json
{
  "success": true,
  "resolution": "routed_to_teacher",
  "message": "Your doubt has been forwarded to a teacher.",
  "estimated_response": "2-4 hours"
}
```
