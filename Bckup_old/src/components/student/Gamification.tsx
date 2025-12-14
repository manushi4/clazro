import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface UserProgress {
  userId: string;
  userName: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  streak: number;
  rank: number;
  badges: Badge[];
  achievements: Achievement[];
  weeklyGoal: {
    target: number;
    current: number;
    type: 'questions' | 'answers' | 'points' | 'sessions';
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'learning' | 'community' | 'achievement' | 'special';
  unlockedAt?: Date;
  progress?: {
    current: number;
    required: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  type: 'milestone' | 'streak' | 'social' | 'performance';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  unlockedAt?: Date;
  requirements: {
    type: string;
    count: number;
    timeframe?: string;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  level: number;
  badges: number;
  change: number; // Position change from last week
}

interface GamificationProps {
  currentUser: UserProgress;
  leaderboard?: LeaderboardEntry[];
  onClaimReward?: (rewardId: string) => void;
  onShareAchievement?: (achievementId: string) => void;
  showLeaderboard?: boolean;
  showWeeklyGoals?: boolean;
}

const MOCK_USER_PROGRESS: UserProgress = {
  userId: 'user123',
  userName: 'Alex Chen',
  level: 12,
  currentXP: 2450,
  xpToNextLevel: 550,
  totalXP: 15890,
  streak: 7,
  rank: 23,
  badges: [],
  achievements: [],
  weeklyGoal: {
    target: 50,
    current: 32,
    type: 'questions',
  },
};

const MOCK_BADGES: Badge[] = [
  {
    id: 'first_question',
    name: 'Curious Mind',
    description: 'Asked your first question',
    icon: '❓',
    rarity: 'common',
    category: 'learning',
    unlockedAt: new Date('2024-01-10'),
  },
  {
    id: 'helpful_answer',
    name: 'Helper',
    description: 'Provided 10 helpful answers',
    icon: '🤝',
    rarity: 'rare',
    category: 'community',
    progress: { current: 7, required: 10 },
  },
  {
    id: 'week_streak',
    name: 'Dedicated Learner',
    description: 'Maintained a 7-day learning streak',
    icon: '🔥',
    rarity: 'epic',
    category: 'achievement',
    unlockedAt: new Date('2024-01-15'),
  },
  {
    id: 'math_master',
    name: 'Mathematics Virtuoso',
    description: 'Solved 100 math problems correctly',
    icon: '🧮',
    rarity: 'legendary',
    category: 'special',
    progress: { current: 87, required: 100 },
  },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_week',
    title: 'Getting Started',
    description: 'Completed your first week of learning',
    icon: '🌟',
    points: 100,
    type: 'milestone',
    difficulty: 'easy',
    unlockedAt: new Date('2024-01-14'),
    requirements: [
      { type: 'days_active', count: 7 },
    ],
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Interacted with 20 different students',
    icon: '🦋',
    points: 250,
    type: 'social',
    difficulty: 'medium',
    requirements: [
      { type: 'unique_interactions', count: 20 },
    ],
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Got 10 answers marked as "Best Answer"',
    icon: '✨',
    points: 500,
    type: 'performance',
    difficulty: 'hard',
    unlockedAt: new Date('2024-01-12'),
    requirements: [
      { type: 'best_answers', count: 10 },
    ],
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'top1', userName: 'Sarah Kim', points: 28750, level: 18, badges: 24, change: 0 },
  { rank: 2, userId: 'top2', userName: 'Mike Johnson', points: 26430, level: 17, badges: 21, change: 1 },
  { rank: 3, userId: 'top3', userName: 'Emma Wilson', points: 24890, level: 16, badges: 19, change: -1 },
  { rank: 23, userId: 'user123', userName: 'Alex Chen', points: 15890, level: 12, badges: 8, change: 2 },
];

export default function Gamification({
  currentUser = { ...MOCK_USER_PROGRESS, badges: MOCK_BADGES, achievements: MOCK_ACHIEVEMENTS },
  leaderboard = MOCK_LEADERBOARD,
  onClaimReward,
  onShareAchievement,
  showLeaderboard = true,
  showWeeklyGoals = true,
}: GamificationProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements' | 'leaderboard'>('overview');
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bars
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const getLevelProgress = () => {
    return currentUser.currentXP / (currentUser.currentXP + currentUser.xpToNextLevel);
  };

  const getWeeklyGoalProgress = () => {
    return currentUser.weeklyGoal.current / currentUser.weeklyGoal.target;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return theme.OnSurface;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return theme.OnSurface;
    }
  };

  const handleClaimReward = useCallback((rewardId: string) => {
    Alert.alert(
      'Reward Claimed!',
      'Congratulations! Your reward has been added to your account.',
      [{ text: 'Awesome!', onPress: () => onClaimReward?.(rewardId) }]
    );
  }, [onClaimReward]);

  const handleShareAchievement = useCallback((achievementId: string) => {
    Alert.alert(
      'Share Achievement',
      'Would you like to share this achievement with your friends?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => onShareAchievement?.(achievementId) },
      ]
    );
  }, [onShareAchievement]);

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Level Progress */}
      <View style={[styles.card, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Level Progress
        </Text>
        <View style={styles.levelContainer}>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelNumber, { color: theme.primary }]}>
              {currentUser.level}
            </Text>
            <Text style={[styles.levelLabel, { color: theme.OnSurfaceVariant }]}>
              Level
            </Text>
          </View>
          <View style={styles.xpContainer}>
            <Text style={[styles.xpText, { color: theme.OnSurface }]}>
              {currentUser.currentXP.toLocaleString()} / {(currentUser.currentXP + currentUser.xpToNextLevel).toLocaleString()} XP
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.SurfaceVariant }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${getLevelProgress() * 100}%`],
                    }),
                  }
                ]}
              />
            </View>
            <Text style={[styles.xpRemaining, { color: theme.OnSurfaceVariant }]}>
              {currentUser.xpToNextLevel} XP to next level
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {currentUser.rank}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Rank
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {currentUser.streak}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Day Streak
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {currentUser.badges.filter(b => b.unlockedAt).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Badges
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
            {currentUser.achievements.filter(a => a.unlockedAt).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Achievements
          </Text>
        </View>
      </View>

      {/* Weekly Goal */}
      {showWeeklyGoals && (
        <View style={[styles.card, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
            Weekly Goal
          </Text>
          <View style={styles.goalContainer}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalType, { color: theme.OnSurface }]}>
                {currentUser.weeklyGoal.type.charAt(0).toUpperCase() + currentUser.weeklyGoal.type.slice(1)}
              </Text>
              <Text style={[styles.goalProgress, { color: theme.primary }]}>
                {currentUser.weeklyGoal.current} / {currentUser.weeklyGoal.target}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.SurfaceVariant }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: '#4CAF50',
                    width: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(getWeeklyGoalProgress() * 100, 100)}%`],
                    }),
                  }
                ]}
              />
            </View>
            <Text style={[styles.goalRemaining, { color: theme.OnSurfaceVariant }]}>
              {Math.max(0, currentUser.weeklyGoal.target - currentUser.weeklyGoal.current)} more to reach your goal!
            </Text>
          </View>
        </View>
      )}

      {/* Recent Achievements */}
      <View style={[styles.card, { backgroundColor: theme.Surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
            Recent Achievements
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab('achievements')}
            accessibilityRole="button"
            accessibilityLabel="View all achievements"
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recentItems}>
          {currentUser.achievements
            .filter(a => a.unlockedAt)
            .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
            .slice(0, 3)
            .map(achievement => (
              <TouchableOpacity
                key={achievement.id}
                style={styles.recentItem}
                onPress={() => {
                  setSelectedAchievement(achievement);
                  setAchievementModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`View achievement: ${achievement.title}`}
              >
                <Text style={styles.recentItemIcon}>{achievement.icon}</Text>
                <View style={styles.recentItemInfo}>
                  <Text style={[styles.recentItemTitle, { color: theme.OnSurface }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.recentItemPoints, { color: theme.primary }]}>
                    +{achievement.points} points
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderBadges = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.badgesGrid}>
        {currentUser.badges.map(badge => (
          <TouchableOpacity
            key={badge.id}
            style={[
              styles.badgeCard,
              {
                backgroundColor: badge.unlockedAt ? theme.Surface : theme.SurfaceVariant,
                opacity: badge.unlockedAt ? 1 : 0.6,
              }
            ]}
            onPress={() => {
              setSelectedBadge(badge);
              setBadgeModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`View badge: ${badge.name}`}
          >
            <Text style={[styles.badgeIcon, { fontSize: badge.rarity === 'legendary' ? 32 : 28 }]}>
              {badge.icon}
            </Text>
            <Text style={[styles.badgeName, { color: theme.OnSurface }]} numberOfLines={2}>
              {badge.name}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: getRarityColor(badge.rarity) }
              ]}
            >
              <Text style={[styles.rarityText, { color: theme.OnPrimary }]}>
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
              </Text>
            </View>
            
            {badge.progress && !badge.unlockedAt && (
              <View style={styles.badgeProgress}>
                <Text style={[styles.badgeProgressText, { color: theme.OnSurfaceVariant }]}>
                  {badge.progress.current} / {badge.progress.required}
                </Text>
                <View style={[styles.badgeProgressBar, { backgroundColor: theme.Outline }]}>
                  <View
                    style={[
                      styles.badgeProgressFill,
                      {
                        backgroundColor: getRarityColor(badge.rarity),
                        width: `${(badge.progress.current / badge.progress.required) * 100}%`,
                      }
                    ]}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {currentUser.achievements.map(achievement => (
        <TouchableOpacity
          key={achievement.id}
          style={[
            styles.achievementCard,
            {
              backgroundColor: achievement.unlockedAt ? theme.Surface : theme.SurfaceVariant,
              opacity: achievement.unlockedAt ? 1 : 0.7,
            }
          ]}
          onPress={() => {
            setSelectedAchievement(achievement);
            setAchievementModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`View achievement: ${achievement.title}`}
        >
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementIconText}>{achievement.icon}</Text>
          </View>
          
          <View style={styles.achievementInfo}>
            <View style={styles.achievementHeader}>
              <Text style={[styles.achievementTitle, { color: theme.OnSurface }]}>
                {achievement.title}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(achievement.difficulty) }
                ]}
              >
                <Text style={[styles.difficultyText, { color: theme.OnPrimary }]}>
                  {achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1)}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.achievementDescription, { color: theme.OnSurfaceVariant }]}>
              {achievement.description}
            </Text>
            
            <View style={styles.achievementFooter}>
              <Text style={[styles.achievementPoints, { color: theme.primary }]}>
                {achievement.points} points
              </Text>
              {achievement.unlockedAt && (
                <Text style={[styles.achievementDate, { color: theme.OnSurfaceVariant }]}>
                  Unlocked {achievement.unlockedAt.toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          
          {achievement.unlockedAt && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShareAchievement(achievement.id)}
              accessibilityRole="button"
              accessibilityLabel="Share achievement"
            >
              <Text style={styles.shareButtonText}>📤</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <FlatList
        data={leaderboard}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.leaderboardItem,
              {
                backgroundColor: item.userId === currentUser.userId 
                  ? theme.primaryContainer 
                  : theme.Surface,
              }
            ]}
          >
            <View style={styles.rankContainer}>
              <Text
                style={[
                  styles.rankNumber,
                  {
                    color: item.rank <= 3 ? '#FFD700' : theme.OnSurface,
                    fontWeight: item.rank <= 3 ? 'bold' : 'normal',
                  }
                ]}
              >
                #{item.rank}
              </Text>
              {item.change !== 0 && (
                <Text
                  style={[
                    styles.rankChange,
                    { color: item.change > 0 ? '#4CAF50' : '#F44336' }
                  ]}
                >
                  {item.change > 0 ? `↑${item.change}` : `↓${Math.abs(item.change)}`}
                </Text>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={[styles.leaderboardUserName, { color: theme.OnSurface }]}>
                {item.userName}
                {item.userId === currentUser.userId && ' (You)'}
              </Text>
              <Text style={[styles.leaderboardUserLevel, { color: theme.OnSurfaceVariant }]}>
                Level {item.level} • {item.badges} badges
              </Text>
            </View>
            
            <Text style={[styles.leaderboardPoints, { color: theme.primary }]}>
              {item.points.toLocaleString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.userId}
      />
    </ScrollView>
  );

  const renderBadgeModal = () => (
    <Modal
      visible={badgeModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setBadgeModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.badgeModalContent, { backgroundColor: theme.background }]}>
          {selectedBadge && (
            <>
              <Text style={styles.badgeModalIcon}>{selectedBadge.icon}</Text>
              <Text style={[styles.badgeModalName, { color: theme.OnSurface }]}>
                {selectedBadge.name}
              </Text>
              <View
                style={[
                  styles.badgeModalRarity,
                  { backgroundColor: getRarityColor(selectedBadge.rarity) }
                ]}
              >
                <Text style={[styles.badgeModalRarityText, { color: theme.OnPrimary }]}>
                  {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                </Text>
              </View>
              <Text style={[styles.badgeModalDescription, { color: theme.OnSurfaceVariant }]}>
                {selectedBadge.description}
              </Text>
              
              {selectedBadge.progress && !selectedBadge.unlockedAt && (
                <View style={styles.badgeModalProgress}>
                  <Text style={[styles.badgeModalProgressText, { color: theme.OnSurface }]}>
                    Progress: {selectedBadge.progress.current} / {selectedBadge.progress.required}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: theme.SurfaceVariant }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: getRarityColor(selectedBadge.rarity),
                          width: `${(selectedBadge.progress.current / selectedBadge.progress.required) * 100}%`,
                        }
                      ]}
                    />
                  </View>
                </View>
              )}
              
              {selectedBadge.unlockedAt && (
                <Text style={[styles.badgeModalDate, { color: theme.OnSurfaceVariant }]}>
                  Unlocked on {selectedBadge.unlockedAt.toLocaleDateString()}
                </Text>
              )}
              
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
                onPress={() => setBadgeModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close badge details"
              >
                <Text style={[styles.modalCloseButtonText, { color: theme.OnPrimary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderAchievementModal = () => (
    <Modal
      visible={achievementModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setAchievementModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.achievementModalContent, { backgroundColor: theme.background }]}>
          {selectedAchievement && (
            <>
              <Text style={styles.achievementModalIcon}>{selectedAchievement.icon}</Text>
              <Text style={[styles.achievementModalTitle, { color: theme.OnSurface }]}>
                {selectedAchievement.title}
              </Text>
              <View
                style={[
                  styles.achievementModalDifficulty,
                  { backgroundColor: getDifficultyColor(selectedAchievement.difficulty) }
                ]}
              >
                <Text style={[styles.achievementModalDifficultyText, { color: theme.OnPrimary }]}>
                  {selectedAchievement.difficulty.charAt(0).toUpperCase() + selectedAchievement.difficulty.slice(1)}
                </Text>
              </View>
              <Text style={[styles.achievementModalDescription, { color: theme.OnSurfaceVariant }]}>
                {selectedAchievement.description}
              </Text>
              <Text style={[styles.achievementModalPoints, { color: theme.primary }]}>
                {selectedAchievement.points} XP Points
              </Text>
              
              {selectedAchievement.unlockedAt && (
                <Text style={[styles.achievementModalDate, { color: theme.OnSurfaceVariant }]}>
                  Unlocked on {selectedAchievement.unlockedAt.toLocaleDateString()}
                </Text>
              )}
              
              <View style={styles.achievementModalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                  onPress={() => setAchievementModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                    Close
                  </Text>
                </TouchableOpacity>
                
                {selectedAchievement.unlockedAt && (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      handleShareAchievement(selectedAchievement.id);
                      setAchievementModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                      Share
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
          Your Progress
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Level {currentUser.level} • {currentUser.totalXP.toLocaleString()} XP
        </Text>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.Surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'badges', label: 'Badges' },
            { key: 'achievements', label: 'Achievements' },
            ...(showLeaderboard ? [{ key: 'leaderboard', label: 'Leaderboard' }] : []),
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && {
                  borderBottomColor: theme.primary,
                  borderBottomWidth: 2,
                }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${tab.label} tab`}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? theme.primary : theme.OnSurfaceVariant,
                    fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'badges' && renderBadges()}
      {activeTab === 'achievements' && renderAchievements()}
      {activeTab === 'leaderboard' && renderLeaderboard()}

      {renderBadgeModal()}
      {renderAchievementModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelInfo: {
    alignItems: 'center',
    marginRight: 20,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  levelLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  xpContainer: {
    flex: 1,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpRemaining: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  goalContainer: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalRemaining: {
    fontSize: 14,
  },
  recentItems: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  recentItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentItemPoints: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeProgress: {
    width: '100%',
    alignItems: 'center',
  },
  badgeProgressText: {
    fontSize: 12,
    marginBottom: 4,
  },
  badgeProgressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementIconText: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementDate: {
    fontSize: 12,
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankChange: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  userInfo: {
    flex: 1,
  },
  leaderboardUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardUserLevel: {
    fontSize: 14,
    marginTop: 2,
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModalContent: {
    width: '80%',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  badgeModalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  badgeModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeModalRarity: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  badgeModalRarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeModalDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  badgeModalProgress: {
    width: '100%',
    marginBottom: 16,
  },
  badgeModalProgressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeModalDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  modalCloseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementModalContent: {
    width: '85%',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  achievementModalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  achievementModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementModalDifficulty: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  achievementModalDifficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementModalDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  achievementModalPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  achievementModalDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  achievementModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});