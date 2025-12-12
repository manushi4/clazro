import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type SubjectProgress = {
  id: string;
  subject_id: string;
  title_en: string;
  title_hi?: string;
  progress_percentage: number;
  chapters_completed: number;
  total_chapters: number;
  hours_studied: number;
  tests_passed: number;
  total_tests: number;
  color: string;
  icon: string;
  last_activity: string;
};

export type ChildProgressData = {
  child_user_id: string;
  child_name: string;
  overall_progress: number;
  total_subjects: number;
  total_hours: number;
  subjects: SubjectProgress[];
};

export function useChildProgressQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-progress', customerId, parentUserId],
    queryFn: async (): Promise<ChildProgressData[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildProgressQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      const childProgressData: ChildProgressData[] = [];

      for (const child of children) {
        const { data, error } = await supabase
          .from('subject_progress')
          .select('*')
          .eq('customer_id', customerId)
          .eq('user_id', child.child_user_id)
          .order('progress_percentage', { ascending: false });

        if (error) {
          if (__DEV__) console.log('[useChildProgressQuery] error:', error);
          continue;
        }

        const subjects: SubjectProgress[] = (data || []).map(item => ({
          id: item.id,
          subject_id: item.subject_id,
          title_en: item.title_en,
          title_hi: item.title_hi,
          progress_percentage: item.progress_percentage || 0,
          chapters_completed: item.chapters_completed || 0,
          total_chapters: item.total_chapters || 0,
          hours_studied: item.hours_studied || 0,
          tests_passed: item.tests_passed || 0,
          total_tests: item.total_tests || 0,
          color: item.color || 'primary',
          icon: item.icon || 'book',
          last_activity: item.last_activity,
        }));

        const totalProgress = subjects.length > 0
          ? Math.round(subjects.reduce((sum, s) => sum + s.progress_percentage, 0) / subjects.length)
          : 0;
        const totalHours = subjects.reduce((sum, s) => sum + s.hours_studied, 0);

        childProgressData.push({
          child_user_id: child.child_user_id,
          child_name: child.child_name,
          overall_progress: totalProgress,
          total_subjects: subjects.length,
          total_hours: totalHours,
          subjects,
        });
      }

      return childProgressData;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
