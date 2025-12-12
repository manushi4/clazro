import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
  category: 'learning' | 'community' | 'achievement' | 'social' | 'system';
  metadata?: {
    questionId?: string;
    badgeId?: string;
    sessionId?: string;
    streak?: number;
    difficulty?: string;
  };
}

export interface PointsGoal {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  currentPoints: number;
  deadline?: Date;
  category: string;
  isActive: boolean;
  reward?: {
    type: 'badge' | 'privilege' | 'cosmetic';
    name: string;
    description: string;
  };
}

export interface PointsStats {
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  averageDaily: number;
  streak: number;
  bestStreak: number;
  rank: number;
  percentile: number;
  breakdown: {
    learning: number;
    community: number;
    achievement: number;
    social: number;
    system: number;
  };
}

interface PointsTrackerProps {
  currentPoints: number;
  transactions: PointsTransaction[];
  goals?: PointsGoal[];
  stats?: PointsStats;
  onPointsBreakdown?: () => void;
  onGoalCreate?: (goal: Partial<PointsGoal>) => void;
  showDetailedHistory?: boolean;
}

const MOCK_TRANSACTIONS: PointsTransaction[] = [
  {
    id: 'tx1',
    type: 'earned',
    amount: 15,
    source: 'Question Asked',
    description: 'Asked a well-structured question about calculus integration',
    timestamp: new Date('2024-01-16T14:30:00'),
    category: 'learning',
    metadata: { questionId: 'q123', difficulty: 'intermediate' },
  },
  {
    id: 'tx2',
    type: 'earned',
    amount: 25,
    source: 'Helpful Answer',
    description: 'Answer marked as helpful by community',
    timestamp: new Date('2024-01-16T10:15:00'),
    category: 'community',
    metadata: { questionId: 'q456' },
  },
  {
    id: 'tx3',
    type: 'bonus',
    amount: 50,
    source: 'Badge Unlocked',
    description: 'Earned "Week Warrior" badge for 7-day streak',
    timestamp: new Date('2024-01-15T09:00:00'),
    category: 'achievement',
    metadata: { badgeId: 'week_warrior', streak: 7 },
  },
  {
    id: 'tx4',
    type: 'earned',
    amount: 10,
    source: 'Daily Login',
    description: 'Daily login bonus',
    timestamp: new Date('2024-01-16T08:00:00'),
    category: 'system',
  },
  {
    id: 'tx5',
    type: 'earned',
    amount: 30,
    source: 'Study Session',
    description: 'Completed 60-minute focused study session',
    timestamp: new Date('2024-01-15T16:45:00'),
    category: 'learning',
    metadata: { sessionId: 'session123' },
  },
  {
    id: 'tx6',
    type: 'spent',
    amount: -20,
    source: 'Avatar Customization',
    description: 'Purchased new avatar background',
    timestamp: new Date('2024-01-14T19:30:00'),
    category: 'system',
  },
];

const MOCK_GOALS: PointsGoal[] = [
  {
    id: 'goal1',
    title: 'Weekly Learning Target',
    description: 'Earn 500 points this week through learning activities',
    targetPoints: 500,
    currentPoints: 320,
    deadline: new Date('2024-01-21T23:59:59'),
    category: 'learning',
    isActive: true,
    reward: {
      type: 'badge',
      name: 'Dedicated Learner',
      description: 'Special badge for consistent weekly learning',
    },
  },
  {
    id: 'goal2',
    title: 'Community Helper',
    description: 'Help others by earning 200 community points this month',
    targetPoints: 200,
    currentPoints: 85,
    deadline: new Date('2024-01-31T23:59:59'),
    category: 'community',
    isActive: true,
    reward: {
      type: 'privilege',
      name: 'Expert Flair',
      description: 'Special flair showing your helpful contributions',
    },
  },
  {
    id: 'goal3',
    title: 'Achievement Hunter',
    description: 'Unlock 5 new badges this month',
    targetPoints: 1000,
    currentPoints: 600,
    category: 'achievement',
    isActive: true,
    reward: {
      type: 'cosmetic',
      name: 'Golden Theme',
      description: 'Exclusive golden app theme',
    },
  },
];

const MOCK_STATS: PointsStats = {
  totalPoints: 15890,
  todayPoints: 75,
  weekPoints: 420,
  monthPoints: 1240,
  averageDaily: 45,
  streak: 7,
  bestStreak: 23,
  rank: 47,
  percentile: 85,
  breakdown: {
    learning: 8500,
    community: 3200,
    achievement: 2800,
    social: 980,
    system: 410,
  },
};

export default function PointsTracker({
  currentPoints = 15890,
  transactions = MOCK_TRANSACTIONS,
  goals = MOCK_GOALS,
  stats = MOCK_STATS,
  onPointsBreakdown,
  onGoalCreate,
  showDetailedHistory = true,
}: PointsTrackerProps) {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedPeriod) {
      case 'today':
        filtered = filtered.filter(tx => tx.timestamp >= today);
        break;
      case 'week':
        filtered = filtered.filter(tx => tx.timestamp >= weekStart);
        break;
      case 'month':
        filtered = filtered.filter(tx => tx.timestamp >= monthStart);
        break;
      // 'all' shows everything
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === selectedCategory);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [transactions, selectedPeriod, selectedCategory]);

  const getPointsForPeriod = (period: string) => {
    switch (period) {
      case 'today': return stats.todayPoints;
      case 'week': return stats.weekPoints;
      case 'month': return stats.monthPoints;
      default: return stats.totalPoints;
    }
  };

  const getTransactionIcon = (type: string, category: string) => {
    if (type === 'earned') {
      switch (category) {
        case 'learning': return '📚';
        case 'community': return '🤝';
        case 'achievement': return '🏆';
        case 'social': return '👥';
        case 'system': return '⚙️';
        default: return '💰';
      }
    } else if (type === 'spent') {
      return '💸';
    } else if (type === 'bonus') {
      return '✨';
    } else if (type === 'penalty') {
      return '⚠️';
    }
    return '💰';
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned': return '#4CAF50';
      case 'bonus': return '#FF9800';
      case 'spent': return '#F44336';
      case 'penalty': return '#E91E63';
      default: return theme.OnSurface;
    }
  };

  const renderStatsOverview = () => (
    <View style={[styles.statsContainer, { backgroundColor: theme.Surface }]}>
      <View style={styles.mainPointsSection}>
        <Text style={[styles.currentPoints, { color: theme.primary }]}>
          {currentPoints.toLocaleString()}
        </Text>
        <Text style={[styles.pointsLabel, { color: theme.OnSurfaceVariant }]}>
          Total Points
        </Text>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            +{stats.todayPoints}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Today
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            #{stats.rank}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Rank
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
            {stats.streak}
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Streak
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>
            {stats.percentile}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Percentile
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.breakdownButton, { backgroundColor: theme.primaryContainer }]}
        onPress={onPointsBreakdown}
        accessibilityRole="button"
        accessibilityLabel="View detailed points breakdown"
      >
        <Text style={[styles.breakdownButtonText, { color: theme.OnPrimaryContainer }]}>
          📊 View Breakdown
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGoals = () => (
    <View style={[styles.goalsContainer, { backgroundColor: theme.Surface }]}>
      <View style={styles.goalsHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Active Goals
        </Text>
        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => onGoalCreate?.({})}
          accessibilityRole="button"
          accessibilityLabel="Create new goal"
        >
          <Text style={[styles.createGoalText, { color: theme.primary }]}>
            + New Goal
          </Text>
        </TouchableOpacity>
      </View>

      {goals.filter(g => g.isActive).map(goal => {
        const progress = goal.currentPoints / goal.targetPoints;
        const isCompleted = progress >= 1;
        
        return (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalTitle, { color: theme.OnSurface }]}>
                {goal.title}
              </Text>
              <Text
                style={[
                  styles.goalProgress,
                  { color: isCompleted ? '#4CAF50' : theme.primary }
                ]}
              >
                {goal.currentPoints} / {goal.targetPoints}
              </Text>
            </View>

            <Text style={[styles.goalDescription, { color: theme.OnSurfaceVariant }]}>
              {goal.description}
            </Text>

            <View style={styles.goalProgressContainer}>
              <View style={[styles.goalProgressBar, { backgroundColor: theme.SurfaceVariant }]}>
                <Animated.View
                  style={[
                    styles.goalProgressFill,
                    {
                      backgroundColor: isCompleted ? '#4CAF50' : theme.primary,
                      width: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${Math.min(progress * 100, 100)}%`],
                      }),
                    }
                  ]}
                />
              </View>
              <Text style={[styles.goalPercentage, { color: theme.OnSurfaceVariant }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>

            {goal.deadline && (
              <Text style={[styles.goalDeadline, { color: theme.OnSurfaceVariant }]}>
                Due: {goal.deadline.toLocaleDateString()}
              </Text>
            )}

            {goal.reward && (
              <View style={styles.goalReward}>
                <Text style={[styles.rewardLabel, { color: theme.OnSurfaceVariant }]}>
                  Reward:
                </Text>
                <Text style={[styles.rewardName, { color: theme.primary }]}>
                  {goal.reward.name}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.Surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Period:
          </Text>
          {['today', 'week', 'month', 'all'].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedPeriod === period 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setSelectedPeriod(period as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedPeriod === period 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Category:
          </Text>
          {['all', 'learning', 'community', 'achievement', 'social'].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedCategory === category 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedCategory === category 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.periodSummary}>
        <Text style={[styles.periodSummaryText, { color: theme.OnSurface }]}>
          {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Total: 
        </Text>
        <Text style={[styles.periodSummaryPoints, { color: theme.primary }]}>
          {getPointsForPeriod(selectedPeriod).toLocaleString()} points
        </Text>
      </View>
    </View>
  );

  const renderTransaction = ({ item: transaction }: { item: PointsTransaction }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionIcon}>
            {getTransactionIcon(transaction.type, transaction.category)}
          </Text>
          <View style={styles.transactionDetails}>
            <Text style={[styles.transactionSource, { color: theme.OnSurface }]}>
              {transaction.source}
            </Text>
            <Text style={[styles.transactionDescription, { color: theme.OnSurfaceVariant }]}>
              {transaction.description}
            </Text>
          </View>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amountText,
              { color: getTransactionColor(transaction.type) }
            ]}
          >
            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
          </Text>
          <Text style={[styles.amountLabel, { color: theme.OnSurfaceVariant }]}>
            pts
          </Text>
        </View>
      </View>

      <View style={styles.transactionFooter}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: theme.primaryContainer }
          ]}
        >
          <Text style={[styles.categoryText, { color: theme.OnPrimaryContainer }]}>
            {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
          </Text>
        </View>

        <Text style={[styles.transactionTime, { color: theme.OnSurfaceVariant }]}>
          {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
        </Text>
      </View>

      {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
        <View style={styles.metadataContainer}>
          {transaction.metadata.difficulty && (
            <Text style={[styles.metadataText, { color: theme.OnSurfaceVariant }]}>
              Difficulty: {transaction.metadata.difficulty}
            </Text>
          )}
          {transaction.metadata.streak && (
            <Text style={[styles.metadataText, { color: theme.OnSurfaceVariant }]}>
              Streak: {transaction.metadata.streak} days
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
          Points Tracker
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Monitor your learning progress and achievements
        </Text>
      </View>

      {renderStatsOverview()}
      {renderGoals()}
      {renderFilters()}

      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: theme.OnSurface }]}>
          Transaction History
        </Text>
        
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
                No transactions found for the selected period
              </Text>
            </View>
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
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
  statsContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainPointsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPoints: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  breakdownButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  breakdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createGoalButton: {
    padding: 8,
  },
  createGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalCard: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 18,
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalPercentage: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  goalDeadline: {
    fontSize: 12,
    marginBottom: 4,
  },
  goalReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  periodSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  periodSummaryPoints: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionSource: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountLabel: {
    fontSize: 12,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionTime: {
    fontSize: 12,
  },
  metadataContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metadataText: {
    fontSize: 12,
    marginBottom: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});