/**
 * QuestDetailScreen - Full Quest Details
 * Purpose: Show complete quest info with progress, steps, rewards, and actions
 * Design: Motivational + gamified with complete Framer design system
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type QuestType = 'daily' | 'weekly';
type QuestStatus = 'active' | 'completed' | 'locked';

interface QuestDetail {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  rewardXp: number;
  status: QuestStatus;
  progressCurrent: number;
  progressTarget: number;
  timeRemainingLabel: string;
  allowedSources: string[];
  steps: string[];
  benefits?: string[];
}

interface Props {
  route: {
    params: {
      questId: string;
    };
  };
  navigation: any;
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  locked: '#9CA3AF',
  progressBg: '#E5E7EB',
  progressFill: '#2D5BFF',
  rewardChipBg: '#FEF3C7',
  rewardChipText: '#F59E0B',
  activeBadgeBg: '#EFF6FF',
  activeBadgeText: '#2D5BFF',
  completedBadgeBg: '#ECFDF5',
  completedBadgeText: '#22C55E',
  lockedBadgeBg: '#F3F4F6',
  lockedBadgeText: '#9CA3AF',
};

const TYPE_LABELS: Record<QuestType, string> = {
  daily: 'Daily quest',
  weekly: 'Weekly quest',
};

const QUEST_ICONS: Record<string, string> = {
  math: 'calculate',
  physics: 'science',
  chemistry: 'biotech',
  default: 'emoji-events',
};

// Info Chip Component
const InfoChip = ({ label, icon, color }: {
  label: string;
  icon: string;
  color: string;
}) => (
  <View style={[styles.infoChip, { backgroundColor: `${color}1A` }]}>
    <Icon name={icon} size={14} color={color} />
    <T style={StyleSheet.flatten([styles.infoChipText, { color }])}>{label}</T>
  </View>
);

// Progress Bar
const ProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
    </View>
  );
};

// Related Action Card
const RelatedCard = ({ icon, title, subtitle, onPress }: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <Pressable style={styles.relatedCard} onPress={onPress} accessibilityRole="button">
    <View style={styles.relatedIcon}>
      <Icon name={icon} size={24} color={FRAMER_COLORS.primary} />
    </View>
    <View style={styles.relatedContent}>
      <T style={styles.relatedTitle}>{title}</T>
      <T style={styles.relatedSubtitle}>{subtitle}</T>
    </View>
    <Pressable style={styles.relatedButton} onPress={onPress}>
      <T style={styles.relatedButtonText}>Start</T>
    </Pressable>
  </Pressable>
);

export default function QuestDetailScreen({ route, navigation }: Props) {
  const { questId } = route.params;

  useEffect(() => {
    trackScreenView('QuestDetailScreen');
  }, []);

  // Fetch quest details
  const { data: quest, isLoading, error } = useQuery({
    queryKey: ['questDetail', questId],
    queryFn: async () => {
      // TODO: Replace with real Supabase query
      const mockQuest: QuestDetail = {
        id: questId,
        title: 'Solve 3 Math problems',
        description: 'Pick any 3 Math questions and solve them today. You can complete them from classes, study library, or tests.',
        type: 'daily',
        rewardXp: 20,
        status: 'active',
        progressCurrent: 2,
        progressTarget: 3,
        timeRemainingLabel: 'Resets in 6 hours',
        allowedSources: ['Assignments', 'AI Practice', 'Tests'],
        steps: [
          'Solve any 3 Math questions',
          'Questions can be from Assignments, Tests, or AI practice',
          'Only questions solved today count',
        ],
        benefits: [
          'Helps you build consistent practice habits',
          'Tracks your daily learning progress',
          'Rewards XP for completing tasks',
        ],
      };
      return mockQuest;
    },
  });

  const getStatusBadgeStyle = () => {
    if (!quest) return { bg: FRAMER_COLORS.activeBadgeBg, text: FRAMER_COLORS.activeBadgeText };
    switch (quest.status) {
      case 'active':
        return { bg: FRAMER_COLORS.activeBadgeBg, text: FRAMER_COLORS.activeBadgeText };
      case 'completed':
        return { bg: FRAMER_COLORS.completedBadgeBg, text: FRAMER_COLORS.completedBadgeText };
      case 'locked':
        return { bg: FRAMER_COLORS.lockedBadgeBg, text: FRAMER_COLORS.lockedBadgeText };
    }
  };

  const getCTAButton = () => {
    if (!quest) return { label: 'Continue', subtitle: '', disabled: false };
    switch (quest.status) {
      case 'active':
        return {
          label: 'Continue quest',
          subtitle: `Solve ${quest.progressTarget - quest.progressCurrent} more question${quest.progressTarget - quest.progressCurrent !== 1 ? 's' : ''}`,
          disabled: false,
        };
      case 'completed':
        return { label: 'Continue learning', subtitle: 'Great job!', disabled: false };
      case 'locked':
        return { label: 'Locked', subtitle: '', disabled: true };
    }
  };

  if (!quest) {
    return (
      <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
        <View />
      </BaseScreen>
    );
  }

  const statusBadge = getStatusBadgeStyle();
  const cta = getCTAButton();

  return (
    <BaseScreen backgroundColor={FRAMER_COLORS.background}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                trackAction('back', 'QuestDetailScreen');
                navigation.goBack();
              }}
              accessibilityRole="button"
            >
              <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
            </Pressable>
            <T style={styles.headerTitle}>Quest details</T>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Quest Hero Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Icon name={QUEST_ICONS.default} size={48} color={FRAMER_COLORS.warning} />
            </View>
            <T style={styles.heroTitle}>{quest.title}</T>
            <Row style={styles.heroChips}>
              <InfoChip label={TYPE_LABELS[quest.type]} icon="calendar-today" color={FRAMER_COLORS.primary} />
              <InfoChip label={`+${quest.rewardXp} XP`} icon="star" color={FRAMER_COLORS.warning} />
              <View style={[styles.statusChip, { backgroundColor: statusBadge.bg }]}>
                <T style={StyleSheet.flatten([styles.statusChipText, { color: statusBadge.text }])}>
                  {quest.status.charAt(0).toUpperCase() + quest.status.slice(1)}
                </T>
              </View>
            </Row>
          </Animated.View>

          {/* Description Card */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.card}>
            <T style={styles.cardTitle}>About this quest</T>
            <T style={styles.descriptionText}>{quest.description}</T>
            {quest.benefits && quest.benefits.length > 0 && (
              <View style={styles.benefitsList}>
                {quest.benefits.map((benefit, idx) => (
                  <Row key={idx} style={styles.benefitRow}>
                    <Icon name="check-circle" size={16} color={FRAMER_COLORS.success} />
                    <T style={styles.benefitText}>{benefit}</T>
                  </Row>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Progress Card */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.card}>
            <T style={styles.cardTitle}>Progress</T>
            <Row style={styles.progressHeader}>
              <T style={styles.progressNumbers}>
                Progress: {quest.progressCurrent} / {quest.progressTarget}
              </T>
              <View style={styles.timeChip}>
                <Icon name="schedule" size={14} color={FRAMER_COLORS.textSecondary} />
                <T style={styles.timeChipText}>{quest.timeRemainingLabel}</T>
              </View>
            </Row>
            <ProgressBar current={quest.progressCurrent} target={quest.progressTarget} />
            <T style={styles.progressSubtext}>
              You need {quest.progressTarget - quest.progressCurrent} more to complete this quest.
            </T>
          </Animated.View>

          {/* Steps Card */}
          <Animated.View entering={FadeInUp.delay(400).springify().stiffness(120).damping(15)} style={styles.card}>
            <T style={styles.cardTitle}>How to complete</T>
            <View style={styles.stepsList}>
              {quest.steps.map((step, idx) => (
                <Row key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <T style={styles.stepNumberText}>{idx + 1}</T>
                  </View>
                  <T style={styles.stepText}>{step}</T>
                </Row>
              ))}
            </View>
            <Pressable
              style={styles.linkButton}
              onPress={() => {
                trackAction('view_eligible_questions', 'QuestDetailScreen', { questId });
              }}
            >
              <T style={styles.linkButtonText}>View eligible questions</T>
              <Icon name="arrow-forward" size={16} color={FRAMER_COLORS.primary} />
            </Pressable>
          </Animated.View>

          {/* Related Content Card */}
          <Animated.View entering={FadeInUp.delay(500).springify().stiffness(120).damping(15)} style={styles.card}>
            <T style={styles.cardTitle}>Do one of these next</T>
            <View style={styles.relatedList}>
              <RelatedCard
                icon="auto-awesome"
                title="Practice with AI"
                subtitle="AI-powered study session"
                onPress={() => {
                  trackAction('open_ai_practice', 'QuestDetailScreen');
                  navigation.navigate('NewEnhancedAIStudy');
                }}
              />
              <RelatedCard
                icon="assignment"
                title="Open Assignments"
                subtitle="View pending assignments"
                onPress={() => {
                  trackAction('open_assignments', 'QuestDetailScreen');
                  navigation.navigate('AssignmentsHomeScreen');
                }}
              />
              <RelatedCard
                icon="quiz"
                title="Solve test questions"
                subtitle="Practice with sample tests"
                onPress={() => {
                  trackAction('open_test_center', 'QuestDetailScreen');
                  navigation.navigate('TestCenterScreen');
                }}
              />
            </View>
          </Animated.View>

          {/* Rewards Card - Only if Completed */}
          {quest.status === 'completed' && (
            <Animated.View entering={FadeInUp.delay(600).springify().stiffness(120).damping(15)} style={styles.rewardsCard}>
              <View style={styles.rewardsHeader}>
                <Icon name="emoji-events" size={32} color={FRAMER_COLORS.warning} />
                <T style={styles.rewardsTitle}>Rewards unlocked</T>
              </View>
              <View style={styles.rewardItem}>
                <Icon name="star" size={24} color={FRAMER_COLORS.warning} />
                <T style={styles.rewardText}>+{quest.rewardXp} XP</T>
              </View>
              <View style={styles.stampBadge}>
                <T style={styles.stampText}>✓ Daily quest completed!</T>
              </View>
              <Pressable
                style={styles.claimButton}
                onPress={() => {
                  trackAction('claim_reward', 'QuestDetailScreen', { questId, xp: quest.rewardXp });
                }}
              >
                <T style={styles.claimButtonText}>Claim reward</T>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA Button */}
      <Animated.View entering={FadeInUp.delay(700).springify().stiffness(120).damping(15)} style={styles.bottomBar}>
        <View style={styles.ctaContent}>
          <T style={styles.ctaSubtitle}>{cta.subtitle}</T>
          <Pressable
            style={[styles.ctaButton, cta.disabled && styles.ctaButtonDisabled]}
            onPress={() => {
              if (!cta.disabled) {
                trackAction('quest_cta', 'QuestDetailScreen', { questId, status: quest.status });
              }
            }}
            disabled={cta.disabled}
          >
            <T style={styles.ctaButtonText}>{cta.label}</T>
            {!cta.disabled && <Icon name="arrow-forward" size={20} color="#FFFFFF" />}
            {cta.disabled && <Icon name="lock" size={20} color="#FFFFFF" />}
          </Pressable>
        </View>
      </Animated.View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  // Hero Card
  heroCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: `${FRAMER_COLORS.warning}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroChips: {
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Card Base
  card: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  // Description
  descriptionText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitRow: {
    gap: 10,
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 20,
  },
  // Progress
  progressHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressNumbers: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: FRAMER_COLORS.chipBg,
    borderRadius: 8,
  },
  timeChipText: {
    fontSize: 11,
    color: FRAMER_COLORS.textSecondary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: FRAMER_COLORS.progressBg,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: FRAMER_COLORS.progressFill,
    borderRadius: 5,
  },
  progressSubtext: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
  },
  // Steps
  stepsList: {
    gap: 12,
    marginBottom: 16,
  },
  stepRow: {
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: FRAMER_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  // Related Content
  relatedList: {
    gap: 12,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: FRAMER_COLORS.background,
    borderRadius: 12,
  },
  relatedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${FRAMER_COLORS.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 2,
  },
  relatedSubtitle: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
  },
  relatedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: FRAMER_COLORS.primary,
    borderRadius: 8,
  },
  relatedButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Rewards Card
  rewardsCard: {
    backgroundColor: FRAMER_COLORS.completedBadgeBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: FRAMER_COLORS.success,
  },
  rewardsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginTop: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.warning,
  },
  stampBadge: {
    backgroundColor: FRAMER_COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  stampText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimButton: {
    backgroundColor: FRAMER_COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: FRAMER_COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaContent: {
    gap: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FRAMER_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonDisabled: {
    backgroundColor: FRAMER_COLORS.locked,
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
