import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBatchPerformanceQuery } from '../../../../hooks/queries/admin/useBatchPerformanceQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'admin.batch-performance';

// Get rank badge emoji
const getRankBadge = (rank: number): string => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
  }
};

// Get performance color based on score
const getPerformanceColor = (
  score: number,
  colors: { success: string; warning: string; error: string },
  thresholds: { excellent: number; good: number }
): string => {
  if (score >= thresholds.excellent) return colors.success;
  if (score >= thresholds.good) return colors.warning;
  return colors.error;
};

export const BatchPerformanceWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const topN = (config?.topN as number) || 5;
  const showTrend = config?.showTrend !== false;
  const showStudentCount = config?.showStudentCount !== false;
  const showOverallAvg = config?.showOverallAvg !== false;
  const showRankBadges = config?.showRankBadges !== false;
  const colorCodePerformance = config?.colorCodePerformance !== false;
  const performanceThresholds = {
    excellent: (config?.excellentThreshold as number) || 85,
    good: (config?.goodThreshold as number) || 70,
  };

  const { data, isLoading, error, refetch } = useBatchPerformanceQuery({ limit: topN });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
    });
  }, []);

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_all`,
      level: 'info',
    });
    // Navigate to batch analytics screen to show all batches with analytics
    onNavigate?.('batch-analytics', {});
  };

  const handleBatchTap = (batchId: string, batchName: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'batch_tap', batchId });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_batch_tap`,
      level: 'info',
      data: { batchId, batchName },
    });
    onNavigate?.('batch-detail', { batchId });
  };

  const handleStudentCountTap = (batchId: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'student_count_tap', batchId });
    // Navigate to batch students screen to show all students in the batch
    onNavigate?.('batch-students', { batchId });
  };

  const handleTopScorerTap = (studentId: string, batchId: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'top_scorer_tap', studentId });
    // Navigate to batch detail with student info since student-detail screen doesn't exist for admin
    onNavigate?.('batch-detail', { batchId, highlightStudent: studentId });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="trophy" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.batchPerformance.title', { defaultValue: 'Batch Performance' })}
            </AppText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.batchPerformance.states.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="trophy" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.batchPerformance.title', { defaultValue: 'Batch Performance' })}
            </AppText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.batchPerformance.states.error', { defaultValue: 'Failed to load data' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => refetch()}
            accessibilityLabel={t('common:actions.retry', { defaultValue: 'Retry' })}
            accessibilityRole="button"
          >
            <AppText style={{ color: colors.primary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data || data.batches.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="trophy" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.batchPerformance.title', { defaultValue: 'Batch Performance' })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="school-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.batchPerformance.states.empty', { defaultValue: 'No batch data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="trophy" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.batchPerformance.title', { defaultValue: 'Batch Performance' })}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleViewAll}
          accessibilityLabel={t('common:actions.viewAll', { defaultValue: 'View All' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.viewAll', { defaultValue: 'View All' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Batch List */}
      <View style={styles.batchList}>
        {data.batches.map((batch, index) => {
          const performanceColor = colorCodePerformance
            ? getPerformanceColor(batch.avgScore, colors, performanceThresholds)
            : colors.primary;
          const isTopThree = batch.rank <= 3;

          return (
            <TouchableOpacity
              key={batch.id}
              style={[
                styles.batchItem,
                { 
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: borderRadius.medium,
                },
                index < data.batches.length - 1 && styles.batchItemMargin,
              ]}
              onPress={() => handleBatchTap(batch.batchId, batch.name)}
              accessibilityLabel={`${batch.name}, ${batch.avgScore}% average, ${batch.studentCount} students`}
            >
              {/* Batch Header Row */}
              <View style={styles.batchHeader}>
                <View style={styles.batchNameRow}>
                  {showRankBadges && isTopThree && (
                    <AppText style={styles.rankBadge}>{getRankBadge(batch.rank)}</AppText>
                  )}
                  {!isTopThree && (
                    <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>
                      {batch.rank}.
                    </AppText>
                  )}
                  <AppText 
                    style={[styles.batchName, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {batch.name}
                  </AppText>
                </View>
              </View>

              {/* Progress Bar Row */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBar, { backgroundColor: colors.outline }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: performanceColor,
                        width: `${Math.min(batch.avgScore, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <AppText style={[styles.avgScore, { color: performanceColor }]}>
                  {batch.avgScore}% {t('widgets.batchPerformance.avg', { defaultValue: 'avg' })}
                </AppText>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                {showStudentCount && (
                  <TouchableOpacity
                    style={styles.statItem}
                    onPress={() => handleStudentCountTap(batch.batchId)}
                    accessibilityLabel={`${batch.studentCount} students`}
                  >
                    <Icon name="account-group" size={14} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                      {batch.studentCount} {t('widgets.batchPerformance.students', { defaultValue: 'students' })}
                    </AppText>
                  </TouchableOpacity>
                )}
                {showTrend && (
                  <View style={styles.trendItem}>
                    <Icon
                      name={batch.trend >= 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={batch.trend >= 0 ? colors.success : colors.error}
                    />
                    <AppText
                      style={[
                        styles.trendText,
                        { color: batch.trend >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {batch.trend >= 0 ? '+' : ''}{batch.trend}% {t('widgets.batchPerformance.vsLastTerm', { defaultValue: 'vs last term' })}
                    </AppText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Overall Average Footer */}
      {showOverallAvg && (
        <View style={[styles.overallSection, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.overallLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.batchPerformance.overallAverage', { defaultValue: 'Overall Average' })}:
          </AppText>
          <View style={styles.overallStats}>
            <AppText style={[styles.overallValue, { color: colors.primary }]}>
              {data.overallAvg}%
            </AppText>
            {showTrend && (
              <View style={styles.overallTrend}>
                <Icon
                  name={data.overallTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={data.overallTrend >= 0 ? colors.success : colors.error}
                />
                <AppText
                  style={[
                    styles.overallTrendText,
                    { color: data.overallTrend >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {data.overallTrend >= 0 ? '+' : ''}{data.overallTrend}%
                </AppText>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  batchList: {
    gap: 0,
  },
  batchItem: {
    padding: 12,
  },
  batchItemMargin: {
    marginBottom: 8,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  rankBadge: {
    fontSize: 16,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 18,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  avgScore: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  overallSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  overallLabel: {
    fontSize: 13,
  },
  overallStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  overallTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  overallTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
