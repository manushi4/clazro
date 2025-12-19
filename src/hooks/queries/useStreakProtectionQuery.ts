/**
 * Streak Protection Query Hook
 * Fetches streak protection data for automation.streak-protection widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';

export type StreakProtectionStatus = 'safe' | 'at_risk' | 'critical' | 'lost';

export interface StreakProtection {
  id: string;
  customerId: string;
  userId: string;
  // Current streak info
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string | null;
  lastActivityDate: string | null;
  // Protection status
  protectionStatus: StreakProtectionStatus;
  hoursUntilLoss: number | null;
  protectionShields: number;
  shieldsUsedThisMonth: number;
  maxShieldsPerMonth: number;
  // Streak goals
  dailyGoalMinutes: number;
  weeklyGoalDays: number;
  currentWeekDays: number;
  // Rewards
  nextMilestone: number | null;
  nextMilestoneRewardEn: string | null;
  nextMilestoneRewardHi: string | null;
  // Quick actions
  quickActionRoute: string | null;
  quickActionLabelEn: string | null;
  quickActionLabelHi: string | null;
}

export interface StreakProtectionData {
  streakProtection: StreakProtection | null;
  isAtRisk: boolean;
  isCritical: boolean;
  isLost: boolean;
  shieldsAvailable: number;
  weekProgress: number; // 0-100 percentage
  daysToMilestone: number;
}

export function useStreakProtectionQuery() {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();

  return useQuery<StreakProtectionData>({
    queryKey: ['streak-protection', customerId, userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('streak_protection')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return {
          streakProtection: null,
          isAtRisk: false,
          isCritical: false,
          isLost: false,
          shieldsAvailable: 0,
          weekProgress: 0,
          daysToMilestone: 0,
        };
      }

      const streakProtection: StreakProtection = {
        id: data.id,
        customerId: data.customer_id,
        userId: data.user_id,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        streakStartDate: data.streak_start_date,
        lastActivityDate: data.last_activity_date,
        protectionStatus: data.protection_status,
        hoursUntilLoss: data.hours_until_loss,
        protectionShields: data.protection_shields,
        shieldsUsedThisMonth: data.shields_used_this_month,
        maxShieldsPerMonth: data.max_shields_per_month,
        dailyGoalMinutes: data.daily_goal_minutes,
        weeklyGoalDays: data.weekly_goal_days,
        currentWeekDays: data.current_week_days,
        nextMilestone: data.next_milestone,
        nextMilestoneRewardEn: data.next_milestone_reward_en,
        nextMilestoneRewardHi: data.next_milestone_reward_hi,
        quickActionRoute: data.quick_action_route,
        quickActionLabelEn: data.quick_action_label_en,
        quickActionLabelHi: data.quick_action_label_hi,
      };

      const shieldsAvailable = streakProtection.maxShieldsPerMonth - streakProtection.shieldsUsedThisMonth;
      const weekProgress = streakProtection.weeklyGoalDays > 0 
        ? Math.round((streakProtection.currentWeekDays / streakProtection.weeklyGoalDays) * 100)
        : 0;
      const daysToMilestone = streakProtection.nextMilestone 
        ? Math.max(0, streakProtection.nextMilestone - streakProtection.currentStreak)
        : 0;

      return {
        streakProtection,
        isAtRisk: streakProtection.protectionStatus === 'at_risk',
        isCritical: streakProtection.protectionStatus === 'critical',
        isLost: streakProtection.protectionStatus === 'lost',
        shieldsAvailable,
        weekProgress: Math.min(100, weekProgress),
        daysToMilestone,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
