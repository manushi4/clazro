/**
 * ChatWindow - Complete chat interface for live classes
 * Phase 13: Live Class Chat System
 * Combines message history, input controls, and chat management
 */

import React, { useState, useEffect, useRef } from 'react';
import type { MessageStatus } from '../../types/database';

import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';

const { height } = Dimensions.get('window');

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'teacher' | 'student' | 'observer';
  isOnline: boolean;
}

interface ChatWindowProps {
  currentUserId: string;
  currentUserRole: 'teacher' | 'student' | 'observer';
  participants: ChatParticipant[];
  classId: string;
  onSendMessage?: (message: ChatMessageData) => void;
  onMessageReaction?: (messageId: string, emoji: string, userId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isReadOnly?: boolean;
  maxHeight?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  currentUserRole,
  participants,
  classId,
  onSendMessage,
  onMessageReaction,
  onDeleteMessage,
  isReadOnly = false,
  maxHeight = height * 0.7,
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const isTeacher = currentUserRole === 'teacher';
  const currentUser = participants.find(p => p.id === currentUserId);

  // Initialize with sample messages for demonstration
  useEffect(() => {
    const sampleMessages: ChatMessageData[] = [
      {
        id: 'm1',
        senderId: 'teacher',
        senderName: 'Prof. Smith',
        senderAvatar: '👨‍🏫',
        senderRole: 'teacher',
        content: 'Welcome everyone! Today we\'ll be covering React Native components.',
        type: 'announcement',
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        status: 'read',
      },
      {
        id: 'm2',
        senderId: 'student1',
        senderName: 'Sarah Chen',
        senderAvatar: '👩‍🎓',
        senderRole: 'student',
        content: 'Thank you! I\'m excited to learn.',
        type: 'text',
        timestamp: new Date(Date.now() - 580000),
        status: 'read',
        reactions: [{ emoji: '👍', count: 3, userIds: ['teacher', 'student2', 'student3'] }],
      },
      {
        id: 'm3',
        senderId: 'student2',
        senderName: 'Alex Johnson',
        senderAvatar: '👨‍🎓',
        senderRole: 'student',
        content: 'Could you share the slides?',
        type: 'text',
        timestamp: new Date(Date.now() - 560000),
        status: 'read',
      },
      {
        id: 'm4',
        senderId: 'teacher',
        senderName: 'Prof. Smith',
        senderAvatar: '👨‍🏫',
        senderRole: 'teacher',
        content: 'I\'ll share them after this section.',
        type: 'text',
        timestamp: new Date(Date.now() - 540000),
        status: 'read',
        replyTo: 'm3',
      },
      {
        id: 'm5',
        senderId: 'student3',
        senderName: 'Emily Davis',
        senderAvatar: '👩‍🎓',
        senderRole: 'student',
        content: '👍',
        type: 'emoji',
        timestamp: new Date(Date.now() - 520000),
        status: 'read',
      },
      {
        id: 'm6',
        senderId: 'teacher',
        senderName: 'Prof. Smith',
        senderAvatar: '👨‍🏫',
        senderRole: 'teacher',
        content: 'Quick question - can everyone see the screen share?',
        type: 'text',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        status: 'read',
        reactions: [
          { emoji: '✅', count: 4, userIds: ['student1', 'student2', 'student3', 'student4'] },
          { emoji: '👍', count: 2, userIds: ['student1', 'student2'] }
        ],
      },
    ];
    setMessages(sampleMessages);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateMessageId = (): string => {
    return 'm' + Date.now() + Math.random().toString(36).substr(2, 9);
  };

  const handleSendMessage = (content: string, type: 'text' | 'emoji') => {
    if (!currentUser) return;

    const newMessage: ChatMessageData = {
      id: generateMessageId(),
      senderId: currentUserId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      content,
      type,
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyingTo?.id,
    };

    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    scrollToBottom();

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'delivered' as MessageStatus } : msg
      ));
    }, 2000);

    onSendMessage?.(newMessage);
  };

  const handleSendPrivateMessage = (recipientId: string, content: string) => {
    if (!currentUser) return;

    const recipient = participants.find(p => p.id === recipientId);
    if (!recipient) return;

    const privateMessage: ChatMessageData = {
      id: generateMessageId(),
      senderId: currentUserId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      content,
      type: 'text',
      timestamp: new Date(),
      status: 'sending',
      isPrivate: true,
      recipientId,
      recipientName: recipient.name,
    };

    setMessages(prev => [...prev, privateMessage]);
    scrollToBottom();

    // Simulate status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === privateMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
      ));
    }, 1000);

    onSendMessage?.(privateMessage);
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        // Toggle user's reaction
        const hasUserReacted = existingReaction.userIds.includes(currentUserId);
        
        if (hasUserReacted) {
          // Remove user's reaction
          const updatedReaction = {
            ...existingReaction,
            count: existingReaction.count - 1,
            userIds: existingReaction.userIds.filter(id => id !== currentUserId),
          };
          
          return {
            ...msg,
            reactions: updatedReaction.count > 0
              ? reactions.map(r => r.emoji === emoji ? updatedReaction : r)
              : reactions.filter(r => r.emoji !== emoji),
          };
        } else {
          // Add user's reaction
          return {
            ...msg,
            reactions: reactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUserId] }
                : r
            ),
          };
        }
      } else {
        // Add new reaction
        return {
          ...msg,
          reactions: [...reactions, { emoji, count: 1, userIds: [currentUserId] }],
        };
      }
    }));

    onMessageReaction?.(messageId, emoji, currentUserId);
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo({
        id: messageId,
        senderName: message.senderName,
        content: message.content,
      });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const canDelete = message.senderId === currentUserId || isTeacher;
    
    if (!canDelete) {
      Alert.alert('Permission Denied', 'You can only delete your own messages.');
      return;
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
            onDeleteMessage?.(messageId);
          },
        },
      ]
    );
  };

  const handlePrivateMessage = (userId: string) => {
    // Private messaging is handled through ChatInput modal
    // This could trigger additional actions like opening a private chat window
  };

  const isConsecutiveMessage = (currentMsg: ChatMessageData, index: number): boolean => {
    if (index === 0) return false;
    const prevMsg = messages[index - 1];
    
    return (
      prevMsg.senderId === currentMsg.senderId &&
      prevMsg.type !== 'announcement' &&
      currentMsg.type !== 'announcement' &&
      !prevMsg.isPrivate &&
      !currentMsg.isPrivate &&
      (currentMsg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 300000 // 5 minutes
    );
  };

  const getPrivateMessageRecipients = () => {
    if (!isTeacher) {
      // Students can only send private messages to teachers
      return participants.filter(p => p.role === 'teacher' && p.id !== currentUserId);
    } else {
      // Teachers can send private messages to all participants
      return participants.filter(p => p.id !== currentUserId);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessageData; index: number }) => (
    <ChatMessage
      message={item}
      currentUserId={currentUserId}
      isTeacherView={isTeacher}
      onReaction={handleMessageReaction}
      onReply={handleReply}
      onDelete={handleDeleteMessage}
      onPrivateMessage={handlePrivateMessage}
      showSenderInfo={true}
      isConsecutive={isConsecutiveMessage(item, index)}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { maxHeight }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        onContentSizeChange={scrollToBottom}
        contentContainerStyle={styles.messagesContent}
        removeClippedSubviews={false} // Keep for better message rendering
      />

      {!isReadOnly && (
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendPrivateMessage={handleSendPrivateMessage}
          placeholder={isTeacher ? "Send a message to the class..." : "Ask a question or share thoughts..."}
          isTeacherMode={isTeacher}
          canSendFiles={true}
          canSendPrivateMessages={true}
          privateRecipients={getPrivateMessageRecipients()}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          disabled={false}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Surface,
  },
  messagesList: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  messagesContent: {
    paddingVertical: Spacing.SM,
    paddingBottom: Spacing.LG,
  },
});

export default ChatWindow;