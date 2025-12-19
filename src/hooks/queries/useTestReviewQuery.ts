/**
 * Test Review Query Hook
 *
 * Fetches a test attempt with questions for review after submission.
 * Includes student answers, correct answers, and explanations.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";
import { TestQuestion } from "./useTestQuestionsQuery";

export type TestAttemptAnswer = {
  questionId: string;
  answer: string | null;
  timeTaken?: number;
};

export type TestAttemptReview = {
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
  answers: TestAttemptAnswer[] | null;
  is_passed: boolean | null;
  feedback: string | null;
  graded_at: string | null;
  created_at: string | null;
  // Joined data
  test?: {
    id: string;
    title_en: string;
    title_hi: string | null;
    description_en: string | null;
    description_hi: string | null;
    duration_minutes: number | null;
    max_score: number | null;
    passing_score: number | null;
    test_type: string | null;
    show_answers_after: boolean | null;
    subject?: {
      id: string;
      title_en: string;
      title_hi: string | null;
      icon: string | null;
      color: string | null;
    } | null;
  } | null;
  questions?: TestQuestion[];
};

/**
 * Fetch a test attempt with all questions for review
 */
export function useTestReviewQuery(attemptId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["test-review", customerId, attemptId],
    queryFn: async () => {
      if (!attemptId) throw new Error("Attempt ID required");

      const supabase = getSupabaseClient();

      // Fetch attempt with test details
      const { data: attempt, error: attemptError } = await supabase
        .from("test_attempts")
        .select(`
          *,
          test:tests(
            id, title_en, title_hi, description_en, description_hi,
            duration_minutes, max_score, passing_score, test_type, show_answers_after,
            subject:subjects(id, title_en, title_hi, icon, color)
          )
        `)
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Fetch questions for this test
      const { data: questions, error: questionsError } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_id", attempt.test_id)
        .order("question_number", { ascending: true });

      if (questionsError) throw questionsError;

      return {
        ...attempt,
        questions,
      } as TestAttemptReview;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!attemptId,
    retry: isOnline ? 2 : 0,
  });
}
