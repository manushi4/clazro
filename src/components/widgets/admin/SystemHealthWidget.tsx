import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSystemHealthQuery } from '../../../hooks/queries/admin';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'admin.system-health';

type HealthMetric = {
  id: string;
  icon: string;
  label: string;
  value: number;
  unit: string;
  showProgressBar: boolean;
};

export const SystemHealthWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  const { data, isLoading, error, refetch } = useSystemHealthQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const showUptime = config?.showUptime !== false;
  const showActiveUsers = config?.showActiveUsers !== false;
  const showServerLoad = config?.showServerLoad !== false; // CPU
  const showApiStatus = config?.showApiStatus !== false; // Memory
  const warningThreshold = (config?.warningThreshold as number) || 70;
  const criticalThreshold = (config?.criticalThreshold as number) || 90;
  const autoRefresh = config?.autoRefresh !== false;
  const showDetailsLink = config?.showDetailsLink !== false;

  // Get status color based on value and thresholds
  const getStatusColor = (value: number, inverted = false): string => {
    const effectiveValue = inverted ? 100 - value : value;
    if (effectiveValue >= criticalThreshold) return colors.error;
    if (effectiveValue >= warningThreshold) return colors.warning;
    return colors.success;
  };

  // Get overall status color
  const getOverallStatusColor = (): string => {
    if (!data) return colors.outline;
    switch (data.status) {
      case 'critical': return colors.error;
      case 'warning': return colors.warning;
      case 'healthy': return colors.success;
      default: return colors.outline;
    }
  };

  // Get status label
  const getStatusLabel = (): string => {
    if (!data) return t('widgets.systemHealth.status.unknown', { defaultValue: 'Unknown' });
    switch (data.status) {
      case 'critical': return t('widgets.systemHealth.status.critical', { defaultValue: 'Critical' });
      case 'warning': return t('widgets.systemHealth.status.warning', { defaultValue: 'Warning' });
      case 'healthy': return t('widgets.systemHealth.status.healthy', { defaultValue: 'Healthy' });
      default: return t('widgets.systemHealth.status.unknown', { defaultValue: 'Unknown' });
    }
  };

  const handleDetailsPress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_details' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_details_tap`, level: 'info' });
    onNavigate?.('system-monitoring');
  };

  const handleRefresh = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'refresh' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_refresh_tap`, level: 'info' });
    refetch();
  };

  // Build metrics array based on config
  const metrics: HealthMetric[] = [];

  if (showUptime && data) {
    metrics.push({
      id: 'uptime',
      icon: 'clock-check-outline',
      label: t('widgets.systemHealth.metrics.uptime', { defaultValue: 'Uptime' }),
      value: data.uptime,
      unit: '%',
      showProgressBar: true,
    });
  }

  if (showServerLoad && data) {
    metrics.push({
      id: 'cpu',
      icon: 'cpu-64-bit',
      label: t('widgets.systemHealth.metrics.cpu', { defaultValue: 'CPU' }),
      value: data.cpuUsage,
      unit: '%',
      showProgressBar: true,
    });
  }

  if (showApiStatus && data) {
    metrics.push({
      id: 'memory',
      icon: 'memory',
      label: t('widgets.systemHealth.metrics.memory', { defaultValue: 'Memory' }),
      value: data.memoryUsage,
      unit: '%',
      showProgressBar: true,
    });
  }

  if (showActiveUsers && data) {
    metrics.push({
      id: 'activeUsers',
      icon: 'account-multiple',
      label: t('widgets.systemHealth.metrics.activeUsers', { defaultValue: 'Active Users' }),
      value: data.activeUsers,
      unit: '',
      showProgressBar: false,
    });
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header with Status Banner */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.systemHealth.title', { defaultValue: 'System Health' })}
          </AppText>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.refreshButton, { backgroundColor: `${colors.primary}15` }]}
            accessibilityLabel={t('widgets.systemHealth.refreshHint', { defaultValue: 'Refresh system health' })}
            accessibilityRole="button"
          >
            <Icon name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${getOverallStatusColor()}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getOverallStatusColor() }]} />
          <AppText style={[styles.statusText, { color: getOverallStatusColor() }]}>
            {getStatusLabel()}
          </AppText>
          {data?.lastChecked && (
            <AppText style={[styles.lastChecked, { color: colors.onSurfaceVariant }]}>
              {t('widgets.systemHealth.lastChecked', { 
                time: new Date(data.lastChecked).toLocaleTimeString(),
                defaultValue: `Last checked: ${new Date(data.lastChecked).toLocaleTimeString()}`
              })}
            </AppText>
          )}
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {metrics.map((metric) => {
          const metricColor = metric.id === 'uptime' 
            ? getStatusColor(metric.value, true) // Uptime: higher is better
            : metric.id === 'activeUsers'
              ? colors.primary
              : getStatusColor(metric.value); // CPU/Memory: lower is better

          return (
            <View 
              key={metric.id} 
              style={[styles.metricCard, { backgroundColor: `${metricColor}10`, borderRadius: borderRadius.medium }]}
            >
              <View style={styles.metricHeader}>
                <Icon name={metric.icon} size={20} color={metricColor} />
                <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                  {metric.label}
                </AppText>
              </View>
              
              <AppText style={[styles.metricValue, { color: colors.onSurface }]}>
                {metric.value}{metric.unit}
              </AppText>

              {metric.showProgressBar && (
                <View style={[styles.progressBarBg, { backgroundColor: `${colors.outline}30` }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: metricColor,
                        width: `${Math.min(metric.value, 100)}%`,
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Details Link */}
      {showDetailsLink && size !== 'compact' && (
        <TouchableOpacity
          style={[styles.detailsLink, { borderTopColor: `${colors.outline}30` }]}
          onPress={handleDetailsPress}
          accessibilityLabel={t('widgets.systemHealth.viewDetailsHint', { defaultValue: 'View system monitoring details' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.detailsText, { color: colors.primary }]}>
            {t('widgets.systemHealth.viewDetails', { defaultValue: 'View Details' })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastChecked: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metricCard: {
    width: '48%',
    margin: '1%',
    padding: 12,
    minHeight: 90,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
