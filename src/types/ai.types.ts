/**
 * AI System Types
 * 
 * Registry pattern types for AI features, providers, models, tools, and automations.
 * Follows the same pattern as widgets: Definition (global catalog) + Assignment (per-customer)
 */

import type { Role } from './permission.types';

// Re-export Role for convenience
export type { Role };

// ============================================================
// CORE ENUMS
// ============================================================

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

export type BudgetType = 'tenant' | 'feature' | 'user' | 'model';

export type KillSwitchType = 'global' | 'tenant' | 'feature' | 'provider' | 'model' | 'tool' | 'automation';

export type AIExecutionStatus = 'success' | 'refused' | 'error' | 'fallback';

// ============================================================
// AI FEATURE TYPES (Definition + Assignment)
// ============================================================

export type AIFeatureDefinition = {
  id: string;
  featureId: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;
  capabilityClass: CapabilityClass;
  icon: string;
  defaultOutputMode: OutputMode;
  defaultToolsPolicy: ToolsPolicy;
  defaultMaxTokens: number;
  defaultTemperature: number;
  defaultConfig: Record<string, unknown>;
  minRoleLevel: number;
  requiresConsent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAIFeature = {
  id: string;
  customerId: string;
  featureId: string;
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  outputMode?: OutputMode;
  toolsPolicy?: ToolsPolicy;
  allowedTools: string[];
  maxTokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  customName?: string;
  customNameHi?: string;
  customIcon?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// AI PROVIDER TYPES (Definition + Assignment)
// ============================================================

export type AIProviderDefinition = {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  apiType: string;
  apiBaseUrl?: string;
  supportedCapabilities: string[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsJsonMode: boolean;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAIProvider = {
  id: string;
  customerId: string;
  providerId: string;
  apiKeyRef?: string;
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

export type AIModelDefinition = {
  id: string;
  modelId: string;
  providerId: string;
  name: string;
  description?: string;
  capabilityClasses: CapabilityClass[];
  tier: 'cheap' | 'standard' | 'premium';
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsJsonMode: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  defaultTemperature: number;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  isDeprecated: boolean;
  replacementModelId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAIModel = {
  id: string;
  customerId: string;
  modelId: string;
  allowedFeatures: string[];
  allowedRoles: Role[];
  allowedProfiles: AudienceProfile[];
  maxTokens?: number;
  temperature?: number;
  config: Record<string, unknown>;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// MCP TOOL TYPES (Definition + Assignment)
// ============================================================

export type MCPToolAction = {
  actionId: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

export type MCPToolDefinition = {
  id: string;
  toolId: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;
  icon: string;
  mcpServerUrl?: string;
  mcpServerType: MCPServerType;
  actions: MCPToolAction[];
  requiredScopes: string[];
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMCPTool = {
  id: string;
  customerId: string;
  toolId: string;
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  allowedActions: string[];
  oauthCredentials: Record<string, unknown>;
  apiKeyRef?: string;
  config: Record<string, unknown>;
  requiresApproval: boolean;
  approvalRoles: Role[];
  customName?: string;
  customNameHi?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AUTOMATION TYPES (Definition + Assignment)
// ============================================================

export type AutomationStep = {
  stepId: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  conditions?: Record<string, unknown>;
};

export type AutomationDefinition = {
  id: string;
  automationId: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  category: string;
  icon: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  steps: AutomationStep[];
  defaultConfig: Record<string, unknown>;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAutomation = {
  id: string;
  customerId: string;
  automationId: string;
  enabledRoles: Role[];
  enabledProfiles: AudienceProfile[];
  triggerOverrides: Record<string, unknown>;
  stepOverrides: Record<string, unknown>;
  config: Record<string, unknown>;
  requiresApproval: boolean;
  approvalRoles: Role[];
  customName?: string;
  customNameHi?: string;
  isEnabled: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// PROMPT TYPES (Definition + Assignment)
// ============================================================

export type PromptVariable = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
};

export type PromptDefinition = {
  id: string;
  promptId: string;
  name: string;
  description?: string;
  category: string;
  systemPrompt: string;
  userTemplate?: string;
  variables: PromptVariable[];
  targetFeatures: string[];
  targetProfiles: AudienceProfile[];
  forbiddenPatterns: string[];
  safetyPolicyVersion?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPrompt = {
  id: string;
  customerId: string;
  promptId: string;
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

export type AudienceProfileDefinition = {
  id: string;
  profileId: AudienceProfile;
  name: string;
  nameHi?: string;
  description?: string;
  minAge?: number;
  maxAge?: number;
  tone: string;
  maxResponseLength: number;
  allowedTopics: string[];
  forbiddenTopics: string[];
  toolsAllowed: boolean;
  allowedToolCategories: string[];
  safetyLevel: SafetyLevel;
  requireParentVisibility: boolean;
  requireHumanEscalation: boolean;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAudienceProfile = {
  id: string;
  customerId: string;
  profileId: AudienceProfile;
  maxResponseLength?: number;
  forbiddenTopicsExtra: string[];
  toolsAllowed?: boolean;
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// SUPPORTING TYPES (Routing, Budgets, Kill Switches, Audit)
// ============================================================

export type CustomerAIRoutingRule = {
  id: string;
  customerId: string;
  ruleName: string;
  priority: number;
  featureIds: string[];
  profileIds: AudienceProfile[];
  roles: Role[];
  primaryModelId: string;
  fallbackModelIds: string[];
  maxTokens?: number;
  temperature?: number;
  latencySlaMsMs?: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAIBudget = {
  id: string;
  customerId: string;
  budgetType: BudgetType;
  referenceId?: string;
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  dailyTokenLimit?: number;
  monthlyTokenLimit?: number;
  currentDailySpend: number;
  currentMonthlySpend: number;
  currentDailyTokens: number;
  currentMonthlyTokens: number;
  actionOnLimit: 'deny' | 'degrade' | 'notify';
  lastDailyReset: string;
  lastMonthlyReset: string;
  createdAt: string;
  updatedAt: string;
};

export type AIKillSwitch = {
  id: string;
  switchType: KillSwitchType;
  referenceId?: string;
  isActive: boolean;
  activatedBy?: string;
  activatedAt?: string;
  reason?: string;
  autoReactivateAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AIAuditEntry = {
  id: string;
  traceId: string;
  customerId: string;
  userId: string;
  role: Role;
  audienceProfile?: AudienceProfile;
  featureId?: string;
  widgetId?: string;
  inputHash?: string;
  contextRefs: Record<string, string>;
  providerId?: string;
  modelId?: string;
  promptId?: string;
  toolsUsed: string[];
  status: AIExecutionStatus;
  refusalReason?: string;
  safetyFlags: string[];
  fallbackPath?: string[];
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
  featureId: string;
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
  status: AIExecutionStatus;
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

export type ResolvedAIFeature = AIFeatureDefinition & {
  customerConfig: CustomerAIFeature | null;
  effectiveOutputMode: OutputMode;
  effectiveToolsPolicy: ToolsPolicy;
  effectiveMaxTokens: number;
  effectiveTemperature: number;
  effectiveConfig: Record<string, unknown>;
  displayName: string;
  displayNameHi: string;
  displayIcon: string;
};

export type ResolvedMCPTool = MCPToolDefinition & {
  customerConfig: CustomerMCPTool | null;
  effectiveActions: MCPToolAction[];
  effectiveConfig: Record<string, unknown>;
  displayName: string;
  displayNameHi: string;
};

export type ResolvedAutomation = AutomationDefinition & {
  customerConfig: CustomerAutomation | null;
  effectiveTriggerConfig: Record<string, unknown>;
  effectiveSteps: AutomationStep[];
  effectiveConfig: Record<string, unknown>;
  displayName: string;
  displayNameHi: string;
};

// ============================================================
// AI CONFIG AGGREGATE TYPE
// ============================================================

export type AIConfig = {
  features: ResolvedAIFeature[];
  providers: AIProviderDefinition[];
  models: AIModelDefinition[];
  tools: ResolvedMCPTool[];
  automations: ResolvedAutomation[];
  routingRules: CustomerAIRoutingRule[];
  budgets: CustomerAIBudget[];
  killSwitches: AIKillSwitch[];
  audienceProfiles: AudienceProfileDefinition[];
};

// ============================================================
// AI PERMISSION CODES
// ============================================================

export const AI_PERMISSIONS = {
  CHAT_USE: 'ai.chat.use',
  SUMMARY_USE: 'ai.summary.use',
  COPILOT_USE: 'ai.copilot.use',
  TOOLS_USE: 'ai.tools.use',
  TUTOR_USE: 'ai.tutor.use',
  AUTOMATION_TRIGGER: 'ai.automation.trigger',
  CONFIG_VIEW: 'ai.config.view',
  CONFIG_MANAGE: 'ai.config.manage',
  BUDGET_VIEW: 'ai.budget.view',
  AUDIT_VIEW: 'ai.audit.view',
  KILLSWITCH_MANAGE: 'ai.killswitch.manage',
} as const;

export type AIPermissionCode = typeof AI_PERMISSIONS[keyof typeof AI_PERMISSIONS];
