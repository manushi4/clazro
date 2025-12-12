import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type SubjectScore = {
  subject: string;
  score: number;
};

export type WeeklyProgress = {
  week: string;
  xp: number;
};

export type ChildPerformance = {
  child_user_id: string;
  child_name: string;
  subject_scores: SubjectScore[];
  weekly_progress: WeeklyProgress[];
  average_score: number;
  best_score: number;
};

export function useChildPerformanceQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-performance', customerId, parentUserId],
    queryFn: async (): Promise<ChildPerformance[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildPerformanceQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      const performanceData: ChildPerformance[] = [];

      for (const child of children) {
        const { data, error } = await supabase
          .from('user_stats')
          .select('subject_scores, weekly_progress, average_score, best_score')
          .eq('customer_id', customerId)
          .eq('user_id', child.child_user_id)
          .single();

        if (error) {
          if (__DEV__) console.log('[useChildPerformanceQuery] error:', error);
          continue;
        }

        if (data) {
          // Parse subject_scores JSON to array
          let subjectScores: SubjectScore[] = [];
          if (data.subject_scores && typeof data.subject_scores === 'object') {
            subjectScores = Object.entries(data.subject_scores).map(([subject, score]) => ({
              subject,
              score: Number(score),
            }));
          }

          // Parse weekly_progress JSON array
          let weeklyProgress: WeeklyProgress[] = [];
          if (Array.isArray(data.weekly_progress)) {
            weeklyProgress = data.weekly_progress.map((item: any) => ({
              week: item.week || '',
              xp: Number(item.xp) || 0,
            }));
          }

          performanceData.push({
            child_user_id: child.child_user_id,
            child_name: child.child_name,
            subject_scores: subjectScores,
            weekly_progress: weeklyProgress,
            average_score: parseFloat(data.average_score) || 0,
            best_score: parseFloat(data.best_score) || 0,
          });
        }
      }

      return performanceData;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
