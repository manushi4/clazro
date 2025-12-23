import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCategoryBreakdownQuery, CategoryBreakdownPeriod, CategoryBreakdownType, CategoryItem } from '../../../../hooks/queries/admin/useCategoryBreakdownQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { PieChart } from 'react-native-chart-kit';

const WIDGET_ID = 'finance.category-breakdown';
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

// Capitalize first letter
const capitalizeCategory = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
};

type PeriodOption = {
  value: CategoryBreakdownPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
  { value: 'year', labelKey: 'year' },
];

type TypeOption = {
  value: CategoryBreakdownType;
  labelKey: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  { value: 'revenue', labelKey: 'revenue' },
  { value: 'expense', labelKey: 'expense' },
  { value: 'both', labelKey: 'both' },
];

export const CategoryBreakdownWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultPeriod = (config?.defaultPeriod as CategoryBreakdownPeriod) || 'month';
  const defaultType = (config?.defaultType as CategoryBreakdownType) || 'revenue';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showTypeSelector = config?.showTypeSelector !== false;
  const showLegend = config?.showLegend !== false;
  const showPercentages = config?.showPercentages !== false;
  const showTransactionCount = config?.showTransactionCount === true;
  const maxCategories = (config?.maxCategories as number) || 5;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const chartHeight = (config?.chartHeight as number) || 200;

  const [period, setPeriod] = useState<CategoryBreakdownPeriod>(defaultPeriod);
  const [displayType, setDisplayType] = useState<CategoryBreakdownType>(defaultType);

  const { data, isLoading, error, refetch } = useCategoryBreakdownQuery({ period, type: displayType });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
      displayType,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: CategoryBreakdownPeriod) => {
    setPeriod(newPeriod);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'period_change', period: newPeriod });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_period_change`,
      level: 'info',
      data: { period: newPeriod },
    });
  };

  // Track type change
  const handleTypeChange = (newType: CategoryBreakdownType) => {
    setDisplayType(newType);
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'type_change', type: newType });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_type_change`,
      level: 'info',
      data: { type: newType },
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
            {t('widgets.categoryBreakdown.title', { defaultValue: 'Category Breakdown' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.categoryBreakdown.states.loading', { defaultValue: 'Loading breakdown...' })}
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
            {t('widgets.categoryBreakdown.title', { defaultValue: 'Category Breakdown' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.categoryBreakdown.states.error', { defaultValue: 'Failed to load data' })}
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
  const hasRevenueData = data && data.revenueCategories.length > 0;
  const hasExpenseData = data && data.expenseCategories.length > 0;
  const hasData = (displayType === 'revenue' && hasRevenueData) ||
                  (displayType === 'expense' && hasExpenseData) ||
                  (displayType === 'both' && (hasRevenueData || hasExpenseData));

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.categoryBreakdown.title', { defaultValue: 'Category Breakdown' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-pie" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.categoryBreakdown.states.empty', { defaultValue: 'No data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const getChartData = (categories: CategoryItem[]) => {
    return categories.slice(0, maxCategories).map((cat) => ({
      name: capitalizeCategory(cat.category),
      population: cat.amount,
      color: cat.color,
      legendFontColor: colors.onSurface,
      legendFontSize: 10,
    }));
  };

  const chartWidth = SCREEN_WIDTH - 64;

  // Render category legend item
  const renderLegendItem = (item: CategoryItem, index: number) => (
    <View key={item.category} style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
      <View style={styles.legendContent}>
        <AppText style={[styles.legendCategory, { color: colors.onSurface }]} numberOfLines={1}>
          {capitalizeCategory(item.category)}
        </AppText>
        <View style={styles.legendValues}>
          <AppText style={[styles.legendAmount, { color: colors.onSurfaceVariant }]}>
            {formatCurrency(item.amount, abbreviateNumbers)}
          </AppText>
          {showPercentages && (
            <AppText style={[styles.legendPercentage, { color: colors.primary }]}>
              {item.percentage}%
            </AppText>
          )}
          {showTransactionCount && (
            <AppText style={[styles.legendCount, { color: colors.outline }]}>
              ({item.transactionCount})
            </AppText>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.categoryBreakdown.title', { defaultValue: 'Category Breakdown' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.categoryBreakdown.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.categoryBreakdown.viewDetails', { defaultValue: 'View Details' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Period Selector */}
      {showPeriodSelector && (
        <View style={styles.selectorRow}>
          {PERIOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.selectorButton,
                {
                  backgroundColor: period === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handlePeriodChange(option.value)}
              accessibilityLabel={t(`widgets.categoryBreakdown.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.selectorButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.categoryBreakdown.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Type Selector */}
      {showTypeSelector && (
        <View style={styles.selectorRow}>
          {TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.typeButton,
                {
                  backgroundColor: displayType === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handleTypeChange(option.value)}
              accessibilityLabel={t(`widgets.categoryBreakdown.types.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: displayType === option.value }}
            >
              <AppText
                style={[
                  styles.typeButtonText,
                  { color: displayType === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.categoryBreakdown.types.${option.labelKey}`, { defaultValue: capitalizeCategory(option.labelKey) })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Revenue Chart */}
      {(displayType === 'revenue' || displayType === 'both') && hasRevenueData && (
        <View style={styles.chartSection}>
          {displayType === 'both' && (
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('widgets.categoryBreakdown.labels.revenue', { defaultValue: 'Revenue' })}
            </AppText>
          )}
          <View style={styles.chartContainer}>
            <PieChart
              data={getChartData(data!.revenueCategories)}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                color: () => colors.primary,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute={false}
              hasLegend={false}
            />
          </View>
          {showLegend && (
            <View style={styles.legendContainer}>
              {data!.revenueCategories.slice(0, maxCategories).map(renderLegendItem)}
            </View>
          )}
          <View style={[styles.totalRow, { borderTopColor: colors.outlineVariant }]}>
            <AppText style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.categoryBreakdown.labels.totalRevenue', { defaultValue: 'Total Revenue' })}
            </AppText>
            <AppText style={[styles.totalValue, { color: colors.success }]}>
              {formatCurrency(data!.totalRevenue, abbreviateNumbers)}
            </AppText>
          </View>
        </View>
      )}

      {/* Expense Chart */}
      {(displayType === 'expense' || displayType === 'both') && hasExpenseData && (
        <View style={styles.chartSection}>
          {displayType === 'both' && (
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('widgets.categoryBreakdown.labels.expenses', { defaultValue: 'Expenses' })}
            </AppText>
          )}
          <View style={styles.chartContainer}>
            <PieChart
              data={getChartData(data!.expenseCategories)}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                color: () => colors.error,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute={false}
              hasLegend={false}
            />
          </View>
          {showLegend && (
            <View style={styles.legendContainer}>
              {data!.expenseCategories.slice(0, maxCategories).map(renderLegendItem)}
            </View>
          )}
          <View style={[styles.totalRow, { borderTopColor: colors.outlineVariant }]}>
            <AppText style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.categoryBreakdown.labels.totalExpenses', { defaultValue: 'Total Expenses' })}
            </AppText>
            <AppText style={[styles.totalValue, { color: colors.error }]}>
              {formatCurrency(data!.totalExpenses, abbreviateNumbers)}
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
  selectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  selectorButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectorButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  typeButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  legendContainer: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendCategory: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendAmount: {
    fontSize: 12,
  },
  legendPercentage: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendCount: {
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
