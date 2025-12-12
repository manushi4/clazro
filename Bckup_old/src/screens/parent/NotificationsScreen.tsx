/**
 * NotificationsScreen
 * Display all notifications with filtering and mark as read functionality
 *
 * Features:
 * - Real-time notifications from Supabase
 * - Filter by type (8 types) and read status
 * - Mark individual notifications as read
 * - Mark all as read
 * - Priority-based color coding
 * - Navigate to related content via action_url
 * - Pull to refresh
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ParentStackParamList, 'Notifications'>;

type NotificationType = 'all' | 'info' | 'warning' | 'error' | 'success' | 'assignment' | 'class' | 'doubt' | 'announcement';
type ReadFilter = 'all' | 'unread' | 'read';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: Exclude<NotificationType, 'all'>;
  priority: Priority;
  is_read: boolean;
  action_url: string | null;
  data: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
}

const NotificationsScreen: React.FC<Props> = () => {
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const queryClient = useQueryClient();

  // Track screen view
  useEffect(() => {
    trackScreenView('Notifications', { from: 'Dashboard' });
  }, []);

  // Get current user
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('🔍 [Notifications] Fetching notifications for user', userId);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [Notifications] Error:', error);
        throw error;
      }

      console.log('✅ [Notifications] Loaded', data?.length || 0, 'notifications');
      return data as Notification[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (notifications should be fresh)
    enabled: !!userId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error) => {
      console.error('❌ [Notifications] Mark as read failed:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      trackAction('mark_all_read', 'Notifications', { count: unreadCount });
    },
    onError: (error) => {
      console.error('❌ [Notifications] Mark all as read failed:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    },
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by read status
    if (readFilter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (readFilter === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    return filtered;
  }, [notifications, typeFilter, readFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const read = total - unread;
    const urgent = notifications.filter(n => n.priority === 'urgent' && !n.is_read).length;

    return { total, unread, read, urgent };
  }, [notifications]);

  const unreadCount = stats.unread;

  // Get priority color
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.primary;
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  // Get type icon/label
  const getTypeLabel = (type: Exclude<NotificationType, 'all'>): string => {
    switch (type) {
      case 'assignment':
        return '📝 Assignment';
      case 'class':
        return '🏫 Class';
      case 'doubt':
        return '❓ Doubt';
      case 'announcement':
        return '📢 Announcement';
      case 'success':
        return '✅ Success';
      case 'warning':
        return '⚠️ Warning';
      case 'error':
        return '❌ Error';
      case 'info':
      default:
        return 'ℹ️ Info';
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification tap
  const handleNotificationTap = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    trackAction('tap_notification', 'Notifications', {
      type: notification.type,
      priority: notification.priority,
      has_action: !!notification.action_url,
    });

    // Navigate to action_url if present
    if (notification.action_url) {
      // Parse action_url and navigate
      // Format expected: "screen://ScreenName?param1=value1&param2=value2"
      // For now, just show an alert (can be enhanced later)
      Alert.alert('Navigation', `Would navigate to: ${notification.action_url}`);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert('Info', 'All notifications are already read');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => markAllAsReadMutation.mutate(),
        },
      ]
    );
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load notifications' : null}
      empty={!isLoading && notifications.length === 0}
      emptyBody="No notifications yet. You'll see updates about assignments, classes, and announcements here."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header & Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
              <T variant="title" weight="bold">
                Notifications
              </T>
              {unreadCount > 0 && (
                <Badge variant="error" label={`${unreadCount} new`} />
              )}
            </Row>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.error }}>
                  {stats.unread}
                </T>
                <T variant="caption" color="textSecondary">Unread</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.success }}>
                  {stats.read}
                </T>
                <T variant="caption" color="textSecondary">Read</T>
              </View>

              {stats.urgent > 0 && (
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.warning }}>
                    {stats.urgent}
                  </T>
                  <T variant="caption" color="textSecondary">Urgent</T>
                </View>
              )}
            </Row>

            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onPress={handleMarkAllAsRead}
                style={{ marginTop: Spacing.md }}
              >
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Filters Card */}
        <Card variant="outlined">
          <CardContent>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
              Filters
            </T>
            <FilterDropdowns
          filters={[
              {
                label: 'Type',
                value: typeFilter,
                options: [
                { value: 'all', label: 'All' },
                { value: 'academic', label: '📚 Academic' },
                { value: 'attendance', label: '📅 Attendance' },
                { value: 'homework', label: '📝 Homework' },
                { value: 'exam', label: '📊 Exam' },
                { value: 'fee', label: '💰 Fee' },
                { value: 'event', label: '🎉 Event' },
                { value: 'announcement', label: '📢 Announcement' },
                { value: 'message', label: '💬 Message' },
                { value: 'alert', label: '⚠️ Alert' },
                ],
                onChange: (value) => {
                  trackAction('filter_type', 'Notifications', { type: value });
                  setTypeFilter(value as TypeFilter);
                },
              },
              {
                label: 'Status',
                value: statusFilter,
                options: [
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
                ],
                onChange: (value) => {
                  trackAction('filter_status', 'Notifications', { status: value });
                  setStatusFilter(value as StatusFilter);
                },
              }
          ]}
          activeFilters={[
              typeFilter !== 'all' && {
                label: typeFilter,
                variant: 'info' as const
              },
              statusFilter !== 'all' && {
                label: statusFilter,
                variant: 'success' as const
              },
          ].filter(Boolean) as any}
          onClearAll={() => {
              setTypeFilter('all');
              setStatusFilter('all');
              trackAction('clear_filters', 'Notifications');
          }}
        />
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Col gap="sm">
          {filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              variant="elevated"
              onPress={() => handleNotificationTap(notification)}
              style={!notification.is_read ? styles.unreadCard : {}}
            >
              <CardContent>
                  {/* Header Row */}
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="caption" color="textSecondary">
                      {getTypeLabel(notification.type)}
                    </T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <View
                        style={[
                          styles.priorityIndicator,
                          { backgroundColor: getPriorityColor(notification.priority) }
                        ]}
                      />
                      <T variant="caption" color="textSecondary">
                        {getTimeAgo(notification.created_at)}
                      </T>
                    </View>
                  </Row>

                  {/* Title */}
                  <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                    {notification.title}
                  </T>

                  {/* Message */}
                  <T variant="body" color="textSecondary">
                    {notification.message}
                  </T>

                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <Row style={{ marginTop: Spacing.sm, alignItems: 'center', gap: Spacing.xs }}>
                      <View style={styles.unreadDot} />
                      <T variant="caption" color="primary" weight="semiBold">
                        New
                      </T>
                    </Row>
                  )}
                </CardContent>
            </Card>
          ))}
        </Col>

        {/* Empty State for Filters */}
        {filteredNotifications.length === 0 && notifications.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No notifications match your filters
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    setTypeFilter('all');
                    setReadFilter('all');
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primaryLight || Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});

export default NotificationsScreen;
