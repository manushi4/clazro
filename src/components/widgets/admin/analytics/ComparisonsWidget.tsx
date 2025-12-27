import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useComparisonsQuery, ComparisonPeriod, ComparisonMetric } from '../../../../hooks/queries/admin/useComparisonsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'analytics.comparisons';

// Format value based on metric type
const formatValue = (value: number, unit?: string, abbreviate: boolean = true): string => {
  if (unit === '₹') {
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
  
  if (unit === '%') {
    return `${value}%`;
  }
  
  if (abbreviate && value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
};

type PeriodOption = {
  value: ComparisonPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

export const ComparisonsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultPeriod = (config?.defaultPeriod as ComparisonPeriod) || 'week';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showSummary = config?.showSummary !== false;
  const showComparisonCards = config?.showComparisonCards !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const maxMetrics = (config?.maxMetrics as number) || 5;

  const [period, setPeriod] = useState<ComparisonPeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useComparisonsQuery({ period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: ComparisonPeriod) => {
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
    onNavigate?.('comparisons-detail');
  };

  const handleMetricPress = (metric: ComparisonMetric) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'metric_tap', metric: metric.id });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_metric_tap`,
      level: 'info',
      data: { metric: metric.id },
    });

    // Each metric navigates to its own dedicated analytics screen
    const screenMap: Record<string, string> = {
      users: 'user-analytics',        // User Analytics Screen
      revenue: 'revenue-analytics',   // Revenue Analytics Screen
      engagement: 'engagement-detail', // Engagement Analytics Screen
      content: 'content-analytics',   // Content Analytics Screen
      sessions: 'sessions-analytics', // Sessions Analytics Screen
    };
    onNavigate?.(screenMap[metric.id] || 'comparisons-detail');
  };

  // Get color for metric
  const getMetricColor = (colorKey: string): string => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      success: colors.success,
      tertiary: colors.tertiary,
      warning: colors.warning,
      error: colors.error,
      secondary: colors.secondary,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.comparisons.title', { defaultValue: 'Period Comparisons' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.comparisons.states.loading', { defaultValue: 'Loading comparison data...' })}
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
            {t('widgets.comparisons.title', { defaultValue: 'Period Comparisons' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.comparisons.states.error', { defaultValue: 'Failed to load comparison data' })}
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
  if (!data || data.metrics.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.comparisons.title', { defaultValue: 'Period Comparisons' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="compare-horizontal" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.comparisons.states.empty', { defaultValue: 'No comparison data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.comparisons.title', { defaultValue: 'Period Comparisons' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.comparisons.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.comparisons.viewDetails', { defaultValue: 'View Details' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

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
              accessibilityLabel={t(`widgets.comparisons.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.comparisons.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Summary Banner */}
      {showSummary && (
        <View style={[
          styles.summaryBanner,
          { 
            backgroundColor: data.summary.overallTrend === 'positive' ? colors.successContainer :
                            data.summary.overallTrend === 'negative' ? colors.errorContainer :
                            colors.surfaceVariant,
            borderRadius: borderRadius.medium,
          }
        ]}>
          <View style={styles.summaryContent}>
            <Icon
              name={data.summary.overallTrend === 'positive' ? 'trending-up' :
                    data.summary.overallTrend === 'negative' ? 'trending-down' : 'minus'}
              size={24}
              color={data.summary.overallTrend === 'positive' ? colors.success :
                     data.summary.overallTrend === 'negative' ? colors.error :
                     colors.onSurfaceVariant}
            />
            <View style={styles.summaryText}>
              <AppText style={[
                styles.summaryTitle,
                { color: data.summary.overallTrend === 'positive' ? colors.success :
                         data.summary.overallTrend === 'negative' ? colors.error :
                         colors.onSurfaceVariant }
              ]}>
                {t(`widgets.comparisons.trend.${data.summary.overallTrend}`, { 
                  defaultValue: data.summary.overallTrend === 'positive' ? 'Positive Trend' :
                               data.summary.overallTrend === 'negative' ? 'Negative Trend' : 'Stable'
                })}
              </AppText>
              <AppText style={[styles.summarySubtitle, { color: colors.onSurfaceVariant }]}>
                {t('widgets.comparisons.summaryStats', {
                  improved: data.summary.improved,
                  declined: data.summary.declined,
                  stable: data.summary.stable,
                  defaultValue: `${data.summary.improved} improved, ${data.summary.declined} declined, ${data.summary.stable} stable`
                })}
              </AppText>
            </View>
          </View>
          <AppText style={[styles.periodLabel, { color: colors.onSurfaceVariant }]}>
            {data.periodLabel} vs {data.previousPeriodLabel}
          </AppText>
        </View>
      )}

      {/* Comparison Cards */}
      {showComparisonCards && (
        <View style={styles.comparisonList}>
          {data.metrics.slice(0, maxMetrics).map((metric) => {
            const metricColor = getMetricColor(metric.color);
            return (
              <TouchableOpacity
                key={metric.id}
                style={[styles.comparisonCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
                onPress={() => handleMetricPress(metric)}
                accessibilityLabel={t('widgets.comparisons.metricHint', {
                  label: metric.label,
                  current: formatValue(metric.currentValue, metric.unit, abbreviateNumbers),
                  previous: formatValue(metric.previousValue, metric.unit, abbreviateNumbers),
                  change: metric.changePercent,
                  defaultValue: `${metric.label}: ${formatValue(metric.currentValue, metric.unit, abbreviateNumbers)} vs ${formatValue(metric.previousValue, metric.unit, abbreviateNumbers)}, ${metric.changePercent}% change`,
                })}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.metricIconContainer, { backgroundColor: `${metricColor}20` }]}>
                    <Icon name={metric.icon} size={18} color={metricColor} />
                  </View>
                  <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    {t(`widgets.comparisons.metrics.${metric.id}`, { defaultValue: metric.label })}
                  </AppText>
                  <View style={[
                    styles.changeBadge,
                    { backgroundColor: metric.changeDirection === 'up' ? colors.successContainer :
                                      metric.changeDirection === 'down' ? colors.errorContainer :
                                      colors.surfaceVariant }
                  ]}>
                    <Icon
                      name={metric.changeDirection === 'up' ? 'arrow-up' :
                            metric.changeDirection === 'down' ? 'arrow-down' : 'minus'}
                      size={12}
                      color={metric.changeDirection === 'up' ? colors.success :
                             metric.changeDirection === 'down' ? colors.error :
                             colors.onSurfaceVariant}
                    />
                    <AppText style={[
                      styles.changeText,
                      { color: metric.changeDirection === 'up' ? colors.success :
                               metric.changeDirection === 'down' ? colors.error :
                               colors.onSurfaceVariant }
                    ]}>
                      {metric.changePercent}%
                    </AppText>
                  </View>
                </View>
                
                <View style={styles.valuesRow}>
                  <View style={styles.valueColumn}>
                    <AppText style={[styles.valueLabel, { color: colors.onSurfaceVariant }]}>
                      {t('widgets.comparisons.current', { defaultValue: 'Current' })}
                    </AppText>
                    <AppText style={[styles.valueText, { color: colors.onSurface }]}>
                      {formatValue(metric.currentValue, metric.unit, abbreviateNumbers)}
                    </AppText>
                  </View>
                  <View style={styles.vsContainer}>
                    <Icon name="compare-horizontal" size={16} color={colors.outline} />
                  </View>
                  <View style={[styles.valueColumn, styles.valueColumnRight]}>
                    <AppText style={[styles.valueLabel, { color: colors.onSurfaceVariant }]}>
                      {t('widgets.comparisons.previous', { defaultValue: 'Previous' })}
                    </AppText>
                    <AppText style={[styles.valueText, { color: colors.onSurfaceVariant }]}>
                      {formatValue(metric.previousValue, metric.unit, abbreviateNumbers)}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  summarySubtitle: {
    fontSize: 11,
  },
  periodLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  comparisonList: {
    gap: 10,
  },
  comparisonCard: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueColumn: {
    flex: 1,
  },
  valueColumnRight: {
    alignItems: 'flex-end',
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
});
