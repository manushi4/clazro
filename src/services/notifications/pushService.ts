/**
 * Push Notification Service
 * 
 * Handles FCM token registration, permission requests, and notification handling.
 * Uses @react-native-firebase/messaging for Firebase Cloud Messaging.
 */

import { Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../lib/supabaseClient';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationCategory,
} from '../../types/notification.types';

// Cached notification settings
let cachedSettings: NotificationSettings | null = null;

export type NotificationData = {
  type?: string;
  screen?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
};

export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: NotificationData;
  imageUrl?: string;
};

// Navigation callback for deep linking
let navigationCallback: ((screen: string, params?: Record<string, unknown>) => void) | null = null;

/**
 * Set navigation callback for handling notification taps
 */
export const setNavigationCallback = (
  callback: (screen: string, params?: Record<string, unknown>) => void
) => {
  navigationCallback = callback;
};

/**
 * Fetch customer notification settings
 */
export const fetchNotificationSettings = async (
  customerId: string = DEMO_CUSTOMER_ID
): Promise<NotificationSettings> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, customer_id: customerId };
    }

    cachedSettings = data as NotificationSettings;
    return cachedSettings;
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, customer_id: customerId };
  }
};

/**
 * Check if notification should be shown based on customer settings
 */
export const shouldShowNotification = (
  category: string,
  settings?: NotificationSettings
): boolean => {
  const config = settings || cachedSettings;
  if (!config) return true;

  // Check if notifications are globally enabled
  if (!config.notifications_enabled) {
    return false;
  }

  // Check if category is enabled
  const categoryKey = category as NotificationCategory;
  if (config.categories && config.categories[categoryKey] === false) {
    return false;
  }

  // Check quiet hours
  if (config.quiet_hours_enabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const start = config.quiet_hours_start;
    const end = config.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return false;
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Configure local notifications (Android channels, etc.)
 */
export const configureLocalNotifications = (settings?: NotificationSettings) => {
  const config = settings || cachedSettings;
  
  PushNotification.configure({
    onNotification: function (notification) {
      if (__DEV__) {
        console.log('[PushService] Local notification:', notification);
      }
      
      // Handle notification tap
      if (notification.userInteraction && notification.data) {
        handleNotificationTap(notification.data as NotificationData);
      }
    },
    
    requestPermissions: false, // We handle this separately
  });

  // Create Android notification channel with customer settings
  if (Platform.OS === 'android') {
    const priorityMap = { low: 2, default: 3, high: 4, urgent: 5 };
    const priority = config?.channel_config?.default_priority || 'high';
    
    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Default Notifications',
        channelDescription: 'Default notification channel',
        importance: priorityMap[priority],
        vibrate: config?.vibration_enabled ?? true,
        playSound: config?.sound_enabled ?? true,
      },
      (created) => {
        if (__DEV__) {
          console.log('[PushService] Channel created:', created);
        }
      }
    );

    // High priority channel for urgent notifications
    PushNotification.createChannel(
      {
        channelId: 'urgent',
        channelName: 'Urgent Notifications',
        channelDescription: 'Important notifications like live classes',
        importance: 5, // MAX
        vibrate: true,
        playSound: true,
      },
      () => {}
    );
  }
};


/**
 * Request notification permission
 */
export const requestPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (__DEV__) {
      console.log('[PushService] Permission status:', authStatus, 'Enabled:', enabled);
    }

    return enabled;
  } catch (error) {
    console.error('[PushService] Permission request failed:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled
 */
export const checkPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().hasPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/**
 * Get FCM token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    if (__DEV__) {
      console.log('[PushService] FCM Token:', token?.substring(0, 20) + '...');
    }
    return token;
  } catch (error) {
    console.error('[PushService] Failed to get token:', error);
    return null;
  }
};

/**
 * Register token with Supabase
 */
export const registerToken = async (
  userId: string,
  token: string,
  deviceId?: string
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        customer_id: DEMO_CUSTOMER_ID,
        token,
        platform: Platform.OS,
        device_id: deviceId,
        is_active: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    if (error) {
      console.error('[PushService] Failed to register token:', error);
      return false;
    }

    if (__DEV__) {
      console.log('[PushService] Token registered successfully');
    }
    return true;
  } catch (error) {
    console.error('[PushService] Token registration error:', error);
    return false;
  }
};

/**
 * Unregister token (on logout)
 */
export const unregisterToken = async (userId: string, token: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    await supabase
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .match({ user_id: userId, token });
  } catch (error) {
    console.error('[PushService] Failed to unregister token:', error);
  }
};

/**
 * Handle notification tap (deep linking)
 */
const handleNotificationTap = (data: NotificationData) => {
  if (__DEV__) {
    console.log('[PushService] Notification tapped:', data);
  }

  if (data.screen && navigationCallback) {
    navigationCallback(data.screen, data.params as Record<string, unknown>);
  }
};

/**
 * Handle foreground message
 */
const handleForegroundMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  if (__DEV__) {
    console.log('[PushService] Foreground message:', remoteMessage);
  }

  const data = remoteMessage.data || {};
  const category = (data.type as string) || 'system';

  // Check if notification should be shown based on customer settings
  if (!shouldShowNotification(category)) {
    if (__DEV__) {
      console.log('[PushService] Notification suppressed by settings:', category);
    }
    // Still save to database for history
    await saveNotification(remoteMessage);
    return;
  }

  // Show local notification with customer branding
  if (remoteMessage.notification) {
    const config = cachedSettings;
    
    PushNotification.localNotification({
      channelId: 'default',
      title: remoteMessage.notification.title || 'Notification',
      message: remoteMessage.notification.body || '',
      userInfo: remoteMessage.data,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      playSound: config?.sound_enabled ?? true,
      vibrate: config?.vibration_enabled ?? true,
      color: config?.accent_color,
    });
  }

  // Save to notifications table
  await saveNotification(remoteMessage);
};

/**
 * Save notification to database
 */
const saveNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const data = remoteMessage.data || {};

    await supabase.from('notifications').insert({
      customer_id: DEMO_CUSTOMER_ID,
      user_id: data.user_id as string,
      title: remoteMessage.notification?.title || 'Notification',
      body: remoteMessage.notification?.body,
      data: data,
      notification_type: (data.type as string) || 'general',
      image_url: (remoteMessage.notification as any)?.imageUrl || (data.image_url as string),
      action_url: data.screen as string,
    });
  } catch (error) {
    console.error('[PushService] Failed to save notification:', error);
  }
};

/**
 * Initialize push notification service
 */
export const initPushNotifications = async (
  userId: string,
  customerId: string = DEMO_CUSTOMER_ID
): Promise<void> => {
  // Fetch customer notification settings first
  const settings = await fetchNotificationSettings(customerId);
  
  // Check if notifications are enabled for this customer
  if (!settings.notifications_enabled) {
    if (__DEV__) {
      console.log('[PushService] Notifications disabled for customer');
    }
    return;
  }

  // Configure local notifications with customer settings
  configureLocalNotifications(settings);

  // Request permission
  const hasPermission = await requestPermission();
  if (!hasPermission) {
    console.warn('[PushService] Notification permission denied');
    return;
  }

  // Get and register token
  const token = await getToken();
  if (token) {
    await registerToken(userId, token);
  }

  // Listen for token refresh
  messaging().onTokenRefresh(async (newToken) => {
    if (__DEV__) {
      console.log('[PushService] Token refreshed');
    }
    await registerToken(userId, newToken);
  });

  // Handle foreground messages
  messaging().onMessage(handleForegroundMessage);

  // Handle background message tap (app was in background)
  messaging().onNotificationOpenedApp((remoteMessage) => {
    if (__DEV__) {
      console.log('[PushService] Notification opened app:', remoteMessage);
    }
    if (remoteMessage.data) {
      handleNotificationTap(remoteMessage.data as NotificationData);
    }
  });

  // Check if app was opened from quit state by notification
  const initialNotification = await messaging().getInitialNotification();
  if (initialNotification) {
    if (__DEV__) {
      console.log('[PushService] App opened from quit state:', initialNotification);
    }
    // Delay to allow navigation to be ready
    setTimeout(() => {
      if (initialNotification.data) {
        handleNotificationTap(initialNotification.data as NotificationData);
      }
    }, 1000);
  }
};

/**
 * Refresh notification settings (call when settings change)
 */
export const refreshNotificationSettings = async (
  customerId: string = DEMO_CUSTOMER_ID
): Promise<void> => {
  const settings = await fetchNotificationSettings(customerId);
  configureLocalNotifications(settings);
};

/**
 * Subscribe to topic (for broadcast notifications)
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().subscribeToTopic(topic);
    if (__DEV__) {
      console.log('[PushService] Subscribed to topic:', topic);
    }
  } catch (error) {
    console.error('[PushService] Failed to subscribe to topic:', error);
  }
};

/**
 * Unsubscribe from topic
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().unsubscribeFromTopic(topic);
  } catch (error) {
    console.error('[PushService] Failed to unsubscribe from topic:', error);
  }
};

export default {
  initPushNotifications,
  requestPermission,
  checkPermission,
  getToken,
  registerToken,
  unregisterToken,
  setNavigationCallback,
  subscribeToTopic,
  unsubscribeFromTopic,
  fetchNotificationSettings,
  refreshNotificationSettings,
  shouldShowNotification,
};
