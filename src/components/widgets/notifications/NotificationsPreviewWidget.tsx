/**
 * Notifications Preview Widget
 * Displays recent notifications with unread count and priority indicators
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useNotificationsPreviewQuery, NotificationItem } from '../../../hooks/queries/useNotificationsPreviewQuery';
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
};

export const NotificationsPreviewWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();

  const {
    maxItems = 5,
    showBody = true,
    showTime = true,
    showPriorityBadge = true,
    showCategory = false,
    showUnreadIndicator = true,
    layoutStyle = 'list',
    enableTap = true,
  } = config as NotificationsPreviewConfig;

  const { data, isLoading, error, refetch } = useNotificationsPreviewQuery(maxItems);

  const handleNotificationPress = (notification: NotificationItem) => {
    if (enableTap && onNavigate) {
      onNavigate(`notification/${notification.id}`);
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
        <Icon name="bell-alert" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t('widgets.notificationsPreview.states.error')}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.notificationsPreview.actions.retry')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.notifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="bell-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.notificationsPreview.states.empty')}
        </AppText>
      </View>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'normal': return colors.primary;
      case 'low': return colors.onSurfaceVariant;
      default: return colors.onSurfaceVariant;
    }
  };

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
                  {t('widgets.notificationsPreview.labels.urgent')}
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
            {t('widgets.notificationsPreview.title')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.notificationsPreview.subtitle', { count: data.unreadCount })}
          </AppText>
        </View>
        {data.unreadCount > 0 && (
          <View style={[styles.unreadCounter, { backgroundColor: colors.errorContainer }]}>
            <AppText style={[styles.unreadCountText, { color: colors.error }]}>
              {data.unreadCount}
            </AppText>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <View style={styles.listContainer}>
        {data.notifications.map(renderNotification)}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <AppText style={[styles.totalText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.notificationsPreview.labels.total', { count: data.totalCount })}
        </AppText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onNavigate?.('notifications')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.notificationsPreview.actions.viewAll')}
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
  listContainer: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderLeftWidth: 3,
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
