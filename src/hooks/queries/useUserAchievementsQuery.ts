import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type Achievement = {
  id: string;
  achievement_id: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  icon: string;
  color: string;
  category: 'learning' | 'streak' | 'social' | 'assessment' | 'milestone' | 'special' | 'general';
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement_type: 'count' | 'streak' | 'score' | 'time' | 'custom';
  requirement_value: number;
  is_hidden: boolean;
  order_index: number;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: number;
  is_claimed: boolean;
  claimed_at: string | null;
  achievement: Achievement;
};

export type AchievementWithProgress = Achievement & {
  unlocked: boolean;
  progress: number;
  unlocked_at: string | null;
  is_claimed: boolean;
};

export const DEMO_USER_ID = 'demo-student-001';

export function useUserAchievementsQuery(userId?: string) {
  const customerId = useCustomerId();
  const effectiveUserId = userId || DEMO_USER_ID;

  return useQuery({
    queryKey: ['user-achievements', effectiveUserId, customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      // Fetch all achievements for customer
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', effectiveUserId);

      if (userError) throw userError;

      // Merge achievements with user progress
      const userAchievementMap = new Map(
        (userAchievements || []).map(ua => [ua.achievement_id, ua])
      );

      const achievementsWithProgress: AchievementWithProgress[] = (achievements || [])
        .filter(a => !a.is_hidden || userAchievementMap.has(a.id))
        .map(achievement => {
          const userProgress = userAchievementMap.get(achievement.id);
          return {
            ...achievement,
            unlocked: !!userProgress,
            progress: userProgress?.progress || 0,
            unlocked_at: userProgress?.unlocked_at || null,
            is_claimed: userProgress?.is_claimed || false,
          };
        });

      return achievementsWithProgress;
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 5,
  });
}

// Get summary stats
export function useAchievementStats(achievements: AchievementWithProgress[] | undefined) {
  if (!achievements) {
    return { total: 0, unlocked: 0, totalPoints: 0, earnedPoints: 0 };
  }

  const unlocked = achievements.filter(a => a.unlocked);
  return {
    total: achievements.length,
    unlocked: unlocked.length,
    totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
    earnedPoints: unlocked.reduce((sum, a) => sum + a.points, 0),
  };
}
