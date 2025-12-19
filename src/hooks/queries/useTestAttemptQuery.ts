/**
 * Test Attempt Query Hook
 *
 * Fetches a test attempt by ID for the result/review screen.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useNetworkStatus } from "../../offline/networkStore";

export type TestAttemptDetail = {
  id: string;
  customer_id: string;
  test_id: string;
  student_id: string;
  status: "in_progress" | "submitted" | "graded";
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  answers: Array<{ questionId: string; answer: string | null }> | null;
  is_passed: boolean | null;
  created_at: string | null;
  // Joined data
  test?: {
    id: string;
    title_en: string;
    title_hi: string | null;
    duration_minutes: number | null;
    max_score: number | null;
    passing_score: number | null;
    show_answers_after: boolean | null;
    subject?: {
      id: string;
      title_en: string;
      title_hi: string | null;
      icon: string | null;
      color: string | null;
    } | null;
  } | null;
};

/**
 * Fetch a test attempt by ID with test details
 */
export function useTestAttemptQuery(attemptId: string | undefined) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["test-attempt-detail", attemptId],
    queryFn: async () => {
      if (!attemptId) throw new Error("Attempt ID required");

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("test_attempts")
        .select(`
          *,
          test:tests(
            id, title_en, title_hi, duration_minutes, max_score, passing_score, show_answers_after,
            subject:subjects(id, title_en, title_hi, icon, color)
          )
        `)
        .eq("id", attemptId)
        .single();

      if (error) throw error;
      return data as TestAttemptDetail;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!attemptId,
    retry: isOnline ? 2 : 0,
  });
}
