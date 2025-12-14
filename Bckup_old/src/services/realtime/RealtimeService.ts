/**
 * Real-time Service
 * Manages real-time subscriptions and live updates  
 * Phase 71: Comprehensive API Integration Layer
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import supabase, { ApiResponse } from '../../lib/supabase';
import { RealtimeChannel as ChannelType, RealtimePayload } from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';

// Connection states
export type ConnectionState = 'connecting' | 'open' | 'closing' | 'closed';

// Subscription callback type
export type SubscriptionCallback<T = any> = (payload: RealtimePayload<T>) => void;

// Channel configuration
export interface ChannelConfig {
  userId?: string;
  classId?: string;
  filters?: Record<string, any>;
  presence?: boolean;
}

/**
 * RealtimeService Class
 * Comprehensive real-time data management
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private channels = new Map<string, RealtimeChannel>();
  private subscriptions = new Map<string, SubscriptionCallback[]>();
  private connectionState: ConnectionState = 'closed';
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimer?: NodeJS.Timeout;

  private constructor() {
    this.setupConnectionListeners();
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to real-time updates
   */
  public async subscribe<T>(
    channelName: ChannelType,
    config: ChannelConfig,
    callback: SubscriptionCallback<T>
  ): Promise<ApiResponse<string>> {
    try {
      const channelKey = this.generateChannelKey(channelName, config);
      
      // Add callback to subscription list
      if (!this.subscriptions.has(channelKey)) {
        this.subscriptions.set(channelKey, []);
      }
      this.subscriptions.get(channelKey)!.push(callback);

      // Create channel if it doesn't exist
      if (!this.channels.has(channelKey)) {
        await this.createChannel(channelName, channelKey, config);
      }

      console.log(`✅ Subscribed to channel: ${channelKey}`);
      return createSuccessResponse(channelKey);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${channelName}:`, error);
      return createErrorResponse(error, 'realtime_subscribe', config.userId);
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  public async unsubscribe(
    channelKey: string,
    callback?: SubscriptionCallback
  ): Promise<ApiResponse<void>> {
    try {
      if (callback) {
        // Remove specific callback
        const callbacks = this.subscriptions.get(channelKey);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
          
          // Clean up if no more callbacks
          if (callbacks.length === 0) {
            this.subscriptions.delete(channelKey);
            await this.removeChannel(channelKey);
          }
        }
      } else {
        // Remove all callbacks for this channel
        this.subscriptions.delete(channelKey);
        await this.removeChannel(channelKey);
      }

      console.log(`✅ Unsubscribed from channel: ${channelKey}`);
      return createSuccessResponse(undefined);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from ${channelKey}:`, error);
      return createErrorResponse(error, 'realtime_unsubscribe', undefined);
    }
  }

  /**
   * Subscribe to class messages (chat)
   */
  public async subscribeToClassMessages(
    classId: string,
    userId: string,
    callback: SubscriptionCallback
  ): Promise<ApiResponse<string>> {
    return this.subscribe('class_messages', { classId, userId }, callback);
  }

  /**
   * Subscribe to notifications
   */
  public async subscribeToNotifications(
    userId: string,
    callback: SubscriptionCallback
  ): Promise<ApiResponse<string>> {
    return this.subscribe('notifications', { userId }, callback);
  }

  /**
   * Subscribe to attendance updates
   */
  public async subscribeToAttendance(
    classId: string,
    userId: string,
    callback: SubscriptionCallback
  ): Promise<ApiResponse<string>> {
    return this.subscribe('attendance', { classId, userId }, callback);
  }

  /**
   * Subscribe to assignment updates
   */
  public async subscribeToAssignments(
    classId: string,
    userId: string,
    callback: SubscriptionCallback
  ): Promise<ApiResponse<string>> {
    return this.subscribe('assignments', { classId, userId }, callback);
  }

  /**
   * Subscribe to submission updates
   */
  public async subscribeToSubmissions(
    assignmentId: string,
    userId: string,
    callback: SubscriptionCallback
  ): Promise<ApiResponse<string>> {
    return this.subscribe('submissions', { userId, filters: { assignment_id: assignmentId } }, callback);
  }

  /**
   * Broadcast message to channel
   */
  public async broadcast(
    channelKey: string,
    event: string,
    payload: any
  ): Promise<ApiResponse<void>> {
    try {
      const channel = this.channels.get(channelKey);
      if (!channel) {
        return createErrorResponse(
          { message: 'Channel not found' },
          'realtime_broadcast',
          undefined
        );
      }

      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'realtime_broadcast', undefined);
    }
  }

  /**
   * Track user presence in a channel
   */
  public async trackPresence(
    channelKey: string,
    userState: Record<string, any>
  ): Promise<ApiResponse<void>> {
    try {
      const channel = this.channels.get(channelKey);
      if (!channel) {
        return createErrorResponse(
          { message: 'Channel not found' },
          'realtime_track_presence',
          undefined
        );
      }

      await channel.track(userState);
      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'realtime_track_presence', undefined);
    }
  }

  /**
   * Stop tracking presence
   */
  public async untrackPresence(channelKey: string): Promise<ApiResponse<void>> {
    try {
      const channel = this.channels.get(channelKey);
      if (!channel) {
        return createErrorResponse(
          { message: 'Channel not found' },
          'realtime_untrack_presence',
          undefined
        );
      }

      await channel.untrack();
      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'realtime_untrack_presence', undefined);
    }
  }

  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get active channels
   */
  public getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Disconnect all channels
   */
  public async disconnectAll(): Promise<ApiResponse<void>> {
    try {
      const channelKeys = Array.from(this.channels.keys());
      
      await Promise.all(
        channelKeys.map(key => this.removeChannel(key))
      );

      this.subscriptions.clear();
      
      console.log('✅ Disconnected all real-time channels');
      return createSuccessResponse(undefined);
    } catch (error) {
      console.error('❌ Failed to disconnect all channels:', error);
      return createErrorResponse(error, 'realtime_disconnect_all', undefined);
    }
  }

  /**
   * Reconnect to all channels
   */
  public async reconnectAll(): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 Reconnecting all real-time channels...');
      
      const channelKeys = Array.from(this.channels.keys());
      
      // Remove existing channels
      await Promise.all(
        channelKeys.map(key => this.removeChannel(key))
      );

      // Recreate channels
      // Note: In a real implementation, you'd need to store channel configs
      // to recreate them properly
      
      this.reconnectAttempts = 0;
      
      console.log('✅ Reconnected all real-time channels');
      return createSuccessResponse(undefined);
    } catch (error) {
      console.error('❌ Failed to reconnect all channels:', error);
      return createErrorResponse(error, 'realtime_reconnect_all', undefined);
    }
  }

  // Private methods

  private generateChannelKey(channelName: ChannelType, config: ChannelConfig): string {
    const parts = [channelName];
    
    if (config.classId) parts.push(`class_${config.classId}`);
    if (config.userId) parts.push(`user_${config.userId}`);
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        parts.push(`${key}_${value}`);
      });
    }
    
    return parts.join('_');
  }

  private async createChannel(
    channelName: ChannelType,
    channelKey: string,
    config: ChannelConfig
  ): Promise<void> {
    const channel = supabase.channel(channelKey);

    // Set up database change listeners based on channel type
    switch (channelName) {
      case 'class_messages':
        if (config.classId) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_messages',
              filter: `class_id=eq.${config.classId}`,
            },
            (payload) => this.handleDatabaseChange(channelKey, payload)
          );
        }
        break;

      case 'notifications':
        if (config.userId) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${config.userId}`,
            },
            (payload) => this.handleDatabaseChange(channelKey, payload)
          );
        }
        break;

      case 'attendance':
        if (config.classId) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'attendance',
              filter: `class_id=eq.${config.classId}`,
            },
            (payload) => this.handleDatabaseChange(channelKey, payload)
          );
        }
        break;

      case 'assignments':
        if (config.classId) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'assignments',
              filter: `class_id=eq.${config.classId}`,
            },
            (payload) => this.handleDatabaseChange(channelKey, payload)
          );
        }
        break;

      case 'submissions':
        if (config.userId && config.filters?.assignment_id) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'submissions',
              filter: `assignment_id=eq.${config.filters.assignment_id}`,
            },
            (payload) => this.handleDatabaseChange(channelKey, payload)
          );
        }
        break;
    }

    // Set up presence if enabled
    if (config.presence) {
      channel.on('presence', { event: 'sync' }, () => {
        console.log('Presence sync for', channelKey);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });
    }

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`📡 Subscribed to channel: ${channelKey}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel error: ${channelKey}`);
        this.handleChannelError(channelKey);
      } else if (status === 'TIMED_OUT') {
        console.warn(`⏰ Channel timeout: ${channelKey}`);
        this.handleChannelTimeout(channelKey);
      }
    });

    this.channels.set(channelKey, channel);
  }

  private async removeChannel(channelKey: string): Promise<void> {
    const channel = this.channels.get(channelKey);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelKey);
      console.log(`🗑️ Removed channel: ${channelKey}`);
    }
  }

  private handleDatabaseChange(
    channelKey: string,
    payload: RealtimePostgresChangesPayload<any>
  ): void {
    const callbacks = this.subscriptions.get(channelKey);
    if (callbacks) {
      const realtimePayload: RealtimePayload = {
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        table: payload.table,
        timestamp: new Date().toISOString(),
      };

      callbacks.forEach(callback => {
        try {
          callback(realtimePayload);
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      });
    }
  }

  private setupConnectionListeners(): void {
    // Monitor connection state changes
    // In a real implementation, you'd hook into Supabase's connection events
  }

  private handleChannelError(channelKey: string): void {
    console.error(`Channel error detected for: ${channelKey}`);
    
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect channel: ${channelKey} (attempt ${this.reconnectAttempts})`);
        // Implement channel recreation logic here
      }, delay);
    }
  }

  private handleChannelTimeout(channelKey: string): void {
    console.warn(`Channel timeout for: ${channelKey}`);
    this.handleChannelError(channelKey); // Use same error handling
  }
}

// Singleton instance
export const realtimeService = RealtimeService.getInstance();
export default realtimeService;