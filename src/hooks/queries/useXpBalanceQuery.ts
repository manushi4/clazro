/**
 * XP Balance Query Hook
 * Fetches user rewards balance for rewards.xp-balance widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';

export interface XpBalanceData {
  id: string;
  userId: string;
  customerId: string;
  // Balance
  coinsBalance: number;
  xpTotal: number;
  xpThisWeek: number;
  xpToday: number;
  // Level info
  currentLevel: number;
  levelNameEn: string;
  levelNameHi: string | null;
  xpForNextLevel: number;
  xpProgressInLevel: number;
  // Earnings
  xpEarnedToday: number;
  xpEarnedThisWeek: number;
  coinsEarnedToday: number;
  coinsEarnedThisWeek: number;
  // Spending
  coinsSpentTotal: number;
  coinsSpentThisMonth: number;
  // Multipliers
  activeMultiplier: number;
  activeBoostEndsAt: string | null;
  // Rank
  rankInClass: number | null;
  rankInSchool: number | null;
  totalStudentsInClass: number | null;
}

export function useXpBalanceQuery() {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();

  return useQuery<XpBalanceData | null>({
    queryKey: ['xp-balance', customerId, userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('user_rewards_balance')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        customerId: data.customer_id,
        coinsBalance: data.coins_balance,
        xpTotal: data.xp_total,
        xpThisWeek: data.xp_this_week,
        xpToday: data.xp_today,
        currentLevel: data.current_level,
        levelNameEn: data.level_name_en,
        levelNameHi: data.level_name_hi,
        xpForNextLevel: data.xp_for_next_level,
        xpProgressInLevel: data.xp_progress_in_level,
        xpEarnedToday: data.xp_earned_today,
        xpEarnedThisWeek: data.xp_earned_this_week,
        coinsEarnedToday: data.coins_earned_today,
        coinsEarnedThisWeek: data.coins_earned_this_week,
        coinsSpentTotal: data.coins_spent_total,
        coinsSpentThisMonth: data.coins_spent_this_month,
        activeMultiplier: data.active_multiplier,
        activeBoostEndsAt: data.active_boost_ends_at,
        rankInClass: data.rank_in_class,
        rankInSchool: data.rank_in_school,
        totalStudentsInClass: data.total_students_in_class,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
