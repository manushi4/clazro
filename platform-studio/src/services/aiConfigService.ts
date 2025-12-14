import { getSupabase } from "@/lib/supabase/client";
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
  CustomerAIRoutingRule,
  CustomerAIBudget,
  AIKillSwitch,
  AIAuditEntry,
  AudienceProfileDefinition,
  AIConfigSummary,
} from "@/types/ai.types";

const supabase = getSupabase();

// ============================================================
// AI FEATURE DEFINITIONS (Global Catalog)
// ============================================================

export async function fetchAIFeatureDefinitions(): Promise<AIFeatureDefinition[]> {
  const { data, error } = await supabase
    .from("ai_feature_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER AI FEATURES (Per-Customer Assignments)
// ============================================================

export async function fetchCustomerAIFeatures(customerId: string): Promise<CustomerAIFeature[]> {
  const { data, error } = await supabase
    .from("customer_ai_features")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerAIFeature(feature: Partial<CustomerAIFeature> & { customer_id: string; feature_id: string }) {
  const { error } = await supabase
    .from("customer_ai_features")
    .upsert(
      { ...feature, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,feature_id" }
    );
  if (error) throw error;
}


export async function deleteCustomerAIFeature(customerId: string, featureId: string) {
  const { error } = await supabase
    .from("customer_ai_features")
    .delete()
    .eq("customer_id", customerId)
    .eq("feature_id", featureId);
  if (error) throw error;
}

// ============================================================
// AI PROVIDER DEFINITIONS
// ============================================================

export async function fetchAIProviderDefinitions(): Promise<AIProviderDefinition[]> {
  const { data, error } = await supabase
    .from("ai_provider_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER AI PROVIDERS
// ============================================================

export async function fetchCustomerAIProviders(customerId: string): Promise<CustomerAIProvider[]> {
  const { data, error } = await supabase
    .from("customer_ai_providers")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerAIProvider(provider: Partial<CustomerAIProvider> & { customer_id: string; provider_id: string }) {
  const { error } = await supabase
    .from("customer_ai_providers")
    .upsert(
      { ...provider, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,provider_id" }
    );
  if (error) throw error;
}

// ============================================================
// AI MODEL DEFINITIONS
// ============================================================

export async function fetchAIModelDefinitions(): Promise<AIModelDefinition[]> {
  const { data, error } = await supabase
    .from("ai_model_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER AI MODELS
// ============================================================

export async function fetchCustomerAIModels(customerId: string): Promise<CustomerAIModel[]> {
  const { data, error } = await supabase
    .from("customer_ai_models")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerAIModel(model: Partial<CustomerAIModel> & { customer_id: string; model_id: string }) {
  const { error } = await supabase
    .from("customer_ai_models")
    .upsert(
      { ...model, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,model_id" }
    );
  if (error) throw error;
}

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export async function fetchMCPToolDefinitions(): Promise<MCPToolDefinition[]> {
  const { data, error } = await supabase
    .from("mcp_tool_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER MCP TOOLS
// ============================================================

export async function fetchCustomerMCPTools(customerId: string): Promise<CustomerMCPTool[]> {
  const { data, error } = await supabase
    .from("customer_mcp_tools")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerMCPTool(tool: Partial<CustomerMCPTool> & { customer_id: string; tool_id: string }) {
  const { error } = await supabase
    .from("customer_mcp_tools")
    .upsert(
      { ...tool, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,tool_id" }
    );
  if (error) throw error;
}

// ============================================================
// AUTOMATION DEFINITIONS (Global Catalog - CRUD)
// ============================================================

export async function fetchAutomationDefinitions(): Promise<AutomationDefinition[]> {
  const { data, error } = await supabase
    .from("automation_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function createAutomationDefinition(
  automation: Omit<AutomationDefinition, "id" | "created_at" | "updated_at">
): Promise<AutomationDefinition> {
  const { data, error } = await supabase
    .from("automation_definitions")
    .insert({
      automation_id: automation.automation_id,
      name: automation.name,
      name_hi: automation.name_hi,
      description: automation.description,
      description_hi: automation.description_hi,
      category: automation.category,
      icon: automation.icon || "zap",
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config || {},
      steps: automation.steps || [],
      default_config: automation.default_config || {},
      risk_level: automation.risk_level || "low",
      requires_approval: automation.requires_approval || false,
      is_active: automation.is_active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAutomationDefinition(
  id: string,
  automation: Partial<AutomationDefinition>
): Promise<AutomationDefinition> {
  const { data, error } = await supabase
    .from("automation_definitions")
    .update({
      ...automation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAutomationDefinition(id: string): Promise<void> {
  const { error } = await supabase
    .from("automation_definitions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// CUSTOMER AUTOMATIONS
// ============================================================

export async function fetchCustomerAutomations(customerId: string): Promise<CustomerAutomation[]> {
  const { data, error } = await supabase
    .from("customer_automations")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerAutomation(automation: Partial<CustomerAutomation> & { customer_id: string; automation_id: string }) {
  const { error } = await supabase
    .from("customer_automations")
    .upsert(
      { ...automation, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,automation_id" }
    );
  if (error) throw error;
}


// ============================================================
// PROMPT DEFINITIONS
// ============================================================

export async function fetchPromptDefinitions(): Promise<PromptDefinition[]> {
  const { data, error } = await supabase
    .from("prompt_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER PROMPTS
// ============================================================

export async function fetchCustomerPrompts(customerId: string): Promise<CustomerPrompt[]> {
  const { data, error } = await supabase
    .from("customer_prompts")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerPrompt(prompt: Partial<CustomerPrompt> & { customer_id: string; prompt_id: string }) {
  const { error } = await supabase
    .from("customer_prompts")
    .upsert(
      { ...prompt, updated_at: new Date().toISOString() },
      { onConflict: "customer_id,prompt_id" }
    );
  if (error) throw error;
}

// ============================================================
// ROUTING RULES
// ============================================================

export async function fetchCustomerRoutingRules(customerId: string): Promise<CustomerAIRoutingRule[]> {
  const { data, error } = await supabase
    .from("customer_ai_routing_rules")
    .select("*")
    .eq("customer_id", customerId)
    .order("priority");
  if (error) throw error;
  return data || [];
}

export async function saveCustomerRoutingRule(rule: Partial<CustomerAIRoutingRule> & { customer_id: string }) {
  const { data, error } = await supabase
    .from("customer_ai_routing_rules")
    .upsert(
      { ...rule, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomerRoutingRule(ruleId: string) {
  const { error } = await supabase
    .from("customer_ai_routing_rules")
    .delete()
    .eq("id", ruleId);
  if (error) throw error;
}

// ============================================================
// BUDGETS
// ============================================================

export async function fetchCustomerBudgets(customerId: string): Promise<CustomerAIBudget[]> {
  const { data, error } = await supabase
    .from("customer_ai_budgets")
    .select("*")
    .eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function saveCustomerBudget(budget: Partial<CustomerAIBudget> & { customer_id: string }) {
  const { data, error } = await supabase
    .from("customer_ai_budgets")
    .upsert(
      { ...budget, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// KILL SWITCHES
// ============================================================

export async function fetchKillSwitches(): Promise<AIKillSwitch[]> {
  const { data, error } = await supabase
    .from("ai_kill_switches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function toggleKillSwitch(
  switchType: AIKillSwitch["switch_type"],
  referenceId: string | null,
  isActive: boolean,
  reason?: string
) {
  const { error } = await supabase
    .from("ai_kill_switches")
    .upsert(
      {
        switch_type: switchType,
        reference_id: referenceId,
        is_active: isActive,
        activated_at: isActive ? new Date().toISOString() : null,
        reason,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "switch_type,reference_id" }
    );
  if (error) throw error;
}

// ============================================================
// AUDIT LOGS
// ============================================================

export async function fetchAuditLogs(
  customerId: string,
  options?: { limit?: number; offset?: number; featureId?: string }
): Promise<AIAuditEntry[]> {
  let query = supabase
    .from("ai_audit_logs")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (options?.featureId) {
    query = query.eq("feature_id", options.featureId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// AUDIENCE PROFILES
// ============================================================

export async function fetchAudienceProfileDefinitions(): Promise<AudienceProfileDefinition[]> {
  const { data, error } = await supabase
    .from("audience_profile_definitions")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ============================================================
// AI CONFIG SUMMARY (Dashboard)
// ============================================================

export async function fetchAIConfigSummary(customerId: string): Promise<AIConfigSummary> {
  const [
    featureDefs,
    customerFeatures,
    providerDefs,
    customerProviders,
    modelDefs,
    customerModels,
    toolDefs,
    customerTools,
    automationDefs,
    customerAutomations,
    killSwitches,
    budgets,
  ] = await Promise.all([
    fetchAIFeatureDefinitions(),
    fetchCustomerAIFeatures(customerId),
    fetchAIProviderDefinitions(),
    fetchCustomerAIProviders(customerId),
    fetchAIModelDefinitions(),
    fetchCustomerAIModels(customerId),
    fetchMCPToolDefinitions(),
    fetchCustomerMCPTools(customerId),
    fetchAutomationDefinitions(),
    fetchCustomerAutomations(customerId),
    fetchKillSwitches(),
    fetchCustomerBudgets(customerId),
  ]);

  const enabledFeatureIds = new Set(customerFeatures.filter(f => f.is_enabled).map(f => f.feature_id));
  const enabledProviderIds = new Set(customerProviders.filter(p => p.is_enabled).map(p => p.provider_id));
  const enabledModelIds = new Set(customerModels.filter(m => m.is_enabled).map(m => m.model_id));
  const enabledToolIds = new Set(customerTools.filter(t => t.is_enabled).map(t => t.tool_id));
  const enabledAutomationIds = new Set(customerAutomations.filter(a => a.is_enabled).map(a => a.automation_id));

  const tenantBudget = budgets.find(b => b.budget_type === "tenant");
  const budgetUsagePercent = tenantBudget?.monthly_limit_usd
    ? (tenantBudget.current_monthly_spend / tenantBudget.monthly_limit_usd) * 100
    : 0;

  return {
    totalFeatures: featureDefs.filter(f => f.is_active).length,
    enabledFeatures: enabledFeatureIds.size,
    totalProviders: providerDefs.filter(p => p.is_active).length,
    enabledProviders: enabledProviderIds.size,
    totalModels: modelDefs.filter(m => m.is_active).length,
    enabledModels: enabledModelIds.size,
    totalTools: toolDefs.filter(t => t.is_active).length,
    enabledTools: enabledToolIds.size,
    totalAutomations: automationDefs.filter(a => a.is_active).length,
    enabledAutomations: enabledAutomationIds.size,
    activeKillSwitches: killSwitches.filter(k => k.is_active).length,
    budgetUsagePercent,
  };
}
