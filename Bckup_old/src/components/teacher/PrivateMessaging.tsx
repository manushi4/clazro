/**
 * PrivateMessaging - Private messaging component for teacher-student communication
 * Phase 13: Live Class Chat System
 * Handles private conversations between participants
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import StatusBadge from '../core/StatusBadge';
import ChatWindow from './ChatWindow';
import { ChatMessageData } from './ChatMessage';

interface PrivateConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'teacher' | 'student' | 'observer';
  lastMessage?: ChatMessageData;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface PrivateMessagingProps {
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserRole: 'teacher' | 'student' | 'observer';
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'teacher' | 'student' | 'observer';
    isOnline: boolean;
  }>;
  classId: string;
}

const PrivateMessaging: React.FC<PrivateMessagingProps> = ({
  visible,
  onClose,
  currentUserId,
  currentUserRole,
  participants,
  classId,
}) => {
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);

  const isTeacher = currentUserRole === 'teacher';

  // Initialize with sample conversations for demonstration
  useEffect(() => {
    if (visible) {
      const sampleConversations: PrivateConversation[] = [
        {
          id: 'conv1',
          participantId: 'student1',
          participantName: 'Sarah Chen',
          participantAvatar: '👩‍🎓',
          participantRole: 'student',
          lastMessage: {
            id: 'pm1',
            senderId: 'student1',
            senderName: 'Sarah Chen',
            senderAvatar: '👩‍🎓',
            senderRole: 'student',
            content: 'Could you help me understand the last concept?',
            type: 'text',
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            status: 'read',
            isPrivate: true,
            recipientId: currentUserId,
          },
          unreadCount: 1,
          isActive: true,
          createdAt: new Date(Date.now() - 900000),
        },
        {
          id: 'conv2',
          participantId: 'student2',
          participantName: 'Alex Johnson',
          participantAvatar: '👨‍🎓',
          participantRole: 'student',
          lastMessage: {
            id: 'pm2',
            senderId: currentUserId,
            senderName: 'Prof. Smith',
            senderAvatar: '👨‍🏫',
            senderRole: 'teacher',
            content: 'Great question! Let me explain...',
            type: 'text',
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            status: 'read',
            isPrivate: true,
            recipientId: 'student2',
          },
          unreadCount: 0,
          isActive: true,
          createdAt: new Date(Date.now() - 1200000),
        },
      ];

      // Only show conversations if user is a teacher or if they have existing conversations
      if (isTeacher || sampleConversations.some(conv => 
        conv.participantId === currentUserId || 
        conv.lastMessage?.recipientId === currentUserId
      )) {
        setConversations(sampleConversations);
      }
    }
  }, [visible, currentUserId, isTeacher]);

  const getAvailableParticipants = () => {
    if (isTeacher) {
      // Teachers can message all participants
      return participants.filter(p => p.id !== currentUserId);
    } else {
      // Students can only message teachers
      return participants.filter(p => p.role === 'teacher' && p.id !== currentUserId);
    }
  };

  const startNewConversation = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Check if conversation already exists
    const existingConversation = conversations.find(conv => conv.participantId === participantId);
    if (existingConversation) {
      setActiveConversation(existingConversation.id);
      setShowConversationList(false);
      return;
    }

    // Create new conversation
    const newConversation: PrivateConversation = {
      id: 'conv_' + Date.now(),
      participantId,
      participantName: participant.name,
      participantAvatar: participant.avatar,
      participantRole: participant.role,
      unreadCount: 0,
      isActive: true,
      createdAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
    setShowConversationList(false);
  };

  const handleOpenConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    setShowConversationList(false);
    
    // Mark conversation as read
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  const handleCloseConversation = () => {
    setActiveConversation(null);
    setShowConversationList(true);
  };

  const handleSendMessage = (message: ChatMessageData) => {
    const conversation = conversations.find(conv => conv.id === activeConversation);
    if (!conversation) return;

    // Update conversation with new message
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversation
        ? { ...conv, lastMessage: message, unreadCount: 0 }
        : conv
    ));
  };

  const handleDeleteConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete your conversation with ${conversation.participantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            if (activeConversation === conversationId) {
              handleCloseConversation();
            }
          },
        },
      ]
    );
  };

  const getConversationTime = (conversation: PrivateConversation): string => {
    const timestamp = conversation.lastMessage?.timestamp || conversation.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderConversationItem = ({ item }: { item: PrivateConversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleOpenConversation(item.id)}
    >
      <View style={styles.conversationAvatar}>
        {item.participantAvatar ? (
          <Text style={styles.conversationAvatarEmoji}>{item.participantAvatar}</Text>
        ) : (
          <View style={styles.conversationAvatarInitials}>
            <Text style={styles.conversationAvatarText}>
              {item.participantName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.participantName}
          </Text>
          
          {item.participantRole === 'teacher' && (
            <StatusBadge
              text="Teacher"
              type="primary"
              size="small"
            />
          )}
          
          <Text style={styles.conversationTime}>
            {getConversationTime(item)}
          </Text>
        </View>

        <Text style={[
          styles.lastMessage,
          item.unreadCount > 0 && styles.unreadMessage
        ]} numberOfLines={2}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteConversation(item.id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderNewConversationItem = ({ item }: { 
    item: { id: string; name: string; avatar?: string; role: string; isOnline: boolean } 
  }) => (
    <TouchableOpacity
      style={styles.newConversationItem}
      onPress={() => startNewConversation(item.id)}
    >
      <View style={styles.participantAvatar}>
        {item.avatar ? (
          <Text style={styles.participantAvatarEmoji}>{item.avatar}</Text>
        ) : (
          <View style={styles.participantAvatarInitials}>
            <Text style={styles.participantAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{item.name}</Text>
        {item.role === 'teacher' && (
          <StatusBadge
            text="Teacher"
            type="primary"
            size="small"
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderConversationsList = () => (
    <View style={styles.conversationsContainer}>
      <View style={styles.conversationsHeader}>
        <Text style={styles.conversationsTitle}>Private Messages</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDescription}>
            Start a private conversation with a participant
          </Text>
        </View>
      )}

      <View style={styles.newConversationSection}>
        <Text style={styles.newConversationTitle}>Start New Conversation</Text>
        <FlatList
          data={getAvailableParticipants().filter(p => 
            !conversations.some(conv => conv.participantId === p.id)
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderNewConversationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.newConversationsList}
          ListEmptyComponent={
            <Text style={styles.noParticipantsText}>
              All participants already have active conversations
            </Text>
          }
        />
      </View>
    </View>
  );

  const renderActiveConversation = () => {
    const conversation = conversations.find(conv => conv.id === activeConversation);
    if (!conversation) return null;

    const conversationParticipants = [
      {
        id: currentUserId,
        name: 'You',
        role: currentUserRole,
        isOnline: true,
      },
      {
        id: conversation.participantId,
        name: conversation.participantName,
        avatar: conversation.participantAvatar,
        role: conversation.participantRole,
        isOnline: true,
      }
    ];

    return (
      <View style={styles.activeConversationContainer}>
        <View style={styles.activeConversationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCloseConversation}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.activeConversationInfo}>
            <Text style={styles.activeConversationName}>
              {conversation.participantName}
            </Text>
            {conversation.participantRole === 'teacher' && (
              <StatusBadge
                text="Teacher"
                type="primary"
                size="small"
              />
            )}
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ChatWindow
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          participants={conversationParticipants}
          classId={classId}
          onSendMessage={handleSendMessage}
          maxHeight={400}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {showConversationList ? renderConversationsList() : renderActiveConversation()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Surface,
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  conversationsTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
  },
  closeButton: {
    padding: Spacing.SM,
  },
  closeButtonText: {
    fontSize: 20,
    color: LightTheme.OnSurfaceVariant,
  },
  conversationsList: {
    padding: Spacing.MD,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: Spacing.MD,
  },
  conversationAvatarEmoji: {
    fontSize: 32,
  },
  conversationAvatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationAvatarText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: SemanticColors.Error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: Typography.bodySmall.fontSize - 2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS,
    gap: Spacing.XS,
  },
  conversationName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  conversationTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  lastMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  unreadMessage: {
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  deleteButton: {
    padding: Spacing.SM,
    marginLeft: Spacing.SM,
  },
  deleteIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  emptyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  emptyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  newConversationSection: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    padding: Spacing.MD,
  },
  newConversationTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  newConversationsList: {
    maxHeight: 200,
  },
  newConversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  participantAvatar: {
    position: 'relative',
    marginRight: Spacing.MD,
  },
  participantAvatarEmoji: {
    fontSize: 24,
  },
  participantAvatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.SurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SemanticColors.Success,
    borderWidth: 2,
    borderColor: LightTheme.Surface,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  participantName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  noParticipantsText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: Spacing.LG,
  },
  activeConversationContainer: {
    flex: 1,
  },
  activeConversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  backButton: {
    padding: Spacing.SM,
    marginRight: Spacing.SM,
  },
  backButtonText: {
    fontSize: 24,
    color: LightTheme.OnSurface,
  },
  activeConversationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  activeConversationName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
});

export default PrivateMessaging;