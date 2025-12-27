import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGrowthMetricsQuery, GrowthPeriod, GrowthMetric } from '../../../../hooks/queries/admin/useGrowthMetricsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { LineChart } from 'react-native-chart-kit';

const WIDGET_ID = 'analytics.growth';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Format value based on metric type
const formatValue = (value: number, metricId: string, abbreviate: boolean = true): string => {
  if (metricId === 'revenue') {
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
  
  if (metricId === 'engagement') {
    return `${value}%`;
  }
  
  if (abbreviate && value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
};

type PeriodOption = {
  value: GrowthPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
];

export const GrowthWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultPeriod = (config?.defaultPeriod as GrowthPeriod) || 'week';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showOverallGrowth = config?.showOverallGrowth !== false;
  const showMetricsGrid = config?.showMetricsGrid !== false;
  const showTargetProgress = config?.showTargetProgress !== false;
  const showTrendChart = config?.showTrendChart !== false;
  const showHighlights = config?.showHighlights !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const chartHeight = (config?.chartHeight as number) || 140;
  const maxMetrics = (config?.maxMetrics as number) || 4;

  const [period, setPeriod] = useState<GrowthPeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useGrowthMetricsQuery({ period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: GrowthPeriod) => {
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
    onNavigate?.('growth-detail');
  };

  const handleMetricPress = (metric: GrowthMetric) => {
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
    };
    onNavigate?.(screenMap[metric.id] || 'growth-detail');
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
            {t('widgets.growth.title', { defaultValue: 'Growth Metrics' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.growth.states.loading', { defaultValue: 'Loading growth data...' })}
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
            {t('widgets.growth.title', { defaultValue: 'Growth Metrics' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.growth.states.error', { defaultValue: 'Failed to load growth data' })}
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
            {t('widgets.growth.title', { defaultValue: 'Growth Metrics' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-areaspline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.growth.states.empty', { defaultValue: 'No growth data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartWidth = SCREEN_WIDTH - 64;
  const chartLabels = data.userGrowthTrend.map(d => d.label);
  const chartValues = data.userGrowthTrend.map(d => d.value);
  const hasValidChartData = chartValues.some(v => v > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.growth.title', { defaultValue: 'Growth Metrics' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.growth.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.growth.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`widgets.growth.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.growth.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Overall Growth Banner */}
      {showOverallGrowth && (
        <View style={[
          styles.overallBanner,
          { 
            backgroundColor: data.overallDirection === 'up' ? colors.successContainer :
                            data.overallDirection === 'down' ? colors.errorContainer :
                            colors.surfaceVariant,
            borderRadius: borderRadius.medium,
          }
        ]}>
          <View style={styles.overallContent}>
            <Icon
              name={data.overallDirection === 'up' ? 'trending-up' :
                    data.overallDirection === 'down' ? 'trending-down' : 'minus'}
              size={28}
              color={data.overallDirection === 'up' ? colors.success :
                     data.overallDirection === 'down' ? colors.error :
                     colors.onSurfaceVariant}
            />
            <View style={styles.overallText}>
              <AppText style={[
                styles.overallValue,
                { color: data.overallDirection === 'up' ? colors.success :
                         data.overallDirection === 'down' ? colors.error :
                         colors.onSurfaceVariant }
              ]}>
                {data.overallGrowth}%
              </AppText>
              <AppText style={[styles.overallLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.growth.overallGrowth', { defaultValue: 'Overall Growth' })}
              </AppText>
            </View>
          </View>
          <AppText style={[styles.periodLabel, { color: colors.onSurfaceVariant }]}>
            {t(`widgets.growth.vsLast.${period}`, { defaultValue: `vs last ${period}` })}
          </AppText>
        </View>
      )}

      {/* Metrics Grid */}
      {showMetricsGrid && (
        <View style={styles.metricsGrid}>
          {data.metrics.slice(0, maxMetrics).map((metric) => {
            const metricColor = getMetricColor(metric.color);
            return (
              <TouchableOpacity
                key={metric.id}
                style={[styles.metricCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
                onPress={() => handleMetricPress(metric)}
                accessibilityLabel={t('widgets.growth.metricHint', {
                  label: metric.label,
                  value: formatValue(metric.value, metric.id, abbreviateNumbers),
                  change: metric.changePercent,
                  defaultValue: `${metric.label}: ${formatValue(metric.value, metric.id, abbreviateNumbers)}, ${metric.changePercent}% change`,
                })}
                accessibilityRole="button"
              >
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIconContainer, { backgroundColor: `${metricColor}20` }]}>
                    <Icon name={metric.icon} size={16} color={metricColor} />
                  </View>
                  <View style={[
                    styles.changeBadge,
                    { backgroundColor: metric.changeDirection === 'up' ? colors.successContainer :
                                      metric.changeDirection === 'down' ? colors.errorContainer :
                                      colors.surfaceVariant }
                  ]}>
                    <Icon
                      name={metric.changeDirection === 'up' ? 'arrow-up' :
                            metric.changeDirection === 'down' ? 'arrow-down' : 'minus'}
                      size={10}
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
                <AppText style={[styles.metricValue, { color: colors.onSurface }]}>
                  {formatValue(metric.value, metric.id, abbreviateNumbers)}
                </AppText>
                <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                  {t(`widgets.growth.metrics.${metric.id}`, { defaultValue: metric.label })}
                </AppText>
                
                {/* Target Progress */}
                {showTargetProgress && metric.target && (
                  <View style={styles.targetContainer}>
                    <View style={[styles.targetBar, { backgroundColor: colors.outline }]}>
                      <View
                        style={[
                          styles.targetProgress,
                          {
                            backgroundColor: (metric.targetPercent || 0) >= 100 ? colors.success :
                                            (metric.targetPercent || 0) >= 80 ? colors.warning :
                                            colors.error,
                            width: `${Math.min(metric.targetPercent || 0, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <AppText style={[styles.targetText, { color: colors.onSurfaceVariant }]}>
                      {metric.targetPercent}% {t('widgets.growth.ofTarget', { defaultValue: 'of target' })}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Trend Chart */}
      {showTrendChart && hasValidChartData && (
        <View style={styles.chartSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('widgets.growth.userGrowthTrend', { defaultValue: 'User Growth Trend' })}
          </AppText>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{
                data: chartValues.length > 0 ? chartValues : [0],
                color: () => colors.primary,
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
              color: () => colors.primary,
              labelColor: () => colors.onSurfaceVariant,
              style: {
                borderRadius: borderRadius.medium,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '2',
                stroke: colors.primary,
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
      )}

      {/* Highlights */}
      {showHighlights && (
        <View style={[styles.highlightsSection, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightItem}>
              <Icon name="star" size={16} color={colors.success} />
              <View style={styles.highlightText}>
                <AppText style={[styles.highlightLabel, { color: colors.onSurfaceVariant }]}>
                  {t('widgets.growth.bestPerforming', { defaultValue: 'Best Performing' })}
                </AppText>
                <AppText style={[styles.highlightValue, { color: colors.onSurface }]}>
                  {data.highlights.bestPerforming}
                </AppText>
              </View>
            </View>
            <View style={styles.highlightItem}>
              <Icon name="alert" size={16} color={colors.warning} />
              <View style={styles.highlightText}>
                <AppText style={[styles.highlightLabel, { color: colors.onSurfaceVariant }]}>
                  {t('widgets.growth.needsAttention', { defaultValue: 'Needs Attention' })}
                </AppText>
                <AppText style={[styles.highlightValue, { color: colors.onSurface }]}>
                  {data.highlights.needsAttention}
                </AppText>
              </View>
            </View>
          </View>
          <View style={styles.highlightRow}>
            <View style={[styles.highlightBadge, { backgroundColor: colors.successContainer }]}>
              <AppText style={[styles.highlightBadgeValue, { color: colors.success }]}>
                {data.highlights.onTrack}
              </AppText>
              <AppText style={[styles.highlightBadgeLabel, { color: colors.success }]}>
                {t('widgets.growth.onTrack', { defaultValue: 'On Track' })}
              </AppText>
            </View>
            <View style={[styles.highlightBadge, { backgroundColor: colors.errorContainer }]}>
              <AppText style={[styles.highlightBadgeValue, { color: colors.error }]}>
                {data.highlights.belowTarget}
              </AppText>
              <AppText style={[styles.highlightBadgeLabel, { color: colors.error }]}>
                {t('widgets.growth.belowTarget', { defaultValue: 'Below Target' })}
              </AppText>
            </View>
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
  overallBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  overallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overallText: {
    gap: 2,
  },
  overallValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  overallLabel: {
    fontSize: 11,
  },
  periodLabel: {
    fontSize: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    padding: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 8,
  },
  targetContainer: {
    gap: 4,
  },
  targetBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  targetProgress: {
    height: '100%',
    borderRadius: 2,
  },
  targetText: {
    fontSize: 9,
  },
  chartSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  highlightsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  highlightItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 10,
  },
  highlightValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  highlightBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  highlightBadgeValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  highlightBadgeLabel: {
    fontSize: 10,
  },
});
