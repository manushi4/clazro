import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type QuickActionColor = "primary" | "secondary" | "tertiary" | "success" | "warning" | "error" | "info";

export type QuickActionRecord = {
  id: string;
  action_id: string;
  label_en: string;
  label_hi: string | null;
  icon: string;
  color: QuickActionColor;
  route: string;
  order_index: number;
  enabled: boolean;
  requires_online: boolean;
};

export function useParentQuickActionsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["parent-quick-actions", customerId],
    queryFn: async (): Promise<QuickActionRecord[]> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("quick_actions")
        .select("*")
        .eq("customer_id", customerId)
        .eq("role", "parent")
        .eq("enabled", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return (data || []).map(mapQuickAction);
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10, // 10 minutes - actions don't change often
  });
}

function mapQuickAction(a: any): QuickActionRecord {
  return {
    id: a.id,
    action_id: a.action_id,
    label_en: a.label_en,
    label_hi: a.label_hi,
    icon: a.icon,
    color: a.color || "primary",
    route: a.route,
    order_index: a.order_index,
    enabled: a.enabled,
    requires_online: a.requires_online,
  };
}
