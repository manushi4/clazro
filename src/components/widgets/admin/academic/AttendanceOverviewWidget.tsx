import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAttendanceOverviewQuery } from '../../../../hooks/queries/admin/useAttendanceOverviewQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'admin.attendance-overview';

// Sparkline component for weekly trend
const Sparkline: React.FC<{
  data: Array<{ date: string; percentage: number }>;
  color: string;
  height?: number;
}> = ({ data, color, height = 24 }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.percentage));
  const min = Math.min(...data.map(d => d.percentage));
  const range = max - min || 1;

  return (
    <View style={[styles.sparkline, { height }]}>
      {data.map((point, index) => {
        const barHeight = ((point.percentage - min) / range) * height * 0.8 + height * 0.2;
        return (
          <View
            key={index}
            style={[
              styles.sparklineBar,
              {
                height: barHeight,
                backgroundColor: index === data.length - 1 ? color : `${color}60`,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export const AttendanceOverviewWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showTeacherAttendance = config?.showTeacherAttendance !== false;
  const showAbsentList = config?.showAbsentList !== false;
  const absentListLimit = (config?.absentListLimit as number) || 5;
  const showWeeklyTrend = config?.showWeeklyTrend !== false;
  const showAlerts = config?.showAlerts !== false;
  const lowAttendanceThreshold = (config?.lowAttendanceThreshold as number) || 80;

  const { data, isLoading, error, refetch } = useAttendanceOverviewQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
    });
  }, []);

  const handleViewDetails = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_details' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_details`,
      level: 'info',
    });
    // Navigate to attendance dashboard screen
    onNavigate?.('attendance-dashboard', {});
  };

  const handleStudentCardTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'student_card_tap' });
    // Navigate to absent students list screen
    onNavigate?.('absent-students-list', {});
  };

  const handleTeacherCardTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'teacher_card_tap' });
    // No teacher attendance detail screen exists yet - do nothing for now
  };

  const handleAbsentStudentTap = (studentId: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'absent_student_tap', studentId });
    onNavigate?.('student-attendance-detail', { studentId });
  };

  const handleViewAllAbsent = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all_absent' });
    // Navigate to absent list screen (shows both students and teachers)
    onNavigate?.('absent-list', {});
  };

  const handleAlertTap = (alert: { type: string; batchId?: string }) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'alert_tap', alertType: alert.type });
    if (alert.type === 'low_batch' && alert.batchId) {
      // Navigate to batch detail since batch-attendance doesn't exist
      onNavigate?.('batch-detail', { batchId: alert.batchId });
    } else if (data?.absentStudents?.[0]) {
      onNavigate?.('student-attendance-detail', { studentId: data.absentStudents[0].id });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="clipboard-check-outline" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.attendanceOverview.title', { defaultValue: "Today's Attendance" })}
            </AppText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceOverview.states.loading', { defaultValue: 'Loading...' })}
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
          <View style={styles.headerLeft}>
            <Icon name="clipboard-check-outline" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.attendanceOverview.title', { defaultValue: "Today's Attendance" })}
            </AppText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.attendanceOverview.states.error', { defaultValue: 'Failed to load data' })}
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
          <View style={styles.headerLeft}>
            <Icon name="clipboard-check-outline" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.attendanceOverview.title', { defaultValue: "Today's Attendance" })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="calendar-blank-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceOverview.states.empty', { defaultValue: 'No attendance data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  const { studentAttendance, teacherAttendance, absentStudents, weeklyTrend, alerts } = data;
  const totalAbsent = studentAttendance.absent;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="clipboard-check-outline" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.attendanceOverview.title', { defaultValue: "Today's Attendance" })}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleViewDetails}
          accessibilityLabel={t('common:actions.details', { defaultValue: 'Details' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.details', { defaultValue: 'Details' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Attendance Cards */}
      <View style={styles.cardsRow}>
        {/* Student Attendance Card */}
        <TouchableOpacity
          style={[styles.attendanceCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={handleStudentCardTap}
          accessibilityLabel={`Student attendance ${studentAttendance.percentage}%`}
        >
          <Icon name="account-school" size={24} color={colors.primary} />
          <AppText style={[styles.cardPercentage, { color: colors.onSurface }]}>
            {studentAttendance.percentage}%
          </AppText>
          <AppText style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.attendanceOverview.students', { defaultValue: 'Students' })}
          </AppText>
          <AppText style={[styles.cardCount, { color: colors.onSurfaceVariant }]}>
            {studentAttendance.present} / {studentAttendance.total}
          </AppText>
          <View style={styles.trendRow}>
            <Icon
              name={studentAttendance.trend >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={studentAttendance.trend >= 0 ? colors.success : colors.error}
            />
            <AppText
              style={[
                styles.trendText,
                { color: studentAttendance.trend >= 0 ? colors.success : colors.error },
              ]}
            >
              {studentAttendance.trend >= 0 ? '+' : ''}{studentAttendance.trend}% {t('widgets.attendanceOverview.vsAvg', { defaultValue: 'vs avg' })}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Teacher Attendance Card */}
        {showTeacherAttendance && (
          <TouchableOpacity
            style={[styles.attendanceCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            onPress={handleTeacherCardTap}
            accessibilityLabel={`Teacher attendance ${teacherAttendance.percentage}%`}
          >
            <Icon name="human-male-board" size={24} color={colors.tertiary} />
            <AppText style={[styles.cardPercentage, { color: colors.onSurface }]}>
              {teacherAttendance.percentage}%
            </AppText>
            <AppText style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.attendanceOverview.teachers', { defaultValue: 'Teachers' })}
            </AppText>
            <AppText style={[styles.cardCount, { color: colors.onSurfaceVariant }]}>
              {teacherAttendance.present} / {teacherAttendance.total}
            </AppText>
            <View style={styles.trendRow}>
              <Icon
                name={teacherAttendance.trend >= 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={teacherAttendance.trend >= 0 ? colors.success : colors.error}
              />
              <AppText
                style={[
                  styles.trendText,
                  { color: teacherAttendance.trend >= 0 ? colors.success : colors.error },
                ]}
              >
                {teacherAttendance.trend >= 0 ? '+' : ''}{teacherAttendance.trend}% {t('widgets.attendanceOverview.vsAvg', { defaultValue: 'vs avg' })}
              </AppText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Absent List */}
      {showAbsentList && absentStudents.length > 0 && (
        <View style={[styles.absentSection, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.absentHeader}>
            <Icon name="alert-circle-outline" size={16} color={colors.warning} />
            <AppText style={[styles.absentTitle, { color: colors.onSurface }]}>
              {t('widgets.attendanceOverview.absentToday', { defaultValue: 'Absent Today' })} ({totalAbsent} {t('widgets.attendanceOverview.students', { defaultValue: 'students' })}):
            </AppText>
          </View>
          <View style={styles.absentList}>
            {absentStudents.slice(0, absentListLimit).map((student, index) => (
              <TouchableOpacity
                key={student.id}
                style={styles.absentItem}
                onPress={() => handleAbsentStudentTap(student.id)}
                accessibilityLabel={`${student.name} from ${student.batch}`}
              >
                <AppText style={[styles.absentBullet, { color: colors.onSurfaceVariant }]}>•</AppText>
                <AppText style={[styles.absentName, { color: colors.onSurface }]} numberOfLines={1}>
                  {student.name}
                </AppText>
                <AppText style={[styles.absentBatch, { color: colors.onSurfaceVariant }]}>
                  ({student.batch})
                </AppText>
                {student.reason && (
                  <AppText style={[styles.absentReason, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    - {student.reason}
                  </AppText>
                )}
              </TouchableOpacity>
            ))}
            {totalAbsent > absentListLimit && (
              <TouchableOpacity onPress={handleViewAllAbsent}>
                <AppText style={[styles.viewMoreAbsent, { color: colors.primary }]}>
                  +{totalAbsent - absentListLimit} {t('widgets.attendanceOverview.more', { defaultValue: 'more...' })}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Weekly Trend */}
      {showWeeklyTrend && weeklyTrend.length > 0 && (
        <View style={[styles.trendSection, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.trendHeader}>
            <AppText style={[styles.trendLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.attendanceOverview.weeklyTrend', { defaultValue: 'Weekly Trend' })}:
            </AppText>
            <Sparkline data={weeklyTrend} color={colors.primary} />
            <AppText style={[styles.trendAvg, { color: colors.onSurfaceVariant }]}>
              ({t('widgets.attendanceOverview.avg', { defaultValue: 'Avg' })}: {Math.round(weeklyTrend.reduce((sum, d) => sum + d.percentage, 0) / weeklyTrend.length)}%)
            </AppText>
          </View>
        </View>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <View style={[styles.alertsSection, { borderTopColor: colors.outlineVariant }]}>
          {alerts.map((alert, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.alertItem, { backgroundColor: `${colors.warning}15` }]}
              onPress={() => handleAlertTap(alert)}
              accessibilityLabel={alert.message}
            >
              <Icon name="bell-alert-outline" size={14} color={colors.warning} />
              <AppText style={[styles.alertText, { color: colors.warning }]}>
                {alert.message}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  attendanceCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  cardPercentage: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  cardCount: {
    fontSize: 11,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  absentSection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  absentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  absentTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  absentList: {
    gap: 4,
  },
  absentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  absentBullet: {
    fontSize: 12,
  },
  absentName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  absentBatch: {
    fontSize: 11,
  },
  absentReason: {
    fontSize: 10,
    fontStyle: 'italic',
    maxWidth: 80,
  },
  viewMoreAbsent: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  trendSection: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendLabel: {
    fontSize: 12,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
  },
  sparklineBar: {
    width: 8,
    borderRadius: 2,
  },
  trendAvg: {
    fontSize: 11,
  },
  alertsSection: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});