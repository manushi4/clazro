/**
 * useGamificationDataQuery - Gamification Hub Data Hook
 * 
 * Fetches all gamification data including:
 * - User profile with XP and level
 * - Study streak information
 * - Badges (earned and locked)
 * - Leaderboard preview
 * - Active challenges/quests
 * - Rewards shop preview
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Types
export interface GamificationUser {
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  nextLevelXP: number;
  currentLevelXP: number;
}

export interface StreakData {
  days: number;
  longestStreak: number;
  rewardEarned: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  timeLeft: string;
}

export interface RewardPreview {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

export interface GamificationData {
  user: GamificationUser;
  streak: StreakData;
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
  rewardsPreview: RewardPreview[];
}

/**
 * Calculate level thresholds
 */
function calculateLevelXP(level: number): { current: number; next: number } {
  // Each level requires progressively more XP
  const baseXP = 100;
  const multiplier = 1.5;
  
  let currentLevelXP = 0;
  for (let i = 1; i < level; i++) {
    currentLevelXP += Math.floor(baseXP * Math.pow(multiplier, i - 1));
  }
  
  const nextLevelXP = currentLevelXP + Math.floor(baseXP * Math.pow(multiplier, level - 1));
  
  return { current: currentLevelXP, next: nextLevelXP };
}

/**
 * Format time remaining
 */
function formatTimeLeft(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d left`;
  if (diffHours > 0) return `${diffHours}h left`;
  return 'Less than 1h';
}

/**
 * Main hook for fetching gamification data
 */
export function useGamificationDataQuery(userId?: string) {
  const customerId = useCustomerId();
  const effectiveUserId = userId || DEMO_USER_ID;

  return useQuery({
    queryKey: ['gamification-data', effectiveUserId, customerId],
    queryFn: async (): Promise<GamificationData> => {
      const supabase = getSupabaseClient();

      // Fetch user stats
      const { data: userStats, error: userError } = await supabase
        .from('gamification_stats')
        .select('*')
        .eq('user_id', effectiveUserId)
        .single();

      // Fetch user profile for name
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', effectiveUserId)
        .single();

      // Fetch badges
      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .eq('customer_id', customerId);

      const { data: earnedBadges } = await supabase
        .from('student_badges')
        .select('badge_id, earned_at')
        .eq('student_id', effectiveUserId);

      // Fetch leaderboard (top 10)
      const { data: leaderboardData } = await supabase
        .from('gamification_stats')
        .select(`
          user_id,
          total_xp,
          user_profiles!inner(full_name, avatar_url)
        `)
        .order('total_xp', { ascending: false })
        .limit(10);

      // Fetch active quests/challenges
      const { data: activeQuests } = await supabase
        .from('student_quests')
        .select(`
          id,
          current_progress,
          started_at,
          quests!inner(
            id,
            title,
            description,
            target_value,
            xp_reward,
            type
          )
        `)
        .eq('student_id', effectiveUserId)
        .eq('status', 'active');

      // Fetch rewards preview
      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('points', { ascending: true })
        .limit(3);

      // Process user data
      const xp = userStats?.total_xp || 0;
      const level = userStats?.level || 1;
      const levelXP = calculateLevelXP(level);

      const user: GamificationUser = {
        name: userProfile?.full_name || 'Student',
        avatar: userProfile?.avatar_url,
        xp,
        level,
        currentLevelXP: levelXP.current,
        nextLevelXP: levelXP.next,
      };

      // Process streak data
      const streak: StreakData = {
        days: userStats?.current_streak || 0,
        longestStreak: userStats?.longest_streak || 0,
        rewardEarned: (userStats?.current_streak || 0) >= 7,
      };

      // Process badges
      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);
      const badges: Badge[] = (allBadges || []).map(badge => ({
        id: badge.id,
        name: badge.name || badge.label || 'Badge',
        icon: badge.icon || 'medal',
        color: badge.color || '#10B981',
        unlocked: earnedBadgeIds.has(badge.id),
        unlockedAt: earnedBadges?.find(eb => eb.badge_id === badge.id)?.earned_at,
      }));

      // Process leaderboard
      const leaderboard: LeaderboardEntry[] = (leaderboardData || []).map((entry, index) => ({
        id: entry.user_id,
        name: (entry.user_profiles as any)?.full_name || 'User',
        avatar: (entry.user_profiles as any)?.avatar_url,
        xp: entry.total_xp || 0,
        rank: index + 1,
        isCurrentUser: entry.user_id === effectiveUserId,
      }));

      // Process challenges
      const challenges: Challenge[] = (activeQuests || []).map(quest => {
        const questData = quest.quests as any;
        // Calculate time left based on quest type
        const startDate = new Date(quest.started_at);
        const endDate = new Date(startDate);
        if (questData.type === 'daily') {
          endDate.setDate(endDate.getDate() + 1);
        } else {
          endDate.setDate(endDate.getDate() + 7);
        }

        return {
          id: quest.id,
          title: questData.title || 'Challenge',
          description: questData.description || '',
          progress: quest.current_progress || 0,
          target: questData.target_value || 1,
          xpReward: questData.xp_reward || 0,
          timeLeft: formatTimeLeft(endDate.toISOString()),
        };
      });

      // Process rewards preview
      const rewardsPreview: RewardPreview[] = (rewards || []).map(reward => ({
        id: reward.id,
        name: reward.title || 'Reward',
        icon: reward.icon || 'gift',
        cost: reward.points || 0,
      }));

      return {
        user,
        streak,
        badges,
        leaderboard,
        challenges,
        rewardsPreview,
      };
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook for fetching only leaderboard data
 */
export function useLeaderboardFullQuery(scope: 'class' | 'school' | 'global' = 'class', limit: number = 50) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['leaderboard-full', customerId, scope, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('gamification_stats')
        .select(`
          user_id,
          total_xp,
          user_profiles!inner(full_name, avatar_url)
        `)
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        id: entry.user_id,
        name: (entry.user_profiles as any)?.full_name || 'User',
        avatar: (entry.user_profiles as any)?.avatar_url,
        xp: entry.total_xp || 0,
        rank: index + 1,
        isCurrentUser: false, // Will be set by component
      }));
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export default useGamificationDataQuery;
