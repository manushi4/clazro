/**
 * NotificationScreen - Phase 42: Enhanced Notifications Implementation
 * Material Design 3 compliant notifications interface
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  category: 'academic' | 'system' | 'social' | 'assignment';
}

const NotificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Assignment Due Soon',
      message: 'Your Mathematics assignment "Calculus Problem Set 5" is due tomorrow at 11:59 PM.',
      timestamp: '2 hours ago',
      type: 'warning',
      read: false,
      category: 'assignment',
    },
    {
      id: '2',
      title: 'Live Class Starting',
      message: 'Physics class with Prof. Michael Smith starts in 15 minutes. Join now!',
      timestamp: '15 minutes ago',
      type: 'info',
      read: false,
      category: 'academic',
    },
    {
      id: '3',
      title: 'Doubt Response',
      message: 'Dr. Sarah Johnson has responded to your doubt about "Quadratic Equations".',
      timestamp: '1 day ago',
      type: 'success',
      read: true,
      category: 'academic',
    },
    {
      id: '4',
      title: 'New Features Available',
      message: 'Check out the new AI Study Assistant and enhanced doubt submission system!',
      timestamp: '2 days ago',
      type: 'info',
      read: true,
      category: 'system',
    },
    {
      id: '5',
      title: 'Grade Published',
      message: 'Your grade for Chemistry Lab Report has been published. Check your progress!',
      timestamp: '3 days ago',
      type: 'success',
      read: true,
      category: 'academic',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prevNotifications =>
              prevNotifications.filter(notif => notif.id !== id)
            );
          },
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    return filter === 'unread' 
      ? notifications.filter(notif => !notif.read)
      : notifications;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return theme.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return '🎓';
      case 'assignment':
        return '📝';
      case 'social':
        return '👥';
      case 'system':
      default:
        return '⚙️';
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        { backgroundColor: theme.Surface },
        !notification.read && styles.unreadItem,
      ]}
      onPress={() => !notification.read && markAsRead(notification.id)}
      onLongPress={() => deleteNotification(notification.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.categoryIcon}>
            {getCategoryIcon(notification.category)}
          </Text>
          <View 
            style={[
              styles.typeIndicator, 
              { backgroundColor: getTypeColor(notification.type) }
            ]}
          >
            <Text style={styles.typeIcon}>
              {getTypeIcon(notification.type)}
            </Text>
          </View>
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle, 
            { color: theme.OnSurface },
            !notification.read && styles.unreadText,
          ]}>
            {notification.title}
          </Text>
          <Text style={[
            styles.notificationMessage, 
            { color: theme.OnSurfaceVariant }
          ]}>
            {notification.message}
          </Text>
          <Text style={[
            styles.notificationTimestamp, 
            { color: theme.Outline }
          ]}>
            {notification.timestamp}
          </Text>
        </View>

        {!notification.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.OnBackground }]}>
          Notifications
        </Text>
        {user && (
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            {unreadCount} unread messages
          </Text>
        )}
      </View>

      {/* Filter Controls */}
      <View style={styles.controls}>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filter === 'all' ? theme.primary : theme.Surface },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === 'all' ? theme.OnPrimary : theme.OnSurface }
            ]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filter === 'unread' ? theme.primary : theme.Surface },
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === 'unread' ? theme.OnPrimary : theme.OnSurface }
            ]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            onPress={markAllAsRead}
          >
            <Text style={[styles.actionButtonText, { color: theme.OnSecondary }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.OnSurface }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptyMessage, { color: theme.OnSurfaceVariant }]}>
              {filter === 'unread' 
                ? 'All caught up! No unread notifications.' 
                : 'You have no notifications at the moment.'}
            </Text>
          </View>
        )}
        
        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.OnSurfaceVariant }]}>
            💡 Long press any notification to delete it
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  filterButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  filterButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: 20,
    marginRight: Spacing.SM,
  },
  filterButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    marginHorizontal: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unreadItem: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  notificationHeader: {
    flexDirection: 'row',
    padding: Spacing.LG,
  },
  iconContainer: {
    position: 'relative',
    marginRight: Spacing.MD,
  },
  categoryIcon: {
    fontSize: 24,
  },
  typeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.XS,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.XS,
  },
  notificationTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.SM,
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.XXL,
    marginTop: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.LG,
  },
  emptyTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  emptyMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.LG,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
});

export default NotificationScreen;