import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type RecommendationType = "study" | "practice" | "resource" | "activity" | "schedule" | "goal";
export type RecommendationPriority = "high" | "medium" | "low";

export type AIRecommendation = {
  id: string;
  student_user_id: string;
  recommendation_type: RecommendationType;
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  action_label_en: string | null;
  action_label_hi: string | null;
  action_route: string | null;
  action_params: Record<string, unknown>;
  priority: RecommendationPriority;
  category: string;
  icon: string | null;
  relevance_score: number;
  valid_until: string | null;
  is_dismissed: boolean;
  is_completed: boolean;
  created_at: string;
};

export type AIRecommendationsSummary = {
  recommendations: AIRecommendation[];
  active_count: number;
  high_priority_count: number;
  total_count: number;
};

export function useAIRecommendationsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["ai-recommendations", customerId, parentUserId],
    queryFn: async (): Promise<AIRecommendationsSummary> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) {
        return { recommendations: [], active_count: 0, high_priority_count: 0, total_count: 0 };
      }

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch AI recommendations for all children
      const { data: recommendationsData, error: recommendationsError } = await supabase
        .from("ai_recommendations")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .eq("is_dismissed", false)
        .eq("is_completed", false)
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .order("relevance_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (recommendationsError) throw recommendationsError;

      const recommendations: AIRecommendation[] = (recommendationsData || []).map((r) => ({
        id: r.id,
        student_user_id: r.student_user_id,
        recommendation_type: r.recommendation_type,
        title_en: r.title_en,
        title_hi: r.title_hi,
        description_en: r.description_en,
        description_hi: r.description_hi,
        action_label_en: r.action_label_en,
        action_label_hi: r.action_label_hi,
        action_route: r.action_route,
        action_params: r.action_params || {},
        priority: r.priority,
        category: r.category,
        icon: r.icon,
        relevance_score: Number(r.relevance_score),
        valid_until: r.valid_until,
        is_dismissed: r.is_dismissed,
        is_completed: r.is_completed,
        created_at: r.created_at,
      }));

      const active_count = recommendations.length;
      const high_priority_count = recommendations.filter((r) => r.priority === "high").length;

      return {
        recommendations,
        active_count,
        high_priority_count,
        total_count: recommendations.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5,
  });
}
