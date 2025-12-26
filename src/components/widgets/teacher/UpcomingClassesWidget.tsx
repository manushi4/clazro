import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { getLocalizedField } from '../../../utils/getLocalizedField';
import { AppText } from '../../../ui/components/AppText';
import { useTeacherScheduleQuery } from '../../../hooks/queries/teacher/useTeacherScheduleQuery';

export const UpcomingClassesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');

  // === CONFIG ===
  const maxItems = (config?.maxItems as number) || 5;
  const showRoom = config?.showRoom !== false;
  const showTime = config?.showTime !== false;

  // === DATA ===
  const { data, isLoading, error, refetch } = useTeacherScheduleQuery({
    limit: maxItems,
    todayOnly: true,
  });

  // === HELPERS ===
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const isCurrentClass = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const isUpcoming = (startTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    return startMinutes > currentMinutes;
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t('widgets.upcomingClasses.states.loading', { defaultValue: 'Loading schedule...' })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error, marginTop: 8 }}>
          {t('widgets.upcomingClasses.states.error', { defaultValue: 'Failed to load schedule' })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t('common.retry', { defaultValue: 'Retry' })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="calendar-blank-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t('widgets.upcomingClasses.states.empty', { defaultValue: 'No classes today' })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((entry, index) => {
        const isCurrent = isCurrentClass(entry.start_time, entry.end_time);
        const upcoming = isUpcoming(entry.start_time);
        const isPast = !isCurrent && !upcoming;

        return (
          <TouchableOpacity
            key={entry.id}
            onPress={() => onNavigate?.('class-detail', { classId: entry.class_id, scheduleId: entry.id })}
            style={[
              styles.classItem,
              {
                backgroundColor: isCurrent ? `${colors.primary}15` : colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                borderLeftColor: isCurrent ? colors.primary : isPast ? colors.outlineVariant : colors.secondary,
                opacity: isPast ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            {/* Time Column */}
            {showTime && (
              <View style={styles.timeColumn}>
                <AppText
                  style={[
                    styles.timeText,
                    { color: isCurrent ? colors.primary : colors.onSurfaceVariant },
                  ]}
                >
                  {formatTime(entry.start_time)}
                </AppText>
                <AppText style={[styles.timeDivider, { color: colors.outlineVariant }]}>|</AppText>
                <AppText style={[styles.timeEndText, { color: colors.outlineVariant }]}>
                  {formatTime(entry.end_time)}
                </AppText>
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <AppText
                  style={[styles.className, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {entry.class_name}
                </AppText>
                {isCurrent && (
                  <View style={[styles.liveTag, { backgroundColor: colors.primary }]}>
                    <AppText style={[styles.liveText, { color: colors.onPrimary }]}>
                      {t('widgets.upcomingClasses.now', { defaultValue: 'NOW' })}
                    </AppText>
                  </View>
                )}
              </View>

              <AppText
                style={[styles.subject, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {getLocalizedField(entry, 'subject')}
              </AppText>

              {showRoom && entry.room && (
                <View style={styles.roomRow}>
                  <Icon name="map-marker-outline" size={12} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.roomText, { color: colors.onSurfaceVariant }]}>
                    {entry.room}
                  </AppText>
                </View>
              )}
            </View>

            {/* Chevron */}
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        );
      })}

      {/* View All Link */}
      {data.length > maxItems && (
        <TouchableOpacity
          onPress={() => onNavigate?.('schedule-screen')}
          style={styles.viewAllBtn}
        >
          <AppText style={{ color: colors.primary, fontSize: 14 }}>
            {t('widgets.upcomingClasses.viewAll', { defaultValue: 'View Full Schedule' })}
          </AppText>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
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
    justifyContent: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderLeftWidth: 3,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeDivider: {
    fontSize: 8,
    marginVertical: 2,
  },
  timeEndText: {
    fontSize: 10,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  liveTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: 13,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roomText: {
    fontSize: 11,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
});

export default UpcomingClassesWidget;
