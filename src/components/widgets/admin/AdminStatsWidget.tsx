import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAdminDashboardQuery } from '../../../hooks/queries/admin';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'admin.stats-grid';

// Format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

type StatItem = {
  id: string;
  icon: string;
  value: string;
  label: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  color: string;
  screen: string;
};

export const AdminStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  const { data, isLoading, error } = useAdminDashboardQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const showTotalUsers = config?.showTotalUsers !== false;
  const showActiveUsers = config?.showActiveUsers !== false;
  const showTotalRevenue = config?.showTotalRevenue !== false;
  const showSystemAlerts = config?.showSystemAlerts !== false;
  const columns = (config?.columns as 2 | 3 | 4) || 2;
  const showIcons = config?.showIcons !== false;
  const showTrend = config?.showTrend !== false;
  const enableTap = config?.enableTap !== false;

  // Build stats array based on config
  const stats: StatItem[] = [];

  if (showTotalUsers) {
    stats.push({
      id: 'users',
      icon: 'account-group',
      value: formatNumber(data?.totalUsers || 0),
      label: t('widgets.adminStats.totalUsers', { defaultValue: 'Total Users' }),
      trend: data?.usersTrend,
      trendDirection: (data?.usersTrend || 0) >= 0 ? 'up' : 'down',
      color: colors.primary,
      screen: 'users-management',
    });
  }

  if (showActiveUsers) {
    stats.push({
      id: 'active',
      icon: 'account-check',
      value: formatNumber(data?.activeUsers || 0),
      label: t('widgets.adminStats.activeUsers', { defaultValue: 'Active Users' }),
      trendDirection: 'neutral',
      color: colors.success,
      screen: 'users-management',
    });
  }

  if (showTotalRevenue) {
    stats.push({
      id: 'revenue',
      icon: 'currency-inr',
      value: formatCurrency(data?.revenue || 0),
      label: t('widgets.adminStats.revenue', { defaultValue: 'Revenue' }),
      trend: data?.revenueTrend,
      trendDirection: (data?.revenueTrend || 0) >= 0 ? 'up' : 'down',
      color: colors.warning,
      screen: 'finance-dashboard',
    });
  }

  if (showSystemAlerts) {
    stats.push({
      id: 'alerts',
      icon: 'alert-circle',
      value: (data?.alertCount || 0).toString(),
      label: t('widgets.adminStats.alerts', { defaultValue: 'Alerts' }),
      trendDirection: 'neutral',
      color: (data?.alertCount || 0) > 0 ? colors.error : colors.outline,
      screen: 'system-monitoring',
    });
  }

  const handleStatPress = (stat: StatItem) => {
    if (!enableTap) return;
    
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'stat_tap', stat: stat.id });
    addBreadcrumb({ 
      category: 'widget', 
      message: `${WIDGET_ID}_stat_tap`, 
      level: 'info', 
      data: { stat: stat.id } 
    });
    
    onNavigate?.(stat.screen);
  };

  const renderTrend = (stat: StatItem) => {
    if (!showTrend || stat.trend === undefined) return null;

    const isPositive = stat.trendDirection === 'up';
    const trendColor = isPositive ? colors.success : colors.error;
    const trendIcon = isPositive ? 'trending-up' : 'trending-down';

    return (
      <View style={styles.trendContainer}>
        <Icon name={trendIcon} size={12} color={trendColor} />
        <AppText style={[styles.trendText, { color: trendColor }]}>
          {Math.abs(stat.trend).toFixed(1)}%
        </AppText>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const gridColumns = size === 'compact' ? 2 : columns;
  const itemWidth = `${100 / gridColumns}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.adminStats.title', { defaultValue: 'Platform Stats' })}
        </AppText>
      </View>

      {/* Stats Grid */}
      <View style={[styles.grid, { flexWrap: 'wrap' }]}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[
              styles.statCard,
              { 
                width: itemWidth,
                backgroundColor: `${stat.color}10`,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => handleStatPress(stat)}
            disabled={!enableTap}
            accessibilityLabel={t('widgets.adminStats.statHint', { 
              label: stat.label, 
              value: stat.value,
              defaultValue: `${stat.label}: ${stat.value}` 
            })}
            accessibilityRole="button"
          >
            {showIcons && (
              <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Icon name={stat.icon} size={20} color={stat.color} />
              </View>
            )}
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {stat.value}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {stat.label}
            </AppText>
            {renderTrend(stat)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  statCard: {
    padding: 12,
    margin: 4,
    alignItems: 'center',
    minHeight: 100,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
