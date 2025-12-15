/**
 * Config Resolver
 * Resolves feature, model, prompt, and routing configuration for a request
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  AIExecuteRequest,
  ResolvedConfig,
  FeatureConfig,
  ModelConfig,
  PromptConfig,
  ProviderConfig,
  AudienceProfileConfig,
  RoutingRule,
} from "./types.ts";

export async function resolveConfig(
  supabase: SupabaseClient,
  request: AIExecuteRequest
): Promise<ResolvedConfig> {
  const { tenantId, featureId, role, audienceProfile } = request;

  // Fetch all config in parallel
  const [
    featureResult,
    modelsResult,
    promptResult,
    providersResult,
    profileResult,
    routingResult,
  ] = await Promise.all([
    resolveFeature(supabase, tenantId, featureId, role, audienceProfile),
    resolveModels(supabase, tenantId, role, audienceProfile),
    resolvePrompt(supabase, tenantId, featureId, audienceProfile),
    resolveProviders(supabase, tenantId),
    resolveAudienceProfile(supabase, audienceProfile),
    resolveRoutingRules(supabase, tenantId, featureId, role, audienceProfile),
  ]);

  // Select primary model based on routing rules
  const primaryModel = selectPrimaryModel(modelsResult, routingResult);
  const fallbackModels = selectFallbackModels(modelsResult, routingResult, primaryModel);
  const provider = primaryModel
    ? providersResult.find((p) => p.provider_id === primaryModel.provider_id) || null
    : null;

  return {
    feature: featureResult,
    model: primaryModel,
    prompt: promptResult,
    provider,
    audienceProfile: profileResult,
    routingRules: routingResult,
    fallbackModels,
  };
}

async function resolveFeature(
  supabase: SupabaseClient,
  tenantId: string,
  featureId: string,
  role: string,
  profile: string
): Promise<FeatureConfig | null> {
  // Get feature definition
  const { data: def } = await supabase
    .from("ai_feature_definitions")
    .select("*")
    .eq("feature_id", featureId)
    .eq("is_active", true)
    .single();

  if (!def) return null;

  // Get customer override
  const { data: override } = await supabase
    .from("customer_ai_features")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("feature_id", featureId)
    .eq("is_enabled", true)
    .single();

  // Check role and profile access
  if (override) {
    if (!override.enabled_roles?.includes(role)) return null;
    if (!override.enabled_profiles?.includes(profile)) return null;
  }

  return {
    feature_id: def.feature_id,
    name: override?.custom_name || def.name,
    capability_class: def.capability_class,
    output_mode: override?.output_mode || def.default_output_mode,
    tools_policy: override?.tools_policy || def.default_tools_policy,
    max_tokens: override?.max_tokens || def.default_max_tokens,
    temperature: override?.temperature || def.default_temperature,
    config: { ...def.default_config, ...override?.config },
  };
}

async function resolveModels(
  supabase: SupabaseClient,
  tenantId: string,
  role: string,
  profile: string
): Promise<ModelConfig[]> {
  // Get all active model definitions
  const { data: defs } = await supabase
    .from("ai_model_definitions")
    .select("*")
    .eq("is_active", true)
    .eq("is_deprecated", false);

  if (!defs?.length) return [];

  // Get customer model assignments
  const { data: assignments } = await supabase
    .from("customer_ai_models")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("is_enabled", true);

  const assignmentMap = new Map(assignments?.map((a) => [a.model_id, a]) || []);

  return defs
    .filter((def) => {
      const assignment = assignmentMap.get(def.model_id);
      if (!assignment) return false;
      if (!assignment.allowed_roles?.includes(role)) return false;
      if (!assignment.allowed_profiles?.includes(profile)) return false;
      return true;
    })
    .map((def) => {
      const assignment = assignmentMap.get(def.model_id);
      return {
        model_id: def.model_id,
        provider_id: def.provider_id,
        name: def.name,
        context_window: def.context_window,
        max_output_tokens: def.max_output_tokens,
        supports_tools: def.supports_tools,
        supports_json_mode: def.supports_json_mode,
        cost_per_1k_input: def.cost_per_1k_input || 0,
        cost_per_1k_output: def.cost_per_1k_output || 0,
        temperature: assignment?.temperature || def.default_temperature,
      };
    });
}

async function resolvePrompt(
  supabase: SupabaseClient,
  tenantId: string,
  featureId: string,
  profile: string
): Promise<PromptConfig | null> {
  // Find prompt targeting this feature and profile
  const { data: def } = await supabase
    .from("prompt_definitions")
    .select("*")
    .contains("target_features", [featureId])
    .contains("target_profiles", [profile])
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (!def) return null;

  // Get customer override
  const { data: override } = await supabase
    .from("customer_prompts")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("prompt_id", def.prompt_id)
    .eq("is_enabled", true)
    .single();

  return {
    prompt_id: def.prompt_id,
    system_prompt: override?.system_prompt_override || def.system_prompt,
    user_template: override?.user_template_override || def.user_template,
    variables: override?.variables_override?.length ? override.variables_override : def.variables,
    forbidden_patterns: def.forbidden_patterns || [],
  };
}

async function resolveProviders(
  supabase: SupabaseClient,
  tenantId: string
): Promise<ProviderConfig[]> {
  // Get provider definitions
  const { data: defs } = await supabase
    .from("ai_provider_definitions")
    .select("*")
    .eq("is_active", true);

  if (!defs?.length) return [];

  // Get customer provider assignments
  const { data: assignments } = await supabase
    .from("customer_ai_providers")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("is_enabled", true);

  const assignmentMap = new Map(assignments?.map((a) => [a.provider_id, a]) || []);

  return defs
    .filter((def) => assignmentMap.has(def.provider_id))
    .map((def) => {
      const assignment = assignmentMap.get(def.provider_id)!;
      return {
        provider_id: def.provider_id,
        name: def.name,
        api_type: def.api_type,
        api_base_url: def.api_base_url,
        api_key: resolveApiKey(assignment.api_key_ref),
        supports_streaming: def.supports_streaming,
        supports_tools: def.supports_tools,
      };
    });
}

async function resolveAudienceProfile(
  supabase: SupabaseClient,
  profile: string
): Promise<AudienceProfileConfig | null> {
  const { data } = await supabase
    .from("audience_profile_definitions")
    .select("*")
    .eq("profile_id", profile)
    .eq("is_active", true)
    .single();

  if (!data) return null;

  return {
    profile_id: data.profile_id,
    tone: data.tone,
    max_response_length: data.max_response_length,
    forbidden_topics: data.forbidden_topics || [],
    safety_level: data.safety_level,
    require_parent_visibility: data.require_parent_visibility,
  };
}

async function resolveRoutingRules(
  supabase: SupabaseClient,
  tenantId: string,
  featureId: string,
  role: string,
  profile: string
): Promise<RoutingRule[]> {
  const { data } = await supabase
    .from("customer_ai_routing_rules")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("is_enabled", true)
    .order("priority");

  if (!data?.length) return [];

  // Filter rules that match this request
  return data
    .filter((rule) => {
      if (rule.feature_ids?.length && !rule.feature_ids.includes(featureId)) return false;
      if (rule.roles?.length && !rule.roles.includes(role)) return false;
      if (rule.profile_ids?.length && !rule.profile_ids.includes(profile)) return false;
      return true;
    })
    .map((rule) => ({
      rule_name: rule.rule_name,
      priority: rule.priority,
      primary_model_id: rule.primary_model_id,
      fallback_model_ids: rule.fallback_model_ids || [],
      max_tokens: rule.max_tokens,
      temperature: rule.temperature,
    }));
}

function selectPrimaryModel(
  models: ModelConfig[],
  rules: RoutingRule[]
): ModelConfig | null {
  if (!models.length) return null;

  // Use first matching routing rule
  if (rules.length) {
    const primaryId = rules[0].primary_model_id;
    const match = models.find((m) => m.model_id === primaryId);
    if (match) return match;
  }

  // Fallback to first available model
  return models[0];
}

function selectFallbackModels(
  models: ModelConfig[],
  rules: RoutingRule[],
  primary: ModelConfig | null
): ModelConfig[] {
  if (!primary || !models.length) return [];

  const fallbackIds = rules[0]?.fallback_model_ids || [];
  
  return models.filter(
    (m) => m.model_id !== primary.model_id && fallbackIds.includes(m.model_id)
  );
}

function resolveApiKey(keyRef?: string): string {
  if (!keyRef) return "";
  // API keys are stored as env var references like "OPENAI_API_KEY"
  return Deno.env.get(keyRef) || "";
}
