import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'PeerChatScreen'>;

type ChatAuthorRole = 'me' | 'student' | 'teacher' | 'ai';

interface ChatMessage {
  id: string;
  chatId: string;
  authorRole: ChatAuthorRole;
  authorName: string;
  createdAtLabel: string;
  text: string;
}

const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  chat_group_algebra_champs: [
    {
      id: 'm1',
      chatId: 'chat_group_algebra_champs',
      authorRole: 'teacher',
      authorName: 'Teacher A',
      createdAtLabel: '5m ago',
      text: 'Welcome to today’s Algebra sprint!',
    },
    {
      id: 'm2',
      chatId: 'chat_group_algebra_champs',
      authorRole: 'me',
      authorName: 'You',
      createdAtLabel: '4m ago',
      text: 'Hi everyone 👋',
    },
    {
      id: 'm3',
      chatId: 'chat_group_algebra_champs',
      authorRole: 'student',
      authorName: 'Riya',
      createdAtLabel: '3m ago',
      text: 'Ready for some linear equations?',
    },
  ],
};

function usePeerChatMock(chatId: string) {
  // TODO: Replace with Supabase-backed chat once API is ready.
  const messages = MOCK_CHAT_MESSAGES[chatId] ?? MOCK_CHAT_MESSAGES.chat_group_algebra_champs;
  return { messages };
}

export default function PeerChatScreen({ route, navigation }: Props) {
  const { chatId } = route.params || { chatId: 'chat_group_algebra_champs' };
  const { messages: initialMessages } = usePeerChatMock(chatId);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');

  useEffect(() => {
    trackScreenView('PeerChatScreen', { chatId });
  }, [chatId]);

  const title = useMemo(() => {
    if (route.params?.groupId) return 'Group chat';
    if (route.params?.peerId) return 'Chat';
    return 'Peer chat';
  }, [route.params]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert('Type a message', 'Message cannot be empty.');
      return;
    }

    const newMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      chatId,
      authorRole: 'me',
      authorName: 'You',
      createdAtLabel: 'Just now',
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    trackAction('send_peer_message', 'PeerChatScreen', { chatId });
  }, [chatId, input]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <T variant="title">←</T>
          </TouchableOpacity>
          <T variant="title" weight="bold" style={styles.headerTitle}>
            {title}
          </T>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.authorRole === 'me';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isMe ? styles.messageMe : styles.messageOther,
                ]}
              >
                <T variant="caption" color="textSecondary" style={styles.messageMeta}>
                  {(isMe ? 'You' : msg.authorName) + ' • ' + msg.createdAtLabel}
                </T>
                <T variant="body">{msg.text}</T>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor={Colors.textTertiary}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <T variant="body" weight="medium" style={{ color: Colors.onPrimary }}>
              Send
            </T>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryContainer,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  messageMeta: {
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    color: Colors.textPrimary,
  },
  sendButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
});
