import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type UserStats = {
  id: string;
  user_id: string;
  customer_id: string;
  // XP & Gamification
  total_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  xp_rank: number | null;
  // Streaks
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null;
  // Badges & Achievements
  badges_count: number;
  achievements_unlocked: number;
  // Learning Progress
  courses_completed: number;
  courses_in_progress: number;
  lessons_completed: number;
  total_study_time_minutes: number;
  weekly_study_time_minutes: number;
  // Assessments
  assignments_completed: number;
  assignments_pending: number;
  tests_taken: number;
  tests_passed: number;
  average_score: number;
  best_score: number;
  // Doubts & Engagement
  doubts_asked: number;
  doubts_resolved: number;
  notes_created: number;
  highlights_count: number;
  // Trends
  weekly_progress: Array<{ week: string; xp: number }>;
  subject_scores: Record<string, number>;
  // Timestamps
  created_at: string;
  updated_at: string;
};

export const DEMO_USER_ID = 'demo-student-001';

export function useUserStatsQuery(userId?: string) {
  const customerId = useCustomerId();
  const effectiveUserId = userId || DEMO_USER_ID;

  return useQuery({
    queryKey: ['user-stats', effectiveUserId, customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', effectiveUserId)
        .single();

      if (error) {
        // Return mock data if no stats found
        if (error.code === 'PGRST116') {
          return getMockStats(effectiveUserId);
        }
        throw error;
      }
      return data as UserStats;
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

function getMockStats(userId: string): UserStats {
  return {
    id: 'mock-id',
    user_id: userId,
    customer_id: 'mock-customer',
    total_xp: 2450,
    weekly_xp: 320,
    monthly_xp: 1280,
    xp_rank: 5,
    current_streak: 7,
    longest_streak: 21,
    streak_last_date: new Date().toISOString().split('T')[0],
    badges_count: 12,
    achievements_unlocked: 8,
    courses_completed: 3,
    courses_in_progress: 2,
    lessons_completed: 45,
    total_study_time_minutes: 1840,
    weekly_study_time_minutes: 420,
    assignments_completed: 18,
    assignments_pending: 3,
    tests_taken: 12,
    tests_passed: 10,
    average_score: 78.5,
    best_score: 95.0,
    doubts_asked: 15,
    doubts_resolved: 12,
    notes_created: 24,
    highlights_count: 56,
    weekly_progress: [
      { week: 'W1', xp: 280 },
      { week: 'W2', xp: 310 },
      { week: 'W3', xp: 290 },
      { week: 'W4', xp: 320 },
    ],
    subject_scores: {
      Mathematics: 82,
      Physics: 75,
      Chemistry: 79,
      English: 85,
      Biology: 71,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
