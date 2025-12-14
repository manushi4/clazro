/**
 * ChatMessage - Individual chat message component for live class
 * Phase 13: Live Class Chat System
 * Displays individual messages with sender info, timestamps, and reactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import StatusBadge from '../core/StatusBadge';

export type MessageType = 'text' | 'image' | 'file' | 'emoji' | 'poll' | 'announcement';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessageData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'teacher' | 'student' | 'observer';
  content: string;
  type: MessageType;
  timestamp: Date;
  status: MessageStatus;
  isPrivate?: boolean;
  recipientId?: string;
  recipientName?: string;
  reactions?: MessageReaction[];
  attachmentUrl?: string;
  attachmentName?: string;
  replyTo?: string; // ID of message being replied to
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  currentUserId: string;
  isTeacherView?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPrivateMessage?: (userId: string) => void;
  showSenderInfo?: boolean;
  isConsecutive?: boolean; // Same sender as previous message
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
  isTeacherView = false,
  onReaction,
  onReply,
  onDelete,
  onPrivateMessage,
  showSenderInfo = true,
  isConsecutive = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const isOwnMessage = message.senderId === currentUserId;
  const isTeacher = message.senderRole === 'teacher';
  const isPrivateMessage = message.isPrivate;

  const getMessageTime = (): string => {
    return message.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (): string => {
    switch (message.status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '⚠️';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (message.status) {
      case 'read':
        return SemanticColors.Success;
      case 'delivered':
        return LightTheme.Primary;
      case 'sent':
        return LightTheme.OnSurfaceVariant;
      case 'failed':
        return SemanticColors.Error;
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  const renderSenderAvatar = () => {
    if (isConsecutive && !isPrivateMessage) return null;
    
    return (
      <View style={styles.avatarContainer}>
        {message.senderAvatar ? (
          <Text style={styles.avatarEmoji}>{message.senderAvatar}</Text>
        ) : (
          <View style={[
            styles.avatarInitials,
            isTeacher && styles.teacherAvatar
          ]}>
            <Text style={styles.avatarInitialsText}>
              {message.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSenderInfo = () => {
    if (!showSenderInfo || (isConsecutive && !isPrivateMessage)) return null;
    
    return (
      <View style={styles.senderInfo}>
        <Text style={[
          styles.senderName,
          isTeacher && styles.teacherName
        ]}>
          {message.senderName}
        </Text>
        
        {isTeacher && (
          <StatusBadge
            text="Teacher"
            type="primary"
            size="small"
          />
        )}
        
        {isPrivateMessage && (
          <StatusBadge
            text={`Private → ${message.recipientName}`}
            type="warning"
            size="small"
          />
        )}
        
        <Text style={styles.timestamp}>
          {getMessageTime()}
        </Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[
            styles.messageText,
            isOwnMessage && styles.ownMessageText
          ]}>
            {message.content}
          </Text>
        );
      
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: message.attachmentUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[
                styles.messageText,
                styles.imageCaption,
                isOwnMessage && styles.ownMessageText
              ]}>
                {message.content}
              </Text>
            )}
          </View>
        );
      
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Text style={styles.fileIcon}>📎</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{message.attachmentName}</Text>
              <Text style={styles.fileSize}>Tap to download</Text>
            </View>
          </View>
        );
      
      case 'emoji':
        return (
          <Text style={styles.emojiMessage}>
            {message.content}
          </Text>
        );
      
      case 'announcement':
        return (
          <View style={styles.announcementContainer}>
            <Text style={styles.announcementIcon}>📢</Text>
            <Text style={styles.announcementText}>
              {message.content}
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={styles.messageText}>
            {message.content}
          </Text>
        );
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    return (
      <View style={styles.reactionsContainer}>
        {message.reactions.map((reaction, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.reactionButton,
              reaction.userIds.includes(currentUserId) && styles.userReacted
            ]}
            onPress={() => onReaction?.(message.id, reaction.emoji)}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            <Text style={styles.reactionCount}>{reaction.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMessageActions = () => {
    if (!showActions) return null;
    
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReaction?.(message.id, '👍')}
        >
          <Text style={styles.actionIcon}>👍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReply?.(message.id)}
        >
          <Text style={styles.actionIcon}>↩️</Text>
        </TouchableOpacity>
        
        {!isOwnMessage && isTeacherView && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPrivateMessage?.(message.senderId)}
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
        )}
        
        {(isOwnMessage || isTeacherView) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete?.(message.id)}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;
    
    return (
      <View style={styles.statusContainer}>
        <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
          {getStatusIcon()}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isOwnMessage && styles.ownMessageContainer,
        isPrivateMessage && styles.privateMessageContainer,
        message.type === 'announcement' && styles.announcementMessageContainer
      ]}
      onPress={() => setShowActions(!showActions)}
      activeOpacity={0.7}
      testID={`chat-message-${message.id}`}
    >
      <View style={styles.messageRow}>
        {!isOwnMessage && renderSenderAvatar()}
        
        <View style={[
          styles.messageContent,
          isOwnMessage && styles.ownMessageContent
        ]}>
          {renderSenderInfo()}
          
          <View style={[
            styles.messageBubble,
            isOwnMessage && styles.ownMessageBubble,
            isPrivateMessage && styles.privateMessageBubble,
            message.type === 'announcement' && styles.announcementBubble
          ]}>
            {renderMessageContent()}
            {renderReactions()}
          </View>
          
          {renderMessageStatus()}
        </View>
        
        {isOwnMessage && renderSenderAvatar()}
      </View>
      
      {renderMessageActions()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: Spacing.XS,
    paddingHorizontal: Spacing.MD,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  privateMessageContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: SemanticColors.Warning,
    paddingLeft: Spacing.MD,
    marginLeft: Spacing.SM,
  },
  announcementMessageContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderRadius: BorderRadius.MD,
    padding: Spacing.SM,
    marginVertical: Spacing.SM,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  avatarContainer: {
    marginRight: Spacing.SM,
    marginLeft: Spacing.XS,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatar: {
    backgroundColor: LightTheme.secondaryContainer,
  },
  avatarInitialsText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  messageContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS / 2,
    gap: Spacing.XS,
  },
  senderName: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  teacherName: {
    color: LightTheme.Secondary,
  },
  timestamp: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurfaceVariant,
    marginLeft: 'auto',
  },
  messageBubble: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.SM,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: LightTheme.primaryContainer,
    borderBottomRightRadius: BorderRadius.XS,
  },
  privateMessageBubble: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  announcementBubble: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  messageText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  ownMessageText: {
    color: LightTheme.OnPrimaryContainer,
  },
  emojiMessage: {
    fontSize: 32,
    textAlign: 'center',
  },
  imageContainer: {
    minWidth: 200,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  imageCaption: {
    fontSize: Typography.bodySmall.fontSize,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.SM,
    padding: Spacing.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: Spacing.SM,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  fileSize: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  announcementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementIcon: {
    fontSize: 20,
    marginRight: Spacing.SM,
  },
  announcementText: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.XS,
    gap: Spacing.XS / 2,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
  },
  userReacted: {
    backgroundColor: LightTheme.primaryContainer,
    borderColor: LightTheme.Primary,
  },
  reactionEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  reactionCount: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  statusIcon: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.SM,
    gap: Spacing.MD,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LightTheme.SurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 16,
  },
});

export default ChatMessage;