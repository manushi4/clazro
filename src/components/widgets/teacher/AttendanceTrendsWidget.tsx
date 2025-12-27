import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { useAttendanceReportsQuery } from '../../../hooks/queries/teacher/useAttendanceReportsQuery';

const SCREEN_WIDTH = Dimensions.get('window').width;

type DateRange = 'week' | 'month' | 'quarter';

export const AttendanceTrendsWidget: React.FC<WidgetProps> = ({
  config,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const [dateRange, setDateRange] = useState<DateRange>(
    (config?.defaultRange as DateRange) || 'month'
  );

  const { data, isLoading, error, refetch } = useAttendanceReportsQuery({ dateRange });

  const dateRanges: { key: DateRange; label: string }[] = [
    { key: 'week', label: t('widgets.attendanceTrends.week', { defaultValue: '7 Days' }) },
    { key: 'month', label: t('widgets.attendanceTrends.month', { defaultValue: '30 Days' }) },
    { key: 'quarter', label: t('widgets.attendanceTrends.quarter', { defaultValue: '90 Days' }) },
  ];

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
          {t('widgets.attendanceTrends.states.error', { defaultValue: 'Failed to load' })}
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

  const trends = data.trends;
  const maxRate = Math.max(...trends.map(t => t.rate));
  const minRate = Math.min(...trends.map(t => t.rate));
  const chartHeight = 120;
  const chartWidth = SCREEN_WIDTH - 64;
  const barWidth = (chartWidth / trends.length) - 4;

  return (
    <View style={styles.container}>
      {/* Date Range Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        {dateRanges.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.tab,
              dateRange === range.key && { backgroundColor: colors.primary },
              { borderRadius: borderRadius.small },
            ]}
            onPress={() => setDateRange(range.key)}
          >
            <AppText
              style={[
                styles.tabText,
                { color: dateRange === range.key ? colors.onPrimary : colors.onSurfaceVariant },
              ]}
            >
              {range.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.primary }]}>
            {data.summary.overallRate}%
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceTrends.average', { defaultValue: 'Average' })}
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {data.summary.perfectAttendanceCount}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceTrends.perfect', { defaultValue: '100% Attendance' })}
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: '#F44336' }]}>
            {data.summary.lowAttendanceCount}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceTrends.low', { defaultValue: 'Below 75%' })}
          </AppText>
        </View>
      </View>

      {/* Simple Bar Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={styles.chartYAxis}>
          <AppText style={[styles.axisLabel, { color: colors.onSurfaceVariant }]}>{Math.round(maxRate)}%</AppText>
          <AppText style={[styles.axisLabel, { color: colors.onSurfaceVariant }]}>{Math.round((maxRate + minRate) / 2)}%</AppText>
          <AppText style={[styles.axisLabel, { color: colors.onSurfaceVariant }]}>{Math.round(minRate)}%</AppText>
        </View>
        <View style={styles.chartBars}>
          {trends.slice(-14).map((point, index) => {
            const height = ((point.rate - minRate) / (maxRate - minRate)) * chartHeight + 10;
            const isGood = point.rate >= 90;
            const isWarning = point.rate >= 75 && point.rate < 90;

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      width: barWidth,
                      backgroundColor: isGood ? '#4CAF50' : isWarning ? '#FF9800' : '#F44336',
                      borderRadius: borderRadius.small,
                    },
                  ]}
                />
                {index % 3 === 0 && (
                  <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                    {new Date(point.date).getDate()}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>90%+</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>75-90%</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>&lt;75%</AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    padding: 12,
    height: 160,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 10,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    minHeight: 10,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
});
