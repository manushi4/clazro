import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';

export type LinkedChild = {
  id: string;
  child_user_id: string;
  child_name: string;
  child_avatar_url?: string;
  class_name: string;
  section?: string;
  roll_number?: string;
  relationship: 'parent' | 'guardian' | 'other';
  is_primary: boolean;
  // Quick stats
  attendance_percentage?: number;
  pending_assignments?: number;
  upcoming_tests?: number;
  current_streak?: number;
  total_xp?: number;
  // Today's status
  attendance_today?: 'present' | 'absent' | 'late' | 'holiday' | null;
};

export function useChildrenQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ['parent-children', customerId, parentUserId],
    queryFn: async (): Promise<LinkedChild[]> => {
      const supabase = getSupabaseClient();
      
      if (__DEV__) {
        console.log('[useChildrenQuery] customerId:', customerId, 'parentUserId:', parentUserId);
      }
      
      // Get linked children with their details
      const { data, error } = await supabase
        .from('parent_children')
        .select(`
          id,
          child_user_id,
          relationship,
          is_primary,
          can_view_progress,
          can_view_attendance,
          can_view_fees
        `)
        .eq('customer_id', customerId)
        .eq('parent_user_id', parentUserId);

      if (__DEV__) {
        console.log('[useChildrenQuery] data:', data, 'error:', error);
      }
      
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // For now, return mock enriched data
      // In production, this would join with user profiles and stats
      const enrichedChildren: LinkedChild[] = data.map((child, index) => ({
        id: child.id,
        child_user_id: child.child_user_id,
        child_name: `Child ${index + 1}`, // Would come from user profile
        class_name: 'Class 10',
        section: 'A',
        relationship: child.relationship as 'parent' | 'guardian' | 'other',
        is_primary: child.is_primary,
        // Mock stats - would come from actual queries
        attendance_percentage: 92,
        pending_assignments: 3,
        upcoming_tests: 2,
        current_streak: 7,
        total_xp: 1250,
        attendance_today: 'present' as const,
      }));

      return enrichedChildren;
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
