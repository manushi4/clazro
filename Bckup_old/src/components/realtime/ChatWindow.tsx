import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { chatService, ChatRoom, ChatMessage, RoomParticipant } from '../../services/realtime/ChatService';
import { presenceService } from '../../services/realtime/PresenceService';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';
import { logger } from '../../services/utils/logger';

interface ChatWindowProps {
  roomId: string;
  onClose?: () => void;
  showHeader?: boolean;
  maxHeight?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  roomId,
  onClose,
  showHeader = true,
  maxHeight,
}) => {
  const { theme } = useTheme();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const subscriptionRef = useRef<string | undefined>(undefined);
  const typingSubscriptionRef = useRef<string | undefined>(undefined);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Initialize chat room
  useEffect(() => {
    initializeChat();
    
    return () => {
      cleanup();
    };
  }, [roomId]);

  // Animate slide in
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);

      // Get room details
      const rooms = await chatService.getChatRooms({ search_query: roomId });
      const currentRoom = rooms.find(r => r.id === roomId);
      
      if (!currentRoom) {
        throw new Error('Chat room not found');
      }

      setRoom(currentRoom);

      // Load initial messages
      const initialMessages = await chatService.getRoomMessages(roomId, 50);
      setMessages(initialMessages);

      // Get participants
      const roomParticipants = await chatService.getRoomParticipants(roomId);
      setParticipants(roomParticipants);

      // Join room for presence tracking
      await presenceService.joinRoom(roomId);

      // Mark all messages as read
      await chatService.markRoomAsRead(roomId);

      // Subscribe to real-time updates
      subscribeToUpdates();
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to initialize chat:', error);
      setIsLoading(false);
      Alert.alert('error', 'Failed to load chat room');
    }
  };

  const subscribeToUpdates = () => {
    // Subscribe to message updates
    subscriptionRef.current = chatService.subscribeToRoom(
      roomId,
      handleNewMessage,
      handleMessageUpdate,
      handleMessageDelete
    );

    // Subscribe to typing indicators
    typingSubscriptionRef.current = chatService.subscribeToTyping(
      roomId,
      (users) => {
        setTypingUsers(users);
      }
    );
  };

  const cleanup = () => {
    // Leave room
    presenceService.leaveRoom();
    
    // Stop typing
    if (isTyping) {
      chatService.stopTyping(roomId);
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Unsubscribe from updates
    if (subscriptionRef.current) {
      chatService.unsubscribeFromRoom(roomId);
    }
    
    if (typingSubscriptionRef.current) {
      // Note: typing subscription cleanup would be handled by the service
    }
  };

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Mark as read if not from current user
    if (message.sender_id !== 'current_user_id') { // Replace with actual user ID check
      chatService.markMessageAsRead(message.id);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleMessageUpdate = useCallback((message: ChatMessage) => {
    setMessages(prev => 
      prev.map(m => m.id === message.id ? message : m)
    );
  }, []);

  const handleMessageDelete = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.filter(m => m.id !== messageId)
    );
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      chatService.stopTyping(roomId);
    }

    try {
      await chatService.sendMessage(roomId, {
        content: messageText,
        message_type: 'text',
      });
    } catch (error) {
      logger.error('Failed to send message:', error);
      Alert.alert('error', 'Failed to send message');
      setInputText(messageText); // Restore text on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Handle typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      chatService.startTyping(roomId);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      chatService.stopTyping(roomId);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        chatService.stopTyping(roomId);
      }
    }, 3000);
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    try {
      setIsLoadingMore(true);
      const oldestMessage = messages[0];
      const olderMessages = await chatService.getRoomMessages(
        roomId,
        20,
        oldestMessage?.created_at
      );
      
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...olderMessages, ...prev]);
      }
    } catch (error) {
      logger.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isFirstInGroup = index === 0 || 
      messages[index - 1].sender_id !== item.sender_id ||
      new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes

    const isLastInGroup = index === messages.length - 1 ||
      messages[index + 1].sender_id !== item.sender_id ||
      new Date(messages[index + 1].created_at).getTime() - new Date(item.created_at).getTime() > 300000; // 5 minutes

    return (
      <MessageBubble
        message={item}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        onReply={(message) => {
          // Handle reply functionality
        }}
        onReact={(message, reaction) => {
          chatService.addReaction(message.id, reaction);
        }}
      />
    );
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={[styles.header, { backgroundColor: theme.Surface, borderBottomColor: theme.Outline }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-back" size={24} color={theme.OnSurface} />
          </TouchableOpacity>
          <View style={styles.roomInfo}>
            <Text style={[styles.roomName, { color: theme.OnSurface }]}>
              {room?.name}
            </Text>
            <View style={styles.participantInfo}>
              <PresenceIndicator userIds={participants.map(p => p.user_id)} />
              <Text style={[styles.participantCount, { color: theme.OnSurfaceVariant }]}>
                {participants.length} participants
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="videocam" size={20} color={theme.OnSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="phone" size={20} color={theme.OnSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="more-vert" size={20} color={theme.OnSurface} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLoadMoreButton = () => {
    if (!hasMoreMessages) return null;

    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { backgroundColor: theme.Surface }]}
        onPress={loadMoreMessages}
        disabled={isLoadingMore}
      >
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Text style={[styles.loadMoreText, { color: theme.primary }]}>
            Load more messages
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={[styles.typingContainer, { backgroundColor: theme.background }]}>
        <TypingIndicator users={typingUsers} />
      </View>
    );
  };

  const renderInputArea = () => (
    <View style={[styles.inputContainer, { backgroundColor: theme.Surface, borderTopColor: theme.Outline }]}>
      <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.Outline }]}>
        <TextInput
          style={[styles.textInput, { color: theme.OnSurface }]}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type a message..."
          placeholderTextColor={theme.OnSurfaceVariant}
          multiline
          maxLength={1000}
        />
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="attach-file" size={20} color={theme.OnSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? theme.primary : theme.SurfaceVariant,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={theme.OnPrimary} />
            ) : (
              <Icon name="send" size={20} color={theme.OnPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.OnSurfaceVariant }]}>
          Loading chat...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          maxHeight: maxHeight,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
        }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <KeyboardAvoidingView 
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.messagesContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.1}
              ListHeaderComponent={renderLoadMoreButton}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesList}
              inverted={false}
            />
          </View>
          {renderTypingIndicator()}
          {renderInputArea()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 2,
  },
  participantInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  participantCount: {
    fontSize: 12,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row' as const,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 8,
  },
  loadMoreButton: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  attachButton: {
    padding: 4,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export default ChatWindow;