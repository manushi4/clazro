import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type GoalType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'subject' | 'streak';
export type GoalCategory = 'learning' | 'practice' | 'assessment' | 'streak' | 'time' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'expired';

export type LearningGoal = {
  id: string;
  title: string;
  description?: string;
  goal_type: GoalType;
  category: GoalCategory;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  unit: string;
  icon: string;
  color: string;
  priority: number;
  status: GoalStatus;
  start_date: string;
  end_date?: string;
  days_remaining?: number;
  completed_at?: string;
  reminder_enabled: boolean;
};

export type GoalsData = {
  goals: LearningGoal[];
  active_count: number;
  completed_count: number;
  daily_goals: LearningGoal[];
  weekly_goals: LearningGoal[];
  streak_goals: LearningGoal[];
};

const MOCK_DATA: GoalsData = {
  goals: [
    { id: '1', title: 'Complete 5 lessons today', goal_type: 'daily', category: 'learning', target_value: 5, current_value: 3, progress_percentage: 60, unit: 'lessons', icon: 'book-open-page-variant', color: '#10B981', priority: 1, status: 'active', start_date: new Date().toISOString(), reminder_enabled: false },
    { id: '2', title: 'Study 2 hours this week', goal_type: 'weekly', category: 'time', target_value: 120, current_value: 75, progress_percentage: 62, unit: 'minutes', icon: 'clock-outline', color: '#6366F1', priority: 2, status: 'active', start_date: new Date().toISOString(), reminder_enabled: false },
    { id: '3', title: 'Maintain 7-day streak', goal_type: 'streak', category: 'streak', target_value: 7, current_value: 5, progress_percentage: 71, unit: 'days', icon: 'fire', color: '#EF4444', priority: 1, status: 'active', start_date: new Date().toISOString(), reminder_enabled: false },
  ],
  active_count: 3,
  completed_count: 2,
  daily_goals: [],
  weekly_goals: [],
  streak_goals: [],
};


function getDaysRemaining(endDate?: string): number | undefined {
  if (!endDate) return undefined;
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function useLearningGoalsQuery(goalTypes?: GoalType[], status: GoalStatus = 'active') {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['learning-goals', customerId, userId, goalTypes, status, lang],
    queryFn: async (): Promise<GoalsData> => {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('learning_goals')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (status !== 'active') {
        query = query.eq('status', status);
      } else {
        query = query.in('status', ['active', 'paused']);
      }

      if (goalTypes && goalTypes.length > 0) {
        query = query.in('goal_type', goalTypes);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('Learning goals query failed, using mock data:', error);
        return MOCK_DATA;
      }

      const goals: LearningGoal[] = data.map(item => ({
        id: item.id,
        title: getLocalizedField(item, 'title', lang),
        description: getLocalizedField(item, 'description', lang),
        goal_type: item.goal_type,
        category: item.category,
        target_value: item.target_value,
        current_value: item.current_value,
        progress_percentage: Math.min(100, Math.round((item.current_value / item.target_value) * 100)),
        unit: item.unit,
        icon: item.icon,
        color: item.color,
        priority: item.priority,
        status: item.status,
        start_date: item.start_date,
        end_date: item.end_date,
        days_remaining: getDaysRemaining(item.end_date),
        completed_at: item.completed_at,
        reminder_enabled: item.reminder_enabled,
      }));

      return {
        goals,
        active_count: goals.filter(g => g.status === 'active').length,
        completed_count: goals.filter(g => g.status === 'completed').length,
        daily_goals: goals.filter(g => g.goal_type === 'daily'),
        weekly_goals: goals.filter(g => g.goal_type === 'weekly'),
        streak_goals: goals.filter(g => g.goal_type === 'streak'),
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}
