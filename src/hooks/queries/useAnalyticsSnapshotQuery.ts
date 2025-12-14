/**
 * Analytics Snapshot Query Hook
 * Fetches weekly analytics data for the analytics.snapshot widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type WeeklyAnalytics = {
  studyTimeMinutes: number;
  studyTimeTrend: number; // vs last week (can be negative)
  assignmentsDone: number;
  assignmentsTotal: number;
  testsAttempted: number;
  testsPassed: number;
  averageScore: number;
  doubtsAsked: number;
  doubtsResolved: number;
};

export type SubjectSnapshot = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  icon: string;
  color: string;
  mastery: number;
  averageTestScore: number;
  doubtsResolved: number;
  completedTopics: number;
  totalTopics: number;
};

export type StreakFocus = {
  studyStreak: number;
  longestStreak: number;
  averageFocusMinutes: number;
  guidedSessionsThisWeek: number;
};

export type AnalyticsSnapshotData = {
  thisWeek: WeeklyAnalytics;
  subjects: SubjectSnapshot[];
  streakFocus: StreakFocus;
  recommendations: string[];
  lastUpdated: string;
};

const MOCK_DATA: AnalyticsSnapshotData = {
  thisWeek: {
    studyTimeMinutes: 320,
    studyTimeTrend: 60,
    assignmentsDone: 3,
    assignmentsTotal: 4,
    testsAttempted: 2,
    testsPassed: 2,
    averageScore: 78,
    doubtsAsked: 5,
    doubtsResolved: 4,
  },
  subjects: [
    { subjectId: '1', subjectName: 'Mathematics', subjectCode: 'MATH', icon: 'calculator', color: '#6366F1', mastery: 72, averageTestScore: 78, doubtsResolved: 6, completedTopics: 8, totalTopics: 12 },
    { subjectId: '2', subjectName: 'Physics', subjectCode: 'PHY', icon: 'atom', color: '#F59E0B', mastery: 65, averageTestScore: 71, doubtsResolved: 4, completedTopics: 5, totalTopics: 10 },
    { subjectId: '3', subjectName: 'Chemistry', subjectCode: 'CHEM', icon: 'flask', color: '#10B981', mastery: 80, averageTestScore: 85, doubtsResolved: 2, completedTopics: 7, totalTopics: 9 },
  ],
  streakFocus: {
    studyStreak: 4,
    longestStreak: 12,
    averageFocusMinutes: 22,
    guidedSessionsThisWeek: 3,
  },
  recommendations: [
    'Complete 1 more assignment to stay on track',
    'Practice Physics problems to improve mastery',
  ],
  lastUpdated: new Date().toISOString(),
};

export function useAnalyticsSnapshotQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['analytics-snapshot', customerId, userId],
    queryFn: async (): Promise<AnalyticsSnapshotData> => {
      const supabase = getSupabaseClient();

      // Fetch weekly stats
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('user_weekly_analytics')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      // Fetch subject progress
      const { data: subjectsData } = await supabase
        .from('student_subject_analytics')
        .select(`
          *,
          subjects:subject_id(title_en, code, icon, color)
        `)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('mastery_percentage', { ascending: false })
        .limit(5);

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('gamification_stats')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      // If no data, return mock
      if (weeklyError || !weeklyData) {
        console.warn('Analytics snapshot query failed, using mock data:', weeklyError);
        return MOCK_DATA;
      }

      const subjects: SubjectSnapshot[] = (subjectsData || []).map((s: any) => ({
        subjectId: s.subject_id,
        subjectName: s.subjects?.title_en || 'Unknown',
        subjectCode: s.subjects?.code || '',
        icon: s.subjects?.icon || 'book-outline',
        color: s.subjects?.color || '#6366F1',
        mastery: Number(s.mastery_percentage) || 0,
        averageTestScore: Number(s.average_test_score) || 0,
        doubtsResolved: s.doubts_resolved || 0,
        completedTopics: s.completed_topics || 0,
        totalTopics: s.total_topics || 0,
      }));

      return {
        thisWeek: {
          studyTimeMinutes: weeklyData.study_time_minutes || 0,
          studyTimeTrend: weeklyData.study_time_trend || 0,
          assignmentsDone: weeklyData.assignments_done || 0,
          assignmentsTotal: weeklyData.assignments_total || 0,
          testsAttempted: weeklyData.tests_attempted || 0,
          testsPassed: weeklyData.tests_passed || 0,
          averageScore: Number(weeklyData.average_score) || 0,
          doubtsAsked: weeklyData.doubts_asked || 0,
          doubtsResolved: weeklyData.doubts_resolved || 0,
        },
        subjects,
        streakFocus: {
          studyStreak: streakData?.current_streak || 0,
          longestStreak: streakData?.longest_streak || 0,
          averageFocusMinutes: weeklyData.average_focus_minutes || 0,
          guidedSessionsThisWeek: weeklyData.guided_sessions || 0,
        },
        recommendations: weeklyData.recommendations || [],
        lastUpdated: weeklyData.updated_at || new Date().toISOString(),
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
