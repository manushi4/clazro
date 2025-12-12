/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 *
 * Database Tables:
 * - device_tokens: Stores FCM device tokens
 * - notification_templates: Templates for notifications
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';

// ==================== TYPES ====================

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name?: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  action?: string;
  priority?: 'low' | 'default' | 'high';
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  tokensDelivered?: number;
  tokensFailed?: number;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  title_template: string;
  message_template: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  metadata?: Record<string, any>;
  is_active: boolean;
}

// ==================== DEVICE MANAGEMENT ====================

/**
 * Register a device token for push notifications
 * @param userId - User UUID
 * @param token - FCM device token
 * @param deviceType - Device platform
 * @param deviceName - Optional device name
 * @returns Promise<DeviceToken>
 */
export async function registerDevice(
  userId: string,
  token: string,
  deviceType: 'ios' | 'android' | 'web',
  deviceName?: string
): Promise<DeviceToken> {
  const { data, error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        device_type: deviceType,
        device_name: deviceName,
        is_active: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,token',
      }
    )
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'registerDevice');
  }

  return data;
}

/**
 * Unregister a device token
 * @param tokenId - Device token UUID
 * @returns Promise<void>
 */
export async function unregisterDevice(tokenId: string): Promise<void> {
  const { error } = await supabase
    .from('device_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', tokenId);

  if (error) {
    handleSupabaseError(error, 'unregisterDevice');
  }
}

/**
 * Update device token (when token is refreshed)
 * @param tokenId - Device token UUID
 * @param newToken - New FCM token
 * @returns Promise<DeviceToken>
 */
export async function updateDeviceToken(
  tokenId: string,
  newToken: string
): Promise<DeviceToken> {
  const { data, error } = await supabase
    .from('device_tokens')
    .update({
      token: newToken,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tokenId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateDeviceToken');
  }

  return data;
}

/**
 * Get all active device tokens for a user
 * @param userId - User UUID
 * @returns Promise<DeviceToken[]>
 */
export async function getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
  const { data, error } = await supabase
    .from('device_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    handleSupabaseError(error, 'getUserDeviceTokens');
  }

  return data || [];
}

// ==================== NOTIFICATION TEMPLATES ====================

/**
 * Get notification template by type
 * @param type - Template type
 * @returns Promise<NotificationTemplate | null>
 */
export async function getNotificationTemplate(
  type: string
): Promise<NotificationTemplate | null> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error, 'getNotificationTemplate');
  }

  return data;
}

/**
 * Render template with variables
 * @param template - Template string
 * @param variables - Variables to substitute
 * @returns string
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, String(value));
  }

  return rendered;
}

/**
 * Create notification from template
 * @param templateType - Template type
 * @param variables - Template variables
 * @returns Promise<PushNotificationPayload>
 */
export async function createNotificationFromTemplate(
  templateType: string,
  variables: Record<string, any>
): Promise<PushNotificationPayload> {
  const template = await getNotificationTemplate(templateType);

  if (!template) {
    throw new Error(`Template type '${templateType}' not found`);
  }

  const title = renderTemplate(template.title_template, variables);
  const body = renderTemplate(template.message_template, variables);

  // Map priority
  const priorityMap = {
    low: 'low' as const,
    medium: 'default' as const,
    high: 'high' as const,
    urgent: 'high' as const,
  };

  return {
    title,
    body,
    priority: priorityMap[template.priority],
    data: {
      type: template.type,
      category: template.category,
      ...variables,
    },
  };
}

// ==================== PUSH NOTIFICATION SENDING ====================

/**
 * Send push notification to a user (all their devices)
 * NOTE: This is a placeholder implementation
 * In production, integrate with Firebase Admin SDK or FCM API
 * @param userId - User UUID
 * @param notification - Notification payload
 * @returns Promise<PushResult>
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotificationPayload
): Promise<PushResult> {
  try {
    // Get user's device tokens
    const deviceTokens = await getUserDeviceTokens(userId);

    if (deviceTokens.length === 0) {
      return {
        success: false,
        error: 'No active device tokens found for user',
        tokensDelivered: 0,
        tokensFailed: 0,
      };
    }

    // TODO: Implement actual FCM sending
    // This is a placeholder - integrate with Firebase Admin SDK
    console.log('Sending push notification to tokens:', deviceTokens.length);
    console.log('Notification:', notification);

    /*
    // Example FCM implementation:
    const admin = require('firebase-admin');

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data || {},
      tokens: deviceTokens.map(dt => dt.token),
      android: {
        priority: notification.priority || 'default',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);

    return {
      success: response.successCount > 0,
      tokensDelivered: response.successCount,
      tokensFailed: response.failureCount,
    };
    */

    // Placeholder response
    return {
      success: true,
      messageId: `msg-${Date.now()}`,
      tokensDelivered: deviceTokens.length,
      tokensFailed: 0,
    };
  } catch (error: any) {
    console.error('Push notification error:', error);
    return {
      success: false,
      error: error.message,
      tokensDelivered: 0,
      tokensFailed: 0,
    };
  }
}

/**
 * Send bulk push notifications to multiple users
 * @param userIds - Array of user UUIDs
 * @param notification - Notification payload
 * @returns Promise<PushResult[]>
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  notification: PushNotificationPayload
): Promise<PushResult[]> {
  const results = await Promise.all(
    userIds.map((userId) => sendPushNotification(userId, notification))
  );

  return results;
}

/**
 * Send templated push notification
 * @param userId - User UUID
 * @param templateType - Template type
 * @param variables - Template variables
 * @returns Promise<PushResult>
 */
export async function sendTemplatedPush(
  userId: string,
  templateType: string,
  variables: Record<string, any>
): Promise<PushResult> {
  const notification = await createNotificationFromTemplate(templateType, variables);
  return sendPushNotification(userId, notification);
}

/**
 * Send bulk templated push notifications
 * @param userIds - Array of user UUIDs
 * @param templateType - Template type
 * @param variables - Template variables
 * @returns Promise<PushResult[]>
 */
export async function sendBulkTemplatedPush(
  userIds: string[],
  templateType: string,
  variables: Record<string, any>
): Promise<PushResult[]> {
  const notification = await createNotificationFromTemplate(templateType, variables);
  return sendBulkPushNotifications(userIds, notification);
}

// ==================== TESTING & UTILITIES ====================

/**
 * Test push notification to a specific token
 * NOTE: Requires FCM implementation
 * @param token - FCM device token
 * @returns Promise<boolean>
 */
export async function testPushNotification(token: string): Promise<boolean> {
  try {
    const testNotification: PushNotificationPayload = {
      title: 'Test Notification',
      body: 'This is a test push notification from Manushi Coaching',
      priority: 'default',
    };

    console.log('Test push to token:', token);
    console.log('Notification:', testNotification);

    // TODO: Implement actual FCM test send
    // Placeholder response
    return true;
  } catch (error) {
    console.error('Test push failed:', error);
    return false;
  }
}

/**
 * Validate FCM token format
 * @param token - FCM token
 * @returns boolean
 */
export function validateFCMToken(token: string): boolean {
  // FCM tokens are typically 150-200 characters
  return token.length > 100 && token.length < 300;
}

/**
 * Get notification statistics for a user
 * @param userId - User UUID
 * @returns Promise<object>
 */
export async function getNotificationStats(userId: string): Promise<{
  total_devices: number;
  active_devices: number;
  devices_by_type: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('device_tokens')
    .select('device_type, is_active')
    .eq('user_id', userId);

  if (error) {
    handleSupabaseError(error, 'getNotificationStats');
  }

  const total = data?.length || 0;
  const active = data?.filter((d) => d.is_active).length || 0;

  const byType: Record<string, number> = {};
  data?.forEach((token) => {
    byType[token.device_type] = (byType[token.device_type] || 0) + 1;
  });

  return {
    total_devices: total,
    active_devices: active,
    devices_by_type: byType,
  };
}

/**
 * Clean up inactive device tokens (older than 90 days)
 * @returns Promise<number> - Number of tokens deleted
 */
export async function cleanupInactiveTokens(): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('is_active', false)
    .lt('last_used_at', ninetyDaysAgo.toISOString())
    .select();

  if (error) {
    handleSupabaseError(error, 'cleanupInactiveTokens');
  }

  return data?.length || 0;
}
