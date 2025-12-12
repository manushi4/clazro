import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type ChildAssignment = {
  id: string;
  title_en: string;
  title_hi: string | null;
  assignment_type: 'homework' | 'project' | 'quiz' | 'test';
  due_date: string;
  max_score: number;
  status: string;
  subject_name: string;
  subject_id: string;
  child_user_id: string;
  child_name: string;
  is_overdue: boolean;
  days_until_due: number;
};

export function useChildAssignmentsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-assignments', customerId, parentUserId],
    queryFn: async (): Promise<ChildAssignment[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildAssignmentsQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      // Fetch assignments for the customer with subject info
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title_en,
          title_hi,
          assignment_type,
          due_date,
          max_score,
          status,
          subject_id,
          subjects (
            title_en
          )
        `)
        .eq('customer_id', customerId)
        .eq('status', 'published')
        .order('due_date', { ascending: true });

      if (error) {
        if (__DEV__) console.log('[useChildAssignmentsQuery] error:', error);
        throw error;
      }

      if (!assignments) return [];

      const now = new Date();
      const childAssignments: ChildAssignment[] = [];

      // For each child, map assignments
      for (const child of children) {
        for (const assignment of assignments) {
          const dueDate = new Date(assignment.due_date);
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          childAssignments.push({
            id: assignment.id,
            title_en: assignment.title_en,
            title_hi: assignment.title_hi,
            assignment_type: assignment.assignment_type as ChildAssignment['assignment_type'],
            due_date: assignment.due_date,
            max_score: assignment.max_score,
            status: assignment.status,
            subject_name: (assignment.subjects as any)?.title_en || 'Unknown',
            subject_id: assignment.subject_id,
            child_user_id: child.child_user_id,
            child_name: child.child_name,
            is_overdue: diffDays < 0,
            days_until_due: diffDays,
          });
        }
      }

      // Sort by due date (overdue first, then upcoming)
      return childAssignments.sort((a, b) => {
        if (a.is_overdue && !b.is_overdue) return -1;
        if (!a.is_overdue && b.is_overdue) return 1;
        return a.days_until_due - b.days_until_due;
      });
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
