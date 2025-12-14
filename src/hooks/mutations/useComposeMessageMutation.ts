import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type ComposeMessageInput = {
  subject: string;
  message: string;
  sender_type: 'parent' | 'teacher' | 'school';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'academic' | 'attendance' | 'fees' | 'behavior' | 'event';
  teacher_user_id?: string;
  child_user_id?: string;
  attachment_url?: string;
  reply_to_id?: string;
};

export type ComposeMessageResult = {
  id: string;
  created_at: string;
};

export function useComposeMessageMutation(parentUserId: string) {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (input: ComposeMessageInput): Promise<ComposeMessageResult> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useComposeMessageMutation] Sending message:', input.subject);
      }

      const { data, error } = await supabase
        .from('parent_messages')
        .insert({
          customer_id: customerId,
          parent_user_id: parentUserId,
          teacher_user_id: input.teacher_user_id || null,
          child_user_id: input.child_user_id || null,
          subject_en: input.subject,
          message_en: input.message,
          sender_type: input.sender_type,
          priority: input.priority,
          category: input.category,
          attachment_url: input.attachment_url || null,
          reply_to_id: input.reply_to_id || null,
          is_read: false,
          is_starred: false,
        })
        .select('id, created_at')
        .single();

      if (error) {
        if (__DEV__) console.log('[useComposeMessageMutation] error:', error);
        throw error;
      }

      return data as ComposeMessageResult;
    },
    onSuccess: () => {
      // Invalidate messages queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-detail'] });
    },
  });
}
