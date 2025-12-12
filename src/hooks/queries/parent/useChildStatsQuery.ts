import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type ChildStats = {
  child_user_id: string;
  child_name: string;
  total_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  xp_rank: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
  achievements_unlocked: number;
  total_study_time_minutes: number;
  weekly_study_time_minutes: number;
  tests_taken: number;
  tests_passed: number;
  average_score: number;
  assignments_completed: number;
  assignments_pending: number;
  lessons_completed: number;
  courses_completed: number;
  courses_in_progress: number;
};

export function useChildStatsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-stats', customerId, parentUserId],
    queryFn: async (): Promise<ChildStats[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildStatsQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      const childStatsData: ChildStats[] = [];

      for (const child of children) {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('customer_id', customerId)
          .eq('user_id', child.child_user_id)
          .single();

        if (error) {
          if (__DEV__) console.log('[useChildStatsQuery] error:', error);
          continue;
        }

        if (data) {
          childStatsData.push({
            child_user_id: child.child_user_id,
            child_name: child.child_name,
            total_xp: data.total_xp || 0,
            weekly_xp: data.weekly_xp || 0,
            monthly_xp: data.monthly_xp || 0,
            xp_rank: data.xp_rank || 0,
            current_streak: data.current_streak || 0,
            longest_streak: data.longest_streak || 0,
            badges_count: data.badges_count || 0,
            achievements_unlocked: data.achievements_unlocked || 0,
            total_study_time_minutes: data.total_study_time_minutes || 0,
            weekly_study_time_minutes: data.weekly_study_time_minutes || 0,
            tests_taken: data.tests_taken || 0,
            tests_passed: data.tests_passed || 0,
            average_score: parseFloat(data.average_score) || 0,
            assignments_completed: data.assignments_completed || 0,
            assignments_pending: data.assignments_pending || 0,
            lessons_completed: data.lessons_completed || 0,
            courses_completed: data.courses_completed || 0,
            courses_in_progress: data.courses_in_progress || 0,
          });
        }
      }

      return childStatsData;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
