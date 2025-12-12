import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type Quest = {
  id: string;
  quest_type: 'daily' | 'weekly' | 'special' | 'challenge';
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  status: 'active' | 'completed' | 'expired' | 'claimed';
  category: 'learning' | 'streak' | 'social' | 'assessment' | 'exploration';
  difficulty: 'easy' | 'medium' | 'hard';
  starts_at: string;
  expires_at?: string;
  completed_at?: string;
};

export type ActiveQuestsData = {
  daily: Quest[];
  weekly: Quest[];
  special: Quest[];
  completed_today: number;
  total_xp_available: number;
};

const MOCK_DATA: ActiveQuestsData = {
  daily: [
    { id: '1', quest_type: 'daily', title_en: 'Complete 3 Lessons', title_hi: '3 पाठ पूरे करें', description_en: 'Finish any 3 lessons today', icon: '📚', target_value: 3, current_value: 1, xp_reward: 50, status: 'active', category: 'learning', difficulty: 'easy', starts_at: new Date().toISOString() },
    { id: '2', quest_type: 'daily', title_en: 'Study for 30 Minutes', title_hi: '30 मिनट अध्ययन करें', description_en: 'Spend 30 minutes learning', icon: '⏱️', target_value: 30, current_value: 18, xp_reward: 75, status: 'active', category: 'learning', difficulty: 'medium', starts_at: new Date().toISOString() },
  ],
  weekly: [
    { id: '3', quest_type: 'weekly', title_en: 'Pass 5 Tests', title_hi: '5 परीक्षाएं पास करें', description_en: 'Score 70% or above in 5 tests', icon: '✅', target_value: 5, current_value: 3, xp_reward: 200, status: 'active', category: 'assessment', difficulty: 'hard', starts_at: new Date().toISOString() },
  ],
  special: [],
  completed_today: 2,
  total_xp_available: 325,
};

export function useActiveQuestsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['active-quests', customerId, userId],
    queryFn: async (): Promise<ActiveQuestsData> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .order('quest_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error || !data) return MOCK_DATA;

      const quests = data as Quest[];
      const daily = quests.filter(q => q.quest_type === 'daily' && q.status === 'active');
      const weekly = quests.filter(q => q.quest_type === 'weekly' && q.status === 'active');
      const special = quests.filter(q => (q.quest_type === 'special' || q.quest_type === 'challenge') && q.status === 'active');
      
      const today = new Date().toDateString();
      const completed_today = quests.filter(q => 
        q.status === 'completed' && 
        q.completed_at && 
        new Date(q.completed_at).toDateString() === today
      ).length;

      const total_xp_available = [...daily, ...weekly, ...special].reduce((sum, q) => sum + q.xp_reward, 0);

      return { daily, weekly, special, completed_today, total_xp_available };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}
