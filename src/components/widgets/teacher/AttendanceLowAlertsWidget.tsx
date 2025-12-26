import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { getLocalizedField } from '../../../utils/getLocalizedField';
import { useAttendanceReportsQuery, LowAttendanceStudent } from '../../../hooks/queries/teacher/useAttendanceReportsQuery';

export const AttendanceLowAlertsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const threshold = (config?.threshold as number) || 75;
  const maxItems = (config?.maxItems as number) || 5;

  const { data, isLoading, error, refetch } = useAttendanceReportsQuery({ threshold });

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert(
        t('widgets.attendanceLowAlerts.noPhone', { defaultValue: 'No Phone' }),
        t('widgets.attendanceLowAlerts.noPhoneMessage', { defaultValue: 'Parent phone not available' })
      );
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleWhatsApp = (phone?: string, studentName?: string) => {
    if (!phone) {
      Alert.alert(
        t('widgets.attendanceLowAlerts.noPhone', { defaultValue: 'No Phone' }),
        t('widgets.attendanceLowAlerts.noPhoneMessage', { defaultValue: 'Parent phone not available' })
      );
      return;
    }
    const message = t('widgets.attendanceLowAlerts.whatsappMessage', {
      student: studentName,
      defaultValue: `Dear Parent, we noticed ${studentName}'s attendance has been low. Please ensure regular attendance.`,
    });
    Linking.openURL(`whatsapp://send?phone=${phone.replace(/\s/g, '').replace('+', '')}&text=${encodeURIComponent(message)}`);
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
          {t('widgets.attendanceLowAlerts.states.error', { defaultValue: 'Failed to load' })}
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

  // Empty state - all students have good attendance
  if (!data.lowAttendanceStudents.length) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: `${colors.success || '#4CAF50'}15`, borderRadius: borderRadius.large }]}>
        <Icon name="check-circle" size={48} color={colors.success || '#4CAF50'} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t('widgets.attendanceLowAlerts.allGood', { defaultValue: 'All Students On Track!' })}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t('widgets.attendanceLowAlerts.allGoodMessage', {
            threshold,
            defaultValue: `No students below ${threshold}% attendance`
          })}
        </AppText>
      </View>
    );
  }

  const renderStudent = ({ item }: { item: LowAttendanceStudent }) => {
    const getRateColor = (rate: number): string => {
      if (rate < 60) return '#F44336';
      if (rate < 70) return '#FF5722';
      return '#FF9800';
    };

    return (
      <View style={[styles.studentCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={styles.studentHeader}>
          <View style={[styles.avatar, { backgroundColor: `${getRateColor(item.attendance_rate)}20` }]}>
            <AppText style={[styles.avatarText, { color: getRateColor(item.attendance_rate) }]}>
              {item.student_name_en.charAt(0)}
            </AppText>
          </View>
          <View style={styles.studentInfo}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(item, 'student_name')}
            </AppText>
            <AppText style={[styles.studentMeta, { color: colors.onSurfaceVariant }]}>
              {getLocalizedField(item, 'class_name')} | Roll #{item.roll_number}
            </AppText>
          </View>
          <View style={[styles.rateBadge, { backgroundColor: `${getRateColor(item.attendance_rate)}20` }]}>
            <AppText style={[styles.rateText, { color: getRateColor(item.attendance_rate) }]}>
              {item.attendance_rate.toFixed(0)}%
            </AppText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="calendar-remove" size={14} color="#F44336" />
            <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
              {item.days_absent} {t('widgets.attendanceLowAlerts.daysAbsent', { defaultValue: 'days absent' })}
            </AppText>
          </View>
          <View style={styles.statItem}>
            <Icon name="calendar-check" size={14} color="#4CAF50" />
            <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
              {t('widgets.attendanceLowAlerts.lastPresent', { defaultValue: 'Last' })}: {item.last_present}
            </AppText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => handleCall(item.parent_phone)}
          >
            <Icon name="phone" size={16} color={colors.primary} />
            <AppText style={[styles.actionText, { color: colors.primary }]}>
              {t('widgets.attendanceLowAlerts.call', { defaultValue: 'Call' })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#25D36615' }]}
            onPress={() => handleWhatsApp(item.parent_phone, item.student_name_en)}
          >
            <Icon name="whatsapp" size={16} color="#25D366" />
            <AppText style={[styles.actionText, { color: '#25D366' }]}>
              WhatsApp
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => onNavigate?.('StudentDetail', { studentId: item.student_id })}
          >
            <Icon name="account" size={16} color={colors.primary} />
            <AppText style={[styles.actionText, { color: colors.primary }]}>
              {t('widgets.attendanceLowAlerts.view', { defaultValue: 'View' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={[styles.headerStats, { backgroundColor: '#F4433615', borderRadius: borderRadius.medium }]}>
        <Icon name="alert" size={20} color="#F44336" />
        <AppText style={[styles.headerText, { color: '#F44336' }]}>
          {data.lowAttendanceStudents.length} {t('widgets.attendanceLowAlerts.studentsBelow', {
            threshold,
            defaultValue: `students below ${threshold}%`
          })}
        </AppText>
      </View>

      {/* Student List */}
      <FlatList
        data={data.lowAttendanceStudents.slice(0, maxItems)}
        renderItem={renderStudent}
        keyExtractor={(item) => item.student_id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* View All Button */}
      {data.lowAttendanceStudents.length > maxItems && (
        <TouchableOpacity
          style={[styles.viewAllBtn, { borderColor: colors.outline }]}
          onPress={() => onNavigate?.('AttendanceAlerts')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.attendanceLowAlerts.viewAll', {
              count: data.lowAttendanceStudents.length,
              defaultValue: `View All ${data.lowAttendanceStudents.length} Students`
            })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentCard: {
    padding: 12,
    gap: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
