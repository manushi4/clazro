// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  userId: string;
  enabledTypes: NotificationType[];
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  priority: {
    urgent: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  categories: {
    assignments: boolean;
    classes: boolean;
    messages: boolean;
    payments: boolean;
    system: boolean;
    marketing: boolean;
  };
}

export type NotificationType = 
  | 'assignment_due' | 'assignment_graded' | 'assignment_returned'
  | 'class_starting' | 'class_cancelled' | 'class_rescheduled' | 'class_recording_ready'
  | 'message_received' | 'mention_received' | 'reply_received'
  | 'payment_due' | 'payment_received' | 'payment_failed' | 'payment_reminder'
  | 'system_maintenance' | 'system_update' | 'account_security' | 'feature_announcement'
  | 'doubt_resolved' | 'test_result' | 'progress_report' | 'attendance_alert'
  | 'parent_report' | 'teacher_feedback' | 'performance_insights';

export type NotificationPriority = 'urgent' | 'high' | 'medium' | 'low';
export type NotificationChannel = 'push' | 'email' | 'inApp' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  actionButtons?: NotificationAction[];
  category: string;
  tags: string[];
  groupId?: string; // For grouping related notifications
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'navigate' | 'api_call' | 'dismiss' | 'snooze';
  data?: Record<string, any>;
  destructive?: boolean;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  category: string;
  actionButtons?: NotificationAction[];
  variables: string[]; // Template variables like {studentName}, {assignmentTitle}
}

export interface NotificationBatch {
  id: string;
  name: string;
  description: string;
  userIds: string[];
  template: NotificationTemplate;
  variables: Record<string, string>[]; // Array of variable mappings for each user
  scheduledAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    sent: number;
    failed: number;
  };
  createdAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
    value: number | string;
    timeWindow?: number; // minutes
  };
  actions: {
    sendNotification: boolean;
    notificationTemplate: string;
    recipients: string[];
    escalationDelay?: number; // minutes
  };
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'error' | 'capacity' | 'maintenance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string; // Component or service that generated the alert
  details?: Record<string, any>;
  affectedUsers?: string[];
  resolution?: string;
  resolvedAt?: Date;
  acknowledgedBy?: string[];
  createdAt: Date;
  updatedAt: Date;
}

class NotificationService extends SimpleEventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private batches: Map<string, NotificationBatch> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private systemAlerts: Map<string, SystemAlert> = new Map();
  private deliveryQueue: string[] = [];
  private processingBatch = false;

  constructor() {
    super();
    this.initializeDefaultTemplates();
    this.startDeliveryProcessor();
    this.startCleanupScheduler();
  }

  // User Notification Management
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options: {
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      data?: Record<string, any>;
      scheduledAt?: Date;
      expiresAt?: Date;
      actionButtons?: NotificationAction[];
      category?: string;
      tags?: string[];
      groupId?: string;
    } = {}
  ): Promise<Notification> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: Notification = {
      id: notificationId,
      userId,
      type,
      priority: options.priority || 'medium',
      title,
      message,
      data: options.data,
      channels: options.channels || ['push', 'inApp'],
      status: 'pending',
      scheduledAt: options.scheduledAt,
      expiresAt: options.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      actionButtons: options.actionButtons,
      category: options.category || this.getCategoryForType(type),
      tags: options.tags || [],
      groupId: options.groupId
    };

    this.notifications.set(notificationId, notification);

    if (!options.scheduledAt || options.scheduledAt <= new Date()) {
      await this.scheduleDelivery(notificationId);
    }

    this.emit('notificationCreated', notification);
    return notification;
  }

  async sendBulkNotifications(
    notifications: Array<{
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      options?: any;
    }>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const notifData of notifications) {
      const notification = await this.createNotification(
        notifData.userId,
        notifData.type,
        notifData.title,
        notifData.message,
        notifData.options || {}
      );
      notificationIds.push(notification.id);
    }

    return notificationIds;
  }

  async createNotificationBatch(
    name: string,
    description: string,
    userIds: string[],
    templateId: string,
    variables: Record<string, string>[],
    scheduledAt?: Date
  ): Promise<NotificationBatch> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const batch: NotificationBatch = {
      id: batchId,
      name,
      description,
      userIds,
      template,
      variables,
      scheduledAt,
      status: 'pending',
      progress: {
        total: userIds.length,
        sent: 0,
        failed: 0
      },
      createdAt: new Date()
    };

    this.batches.set(batchId, batch);

    if (!scheduledAt || scheduledAt <= new Date()) {
      this.processBatch(batchId);
    }

    return batch;
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false;
    }

    notification.status = 'read';
    notification.readAt = new Date();
    notification.updatedAt = new Date();

    this.emit('notificationRead', notification);
    return true;
  }

  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    let readCount = 0;
    
    for (const notificationId of notificationIds) {
      const success = await this.markAsRead(notificationId, userId);
      if (success) readCount++;
    }

    return readCount;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false;
    }

    this.notifications.delete(notificationId);
    this.emit('notificationDeleted', notificationId);
    return true;
  }

  // User Preferences Management
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.preferences.get(userId);
    
    if (!preferences) {
      preferences = this.getDefaultPreferences(userId);
      this.preferences.set(userId, preferences);
      await this.savePreferencesToStorage(userId, preferences);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...updates };
    
    this.preferences.set(userId, updated);
    await this.savePreferencesToStorage(userId, updated);
    
    this.emit('preferencesUpdated', { userId, preferences: updated });
    return updated;
  }

  // Template Management
  createTemplate(template: Omit<NotificationTemplate, 'id'>): NotificationTemplate {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTemplate = { ...template, id: templateId };
    
    this.templates.set(templateId, fullTemplate);
    return fullTemplate;
  }

  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  // Alert Rules Management
  createAlertRule(rule: Omit<AlertRule, 'id' | 'triggerCount' | 'createdAt'>): AlertRule {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: AlertRule = {
      ...rule,
      id: ruleId,
      triggerCount: 0,
      createdAt: new Date()
    };

    this.alertRules.set(ruleId, fullRule);
    return fullRule;
  }

  async triggerAlert(metric: string, value: number | string): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled || rule.condition.metric !== metric) continue;

      const shouldTrigger = this.evaluateCondition(rule.condition, value);
      if (!shouldTrigger) continue;

      rule.lastTriggered = new Date();
      rule.triggerCount++;

      if (rule.actions.sendNotification && rule.actions.notificationTemplate) {
        for (const userId of rule.actions.recipients) {
          await this.createNotification(
            userId,
            'system_maintenance',
            `Alert: ${rule.name}`,
            `Alert rule "${rule.name}" has been triggered. Current value: ${value}`,
            {
              priority: 'urgent',
              channels: ['push', 'email'],
              data: { ruleId, metric, value, ruleName: rule.name }
            }
          );
        }
      }

      this.emit('alertTriggered', { rule, metric, value });
    }
  }

  // System Alerts Management
  createSystemAlert(
    type: SystemAlert['type'],
    severity: SystemAlert['severity'],
    title: string,
    message: string,
    source: string,
    options: {
      details?: Record<string, any>;
      affectedUsers?: string[];
    } = {}
  ): SystemAlert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: SystemAlert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      source,
      details: options.details,
      affectedUsers: options.affectedUsers,
      acknowledgedBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.systemAlerts.set(alertId, alert);

    // Auto-notify admin users for critical alerts
    if (severity === 'critical' || severity === 'error') {
      this.notifyAdminsOfSystemAlert(alert);
    }

    this.emit('systemAlertCreated', alert);
    return alert;
  }

  async acknowledgeSystemAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.systemAlerts.get(alertId);
    if (!alert) return false;

    if (!alert.acknowledgedBy?.includes(userId)) {
      alert.acknowledgedBy = [...(alert.acknowledgedBy || []), userId];
      alert.updatedAt = new Date();
      this.emit('systemAlertAcknowledged', { alert, userId });
    }

    return true;
  }

  async resolveSystemAlert(
    alertId: string,
    resolution: string,
    userId: string
  ): Promise<boolean> {
    const alert = this.systemAlerts.get(alertId);
    if (!alert) return false;

    alert.resolution = resolution;
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();

    this.emit('systemAlertResolved', { alert, resolution, userId });
    return true;
  }

  // Query Methods
  getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: NotificationStatus[];
      priority?: NotificationPriority[];
      category?: string[];
      unreadOnly?: boolean;
    } = {}
  ): Notification[] {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let filtered = userNotifications;

    if (options.unreadOnly) {
      filtered = filtered.filter(n => n.status !== 'read');
    }

    if (options.status && options.status.length > 0) {
      filtered = filtered.filter(n => options.status!.includes(n.status));
    }

    if (options.priority && options.priority.length > 0) {
      filtered = filtered.filter(n => options.priority!.includes(n.priority));
    }

    if (options.category && options.category.length > 0) {
      filtered = filtered.filter(n => options.category!.includes(n.category));
    }

    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return filtered.slice(offset, offset + limit);
  }

  getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && n.status !== 'read').length;
  }

  getSystemAlerts(
    options: {
      type?: SystemAlert['type'][];
      severity?: SystemAlert['severity'][];
      resolved?: boolean;
      limit?: number;
    } = {}
  ): SystemAlert[] {
    let alerts = Array.from(this.systemAlerts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.type && options.type.length > 0) {
      alerts = alerts.filter(a => options.type!.includes(a.type));
    }

    if (options.severity && options.severity.length > 0) {
      alerts = alerts.filter(a => options.severity!.includes(a.severity));
    }

    if (options.resolved !== undefined) {
      alerts = alerts.filter(a => options.resolved ? !!a.resolvedAt : !a.resolvedAt);
    }

    const limit = options.limit || 100;
    return alerts.slice(0, limit);
  }

  // Private Methods
  private async scheduleDelivery(notificationId: string): Promise<void> {
    this.deliveryQueue.push(notificationId);
    this.processDeliveryQueue();
  }

  private async processDeliveryQueue(): Promise<void> {
    if (this.processingBatch || this.deliveryQueue.length === 0) return;

    this.processingBatch = true;

    while (this.deliveryQueue.length > 0) {
      const notificationId = this.deliveryQueue.shift()!;
      await this.deliverNotification(notificationId);
    }

    this.processingBatch = false;
  }

  private async deliverNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const preferences = await this.getUserPreferences(notification.userId);
    
    // Check if user wants this type of notification
    if (!preferences.enabledTypes.includes(notification.type)) {
      notification.status = 'failed';
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      // Reschedule for after quiet hours unless urgent
      if (notification.priority !== 'urgent') {
        this.scheduleAfterQuietHours(notification, preferences);
        return;
      }
    }

    // Check priority preferences
    if (!preferences.priority[notification.priority]) {
      notification.status = 'failed';
      return;
    }

    // Check category preferences
    if (!preferences.categories[notification.category as keyof typeof preferences.categories]) {
      notification.status = 'failed';
      return;
    }

    // Simulate delivery to different channels
    for (const channel of notification.channels) {
      if (preferences.channels[channel]) {
        await this.deliverToChannel(notification, channel);
      }
    }

    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.updatedAt = new Date();

    this.emit('notificationSent', notification);
  }

  private async deliverToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    // Simulate channel delivery
    switch (channel) {
      case 'push':
        // Push notification delivery logic
        break;
      case 'email':
        // Email delivery logic
        break;
      case 'inApp':
        // In-app notification logic
        break;
      case 'sms':
        // SMS delivery logic
        break;
    }

    // Mark as delivered
    notification.deliveredAt = new Date();
    notification.status = 'delivered';
  }

  private async processBatch(batchId: string): Promise<void> {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.status = 'processing';

    for (let i = 0; i < batch.userIds.length; i++) {
      const userId = batch.userIds[i];
      const variables = batch.variables[i] || {};

      try {
        const title = this.substituteVariables(batch.template.title, variables);
        const message = this.substituteVariables(batch.template.message, variables);

        await this.createNotification(
          userId,
          batch.template.type,
          title,
          message,
          {
            priority: batch.template.priority,
            channels: batch.template.channels,
            actionButtons: batch.template.actionButtons,
            category: batch.template.category
          }
        );

        batch.progress.sent++;
      } catch (error) {
        batch.progress.failed++;
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }

    batch.status = 'completed';
    this.emit('batchCompleted', batch);
  }

  private substituteVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= preferences.quietHours.startTime && 
           currentTime <= preferences.quietHours.endTime;
  }

  private scheduleAfterQuietHours(
    notification: Notification,
    preferences: NotificationPreferences
  ): void {
    const [hours, minutes] = preferences.quietHours.endTime.split(':').map(Number);
    const tomorrow = new Date();
    tomorrow.setHours(hours, minutes, 0, 0);
    if (tomorrow <= new Date()) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    notification.scheduledAt = tomorrow;
    // Schedule for later processing
    setTimeout(() => {
      this.scheduleDelivery(notification.id);
    }, tomorrow.getTime() - Date.now());
  }

  private evaluateCondition(condition: AlertRule['condition'], value: number | string): boolean {
    const { operator, value: conditionValue } = condition;
    
    switch (operator) {
      case '>': return Number(value) > Number(conditionValue);
      case '<': return Number(value) < Number(conditionValue);
      case '=': return value === conditionValue;
      case '!=': return value !== conditionValue;
      case '>=': return Number(value) >= Number(conditionValue);
      case '<=': return Number(value) <= Number(conditionValue);
      default: return false;
    }
  }

  private async notifyAdminsOfSystemAlert(alert: SystemAlert): Promise<void> {
    // This would typically query for admin users from the user service
    const adminUserIds = ['admin_user_1', 'admin_user_2']; // Placeholder

    for (const adminId of adminUserIds) {
      await this.createNotification(
        adminId,
        'system_maintenance',
        `System Alert: ${alert.title}`,
        alert.message,
        {
          priority: 'urgent',
          channels: ['push', 'email'],
          data: { 
            alertId: alert.id, 
            type: alert.type, 
            severity: alert.severity,
            source: alert.source 
          }
        }
      );
    }
  }

  private getCategoryForType(type: NotificationType): string {
    if (type.startsWith('assignment_')) return 'assignments';
    if (type.startsWith('class_')) return 'classes';
    if (type.startsWith('message_') || type.includes('mention') || type.includes('reply')) return 'messages';
    if (type.startsWith('payment_')) return 'payments';
    if (type.startsWith('system_') || type.includes('security') || type.includes('maintenance')) return 'system';
    return 'system';
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabledTypes: [
        'assignment_due', 'assignment_graded', 'class_starting', 'message_received',
        'payment_due', 'system_maintenance', 'doubt_resolved', 'test_result'
      ] as NotificationType[],
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      },
      channels: {
        push: true,
        email: true,
        inApp: true,
        sms: false
      },
      priority: {
        urgent: true,
        high: true,
        medium: true,
        low: false
      },
      categories: {
        assignments: true,
        classes: true,
        messages: true,
        payments: true,
        system: true,
        marketing: false
      }
    };
  }

  private async savePreferencesToStorage(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `notification_preferences_${userId}`,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<NotificationTemplate, 'id'>[] = [
      {
        type: 'assignment_due',
        title: 'Assignment Due Soon',
        message: 'Your assignment "{assignmentTitle}" is due in {timeRemaining}',
        priority: 'high',
        channels: ['push', 'email'],
        category: 'assignments',
        variables: ['assignmentTitle', 'timeRemaining']
      },
      {
        type: 'class_starting',
        title: 'Class Starting',
        message: 'Your {subject} class with {teacherName} starts in {timeRemaining}',
        priority: 'medium',
        channels: ['push'],
        category: 'classes',
        variables: ['subject', 'teacherName', 'timeRemaining']
      },
      {
        type: 'payment_due',
        title: 'Payment Reminder',
        message: 'Your payment of ₹{amount} is due on {dueDate}',
        priority: 'high',
        channels: ['push', 'email', 'sms'],
        category: 'payments',
        variables: ['amount', 'dueDate']
      }
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });
  }

  private startDeliveryProcessor(): void {
    // Process delivery queue every 10 seconds
    setInterval(() => {
      this.processDeliveryQueue();
    }, 10000);
  }

  private startCleanupScheduler(): void {
    // Clean up old notifications every hour
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 60 * 60 * 1000);
  }

  private cleanupOldNotifications(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [notificationId, notification] of this.notifications.entries()) {
      if (notification.createdAt < thirtyDaysAgo && notification.status === 'read') {
        this.notifications.delete(notificationId);
      }
    }

    // Clean up old system alerts
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const [alertId, alert] of this.systemAlerts.entries()) {
      if (alert.resolvedAt && alert.resolvedAt < sevenDaysAgo) {
        this.systemAlerts.delete(alertId);
      }
    }
  }
}

export const notificationService = new NotificationService();