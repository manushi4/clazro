/**
 * Communications Service Module
 *
 * This module provides API functions for parent-teacher communications,
 * messaging, and meeting requests.
 */

import { supabase } from '../../supabase/client';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type {
  ParentTeacherCommunication,
  CommunicationPriority,
  CommunicationStatus,
} from '../../../types/supabase-parent.types';

/**
 * Get communications for a parent with optional filtering
 * @param parentId - Parent ID
 * @param filters - Optional filters (studentId, unreadOnly, threadId)
 * @returns Promise with array of communications
 * @throws {APIError} For errors
 */
export async function getCommunications(
  parentId: string,
  filters?: {
    studentId?: string;
    unreadOnly?: boolean;
    threadId?: string;
    archived?: boolean;
  }
): Promise<ParentTeacherCommunication[]> {
  try {
    let query = supabase
      .from('parent_teacher_communications')
      .select('*')
      .eq('parent_id', parentId)
      .order('sent_at', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.unreadOnly) {
      query = query.is('read_at', null);
    }

    if (filters?.threadId) {
      query = query.eq('thread_id', filters.threadId);
    }

    if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    } else {
      // By default, don't show archived messages
      query = query.eq('archived', false);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get a conversation thread
 * @param threadId - Thread ID
 * @returns Promise with array of communications in thread
 * @throws {APIError} For errors
 */
export async function getCommunicationThread(
  threadId: string
): Promise<ParentTeacherCommunication[]> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('parent_teacher_communications')
        .select('*')
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true });
    });

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Send a new message to a teacher
 * @param data - Message data
 * @returns Promise with created communication
 * @throws {APIError} For errors
 */
export async function sendMessage(data: {
  parentId: string;
  teacherId: string;
  studentId: string;
  subject: string;
  message: string;
  priority?: CommunicationPriority;
  communicationType?: string;
  attachments?: Record<string, any>;
}): Promise<ParentTeacherCommunication> {
  try {
    const now = new Date().toISOString();

    // Generate a new thread ID for this conversation
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const messageData: Partial<ParentTeacherCommunication> = {
      parent_id: data.parentId,
      teacher_id: data.teacherId,
      student_id: data.studentId,
      subject: data.subject,
      message: data.message,
      communication_type: data.communicationType || 'general',
      priority: data.priority || 'normal',
      status: 'sent',
      thread_id: threadId,
      is_thread_starter: true,
      sent_by: data.parentId,
      sent_by_role: 'parent',
      recipient_id: data.teacherId,
      recipient_role: 'teacher',
      sent_at: now,
      response_required: true,
      response_received: false,
      meeting_requested: false,
      is_escalated: false,
      is_confidential: false,
      involves_sensitive_info: false,
      archived: false,
      created_at: now,
      updated_at: now,
    };

    if (data.attachments) {
      messageData.attachments = data.attachments;
    }

    const { data: result, error } = await supabase
      .from('parent_teacher_communications')
      .insert(messageData)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!result) throw new Error('Failed to create message');

    return result;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Reply to an existing message
 * @param messageId - Original message ID
 * @param replyText - Reply text
 * @param senderId - ID of the person sending the reply
 * @returns Promise with created reply communication
 * @throws {NotFoundError} If original message not found
 * @throws {APIError} For other errors
 */
export async function replyToMessage(
  messageId: string,
  replyText: string,
  senderId: string
): Promise<ParentTeacherCommunication> {
  try {
    // Get the original message to extract thread info
    const { data: originalMessage, error: fetchError } = await supabase
      .from('parent_teacher_communications')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) throw parseSupabaseError(fetchError);
    if (!originalMessage) throw new NotFoundError('Original message not found');

    const now = new Date().toISOString();

    const replyData: Partial<ParentTeacherCommunication> = {
      parent_id: originalMessage.parent_id,
      teacher_id: originalMessage.teacher_id,
      student_id: originalMessage.student_id,
      subject: `Re: ${originalMessage.subject}`,
      message: replyText,
      communication_type: originalMessage.communication_type,
      priority: originalMessage.priority,
      status: 'sent',
      thread_id: originalMessage.thread_id,
      is_thread_starter: false,
      parent_message_id: messageId,
      sent_by: senderId,
      sent_by_role: 'parent', // Assuming parent is replying
      recipient_id: originalMessage.teacher_id,
      recipient_role: 'teacher',
      sent_at: now,
      response_required: false,
      response_received: false,
      meeting_requested: false,
      is_escalated: false,
      is_confidential: originalMessage.is_confidential,
      involves_sensitive_info: originalMessage.involves_sensitive_info,
      archived: false,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error: insertError } = await supabase
      .from('parent_teacher_communications')
      .insert(replyData)
      .select()
      .single();

    if (insertError) throw parseSupabaseError(insertError);
    if (!result) throw new Error('Failed to create reply');

    // Update original message to mark as replied
    await supabase
      .from('parent_teacher_communications')
      .update({
        replied_at: now,
        status: 'replied',
        updated_at: now,
      })
      .eq('id', messageId);

    return result;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Mark a communication as read
 * @param messageId - Message ID
 * @returns Promise with updated communication
 * @throws {NotFoundError} If message not found
 * @throws {APIError} For other errors
 */
export async function markAsRead(messageId: string): Promise<ParentTeacherCommunication> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('parent_teacher_communications')
      .update({
        read_at: now,
        status: 'read',
        updated_at: now,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Message not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Mark a communication as unread
 * @param messageId - Message ID
 * @returns Promise with updated communication
 * @throws {NotFoundError} If message not found
 * @throws {APIError} For other errors
 */
export async function markAsUnread(messageId: string): Promise<ParentTeacherCommunication> {
  try {
    const { data, error } = await supabase
      .from('parent_teacher_communications')
      .update({
        read_at: null,
        status: 'delivered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Message not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Archive a communication
 * @param messageId - Message ID
 * @returns Promise with updated communication
 * @throws {NotFoundError} If message not found
 * @throws {APIError} For other errors
 */
export async function archiveCommunication(
  messageId: string
): Promise<ParentTeacherCommunication> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('parent_teacher_communications')
      .update({
        archived: true,
        archived_at: now,
        status: 'archived',
        updated_at: now,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Message not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get count of unread messages for a parent
 * @param parentId - Parent ID
 * @returns Promise with unread message count
 * @throws {APIError} For errors
 */
export async function getUnreadCount(parentId: string): Promise<number> {
  try {
    const { count, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('parent_teacher_communications')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId)
        .eq('archived', false)
        .is('read_at', null);
    });

    if (error) throw parseSupabaseError(error);

    return count || 0;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Request a meeting with a teacher
 * @param messageId - Message ID to attach meeting request to
 * @param proposedDates - Array of proposed meeting dates/times
 * @returns Promise with updated communication
 * @throws {NotFoundError} If message not found
 * @throws {APIError} For other errors
 */
export async function requestMeeting(
  messageId: string,
  proposedDates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    timezone?: string;
  }>
): Promise<ParentTeacherCommunication> {
  try {
    const { data, error } = await supabase
      .from('parent_teacher_communications')
      .update({
        meeting_requested: true,
        proposed_meeting_dates: { dates: proposedDates },
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Message not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}
