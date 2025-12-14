import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';

export type SubjectGrade = {
  subject_id: string;
  subject_code: string;
  title_en: string;
  title_hi: string | null;
  icon: string;
  color: string;
  score: number;
  grade: string;
  grade_points: number;
};

export type ChildReportCard = {
  child_user_id: string;
  child_name: string;
  average_score: number;
  best_score: number;
  overall_grade: string;
  overall_grade_points: number;
  tests_taken: number;
  tests_passed: number;
  pass_rate: number;
  assignments_completed: number;
  term: string;
  subjects: SubjectGrade[];
};

// Convert score to grade
const getGrade = (score: number): { grade: string; points: number } => {
  if (score >= 90) return { grade: 'A+', points: 10 };
  if (score >= 80) return { grade: 'A', points: 9 };
  if (score >= 70) return { grade: 'B+', points: 8 };
  if (score >= 60) return { grade: 'B', points: 7 };
  if (score >= 50) return { grade: 'C+', points: 6 };
  if (score >= 40) return { grade: 'C', points: 5 };
  if (score >= 33) return { grade: 'D', points: 4 };
  return { grade: 'F', points: 0 };
};

export function useChildReportCardQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();

  return useQuery({
    queryKey: ['parent-child-report-card', customerId, parentUserId],
    queryFn: async (): Promise<ChildReportCard[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildReportCardQuery] customerId:', customerId, 'children:', children?.length);
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
        if (__DEV__) console.log('[useChildReportCardQuery] subjects error:', subjectsError);
        throw subjectsError;
      }

      const reportCards: ChildReportCard[] = [];

      // For each child, get their stats
      for (const child of children) {
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('subject_scores, average_score, best_score, tests_taken, tests_passed, assignments_completed')
          .eq('user_id', child.child_user_id)
          .eq('customer_id', customerId)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          if (__DEV__) console.log('[useChildReportCardQuery] stats error:', statsError);
        }

        const subjectScores = (stats?.subject_scores as Record<string, number>) || {};
        const averageScore = stats?.average_score || 0;
        const bestScore = stats?.best_score || 0;
        const testsTaken = stats?.tests_taken || 0;
        const testsPassed = stats?.tests_passed || 0;
        const assignmentsCompleted = stats?.assignments_completed || 0;

        // Map subjects with grades
        const subjectGrades: SubjectGrade[] = (subjects || []).map(subject => {
          const score = subjectScores[subject.title_en] || 0;
          const { grade, points } = getGrade(score);

          return {
            subject_id: subject.id,
            subject_code: subject.code,
            title_en: subject.title_en,
            title_hi: subject.title_hi,
            icon: subject.icon,
            color: subject.color,
            score,
            grade,
            grade_points: points,
          };
        });

        // Calculate overall grade
        const { grade: overallGrade, points: overallPoints } = getGrade(averageScore);
        const passRate = testsTaken > 0 ? Math.round((testsPassed / testsTaken) * 100) : 0;

        // Determine current term (simplified)
        const currentMonth = new Date().getMonth();
        const term = currentMonth < 3 ? 'Term 3' : currentMonth < 6 ? 'Term 4' : currentMonth < 9 ? 'Term 1' : 'Term 2';

        reportCards.push({
          child_user_id: child.child_user_id,
          child_name: child.child_name,
          average_score: averageScore,
          best_score: bestScore,
          overall_grade: overallGrade,
          overall_grade_points: overallPoints,
          tests_taken: testsTaken,
          tests_passed: testsPassed,
          pass_rate: passRate,
          assignments_completed: assignmentsCompleted,
          term,
          subjects: subjectGrades.sort((a, b) => b.score - a.score),
        });
      }

      return reportCards;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
