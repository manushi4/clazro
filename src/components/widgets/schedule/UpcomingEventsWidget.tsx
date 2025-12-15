/**
 * Upcoming Events Widget
 * Displays upcoming school/academic events like exams, holidays, sports days
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useUpcomingEventsQuery, UpcomingEvent } from '../../../hooks/queries/useUpcomingEventsQuery';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';

type UpcomingEventsConfig = {
  maxItems?: number;
  showDescription?: boolean;
  showLocation?: boolean;
  showTime?: boolean;
  showImportantBadge?: boolean;
  showEventType?: boolean;
  layoutStyle?: 'list' | 'cards' | 'compact';
  enableTap?: boolean;
};

export const UpcomingEventsWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();

  const {
    maxItems = 5,
    showDescription = true,
    showLocation = true,
    showTime = true,
    showImportantBadge = true,
    showEventType = true,
    layoutStyle = 'list',
    enableTap = true,
  } = config as UpcomingEventsConfig;

  const { data, isLoading, error, refetch } = useUpcomingEventsQuery(maxItems);

  const handleEventPress = (event: UpcomingEvent) => {
    if (enableTap && onNavigate) {
      onNavigate(`event/${event.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={[styles.skeletonHeader, { backgroundColor: colors.outline }]} />
        <View style={styles.skeletonList}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.outline }]} />
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
          {t('widgets.upcomingEvents.states.error')}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.upcomingEvents.actions.retry')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.events.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="calendar-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.upcomingEvents.states.empty')}
        </AppText>
      </View>
    );
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exam: t('widgets.upcomingEvents.types.exam'),
      holiday: t('widgets.upcomingEvents.types.holiday'),
      sports: t('widgets.upcomingEvents.types.sports'),
      cultural: t('widgets.upcomingEvents.types.cultural'),
      meeting: t('widgets.upcomingEvents.types.meeting'),
      deadline: t('widgets.upcomingEvents.types.deadline'),
      general: t('widgets.upcomingEvents.types.general'),
    };
    return labels[type] || type;
  };

  const getDaysUntilLabel = (days: number) => {
    if (days === 0) return t('widgets.upcomingEvents.labels.today');
    if (days === 1) return t('widgets.upcomingEvents.labels.tomorrow');
    return t('widgets.upcomingEvents.labels.inDays', { count: days });
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderEvent = (event: UpcomingEvent) => {
    const isCompact = layoutStyle === 'compact';
    const isCard = layoutStyle === 'cards';

    return (
      <TouchableOpacity
        key={event.id}
        style={[
          isCard ? styles.cardItem : styles.listItem,
          { 
            backgroundColor: colors.surface,
            borderLeftColor: event.color,
            borderLeftWidth: isCard ? 0 : 3,
          },
        ]}
        onPress={() => handleEventPress(event)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${event.color}15` }]}>
          <Icon name={event.icon} size={isCompact ? 16 : 20} color={event.color} />
        </View>

        {/* Content */}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <AppText 
              style={[styles.eventTitle, { color: colors.onSurface }]} 
              numberOfLines={isCompact ? 1 : 2}
            >
              {event.title}
            </AppText>
            {showImportantBadge && event.is_important && (
              <View style={[styles.importantBadge, { backgroundColor: colors.error }]}>
                <Icon name="alert" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Event type badge */}
          {showEventType && !isCompact && (
            <View style={[styles.typeBadge, { backgroundColor: `${event.color}20` }]}>
              <AppText style={[styles.typeText, { color: event.color }]}>
                {getEventTypeLabel(event.event_type)}
              </AppText>
            </View>
          )}

          {/* Description */}
          {showDescription && event.description && !isCompact && (
            <AppText 
              style={[styles.eventDescription, { color: colors.onSurfaceVariant }]} 
              numberOfLines={2}
            >
              {event.description}
            </AppText>
          )}

          {/* Meta info */}
          <View style={styles.eventMeta}>
            {/* Days until */}
            <View style={styles.metaItem}>
              <Icon name="calendar" size={12} color={colors.onSurfaceVariant} />
              <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                {getDaysUntilLabel(event.days_until)}
              </AppText>
            </View>

            {/* Time */}
            {showTime && event.start_time && !event.is_all_day && (
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatTime(event.start_time)}
                </AppText>
              </View>
            )}

            {/* All day badge */}
            {event.is_all_day && (
              <View style={styles.metaItem}>
                <Icon name="calendar-today" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {t('widgets.upcomingEvents.labels.allDay')}
                </AppText>
              </View>
            )}

            {/* Location */}
            {showLocation && event.location && !isCompact && (
              <View style={styles.metaItem}>
                <Icon name="map-marker" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {event.location}
                </AppText>
              </View>
            )}
          </View>
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
            {t('widgets.upcomingEvents.title')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.upcomingEvents.subtitle', { count: data.thisWeekCount })}
          </AppText>
        </View>
        {data.importantCount > 0 && (
          <View style={[styles.importantCounter, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={14} color={colors.error} />
            <AppText style={[styles.importantCountText, { color: colors.error }]}>
              {data.importantCount}
            </AppText>
          </View>
        )}
      </View>

      {/* Events List */}
      {layoutStyle === 'cards' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardsContainer}>
            {data.events.map(renderEvent)}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {data.events.map(renderEvent)}
        </View>
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <AppText style={[styles.totalText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.upcomingEvents.labels.totalEvents', { count: data.totalCount })}
        </AppText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onNavigate?.('events')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.upcomingEvents.actions.viewAll')}
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
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  importantCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  importantCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    gap: 8,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  cardItem: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  importantBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalText: {
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
  skeletonList: {
    gap: 8,
    marginTop: 12,
  },
  skeletonItem: {
    height: 70,
    borderRadius: 10,
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
