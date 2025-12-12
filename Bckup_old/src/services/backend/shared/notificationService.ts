/**
 * Notification Service
 * Send notifications across channels
 *
 * Database Tables:
 * - notifications
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import { Notification, NotificationInput } from '../../../types/database/common';

// ==================== SEND NOTIFICATIONS ====================

/**
 * Send a notification to a single recipient
 * @param recipientId - The user UUID
 * @param notification - Notification data
 * @returns Promise<Notification>
 */
export async function sendNotification(
  recipientId: string,
  notification: NotificationInput
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority || 'medium',
      action_url: notification.action_url,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'sendNotification');
  }

  return data;
}

/**
 * Send notifications to multiple recipients
 * @param recipients - Array of user UUIDs
 * @param notification - Notification data
 * @returns Promise<Notification[]>
 */
export async function sendBulkNotifications(
  recipients: string[],
  notification: NotificationInput
): Promise<Notification[]> {
  const notifications = recipients.map((recipientId) => ({
    user_id: recipientId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    priority: notification.priority || 'medium',
    action_url: notification.action_url,
    is_read: false,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    handleSupabaseError(error, 'sendBulkNotifications');
  }

  return data || [];
}

// ==================== READ NOTIFICATIONS ====================

/**
 * Mark a notification as read
 * @param notificationId - The notification UUID
 * @returns Promise<Notification>
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'markAsRead');
  }

  return data;
}

/**
 * Mark all notifications as read for a user
 * @param userId - The user UUID
 * @returns Promise<void>
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    handleSupabaseError(error, 'markAllAsRead');
  }
}

/**
 * Get unread notifications for a user
 * @param userId - The user UUID
 * @returns Promise<Notification[]>
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getUnreadNotifications');
  }

  return data || [];
}

/**
 * Get all notifications for a user
 * @param userId - The user UUID
 * @param limit - Maximum number to return
 * @returns Promise<Notification[]>
 */
export async function getAllNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getAllNotifications');
  }

  return data || [];
}

// ==================== DELETE NOTIFICATIONS ====================

/**
 * Delete a notification
 * @param notificationId - The notification UUID
 * @returns Promise<void>
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    handleSupabaseError(error, 'deleteNotification');
  }
}

/**
 * Delete all read notifications for a user
 * @param userId - The user UUID
 * @returns Promise<void>
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('is_read', true);

  if (error) {
    handleSupabaseError(error, 'deleteReadNotifications');
  }
}

// ==================== NOTIFICATION COUNT ====================

/**
 * Get unread notification count
 * @param userId - The user UUID
 * @returns Promise<number>
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    handleSupabaseError(error, 'getUnreadCount');
  }

  return count || 0;
}
