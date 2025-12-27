import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { useAttendanceStatsQuery } from '../../../hooks/queries/teacher/useAttendanceStatsQuery';

export const AttendanceTodaySummaryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const showChart = config?.showChart !== false;

  const { data, isLoading, error, refetch } = useAttendanceStatsQuery();

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t('widgets.attendanceTodaySummary.states.error', { defaultValue: 'Failed to load' })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    {
      key: 'present',
      icon: 'account-check',
      value: data.todayPresent,
      label: t('widgets.attendanceTodaySummary.present', { defaultValue: 'Present' }),
      color: '#4CAF50',
    },
    {
      key: 'absent',
      icon: 'account-remove',
      value: data.todayAbsent,
      label: t('widgets.attendanceTodaySummary.absent', { defaultValue: 'Absent' }),
      color: '#F44336',
    },
    {
      key: 'late',
      icon: 'clock-alert',
      value: data.todayLate,
      label: t('widgets.attendanceTodaySummary.late', { defaultValue: 'Late' }),
      color: '#FF9800',
    },
  ];

  const getRateColor = (rate: number): string => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 75) return '#FF9800';
    return '#F44336';
  };

  const rateColor = getRateColor(data.todayRate);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}
      onPress={() => onNavigate?.('AttendanceHome')}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="calendar-today" size={18} color={colors.primary} />
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('widgets.attendanceTodaySummary.title', { defaultValue: "Today's Attendance" })}
          </AppText>
        </View>
        <View style={[styles.rateBadge, { backgroundColor: `${rateColor}15` }]}>
          <AppText style={[styles.rateValue, { color: rateColor }]}>
            {data.todayRate}%
          </AppText>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.key} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
              <Icon name={stat.icon} size={16} color={stat.color} />
            </View>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {stat.value}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {stat.label}
            </AppText>
          </View>
        ))}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Icon name="account-group" size={16} color={colors.primary} />
          </View>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {data.todayTotal}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceTodaySummary.total', { defaultValue: 'Total' })}
          </AppText>
        </View>
      </View>

      {/* Progress Bar */}
      {showChart && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.progressBar,
                styles.progressPresent,
                { width: `${(data.todayPresent / data.todayTotal) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.progressBar,
                styles.progressLate,
                { width: `${(data.todayLate / data.todayTotal) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.progressBar,
                styles.progressAbsent,
                { width: `${(data.todayAbsent / data.todayTotal) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Classes Status - Navigates to Mark Attendance */}
      <TouchableOpacity
        style={[styles.classesStatus, { borderTopColor: colors.outline }]}
        onPress={() => onNavigate?.('AttendanceMark')}
        activeOpacity={0.7}
      >
        <Icon name="google-classroom" size={14} color={colors.onSurfaceVariant} />
        <AppText style={[styles.classesText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.attendanceTodaySummary.classesMarked', {
            marked: data.classesMarked,
            total: data.classesTotal,
            defaultValue: `${data.classesMarked}/${data.classesTotal} classes marked`
          })}
        </AppText>
        {data.pendingClasses.length > 0 && (
          <View style={[styles.pendingBadge, { backgroundColor: '#FF980020' }]}>
            <AppText style={[styles.pendingText, { color: '#FF9800' }]}>
              {data.pendingClasses.length} {t('widgets.attendanceTodaySummary.pending', { defaultValue: 'pending' })}
            </AppText>
          </View>
        )}
        <Icon name="chevron-right" size={16} color={data.pendingClasses.length > 0 ? '#FF9800' : colors.onSurfaceVariant} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
  },
  progressPresent: {
    backgroundColor: '#4CAF50',
  },
  progressLate: {
    backgroundColor: '#FF9800',
  },
  progressAbsent: {
    backgroundColor: '#F44336',
  },
  classesStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  classesText: {
    flex: 1,
    fontSize: 12,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
