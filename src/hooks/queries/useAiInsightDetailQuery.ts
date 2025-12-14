/**
 * AI Insight Detail Query Hook
 * Fetches a single AI insight by ID for parent viewing
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";

export type AiInsightDetail = {
  id: string;
  customer_id: string;
  user_id: string;
  child_user_id: string | null;
  insight_type: "performance" | "attendance" | "behavior" | "recommendation" | "alert" | "achievement";
  category: "academic" | "attendance" | "social" | "health" | "general";
  title_en: string;
  title_hi: string | null;
  description_en: string;
  description_hi: string | null;
  priority: "low" | "normal" | "high";
  action_url: string | null;
  action_label_en: string | null;
  action_label_hi: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  valid_until: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export function useAiInsightDetailQuery(insightId: string | undefined) {
  return useQuery({
    queryKey: ["ai-insight-detail", insightId],
    queryFn: async () => {
      if (!insightId) throw new Error("Insight ID required");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("id", insightId)
        .single();

      if (error) throw error;
      return data as AiInsightDetail;
    },
    enabled: !!insightId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useMarkInsightReadMutation() {
  const queryClient = require("@tanstack/react-query").useQueryClient();

  return require("@tanstack/react-query").useMutation({
    mutationFn: async (insightId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("ai_insights")
        .update({ is_read: true })
        .eq("id", insightId);

      if (error) throw error;
    },
    onSuccess: (_: any, insightId: string) => {
      queryClient.invalidateQueries({ queryKey: ["ai-insight-detail", insightId] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}

export function useDismissInsightMutation() {
  const queryClient = require("@tanstack/react-query").useQueryClient();

  return require("@tanstack/react-query").useMutation({
    mutationFn: async (insightId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("ai_insights")
        .update({ is_dismissed: true })
        .eq("id", insightId);

      if (error) throw error;
    },
    onSuccess: (_: any, insightId: string) => {
      queryClient.invalidateQueries({ queryKey: ["ai-insight-detail", insightId] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}
