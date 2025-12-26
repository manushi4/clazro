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

export const AttendanceHeroWidget: React.FC<WidgetProps> = ({
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const { data, isLoading, error, refetch } = useAttendanceStatsQuery();

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.error }]}>
        <Icon name="alert-circle-outline" size={32} color="#FFFFFF" />
        <AppText style={styles.errorText}>
          {t('widgets.attendanceHero.states.error', { defaultValue: 'Failed to load' })}
        </AppText>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <AppText style={styles.retryText}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    {
      icon: 'account-check',
      value: data.todayPresent,
      label: t('widgets.attendanceHero.present', { defaultValue: 'Present' }),
      color: '#4CAF50',
    },
    {
      icon: 'account-remove',
      value: data.todayAbsent,
      label: t('widgets.attendanceHero.absent', { defaultValue: 'Absent' }),
      color: '#F44336',
    },
    {
      icon: 'clock-alert',
      value: data.todayLate,
      label: t('widgets.attendanceHero.late', { defaultValue: 'Late' }),
      color: '#FF9800',
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary, borderRadius: borderRadius.large }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="clipboard-check-outline" size={28} color="#FFFFFF" />
          <View style={styles.headerText}>
            <AppText style={styles.title}>
              {t('widgets.attendanceHero.title', { defaultValue: "Today's Attendance" })}
            </AppText>
            <AppText style={styles.subtitle}>
              {t('widgets.attendanceHero.classesMarked', {
                marked: data.classesMarked,
                total: data.classesTotal,
                defaultValue: `${data.classesMarked}/${data.classesTotal} classes marked`,
              })}
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.markButton}
          onPress={() => onNavigate?.('AttendanceMark')}
        >
          <Icon name="plus" size={20} color={colors.primary} />
          <AppText style={[styles.markButtonText, { color: colors.primary }]}>
            {t('widgets.attendanceHero.mark', { defaultValue: 'Mark' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Main Rate */}
      <View style={styles.rateContainer}>
        <AppText style={styles.rateValue}>{data.todayRate}%</AppText>
        <AppText style={styles.rateLabel}>
          {t('widgets.attendanceHero.todayRate', { defaultValue: 'Attendance Rate' })}
        </AppText>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}30` }]}>
              <Icon name={stat.icon} size={18} color={stat.color} />
            </View>
            <AppText style={styles.statValue}>{stat.value}</AppText>
            <AppText style={styles.statLabel}>{stat.label}</AppText>
          </View>
        ))}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Icon name="account-group" size={18} color="#FFFFFF" />
          </View>
          <AppText style={styles.statValue}>{data.todayTotal}</AppText>
          <AppText style={styles.statLabel}>
            {t('widgets.attendanceHero.total', { defaultValue: 'Total' })}
          </AppText>
        </View>
      </View>

      {/* Pending Alert */}
      {data.pendingClasses.length > 0 && (
        <TouchableOpacity
          style={styles.pendingAlert}
          onPress={() => onNavigate?.('AttendanceMark')}
        >
          <Icon name="alert-circle" size={16} color="#FF9800" />
          <AppText style={styles.pendingText}>
            {t('widgets.attendanceHero.pending', {
              count: data.pendingClasses.length,
              defaultValue: `${data.pendingClasses.length} classes pending`,
            })}
          </AppText>
          <Icon name="chevron-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  markButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rateValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
