import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { useAttendanceReportsQuery } from '../../../hooks/queries/teacher/useAttendanceReportsQuery';

export const AttendanceTrendsCompactWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');

  const showComparison = config?.showComparison !== false;

  const { data, isLoading, error, refetch } = useAttendanceReportsQuery();

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t('widgets.attendanceTrendsCompact.states.error', { defaultValue: 'Failed to load' })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate stats from trends data
  const trends = data.trends.slice(-7); // Last 7 days
  const currentWeekAvg = trends.length > 0
    ? Math.round(trends.reduce((sum, t) => sum + t.rate, 0) / trends.length)
    : 0;

  // Calculate last week average from older data
  const lastWeekData = data.trends.slice(-14, -7);
  const lastWeekAvg = lastWeekData.length > 0
    ? Math.round(lastWeekData.reduce((sum, t) => sum + t.rate, 0) / lastWeekData.length)
    : currentWeekAvg;
  const trendDiff = currentWeekAvg - lastWeekAvg;
  const isUp = trendDiff >= 0;

  // Find max rate for chart scaling
  const maxRate = Math.max(...trends.map(t => t.rate), 100);

  // Get day label from date
  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[date.getDay()];
  };

  const getBarColor = (rate: number): string => {
    if (rate >= 90) return colors.success;
    if (rate >= 75) return colors.warning;
    return colors.error;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}
      onPress={() => onNavigate?.('AttendanceReports')}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="chart-line" size={18} color={colors.primary} />
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('widgets.attendanceTrendsCompact.title', { defaultValue: '7-Day Trend' })}
          </AppText>
        </View>
        <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
      </View>

      {/* Mini Bar Chart */}
      <View style={styles.chartContainer}>
        {trends.map((point, index) => {
          const height = (point.rate / maxRate) * 40;
          return (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: getBarColor(point.rate),
                  },
                ]}
              />
              <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                {getDayLabel(point.date)}
              </AppText>
            </View>
          );
        })}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {currentWeekAvg}%
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceTrendsCompact.thisWeek', { defaultValue: 'This Week' })}
          </AppText>
        </View>

        {showComparison && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.outline }]} />
            <View style={styles.statItem}>
              <View style={styles.trendRow}>
                <Icon
                  name={isUp ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={isUp ? colors.success : colors.error}
                />
                <AppText
                  style={[
                    styles.trendValue,
                    { color: isUp ? colors.success : colors.error },
                  ]}
                >
                  {isUp ? '+' : ''}{trendDiff}%
                </AppText>
              </View>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.attendanceTrendsCompact.vsLastWeek', { defaultValue: 'vs Last Week' })}
              </AppText>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 56,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
