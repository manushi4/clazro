import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTrendsQuery, TrendMetric, TrendPeriod } from '../../../../hooks/queries/admin/useTrendsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { LineChart } from 'react-native-chart-kit';

const WIDGET_ID = 'analytics.trends';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Format value based on metric type
const formatValue = (value: number, metric: TrendMetric, abbreviate: boolean = true): string => {
  if (metric === 'revenue') {
    const absAmount = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (abbreviate) {
      if (absAmount >= 10000000) {
        return `${sign}₹${(absAmount / 10000000).toFixed(1)}Cr`;
      }
      if (absAmount >= 100000) {
        return `${sign}₹${(absAmount / 100000).toFixed(1)}L`;
      }
      if (absAmount >= 1000) {
        return `${sign}₹${(absAmount / 1000).toFixed(1)}K`;
      }
    }
    return `${sign}₹${absAmount.toLocaleString('en-IN')}`;
  }
  
  if (abbreviate && value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
};

type MetricOption = {
  value: TrendMetric;
  labelKey: string;
  icon: string;
};

const METRIC_OPTIONS: MetricOption[] = [
  { value: 'users', labelKey: 'users', icon: 'account-group' },
  { value: 'revenue', labelKey: 'revenue', icon: 'currency-inr' },
  { value: 'engagement', labelKey: 'engagement', icon: 'chart-timeline-variant' },
];

type PeriodOption = {
  value: TrendPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
];

export const TrendsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultMetric = (config?.defaultMetric as TrendMetric) || 'users';
  const defaultPeriod = (config?.defaultPeriod as TrendPeriod) || 'week';
  const showMetricSelector = config?.showMetricSelector !== false;
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showChangeIndicator = config?.showChangeIndicator !== false;
  const showStatistics = config?.showStatistics !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const chartHeight = (config?.chartHeight as number) || 180;

  const [metric, setMetric] = useState<TrendMetric>(defaultMetric);
  const [period, setPeriod] = useState<TrendPeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useTrendsQuery({ metric, period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      metric,
      period,
    });
  }, []);

  // Track metric change
  const handleMetricChange = (newMetric: TrendMetric) => {
    setMetric(newMetric);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'metric_change', metric: newMetric });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_metric_change`,
      level: 'info',
      data: { metric: newMetric },
    });
  };

  // Track period change
  const handlePeriodChange = (newPeriod: TrendPeriod) => {
    setPeriod(newPeriod);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'period_change', period: newPeriod });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_period_change`,
      level: 'info',
      data: { period: newPeriod },
    });
  };

  const handleViewDetails = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_details' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_details`,
      level: 'info',
    });
    onNavigate?.('analytics-dashboard');
  };

  // Get metric color
  const getMetricColor = (m: TrendMetric): string => {
    switch (m) {
      case 'users': return colors.primary;
      case 'revenue': return colors.success;
      case 'engagement': return colors.tertiary;
      case 'content': return colors.secondary;
      default: return colors.primary;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.trends.title', { defaultValue: 'Trends' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.trends.states.loading', { defaultValue: 'Loading trends...' })}
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
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.trends.title', { defaultValue: 'Trends' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.trends.states.error', { defaultValue: 'Failed to load trends' })}
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
  if (!data || data.dataPoints.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.trends.title', { defaultValue: 'Trends' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-line" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.trends.states.empty', { defaultValue: 'No trend data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartLabels = data.dataPoints.map(d => d.label);
  const chartValues = data.dataPoints.map(d => d.value);
  const metricColor = getMetricColor(metric);
  const chartWidth = SCREEN_WIDTH - 64;

  // Ensure we have valid data for the chart
  const hasValidData = chartValues.some(v => v > 0);
  const chartData = hasValidData ? chartValues : chartValues.map(() => 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.trends.title', { defaultValue: 'Trends' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.trends.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.trends.viewDetails', { defaultValue: 'View Details' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Metric Selector */}
      {showMetricSelector && (
        <View style={styles.metricSelector}>
          {METRIC_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.metricButton,
                {
                  backgroundColor: metric === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handleMetricChange(option.value)}
              accessibilityLabel={t(`widgets.trends.metrics.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: metric === option.value }}
            >
              <Icon 
                name={option.icon} 
                size={14} 
                color={metric === option.value ? colors.primary : colors.onSurfaceVariant} 
              />
              <AppText
                style={[
                  styles.metricButtonText,
                  { color: metric === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.trends.metrics.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Period Selector */}
      {showPeriodSelector && (
        <View style={styles.periodSelector}>
          {PERIOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodButton,
                {
                  backgroundColor: period === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handlePeriodChange(option.value)}
              accessibilityLabel={t(`widgets.trends.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.trends.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Change Indicator */}
      {showChangeIndicator && (
        <View style={styles.changeContainer}>
          <View style={styles.currentValueContainer}>
            <AppText style={[styles.currentValue, { color: colors.onSurface }]}>
              {formatValue(data.currentValue, metric, abbreviateNumbers)}
            </AppText>
            <View style={[
              styles.changeBadge, 
              { backgroundColor: data.changeDirection === 'up' ? colors.successContainer : 
                               data.changeDirection === 'down' ? colors.errorContainer : 
                               colors.surfaceVariant }
            ]}>
              <Icon 
                name={data.changeDirection === 'up' ? 'trending-up' : 
                      data.changeDirection === 'down' ? 'trending-down' : 'minus'}
                size={14}
                color={data.changeDirection === 'up' ? colors.success : 
                       data.changeDirection === 'down' ? colors.error : 
                       colors.onSurfaceVariant}
              />
              <AppText style={[
                styles.changeText,
                { color: data.changeDirection === 'up' ? colors.success : 
                         data.changeDirection === 'down' ? colors.error : 
                         colors.onSurfaceVariant }
              ]}>
                {Math.abs(data.changePercent)}%
              </AppText>
            </View>
          </View>
          <AppText style={[styles.changeLabel, { color: colors.onSurfaceVariant }]}>
            {t(`widgets.trends.vsLast.${period}`, { defaultValue: `vs last ${period}` })}
          </AppText>
        </View>
      )}

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{
              data: chartData.length > 0 ? chartData : [0],
              color: () => metricColor,
              strokeWidth: 2,
            }],
          }}
          width={chartWidth}
          height={chartHeight}
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => metricColor,
            labelColor: () => colors.onSurfaceVariant,
            style: {
              borderRadius: borderRadius.medium,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: metricColor,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.outlineVariant,
              strokeWidth: 0.5,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: borderRadius.medium,
          }}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      </View>

      {/* Statistics */}
      {showStatistics && (
        <View style={[styles.statsContainer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.trends.stats.average', { defaultValue: 'Average' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {formatValue(data.average, metric, abbreviateNumbers)}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.trends.stats.highest', { defaultValue: 'Highest' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.success }]}>
              {formatValue(data.highest, metric, abbreviateNumbers)}
            </AppText>
            <AppText style={[styles.statSubLabel, { color: colors.onSurfaceVariant }]}>
              {data.highestLabel}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.trends.stats.lowest', { defaultValue: 'Lowest' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.error }]}>
              {formatValue(data.lowest, metric, abbreviateNumbers)}
            </AppText>
            <AppText style={[styles.statSubLabel, { color: colors.onSurfaceVariant }]}>
              {data.lowestLabel}
            </AppText>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
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
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  metricSelector: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  metricButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  changeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statSubLabel: {
    fontSize: 9,
    marginTop: 2,
  },
});
