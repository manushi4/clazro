import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { useAttendanceReportsQuery, LowAttendanceStudent } from '../../hooks/queries/teacher/useAttendanceReportsQuery';

type SortOption = 'rate' | 'days' | 'name';
type FilterOption = 'all' | 'critical' | 'warning';

export function AttendanceAlertsScreen() {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const navigation = useNavigation();

  const [sortBy, setSortBy] = useState<SortOption>('rate');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data, isLoading, refetch } = useAttendanceReportsQuery({ threshold: 80 });
  const students = data?.lowAttendanceStudents || [];

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Apply filter
    if (filterBy === 'critical') {
      result = result.filter(s => s.attendance_rate < 60);
    } else if (filterBy === 'warning') {
      result = result.filter(s => s.attendance_rate >= 60 && s.attendance_rate < 75);
    }

    // Apply sort
    if (sortBy === 'rate') {
      result.sort((a, b) => a.attendance_rate - b.attendance_rate);
    } else if (sortBy === 'days') {
      result.sort((a, b) => b.days_absent - a.days_absent);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.student_name_en.localeCompare(b.student_name_en));
    }

    return result;
  }, [students, filterBy, sortBy]);

  const handleCall = (phone?: string, studentName?: string) => {
    if (!phone) {
      Alert.alert(
        t('screens.attendanceAlerts.noPhone', { defaultValue: 'No Phone Number' }),
        t('screens.attendanceAlerts.noPhoneMessage', { defaultValue: 'Parent phone number is not available.' })
      );
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleWhatsApp = (phone?: string, studentName?: string) => {
    if (!phone) {
      Alert.alert(
        t('screens.attendanceAlerts.noPhone', { defaultValue: 'No Phone Number' }),
        t('screens.attendanceAlerts.noPhoneMessage', { defaultValue: 'Parent phone number is not available.' })
      );
      return;
    }
    const message = t('screens.attendanceAlerts.whatsappMessage', {
      defaultValue: `Dear Parent, we noticed that your child ${studentName} has low attendance. Please ensure regular attendance for better academic performance.`,
      studentName,
    });
    const url = `whatsapp://send?phone=${phone.replace(/\s/g, '').replace('+', '')}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const getStatusColor = (rate: number) => {
    if (rate < 60) return colors.error;
    if (rate < 75) return colors.warning;
    return colors.success;
  };

  const getStatusLabel = (rate: number) => {
    if (rate < 60) return t('screens.attendanceAlerts.critical', { defaultValue: 'Critical' });
    if (rate < 75) return t('screens.attendanceAlerts.warning', { defaultValue: 'Warning' });
    return t('screens.attendanceAlerts.ok', { defaultValue: 'OK' });
  };

  const criticalCount = students.filter(s => s.attendance_rate < 60).length;
  const warningCount = students.filter(s => s.attendance_rate >= 60 && s.attendance_rate < 75).length;

  const renderStudent = (student: LowAttendanceStudent, index: number) => (
    <View
      key={student.student_id}
      style={[styles.studentCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}
    >
      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(student.attendance_rate) }
        ]}
      />

      <View style={styles.studentMain}>
        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.nameRow}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]}>
              {getLocalizedField(student, 'student_name')}
            </AppText>
            {student.attendance_rate < 60 && (
              <Icon name="alert-circle" size={16} color={colors.error} />
            )}
          </View>
          <AppText style={[styles.studentMeta, { color: colors.onSurfaceVariant }]}>
            {getLocalizedField(student, 'class_name')} | Roll #{student.roll_number}
          </AppText>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <AppText style={[styles.statValue, { color: getStatusColor(student.attendance_rate) }]}>
              {student.attendance_rate.toFixed(1)}%
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceAlerts.attendance', { defaultValue: 'Attendance' })}
            </AppText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.statBox}>
            <AppText style={[styles.statValue, { color: colors.error }]}>
              {student.days_absent}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceAlerts.daysAbsent', { defaultValue: 'Days Absent' })}
            </AppText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.statBox}>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {new Date(student.last_present).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceAlerts.lastPresent', { defaultValue: 'Last Present' })}
            </AppText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.success}15` }]}
            onPress={() => handleCall(student.parent_phone, student.student_name_en)}
          >
            <Icon name="phone" size={18} color={colors.success} />
            <AppText style={[styles.actionBtnText, { color: colors.success }]}>
              {t('screens.attendanceAlerts.call', { defaultValue: 'Call Parent' })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => handleWhatsApp(student.parent_phone, student.student_name_en)}
          >
            <Icon name="whatsapp" size={18} color="#25D366" />
            <AppText style={[styles.actionBtnText, { color: colors.primary }]}>
              {t('screens.attendanceAlerts.whatsapp', { defaultValue: 'WhatsApp' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('screens.attendanceAlerts.title', { defaultValue: 'Low Attendance Alerts' })}
        </AppText>
        <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)} style={styles.sortButton}>
          <Icon name="sort" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.summaryItem,
            filterBy === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setFilterBy('all')}
        >
          <AppText style={[styles.summaryCount, { color: colors.onSurface }]}>
            {students.length}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('screens.attendanceAlerts.total', { defaultValue: 'Total' })}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.summaryItem,
            filterBy === 'critical' && { borderBottomColor: colors.error, borderBottomWidth: 2 }
          ]}
          onPress={() => setFilterBy('critical')}
        >
          <AppText style={[styles.summaryCount, { color: colors.error }]}>
            {criticalCount}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('screens.attendanceAlerts.critical', { defaultValue: 'Critical' })}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.summaryItem,
            filterBy === 'warning' && { borderBottomColor: colors.warning, borderBottomWidth: 2 }
          ]}
          onPress={() => setFilterBy('warning')}
        >
          <AppText style={[styles.summaryCount, { color: colors.warning }]}>
            {warningCount}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('screens.attendanceAlerts.warning', { defaultValue: 'Warning' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          {[
            { key: 'rate', label: t('screens.attendanceAlerts.sortByRate', { defaultValue: 'Sort by Rate' }), icon: 'percent' },
            { key: 'days', label: t('screens.attendanceAlerts.sortByDays', { defaultValue: 'Sort by Days Absent' }), icon: 'calendar-remove' },
            { key: 'name', label: t('screens.attendanceAlerts.sortByName', { defaultValue: 'Sort by Name' }), icon: 'sort-alphabetical-ascending' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortOption, sortBy === option.key && { backgroundColor: colors.primaryContainer }]}
              onPress={() => { setSortBy(option.key as SortOption); setShowSortMenu(false); }}
            >
              <Icon name={option.icon} size={18} color={sortBy === option.key ? colors.primary : colors.onSurfaceVariant} />
              <AppText style={{ color: sortBy === option.key ? colors.primary : colors.onSurface }}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Students List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredStudents.map((student, index) => renderStudent(student, index))}

        {filteredStudents.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={64} color={colors.success} />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {t('screens.attendanceAlerts.noAlerts', { defaultValue: 'No Alerts' })}
            </AppText>
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceAlerts.noAlertsMessage', { defaultValue: 'All students have good attendance!' })}
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sortButton: {
    padding: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sortMenu: {
    position: 'absolute',
    top: 56,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusBadge: {
    width: 4,
  },
  studentMain: {
    flex: 1,
    padding: 16,
  },
  studentInfo: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
