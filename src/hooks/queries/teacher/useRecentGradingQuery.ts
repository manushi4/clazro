import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type RecentGradingItem = {
  id: string;
  student_user_id: string;
  student_name: string;
  assignment_id: string;
  assignment_title_en: string;
  assignment_title_hi?: string;
  score: number;
  max_score: number;
  percentage: number;
  grade_letter: string;
  graded_at: string;
};

export function useRecentGradingQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['grading-recent', customerId, { limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get graded submissions with assignment info
      const { data: submissions, error } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          student_user_id,
          score,
          max_score,
          percentage,
          grade_letter,
          graded_at,
          assignment_id,
          assignments (
            id,
            title_en,
            title_hi
          )
        `)
        .eq('customer_id', customerId)
        .eq('status', 'graded')
        .not('graded_at', 'is', null)
        .order('graded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!submissions?.length) return [];

      // Get student names
      const studentIds = [...new Set(submissions.map(s => s.student_user_id))];
      const { data: students } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      const studentMap = new Map(students?.map(s => [s.user_id, s.full_name]) || []);

      return submissions.map((item: any) => ({
        id: item.id,
        student_user_id: item.student_user_id,
        student_name: studentMap.get(item.student_user_id) || `Student`,
        assignment_id: item.assignment_id,
        assignment_title_en: item.assignments?.title_en || 'Assignment',
        assignment_title_hi: item.assignments?.title_hi,
        score: item.score || 0,
        max_score: item.max_score || 100,
        percentage: parseFloat(item.percentage) || 0,
        grade_letter: item.grade_letter || 'N/A',
        graded_at: item.graded_at,
      })) as RecentGradingItem[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
