/**
 * ChatInput - Input component for live class chat system
 * Phase 13: Live Class Chat System
 * Handles text input, emoji selection, file attachments, and private messaging
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../core/CoachingButton';

const { width } = Dimensions.get('window');

export interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'emoji') => void;
  onSendPrivateMessage?: (recipientId: string, content: string) => void;
  onSendFile?: (fileUri: string, fileName: string) => void;
  onSendImage?: (imageUri: string) => void;
  placeholder?: string;
  isTeacherMode?: boolean;
  canSendFiles?: boolean;
  canSendPrivateMessages?: boolean;
  privateRecipients?: Array<{ id: string; name: string; avatar?: string }>;
  replyingTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

// Common emoji categories for quick access
const EMOJI_CATEGORIES = {
  reactions: ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉'],
  faces: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉'],
  gestures: ['👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉'],
  objects: ['📚', '📝', '📊', '💡', '⭐', '🔥', '💯', '✅', '❌', '⚠️', '🎯', '🚀'],
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendPrivateMessage,
  onSendFile,
  onSendImage,
  placeholder = "Type your message...",
  isTeacherMode = false,
  canSendFiles = true,
  canSendPrivateMessages = false,
  privateRecipients = [],
  replyingTo = null,
  onCancelReply,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [privateMessage, setPrivateMessage] = useState('');
  const [showFileOptions, setShowFileOptions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Check if message is just emojis
    const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(trimmedMessage) && trimmedMessage.length <= 10;
    
    onSendMessage(trimmedMessage, isEmojiOnly ? 'emoji' : 'text');
    setMessage('');
    inputRef.current?.focus();
  };

  const handleEmojiSelect = (emoji: string) => {
    if (message.length === 0) {
      // Send emoji directly if input is empty
      onSendMessage(emoji, 'emoji');
    } else {
      // Add emoji to current message
      setMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleSendPrivateMessage = () => {
    if (!selectedRecipient || !privateMessage.trim()) return;
    
    onSendPrivateMessage?.(selectedRecipient, privateMessage.trim());
    setPrivateMessage('');
    setSelectedRecipient(null);
    setShowPrivateModal(false);
  };

  const handleFileSelect = () => {
    setShowFileOptions(false);
    // TODO: Implement file picker
    Alert.alert(
      'File Selection',
      'File picker will be implemented in a future update',
      [{ text: 'OK' }]
    );
  };

  const handleImageSelect = () => {
    setShowFileOptions(false);
    // TODO: Implement image picker
    Alert.alert(
      'Image Selection',
      'Image picker will be implemented in a future update',
      [{ text: 'OK' }]
    );
  };

  const renderReplyingTo = () => {
    if (!replyingTo) return null;

    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyContent}>
          <Text style={styles.replyLabel}>Replying to {replyingTo.senderName}:</Text>
          <Text style={styles.replyText} numberOfLines={1}>
            {replyingTo.content}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.cancelReplyButton}
          onPress={onCancelReply}
        >
          <Text style={styles.cancelReplyIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmojiPicker = () => (
    <Modal
      visible={showEmojiPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEmojiPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiModal}>
          <View style={styles.emojiHeader}>
            <Text style={styles.emojiTitle}>Quick Reactions</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEmojiPicker(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.emojiContent} showsVerticalScrollIndicator={false}>
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <View key={category} style={styles.emojiCategory}>
                <Text style={styles.emojiCategoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.emojiGrid}>
                  {emojis.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.emojiButton}
                      onPress={() => handleEmojiSelect(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPrivateMessageModal = () => (
    <Modal
      visible={showPrivateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPrivateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.privateModal}>
          <View style={styles.privateModalHeader}>
            <Text style={styles.privateModalTitle}>Send Private Message</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPrivateModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.recipientLabel}>Select Recipient:</Text>
          <ScrollView style={styles.recipientList} showsVerticalScrollIndicator={false}>
            {privateRecipients.map((recipient) => (
              <TouchableOpacity
                key={recipient.id}
                style={[
                  styles.recipientItem,
                  selectedRecipient === recipient.id && styles.selectedRecipient
                ]}
                onPress={() => setSelectedRecipient(recipient.id)}
              >
                <View style={styles.recipientAvatar}>
                  {recipient.avatar ? (
                    <Text style={styles.recipientAvatarEmoji}>{recipient.avatar}</Text>
                  ) : (
                    <Text style={styles.recipientAvatarText}>
                      {recipient.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.recipientName}>{recipient.name}</Text>
                {selectedRecipient === recipient.id && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.privateMessageInput}
            value={privateMessage}
            onChangeText={setPrivateMessage}
            placeholder="Type your private message..."
            placeholderTextColor={LightTheme.OnSurfaceVariant}
            multiline
            maxLength={500}
          />

          <View style={styles.privateModalActions}>
            <CoachingButton
              title="Cancel"
              variant="text"
              size="small"
              onPress={() => setShowPrivateModal(false)}
              style={styles.cancelButton}
            />
            <CoachingButton
              title="Send Private"
              variant="primary"
              size="small"
              onPress={handleSendPrivateMessage}
              disabled={!selectedRecipient || !privateMessage.trim()}
              style={styles.sendPrivateButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFileOptionsModal = () => (
    <Modal
      visible={showFileOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFileOptions(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFileOptions(false)}
      >
        <View style={styles.fileOptionsModal}>
          <TouchableOpacity
            style={styles.fileOptionButton}
            onPress={handleImageSelect}
          >
            <Text style={styles.fileOptionIcon}>📷</Text>
            <Text style={styles.fileOptionText}>Send Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fileOptionButton}
            onPress={handleFileSelect}
          >
            <Text style={styles.fileOptionIcon}>📎</Text>
            <Text style={styles.fileOptionText}>Attach File</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderReplyingTo()}
      
      <View style={[styles.inputContainer, disabled && styles.disabledContainer]}>
        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowEmojiPicker(true)}
            disabled={disabled}
            testID="emoji-button"
          >
            <Text style={styles.actionIcon}>😊</Text>
          </TouchableOpacity>

          {canSendFiles && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFileOptions(true)}
              disabled={disabled}
              testID="file-button"
            >
              <Text style={styles.actionIcon}>📎</Text>
            </TouchableOpacity>
          )}

          {canSendPrivateMessages && privateRecipients.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPrivateModal(true)}
              disabled={disabled}
              testID="private-message-button"
            >
              <Text style={styles.actionIcon}>💬</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message Input Row */}
        <View style={styles.messageRow}>
          <TextInput
            ref={inputRef}
            style={[styles.messageInput, disabled && styles.disabledInput]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={LightTheme.OnSurfaceVariant}
            multiline
            maxLength={1000}
            editable={!disabled}
            testID="message-input"
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || disabled) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || disabled}
            testID="send-button"
          >
            <Text style={[
              styles.sendButtonText,
              (!message.trim() || disabled) && styles.sendButtonTextDisabled
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        {isTeacherMode && (
          <View style={styles.teacherHint}>
            <Text style={styles.teacherHintText}>
              💡 Tip: Use @student to mention, or send private messages
            </Text>
          </View>
        )}
      </View>

      {renderEmojiPicker()}
      {renderPrivateMessageModal()}
      {renderFileOptionsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  replyText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 2,
  },
  cancelReplyButton: {
    padding: Spacing.XS,
  },
  cancelReplyIcon: {
    fontSize: 16,
    color: LightTheme.OnSurfaceVariant,
  },
  inputContainer: {
    backgroundColor: LightTheme.Surface,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.SM,
    gap: Spacing.SM,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LightTheme.SurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.SM,
  },
  messageInput: {
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: LightTheme.SurfaceVariant,
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: LightTheme.SurfaceVariant,
  },
  sendButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  sendButtonTextDisabled: {
    color: LightTheme.OnSurfaceVariant,
  },
  teacherHint: {
    marginTop: Spacing.SM,
    paddingTop: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  teacherHintText: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiModal: {
    backgroundColor: LightTheme.Surface,
    borderTopLeftRadius: BorderRadius.LG,
    borderTopRightRadius: BorderRadius.LG,
    maxHeight: 400,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  emojiTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  modalCloseButton: {
    padding: Spacing.XS,
  },
  modalCloseText: {
    fontSize: 18,
    color: LightTheme.OnSurfaceVariant,
  },
  emojiContent: {
    padding: Spacing.MD,
  },
  emojiCategory: {
    marginBottom: Spacing.LG,
  },
  emojiCategoryTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textTransform: 'capitalize',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.SM,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  emojiText: {
    fontSize: 24,
  },
  privateModal: {
    backgroundColor: LightTheme.Surface,
    borderTopLeftRadius: BorderRadius.LG,
    borderTopRightRadius: BorderRadius.LG,
    maxHeight: '80%',
  },
  privateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  privateModalTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  recipientLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    paddingHorizontal: Spacing.MD,
    paddingTop: Spacing.MD,
    paddingBottom: Spacing.SM,
  },
  recipientList: {
    maxHeight: 200,
    paddingHorizontal: Spacing.MD,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  selectedRecipient: {
    backgroundColor: LightTheme.primaryContainer,
  },
  recipientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.SurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.SM,
  },
  recipientAvatarEmoji: {
    fontSize: 18,
  },
  recipientAvatarText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  recipientName: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  selectedIcon: {
    fontSize: 16,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  privateMessageInput: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    margin: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  privateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  cancelButton: {
    flex: 1,
    marginRight: Spacing.SM,
  },
  sendPrivateButton: {
    flex: 1,
    marginLeft: Spacing.SM,
  },
  fileOptionsModal: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    margin: Spacing.LG,
    padding: Spacing.MD,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fileOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
  },
  fileOptionIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
  },
  fileOptionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
});

export default ChatInput;