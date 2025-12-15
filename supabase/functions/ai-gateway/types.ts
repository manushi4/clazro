/**
 * AI Gateway Types
 */

export type Role = "student" | "teacher" | "parent" | "admin";
export type AudienceProfile = "kid" | "teen" | "adult" | "coaching";
export type OutputMode = "TEXT" | "JSON" | "SCHEMA";
export type ToolsPolicy = "TOOLS_DISABLED" | "TOOLS_ALLOWED" | "TOOLS_REQUIRED";
export type AIExecutionStatus = "success" | "refused" | "error" | "fallback";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIExecuteRequest {
  tenantId: string;
  userId: string;
  role: Role;
  audienceProfile: AudienceProfile;
  featureId: string;
  widgetId?: string;
  input: {
    text?: string;
    messages?: AIMessage[];
  };
  contextRefs?: Record<string, string>;
  outputMode?: OutputMode;
  schemaId?: string;
  toolIntent?: "none" | "allowed" | "required";
}

export interface AIExecuteResponse {
  traceId: string;
  status: AIExecutionStatus;
  outputText?: string;
  outputJson?: Record<string, unknown>;
  safetyFlags: string[];
  provider?: string;
  model?: string;
  fallbackPath?: string[];
  usage?: UsageInfo;
  error?: {
    code: string;
    message: string;
  };
}

export interface UsageInfo {
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
}

export interface ResolvedConfig {
  feature: FeatureConfig | null;
  model: ModelConfig | null;
  prompt: PromptConfig | null;
  provider: ProviderConfig | null;
  audienceProfile: AudienceProfileConfig | null;
  routingRules: RoutingRule[];
  fallbackModels: ModelConfig[];
}

export interface FeatureConfig {
  feature_id: string;
  name: string;
  capability_class: string;
  output_mode: OutputMode;
  tools_policy: ToolsPolicy;
  max_tokens: number;
  temperature: number;
  config: Record<string, unknown>;
}

export interface ModelConfig {
  model_id: string;
  provider_id: string;
  name: string;
  context_window: number;
  max_output_tokens: number;
  supports_tools: boolean;
  supports_json_mode: boolean;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  temperature: number;
}

export interface PromptConfig {
  prompt_id: string;
  system_prompt: string;
  user_template?: string;
  variables: PromptVariable[];
  forbidden_patterns: string[];
}

export interface PromptVariable {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

export interface ProviderConfig {
  provider_id: string;
  name: string;
  api_type: string;
  api_base_url?: string;
  api_key: string;
  supports_streaming: boolean;
  supports_tools: boolean;
}

export interface AudienceProfileConfig {
  profile_id: AudienceProfile;
  tone: string;
  max_response_length: number;
  forbidden_topics: string[];
  safety_level: "strict" | "standard" | "relaxed";
  require_parent_visibility: boolean;
}

export interface RoutingRule {
  rule_name: string;
  priority: number;
  primary_model_id: string;
  fallback_model_ids: string[];
  max_tokens?: number;
  temperature?: number;
}

export interface ExecutionContext {
  tenantId: string;
  userId: string;
  role: Role;
  audienceProfile: AudienceProfile;
  featureId: string;
  widgetId?: string;
  input: { text?: string; messages?: AIMessage[] };
  config: ResolvedConfig;
  traceId: string;
  outputMode?: OutputMode;
}

export interface ProviderResult {
  status: AIExecutionStatus;
  outputText?: string;
  outputJson?: Record<string, unknown>;
  safetyFlags: string[];
  provider: string;
  model: string;
  fallbackPath?: string[];
  usage?: UsageInfo;
}

export interface AuditLogEntry {
  traceId: string;
  tenantId: string;
  userId: string;
  role: Role;
  audienceProfile: AudienceProfile;
  featureId: string;
  widgetId?: string;
  providerId?: string;
  modelId?: string;
  promptId?: string;
  status: AIExecutionStatus;
  refusalReason?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  latencyMs: number;
  safetyFlags?: string[];
  fallbackPath?: string[];
}
