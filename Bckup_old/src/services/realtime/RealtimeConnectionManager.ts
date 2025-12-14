import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js';
import { AppState, NetInfo } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../database/supabase';
import { logger } from '../utils/logger';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
  onError?: (error: Error) => void;
}

export interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  enablePresence?: boolean;
}

class RealtimeConnectionManager {
  private client: RealtimeClient;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private connectionListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private heartbeatInterval = 30000; // 30 seconds
  private options: ConnectionOptions;
  private isInBackground = false;
  private networkState = { isConnected: true, type: 'unknown' };

  constructor(options: ConnectionOptions = {}) {
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      enablePresence: true,
      ...options,
    };

    this.client = supabase.realtime;
    this.maxReconnectAttempts = this.options.maxReconnectAttempts!;
    this.reconnectDelay = this.options.reconnectDelay!;
    this.heartbeatInterval = this.options.heartbeatInterval!;

    this.setupEventListeners();
    this.setupAppStateHandling();
    this.setupNetworkHandling();
  }

  /**
   * Initialize the real-time connection
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing realtime connection...');
      await this.connect();
      
      if (this.options.enablePresence) {
        await this.initializePresence();
      }
    } catch (error) {
      logger.error('Failed to initialize realtime connection:', error);
      throw error;
    }
  }

  /**
   * Connect to Supabase realtime
   */
  public async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }

    this.setConnectionState('connecting');

    try {
      // Get auth session for connection
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session found');
      }

      // Connect to realtime
      this.client.setAuth(session.access_token);
      await this.client.connect();

      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      logger.info('Realtime connection established');
    } catch (error) {
      logger.error('Failed to connect to realtime:', error);
      this.setConnectionState('error');
      
      if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from realtime
   */
  public async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    
    // Unsubscribe from all channels
    this.subscriptions.forEach((subscription) => {
      subscription.channel.unsubscribe();
    });
    
    await this.client.disconnect();
    this.setConnectionState('disconnected');
    
    logger.info('Realtime connection disconnected');
  }

  /**
   * Subscribe to database changes
   */
  public subscribe<T = any>(
    table: string,
    filter?: string,
    callback?: (payload: any) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `${table}_${filter || 'all'}_${Date.now()}`;
    
    try {
      let channelName = `public:${table}`;
      if (filter) {
        channelName += `:${filter}`;
      }

      const channel = this.client.channel(channelName);

      // Configure channel subscription
      let subscription = channel.on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          filter: filter
        }, 
        (payload) => {
          logger.debug(`Realtime update received for ${table}:`, payload);
          callback?.(payload);
        }
      );

      // Subscribe to channel
      subscription.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info(`Successfully subscribed to ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(`Failed to subscribe to ${table}`);
          onError?.(new Error(`Subscription failed for ${table}`));
        }
      });

      // Store subscription
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        channel,
        table,
        filter,
        callback: callback || (() => {}),
        onError,
      });

      return subscriptionId;
    } catch (error) {
      logger.error(`Failed to subscribe to ${table}:`, error);
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      logger.info(`Unsubscribed from ${subscription.table}`);
    }
  }

  /**
   * Subscribe to presence updates
   */
  public subscribeToPresence(
    channelName: string,
    callback: (presence: any) => void
  ): string {
    const subscriptionId = `presence_${channelName}_${Date.now()}`;
    
    try {
      const channel = this.client.channel(channelName);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          callback(presenceState);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          callback({ type: 'join', presences: newPresences });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          callback({ type: 'leave', presences: leftPresences });
        });

      channel.subscribe();

      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        channel,
        table: 'presence',
        callback,
      });

      return subscriptionId;
    } catch (error) {
      logger.error('Failed to subscribe to presence:', error);
      throw error;
    }
  }

  /**
   * Track user presence in a channel
   */
  public async trackPresence(
    channelName: string,
    userState: any
  ): Promise<void> {
    try {
      const channel = this.client.channel(channelName);
      await channel.track(userState);
      logger.debug(`Tracking presence in ${channelName}:`, userState);
    } catch (error) {
      logger.error('Failed to track presence:', error);
      throw error;
    }
  }

  /**
   * Stop tracking presence in a channel
   */
  public async untrackPresence(channelName: string): Promise<void> {
    try {
      const channel = this.client.channel(channelName);
      await channel.untrack();
      logger.debug(`Stopped tracking presence in ${channelName}`);
    } catch (error) {
      logger.error('Failed to untrack presence:', error);
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Add connection state listener
   */
  public addConnectionListener(listener: (state: ConnectionState) => void): void {
    this.connectionListeners.add(listener);
  }

  /**
   * Remove connection state listener
   */
  public removeConnectionListener(listener: (state: ConnectionState) => void): void {
    this.connectionListeners.delete(listener);
  }

  /**
   * Get all active subscriptions
   */
  public getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionListeners.forEach((listener) => listener(state));
      logger.debug(`Connection state changed to: ${state}`);
    }
  }

  private setupEventListeners(): void {
    this.client.onOpen(() => {
      logger.debug('Realtime connection opened');
      this.setConnectionState('connected');
    });

    this.client.onClose(() => {
      logger.debug('Realtime connection closed');
      this.setConnectionState('disconnected');
      
      if (this.options.autoReconnect && !this.isInBackground) {
        this.scheduleReconnect();
      }
    });

    this.client.OnError((error) => {
      logger.error('Realtime connection error:', error);
      this.setConnectionState('error');
      
      if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });
  }

  private setupAppStateHandling(): void {
    AppState.addEventListener('change', (nextAppState) => {
      this.isInBackground = nextAppState === 'background';
      
      if (nextAppState === 'active') {
        // App came to foreground
        if (this.connectionState === 'disconnected' && this.networkState.isConnected) {
          this.connect().catch((error) => {
            logger.error('Failed to reconnect on app foreground:', error);
          });
        }
      } else if (nextAppState === 'background') {
        // App went to background - maintain connection for notifications
        this.clearHeartbeatTimer();
      }
    });
  }

  private setupNetworkHandling(): void {
    NetInfo.addEventListener((state) => {
      const wasConnected = this.networkState.isConnected;
      this.networkState = {
        isConnected: state.isConnected ?? false,
        type: state.type,
      };

      if (!wasConnected && this.networkState.isConnected) {
        // Network reconnected
        if (this.connectionState === 'disconnected') {
          this.connect().catch((error) => {
            logger.error('Failed to reconnect on network restore:', error);
          });
        }
      } else if (wasConnected && !this.networkState.isConnected) {
        // Network disconnected
        this.setConnectionState('disconnected');
        this.clearReconnectTimer();
        this.clearHeartbeatTimer();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.setConnectionState('reconnecting');
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      
      if (this.networkState.isConnected) {
        this.connect().catch((error) => {
          logger.error('Reconnect attempt failed:', error);
        });
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeatTimer();
    
    this.heartbeatTimer = setInterval(async () => {
      try {
        if (this.options.enablePresence) {
          await this.updateUserHeartbeat();
        }
      } catch (error) {
        logger.error('Heartbeat failed:', error);
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private async updateUserHeartbeat(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc('update_user_heartbeat', { user_uuid: user.id });
    }
  }

  private async initializePresence(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Initialize user presence record
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            status: 'online',
            last_seen_at: new Date().toISOString(),
            heartbeat_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      logger.error('Failed to initialize presence:', error);
    }
  }
}

// Export singleton instance
export const realtimeConnection = new RealtimeConnectionManager({
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  enablePresence: true,
});

export default RealtimeConnectionManager;