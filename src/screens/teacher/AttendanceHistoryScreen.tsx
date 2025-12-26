import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { useTeacherClassesQuery } from '../../hooks/queries/teacher/useTeacherClassesQuery';

type AttendanceRecord = {
  id: string;
  date: string;
  class_id: string;
  class_name_en: string;
  class_name_hi?: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
};

// Demo data for attendance history
const generateHistoryData = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const classes = [
    { id: 'c1', name_en: 'Class 10-A', name_hi: 'कक्षा 10-A', total: 35 },
    { id: 'c2', name_en: 'Class 9-B', name_hi: 'कक्षा 9-B', total: 38 },
    { id: 'c3', name_en: 'Class 8-C', name_hi: 'कक्षा 8-C', total: 40 },
  ];

  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    classes.forEach(cls => {
      const present = Math.floor(cls.total * (0.85 + Math.random() * 0.12));
      const late = Math.floor(Math.random() * 3);
      const absent = cls.total - present - late;
      records.push({
        id: `${cls.id}-${date.toISOString().split('T')[0]}`,
        date: date.toISOString().split('T')[0],
        class_id: cls.id,
        class_name_en: cls.name_en,
        class_name_hi: cls.name_hi,
        total_students: cls.total,
        present,
        absent,
        late,
        rate: Math.round((present / cls.total) * 100),
      });
    });
  }
  return records.sort((a, b) => b.date.localeCompare(a.date));
};

export function AttendanceHistoryScreen() {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const navigation = useNavigation();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showClassFilter, setShowClassFilter] = useState(false);

  const { data: classes } = useTeacherClassesQuery();
  const historyData = useMemo(() => generateHistoryData(), []);

  const filteredData = useMemo(() => {
    if (selectedClass === 'all') return historyData;
    return historyData.filter(r => r.class_id === selectedClass);
  }, [historyData, selectedClass]);

  // Group by date
  const groupedData = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    filteredData.forEach(record => {
      if (!groups[record.date]) {
        groups[record.date] = [];
      }
      groups[record.date].push(record);
    });
    return Object.entries(groups).map(([date, records]) => ({ date, records }));
  }, [filteredData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return t('screens.attendanceHistory.today', { defaultValue: 'Today' });
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return t('screens.attendanceHistory.yesterday', { defaultValue: 'Yesterday' });
    }
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return colors.success;
    if (rate >= 75) return colors.warning;
    return colors.error;
  };

  const renderRecord = (record: AttendanceRecord) => (
    <TouchableOpacity
      key={record.id}
      style={[styles.recordCard, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
      onPress={() => navigation.navigate('AttendanceMark' as never, {
        classId: record.class_id,
        date: record.date
      } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.recordMain}>
        <View style={styles.recordInfo}>
          <AppText style={[styles.className, { color: colors.onSurface }]}>
            {getLocalizedField(record, 'class_name')}
          </AppText>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="check-circle" size={14} color={colors.success} />
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {record.present}
              </AppText>
            </View>
            <View style={styles.stat}>
              <Icon name="close-circle" size={14} color={colors.error} />
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {record.absent}
              </AppText>
            </View>
            <View style={styles.stat}>
              <Icon name="clock-alert" size={14} color={colors.warning} />
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {record.late}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.rateContainer}>
          <AppText style={[styles.rateValue, { color: getRateColor(record.rate) }]}>
            {record.rate}%
          </AppText>
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </View>
      </View>
    </TouchableOpacity>
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
          {t('screens.attendanceHistory.title', { defaultValue: 'Attendance History' })}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={() => setShowClassFilter(!showClassFilter)}
        >
          <Icon name="filter-variant" size={18} color={colors.primary} />
          <AppText style={[styles.filterText, { color: colors.onSurface }]}>
            {selectedClass === 'all'
              ? t('screens.attendanceHistory.allClasses', { defaultValue: 'All Classes' })
              : classes?.find(c => c.id === selectedClass)?.name || selectedClass
            }
          </AppText>
          <Icon name="chevron-down" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Class Filter Dropdown */}
      {showClassFilter && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          <TouchableOpacity
            style={[styles.dropdownItem, selectedClass === 'all' && { backgroundColor: colors.primaryContainer }]}
            onPress={() => { setSelectedClass('all'); setShowClassFilter(false); }}
          >
            <AppText style={{ color: selectedClass === 'all' ? colors.primary : colors.onSurface }}>
              {t('screens.attendanceHistory.allClasses', { defaultValue: 'All Classes' })}
            </AppText>
          </TouchableOpacity>
          {classes?.map(cls => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.dropdownItem, selectedClass === cls.id && { backgroundColor: colors.primaryContainer }]}
              onPress={() => { setSelectedClass(cls.id); setShowClassFilter(false); }}
            >
              <AppText style={{ color: selectedClass === cls.id ? colors.primary : colors.onSurface }}>
                {cls.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* History List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {groupedData.map(group => (
          <View key={group.date} style={styles.dateGroup}>
            <AppText style={[styles.dateHeader, { color: colors.onSurfaceVariant }]}>
              {formatDate(group.date)}
            </AppText>
            {group.records.map(renderRecord)}
          </View>
        ))}

        {groupedData.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t('screens.attendanceHistory.empty', { defaultValue: 'No attendance records found' })}
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
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: 120,
    left: 16,
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
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  dateGroup: {
    gap: 8,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  recordCard: {
    padding: 14,
    marginBottom: 8,
  },
  recordMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
