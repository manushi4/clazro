import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { usePendingClassesQuery } from '../../../hooks/queries/teacher/usePendingClassesQuery';
import { useMarkAllPresent } from '../../../hooks/mutations/teacher/useMarkAllPresent';

export const AttendanceQuickMarkWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const [markedClasses, setMarkedClasses] = useState<Set<string>>(new Set());

  const maxItems = (config?.maxItems as number) || 5;
  const showStudentCount = config?.showStudentCount !== false;

  const { data, isLoading, error, refetch } = usePendingClassesQuery();
  const markAllPresent = useMarkAllPresent();

  const handleMarkAllPresent = async (classId: string, className: string) => {
    try {
      const result = await markAllPresent.mutateAsync({ classId, className });
      if (result.success) {
        setMarkedClasses((prev) => new Set(prev).add(classId));
        Alert.alert(
          t('widgets.attendanceQuickMark.success.title', { defaultValue: 'Marked!' }),
          t('widgets.attendanceQuickMark.success.message', {
            count: result.markedCount,
            className: result.className,
            defaultValue: `${result.markedCount} students marked present in ${result.className}`,
          })
        );
      }
    } catch (err) {
      Alert.alert(
        t('widgets.attendanceQuickMark.error.title', { defaultValue: 'Error' }),
        t('widgets.attendanceQuickMark.error.message', { defaultValue: 'Failed to mark attendance' })
      );
    }
  };

  const handleEdit = (classId: string, className: string) => {
    onNavigate?.('AttendanceMark', { classId, className });
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
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t('widgets.attendanceQuickMark.states.error', { defaultValue: 'Failed to load' })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t('common:actions.retry', { defaultValue: 'Retry' })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter out already marked classes
  const pendingClasses = (data || []).filter((c) => !markedClasses.has(c.id));

  // Empty state (all done!)
  if (!pendingClasses.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: `${colors.success}15` }]}>
        <Icon name="check-circle" size={40} color={colors.success} />
        <AppText style={[styles.allDoneTitle, { color: colors.success }]}>
          {t('widgets.attendanceQuickMark.states.allDone', { defaultValue: 'All Done!' })}
        </AppText>
        <AppText style={[styles.allDoneSubtitle, { color: colors.onSurfaceVariant }]}>
          {t('widgets.attendanceQuickMark.states.allDoneMessage', {
            defaultValue: 'All classes marked for today',
          })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="clipboard-check-outline" size={18} color={colors.primary} />
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('widgets.attendanceQuickMark.title', { defaultValue: 'Quick Mark' })}
          </AppText>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: `${colors.warning}20` }]}>
          <AppText style={[styles.pendingText, { color: colors.warning }]}>
            {pendingClasses.length} {t('widgets.attendanceQuickMark.pending', { defaultValue: 'pending' })}
          </AppText>
        </View>
      </View>

      {/* Class List */}
      <View style={styles.classList}>
        {pendingClasses.slice(0, maxItems).map((classItem) => {
          const isMarking = markAllPresent.isPending && markAllPresent.variables?.classId === classItem.id;

          return (
            <View
              key={classItem.id}
              style={[
                styles.classItem,
                { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
              ]}
            >
              {/* Class Info */}
              <View style={styles.classInfo}>
                <View style={[styles.classIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Icon name="google-classroom" size={18} color={colors.primary} />
                </View>
                <View style={styles.classDetails}>
                  <AppText style={[styles.className, { color: colors.onSurface }]}>
                    {classItem.name} - {classItem.section}
                  </AppText>
                  {showStudentCount && (
                    <AppText style={[styles.studentCount, { color: colors.onSurfaceVariant }]}>
                      {classItem.studentCount} {t('widgets.attendanceQuickMark.students', { defaultValue: 'students' })}
                      {classItem.scheduleTime && ` | ${classItem.scheduleTime}`}
                    </AppText>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.editBtn, { borderColor: colors.outline }]}
                  onPress={() => handleEdit(classItem.id, `${classItem.name} - ${classItem.section}`)}
                >
                  <Icon name="pencil" size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.markBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleMarkAllPresent(classItem.id, `${classItem.name} - ${classItem.section}`)}
                  disabled={isMarking}
                >
                  {isMarking ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <Icon name="check-all" size={16} color={colors.onPrimary} />
                      <AppText style={[styles.markBtnText, { color: colors.onPrimary }]}>
                        {t('widgets.attendanceQuickMark.allPresent', { defaultValue: 'All Present' })}
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* View All Link */}
      {pendingClasses.length > maxItems && (
        <TouchableOpacity
          style={styles.viewAll}
          onPress={() => onNavigate?.('AttendanceMark')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.attendanceQuickMark.viewAll', {
              count: pendingClasses.length - maxItems,
              defaultValue: `+${pendingClasses.length - maxItems} more classes`,
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
  allDoneTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  allDoneSubtitle: {
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classList: {
    gap: 8,
  },
  classItem: {
    padding: 12,
    gap: 10,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  classIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
