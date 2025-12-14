import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type ComparisonType = "class_average" | "grade_level" | "school_wide" | "subject_wise" | "historical";
export type TrendDirection = "up" | "down" | "stable";

export type ComparisonMetric = {
  id: string;
  student_user_id: string;
  comparison_type: ComparisonType;
  subject: string | null;
  metric_name_en: string;
  metric_name_hi: string | null;
  student_value: number;
  comparison_value: number;
  unit: string;
  trend: TrendDirection | null;
  trend_percentage: number | null;
  period: string;
  rank_position: number | null;
  total_in_group: number | null;
  percentile: number | null;
  insights_en: string | null;
  insights_hi: string | null;
  icon: string | null;
  created_at: string;
};

export type ComparisonAnalyticsSummary = {
  metrics: ComparisonMetric[];
  by_type: Record<ComparisonType, ComparisonMetric[]>;
  above_average_count: number;
  below_average_count: number;
  improving_count: number;
  total_count: number;
  child_id: string | null;
};

export function useComparisonAnalyticsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["comparison-analytics", customerId, parentUserId],
    queryFn: async (): Promise<ComparisonAnalyticsSummary> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) {
        return { metrics: [], by_type: {} as Record<ComparisonType, ComparisonMetric[]>, above_average_count: 0, below_average_count: 0, improving_count: 0, total_count: 0, child_id: null };
      }

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch comparison analytics for all children
      const { data: metricsData, error: metricsError } = await supabase
        .from("comparison_analytics")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .order("comparison_type", { ascending: true })
        .order("created_at", { ascending: false });

      if (metricsError) throw metricsError;

      const metrics: ComparisonMetric[] = (metricsData || []).map((m) => ({
        id: m.id,
        student_user_id: m.student_user_id,
        comparison_type: m.comparison_type,
        subject: m.subject,
        metric_name_en: m.metric_name_en,
        metric_name_hi: m.metric_name_hi,
        student_value: Number(m.student_value),
        comparison_value: Number(m.comparison_value),
        unit: m.unit || "%",
        trend: m.trend,
        trend_percentage: m.trend_percentage ? Number(m.trend_percentage) : null,
        period: m.period,
        rank_position: m.rank_position,
        total_in_group: m.total_in_group,
        percentile: m.percentile ? Number(m.percentile) : null,
        insights_en: m.insights_en,
        insights_hi: m.insights_hi,
        icon: m.icon,
        created_at: m.created_at,
      }));

      // Group by comparison type
      const by_type = metrics.reduce((acc, metric) => {
        if (!acc[metric.comparison_type]) {
          acc[metric.comparison_type] = [];
        }
        acc[metric.comparison_type].push(metric);
        return acc;
      }, {} as Record<ComparisonType, ComparisonMetric[]>);

      // Calculate summary stats
      const above_average_count = metrics.filter((m) => m.student_value > m.comparison_value).length;
      const below_average_count = metrics.filter((m) => m.student_value < m.comparison_value).length;
      const improving_count = metrics.filter((m) => m.trend === "up").length;

      return {
        metrics,
        by_type,
        above_average_count,
        below_average_count,
        improving_count,
        total_count: metrics.length,
        child_id: childIds[0] || null,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
