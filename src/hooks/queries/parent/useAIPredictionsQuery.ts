import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type PredictionType = "performance" | "attendance" | "behavior" | "risk" | "achievement";
export type PredictionPriority = "high" | "medium" | "low";

export type AIPrediction = {
  id: string;
  student_user_id: string;
  prediction_type: PredictionType;
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  confidence_score: number;
  priority: PredictionPriority;
  category: string;
  predicted_outcome: string | null;
  recommendation_en: string | null;
  recommendation_hi: string | null;
  valid_until: string | null;
  is_read: boolean;
  created_at: string;
};

export type AIPredictionsSummary = {
  predictions: AIPrediction[];
  unread_count: number;
  high_priority_count: number;
  total_count: number;
};

export function useAIPredictionsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["ai-predictions", customerId, parentUserId],
    queryFn: async (): Promise<AIPredictionsSummary> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) {
        return { predictions: [], unread_count: 0, high_priority_count: 0, total_count: 0 };
      }

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch AI predictions for all children
      const { data: predictionsData, error: predictionsError } = await supabase
        .from("ai_predictions")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (predictionsError) throw predictionsError;

      const predictions: AIPrediction[] = (predictionsData || []).map((p) => ({
        id: p.id,
        student_user_id: p.student_user_id,
        prediction_type: p.prediction_type,
        title_en: p.title_en,
        title_hi: p.title_hi,
        description_en: p.description_en,
        description_hi: p.description_hi,
        confidence_score: Number(p.confidence_score),
        priority: p.priority,
        category: p.category,
        predicted_outcome: p.predicted_outcome,
        recommendation_en: p.recommendation_en,
        recommendation_hi: p.recommendation_hi,
        valid_until: p.valid_until,
        is_read: p.is_read,
        created_at: p.created_at,
      }));

      const unread_count = predictions.filter((p) => !p.is_read).length;
      const high_priority_count = predictions.filter((p) => p.priority === "high").length;

      return {
        predictions,
        unread_count,
        high_priority_count,
        total_count: predictions.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5,
  });
}
