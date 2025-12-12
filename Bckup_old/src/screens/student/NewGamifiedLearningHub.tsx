/**
 * NewGamifiedLearningHub - EXACT match to HTML reference
 * Purpose: Gamified learning with XP, badges, leaderboard, challenges
 * Design: Material Design with progress tracking and rewards
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'NewGamifiedLearningHub'>;

export default function NewGamifiedLearningHub({ navigation }: Props) {
  const { user } = useAuth();

  // Fetch student stats
  const { data: studentStats } = useQuery({
    queryKey: ['student-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('students')
        .select('name, xp, level, streak_days')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching student stats:', error);
        return null;
      }

      return {
        name: data?.name || 'Student',
        currentXP: data?.xp || 0,
        nextLevelXP: ((data?.level || 0) + 1) * 200, // Formula for next level
        level: data?.level || 1,
        streakDays: data?.streak_days || 0
      };
    },
    enabled: !!user?.id,
  });

  const currentXP = studentStats?.currentXP || 0;
  const nextLevelXP = studentStats?.nextLevelXP || 200;
  const level = studentStats?.level || 1;
  const streakDays = studentStats?.streakDays || 0;
  const progressPercent = Math.round((currentXP / nextLevelXP) * 100);

  // Fetch student badges
  const { data: badges } = useQuery({
    queryKey: ['student-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('student_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            id,
            icon,
            label,
            color
          )
        `)
        .eq('student_id', user.id);

      if (error) {
        console.error('Error fetching badges:', error);
        return [];
      }

      return data?.map(sb => ({
        id: sb.badge_id,
        icon: sb.badges?.icon || '🎓',
        label: sb.badges?.label || 'Badge',
        earned: !!sb.earned_at,
        color: sb.badges?.color || '#10B981'
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('students')
        .select('id, name, xp, avatar_url')
        .order('xp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data?.map((student, index) => ({
        rank: index + 1,
        name: student.id === user.id ? `${student.name} (You)` : student.name,
        xp: student.xp || 0,
        avatar: student.avatar_url || '👤',
        isCurrentUser: student.id === user.id
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch challenges
  const { data: challenges } = useQuery({
    queryKey: ['student-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('student_challenges')
        .select(`
          id,
          current_progress,
          challenges (
            id,
            icon,
            title,
            target_value,
            xp_reward
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching challenges:', error);
        return [];
      }

      return data?.map(sc => ({
        id: sc.id,
        icon: sc.challenges?.icon || '✓',
        title: sc.challenges?.title || 'Challenge',
        current: sc.current_progress || 0,
        total: sc.challenges?.target_value || 0,
        xpReward: sc.challenges?.xp_reward || 0
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch rewards
  const { data: rewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('points', { ascending: true });

      if (error) {
        console.error('Error fetching rewards:', error);
        return [];
      }

      return data?.map(reward => ({
        id: reward.id,
        icon: reward.icon || '🎁',
        title: reward.title || 'Reward',
        points: reward.points || 0,
        bgColor: reward.bg_color || '#EBF4FF',
        iconColor: reward.icon_color || '#4A90E2'
      })) || [];
    },
  });

  // Fetch activity feed
  const { data: activities } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .or(`student_id.eq.${user.id},is_global.eq.true`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching activities:', error);
        return [];
      }

      // Helper function to format timestamp
      const formatTimeAgo = (timestamp: string) => {
        const now = new Date().getTime();
        const activityTime = new Date(timestamp).getTime();
        const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      };

      return data?.map(activity => ({
        id: activity.id,
        type: activity.type as 'achievement' | 'user',
        icon: activity.icon,
        avatar: activity.avatar,
        text: activity.text || '',
        boldText: activity.bold_text || '',
        timestamp: formatTimeAgo(activity.created_at)
      })) || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    trackScreenView('NewGamifiedLearningHub');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back_button', 'NewGamifiedLearningHub');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>☰</T>
        </TouchableOpacity>

        <T variant="body" weight="bold" style={styles.topBarTitle}>
          Gamified Learning Hub
        </T>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => trackAction('more_options', 'NewGamifiedLearningHub')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <T style={styles.avatarText}>
                {studentStats?.name
                  ? studentStats.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '🧑'}
              </T>
            </View>
            <View style={styles.profileInfo}>
              <T variant="body" weight="semiBold" style={styles.userName}>
                {studentStats?.name || 'Student'}
              </T>
              <T variant="body" weight="semiBold" style={styles.userXP}>
                {currentXP.toLocaleString()} XP
              </T>
              <T variant="caption" style={styles.userLevel}>
                Level {level}
              </T>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <T variant="caption" weight="medium" style={styles.progressLabel}>
                Progress to Level {level + 1}
              </T>
              <T variant="caption" weight="medium" style={styles.progressValue}>
                {currentXP} / {nextLevelXP} XP
              </T>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <View style={styles.streakIcon}>
            <T style={styles.streakIconText}>🔥</T>
          </View>
          <View style={styles.streakContent}>
            <T variant="body" weight="semiBold" style={styles.streakTitle}>
              {streakDays}-Day Streak!
            </T>
            <T variant="caption" style={styles.streakSubtitle}>
              Keep it up to earn more rewards!
            </T>
          </View>
          <View style={styles.streakRewards}>
            <T style={styles.rewardIcon}>🏆</T>
            <T style={styles.rewardIcon}>💰</T>
          </View>
        </View>

        {/* My Badges */}
        <View style={styles.section}>
          <T variant="h2" weight="bold" style={styles.sectionTitle}>
            My Badges
          </T>
          <View style={styles.badgesGrid}>
            {(badges || []).map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeItem,
                  !badge.earned && styles.badgeItemLocked,
                ]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    badge.earned
                      ? { backgroundColor: '#D1FAE5' }
                      : styles.badgeIconLocked,
                  ]}
                >
                  <T style={styles.badgeIconText}>{badge.icon}</T>
                </View>
                <T
                  variant="caption"
                  weight="medium"
                  style={[
                    styles.badgeLabel,
                    !badge.earned && styles.badgeLabelLocked,
                  ]}
                >
                  {badge.label}
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Leaderboard */}
        <View style={styles.section}>
          <T variant="h2" weight="bold" style={styles.sectionTitle}>
            Weekly Leaderboard
          </T>
          <View style={styles.leaderboardList}>
            {(leaderboard || []).map((entry) => (
              <View
                key={entry.rank}
                style={[
                  styles.leaderboardItem,
                  entry.isCurrentUser && styles.leaderboardItemCurrent,
                ]}
              >
                <T
                  variant="body"
                  weight="bold"
                  style={[
                    styles.leaderboardRank,
                    entry.isCurrentUser && styles.leaderboardRankCurrent,
                  ]}
                >
                  {entry.rank}
                </T>
                <View
                  style={[
                    styles.leaderboardAvatar,
                    entry.isCurrentUser && styles.leaderboardAvatarCurrent,
                  ]}
                >
                  <T style={styles.leaderboardAvatarText}>{entry.avatar}</T>
                </View>
                <T
                  variant="body"
                  weight={entry.isCurrentUser ? 'bold' : 'medium'}
                  style={styles.leaderboardName}
                >
                  {entry.name}
                </T>
                <T variant="body" weight="semiBold" style={styles.leaderboardXP}>
                  {entry.xp.toLocaleString()} XP
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Active Challenges */}
        <View style={styles.section}>
          <T variant="h2" weight="bold" style={styles.sectionTitle}>
            Active Challenges
          </T>
          <View style={styles.challengesList}>
            {(challenges || []).map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeIcon}>
                  <T style={styles.challengeIconText}>{challenge.icon}</T>
                </View>
                <View style={styles.challengeContent}>
                  <T variant="body" weight="semiBold" style={styles.challengeTitle}>
                    {challenge.title}
                  </T>
                  <View style={styles.challengeProgressBar}>
                    <View
                      style={[
                        styles.challengeProgress,
                        {
                          width: `${Math.round(
                            (challenge.current / challenge.total) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <T variant="caption" style={styles.challengeStatus}>
                    {challenge.current} / {challenge.total} completed
                  </T>
                </View>
                <View style={styles.challengeReward}>
                  <T style={styles.challengeTrophy}>🏆</T>
                  <T variant="caption" weight="bold" style={styles.challengeXP}>
                    +{challenge.xpReward} XP
                  </T>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Rewards Shop */}
        <View style={styles.section}>
          <T variant="h2" weight="bold" style={styles.sectionTitle}>
            Rewards Shop
          </T>
          <View style={styles.rewardsGrid}>
            {(rewards || []).map((reward) => (
              <TouchableOpacity
                key={reward.id}
                style={styles.rewardCard}
                onPress={() =>
                  trackAction('view_reward', 'NewGamifiedLearningHub', {
                    rewardId: reward.id,
                  })
                }
              >
                <View
                  style={[
                    styles.rewardIconContainer,
                    { backgroundColor: reward.bgColor },
                  ]}
                >
                  <T style={styles.rewardIconLarge}>{reward.icon}</T>
                </View>
                <View style={styles.rewardInfo}>
                  <T variant="caption" weight="semiBold" style={styles.rewardTitle}>
                    {reward.title}
                  </T>
                  <T variant="caption" weight="bold" style={styles.rewardPoints}>
                    {reward.points} Points
                  </T>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <T variant="h2" weight="bold" style={styles.sectionTitle}>
            Activity Feed
          </T>
          <View style={styles.activityList}>
            {(activities || []).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                {activity.type === 'achievement' ? (
                  <View style={styles.activityAchievementIcon}>
                    <T style={styles.activityIconText}>{activity.icon}</T>
                  </View>
                ) : (
                  <View style={styles.activityUserAvatar}>
                    <T style={styles.activityAvatarText}>{activity.avatar}</T>
                  </View>
                )}
                <View style={styles.activityContent}>
                  <T variant="caption" style={styles.activityText}>
                    {activity.text}{' '}
                    <T variant="caption" weight="bold">
                      {activity.boldText}
                    </T>
                  </T>
                  <T variant="caption" style={styles.activityTimestamp}>
                    {activity.timestamp}
                  </T>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Top Bar - Material Design 56px
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    color: '#111827',
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  // Profile Card
  profileCard: {
    margin: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#111827',
    fontSize: 18,
    marginBottom: 4,
  },
  userXP: {
    color: '#4A90E2',
    fontSize: 16,
    marginBottom: 2,
  },
  userLevel: {
    color: '#6B7280',
    fontSize: 13,
  },
  progressSection: {

  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#111827',
    fontSize: 13,
  },
  progressValue: {
    color: '#6B7280',
    fontSize: 13,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  // Streak Banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',

    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EBF4FF',
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIconText: {
    fontSize: 28,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 2,
  },
  streakSubtitle: {
    color: '#6B7280',
    fontSize: 13,
  },
  streakRewards: {
    flexDirection: 'row',

  },
  rewardIcon: {
    fontSize: 20,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,

  },
  badgeItem: {
    width: '22%',
    alignItems: 'center',

  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconLocked: {
    backgroundColor: '#E5E7EB',
  },
  badgeIconText: {
    fontSize: 32,
  },
  badgeLabel: {
    color: '#111827',
    fontSize: 12,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: '#6B7280',
  },
  // Leaderboard
  leaderboardList: {

    paddingHorizontal: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  leaderboardItemCurrent: {
    backgroundColor: '#EBF4FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  leaderboardRank: {
    color: '#6B7280',
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  leaderboardRankCurrent: {
    color: '#4A90E2',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardAvatarCurrent: {
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  leaderboardAvatarText: {
    fontSize: 20,
  },
  leaderboardName: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  leaderboardXP: {
    color: '#4A90E2',
    fontSize: 14,
  },
  // Challenges
  challengesList: {

    paddingHorizontal: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIconText: {
    fontSize: 20,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 8,
  },
  challengeProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    overflow: 'hidden',
  },
  challengeProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  challengeStatus: {
    color: '#6B7280',
    fontSize: 13,
  },
  challengeReward: {
    alignItems: 'center',

  },
  challengeTrophy: {
    fontSize: 28,
  },
  challengeXP: {
    color: '#F59E0B',
    fontSize: 12,
  },
  // Rewards Shop
  rewardsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,

  },
  rewardCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  rewardIconContainer: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconLarge: {
    fontSize: 48,
  },
  rewardInfo: {
    padding: 12,
    alignItems: 'center',
  },
  rewardTitle: {
    color: '#111827',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardPoints: {
    color: '#F59E0B',
    fontSize: 13,
  },
  // Activity Feed
  activityList: {

    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  activityAchievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityAvatarText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#111827',
    fontSize: 13,
    marginBottom: 2,
  },
  activityTimestamp: {
    color: '#6B7280',
    fontSize: 12,
  },
});
