/**
 * Week Calendar Widget
 * Displays a weekly calendar view with classes/events grouped by day
 */
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useWeekCalendarQuery, CalendarEvent, DayEvents } from '../../../hooks/queries/useWeekCalendarQuery';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';

type WeekCalendarConfig = {
  showWeekNavigation?: boolean;
  showEventCount?: boolean;
  showEventTime?: boolean;
  showSubjectColor?: boolean;
  showLiveIndicator?: boolean;
  maxEventsPerDay?: number;
  compactMode?: boolean;
  enableTap?: boolean;
};

export const WeekCalendarWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  const {
    showWeekNavigation = true,
    showEventCount = true,
    showEventTime = true,
    showSubjectColor = true,
    showLiveIndicator = true,
    maxEventsPerDay = 3,
    compactMode = false,
    enableTap = true,
  } = config as WeekCalendarConfig;

  const { data, isLoading, error, refetch } = useWeekCalendarQuery(weekOffset);

  const handleDayPress = (day: DayEvents) => {
    if (enableTap && onNavigate) {
      onNavigate(`schedule?date=${day.date}`);
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (enableTap && onNavigate) {
      // Navigate to class-detail screen with classId
      onNavigate("class-detail", { classId: event.id });
    }
  };

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);
  const handleCurrentWeek = () => setWeekOffset(0);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={[styles.skeletonHeader, { backgroundColor: colors.outline }]} />
        <View style={styles.skeletonWeek}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <View key={i} style={[styles.skeletonDay, { backgroundColor: colors.outline }]} />
          ))}
        </View>
      </View>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="calendar-alert" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t('widgets.weekCalendar.states.error')}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.weekCalendar.actions.retry')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.totalEvents === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="calendar-blank-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.weekCalendar.states.empty')}
        </AppText>
      </View>
    );
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderEvent = (event: CalendarEvent) => {
    if (compactMode) {
      return (
        <View
          key={event.id}
          style={[styles.eventDot, { backgroundColor: showSubjectColor ? event.subject_color : colors.primary }]}
        />
      );
    }

    return (
      <TouchableOpacity
        key={event.id}
        style={[
          styles.eventCard,
          {
            backgroundColor: `${event.subject_color}15`,
            borderLeftColor: showSubjectColor ? event.subject_color : colors.primary,
          },
        ]}
        onPress={() => handleEventPress(event)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {showEventTime && (
          <AppText style={[styles.eventTime, { color: colors.onSurfaceVariant }]}>
            {formatTime(event.start_time)}
          </AppText>
        )}
        <AppText style={[styles.eventTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {event.subject_name}
        </AppText>
        {showLiveIndicator && event.is_live && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
            <AppText style={[styles.liveText, { color: colors.error }]}>
              {t('widgets.weekCalendar.labels.live')}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDay = (day: DayEvents) => {
    const eventsToShow = day.events.slice(0, maxEventsPerDay);
    const hasMore = day.events.length > maxEventsPerDay;

    return (
      <TouchableOpacity
        key={day.date}
        style={styles.dayColumn}
        onPress={() => handleDayPress(day)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayHeader,
          day.isToday && { backgroundColor: colors.primary }
        ]}>
          <AppText style={[
            styles.dayName,
            { color: day.isToday ? colors.onPrimary : colors.onSurfaceVariant }
          ]}>
            {day.dayName}
          </AppText>
          <AppText style={[
            styles.dayNumber,
            { color: day.isToday ? colors.onPrimary : colors.onSurface }
          ]}>
            {day.dayNumber}
          </AppText>
          {showEventCount && day.eventCount > 0 && (
            <AppText style={[
              styles.eventCount,
              { color: day.isToday ? colors.onPrimary : colors.onSurfaceVariant }
            ]}>
              {day.eventCount}
            </AppText>
          )}
        </View>
        <View style={styles.eventsContainer}>
          {eventsToShow.map(event => renderEvent(event))}
          {hasMore && !compactMode && (
            <AppText style={[styles.moreText, { color: colors.onSurfaceVariant }]}>
              +{day.events.length - maxEventsPerDay}
            </AppText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.weekCalendar.title')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {data.weekStart} - {data.weekEnd}
          </AppText>
        </View>
        {showWeekNavigation && (
          <View style={styles.navContainer}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.surface }]}
              onPress={handlePrevWeek}
            >
              <Icon name="chevron-left" size={20} color={colors.primary} />
            </TouchableOpacity>
            {weekOffset !== 0 && (
              <TouchableOpacity
                style={[styles.todayButton, { backgroundColor: colors.primary }]}
                onPress={handleCurrentWeek}
              >
                <AppText style={styles.todayButtonText}>
                  {t('widgets.weekCalendar.labels.today')}
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.surface }]}
              onPress={handleNextWeek}
            >
              <Icon name="chevron-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Week View */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          {data.days.map(renderDay)}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <AppText style={[styles.totalEvents, { color: colors.onSurfaceVariant }]}>
          {t('widgets.weekCalendar.labels.totalEvents', { count: data.totalEvents })}
        </AppText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onNavigate?.('schedule')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.weekCalendar.actions.viewAll')}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    padding: 6,
    borderRadius: 8,
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  weekContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dayColumn: {
    width: 48,
    minHeight: 100,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventCount: {
    fontSize: 9,
    marginTop: 2,
    opacity: 0.8,
  },
  eventsContainer: {
    gap: 4,
    alignItems: 'center',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventCard: {
    width: '100%',
    padding: 4,
    borderRadius: 4,
    borderLeftWidth: 2,
  },
  eventTime: {
    fontSize: 8,
  },
  eventTitle: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  liveText: {
    fontSize: 7,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalEvents: {
    fontSize: 12,
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Skeleton styles
  skeletonHeader: {
    height: 40,
    borderRadius: 8,
    opacity: 0.3,
  },
  skeletonWeek: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  skeletonDay: {
    width: 48,
    height: 80,
    borderRadius: 8,
    opacity: 0.3,
  },
  // Error/Empty styles
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
