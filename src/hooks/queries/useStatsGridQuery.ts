import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type StatsGridData = {
  id: string;
  // XP & Gamification
  total_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  xp_rank?: number;
  // Streaks
  current_streak: number;
  longest_streak: number;
  // Badges & Achievements
  badges_count: number;
  achievements_unlocked: number;
  // Learning Progress
  courses_completed: number;
  courses_in_progress: number;
  lessons_completed: number;
  // Study Time
  total_study_time_minutes: number;
  weekly_study_time_minutes: number;
  // Assignments
  assignments_completed: number;
  assignments_pending: number;
  // Tests
  tests_taken: number;
  tests_passed: number;
  average_score: number;
  best_score: number;
  // Doubts
  doubts_asked: number;
  doubts_resolved: number;
  // Notes
  notes_created: number;
  highlights_count: number;
  // Trends
  weekly_progress: { week: string; xp: number }[];
  subject_scores: Record<string, number>;
};

const MOCK_DATA: StatsGridData = {
  id: 'mock-stats',
  total_xp: 2450, weekly_xp: 320, monthly_xp: 1280, xp_rank: 5,
  current_streak: 7, longest_streak: 21,
  badges_count: 12, achievements_unlocked: 8,
  courses_completed: 3, courses_in_progress: 2, lessons_completed: 45,
  total_study_time_minutes: 1840, weekly_study_time_minutes: 420,
  assignments_completed: 18, assignments_pending: 3,
  tests_taken: 12, tests_passed: 10, average_score: 78.5, best_score: 95,
  doubts_asked: 15, doubts_resolved: 12,
  notes_created: 24, highlights_count: 56,
  weekly_progress: [{ week: 'W1', xp: 280 }, { week: 'W2', xp: 310 }, { week: 'W3', xp: 290 }, { week: 'W4', xp: 320 }],
  subject_scores: { Mathematics: 82, Physics: 75, Chemistry: 79, Biology: 71, English: 85 },
};

// Stats Grid Query Hook
export function useStatsGridQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['stats-grid', customerId, userId],
    queryFn: async (): Promise<StatsGridData> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return MOCK_DATA;

      return {
        id: data.id,
        total_xp: data.total_xp || 0, weekly_xp: data.weekly_xp || 0, monthly_xp: data.monthly_xp || 0, xp_rank: data.xp_rank,
        current_streak: data.current_streak || 0, longest_streak: data.longest_streak || 0,
        badges_count: data.badges_count || 0, achievements_unlocked: data.achievements_unlocked || 0,
        courses_completed: data.courses_completed || 0, courses_in_progress: data.courses_in_progress || 0, lessons_completed: data.lessons_completed || 0,
        total_study_time_minutes: data.total_study_time_minutes || 0, weekly_study_time_minutes: data.weekly_study_time_minutes || 0,
        assignments_completed: data.assignments_completed || 0, assignments_pending: data.assignments_pending || 0,
        tests_taken: data.tests_taken || 0, tests_passed: data.tests_passed || 0,
        average_score: Number(data.average_score) || 0, best_score: Number(data.best_score) || 0,
        doubts_asked: data.doubts_asked || 0, doubts_resolved: data.doubts_resolved || 0,
        notes_created: data.notes_created || 0, highlights_count: data.highlights_count || 0,
        weekly_progress: data.weekly_progress || [],
        subject_scores: data.subject_scores || {},
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}