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

const WIDGET_ID = 'finance.collection-rate';

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
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

export const CollectionRateWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showProgressBar = config?.showProgressBar !== false;
  const showAmounts = config?.showAmounts !== false;
  const showTrendIndicator = config?.showTrendIndicator !== false;
  const defaultPeriod = (config?.defaultPeriod as FinancePeriod) || 'month';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const thresholdGood = (config?.thresholdGood as number) || 80;
  const thresholdWarning = (config?.thresholdWarning as number) || 60;

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

  // Get color based on collection rate threshold
  const getRateColor = (rate: number) => {
    if (rate >= thresholdGood) return colors.success;
    if (rate >= thresholdWarning) return colors.warning;
    return colors.error;
  };

  // Get status label based on rate
  const getRateStatus = (rate: number) => {
    if (rate >= thresholdGood) return t('widgets.collectionRate.status.excellent', { defaultValue: 'Excellent' });
    if (rate >= thresholdWarning) return t('widgets.collectionRate.status.moderate', { defaultValue: 'Moderate' });
    return t('widgets.collectionRate.status.needsAttention', { defaultValue: 'Needs Attention' });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.collectionRate.title', { defaultValue: 'Collection Rate' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.collectionRate.states.loading', { defaultValue: 'Loading...' })}
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
            {t('widgets.collectionRate.title', { defaultValue: 'Collection Rate' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.collectionRate.states.error', { defaultValue: 'Failed to load data' })}
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
  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.collectionRate.title', { defaultValue: 'Collection Rate' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="percent-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.collectionRate.states.empty', { defaultValue: 'No collection data' })}
          </AppText>
        </View>
      </View>
    );
  }

  const collectionRate = data.collectionRate || 0;
  const rateColor = getRateColor(collectionRate);
  const totalExpected = data.totalRevenue + data.pendingPayments;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.collectionRate.title', { defaultValue: 'Collection Rate' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.collectionRate.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.collectionRate.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`widgets.collectionRate.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.collectionRate.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Rate Display */}
      <View style={[styles.mainCard, { backgroundColor: `${rateColor}15`, borderRadius: borderRadius.medium }]}>
        <View style={styles.rateContainer}>
          <AppText style={[styles.rateValue, { color: rateColor }]}>
            {collectionRate}%
          </AppText>
          {showTrendIndicator && (
            <View style={[styles.statusBadge, { backgroundColor: `${rateColor}20` }]}>
              <Icon
                name={collectionRate >= thresholdGood ? 'check-circle' : collectionRate >= thresholdWarning ? 'alert-circle' : 'alert'}
                size={14}
                color={rateColor}
              />
              <AppText style={[styles.statusText, { color: rateColor }]}>
                {getRateStatus(collectionRate)}
              </AppText>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {showProgressBar && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, { backgroundColor: `${rateColor}20` }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: rateColor,
                    width: `${Math.min(collectionRate, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Amount Breakdown */}
      {showAmounts && (
        <View style={[styles.amountsContainer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.amountItem}>
            <View style={[styles.amountIcon, { backgroundColor: `${colors.success}20` }]}>
              <Icon name="check" size={14} color={colors.success} />
            </View>
            <View style={styles.amountContent}>
              <AppText style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.collectionRate.labels.collected', { defaultValue: 'Collected' })}
              </AppText>
              <AppText style={[styles.amountValue, { color: colors.success }]}>
                {formatCurrency(data.totalRevenue, abbreviateNumbers)}
              </AppText>
            </View>
          </View>

          <View style={[styles.amountDivider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.amountItem}>
            <View style={[styles.amountIcon, { backgroundColor: `${colors.warning}20` }]}>
              <Icon name="clock-outline" size={14} color={colors.warning} />
            </View>
            <View style={styles.amountContent}>
              <AppText style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.collectionRate.labels.pending', { defaultValue: 'Pending' })}
              </AppText>
              <AppText style={[styles.amountValue, { color: colors.warning }]}>
                {formatCurrency(data.pendingPayments, abbreviateNumbers)}
              </AppText>
            </View>
          </View>

          <View style={[styles.amountDivider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.amountItem}>
            <View style={[styles.amountIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Icon name="sigma" size={14} color={colors.primary} />
            </View>
            <View style={styles.amountContent}>
              <AppText style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.collectionRate.labels.total', { defaultValue: 'Total' })}
              </AppText>
              <AppText style={[styles.amountValue, { color: colors.primary }]}>
                {formatCurrency(totalExpected, abbreviateNumbers)}
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
  rateContainer: {
    alignItems: 'center',
  },
  rateValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  amountItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountContent: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountDivider: {
    width: 1,
    marginHorizontal: 8,
  },
});
