/**
 * Prediction Detail Query Hook
 * Fetches a single AI prediction by ID for parent viewing
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";

export type PredictionDetail = {
  id: string;
  customer_id: string;
  student_user_id: string;
  prediction_type: "grade" | "attendance" | "performance" | "behavior" | "improvement";
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  confidence_score: number;
  priority: "low" | "normal" | "high" | "critical";
  category: "academic" | "attendance" | "social" | "health" | "general";
  predicted_outcome: string | null;
  recommendation_en: string | null;
  recommendation_hi: string | null;
  valid_until: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export function usePredictionDetailQuery(predictionId: string | undefined) {
  return useQuery({
    queryKey: ["prediction-detail", predictionId],
    queryFn: async () => {
      if (!predictionId) throw new Error("Prediction ID required");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("ai_predictions")
        .select("*")
        .eq("id", predictionId)
        .single();

      if (error) throw error;
      return data as PredictionDetail;
    },
    enabled: !!predictionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useMarkPredictionReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (predictionId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("ai_predictions")
        .update({ is_read: true })
        .eq("id", predictionId);

      if (error) throw error;
    },
    onSuccess: (_: unknown, predictionId: string) => {
      queryClient.invalidateQueries({ queryKey: ["prediction-detail", predictionId] });
      queryClient.invalidateQueries({ queryKey: ["ai-predictions"] });
    },
  });
}
