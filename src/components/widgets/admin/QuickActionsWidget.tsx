import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'admin.quick-actions';

type QuickAction = {
  id: string;
  labelKey: string;
  icon: string;
  colorKey: 'primary' | 'success' | 'warning' | 'error' | 'tertiary' | 'secondary';
  route: string;
  params?: Record<string, unknown>;
};

export const QuickActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const columns = (config?.columns as number) || 2;
  const showLabels = config?.showLabels !== false;
  const showIcons = config?.showIcons !== false;
  const iconSize = (config?.iconSize as 'small' | 'medium' | 'large') || 'medium';
  const style = (config?.style as 'filled' | 'outlined' | 'minimal') || 'filled';

  // Action visibility toggles
  const showAddUser = config?.showAddUser !== false;
  const showReports = config?.showReports !== false;
  const showSettings = config?.showSettings !== false;
  const showAudit = config?.showAudit !== false;

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Color mapping
  const getActionColor = (colorKey: QuickAction['colorKey']) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Icon size mapping
  const getIconSize = () => {
    switch (iconSize) {
      case 'small': return 24;
      case 'large': return 36;
      default: return 28;
    }
  };

  // Define available actions
  const allActions: QuickAction[] = [
    {
      id: 'add-user',
      labelKey: 'widgets.quickActions.addUser',
      icon: 'account-plus',
      colorKey: 'primary',
      route: 'users-create',
    },
    {
      id: 'reports',
      labelKey: 'widgets.quickActions.reports',
      icon: 'file-chart',
      colorKey: 'success',
      route: 'finance-reports',
    },
    {
      id: 'settings',
      labelKey: 'widgets.quickActions.settings',
      icon: 'cog',
      colorKey: 'warning',
      route: 'system-settings',
    },
    {
      id: 'audit',
      labelKey: 'widgets.quickActions.audit',
      icon: 'shield-check',
      colorKey: 'tertiary',
      route: 'audit-logs',
    },
  ];

  // Filter actions based on config
  const visibleActions = allActions.filter(action => {
    switch (action.id) {
      case 'add-user': return showAddUser;
      case 'reports': return showReports;
      case 'settings': return showSettings;
      case 'audit': return showAudit;
      default: return true;
    }
  });

  const handleActionPress = (action: QuickAction) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: action.id, route: action.route });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_action_tap`,
      level: 'info',
      data: { actionId: action.id, route: action.route },
    });

    onNavigate?.(action.route, action.params);
  };

  // Get button styles based on style config
  const getButtonStyle = (actionColor: string) => {
    switch (style) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: actionColor,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default: // filled
        return {
          backgroundColor: `${actionColor}15`,
          borderWidth: 0,
        };
    }
  };

  // Calculate item width based on columns
  const getItemWidth = () => {
    const gap = 12;
    const totalGaps = columns - 1;
    return `${(100 - (totalGaps * gap / 3)) / columns}%`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="lightning-bolt" size={20} color={colors.onSurface} />
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.quickActions.title', { defaultValue: 'Quick Actions' })}
        </AppText>
      </View>

      {/* Actions Grid */}
      <View style={[styles.actionsGrid, { gap: 12 }]}>
        {visibleActions.map((action) => {
          const actionColor = getActionColor(action.colorKey);
          const buttonStyle = getButtonStyle(actionColor);

          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                buttonStyle,
                { 
                  width: getItemWidth(),
                  borderRadius: borderRadius.medium,
                },
              ]}
              onPress={() => handleActionPress(action)}
              accessibilityLabel={t(action.labelKey, { defaultValue: action.id })}
              accessibilityRole="button"
              accessibilityHint={t('widgets.quickActions.actionHint', { 
                action: t(action.labelKey, { defaultValue: action.id }),
                defaultValue: `Tap to ${action.id}` 
              })}
            >
              {showIcons && (
                <View style={[
                  styles.iconContainer, 
                  style === 'filled' && { backgroundColor: `${actionColor}20` },
                  { borderRadius: borderRadius.medium }
                ]}>
                  <Icon 
                    name={action.icon} 
                    size={getIconSize()} 
                    color={actionColor} 
                  />
                </View>
              )}
              {showLabels && (
                <AppText 
                  style={[
                    styles.actionLabel, 
                    { color: style === 'minimal' ? actionColor : colors.onSurface }
                  ]}
                  numberOfLines={1}
                >
                  {t(action.labelKey, { defaultValue: action.id })}
                </AppText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
