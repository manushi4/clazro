import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFeeCollectionTrendQuery } from '../../../../hooks/queries/admin/useFeeCollectionTrendQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'admin.fee-collection-trend';

// Format currency with abbreviation (Indian format)
const formatCurrency = (amount: number, abbreviate: boolean = true): string => {
  if (abbreviate) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const FeeCollectionTrendWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showExpected = config?.showExpected !== false;
  const showGrowth = config?.showGrowth !== false;
  const showYearTotal = config?.showYearTotal !== false;

  // Period selector state
  const [selectedPeriod, setSelectedPeriod] = useState<'6' | '12'>('6');

  const { data, isLoading, error, refetch } = useFeeCollectionTrendQuery({
    months: selectedPeriod === '6' ? 6 : 12,
  });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
    });
  }, []);

  const handleViewReport = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_report' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_report`,
      level: 'info',
    });
    // Navigate to fee reports screen
    onNavigate?.('fee-reports', { year: new Date().getFullYear() });
  };

  const handleMonthTap = (month: string, year: number) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'month_tap', month, year });
    onNavigate?.('monthly-fee-report', { month, year });
  };

  const handlePeriodChange = (period: '6' | '12') => {
    setSelectedPeriod(period);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'period_change', period });
  };

  // Calculate max value for chart scaling
  const maxValue = data?.monthlyData
    ? Math.max(...data.monthlyData.map(m => Math.max(m.actual, showExpected ? m.expected : 0)))
    : 0;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="chart-line" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.feeCollectionTrend.title', { defaultValue: 'Fee Collection Trend' })}
            </AppText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('common:states.loading', { defaultValue: 'Loading...' })}
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
            <Icon name="chart-line" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.feeCollectionTrend.title', { defaultValue: 'Fee Collection Trend' })}
            </AppText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('common:states.error', { defaultValue: 'Failed to load data' })}
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
  if (!data || !data.monthlyData || data.monthlyData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="chart-line" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.feeCollectionTrend.title', { defaultValue: 'Fee Collection Trend' })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-bar" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.feeCollectionTrend.states.empty', { defaultValue: 'No collection data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  const isPositiveGrowth = data.currentMonthGrowth >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="chart-line" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.feeCollectionTrend.title', { defaultValue: 'Fee Collection Trend' })}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleViewReport}
          accessibilityLabel={t('common:actions.viewAll', { defaultValue: 'View All' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.viewAll', { defaultValue: 'View All' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === '6' && { backgroundColor: colors.primaryContainer },
            { borderRadius: borderRadius.small },
          ]}
          onPress={() => handlePeriodChange('6')}
          accessibilityLabel={t('widgets.feeCollectionTrend.periods.sixMonths', { defaultValue: '6 Months' })}
        >
          <AppText
            style={[
              styles.periodText,
              { color: selectedPeriod === '6' ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            {t('widgets.feeCollectionTrend.periods.sixMonths', { defaultValue: '6M' })}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === '12' && { backgroundColor: colors.primaryContainer },
            { borderRadius: borderRadius.small },
          ]}
          onPress={() => handlePeriodChange('12')}
          accessibilityLabel={t('widgets.feeCollectionTrend.periods.twelveMonths', { defaultValue: '12 Months' })}
        >
          <AppText
            style={[
              styles.periodText,
              { color: selectedPeriod === '12' ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            {t('widgets.feeCollectionTrend.periods.twelveMonths', { defaultValue: '12M' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.monthlyData.map((month) => {
            const barHeight = maxValue > 0 ? (month.actual / maxValue) * 100 : 0;
            const expectedHeight = maxValue > 0 && showExpected ? (month.expected / maxValue) * 100 : 0;
            
            return (
              <TouchableOpacity
                key={month.month}
                style={styles.barWrapper}
                onPress={() => handleMonthTap(month.month, month.year)}
                accessibilityLabel={`${month.monthLabel}: ${formatCurrency(month.actual)} collected`}
              >
                <View style={styles.barColumn}>
                  {showExpected && (
                    <View
                      style={[
                        styles.expectedBar,
                        {
                          height: `${expectedHeight}%`,
                          backgroundColor: `${colors.outline}30`,
                          borderRadius: borderRadius.small,
                        },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.actualBar,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: month.collectionRate >= 80 
                          ? colors.success 
                          : month.collectionRate >= 60 
                            ? colors.warning 
                            : colors.error,
                        borderRadius: borderRadius.small,
                      },
                    ]}
                  />
                </View>
                <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                  {month.monthLabel}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      {showExpected && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
              {t('widgets.feeCollectionTrend.actual', { defaultValue: 'Collected' })}
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: `${colors.outline}50` }]} />
            <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
              {t('widgets.feeCollectionTrend.expected', { defaultValue: 'Expected' })}
            </AppText>
          </View>
        </View>
      )}

      {/* Growth Indicator */}
      {showGrowth && (
        <View style={[styles.growthSection, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.growthRow}>
            <AppText style={[styles.growthLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.feeCollectionTrend.monthGrowth', { defaultValue: 'Month-over-Month' })}:
            </AppText>
            <View style={styles.growthValue}>
              <Icon
                name={isPositiveGrowth ? 'trending-up' : 'trending-down'}
                size={16}
                color={isPositiveGrowth ? colors.success : colors.error}
              />
              <AppText
                style={[
                  styles.growthText,
                  { color: isPositiveGrowth ? colors.success : colors.error },
                ]}
              >
                {isPositiveGrowth ? '+' : ''}{data.currentMonthGrowth}%
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Year Total */}
      {showYearTotal && (
        <View style={[styles.yearTotalSection, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <View style={styles.yearTotalRow}>
            <View>
              <AppText style={[styles.yearTotalLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.feeCollectionTrend.yearTotal', { defaultValue: 'Year to Date' })}
              </AppText>
              <AppText style={[styles.yearTotalAmount, { color: colors.primary }]}>
                {formatCurrency(data.yearToDateTotal)}
              </AppText>
            </View>
            <View style={styles.yearProgressContainer}>
              <AppText style={[styles.yearProgressLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.feeCollectionTrend.ofTarget', { defaultValue: 'of target' })}
              </AppText>
              <AppText style={[styles.yearProgressValue, { color: colors.primary }]}>
                {data.yearProgress}%
              </AppText>
            </View>
          </View>
          <View style={[styles.yearProgressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.yearProgressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(data.yearProgress, 100)}%`,
                },
              ]}
            />
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
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
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
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    height: 140,
    marginBottom: 12,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 40,
  },
  barColumn: {
    width: 20,
    height: 100,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  expectedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actualBar: {
    width: '100%',
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  growthSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  growthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  growthLabel: {
    fontSize: 12,
  },
  growthValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yearTotalSection: {
    padding: 12,
  },
  yearTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearTotalLabel: {
    fontSize: 11,
  },
  yearTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  yearProgressContainer: {
    alignItems: 'flex-end',
  },
  yearProgressLabel: {
    fontSize: 10,
  },
  yearProgressValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  yearProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  yearProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
