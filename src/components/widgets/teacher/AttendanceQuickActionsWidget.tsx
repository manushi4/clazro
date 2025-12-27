import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';

type QuickAction = {
  id: string;
  icon: string;
  labelKey: string;
  defaultLabel: string;
  route: string;
  color: string;
  params?: Record<string, unknown>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'mark',
    icon: 'clipboard-plus',
    labelKey: 'widgets.attendanceQuickActions.mark',
    defaultLabel: 'Mark Attendance',
    route: 'AttendanceMark',
    color: '#4CAF50',
  },
  {
    id: 'history',
    icon: 'history',
    labelKey: 'widgets.attendanceQuickActions.history',
    defaultLabel: 'View History',
    route: 'AttendanceHistory',
    color: '#2196F3',
  },
  {
    id: 'reports',
    icon: 'chart-bar',
    labelKey: 'widgets.attendanceQuickActions.reports',
    defaultLabel: 'Reports',
    route: 'AttendanceReports',
    color: '#9C27B0',
  },
  {
    id: 'alerts',
    icon: 'bell-alert',
    labelKey: 'widgets.attendanceQuickActions.alerts',
    defaultLabel: 'Low Attendance',
    route: 'AttendanceAlerts',
    color: '#FF9800',
  },
];

export const AttendanceQuickActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');

  const columns = (config?.columns as number) || 4;

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gap: 12 }]}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionItem,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                width: columns === 4 ? '22%' : columns === 2 ? '47%' : '30%',
              },
            ]}
            onPress={() => onNavigate?.(action.route, action.params)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${action.color}15` },
              ]}
            >
              <Icon name={action.icon} size={24} color={action.color} />
            </View>
            <AppText
              style={[styles.actionLabel, { color: colors.onSurface }]}
              numberOfLines={2}
            >
              {t(action.labelKey, { defaultValue: action.defaultLabel })}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
