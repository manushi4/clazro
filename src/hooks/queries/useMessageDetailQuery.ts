import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type MessageDetail = {
  id: string;
  subject: string;
  message: string;
  sender_type: 'parent' | 'teacher' | 'school';
  is_read: boolean;
  is_starred: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'academic' | 'attendance' | 'fees' | 'behavior' | 'event';
  attachment_url: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  // Related entities
  parent_user_id: string | null;
  teacher_user_id: string | null;
  child_user_id: string | null;
  // Sender info (computed)
  sender_name: string;
  sender_avatar: string | null;
};

export type MessageThread = {
  original: MessageDetail;
  replies: MessageDetail[];
};

export function useMessageDetailQuery(messageId: string) {
  const customerId = useCustomerId();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['message-detail', customerId, messageId, lang],
    queryFn: async (): Promise<MessageThread | null> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useMessageDetailQuery] Fetching:', messageId);
      }

      // Fetch the main message
      const { data: mainMessage, error } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('customer_id', customerId)
        .eq('id', messageId)
        .single();

      if (error) {
        if (__DEV__) console.log('[useMessageDetailQuery] error:', error);
        throw error;
      }

      if (!mainMessage) return null;

      // Fetch replies to this message
      const { data: replies } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('customer_id', customerId)
        .eq('reply_to_id', messageId)
        .order('created_at', { ascending: true });

      const mapMessage = (msg: any): MessageDetail => ({
        id: msg.id,
        subject: getLocalizedField(msg, 'subject', lang) || msg.subject_en || '',
        message: getLocalizedField(msg, 'message', lang) || msg.message_en || '',
        sender_type: msg.sender_type || 'school',
        is_read: msg.is_read ?? false,
        is_starred: msg.is_starred ?? false,
        priority: msg.priority || 'normal',
        category: msg.category || 'general',
        attachment_url: msg.attachment_url,
        reply_to_id: msg.reply_to_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        parent_user_id: msg.parent_user_id,
        teacher_user_id: msg.teacher_user_id,
        child_user_id: msg.child_user_id,
        sender_name: getSenderName(msg.sender_type),
        sender_avatar: null,
      });

      return {
        original: mapMessage(mainMessage),
        replies: (replies || []).map(mapMessage),
      };
    },
    enabled: !!customerId && !!messageId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mark message as read mutation
export function useMarkMessageReadMutation() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('parent_messages')
        .update({ is_read: true })
        .eq('customer_id', customerId)
        .eq('id', messageId);

      if (error) throw error;
      return messageId;
    },
    onSuccess: (messageId) => {
      queryClient.invalidateQueries({ queryKey: ['message-detail', customerId, messageId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// Toggle star mutation
export function useToggleMessageStarMutation() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('parent_messages')
        .update({ is_starred: isStarred })
        .eq('customer_id', customerId)
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, isStarred };
    },
    onSuccess: ({ messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-detail', customerId, messageId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

function getSenderName(senderType: string): string {
  switch (senderType) {
    case 'teacher': return 'Teacher';
    case 'parent': return 'You';
    case 'school': return 'School';
    default: return 'Unknown';
  }
}
