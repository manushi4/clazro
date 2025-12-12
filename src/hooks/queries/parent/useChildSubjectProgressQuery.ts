import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type SubjectProgress = {
  subject_id: string;
  subject_code: string;
  title_en: string;
  title_hi: string | null;
  icon: string;
  color: string;
  score: number;
  progress_percentage: number;
  chapters_completed: number;
  total_chapters: number;
  tests_passed: number;
  total_tests: number;
  last_activity: string | null;
};

export type ChildSubjectProgress = {
  child_user_id: string;
  child_name: string;
  overall_progress: number;
  total_study_hours: number;
  subjects: SubjectProgress[];
};

export function useChildSubjectProgressQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-subject-progress', customerId, parentUserId],
    queryFn: async (): Promise<ChildSubjectProgress[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildSubjectProgressQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      // Fetch subjects for the customer
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, code, title_en, title_hi, icon, color')
        .eq('customer_id', customerId)
        .eq('enabled', true)
        .order('order_index');

      if (subjectsError) {
        if (__DEV__) console.log('[useChildSubjectProgressQuery] subjects error:', subjectsError);
        throw subjectsError;
      }

      const childProgressList: ChildSubjectProgress[] = [];

      // For each child, get their stats
      for (const child of children) {
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('subject_scores, total_study_time_minutes, lessons_completed, tests_passed, tests_taken')
          .eq('user_id', child.child_user_id)
          .eq('customer_id', customerId)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          if (__DEV__) console.log('[useChildSubjectProgressQuery] stats error:', statsError);
        }

        const subjectScores = (stats?.subject_scores as Record<string, number>) || {};
        const totalStudyMinutes = stats?.total_study_time_minutes || 0;

        // Map subjects with scores
        const subjectProgressList: SubjectProgress[] = (subjects || []).map(subject => {
          const score = subjectScores[subject.title_en] || 0;
          // Simulate progress based on score (in real app, this would come from actual progress tracking)
          const progressPercentage = Math.min(100, Math.round(score * 1.1));
          const totalChapters = 10; // Simulated
          const chaptersCompleted = Math.round((progressPercentage / 100) * totalChapters);

          return {
            subject_id: subject.id,
            subject_code: subject.code,
            title_en: subject.title_en,
            title_hi: subject.title_hi,
            icon: subject.icon,
            color: subject.color,
            score,
            progress_percentage: progressPercentage,
            chapters_completed: chaptersCompleted,
            total_chapters: totalChapters,
            tests_passed: Math.round((score / 100) * 5),
            total_tests: 5,
            last_activity: null,
          };
        });

        // Calculate overall progress
        const totalScore = subjectProgressList.reduce((sum, s) => sum + s.score, 0);
        const overallProgress = subjectProgressList.length > 0 
          ? Math.round(totalScore / subjectProgressList.length) 
          : 0;

        childProgressList.push({
          child_user_id: child.child_user_id,
          child_name: child.child_name,
          overall_progress: overallProgress,
          total_study_hours: Math.round(totalStudyMinutes / 60),
          subjects: subjectProgressList.sort((a, b) => b.score - a.score),
        });
      }

      return childProgressList;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
