import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface PeerMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: 'Beginner' | 'Intermediate' | 'Expert' | 'Mentor';
  message: string;
  timestamp: Date;
  isEdited: boolean;
  attachments?: {
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
  }[];
  reactions: {
    type: 'like' | 'helpful' | 'thanks' | 'confused';
    count: number;
    userReacted: boolean;
  }[];
  replies: PeerMessage[];
  isHighlighted?: boolean;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  topic: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  maxParticipants: number;
  scheduledTime?: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  description: string;
  tags: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isPrivate: boolean;
}

interface PeerInteractionProps {
  questionId?: string;
  initialMessages?: PeerMessage[];
  currentUserId: string;
  onMessageSend: (message: string, parentId?: string) => void;
  onReaction: (messageId: string, reactionType: string) => void;
  showStudySessions?: boolean;
  allowPrivateMessages?: boolean;
}

const MOCK_MESSAGES: PeerMessage[] = [
  {
    id: 'msg1',
    userId: 'user123',
    userName: 'Alex Chen',
    userAvatar: '👨‍🎓',
    userLevel: 'Intermediate',
    message: 'I\'m also struggling with this concept. Has anyone found a good way to visualize quadratic functions?',
    timestamp: new Date('2024-01-15T10:30:00'),
    isEdited: false,
    reactions: [
      { type: 'like', count: 3, userReacted: false },
      { type: 'helpful', count: 1, userReacted: false },
    ],
    replies: [
      {
        id: 'reply1',
        userId: 'user456',
        userName: 'Sarah Kim',
        userAvatar: '👩‍💻',
        userLevel: 'Expert',
        message: 'Try using Desmos graphing calculator! It really helps to see how changing coefficients affects the parabola shape.',
        timestamp: new Date('2024-01-15T10:35:00'),
        isEdited: false,
        reactions: [
          { type: 'helpful', count: 5, userReacted: true },
          { type: 'thanks', count: 2, userReacted: false },
        ],
        replies: [],
      }
    ],
  },
  {
    id: 'msg2',
    userId: 'user789',
    userName: 'Mike Johnson',
    userAvatar: '🧑‍🔬',
    userLevel: 'Mentor',
    message: 'Great question! I\'ve created a step-by-step breakdown. The key is understanding the vertex form: f(x) = a(x-h)² + k',
    timestamp: new Date('2024-01-15T11:00:00'),
    isEdited: false,
    attachments: [
      { type: 'image', url: 'quadratic_guide.png', name: 'Quadratic Functions Guide' },
    ],
    reactions: [
      { type: 'like', count: 8, userReacted: false },
      { type: 'helpful', count: 12, userReacted: false },
    ],
    replies: [],
    isHighlighted: true,
  },
];

const MOCK_STUDY_SESSIONS: StudySession[] = [
  {
    id: 'session1',
    title: 'Algebra Problem Solving Workshop',
    subject: 'Mathematics',
    topic: 'Linear & Quadratic Equations',
    creatorId: 'mentor1',
    creatorName: 'Dr. Emma Wilson',
    participantCount: 8,
    maxParticipants: 15,
    scheduledTime: new Date('2024-01-20T15:00:00'),
    duration: 90,
    status: 'scheduled',
    description: 'Interactive workshop covering problem-solving strategies for algebra equations with practice problems.',
    tags: ['algebra', 'problem-solving', 'interactive'],
    level: 'Intermediate',
    isPrivate: false,
  },
  {
    id: 'session2',
    title: 'Physics Study Group - Mechanics',
    subject: 'Physics',
    topic: 'Forces and Motion',
    creatorId: 'student123',
    creatorName: 'James Park',
    participantCount: 5,
    maxParticipants: 8,
    scheduledTime: new Date('2024-01-18T19:00:00'),
    duration: 60,
    status: 'scheduled',
    description: 'Collaborative study session for upcoming physics exam. Bring your questions!',
    tags: ['physics', 'mechanics', 'exam-prep'],
    level: 'Advanced',
    isPrivate: false,
  },
];

export default function PeerInteraction({
  questionId,
  initialMessages = MOCK_MESSAGES,
  currentUserId = 'current_user',
  onMessageSend,
  onReaction,
  showStudySessions = true,
  allowPrivateMessages = true,
}: PeerInteractionProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<PeerMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [studySessions, setStudySessions] = useState<StudySession[]>(MOCK_STUDY_SESSIONS);
  const [activeTab, setActiveTab] = useState<'discussion' | 'sessions'>('discussion');
  const [refreshing, setRefreshing] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: PeerMessage = {
      id: `msg_${Date.now()}`,
      userId: currentUserId,
      userName: 'You',
      userAvatar: '👤',
      userLevel: 'Intermediate',
      message: newMessage.trim(),
      timestamp: new Date(),
      isEdited: false,
      reactions: [],
      replies: [],
    };

    if (replyingTo) {
      // Add as reply to existing message
      setMessages(prev => prev.map(msg => 
        msg.id === replyingTo 
          ? { ...msg, replies: [...msg.replies, message] }
          : msg
      ));
      setReplyingTo(null);
    } else {
      // Add as new top-level message
      setMessages(prev => [message, ...prev]);
    }

    setNewMessage('');
    onMessageSend(newMessage.trim(), replyingTo || undefined);
  }, [newMessage, replyingTo, currentUserId, onMessageSend]);

  const handleReaction = useCallback((messageId: string, reactionType: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions.map(reaction => 
          reaction.type === reactionType
            ? { 
                ...reaction, 
                count: reaction.userReacted ? reaction.count - 1 : reaction.count + 1,
                userReacted: !reaction.userReacted 
              }
            : reaction
        );
        
        // Add new reaction type if it doesn't exist
        if (!reactions.find(r => r.type === reactionType)) {
          reactions.push({
            type: reactionType as any,
            count: 1,
            userReacted: true,
          });
        }
        
        return { ...msg, reactions };
      }
      
      // Check replies
      const updatedReplies = msg.replies.map(reply => 
        reply.id === messageId
          ? {
              ...reply,
              reactions: reply.reactions.map(reaction =>
                reaction.type === reactionType
                  ? { 
                      ...reaction, 
                      count: reaction.userReacted ? reaction.count - 1 : reaction.count + 1,
                      userReacted: !reaction.userReacted 
                    }
                  : reaction
              )
            }
          : reply
      );
      
      return { ...msg, replies: updatedReplies };
    }));
    
    onReaction(messageId, reactionType);
  }, [onReaction]);

  const handleJoinSession = (sessionId: string) => {
    setStudySessions(prev => prev.map(session => 
      session.id === sessionId && session.participantCount < session.maxParticipants
        ? { ...session, participantCount: session.participantCount + 1 }
        : session
    ));
    Alert.alert('success', 'You\'ve joined the study session! Check your calendar for details.');
  };

  const getUserLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Expert': return '#9C27B0';
      case 'Mentor': return '#F44336';
      default: return theme.OnSurface;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.primary;
      case 'active': return '#4CAF50';
      case 'completed': return '#757575';
      case 'cancelled': return theme.error;
      default: return theme.OnSurface;
    }
  };

  const renderReactionButton = (messageId: string, type: string, count: number, userReacted: boolean) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.reactionButton,
        {
          backgroundColor: userReacted ? theme.primaryContainer : theme.Surface,
          borderColor: userReacted ? theme.primary : theme.Outline,
        }
      ]}
      onPress={() => handleReaction(messageId, type)}
      accessibilityRole="button"
      accessibilityLabel={`${userReacted ? 'Remove' : 'Add'} ${type} reaction`}
    >
      <Text style={styles.reactionEmoji}>
        {type === 'like' ? '👍' : 
         type === 'helpful' ? '💡' : 
         type === 'thanks' ? '🙏' : '😕'}
      </Text>
      {count > 0 && (
        <Text
          style={[
            styles.reactionCount,
            {
              color: userReacted ? theme.OnPrimaryContainer : theme.OnSurfaceVariant,
            }
          ]}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderMessage = (message: PeerMessage, isReply = false) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        isReply && styles.replyContainer,
        message.isHighlighted && { backgroundColor: theme.primaryContainer },
        { backgroundColor: theme.Surface }
      ]}
    >
      <View style={styles.messageHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{message.userAvatar}</Text>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.OnSurface }]}>
              {message.userName}
            </Text>
            <View style={styles.userMeta}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getUserLevelColor(message.userLevel) }
                ]}
              >
                <Text style={[styles.levelText, { color: theme.OnPrimary }]}>
                  {message.userLevel}
                </Text>
              </View>
              <Text style={[styles.timestamp, { color: theme.OnSurfaceVariant }]}>
                {message.timestamp.toLocaleString()}
                {message.isEdited && ' (edited)'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.messageText, { color: theme.OnSurface }]}>
        {message.message}
      </Text>

      {message.attachments && message.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {message.attachments.map((attachment, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.attachment, { backgroundColor: theme.primaryContainer }]}
              onPress={() => Alert.alert('Open Attachment', attachment.name)}
            >
              <Text style={styles.attachmentIcon}>
                {attachment.type === 'image' ? '🖼️' : 
                 attachment.type === 'file' ? '📄' : '🔗'}
              </Text>
              <Text
                style={[styles.attachmentName, { color: theme.OnPrimaryContainer }]}
                numberOfLines={1}
              >
                {attachment.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.messageActions}>
        <View style={styles.reactions}>
          {['like', 'helpful', 'thanks', 'confused'].map(type => {
            const reaction = message.reactions.find(r => r.type === type);
            return renderReactionButton(
              message.id,
              type,
              reaction?.count || 0,
              reaction?.userReacted || false
            );
          })}
        </View>

        {!isReply && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setReplyingTo(message.id)}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${message.userName}`}
          >
            <Text style={[styles.replyButtonText, { color: theme.primary }]}>
              Reply ({message.replies.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {message.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {message.replies.map(reply => renderMessage(reply, true))}
        </View>
      )}
    </View>
  );

  const renderStudySession = ({ item }: { item: StudySession }) => (
    <TouchableOpacity
      style={[styles.sessionCard, { backgroundColor: theme.Surface }]}
      onPress={() => {
        setSelectedSession(item);
        setSessionModalVisible(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={`View study session: ${item.title}`}
    >
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionTitle, { color: theme.OnSurface }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View
          style={[
            styles.sessionStatus,
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={[styles.sessionStatusText, { color: theme.OnPrimary }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionMeta}>
        <Text style={[styles.sessionSubject, { color: theme.primary }]}>
          {item.subject} • {item.topic}
        </Text>
        <Text style={[styles.sessionCreator, { color: theme.OnSurfaceVariant }]}>
          by {item.creatorName}
        </Text>
      </View>

      <Text
        style={[styles.sessionDescription, { color: theme.OnSurface }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.sessionFooter}>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionParticipants, { color: theme.OnSurfaceVariant }]}>
            {item.participantCount}/{item.maxParticipants} participants
          </Text>
          {item.scheduledTime && (
            <Text style={[styles.sessionTime, { color: theme.OnSurfaceVariant }]}>
              {item.scheduledTime.toLocaleDateString()} at {item.scheduledTime.toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.sessionTags}>
          {item.tags.slice(0, 2).map(tag => (
            <View
              key={tag}
              style={[styles.sessionTag, { backgroundColor: theme.primaryContainer }]}
            >
              <Text style={[styles.sessionTagText, { color: theme.OnPrimaryContainer }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSessionModal = () => (
    <Modal
      visible={sessionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSessionModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {selectedSession && (
            <>
              <View style={[styles.modalHeader, { borderBottomColor: theme.Outline }]}>
                <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                  {selectedSession.title}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSessionModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close session details"
                >
                  <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.sessionDetails}>
                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Subject & Topic
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedSession.subject} → {selectedSession.topic}
                  </Text>

                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Creator
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedSession.creatorName}
                  </Text>

                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedSession.description}
                  </Text>

                  {selectedSession.scheduledTime && (
                    <>
                      <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                        Scheduled Time
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                        {selectedSession.scheduledTime.toLocaleDateString()} at{' '}
                        {selectedSession.scheduledTime.toLocaleTimeString()}
                      </Text>
                    </>
                  )}

                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Duration
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedSession.duration} minutes
                  </Text>

                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Participants
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedSession.participantCount} of {selectedSession.maxParticipants}
                  </Text>

                  <View style={styles.sessionModalTags}>
                    {selectedSession.tags.map(tag => (
                      <View
                        key={tag}
                        style={[styles.modalTag, { backgroundColor: theme.primaryContainer }]}
                      >
                        <Text style={[styles.modalTagText, { color: theme.OnPrimaryContainer }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                  onPress={() => setSessionModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.primaryButton,
                    { 
                      backgroundColor: selectedSession.participantCount >= selectedSession.maxParticipants 
                        ? theme.Surface 
                        : theme.primary 
                    }
                  ]}
                  onPress={() => {
                    if (selectedSession.participantCount < selectedSession.maxParticipants) {
                      handleJoinSession(selectedSession.id);
                      setSessionModalVisible(false);
                    }
                  }}
                  disabled={selectedSession.participantCount >= selectedSession.maxParticipants}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      {
                        color: selectedSession.participantCount >= selectedSession.maxParticipants
                          ? theme.OnSurfaceVariant
                          : theme.OnPrimary
                      }
                    ]}
                  >
                    {selectedSession.participantCount >= selectedSession.maxParticipants
                      ? 'Session Full'
                      : 'Join Session'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'discussion' && {
                borderBottomColor: theme.primary,
                borderBottomWidth: 2,
              }
            ]}
            onPress={() => setActiveTab('discussion')}
            accessibilityRole="button"
            accessibilityLabel="View discussion"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'discussion' ? theme.primary : theme.OnSurfaceVariant,
                  fontWeight: activeTab === 'discussion' ? 'bold' : 'normal',
                }
              ]}
            >
              Discussion ({messages.length})
            </Text>
          </TouchableOpacity>

          {showStudySessions && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'sessions' && {
                  borderBottomColor: theme.primary,
                  borderBottomWidth: 2,
                }
              ]}
              onPress={() => setActiveTab('sessions')}
              accessibilityRole="button"
              accessibilityLabel="View study sessions"
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'sessions' ? theme.primary : theme.OnSurfaceVariant,
                    fontWeight: activeTab === 'sessions' ? 'bold' : 'normal',
                  }
                ]}
              >
                Study Sessions ({studySessions.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {activeTab === 'discussion' ? (
        <>
          <FlatList
            data={messages}
            renderItem={({ item }) => renderMessage(item)}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 1000);
                }}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.inputContainer, { backgroundColor: theme.Surface }]}>
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <Text style={[styles.replyText, { color: theme.OnSurfaceVariant }]}>
                  Replying to {messages.find(m => m.id === replyingTo)?.userName}
                </Text>
                <TouchableOpacity
                  style={styles.cancelReply}
                  onPress={() => setReplyingTo(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reply"
                >
                  <Text style={[styles.cancelReplyText, { color: theme.primary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.messageInput,
                  { backgroundColor: theme.SurfaceVariant, color: theme.OnSurface }
                ]}
                placeholder={replyingTo ? "Write a reply..." : "Ask a question or share your thoughts..."}
                placeholderTextColor={theme.OnSurfaceVariant}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: newMessage.trim() ? theme.primary : theme.Surface,
                  }
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    {
                      color: newMessage.trim() ? theme.OnPrimary : theme.OnSurfaceVariant,
                    }
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <FlatList
          data={studySessions}
          renderItem={renderStudySession}
          keyExtractor={(item) => item.id}
          style={styles.sessionsList}
          contentContainerStyle={styles.sessionsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderSessionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  messageHeader: {
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  attachmentsContainer: {
    marginBottom: 12,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  attachmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  replyButton: {
    padding: 8,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  replyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cancelReply: {
    padding: 4,
  },
  cancelReplyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    padding: 16,
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMeta: {
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionCreator: {
    fontSize: 14,
  },
  sessionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionParticipants: {
    fontSize: 12,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
  },
  sessionTags: {
    flexDirection: 'row',
  },
  sessionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  sessionTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 400,
  },
  sessionDetails: {
    padding: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  sessionModalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  modalTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});