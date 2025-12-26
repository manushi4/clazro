import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded' | 'returned' | 'resubmit';

export type GradeSubmissionPayload = {
  submissionId: string;
  score: number;
  maxScore?: number;
  feedback_en?: string;
  feedback_hi?: string;
  rubric_scores?: any;
  grade_letter?: string;
};

export type BulkGradePayload = {
  assignmentId: string;
  grades: Array<{
    submissionId: string;
    score: number;
    feedback_en?: string;
  }>;
};

export type ReturnSubmissionPayload = {
  submissionId: string;
  feedback_en?: string;
  feedback_hi?: string;
  requiresResubmit?: boolean;
};

/**
 * Grade a single submission
 */
export function useGradeSubmission() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GradeSubmissionPayload) => {
      const supabase = getSupabaseClient();

      // Calculate percentage
      const maxScore = payload.maxScore || 100;
      const percentage = Math.round((payload.score / maxScore) * 100 * 100) / 100;

      // Determine grade letter based on percentage
      const gradeLetter = payload.grade_letter || calculateGradeLetter(percentage);

      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          score: payload.score,
          max_score: maxScore,
          percentage,
          grade_letter: gradeLetter,
          feedback_en: payload.feedback_en || null,
          feedback_hi: payload.feedback_hi || null,
          rubric_scores: payload.rubric_scores || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .eq('id', payload.submissionId)
        .select()
        .single();

      if (error) {
        console.error('[useGradeSubmission] Error:', error);
        throw new Error(`Failed to grade submission: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-grading'] });
      queryClient.invalidateQueries({ queryKey: ['grading-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-grades'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

/**
 * Bulk grade multiple submissions at once
 */
export function useBulkGradeSubmissions() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkGradePayload) => {
      const supabase = getSupabaseClient();
      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      for (const grade of payload.grades) {
        const percentage = grade.score; // Assuming score is already percentage
        const gradeLetter = calculateGradeLetter(percentage);

        const { error } = await supabase
          .from('assignment_submissions')
          .update({
            score: grade.score,
            percentage,
            grade_letter: gradeLetter,
            feedback_en: grade.feedback_en || null,
            status: 'graded',
            graded_at: new Date().toISOString(),
          })
          .eq('customer_id', customerId)
          .eq('id', grade.submissionId);

        results.push({
          id: grade.submissionId,
          success: !error,
          error: error?.message,
        });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        total: payload.grades.length,
        successful,
        failed,
        results,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-grading'] });
      queryClient.invalidateQueries({ queryKey: ['grading-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-grades'] });
    },
  });
}

/**
 * Return a submission for revision
 */
export function useReturnSubmission() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReturnSubmissionPayload) => {
      const supabase = getSupabaseClient();

      const newStatus: SubmissionStatus = payload.requiresResubmit ? 'resubmit' : 'returned';

      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          status: newStatus,
          feedback_en: payload.feedback_en || null,
          feedback_hi: payload.feedback_hi || null,
        })
        .eq('customer_id', customerId)
        .eq('id', payload.submissionId)
        .select()
        .single();

      if (error) {
        console.error('[useReturnSubmission] Error:', error);
        throw new Error(`Failed to return submission: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-grading'] });
    },
  });
}

/**
 * Query submissions for an assignment
 */
export function useAssignmentSubmissionsQuery(assignmentId: string, options?: { status?: SubmissionStatus | SubmissionStatus[] }) {
  const customerId = useCustomerId();

  return {
    queryKey: ['assignment-submissions', customerId, assignmentId, options],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('assignment_submissions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (options?.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId && !!assignmentId,
    staleTime: 1000 * 60,
  };
}

// Helper function to calculate grade letter
function calculateGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}
