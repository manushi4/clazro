# AI Implementation Appendix - Production Ready Reference

> This appendix provides concrete implementation details for all AI documentation guides.
> It bridges strategic documentation with your existing codebase and Supabase schema.

---

## 0. Current State (What Already Exists)

### 0.1 Existing AI Tables in Supabase

| Table | Rows | RLS | Purpose |
|-------|------|-----|---------|
| `ai_insights` | 5 | No | Parent AI insights (performance, attendance, recommendations) |
| `ai_predictions` | 5 | No | Student performance predictions |
| `ai_recommendations` | 6 | Yes | Study/practice recommendations |
| `ai_alerts` | 6 | Yes | Academic/attendance/behavior alerts |

### 0.2 Existing AI Permission

```sql
-- Already exists in permissions table
SELECT * FROM permissions WHERE permission_code = 'ai.tutor.use';
-- Returns: ai.tutor.use | Use AI Tutor | Can use AI tutor feature | premium
```

### 0.3 Existing AI Widgets

**Mobile App (`src/config/widgetRegistry.ts`):**
| Widget ID | Component | Feature ID |
|-----------|-----------|------------|
| `ai.recommendations` | RecommendationsWidget | `ai.tutor` |
| `parent.ai-insights-preview` | AIInsightsPreviewWidget | `parent.ai-insights` |
| `parent.ai-predictions` | ParentAIPredictionsWidget | `parent.ai-predictions` |
| `parent.ai-recommendations` | ParentAIRecommendationsWidget | `parent.ai-recommendations` |
| `parent.ai-alerts` | ParentAIAlertsWidget | `parent.ai-alerts` |

**Platform Studio (`platform-studio/src/config/widgetRegistry.ts`):**
| Widget ID | Status |
|-----------|--------|
| `ai.tutor-chat` | Registry only (component not implemented) |
| `ai.summary` | Registry only (component not implemented) |
| `ai.practice` | Registry only (component not implemented) |

---

## 1. Existing System Integration Map

### 1.1 Tables AI Features Must Reference

| Existing Table | AI Integration Point |
|----------------|---------------------|
| `customers` | `customer_id` for tenant isolation, `metadata` JSONB for AI config |
| `user_profiles` | `user_id`, `role`, age calculation for audience profile |
| `permissions` | Extend with AI permission codes (already has `ai.tutor.use`) |
| `role_permissions` | Map AI permissions to roles |
| `customer_role_permissions` | Tenant-specific AI permission overrides |
| `analytics_events` | AI usage tracking |
| `ai_insights` | ✅ EXISTS - Parent AI insights |
| `ai_predictions` | ✅ EXISTS - Student predictions |
| `ai_recommendations` | ✅ EXISTS - Study recommendations |
| `ai_alerts` | ✅ EXISTS - Academic alerts |

### 1.2 Existing Code Patterns to Follow

| Pattern | Existing File | AI Extension |
|---------|--------------|--------------|
| Config Service | `src/services/config/configService.ts` | Add `fetchAIConfig()` |
| Permission Hook | `src/hooks/usePermissions.ts` | Add AI permission codes |
| Widget Registry | `src/config/widgetRegistry.ts` | ✅ AI widgets already exist |
| Supabase Client | `src/lib/supabaseClient.ts` | Reuse for AI tables |
| Platform Studio Service | `platform-studio/src/services/configService.ts` | Add AI config CRUD |

---

## 2. Database Schema - AI Tables (Registry Pattern)

> **Design Pattern**: Same as widgets - Global Definitions + Per-Customer Assignments
> This allows unlimited AI features, providers, tools, and automations without code changes.

### 2.1 Pattern Overview

| Entity | Definition Table (Global Catalog) | Assignment Table (Per-Customer) | Status |
|--------|----------------------------------|--------------------------------|--------|
| Widgets | `widget_definitions` | `screen_layouts` | ✅ EXISTS |
| **AI Content** | — | `ai_insights`, `ai_predictions`, `ai_recommendations`, `ai_alerts` | ✅ EXISTS |
| **AI Features** | `ai_feature_definitions` | `customer_ai_features` | TO CREATE |
| **AI Providers** | `ai_provider_definitions` | `customer_ai_providers` | TO CREATE |
| **AI Models** | `ai_model_definitions` | `customer_ai_models` | TO CREATE |
| **MCP Tools** | `mcp_tool_definitions` | `customer_mcp_tools` | TO CREATE |
| **Automations** | `automation_definitions` | `customer_automations` | TO CREATE |
| **Prompts** | `prompt_definitions` | `customer_prompts` | TO CREATE |
| **Audience Profiles** | `audience_profile_definitions` | `customer_audience_profiles` | TO CREATE |

### 2.2 AI Feature Tables (TO CREATE)

```sql
-- ============================================================
-- AI FEATURES (Like widget_definitions + screen_layouts)
-- ============================================================

-- Global AI Feature Catalog (add unlimited features here)
CREATE TABLE ai_feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT UNIQUE NOT NULL,  -- 'ai_chat', 'ai_summary', 'ai_copilot', 'ai_practice'
  name TEXT NOT NULL,
  name_hi TEXT,
  description TEXT,
  description_hi TEXT,
  category TEXT NOT NULL,  -- 'chat', 'generation', 'analysis', 'copilot', 'assistant'
  capability_class TEXT NOT NULL,  -- 'SAFE_GUIDED_CHAT', 'GENERAL_CHAT', 'DEEP_REASONING', etc.
  icon TEXT DEFAULT 'bot',
  -- Defaults
  default_output_mode TEXT DEFAULT 'TEXT',  -- 'TEXT', 'JSON', 'SCHEMA'
  default_tools_policy TEXT DEFAULT 'TOOLS_DISABLED',
  default_max_tokens INTEGER DEFAULT 1000,
  default_temperature DECIMAL(3,2) DEFAULT 0.7,
  default_config JSONB DEFAULT '{}',
  -- Metadata
  min_role_level INTEGER DEFAULT 1,  -- 1=student, 2=parent, 3=teacher, 4=admin
  requires_consent BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer AI Feature Assignment (enable/configure per tenant)
CREATE TABLE customer_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES ai_feature_definitions(feature_id) ON DELETE CASCADE,
  -- Role & Profile Access
  enabled_roles TEXT[] DEFAULT '{}',  -- ['student', 'teacher', 'parent', 'admin']
  enabled_profiles TEXT[] DEFAULT '{}',  -- ['kid', 'teen', 'adult', 'coaching']
  -- Overrides
  output_mode TEXT,  -- Override default
  tools_policy TEXT,  -- Override default
  allowed_tools TEXT[] DEFAULT '{}',
  max_tokens INTEGER,
  temperature DECIMAL(3,2),
  config JSONB DEFAULT '{}',  -- Any custom config
  -- Branding
  custom_name TEXT,
  custom_name_hi TEXT,
  custom_icon TEXT,
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, feature_id)
);
```

### 2.3 AI Provider Tables (TO CREATE)

```sql
-- ============================================================
-- AI PROVIDERS (Global catalog + per-customer enablement)
-- ============================================================

-- Global AI Provider Catalog
CREATE TABLE ai_provider_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT UNIQUE NOT NULL,  -- 'openai', 'anthropic', 'google', 'bedrock', 'custom_llm'
  name TEXT NOT NULL,
  description TEXT,
  api_type TEXT NOT NULL,  -- 'openai_compatible', 'anthropic', 'google', 'bedrock', 'custom'
  api_base_url TEXT,
  -- Capabilities
  supported_capabilities TEXT[] DEFAULT '{}',  -- ['chat', 'summarization', 'extraction', 'vision']
  supports_streaming BOOLEAN DEFAULT true,
  supports_tools BOOLEAN DEFAULT false,
  supports_json_mode BOOLEAN DEFAULT false,
  -- Defaults
  default_config JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer AI Provider Assignment
CREATE TABLE customer_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  provider_id TEXT REFERENCES ai_provider_definitions(provider_id) ON DELETE CASCADE,
  -- Credentials (reference to secrets manager)
  api_key_ref TEXT,  -- 'vault://ai/openai/customer_123'
  -- Configuration
  enabled_models TEXT[] DEFAULT '{}',  -- Which models from this provider
  routing_priority INTEGER DEFAULT 100,  -- Lower = higher priority
  max_requests_per_minute INTEGER,
  max_tokens_per_day INTEGER,
  config JSONB DEFAULT '{}',
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, provider_id)
);
```

### 2.4 AI Model Tables (TO CREATE)

```sql
-- ============================================================
-- AI MODELS (Global catalog + per-customer enablement)
-- ============================================================

-- Global AI Model Catalog
CREATE TABLE ai_model_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT UNIQUE NOT NULL,  -- 'gpt-4o', 'gpt-4o-mini', 'claude-3-sonnet'
  provider_id TEXT REFERENCES ai_provider_definitions(provider_id),
  name TEXT NOT NULL,
  description TEXT,
  -- Capabilities
  capability_classes TEXT[] DEFAULT '{}',  -- ['GENERAL_CHAT', 'SUMMARIZATION']
  tier TEXT DEFAULT 'standard',  -- 'cheap', 'standard', 'premium'
  context_window INTEGER DEFAULT 4096,
  max_output_tokens INTEGER DEFAULT 4096,
  supports_vision BOOLEAN DEFAULT false,
  supports_tools BOOLEAN DEFAULT false,
  supports_json_mode BOOLEAN DEFAULT false,
  -- Costs
  cost_per_1k_input DECIMAL(10,6),
  cost_per_1k_output DECIMAL(10,6),
  -- Defaults
  default_temperature DECIMAL(3,2) DEFAULT 0.7,
  default_config JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_deprecated BOOLEAN DEFAULT false,
  replacement_model_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer AI Model Assignment
CREATE TABLE customer_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  model_id TEXT REFERENCES ai_model_definitions(model_id) ON DELETE CASCADE,
  -- Usage Rules
  allowed_features TEXT[] DEFAULT '{}',  -- Which features can use this model
  allowed_roles TEXT[] DEFAULT '{}',
  allowed_profiles TEXT[] DEFAULT '{}',
  -- Overrides
  max_tokens INTEGER,
  temperature DECIMAL(3,2),
  config JSONB DEFAULT '{}',
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,  -- Default model for this customer
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, model_id)
);
```

### 2.5 MCP Tool Tables (TO CREATE)

```sql
-- ============================================================
-- MCP TOOLS (Global catalog + per-customer enablement)
-- ============================================================

-- Global MCP Tool Catalog
CREATE TABLE mcp_tool_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT UNIQUE NOT NULL,  -- 'calendar', 'email', 'docs', 'sheets', 'custom_crm'
  name TEXT NOT NULL,
  name_hi TEXT,
  description TEXT,
  description_hi TEXT,
  category TEXT NOT NULL,  -- 'productivity', 'communication', 'data', 'integration', 'custom'
  icon TEXT DEFAULT 'tool',
  -- MCP Configuration
  mcp_server_url TEXT,
  mcp_server_type TEXT,  -- 'stdio', 'http', 'websocket'
  -- Actions
  actions JSONB DEFAULT '[]',  -- [{action_id, name, description, input_schema, output_schema}]
  -- Security
  required_scopes TEXT[] DEFAULT '{}',
  risk_level TEXT DEFAULT 'low',  -- 'low', 'medium', 'high', 'critical'
  requires_approval BOOLEAN DEFAULT false,
  -- Defaults
  default_config JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer MCP Tool Assignment
CREATE TABLE customer_mcp_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  tool_id TEXT REFERENCES mcp_tool_definitions(tool_id) ON DELETE CASCADE,
  -- Access Control
  enabled_roles TEXT[] DEFAULT '{}',
  enabled_profiles TEXT[] DEFAULT '{}',
  allowed_actions TEXT[] DEFAULT '{}',  -- Subset of tool's actions
  -- Credentials
  oauth_credentials JSONB DEFAULT '{}',
  api_key_ref TEXT,
  -- Configuration
  config JSONB DEFAULT '{}',
  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approval_roles TEXT[] DEFAULT '{}',  -- Who can approve
  -- Branding
  custom_name TEXT,
  custom_name_hi TEXT,
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, tool_id)
);
```

### 2.6 Automation Tables (TO CREATE)

```sql
-- ============================================================
-- AUTOMATIONS (Global catalog + per-customer enablement)
-- ============================================================

-- Global Automation Catalog
CREATE TABLE automation_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id TEXT UNIQUE NOT NULL,  -- 'auto_grade', 'weekly_report', 'attendance_alert'
  name TEXT NOT NULL,
  name_hi TEXT,
  description TEXT,
  description_hi TEXT,
  category TEXT NOT NULL,  -- 'grading', 'notifications', 'reports', 'reminders', 'custom'
  icon TEXT DEFAULT 'zap',
  -- Trigger
  trigger_type TEXT NOT NULL,  -- 'event', 'schedule', 'manual', 'condition', 'webhook'
  trigger_config JSONB DEFAULT '{}',  -- {event_name, cron, conditions}
  -- Steps
  steps JSONB DEFAULT '[]',  -- [{step_id, action_type, action_config, conditions}]
  -- Defaults
  default_config JSONB DEFAULT '{}',
  -- Security
  risk_level TEXT DEFAULT 'low',
  requires_approval BOOLEAN DEFAULT false,
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer Automation Assignment
CREATE TABLE customer_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  automation_id TEXT REFERENCES automation_definitions(automation_id) ON DELETE CASCADE,
  -- Access Control
  enabled_roles TEXT[] DEFAULT '{}',
  enabled_profiles TEXT[] DEFAULT '{}',
  -- Overrides
  trigger_overrides JSONB DEFAULT '{}',
  step_overrides JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approval_roles TEXT[] DEFAULT '{}',
  -- Branding
  custom_name TEXT,
  custom_name_hi TEXT,
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, automation_id)
);
```

### 2.7 Prompt & Audience Profile Tables (TO CREATE)

```sql
-- ============================================================
-- PROMPTS (Global catalog + per-customer customization)
-- ============================================================

-- Global Prompt Catalog
CREATE TABLE prompt_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT UNIQUE NOT NULL,  -- 'chat_system', 'summary_template', 'copilot_assistant'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'system', 'user', 'assistant', 'template'
  -- Content
  system_prompt TEXT NOT NULL,
  user_template TEXT,
  variables JSONB DEFAULT '[]',  -- [{name, type, required, default}]
  -- Targeting
  target_features TEXT[] DEFAULT '{}',
  target_profiles TEXT[] DEFAULT '{}',
  -- Safety
  forbidden_patterns TEXT[] DEFAULT '{}',
  safety_policy_version TEXT,
  -- Status
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer Prompt Customization
CREATE TABLE customer_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  prompt_id TEXT REFERENCES prompt_definitions(prompt_id) ON DELETE CASCADE,
  -- Overrides
  system_prompt_override TEXT,
  user_template_override TEXT,
  variables_override JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, prompt_id)
);

-- ============================================================
-- AUDIENCE PROFILES (Global catalog + per-customer customization)
-- ============================================================

-- Global Audience Profile Catalog
CREATE TABLE audience_profile_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT UNIQUE NOT NULL,  -- 'kid', 'teen', 'adult', 'coaching'
  name TEXT NOT NULL,
  name_hi TEXT,
  description TEXT,
  -- Age Rules
  min_age INTEGER,
  max_age INTEGER,
  -- Behavior Defaults
  tone TEXT DEFAULT 'friendly',
  max_response_length INTEGER DEFAULT 500,
  allowed_topics TEXT[] DEFAULT '{}',
  forbidden_topics TEXT[] DEFAULT '{}',
  -- Tool Policy
  tools_allowed BOOLEAN DEFAULT false,
  allowed_tool_categories TEXT[] DEFAULT '{}',
  -- Safety
  safety_level TEXT DEFAULT 'standard',  -- 'strict', 'standard', 'relaxed'
  require_parent_visibility BOOLEAN DEFAULT false,
  require_human_escalation BOOLEAN DEFAULT false,
  -- Defaults
  default_config JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-Customer Audience Profile Customization
CREATE TABLE customer_audience_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES audience_profile_definitions(profile_id) ON DELETE CASCADE,
  -- Overrides (can only be stricter, not looser for safety)
  max_response_length INTEGER,
  forbidden_topics_extra TEXT[] DEFAULT '{}',  -- Additional forbidden topics
  tools_allowed BOOLEAN,  -- Can only disable, not enable for kids
  config JSONB DEFAULT '{}',
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, profile_id)
);
```

### 2.8 Supporting Tables (Budgets, Kill Switches, Audit) (TO CREATE)

```sql
-- ============================================================
-- AI ROUTING RULES (Per-customer, references definitions)
-- ============================================================

CREATE TABLE customer_ai_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  priority INTEGER DEFAULT 100,
  -- Conditions (reference definition IDs)
  feature_ids TEXT[] DEFAULT '{}',
  profile_ids TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',
  -- Routing (reference definition IDs)
  primary_model_id TEXT REFERENCES ai_model_definitions(model_id),
  fallback_model_ids TEXT[] DEFAULT '{}',
  -- Constraints
  max_tokens INTEGER,
  temperature DECIMAL(3,2),
  latency_sla_ms INTEGER,
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AI BUDGETS (Per-customer)
-- ============================================================

CREATE TABLE customer_ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  budget_type TEXT NOT NULL,  -- 'tenant', 'feature', 'user', 'model'
  reference_id TEXT,  -- feature_id, user_id, model_id
  -- Limits
  daily_limit_usd DECIMAL(10,2),
  monthly_limit_usd DECIMAL(10,2),
  daily_token_limit INTEGER,
  monthly_token_limit INTEGER,
  -- Current Usage
  current_daily_spend DECIMAL(10,2) DEFAULT 0,
  current_monthly_spend DECIMAL(10,2) DEFAULT 0,
  current_daily_tokens INTEGER DEFAULT 0,
  current_monthly_tokens INTEGER DEFAULT 0,
  -- Actions
  action_on_limit TEXT DEFAULT 'deny',
  -- Reset
  last_daily_reset TIMESTAMPTZ DEFAULT now(),
  last_monthly_reset TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, budget_type, reference_id)
);

-- ============================================================
-- AI KILL SWITCHES
-- ============================================================

CREATE TABLE ai_kill_switches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  switch_type TEXT NOT NULL,  -- 'global', 'tenant', 'feature', 'provider', 'model', 'tool', 'automation'
  reference_id TEXT,  -- customer_id, feature_id, provider_id, etc.
  is_active BOOLEAN DEFAULT false,
  activated_by UUID,
  activated_at TIMESTAMPTZ,
  reason TEXT,
  auto_reactivate_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(switch_type, reference_id)
);

-- ============================================================
-- AI AUDIT LOGS
-- ============================================================

CREATE TABLE ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  audience_profile TEXT,
  -- Request (reference definition IDs)
  feature_id TEXT,
  widget_id TEXT,
  input_hash TEXT,
  context_refs JSONB DEFAULT '{}',
  -- Execution (reference definition IDs)
  provider_id TEXT,
  model_id TEXT,
  prompt_id TEXT,
  tools_used TEXT[] DEFAULT '{}',
  -- Response
  status TEXT NOT NULL,
  refusal_reason TEXT,
  safety_flags TEXT[] DEFAULT '{}',
  fallback_path TEXT[],
  -- Metrics
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_audit_trace ON ai_audit_logs(trace_id);
CREATE INDEX idx_ai_audit_customer ON ai_audit_logs(customer_id, created_at);
CREATE INDEX idx_ai_audit_user ON ai_audit_logs(user_id, created_at);
CREATE INDEX idx_ai_audit_feature ON ai_audit_logs(feature_id, created_at);
```

### 2.9 Extend Existing Tables (TO RUN)

```sql
-- ============================================================
-- EXISTING AI PERMISSION (Already in database)
-- ============================================================
-- ai.tutor.use | Use AI Tutor | Can use AI tutor feature | premium

-- ============================================================
-- ADD NEW AI PERMISSIONS (TO RUN)
-- ============================================================
INSERT INTO permissions (permission_code, name, description, category) VALUES
  ('ai.chat.use', 'Use AI Chat', 'Access AI chat features', 'ai'),
  ('ai.summary.use', 'Use AI Summaries', 'Generate AI summaries', 'ai'),
  ('ai.copilot.use', 'Use AI Copilot', 'Access AI copilot features', 'ai'),
  ('ai.tools.use', 'Use AI Tools', 'Allow AI to use tools', 'ai'),
  ('ai.automation.trigger', 'Trigger Automations', 'Trigger automated workflows', 'ai'),
  ('ai.config.view', 'View AI Config', 'View AI configuration', 'ai'),
  ('ai.config.manage', 'Manage AI Config', 'Modify AI configuration', 'ai'),
  ('ai.budget.view', 'View AI Budget', 'View AI usage and budgets', 'ai'),
  ('ai.audit.view', 'View AI Audit', 'View AI audit logs', 'ai'),
  ('ai.killswitch.manage', 'Manage Kill Switches', 'Activate/deactivate AI kill switches', 'ai')
ON CONFLICT (permission_code) DO NOTHING;

-- Add default role permissions for AI (TO RUN)
INSERT INTO role_permissions (role, permission_code) VALUES
  ('student', 'ai.chat.use'),
  ('student', 'ai.summary.use'),
  ('teacher', 'ai.chat.use'),
  ('teacher', 'ai.summary.use'),
  ('teacher', 'ai.copilot.use'),
  ('teacher', 'ai.tools.use'),
  ('parent', 'ai.summary.use'),
  ('admin', 'ai.config.view'),
  ('admin', 'ai.config.manage'),
  ('admin', 'ai.budget.view'),
  ('admin', 'ai.audit.view'),
  ('admin', 'ai.killswitch.manage')
ON CONFLICT DO NOTHING;

-- Extend customer_branding for AI (TO RUN)
ALTER TABLE customer_branding ADD COLUMN IF NOT EXISTS ai_avatar_url TEXT;
ALTER TABLE customer_branding ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT 'friendly';
ALTER TABLE customer_branding ADD COLUMN IF NOT EXISTS ai_greeting_en TEXT DEFAULT 'Hi! How can I help you today?';
ALTER TABLE customer_branding ADD COLUMN IF NOT EXISTS ai_greeting_hi TEXT;
```

---

## 3. TypeScript Type Definitions (Registry Pattern)

> **Pattern**: Same as widgets - Definition types (global catalog) + Assignment types (per-customer)
> **Status**: TO CREATE - File `src/types/ai.types.ts` does not exist yet

### 3.1 Core Enums & Base Types (`src/types/ai.types.ts` - TO CREATE)

```typescript
// ============================================================
// CORE ENUMS
// ============================================================

export type Role = 'student' | 'parent' | 'teacher' | 'admin';

export type AudienceProfile = 'kid' | 'teen' | 'adult' | 'coaching';

export type CapabilityClass = 
  | 'SAFE_GUIDED_CHAT'
  | 'GENERAL_CHAT'
  | 'DEEP_REASONING'
  | 'SUMMARIZATION'
  | 'STRUCTURED_EXTRACTION'
  | 'CLASSIFICATION'
  | 'MULTIMODAL_VISION'
  | 'EMBEDDINGS';

export type OutputMode = 'TEXT' | 'JSON' | 'SCHEMA';

export type ToolsPolicy = 'TOOLS_DISABLED' | 'TOOLS_ALLOWED' | 'TOOLS_REQUIRED';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type SafetyLevel = 'strict' | 'standard' | 'relaxed';

export type TriggerType = 'event' | 'schedule' | 'manual' | 'condition' | 'webhook';

export type MCPServerType = 'stdio' | 'http' | 'websocket';

// ============================================================
// AI FEATURE TYPES (Definition + Assignment)
// ============================================================

// Global AI Feature Definition (catalog)
export type AIFeatureDefinition = {
  id: string;
  featureId: string;  // 'ai_chat', 'ai_summary', 'ai_copilot'
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;  // 'chat', 'generation', 'analysis', 'copilot'
  capabilityClass: CapabilityClass;
  icon: string;
  // Defaults
  defaultOutputMode: OutputMode;
  defaultToolsPolicy: ToolsPolicy;
  defaultMaxTokens: number;
  defaultTemperature: number;
  defaultConfig: Record<string, unknown>;
  // Metadata
  minRoleLevel: number;  // 1=student, 2=parent, 3=teacher, 4=admin
  requiresConsent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer AI Feature Assignment
export type CustomerAIFeature = {
  id: string;
  customerId: string;
  featureId: string;  // References AIFeatureDefinition.featureId
  // Role & Profile Access
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  // Overrides
  outputMode?: OutputMode;
  toolsPolicy?: ToolsPolicy;
  allowedTools: string[];
  maxTokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  // Branding
  customName?: string;
  customNameHi?: string;
  customIcon?: string;
  // Status
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AI PROVIDER TYPES (Definition + Assignment)
// ============================================================

// Global AI Provider Definition (catalog)
export type AIProviderDefinition = {
  id: string;
  providerId: string;  // 'openai', 'anthropic', 'google', 'bedrock'
  name: string;
  description?: string;
  apiType: string;  // 'openai_compatible', 'anthropic', 'google', 'bedrock'
  apiBaseUrl?: string;
  // Capabilities
  supportedCapabilities: string[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsJsonMode: boolean;
  // Defaults
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer AI Provider Assignment
export type CustomerAIProvider = {
  id: string;
  customerId: string;
  providerId: string;  // References AIProviderDefinition.providerId
  // Credentials
  apiKeyRef?: string;  // 'vault://ai/openai/customer_123'
  // Configuration
  enabledModels: string[];
  routingPriority: number;
  maxRequestsPerMinute?: number;
  maxTokensPerDay?: number;
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AI MODEL TYPES (Definition + Assignment)
// ============================================================

// Global AI Model Definition (catalog)
export type AIModelDefinition = {
  id: string;
  modelId: string;  // 'gpt-4o', 'gpt-4o-mini', 'claude-3-sonnet'
  providerId: string;  // References AIProviderDefinition.providerId
  name: string;
  description?: string;
  // Capabilities
  capabilityClasses: CapabilityClass[];
  tier: 'cheap' | 'standard' | 'premium';
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsJsonMode: boolean;
  // Costs
  costPer1kInput?: number;
  costPer1kOutput?: number;
  // Defaults
  defaultTemperature: number;
  defaultConfig: Record<string, unknown>;
  // Status
  isActive: boolean;
  isDeprecated: boolean;
  replacementModelId?: string;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer AI Model Assignment
export type CustomerAIModel = {
  id: string;
  customerId: string;
  modelId: string;  // References AIModelDefinition.modelId
  // Usage Rules
  allowedFeatures: string[];
  allowedRoles: Role[];
  allowedProfiles: AudienceProfile[];
  // Overrides
  maxTokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  // Status
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// MCP TOOL TYPES (Definition + Assignment)
// ============================================================

// MCP Tool Action Schema
export type MCPToolAction = {
  actionId: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

// Global MCP Tool Definition (catalog)
export type MCPToolDefinition = {
  id: string;
  toolId: string;  // 'calendar', 'email', 'docs', 'sheets'
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;  // 'productivity', 'communication', 'data', 'integration'
  icon: string;
  // MCP Configuration
  mcpServerUrl?: string;
  mcpServerType: MCPServerType;
  // Actions
  actions: MCPToolAction[];
  // Security
  requiredScopes: string[];
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  // Defaults
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer MCP Tool Assignment
export type CustomerMCPTool = {
  id: string;
  customerId: string;
  toolId: string;  // References MCPToolDefinition.toolId
  // Access Control
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  allowedActions: string[];  // Subset of tool's actions
  // Credentials
  oauthCredentials: Record<string, unknown>;
  apiKeyRef?: string;
  // Configuration
  config: Record<string, unknown>;
  // Approval
  requiresApproval: boolean;
  approvalRoles: Role[];
  // Branding
  customName?: string;
  customNameHi?: string;
  // Status
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AUTOMATION TYPES (Definition + Assignment)
// ============================================================

// Automation Step Schema
export type AutomationStep = {
  stepId: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  conditions?: Record<string, unknown>;
};

// Global Automation Definition (catalog)
export type AutomationDefinition = {
  id: string;
  automationId: string;  // 'auto_grade', 'weekly_report', 'attendance_alert'
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;  // 'grading', 'notifications', 'reports', 'reminders'
  icon: string;
  // Trigger
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  // Steps
  steps: AutomationStep[];
  // Defaults
  defaultConfig: Record<string, unknown>;
  // Security
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer Automation Assignment
export type CustomerAutomation = {
  id: string;
  customerId: string;
  automationId: string;  // References AutomationDefinition.automationId
  // Access Control
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  // Overrides
  triggerOverrides: Record<string, unknown>;
  stepOverrides: Record<string, unknown>;
  config: Record<string, unknown>;
  // Approval
  requiresApproval: boolean;
  approvalRoles: Role[];
  // Branding
  customName?: string;
  customNameHi?: string;
  // Status
  isEnabled: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// PROMPT TYPES (Definition + Assignment)
// ============================================================

// Prompt Variable Schema
export type PromptVariable = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
};

// Global Prompt Definition (catalog)
export type PromptDefinition = {
  id: string;
  promptId: string;  // 'chat_system', 'summary_template', 'copilot_assistant'
  name: string;
  description?: string;
  category: string;  // 'system', 'user', 'assistant', 'template'
  // Content
  systemPrompt: string;
  userTemplate?: string;
  variables: PromptVariable[];
  // Targeting
  targetFeatures: string[];
  targetProfiles: AudienceProfile[];
  // Safety
  forbiddenPatterns: string[];
  safetyPolicyVersion?: string;
  // Status
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer Prompt Customization
export type CustomerPrompt = {
  id: string;
  customerId: string;
  promptId: string;  // References PromptDefinition.promptId
  // Overrides
  systemPromptOverride?: string;
  userTemplateOverride?: string;
  variablesOverride: PromptVariable[];
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AUDIENCE PROFILE TYPES (Definition + Assignment)
// ============================================================

// Global Audience Profile Definition (catalog)
export type AudienceProfileDefinition = {
  id: string;
  profileId: AudienceProfile;  // 'kid', 'teen', 'adult', 'coaching'
  name: string;
  nameHi?: string;
  description?: string;
  // Age Rules
  minAge?: number;
  maxAge?: number;
  // Behavior Defaults
  tone: string;
  maxResponseLength: number;
  allowedTopics: string[];
  forbiddenTopics: string[];
  // Tool Policy
  toolsAllowed: boolean;
  allowedToolCategories: string[];
  // Safety
  safetyLevel: SafetyLevel;
  requireParentVisibility: boolean;
  requireHumanEscalation: boolean;
  // Defaults
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer Audience Profile Customization
export type CustomerAudienceProfile = {
  id: string;
  customerId: string;
  profileId: AudienceProfile;  // References AudienceProfileDefinition.profileId
  // Overrides (can only be stricter for safety)
  maxResponseLength?: number;
  forbiddenTopicsExtra: string[];  // Additional forbidden topics
  toolsAllowed?: boolean;  // Can only disable, not enable for kids
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// SUPPORTING TYPES (Routing, Budgets, Kill Switches, Audit)
// ============================================================

// Per-Customer AI Routing Rule
export type CustomerAIRoutingRule = {
  id: string;
  customerId: string;
  ruleName: string;
  priority: number;
  // Conditions (reference definition IDs)
  featureIds: string[];
  profileIds: AudienceProfile[];
  roles: Role[];
  // Routing (reference definition IDs)
  primaryModelId: string;
  fallbackModelIds: string[];
  // Constraints
  maxTokens?: number;
  temperature?: number;
  latencySlaMsMs?: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-Customer AI Budget
export type CustomerAIBudget = {
  id: string;
  customerId: string;
  budgetType: 'tenant' | 'feature' | 'user' | 'model';
  referenceId?: string;  // feature_id, user_id, model_id
  // Limits
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  dailyTokenLimit?: number;
  monthlyTokenLimit?: number;
  // Current Usage
  currentDailySpend: number;
  currentMonthlySpend: number;
  currentDailyTokens: number;
  currentMonthlyTokens: number;
  // Actions
  actionOnLimit: 'deny' | 'degrade' | 'notify';
  // Reset
  lastDailyReset: string;
  lastMonthlyReset: string;
  createdAt: string;
  updatedAt: string;
};

// AI Kill Switch
export type AIKillSwitch = {
  id: string;
  switchType: 'global' | 'tenant' | 'feature' | 'provider' | 'model' | 'tool' | 'automation';
  referenceId?: string;  // customer_id, feature_id, provider_id, etc.
  isActive: boolean;
  activatedBy?: string;
  activatedAt?: string;
  reason?: string;
  autoReactivateAt?: string;
  createdAt: string;
  updatedAt: string;
};

// AI Audit Log Entry
export type AIAuditEntry = {
  id: string;
  traceId: string;
  customerId: string;
  userId: string;
  role: Role;
  audienceProfile?: AudienceProfile;
  // Request (reference definition IDs)
  featureId?: string;
  widgetId?: string;
  inputHash?: string;
  contextRefs: Record<string, string>;
  // Execution (reference definition IDs)
  providerId?: string;
  modelId?: string;
  promptId?: string;
  toolsUsed: string[];
  // Response
  status: 'success' | 'refused' | 'error' | 'fallback';
  refusalReason?: string;
  safetyFlags: string[];
  fallbackPath?: string[];
  // Metrics
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  latencyMs?: number;
  createdAt: string;
};

// ============================================================
// AI REQUEST/RESPONSE TYPES
// ============================================================

export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIExecuteRequest = {
  tenantId: string;
  userId: string;
  role: Role;
  audienceProfile: AudienceProfile;
  featureId: string;  // References AIFeatureDefinition.featureId
  widgetId?: string;
  input: {
    text?: string;
    messages?: AIMessage[];
  };
  contextRefs?: Record<string, string>;
  outputMode?: OutputMode;
  schemaId?: string;
  toolIntent?: 'none' | 'allowed' | 'required';
};

export type AIExecuteResponse = {
  traceId: string;
  status: 'success' | 'refused' | 'error';
  outputText?: string;
  outputJson?: Record<string, unknown>;
  safetyFlags: string[];
  provider?: string;
  model?: string;
  fallbackPath?: string[];
  usage?: {
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
  };
  error?: {
    code: string;
    message: string;
  };
};

// ============================================================
// RESOLVED CONFIG TYPES (Merged Definition + Assignment)
// ============================================================

// Resolved AI Feature (definition merged with customer assignment)
export type ResolvedAIFeature = AIFeatureDefinition & {
  customerConfig: CustomerAIFeature | null;
  effectiveOutputMode: OutputMode;
  effectiveToolsPolicy: ToolsPolicy;
  effectiveMaxTokens: number;
  effectiveTemperature: number;
  effectiveConfig: Record<string, unknown>;
  displayName: string;  // customName || name
  displayNameHi: string;  // customNameHi || nameHi
  displayIcon: string;  // customIcon || icon
};

// Resolved MCP Tool (definition merged with customer assignment)
export type ResolvedMCPTool = MCPToolDefinition & {
  customerConfig: CustomerMCPTool | null;
  effectiveActions: MCPToolAction[];  // Filtered by allowedActions
  effectiveConfig: Record<string, unknown>;
  displayName: string;
  displayNameHi: string;
};

// Resolved Automation (definition merged with customer assignment)
export type ResolvedAutomation = AutomationDefinition & {
  customerConfig: CustomerAutomation | null;
  effectiveTriggerConfig: Record<string, unknown>;
  effectiveSteps: AutomationStep[];
  effectiveConfig: Record<string, unknown>;
  displayName: string;
  displayNameHi: string;
};
```

---

## 4. API Endpoint Specifications

### 4.1 AI Execute Endpoint

```
POST /api/ai/execute
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "tenantId": "uuid",
  "userId": "string",
  "role": "student",
  "audienceProfile": "teen",
  "useCaseId": "ai_chat",
  "widgetId": "ai.tutor-chat",
  "input": {
    "text": "Explain photosynthesis"
  },
  "contextRefs": {
    "subjectId": "uuid",
    "chapterId": "uuid"
  },
  "outputMode": "TEXT"
}

Response (200):
{
  "traceId": "trace_abc123",
  "status": "success",
  "outputText": "Photosynthesis is the process...",
  "safetyFlags": [],
  "provider": "openai",
  "model": "gpt-4o-mini",
  "usage": {
    "tokensIn": 50,
    "tokensOut": 200,
    "costUsd": 0.0003,
    "latencyMs": 1200
  }
}

Response (403 - Policy Refusal):
{
  "traceId": "trace_abc123",
  "status": "refused",
  "error": {
    "code": "POLICY_REFUSAL",
    "message": "This topic is not available for your profile"
  },
  "safetyFlags": ["topic_restricted"]
}

Response (429 - Budget Exceeded):
{
  "traceId": "trace_abc123",
  "status": "error",
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "Daily AI usage limit reached"
  }
}
```

### 4.2 AI Config Endpoints (Platform Studio)

```
GET /api/ai/config/:customerId
GET /api/ai/config/:customerId/use-cases
POST /api/ai/config/:customerId/use-cases
PUT /api/ai/config/:customerId/use-cases/:useCaseId
DELETE /api/ai/config/:customerId/use-cases/:useCaseId

GET /api/ai/config/:customerId/routing-rules
POST /api/ai/config/:customerId/routing-rules
PUT /api/ai/config/:customerId/routing-rules/:ruleId

GET /api/ai/config/:customerId/prompts
POST /api/ai/config/:customerId/prompts
PUT /api/ai/config/:customerId/prompts/:promptId

GET /api/ai/config/:customerId/budgets
PUT /api/ai/config/:customerId/budgets

POST /api/ai/config/:customerId/validate
POST /api/ai/config/:customerId/publish
POST /api/ai/config/:customerId/rollback
```

### 4.3 AI Kill Switch Endpoints

```
GET /api/ai/kill-switches
POST /api/ai/kill-switches/activate
{
  "switchType": "feature",
  "referenceId": "ai_chat",
  "reason": "Safety incident"
}

POST /api/ai/kill-switches/deactivate
{
  "switchType": "feature",
  "referenceId": "ai_chat"
}
```

---

## 5. RPC Functions

```sql
-- Get AI configuration for a customer
CREATE OR REPLACE FUNCTION get_ai_config(p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'useCases', (
      SELECT jsonb_agg(row_to_json(uc))
      FROM ai_use_cases uc
      WHERE uc.customer_id = p_customer_id AND uc.is_enabled = true
    ),
    'routingRules', (
      SELECT jsonb_agg(row_to_json(rr) ORDER BY rr.priority)
      FROM ai_routing_rules rr
      WHERE rr.customer_id = p_customer_id AND rr.is_enabled = true
    ),
    'budgets', (
      SELECT jsonb_agg(row_to_json(b))
      FROM ai_budgets b
      WHERE b.customer_id = p_customer_id
    ),
    'killSwitches', (
      SELECT jsonb_agg(row_to_json(ks))
      FROM ai_kill_switches ks
      WHERE (ks.switch_type = 'global' OR ks.reference_id = p_customer_id::TEXT)
        AND ks.is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Check if AI is allowed for user
CREATE OR REPLACE FUNCTION check_ai_permission(
  p_user_id TEXT,
  p_customer_id UUID,
  p_use_case_id TEXT,
  p_role TEXT,
  p_audience_profile TEXT
)
RETURNS JSONB AS $$
DECLARE
  use_case RECORD;
  kill_switch RECORD;
  budget RECORD;
  result JSONB;
BEGIN
  -- Check global kill switch
  SELECT * INTO kill_switch FROM ai_kill_switches
  WHERE switch_type = 'global' AND is_active = true;
  IF FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'AI globally disabled');
  END IF;
  
  -- Check tenant kill switch
  SELECT * INTO kill_switch FROM ai_kill_switches
  WHERE switch_type = 'tenant' AND reference_id = p_customer_id::TEXT AND is_active = true;
  IF FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'AI disabled for tenant');
  END IF;
  
  -- Check feature kill switch
  SELECT * INTO kill_switch FROM ai_kill_switches
  WHERE switch_type = 'feature' AND reference_id = p_use_case_id AND is_active = true;
  IF FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Feature disabled');
  END IF;
  
  -- Check use case exists and is enabled
  SELECT * INTO use_case FROM ai_use_cases
  WHERE customer_id = p_customer_id AND use_case_id = p_use_case_id AND is_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Use case not enabled');
  END IF;
  
  -- Check role is allowed
  IF NOT (p_role = ANY(use_case.enabled_roles)) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Role not permitted');
  END IF;
  
  -- Check audience profile is allowed
  IF NOT (p_audience_profile = ANY(use_case.enabled_profiles)) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Profile not permitted');
  END IF;
  
  -- Check budget
  SELECT * INTO budget FROM ai_budgets
  WHERE customer_id = p_customer_id AND budget_type = 'tenant';
  IF FOUND AND budget.daily_limit_usd IS NOT NULL THEN
    IF budget.current_daily_spend >= budget.daily_limit_usd THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Daily budget exceeded');
    END IF;
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'useCase', row_to_json(use_case));
END;
$$ LANGUAGE plpgsql;

-- Log AI execution
CREATE OR REPLACE FUNCTION log_ai_execution(
  p_trace_id TEXT,
  p_customer_id UUID,
  p_user_id TEXT,
  p_role TEXT,
  p_audience_profile TEXT,
  p_use_case_id TEXT,
  p_widget_id TEXT,
  p_provider_id TEXT,
  p_model_id TEXT,
  p_status TEXT,
  p_tokens_in INTEGER,
  p_tokens_out INTEGER,
  p_cost_usd DECIMAL,
  p_latency_ms INTEGER,
  p_safety_flags TEXT[],
  p_refusal_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO ai_audit_logs (
    trace_id, customer_id, user_id, role, audience_profile,
    use_case_id, widget_id, provider_id, model_id, status,
    tokens_in, tokens_out, cost_usd, latency_ms,
    safety_flags, refusal_reason
  ) VALUES (
    p_trace_id, p_customer_id, p_user_id, p_role, p_audience_profile,
    p_use_case_id, p_widget_id, p_provider_id, p_model_id, p_status,
    p_tokens_in, p_tokens_out, p_cost_usd, p_latency_ms,
    p_safety_flags, p_refusal_reason
  ) RETURNING id INTO log_id;
  
  -- Update budget tracking
  UPDATE ai_budgets
  SET current_daily_spend = current_daily_spend + COALESCE(p_cost_usd, 0),
      current_daily_tokens = current_daily_tokens + COALESCE(p_tokens_in + p_tokens_out, 0),
      updated_at = now()
  WHERE customer_id = p_customer_id AND budget_type = 'tenant';
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Environment Variables

```bash
# AI Provider Keys (store in secure vault, reference here)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
AWS_BEDROCK_ACCESS_KEY=...
AWS_BEDROCK_SECRET_KEY=...
AWS_BEDROCK_REGION=us-east-1

# AI Gateway Configuration
AI_GATEWAY_URL=https://api.yourapp.com/ai
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
AI_REQUEST_TIMEOUT_MS=30000
AI_MAX_RETRIES=2

# Budget & Throttling
AI_DEFAULT_DAILY_BUDGET_USD=10.00
AI_DEFAULT_MONTHLY_BUDGET_USD=100.00
AI_RATE_LIMIT_PER_MINUTE=60
AI_RATE_LIMIT_PER_USER_MINUTE=10

# Safety
AI_SAFETY_POLICY_VERSION=v1.0
AI_ENABLE_CONTENT_FILTER=true
AI_KID_PROFILE_STRICT_MODE=true

# Observability
AI_ENABLE_AUDIT_LOGGING=true
AI_LOG_LEVEL=info
```

---

## 7. Implementation Checklist

### Phase 1: Foundation
- [ ] Run database migrations (ai_providers, ai_models, ai_use_cases, ai_audit_logs)
- [ ] Add AI permission codes to permissions table
- [ ] Create `src/types/ai.types.ts`
- [ ] Create `src/services/ai/aiConfigService.ts`
- [ ] Create `src/hooks/useAIPermission.ts`

### Phase 2: Gateway
- [ ] Implement AI Gateway service (backend)
- [ ] Implement provider adapters (OpenAI first)
- [ ] Implement routing logic
- [ ] Implement fallback logic
- [ ] Add audit logging

### Phase 3: Platform Studio
- [ ] Add AI Features page to Studio
- [ ] Add Routing Rules page
- [ ] Add Prompts editor
- [ ] Add Budget configuration
- [ ] Add Kill Switch controls

### Phase 4: Mobile App
- [ ] Update AI widgets to use new service
- [ ] Add budget exceeded UI
- [ ] Add kill switch fallback UI
- [ ] Add audience profile detection

### Phase 5: Observability
- [ ] Create AI usage dashboard
- [ ] Set up cost alerts
- [ ] Set up safety alerts
- [ ] Create audit log viewer

---

## 8. Quick Reference: Existing AI Widgets

### 8.1 Mobile App Widgets (`src/config/widgetRegistry.ts`)

| Widget ID | Component | Feature ID | Status |
|-----------|-----------|------------|--------|
| `ai.recommendations` | RecommendationsWidget | `ai.tutor` | ✅ IMPLEMENTED |
| `parent.ai-insights-preview` | AIInsightsPreviewWidget | `parent.ai-insights` | ✅ IMPLEMENTED |
| `parent.ai-predictions` | ParentAIPredictionsWidget | `parent.ai-predictions` | ✅ IMPLEMENTED |
| `parent.ai-recommendations` | ParentAIRecommendationsWidget | `parent.ai-recommendations` | ✅ IMPLEMENTED |
| `parent.ai-alerts` | ParentAIAlertsWidget | `parent.ai-alerts` | ✅ IMPLEMENTED |

### 8.2 Platform Studio Registry (`platform-studio/src/config/widgetRegistry.ts`)

| Widget ID | Name | Roles | Feature ID | Status |
|-----------|------|-------|------------|--------|
| `ai.tutor-chat` | AI Tutor | student | `ai_tutor` | Registry only |
| `ai.recommendations` | AI Recommendations | student | `ai_tutor` | ✅ IMPLEMENTED |
| `ai.summary` | AI Summary | student | `ai_tutor` | Registry only |
| `ai.practice` | AI Practice | student | `ai_tutor` | Registry only |
| `parent.ai-insights-preview` | Parent AI Insights | parent | `parent.ai-insights` | ✅ IMPLEMENTED |
| `parent.ai-predictions` | AI Predictions | parent | `parent.ai-predictions` | ✅ IMPLEMENTED |
| `parent.ai-recommendations` | AI Recommendations | parent | `parent.ai-recommendations` | ✅ IMPLEMENTED |
| `parent.ai-alerts` | AI Alerts | parent | `parent.ai-alerts` | ✅ IMPLEMENTED |

### 8.3 Existing AI Tables in Supabase

| Table | Rows | RLS | Purpose |
|-------|------|-----|---------|
| `ai_insights` | 5 | No | Parent AI insights |
| `ai_predictions` | 5 | No | Student predictions |
| `ai_recommendations` | 6 | Yes | Study recommendations |
| `ai_alerts` | 6 | Yes | Academic alerts |

### 8.4 Existing AI Permission

| Permission Code | Name | Category | Status |
|-----------------|------|----------|--------|
| `ai.tutor.use` | Use AI Tutor | premium | ✅ EXISTS |

---

## 9. Implementation Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| **AI Content Tables** | ✅ EXISTS | `ai_insights`, `ai_predictions`, `ai_recommendations`, `ai_alerts` |
| **AI Permission** | ✅ EXISTS | `ai.tutor.use` |
| **Mobile AI Widgets** | ✅ EXISTS | 5 widgets implemented |
| **Platform Studio AI Widgets** | Partial | 8 in registry, 5 implemented |
| **AI Registry Tables** | TO CREATE | 17+ tables for full flexibility |
| **AI TypeScript Types** | TO CREATE | `src/types/ai.types.ts` |
| **AI Services** | TO CREATE | `src/services/ai/*` |
| **AI Hooks** | TO CREATE | `src/hooks/useAI*.ts` |
| **Platform Studio AI Pages** | TO CREATE | `/studio/ai/*` |
| **Additional AI Permissions** | TO CREATE | 10 new permission codes |

---

This appendix provides the concrete implementation details needed to make the AI documentation production-ready.
