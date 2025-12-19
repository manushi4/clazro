/**
 * AI Tutor Query Hooks
 * Fetches AI tutor conversations and messages from Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type AITutorMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: 'text' | 'image' | 'latex' | 'code';
  metadata: Record<string, any>;
  rating?: number;
  created_at: string;
};

export type AITutorConversation = {
  id: string;
  customer_id: string;
  student_id: string;
  title_en: string | null;
  title_hi: string | null;
  subject_id: string | null;
  status: 'active' | 'archived' | 'deleted';
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

// Query keys
const QUERY_KEYS = {
  conversations: (studentId: string) => ['ai-tutor', 'conversations', studentId],
  messages: (conversationId: string) => ['ai-tutor', 'messages', conversationId],
};

/**
 * Fetch all conversations for a student
 */
export function useAITutorConversationsQuery(studentId: string | undefined) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: QUERY_KEYS.conversations(studentId || ''),
    queryFn: async (): Promise<AITutorConversation[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ai_tutor_conversations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('student_id', studentId)
        .neq('status', 'deleted')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && !!customerId,
    staleTime: 30000,
  });
}

/**
 * Fetch messages for a conversation
 */
export function useAITutorMessagesQuery(conversationId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(conversationId || ''),
    queryFn: async (): Promise<AITutorMessage[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ai_tutor_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
    staleTime: 10000,
  });
}

/**
 * Create a new conversation
 */
export function useCreateConversationMutation() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({
      studentId,
      subjectId,
      titleEn,
      titleHi,
    }: {
      studentId: string;
      subjectId?: string;
      titleEn?: string;
      titleHi?: string;
    }): Promise<AITutorConversation> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ai_tutor_conversations')
        .insert({
          customer_id: customerId,
          student_id: studentId,
          subject_id: subjectId || null,
          title_en: titleEn || 'New Chat',
          title_hi: titleHi || 'नई चैट',
          status: 'active',
          message_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(data.student_id) });
    },
  });
}

/**
 * Send a message and get AI response (simulated for now)
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      contentType = 'text',
      metadata = {},
    }: {
      conversationId: string;
      content: string;
      contentType?: 'text' | 'image' | 'latex' | 'code';
      metadata?: Record<string, any>;
    }): Promise<{ userMessage: AITutorMessage; assistantMessage: AITutorMessage }> => {
      const supabase = getSupabaseClient();

      // Insert user message
      const { data: userMsg, error: userError } = await supabase
        .from('ai_tutor_messages')
        .insert({
          customer_id: customerId,
          conversation_id: conversationId,
          role: 'user',
          content,
          content_type: contentType,
          metadata,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Simulate AI response (in production, call AI API)
      const aiResponse = generateAIResponse(content);

      const { data: assistantMsg, error: assistantError } = await supabase
        .from('ai_tutor_messages')
        .insert({
          customer_id: customerId,
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          content_type: 'text',
          metadata: { model: 'simulated' },
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      // Update conversation metadata
      await supabase
        .from('ai_tutor_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return { userMessage: userMsg, assistantMessage: assistantMsg };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.conversationId) });
    },
  });
}

/**
 * Rate a message
 */
export function useRateMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      rating,
      conversationId,
    }: {
      messageId: string;
      rating: number;
      conversationId: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('ai_tutor_messages')
        .update({ rating })
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, rating };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.conversationId) });
    },
  });
}

/**
 * Archive a conversation
 */
export function useArchiveConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, studentId }: { conversationId: string; studentId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('ai_tutor_conversations')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
      return { conversationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(variables.studentId) });
    },
  });
}

// Simulated AI response generator (replace with actual AI API call)
function generateAIResponse(userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase();

  // Math-related responses
  if (lowerMsg.includes('solve') || lowerMsg.includes('calculate') || lowerMsg.includes('math')) {
    return "I'd be happy to help you solve this! Let me break it down step by step:\n\n1. First, identify what we're solving for\n2. Apply the relevant formula or method\n3. Work through the calculation\n\nCould you share the specific problem you'd like me to help with?";
  }

  // Science-related responses
  if (lowerMsg.includes('physics') || lowerMsg.includes('chemistry') || lowerMsg.includes('biology')) {
    return "Great question about science! Let me explain this concept:\n\nThe key principles to understand are:\n• The fundamental theory behind it\n• How it applies in real-world scenarios\n• Common examples and applications\n\nWould you like me to elaborate on any specific aspect?";
  }

  // Homework help
  if (lowerMsg.includes('homework') || lowerMsg.includes('assignment')) {
    return "I'm here to help with your homework! Remember, the goal is to understand the concepts, not just get answers.\n\nLet's work through this together:\n1. What subject is this for?\n2. What have you tried so far?\n3. Where are you getting stuck?\n\nShare more details and I'll guide you through it!";
  }

  // Default response
  return "Thanks for your question! I'm your AI tutor, here to help you learn and understand concepts better.\n\nI can help you with:\n• Math problems and equations\n• Science concepts and experiments\n• Homework and assignments\n• Exam preparation\n\nWhat would you like to learn about today?";
}
