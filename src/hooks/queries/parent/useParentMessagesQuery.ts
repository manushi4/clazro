import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';

export type ParentMessage = {
  id: string;
  subject_en: string;
  subject_hi: string | null;
  message_en: string;
  message_hi: string | null;
  sender_type: 'parent' | 'teacher' | 'school';
  sender_name: string;
  is_read: boolean;
  is_starred: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'academic' | 'attendance' | 'fees' | 'behavior' | 'event';
  child_name: string | null;
  created_at: string;
};

export type MessagesData = {
  messages: ParentMessage[];
  unread_count: number;
  total_count: number;
};

export function useParentMessagesQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ['parent-messages', customerId, parentUserId],
    queryFn: async (): Promise<MessagesData> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useParentMessagesQuery] customerId:', customerId, 'parentUserId:', parentUserId);
      }

      // Fetch messages for the parent
      const { data: messages, error } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('customer_id', customerId)
        .eq('parent_user_id', parentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        if (__DEV__) console.log('[useParentMessagesQuery] error:', error);
        throw error;
      }

      // Transform messages with sender names
      const transformedMessages: ParentMessage[] = (messages || []).map(msg => ({
        id: msg.id,
        subject_en: msg.subject_en,
        subject_hi: msg.subject_hi,
        message_en: msg.message_en,
        message_hi: msg.message_hi,
        sender_type: msg.sender_type,
        sender_name: msg.sender_type === 'school' ? 'School Admin' : msg.sender_type === 'teacher' ? 'Class Teacher' : 'You',
        is_read: msg.is_read,
        is_starred: msg.is_starred,
        priority: msg.priority,
        category: msg.category,
        child_name: null, // Can be joined with users table if needed
        created_at: msg.created_at,
      }));

      const unreadCount = transformedMessages.filter(m => !m.is_read).length;

      return {
        messages: transformedMessages,
        unread_count: unreadCount,
        total_count: transformedMessages.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
