import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'class' | 'private' | 'group' | 'announcement';
  class_id?: string;
  subject_id?: string;
  is_active: boolean;
  max_participants: number;
  allow_file_sharing: boolean;
  allow_reactions: boolean;
  moderation_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
  participant_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  parent_message_id?: string;
  thread_count: number;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  mentions: string[];
  attachments: any[];
  metadata: any;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
  reactions?: MessageReaction[];
  read_by?: MessageReadReceipt[];
  is_read?: boolean;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member' | 'observer';
  can_send_messages: boolean;
  can_send_files: boolean;
  can_moderate: boolean;
  joined_at: string;
  last_seen_at: string;
  is_muted: boolean;
  muted_until?: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
}

export interface SendMessageOptions {
  content?: string;
  message_type?: 'text' | 'file' | 'image' | 'audio' | 'video';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  parent_message_id?: string;
  mentions?: string[];
  attachments?: any[];
  metadata?: any;
}

export interface ChatFilters {
  room_type?: string;
  search_query?: string;
  participant_id?: string;
  limit?: number;
  offset?: number;
}

class ChatService {
  private messageSubscriptions: Map<string, string> = new Map();
  private roomSubscriptions: Map<string, string> = new Map();
  private reactionSubscriptions: Map<string, string> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadOfflineMessages();
    } catch (error) {
      logger.error('Failed to initialize chat service:', error);
    }
  }

  /**
   * Get user's chat rooms
   */
  public async getChatRooms(filters: ChatFilters = {}): Promise<ChatRoom[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_room_participants!inner(
            role,
            joined_at,
            last_seen_at
          )
        `)
        .eq('chat_room_participants.user_id', user.id)
        .eq('is_active', true);

      if (filters.room_type) {
        query = query.eq('type', filters.room_type);
      }

      if (filters.search_query) {
        query = query.ilike('name', `%${filters.search_query}%`);
      }

      query = query
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .order('updated_at', { ascending: false });

      const { data: rooms, error } = await query;

      if (error) throw error;

      // Get unread counts and last messages for each room
      const roomsWithMetadata = await Promise.all(
        rooms.map(async (room) => {
          const [unreadCount, lastMessage, participantCount] = await Promise.all([
            this.getUnreadMessageCount(room.id),
            this.getLastMessage(room.id),
            this.getParticipantCount(room.id),
          ]);

          return {
            ...room,
            unread_count: unreadCount,
            last_message: lastMessage,
            participant_count: participantCount,
          };
        })
      );

      await this.cacheRooms(roomsWithMetadata);
      return roomsWithMetadata;
    } catch (error) {
      logger.error('Failed to get chat rooms:', error);
      return await this.getCachedRooms();
    }
  }

  /**
   * Get messages for a specific room
   */
  public async getRoomMessages(
    roomId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:auth.users!chat_messages_sender_id_fkey(
            id,
            raw_user_meta_data
          ),
          reactions:message_reactions(
            id,
            user_id,
            reaction,
            created_at,
            user:auth.users!message_reactions_user_id_fkey(
              id,
              raw_user_meta_data
            )
          ),
          read_receipts:message_read_receipts(
            id,
            user_id,
            read_at
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      const processedMessages = messages.map(this.processMessage);

      await this.cacheMessages(roomId, processedMessages);
      return processedMessages.reverse(); // Return in ascending order (oldest first)
    } catch (error) {
      logger.error('Failed to get room messages:', error);
      return await this.getCachedMessages(roomId);
    }
  }

  /**
   * Send a message to a room
   */
  public async sendMessage(
    roomId: string,
    options: SendMessageOptions
  ): Promise<ChatMessage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user can send messages in this room
      const canSend = await this.canSendMessage(roomId);
      if (!canSend) {
        throw new Error('You do not have permission to send messages in this room');
      }

      const messageData = {
        room_id: roomId,
        sender_id: user.id,
        content: options.content || '',
        message_type: options.message_type || 'text',
        file_url: options.file_url,
        file_name: options.file_name,
        file_size: options.file_size,
        file_type: options.file_type,
        parent_message_id: options.parent_message_id,
        mentions: options.mentions || [],
        attachments: options.attachments || [],
        metadata: options.metadata || {},
      };

      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select(`
          *,
          sender:auth.users!chat_messages_sender_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      const processedMessage = this.processMessage(message);

      // Cache the message locally
      await this.cacheSentMessage(processedMessage);

      // Clear typing indicator
      this.stopTyping(roomId);

      // Mark message as read for sender
      await this.markMessageAsRead(processedMessage.id);

      return processedMessage;
    } catch (error) {
      logger.error('Failed to send message:', error);
      
      // Cache message for offline sending
      const offlineMessage: ChatMessage = {
        id: `offline_${Date.now()}`,
        room_id: roomId,
        sender_id: user?.id || '',
        content: options.content || '',
        message_type: options.message_type || 'text',
        file_url: options.file_url,
        file_name: options.file_name,
        file_size: options.file_size,
        file_type: options.file_type,
        parent_message_id: options.parent_message_id,
        thread_count: 0,
        is_edited: false,
        is_deleted: false,
        mentions: options.mentions || [],
        attachments: options.attachments || [],
        metadata: { ...options.metadata, offline: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await this.cacheOfflineMessage(offlineMessage);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  public async editMessage(
    messageId: string,
    newContent: string
  ): Promise<ChatMessage> {
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select(`
          *,
          sender:auth.users!chat_messages_sender_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      return this.processMessage(message);
    } catch (error) {
      logger.error('Failed to edit message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  public async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   */
  public async addReaction(messageId: string, reaction: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction,
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   */
  public async removeReaction(messageId: string, reaction: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  public async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_read_receipts')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }
    } catch (error) {
      logger.error('Failed to mark message as read:', error);
    }
  }

  /**
   * Mark all messages in a room as read
   */
  public async markRoomAsRead(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.rpc('mark_room_messages_read', {
        user_uuid: user.id,
        room_uuid: roomId,
      });
    } catch (error) {
      logger.error('Failed to mark room as read:', error);
      throw error;
    }
  }

  /**
   * Start typing indicator
   */
  public async startTyping(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update user presence with typing status
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_typing_in_room: roomId,
          typing_started_at: new Date().toISOString(),
        });

      // Clear any existing typing timer
      const existingTimer = this.typingTimers.get(`${user.id}_${roomId}`);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Auto-stop typing after 3 seconds
      const timer = setTimeout(() => {
        this.stopTyping(roomId);
      }, 3000);

      this.typingTimers.set(`${user.id}_${roomId}`, timer);
    } catch (error) {
      logger.error('Failed to start typing:', error);
    }
  }

  /**
   * Stop typing indicator
   */
  public async stopTyping(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Clear typing timer
      const timerKey = `${user.id}_${roomId}`;
      const timer = this.typingTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        this.typingTimers.delete(timerKey);
      }

      // Update user presence to remove typing status
      await supabase
        .from('user_presence')
        .update({
          is_typing_in_room: null,
          typing_started_at: null,
        })
        .eq('user_id', user.id);
    } catch (error) {
      logger.error('Failed to stop typing:', error);
    }
  }

  /**
   * Subscribe to room messages
   */
  public subscribeToRoom(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
    onMessageUpdate: (message: ChatMessage) => void,
    onMessageDelete: (messageId: string) => void
  ): string {
    const subscriptionId = realtimeConnection.subscribe(
      'chat_messages',
      `room_id=eq.${roomId}`,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              const message = this.processMessage(newRecord);
              onMessage(message);
            }
            break;
          case 'UPDATE':
            if (newRecord) {
              const message = this.processMessage(newRecord);
              onMessageUpdate(message);
            }
            break;
          case 'DELETE':
            if (oldRecord) {
              onMessageDelete(oldRecord.id);
            }
            break;
        }
      },
      (error) => {
        logger.error(`Room subscription error for ${roomId}:`, error);
      }
    );

    this.messageSubscriptions.set(roomId, subscriptionId);
    return subscriptionId;
  }

  /**
   * Subscribe to message reactions
   */
  public subscribeToReactions(
    messageId: string,
    onReactionAdd: (reaction: MessageReaction) => void,
    onReactionRemove: (reactionId: string) => void
  ): string {
    const subscriptionId = realtimeConnection.subscribe(
      'message_reactions',
      `message_id=eq.${messageId}`,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              onReactionAdd(newRecord);
            }
            break;
          case 'DELETE':
            if (oldRecord) {
              onReactionRemove(oldRecord.id);
            }
            break;
        }
      }
    );

    this.reactionSubscriptions.set(messageId, subscriptionId);
    return subscriptionId;
  }

  /**
   * Subscribe to typing indicators
   */
  public subscribeToTyping(
    roomId: string,
    onTypingUpdate: (typingUsers: string[]) => void
  ): string {
    return realtimeConnection.subscribe(
      'user_presence',
      `is_typing_in_room=eq.${roomId}`,
      (payload) => {
        const { eventType, new: newRecord } = payload;
        
        if (eventType === 'UPDATE' && newRecord) {
          // Fetch current typing users for this room
          this.getTypingUsers(roomId).then((users) => {
            onTypingUpdate(users);
          });
        }
      }
    );
  }

  /**
   * Unsubscribe from room updates
   */
  public unsubscribeFromRoom(roomId: string): void {
    const subscriptionId = this.messageSubscriptions.get(roomId);
    if (subscriptionId) {
      realtimeConnection.unsubscribe(subscriptionId);
      this.messageSubscriptions.delete(roomId);
    }
  }

  /**
   * Get room participants
   */
  public async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    try {
      const { data: participants, error } = await supabase
        .from('chat_room_participants')
        .select(`
          *,
          user:auth.users!chat_room_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('room_id', roomId);

      if (error) throw error;

      return participants.map((p) => ({
        ...p,
        user: p.user ? {
          id: p.user.id,
          full_name: p.user.raw_user_meta_data?.full_name,
          avatar_url: p.user.raw_user_meta_data?.avatar_url,
          role: p.user.raw_user_meta_data?.role,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get room participants:', error);
      throw error;
    }
  }

  // Private helper methods

  private processMessage = (message: any): ChatMessage => {
    return {
      ...message,
      sender: message.sender ? {
        id: message.sender.id,
        full_name: message.sender.raw_user_meta_data?.full_name,
        avatar_url: message.sender.raw_user_meta_data?.avatar_url,
        role: message.sender.raw_user_meta_data?.role,
      } : undefined,
      reactions: message.reactions?.map((r: any) => ({
        ...r,
        user: r.user ? {
          full_name: r.user.raw_user_meta_data?.full_name,
          avatar_url: r.user.raw_user_meta_data?.avatar_url,
        } : undefined,
      })) || [],
      read_by: message.read_receipts || [],
    };
  };

  private async canSendMessage(roomId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: participant } = await supabase
        .from('chat_room_participants')
        .select('can_send_messages')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      return participant?.can_send_messages || false;
    } catch (error) {
      logger.error('Failed to check send permissions:', error);
      return false;
    }
  }

  private async getUnreadMessageCount(roomId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data } = await supabase.rpc('get_unread_message_count', {
        user_uuid: user.id,
      });

      const roomCount = data?.find((r: any) => r.room_id === roomId);
      return roomCount?.unread_count || 0;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  private async getLastMessage(roomId: string): Promise<ChatMessage | null> {
    try {
      const { data: message } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:auth.users!chat_messages_sender_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return message ? this.processMessage(message) : null;
    } catch (error) {
      return null;
    }
  }

  private async getParticipantCount(roomId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('chat_room_participants')
        .select('id', { count: 'exact' })
        .eq('room_id', roomId);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTypingUsers(roomId: string): Promise<string[]> {
    try {
      const { data: users } = await supabase
        .from('user_presence')
        .select('user_id')
        .eq('is_typing_in_room', roomId)
        .gt('typing_started_at', new Date(Date.now() - 5000).toISOString());

      return users?.map(u => u.user_id) || [];
    } catch (error) {
      return [];
    }
  }

  // Cache management methods

  private async cacheRooms(rooms: ChatRoom[]): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_chat_rooms', JSON.stringify(rooms));
    } catch (error) {
      logger.error('Failed to cache rooms:', error);
    }
  }

  private async getCachedRooms(): Promise<ChatRoom[]> {
    try {
      const cached = await AsyncStorage.getItem('cached_chat_rooms');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  private async cacheMessages(roomId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const key = `cached_messages_${roomId}`;
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      logger.error('Failed to cache messages:', error);
    }
  }

  private async getCachedMessages(roomId: string): Promise<ChatMessage[]> {
    try {
      const key = `cached_messages_${roomId}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  private async cacheSentMessage(message: ChatMessage): Promise<void> {
    try {
      const key = `cached_messages_${message.room_id}`;
      const cached = await AsyncStorage.getItem(key);
      const messages = cached ? JSON.parse(cached) : [];
      messages.push(message);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      logger.error('Failed to cache sent message:', error);
    }
  }

  private async cacheOfflineMessage(message: ChatMessage): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('offline_messages');
      const messages = cached ? JSON.parse(cached) : [];
      messages.push(message);
      await AsyncStorage.setItem('offline_messages', JSON.stringify(messages));
    } catch (error) {
      logger.error('Failed to cache offline message:', error);
    }
  }

  private async loadOfflineMessages(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('offline_messages');
      if (cached) {
        const messages = JSON.parse(cached);
        
        // Try to send offline messages
        for (const message of messages) {
          try {
            await this.sendMessage(message.room_id, {
              content: message.content,
              message_type: message.message_type,
              file_url: message.file_url,
              file_name: message.file_name,
              file_size: message.file_size,
              file_type: message.file_type,
              parent_message_id: message.parent_message_id,
              mentions: message.mentions,
              attachments: message.attachments,
              metadata: { ...message.metadata, resent: true },
            });
          } catch (error) {
            logger.error('Failed to resend offline message:', error);
          }
        }

        // Clear offline messages after attempting to send
        await AsyncStorage.removeItem('offline_messages');
      }
    } catch (error) {
      logger.error('Failed to load offline messages:', error);
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default ChatService;