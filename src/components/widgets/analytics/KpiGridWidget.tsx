import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { getLocalizedField } from '../../../utils/getLocalizedField';
import { AppText } from '../../../ui/components/AppText';
import { useKpiMetricsQuery } from '../../../hooks/queries/admin/useKpiMetricsQuery';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'analytics.kpi-grid';

// Format value based on format type
const formatValue = (value: number, formatType: string, unit?: string): string => {
  switch (formatType) {
    case 'currency':
      // Format Indian currency
      if (value >= 10000000) {
        return `${unit || '₹'}${(value / 10000000).toFixed(1)}Cr`;
      }
      if (value >= 100000) {
        return `${unit || '₹'}${(value / 100000).toFixed(1)}L`;
      }
      if (value >= 1000) {
        return `${unit || '₹'}${(value / 1000).toFixed(1)}K`;
      }
      return `${unit || '₹'}${value.toLocaleString('en-IN')}`;

    case 'percentage':
      return `${value.toFixed(1)}${unit || '%'}`;

    case 'duration':
      // Format as hours if > 60 minutes
      if (value >= 60) {
        return `${(value / 60).toFixed(1)}h`;
      }
      return `${value}${unit || 'm'}`;

    case 'number':
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return `${Math.round(value)}${unit || ''}`;
  }
};

// Calculate growth percentage
const calculateGrowth = (current: number, previous?: number): number | null => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

export const KpiGridWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation('dashboard');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const columns = (config?.columns as number) || 2;
  const category = config?.category as string | undefined;
  const metricKeys = config?.metricKeys as string[] | undefined;
  const role = config?.role as string | undefined;
  const showTrend = config?.showTrend !== false;
  const showGrowth = config?.showGrowth !== false;
  const showIcon = config?.showIcon !== false;
  const limit = (config?.limit as number) || 6;

  // Data fetching
  const { data, isLoading, error, refetch } = useKpiMetricsQuery({
    category,
    metricKeys,
    role,
    limit,
  });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      category,
      metricsCount: data?.length || 0,
    });
  }, []);

  const handleMetricPress = (metricCategory: string, metricKey: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'metric_press', metricKey, category: metricCategory });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_metric_press`,
      level: 'info',
      data: { metricKey, metricCategory },
    });

    // First check metric_key for specific routing (more precise than category)
    const keyLower = metricKey.toLowerCase();
    const catLower = metricCategory.toLowerCase();

    // Attendance metrics
    if (keyLower.includes('attendance') || catLower === 'attendance') {
      onNavigate?.('attendance-analytics');
      return;
    }
    // Grade/Academic metrics (grades, exams, tests, results, homework, assignments)
    if (keyLower.includes('grade') || keyLower.includes('academic') || keyLower.includes('score') ||
        keyLower.includes('marks') || keyLower.includes('exam') || keyLower.includes('test') ||
        keyLower.includes('result') || keyLower.includes('homework') || keyLower.includes('assignment') ||
        catLower === 'grade' || catLower === 'grades' || catLower === 'academic') {
      onNavigate?.('grade-analytics');
      return;
    }
    // Pending work metrics (tasks, pending items, work)
    if (keyLower.includes('pending') && (keyLower.includes('work') || keyLower.includes('task') || keyLower.includes('assignment'))) {
      onNavigate?.('pending-work-analytics'); // Pending work has its own screen
      return;
    }
    // Standalone "pending" or "work" keywords
    if (keyLower.includes('pending_work') || keyLower.includes('pendingwork') ||
        (keyLower.includes('work') && !keyLower.includes('homework'))) {
      onNavigate?.('pending-work-analytics');
      return;
    }
    // Session metrics
    if (keyLower.includes('session') || keyLower.includes('duration') || catLower === 'sessions') {
      onNavigate?.('sessions-analytics');
      return;
    }
    // User metrics
    if (keyLower.includes('student') || keyLower.includes('teacher') || keyLower.includes('parent') ||
        keyLower.includes('user') || catLower === 'users') {
      onNavigate?.('user-analytics');
      return;
    }
    // Revenue/Finance metrics
    if (keyLower.includes('revenue') || keyLower.includes('fee') || keyLower.includes('payment') ||
        keyLower.includes('income') || keyLower.includes('expense') || keyLower.includes('pending_fee') ||
        catLower === 'finance' || catLower === 'revenue') {
      onNavigate?.('revenue-analytics');
      return;
    }
    // Content metrics
    if (keyLower.includes('content') || keyLower.includes('view') || keyLower.includes('course') ||
        catLower === 'content') {
      onNavigate?.('content-analytics');
      return;
    }
    // Engagement metrics (catch remaining engagement items)
    if (catLower === 'engagement') {
      onNavigate?.('engagement-detail');
      return;
    }

    // Fallback to category-based routing
    const screenMap: Record<string, string> = {
      users: 'user-analytics',           // User Analytics Screen
      revenue: 'revenue-analytics',      // Revenue Analytics Screen
      finance: 'revenue-analytics',      // Finance also goes to Revenue Analytics
      engagement: 'engagement-detail',   // Engagement Analytics Screen
      growth: 'growth-detail',           // Growth Analytics Screen
      trends: 'trends-detail',           // Trends Analytics Screen
      content: 'content-analytics',      // Content Analytics Screen
      sessions: 'sessions-analytics',    // Sessions Analytics Screen
      activity: 'sessions-analytics',    // Activity goes to Sessions
      performance: 'trends-detail',      // Performance goes to Trends
      attendance: 'attendance-analytics', // Attendance Analytics Screen
      grade: 'grade-analytics',          // Grade/Academic Analytics Screen
      grades: 'grade-analytics',         // Alias for grades
      academic: 'grade-analytics',       // Academic also goes to Grade Analytics
      work: 'pending-work-analytics',     // Work/tasks goes to Pending Work
      pending: 'pending-work-analytics', // Pending items goes to Pending Work
      homework: 'grade-analytics',       // Homework goes to Academic
      assignments: 'grade-analytics',    // Assignments goes to Academic
      exams: 'grade-analytics',          // Exams goes to Academic
      tests: 'grade-analytics',          // Tests goes to Academic
    };
    // Use the actual category from the metric
    onNavigate?.(screenMap[metricCategory] || 'trends-detail');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.kpiGrid.states.loading', { defaultValue: 'Loading metrics...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.kpiGrid.states.error', { defaultValue: 'Failed to load metrics' })}
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
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.emptyContainer}>
          <Icon name="chart-box-outline" size={64} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.kpiGrid.states.empty', { defaultValue: 'No metrics available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Success state - render KPI grid
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      <View style={[styles.grid, { gap: 12 }]}>
        {data.map((metric) => {
          const growth = calculateGrowth(metric.value, metric.previous_value);
          const isPositiveGrowth = growth !== null && growth >= 0;
          const metricColor = metric.color || colors.primary;

          return (
            <TouchableOpacity
              key={metric.id}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: borderRadius.medium,
                  width: columns === 1 ? '100%' : columns === 2 ? '48%' : '31%',
                },
              ]}
              onPress={() => handleMetricPress(metric.category, metric.metric_key)}
              accessibilityRole="button"
              accessibilityLabel={`${getLocalizedField(metric, 'label')}: ${formatValue(metric.value, metric.format_type, metric.unit)}`}
            >
              {/* Icon */}
              {showIcon && metric.icon && (
                <View style={[styles.iconContainer, { backgroundColor: `${metricColor}15` }]}>
                  <Icon name={metric.icon} size={24} color={metricColor} />
                </View>
              )}

              {/* Label */}
              <AppText style={[styles.label, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {i18n.language === 'hi' && metric.label_hi ? metric.label_hi : metric.label_en}
              </AppText>

              {/* Value */}
              <AppText style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                {formatValue(metric.value, metric.format_type, metric.unit)}
              </AppText>

              {/* Trend Indicator */}
              {showTrend && metric.trend && (
                <View style={styles.trendContainer}>
                  <Icon
                    name={
                      metric.trend === 'up'
                        ? 'trending-up'
                        : metric.trend === 'down'
                        ? 'trending-down'
                        : 'trending-neutral'
                    }
                    size={16}
                    color={
                      metric.trend === 'up'
                        ? colors.success
                        : metric.trend === 'down'
                        ? colors.error
                        : colors.onSurfaceVariant
                    }
                  />
                  {showGrowth && growth !== null && (
                    <AppText
                      style={[
                        styles.growthText,
                        {
                          color:
                            metric.trend === 'up'
                              ? colors.success
                              : metric.trend === 'down'
                              ? colors.error
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {isPositiveGrowth ? '+' : ''}
                      {growth.toFixed(1)}%
                    </AppText>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    padding: 16,
    gap: 8,
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
