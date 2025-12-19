/**
 * Submission Query Hook
 * Handles fetching and creating assignment submissions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type SubmissionAttachment = {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size_bytes?: number;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  attachments: SubmissionAttachment[];
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export type CreateSubmissionInput = {
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  attachments?: SubmissionAttachment[];
};

/**
 * Hook to fetch existing submission for an assignment
 */
export function useSubmissionQuery(assignmentId: string, studentId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['submission', customerId, assignmentId, studentId],
    queryFn: async (): Promise<Submission | null> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useSubmissionQuery] Fetching submission:', { assignmentId, studentId });
      }

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) {
        if (__DEV__) console.log('[useSubmissionQuery] error:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        assignment_id: data.assignment_id,
        student_id: data.student_id,
        submission_text: data.submission_text,
        attachments: (data.attachments || []) as SubmissionAttachment[],
        status: data.status,
        score: data.score,
        feedback: data.feedback,
        submitted_at: data.submitted_at,
        graded_at: data.graded_at,
      };
    },
    enabled: !!customerId && !!assignmentId && !!studentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to create/update a submission
 */
export function useCreateSubmission() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubmissionInput): Promise<Submission> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useCreateSubmission] Creating submission:', input);
      }

      // Check if submission already exists
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('customer_id', customerId)
        .eq('assignment_id', input.assignment_id)
        .eq('student_id', input.student_id)
        .maybeSingle();

      let result;
      
      if (existing) {
        // Update existing submission
        const { data, error } = await supabase
          .from('submissions')
          .update({
            submission_text: input.submission_text || null,
            attachments: input.attachments || [],
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            customer_id: customerId,
            assignment_id: input.assignment_id,
            student_id: input.student_id,
            submission_text: input.submission_text || null,
            attachments: input.attachments || [],
            status: 'submitted',
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return {
        id: result.id,
        assignment_id: result.assignment_id,
        student_id: result.student_id,
        submission_text: result.submission_text,
        attachments: (result.attachments || []) as SubmissionAttachment[],
        status: result.status,
        score: result.score,
        feedback: result.feedback,
        submitted_at: result.submitted_at,
        graded_at: result.graded_at,
      };
    },
    onSuccess: (data, variables) => {
      // Invalidate submission query
      queryClient.invalidateQueries({ 
        queryKey: ['submission', customerId, variables.assignment_id, variables.student_id] 
      });
    },
  });
}
