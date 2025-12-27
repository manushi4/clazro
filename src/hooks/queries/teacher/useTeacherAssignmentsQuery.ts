import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project' | 'practice' | 'classwork' | 'other';
export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';

export type Assignment = {
  id: string;
  customer_id: string;
  teacher_id: string | null;
  class_id: string | null;
  subject_id: string | null;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  instructions_en?: string;
  instructions_hi?: string;
  assignment_type: AssignmentType;
  chapter?: string;
  topic?: string;
  max_score: number;
  passing_score: number;
  assigned_date: string;
  due_date: string | null;
  late_submission_deadline?: string | null;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  is_visible_to_students: boolean;
  requires_file_upload: boolean;
  status: AssignmentStatus;
  attachments: any[];
  rubric?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  class?: {
    id: string;
    title_en: string;
    title_hi?: string;
  };
  // Computed
  submission_count?: number;
  pending_count?: number;
  graded_count?: number;
};

export type TeacherAssignmentsQueryOptions = {
  classId?: string;
  status?: AssignmentStatus | AssignmentStatus[];
  type?: AssignmentType | AssignmentType[];
  limit?: number;
  includeSubmissionCounts?: boolean;
};

/**
 * Query all assignments for the teacher
 */
export function useTeacherAssignmentsQuery(options?: TeacherAssignmentsQueryOptions) {
  const customerId = useCustomerId();
  const limit = options?.limit || 50;

  return useQuery({
    queryKey: ['teacher-assignments', customerId, options],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, title_en, title_hi)
        `)
        .eq('customer_id', customerId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(limit);

      // Filter by class
      if (options?.classId) {
        query = query.eq('class_id', options.classId);
      }

      // Filter by status
      if (options?.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Filter by type
      if (options?.type) {
        if (Array.isArray(options.type)) {
          query = query.in('assignment_type', options.type);
        } else {
          query = query.eq('assignment_type', options.type);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useTeacherAssignmentsQuery] Error:', error);
        throw error;
      }

      // If we need submission counts, fetch them separately
      if (options?.includeSubmissionCounts && data?.length) {
        const assignmentIds = data.map(a => a.id);

        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('assignment_id, status')
          .in('assignment_id', assignmentIds);

        // Count submissions per assignment
        const counts: Record<string, { total: number; pending: number; graded: number }> = {};
        submissions?.forEach(sub => {
          if (!counts[sub.assignment_id]) {
            counts[sub.assignment_id] = { total: 0, pending: 0, graded: 0 };
          }
          counts[sub.assignment_id].total++;
          if (sub.status === 'submitted' || sub.status === 'late') {
            counts[sub.assignment_id].pending++;
          } else if (sub.status === 'graded') {
            counts[sub.assignment_id].graded++;
          }
        });

        // Merge counts into assignments
        return data.map(assignment => ({
          ...assignment,
          submission_count: counts[assignment.id]?.total || 0,
          pending_count: counts[assignment.id]?.pending || 0,
          graded_count: counts[assignment.id]?.graded || 0,
        })) as Assignment[];
      }

      return (data || []) as Assignment[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query assignments with pending submissions (need grading)
 */
export function usePendingAssignmentsQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 20;

  return useQuery({
    queryKey: ['pending-assignments', customerId, { limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get assignments that have pending submissions
      const { data: pendingSubmissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .eq('customer_id', customerId)
        .in('status', ['submitted', 'late']);

      if (subError) throw subError;

      if (!pendingSubmissions?.length) {
        return [];
      }

      const assignmentIds = [...new Set(pendingSubmissions.map(s => s.assignment_id))];

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, title_en, title_hi)
        `)
        .eq('customer_id', customerId)
        .in('id', assignmentIds)
        .eq('status', 'published')
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Count pending per assignment
      const pendingCounts: Record<string, number> = {};
      pendingSubmissions.forEach(sub => {
        pendingCounts[sub.assignment_id] = (pendingCounts[sub.assignment_id] || 0) + 1;
      });

      return (data || []).map(assignment => ({
        ...assignment,
        pending_count: pendingCounts[assignment.id] || 0,
      })) as Assignment[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Query a single assignment by ID with full details
 */
export function useAssignmentDetailQuery(assignmentId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['assignment-detail', customerId, assignmentId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, title_en, title_hi)
        `)
        .eq('customer_id', customerId)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      // Get submission stats
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('status')
        .eq('assignment_id', assignmentId);

      const stats = {
        total: submissions?.length || 0,
        pending: submissions?.filter(s => s.status === 'submitted' || s.status === 'late').length || 0,
        graded: submissions?.filter(s => s.status === 'graded').length || 0,
      };

      return {
        ...data,
        submission_count: stats.total,
        pending_count: stats.pending,
        graded_count: stats.graded,
      } as Assignment;
    },
    enabled: !!customerId && !!assignmentId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Query upcoming assignments (due in next 7 days)
 */
export function useUpcomingAssignmentsQuery(options?: { days?: number; limit?: number }) {
  const customerId = useCustomerId();
  const days = options?.days || 7;
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['upcoming-assignments', customerId, { days, limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, title_en, title_hi)
        `)
        .eq('customer_id', customerId)
        .eq('status', 'published')
        .gte('due_date', now)
        .lte('due_date', futureDate)
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Assignment[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}
