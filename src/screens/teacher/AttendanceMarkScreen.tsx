import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { useNetworkStatus } from '../../offline/networkStore';
import { OfflineBanner } from '../../offline/OfflineBanner';
import {
  useClassAttendanceQuery,
  getAttendanceSummary,
  AttendanceStatus,
  StudentAttendance,
} from '../../hooks/queries/teacher/useAttendanceQuery';
import { useTeacherClassesQuery, TeacherClass } from '../../hooks/queries/teacher/useTeacherClassesQuery';
import { useMarkAttendance } from '../../hooks/mutations/teacher/useMarkAttendance';

type RouteParams = {
  classId?: string;
  className?: string;
  date?: string;
};

const STATUS_CONFIG: Record<AttendanceStatus, { icon: string; color: string; label: string }> = {
  present: { icon: 'check-circle', color: '#4CAF50', label: 'P' },
  absent: { icon: 'close-circle', color: '#F44336', label: 'A' },
  late: { icon: 'clock-alert', color: '#FF9800', label: 'L' },
  excused: { icon: 'account-check', color: '#2196F3', label: 'E' },
};

export function AttendanceMarkScreen() {
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation('teacher');
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};
  const networkState = useNetworkStatus();
  const isOnline = networkState.isOnline;

  // State
  const [selectedClassId, setSelectedClassId] = useState(params.classId || '');
  const [selectedDate, setSelectedDate] = useState(
    params.date ? new Date(params.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: classes, isLoading: classesLoading } = useTeacherClassesQuery();
  const dateString = selectedDate.toISOString().split('T')[0];
  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
    refetch,
  } = useClassAttendanceQuery({
    classId: selectedClassId,
    date: dateString,
  });

  // Mutation
  const markAttendance = useMarkAttendance();

  // Selected class info
  const selectedClass = useMemo(
    () => classes?.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Initialize attendance map when students load
  React.useEffect(() => {
    if (students && Object.keys(attendanceMap).length === 0) {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach(s => {
        initial[s.student_id] = s.status;
      });
      setAttendanceMap(initial);
    }
  }, [students]);

  // Get current attendance with local changes
  const currentAttendance = useMemo(() => {
    if (!students) return [];
    return students.map(s => ({
      ...s,
      status: attendanceMap[s.student_id] || s.status,
    }));
  }, [students, attendanceMap]);

  // Summary
  const summary = useMemo(
    () => getAttendanceSummary(currentAttendance),
    [currentAttendance]
  );

  // Handlers
  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    setHasChanges(true);
  }, []);

  const handleMarkAll = useCallback((status: AttendanceStatus) => {
    if (!students) return;
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      newMap[s.student_id] = status;
    });
    setAttendanceMap(newMap);
    setHasChanges(true);
  }, [students]);

  const handleSave = useCallback(async () => {
    if (!selectedClassId || !students) return;

    const records = students.map(s => ({
      student_id: s.student_id,
      status: attendanceMap[s.student_id] || s.status,
    }));

    try {
      await markAttendance.mutateAsync({
        classId: selectedClassId,
        date: dateString,
        records,
      });

      Alert.alert(
        t('screens.attendanceMark.messages.saveSuccess', { defaultValue: 'Success' }),
        t('screens.attendanceMark.messages.saveSuccessDetail', {
          defaultValue: 'Attendance saved successfully',
          count: records.length,
        }),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        t('screens.attendanceMark.messages.saveFailed', { defaultValue: 'Error' }),
        t('screens.attendanceMark.messages.saveFailedDetail', {
          defaultValue: 'Failed to save attendance. Please try again.',
        })
      );
    }
  }, [selectedClassId, students, attendanceMap, dateString, markAttendance, t, navigation]);

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setAttendanceMap({}); // Reset when date changes
      setHasChanges(false);
    }
  }, []);

  const handleClassSelect = useCallback((classItem: TeacherClass) => {
    setSelectedClassId(classItem.id);
    setShowClassPicker(false);
    setAttendanceMap({}); // Reset when class changes
    setHasChanges(false);
  }, []);

  // Render student item
  const renderStudent = useCallback(({ item }: { item: StudentAttendance }) => {
    const currentStatus = attendanceMap[item.student_id] || item.status;
    const isHindi = i18n.language === 'hi';

    return (
      <View style={[styles.studentRow, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
          {item.avatar_url ? (
            <Icon name="account" size={24} color={colors.primary} />
          ) : (
            <AppText style={[styles.avatarText, { color: colors.primary }]}>
              {item.student_name_en.charAt(0)}
            </AppText>
          )}
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
            {isHindi && item.student_name_hi ? item.student_name_hi : item.student_name_en}
          </AppText>
          <AppText style={[styles.rollNumber, { color: colors.onSurfaceVariant }]}>
            {t('screens.attendanceMark.labels.roll', { defaultValue: 'Roll' })} #{item.roll_number}
          </AppText>
        </View>

        {/* Status Buttons */}
        <View style={styles.statusButtons}>
          {(['present', 'absent', 'late'] as AttendanceStatus[]).map(status => {
            const config = STATUS_CONFIG[status];
            const isSelected = currentStatus === status;

            return (
              <TouchableOpacity
                key={status}
                onPress={() => handleStatusChange(item.student_id, status)}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: isSelected ? config.color : colors.surfaceVariant,
                    borderRadius: borderRadius.small,
                  },
                ]}
                accessibilityLabel={`Mark ${item.student_name_en} as ${status}`}
                accessibilityRole="button"
              >
                <AppText
                  style={[
                    styles.statusLabel,
                    { color: isSelected ? '#FFFFFF' : colors.onSurfaceVariant },
                  ]}
                >
                  {config.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [attendanceMap, colors, borderRadius, i18n.language, t, handleStatusChange]);

  // Loading state
  if (classesLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>
            {t('screens.attendanceMark.states.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('screens.attendanceMark.title', { defaultValue: 'Mark Attendance' })}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || markAttendance.isPending || !selectedClassId}
          style={[
            styles.saveBtn,
            {
              backgroundColor: hasChanges && selectedClassId ? colors.primary : colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
        >
          {markAttendance.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText
              style={{
                color: hasChanges && selectedClassId ? '#FFFFFF' : colors.onSurfaceVariant,
                fontWeight: '600',
              }}
            >
              {t('screens.attendanceMark.actions.save', { defaultValue: 'Save' })}
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {/* Class & Date Selectors */}
      <View style={styles.selectors}>
        {/* Class Selector */}
        <TouchableOpacity
          onPress={() => setShowClassPicker(!showClassPicker)}
          style={[styles.selector, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
        >
          <Icon name="google-classroom" size={20} color={colors.primary} />
          <AppText style={[styles.selectorText, { color: colors.onSurface }]} numberOfLines={1}>
            {selectedClass?.name || t('screens.attendanceMark.labels.selectClass', { defaultValue: 'Select Class' })}
          </AppText>
          <Icon name="chevron-down" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Date Selector */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.selector, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
        >
          <Icon name="calendar" size={20} color={colors.primary} />
          <AppText style={[styles.selectorText, { color: colors.onSurface }]}>
            {selectedDate.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </AppText>
          <Icon name="chevron-down" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Class Picker Dropdown */}
      {showClassPicker && classes && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
          <ScrollView style={styles.dropdownScroll}>
            {classes.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => handleClassSelect(c)}
                style={[
                  styles.dropdownItem,
                  c.id === selectedClassId && { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <AppText style={{ color: colors.onSurface }}>{c.name}</AppText>
                <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {c.student_count} {t('screens.attendanceMark.labels.students', { defaultValue: 'students' })}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Summary Stats */}
      {selectedClassId && students && (
        <View style={[styles.summary, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>{summary.total}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceMark.stats.total', { defaultValue: 'Total' })}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: STATUS_CONFIG.present.color }]}>{summary.present}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceMark.stats.present', { defaultValue: 'Present' })}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: STATUS_CONFIG.absent.color }]}>{summary.absent}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceMark.stats.absent', { defaultValue: 'Absent' })}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: STATUS_CONFIG.late.color }]}>{summary.late}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceMark.stats.late', { defaultValue: 'Late' })}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>{summary.percentage}%</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceMark.stats.rate', { defaultValue: 'Rate' })}
            </AppText>
          </View>
        </View>
      )}

      {/* Bulk Actions */}
      {selectedClassId && students && (
        <View style={styles.bulkActions}>
          <AppText style={[styles.bulkLabel, { color: colors.onSurfaceVariant }]}>
            {t('screens.attendanceMark.labels.markAll', { defaultValue: 'Mark All:' })}
          </AppText>
          <TouchableOpacity
            onPress={() => handleMarkAll('present')}
            style={[styles.bulkBtn, { backgroundColor: `${STATUS_CONFIG.present.color}20` }]}
          >
            <Icon name={STATUS_CONFIG.present.icon} size={16} color={STATUS_CONFIG.present.color} />
            <AppText style={{ color: STATUS_CONFIG.present.color, marginLeft: 4, fontSize: 12 }}>
              {t('screens.attendanceMark.actions.allPresent', { defaultValue: 'Present' })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMarkAll('absent')}
            style={[styles.bulkBtn, { backgroundColor: `${STATUS_CONFIG.absent.color}20` }]}
          >
            <Icon name={STATUS_CONFIG.absent.icon} size={16} color={STATUS_CONFIG.absent.color} />
            <AppText style={{ color: STATUS_CONFIG.absent.color, marginLeft: 4, fontSize: 12 }}>
              {t('screens.attendanceMark.actions.allAbsent', { defaultValue: 'Absent' })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* No Class Selected */}
      {!selectedClassId && (
        <View style={styles.centerContent}>
          <Icon name="google-classroom" size={64} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}>
            {t('screens.attendanceMark.states.selectClass', { defaultValue: 'Please select a class to mark attendance' })}
          </AppText>
        </View>
      )}

      {/* Loading Students */}
      {selectedClassId && studentsLoading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error State */}
      {selectedClassId && studentsError && (
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={{ color: colors.error, marginTop: 12 }}>
            {t('screens.attendanceMark.states.error', { defaultValue: 'Failed to load students' })}
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.error }]}
          >
            <AppText style={{ color: '#FFFFFF' }}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Student List */}
      {selectedClassId && students && !studentsLoading && (
        <FlatList
          data={currentAttendance}
          keyExtractor={item => item.student_id}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectors: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
  },
  dropdown: {
    marginHorizontal: 16,
    marginBottom: 12,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  bulkLabel: {
    fontSize: 13,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
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
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  rollNumber: {
    fontSize: 12,
    marginTop: 2,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
