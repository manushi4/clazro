/**
 * ExpenseSummaryWidget - Displays expense summary with breakdown
 * 
 * Phase 3: Widget Component (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Features:
 * - Total expenses with growth indicator
 * - Period selector (week, month, quarter, year)
 * - Category breakdown (salary, utilities, materials, other)
 * - Pending expenses indicator
 * - Theme-aware colors (no hardcoded colors)
 * - Localized content support
 * - Loading, error, and empty states
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  useExpenseSummaryQuery, 
  ExpensePeriod,
  ExpenseCategory 
} from '../../../../hooks/queries/admin/useExpenseSummaryQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'finance.expense-summary';

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
  value: ExpensePeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

/**
 * Category configuration for display
 */
type CategoryConfig = {
  key: ExpenseCategory;
  labelKey: string;
  icon: string;
};

const EXPENSE_CATEGORIES: CategoryConfig[] = [
  { key: 'salary', labelKey: 'salary', icon: 'account-cash' },
  { key: 'utilities', labelKey: 'utilities', icon: 'lightning-bolt' },
  { key: 'materials', labelKey: 'materials', icon: 'package-variant' },
  { key: 'other', labelKey: 'other', icon: 'dots-horizontal' },
];

export const ExpenseSummaryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(['admin', 'common']);
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showTotalExpenses = config?.showTotalExpenses !== false;
  const showGrowthPercentage = config?.showGrowthPercentage !== false;
  const showBreakdown = config?.showBreakdown !== false;
  const showPendingExpenses = config?.showPendingExpenses !== false;
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const defaultPeriod = (config?.defaultPeriod as ExpensePeriod) || 'month';

  // State for period selection
  const [period, setPeriod] = useState<ExpensePeriod>(defaultPeriod);

  // Fetch expense data
  const { data, isLoading, error, refetch } = useExpenseSummaryQuery({ period });

  // Category colors using theme
  const getCategoryColor = (category: ExpenseCategory): string => {
    const categoryColors: Record<ExpenseCategory, string> = {
      salary: colors.primary,
      utilities: colors.tertiary,
      materials: colors.secondary,
      other: colors.outline,
    };
    return categoryColors[category] || colors.outline;
  };

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: ExpensePeriod) => {
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
            {t('admin:widgets.expenseSummary.title', { defaultValue: 'Expenses' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.expenseSummary.states.loading', { defaultValue: 'Loading...' })}
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
            {t('admin:widgets.expenseSummary.title', { defaultValue: 'Expenses' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('admin:widgets.expenseSummary.states.error', { defaultValue: 'Failed to load data' })}
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
  if (!data || data.totalExpenses === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.expenseSummary.title', { defaultValue: 'Expenses' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cash-remove" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.expenseSummary.states.empty', { defaultValue: 'No expense data' })}
          </AppText>
        </View>
      </View>
    );
  }

  // For expenses, positive growth means more spending (which is typically negative)
  const isIncreased = (data.growth || 0) > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('admin:widgets.expenseSummary.title', { defaultValue: 'Expenses' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('admin:widgets.expenseSummary.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('admin:widgets.expenseSummary.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`admin:widgets.expenseSummary.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`admin:widgets.expenseSummary.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Expense Card */}
      {showTotalExpenses && (
        <View style={[styles.mainCard, { backgroundColor: `${colors.error}15`, borderRadius: borderRadius.medium }]}>
          <View style={styles.mainCardHeader}>
            <Icon name="cash-minus" size={24} color={colors.error} />
            <AppText style={[styles.mainCardLabel, { color: colors.error }]}>
              {t('admin:widgets.expenseSummary.totalExpenses', { defaultValue: 'Total Expenses' })}
            </AppText>
          </View>

          <AppText style={[styles.expenseAmount, { color: colors.error }]}>
            {formatCurrency(data.totalExpenses, abbreviateNumbers)}
          </AppText>

          {/* Growth Indicator */}
          {showGrowthPercentage && data.growth !== undefined && (
            <View style={styles.growthContainer}>
              <Icon
                name={isIncreased ? 'trending-up' : 'trending-down'}
                size={16}
                color={isIncreased ? colors.error : colors.success}
              />
              <AppText
                style={[
                  styles.growthText,
                  { color: isIncreased ? colors.error : colors.success },
                ]}
              >
                {Math.abs(data.growth)}% {t(`admin:widgets.expenseSummary.vsLast.${period}`, { defaultValue: `vs last ${period}` })}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Expense Breakdown */}
      {showBreakdown && data.breakdown && (
        <View style={styles.breakdownContainer}>
          {EXPENSE_CATEGORIES.map((category) => {
            const amount = data.breakdown[category.key];
            const percentage = data.totalExpenses > 0 
              ? Math.round((amount / data.totalExpenses) * 100) 
              : 0;
            const categoryColor = getCategoryColor(category.key);

            return (
              <View key={category.key} style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: `${categoryColor}20` }]}>
                  <Icon name={category.icon} size={16} color={categoryColor} />
                </View>
                <View style={styles.breakdownContent}>
                  <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                    {t(`admin:widgets.expenseSummary.categories.${category.labelKey}`, { defaultValue: category.labelKey })}
                  </AppText>
                  <AppText style={[styles.breakdownValue, { color: colors.onSurface }]}>
                    {formatCurrency(amount, abbreviateNumbers)}
                  </AppText>
                  <AppText style={[styles.breakdownPercentage, { color: colors.onSurfaceVariant }]}>
                    {percentage}%
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pending Expenses & Stats */}
      {showPendingExpenses && (
        <View style={[styles.statsContainer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('admin:widgets.expenseSummary.pending', { defaultValue: 'Pending' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.warning }]}>
              {formatCurrency(data.pendingExpenses, abbreviateNumbers)}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('admin:widgets.expenseSummary.transactions', { defaultValue: 'Transactions' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.transactionCount}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('admin:widgets.expenseSummary.average', { defaultValue: 'Average' })}
            </AppText>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {formatCurrency(data.averageExpense, abbreviateNumbers)}
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
    padding: 16,
    marginBottom: 16,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mainCardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownPercentage: {
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExpenseSummaryWidget;
