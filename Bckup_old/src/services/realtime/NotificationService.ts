import { supabase } from '../database/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  content: string;
  notification_type: string;
  category: 'class' | 'assignment' | 'message' | 'announcement' | 'payment' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_urgent: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  channels: string[];
  status: 'unread' | 'read' | 'dismissed' | 'archived';
  read_at?: string;
  dismissed_at?: string;
  sent_push: boolean;
  sent_email: boolean;
  sent_sms: boolean;
  scheduled_at?: string;
  expires_at?: string;
  data: any;
  action_url?: string;
  actions: NotificationAction[];
  created_at: string;
  updated_at: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  url?: string;
  style?: 'default' | 'destructive';
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_categories: string[];
  sms_categories: string[];
  push_categories: string[];
  in_app_categories: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  daily_digest_enabled: boolean;
  weekly_digest_enabled: boolean;
  digest_delivery_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationOptions {
  title: string;
  content: string;
  notification_type: string;
  category?: 'class' | 'assignment' | 'message' | 'announcement' | 'payment' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: string;
  channels?: string[];
  scheduled_at?: string;
  expires_at?: string;
  data?: any;
  action_url?: string;
  actions?: NotificationAction[];
}

export interface NotificationFilters {
  category?: string;
  status?: string;
  priority?: string;
  notification_type?: string;
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface PushNotificationData {
  notification_id: string;
  action_url?: string;
  data?: any;
}

class NotificationService {
  private notificationSubscription?: string;
  private fcmToken?: string;
  private isInitialized = false;
  private pendingNotifications: Notification[] = [];
  private badgeCount = 0;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize push notifications
      await this.initializePushNotifications();
      
      // Initialize FCM
      await this.initializeFCM();
      
      // Load pending notifications
      await this.loadPendingNotifications();
      
      // Subscribe to real-time notifications
      this.subscribeToNotifications();
      
      // Handle app state changes
      this.setupAppStateHandling();
      
      this.isInitialized = true;
      logger.info('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Get user notifications
   */
  public async getNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.notification_type) {
        query = query.eq('notification_type', filters.notification_type);
      }

      if (filters.unread_only) {
        query = query.eq('status', 'unread');
      }

      query = query
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .order('created_at', { ascending: false });

      const { data: notifications, error } = await query;

      if (error) throw error;

      await this.cacheNotifications(notifications);
      return notifications;
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      return await this.getCachedNotifications();
    }
  }

  /**
   * Get unread notification count
   */
  public async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', user.id)
        .eq('status', 'unread');

      const unreadCount = count || 0;
      this.badgeCount = unreadCount;
      this.updateAppBadge(unreadCount);
      
      return unreadCount;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update badge count
      await this.getUnreadCount();
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('recipient_id', user.id)
        .eq('status', 'unread');

      if (error) throw error;

      // Update badge count
      this.badgeCount = 0;
      this.updateAppBadge(0);
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss notification
   */
  public async dismissNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update badge count
      await this.getUnreadCount();
    } catch (error) {
      logger.error('Failed to dismiss notification:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  public async archiveNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to archive notification:', error);
      throw error;
    }
  }

  /**
   * Create notification (for internal use)
   */
  public async createNotification(
    recipientId: string,
    options: CreateNotificationOptions
  ): Promise<Notification> {
    try {
      const notificationData = {
        recipient_id: recipientId,
        title: options.title,
        content: options.content,
        notification_type: options.notification_type,
        category: options.category || 'system',
        priority: options.priority || 'normal',
        is_urgent: options.priority === 'urgent',
        related_entity_type: options.related_entity_type,
        related_entity_id: options.related_entity_id,
        channels: options.channels || ['in_app'],
        scheduled_at: options.scheduled_at,
        expires_at: options.expires_at,
        data: options.data || {},
        action_url: options.action_url,
        actions: options.actions || [],
      };

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      // Send push notification if enabled
      if (options.channels?.includes('push')) {
        await this.sendPushNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  public async getPreferences(): Promise<NotificationPreferences> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: preferences, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return preferences;
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(
    updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: preferences, error } = await supabase
        .from('user_notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return preferences;
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Handle notification action
   */
  public async handleNotificationAction(
    notificationId: string,
    actionId: string
  ): Promise<void> {
    try {
      const notification = await this.getNotification(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      const action = notification.actions.find(a => a.id === actionId);
      if (!action) {
        throw new Error('Action not found');
      }

      // Mark notification as read
      await this.markAsRead(notificationId);

      // Execute action
      if (action.url) {
        await Linking.openURL(action.url);
      } else if (notification.action_url) {
        await Linking.openURL(notification.action_url);
      }

      logger.info(`Executed notification action: ${action.action}`);
    } catch (error) {
      logger.error('Failed to handle notification action:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  public subscribeToNotifications(
    onNotification?: (notification: Notification) => void
  ): void {
    if (this.notificationSubscription) {
      realtimeConnection.unsubscribe(this.notificationSubscription);
    }

    this.notificationSubscription = realtimeConnection.subscribe(
      'notifications',
      undefined,
      (payload) => {
        const { eventType, new: newRecord } = payload;
        
        if (eventType === 'INSERT' && newRecord) {
          this.handleIncomingNotification(newRecord);
          onNotification?.(newRecord);
        } else if (eventType === 'UPDATE' && newRecord) {
          // Handle notification updates (read status changes, etc.)
          this.getUnreadCount();
        }
      },
      (error) => {
        logger.error('Notification subscription error:', error);
      }
    );
  }

  /**
   * Unsubscribe from notifications
   */
  public unsubscribeFromNotifications(): void {
    if (this.notificationSubscription) {
      realtimeConnection.unsubscribe(this.notificationSubscription);
      this.notificationSubscription = undefined;
    }
  }

  /**
   * Request notification permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        logger.info('Notification permissions granted');
        await this.getFCMToken();
      }

      return enabled;
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      logger.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  // Private methods

  private async initializePushNotifications(): Promise<void> {
    PushNotification.configure({
      onNotification: (notification) => {
        logger.debug('Local notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped the notification
          this.handleNotificationTap(notification);
        }
      },
      onRegistrationError: (err) => {
        logger.error('Push notification registration error:', err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channels (Android)
    this.createNotificationChannels();
  }

  private async initializeFCM(): Promise<void> {
    try {
      // Check permission
      const authStatus = await messaging().hasPermission();
      if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
        await this.requestPermissions();
      }

      // Get FCM token
      await this.getFCMToken();

      // Handle foreground messages
      messaging().onMessage(this.handleForegroundMessage);

      // Handle background/quit state messages
      messaging().onNotificationOpenedApp(this.handleBackgroundMessage);

      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        this.handleBackgroundMessage(initialNotification);
      }

      // Handle token refresh
      messaging().onTokenRefresh(this.handleTokenRefresh);
    } catch (error) {
      logger.error('Failed to initialize FCM:', error);
    }
  }

  private createNotificationChannels(): void {
    const channels = [
      {
        channelId: 'class_notifications',
        channelName: 'Class Notifications',
        channelDescription: 'Notifications about live classes and sessions',
        importance: Importance.HIGH,
      },
      {
        channelId: 'message_notifications',
        channelName: 'Messages',
        channelDescription: 'New messages and chat notifications',
        importance: Importance.HIGH,
      },
      {
        channelId: 'assignment_notifications',
        channelName: 'Assignments',
        channelDescription: 'Assignment reminders and updates',
        importance: Importance.DEFAULT,
      },
      {
        channelId: 'announcement_notifications',
        channelName: 'Announcements',
        channelDescription: 'Important announcements from teachers',
        importance: Importance.HIGH,
      },
      {
        channelId: 'payment_notifications',
        channelName: 'Payments',
        channelDescription: 'Payment reminders and receipts',
        importance: Importance.DEFAULT,
      },
      {
        channelId: 'system_notifications',
        channelName: 'System',
        channelDescription: 'System updates and maintenance notices',
        importance: Importance.LOW,
      },
    ];

    channels.forEach((channel) => {
      PushNotification.createChannel(channel, () => {
        logger.debug(`Created notification channel: ${channel.channelId}`);
      });
    });
  }

  private async getFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await this.saveFCMToken(token);
        logger.debug('FCM token obtained:', token);
      }
    } catch (error) {
      logger.error('Failed to get FCM token:', error);
    }
  }

  private async saveFCMToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save token to user metadata or a separate table
      await supabase.auth.updateUser({
        data: { fcm_token: token }
      });

      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      logger.error('Failed to save FCM token:', error);
    }
  }

  private handleForegroundMessage = (message: FirebaseMessagingTypes.RemoteMessage) => {
    logger.debug('Foreground FCM message:', message);

    // Show local notification for foreground messages
    if (message.notification) {
      PushNotification.localNotification({
        title: message.notification.title || '',
        message: message.notification.body || '',
        data: message.data as PushNotificationData,
        channelId: this.getChannelId(message.data?.category as string),
        priority: 'high',
        visibility: 'public',
        importance: 'high',
      });
    }
  };

  private handleBackgroundMessage = (message: FirebaseMessagingTypes.RemoteMessage) => {
    logger.debug('Background FCM message:', message);

    // Handle deep linking or navigation
    if (message.data?.action_url) {
      Linking.openURL(message.data.action_url as string);
    }

    // Mark notification as read if user tapped it
    if (message.data?.notification_id) {
      this.markAsRead(message.data.notification_id as string);
    }
  };

  private handleTokenRefresh = async (token: string) => {
    logger.debug('FCM token refreshed:', token);
    this.fcmToken = token;
    await this.saveFCMToken(token);
  };

  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Check if push notifications are enabled for this category
      const preferences = await this.getPreferences();
      if (!preferences.push_enabled || !preferences.push_categories.includes(notification.category)) {
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        return;
      }

      const pushData: PushNotificationData = {
        notification_id: notification.id,
        action_url: notification.action_url,
        data: notification.data,
      };

      // Send via FCM (this would typically be done server-side)
      // For now, we'll show a local notification
      PushNotification.localNotification({
        title: notification.title,
        message: notification.content,
        data: pushData,
        channelId: this.getChannelId(notification.category),
        priority: this.getPriority(notification.priority),
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
      });

      // Update notification as sent
      await supabase
        .from('notifications')
        .update({ sent_push: true })
        .eq('id', notification.id);

    } catch (error) {
      logger.error('Failed to send push notification:', error);
    }
  }

  private handleIncomingNotification(notification: Notification): void {
    // Update unread count
    this.getUnreadCount();

    // Add to pending notifications if app is in background
    if (AppState.currentState === 'background') {
      this.pendingNotifications.push(notification);
    }
  }

  private handleNotificationTap(notification: any): void {
    const data = notification.data as PushNotificationData;
    
    if (data?.notification_id) {
      // Mark as read
      this.markAsRead(data.notification_id);
    }

    if (data?.action_url) {
      // Handle deep linking
      Linking.openURL(data.action_url);
    }
  }

  private async getNotification(notificationId: string): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error) return null;
      return notification;
    } catch (error) {
      return null;
    }
  }

  private getChannelId(category: string): string {
    const channelMap: Record<string, string> = {
      class: 'class_notifications',
      message: 'message_notifications',
      assignment: 'assignment_notifications',
      announcement: 'announcement_notifications',
      payment: 'payment_notifications',
      system: 'system_notifications',
    };

    return channelMap[category] || 'system_notifications';
  }

  private getPriority(priority: string): 'min' | 'low' | 'default' | 'high' | 'max' {
    const priorityMap: Record<string, 'min' | 'low' | 'default' | 'high' | 'max'> = {
      low: 'low',
      normal: 'default',
      high: 'high',
      urgent: 'max',
    };

    return priorityMap[priority] || 'default';
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return currentTime >= preferences.quiet_hours_start && 
           currentTime <= preferences.quiet_hours_end;
  }

  private setupAppStateHandling(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - process pending notifications
        this.processPendingNotifications();
        this.getUnreadCount();
      }
    });
  }

  private async processPendingNotifications(): Promise<void> {
    if (this.pendingNotifications.length === 0) return;

    // Show notifications that arrived while app was in background
    for (const notification of this.pendingNotifications) {
      // Could show in-app notification banner here
      logger.debug('Processing pending notification:', notification.title);
    }

    this.pendingNotifications = [];
  }

  private updateAppBadge(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  private async loadPendingNotifications(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('pending_notifications');
      if (cached) {
        this.pendingNotifications = JSON.parse(cached);
        await AsyncStorage.removeItem('pending_notifications');
      }
    } catch (error) {
      logger.error('Failed to load pending notifications:', error);
    }
  }

  private async cacheNotifications(notifications: Notification[]): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_notifications', JSON.stringify(notifications));
    } catch (error) {
      logger.error('Failed to cache notifications:', error);
    }
  }

  private async getCachedNotifications(): Promise<Notification[]> {
    try {
      const cached = await AsyncStorage.getItem('cached_notifications');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;