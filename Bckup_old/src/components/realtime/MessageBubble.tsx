import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, MessageReaction } from '../../services/realtime/ChatService';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onReply?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, reaction: string) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFirstInGroup,
  isLastInGroup,
  onReply,
  onReact,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isOwnMessage = message.sender_id === user?.id;
  const hasReactions = message.reactions && message.reactions.length > 0;

  const formattedTime = useMemo(() => {
    const messageDate = new Date(message.created_at);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  }, [message.created_at]);

  const reactionGroups = useMemo(() => {
    if (!message.reactions) return [];
    
    const groups = message.reactions.reduce((acc, reaction) => {
      const key = reaction.reaction;
      if (!acc[key]) {
        acc[key] = {
          emoji: key,
          count: 0,
          users: [],
          hasUserReacted: false,
        };
      }
      acc[key].count++;
      acc[key].users.push(reaction.user?.full_name || 'Unknown');
      if (reaction.user_id === user?.id) {
        acc[key].hasUserReacted = true;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groups);
  }, [message.reactions, user?.id]);

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleReactionPress = (reaction: string) => {
    onReact?.(message, reaction);
    setShowReactions(false);
  };

  const handleActionPress = (action: string) => {
    setShowActions(false);
    
    switch (action) {
      case 'reply':
        onReply?.(message);
        break;
      case 'edit':
        onEdit?.(message);
        break;
      case 'delete':
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(message) },
          ]
        );
        break;
      case 'react':
        setShowReactions(true);
        break;
    }
  };

  const renderAvatar = () => {
    if (!isFirstInGroup || isOwnMessage) return null;

    return (
      <View style={styles.avatarContainer}>
        {message.sender?.avatar_url ? (
          <Image
            source={{ uri: message.sender.avatar_url }}
            style={[styles.avatar, { borderColor: theme.Outline }]}
          />
        ) : (
          <View style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: theme.primary, borderColor: theme.Outline }
          ]}>
            <Text style={[styles.avatarText, { color: theme.OnPrimary }]}>
              {message.sender?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSenderName = () => {
    if (!isFirstInGroup || isOwnMessage) return null;

    return (
      <Text style={[styles.senderName, { color: theme.OnSurfaceVariant }]}>
        {message.sender?.full_name || 'Unknown User'}
      </Text>
    );
  };

  const renderMessageContent = () => {
    const bubbleStyle = [
      styles.messageBubble,
      {
        backgroundColor: isOwnMessage ? theme.primary : theme.Surface,
        borderTopLeftRadius: !isOwnMessage && isFirstInGroup ? 4 : 18,
        borderTopRightRadius: isOwnMessage && isFirstInGroup ? 4 : 18,
        borderBottomLeftRadius: !isOwnMessage && isLastInGroup ? 4 : 18,
        borderBottomRightRadius: isOwnMessage && isLastInGroup ? 4 : 18,
        marginTop: isFirstInGroup ? 4 : 2,
        marginBottom: isLastInGroup ? 4 : 2,
      },
    ];

    const textStyle = [
      styles.messageText,
      { color: isOwnMessage ? theme.OnPrimary : theme.OnSurface }
    ];

    return (
      <Pressable
        style={bubbleStyle}
        onLongPress={handleLongPress}
        delayLongPress={200}
      >
        {message.parent_message_id && (
          <View style={[
            styles.replyContainer,
            { backgroundColor: isOwnMessage ? theme.OnPrimary + '20' : theme.background }
          ]}>
            <View style={[styles.replyBar, { backgroundColor: theme.primary }]} />
            <Text style={[
              styles.replyText,
              { color: isOwnMessage ? theme.OnPrimary + 'CC' : theme.OnSurfaceVariant }
            ]}>
              Replying to a message...
            </Text>
          </View>
        )}

        {message.message_type === 'text' ? (
          <Text style={textStyle}>{message.content}</Text>
        ) : message.message_type === 'file' ? (
          <TouchableOpacity style={styles.fileContainer}>
            <Icon name="attach-file" size={20} color={textStyle[1].color} />
            <Text style={[textStyle, styles.fileName]}>{message.file_name}</Text>
          </TouchableOpacity>
        ) : message.message_type === 'image' ? (
          <TouchableOpacity>
            <Image
              source={{ uri: message.file_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[textStyle, styles.imageCaption]}>{message.content}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={textStyle}>{message.content || 'Unsupported message type'}</Text>
        )}

        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? theme.OnPrimary + 'AA' : theme.OnSurfaceVariant }
          ]}>
            {formattedTime}
          </Text>
          {message.is_edited && (
            <Text style={[
              styles.editedLabel,
              { color: isOwnMessage ? theme.OnPrimary + '80' : theme.OnSurfaceVariant }
            ]}>
              • edited
            </Text>
          )}
          {isOwnMessage && (
            <Icon
              name={message.is_read ? "done-all" : "done"}
              size={16}
              color={message.is_read ? theme.primary : theme.OnPrimary + '80'}
              style={styles.readIndicator}
            />
          )}
        </View>
      </Pressable>
    );
  };

  const renderReactions = () => {
    if (!hasReactions) return null;

    return (
      <View style={[
        styles.reactionsContainer,
        { marginLeft: isOwnMessage ? 0 : 48 }
      ]}>
        {reactionGroups.map((group, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.reactionBubble,
              {
                backgroundColor: group.hasUserReacted ? theme.primary + '20' : theme.Surface,
                borderColor: group.hasUserReacted ? theme.primary : theme.Outline,
              }
            ]}
            onPress={() => handleReactionPress(group.emoji)}
          >
            <Text style={styles.reactionEmoji}>{group.emoji}</Text>
            <Text style={[
              styles.reactionCount,
              { color: group.hasUserReacted ? theme.primary : theme.OnSurface }
            ]}>
              {group.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReactionPicker = () => {
    if (!showReactions) return null;

    return (
      <View style={[styles.reactionPicker, { backgroundColor: theme.Surface }]}>
        {REACTION_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionOption}
            onPress={() => handleReactionPress(emoji)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActionMenu = () => {
    if (!showActions) return null;

    const actions = [
      { id: 'react', icon: 'add-reaction', label: 'React' },
      { id: 'reply', icon: 'reply', label: 'Reply' },
      ...(isOwnMessage ? [
        { id: 'edit', icon: 'edit', label: 'Edit' },
        { id: 'delete', icon: 'delete', label: 'Delete' },
      ] : []),
    ];

    return (
      <View style={[styles.actionMenu, { backgroundColor: theme.Surface }]}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={() => handleActionPress(action.id)}
          >
            <Icon name={action.icon} size={20} color={theme.OnSurface} />
            <Text style={[styles.actionLabel, { color: theme.OnSurface }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <View style={[
        styles.messageContainer,
        {
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: isLastInGroup ? 8 : 2,
        }
      ]}>
        <View style={[
          styles.messageRow,
          { flexDirection: isOwnMessage ? 'row-reverse' : 'row' }
        ]}>
          {renderAvatar()}
          <View style={[
            styles.messageContent,
            { maxWidth: '80%', marginLeft: isOwnMessage ? 0 : 8, marginRight: isOwnMessage ? 8 : 0 }
          ]}>
            {renderSenderName()}
            {renderMessageContent()}
            {renderReactions()}
          </View>
        </View>
      </View>

      {renderReactionPicker()}
      {renderActionMenu()}
      
      {/* Overlay to close menus */}
      {(showReactions || showActions) && (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setShowReactions(false);
            setShowActions(false);
          }}
        />
      )}
    </>
  );
};

const styles = {
  messageContainer: {
    paddingHorizontal: 16,
  },
  messageRow: {
    alignItems: 'flex-end' as const,
    maxWidth: '100%',
  },
  avatarContainer: {
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  replyContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
    paddingLeft: 8,
    borderRadius: 4,
    paddingVertical: 4,
  },
  replyBar: {
    width: 3,
    height: 20,
    marginRight: 8,
    borderRadius: 2,
  },
  replyText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  fileContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  fileName: {
    marginLeft: 8,
    textDecorationLine: 'underline' as const,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageCaption: {
    fontSize: 14,
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  editedLabel: {
    fontSize: 11,
    marginLeft: 4,
  },
  readIndicator: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 4,
  },
  reactionBubble: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  reactionPicker: {
    position: 'absolute' as const,
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  reactionOption: {
    padding: 8,
    borderRadius: 20,
  },
  actionMenu: {
    position: 'absolute' as const,
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  actionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
};

export default MessageBubble;