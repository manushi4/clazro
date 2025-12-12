import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  class_name_en?: string;
  class_name_hi?: string;
  total_xp: number;
  weekly_xp: number;
  current_streak: number;
  badges_count: number;
  rank: number;
  is_current_user?: boolean;
};

export type LeaderboardScope = 'class' | 'school' | 'global';

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  my_rank?: LeaderboardEntry;
  total_participants: number;
  scope: LeaderboardScope;
};

const MOCK_DATA: LeaderboardData = {
  entries: [
    { id: '1', user_id: 'u1', full_name: 'Priya Patel', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', total_xp: 3250, weekly_xp: 650, current_streak: 12, badges_count: 8, rank: 1 },
    { id: '2', user_id: 'u2', full_name: 'Karan Mehta', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan', total_xp: 2890, weekly_xp: 580, current_streak: 8, badges_count: 6, rank: 2 },
    { id: '3', user_id: 'demo-student-001', full_name: 'Demo Student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo', total_xp: 2450, weekly_xp: 490, current_streak: 7, badges_count: 5, rank: 3, is_current_user: true },
    { id: '4', user_id: 'u4', full_name: 'Rahul Kumar', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', total_xp: 2180, weekly_xp: 436, current_streak: 15, badges_count: 4, rank: 4 },
    { id: '5', user_id: 'u5', full_name: 'Sneha Singh', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha', total_xp: 1950, weekly_xp: 390, current_streak: 3, badges_count: 3, rank: 5 },
  ],
  my_rank: { id: '3', user_id: 'demo-student-001', full_name: 'Demo Student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo', total_xp: 2450, weekly_xp: 490, current_streak: 7, badges_count: 5, rank: 3, is_current_user: true },
  total_participants: 156,
  scope: 'school',
};


export function useLeaderboardQuery(scope: LeaderboardScope = 'school', limit: number = 10) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['leaderboard', customerId, scope, limit],
    queryFn: async (): Promise<LeaderboardData> => {
      const supabase = getSupabaseClient();
      
      // Get leaderboard entries from view
      const { data: entries, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('customer_id', customerId)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error || !entries) {
        console.warn('Leaderboard query failed, using mock data:', error);
        return MOCK_DATA;
      }

      // Get current user's rank
      const { data: myRankData } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      // Get total participants count
      const { count } = await supabase
        .from('leaderboard_view')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      // Mark current user in entries
      const processedEntries: LeaderboardEntry[] = entries.map(entry => ({
        ...entry,
        is_current_user: entry.user_id === userId,
      }));

      return {
        entries: processedEntries,
        my_rank: myRankData ? { ...myRankData, is_current_user: true } : undefined,
        total_participants: count || 0,
        scope,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    retry: isOnline ? 2 : 0,
  });
}

export function useMyLeaderboardRank(scope: LeaderboardScope = 'school') {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['my-leaderboard-rank', customerId, userId, scope],
    queryFn: async (): Promise<LeaderboardEntry | null> => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return MOCK_DATA.my_rank || null;
      }

      return { ...data, is_current_user: true };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    retry: isOnline ? 2 : 0,
  });
}
