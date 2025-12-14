import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type StudyActivity = {
  id: string;
  study_date: string;
  minutes_studied: number;
  subjects_studied: string[];
  activities_completed: number;
  activity_type_en: string;
  activity_type_hi?: string;
};

export type StreakAchievement = {
  id: string;
  achievement_type: string;
  achievement_value: number;
  title_en: string;
  title_hi?: string;
  description_en: string;
  description_hi?: string;
  icon: string;
  color: string;
  achieved_at: string;
};

export type StudyStreakData = {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date?: string;
  weekly_goal: number;
  monthly_goal: number;
  total_study_days: number;
  total_study_hours: number;
  milestone_title_en?: string;
  milestone_title_hi?: string;
  milestone_description_en?: string;
  milestone_description_hi?: string;
  streak_target: number;
  recent_activities: StudyActivity[];
  achievements: StreakAchievement[];
};

const MOCK_DATA: StudyStreakData = {
  id: 'mock-streak',
  current_streak: 7,
  longest_streak: 15,
  last_study_date: new Date().toISOString().split('T')[0],
  weekly_goal: 5,
  monthly_goal: 20,
  total_study_days: 45,
  total_study_hours: 67.5,
  milestone_title_en: 'Week Warrior',
  milestone_title_hi: 'सप्ताह योद्धा',
  milestone_description_en: 'Studied for 7 consecutive days!',
  milestone_description_hi: '7 लगातार दिन अध्ययन किया!',
  streak_target: 30,
  recent_activities: [
    { id: '1', study_date: new Date().toISOString().split('T')[0], minutes_studied: 90, subjects_studied: ['Mathematics', 'Physics'], activities_completed: 3, activity_type_en: 'Study Session', activity_type_hi: 'अध्ययन सत्र' },
    { id: '2', study_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], minutes_studied: 75, subjects_studied: ['Chemistry'], activities_completed: 2, activity_type_en: 'Assignment Work', activity_type_hi: 'असाइनमेंट कार्य' },
  ],
  achievements: [
    { id: '1', achievement_type: 'streak_milestone', achievement_value: 5, title_en: 'Study Starter', title_hi: 'अध्ययन शुरुआत', description_en: 'Completed your first 5-day streak!', description_hi: 'अपनी पहली 5-दिन की लकीर पूरी की!', icon: 'fire', color: 'warning', achieved_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: '2', achievement_type: 'weekly_goal', achievement_value: 5, title_en: 'Weekly Champion', title_hi: 'साप्ताहिक चैंपियन', description_en: 'Met your weekly study goal!', description_hi: 'अपना साप्ताहिक अध्ययन लक्ष्य पूरा किया!', icon: 'trophy', color: 'success', achieved_at: new Date(Date.now() - 86400000).toISOString() },
  ],
};

export function useStudyStreakQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['study-streak', customerId, userId],
    queryFn: async (): Promise<StudyStreakData> => {
      const supabase = getSupabaseClient();
      
      const { data: streakData, error } = await supabase
        .from('study_streaks')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error || !streakData) return MOCK_DATA;

      const { data: activities } = await supabase
        .from('study_activities')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .gte('study_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
        .order('study_date', { ascending: false })
        .limit(7);

      const { data: achievements } = await supabase
        .from('streak_achievements')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false })
        .limit(5);

      return {
        id: streakData.id,
        current_streak: streakData.current_streak,
        longest_streak: streakData.longest_streak,
        last_study_date: streakData.last_study_date,
        weekly_goal: streakData.weekly_goal,
        monthly_goal: streakData.monthly_goal,
        total_study_days: streakData.total_study_days,
        total_study_hours: Number(streakData.total_study_hours),
        milestone_title_en: streakData.milestone_title_en,
        milestone_title_hi: streakData.milestone_title_hi,
        milestone_description_en: streakData.milestone_description_en,
        milestone_description_hi: streakData.milestone_description_hi,
        streak_target: streakData.streak_target,
        recent_activities: (activities || []).map((a: any) => ({
          id: a.id, study_date: a.study_date, minutes_studied: a.minutes_studied,
          subjects_studied: a.subjects_studied || [], activities_completed: a.activities_completed,
          activity_type_en: a.activity_type_en, activity_type_hi: a.activity_type_hi,
        })),
        achievements: (achievements || []).map((a: any) => ({
          id: a.id, achievement_type: a.achievement_type, achievement_value: a.achievement_value,
          title_en: a.title_en, title_hi: a.title_hi, description_en: a.description_en,
          description_hi: a.description_hi, icon: a.icon, color: a.color, achieved_at: a.achieved_at,
        })),
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
