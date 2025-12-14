import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type AlertType = "academic" | "attendance" | "behavior" | "deadline" | "performance" | "engagement";
export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AIAlert = {
  id: string;
  student_user_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  action_required_en: string | null;
  action_required_hi: string | null;
  action_route: string | null;
  action_params: Record<string, unknown>;
  category: string;
  icon: string | null;
  triggered_at: string;
  expires_at: string | null;
  is_acknowledged: boolean;
  is_resolved: boolean;
  created_at: string;
};

export type AIAlertsSummary = {
  alerts: AIAlert[];
  critical_count: number;
  high_count: number;
  unacknowledged_count: number;
  total_count: number;
};

export function useAIAlertsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["ai-alerts", customerId, parentUserId],
    queryFn: async (): Promise<AIAlertsSummary> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) {
        return { alerts: [], critical_count: 0, high_count: 0, unacknowledged_count: 0, total_count: 0 };
      }

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch AI alerts for all children (not resolved, not expired)
      const { data: alertsData, error: alertsError } = await supabase
        .from("ai_alerts")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .eq("is_resolved", false)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .order("severity", { ascending: true }) // critical first
        .order("triggered_at", { ascending: false });

      if (alertsError) throw alertsError;

      const alerts: AIAlert[] = (alertsData || []).map((a) => ({
        id: a.id,
        student_user_id: a.student_user_id,
        alert_type: a.alert_type,
        severity: a.severity,
        title_en: a.title_en,
        title_hi: a.title_hi,
        description_en: a.description_en,
        description_hi: a.description_hi,
        action_required_en: a.action_required_en,
        action_required_hi: a.action_required_hi,
        action_route: a.action_route,
        action_params: a.action_params || {},
        category: a.category,
        icon: a.icon,
        triggered_at: a.triggered_at,
        expires_at: a.expires_at,
        is_acknowledged: a.is_acknowledged,
        is_resolved: a.is_resolved,
        created_at: a.created_at,
      }));

      // Sort by severity priority
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      const critical_count = alerts.filter((a) => a.severity === "critical").length;
      const high_count = alerts.filter((a) => a.severity === "high").length;
      const unacknowledged_count = alerts.filter((a) => !a.is_acknowledged).length;

      return {
        alerts,
        critical_count,
        high_count,
        unacknowledged_count,
        total_count: alerts.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes - alerts should refresh more frequently
  });
}
