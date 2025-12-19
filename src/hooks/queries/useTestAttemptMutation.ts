/**
 * Test Attempt Mutation Hook
 *
 * Handles creating and updating test attempts.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";

export type TestAttemptAnswer = {
  questionId: string;
  answer: string | null;
  timeTaken?: number; // seconds spent on this question
};

export type TestAttempt = {
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
  created_at: string | null;
  updated_at: string | null;
};

type StartAttemptInput = {
  testId: string;
  studentId: string;
};

type SubmitAttemptInput = {
  attemptId: string;
  answers: TestAttemptAnswer[];
  timeSpentSeconds: number;
};

/**
 * Start a new test attempt
 */
export function useStartTestAttempt() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testId, studentId }: StartAttemptInput) => {
      const supabase = getSupabaseClient();

      // Check for existing in-progress attempt
      const { data: existing } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("student_id", studentId)
        .eq("status", "in_progress")
        .single();

      if (existing) {
        return existing as TestAttempt;
      }

      // Create new attempt
      const { data, error } = await supabase
        .from("test_attempts")
        .insert({
          customer_id: customerId,
          test_id: testId,
          student_id: studentId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          answers: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as TestAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["test-attempts"] });
    },
  });
}

/**
 * Submit a test attempt with answers
 */
export function useSubmitTestAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attemptId, answers, timeSpentSeconds }: SubmitAttemptInput) => {
      const supabase = getSupabaseClient();

      // Get the attempt to find test_id
      const { data: attempt, error: attemptError } = await supabase
        .from("test_attempts")
        .select("*, test:tests(*)")
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get questions to calculate score
      const { data: questions, error: questionsError } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_id", attempt.test_id);

      if (questionsError) throw questionsError;

      // Calculate score
      let score = 0;
      let totalMarks = 0;

      questions.forEach((q: any) => {
        totalMarks += q.marks || 1;
        const studentAnswer = answers.find((a) => a.questionId === q.id);
        if (studentAnswer?.answer && q.correct_answer) {
          // Case-insensitive comparison for text answers
          const isCorrect = studentAnswer.answer.toLowerCase().trim() === 
                           q.correct_answer.toLowerCase().trim();
          if (isCorrect) {
            score += q.marks || 1;
          }
        }
      });

      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const passingScore = attempt.test?.passing_score || 40;
      const isPassed = percentage >= passingScore;

      // Update attempt
      const { data, error } = await supabase
        .from("test_attempts")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          time_spent_seconds: timeSpentSeconds,
          answers: answers,
          score: score,
          total_marks: totalMarks,
          percentage: percentage,
          is_passed: isPassed,
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (error) throw error;
      return data as TestAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["test-detail"] });
    },
  });
}

/**
 * Save progress (auto-save answers during test)
 */
export function useSaveTestProgress() {
  return useMutation({
    mutationFn: async ({ attemptId, answers }: { attemptId: string; answers: TestAttemptAnswer[] }) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("test_attempts")
        .update({
          answers: answers,
          updated_at: new Date().toISOString(),
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (error) throw error;
      return data as TestAttempt;
    },
  });
}
