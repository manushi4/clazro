/**
 * Realtime Service
 * Handles Supabase Realtime subscriptions for live updates
 *
 * Subscribed Tables:
 * - chat_messages: Live chat updates
 * - notifications: Real-time notifications
 * - live_sessions: Session participant updates
 * - attendance: Live attendance marking
 * - assignment_submissions: Real-time submission updates
 */

import { supabase } from '../../../lib/supabaseClient';
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

// ==================== TYPES ====================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionConfig {
  event: RealtimeEvent;
  schema?: string;
  table: string;
  filter?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LiveSessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  attachment_urls?: string[];
  submitted_at: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
}

export interface SubscriptionStatus {
  channelId: string;
  table: string;
  status: 'subscribed' | 'unsubscribed' | 'error';
  subscribedAt?: Date;
}

// ==================== SUBSCRIPTION MANAGEMENT ====================

const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Subscribe to a table with custom callback
 * @param config - Subscription configuration
 * @param callback - Callback function for changes
 * @returns RealtimeChannel
 */
export function subscribeToTable<T>(
  config: SubscriptionConfig,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const channelId = `${config.table}-${Date.now()}`;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: config.event,
        schema: config.schema || 'public',
        table: config.table,
        filter: config.filter,
      },
      callback
    )
    .subscribe((status) => {
      console.log(`Subscription ${channelId} status:`, status);
    });

  activeChannels.set(channelId, channel);
  return channel;
}

/**
 * Unsubscribe from a channel
 * @param channel - Channel to unsubscribe
 * @returns Promise<void>
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);

  // Remove from active channels map
  for (const [id, ch] of activeChannels.entries()) {
    if (ch === channel) {
      activeChannels.delete(id);
      break;
    }
  }
}

/**
 * Unsubscribe from all active channels
 * @returns Promise<void>
 */
export async function unsubscribeAll(): Promise<void> {
  const channels = Array.from(activeChannels.values());

  for (const channel of channels) {
    await supabase.removeChannel(channel);
  }

  activeChannels.clear();
}

/**
 * Get subscription status for all active channels
 * @returns SubscriptionStatus[]
 */
export function getSubscriptionStatus(): SubscriptionStatus[] {
  const statuses: SubscriptionStatus[] = [];

  for (const [id, channel] of activeChannels.entries()) {
    statuses.push({
      channelId: id,
      table: extractTableFromChannel(channel),
      status: channel.state === 'joined' ? 'subscribed' : 'unsubscribed',
      subscribedAt: new Date(),
    });
  }

  return statuses;
}

function extractTableFromChannel(channel: RealtimeChannel): string {
  // Extract table name from channel ID
  return channel.topic.split('-')[0] || 'unknown';
}

// ==================== CHAT SUBSCRIPTIONS ====================

/**
 * Subscribe to chat messages in a room
 * @param roomId - Chat room UUID
 * @param callback - Callback for new messages
 * @returns RealtimeChannel
 */
export function subscribeToRoom(
  roomId: string,
  callback: (message: ChatMessage) => void
): RealtimeChannel {
  return subscribeToTable<ChatMessage>(
    {
      event: 'INSERT',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      if (payload.new) {
        callback(payload.new as ChatMessage);
      }
    }
  );
}

/**
 * Subscribe to all message updates in a room (including edits/deletes)
 * @param roomId - Chat room UUID
 * @param callback - Callback for message changes
 * @returns RealtimeChannel
 */
export function subscribeToRoomUpdates(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<ChatMessage>) => void
): RealtimeChannel {
  return subscribeToTable<ChatMessage>(
    {
      event: '*',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`,
    },
    callback
  );
}

// ==================== NOTIFICATION SUBSCRIPTIONS ====================

/**
 * Subscribe to user notifications
 * @param userId - User UUID
 * @param callback - Callback for new notifications
 * @returns RealtimeChannel
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): RealtimeChannel {
  return subscribeToTable<Notification>(
    {
      event: 'INSERT',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      if (payload.new) {
        callback(payload.new as Notification);
      }
    }
  );
}

/**
 * Subscribe to notification updates (read status changes)
 * @param userId - User UUID
 * @param callback - Callback for notification updates
 * @returns RealtimeChannel
 */
export function subscribeToNotificationUpdates(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Notification>) => void
): RealtimeChannel {
  return subscribeToTable<Notification>(
    {
      event: 'UPDATE',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    callback
  );
}

// ==================== LIVE SESSION SUBSCRIPTIONS ====================

/**
 * Subscribe to session participants
 * @param sessionId - Live session UUID
 * @param callback - Callback for participant changes
 * @returns RealtimeChannel
 */
export function subscribeToSession(
  sessionId: string,
  callback: (payload: RealtimePostgresChangesPayload<LiveSessionParticipant>) => void
): RealtimeChannel {
  return subscribeToTable<LiveSessionParticipant>(
    {
      event: '*',
      table: 'live_session_participants',
      filter: `session_id=eq.${sessionId}`,
    },
    callback
  );
}

/**
 * Subscribe to session status changes
 * @param sessionId - Live session UUID
 * @param callback - Callback for session updates
 * @returns RealtimeChannel
 */
export function subscribeToSessionStatus(
  sessionId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return subscribeToTable(
    {
      event: 'UPDATE',
      table: 'live_sessions',
      filter: `id=eq.${sessionId}`,
    },
    callback
  );
}

// ==================== ATTENDANCE SUBSCRIPTIONS ====================

/**
 * Subscribe to attendance updates for a class
 * @param classId - Class UUID
 * @param date - Date (YYYY-MM-DD)
 * @param callback - Callback for attendance changes
 * @returns RealtimeChannel
 */
export function subscribeToAttendance(
  classId: string,
  date: string,
  callback: (payload: RealtimePostgresChangesPayload<Attendance>) => void
): RealtimeChannel {
  return subscribeToTable<Attendance>(
    {
      event: '*',
      table: 'attendance',
      filter: `class_id=eq.${classId},date=eq.${date}`,
    },
    callback
  );
}

/**
 * Subscribe to attendance for a specific student
 * @param studentId - Student UUID
 * @param callback - Callback for attendance changes
 * @returns RealtimeChannel
 */
export function subscribeToStudentAttendance(
  studentId: string,
  callback: (payload: RealtimePostgresChangesPayload<Attendance>) => void
): RealtimeChannel {
  return subscribeToTable<Attendance>(
    {
      event: '*',
      table: 'attendance',
      filter: `student_id=eq.${studentId}`,
    },
    callback
  );
}

// ==================== ASSIGNMENT SUBMISSION SUBSCRIPTIONS ====================

/**
 * Subscribe to submissions for an assignment
 * @param assignmentId - Assignment UUID
 * @param callback - Callback for new submissions
 * @returns RealtimeChannel
 */
export function subscribeToAssignmentSubmissions(
  assignmentId: string,
  callback: (payload: RealtimePostgresChangesPayload<AssignmentSubmission>) => void
): RealtimeChannel {
  return subscribeToTable<AssignmentSubmission>(
    {
      event: '*',
      table: 'assignment_submissions',
      filter: `assignment_id=eq.${assignmentId}`,
    },
    callback
  );
}

/**
 * Subscribe to student's own submissions
 * @param studentId - Student UUID
 * @param callback - Callback for submission updates (grading)
 * @returns RealtimeChannel
 */
export function subscribeToStudentSubmissions(
  studentId: string,
  callback: (payload: RealtimePostgresChangesPayload<AssignmentSubmission>) => void
): RealtimeChannel {
  return subscribeToTable<AssignmentSubmission>(
    {
      event: 'UPDATE',
      table: 'assignment_submissions',
      filter: `student_id=eq.${studentId}`,
    },
    callback
  );
}

// ==================== PRESENCE TRACKING ====================

/**
 * Track user presence in a channel
 * @param channelName - Channel name
 * @param userId - User UUID
 * @param userMetadata - Optional user metadata
 * @returns RealtimeChannel
 */
export function trackPresence(
  channelName: string,
  userId: string,
  userMetadata?: Record<string, any>
): RealtimeChannel {
  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence synced:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...userMetadata,
        });
      }
    });

  activeChannels.set(channelName, channel);
  return channel;
}

/**
 * Get presence state for a channel
 * @param channel - Realtime channel
 * @returns Record<string, any>
 */
export function getPresenceState(channel: RealtimeChannel): Record<string, any> {
  return channel.presenceState();
}

// ==================== BROADCAST FEATURES ====================

/**
 * Broadcast a message to channel subscribers
 * @param channelName - Channel name
 * @param event - Event name
 * @param payload - Message payload
 * @returns Promise<void>
 */
export async function broadcastMessage(
  channelName: string,
  event: string,
  payload: any
): Promise<void> {
  const channel = activeChannels.get(channelName);

  if (!channel) {
    throw new Error(`Channel ${channelName} not found. Subscribe first.`);
  }

  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });
}

/**
 * Subscribe to broadcast messages
 * @param channelName - Channel name
 * @param event - Event name
 * @param callback - Callback function
 * @returns RealtimeChannel
 */
export function subscribeToBroadcast(
  channelName: string,
  event: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase.channel(channelName);

  channel.on('broadcast', { event }, (payload) => {
    callback(payload);
  }).subscribe();

  activeChannels.set(channelName, channel);
  return channel;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if a channel is currently subscribed
 * @param channelId - Channel ID
 * @returns boolean
 */
export function isChannelActive(channelId: string): boolean {
  return activeChannels.has(channelId);
}

/**
 * Get count of active channels
 * @returns number
 */
export function getActiveChannelCount(): number {
  return activeChannels.size;
}

/**
 * Reconnect all channels
 * @returns Promise<void>
 */
export async function reconnectAllChannels(): Promise<void> {
  const channels = Array.from(activeChannels.values());

  for (const channel of channels) {
    await channel.subscribe();
  }
}
