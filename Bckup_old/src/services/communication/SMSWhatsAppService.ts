import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SMSConfiguration {
  id: string;
  provider: 'twilio' | 'textlocal' | 'msg91' | 'fast2sms' | 'aws_sns';
  api_key: string;
  api_secret?: string;
  sender_id: string;
  account_sid?: string; // For Twilio
  auth_token?: string; // For Twilio
  region?: string;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  usage_count_daily: number;
  usage_count_monthly: number;
  cost_per_sms: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfiguration {
  id: string;
  provider: 'twilio' | 'whatsapp_business' | 'gupshup' | 'interakt';
  api_key: string;
  api_secret?: string;
  phone_number_id: string;
  business_account_id?: string;
  access_token: string;
  webhook_verify_token: string;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  usage_count_daily: number;
  usage_count_monthly: number;
  cost_per_message: number;
  created_at: string;
  updated_at: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  is_active: boolean;
  dlt_template_id?: string; // For Indian SMS compliance
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  namespace: string;
  category: 'authentication' | 'marketing' | 'utility';
  language: string;
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    content: string;
  };
  body: {
    content: string;
    variables: string[];
  };
  footer?: string;
  buttons?: Array<{
    type: 'quick_reply' | 'url' | 'phone_number';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  is_active: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSOptions {
  to: string[];
  message: string;
  template_id?: string;
  template_variables?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  schedule_at?: string;
  unicode?: boolean;
  flash?: boolean;
}

export interface WhatsAppOptions {
  to: string[];
  template_name?: string;
  template_variables?: Record<string, any>;
  message?: string; // For session messages
  media?: {
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    caption?: string;
  };
  priority?: 'low' | 'normal' | 'high';
  schedule_at?: string;
}

export interface MessageDeliveryStatus {
  id: string;
  message_id: string;
  recipient: string;
  platform: 'sms' | 'whatsapp';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'read';
  provider_message_id?: string;
  error_message?: string;
  cost: number;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  created_at: string;
}

export interface MessagingAnalytics {
  platform: 'sms' | 'whatsapp';
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_read: number;
  delivery_rate: number;
  read_rate: number;
  failure_rate: number;
  total_cost: number;
  average_cost_per_message: number;
}

class SMSWhatsAppService {
  private isInitialized = false;
  private smsConfiguration?: SMSConfiguration;
  private whatsappConfiguration?: WhatsAppConfiguration;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadConfigurations();
      this.isInitialized = true;
      logger.info('SMS & WhatsApp service initialized');
    } catch (error) {
      logger.error('Failed to initialize SMS & WhatsApp service:', error);
    }
  }

  /**
   * Load SMS and WhatsApp configurations
   */
  private async loadConfigurations(): Promise<void> {
    try {
      // Load SMS configuration
      const { data: smsConfig } = await supabase
        .from('sms_configurations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (smsConfig) {
        this.smsConfiguration = smsConfig;
      }

      // Load WhatsApp configuration
      const { data: whatsappConfig } = await supabase
        .from('whatsapp_configurations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (whatsappConfig) {
        this.whatsappConfiguration = whatsappConfig;
      }
    } catch (error) {
      logger.warn('No active SMS/WhatsApp configuration found');
    }
  }

  /**
   * Send SMS
   */
  public async sendSMS(options: SMSOptions): Promise<string> {
    try {
      if (!this.smsConfiguration) {
        throw new Error('SMS service not configured');
      }

      // Check rate limits
      await this.checkSMSRateLimits();

      // Validate phone numbers
      this.validatePhoneNumbers(options.to);

      // Create SMS record
      const smsRecord = await this.createSMSRecord(options);

      // Send based on provider
      const messageId = await this.sendSMSViaProvider(smsRecord, options);

      // Update SMS record
      await this.updateSMSRecord(smsRecord.id, {
        provider_message_id: messageId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Update usage counters
      await this.updateSMSUsageCounters();

      logger.info(`SMS sent successfully: ${messageId}`);
      return smsRecord.id;

    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  public async sendWhatsApp(options: WhatsAppOptions): Promise<string> {
    try {
      if (!this.whatsappConfiguration) {
        throw new Error('WhatsApp service not configured');
      }

      // Check rate limits
      await this.checkWhatsAppRateLimits();

      // Validate phone numbers
      this.validatePhoneNumbers(options.to);

      // Create WhatsApp record
      const whatsappRecord = await this.createWhatsAppRecord(options);

      // Send based on provider
      const messageId = await this.sendWhatsAppViaProvider(whatsappRecord, options);

      // Update WhatsApp record
      await this.updateWhatsAppRecord(whatsappRecord.id, {
        provider_message_id: messageId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Update usage counters
      await this.updateWhatsAppUsageCounters();

      logger.info(`WhatsApp message sent successfully: ${messageId}`);
      return whatsappRecord.id;

    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send SMS using template
   */
  public async sendSMSTemplate(
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    options?: Partial<SMSOptions>
  ): Promise<string> {
    try {
      const template = await this.getSMSTemplate(templateId);
      if (!template) {
        throw new Error('SMS template not found');
      }

      const processedMessage = this.processTemplate(template.content, variables);

      const smsOptions: SMSOptions = {
        to: recipients,
        message: processedMessage,
        template_id: templateId,
        template_variables: variables,
        ...options,
      };

      return await this.sendSMS(smsOptions);
    } catch (error) {
      logger.error('Failed to send SMS template:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp template message
   */
  public async sendWhatsAppTemplate(
    templateName: string,
    recipients: string[],
    variables: Record<string, any>,
    options?: Partial<WhatsAppOptions>
  ): Promise<string> {
    try {
      const template = await this.getWhatsAppTemplate(templateName);
      if (!template || !template.approved) {
        throw new Error('WhatsApp template not found or not approved');
      }

      const whatsappOptions: WhatsAppOptions = {
        to: recipients,
        template_name: templateName,
        template_variables: variables,
        ...options,
      };

      return await this.sendWhatsApp(whatsappOptions);
    } catch (error) {
      logger.error('Failed to send WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS with rate limiting
   */
  public async sendBulkSMS(
    messages: SMSOptions[],
    batchSize: number = 10
  ): Promise<string[]> {
    try {
      const messageIds: string[] = [];
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchPromises = batch.map(sms => this.sendSMS(sms));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            messageIds.push(result.value);
          } else {
            logger.error(`Failed to send SMS ${i + index}:`, result.reason);
          }
        });

        // Rate limiting delay between batches
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return messageIds;
    } catch (error) {
      logger.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }

  /**
   * Get SMS templates
   */
  public async getSMSTemplates(category?: string): Promise<SMSTemplate[]> {
    try {
      let query = supabase
        .from('sms_templates')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: templates, error } = await query.order('name');

      if (error) throw error;
      return templates || [];
    } catch (error) {
      logger.error('Failed to get SMS templates:', error);
      return [];
    }
  }

  /**
   * Get WhatsApp templates
   */
  public async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data: templates, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .eq('approved', true)
        .order('name');

      if (error) throw error;
      return templates || [];
    } catch (error) {
      logger.error('Failed to get WhatsApp templates:', error);
      return [];
    }
  }

  /**
   * Get message delivery status
   */
  public async getDeliveryStatus(messageId: string): Promise<MessageDeliveryStatus[]> {
    try {
      const { data: statuses, error } = await supabase
        .from('message_delivery_status')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return statuses || [];
    } catch (error) {
      logger.error('Failed to get delivery status:', error);
      return [];
    }
  }

  /**
   * Get messaging analytics
   */
  public async getAnalytics(
    platform: 'sms' | 'whatsapp',
    startDate: string,
    endDate: string
  ): Promise<MessagingAnalytics> {
    try {
      const tableName = platform === 'sms' ? 'sms_messages' : 'whatsapp_messages';
      
      const { data: messages, error } = await supabase
        .from(tableName)
        .select(`
          id,
          status,
          cost,
          created_at,
          message_delivery_status(*)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      return this.calculateMessagingAnalytics(platform, messages || []);
    } catch (error) {
      logger.error('Failed to get messaging analytics:', error);
      return this.getEmptyMessagingAnalytics(platform);
    }
  }

  /**
   * Configure SMS provider
   */
  public async configureSMSProvider(config: Omit<SMSConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // Deactivate existing configurations
      await supabase
        .from('sms_configurations')
        .update({ is_active: false })
        .neq('id', '');

      // Insert new configuration
      const { data: newConfig, error } = await supabase
        .from('sms_configurations')
        .insert(config)
        .select()
        .single();

      if (error) throw error;

      this.smsConfiguration = newConfig;
      logger.info(`SMS provider configured: ${config.provider}`);
    } catch (error) {
      logger.error('Failed to configure SMS provider:', error);
      throw error;
    }
  }

  /**
   * Configure WhatsApp provider
   */
  public async configureWhatsAppProvider(config: Omit<WhatsAppConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // Deactivate existing configurations
      await supabase
        .from('whatsapp_configurations')
        .update({ is_active: false })
        .neq('id', '');

      // Insert new configuration
      const { data: newConfig, error } = await supabase
        .from('whatsapp_configurations')
        .insert(config)
        .select()
        .single();

      if (error) throw error;

      this.whatsappConfiguration = newConfig;
      logger.info(`WhatsApp provider configured: ${config.provider}`);
    } catch (error) {
      logger.error('Failed to configure WhatsApp provider:', error);
      throw error;
    }
  }

  /**
   * Test SMS configuration
   */
  public async testSMSConfiguration(testNumber: string): Promise<boolean> {
    try {
      const testMessageId = await this.sendSMS({
        to: [testNumber],
        message: 'Manushi Coaching Platform - SMS Configuration Test. Your SMS service is working correctly!',
      });

      return !!testMessageId;
    } catch (error) {
      logger.error('SMS configuration test failed:', error);
      return false;
    }
  }

  /**
   * Test WhatsApp configuration
   */
  public async testWhatsAppConfiguration(testNumber: string): Promise<boolean> {
    try {
      const testMessageId = await this.sendWhatsApp({
        to: [testNumber],
        message: 'Manushi Coaching Platform - WhatsApp Configuration Test. Your WhatsApp service is working correctly!',
      });

      return !!testMessageId;
    } catch (error) {
      logger.error('WhatsApp configuration test failed:', error);
      return false;
    }
  }

  // Private methods

  private async sendSMSViaProvider(smsRecord: any, options: SMSOptions): Promise<string> {
    if (!this.smsConfiguration) {
      throw new Error('SMS configuration not found');
    }

    switch (this.smsConfiguration.provider) {
      case 'twilio':
        return this.sendSMSViaTwilio(smsRecord, options);
      case 'textlocal':
        return this.sendSMSViaTextLocal(smsRecord, options);
      case 'msg91':
        return this.sendSMSViaMsg91(smsRecord, options);
      case 'fast2sms':
        return this.sendSMSViaFast2SMS(smsRecord, options);
      case 'aws_sns':
        return this.sendSMSViaAWSSNS(smsRecord, options);
      default:
        throw new Error(`Unsupported SMS provider: ${this.smsConfiguration.provider}`);
    }
  }

  private async sendWhatsAppViaProvider(whatsappRecord: any, options: WhatsAppOptions): Promise<string> {
    if (!this.whatsappConfiguration) {
      throw new Error('WhatsApp configuration not found');
    }

    switch (this.whatsappConfiguration.provider) {
      case 'twilio':
        return this.sendWhatsAppViaTwilio(whatsappRecord, options);
      case 'whatsapp_business':
        return this.sendWhatsAppViaBusiness(whatsappRecord, options);
      case 'gupshup':
        return this.sendWhatsAppViaGupshup(whatsappRecord, options);
      case 'interakt':
        return this.sendWhatsAppViaInterakt(whatsappRecord, options);
      default:
        throw new Error(`Unsupported WhatsApp provider: ${this.whatsappConfiguration.provider}`);
    }
  }

  // Mock implementations for different providers
  private async sendSMSViaTwilio(smsRecord: any, options: SMSOptions): Promise<string> {
    const messageId = `twilio-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Twilio SMS sent (mock):', messageId);
    return messageId;
  }

  private async sendSMSViaTextLocal(smsRecord: any, options: SMSOptions): Promise<string> {
    const messageId = `textlocal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('TextLocal SMS sent (mock):', messageId);
    return messageId;
  }

  private async sendSMSViaMsg91(smsRecord: any, options: SMSOptions): Promise<string> {
    const messageId = `msg91-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('MSG91 SMS sent (mock):', messageId);
    return messageId;
  }

  private async sendSMSViaFast2SMS(smsRecord: any, options: SMSOptions): Promise<string> {
    const messageId = `fast2sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Fast2SMS sent (mock):', messageId);
    return messageId;
  }

  private async sendSMSViaAWSSNS(smsRecord: any, options: SMSOptions): Promise<string> {
    const messageId = `aws-sns-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('AWS SNS SMS sent (mock):', messageId);
    return messageId;
  }

  private async sendWhatsAppViaTwilio(whatsappRecord: any, options: WhatsAppOptions): Promise<string> {
    const messageId = `twilio-wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Twilio WhatsApp sent (mock):', messageId);
    return messageId;
  }

  private async sendWhatsAppViaBusiness(whatsappRecord: any, options: WhatsAppOptions): Promise<string> {
    const messageId = `wa-business-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('WhatsApp Business API sent (mock):', messageId);
    return messageId;
  }

  private async sendWhatsAppViaGupshup(whatsappRecord: any, options: WhatsAppOptions): Promise<string> {
    const messageId = `gupshup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Gupshup WhatsApp sent (mock):', messageId);
    return messageId;
  }

  private async sendWhatsAppViaInterakt(whatsappRecord: any, options: WhatsAppOptions): Promise<string> {
    const messageId = `interakt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Interakt WhatsApp sent (mock):', messageId);
    return messageId;
  }

  private validatePhoneNumbers(numbers: string[]): void {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    for (const number of numbers) {
      if (!phoneRegex.test(number.replace(/\s/g, ''))) {
        throw new Error(`Invalid phone number: ${number}`);
      }
    }
  }

  private async createSMSRecord(options: SMSOptions): Promise<any> {
    const smsData = {
      recipients: options.to,
      message: options.message,
      template_id: options.template_id,
      template_variables: options.template_variables || {},
      priority: options.priority || 'normal',
      status: 'queued',
      unicode: options.unicode || false,
      flash: options.flash || false,
      scheduled_at: options.schedule_at,
      cost: this.calculateSMSCost(options.message, options.to.length),
    };

    const { data: sms, error } = await supabase
      .from('sms_messages')
      .insert(smsData)
      .select()
      .single();

    if (error) throw error;
    return sms;
  }

  private async createWhatsAppRecord(options: WhatsAppOptions): Promise<any> {
    const whatsappData = {
      recipients: options.to,
      template_name: options.template_name,
      template_variables: options.template_variables || {},
      message: options.message,
      media: options.media,
      priority: options.priority || 'normal',
      status: 'queued',
      scheduled_at: options.schedule_at,
      cost: this.calculateWhatsAppCost(options.to.length),
    };

    const { data: whatsapp, error } = await supabase
      .from('whatsapp_messages')
      .insert(whatsappData)
      .select()
      .single();

    if (error) throw error;
    return whatsapp;
  }

  private calculateSMSCost(message: string, recipientCount: number): number {
    if (!this.smsConfiguration) return 0;
    
    const messageLength = message.length;
    const smsCount = Math.ceil(messageLength / 160); // Standard SMS length
    return smsCount * recipientCount * this.smsConfiguration.cost_per_sms;
  }

  private calculateWhatsAppCost(recipientCount: number): number {
    if (!this.whatsappConfiguration) return 0;
    return recipientCount * this.whatsappConfiguration.cost_per_message;
  }

  private async updateSMSRecord(smsId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('sms_messages')
      .update(updates)
      .eq('id', smsId);

    if (error) throw error;
  }

  private async updateWhatsAppRecord(whatsappId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update(updates)
      .eq('id', whatsappId);

    if (error) throw error;
  }

  private async checkSMSRateLimits(): Promise<void> {
    if (!this.smsConfiguration) return;

    if (this.smsConfiguration.usage_count_daily >= this.smsConfiguration.daily_limit) {
      throw new Error('Daily SMS limit exceeded');
    }

    if (this.smsConfiguration.usage_count_monthly >= this.smsConfiguration.monthly_limit) {
      throw new Error('Monthly SMS limit exceeded');
    }
  }

  private async checkWhatsAppRateLimits(): Promise<void> {
    if (!this.whatsappConfiguration) return;

    if (this.whatsappConfiguration.usage_count_daily >= this.whatsappConfiguration.daily_limit) {
      throw new Error('Daily WhatsApp limit exceeded');
    }

    if (this.whatsappConfiguration.usage_count_monthly >= this.whatsappConfiguration.monthly_limit) {
      throw new Error('Monthly WhatsApp limit exceeded');
    }
  }

  private async updateSMSUsageCounters(): Promise<void> {
    if (!this.smsConfiguration) return;

    await supabase
      .from('sms_configurations')
      .update({
        usage_count_daily: this.smsConfiguration.usage_count_daily + 1,
        usage_count_monthly: this.smsConfiguration.usage_count_monthly + 1,
      })
      .eq('id', this.smsConfiguration.id);
  }

  private async updateWhatsAppUsageCounters(): Promise<void> {
    if (!this.whatsappConfiguration) return;

    await supabase
      .from('whatsapp_configurations')
      .update({
        usage_count_daily: this.whatsappConfiguration.usage_count_daily + 1,
        usage_count_monthly: this.whatsappConfiguration.usage_count_monthly + 1,
      })
      .eq('id', this.whatsappConfiguration.id);
  }

  private async getSMSTemplate(templateId: string): Promise<SMSTemplate | null> {
    try {
      const { data: template, error } = await supabase
        .from('sms_templates')
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

  private async getWhatsAppTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const { data: template, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .eq('approved', true)
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

  private calculateMessagingAnalytics(platform: 'sms' | 'whatsapp', messages: any[]): MessagingAnalytics {
    const total_sent = messages.length;
    const delivered = messages.filter(m => m.message_delivery_status?.some((s: any) => s.status === 'delivered')).length;
    const failed = messages.filter(m => m.message_delivery_status?.some((s: any) => s.status === 'failed')).length;
    const read = messages.filter(m => m.message_delivery_status?.some((s: any) => s.status === 'read')).length;
    const total_cost = messages.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      platform,
      total_sent,
      total_delivered: delivered,
      total_failed: failed,
      total_read: read,
      delivery_rate: total_sent > 0 ? (delivered / total_sent) * 100 : 0,
      read_rate: delivered > 0 ? (read / delivered) * 100 : 0,
      failure_rate: total_sent > 0 ? (failed / total_sent) * 100 : 0,
      total_cost,
      average_cost_per_message: total_sent > 0 ? total_cost / total_sent : 0,
    };
  }

  private getEmptyMessagingAnalytics(platform: 'sms' | 'whatsapp'): MessagingAnalytics {
    return {
      platform,
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      total_read: 0,
      delivery_rate: 0,
      read_rate: 0,
      failure_rate: 0,
      total_cost: 0,
      average_cost_per_message: 0,
    };
  }
}

// Export singleton instance
export const smsWhatsAppService = new SMSWhatsAppService();
export default SMSWhatsAppService;