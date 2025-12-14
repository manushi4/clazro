import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type InsightType = "performance" | "attendance" | "behavior" | "recommendation" | "alert" | "achievement";
export type InsightCategory = "academic" | "attendance" | "social" | "health" | "general";
export type InsightPriority = "low" | "normal" | "high";

export type AIInsightRecord = {
  id: string;
  child_user_id: string | null;
  insight_type: InsightType;
  category: InsightCategory;
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  priority: InsightPriority;
  action_url: string | null;
  action_label_en: string | null;
  action_label_hi: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type AIInsightsSummary = {
  insights: AIInsightRecord[];
  unread_count: number;
  high_priority_count: number;
  total_count: number;
};

export function useAIInsightsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["ai-insights", customerId, parentUserId],
    queryFn: async (): Promise<AIInsightsSummary> => {
      const supabase = getSupabaseClient();

      const { data: insights, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("customer_id", customerId)
        .eq("user_id", parentUserId)
        .eq("is_dismissed", false)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const records = (insights || []).map(mapInsightRecord);
      const unreadCount = records.filter((i) => !i.is_read).length;
      const highPriorityCount = records.filter((i) => i.priority === "high" && !i.is_read).length;

      return {
        insights: records,
        unread_count: unreadCount,
        high_priority_count: highPriorityCount,
        total_count: records.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5,
  });
}

function mapInsightRecord(i: any): AIInsightRecord {
  return {
    id: i.id,
    child_user_id: i.child_user_id,
    insight_type: i.insight_type,
    category: i.category,
    title_en: i.title_en,
    title_hi: i.title_hi,
    description_en: i.description_en,
    description_hi: i.description_hi,
    priority: i.priority,
    action_url: i.action_url,
    action_label_en: i.action_label_en,
    action_label_hi: i.action_label_hi,
    is_read: i.is_read,
    is_dismissed: i.is_dismissed,
    metadata: i.metadata,
    created_at: i.created_at,
  };
}
