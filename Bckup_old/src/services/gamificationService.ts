/**
 * Gamification Service
 * Handles gamification features including achievements, learning streaks, challenges, and leaderboards
 *
 * NOTE: Currently using mock data. Will integrate with Supabase once the following
 * database tables are created:
 * - student_achievements (badges, unlocked status, progress)
 * - learning_streaks (daily, weekly, subject-specific streaks)
 * - challenges (individual, team, and global challenges)
 * - leaderboards (rankings by various categories)
 * - student_progress (XP, levels, coins, gems)
 * - seasonal_events (time-limited events with special rewards)
 */

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ==================== INTERFACES ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'academic' | 'streak' | 'social' | 'challenge' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedDate?: Date;
  xpReward: number;
  coinReward: number;
}

export interface LearningStreak {
  type: 'daily' | 'weekly' | 'subject' | 'perfect';
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  subject?: string;
  lastActivity: Date;
  streakBonus: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'global';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  subject: string;
  timeLimit: number; // in hours
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants?: number;
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
  progress: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface Leaderboard {
  type: 'daily' | 'weekly' | 'monthly' | 'alltime';
  category: 'xp' | 'streaks' | 'achievements' | 'challenges';
  entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  avatar: string;
  score: number;
  change: number; // position change from last period
  badge?: string;
  level: number;
}

export interface StudentProgress {
  level: number;
  xp: number;
  xpToNext: number;
  totalXP: number;
  coins: number;
  gems: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  rank: number;
  title: string;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  theme: string;
  description: string;
  startDate: Date;
  endDate: Date;
  specialRewards: string[];
  isActive: boolean;
  progress: number;
  maxProgress: number;
}

// ==================== MOCK DATA ====================

const mockAchievements: Achievement[] = [
  {
    id: 'first_login',
    name: 'First Steps',
    description: 'Welcome to your learning journey!',
    icon: '🚀',
    category: 'milestone',
    rarity: 'common',
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    unlockedDate: new Date(2024, 0, 15),
    xpReward: 100,
    coinReward: 50
  },
  {
    id: 'math_streak_7',
    name: 'Math Warrior',
    description: 'Complete 7 consecutive days of math practice',
    icon: '🔢',
    category: 'streak',
    rarity: 'rare',
    progress: 7,
    maxProgress: 7,
    isUnlocked: true,
    unlockedDate: new Date(2024, 2, 10),
    xpReward: 500,
    coinReward: 200
  },
  {
    id: 'perfect_score',
    name: 'Perfectionist',
    description: 'Score 100% on 5 different subjects',
    icon: '💯',
    category: 'academic',
    rarity: 'epic',
    progress: 3,
    maxProgress: 5,
    isUnlocked: false,
    xpReward: 1000,
    coinReward: 500
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Help 10 classmates with their doubts',
    icon: '🤝',
    category: 'social',
    rarity: 'rare',
    progress: 8,
    maxProgress: 10,
    isUnlocked: false,
    xpReward: 750,
    coinReward: 300
  },
  {
    id: 'ai_master',
    name: 'AI Whisperer',
    description: 'Have 50 successful AI tutor sessions',
    icon: '🤖',
    category: 'milestone',
    rarity: 'legendary',
    progress: 32,
    maxProgress: 50,
    isUnlocked: false,
    xpReward: 2000,
    coinReward: 1000
  }
];

const mockStreaks: LearningStreak[] = [
  {
    type: 'daily',
    currentStreak: 15,
    longestStreak: 23,
    isActive: true,
    lastActivity: new Date(),
    streakBonus: 1.5
  },
  {
    type: 'subject',
    currentStreak: 8,
    longestStreak: 12,
    isActive: true,
    subject: 'Mathematics',
    lastActivity: new Date(),
    streakBonus: 1.3
  },
  {
    type: 'perfect',
    currentStreak: 3,
    longestStreak: 5,
    isActive: true,
    lastActivity: new Date(),
    streakBonus: 2.0
  }
];

const mockChallenges: Challenge[] = [
  {
    id: 'math_marathon',
    title: 'Math Marathon',
    description: 'Solve 100 math problems this week',
    type: 'individual',
    difficulty: 'medium',
    subject: 'Mathematics',
    timeLimit: 168, // 1 week
    startDate: new Date(2024, 8, 1),
    endDate: new Date(2024, 8, 8),
    participants: 1,
    rewards: { xp: 800, coins: 300, badges: ['math_marathon_2024'] },
    progress: 67,
    isActive: true,
    isCompleted: false
  },
  {
    id: 'science_squad',
    title: 'Science Squad Challenge',
    description: 'Team up to explore physics concepts',
    type: 'team',
    difficulty: 'hard',
    subject: 'Physics',
    timeLimit: 72,
    startDate: new Date(2024, 8, 5),
    endDate: new Date(2024, 8, 8),
    participants: 234,
    maxParticipants: 500,
    rewards: { xp: 1200, coins: 500, badges: ['physics_explorer', 'team_champion'] },
    progress: 45,
    isActive: true,
    isCompleted: false
  },
  {
    id: 'ai_challenge',
    title: 'AI Learning Master',
    description: 'Use AI tutor for 20 different topics',
    type: 'global',
    difficulty: 'extreme',
    subject: 'All',
    timeLimit: 240,
    startDate: new Date(2024, 8, 1),
    endDate: new Date(2024, 8, 11),
    participants: 1567,
    rewards: { xp: 2000, coins: 800, badges: ['ai_master', 'global_champion'] },
    progress: 85,
    isActive: true,
    isCompleted: false
  }
];

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get student's gamification progress
 */
export const getStudentProgress = async (
  studentId: string
): Promise<ServiceResponse<StudentProgress>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const progress: StudentProgress = {
      level: 42,
      xp: 8950,
      xpToNext: 1050,
      totalXP: 89500,
      coins: 2450,
      gems: 89,
      achievementsUnlocked: 67,
      totalAchievements: 150,
      rank: 12,
      title: 'Mathematics Master'
    };

    return { data: progress, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get student's achievements
 */
export const getAchievements = async (
  studentId: string,
  filters?: {
    category?: Achievement['category'];
    rarity?: Achievement['rarity'];
    unlocked?: boolean;
  }
): Promise<ServiceResponse<Achievement[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredAchievements = [...mockAchievements];

    if (filters) {
      if (filters.category) {
        filteredAchievements = filteredAchievements.filter(a => a.category === filters.category);
      }
      if (filters.rarity) {
        filteredAchievements = filteredAchievements.filter(a => a.rarity === filters.rarity);
      }
      if (filters.unlocked !== undefined) {
        filteredAchievements = filteredAchievements.filter(a => a.isUnlocked === filters.unlocked);
      }
    }

    return { data: filteredAchievements, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get student's learning streaks
 */
export const getLearningStreaks = async (
  studentId: string
): Promise<ServiceResponse<LearningStreak[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: [...mockStreaks], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get active challenges
 */
export const getActiveChallenges = async (
  studentId: string
): Promise<ServiceResponse<Challenge[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const activeChallenges = mockChallenges.filter(c => c.isActive);

    return { data: activeChallenges, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (
  challengeId: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (
  type: 'daily' | 'weekly' | 'monthly' | 'alltime',
  category: 'xp' | 'streaks' | 'achievements' | 'challenges',
  studentId: string
): Promise<ServiceResponse<Leaderboard>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockLeaderboard: Leaderboard = {
      type,
      category,
      entries: [
        { rank: 1, studentId: 'top1', name: 'Priya Sharma', avatar: '👑', score: 12500, change: 2, level: 45, badge: '🏆' },
        { rank: 2, studentId: 'top2', name: 'Arjun Patel', avatar: '🥈', score: 11200, change: -1, level: 43, badge: '🥈' },
        { rank: 3, studentId: 'top3', name: 'Sneha Gupta', avatar: '🥉', score: 10800, change: 1, level: 42, badge: '🥉' },
        { rank: 12, studentId: studentId, name: 'You', avatar: '🎯', score: 8950, change: 3, level: 42, badge: '⭐' },
        { rank: 13, studentId: 'other1', name: 'Rahul Kumar', avatar: '📚', score: 8750, change: -2, level: 41 },
      ]
    };

    return { data: mockLeaderboard, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get current seasonal event
 */
export const getCurrentSeasonalEvent = async (): Promise<ServiceResponse<SeasonalEvent | null>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockEvent: SeasonalEvent = {
      id: 'autumn_learning',
      name: 'Autumn Learning Festival',
      theme: '🍂 Knowledge Harvest',
      description: 'Gather knowledge points like autumn leaves! Special rewards for active learners.',
      startDate: new Date(2024, 8, 1),
      endDate: new Date(2024, 8, 30),
      specialRewards: ['Golden Leaf Badge', 'Harvest Crown', 'Wisdom Scroll'],
      isActive: true,
      progress: 1250,
      maxProgress: 2000
    };

    return { data: mockEvent, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get comprehensive gamification data
 */
export const getGamificationData = async (
  studentId: string
): Promise<ServiceResponse<{
  progress: StudentProgress;
  achievements: Achievement[];
  learningStreaks: LearningStreak[];
  activeChallenges: Challenge[];
  leaderboard: Leaderboard;
  seasonalEvent: SeasonalEvent | null;
}>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const [progressResult, achievementsResult, streaksResult, challengesResult, leaderboardResult, eventResult] = await Promise.all([
      getStudentProgress(studentId),
      getAchievements(studentId),
      getLearningStreaks(studentId),
      getActiveChallenges(studentId),
      getLeaderboard('weekly', 'xp', studentId),
      getCurrentSeasonalEvent(),
    ]);

    if (!progressResult.success || !achievementsResult.success || !streaksResult.success ||
        !challengesResult.success || !leaderboardResult.success || !eventResult.success) {
      return {
        data: null,
        error: 'Failed to load some gamification data',
        success: false,
      };
    }

    return {
      data: {
        progress: progressResult.data!,
        achievements: achievementsResult.data!,
        learningStreaks: streaksResult.data!,
        activeChallenges: challengesResult.data!,
        leaderboard: leaderboardResult.data!,
        seasonalEvent: eventResult.data,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
