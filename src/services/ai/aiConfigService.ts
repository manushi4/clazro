/**
 * AI Config Service
 * 
 * Fetches AI configuration from Supabase following the registry pattern.
 * Merges global definitions with per-customer assignments.
 */

import { getSupabaseClient } from '../../lib/supabaseClient';
import type { Role } from '../../types/permission.types';
import type {
  AIFeatureDefinition,
  CustomerAIFeature,
  AIProviderDefinition,
  CustomerAIProvider,
  AIModelDefinition,
  CustomerAIModel,
  MCPToolDefinition,
  CustomerMCPTool,
  AutomationDefinition,
  CustomerAutomation,
  PromptDefinition,
  CustomerPrompt,
  AudienceProfileDefinition,
  CustomerAudienceProfile,
  CustomerAIRoutingRule,
  CustomerAIBudget,
  AIKillSwitch,
  ResolvedAIFeature,
  ResolvedMCPTool,
  ResolvedAutomation,
  AudienceProfile,
} from '../../types/ai.types';

function getSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');
  return supabase;
}

// ============================================================
// HELPER: Convert snake_case to camelCase
// ============================================================

function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result as T;
}

// ============================================================
// AI FEATURES
// ============================================================

export async function fetchAIFeatureDefinitions(): Promise<AIFeatureDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_feature_definitions')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => toCamelCase<AIFeatureDefinition>(row));
}

export async function fetchCustomerAIFeatures(customerId: string): Promise<CustomerAIFeature[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_features')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAIFeature>(row));
}


export async function fetchResolvedAIFeatures(
  customerId: string,
  role: Role,
  audienceProfile?: AudienceProfile
): Promise<ResolvedAIFeature[]> {
  const [definitions, customerFeatures] = await Promise.all([
    fetchAIFeatureDefinitions(),
    fetchCustomerAIFeatures(customerId),
  ]);

  const customerMap = new Map(customerFeatures.map(f => [f.featureId, f]));

  return definitions
    .filter(def => {
      const customer = customerMap.get(def.featureId);
      if (!customer) return false;
      if (!customer.enabledRoles.includes(role)) return false;
      if (audienceProfile && customer.enabledProfiles.length > 0) {
        if (!customer.enabledProfiles.includes(audienceProfile)) return false;
      }
      return true;
    })
    .map(def => {
      const customer = customerMap.get(def.featureId) || null;
      return {
        ...def,
        customerConfig: customer,
        effectiveOutputMode: customer?.outputMode || def.defaultOutputMode,
        effectiveToolsPolicy: customer?.toolsPolicy || def.defaultToolsPolicy,
        effectiveMaxTokens: customer?.maxTokens || def.defaultMaxTokens,
        effectiveTemperature: customer?.temperature || def.defaultTemperature,
        effectiveConfig: { ...def.defaultConfig, ...(customer?.config || {}) },
        displayName: customer?.customName || def.name,
        displayNameHi: customer?.customNameHi || def.nameHi || def.name,
        displayIcon: customer?.customIcon || def.icon,
      };
    });
}

// ============================================================
// AI PROVIDERS
// ============================================================

export async function fetchAIProviderDefinitions(): Promise<AIProviderDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_provider_definitions')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<AIProviderDefinition>(row));
}

export async function fetchCustomerAIProviders(customerId: string): Promise<CustomerAIProvider[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_providers')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true)
    .order('routing_priority', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAIProvider>(row));
}

// ============================================================
// AI MODELS
// ============================================================

export async function fetchAIModelDefinitions(): Promise<AIModelDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_model_definitions')
    .select('*')
    .eq('is_active', true)
    .eq('is_deprecated', false);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<AIModelDefinition>(row));
}

export async function fetchCustomerAIModels(customerId: string): Promise<CustomerAIModel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_models')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAIModel>(row));
}

export async function fetchDefaultModel(customerId: string): Promise<CustomerAIModel | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_models')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase<CustomerAIModel>(data) : null;
}

// ============================================================
// MCP TOOLS
// ============================================================

export async function fetchMCPToolDefinitions(): Promise<MCPToolDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mcp_tool_definitions')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => toCamelCase<MCPToolDefinition>(row));
}

export async function fetchCustomerMCPTools(customerId: string): Promise<CustomerMCPTool[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_mcp_tools')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerMCPTool>(row));
}

export async function fetchResolvedMCPTools(
  customerId: string,
  role: Role,
  audienceProfile?: AudienceProfile
): Promise<ResolvedMCPTool[]> {
  const [definitions, customerTools] = await Promise.all([
    fetchMCPToolDefinitions(),
    fetchCustomerMCPTools(customerId),
  ]);

  const customerMap = new Map(customerTools.map(t => [t.toolId, t]));

  return definitions
    .filter(def => {
      const customer = customerMap.get(def.toolId);
      if (!customer) return false;
      if (!customer.enabledRoles.includes(role)) return false;
      if (audienceProfile && customer.enabledProfiles.length > 0) {
        if (!customer.enabledProfiles.includes(audienceProfile)) return false;
      }
      return true;
    })
    .map(def => {
      const customer = customerMap.get(def.toolId) || null;
      const allowedActions = customer?.allowedActions || [];
      return {
        ...def,
        customerConfig: customer,
        effectiveActions: allowedActions.length > 0
          ? def.actions.filter(a => allowedActions.includes(a.actionId))
          : def.actions,
        effectiveConfig: { ...def.defaultConfig, ...(customer?.config || {}) },
        displayName: customer?.customName || def.name,
        displayNameHi: customer?.customNameHi || def.nameHi || def.name,
      };
    });
}


// ============================================================
// AUTOMATIONS
// ============================================================

export async function fetchAutomationDefinitions(): Promise<AutomationDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('automation_definitions')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => toCamelCase<AutomationDefinition>(row));
}

export async function fetchCustomerAutomations(customerId: string): Promise<CustomerAutomation[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_automations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAutomation>(row));
}

export async function fetchResolvedAutomations(
  customerId: string,
  role: Role,
  audienceProfile?: AudienceProfile
): Promise<ResolvedAutomation[]> {
  const [definitions, customerAutomations] = await Promise.all([
    fetchAutomationDefinitions(),
    fetchCustomerAutomations(customerId),
  ]);

  const customerMap = new Map(customerAutomations.map(a => [a.automationId, a]));

  return definitions
    .filter(def => {
      const customer = customerMap.get(def.automationId);
      if (!customer) return false;
      if (!customer.enabledRoles.includes(role)) return false;
      if (audienceProfile && customer.enabledProfiles.length > 0) {
        if (!customer.enabledProfiles.includes(audienceProfile)) return false;
      }
      return true;
    })
    .map(def => {
      const customer = customerMap.get(def.automationId) || null;
      return {
        ...def,
        customerConfig: customer,
        effectiveTriggerConfig: { ...def.triggerConfig, ...(customer?.triggerOverrides || {}) },
        effectiveSteps: def.steps, // Could merge step overrides here
        effectiveConfig: { ...def.defaultConfig, ...(customer?.config || {}) },
        displayName: customer?.customName || def.name,
        displayNameHi: customer?.customNameHi || def.nameHi || def.name,
      };
    });
}

// ============================================================
// PROMPTS
// ============================================================

export async function fetchPromptDefinitions(): Promise<PromptDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('prompt_definitions')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<PromptDefinition>(row));
}

export async function fetchCustomerPrompts(customerId: string): Promise<CustomerPrompt[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_prompts')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerPrompt>(row));
}

// ============================================================
// AUDIENCE PROFILES
// ============================================================

export async function fetchAudienceProfileDefinitions(): Promise<AudienceProfileDefinition[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('audience_profile_definitions')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<AudienceProfileDefinition>(row));
}

export async function fetchCustomerAudienceProfiles(customerId: string): Promise<CustomerAudienceProfile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_audience_profiles')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAudienceProfile>(row));
}

// ============================================================
// ROUTING RULES
// ============================================================

export async function fetchCustomerRoutingRules(customerId: string): Promise<CustomerAIRoutingRule[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_routing_rules')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true)
    .order('priority', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAIRoutingRule>(row));
}

// ============================================================
// BUDGETS
// ============================================================

export async function fetchCustomerBudgets(customerId: string): Promise<CustomerAIBudget[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('customer_ai_budgets')
    .select('*')
    .eq('customer_id', customerId);

  if (error) throw error;
  return (data || []).map(row => toCamelCase<CustomerAIBudget>(row));
}

// ============================================================
// KILL SWITCHES
// ============================================================

export async function fetchKillSwitches(customerId?: string): Promise<AIKillSwitch[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('ai_kill_switches')
    .select('*')
    .eq('is_active', true);

  if (customerId) {
    query = query.or(`switch_type.eq.global,reference_id.eq.${customerId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(row => toCamelCase<AIKillSwitch>(row));
}

export async function isAIBlocked(
  customerId: string,
  featureId?: string,
  providerId?: string,
  modelId?: string
): Promise<{ blocked: boolean; reason?: string }> {
  const switches = await fetchKillSwitches(customerId);
  
  for (const sw of switches) {
    if (sw.switchType === 'global') {
      return { blocked: true, reason: 'AI globally disabled' };
    }
    if (sw.switchType === 'tenant' && sw.referenceId === customerId) {
      return { blocked: true, reason: 'AI disabled for tenant' };
    }
    if (sw.switchType === 'feature' && sw.referenceId === featureId) {
      return { blocked: true, reason: `Feature ${featureId} disabled` };
    }
    if (sw.switchType === 'provider' && sw.referenceId === providerId) {
      return { blocked: true, reason: `Provider ${providerId} disabled` };
    }
    if (sw.switchType === 'model' && sw.referenceId === modelId) {
      return { blocked: true, reason: `Model ${modelId} disabled` };
    }
  }
  
  return { blocked: false };
}


// ============================================================
// FULL AI CONFIG
// ============================================================

export async function fetchFullAIConfig(
  customerId: string,
  role: Role,
  audienceProfile?: AudienceProfile
) {
  const [
    features,
    providers,
    models,
    tools,
    automations,
    routingRules,
    budgets,
    killSwitches,
    audienceProfiles,
  ] = await Promise.all([
    fetchResolvedAIFeatures(customerId, role, audienceProfile),
    fetchAIProviderDefinitions(),
    fetchAIModelDefinitions(),
    fetchResolvedMCPTools(customerId, role, audienceProfile),
    fetchResolvedAutomations(customerId, role, audienceProfile),
    fetchCustomerRoutingRules(customerId),
    fetchCustomerBudgets(customerId),
    fetchKillSwitches(customerId),
    fetchAudienceProfileDefinitions(),
  ]);

  return {
    features,
    providers,
    models,
    tools,
    automations,
    routingRules,
    budgets,
    killSwitches,
    audienceProfiles,
  };
}

// ============================================================
// PERMISSION CHECK
// ============================================================

export async function checkAIPermission(
  customerId: string,
  userId: string,
  featureId: string,
  role: Role,
  audienceProfile: AudienceProfile
): Promise<{ allowed: boolean; reason?: string; feature?: ResolvedAIFeature }> {
  // Check kill switches first
  const blockStatus = await isAIBlocked(customerId, featureId);
  if (blockStatus.blocked) {
    return { allowed: false, reason: blockStatus.reason };
  }

  // Check budget
  const budgets = await fetchCustomerBudgets(customerId);
  const tenantBudget = budgets.find(b => b.budgetType === 'tenant');
  if (tenantBudget?.dailyLimitUsd && tenantBudget.currentDailySpend >= tenantBudget.dailyLimitUsd) {
    return { allowed: false, reason: 'Daily budget exceeded' };
  }

  // Check feature access
  const features = await fetchResolvedAIFeatures(customerId, role, audienceProfile);
  const feature = features.find(f => f.featureId === featureId);
  
  if (!feature) {
    return { allowed: false, reason: 'Feature not enabled for this role/profile' };
  }

  return { allowed: true, feature };
}

// ============================================================
// MODEL ROUTING
// ============================================================

export async function getRoutedModel(
  customerId: string,
  featureId: string,
  role: Role,
  audienceProfile: AudienceProfile
): Promise<{ modelId: string; providerId: string } | null> {
  const [routingRules, customerModels, modelDefs] = await Promise.all([
    fetchCustomerRoutingRules(customerId),
    fetchCustomerAIModels(customerId),
    fetchAIModelDefinitions(),
  ]);

  // Find matching routing rule
  for (const rule of routingRules) {
    const matchesFeature = rule.featureIds.length === 0 || rule.featureIds.includes(featureId);
    const matchesRole = rule.roles.length === 0 || rule.roles.includes(role);
    const matchesProfile = rule.profileIds.length === 0 || rule.profileIds.includes(audienceProfile);

    if (matchesFeature && matchesRole && matchesProfile && rule.primaryModelId) {
      const modelDef = modelDefs.find(m => m.modelId === rule.primaryModelId);
      if (modelDef) {
        return { modelId: rule.primaryModelId, providerId: modelDef.providerId };
      }
    }
  }

  // Fallback to default model
  const defaultModel = customerModels.find(m => m.isDefault);
  if (defaultModel) {
    const modelDef = modelDefs.find(m => m.modelId === defaultModel.modelId);
    if (modelDef) {
      return { modelId: defaultModel.modelId, providerId: modelDef.providerId };
    }
  }

  // Fallback to first enabled model
  if (customerModels.length > 0) {
    const modelDef = modelDefs.find(m => m.modelId === customerModels[0].modelId);
    if (modelDef) {
      return { modelId: customerModels[0].modelId, providerId: modelDef.providerId };
    }
  }

  return null;
}
