/**
 * Real-Time Messaging Service
 * Phase 77: Advanced Real-Time Collaboration & Communication Suite
 * Enhances existing communication with real-time messaging capabilities
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MessageThread {
  id: string;
  title?: string;
  type: 'direct' | 'group' | 'class' | 'assignment' | 'support';
  participants: ThreadParticipant[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  is_archived: boolean;
  is_muted: boolean;
  metadata: Record<string, any>;
}

export interface ThreadParticipant {
  user_id: string;
  user_name: string;
  user_role: 'student' | 'teacher' | 'parent' | 'admin';
  joined_at: string;
  last_read_at?: string;
  is_typing: boolean;
  permissions: MessagePermissions;
}

export interface MessagePermissions {
  can_send_messages: boolean;
  can_send_media: boolean;
  can_delete_own_messages: boolean;
  can_edit_messages: boolean;
  can_add_participants: boolean;
  is_moderator: boolean;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'location' | 'poll' | 'system';
  metadata: MessageMetadata;
  reply_to?: string;
  forwarded_from?: string;
  reactions: MessageReaction[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  expires_at?: string;
}

export interface MessageMetadata {
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  image_dimensions?: { width: number; height: number };
  voice_duration?: number;
  location_coordinates?: { latitude: number; longitude: number };
  poll_options?: PollOption[];
  mention_user_ids?: string[];
  hashtags?: string[];
}

export interface MessageReaction {
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: PollVote[];
}

export interface PollVote {
  user_id: string;
  user_name: string;
  voted_at: string;
}

export interface TypingIndicator {
  thread_id: string;
  user_id: string;
  user_name: string;
  started_at: string;
}

export interface MessageReadReceipt {
  message_id: string;
  user_id: string;
  user_name: string;
  read_at: string;
}

export interface UnreadCount {
  thread_id: string;
  count: number;
  last_message_at: string;
}

class RealTimeMessagingService {
  private isInitialized = false;
  private currentUserId?: string;
  private activeThreads: Map<string, MessageThread> = new Map();
  private messageCache: Map<string, Message[]> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private websocketConnection?: WebSocket;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        this.currentUserId = currentUser.id;
        await this.loadActiveThreads();
        await this.establishWebSocketConnection();
      }
      
      this.isInitialized = true;
      logger.info('Real-time messaging service initialized');
    } catch (error) {
      logger.error('Failed to initialize messaging service:', error);
    }
  }

  /**
   * Create a new message thread
   */
  public async createThread(
    type: MessageThread['type'],
    participantIds: string[],
    title?: string,
    metadata: Record<string, any> = {}
  ): Promise<MessageThread> {
    try {
      if (!this.currentUserId) {
        throw new Error('User must be logged in to create thread');
      }

      const threadData = {
        title,
        type,
        created_by: this.currentUserId,
        is_archived: false,
        is_muted: false,
        metadata,
      };

      const { data: thread, error } = await supabase
        .from('message_threads')
        .insert(threadData)
        .select()
        .single();

      if (error) throw error;

      // Add participants
      const participants = await Promise.all(
        participantIds.map(userId => this.addParticipantToThread(thread.id, userId))
      );

      const fullThread: MessageThread = {
        ...thread,
        participants,
      };

      this.activeThreads.set(thread.id, fullThread);
      this.emit('thread_created', fullThread);

      logger.info(`Message thread created: ${thread.id}`);
      return fullThread;
    } catch (error) {
      logger.error('Failed to create message thread:', error);
      throw error;
    }
  }

  /**
   * Send a message to a thread
   */
  public async sendMessage(
    threadId: string,
    content: string,
    type: Message['type'] = 'text',
    metadata: Partial<MessageMetadata> = {},
    replyToMessageId?: string
  ): Promise<Message> {
    try {
      if (!this.currentUserId) {
        throw new Error('User must be logged in to send messages');
      }

      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('Current user not found');

      // Check permissions
      const hasPermission = await this.checkSendPermission(threadId);
      if (!hasPermission) {
        throw new Error('User does not have permission to send messages in this thread');
      }

      const messageData = {
        thread_id: threadId,
        sender_id: this.currentUserId,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        content,
        type,
        metadata,
        reply_to: replyToMessageId,
        reactions: [],
        status: 'sending' as const,
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update message status to sent
      await this.updateMessageStatus(message.id, 'sent');
      message.status = 'sent';

      // Update thread's last message
      await this.updateThreadLastMessage(threadId, message);

      // Add to cache
      const threadMessages = this.messageCache.get(threadId) || [];
      threadMessages.push(message);
      this.messageCache.set(threadId, threadMessages);

      // Send through WebSocket for real-time delivery
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'new_message',
          data: message,
        }));
      }

      // Stop typing indicator
      await this.stopTyping(threadId);

      this.emit('message_sent', message);
      logger.info(`Message sent: ${message.id}`);
      
      return message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a thread
   */
  public async getThreadMessages(
    threadId: string,
    limit = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      // Check cache first
      if (!before && this.messageCache.has(threadId)) {
        const cached = this.messageCache.get(threadId)!;
        if (cached.length <= limit) {
          return cached;
        }
      }

      let query = supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;
      if (error) throw error;

      const processedMessages = messages || [];

      // Update cache
      if (!before) {
        this.messageCache.set(threadId, processedMessages);
      }

      return processedMessages;
    } catch (error) {
      logger.error('Failed to get thread messages:', error);
      return [];
    }
  }

  /**
   * Get all threads for current user
   */
  public async getUserThreads(): Promise<MessageThread[]> {
    try {
      if (!this.currentUserId) return [];

      const { data: threads, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          participants:thread_participants(*),
          last_message:messages(*)
        `)
        .eq('participants.user_id', this.currentUserId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedThreads = (threads || []).map(thread => ({
        ...thread,
        last_message: thread.last_message?.[0] || undefined,
      }));

      // Update cache
      processedThreads.forEach(thread => {
        this.activeThreads.set(thread.id, thread);
      });

      return processedThreads;
    } catch (error) {
      logger.error('Failed to get user threads:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  public async markMessagesAsRead(threadId: string, messageIds?: string[]): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const readReceiptData = {
        thread_id: threadId,
        user_id: this.currentUserId,
        read_at: new Date().toISOString(),
      };

      if (messageIds?.length) {
        // Mark specific messages as read
        const { error } = await supabase
          .from('message_read_receipts')
          .upsert(
            messageIds.map(messageId => ({
              ...readReceiptData,
              message_id: messageId,
            }))
          );

        if (error) throw error;
      } else {
        // Mark all messages in thread as read
        const { error } = await supabase
          .from('thread_participants')
          .update({ last_read_at: readReceiptData.read_at })
          .eq('thread_id', threadId)
          .eq('user_id', this.currentUserId);

        if (error) throw error;
      }

      // Send read receipt notification
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'messages_read',
          data: { thread_id: threadId, user_id: this.currentUserId, message_ids: messageIds },
        }));
      }

      this.emit('messages_marked_read', { threadId, messageIds });
    } catch (error) {
      logger.error('Failed to mark messages as read:', error);
    }
  }

  /**
   * Start typing indicator
   */
  public async startTyping(threadId: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      // Clear existing typing timeout
      const existingTimeout = this.typingTimeouts.get(threadId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Send typing indicator
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'typing_start',
          data: {
            thread_id: threadId,
            user_id: this.currentUserId,
            user_name: currentUser.name,
            started_at: new Date().toISOString(),
          },
        }));
      }

      // Auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(threadId);
      }, 3000);

      this.typingTimeouts.set(threadId, timeout);
    } catch (error) {
      logger.error('Failed to start typing indicator:', error);
    }
  }

  /**
   * Stop typing indicator
   */
  public async stopTyping(threadId: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      // Clear timeout
      const timeout = this.typingTimeouts.get(threadId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(threadId);
      }

      // Send stop typing indicator
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'typing_stop',
          data: {
            thread_id: threadId,
            user_id: this.currentUserId,
          },
        }));
      }
    } catch (error) {
      logger.error('Failed to stop typing indicator:', error);
    }
  }

  /**
   * Add reaction to message
   */
  public async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      const reactionData = {
        message_id: messageId,
        user_id: this.currentUserId,
        user_name: currentUser.name,
        emoji,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('message_reactions')
        .upsert(reactionData, {
          onConflict: 'message_id,user_id,emoji',
        });

      if (error) throw error;

      // Send through WebSocket
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'reaction_added',
          data: reactionData,
        }));
      }

      this.emit('reaction_added', reactionData);
    } catch (error) {
      logger.error('Failed to add reaction:', error);
    }
  }

  /**
   * Remove reaction from message
   */
  public async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', this.currentUserId)
        .eq('emoji', emoji);

      if (error) throw error;

      // Send through WebSocket
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'reaction_removed',
          data: {
            message_id: messageId,
            user_id: this.currentUserId,
            emoji,
          },
        }));
      }

      this.emit('reaction_removed', { messageId, userId: this.currentUserId, emoji });
    } catch (error) {
      logger.error('Failed to remove reaction:', error);
    }
  }

  /**
   * Delete message
   */
  public async deleteMessage(messageId: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      // Check if user can delete this message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, thread_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== this.currentUserId) {
        const canDelete = await this.checkDeletePermission(message.thread_id);
        if (!canDelete) {
          throw new Error('User does not have permission to delete this message');
        }
      }

      const { error } = await supabase
        .from('messages')
        .update({ 
          deleted_at: new Date().toISOString(),
          content: '[Message deleted]'
        })
        .eq('id', messageId);

      if (error) throw error;

      // Remove from cache
      for (const [threadId, messages] of this.messageCache.entries()) {
        const filteredMessages = messages.filter(m => m.id !== messageId);
        if (filteredMessages.length !== messages.length) {
          this.messageCache.set(threadId, filteredMessages);
          break;
        }
      }

      // Send through WebSocket
      if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
        this.websocketConnection.send(JSON.stringify({
          type: 'message_deleted',
          data: { message_id: messageId, deleted_by: this.currentUserId },
        }));
      }

      this.emit('message_deleted', { messageId });
    } catch (error) {
      logger.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Get unread counts for all threads
   */
  public async getUnreadCounts(): Promise<UnreadCount[]> {
    try {
      if (!this.currentUserId) return [];

      const { data: unreadCounts, error } = await supabase
        .rpc('get_unread_message_counts', { user_id: this.currentUserId });

      if (error) throw error;
      return unreadCounts || [];
    } catch (error) {
      logger.error('Failed to get unread counts:', error);
      return [];
    }
  }

  /**
   * Search messages
   */
  public async searchMessages(
    query: string,
    threadId?: string,
    messageType?: Message['type']
  ): Promise<Message[]> {
    try {
      if (!this.currentUserId) return [];

      let searchQuery = supabase
        .from('messages')
        .select('*')
        .textSearch('content', query)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (threadId) {
        searchQuery = searchQuery.eq('thread_id', threadId);
      }

      if (messageType) {
        searchQuery = searchQuery.eq('type', messageType);
      }

      // Only search in threads where user is a participant
      searchQuery = searchQuery.in(
        'thread_id',
        supabase
          .from('thread_participants')
          .select('thread_id')
          .eq('user_id', this.currentUserId)
      );

      const { data: messages, error } = await searchQuery;
      if (error) throw error;

      return messages || [];
    } catch (error) {
      logger.error('Failed to search messages:', error);
      return [];
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

  private async loadActiveThreads(): Promise<void> {
    try {
      const threads = await this.getUserThreads();
      threads.forEach(thread => {
        this.activeThreads.set(thread.id, thread);
      });
    } catch (error) {
      logger.error('Failed to load active threads:', error);
    }
  }

  private async addParticipantToThread(
    threadId: string,
    userId: string
  ): Promise<ThreadParticipant> {
    // This would fetch user details and add them to the thread
    // For now, returning a mock participant
    return {
      user_id: userId,
      user_name: 'User',
      user_role: 'student',
      joined_at: new Date().toISOString(),
      is_typing: false,
      permissions: {
        can_send_messages: true,
        can_send_media: true,
        can_delete_own_messages: true,
        can_edit_messages: false,
        can_add_participants: false,
        is_moderator: false,
      },
    };
  }

  private async updateThreadLastMessage(threadId: string, message: Message): Promise<void> {
    const { error } = await supabase
      .from('message_threads')
      .update({
        updated_at: new Date().toISOString(),
        last_message_id: message.id,
      })
      .eq('id', threadId);

    if (error) {
      logger.error('Failed to update thread last message:', error);
    }
  }

  private async updateMessageStatus(messageId: string, status: Message['status']): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      logger.error('Failed to update message status:', error);
    }
  }

  private async checkSendPermission(threadId: string): Promise<boolean> {
    try {
      if (!this.currentUserId) return false;

      const { data: participant, error } = await supabase
        .from('thread_participants')
        .select('permissions')
        .eq('thread_id', threadId)
        .eq('user_id', this.currentUserId)
        .single();

      if (error) return false;
      return participant?.permissions?.can_send_messages || false;
    } catch (error) {
      return false;
    }
  }

  private async checkDeletePermission(threadId: string): Promise<boolean> {
    try {
      if (!this.currentUserId) return false;

      const { data: participant, error } = await supabase
        .from('thread_participants')
        .select('permissions')
        .eq('thread_id', threadId)
        .eq('user_id', this.currentUserId)
        .single();

      if (error) return false;
      return participant?.permissions?.is_moderator || false;
    } catch (error) {
      return false;
    }
  }

  private async establishWebSocketConnection(): Promise<void> {
    try {
      // In a real implementation, this would connect to your WebSocket server
      logger.info('Establishing WebSocket connection for real-time messaging');
      
      // Mock WebSocket connection
      this.reconnectAttempts = 0;
      
      // Setup message handling
      this.setupWebSocketHandlers();
      
    } catch (error) {
      logger.error('Failed to establish WebSocket connection:', error);
    }
  }

  private setupWebSocketHandlers(): void {
    // Setup WebSocket event handlers for real-time messaging
    // This would handle incoming messages, typing indicators, etc.
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
export const realTimeMessagingService = new RealTimeMessagingService();
export default RealTimeMessagingService;