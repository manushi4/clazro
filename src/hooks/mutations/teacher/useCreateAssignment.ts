import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import type { AssignmentType, AssignmentStatus } from '../../queries/teacher/useTeacherAssignmentsQuery';

export type CreateAssignmentPayload = {
  classId?: string;
  subjectId?: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  instructions_en?: string;
  instructions_hi?: string;
  assignment_type: AssignmentType;
  chapter?: string;
  topic?: string;
  max_score?: number;
  passing_score?: number;
  due_date?: string;
  late_submission_deadline?: string;
  allow_late_submission?: boolean;
  late_penalty_percent?: number;
  is_visible_to_students?: boolean;
  requires_file_upload?: boolean;
  attachments?: any[];
  rubric?: any;
  status?: AssignmentStatus;
};

export type UpdateAssignmentPayload = Partial<CreateAssignmentPayload> & {
  id: string;
};

/**
 * Create a new assignment
 */
export function useCreateAssignment() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAssignmentPayload) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          customer_id: customerId,
          class_id: payload.classId || null,
          subject_id: payload.subjectId || null,
          title_en: payload.title_en,
          title_hi: payload.title_hi || null,
          description_en: payload.description_en || null,
          description_hi: payload.description_hi || null,
          instructions_en: payload.instructions_en || null,
          instructions_hi: payload.instructions_hi || null,
          assignment_type: payload.assignment_type,
          chapter: payload.chapter || null,
          topic: payload.topic || null,
          max_score: payload.max_score || 100,
          passing_score: payload.passing_score || 40,
          due_date: payload.due_date || null,
          late_submission_deadline: payload.late_submission_deadline || null,
          allow_late_submission: payload.allow_late_submission ?? true,
          late_penalty_percent: payload.late_penalty_percent ?? 10,
          is_visible_to_students: payload.is_visible_to_students ?? true,
          requires_file_upload: payload.requires_file_upload ?? false,
          attachments: payload.attachments || [],
          rubric: payload.rubric || null,
          status: payload.status || 'draft',
          assigned_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('[useCreateAssignment] Error:', error);
        throw new Error(`Failed to create assignment: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

/**
 * Update an existing assignment
 */
export function useUpdateAssignment() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateAssignmentPayload) => {
      const supabase = getSupabaseClient();
      const { id, ...updates } = payload;

      // Map camelCase to snake_case
      const dbUpdates: Record<string, any> = {};
      if (updates.classId !== undefined) dbUpdates.class_id = updates.classId;
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
      if (updates.title_en !== undefined) dbUpdates.title_en = updates.title_en;
      if (updates.title_hi !== undefined) dbUpdates.title_hi = updates.title_hi;
      if (updates.description_en !== undefined) dbUpdates.description_en = updates.description_en;
      if (updates.description_hi !== undefined) dbUpdates.description_hi = updates.description_hi;
      if (updates.instructions_en !== undefined) dbUpdates.instructions_en = updates.instructions_en;
      if (updates.instructions_hi !== undefined) dbUpdates.instructions_hi = updates.instructions_hi;
      if (updates.assignment_type !== undefined) dbUpdates.assignment_type = updates.assignment_type;
      if (updates.chapter !== undefined) dbUpdates.chapter = updates.chapter;
      if (updates.topic !== undefined) dbUpdates.topic = updates.topic;
      if (updates.max_score !== undefined) dbUpdates.max_score = updates.max_score;
      if (updates.passing_score !== undefined) dbUpdates.passing_score = updates.passing_score;
      if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
      if (updates.late_submission_deadline !== undefined) dbUpdates.late_submission_deadline = updates.late_submission_deadline;
      if (updates.allow_late_submission !== undefined) dbUpdates.allow_late_submission = updates.allow_late_submission;
      if (updates.late_penalty_percent !== undefined) dbUpdates.late_penalty_percent = updates.late_penalty_percent;
      if (updates.is_visible_to_students !== undefined) dbUpdates.is_visible_to_students = updates.is_visible_to_students;
      if (updates.requires_file_upload !== undefined) dbUpdates.requires_file_upload = updates.requires_file_upload;
      if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
      if (updates.rubric !== undefined) dbUpdates.rubric = updates.rubric;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('assignments')
        .update(dbUpdates)
        .eq('customer_id', customerId)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateAssignment] Error:', error);
        throw new Error(`Failed to update assignment: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assignments'] });
    },
  });
}

/**
 * Delete an assignment
 */
export function useDeleteAssignment() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('id', assignmentId);

      if (error) {
        console.error('[useDeleteAssignment] Error:', error);
        throw new Error(`Failed to delete assignment: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

/**
 * Publish a draft assignment
 */
export function usePublishAssignment() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('assignments')
        .update({ status: 'published' })
        .eq('customer_id', customerId)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('[usePublishAssignment] Error:', error);
        throw new Error(`Failed to publish assignment: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assignments'] });
    },
  });
}

/**
 * Close an assignment (no more submissions)
 */
export function useCloseAssignment() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('assignments')
        .update({ status: 'closed' })
        .eq('customer_id', customerId)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('[useCloseAssignment] Error:', error);
        throw new Error(`Failed to close assignment: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
    },
  });
}
