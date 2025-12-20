import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlertsQuery, useAcknowledgeAlert } from '../../../hooks/queries/admin';
import type { SystemAlert, AlertSeverity } from '../../../hooks/queries/admin/useAlertsQuery';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'admin.alerts';

// Format relative time
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const AlertsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const maxItems = (config?.maxItems as number) || 5;
  const severityFilter = (config?.severityFilter as AlertSeverity | 'all') || 'all';
  const showAcknowledged = config?.showAcknowledged === true;
  const showSeverity = config?.showSeverity !== false;
  const showTime = config?.showTime !== false;
  const showSource = config?.showSource !== false;
  const showAcknowledge = config?.showAcknowledge !== false;
  const showViewAll = config?.showViewAll !== false;
  const showDismiss = config?.showDismiss === true;
  const enableTap = config?.enableTap !== false;

  const { data: alerts, isLoading, error, refetch } = useAlertsQuery({
    limit: maxItems,
    severity: severityFilter,
    showAcknowledged,
  });

  const { mutate: acknowledgeAlert, isPending: isAcknowledging } = useAcknowledgeAlert();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Severity configuration
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return { color: colors.error, icon: 'alert-circle', label: t('widgets.alerts.severity.critical', { defaultValue: 'Critical' }) };
      case 'warning':
        return { color: colors.warning, icon: 'alert', label: t('widgets.alerts.severity.warning', { defaultValue: 'Warning' }) };
      case 'info':
      default:
        return { color: colors.primary, icon: 'information', label: t('widgets.alerts.severity.info', { defaultValue: 'Info' }) };
    }
  };

  const handleAlertPress = (alert: SystemAlert) => {
    if (!enableTap) return;
    
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'alert_tap', alertId: alert.id, severity: alert.severity });
    addBreadcrumb({ 
      category: 'widget', 
      message: `${WIDGET_ID}_alert_tap`, 
      level: 'info', 
      data: { alertId: alert.id, severity: alert.severity } 
    });
    
    onNavigate?.('alert-detail', { alertId: alert.id });
  };

  const handleAcknowledge = (alertId: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'acknowledge', alertId });
    addBreadcrumb({ 
      category: 'widget', 
      message: `${WIDGET_ID}_acknowledge`, 
      level: 'info', 
      data: { alertId } 
    });
    
    acknowledgeAlert(alertId);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_view_all`, level: 'info' });
    onNavigate?.('alerts-list');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const hasAlerts = alerts && alerts.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="bell-alert" size={20} color={colors.onSurface} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.alerts.title', { defaultValue: 'Alerts' })}
          </AppText>
          {hasAlerts && (
            <View style={[styles.countBadge, { backgroundColor: colors.error }]}>
              <AppText style={[styles.countText, { color: colors.onError }]}>
                {alerts.length}
              </AppText>
            </View>
          )}
        </View>
        {showViewAll && (
          <TouchableOpacity onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t('widgets.alerts.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Alerts List */}
      {hasAlerts ? (
        <View style={styles.alertsList}>
          {alerts.map((alert, index) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const isLast = index === alerts.length - 1;

            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertItem,
                  alert.acknowledged && styles.acknowledgedItem,
                  !isLast && styles.alertItemBorder,
                  { borderBottomColor: `${colors.outline}20` },
                ]}
                onPress={() => handleAlertPress(alert)}
                disabled={!enableTap}
                accessibilityLabel={t('widgets.alerts.alertHint', { 
                  title: alert.title, 
                  severity: severityConfig.label,
                  defaultValue: `${severityConfig.label} alert: ${alert.title}` 
                })}
                accessibilityRole="button"
              >
                {/* Severity Indicator */}
                <View style={[styles.severityIndicator, { backgroundColor: severityConfig.color }]} />

                {/* Alert Content */}
                <View style={styles.alertContent}>
                  {/* Header Row */}
                  <View style={styles.alertHeader}>
                    {showSeverity && (
                      <Icon name={severityConfig.icon} size={16} color={severityConfig.color} />
                    )}
                    <AppText 
                      style={[styles.alertTitle, { color: colors.onSurface }]} 
                      numberOfLines={1}
                    >
                      {alert.title}
                    </AppText>
                    {showSource && (
                      <View style={[styles.sourceChip, { backgroundColor: `${colors.outline}20` }]}>
                        <AppText style={[styles.sourceText, { color: colors.onSurfaceVariant }]}>
                          {alert.source}
                        </AppText>
                      </View>
                    )}
                  </View>

                  {/* Message */}
                  <AppText 
                    style={[styles.alertMessage, { color: colors.onSurfaceVariant }]} 
                    numberOfLines={2}
                  >
                    {alert.message}
                  </AppText>

                  {/* Time */}
                  {showTime && (
                    <AppText style={[styles.alertTime, { color: colors.outline }]}>
                      {formatTimeAgo(alert.created_at)}
                    </AppText>
                  )}
                </View>

                {/* Acknowledge Button */}
                {showAcknowledge && !alert.acknowledged && (
                  <TouchableOpacity
                    style={[styles.acknowledgeButton, { backgroundColor: `${colors.success}15` }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAcknowledge(alert.id);
                    }}
                    disabled={isAcknowledging}
                    accessibilityLabel={t('widgets.alerts.acknowledgeHint', { defaultValue: 'Acknowledge alert' })}
                    accessibilityRole="button"
                  >
                    <Icon name="check" size={18} color={colors.success} />
                  </TouchableOpacity>
                )}

                {/* Acknowledged Badge */}
                {alert.acknowledged && (
                  <View style={[styles.acknowledgedBadge, { backgroundColor: `${colors.success}15` }]}>
                    <Icon name="check-circle" size={14} color={colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Icon name="check-circle-outline" size={48} color={colors.success} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t('widgets.alerts.empty.title', { defaultValue: 'All Clear!' })}
          </AppText>
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.alerts.empty.message', { defaultValue: 'No alerts at this time' })}
          </AppText>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
  alertsList: {
    gap: 0,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  alertItemBorder: {
    borderBottomWidth: 1,
  },
  acknowledgedItem: {
    opacity: 0.6,
  },
  severityIndicator: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  alertContent: {
    flex: 1,
    gap: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  sourceChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: 11,
    marginTop: 2,
  },
  acknowledgeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  acknowledgedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
