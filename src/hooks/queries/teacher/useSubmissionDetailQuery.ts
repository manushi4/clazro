import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type SubmissionDetail = {
  id: string;
  customer_id: string;
  assignment_id: string;
  student_user_id: string;
  submission_text: string | null;
  attachments: any[] | null;
  status: "pending" | "submitted" | "late" | "graded" | "returned" | "resubmit";
  submitted_at: string | null;
  is_late: boolean;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  grade_letter: string | null;
  feedback_en: string | null;
  feedback_hi: string | null;
  graded_by: string | null;
  graded_at: string | null;
  rubric_scores: any | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assignment: {
    id: string;
    title_en: string;
    title_hi: string | null;
    instructions_en: string | null;
    instructions_hi: string | null;
    max_score: number;
    assignment_type: string;
    due_date: string | null;
  } | null;
  student?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Fetch a single submission with assignment and student details
 */
export function useSubmissionDetailQuery(submissionId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["submission-detail", customerId, submissionId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("assignment_submissions")
        .select(`
          *,
          assignment:assignments(
            id,
            title_en,
            title_hi,
            instructions_en,
            instructions_hi,
            max_score,
            assignment_type,
            due_date
          )
        `)
        .eq("customer_id", customerId)
        .eq("id", submissionId)
        .single();

      if (error) {
        console.error("[useSubmissionDetailQuery] Error:", error);
        throw new Error(`Failed to fetch submission: ${error.message}`);
      }

      // Optionally fetch student profile
      if (data?.student_user_id) {
        const { data: studentData } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .eq("user_id", data.student_user_id)
          .single();

        return {
          ...data,
          student: studentData,
        } as SubmissionDetail;
      }

      return data as SubmissionDetail;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!customerId && !!submissionId,
  });
}

export default useSubmissionDetailQuery;
