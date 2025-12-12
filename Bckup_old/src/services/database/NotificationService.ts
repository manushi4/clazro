/**
 * Notification Service
 * Handles system and user notifications
 * Phase 71: Comprehensive API Integration Layer
 */

import supabase, { ApiResponse } from '../../lib/supabase';
import {
  Notification, NotificationInsert, NotificationUpdate,
  NotificationType, NotificationPriority, QueryParams
} from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';
import { cacheManager, CacheKeys, CacheDurations } from '../utils/CacheManager';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a new notification
   */
  public async createNotification(
    recipientId: string,
    notificationData: {
      type: NotificationType;
      title: string;
      message: string;
      priority?: NotificationPriority;
      data?: any;
      senderId?: string;
      expiresAt?: string;
    }
  ): Promise<ApiResponse<Notification>> {
    try {
      const notification: NotificationInsert = {
        recipient_id: recipientId,
        sender_id: notificationData.senderId || null,
        type: notificationData.type,
        priority: notificationData.priority || 'medium',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null,
        is_read: false,
        expires_at: notificationData.expiresAt || null,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'create_notification', recipientId);
      }

      // Invalidate recipient's notification cache
      await cacheManager.invalidateByPrefix(`notifications_${recipientId}`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'create_notification', recipientId);
    }
  }

  /**
   * Create bulk notifications
   */
  public async createBulkNotifications(
    recipientIds: string[],
    notificationData: {
      type: NotificationType;
      title: string;
      message: string;
      priority?: NotificationPriority;
      data?: any;
      senderId?: string;
      expiresAt?: string;
    }
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const notifications: NotificationInsert[] = recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: notificationData.senderId || null,
        type: notificationData.type,
        priority: notificationData.priority || 'medium',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null,
        is_read: false,
        expires_at: notificationData.expiresAt || null,
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        return createErrorResponse(error, 'create_bulk_notifications', undefined);
      }

      // Invalidate all recipients' notification caches
      await Promise.all(
        recipientIds.map(id => 
          cacheManager.invalidateByPrefix(`notifications_${id}`)
        )
      );

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'create_bulk_notifications', undefined);
    }
  }

  /**
   * Get notifications for user
   */
  public async getNotifications(
    userId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      const offset = (page - 1) * limit;

      // Check cache for first page
      const cacheKey = CacheKeys.notifications(userId);
      if (page === 1 && !Object.keys(filters).length) {
        const cached = await cacheManager.get<Notification[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId);

      // Apply filters
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_notifications', userId);
      }

      // Cache first page of unfiltered results
      if (page === 1 && !Object.keys(filters).length && data) {
        await cacheManager.set(cacheKey, data, { ttl: CacheDurations.SHORT });
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_notifications', userId);
    }
  }

  /**
   * Get unread notifications count
   */
  public async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        return createErrorResponse(error, 'get_unread_count', userId);
      }

      return createSuccessResponse(count || 0);
    } catch (error) {
      return createErrorResponse(error, 'get_unread_count', userId);
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId) // Ensure user can only mark their own notifications
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'mark_as_read', userId);
      }

      // Invalidate cache
      await cacheManager.invalidateByPrefix(`notifications_${userId}`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'mark_as_read', userId);
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        return createErrorResponse(error, 'mark_all_as_read', userId);
      }

      // Invalidate cache
      await cacheManager.invalidateByPrefix(`notifications_${userId}`);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'mark_all_as_read', userId);
    }
  }

  /**
   * Delete notification
   */
  public async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      if (error) {
        return createErrorResponse(error, 'delete_notification', userId);
      }

      // Invalidate cache
      await cacheManager.invalidateByPrefix(`notifications_${userId}`);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'delete_notification', userId);
    }
  }

  /**
   * Delete expired notifications
   */
  public async deleteExpiredNotifications(): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        return createErrorResponse(error, 'delete_expired_notifications', undefined);
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Deleted ${deletedCount} expired notifications`);

      return createSuccessResponse(deletedCount);
    } catch (error) {
      return createErrorResponse(error, 'delete_expired_notifications', undefined);
    }
  }

  /**
   * Send assignment notification
   */
  public async sendAssignmentNotification(
    assignmentId: string,
    classId: string,
    type: 'new_assignment' | 'assignment_due' | 'assignment_graded',
    title: string,
    message: string,
    senderId?: string
  ): Promise<ApiResponse<Notification[]>> {
    try {
      // Get all students enrolled in the class
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true);

      if (enrollmentsError) {
        return createErrorResponse(enrollmentsError, 'send_assignment_notification', senderId);
      }

      const studentIds = enrollments?.map(e => e.student_id) || [];

      if (studentIds.length === 0) {
        return createSuccessResponse([]);
      }

      return this.createBulkNotifications(studentIds, {
        type: 'assignment',
        title,
        message,
        priority: type === 'assignment_due' ? 'high' : 'medium',
        data: {
          assignment_id: assignmentId,
          class_id: classId,
          assignment_type: type,
        },
        senderId,
        expiresAt: type === 'assignment_due' ? 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : // 7 days
          undefined,
      });
    } catch (error) {
      return createErrorResponse(error, 'send_assignment_notification', senderId);
    }
  }

  /**
   * Send class notification
   */
  public async sendClassNotification(
    classId: string,
    type: 'class_starting' | 'class_cancelled' | 'class_reminder',
    title: string,
    message: string,
    senderId?: string
  ): Promise<ApiResponse<Notification[]>> {
    try {
      // Get all students enrolled in the class
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true);

      if (enrollmentsError) {
        return createErrorResponse(enrollmentsError, 'send_class_notification', senderId);
      }

      const studentIds = enrollments?.map(e => e.student_id) || [];

      if (studentIds.length === 0) {
        return createSuccessResponse([]);
      }

      return this.createBulkNotifications(studentIds, {
        type: 'class',
        title,
        message,
        priority: type === 'class_starting' ? 'urgent' : 'medium',
        data: {
          class_id: classId,
          class_type: type,
        },
        senderId,
        expiresAt: type === 'class_starting' ?
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : // 2 hours
          undefined,
      });
    } catch (error) {
      return createErrorResponse(error, 'send_class_notification', senderId);
    }
  }

  /**
   * Send system notification to all users
   */
  public async sendSystemNotification(
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: any,
    expiresAt?: string
  ): Promise<ApiResponse<Notification[]>> {
    try {
      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      if (usersError) {
        return createErrorResponse(usersError, 'send_system_notification', undefined);
      }

      const userIds = users?.map(u => u.id) || [];

      if (userIds.length === 0) {
        return createSuccessResponse([]);
      }

      return this.createBulkNotifications(userIds, {
        type: 'system',
        title,
        message,
        priority,
        data,
        expiresAt,
      });
    } catch (error) {
      return createErrorResponse(error, 'send_system_notification', undefined);
    }
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStats(userId?: string): Promise<ApiResponse<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<NotificationType, number>;
    notificationsByPriority: Record<NotificationPriority, number>;
  }>> {
    try {
      let query = supabase
        .from('notifications')
        .select('type, priority, is_read');

      if (userId) {
        query = query.eq('recipient_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        return createErrorResponse(error, 'get_notification_stats', userId);
      }

      const notifications = data || [];
      
      const stats = {
        totalNotifications: notifications.length,
        unreadNotifications: notifications.filter(n => !n.is_read).length,
        notificationsByType: {
          system: notifications.filter(n => n.type === 'system').length,
          assignment: notifications.filter(n => n.type === 'assignment').length,
          class: notifications.filter(n => n.type === 'class').length,
          message: notifications.filter(n => n.type === 'message').length,
          reminder: notifications.filter(n => n.type === 'reminder').length,
        },
        notificationsByPriority: {
          low: notifications.filter(n => n.priority === 'low').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          high: notifications.filter(n => n.priority === 'high').length,
          urgent: notifications.filter(n => n.priority === 'urgent').length,
        },
      };

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(error, 'get_notification_stats', userId);
    }
  }

  /**
   * Clean up old notifications (maintenance task)
   */
  public async cleanupOldNotifications(daysOld: number = 30): Promise<ApiResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) {
        return createErrorResponse(error, 'cleanup_old_notifications', undefined);
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Deleted ${deletedCount} old notifications (older than ${daysOld} days)`);

      return createSuccessResponse(deletedCount);
    } catch (error) {
      return createErrorResponse(error, 'cleanup_old_notifications', undefined);
    }
  }
}

// Singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;