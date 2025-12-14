/**
 * NotificationsScreen - All notifications with filtering
 * Purpose: Show student notifications grouped by time with category filters
 * Design: Framer design system with clean notification cards
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T, Chip } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'NotificationsScreen'>;

type NotificationCategory = 'class' | 'assignment' | 'test' | 'system';
type CategoryFilter = 'all' | NotificationCategory;

interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAtLabel: string;
  isRead: boolean;
  metaLabel?: string;
  section: 'today' | 'earlier';
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  unreadDot: '#EF4444',
  readBg: '#F9FAFB',
};

// Mock Data
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Live class starting soon',
    body: 'Your Math class "Algebra revision" starts in 15 minutes.',
    category: 'class',
    createdAtLabel: '15m ago',
    isRead: false,
    metaLabel: 'Class',
    section: 'today',
  },
  {
    id: 'n2',
    title: 'Assignment due tomorrow',
    body: 'Algebra Worksheet 03 is due tomorrow at 8:00 PM.',
    category: 'assignment',
    createdAtLabel: '1h ago',
    isRead: false,
    metaLabel: 'Assignment',
    section: 'today',
  },
  {
    id: 'n3',
    title: 'Test result published',
    body: 'Your result for "Sample Math Test" is now available.',
    category: 'test',
    createdAtLabel: 'Yesterday',
    isRead: true,
    metaLabel: 'Test',
    section: 'earlier',
  },
  {
    id: 'n4',
    title: 'New resource added: Algebra formula sheet',
    body: 'Check the study library for the new Algebra formula sheet.',
    category: 'system',
    createdAtLabel: '2 days ago',
    isRead: true,
    metaLabel: 'Resource',
    section: 'earlier',
  },
];

// Hook
function useNotificationsMock() {
  // TODO: Replace with real Supabase notifications
  const notifications = MOCK_NOTIFICATIONS;
  return { notifications };
}

export default function NotificationsScreen({ navigation }: Props) {
  const { notifications: initialNotifications } = useNotificationsMock();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    trackScreenView('NotificationsScreen');
  }, []);

  const today = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.section === 'today' &&
          (categoryFilter === 'all' || n.category === categoryFilter)
      ),
    [notifications, categoryFilter]
  );

  const earlier = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.section === 'earlier' &&
          (categoryFilter === 'all' || n.category === categoryFilter)
      ),
    [notifications, categoryFilter]
  );

  const handleNotificationTap = useCallback(
    (notification: AppNotification) => {
      trackAction('tap_notification', 'NotificationsScreen', {
        notificationId: notification.id,
        category: notification.category,
      });

      // Mark as read
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      // Show notification content
      Alert.alert(notification.title, notification.body, [{ text: 'OK' }]);

      // TODO: Navigate to appropriate screen based on category
      // if (notification.category === 'class') navigation.navigate('ClassDetailScreen', { classId: ... });
      // if (notification.category === 'test') navigation.navigate('TestReviewScreen', { testId: ... });
    },
    []
  );

  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setCategoryFilter(category);
    trackAction('filter_notifications', 'NotificationsScreen', { category });
  }, []);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'class':
        return 'school';
      case 'assignment':
        return 'assignment';
      case 'test':
        return 'quiz';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const renderNotificationCard = (notification: AppNotification) => (
    <TouchableOpacity
      key={notification.id}
      style={[styles.notificationCard, notification.isRead && styles.notificationCardRead]}
      onPress={() => handleNotificationTap(notification)}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}, ${notification.createdAtLabel}`}
    >
      <View style={styles.notificationLeft}>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Icon name={getCategoryIcon(notification.category)} size={20} color={FRAMER_COLORS.primary} />
          </View>
          <T variant="body" weight="bold" style={styles.notificationTitle}>
            {notification.title}
          </T>
        </View>

        <T variant="body" style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </T>

        <View style={styles.notificationFooter}>
          {notification.metaLabel && (
            <View style={styles.metaLabelPill}>
              <T variant="caption" style={styles.metaLabelText}>
                {notification.metaLabel}
              </T>
            </View>
          )}
          <T variant="caption" color="textSecondary" style={styles.timestamp}>
            {notification.createdAtLabel}
          </T>
        </View>
      </View>

      <Icon name="chevron-right" size={20} color={FRAMER_COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const isEmpty = today.length === 0 && earlier.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <T variant="title" weight="bold" style={styles.headerTitle}>
            Notifications
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filters */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <Chip
              label="All"
              variant="filter"
              selected={categoryFilter === 'all'}
              onPress={() => handleCategoryChange('all')}
            />
            <Chip
              label="Classes"
              variant="filter"
              selected={categoryFilter === 'class'}
              onPress={() => handleCategoryChange('class')}
            />
            <Chip
              label="Assignments"
              variant="filter"
              selected={categoryFilter === 'assignment'}
              onPress={() => handleCategoryChange('assignment')}
            />
            <Chip
              label="Tests"
              variant="filter"
              selected={categoryFilter === 'test'}
              onPress={() => handleCategoryChange('test')}
            />
            <Chip
              label="System"
              variant="filter"
              selected={categoryFilter === 'system'}
              onPress={() => handleCategoryChange('system')}
            />
          </ScrollView>
        </View>

        {/* Empty State */}
        {isEmpty && (
          <Card style={styles.emptyCard}>
            <Icon name="notifications-none" size={48} color={FRAMER_COLORS.textSecondary} />
            <T variant="subtitle" weight="bold" style={styles.emptyTitle}>
              You're all caught up
            </T>
            <T variant="body" color="textSecondary" style={styles.emptyText}>
              No notifications to show
            </T>
          </Card>
        )}

        {/* Today Section */}
        {today.length > 0 && (
          <View style={styles.section}>
            <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Today
            </T>
            {today.map(renderNotificationCard)}
          </View>
        )}

        {/* Earlier Section */}
        {earlier.length > 0 && (
          <View style={styles.section}>
            <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Earlier
            </T>
            {earlier.map(renderNotificationCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationCardRead: {
    backgroundColor: FRAMER_COLORS.readBg,
  },
  notificationLeft: {
    width: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FRAMER_COLORS.unreadDot,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    flex: 1,
  },
  notificationBody: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabelPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  metaLabelText: {
    fontSize: 11,
    color: FRAMER_COLORS.textSecondary,
  },
  timestamp: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 48,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
