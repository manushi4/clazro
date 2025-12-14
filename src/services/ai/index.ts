/**
 * AI Services Index
 * 
 * Exports all AI-related services.
 */

// Config Service
export {
  fetchAIFeatureDefinitions,
  fetchCustomerAIFeatures,
  fetchResolvedAIFeatures,
  fetchAIProviderDefinitions,
  fetchCustomerAIProviders,
  fetchAIModelDefinitions,
  fetchCustomerAIModels,
  fetchDefaultModel,
  fetchMCPToolDefinitions,
  fetchCustomerMCPTools,
  fetchResolvedMCPTools,
  fetchAutomationDefinitions,
  fetchCustomerAutomations,
  fetchResolvedAutomations,
  fetchPromptDefinitions,
  fetchCustomerPrompts,
  fetchAudienceProfileDefinitions,
  fetchCustomerAudienceProfiles,
  fetchCustomerRoutingRules,
  fetchCustomerBudgets,
  fetchKillSwitches,
  isAIBlocked,
  fetchFullAIConfig,
  checkAIPermission,
  getRoutedModel,
} from './aiConfigService';

// Audit Service
export {
  generateTraceId,
  logAIExecution,
  updateBudgetUsage,
  getAIUsageStats,
  getRecentAuditLogs,
} from './aiAuditService';

// Gateway Service (calls Edge Function)
export {
  executeAI,
  completeText,
  chat,
  generateJSON,
  AIGatewayError,
} from './aiGatewayService';
