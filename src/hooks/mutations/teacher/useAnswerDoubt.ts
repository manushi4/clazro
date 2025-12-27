import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export type AnswerDoubtPayload = {
  doubtId: string;
  answer: string;
  answerImage?: string;
  useAiSuggestion?: boolean;
};

export type AnswerDoubtResult = {
  success: boolean;
  doubtId: string;
  message: string;
};

export const useAnswerDoubt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (payload: AnswerDoubtPayload): Promise<AnswerDoubtResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { doubtId, answer, answerImage } = payload;

      const { error } = await supabase
        .from("teacher_doubts")
        .update({
          answer,
          answer_image: answerImage || null,
          answered_at: new Date().toISOString(),
          is_resolved: true,
          status: "answered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", doubtId)
        .eq("customer_id", customerId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        doubtId,
        message: "Doubt answered successfully",
      };
    },
    onSuccess: () => {
      // Invalidate doubts queries
      queryClient.invalidateQueries({ queryKey: ["teacher-doubts"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-doubts-pending-count"] });
    },
  });
};

// Mark doubt as resolved without answering
export const useResolveDoubt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (doubtId: string): Promise<AnswerDoubtResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { error } = await supabase
        .from("teacher_doubts")
        .update({
          is_resolved: true,
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", doubtId)
        .eq("customer_id", customerId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        doubtId,
        message: "Doubt marked as resolved",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-doubts"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-doubts-pending-count"] });
    },
  });
};

// Bookmark a doubt for later
export const useBookmarkDoubt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async ({ doubtId, bookmark }: { doubtId: string; bookmark: boolean }): Promise<AnswerDoubtResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { error } = await supabase
        .from("teacher_doubts")
        .update({
          is_bookmarked: bookmark,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doubtId)
        .eq("customer_id", customerId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        doubtId,
        message: bookmark ? "Doubt bookmarked" : "Bookmark removed",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-doubts"] });
    },
  });
};
