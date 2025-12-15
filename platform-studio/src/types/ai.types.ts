/**
 * AI System Types for Platform Studio
 * Registry pattern: Definition (global catalog) + Assignment (per-customer)
 */

import type { Role } from "./customer.types";

// ============================================================
// CORE ENUMS
// ============================================================

export type AudienceProfile = "kid" | "teen" | "adult" | "coaching";

export type CapabilityClass =
  | "SAFE_GUIDED_CHAT"
  | "GENERAL_CHAT"
  | "DEEP_REASONING"
  | "SUMMARIZATION"
  | "STRUCTURED_EXTRACTION"
  | "CLASSIFICATION"
  | "MULTIMODAL_VISION"
  | "EMBEDDINGS";

export type OutputMode = "TEXT" | "JSON" | "SCHEMA";
export type ToolsPolicy = "TOOLS_DISABLED" | "TOOLS_ALLOWED" | "TOOLS_REQUIRED";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type SafetyLevel = "strict" | "standard" | "relaxed";
export type TriggerType = "event" | "schedule" | "manual" | "condition" | "webhook";
export type MCPServerType = "stdio" | "http" | "websocket";
export type BudgetType = "tenant" | "feature" | "user" | "model";
export type KillSwitchType = "global" | "tenant" | "feature" | "provider" | "model" | "tool" | "automation";
export type AIExecutionStatus = "success" | "refused" | "error" | "fallback";

// ============================================================
// AI FEATURE TYPES
// ============================================================

export type AIFeatureDefinition = {
  id: string;
  feature_id: string;
  name: string;
  name_hi?: string;
  description?: string;
  category: string;
  capability_class: CapabilityClass;
  icon: string;
  default_output_mode: OutputMode;
  default_tools_policy: ToolsPolicy;
  default_max_tokens: number;
  default_temperature: number;
  default_config: Record<string, unknown>;
  min_role_level: number;
  requires_consent: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


export type CustomerAIFeature = {
  id: string;
  customer_id: string;
  feature_id: string;
  enabled_roles: Role[];
  enabled_profiles: AudienceProfile[];
  output_mode?: OutputMode;
  tools_policy?: ToolsPolicy;
  allowed_tools: string[];
  max_tokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  custom_name?: string;
  custom_name_hi?: string;
  custom_icon?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// AI PROVIDER TYPES
// ============================================================

export type AIProviderDefinition = {
  id: string;
  provider_id: string;
  name: string;
  description?: string;
  api_type: string;
  api_base_url?: string;
  supported_capabilities: string[];
  supports_streaming: boolean;
  supports_tools: boolean;
  supports_json_mode: boolean;
  default_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAIProvider = {
  id: string;
  customer_id: string;
  provider_id: string;
  api_key_ref?: string;
  enabled_models: string[];
  routing_priority: number;
  max_requests_per_minute?: number;
  max_tokens_per_day?: number;
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// AI MODEL TYPES
// ============================================================

export type AIModelDefinition = {
  id: string;
  model_id: string;
  provider_id: string;
  name: string;
  description?: string;
  capability_classes: CapabilityClass[];
  tier: "cheap" | "standard" | "premium";
  context_window: number;
  max_output_tokens: number;
  supports_vision: boolean;
  supports_tools: boolean;
  supports_json_mode: boolean;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
  default_temperature: number;
  default_config: Record<string, unknown>;
  is_active: boolean;
  is_deprecated: boolean;
  replacement_model_id?: string;
  created_at: string;
  updated_at: string;
};

export type CustomerAIModel = {
  id: string;
  customer_id: string;
  model_id: string;
  allowed_features: string[];
  allowed_roles: Role[];
  allowed_profiles: AudienceProfile[];
  max_tokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// MCP TOOL TYPES
// ============================================================

export type MCPToolAction = {
  action_id: string;
  name: string;
  name_hi?: string;
  description?: string;
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
};

export type MCPToolDefinition = {
  id: string;
  tool_id: string;
  name: string;
  name_hi?: string;
  description?: string;
  category: string;
  icon: string;
  mcp_server_url?: string;
  mcp_server_type: MCPServerType;
  actions: MCPToolAction[];
  required_scopes: string[];
  risk_level: RiskLevel;
  requires_approval: boolean;
  default_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerMCPTool = {
  id: string;
  customer_id: string;
  tool_id: string;
  enabled_roles: Role[];
  enabled_profiles: AudienceProfile[];
  allowed_actions: string[];
  oauth_credentials: Record<string, unknown>;
  api_key_ref?: string;
  config: Record<string, unknown>;
  requires_approval: boolean;
  approval_roles: Role[];
  custom_name?: string;
  custom_name_hi?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};


// ============================================================
// AUTOMATION TYPES
// ============================================================

export type AutomationStep = {
  step_id: string;
  action_type: string;
  action_config: Record<string, unknown>;
  conditions?: Record<string, unknown>;
};

// Matches actual automation_definitions table schema
export type AutomationDefinition = {
  id: string;
  automation_id: string;
  name: string;
  name_hi?: string;
  description?: string;
  description_hi?: string;
  category: string;
  icon?: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  steps: AutomationStep[];
  default_config: Record<string, unknown>;
  risk_level: RiskLevel;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAutomation = {
  id: string;
  customer_id: string;
  automation_id: string;
  enabled_roles: Role[];
  enabled_profiles: AudienceProfile[];
  trigger_overrides: Record<string, unknown>;
  step_overrides: Record<string, unknown>;
  config: Record<string, unknown>;
  requires_approval: boolean;
  approval_roles: Role[];
  custom_name?: string;
  custom_name_hi?: string;
  is_enabled: boolean;
  last_run_at?: string;
  last_run_status?: string;
  created_at: string;
  updated_at: string;
};

// ============================================================
// PROMPT TYPES
// ============================================================

export type PromptVariable = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  default?: unknown;
};

export type PromptDefinition = {
  id: string;
  prompt_id: string;
  name: string;
  description?: string;
  category: string;
  system_prompt: string;
  user_template?: string;
  variables: PromptVariable[];
  target_features: string[];
  target_profiles: AudienceProfile[];
  forbidden_patterns: string[];
  safety_policy_version?: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerPrompt = {
  id: string;
  customer_id: string;
  prompt_id: string;
  system_prompt_override?: string;
  user_template_override?: string;
  variables_override: PromptVariable[];
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// ROUTING, BUDGETS, KILL SWITCHES
// ============================================================

export type CustomerAIRoutingRule = {
  id: string;
  customer_id: string;
  rule_name: string;
  priority: number;
  feature_ids: string[];
  profile_ids: AudienceProfile[];
  roles: Role[];
  primary_model_id: string;
  fallback_model_ids: string[];
  max_tokens?: number;
  temperature?: number;
  latency_sla_ms?: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAIBudget = {
  id: string;
  customer_id: string;
  budget_type: BudgetType;
  reference_id?: string;
  daily_limit_usd?: number;
  monthly_limit_usd?: number;
  daily_token_limit?: number;
  monthly_token_limit?: number;
  current_daily_spend: number;
  current_monthly_spend: number;
  current_daily_tokens: number;
  current_monthly_tokens: number;
  action_on_limit: "deny" | "degrade" | "notify";
  last_daily_reset: string;
  last_monthly_reset: string;
  created_at: string;
  updated_at: string;
};

export type AIKillSwitch = {
  id: string;
  switch_type: KillSwitchType;
  reference_id?: string;
  is_active: boolean;
  activated_by?: string;
  activated_at?: string;
  reason?: string;
  auto_reactivate_at?: string;
  created_at: string;
  updated_at: string;
};

export type AIAuditEntry = {
  id: string;
  trace_id: string;
  customer_id: string;
  user_id: string;
  role: Role;
  audience_profile?: AudienceProfile;
  feature_id?: string;
  widget_id?: string;
  input_hash?: string;
  context_refs: Record<string, string>;
  provider_id?: string;
  model_id?: string;
  prompt_id?: string;
  tools_used: string[];
  status: AIExecutionStatus;
  refusal_reason?: string;
  safety_flags: string[];
  fallback_path?: string[];
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  latency_ms?: number;
  created_at: string;
};

// ============================================================
// AUDIENCE PROFILE TYPES
// ============================================================

export type AudienceProfileDefinition = {
  id: string;
  profile_id: AudienceProfile;
  name: string;
  name_hi?: string;
  description?: string;
  min_age?: number;
  max_age?: number;
  tone: string;
  max_response_length: number;
  allowed_topics: string[];
  forbidden_topics: string[];
  tools_allowed: boolean;
  allowed_tool_categories: string[];
  safety_level: SafetyLevel;
  require_parent_visibility: boolean;
  require_human_escalation: boolean;
  default_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// AI CONFIG SUMMARY (for dashboard)
// ============================================================

export type AIConfigSummary = {
  totalFeatures: number;
  enabledFeatures: number;
  totalProviders: number;
  enabledProviders: number;
  totalModels: number;
  enabledModels: number;
  totalTools: number;
  enabledTools: number;
  totalAutomations: number;
  enabledAutomations: number;
  activeKillSwitches: number;
  budgetUsagePercent: number;
};
