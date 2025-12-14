/**
 * Kill Switch Checker
 * Checks if AI is disabled at global, tenant, or feature level
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface KillSwitchResult {
  blocked: boolean;
  reason?: string;
}

export async function checkKillSwitches(
  supabase: SupabaseClient,
  tenantId: string,
  featureId: string
): Promise<KillSwitchResult> {
  // Fetch all potentially relevant kill switches
  const { data: switches } = await supabase
    .from("ai_kill_switches")
    .select("*")
    .eq("is_active", true)
    .or(
      `switch_type.eq.global,` +
      `and(switch_type.eq.tenant,reference_id.eq.${tenantId}),` +
      `and(switch_type.eq.feature,reference_id.eq.${featureId})`
    );

  if (!switches?.length) {
    return { blocked: false };
  }

  // Check in priority order: global > tenant > feature
  for (const sw of switches) {
    // Check if auto-reactivate time has passed
    if (sw.auto_reactivate_at && new Date(sw.auto_reactivate_at) < new Date()) {
      continue; // Skip expired kill switches
    }

    if (sw.switch_type === "global") {
      return {
        blocked: true,
        reason: sw.reason || "AI services are temporarily disabled",
      };
    }

    if (sw.switch_type === "tenant" && sw.reference_id === tenantId) {
      return {
        blocked: true,
        reason: sw.reason || "AI services are disabled for your organization",
      };
    }

    if (sw.switch_type === "feature" && sw.reference_id === featureId) {
      return {
        blocked: true,
        reason: sw.reason || `The ${featureId} feature is temporarily disabled`,
      };
    }
  }

  return { blocked: false };
}

/**
 * Check if a specific provider is disabled
 */
export async function checkProviderKillSwitch(
  supabase: SupabaseClient,
  providerId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("ai_kill_switches")
    .select("id")
    .eq("switch_type", "provider")
    .eq("reference_id", providerId)
    .eq("is_active", true)
    .single();

  return !!data;
}

/**
 * Check if a specific model is disabled
 */
export async function checkModelKillSwitch(
  supabase: SupabaseClient,
  modelId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("ai_kill_switches")
    .select("id")
    .eq("switch_type", "model")
    .eq("reference_id", modelId)
    .eq("is_active", true)
    .single();

  return !!data;
}
