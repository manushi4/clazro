/**
 * Test Questions Query Hook
 *
 * Fetches questions for a specific test for the test-attempt screen.
 * Supports offline caching.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type TestQuestion = {
  id: string;
  customer_id: string;
  test_id: string;
  question_number: number;
  question_type: "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank";
  question_en: string;
  question_hi: string | null;
  options: string[] | null; // For MCQ/true_false
  correct_answer: string | null;
  explanation_en: string | null;
  explanation_hi: string | null;
  marks: number;
  difficulty: "easy" | "medium" | "hard" | null;
  image_url: string | null;
  created_at: string | null;
};

/**
 * Fetch all questions for a test
 */
export function useTestQuestionsQuery(testId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["test-questions", customerId, testId],
    queryFn: async () => {
      if (!testId) throw new Error("Test ID required");

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_number", { ascending: true });

      if (error) throw error;
      return data as TestQuestion[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!testId,
    retry: isOnline ? 2 : 0,
  });
}
