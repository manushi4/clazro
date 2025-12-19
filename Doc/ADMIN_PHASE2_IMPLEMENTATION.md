# 🔧 ADMIN PHASE 2 - ADVANCED FEATURES IMPLEMENTATION

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Admin Role - Phase 2 (Post-Demo)
> **Prerequisite:** Phase 1 Complete
> **Sprints:** 8 Sprints (Sprint 10-17)
> **Total:** 8 Fixed Screens, 13 Dynamic Screens, 22 Widgets

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Sprint 10: System Monitoring](#2-sprint-10-system-monitoring)
3. [Sprint 11: Security & Compliance](#3-sprint-11-security--compliance)
4. [Sprint 12: Support Center](#4-sprint-12-support-center)
5. [Sprint 13: AI Management](#5-sprint-13-ai-management)
6. [Sprint 14: Bulk Operations](#6-sprint-14-bulk-operations)
7. [Sprint 15: Integrations & Webhooks](#7-sprint-15-integrations--webhooks)
8. [Sprint 16: Operations Hub](#8-sprint-16-operations-hub)
9. [Sprint 17: Strategic Planning & Advanced](#9-sprint-17-strategic-planning--advanced)
10. [Database Schema](#10-database-schema)
11. [Platform Studio Config](#11-platform-studio-config)

---

## 1. OVERVIEW

### 1.1 Phase 2 Scope Summary

| Component | Count |
|-----------|-------|
| Fixed Screens | 8 |
| Dynamic Screens | 13 |
| Widgets | 22 |
| Query Hooks | 13 |
| Mutation Hooks | 10 |
| DB Tables | 12 |

### 1.2 Phase 2 vs Phase 1

| Aspect | Phase 1 (Demo) | Phase 2 (Advanced) |
|--------|----------------|-------------------|
| Focus | Core admin flows | Enterprise features |
| Priority | Must-have | Nice-to-have |
| Complexity | Medium | High |
| Dependencies | None | Phase 1 complete |

### 1.3 Sprint Summary Table

| Sprint | Focus Area | Fixed | Dynamic | Widgets | Key Features |
|--------|------------|-------|---------|---------|--------------|
| 10 | System Monitoring | 0 | 2 | 6 | Real-time metrics, server health, API monitoring |
| 11 | Security & Compliance | 0 | 2 | 5 | Security settings, compliance dashboard, violations |
| 12 | Support Center | 0 | 2 | 5 | Ticket management, escalations, satisfaction |
| 13 | AI Management | 0 | 1 | 5 | AI usage, budgets, model config, kill switches |
| 14 | Bulk Operations | 4 | 0 | 0 | Import, export, backup, restore |
| 15 | Integrations | 0 | 2 | 0 | Third-party integrations, webhooks |
| 16 | Operations Hub | 0 | 2 | 5 | Task automation, schedules, alerts |
| 17 | Strategic Planning | 4 | 2 | 1 | Goals, roadmap, forecasts, advanced tools |

---

## 2. SPRINT 10: SYSTEM MONITORING

### 2.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `system-monitoring` | High |
| Dynamic Screen | `server-detail` | Medium |
| Widget | `system.health-banner` | High |
| Widget | `system.server-stats` | High |
| Widget | `system.api-metrics` | High |
| Widget | `system.error-rates` | Medium |
| Widget | `system.uptime-chart` | Medium |
| Widget | `system.active-users` | Medium |
| Hook | `useSystemMonitoringQuery` | High |
| Hook | `useServerMetricsQuery` | Medium |
| DB Table | `server_metrics` | High |
| DB Table | `api_logs` | High |

### 2.2 Key Features

```
System Monitoring Dashboard:
├── Real-time health status banner
├── Server metrics (CPU, Memory, Disk, Network)
├── API response times & error rates
├── Active user count (real-time)
├── Uptime history chart
├── Alert configuration
└── Drill-down to server details
```

### 2.3 Widget Specifications

**SystemServerStatsWidget**
- CPU usage gauge (0-100%)
- Memory usage gauge
- Disk usage with breakdown
- Network I/O metrics
- Auto-refresh every 10 seconds

**APIMetricsWidget**
- Average response time
- Requests per minute
- Error rate percentage
- Top slow endpoints
- Status code distribution

**ErrorRatesWidget**
- Error trend chart (24h)
- Error breakdown by type
- Top error messages
- Error spike alerts

### 2.4 Sprint 10 Checkpoint

✅ **Test Criteria:**
- [ ] System monitoring dashboard loads
- [ ] Real-time metrics update automatically
- [ ] Server stats show CPU/Memory/Disk
- [ ] API metrics show response times
- [ ] Error rates chart renders
- [ ] Uptime chart shows history
- [ ] Active users count updates

---

## 3. SPRINT 11: SECURITY & COMPLIANCE

### 3.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `security-settings` | High |
| Dynamic Screen | `compliance-audit` | High |
| Widget | `compliance.score` | High |
| Widget | `compliance.audit-summary` | High |
| Widget | `compliance.violations` | High |
| Widget | `compliance.remediation` | Medium |
| Widget | `compliance.reports` | Medium |
| Hook | `useSecuritySettingsQuery` | High |
| Hook | `useComplianceQuery` | High |
| Hook | `useUpdateSecuritySettings` | High |
| DB Table | `compliance_records` | High |
| DB Table | `security_policies` | High |

### 3.2 Key Features

```
Security Settings:
├── Authentication settings
│   ├── Password policy (min length, complexity)
│   ├── Session timeout configuration
│   ├── 2FA enforcement
│   └── SSO configuration
├── Access control
│   ├── IP whitelist/blacklist
│   ├── Rate limiting rules
│   └── API key management
├── Data protection
│   ├── Encryption settings
│   ├── Data retention policies
│   └── PII handling rules
└── Security alerts
    ├── Failed login alerts
    ├── Suspicious activity detection
    └── Breach notification settings

Compliance Dashboard:
├── Overall compliance score
├── Audit findings summary
├── Active violations list
├── Remediation tasks
├── Compliance reports
└── Regulatory checklist (GDPR, etc.)
```

### 3.3 Widget Specifications

**ComplianceScoreWidget**
- Overall score (0-100)
- Score breakdown by category
- Trend over time
- Risk level indicator

**ViolationsWidget**
- Active violations list
- Severity levels (critical, high, medium, low)
- Due dates for remediation
- Quick action buttons

### 3.4 Sprint 11 Checkpoint

✅ **Test Criteria:**
- [ ] Security settings screen loads
- [ ] Password policy can be updated
- [ ] IP whitelist management works
- [ ] Compliance score displays
- [ ] Violations list shows with severity
- [ ] Remediation tasks can be assigned
- [ ] Compliance reports generate

---

## 4. SPRINT 12: SUPPORT CENTER

### 4.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `support-center` | High |
| Dynamic Screen | `ticket-detail` | High |
| Widget | `support.ticket-stats` | High |
| Widget | `support.ticket-list` | High |
| Widget | `support.escalations` | High |
| Widget | `support.response-times` | Medium |
| Widget | `support.satisfaction` | Medium |
| Hook | `useSupportTicketsQuery` | High |
| Hook | `useTicketDetailQuery` | High |
| Hook | `useUpdateTicket` | High |
| Hook | `useAssignTicket` | Medium |
| DB Table | `support_tickets` | High |
| DB Table | `ticket_responses` | High |

### 4.2 Key Features

```
Support Center:
├── Ticket statistics
│   ├── Open / In Progress / Resolved
│   ├── By priority
│   └── By category
├── Ticket list
│   ├── Filters (status, priority, assignee)
│   ├── Search
│   ├── Bulk actions
│   └── Quick assign
├── Escalations
│   ├── Overdue tickets
│   ├── High priority unassigned
│   └── SLA breaches
├── Response metrics
│   ├── Average first response time
│   ├── Average resolution time
│   └── Response time by priority
└── Customer satisfaction
    ├── CSAT score
    ├── NPS score
    └── Feedback trends
```

### 4.3 Widget Specifications

**TicketStatsWidget**
- Open tickets count
- In-progress count
- Resolved today
- Average resolution time
- SLA compliance rate

**EscalationsWidget**
- Overdue tickets list
- Time overdue indicator
- Assignee info
- Quick escalate action

**SatisfactionWidget**
- CSAT score gauge
- NPS score
- Recent feedback
- Trend chart

### 4.4 Sprint 12 Checkpoint

✅ **Test Criteria:**
- [ ] Support center dashboard loads
- [ ] Ticket stats show correct counts
- [ ] Ticket list with filters works
- [ ] Ticket detail screen loads
- [ ] Can respond to tickets
- [ ] Can assign/reassign tickets
- [ ] Escalations list shows overdue
- [ ] Satisfaction metrics display

---

## 5. SPRINT 13: AI MANAGEMENT

### 5.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `ai-management` | High |
| Widget | `ai.usage-stats` | High |
| Widget | `ai.model-stats` | High |
| Widget | `ai.budget-tracker` | High |
| Widget | `ai.feature-toggles` | High |
| Widget | `ai.audit-log` | Medium |
| Hook | `useAIUsageQuery` | High |
| Hook | `useAIBudgetQuery` | High |
| Hook | `useUpdateAIConfig` | High |
| Hook | `useAIKillSwitch` | High |
| DB Table | `ai_usage_logs` | High |
| DB Table | `ai_budgets` | High |

### 5.2 Key Features

```
AI Management Dashboard:
├── Usage statistics
│   ├── Total API calls
│   ├── Tokens consumed
│   ├── Cost breakdown
│   └── Usage by feature
├── Model performance
│   ├── Response times
│   ├── Success rates
│   ├── Error rates
│   └── Model comparison
├── Budget tracking
│   ├── Current spend vs budget
│   ├── Projected spend
│   ├── Alerts configuration
│   └── Cost optimization tips
├── Feature toggles
│   ├── Enable/disable AI features
│   ├── Per-role configuration
│   ├── Rate limits
│   └── Kill switches
└── Audit log
    ├── AI usage history
    ├── Configuration changes
    └── Anomaly detection
```

### 5.3 Widget Specifications

**AIUsageStatsWidget**
- Total API calls (today/week/month)
- Tokens consumed
- Cost in currency
- Usage trend chart
- Top features by usage

**BudgetTrackerWidget**
- Budget progress bar
- Current spend
- Remaining budget
- Projected end-of-month
- Alert thresholds

**FeatureTogglesWidget**
- List of AI features
- Toggle switches
- Per-role overrides
- Kill switch button

### 5.4 Sprint 13 Checkpoint

✅ **Test Criteria:**
- [ ] AI management dashboard loads
- [ ] Usage stats show API calls, tokens, cost
- [ ] Model stats show performance metrics
- [ ] Budget tracker shows spend vs budget
- [ ] Feature toggles work
- [ ] Kill switch disables AI features
- [ ] Audit log shows AI usage history

---

## 6. SPRINT 14: BULK OPERATIONS

### 6.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Fixed Screen | `bulk-import` | High |
| Fixed Screen | `bulk-export` | High |
| Fixed Screen | `backup-restore` | High |
| Fixed Screen | `maintenance-mode` | Medium |
| Hook | `useBulkImport` | High |
| Hook | `useBulkExport` | High |
| Hook | `useBackupRestore` | High |
| Hook | `useMaintenanceMode` | Medium |
| DB Table | `import_jobs` | High |
| DB Table | `backup_records` | High |

### 6.2 Key Features

```
Bulk Import:
├── File upload (CSV, Excel)
├── Column mapping
├── Validation preview
├── Error handling
├── Progress tracking
└── Import history

Bulk Export:
├── Entity selection
├── Field selection
├── Filter options
├── Format selection (CSV, Excel, JSON)
├── Schedule exports
└── Export history

Backup & Restore:
├── Manual backup trigger
├── Scheduled backups
├── Backup history
├── Restore from backup
├── Selective restore
└── Backup verification

Maintenance Mode:
├── Enable/disable toggle
├── Custom message
├── Allowed IPs
├── Scheduled maintenance
└── Auto-disable timer
```

### 6.3 Screen Specifications

**BulkImportScreen**
1. Upload file
2. Select entity type (users, content, etc.)
3. Map columns to fields
4. Preview & validate
5. Confirm import
6. Progress & results

**BackupRestoreScreen**
1. Current backup status
2. Create new backup
3. Backup history list
4. Restore options
5. Verification status

### 6.4 Sprint 14 Checkpoint

✅ **Test Criteria:**
- [ ] Bulk import screen loads
- [ ] CSV/Excel file upload works
- [ ] Column mapping interface works
- [ ] Validation shows errors
- [ ] Import executes with progress
- [ ] Bulk export generates files
- [ ] Backup creates successfully
- [ ] Restore from backup works
- [ ] Maintenance mode toggles

---

## 7. SPRINT 15: INTEGRATIONS & WEBHOOKS

### 7.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `integrations` | High |
| Dynamic Screen | `webhook-config` | Medium |
| Fixed Screen | `webhook-tester` | Low |
| Fixed Screen | `api-explorer` | Low |
| Hook | `useIntegrationsQuery` | High |
| Hook | `useWebhooksQuery` | Medium |
| Hook | `useConfigureIntegration` | High |
| DB Table | `integrations` | High |
| DB Table | `webhooks` | High |
| DB Table | `webhook_logs` | Medium |

### 7.2 Key Features

```
Integrations Hub:
├── Available integrations
│   ├── Payment gateways
│   ├── Communication (SMS, Email)
│   ├── Storage (S3, GCS)
│   ├── Analytics
│   └── LMS platforms
├── Active integrations
│   ├── Status indicator
│   ├── Last sync time
│   ├── Error count
│   └── Quick actions
├── Integration detail
│   ├── Configuration
│   ├── Credentials management
│   ├── Sync settings
│   └── Logs
└── Add new integration

Webhooks:
├── Webhook list
│   ├── URL
│   ├── Events subscribed
│   ├── Status
│   └── Last triggered
├── Create webhook
│   ├── URL configuration
│   ├── Event selection
│   ├── Secret key
│   └── Retry settings
├── Webhook logs
│   ├── Request/response
│   ├── Status codes
│   └── Retry attempts
└── Webhook tester
```

### 7.3 Sprint 15 Checkpoint

✅ **Test Criteria:**
- [ ] Integrations screen loads
- [ ] Available integrations list shows
- [ ] Can configure integration
- [ ] Integration status updates
- [ ] Webhook list shows
- [ ] Can create new webhook
- [ ] Webhook logs display
- [ ] Webhook tester works

---

## 8. SPRINT 16: OPERATIONS HUB

### 8.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `operations-hub` | High |
| Dynamic Screen | `automation-rules` | Medium |
| Widget | `ops.stats` | High |
| Widget | `ops.task-queue` | High |
| Widget | `ops.automation-rules` | Medium |
| Widget | `ops.schedules` | Medium |
| Widget | `ops.alerts` | Medium |
| Hook | `useOperationsQuery` | High |
| Hook | `useAutomationRulesQuery` | Medium |
| Hook | `useCreateAutomation` | Medium |
| DB Table | `automation_rules` | High |
| DB Table | `scheduled_tasks` | High |
| DB Table | `task_queue` | High |

### 8.2 Key Features

```
Operations Hub:
├── Operations overview
│   ├── Tasks completed today
│   ├── Pending tasks
│   ├── Failed tasks
│   └── Automation runs
├── Task queue
│   ├── Pending tasks list
│   ├── Priority ordering
│   ├── Manual trigger
│   └── Cancel/retry
├── Automation rules
│   ├── Active rules list
│   ├── Trigger conditions
│   ├── Actions
│   └── Enable/disable
├── Scheduled tasks
│   ├── Cron jobs list
│   ├── Next run time
│   ├── Last run status
│   └── Edit schedule
└── Operational alerts
    ├── Alert rules
    ├── Notification channels
    └── Alert history
```

### 8.3 Widget Specifications

**TaskQueueWidget**
- Pending tasks list
- Task type & priority
- Estimated time
- Manual run button
- Cancel button

**AutomationRulesWidget**
- Active rules count
- Rules list with triggers
- Last triggered time
- Toggle enable/disable

### 8.4 Sprint 16 Checkpoint

✅ **Test Criteria:**
- [ ] Operations hub loads
- [ ] Task queue shows pending tasks
- [ ] Can manually trigger tasks
- [ ] Automation rules list shows
- [ ] Can create new automation
- [ ] Scheduled tasks display
- [ ] Operational alerts work

---

## 9. SPRINT 17: STRATEGIC PLANNING & ADVANCED

### 9.1 Deliverables

| Type | Item | Priority |
|------|------|----------|
| Dynamic Screen | `strategic-planning` | Medium |
| Dynamic Screen | `forecasts` | Medium |
| Fixed Screen | `database-admin` | Low |
| Fixed Screen | `legal-admin` | Low |
| Widget | `strategic.goals-tracker` | Medium |
| Hook | `useStrategicPlanningQuery` | Medium |
| Hook | `useForecastsQuery` | Medium |
| DB Table | `strategic_goals` | Medium |
| DB Table | `forecasts` | Medium |

### 9.2 Key Features

```
Strategic Planning:
├── Goals tracker
│   ├── Annual goals
│   ├── Quarterly objectives
│   ├── Key results
│   └── Progress tracking
├── Roadmap
│   ├── Feature roadmap
│   ├── Timeline view
│   ├── Dependencies
│   └── Status updates
├── Forecasts
│   ├── Revenue forecasts
│   ├── User growth forecasts
│   ├── Resource planning
│   └── Scenario modeling
├── Initiatives
│   ├── Active initiatives
│   ├── Budget allocation
│   ├── Team assignments
│   └── Milestones
└── Reports
    ├── Executive summary
    ├── Board reports
    └── Investor updates

Database Admin (Technical):
├── Query explorer
├── Table browser
├── Index management
├── Performance tuning
└── Data cleanup tools

Legal Admin:
├── Terms of service management
├── Privacy policy management
├── Consent tracking
├── Legal document versions
└── Compliance certificates
```

### 9.3 Sprint 17 Checkpoint

✅ **Test Criteria:**
- [ ] Strategic planning screen loads
- [ ] Goals tracker shows objectives
- [ ] Forecasts display projections
- [ ] Database admin tools work (if enabled)
- [ ] Legal documents can be managed

---

## 10. DATABASE SCHEMA

```sql
-- Sprint 10: System Monitoring
CREATE TABLE server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id TEXT NOT NULL,
  cpu_usage INTEGER,
  memory_usage INTEGER,
  disk_usage INTEGER,
  network_in BIGINT,
  network_out BIGINT,
  active_connections INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT,
  status_code INTEGER,
  response_time INTEGER,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 11: Security & Compliance
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  requirement TEXT NOT NULL,
  status TEXT CHECK (status IN ('compliant', 'non_compliant', 'partial', 'not_applicable')),
  evidence TEXT,
  last_checked TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL,
  settings JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 12: Support Center
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  reporter_id UUID REFERENCES profiles(id),
  assignee_id UUID REFERENCES profiles(id),
  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  satisfaction_rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  responder_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 13: AI Management
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  feature TEXT NOT NULL,
  model TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost DECIMAL(10,6),
  response_time INTEGER,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  alert_threshold INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 14: Bulk Operations
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  errors JSONB,
  started_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT CHECK (backup_type IN ('full', 'incremental', 'selective')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_url TEXT,
  file_size BIGINT,
  tables_included TEXT[],
  started_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 15: Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  config JSONB,
  credentials JSONB, -- Encrypted
  status TEXT CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 3,
  last_triggered TIMESTAMPTZ,
  last_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 16: Operations
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMPTZ,
  last_status TEXT,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  payload JSONB,
  priority INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 17: Strategic Planning
CREATE TABLE strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('annual', 'quarterly', 'monthly')),
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2) DEFAULT 0,
  unit TEXT,
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'behind', 'completed')),
  owner_id UUID REFERENCES profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_value DECIMAL(12,2),
  actual_value DECIMAL(12,2),
  confidence DECIMAL(5,2),
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. PLATFORM STUDIO CONFIG

Add to `platform-studio/src/config/widgetRegistry.ts`:

```typescript
export const ADMIN_PHASE2_WIDGETS = {
  // System Monitoring
  'system.health-banner': { component: 'SystemHealthBannerWidget', category: 'system' },
  'system.server-stats': { component: 'ServerStatsWidget', category: 'stats' },
  'system.api-metrics': { component: 'APIMetricsWidget', category: 'stats' },
  'system.error-rates': { component: 'ErrorRatesWidget', category: 'chart' },
  'system.uptime-chart': { component: 'UptimeChartWidget', category: 'chart' },
  'system.active-users': { component: 'ActiveUsersWidget', category: 'stats' },

  // Compliance
  'compliance.score': { component: 'ComplianceScoreWidget', category: 'stats' },
  'compliance.audit-summary': { component: 'AuditSummaryWidget', category: 'stats' },
  'compliance.violations': { component: 'ViolationsWidget', category: 'list' },
  'compliance.remediation': { component: 'RemediationWidget', category: 'list' },
  'compliance.reports': { component: 'ComplianceReportsWidget', category: 'list' },

  // Support
  'support.ticket-stats': { component: 'TicketStatsWidget', category: 'stats' },
  'support.ticket-list': { component: 'TicketListWidget', category: 'list' },
  'support.escalations': { component: 'EscalationsWidget', category: 'list' },
  'support.response-times': { component: 'ResponseTimesWidget', category: 'stats' },
  'support.satisfaction': { component: 'SatisfactionWidget', category: 'chart' },

  // AI Management
  'ai.usage-stats': { component: 'AIUsageStatsWidget', category: 'stats' },
  'ai.model-stats': { component: 'AIModelStatsWidget', category: 'stats' },
  'ai.budget-tracker': { component: 'AIBudgetTrackerWidget', category: 'stats' },
  'ai.feature-toggles': { component: 'AIFeatureTogglesWidget', category: 'actions' },
  'ai.audit-log': { component: 'AIAuditLogWidget', category: 'list' },

  // Operations
  'ops.stats': { component: 'OpsStatsWidget', category: 'stats' },
  'ops.task-queue': { component: 'TaskQueueWidget', category: 'list' },
  'ops.automation-rules': { component: 'AutomationRulesWidget', category: 'list' },
  'ops.schedules': { component: 'SchedulesWidget', category: 'list' },
  'ops.alerts': { component: 'OpsAlertsWidget', category: 'list' },

  // Strategic
  'strategic.goals-tracker': { component: 'GoalsTrackerWidget', category: 'stats' },
};
```

---

## 12. PHASE 2 SUMMARY

### Total Deliverables

| Category | Count |
|----------|-------|
| Fixed Screens | 8 |
| Dynamic Screens | 13 |
| Widgets | 22 |
| Query Hooks | 13 |
| Mutation Hooks | 10 |
| DB Tables | 12 |

### Priority Order

1. **High Priority (Sprint 10-13):** System Monitoring, Security, Support, AI
2. **Medium Priority (Sprint 14-16):** Bulk Ops, Integrations, Operations
3. **Low Priority (Sprint 17):** Strategic Planning, Advanced Tools

### Dependencies

- Phase 1 must be complete before starting Phase 2
- Sprint 10-13 can run in parallel
- Sprint 14-17 depend on earlier sprints

---

**Document Complete. Phase 2 ready for implementation after Phase 1 demo.**
