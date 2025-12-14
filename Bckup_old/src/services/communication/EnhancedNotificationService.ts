import { notificationService, CreateNotificationOptions } from '../realtime/NotificationService';
import { emailService } from './EmailService';
import { smsWhatsAppService } from './SMSWhatsAppService';
import { auditLoggingService } from '../security/AuditLoggingService';
import { logger } from '../utils/logger';

export interface MultiChannelNotificationOptions extends CreateNotificationOptions {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  email_template_id?: string;
  sms_template_id?: string;
  whatsapp_template_name?: string;
  template_variables?: Record<string, any>;
  user_preferences_override?: boolean;
}

export interface NotificationDeliveryReport {
  notification_id: string;
  push_delivery: {
    status: 'sent' | 'failed' | 'not_attempted';
    message_id?: string;
    error?: string;
  };
  email_delivery: {
    status: 'sent' | 'failed' | 'not_attempted';
    message_id?: string;
    error?: string;
  };
  sms_delivery: {
    status: 'sent' | 'failed' | 'not_attempted';
    message_id?: string;
    error?: string;
  };
  whatsapp_delivery: {
    status: 'sent' | 'failed' | 'not_attempted';
    message_id?: string;
    error?: string;
  };
  total_success: number;
  total_failed: number;
  delivery_timestamp: string;
}

export interface BulkNotificationOptions {
  recipients: string[];
  notification_options: MultiChannelNotificationOptions;
  batch_size?: number;
  rate_limit_delay?: number;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  target_audience: {
    user_roles?: string[];
    user_ids?: string[];
    class_ids?: string[];
    custom_filters?: Record<string, any>;
  };
  notification_options: MultiChannelNotificationOptions;
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring';
    send_at?: string;
    recurring_pattern?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      days_of_week?: number[];
      time_of_day: string;
    };
  };
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  delivery_stats?: {
    total_recipients: number;
    successful_deliveries: number;
    failed_deliveries: number;
    delivery_rate: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

class EnhancedNotificationService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('Enhanced notification service initialized');

      // Log service initialization
      await auditLoggingService.logSystemEvent('enhanced_notification_service_initialized', {
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Failed to initialize enhanced notification service:', error);
    }
  }

  /**
   * Send multi-channel notification to a single recipient
   */
  public async sendMultiChannelNotification(
    recipientId: string,
    options: MultiChannelNotificationOptions
  ): Promise<NotificationDeliveryReport> {
    try {
      const deliveryReport: NotificationDeliveryReport = {
        notification_id: '',
        push_delivery: { status: 'not_attempted' },
        email_delivery: { status: 'not_attempted' },
        sms_delivery: { status: 'not_attempted' },
        whatsapp_delivery: { status: 'not_attempted' },
        total_success: 0,
        total_failed: 0,
        delivery_timestamp: new Date().toISOString(),
      };

      // Get user preferences
      const userPreferences = await this.getUserNotificationPreferences(recipientId);
      
      // Override preferences if specified
      const effectivePreferences = options.user_preferences_override ? {
        email_enabled: options.email_enabled ?? true,
        sms_enabled: options.sms_enabled ?? true,
        whatsapp_enabled: options.whatsapp_enabled ?? true,
        push_enabled: true,
      } : userPreferences;

      // Send push notification (via existing notification service)
      try {
        const notificationId = await notificationService.createNotification(recipientId, options);
        deliveryReport.notification_id = notificationId;
        deliveryReport.push_delivery = {
          status: 'sent',
          message_id: notificationId,
        };
        deliveryReport.total_success++;

        await auditLoggingService.logCommunication('push', 'sent', {
          recipient_id: recipientId,
          notification_id: notificationId,
          category: options.category,
        });

      } catch (error) {
        deliveryReport.push_delivery = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        deliveryReport.total_failed++;
        
        await auditLoggingService.logCommunication('push', 'failed', {
          recipient_id: recipientId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Send email notification
      if (effectivePreferences.email_enabled && options.email_enabled !== false) {
        try {
          const userEmail = await this.getUserEmail(recipientId);
          if (userEmail) {
            let emailId;
            
            if (options.email_template_id) {
              emailId = await emailService.sendTemplateEmail(
                options.email_template_id,
                [userEmail],
                options.template_variables || {}
              );
            } else {
              emailId = await emailService.sendEmail({
                to: [userEmail],
                subject: options.title,
                html_content: this.generateEmailHTML(options),
                text_content: options.content,
              });
            }

            deliveryReport.email_delivery = {
              status: 'sent',
              message_id: emailId,
            };
            deliveryReport.total_success++;

            await auditLoggingService.logCommunication('email', 'sent', {
              recipient_id: recipientId,
              email_id: emailId,
              template_id: options.email_template_id,
            });
          }
        } catch (error) {
          deliveryReport.email_delivery = {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          deliveryReport.total_failed++;

          await auditLoggingService.logCommunication('email', 'failed', {
            recipient_id: recipientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send SMS notification
      if (effectivePreferences.sms_enabled && options.sms_enabled !== false) {
        try {
          const userPhone = await this.getUserPhone(recipientId);
          if (userPhone) {
            let smsId;

            if (options.sms_template_id) {
              smsId = await smsWhatsAppService.sendSMSTemplate(
                options.sms_template_id,
                [userPhone],
                options.template_variables || {}
              );
            } else {
              smsId = await smsWhatsAppService.sendSMS({
                to: [userPhone],
                message: options.content,
              });
            }

            deliveryReport.sms_delivery = {
              status: 'sent',
              message_id: smsId,
            };
            deliveryReport.total_success++;

            await auditLoggingService.logCommunication('sms', 'sent', {
              recipient_id: recipientId,
              sms_id: smsId,
              template_id: options.sms_template_id,
            });
          }
        } catch (error) {
          deliveryReport.sms_delivery = {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          deliveryReport.total_failed++;

          await auditLoggingService.logCommunication('sms', 'failed', {
            recipient_id: recipientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send WhatsApp notification
      if (effectivePreferences.whatsapp_enabled && options.whatsapp_enabled !== false) {
        try {
          const userPhone = await this.getUserPhone(recipientId);
          if (userPhone) {
            let whatsappId;

            if (options.whatsapp_template_name) {
              whatsappId = await smsWhatsAppService.sendWhatsAppTemplate(
                options.whatsapp_template_name,
                [userPhone],
                options.template_variables || {}
              );
            } else {
              whatsappId = await smsWhatsAppService.sendWhatsApp({
                to: [userPhone],
                message: options.content,
              });
            }

            deliveryReport.whatsapp_delivery = {
              status: 'sent',
              message_id: whatsappId,
            };
            deliveryReport.total_success++;

            await auditLoggingService.logCommunication('whatsapp', 'sent', {
              recipient_id: recipientId,
              whatsapp_id: whatsappId,
              template_name: options.whatsapp_template_name,
            });
          }
        } catch (error) {
          deliveryReport.whatsapp_delivery = {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          deliveryReport.total_failed++;

          await auditLoggingService.logCommunication('whatsapp', 'failed', {
            recipient_id: recipientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log overall delivery report
      await auditLoggingService.logUserAction('multi_channel_notification_sent', {
        recipient_id: recipientId,
        delivery_report: deliveryReport,
        success_rate: deliveryReport.total_success / (deliveryReport.total_success + deliveryReport.total_failed),
      });

      return deliveryReport;

    } catch (error) {
      logger.error('Failed to send multi-channel notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple recipients
   */
  public async sendBulkNotifications(
    options: BulkNotificationOptions
  ): Promise<NotificationDeliveryReport[]> {
    try {
      const batchSize = options.batch_size || 50;
      const rateLimit = options.rate_limit_delay || 1000;
      const deliveryReports: NotificationDeliveryReport[] = [];

      // Process recipients in batches
      for (let i = 0; i < options.recipients.length; i += batchSize) {
        const batch = options.recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(recipientId =>
          this.sendMultiChannelNotification(recipientId, options.notification_options)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            deliveryReports.push(result.value);
          } else {
            logger.error(`Failed to send to recipient ${batch[index]}:`, result.reason);
            // Create a failed delivery report
            deliveryReports.push({
              notification_id: '',
              push_delivery: { status: 'failed', error: result.reason },
              email_delivery: { status: 'not_attempted' },
              sms_delivery: { status: 'not_attempted' },
              whatsapp_delivery: { status: 'not_attempted' },
              total_success: 0,
              total_failed: 1,
              delivery_timestamp: new Date().toISOString(),
            });
          }
        });

        // Rate limiting between batches
        if (i + batchSize < options.recipients.length) {
          await new Promise(resolve => setTimeout(resolve, rateLimit));
        }
      }

      // Log bulk operation completion
      const totalSuccess = deliveryReports.reduce((sum, report) => sum + report.total_success, 0);
      const totalFailed = deliveryReports.reduce((sum, report) => sum + report.total_failed, 0);

      await auditLoggingService.logUserAction('bulk_notification_sent', {
        total_recipients: options.recipients.length,
        total_success: totalSuccess,
        total_failed: totalFailed,
        success_rate: totalSuccess / (totalSuccess + totalFailed),
        batch_size: batchSize,
      });

      return deliveryReports;

    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create and schedule notification campaign
   */
  public async createNotificationCampaign(
    campaign: Omit<NotificationCampaign, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<string> {
    try {
      const campaignData = {
        ...campaign,
        status: 'draft' as const,
      };

      // This would typically save to database
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log campaign creation
      await auditLoggingService.logUserAction('notification_campaign_created', {
        campaign_id: campaignId,
        campaign_name: campaign.name,
        target_audience: campaign.target_audience,
        schedule_type: campaign.schedule.type,
      });

      logger.info(`Notification campaign created: ${campaignId}`);
      return campaignId;

    } catch (error) {
      logger.error('Failed to create notification campaign:', error);
      throw error;
    }
  }

  /**
   * Get notification analytics
   */
  public async getNotificationAnalytics(
    startDate: string,
    endDate: string
  ): Promise<{
    push: any;
    email: any;
    sms: any;
    whatsapp: any;
    overall: {
      total_notifications: number;
      successful_deliveries: number;
      failed_deliveries: number;
      delivery_rate: number;
    };
  }> {
    try {
      // Get analytics from individual services
      const emailAnalytics = await emailService.getAnalytics(startDate, endDate);
      const smsAnalytics = await smsWhatsAppService.getAnalytics('sms', startDate, endDate);
      const whatsappAnalytics = await smsWhatsAppService.getAnalytics('whatsapp', startDate, endDate);

      // Calculate overall statistics
      const totalSent = emailAnalytics.total_sent + smsAnalytics.total_sent + whatsappAnalytics.total_sent;
      const totalDelivered = emailAnalytics.total_delivered + smsAnalytics.total_delivered + whatsappAnalytics.total_delivered;
      const totalFailed = (emailAnalytics.total_sent - emailAnalytics.total_delivered) + 
                         smsAnalytics.total_failed + whatsappAnalytics.total_failed;

      return {
        push: {}, // Would come from notification service analytics
        email: emailAnalytics,
        sms: smsAnalytics,
        whatsapp: whatsappAnalytics,
        overall: {
          total_notifications: totalSent,
          successful_deliveries: totalDelivered,
          failed_deliveries: totalFailed,
          delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        },
      };

    } catch (error) {
      logger.error('Failed to get notification analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getUserNotificationPreferences(userId: string): Promise<{
    email_enabled: boolean;
    sms_enabled: boolean;
    whatsapp_enabled: boolean;
    push_enabled: boolean;
  }> {
    try {
      const preferences = await notificationService.getPreferences();
      return {
        email_enabled: preferences.email_enabled,
        sms_enabled: preferences.sms_enabled,
        whatsapp_enabled: true, // Default enabled
        push_enabled: preferences.push_enabled,
      };
    } catch (error) {
      // Return defaults if preferences not found
      return {
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        push_enabled: true,
      };
    }
  }

  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      // This would typically query the user database
      // For now, return a mock email
      return `user${userId.slice(-6)}@example.com`;
    } catch (error) {
      return null;
    }
  }

  private async getUserPhone(userId: string): Promise<string | null> {
    try {
      // This would typically query the user database
      // For now, return a mock phone
      return `+91987654${userId.slice(-4)}`;
    } catch (error) {
      return null;
    }
  }

  private generateEmailHTML(options: MultiChannelNotificationOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6750A4; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #6750A4; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Manushi Coaching Platform</h1>
          </div>
          <div class="content">
            <h2>${options.title}</h2>
            <p>${options.content}</p>
            ${options.action_url ? `<p><a href="${options.action_url}" class="button">Take Action</a></p>` : ''}
          </div>
          <div class="footer">
            <p>© 2024 Manushi Coaching Platform. All rights reserved.</p>
            <p>This email was sent from an automated system. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
export default EnhancedNotificationService;