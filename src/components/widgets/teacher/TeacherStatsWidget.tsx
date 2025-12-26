import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTeacherDashboardQuery } from '../../../hooks/queries/teacher';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'teacher.stats-grid';

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

export const TeacherStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  const { data, isLoading, error } = useTeacherDashboardQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const showTotalStudents = config?.showTotalStudents !== false;
  const showClassesToday = config?.showClassesToday !== false;
  const showPendingGrading = config?.showPendingGrading !== false;
  const showAttendance = config?.showAttendance !== false;
  const columns = (config?.columns as 2 | 3 | 4) || 2;
  const showIcons = config?.showIcons !== false;
  const showTrend = config?.showTrend !== false;
  const enableTap = config?.enableTap !== false;

  // Build stats array based on config
  const stats: StatItem[] = [];

  if (showTotalStudents) {
    stats.push({
      id: 'students',
      icon: 'account-group',
      value: formatNumber(data?.totalStudents || 0),
      label: t('widgets.teacherStats.totalStudents', { defaultValue: 'Total Students' }),
      trendDirection: 'neutral',
      color: colors.primary,
      screen: 'my-students',
    });
  }

  if (showClassesToday) {
    const completed = data?.classesCompleted || 0;
    const total = data?.classesToday || 0;
    stats.push({
      id: 'classes',
      icon: 'book-open-variant',
      value: `${completed}/${total}`,
      label: t('widgets.teacherStats.classesToday', { defaultValue: 'Classes Today' }),
      trendDirection: 'neutral',
      color: colors.secondary || colors.primary,
      screen: 'teacher-schedule',
    });
  }

  if (showPendingGrading) {
    const pending = data?.pendingGrading || 0;
    stats.push({
      id: 'grading',
      icon: 'clipboard-check-outline',
      value: pending.toString(),
      label: t('widgets.teacherStats.pendingGrading', { defaultValue: 'Pending Grading' }),
      trendDirection: 'neutral',
      color: pending > 10 ? colors.warning : colors.success,
      screen: 'pending-grading',
    });
  }

  if (showAttendance) {
    stats.push({
      id: 'attendance',
      icon: 'account-check',
      value: `${data?.attendanceRate?.toFixed(0) || 0}%`,
      label: t('widgets.teacherStats.attendance', { defaultValue: 'Attendance' }),
      trendDirection: 'neutral',
      color: colors.success,
      screen: 'class-attendance',
    });
  }

  const handleStatPress = (stat: StatItem) => {
    if (!enableTap) return;

    trackWidgetEvent(WIDGET_ID, 'click', { action: 'stat_tap', stat: stat.id });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_stat_tap`,
      level: 'info',
      data: { stat: stat.id },
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

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t('widgets.teacherStats.error', { defaultValue: 'Failed to load stats' })}
        </AppText>
      </View>
    );
  }

  const gridColumns = size === 'compact' ? 2 : columns;
  const itemWidthPercent = 100 / gridColumns - 2; // Account for margins

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.teacherStats.title', { defaultValue: 'My Stats' })}
        </AppText>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[
              styles.statCard,
              {
                width: `${itemWidthPercent}%`,
                backgroundColor: `${stat.color}10`,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => handleStatPress(stat)}
            disabled={!enableTap}
            accessibilityLabel={t('widgets.teacherStats.statHint', {
              label: stat.label,
              value: stat.value,
              defaultValue: `${stat.label}: ${stat.value}`,
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
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    flexWrap: 'wrap',
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
