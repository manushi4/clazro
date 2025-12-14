/**
 * ClassChat - Premium Minimal Design
 * Purpose: Real-time chat during live classes
 * Used in: StudentNavigator (ClassesStack) - from NewEnhancedLiveClass, NewVirtualClassroom
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'ClassChat'>;

interface ChatMessage {
  id: string;
  text: string;
  sender_name: string;
  sender_id: string;
  is_teacher: boolean;
  created_at: string;
  isCurrentUser: boolean;
}

export default function ClassChat({ route, navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const classId = route.params?.classId;
  const [inputText, setInputText] = useState('');

  React.useEffect(() => {
    trackScreenView('ClassChat', { classId });
  }, [classId]);

  // Fetch chat messages
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['class-chat', classId],
    queryFn: async () => {
      if (!classId) throw new Error('No class ID');

      const { data, error } = await supabase
        .from('class_messages')
        .select('*, students(name), teachers(name)')
        .eq('class_id', classId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      return (data || []).map((msg) => ({
        id: msg.id,
        text: msg.message || '',
        sender_name: msg.is_teacher
          ? (msg.teachers as any)?.name || 'Teacher'
          : (msg.students as any)?.name || 'Student',
        sender_id: msg.sender_id,
        is_teacher: msg.is_teacher || false,
        created_at: msg.created_at,
        isCurrentUser: msg.sender_id === user?.id,
      })) as ChatMessage[];
    },
    enabled: !!classId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!classId || !user?.id) throw new Error('Missing class or user ID');

      const { data, error } = await supabase
        .from('class_messages')
        .insert({
          class_id: classId,
          sender_id: user.id,
          message: messageText,
          is_teacher: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-chat', classId] });
      setInputText('');
    },
  });

  const handleSend = useCallback(() => {
    if (!inputText.trim() || sendMessageMutation.isPending) return;

    trackAction('send_chat_message', 'ClassChat', {
      classId,
      messageLength: inputText.length,
    });

    sendMessageMutation.mutate(inputText.trim());
  }, [inputText, classId, sendMessageMutation]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
      ]}
    >
      {!item.isCurrentUser && (
        <View style={styles.senderInfo}>
          <T variant="caption" weight="semiBold" style={styles.senderName}>
            {item.sender_name}
            {item.is_teacher && ' 👨‍🏫'}
          </T>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          item.is_teacher && styles.teacherBubble,
        ]}
      >
        <T
          variant="body"
          style={item.isCurrentUser ? styles.currentUserText : styles.otherUserText}
        >
          {item.text}
        </T>
        <T
          variant="caption"
          style={[
            styles.messageTime,
            item.isCurrentUser && styles.currentUserTime,
          ]}
        >
          {formatTime(item.created_at)}
        </T>
      </View>
    </View>
  );

  return (
    <BaseScreen scrollable={false} loading={isLoading} error={error ? 'Failed to load chat' : null}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <T variant="h2">💬</T>
                <T variant="body" style={styles.emptyText}>
                  No messages yet
                </T>
                <T variant="caption" style={styles.emptySubtext}>
                  Start the conversation!
                </T>
              </View>
            ) : null
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            editable={!sendMessageMutation.isPending}
            accessibilityLabel="Message input"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sendMessageMutation.isPending) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <T variant="body" style={styles.sendButtonText}>
              {sendMessageMutation.isPending ? '⏳' : '📤'}
            </T>
          </TouchableOpacity>
        </View>

        {/* Class Rules */}
        <View style={styles.rulesContainer}>
          <T variant="caption" style={styles.rulesText}>
            💡 Keep messages respectful and on-topic
          </T>
        </View>
      </KeyboardAvoidingView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,

  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,

  },
  emptyText: {
    color: '#6B7280',
  },
  emptySubtext: {
    color: '#9CA3AF',
  },
  messageContainer: {
    maxWidth: '80%',

  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderInfo: {
    paddingHorizontal: 4,
  },
  senderName: {
    color: '#6B7280',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,

    minWidth: 80,
  },
  currentUserBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  teacherBubble: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  currentUserTime: {
    color: '#E0E7FF',
  },
  inputContainer: {
    flexDirection: 'row',

    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    fontFamily: 'System',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 20,
  },
  rulesContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rulesText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});
