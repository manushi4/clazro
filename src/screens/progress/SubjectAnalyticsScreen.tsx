/**
 * SubjectAnalyticsScreen - Subject-Specific Analytics (Fixed Screen)
 * 
 * Deep dive into performance for a specific subject.
 * Uses theme, branding, and i18n throughout.
 * Works offline with cached data.
 * 
 * Per STUDENT_COMPLETE_SPEC.md - This is a detail/child screen under Progress tab.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNetworkStatus } from '../../offline/networkStore';
import { useSubjectAnalyticsQuery } from '../../hooks/queries/useSubjectAnalyticsQuery';
import { AppText } from '../../ui/components/AppText';
import { AppCard } from '../../ui/components/AppCard';
import { OfflineBanner } from '../../offline/OfflineBanner';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = '1W' | '1M' | '3M' | '6M';

// Subject Header Component
const SubjectHeader: React.FC<{
  subject: {
    name: string;
    code: string;
    color: string;
    icon: string;
    mastery: number;
    totalChapters: number;
  };
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ subject, colors }) => (
  <View style={styles.subjectHeader}>
    <View style={[styles.subjectIconLarge, { backgroundColor: `${subject.color}20` }]}>
      <Icon name={subject.icon || 'book-outline'} size={32} color={subject.color} />
    </View>
    <View style={styles.subjectInfo}>
      <AppText style={[styles.subjectName, { color: colors.onSurface }]}>
        {subject.name}
      </AppText>
      <AppText style={[styles.subjectCode, { color: colors.onSurfaceVariant }]}>
        {subject.code} • {subject.totalChapters} Chapters
      </AppText>
    </View>
    <View style={styles.masteryBadge}>
      <AppText style={[styles.masteryPercentage, { color: subject.color }]}>
        {subject.mastery}%
      </AppText>
      <AppText style={[styles.masteryLabel, { color: colors.onSurfaceVariant }]}>
        Mastery
      </AppText>
    </View>
  </View>
);


// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: string;
  trendPositive?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ title, value, subtitle, icon, color, trend, trendPositive = true, colors }) => (
  <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
    <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <View style={styles.metricContent}>
      <AppText style={[styles.metricValue, { color: colors.onSurface }]}>{value}</AppText>
      <AppText style={[styles.metricTitle, { color: colors.onSurfaceVariant }]}>{title}</AppText>
      {subtitle && (
        <AppText style={[styles.metricSubtitle, { color: colors.onSurfaceVariant }]}>
          {subtitle}
        </AppText>
      )}
    </View>
    {trend && (
      <View style={styles.trendContainer}>
        <Icon 
          name={trendPositive ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={trendPositive ? colors.success : colors.error} 
        />
        <AppText style={[styles.trendText, { color: trendPositive ? colors.success : colors.error }]}>
          {trend}
        </AppText>
      </View>
    )}
  </View>
);

// Time Range Selector Component
const TimeRangeSelector: React.FC<{
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ selected, onSelect, colors }) => {
  const ranges: { key: TimeRange; label: string }[] = [
    { key: '1W', label: '1W' },
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: '6M', label: '6M' },
  ];

  return (
    <View style={styles.timeRangeContainer}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.timeRangeChip,
            {
              backgroundColor: selected === range.key ? colors.primary : colors.surfaceVariant,
            },
          ]}
          onPress={() => onSelect(range.key)}
          activeOpacity={0.7}
        >
          <AppText
            style={[
              styles.timeRangeText,
              { color: selected === range.key ? colors.onPrimary : colors.onSurfaceVariant },
            ]}
          >
            {range.label}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Progress Bar Component
const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ percentage, color, colors }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
      <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// Topic Row Component
const TopicRow: React.FC<{
  topic: {
    id: string;
    name: string;
    mastery: number;
  };
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}> = ({ topic, colors, onPress }) => {
  const getMasteryColor = (percent: number) => {
    if (percent >= 80) return colors.success;
    if (percent >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <TouchableOpacity
      style={[styles.topicRow, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topicInfo}>
        <AppText style={[styles.topicName, { color: colors.onSurface }]} numberOfLines={1}>
          {topic.name}
        </AppText>
        <ProgressBar percentage={topic.mastery} color={getMasteryColor(topic.mastery)} colors={colors} />
      </View>
      <View style={styles.topicMastery}>
        <AppText style={[styles.topicPercentage, { color: getMasteryColor(topic.mastery) }]}>
          {topic.mastery}%
        </AppText>
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
};

// Test Item Component
const TestItem: React.FC<{
  test: {
    id: string;
    title: string;
    score: number;
    totalMarks: number;
    dateLabel: string;
  };
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}> = ({ test, colors, onPress }) => {
  const percentage = Math.round((test.score / test.totalMarks) * 100);
  const getScoreColor = (percent: number) => {
    if (percent >= 80) return colors.success;
    if (percent >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <TouchableOpacity
      style={[styles.testItem, { borderBottomColor: colors.surfaceVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.testInfo}>
        <AppText style={[styles.testTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {test.title}
        </AppText>
        <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>
          {test.dateLabel}
        </AppText>
      </View>
      <View style={styles.testScore}>
        <AppText style={[styles.testScoreText, { color: getScoreColor(percentage) }]}>
          {percentage}%
        </AppText>
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
};


export const SubjectAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation('progress');
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = useNavigation();
  const route = useRoute();

  // Get subjectId from route params
  const { subjectId } = (route.params as { subjectId?: string }) || {};
  const effectiveSubjectId = subjectId || 'math-001';

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  // Fetch subject analytics data
  const { data: subjectData, isLoading, error, refetch, isRefetching } = useSubjectAnalyticsQuery(effectiveSubjectId);

  // Track screen view
  React.useEffect(() => {
    trackScreenView('subject-analytics', { subjectId: effectiveSubjectId });
  }, [trackScreenView, effectiveSubjectId]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    trackEvent('analytics_time_range_change', 'interaction', { range, subjectId: effectiveSubjectId });
    setTimeRange(range);
  }, [trackEvent, effectiveSubjectId]);

  // Handle topic press
  const handleTopicPress = useCallback((topicId: string) => {
    trackEvent('analytics_topic_press', 'navigation', { topicId, subjectId: effectiveSubjectId });
    // Navigate to topic detail or practice
  }, [trackEvent, effectiveSubjectId]);

  // Handle test press
  const handleTestPress = useCallback((testId: string) => {
    trackEvent('analytics_test_press', 'navigation', { testId, subjectId: effectiveSubjectId });
    (navigation as any).navigate('test-review', { testId });
  }, [navigation, trackEvent, effectiveSubjectId]);

  // Handle practice with AI
  const handlePracticeWithAI = useCallback(() => {
    trackEvent('analytics_practice_ai', 'navigation', { subjectId: effectiveSubjectId });
    const aiTutorName = branding?.aiTutorName || 'AI Tutor';
    // Navigate to AI tutor with subject context
    (navigation as any).navigate('ai-tutor', { subjectId: effectiveSubjectId });
  }, [navigation, trackEvent, effectiveSubjectId, branding]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    trackEvent('subject_analytics_refresh', 'interaction', { subjectId: effectiveSubjectId });
    refetch();
  }, [refetch, trackEvent, effectiveSubjectId]);

  // Get weak topics
  const weakTopics = useMemo(() => {
    if (!subjectData?.topics) return [];
    return subjectData.topics.filter(t => t.mastery < 70);
  }, [subjectData]);

  // Loading state
  if (isLoading && !subjectData) {
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
  if (error && !subjectData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.onSurface }]}>
            {t('errors.loadFailed', { defaultValue: 'Failed to load subject analytics' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
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
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Subject Header */}
        {subjectData?.subject && (
          <SubjectHeader subject={subjectData.subject} colors={colors} />
        )}

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title={t('subjectAnalytics.averageScore', { defaultValue: 'Avg Score' })}
            value={`${subjectData?.averageScore || 0}%`}
            icon="chart-line"
            color={colors.success}
            trend={subjectData?.scoreTrend ? `${subjectData.scoreTrend > 0 ? '+' : ''}${subjectData.scoreTrend}%` : undefined}
            trendPositive={(subjectData?.scoreTrend || 0) >= 0}
            colors={colors}
          />
          <MetricCard
            title={t('subjectAnalytics.testsCompleted', { defaultValue: 'Tests' })}
            value={String(subjectData?.testsCompleted || 0)}
            subtitle={t('subjectAnalytics.thisMonth', { defaultValue: 'This month' })}
            icon="file-document-edit-outline"
            color={colors.primary}
            colors={colors}
          />
          <MetricCard
            title={t('subjectAnalytics.studyTime', { defaultValue: 'Study Time' })}
            value={`${subjectData?.studyTimeHours || 0}h`}
            subtitle={t('subjectAnalytics.thisWeek', { defaultValue: 'This week' })}
            icon="clock-outline"
            color={colors.warning}
            colors={colors}
          />
          <MetricCard
            title={t('subjectAnalytics.doubtsResolved', { defaultValue: 'Doubts' })}
            value={String(subjectData?.doubtsResolved || 0)}
            subtitle={t('subjectAnalytics.resolved', { defaultValue: 'Resolved' })}
            icon="help-circle-outline"
            color={colors.error}
            colors={colors}
          />
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('subjectAnalytics.performanceTrend', { defaultValue: 'Performance Trend' })}
          </AppText>
          <TimeRangeSelector
            selected={timeRange}
            onSelect={handleTimeRangeChange}
            colors={colors}
          />
        </View>

        {/* Performance Chart Placeholder */}
        <AppCard style={styles.card}>
          <View style={[styles.chartPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="chart-areaspline" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.chartPlaceholderText, { color: colors.onSurfaceVariant }]}>
              {t('subjectAnalytics.chartComingSoon', { defaultValue: 'Performance chart coming soon' })}
            </AppText>
          </View>
        </AppCard>

        {/* Topic Breakdown */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('subjectAnalytics.topicBreakdown', { defaultValue: 'Topic Breakdown' })}
          </AppText>
          <View style={styles.topicsContainer}>
            {subjectData?.topics?.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                colors={colors}
                onPress={() => handleTopicPress(topic.id)}
              />
            ))}
            {(!subjectData?.topics || subjectData.topics.length === 0) && (
              <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('subjectAnalytics.noTopics', { defaultValue: 'No topics available' })}
              </AppText>
            )}
          </View>
        </AppCard>

        {/* Recent Tests */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('subjectAnalytics.recentTests', { defaultValue: 'Recent Tests' })}
          </AppText>
          <View style={styles.testsContainer}>
            {subjectData?.recentTests?.map((test) => (
              <TestItem
                key={test.id}
                test={test}
                colors={colors}
                onPress={() => handleTestPress(test.id)}
              />
            ))}
            {(!subjectData?.recentTests || subjectData.recentTests.length === 0) && (
              <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('subjectAnalytics.noTests', { defaultValue: 'No tests yet' })}
              </AppText>
            )}
          </View>
        </AppCard>

        {/* Practice Section */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('subjectAnalytics.practiceSection', { defaultValue: 'Practice & Improve' })}
          </AppText>
          
          <View style={styles.practiceStats}>
            <View style={styles.practiceStatRow}>
              <Icon name="help-circle-outline" size={20} color={colors.primary} />
              <AppText style={[styles.practiceStatText, { color: colors.onSurface }]}>
                {t('subjectAnalytics.doubtsResolvedCount', { 
                  defaultValue: 'Doubts resolved: {{count}}',
                  count: subjectData?.doubtsResolved || 0
                })}
              </AppText>
            </View>
            <View style={styles.practiceStatRow}>
              <Icon name="brain" size={20} color={colors.primary} />
              <AppText style={[styles.practiceStatText, { color: colors.onSurface }]}>
                {t('subjectAnalytics.practiceSessionsCount', { 
                  defaultValue: 'Practice sessions: {{count}}',
                  count: subjectData?.practiceSessions || 0
                })}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.practiceButton,
              { 
                backgroundColor: weakTopics.length > 0 ? colors.primary : colors.surfaceVariant,
              }
            ]}
            onPress={handlePracticeWithAI}
            activeOpacity={0.7}
            disabled={weakTopics.length === 0}
          >
            <Icon 
              name="robot" 
              size={20} 
              color={weakTopics.length > 0 ? colors.onPrimary : colors.onSurfaceVariant} 
            />
            <AppText style={[
              styles.practiceButtonText, 
              { color: weakTopics.length > 0 ? colors.onPrimary : colors.onSurfaceVariant }
            ]}>
              {weakTopics.length > 0 
                ? t('subjectAnalytics.practiceWeakTopics', { 
                    defaultValue: 'Practice weak topics with {{aiName}}',
                    aiName: branding?.aiTutorName || 'AI Tutor'
                  })
                : t('subjectAnalytics.allTopicsMastered', { defaultValue: 'All topics mastered!' })
              }
            </AppText>
          </TouchableOpacity>
        </AppCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};


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
  // Subject Header
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  subjectIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
  },
  masteryBadge: {
    alignItems: 'center',
  },
  masteryPercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  masteryLabel: {
    fontSize: 12,
    marginTop: 2,
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
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
  },
  metricSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Time Range
  timeRangeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  timeRangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Chart Placeholder
  chartPlaceholder: {
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
  },
  // Progress Bar
  progressBarContainer: {
    flex: 1,
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Topics
  topicsContainer: {
    gap: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicMastery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Tests
  testsContainer: {
    gap: 0,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  testDate: {
    fontSize: 12,
  },
  testScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testScoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Practice Section
  practiceStats: {
    marginBottom: 16,
    gap: 12,
  },
  practiceStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  practiceStatText: {
    fontSize: 14,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  practiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty State
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default SubjectAnalyticsScreen;
