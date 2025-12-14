import type { SupabaseClient } from "@supabase/supabase-js";
import { getFeatureRegistry } from "../../config/featureRegistry";
import { getSupabaseClient } from "../../lib/supabaseClient";

export type ContractCheckResult = {
  ok: boolean;
  missingInRegistry: string[];
  registrySize: number;
  dbSize: number;
};

export async function assertDbFeaturesInRegistry(
  supabase: SupabaseClient<any> | null = getSupabaseClient()
): Promise<ContractCheckResult> {
  if (!supabase) {
    return { ok: true, missingInRegistry: [], registrySize: 0, dbSize: 0 };
  }

  const { data, error } = await supabase
    .schema("config_dev")
    .from("customer_features")
    .select("feature_id")
    .limit(1000);

  if (error) {
    throw error;
  }

  const registry = getFeatureRegistry();
  const registryIds = new Set(registry.map((f) => f.id));
  const dbIds = new Set((data ?? []).map((row) => row.feature_id as string));

  const missingInRegistry: string[] = [];
  dbIds.forEach((id) => {
    if (!registryIds.has(id)) missingInRegistry.push(id);
  });

  return {
    ok: missingInRegistry.length === 0,
    missingInRegistry,
    registrySize: registryIds.size,
    dbSize: dbIds.size,
  };
}
