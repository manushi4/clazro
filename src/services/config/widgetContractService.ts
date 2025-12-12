import type { SupabaseClient } from "@supabase/supabase-js";
import { getWidgetRegistry } from "../../config/widgetRegistry";
import { getSupabaseClient } from "../../lib/supabaseClient";
import type { WidgetId } from "../../types/widget.types";

export type WidgetContractCheckResult = {
  ok: boolean;
  missingInRegistry: WidgetId[];
  missingInDb: WidgetId[];
  registrySize: number;
  dbSize: number;
};

export async function assertDbWidgetsMatchRegistry(
  supabase: SupabaseClient<any> | null = getSupabaseClient()
): Promise<WidgetContractCheckResult> {
  if (!supabase) {
    return { ok: true, missingInRegistry: [], missingInDb: [], registrySize: 0, dbSize: 0 };
  }

  const { data, error } = await supabase
    .schema("config_dev")
    .from("dashboard_widgets")
    .select("widget_id")
    .limit(1000);

  if (error) {
    throw error;
  }

  const registry = getWidgetRegistry();
  const registryIds = new Set(Object.keys(registry));
  const dbIds = new Set((data ?? []).map((row) => row.widget_id as WidgetId));

  const missingInRegistry: WidgetId[] = [];
  dbIds.forEach((id) => {
    if (!registryIds.has(id)) missingInRegistry.push(id);
  });

  const missingInDb: WidgetId[] = [];
  registryIds.forEach((id) => {
    if (!dbIds.has(id)) missingInDb.push(id as WidgetId);
  });

  return {
    ok: missingInRegistry.length === 0 && missingInDb.length === 0,
    missingInRegistry,
    missingInDb,
    registrySize: registryIds.size,
    dbSize: dbIds.size,
  };
}
