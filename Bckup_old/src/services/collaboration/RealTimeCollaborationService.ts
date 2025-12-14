/**
 * Real-Time Collaboration Service
 * Phase 77: Advanced Real-Time Collaboration & Communication Suite
 * Manushi Coaching Platform
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CollaborationSession {
  id: string;
  title: string;
  type: 'assignment' | 'study_group' | 'tutoring' | 'live_class' | 'document_review';
  creator_id: string;
  creator_name: string;
  creator_role: 'student' | 'teacher' | 'parent' | 'admin';
  participants: CollaborationParticipant[];
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  expires_at?: string;
  settings: CollaborationSettings;
  metadata: Record<string, any>;
}

export interface CollaborationParticipant {
  user_id: string;
  user_name: string;
  user_role: 'student' | 'teacher' | 'parent' | 'admin';
  joined_at: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  permissions: ParticipantPermissions;
  cursor_position?: { x: number; y: number };
  selection_range?: { start: number; end: number };
}

export interface ParticipantPermissions {
  can_edit: boolean;
  can_comment: boolean;
  can_share_screen: boolean;
  can_use_voice: boolean;
  can_use_video: boolean;
  can_invite_others: boolean;
  is_moderator: boolean;
}

export interface CollaborationSettings {
  allow_anonymous: boolean;
  require_approval: boolean;
  max_participants: number;
  enable_chat: boolean;
  enable_voice: boolean;
  enable_video: boolean;
  enable_screen_share: boolean;
  record_session: boolean;
  auto_save_interval: number;
}

export interface RealTimeMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  type: 'text' | 'file' | 'image' | 'voice' | 'system' | 'reaction';
  content: string;
  metadata: Record<string, any>;
  timestamp: string;
  edited_at?: string;
  reply_to?: string;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  user_id: string;
  user_name: string;
  emoji: string;
  timestamp: string;
}

export interface DocumentChange {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  length: number;
  content: string;
  timestamp: string;
  applied: boolean;
}

export interface ScreenShareSession {
  id: string;
  collaboration_session_id: string;
  presenter_id: string;
  presenter_name: string;
  status: 'starting' | 'active' | 'paused' | 'stopped';
  quality: 'low' | 'medium' | 'high';
  audio_enabled: boolean;
  started_at: string;
  ended_at?: string;
}

class RealTimeCollaborationService {
  private isInitialized = false;
  private activeSessionId?: string;
  private websocketConnection?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('Real-time collaboration service initialized');
    } catch (error) {
      logger.error('Failed to initialize collaboration service:', error);
    }
  }

  /**
   * Create a new collaboration session
   */
  public async createSession(
    title: string,
    type: CollaborationSession['type'],
    settings: Partial<CollaborationSettings> = {}
  ): Promise<CollaborationSession> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to create collaboration session');
      }

      const defaultSettings: CollaborationSettings = {
        allow_anonymous: false,
        require_approval: type === 'live_class',
        max_participants: type === 'live_class' ? 100 : 10,
        enable_chat: true,
        enable_voice: type !== 'document_review',
        enable_video: type === 'live_class' || type === 'tutoring',
        enable_screen_share: type === 'live_class' || type === 'tutoring',
        record_session: type === 'live_class',
        auto_save_interval: 30000, // 30 seconds
        ...settings,
      };

      const sessionData = {
        title,
        type,
        creator_id: currentUser.id,
        creator_name: currentUser.name,
        creator_role: currentUser.role,
        status: 'active' as const,
        settings: defaultSettings,
        metadata: {},
      };

      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      // Add creator as first participant with full permissions
      const creatorParticipant: Omit<CollaborationParticipant, 'joined_at'> = {
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_role: currentUser.role,
        status: 'active',
        permissions: {
          can_edit: true,
          can_comment: true,
          can_share_screen: true,
          can_use_voice: true,
          can_use_video: true,
          can_invite_others: true,
          is_moderator: true,
        },
      };

      await this.addParticipant(session.id, creatorParticipant);

      logger.info(`Collaboration session created: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create collaboration session:', error);
      throw error;
    }
  }

  /**
   * Join an existing collaboration session
   */
  public async joinSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to join collaboration session');
      }

      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (session.status !== 'active') {
        throw new Error('Collaboration session is not active');
      }

      // Check if user is already a participant
      const existingParticipant = session.participants?.find(
        (p: CollaborationParticipant) => p.user_id === currentUser.id
      );

      if (!existingParticipant) {
        // Add as new participant
        const newParticipant: Omit<CollaborationParticipant, 'joined_at'> = {
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          status: 'active',
          permissions: this.getDefaultPermissions(currentUser.role, session.type),
        };

        await this.addParticipant(sessionId, newParticipant);
      } else {
        // Update existing participant status
        await this.updateParticipantStatus(sessionId, currentUser.id, 'active');
      }

      this.activeSessionId = sessionId;
      await this.establishWebSocketConnection(sessionId);

      logger.info(`Joined collaboration session: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('Failed to join collaboration session:', error);
      throw error;
    }
  }

  /**
   * Leave collaboration session
   */
  public async leaveSession(sessionId?: string): Promise<void> {
    try {
      const targetSessionId = sessionId || this.activeSessionId;
      if (!targetSessionId) return;

      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      await this.updateParticipantStatus(targetSessionId, currentUser.id, 'offline');
      
      if (this.websocketConnection) {
        this.websocketConnection.close();
        this.websocketConnection = undefined;
      }

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
      }

      this.activeSessionId = undefined;
      logger.info(`Left collaboration session: ${targetSessionId}`);
    } catch (error) {
      logger.error('Failed to leave collaboration session:', error);
    }
  }

  /**
   * Send real-time message
   */
  public async sendMessage(
    sessionId: string,
    content: string,
    type: RealTimeMessage['type'] = 'text',
    metadata: Record<string, any> = {}
  ): Promise<RealTimeMessage> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to send messages');
      }

      const messageData = {
        session_id: sessionId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        type,
        content,
        metadata,
        timestamp: new Date().toISOString(),
        reactions: [],
      };

      const { data: message, error } = await supabase
        .from('collaboration_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Send through WebSocket if connected
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'message',
          data: message,
        }));
      }

      return message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Apply document change
   */
  public async applyDocumentChange(
    sessionId: string,
    change: Omit<DocumentChange, 'id' | 'session_id' | 'user_id' | 'user_name' | 'timestamp' | 'applied'>
  ): Promise<DocumentChange> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to make document changes');
      }

      const changeData = {
        session_id: sessionId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        ...change,
        timestamp: new Date().toISOString(),
        applied: false,
      };

      const { data: documentChange, error } = await supabase
        .from('document_changes')
        .insert(changeData)
        .select()
        .single();

      if (error) throw error;

      // Send through WebSocket for real-time collaboration
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'document_change',
          data: documentChange,
        }));
      }

      return documentChange;
    } catch (error) {
      logger.error('Failed to apply document change:', error);
      throw error;
    }
  }

  /**
   * Start screen sharing
   */
  public async startScreenShare(sessionId: string, audioEnabled = true): Promise<ScreenShareSession> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to share screen');
      }

      // Check permissions
      const hasPermission = await this.checkPermission(sessionId, currentUser.id, 'can_share_screen');
      if (!hasPermission) {
        throw new Error('User does not have screen sharing permission');
      }

      const screenShareData = {
        collaboration_session_id: sessionId,
        presenter_id: currentUser.id,
        presenter_name: currentUser.name,
        status: 'starting' as const,
        quality: 'medium' as const,
        audio_enabled: audioEnabled,
        started_at: new Date().toISOString(),
      };

      const { data: screenShare, error } = await supabase
        .from('screen_share_sessions')
        .insert(screenShareData)
        .select()
        .single();

      if (error) throw error;

      // Notify all participants
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'screen_share_started',
          data: screenShare,
        }));
      }

      logger.info(`Screen sharing started: ${screenShare.id}`);
      return screenShare;
    } catch (error) {
      logger.error('Failed to start screen sharing:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  public async stopScreenShare(screenShareId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('screen_share_sessions')
        .update({
          status: 'stopped',
          ended_at: new Date().toISOString(),
        })
        .eq('id', screenShareId);

      if (error) throw error;

      // Notify all participants
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'screen_share_stopped',
          data: { screen_share_id: screenShareId },
        }));
      }

      logger.info(`Screen sharing stopped: ${screenShareId}`);
    } catch (error) {
      logger.error('Failed to stop screen sharing:', error);
      throw error;
    }
  }

  /**
   * Get session messages
   */
  public async getSessionMessages(
    sessionId: string,
    limit = 50,
    before?: string
  ): Promise<RealTimeMessage[]> {
    try {
      let query = supabase
        .from('collaboration_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('timestamp', before);
      }

      const { data: messages, error } = await query;
      if (error) throw error;

      return messages || [];
    } catch (error) {
      logger.error('Failed to get session messages:', error);
      return [];
    }
  }

  /**
   * Get active sessions for user
   */
  public async getActiveSessions(userId?: string): Promise<CollaborationSession[]> {
    try {
      const currentUser = userId ? { id: userId } : await this.getCurrentUser();
      if (!currentUser) return [];

      const { data: sessions, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('status', 'active')
        .or(`creator_id.eq.${currentUser.id},participants.cs.{"user_id":"${currentUser.id}"}`);

      if (error) throw error;
      return sessions || [];
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Update participant cursor position
   */
  public async updateCursorPosition(sessionId: string, x: number, y: number): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'cursor_update',
          data: {
            session_id: sessionId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            position: { x, y },
            timestamp: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      logger.error('Failed to update cursor position:', error);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private helper methods

  private async getCurrentUser(): Promise<{ id: string; name: string; role: string } | null> {
    try {
      const userDataString = await AsyncStorage.getItem('user_data');
      if (!userDataString) return null;

      const userData = JSON.parse(userDataString);
      return {
        id: userData.id || `user_${Date.now()}`,
        name: `${userData.firstName || 'User'} ${userData.lastName || ''}`.trim(),
        role: userData.role || 'student',
      };
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  }

  private async addParticipant(
    sessionId: string,
    participant: Omit<CollaborationParticipant, 'joined_at'>
  ): Promise<void> {
    const participantWithTimestamp = {
      ...participant,
      joined_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('collaboration_participants')
      .insert({
        session_id: sessionId,
        ...participantWithTimestamp,
      });

    if (error) throw error;
  }

  private async updateParticipantStatus(
    sessionId: string,
    userId: string,
    status: CollaborationParticipant['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('collaboration_participants')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private getDefaultPermissions(
    userRole: string,
    sessionType: CollaborationSession['type']
  ): ParticipantPermissions {
    const isTeacher = userRole === 'teacher';
    const isAdmin = userRole === 'admin';
    const isLiveClass = sessionType === 'live_class';

    return {
      can_edit: !isLiveClass || isTeacher || isAdmin,
      can_comment: true,
      can_share_screen: isTeacher || isAdmin,
      can_use_voice: true,
      can_use_video: true,
      can_invite_others: isTeacher || isAdmin,
      is_moderator: isTeacher || isAdmin,
    };
  }

  private async checkPermission(
    sessionId: string,
    userId: string,
    permission: keyof ParticipantPermissions
  ): Promise<boolean> {
    try {
      const { data: participant, error } = await supabase
        .from('collaboration_participants')
        .select('permissions')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return participant?.permissions?.[permission] || false;
    } catch (error) {
      return false;
    }
  }

  private async establishWebSocketConnection(sessionId: string): Promise<void> {
    try {
      // In a real implementation, this would connect to your WebSocket server
      // For now, we'll simulate the connection
      logger.info(`Establishing WebSocket connection for session: ${sessionId}`);
      
      // Mock WebSocket connection establishment
      this.reconnectAttempts = 0;
      
      // Start heartbeat
      this.heartbeatInterval = setInterval(() => {
        if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
          this.websocketConnection.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // 30 seconds

    } catch (error) {
      logger.error('Failed to establish WebSocket connection:', error);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const realTimeCollaborationService = new RealTimeCollaborationService();
export default RealTimeCollaborationService;