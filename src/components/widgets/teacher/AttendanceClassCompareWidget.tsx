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
import { getLocalizedField } from '../../../utils/getLocalizedField';
import { useAttendanceReportsQuery, ClassAttendanceData } from '../../../hooks/queries/teacher/useAttendanceReportsQuery';

export const AttendanceClassCompareWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const sortBy = (config?.sortBy as 'rate' | 'name') || 'rate';

  const { data, isLoading, error, refetch } = useAttendanceReportsQuery();

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
          {t('widgets.attendanceClassCompare.states.error', { defaultValue: 'Failed to load' })}
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

  // Empty state
  if (!data.classComparison.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="google-classroom" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t('widgets.attendanceClassCompare.states.empty', { defaultValue: 'No classes' })}
        </AppText>
      </View>
    );
  }

  const sortedClasses = [...data.classComparison].sort((a, b) => {
    if (sortBy === 'rate') return b.average_rate - a.average_rate;
    return a.class_name_en.localeCompare(b.class_name_en);
  });

  const maxRate = Math.max(...sortedClasses.map(c => c.average_rate));

  const getRateColor = (rate: number): string => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 75) return '#FF9800';
    return '#F44336';
  };

  const getTrendIcon = (trend: ClassAttendanceData['trend']): { icon: string; color: string } => {
    switch (trend) {
      case 'up': return { icon: 'trending-up', color: '#4CAF50' };
      case 'down': return { icon: 'trending-down', color: '#F44336' };
      default: return { icon: 'minus', color: colors.onSurfaceVariant };
    }
  };

  return (
    <View style={styles.container}>
      {sortedClasses.map((classData, index) => {
        const barWidth = (classData.average_rate / maxRate) * 100;
        const rateColor = getRateColor(classData.average_rate);
        const trendInfo = getTrendIcon(classData.trend);

        return (
          <TouchableOpacity
            key={classData.class_id}
            style={[styles.classRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            onPress={() => onNavigate?.('TeacherClassDetail', { classId: classData.class_id })}
            activeOpacity={0.7}
          >
            {/* Rank */}
            <View style={[styles.rankBadge, { backgroundColor: index < 3 ? `${colors.primary}20` : colors.surface }]}>
              <AppText style={[styles.rankText, { color: index < 3 ? colors.primary : colors.onSurfaceVariant }]}>
                #{index + 1}
              </AppText>
            </View>

            {/* Class Info */}
            <View style={styles.classInfo}>
              <AppText style={[styles.className, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(classData, 'class_name')}
              </AppText>
              <AppText style={[styles.studentCount, { color: colors.onSurfaceVariant }]}>
                {classData.total_students} {t('widgets.attendanceClassCompare.students', { defaultValue: 'students' })}
              </AppText>

              {/* Progress Bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${barWidth}%`, backgroundColor: rateColor },
                  ]}
                />
              </View>
            </View>

            {/* Rate & Trend */}
            <View style={styles.rateContainer}>
              <View style={styles.rateRow}>
                <AppText style={[styles.rateValue, { color: rateColor }]}>
                  {classData.average_rate.toFixed(1)}%
                </AppText>
                <Icon name={trendInfo.icon} size={16} color={trendInfo.color} />
              </View>
              <AppText style={[styles.todayRate, { color: colors.onSurfaceVariant }]}>
                {t('widgets.attendanceClassCompare.today', { defaultValue: 'Today' })}: {classData.today_rate}%
              </AppText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
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
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
    gap: 4,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 11,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayRate: {
    fontSize: 10,
    marginTop: 2,
  },
});
