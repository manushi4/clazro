import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type AssignmentAttachment = {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size_bytes?: number;
};

export type AssignmentDetail = {
  id: string;
  title: string;
  instructions: string;
  assignment_type: 'homework' | 'project' | 'practice' | 'classwork';
  due_date: string;
  max_score: number;
  status: 'draft' | 'published' | 'closed';
  attachments: AssignmentAttachment[];
  subject: {
    id: string;
    name: string;
    code: string;
    icon: string;
    color: string;
  } | null;
  teacher: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  // Computed fields
  is_overdue: boolean;
  days_remaining: number;
};

export function useAssignmentDetailQuery(assignmentId: string) {
  const customerId = useCustomerId();
  const lang = i18n.language;

  if (__DEV__) {
    console.log('[useAssignmentDetailQuery] Hook called with:', { assignmentId, customerId, lang });
  }

  return useQuery({
    queryKey: ['assignment-detail', customerId, assignmentId, lang],
    queryFn: async (): Promise<AssignmentDetail | null> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useAssignmentDetailQuery] queryFn executing:', { assignmentId, customerId });
      }

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects:subject_id(id, title_en, title_hi, code, icon, color)
        `)
        .eq('customer_id', customerId)
        .eq('id', assignmentId)
        .single();

      if (__DEV__) {
        console.log('[useAssignmentDetailQuery] Query result:', { data, error });
      }

      if (error) {
        if (__DEV__) console.log('[useAssignmentDetailQuery] error:', error);
        throw error;
      }

      if (!data) {
        if (__DEV__) console.log('[useAssignmentDetailQuery] No data returned');
        return null;
      }

      if (__DEV__) {
        console.log('[useAssignmentDetailQuery] Data found:', data.id, data.title_en);
      }

      const now = new Date();
      const dueDate = data.due_date ? new Date(data.due_date) : null;
      const isOverdue = dueDate ? dueDate < now : false;
      const daysRemaining = dueDate 
        ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: data.id,
        title: getLocalizedField(data, 'title', lang) || data.title_en,
        instructions: getLocalizedField(data, 'instructions', lang) || data.instructions_en || '',
        assignment_type: data.assignment_type || 'homework',
        due_date: data.due_date,
        max_score: data.max_score || 100,
        status: data.status || 'published',
        attachments: (data.attachments || []) as AssignmentAttachment[],
        subject: data.subjects ? {
          id: data.subjects.id,
          name: getLocalizedField(data.subjects, 'title', lang) || data.subjects.title_en,
          code: data.subjects.code || '',
          icon: data.subjects.icon || 'book-outline',
          color: data.subjects.color || '#6366F1',
        } : null,
        teacher: null, // Would join with teacher profile if needed
        created_at: data.created_at,
        is_overdue: isOverdue,
        days_remaining: daysRemaining,
      };
    },
    enabled: !!customerId && !!assignmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
