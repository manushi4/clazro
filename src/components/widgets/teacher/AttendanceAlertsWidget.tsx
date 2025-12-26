import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { useAttendanceReportsQuery } from '../../../hooks/queries/teacher/useAttendanceReportsQuery';

export const AttendanceAlertsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');

  const maxItems = (config?.maxItems as number) || 5;
  const threshold = (config?.threshold as number) || 75;
  const showActions = config?.showActions !== false;

  const { data, isLoading, error, refetch } = useAttendanceReportsQuery();

  const handleCall = (phone?: string, studentName?: string) => {
    if (!phone) {
      Alert.alert(
        t('widgets.attendanceAlerts.noPhone', { defaultValue: 'No Phone' }),
        t('widgets.attendanceAlerts.noPhoneMessage', { defaultValue: 'Parent phone not available' })
      );
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string, studentName?: string) => {
    if (!phone) {
      Alert.alert(
        t('widgets.attendanceAlerts.noPhone', { defaultValue: 'No Phone' }),
        t('widgets.attendanceAlerts.noPhoneMessage', { defaultValue: 'Parent phone not available' })
      );
      return;
    }
    const message = t('widgets.attendanceAlerts.whatsappMessage', {
      student: studentName,
      defaultValue: `Dear Parent, we noticed ${studentName}'s attendance has been low. Please ensure regular attendance.`,
    });
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
  };

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
          {t('widgets.attendanceAlerts.states.error', { defaultValue: 'Failed to load' })}
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

  const lowAttendanceStudents = data.lowAttendanceStudents.filter(s => s.rate < threshold);

  // Empty state (all good!)
  if (!lowAttendanceStudents.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: `${colors.success}15` }]}>
        <Icon name="check-circle" size={40} color={colors.success} />
        <AppText style={[styles.allGoodTitle, { color: colors.success }]}>
          {t('widgets.attendanceAlerts.states.allGood', { defaultValue: 'All On Track!' })}
        </AppText>
        <AppText style={[styles.allGoodSubtitle, { color: colors.onSurfaceVariant }]}>
          {t('widgets.attendanceAlerts.states.allGoodMessage', {
            threshold,
            defaultValue: `No students below ${threshold}% attendance`,
          })}
        </AppText>
      </View>
    );
  }

  const displayStudents = lowAttendanceStudents.slice(0, maxItems);
  const remainingCount = lowAttendanceStudents.length - displayStudents.length;

  const getRateColor = (rate: number): string => {
    if (rate < 50) return colors.error;
    if (rate < 65) return colors.warning;
    return colors.onSurfaceVariant;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.alertIcon, { backgroundColor: `${colors.error}15` }]}>
            <Icon name="alert" size={16} color={colors.error} />
          </View>
          <View>
            <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
              {t('widgets.attendanceAlerts.title', { defaultValue: 'Low Attendance' })}
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {t('widgets.attendanceAlerts.count', {
                count: lowAttendanceStudents.length,
                threshold,
                defaultValue: `${lowAttendanceStudents.length} students below ${threshold}%`,
              })}
            </AppText>
          </View>
        </View>
      </View>

      {/* Student List */}
      <View style={styles.studentList}>
        {displayStudents.map((student) => {
          const isCritical = student.rate < 50;
          return (
            <View
              key={student.id}
              style={[
                styles.studentItem,
                { backgroundColor: colors.surface, borderRadius: borderRadius.medium },
              ]}
            >
              <View style={styles.studentInfo}>
                <View style={styles.studentNameRow}>
                  {isCritical && (
                    <Icon name="alert-circle" size={14} color={colors.error} />
                  )}
                  <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                    {student.name}
                  </AppText>
                </View>
                <AppText style={[styles.studentClass, { color: colors.onSurfaceVariant }]}>
                  {student.className}
                </AppText>
              </View>

              <View style={styles.rateContainer}>
                <AppText style={[styles.rateValue, { color: getRateColor(student.rate) }]}>
                  {student.rate}%
                </AppText>
              </View>

              {showActions && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
                    onPress={() => handleCall(student.parentPhone, student.name)}
                  >
                    <Icon name="phone" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#25D36615' }]}
                    onPress={() => handleWhatsApp(student.parentPhone, student.name)}
                  >
                    <Icon name="whatsapp" size={16} color="#25D366" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* View All Link */}
      {remainingCount > 0 && (
        <TouchableOpacity
          style={styles.viewAll}
          onPress={() => onNavigate?.('AttendanceReports')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.attendanceAlerts.viewAll', {
              count: remainingCount,
              defaultValue: `View all ${lowAttendanceStudents.length} students`,
            })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
  allGoodTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  allGoodSubtitle: {
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  studentList: {
    gap: 8,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  studentClass: {
    fontSize: 12,
    marginTop: 2,
  },
  rateContainer: {
    minWidth: 45,
    alignItems: 'flex-end',
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
