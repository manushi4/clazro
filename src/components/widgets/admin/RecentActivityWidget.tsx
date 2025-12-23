import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';
import { useRecentActivityQuery, ActivityType, RecentActivity } from '../../../hooks/queries/admin/useRecentActivityQuery';
import { formatDistanceToNow } from 'date-fns';

const WIDGET_ID = 'admin.recent-activity';

// Activity type configuration
const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; colorKey: 'primary' | 'success' | 'warning' | 'error' | 'tertiary' | 'secondary' }> = {
  user_created: { icon: 'account-plus', colorKey: 'primary' },
  user_updated: { icon: 'account-edit', colorKey: 'secondary' },
  user_suspended: { icon: 'account-off', colorKey: 'error' },
  user_activated: { icon: 'account-check', colorKey: 'success' },
  payment_received: { icon: 'cash-check', colorKey: 'success' },
  setting_changed: { icon: 'cog', colorKey: 'warning' },
  login: { icon: 'login', colorKey: 'tertiary' },
  content_created: { icon: 'file-plus', colorKey: 'primary' },
  content_updated: { icon: 'file-edit', colorKey: 'secondary' },
  alert_acknowledged: { icon: 'bell-check', colorKey: 'success' },
};

export const RecentActivityWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const maxItems = (config?.maxItems as number) || 5;
  const showAvatar = config?.showAvatar !== false;
  const showTime = config?.showTime !== false;
  const showIcon = config?.showIcon !== false;
  const showViewAll = config?.showViewAll !== false;
  const typeFilter = (config?.typeFilter as ActivityType | 'all') || 'all';
  const enableTap = config?.enableTap !== false;

  // Fetch recent activity
  const { data: activities, isLoading, error, refetch } = useRecentActivityQuery({
    limit: maxItems,
    typeFilter,
  });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { 
      size, 
      loadTime: Date.now() - renderStart.current,
      itemCount: activities?.length || 0,
    });
  }, [activities]);

  // Get color from theme
  const getActivityColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle activity tap
  const handleActivityPress = (activity: RecentActivity) => {
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
      onNavigate?.('activity-detail', { activityId: activity.id });
    }
  };

  // Handle view all
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    onNavigate?.('audit-logs');
  };

  // Render activity item
  const renderActivityItem = ({ item, index }: { item: RecentActivity; index: number }) => {
    const activityConfig = ACTIVITY_CONFIG[item.type] || { icon: 'information', colorKey: 'secondary' };
    const activityColor = getActivityColor(activityConfig.colorKey);

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => handleActivityPress(item)}
        disabled={!enableTap}
        accessibilityLabel={t('widgets.recentActivity.activityHint', {
          actor: item.actor_name,
          action: item.description,
          defaultValue: `${item.actor_name}: ${item.description}`,
        })}
        accessibilityRole="button"
      >
        {/* Avatar or Icon */}
        {showAvatar ? (
          <View style={[styles.avatar, { backgroundColor: `${activityColor}20` }]}>
            {item.actor_avatar ? (
              <Icon name="account" size={20} color={activityColor} />
            ) : (
              <AppText style={[styles.avatarText, { color: activityColor }]}>
                {getInitials(item.actor_name)}
              </AppText>
            )}
          </View>
        ) : showIcon ? (
          <View style={[styles.iconContainer, { backgroundColor: `${activityColor}15` }]}>
            <Icon name={activityConfig.icon} size={18} color={activityColor} />
          </View>
        ) : null}

        {/* Content */}
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <AppText 
              style={[styles.actorName, { color: colors.onSurface }]} 
              numberOfLines={1}
            >
              {item.actor_name}
            </AppText>
            {showTime && (
              <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </AppText>
            )}
          </View>
          <AppText 
            style={[styles.description, { color: colors.onSurfaceVariant }]} 
            numberOfLines={2}
          >
            {item.description}
          </AppText>
        </View>

        {/* Chevron */}
        {enableTap && (
          <Icon name="chevron-right" size={20} color={colors.outline} />
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <Icon name="history" size={20} color={colors.onSurface} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.recentActivity.title', { defaultValue: 'Recent Activity' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  // Empty state
  if (!activities?.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <Icon name="history" size={20} color={colors.onSurface} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.recentActivity.title', { defaultValue: 'Recent Activity' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="clock-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t('widgets.recentActivity.empty.title', { defaultValue: 'No Activity Yet' })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t('widgets.recentActivity.empty.message', { defaultValue: 'Recent system activities will appear here' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="history" size={20} color={colors.onSurface} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.recentActivity.title', { defaultValue: 'Recent Activity' })}
          </AppText>
        </View>
        {showViewAll && (
          <TouchableOpacity 
            onPress={handleViewAll}
            accessibilityLabel={t('widgets.recentActivity.viewAll', { defaultValue: 'View All' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t('widgets.recentActivity.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Activity List */}
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  actorName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    marginLeft: 52,
  },
});
