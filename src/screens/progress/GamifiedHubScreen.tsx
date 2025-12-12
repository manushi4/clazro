/**
 * GamifiedHubScreen - Gamification Hub (Fixed Screen)
 * 
 * Central hub for all gamification features including XP, badges, quests, 
 * leaderboard, and rewards. Uses theme, branding, and i18n throughout.
 * Works offline with cached data.
 * 
 * Per STUDENT_COMPLETE_SPEC.md - This is a detail/child screen under Progress tab.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNetworkStatus } from '../../offline/networkStore';
import { 
  useGamificationDataQuery,
  GamificationUser,
  StreakData,
  Badge,
  LeaderboardEntry,
  Challenge,
  RewardPreview,
} from '../../hooks/queries/useGamificationDataQuery';
import { AppText } from '../../ui/components/AppText';
import { AppCard } from '../../ui/components/AppCard';
import { OfflineBanner } from '../../offline/OfflineBanner';

const { width: screenWidth } = Dimensions.get('window');

// ============================================
// Sub-Components
// ============================================

/**
 * User Profile Card Component
 */
const UserProfileCard: React.FC<{
  user: GamificationUser;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ user, colors }) => {
  const progressPercentage = user.nextLevelXP > user.currentLevelXP
    ? ((user.xp - user.currentLevelXP) / (user.nextLevelXP - user.currentLevelXP)) * 100
    : 100;

  return (
    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Icon name="account" size={32} color={colors.onSurface} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <AppText style={[styles.userName, { color: colors.onPrimary }]}>
            {user.name}
          </AppText>
          <AppText style={[styles.userLevel, { color: colors.onPrimary }]}>
            Level {user.level}
          </AppText>
        </View>
        <View style={styles.xpBadge}>
          <AppText style={[styles.xpValue, { color: colors.onPrimary }]}>
            {user.xp.toLocaleString()}
          </AppText>
          <AppText style={[styles.xpLabel, { color: colors.onPrimary }]}>
            XP
          </AppText>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <AppText style={[styles.progressText, { color: colors.onPrimary }]}>
            {user.xp - user.currentLevelXP} / {user.nextLevelXP - user.currentLevelXP} XP to Level {user.level + 1}
          </AppText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: `${colors.onPrimary}30` }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: colors.onPrimary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Streak Banner Component
 */
const StreakBanner: React.FC<{
  streak: StreakData;
  colors: ReturnType<typeof useAppTheme>['colors'];
  t: (key: string, options?: any) => string;
}> = ({ streak, colors, t }) => (
  <View style={[styles.streakBanner, { backgroundColor: colors.warning }]}>
    <Icon name="fire" size={24} color={colors.onWarning} />
    <View style={styles.streakInfo}>
      <AppText style={[styles.streakDays, { color: colors.onWarning }]}>
        {streak.days} {t('gamifiedHub.dayStreak', { defaultValue: 'Day Streak' })}
      </AppText>
      <AppText style={[styles.streakSubtext, { color: colors.onWarning }]}>
        {t('gamifiedHub.longestStreak', { 
          defaultValue: 'Longest: {{days}} days',
          days: streak.longestStreak 
        })}
      </AppText>
    </View>
    {streak.rewardEarned && (
      <View style={[styles.rewardBadge, { backgroundColor: colors.success }]}>
        <Icon name="gift" size={16} color={colors.onSuccess} />
      </View>
    )}
  </View>
);

/**
 * Badge Grid Component
 */
const BadgeGrid: React.FC<{
  badges: Badge[];
  colors: ReturnType<typeof useAppTheme>['colors'];
  onBadgePress: (badgeId: string) => void;
}> = ({ badges, colors, onBadgePress }) => (
  <View style={styles.badgeGrid}>
    {badges.slice(0, 6).map((badge) => (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeItem,
          {
            backgroundColor: badge.unlocked ? `${badge.color}20` : colors.surfaceVariant,
            borderColor: badge.unlocked ? badge.color : colors.outline,
          },
        ]}
        onPress={() => onBadgePress(badge.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${badge.name} badge${badge.unlocked ? ', earned' : ', locked'}`}
      >
        <Icon
          name={badge.icon}
          size={24}
          color={badge.unlocked ? badge.color : colors.onSurfaceVariant}
        />
        <AppText
          style={[
            styles.badgeName,
            { color: badge.unlocked ? colors.onSurface : colors.onSurfaceVariant },
          ]}
          numberOfLines={2}
        >
          {badge.name}
        </AppText>
        {badge.unlocked && (
          <View style={[styles.unlockedIndicator, { backgroundColor: badge.color }]}>
            <Icon name="check" size={10} color="white" />
          </View>
        )}
      </TouchableOpacity>
    ))}
  </View>
);


/**
 * Leaderboard Preview Component
 */
const LeaderboardPreview: React.FC<{
  leaderboard: LeaderboardEntry[];
  colors: ReturnType<typeof useAppTheme>['colors'];
  onViewFullPress: () => void;
  t: (key: string, options?: any) => string;
}> = ({ leaderboard, colors, onViewFullPress, t }) => (
  <View style={styles.leaderboardContainer}>
    {leaderboard.slice(0, 5).map((user, index) => (
      <View
        key={user.id}
        style={[
          styles.leaderboardItem,
          {
            backgroundColor: user.isCurrentUser ? `${colors.primary}15` : 'transparent',
            borderColor: user.isCurrentUser ? colors.primary : 'transparent',
            borderWidth: user.isCurrentUser ? 1 : 0,
          },
        ]}
      >
        <View style={styles.rankContainer}>
          {index < 3 ? (
            <AppText style={styles.medalEmoji}>
              {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
            </AppText>
          ) : (
            <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>
              {user.rank}
            </AppText>
          )}
        </View>
        <View style={[styles.userAvatar, { backgroundColor: colors.surfaceVariant }]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
          ) : (
            <Icon name="account" size={20} color={colors.onSurfaceVariant} />
          )}
        </View>
        <View style={styles.userInfo}>
          <AppText
            style={[
              styles.leaderboardName,
              { color: user.isCurrentUser ? colors.primary : colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {user.name} {user.isCurrentUser ? `(${t('common.you', { defaultValue: 'You' })})` : ''}
          </AppText>
        </View>
        <AppText style={[styles.leaderboardXP, { color: colors.onSurfaceVariant }]}>
          {user.xp.toLocaleString()} XP
        </AppText>
      </View>
    ))}
    <TouchableOpacity
      style={[styles.viewFullButton, { backgroundColor: colors.primary }]}
      onPress={onViewFullPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('gamifiedHub.viewFullLeaderboard', { defaultValue: 'View Full Leaderboard' })}
    >
      <AppText style={[styles.viewFullText, { color: colors.onPrimary }]}>
        {t('gamifiedHub.viewFullLeaderboard', { defaultValue: 'View Full Leaderboard' })}
      </AppText>
      <Icon name="chevron-right" size={20} color={colors.onPrimary} />
    </TouchableOpacity>
  </View>
);

/**
 * Active Challenges Component
 */
const ActiveChallenges: React.FC<{
  challenges: Challenge[];
  colors: ReturnType<typeof useAppTheme>['colors'];
  onChallengePress: (challengeId: string) => void;
}> = ({ challenges, colors, onChallengePress }) => (
  <View style={styles.challengesContainer}>
    {challenges.map((challenge) => (
      <TouchableOpacity
        key={challenge.id}
        style={[styles.challengeCard, { backgroundColor: colors.surface }]}
        onPress={() => onChallengePress(challenge.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${challenge.title}, ${challenge.progress} of ${challenge.target} completed`}
      >
        <View style={styles.challengeHeader}>
          <AppText style={[styles.challengeTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {challenge.title}
          </AppText>
          <View style={[styles.xpRewardBadge, { backgroundColor: colors.primary }]}>
            <AppText style={[styles.xpRewardText, { color: colors.onPrimary }]}>
              +{challenge.xpReward} XP
            </AppText>
          </View>
        </View>
        <AppText style={[styles.challengeDescription, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
          {challenge.description}
        </AppText>
        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressInfo}>
            <AppText style={[styles.challengeProgressText, { color: colors.onSurface }]}>
              {challenge.progress} / {challenge.target}
            </AppText>
            <AppText style={[styles.timeLeft, { color: colors.onSurfaceVariant }]}>
              {challenge.timeLeft}
            </AppText>
          </View>
          <View style={[styles.challengeProgressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.challengeProgressFill,
                {
                  width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

/**
 * Rewards Preview Component
 */
const RewardsPreviewSection: React.FC<{
  rewards: RewardPreview[];
  colors: ReturnType<typeof useAppTheme>['colors'];
  onShopPress: () => void;
  t: (key: string, options?: any) => string;
}> = ({ rewards, colors, onShopPress, t }) => (
  <>
    <View style={styles.rewardsShopHeader}>
      <View>
        <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
          {t('gamifiedHub.rewardsShop', { defaultValue: 'Rewards Shop' })}
        </AppText>
        <AppText style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          {t('gamifiedHub.redeemPoints', { defaultValue: 'Redeem your XP for rewards' })}
        </AppText>
      </View>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: colors.primary }]}
        onPress={onShopPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('gamifiedHub.shop', { defaultValue: 'Shop' })}
      >
        <Icon name="store" size={20} color={colors.onPrimary} />
        <AppText style={[styles.shopButtonText, { color: colors.onPrimary }]}>
          {t('gamifiedHub.shop', { defaultValue: 'Shop' })}
        </AppText>
      </TouchableOpacity>
    </View>
    <View style={styles.rewardsPreview}>
      {rewards.map((reward) => (
        <View key={reward.id} style={[styles.rewardItem, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name={reward.icon} size={24} color={colors.primary} />
          <AppText style={[styles.rewardName, { color: colors.onSurface }]} numberOfLines={1}>
            {reward.name}
          </AppText>
          <AppText style={[styles.rewardCost, { color: colors.onSurfaceVariant }]}>
            {reward.cost} XP
          </AppText>
        </View>
      ))}
    </View>
  </>
);


// ============================================
// Main Screen Component
// ============================================

export const GamifiedHubScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation('progress');
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch gamification data
  const { data: gamificationData, isLoading, error, refetch } = useGamificationDataQuery();

  // Track screen view
  React.useEffect(() => {
    trackScreenView('gamified-hub');
  }, [trackScreenView]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    trackEvent('gamified_hub_refresh', 'interaction');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch, trackEvent]);

  // Handle badge press
  const handleBadgePress = useCallback((badgeId: string) => {
    trackEvent('gamified_hub_badge_press', 'interaction', { badgeId });
    // Could show badge detail modal
  }, [trackEvent]);

  // Handle leaderboard view full
  const handleViewFullLeaderboard = useCallback(() => {
    trackEvent('gamified_hub_leaderboard_view_full', 'navigation');
    (navigation as any).navigate('leaderboard');
  }, [navigation, trackEvent]);

  // Handle challenge press
  const handleChallengePress = useCallback((challengeId: string) => {
    trackEvent('gamified_hub_challenge_press', 'interaction', { challengeId });
    (navigation as any).navigate('quest-detail', { questId: challengeId });
  }, [navigation, trackEvent]);

  // Handle rewards shop press
  const handleRewardsShopPress = useCallback(() => {
    trackEvent('gamified_hub_rewards_shop', 'navigation');
    // Navigate to rewards shop when implemented
  }, [trackEvent]);

  // Loading state
  if (isLoading && !gamificationData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {t('common:loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !gamificationData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.onSurface }]}>
            {t('errors.loadFailed', { defaultValue: 'Failed to load gamification data' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel={t('errors.retry', { defaultValue: 'Retry' })}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t('errors.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isOnline && <OfflineBanner />}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* User Profile Card */}
        {gamificationData?.user && (
          <UserProfileCard user={gamificationData.user} colors={colors} />
        )}

        {/* Streak Banner */}
        {gamificationData?.streak && gamificationData.streak.days > 0 && (
          <StreakBanner streak={gamificationData.streak} colors={colors} t={t} />
        )}

        {/* My Badges */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t('gamifiedHub.myBadges', { defaultValue: 'My Badges' })}
            </AppText>
            <AppText style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
              {gamificationData?.badges?.filter(b => b.unlocked).length || 0} {t('gamifiedHub.of', { defaultValue: 'of' })} {gamificationData?.badges?.length || 0} {t('gamifiedHub.earned', { defaultValue: 'earned' })}
            </AppText>
          </View>
          {gamificationData?.badges && gamificationData.badges.length > 0 ? (
            <BadgeGrid
              badges={gamificationData.badges}
              colors={colors}
              onBadgePress={handleBadgePress}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="medal-outline" size={48} color={colors.onSurfaceVariant} />
              <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('gamifiedHub.noBadges', { defaultValue: 'No badges yet' })}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Weekly Leaderboard */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('gamifiedHub.weeklyLeaderboard', { defaultValue: 'Weekly Leaderboard' })}
          </AppText>
          {gamificationData?.leaderboard && gamificationData.leaderboard.length > 0 ? (
            <LeaderboardPreview
              leaderboard={gamificationData.leaderboard}
              colors={colors}
              onViewFullPress={handleViewFullLeaderboard}
              t={t}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="podium-outline" size={48} color={colors.onSurfaceVariant} />
              <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('gamifiedHub.noLeaderboard', { defaultValue: 'Leaderboard not available' })}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Active Challenges */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('gamifiedHub.activeChallenges', { defaultValue: 'Active Challenges' })}
          </AppText>
          {gamificationData?.challenges && gamificationData.challenges.length > 0 ? (
            <ActiveChallenges
              challenges={gamificationData.challenges}
              colors={colors}
              onChallengePress={handleChallengePress}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={48} color={colors.onSurfaceVariant} />
              <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('gamifiedHub.noChallenges', { defaultValue: 'No active challenges' })}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Rewards Shop */}
        <AppCard style={styles.card}>
          <RewardsPreviewSection
            rewards={gamificationData?.rewardsPreview || []}
            colors={colors}
            onShopPress={handleRewardsShopPress}
            t={t}
          />
        </AppCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};


// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // Profile Card
  profileCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    opacity: 0.9,
  },
  xpBadge: {
    alignItems: 'center',
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  xpLabel: {
    fontSize: 12,
    opacity: 0.9,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    opacity: 0.9,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Streak Banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakDays: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakSubtext: {
    fontSize: 12,
    opacity: 0.9,
  },
  rewardBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
  },

  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    width: (screenWidth - 80) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Leaderboard
  leaderboardContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardXP: {
    fontSize: 12,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  viewFullText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Challenges
  challengesContainer: {
    gap: 12,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  xpRewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpRewardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  challengeProgress: {
    gap: 8,
  },
  challengeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeLeft: {
    fontSize: 12,
  },
  challengeProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Rewards Shop
  rewardsShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shopButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardsPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardCost: {
    fontSize: 10,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 32,
  },
});

export default GamifiedHubScreen;
