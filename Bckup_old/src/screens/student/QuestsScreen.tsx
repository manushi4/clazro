/**
 * QuestsScreen - Daily / Weekly Challenges
 * Purpose: Gamified quests that reward XP for good study habits
 * Design: Complete Framer design with filters and progress tracking
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type QuestType = 'daily' | 'weekly';
type QuestStatus = 'active' | 'completed' | 'locked';
type FilterType = 'all' | 'daily' | 'weekly';
type StatusFilter = 'all' | 'active' | 'completed';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  reward: number; // XP
  progress: number;
  target: number;
}

interface Props {
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
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  locked: '#9CA3AF',
  progressBg: '#E5E7EB',
  progressFill: '#2D5BFF',
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

const STATUS_LABELS: Record<QuestStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  locked: 'Locked',
};

// Filter Chip Component
const FilterChip = ({ label, active, onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Filter ${label}`}
  >
    <T style={StyleSheet.flatten([styles.filterChipText, active && styles.filterChipTextActive])}>
      {label}
    </T>
  </Pressable>
);

// Progress Bar Component
const ProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

// Quest Card Component
const QuestCard = ({ quest, index, navigation }: { quest: Quest; index: number; navigation: any }) => {
  const getStatusBadgeStyle = () => {
    switch (quest.status) {
      case 'active':
        return { backgroundColor: FRAMER_COLORS.activeBadgeBg, color: FRAMER_COLORS.activeBadgeText };
      case 'completed':
        return { backgroundColor: FRAMER_COLORS.completedBadgeBg, color: FRAMER_COLORS.completedBadgeText };
      case 'locked':
        return { backgroundColor: FRAMER_COLORS.lockedBadgeBg, color: FRAMER_COLORS.lockedBadgeText };
    }
  };

  const getButtonLabel = () => {
    switch (quest.status) {
      case 'active':
        return 'Continue';
      case 'completed':
        return 'Completed';
      case 'locked':
        return 'Locked';
    }
  };

  const getButtonStyle = () => {
    switch (quest.status) {
      case 'active':
        return { backgroundColor: FRAMER_COLORS.primary };
      case 'completed':
        return { backgroundColor: FRAMER_COLORS.success, opacity: 0.6 };
      case 'locked':
        return { backgroundColor: FRAMER_COLORS.locked, opacity: 0.6 };
    }
  };

  const statusBadgeStyle = getStatusBadgeStyle();

  return (
    <Pressable
      onPress={() => {
        trackAction('open_quest_detail', 'QuestsScreen', { questId: quest.id });
        navigation.navigate('QuestDetailScreen', { questId: quest.id });
      }}
    >
      <Animated.View
        entering={FadeInUp.delay(index * 80).springify().stiffness(120).damping(15)}
        style={styles.questCard}
      >
      {/* Header */}
      <View style={styles.questHeader}>
        <T style={styles.questTitle}>{quest.title}</T>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeStyle.backgroundColor }]}>
          <T style={StyleSheet.flatten([styles.statusBadgeText, { color: statusBadgeStyle.color }])}>
            {STATUS_LABELS[quest.status]}
          </T>
        </View>
      </View>

      {/* Description */}
      <T style={styles.questDescription}>{quest.description}</T>

      {/* Type & Reward */}
      <Row style={styles.questMeta}>
        <Icon name="star" size={16} color={FRAMER_COLORS.warning} />
        <T style={styles.questMetaText}>
          {TYPE_LABELS[quest.type]} • Reward: +{quest.reward} XP
        </T>
      </Row>

      {/* Progress */}
      <View style={styles.questProgress}>
        <Row style={styles.progressHeader}>
          <T style={styles.progressText}>
            Progress: {quest.progress} / {quest.target}
          </T>
        </Row>
        <ProgressBar current={quest.progress} target={quest.target} />
      </View>

      {/* Action Button */}
      <Pressable
        style={[styles.questButton, getButtonStyle()]}
        onPress={() => {
          if (quest.status === 'active') {
            trackAction('continue_quest', 'QuestsScreen', { questId: quest.id });
          }
        }}
        disabled={quest.status !== 'active'}
        accessibilityRole="button"
        accessibilityLabel={getButtonLabel()}
      >
        <T style={styles.questButtonText}>{getButtonLabel()}</T>
        {quest.status === 'active' && <Icon name="arrow-forward" size={20} color="#FFFFFF" />}
        {quest.status === 'completed' && <Icon name="check" size={20} color="#FFFFFF" />}
        {quest.status === 'locked' && <Icon name="lock" size={20} color="#FFFFFF" />}
      </Pressable>
    </Animated.View>
    </Pressable>
  );
};

// Empty State Component
const EmptyState = ({ filter }: { filter: string }) => (
  <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.emptyState}>
    <Icon name="assignment-late" size={64} color={FRAMER_COLORS.textTertiary} />
    <T style={styles.emptyTitle}>No quests in this category right now.</T>
    <T style={styles.emptySubtitle}>Try switching to a different filter to see more quests.</T>
  </Animated.View>
);

export default function QuestsScreen({ navigation }: Props) {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    trackScreenView('QuestsScreen');
  }, []);

  // Fetch quests
  const { data: quests, isLoading, error } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      // TODO: Replace with real Supabase query
      const mockQuests: Quest[] = [
        {
          id: '1',
          title: 'Solve 3 Math problems',
          description: 'Pick any 3 Math questions and solve them today.',
          type: 'daily',
          status: 'active',
          reward: 20,
          progress: 2,
          target: 3,
        },
        {
          id: '2',
          title: 'Complete 5 Physics chapters',
          description: 'Study and complete 5 chapters from your Physics textbook this week.',
          type: 'weekly',
          status: 'active',
          reward: 100,
          progress: 2,
          target: 5,
        },
        {
          id: '3',
          title: 'Study for 30 minutes',
          description: 'Spend at least 30 minutes studying any subject today.',
          type: 'daily',
          status: 'completed',
          reward: 15,
          progress: 30,
          target: 30,
        },
        {
          id: '4',
          title: 'Solve 10 Chemistry problems',
          description: 'Practice makes perfect! Solve 10 Chemistry problems this week.',
          type: 'weekly',
          status: 'active',
          reward: 80,
          progress: 6,
          target: 10,
        },
        {
          id: '5',
          title: 'Review weak topics',
          description: 'Spend time reviewing topics you struggled with.',
          type: 'daily',
          status: 'locked',
          reward: 25,
          progress: 0,
          target: 1,
        },
      ];
      return mockQuests;
    },
  });

  // Filter quests
  const filteredQuests = React.useMemo(() => {
    if (!quests) return [];
    let filtered = quests;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    return filtered;
  }, [quests, typeFilter, statusFilter]);

  if (!quests) {
    return (
      <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
        <View />
      </BaseScreen>
    );
  }

  return (
    <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
      <View style={styles.container}>
        {/* Hero / Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
          <T style={styles.heroTitle}>Quests</T>
          <T style={styles.heroSubtitle}>Daily and weekly challenges.</T>
        </Animated.View>

        {/* Type Filter Tabs */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.filterSection}>
          <Row style={styles.filterRow}>
            {(['all', 'daily', 'weekly'] as FilterType[]).map((filter) => (
              <FilterChip
                key={filter}
                label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                active={typeFilter === filter}
                onPress={() => {
                  trackAction('change_type_filter', 'QuestsScreen', { filter });
                  setTypeFilter(filter);
                }}
              />
            ))}
          </Row>
        </Animated.View>

        {/* Status Filter Tabs */}
        <Animated.View entering={FadeInUp.delay(150).springify().stiffness(120).damping(15)} style={styles.filterSection}>
          <Row style={styles.filterRow}>
            {(['all', 'active', 'completed'] as StatusFilter[]).map((filter) => (
              <FilterChip
                key={filter}
                label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                active={statusFilter === filter}
                onPress={() => {
                  trackAction('change_status_filter', 'QuestsScreen', { filter });
                  setStatusFilter(filter);
                }}
              />
            ))}
          </Row>
        </Animated.View>

        {/* Quest List or Empty State */}
        {filteredQuests.length > 0 ? (
          <FlatList
            data={filteredQuests}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <QuestCard quest={item} index={index} navigation={navigation} />}
            contentContainerStyle={styles.questList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState filter={typeFilter} />
        )}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Hero
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 24,
  },
  // Filters
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: FRAMER_COLORS.chipBg,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  filterChipTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  // Quest List
  questList: {
    paddingBottom: 40,
    gap: 16,
  },
  // Quest Card
  questCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  questDescription: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  questMeta: {
    gap: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  questMetaText: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
  },
  questProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: FRAMER_COLORS.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: FRAMER_COLORS.progressFill,
    borderRadius: 4,
  },
  questButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  questButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
