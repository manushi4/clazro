import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMonthlyChartQuery, MonthlyChartPeriod } from '../../../../hooks/queries/admin/useMonthlyChartQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { LineChart } from 'react-native-chart-kit';

const WIDGET_ID = 'finance.monthly-chart';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Format currency with abbreviation
const formatCurrency = (amount: number, abbreviate: boolean = true): string => {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
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
};

type PeriodOption = {
  value: MonthlyChartPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 3, labelKey: '3months' },
  { value: 6, labelKey: '6months' },
  { value: 12, labelKey: '12months' },
];

export const MonthlyChartWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultMonths = (config?.defaultMonths as MonthlyChartPeriod) || 6;
  const showLegend = config?.showLegend !== false;
  const showRevenue = config?.showRevenue !== false;
  const showExpenses = config?.showExpenses !== false;
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showSummary = config?.showSummary !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;

  const [months, setMonths] = useState<MonthlyChartPeriod>(defaultMonths);

  const { data, isLoading, error, refetch } = useMonthlyChartQuery({ months });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      months,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newMonths: MonthlyChartPeriod) => {
    setMonths(newMonths);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'period_change', months: newMonths });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_period_change`,
      level: 'info',
      data: { months: newMonths },
    });
  };

  const handleViewDetails = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_details' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_details`,
      level: 'info',
    });
    onNavigate?.('finance-reports');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.monthlyChart.title', { defaultValue: 'Monthly Trend' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.monthlyChart.states.loading', { defaultValue: 'Loading chart...' })}
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
            {t('widgets.monthlyChart.title', { defaultValue: 'Monthly Trend' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.monthlyChart.states.error', { defaultValue: 'Failed to load chart' })}
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
            {t('widgets.monthlyChart.title', { defaultValue: 'Monthly Trend' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-line" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.monthlyChart.states.empty', { defaultValue: 'No data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartLabels = data.dataPoints.map(d => d.monthLabel);
  const revenueData = data.dataPoints.map(d => d.revenue);
  const expenseData = data.dataPoints.map(d => d.expenses);

  const datasets = [];
  if (showRevenue) {
    datasets.push({
      data: revenueData,
      color: () => colors.success,
      strokeWidth: 2,
    });
  }
  if (showExpenses) {
    datasets.push({
      data: expenseData,
      color: () => colors.error,
      strokeWidth: 2,
    });
  }

  // Fallback if no datasets selected
  if (datasets.length === 0) {
    datasets.push({
      data: revenueData,
      color: () => colors.success,
      strokeWidth: 2,
    });
  }

  const chartWidth = SCREEN_WIDTH - 64; // Account for padding

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.monthlyChart.title', { defaultValue: 'Monthly Trend' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.monthlyChart.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.monthlyChart.viewDetails', { defaultValue: 'View Details' })}
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
                  backgroundColor: months === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handlePeriodChange(option.value)}
              accessibilityLabel={t(`widgets.monthlyChart.periods.${option.labelKey}`, { defaultValue: `${option.value} months` })}
              accessibilityRole="button"
              accessibilityState={{ selected: months === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: months === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.monthlyChart.periods.${option.labelKey}`, { defaultValue: `${option.value}M` })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {showRevenue && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
                {t('widgets.monthlyChart.labels.revenue', { defaultValue: 'Revenue' })}
              </AppText>
            </View>
          )}
          {showExpenses && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
                {t('widgets.monthlyChart.labels.expenses', { defaultValue: 'Expenses' })}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: datasets,
          }}
          width={chartWidth}
          height={180}
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
              r: '4',
              strokeWidth: '2',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.outlineVariant,
              strokeWidth: 0.5,
            },
            formatYLabel: (value) => formatCurrency(Number(value), true),
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

      {/* Summary Stats */}
      {showSummary && (
        <View style={[styles.summaryContainer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.monthlyChart.labels.totalRevenue', { defaultValue: 'Total Revenue' })}
            </AppText>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(data.totalRevenue, abbreviateNumbers)}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.monthlyChart.labels.totalExpenses', { defaultValue: 'Total Expenses' })}
            </AppText>
            <AppText style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(data.totalExpenses, abbreviateNumbers)}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.monthlyChart.labels.netProfit', { defaultValue: 'Net Profit' })}
            </AppText>
            <AppText style={[styles.summaryValue, { color: data.totalProfit >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(data.totalProfit, abbreviateNumbers)}
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
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  summaryContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
