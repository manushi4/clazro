/**
 * Test Detail Query Hook
 *
 * Fetches a single test by ID for the test detail screen.
 * Supports offline caching and joins with subjects/teachers.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type TestDetail = {
  id: string;
  customer_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  instructions_en: string | null;
  instructions_hi: string | null;
  test_type: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  max_score: number | null;
  total_questions: number | null;
  passing_score: number | null;
  allow_late_submission: boolean | null;
  show_answers_after: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  subject?: {
    id: string;
    title_en: string;
    title_hi: string | null;
    icon: string | null;
    color: string | null;
  } | null;
  teacher?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Fetch a single test by ID with subject and teacher details
 */
export function useTestDetailQuery(testId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["test-detail", customerId, testId],
    queryFn: async () => {
      if (!testId) throw new Error("Test ID required");

      const supabase = getSupabaseClient();

      // Fetch test with joined subject and teacher data
      const { data, error } = await supabase
        .from("tests")
        .select(`
          *,
          subject:subjects(id, title_en, title_hi, icon, color),
          teacher:user_profiles!tests_teacher_id_fkey(id, first_name, last_name, display_name, avatar_url)
        `)
        .eq("id", testId)
        .single();

      if (error) {
        // If join fails, try fetching just the test
        const { data: testOnly, error: testError } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();

        if (testError) throw testError;
        return testOnly as TestDetail;
      }

      return data as TestDetail;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!testId,
    retry: isOnline ? 2 : 0,
  });
}
