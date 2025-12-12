import { supabase } from '../database/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen_at: string;
  current_room_id?: string;
  is_typing_in_room?: string;
  typing_started_at?: string;
  session_id?: string;
  device_type?: string;
  app_version?: string;
  heartbeat_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface PresenceUpdate {
  user_id: string;
  status: PresenceStatus;
  last_seen_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PresenceFilters {
  status?: PresenceStatus;
  room_id?: string;
  user_ids?: string[];
  exclude_offline?: boolean;
}

class PresenceService {
  private presenceSubscriptions: Map<string, string> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private currentStatus: PresenceStatus = 'offline';
  private currentRoomId?: string;
  private typingTimeout?: NodeJS.Timeout;
  private isInitialized = false;
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Set initial presence
      await this.setStatus('online');
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Setup app state handling
      this.setupAppStateHandling();
      
      // Setup network state handling
      this.setupNetworkHandling();
      
      this.isInitialized = true;
      logger.info('Presence service initialized');
    } catch (error) {
      logger.error('Failed to initialize presence service:', error);
    }
  }

  /**
   * Set user status
   */
  public async setStatus(status: PresenceStatus): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.currentStatus = status;

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen_at: new Date().toISOString(),
          session_id: this.sessionId,
          device_type: this.getDeviceType(),
          app_version: this.getAppVersion(),
          heartbeat_at: new Date().toISOString(),
        });

      logger.debug(`Presence status updated: ${status}`);
    } catch (error) {
      logger.error('Failed to set presence status:', error);
    }
  }

  /**
   * Get user presence
   */
  public async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data: presence, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:auth.users!user_presence_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) return null;

      return {
        ...presence,
        user: presence.user ? {
          id: presence.user.id,
          full_name: presence.user.raw_user_meta_data?.full_name,
          avatar_url: presence.user.raw_user_meta_data?.avatar_url,
          role: presence.user.raw_user_meta_data?.role,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to get user presence:', error);
      return null;
    }
  }

  /**
   * Get multiple users presence
   */
  public async getUsersPresence(filters: PresenceFilters = {}): Promise<UserPresence[]> {
    try {
      let query = supabase
        .from('user_presence')
        .select(`
          *,
          user:auth.users!user_presence_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.user_ids && filters.user_ids.length > 0) {
        query = query.in('user_id', filters.user_ids);
      }

      if (filters.exclude_offline) {
        query = query.neq('status', 'offline');
      }

      if (filters.room_id) {
        query = query.eq('current_room_id', filters.room_id);
      }

      const { data: presences, error } = await query;

      if (error) throw error;

      return presences.map((presence) => ({
        ...presence,
        user: presence.user ? {
          id: presence.user.id,
          full_name: presence.user.raw_user_meta_data?.full_name,
          avatar_url: presence.user.raw_user_meta_data?.avatar_url,
          role: presence.user.raw_user_meta_data?.role,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get users presence:', error);
      return [];
    }
  }

  /**
   * Get online users count
   */
  public async getOnlineCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('user_presence')
        .select('user_id', { count: 'exact' })
        .eq('status', 'online')
        .gt('heartbeat_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      return count || 0;
    } catch (error) {
      logger.error('Failed to get online count:', error);
      return 0;
    }
  }

  /**
   * Join room (update current room)
   */
  public async joinRoom(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.currentRoomId = roomId;

      await supabase
        .from('user_presence')
        .update({
          current_room_id: roomId,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      logger.debug(`Joined room: ${roomId}`);
    } catch (error) {
      logger.error('Failed to join room:', error);
    }
  }

  /**
   * Leave room
   */
  public async leaveRoom(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.currentRoomId = undefined;

      await supabase
        .from('user_presence')
        .update({
          current_room_id: null,
          is_typing_in_room: null,
          typing_started_at: null,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      logger.debug('Left room');
    } catch (error) {
      logger.error('Failed to leave room:', error);
    }
  }

  /**
   * Start typing in room
   */
  public async startTyping(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_presence')
        .update({
          is_typing_in_room: roomId,
          typing_started_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Clear any existing typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      // Auto-stop typing after 3 seconds of inactivity
      this.typingTimeout = setTimeout(() => {
        this.stopTyping();
      }, 3000);

      logger.debug(`Started typing in room: ${roomId}`);
    } catch (error) {
      logger.error('Failed to start typing:', error);
    }
  }

  /**
   * Stop typing
   */
  public async stopTyping(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = undefined;
      }

      await supabase
        .from('user_presence')
        .update({
          is_typing_in_room: null,
          typing_started_at: null,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      logger.debug('Stopped typing');
    } catch (error) {
      logger.error('Failed to stop typing:', error);
    }
  }

  /**
   * Get typing users in room
   */
  public async getTypingUsers(roomId: string): Promise<UserPresence[]> {
    try {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

      const { data: presences, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:auth.users!user_presence_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('is_typing_in_room', roomId)
        .gt('typing_started_at', fiveSecondsAgo);

      if (error) throw error;

      return presences.map((presence) => ({
        ...presence,
        user: presence.user ? {
          id: presence.user.id,
          full_name: presence.user.raw_user_meta_data?.full_name,
          avatar_url: presence.user.raw_user_meta_data?.avatar_url,
          role: presence.user.raw_user_meta_data?.role,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get typing users:', error);
      return [];
    }
  }

  /**
   * Get room participants presence
   */
  public async getRoomParticipantsPresence(roomId: string): Promise<UserPresence[]> {
    try {
      // Get room participants first
      const { data: participants, error: participantsError } = await supabase
        .from('chat_room_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (participantsError) throw participantsError;

      if (!participants || participants.length === 0) {
        return [];
      }

      const userIds = participants.map(p => p.user_id);

      return await this.getUsersPresence({ user_ids: userIds });
    } catch (error) {
      logger.error('Failed to get room participants presence:', error);
      return [];
    }
  }

  /**
   * Subscribe to presence updates
   */
  public subscribeToPresence(
    filters: PresenceFilters = {},
    onPresenceUpdate: (presence: UserPresence, action: 'update' | 'join' | 'leave') => void
  ): string {
    let filter = '';
    
    if (filters.room_id) {
      filter = `current_room_id=eq.${filters.room_id}`;
    } else if (filters.user_ids && filters.user_ids.length > 0) {
      filter = `user_id=in.(${filters.user_ids.join(',')})`;
    }

    const subscriptionId = realtimeConnection.subscribe(
      'user_presence',
      filter,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              this.getUserPresence(newRecord.user_id).then((presence) => {
                if (presence) {
                  onPresenceUpdate(presence, 'join');
                }
              });
            }
            break;
          case 'UPDATE':
            if (newRecord) {
              this.getUserPresence(newRecord.user_id).then((presence) => {
                if (presence) {
                  const action = this.getPresenceAction(oldRecord, newRecord);
                  onPresenceUpdate(presence, action);
                }
              });
            }
            break;
        }
      },
      (error) => {
        logger.error('Presence subscription error:', error);
      }
    );

    const key = filters.room_id || 'global';
    this.presenceSubscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Subscribe to typing indicators in a room
   */
  public subscribeToTyping(
    roomId: string,
    onTypingUpdate: (typingUsers: UserPresence[]) => void
  ): string {
    return realtimeConnection.subscribe(
      'user_presence',
      `is_typing_in_room=eq.${roomId}`,
      (payload) => {
        const { eventType } = payload;
        if (eventType === 'UPDATE') {
          // Get current typing users
          this.getTypingUsers(roomId).then(onTypingUpdate);
        }
      },
      (error) => {
        logger.error('Typing subscription error:', error);
      }
    );
  }

  /**
   * Unsubscribe from presence updates
   */
  public unsubscribeFromPresence(key: string = 'global'): void {
    const subscriptionId = this.presenceSubscriptions.get(key);
    if (subscriptionId) {
      realtimeConnection.unsubscribe(subscriptionId);
      this.presenceSubscriptions.delete(key);
    }
  }

  /**
   * Get current user status
   */
  public getCurrentStatus(): PresenceStatus {
    return this.currentStatus;
  }

  /**
   * Get current room ID
   */
  public getCurrentRoomId(): string | undefined {
    return this.currentRoomId;
  }

  /**
   * Cleanup presence on logout
   */
  public async cleanup(): Promise<void> {
    try {
      // Set status to offline
      await this.setStatus('offline');
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Clear typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = undefined;
      }
      
      // Unsubscribe from all presence updates
      this.presenceSubscriptions.forEach((subscriptionId) => {
        realtimeConnection.unsubscribe(subscriptionId);
      });
      this.presenceSubscriptions.clear();
      
      this.isInitialized = false;
      logger.info('Presence service cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup presence service:', error);
    }
  }

  // Private methods

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('update_user_heartbeat', { user_uuid: user.id });
        }
      } catch (error) {
        logger.error('Heartbeat failed:', error);
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private setupAppStateHandling(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground
        this.setStatus('online');
        this.startHeartbeat();
      } else if (nextAppState === 'background') {
        // App went to background
        this.setStatus('away');
      } else if (nextAppState === 'inactive') {
        // App became inactive (iOS)
        this.setStatus('away');
      }
    });
  }

  private setupNetworkHandling(): void {
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        // Network reconnected
        if (this.currentStatus === 'offline') {
          this.setStatus('online');
          this.startHeartbeat();
        }
      } else {
        // Network disconnected
        this.currentStatus = 'offline';
        this.stopHeartbeat();
      }
    });
  }

  private getPresenceAction(oldRecord: any, newRecord: any): 'update' | 'join' | 'leave' {
    if (oldRecord?.status === 'offline' && newRecord?.status !== 'offline') {
      return 'join';
    } else if (oldRecord?.status !== 'offline' && newRecord?.status === 'offline') {
      return 'leave';
    } else {
      return 'update';
    }
  }

  private getDeviceType(): string {
    // In a real implementation, you'd detect the actual device type
    return 'mobile';
  }

  private getAppVersion(): string {
    // In a real implementation, you'd get this from the app configuration
    return '1.0.0';
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
export default PresenceService;