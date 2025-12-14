import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmailConfiguration {
  id: string;
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  api_key: string;
  sender_email: string;
  sender_name: string;
  domain?: string;
  region?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  usage_count_daily: number;
  usage_count_monthly: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  category: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html_content?: string;
  text_content?: string;
  template_id?: string;
  template_variables?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: 'low' | 'normal' | 'high';
  schedule_at?: string;
  tracking_enabled?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  content_type: string;
  disposition?: 'attachment' | 'inline';
}

export interface EmailDeliveryStatus {
  id: string;
  email_id: string;
  recipient: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'complained';
  provider_message_id?: string;
  error_message?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  created_at: string;
}

export interface EmailAnalytics {
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

class EmailService {
  private isInitialized = false;
  private configuration?: EmailConfiguration;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadConfiguration();
      this.isInitialized = true;
      logger.info('Email service initialized');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Load email configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const { data: config, error } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('No active email configuration found');
        return;
      }

      this.configuration = config;
    } catch (error) {
      logger.error('Failed to load email configuration:', error);
    }
  }

  /**
   * Send email using configured provider
   */
  public async sendEmail(options: EmailOptions): Promise<string> {
    try {
      if (!this.configuration) {
        throw new Error('Email service not configured');
      }

      // Check rate limits
      await this.checkRateLimits();

      // Validate recipients
      this.validateEmailAddresses(options.to);
      if (options.cc) this.validateEmailAddresses(options.cc);
      if (options.bcc) this.validateEmailAddresses(options.bcc);

      // Create email record
      const emailRecord = await this.createEmailRecord(options);

      // Send based on provider
      const messageId = await this.sendViaProvider(emailRecord, options);

      // Update email record with message ID
      await this.updateEmailRecord(emailRecord.id, {
        provider_message_id: messageId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Update usage counters
      await this.updateUsageCounters();

      logger.info(`Email sent successfully: ${messageId}`);
      return emailRecord.id;

    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send email using template
   */
  public async sendTemplateEmail(
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    options?: Partial<EmailOptions>
  ): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Email template not found');
      }

      // Process template variables
      const processedHtml = this.processTemplate(template.html_content, variables);
      const processedText = this.processTemplate(template.text_content, variables);
      const processedSubject = this.processTemplate(template.subject, variables);

      const emailOptions: EmailOptions = {
        to: recipients,
        subject: processedSubject,
        html_content: processedHtml,
        text_content: processedText,
        template_id: templateId,
        template_variables: variables,
        ...options,
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      logger.error('Failed to send template email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  public async sendBulkEmails(
    emails: EmailOptions[],
    batchSize: number = 10
  ): Promise<string[]> {
    try {
      const emailIds: string[] = [];
      
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const batchPromises = batch.map(email => this.sendEmail(email));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            emailIds.push(result.value);
          } else {
            logger.error(`Failed to send email ${i + index}:`, result.reason);
          }
        });

        // Rate limiting delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return emailIds;
    } catch (error) {
      logger.error('Failed to send bulk emails:', error);
      throw error;
    }
  }

  /**
   * Get email templates
   */
  public async getTemplates(category?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: templates, error } = await query.order('name');

      if (error) throw error;
      return templates || [];
    } catch (error) {
      logger.error('Failed to get email templates:', error);
      return [];
    }
  }

  /**
   * Create or update email template
   */
  public async saveTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    try {
      const { data: savedTemplate, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return savedTemplate;
    } catch (error) {
      logger.error('Failed to save email template:', error);
      throw error;
    }
  }

  /**
   * Get email delivery status
   */
  public async getDeliveryStatus(emailId: string): Promise<EmailDeliveryStatus[]> {
    try {
      const { data: statuses, error } = await supabase
        .from('email_delivery_status')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return statuses || [];
    } catch (error) {
      logger.error('Failed to get delivery status:', error);
      return [];
    }
  }

  /**
   * Get email analytics
   */
  public async getAnalytics(
    startDate: string,
    endDate: string,
    category?: string
  ): Promise<EmailAnalytics> {
    try {
      let query = supabase
        .from('emails')
        .select(`
          id,
          status,
          category,
          created_at,
          email_delivery_status(*)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: emails, error } = await query;
      if (error) throw error;

      return this.calculateAnalytics(emails || []);
    } catch (error) {
      logger.error('Failed to get email analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Configure email provider
   */
  public async configureProvider(config: Omit<EmailConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // Deactivate existing configurations
      await supabase
        .from('email_configurations')
        .update({ is_active: false })
        .neq('id', '');

      // Insert new configuration
      const { data: newConfig, error } = await supabase
        .from('email_configurations')
        .insert(config)
        .select()
        .single();

      if (error) throw error;

      this.configuration = newConfig;
      logger.info(`Email provider configured: ${config.provider}`);
    } catch (error) {
      logger.error('Failed to configure email provider:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  public async testConfiguration(testEmail: string): Promise<boolean> {
    try {
      const testEmailId = await this.sendEmail({
        to: [testEmail],
        subject: 'Manushi Coaching Platform - Email Configuration Test',
        html_content: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this email, your email service is properly configured!</p>
          <p>Best regards,<br>Manushi Coaching Platform Team</p>
        `,
        text_content: 'Email Configuration Test - If you received this email, your email service is properly configured!',
      });

      return !!testEmailId;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }

  // Private methods

  private async sendViaProvider(emailRecord: any, options: EmailOptions): Promise<string> {
    if (!this.configuration) {
      throw new Error('Email configuration not found');
    }

    switch (this.configuration.provider) {
      case 'sendgrid':
        return this.sendViaSendGrid(emailRecord, options);
      case 'mailgun':
        return this.sendViaMailgun(emailRecord, options);
      case 'ses':
        return this.sendViaSES(emailRecord, options);
      case 'smtp':
        return this.sendViaSMTP(emailRecord, options);
      default:
        throw new Error(`Unsupported email provider: ${this.configuration.provider}`);
    }
  }

  private async sendViaSendGrid(emailRecord: any, options: EmailOptions): Promise<string> {
    // SendGrid implementation would go here
    // For now, return a mock message ID
    const messageId = `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('SendGrid email sent (mock):', messageId);
    return messageId;
  }

  private async sendViaMailgun(emailRecord: any, options: EmailOptions): Promise<string> {
    // Mailgun implementation would go here
    const messageId = `mg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Mailgun email sent (mock):', messageId);
    return messageId;
  }

  private async sendViaSES(emailRecord: any, options: EmailOptions): Promise<string> {
    // AWS SES implementation would go here
    const messageId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('AWS SES email sent (mock):', messageId);
    return messageId;
  }

  private async sendViaSMTP(emailRecord: any, options: EmailOptions): Promise<string> {
    // SMTP implementation would go here
    const messageId = `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('SMTP email sent (mock):', messageId);
    return messageId;
  }

  private async createEmailRecord(options: EmailOptions): Promise<any> {
    const emailData = {
      recipients: options.to,
      cc_recipients: options.cc || [],
      bcc_recipients: options.bcc || [],
      subject: options.subject,
      html_content: options.html_content,
      text_content: options.text_content,
      template_id: options.template_id,
      template_variables: options.template_variables || {},
      priority: options.priority || 'normal',
      status: 'queued',
      tracking_enabled: options.tracking_enabled !== false,
      scheduled_at: options.schedule_at,
    };

    const { data: email, error } = await supabase
      .from('emails')
      .insert(emailData)
      .select()
      .single();

    if (error) throw error;
    return email;
  }

  private async updateEmailRecord(emailId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .update(updates)
      .eq('id', emailId);

    if (error) throw error;
  }

  private async checkRateLimits(): Promise<void> {
    if (!this.configuration) return;

    if (this.configuration.usage_count_daily >= this.configuration.daily_limit) {
      throw new Error('Daily email limit exceeded');
    }

    if (this.configuration.usage_count_monthly >= this.configuration.monthly_limit) {
      throw new Error('Monthly email limit exceeded');
    }
  }

  private async updateUsageCounters(): Promise<void> {
    if (!this.configuration) return;

    await supabase
      .from('email_configurations')
      .update({
        usage_count_daily: this.configuration.usage_count_daily + 1,
        usage_count_monthly: this.configuration.usage_count_monthly + 1,
      })
      .eq('id', this.configuration.id);
  }

  private validateEmailAddresses(emails: string[]): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }
  }

  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) return null;
      return template;
    } catch (error) {
      return null;
    }
  }

  private processTemplate(content: string, variables: Record<string, any>): string {
    let processed = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    });

    return processed;
  }

  private calculateAnalytics(emails: any[]): EmailAnalytics {
    const total_sent = emails.length;
    const delivered = emails.filter(e => e.email_delivery_status?.some((s: any) => s.status === 'delivered')).length;
    const bounced = emails.filter(e => e.email_delivery_status?.some((s: any) => s.status === 'bounced')).length;
    const opened = emails.filter(e => e.email_delivery_status?.some((s: any) => s.opened_at)).length;
    const clicked = emails.filter(e => e.email_delivery_status?.some((s: any) => s.clicked_at)).length;

    return {
      total_sent,
      total_delivered: delivered,
      total_bounced: bounced,
      total_opened: opened,
      total_clicked: clicked,
      delivery_rate: total_sent > 0 ? (delivered / total_sent) * 100 : 0,
      open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
      click_rate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounce_rate: total_sent > 0 ? (bounced / total_sent) * 100 : 0,
    };
  }

  private getEmptyAnalytics(): EmailAnalytics {
    return {
      total_sent: 0,
      total_delivered: 0,
      total_bounced: 0,
      total_opened: 0,
      total_clicked: 0,
      delivery_rate: 0,
      open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default EmailService;