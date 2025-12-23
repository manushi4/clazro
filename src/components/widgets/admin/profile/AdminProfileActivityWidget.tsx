import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import {
  useAdminProfileActivityQuery,
  groupAdminActivitiesByDate,
  getAdminTodayStats,
  AdminProfileActivity,
  ADMIN_ACTIVITY_CONFIG,
} from '../../../../hooks/queries/admin/useAdminProfileActivityQuery';
import { getLocalizedField } from '../../../../utils/getLocalizedField';

const WIDGET_ID = 'profile.activity';

export const AdminProfileActivityWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as 'timeline' | 'list' | 'cards') || 'timeline';
  const maxItems = (config?.maxItems as number) || 10;
  const showTodayStats = config?.showTodayStats !== false;
  const showTime = config?.showTime !== false;
  const showGroupHeaders = config?.showGroupHeaders !== false;
  const showIcon = config?.showIcon !== false;
  const showDescription = config?.showDescription !== false;
  const showIpAddress = config?.showIpAddress === true;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll !== false;
  const typeFilter = (config?.typeFilter as string) || 'all';

  // Fetch activities
  const { data: activities, isLoading, error, refetch } = useAdminProfileActivityQuery({
    adminId: userId,
    limit: maxItems,
    typeFilter: typeFilter as any,
  });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      itemCount: activities?.length || 0,
    });
  }, [activities]);

  // Format relative time
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('widgets.profileActivity.time.justNow', { defaultValue: 'Just now' });
    if (diffMins < 60) return t('widgets.profileActivity.time.minutesAgo', { count: diffMins, defaultValue: `${diffMins}m ago` });
    if (diffHours < 24) return t('widgets.profileActivity.time.hoursAgo', { count: diffHours, defaultValue: `${diffHours}h ago` });
    if (diffDays === 1) return t('widgets.profileActivity.time.yesterday', { defaultValue: 'Yesterday' });
    if (diffDays < 7) return t('widgets.profileActivity.time.daysAgo', { count: diffDays, defaultValue: `${diffDays}d ago` });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle activity tap
  const handleActivityPress = (activity: AdminProfileActivity) => {
    if (!enableTap) return;

    trackWidgetEvent(WIDGET_ID, 'click', {
      action: 'activity_tap',
      activityId: activity.id,
      activityType: activity.type,
    });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_activity_tap`,
      level: 'info',
      data: { activityId: activity.id, type: activity.type },
    });

    // Navigate to activity detail or related entity
    if (activity.entity_type && activity.entity_id) {
      onNavigate?.(`${activity.entity_type}-detail`, { id: activity.entity_id });
    } else {
      onNavigate?.('audit-logs', { activityId: activity.id });
    }
  };

  // Handle view all
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    onNavigate?.('audit-logs');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.profileActivity.states.loading', { defaultValue: 'Loading activity...' })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error || !activities) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="history" size={32} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.profileActivity.states.error', { defaultValue: 'Failed to load activity' })}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t('widgets.profileActivity.actions.retry', { defaultValue: 'Retry' })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Icon name="history" size={32} color={colors.primary} />
        </View>
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t('widgets.profileActivity.states.empty', { defaultValue: 'No Activity Yet' })}
        </AppText>
        <AppText style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          {t('widgets.profileActivity.states.emptyMessage', { defaultValue: 'Your admin activities will appear here' })}
        </AppText>
      </View>
    );
  }

  const groupedActivities = groupAdminActivitiesByDate(activities);
  const todayStats = getAdminTodayStats(activities);

  // Render single activity item
  const renderActivity = (activity: AdminProfileActivity, isLast: boolean, showLine: boolean = true) => {
    const activityConfig = ADMIN_ACTIVITY_CONFIG[activity.type] || { icon: 'information', color: colors.outline };
    const title = getLocalizedField(activity, 'title');
    const description = getLocalizedField(activity, 'description');

    return (
      <TouchableOpacity
        key={activity.id}
        style={styles.activityRow}
        onPress={() => handleActivityPress(activity)}
        disabled={!enableTap}
        accessibilityLabel={t('widgets.profileActivity.activityHint', {
          title,
          time: formatTime(activity.activity_at),
          defaultValue: `${title} - ${formatTime(activity.activity_at)}`,
        })}
        accessibilityRole="button"
      >
        {/* Timeline line */}
        {layoutStyle === 'timeline' && showLine && (
          <View style={styles.timelineColumn}>
            <View style={[styles.timelineDot, { backgroundColor: activity.color || activityConfig.color }]}>
              <Icon name={activity.icon || activityConfig.icon} size={14} color="#fff" />
            </View>
            {!isLast && (
              <View style={[styles.timelineLine, { backgroundColor: colors.outline + '40' }]} />
            )}
          </View>
        )}

        {/* Activity card */}
        <View
          style={[
            styles.activityCard,
            compactMode && styles.activityCardCompact,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
              borderLeftColor: activity.color || activityConfig.color,
            },
          ]}
        >
          {/* Header row */}
          <View style={styles.activityHeader}>
            {layoutStyle !== 'timeline' && showIcon && (
              <View style={[styles.activityIcon, { backgroundColor: (activity.color || activityConfig.color) + '20' }]}>
                <Icon name={activity.icon || activityConfig.icon} size={16} color={activity.color || activityConfig.color} />
              </View>
            )}
            <View style={styles.activityTitleContainer}>
              <AppText style={[styles.activityTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {title}
              </AppText>
              {showTime && (
                <AppText style={[styles.activityTime, { color: colors.onSurfaceVariant }]}>
                  {formatTime(activity.activity_at)}
                </AppText>
              )}
            </View>
            {enableTap && (
              <Icon name="chevron-right" size={18} color={colors.outline} />
            )}
          </View>

          {/* Description */}
          {!compactMode && showDescription && description && (
            <AppText style={[styles.activityDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {description}
            </AppText>
          )}

          {/* Meta row */}
          {!compactMode && showIpAddress && activity.ip_address && (
            <View style={styles.metaRow}>
              <Icon name="ip-network" size={12} color={colors.onSurfaceVariant} />
              <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                {activity.ip_address}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Today's Stats Banner */}
      {showTodayStats && todayStats.count > 0 && (
        <View style={[styles.todayBanner, { backgroundColor: colors.primary + '15', borderRadius: borderRadius.medium }]}>
          <View style={styles.todayHeader}>
            <Icon name="calendar-today" size={18} color={colors.primary} />
            <AppText style={[styles.todayTitle, { color: colors.primary }]}>
              {t('widgets.profileActivity.todayProgress', { defaultValue: "Today's Activity" })}
            </AppText>
          </View>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <AppText style={[styles.todayStatValue, { color: colors.onSurface }]}>
                {todayStats.count}
              </AppText>
              <AppText style={[styles.todayStatLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.profileActivity.actions', { defaultValue: 'Actions' })}
              </AppText>
            </View>
            {Object.keys(todayStats.types).length > 0 && (
              <>
                <View style={[styles.todayDivider, { backgroundColor: colors.primary + '30' }]} />
                <View style={styles.todayStat}>
                  <AppText style={[styles.todayStatValue, { color: colors.onSurface }]}>
                    {Object.keys(todayStats.types).length}
                  </AppText>
                  <AppText style={[styles.todayStatLabel, { color: colors.onSurfaceVariant }]}>
                    {t('widgets.profileActivity.types', { defaultValue: 'Types' })}
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Activity Feed */}
      {layoutStyle === 'cards' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {activities.slice(0, maxItems).map((activity, i) => {
            const activityConfig = ADMIN_ACTIVITY_CONFIG[activity.type] || { icon: 'information', color: colors.outline };
            return (
              <TouchableOpacity
                key={activity.id}
                style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
                onPress={() => handleActivityPress(activity)}
                disabled={!enableTap}
              >
                <View style={[styles.cardIcon, { backgroundColor: (activity.color || activityConfig.color) + '20' }]}>
                  <Icon
                    name={activity.icon || activityConfig.icon}
                    size={20}
                    color={activity.color || activityConfig.color}
                  />
                </View>
                <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {getLocalizedField(activity, 'title')}
                </AppText>
                <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
                  {formatTime(activity.activity_at)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.feedContainer}>
          {showGroupHeaders ? (
            groupedActivities.map((group, groupIndex) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={[styles.dateBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <AppText style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                      {group.label}
                    </AppText>
                  </View>
                  <View style={[styles.dateLine, { backgroundColor: colors.outline + '30' }]} />
                </View>
                {group.activities.map((activity, i) =>
                  renderActivity(activity, i === group.activities.length - 1 && groupIndex === groupedActivities.length - 1, layoutStyle === 'timeline')
                )}
              </View>
            ))
          ) : (
            activities.slice(0, maxItems).map((activity, i) =>
              renderActivity(activity, i === Math.min(activities.length, maxItems) - 1, layoutStyle === 'timeline')
            )
          )}
        </View>
      )}

      {/* View All Link */}
      {showViewAll && activities.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllContainer}
          onPress={handleViewAll}
          accessibilityLabel={t('widgets.profileActivity.viewAll', { defaultValue: 'View All Activity' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.profileActivity.viewAll', { defaultValue: 'View All Activity' })}
          </AppText>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Today's Stats Banner
  todayBanner: {
    padding: 14,
    gap: 10,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  todayStat: {
    alignItems: 'center',
    gap: 2,
  },
  todayStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  todayStatLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  todayDivider: {
    width: 1,
    height: 32,
  },

  // Feed Container
  feedContainer: {
    gap: 4,
  },

  // Date Group
  dateGroup: {
    gap: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateLine: {
    flex: 1,
    height: 1,
  },

  // Activity Row
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Timeline
  timelineColumn: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 1,
  },

  // Activity Card
  activityCard: {
    flex: 1,
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  activityCardCompact: {
    padding: 10,
    gap: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitleContainer: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 10,
  },
  activityDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 10,
  },

  // Cards Layout
  cardsScroll: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 8,
  },
  cardItem: {
    width: 120,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardTime: {
    fontSize: 9,
  },

  // View All
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AdminProfileActivityWidget;
