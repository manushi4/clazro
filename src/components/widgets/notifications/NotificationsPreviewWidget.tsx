/**
 * Notifications Preview Widget
 * Displays recent notifications with unread count and priority indicators
 * Supports full screen mode with filters, mark all read, and delete
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useNotificationsPreviewQuery, NotificationItem } from '../../../hooks/queries/useNotificationsPreviewQuery';
import { useMarkNotificationRead, useDeleteNotification, useMarkAllNotificationsRead } from '../../../hooks/queries/useNotificationQuery';
import { useDemoUser } from '../../../hooks/useDemoUser';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';

type NotificationsPreviewConfig = {
  maxItems?: number;
  showBody?: boolean;
  showTime?: boolean;
  showPriorityBadge?: boolean;
  showCategory?: boolean;
  showUnreadIndicator?: boolean;
  layoutStyle?: 'list' | 'cards' | 'compact';
  enableTap?: boolean;
  showAll?: boolean;
  showFilters?: boolean;
  showMarkAllRead?: boolean;
  showCategories?: boolean;
};

type FilterType = 'all' | 'unread' | 'high';

export const NotificationsPreviewWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();
  const { userId } = useDemoUser();

  const {
    maxItems = 5,
    showBody = true,
    showTime = true,
    showPriorityBadge = true,
    showCategory = false,
    showUnreadIndicator = true,
    layoutStyle = 'list',
    enableTap = true,
    showAll = false,
    showFilters = false,
    showMarkAllRead = false,
  } = config as NotificationsPreviewConfig;

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Use higher limit for full screen mode
  const effectiveMaxItems = showAll ? 100 : maxItems;
  const { data, isLoading, error, refetch } = useNotificationsPreviewQuery(effectiveMaxItems);
  
  // Mutations
  const markAsRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();
  const markAllRead = useMarkAllNotificationsRead();

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    if (!enableTap) return;
    
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    // Navigate to detail
    if (onNavigate) {
      onNavigate("notification-detail", { notificationId: notification.id });
    }
  }, [enableTap, markAsRead, onNavigate]);

  const handleDelete = useCallback((notification: NotificationItem) => {
    // Prevent deleting urgent/important notifications
    if (notification.priority === 'high') {
      Alert.alert(
        t('widgets.notificationsPreview.actions.cannotDeleteTitle', { defaultValue: 'Cannot Delete' }),
        t('widgets.notificationsPreview.actions.cannotDeleteMessage', { defaultValue: 'Urgent notifications cannot be deleted. Please contact support if you need to remove this notification.' }),
        [{ text: t('common.ok', { defaultValue: 'OK' }) }]
      );
      return;
    }

    Alert.alert(
      t('widgets.notificationsPreview.actions.deleteTitle', { defaultValue: 'Delete Notification' }),
      t('widgets.notificationsPreview.actions.deleteMessage', { defaultValue: 'Are you sure you want to delete this notification?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        { 
          text: t('common.delete', { defaultValue: 'Delete' }), 
          style: 'destructive',
          onPress: () => deleteNotification.mutate(notification.id),
        },
      ]
    );
  }, [deleteNotification, t]);

  const handleMarkAllRead = useCallback(() => {
    if (userId && data && data.unreadCount > 0) {
      markAllRead.mutate(userId);
    }
  }, [userId, data, markAllRead]);

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    if (!data?.notifications) return [];
    
    switch (activeFilter) {
      case 'unread':
        return data.notifications.filter(n => !n.is_read);
      case 'high':
        return data.notifications.filter(n => n.priority === 'high');
      default:
        return data.notifications;
    }
  }, [data?.notifications, activeFilter]);

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
        <Icon name="bell-alert" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t('widgets.notificationsPreview.states.error', { defaultValue: 'Failed to load notifications' })}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.notificationsPreview.actions.retry', { defaultValue: 'Retry' })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || filteredNotifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        {/* Header for full screen */}
        {showAll && (
          <View style={styles.header}>
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.notificationsPreview.title', { defaultValue: 'Notifications' })}
            </AppText>
          </View>
        )}
        {/* Filters */}
        {showFilters && renderFilters()}
        <View style={styles.emptyContent}>
          <Icon name="bell-check" size={32} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {activeFilter === 'all' 
              ? t('widgets.notificationsPreview.states.empty', { defaultValue: 'No notifications' })
              : t('widgets.notificationsPreview.states.emptyFiltered', { defaultValue: 'No notifications match this filter' })
            }
          </AppText>
        </View>
      </View>
    );
  }

  function renderFilters() {
    const filters: { key: FilterType; label: string; icon: string }[] = [
      { key: 'all', label: t('widgets.notificationsPreview.filters.all', { defaultValue: 'All' }), icon: 'bell' },
      { key: 'unread', label: t('widgets.notificationsPreview.filters.unread', { defaultValue: 'Unread' }), icon: 'bell-badge' },
      { key: 'high', label: t('widgets.notificationsPreview.filters.urgent', { defaultValue: 'Urgent' }), icon: 'alert' },
    ];

    return (
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              { 
                backgroundColor: activeFilter === filter.key ? colors.primary : colors.surface,
                borderColor: activeFilter === filter.key ? colors.primary : colors.outline,
              },
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Icon 
              name={filter.icon} 
              size={14} 
              color={activeFilter === filter.key ? colors.onPrimary : colors.onSurfaceVariant} 
            />
            <AppText 
              style={[
                styles.filterText, 
                { color: activeFilter === filter.key ? colors.onPrimary : colors.onSurfaceVariant }
              ]}
            >
              {filter.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    );
  }


  const renderNotification = (notification: NotificationItem) => {
    const isCompact = layoutStyle === 'compact';

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          { 
            backgroundColor: notification.is_read ? colors.surface : `${colors.primary}08`,
            borderLeftColor: notification.color,
          },
        ]}
        onPress={() => handleNotificationPress(notification)}
        onLongPress={() => handleDelete(notification)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${notification.color}15` }]}>
          <Icon name={notification.icon} size={isCompact ? 16 : 20} color={notification.color} />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <AppText 
              style={[
                styles.notificationTitle, 
                { color: colors.onSurface },
                !notification.is_read && styles.unreadTitle,
              ]} 
              numberOfLines={1}
            >
              {notification.title}
            </AppText>
            
            {/* Unread indicator */}
            {showUnreadIndicator && !notification.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>

          {/* Body */}
          {showBody && notification.body && !isCompact && (
            <AppText 
              style={[styles.notificationBody, { color: colors.onSurfaceVariant }]} 
              numberOfLines={2}
            >
              {notification.body}
            </AppText>
          )}

          {/* Meta info */}
          <View style={styles.notificationMeta}>
            {/* Time */}
            {showTime && (
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {notification.time_ago}
                </AppText>
              </View>
            )}

            {/* Category */}
            {showCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: `${notification.color}20` }]}>
                <AppText style={[styles.categoryText, { color: notification.color }]}>
                  {notification.category}
                </AppText>
              </View>
            )}

            {/* Priority badge */}
            {showPriorityBadge && notification.priority === 'high' && (
              <View style={[styles.priorityBadge, { backgroundColor: `${colors.error}15` }]}>
                <Icon name="alert" size={10} color={colors.error} />
                <AppText style={[styles.priorityText, { color: colors.error }]}>
                  {t('widgets.notificationsPreview.labels.urgent', { defaultValue: 'Urgent' })}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Delete button for full screen mode - hidden for urgent notifications */}
        {showAll && notification.priority !== 'high' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(notification)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="trash-can-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
        {/* Lock icon for urgent notifications */}
        {showAll && notification.priority === 'high' && (
          <View style={styles.lockedIcon}>
            <Icon name="lock" size={16} color={colors.onSurfaceVariant} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.notificationsPreview.title', { defaultValue: 'Notifications' })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.notificationsPreview.subtitle', { count: data.unreadCount, defaultValue: '{{count}} unread' })}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          {/* Mark all read button */}
          {showMarkAllRead && data.unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: colors.primaryContainer }]}
              onPress={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <Icon name="check-all" size={16} color={colors.primary} />
              <AppText style={[styles.markAllText, { color: colors.primary }]}>
                {t('widgets.notificationsPreview.actions.markAllRead', { defaultValue: 'Mark all read' })}
              </AppText>
            </TouchableOpacity>
          )}
          {/* Unread counter */}
          {!showMarkAllRead && data.unreadCount > 0 && (
            <View style={[styles.unreadCounter, { backgroundColor: colors.errorContainer }]}>
              <AppText style={[styles.unreadCountText, { color: colors.error }]}>
                {data.unreadCount}
              </AppText>
            </View>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Notifications List */}
      <View style={styles.listContainer}>
        {filteredNotifications.map(renderNotification)}
      </View>

      {/* Footer - only show in preview mode */}
      {!showAll && (
        <View style={[styles.footer, { borderTopColor: colors.outline }]}>
          <AppText style={[styles.totalText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.notificationsPreview.labels.total', { count: data.totalCount, defaultValue: '{{count}} total' })}
          </AppText>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => onNavigate?.('notifications')}
          >
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t('widgets.notificationsPreview.actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Long press hint for full screen */}
      {showAll && (
        <View style={styles.hintContainer}>
          <AppText style={[styles.hintText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.notificationsPreview.hints.longPress', { defaultValue: 'Long press to delete' })}
          </AppText>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadCounter: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationMeta: {
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
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  lockedIcon: {
    padding: 8,
    opacity: 0.5,
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
  hintContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    fontSize: 11,
    fontStyle: 'italic',
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
  emptyContent: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
