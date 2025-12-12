import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type ActivityType = 
  | 'lesson_completed' | 'test_taken' | 'assignment_submitted' | 'doubt_asked'
  | 'doubt_resolved' | 'badge_earned' | 'streak_milestone' | 'xp_earned'
  | 'note_created' | 'video_watched' | 'quiz_completed' | 'login' | 'level_up';

export type UserActivity = {
  id: string;
  user_id: string;
  customer_id: string;
  activity_type: ActivityType;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  icon: string;
  color: string;
  points_earned: number;
  duration_minutes: number | null;
  score: number | null;
  related_id: string | null;
  related_type: string | null;
  metadata: Record<string, unknown>;
  activity_at: string;
  created_at: string;
};

export type GroupedActivities = {
  date: string;
  label: string;
  activities: UserActivity[];
};

export const DEMO_USER_ID = 'demo-student-001';

export function useUserActivitiesQuery(userId?: string, limit: number = 20) {
  const customerId = useCustomerId();
  const effectiveUserId = userId || DEMO_USER_ID;

  return useQuery({
    queryKey: ['user-activities', effectiveUserId, customerId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('activity_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as UserActivity[];
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Group activities by date
export function groupActivitiesByDate(activities: UserActivity[]): GroupedActivities[] {
  const groups: Map<string, UserActivity[]> = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach(activity => {
    const activityDate = new Date(activity.activity_at);
    activityDate.setHours(0, 0, 0, 0);
    const dateKey = activityDate.toISOString().split('T')[0];

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(activity);
  });

  return Array.from(groups.entries()).map(([dateKey, acts]) => {
    const date = new Date(dateKey);
    let label: string;

    if (date.getTime() === today.getTime()) {
      label = 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        label = date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    return { date: dateKey, label, activities: acts };
  });
}

// Get activity stats for today
export function getTodayStats(activities: UserActivity[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayActivities = activities.filter(a => {
    const actDate = new Date(a.activity_at);
    actDate.setHours(0, 0, 0, 0);
    return actDate.getTime() === today.getTime();
  });

  return {
    count: todayActivities.length,
    points: todayActivities.reduce((sum, a) => sum + (a.points_earned || 0), 0),
    minutes: todayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
  };
}
