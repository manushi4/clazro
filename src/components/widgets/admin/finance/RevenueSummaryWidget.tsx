import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFinanceSummaryQuery, FinancePeriod } from '../../../../hooks/queries/admin/useFinanceSummaryQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'finance.revenue-summary';

// Format currency with abbreviation
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

type PeriodOption = {
  value: FinancePeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

export const RevenueSummaryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showTotalRevenue = config?.showTotalRevenue !== false;
  const showGrowthPercentage = config?.showGrowthPercentage !== false;
  const showBreakdown = config?.showBreakdown !== false;
  const showComparison = config?.showComparison !== false;
  const defaultPeriod = (config?.defaultPeriod as FinancePeriod) || 'month';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const showViewDetails = config?.showViewDetails !== false;

  const [period, setPeriod] = useState<FinancePeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useFinanceSummaryQuery({ period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { 
      size, 
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: FinancePeriod) => {
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

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.revenueSummary.title', { defaultValue: 'Revenue' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.revenueSummary.states.loading', { defaultValue: 'Loading...' })}
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
            {t('widgets.revenueSummary.title', { defaultValue: 'Revenue' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.revenueSummary.states.error', { defaultValue: 'Failed to load data' })}
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
  if (!data || data.totalRevenue === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.revenueSummary.title', { defaultValue: 'Revenue' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cash-remove" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.revenueSummary.states.empty', { defaultValue: 'No revenue data' })}
          </AppText>
        </View>
      </View>
    );
  }

  const isPositiveGrowth = (data.growth || 0) >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.revenueSummary.title', { defaultValue: 'Revenue' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.revenueSummary.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.revenueSummary.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`widgets.revenueSummary.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.revenueSummary.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Revenue Card */}
      {showTotalRevenue && (
        <View style={[styles.mainCard, { backgroundColor: `${colors.success}15`, borderRadius: borderRadius.medium }]}>
          <AppText style={[styles.revenueAmount, { color: colors.success }]}>
            {formatCurrency(data.totalRevenue, abbreviateNumbers)}
          </AppText>
          
          {showGrowthPercentage && data.growth !== undefined && (
            <View style={styles.growthContainer}>
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
                {Math.abs(data.growth)}% {t(`widgets.revenueSummary.vsLast.${period}`, { defaultValue: `vs last ${period}` })}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Revenue Breakdown */}
      {showBreakdown && data.breakdown && (
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Icon name="school" size={16} color={colors.primary} />
            </View>
            <View style={styles.breakdownContent}>
              <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.revenueSummary.breakdown.fees', { defaultValue: 'Fees' })}
              </AppText>
              <AppText style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {formatCurrency(data.breakdown.fees, abbreviateNumbers)}
              </AppText>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.tertiary}20` }]}>
              <Icon name="star" size={16} color={colors.tertiary} />
            </View>
            <View style={styles.breakdownContent}>
              <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.revenueSummary.breakdown.subscriptions', { defaultValue: 'Subscriptions' })}
              </AppText>
              <AppText style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {formatCurrency(data.breakdown.subscriptions, abbreviateNumbers)}
              </AppText>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownIcon, { backgroundColor: `${colors.warning}20` }]}>
              <Icon name="dots-horizontal" size={16} color={colors.warning} />
            </View>
            <View style={styles.breakdownContent}>
              <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.revenueSummary.breakdown.other', { defaultValue: 'Other' })}
              </AppText>
              <AppText style={[styles.breakdownValue, { color: colors.onSurface }]}>
                {formatCurrency(data.breakdown.other, abbreviateNumbers)}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Comparison Stats */}
      {showComparison && (
        <View style={[styles.comparisonContainer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.comparisonItem}>
            <AppText style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.revenueSummary.pending', { defaultValue: 'Pending' })}
            </AppText>
            <AppText style={[styles.comparisonValue, { color: colors.warning }]}>
              {formatCurrency(data.pendingPayments, abbreviateNumbers)}
            </AppText>
          </View>
          <View style={[styles.comparisonDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.comparisonItem}>
            <AppText style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.revenueSummary.collectionRate', { defaultValue: 'Collection' })}
            </AppText>
            <AppText style={[styles.comparisonValue, { color: colors.success }]}>
              {data.collectionRate}%
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
    marginBottom: 16,
  },
  revenueAmount: {
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
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  breakdownContent: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  comparisonLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
