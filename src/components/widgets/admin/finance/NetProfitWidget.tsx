import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNetProfitQuery, NetProfitPeriod } from '../../../../hooks/queries/admin/useNetProfitQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'finance.net-profit';

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
  value: NetProfitPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

export const NetProfitWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showNetProfit = config?.showNetProfit !== false;
  const showGrowthPercentage = config?.showGrowthPercentage !== false;
  const showProfitMargin = config?.showProfitMargin !== false;
  const showComparison = config?.showComparison !== false;
  const showBreakdown = config?.showBreakdown !== false;
  const defaultPeriod = (config?.defaultPeriod as NetProfitPeriod) || 'month';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const showViewDetails = config?.showViewDetails !== false;

  const [period, setPeriod] = useState<NetProfitPeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useNetProfitQuery({ period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: NetProfitPeriod) => {
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
    onNavigate?.('finance-reports');
  };

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return colors.success;
    if (profit < 0) return colors.error;
    return colors.onSurfaceVariant;
  };

  const getProfitIcon = (profit: number): string => {
    if (profit > 0) return 'trending-up';
    if (profit < 0) return 'trending-down';
    return 'minus';
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.netProfit.title', { defaultValue: 'Net Profit' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.netProfit.states.loading', { defaultValue: 'Loading...' })}
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
            {t('widgets.netProfit.title', { defaultValue: 'Net Profit' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.netProfit.states.error', { defaultValue: 'Failed to load data' })}
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
  if (!data || (data.totalRevenue === 0 && data.totalExpenses === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.netProfit.title', { defaultValue: 'Net Profit' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cash-remove" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.netProfit.states.empty', { defaultValue: 'No financial data' })}
          </AppText>
        </View>
      </View>
    );
  }

  const profitColor = getProfitColor(data.netProfit);
  const profitIcon = getProfitIcon(data.netProfit);
  const isPositiveGrowth = (data.growth || 0) >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.netProfit.title', { defaultValue: 'Net Profit' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.netProfit.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.netProfit.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`widgets.netProfit.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.netProfit.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Net Profit Card */}
      {showNetProfit && (
        <View style={[styles.mainCard, { backgroundColor: `${profitColor}15`, borderRadius: borderRadius.medium }]}>
          <View style={styles.mainCardHeader}>
            <Icon name={profitIcon} size={24} color={profitColor} />
            <AppText style={[styles.profitLabel, { color: colors.onSurfaceVariant }]}>
              {data.netProfit >= 0
                ? t('widgets.netProfit.labels.profit', { defaultValue: 'Profit' })
                : t('widgets.netProfit.labels.loss', { defaultValue: 'Loss' })}
            </AppText>
          </View>
          <AppText style={[styles.profitAmount, { color: profitColor }]}>
            {formatCurrency(data.netProfit, abbreviateNumbers)}
          </AppText>

          {showGrowthPercentage && data.growth !== undefined && (
            <View style={styles.growthContainer}>
              <Icon
                name={isPositiveGrowth ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={isPositiveGrowth ? colors.success : colors.error}
              />
              <AppText
                style={[
                  styles.growthText,
                  { color: isPositiveGrowth ? colors.success : colors.error },
                ]}
              >
                {Math.abs(data.growth)}% {t(`widgets.netProfit.vsLast.${period}`, { defaultValue: `vs last ${period}` })}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Profit Margin */}
      {showProfitMargin && (
        <View style={[styles.marginCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <View style={styles.marginRow}>
            <Icon name="percent" size={18} color={colors.primary} />
            <AppText style={[styles.marginLabel, { color: colors.onSurface }]}>
              {t('widgets.netProfit.labels.profitMargin', { defaultValue: 'Profit Margin' })}
            </AppText>
            <AppText
              style={[
                styles.marginValue,
                { color: data.profitMargin >= 0 ? colors.success : colors.error },
              ]}
            >
              {data.profitMargin}%
            </AppText>
          </View>
        </View>
      )}

      {/* Revenue vs Expenses Comparison */}
      {showComparison && (
        <View style={styles.comparisonContainer}>
          <View style={[styles.comparisonCard, { backgroundColor: `${colors.success}10`, borderRadius: borderRadius.small }]}>
            <View style={styles.comparisonHeader}>
              <Icon name="arrow-down-bold" size={16} color={colors.success} />
              <AppText style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.netProfit.labels.revenue', { defaultValue: 'Revenue' })}
              </AppText>
            </View>
            <AppText style={[styles.comparisonAmount, { color: colors.success }]}>
              {formatCurrency(data.totalRevenue, abbreviateNumbers)}
            </AppText>
          </View>

          <View style={styles.operatorContainer}>
            <Icon name="minus" size={20} color={colors.onSurfaceVariant} />
          </View>

          <View style={[styles.comparisonCard, { backgroundColor: `${colors.error}10`, borderRadius: borderRadius.small }]}>
            <View style={styles.comparisonHeader}>
              <Icon name="arrow-up-bold" size={16} color={colors.error} />
              <AppText style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.netProfit.labels.expenses', { defaultValue: 'Expenses' })}
              </AppText>
            </View>
            <AppText style={[styles.comparisonAmount, { color: colors.error }]}>
              {formatCurrency(data.totalExpenses, abbreviateNumbers)}
            </AppText>
          </View>
        </View>
      )}

      {/* Stats Row */}
      <View style={[styles.statsContainer, { borderTopColor: colors.outlineVariant }]}>
        <View style={styles.statItem}>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.netProfit.labels.transactions', { defaultValue: 'Transactions' })}
          </AppText>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {data.transactionCount}
          </AppText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.netProfit.labels.avgTransaction', { defaultValue: 'Avg. Transaction' })}
          </AppText>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {formatCurrency(data.averageTransaction, abbreviateNumbers)}
          </AppText>
        </View>
      </View>
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
    marginBottom: 16,
    gap: 6,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  mainCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  profitAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  growthText: {
    fontSize: 13,
    fontWeight: '500',
  },
  marginCard: {
    padding: 12,
    marginBottom: 12,
  },
  marginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marginLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  marginValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  comparisonCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  comparisonAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  operatorContainer: {
    paddingHorizontal: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
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
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
