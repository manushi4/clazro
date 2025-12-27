import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEngagementQuery, EngagementPeriod } from '../../../../hooks/queries/admin/useEngagementQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { BarChart } from 'react-native-chart-kit';
import { formatDistanceToNow } from 'date-fns';

const WIDGET_ID = 'analytics.engagement';
const SCREEN_WIDTH = Dimensions.get('window').width;

type PeriodOption = {
  value: EngagementPeriod;
  labelKey: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: 'quarter', labelKey: 'quarter' },
];

export const EngagementWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const defaultPeriod = (config?.defaultPeriod as EngagementPeriod) || 'week';
  const showPeriodSelector = config?.showPeriodSelector !== false;
  const showMetricsGrid = config?.showMetricsGrid !== false;
  const showActivityChart = config?.showActivityChart !== false;
  const showTopUsers = config?.showTopUsers !== false;
  const showRoleBreakdown = config?.showRoleBreakdown !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const maxTopUsers = (config?.maxTopUsers as number) || 3;
  const chartHeight = (config?.chartHeight as number) || 160;

  const [period, setPeriod] = useState<EngagementPeriod>(defaultPeriod);

  const { data, isLoading, error, refetch } = useEngagementQuery({ period });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      period,
    });
  }, []);

  // Track period change
  const handlePeriodChange = (newPeriod: EngagementPeriod) => {
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
    onNavigate?.('engagement-detail');
  };

  const handleUserPress = (userId: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'user_tap', userId });
    onNavigate?.('users-detail', { userId });
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
            {t('widgets.engagement.title', { defaultValue: 'Engagement' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.engagement.states.loading', { defaultValue: 'Loading engagement data...' })}
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
            {t('widgets.engagement.title', { defaultValue: 'Engagement' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.engagement.states.error', { defaultValue: 'Failed to load engagement data' })}
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
            {t('widgets.engagement.title', { defaultValue: 'Engagement' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="chart-timeline-variant" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.engagement.states.empty', { defaultValue: 'No engagement data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartWidth = SCREEN_WIDTH - 64;
  const chartLabels = data.activityTrend.map(d => d.label);
  const chartValues = data.activityTrend.map(d => d.value);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.engagement.title', { defaultValue: 'Engagement' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.engagement.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.engagement.viewDetails', { defaultValue: 'View Details' })}
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
              accessibilityLabel={t(`widgets.engagement.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
            >
              <AppText
                style={[
                  styles.periodButtonText,
                  { color: period === option.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`widgets.engagement.periods.${option.labelKey}`, { defaultValue: option.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Metrics Grid */}
      {showMetricsGrid && (
        <View style={styles.metricsGrid}>
          {data.metrics.map((metric) => (
            <View
              key={metric.id}
              style={[styles.metricCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            >
              <View style={styles.metricHeader}>
                <Icon name={metric.icon} size={18} color={getMetricColor(metric.color)} />
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
                {metric.id === 'engagement' || metric.id === 'retention' ? `${metric.value}%` : metric.value}
              </AppText>
              <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                {t(`widgets.engagement.metrics.${metric.id}`, { defaultValue: metric.label })}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* Activity Chart */}
      {showActivityChart && chartValues.length > 0 && (
        <View style={styles.chartSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('widgets.engagement.activityTrend', { defaultValue: 'Activity Trend' })}
          </AppText>
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartValues.length > 0 ? chartValues : [0] }],
            }}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: () => colors.primary,
              labelColor: () => colors.onSurfaceVariant,
              barPercentage: 0.6,
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.outlineVariant,
                strokeWidth: 0.5,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: borderRadius.medium,
            }}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withInnerLines={true}
          />
        </View>
      )}

      {/* Role Breakdown */}
      {showRoleBreakdown && data.engagementByRole.length > 0 && (
        <View style={styles.roleSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('widgets.engagement.byRole', { defaultValue: 'Users by Role' })}
          </AppText>
          <View style={styles.roleList}>
            {data.engagementByRole.map((role, index) => (
              <View key={role.role} style={styles.roleItem}>
                <View style={styles.roleInfo}>
                  <View style={[styles.roleDot, { backgroundColor: index === 0 ? colors.primary : 
                                                                   index === 1 ? colors.success :
                                                                   index === 2 ? colors.tertiary :
                                                                   colors.warning }]} />
                  <AppText style={[styles.roleName, { color: colors.onSurface }]}>
                    {t(`widgets.engagement.roles.${role.role}`, { defaultValue: role.role })}
                  </AppText>
                </View>
                <View style={styles.roleStats}>
                  <AppText style={[styles.roleCount, { color: colors.onSurface }]}>
                    {role.count}
                  </AppText>
                  <AppText style={[styles.rolePercent, { color: colors.onSurfaceVariant }]}>
                    ({role.percentage}%)
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Engaged Users */}
      {showTopUsers && data.topEngagedUsers.length > 0 && (
        <View style={styles.topUsersSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('widgets.engagement.topUsers', { defaultValue: 'Most Active Users' })}
          </AppText>
          {data.topEngagedUsers.slice(0, maxTopUsers).map((user, index) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
              onPress={() => handleUserPress(user.id)}
              accessibilityLabel={`${user.name}, ${user.sessionsCount} sessions`}
              accessibilityRole="button"
            >
              <View style={[styles.userRank, { backgroundColor: index === 0 ? colors.warning : colors.outline }]}>
                <AppText style={[styles.userRankText, { color: index === 0 ? colors.onSurface : colors.surface }]}>
                  {index + 1}
                </AppText>
              </View>
              <View style={styles.userInfo}>
                <AppText style={[styles.userName, { color: colors.onSurface }]} numberOfLines={1}>
                  {user.name}
                </AppText>
                <AppText style={[styles.userLastActive, { color: colors.onSurfaceVariant }]}>
                  {t('widgets.engagement.lastActive', { defaultValue: 'Active' })}{' '}
                  {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                </AppText>
              </View>
              <View style={styles.userSessions}>
                <AppText style={[styles.sessionsCount, { color: colors.primary }]}>
                  {user.sessionsCount}
                </AppText>
                <AppText style={[styles.sessionsLabel, { color: colors.onSurfaceVariant }]}>
                  {t('widgets.engagement.sessions', { defaultValue: 'sessions' })}
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Summary Stats */}
      <View style={[styles.summarySection, { borderTopColor: colors.outlineVariant }]}>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
            {data.avgSessionDuration}m
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.engagement.avgSession', { defaultValue: 'Avg Session' })}
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
            {data.totalSessions}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.engagement.totalSessions', { defaultValue: 'Total Sessions' })}
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: data.churnRate > 20 ? colors.error : colors.success }]}>
            {data.churnRate}%
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.engagement.churnRate', { defaultValue: 'Churn Rate' })}
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
  },
  chartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleSection: {
    marginBottom: 16,
  },
  roleList: {
    gap: 8,
  },
  roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleName: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  roleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  rolePercent: {
    fontSize: 11,
  },
  topUsersSection: {
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  userRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
  },
  userLastActive: {
    fontSize: 10,
    marginTop: 2,
  },
  userSessions: {
    alignItems: 'flex-end',
  },
  sessionsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionsLabel: {
    fontSize: 9,
  },
  summarySection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
