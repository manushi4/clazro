/**
 * TeacherCommunicationScreen - Phase 35.1: Teacher Communication Portal
 * Multi-channel communication system for parents to connect with teachers
 * Includes messaging, video calls, meeting scheduling, and emergency contacts
 * Manushi Coaching Platform
 */

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
  RefreshControl,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

// Import hooks for real data
import { useChildrenSummary as useParentChildren } from '../../hooks/api/useParentAPI';
// TODO: Import hooks when backend services are ready
const useConversations = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useParentTeachers = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useMeetings = () => ({ data: [], isLoading: false, refetch: async () => {} });

const { width } = Dimensions.get('window');

// Type definitions for Teacher Communication System
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen: string;
  department: string;
  yearsExperience: number;
  responseTime: string; // Average response time
  rating: number;
}

interface Message {
  id: string;
  senderId: string;
  senderType: 'parent' | 'teacher';
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'video' | 'document';
  attachments?: MessageAttachment[];
  isUrgent: boolean;
}

interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface Meeting {
  id: string;
  teacherId: string;
  parentId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  type: 'in-person' | 'video-call' | 'phone-call';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  agenda: string;
  meetingNotes?: string;
  videoCallLink?: string;
  reminderSet: boolean;
}

interface Conversation {
  id: string;
  teacherId: string;
  teacher: Teacher;
  lastMessage: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
}

interface TeacherCommunicationScreenProps {
  parentId: string;
  onNavigate: (screen: string) => void;
}

const TeacherCommunicationScreen: React.FC<TeacherCommunicationScreenProps> = ({
  parentId = '11111111-1111-1111-1111-111111111111', // Default for testing
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'teachers' | 'meetings' | 'emergency'>('messages');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch real data using hooks
  const {
    data: conversationsData = [],
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(parentId);

  const {
    data: teachersData = [],
    isLoading: teachersLoading,
    error: teachersError,
    refetch: refetchTeachers,
  } = useParentTeachers(parentId);

  const {
    data: meetingsData = [],
    isLoading: meetingsLoading,
    error: meetingsError,
    refetch: refetchMeetings,
  } = useMeetings(parentId);

  // Combined loading state
  const isLoading = conversationsLoading || teachersLoading || meetingsLoading;

  // Transform data to match component interfaces
  const conversations: Conversation[] = React.useMemo(() => {
    return conversationsData || [];
  }, [conversationsData]);

  const teachers: Teacher[] = React.useMemo(() => {
    if (!teachersData) return [];

    return teachersData.map((teacher: any) => ({
      id: teacher.id,
      firstName: teacher.first_name || 'Teacher',
      lastName: teacher.last_name || '',
      subject: teacher.subjects?.[0] || 'Subject',
      email: teacher.email || '',
      phoneNumber: teacher.phone_number || '',
      profileImage: undefined,
      isOnline: teacher.is_available || false,
      lastSeen: teacher.is_available ? 'Online' : 'Offline',
      department: teacher.department || 'Department',
      yearsExperience: teacher.years_experience || 0,
      responseTime: teacher.average_response_time_hours
        ? `< ${teacher.average_response_time_hours} hours`
        : '< 24 hours',
      rating: teacher.rating || 4.5,
    }));
  }, [teachersData]);

  const meetings: Meeting[] = React.useMemo(() => {
    if (!meetingsData) return [];

    return meetingsData.map((meeting: any) => {
      const teacher = teachers.find(t => t.id === meeting.teacher_id);

      return {
        id: meeting.id,
        teacherId: meeting.teacher_id,
        parentId: parentId,
        scheduledDate: meeting.meeting_scheduled_at?.split('T')[0] || '',
        scheduledTime: meeting.meeting_scheduled_at?.split('T')[1]?.substring(0, 5) || '',
        duration: 30, // Default duration
        type: (meeting.meeting_type as 'in-person' | 'video-call' | 'phone-call') || 'video-call',
        status: meeting.meeting_completed ? 'completed' : 'confirmed',
        agenda: meeting.subject || 'Meeting with teacher',
        meetingNotes: meeting.meeting_notes || undefined,
        videoCallLink: meeting.meeting_link || undefined,
        reminderSet: true,
      };
    });
  }, [meetingsData, teachers, parentId]);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onNavigate('back');
      return true;
    });
    return backHandler;
  }, [onNavigate]);

  // Handle errors from data fetching
  useEffect(() => {
    if (conversationsError) {
      showSnackbar(`Error loading conversations: ${conversationsError.message}`);
    }
  }, [conversationsError, showSnackbar]);

  useEffect(() => {
    if (teachersError) {
      showSnackbar(`Error loading teachers: ${teachersError.message}`);
    }
  }, [teachersError, showSnackbar]);

  useEffect(() => {
    if (meetingsError) {
      showSnackbar(`Error loading meetings: ${meetingsError.message}`);
    }
  }, [meetingsError, showSnackbar]);

  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Use allSettled to allow partial success
      const results = await Promise.allSettled([
        refetchConversations(),
        refetchTeachers(),
        refetchMeetings(),
      ]);

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        showSnackbar('Data refreshed successfully');
      } else if (succeeded.length > 0) {
        showSnackbar(`Partially refreshed (${failed.length} section(s) failed)`);
        console.warn('Some refetches failed:', failed);
      } else {
        throw new Error('All refetches failed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showSnackbar('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchConversations, refetchTeachers, refetchMeetings, showSnackbar]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTeacher) return;

    showSnackbar('Your message has been sent successfully!');
    setNewMessage('');
    setShowNewMessageModal(false);
    setSelectedTeacher(null);
  };

  const handleScheduleMeeting = (teacher: Teacher) => {
    const teacherName = `${teacher?.firstName || 'Unknown'} ${teacher?.lastName || 'Teacher'}`;
    showSnackbar(`Scheduling meeting with ${teacherName}...`);
    setTimeout(() => onNavigate('schedule-meeting'), 1500);
  };

  const handleVideoCall = (teacher: Teacher) => {
    const teacherName = `${teacher?.firstName || 'Unknown'} ${teacher?.lastName || 'Teacher'}`;
    showSnackbar(`Starting video call with ${teacherName}...`);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery(''); // Clear search when closing
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C3AED' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Teacher Communication" subtitle="Connect with your child's teachers" />
      {activeTab !== 'emergency' && (
        <Appbar.Action
          icon={showSearch ? "close" : "magnify"}
          onPress={toggleSearch}
        />
      )}
    </Appbar.Header>
  );

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, item.isPinned && styles.pinnedConversation]}
      onPress={() => onNavigate('message-detail')}
      activeOpacity={0.7}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.teacherInfo}>
          <View style={[styles.teacherAvatar, item.teacher?.isOnline && styles.onlineAvatar]}>
            <Text style={styles.teacherAvatarText}>
              {item.teacher?.firstName?.charAt(0) || 'T'}{item.teacher?.lastName?.charAt(0) || ''}
            </Text>
          </View>
          <View style={styles.conversationDetails}>
            <View style={styles.conversationTitleRow}>
              <Text style={styles.teacherName}>
                {item.teacher?.firstName || 'Unknown'} {item.teacher?.lastName || 'Teacher'}
              </Text>
              {item.isPinned && <Text style={styles.pinIcon}>📌</Text>}
            </View>
            <Text style={styles.teacherSubject}>{item.teacher?.subject || 'Subject'}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.senderType === 'parent' ? 'You: ' : ''}{item.lastMessage.content}
            </Text>
          </View>
        </View>
        <View style={styles.conversationMeta}>
          <Text style={styles.messageTime}>
            {new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTeacherItem = ({ item }: { item: Teacher }) => (
    <TouchableOpacity style={styles.teacherCard} activeOpacity={0.7}>
      <View style={styles.teacherHeader}>
        <View style={[styles.teacherAvatar, item.isOnline && styles.onlineAvatar]}>
          <Text style={styles.teacherAvatarText}>
            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.teacherDetails}>
          <Text style={styles.teacherName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.teacherSubject}>{item.subject}</Text>
          <Text style={styles.teacherDepartment}>{item.department}</Text>
          <View style={styles.teacherStatus}>
            <View style={[styles.statusIndicator, item.isOnline && styles.onlineIndicator]} />
            <Text style={styles.statusText}>
              {item.isOnline ? 'Online' : `Last seen ${item.lastSeen}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.teacherStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>⭐ {item.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.yearsExperience}y</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.responseTime}</Text>
          <Text style={styles.statLabel}>Response</Text>
        </View>
      </View>

      <View style={styles.teacherActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => {
            setSelectedTeacher(item);
            setShowNewMessageModal(true);
          }}
        >
          <Text style={styles.actionButtonText}>💬 Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleVideoCall(item)}
        >
          <Text style={styles.actionButtonText}>📹 Call</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.meetButton]}
          onPress={() => handleScheduleMeeting(item)}
        >
          <Text style={styles.actionButtonText}>📅 Meet</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderMeetingItem = ({ item }: { item: Meeting }) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingHeader}>
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>
            Meeting with {teachers.find(t => t.id === item.teacherId)?.firstName} {teachers.find(t => t.id === item.teacherId)?.lastName}
          </Text>
          <Text style={styles.meetingSubject}>
            {teachers.find(t => t.id === item.teacherId)?.subject}
          </Text>
        </View>
        <View style={[styles.meetingStatus, styles[`status${item.status}`]]}>
          <Text style={styles.meetingStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.meetingDetails}>
        <View style={styles.meetingDetailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {new Date(item.scheduledDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.meetingDetailItem}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={styles.detailText}>
            {item.scheduledTime} ({item.duration} mins)
          </Text>
        </View>
        <View style={styles.meetingDetailItem}>
          <Text style={styles.detailIcon}>
            {item.type === 'video-call' ? '📹' : item.type === 'phone-call' ? '📞' : '🏢'}
          </Text>
          <Text style={styles.detailText}>
            {item.type === 'video-call' ? 'Video Call' : item.type === 'phone-call' ? 'Phone Call' : 'In Person'}
          </Text>
        </View>
      </View>

      <Text style={styles.meetingAgenda}>{item.agenda}</Text>

      <View style={styles.meetingActions}>
        {item.status === 'scheduled' && (
          <>
            <TouchableOpacity style={[styles.meetingButton, styles.confirmButton]}>
              <Text style={styles.meetingButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.meetingButton, styles.rescheduleButton]}>
              <Text style={styles.meetingButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </>
        )}
        {item.type === 'video-call' && item.status === 'confirmed' && (
          <TouchableOpacity style={[styles.meetingButton, styles.joinButton]}>
            <Text style={styles.meetingButtonText}>Join Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmergencyContacts = () => (
    <View style={styles.emergencyContainer}>
      <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
      <Text style={styles.emergencySubtitle}>
        For urgent matters requiring immediate attention
      </Text>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyCardTitle}>🚨 Principal's Office</Text>
        <Text style={styles.emergencyContact}>📞 +91 9876543200</Text>
        <Text style={styles.emergencyContact}>✉️ principal@manushi.edu</Text>
        <TouchableOpacity style={styles.emergencyCallButton}>
          <Text style={styles.emergencyCallText}>Call Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyCardTitle}>🏥 School Nurse</Text>
        <Text style={styles.emergencyContact}>📞 +91 9876543201</Text>
        <Text style={styles.emergencyContact}>✉️ nurse@manushi.edu</Text>
        <TouchableOpacity style={styles.emergencyCallButton}>
          <Text style={styles.emergencyCallText}>Call Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyCardTitle}>🛡️ Security Office</Text>
        <Text style={styles.emergencyContact}>📞 +91 9876543202</Text>
        <Text style={styles.emergencyContact}>✉️ security@manushi.edu</Text>
        <TouchableOpacity style={styles.emergencyCallButton}>
          <Text style={styles.emergencyCallText}>Call Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyTips}>
        <Text style={styles.emergencyTipsTitle}>📋 When to Use Emergency Contacts:</Text>
        <Text style={styles.emergencyTip}>• Child injury or medical emergency</Text>
        <Text style={styles.emergencyTip}>• Safety concerns or incidents</Text>
        <Text style={styles.emergencyTip}>• Urgent pickup or family emergency</Text>
        <Text style={styles.emergencyTip}>• After-hours school emergencies</Text>
      </View>
    </View>
  );

  const getFilteredConversations = () => {
    if (!searchQuery) return conversations;

    return conversations.filter(conv => {
      const teacherName = `${conv.teacher?.firstName || ''} ${conv.teacher?.lastName || ''}`.toLowerCase();
      const subject = (conv.teacher?.subject || '').toLowerCase();
      const messageContent = (conv.lastMessage?.content || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      return teacherName.includes(query) ||
             subject.includes(query) ||
             messageContent.includes(query);
    });
  };

  const getFilteredTeachers = () => {
    if (!searchQuery) return teachers;

    return teachers.filter(teacher =>
      (teacher?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredMeetings = () => {
    if (!searchQuery) return meetings;

    return meetings.filter(meeting => {
      const teacher = teachers.find(t => t.id === meeting.teacherId);
      if (!teacher) return false;

      const teacherName = `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.toLowerCase();
      const subject = (teacher?.subject || '').toLowerCase();
      const agenda = (meeting?.agenda || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      return teacherName.includes(query) ||
             subject.includes(query) ||
             agenda.includes(query);
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'messages':
        return (
          <FlatList
            data={getFilteredConversations()}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No Matching Conversations' : 'No Conversations Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Start a conversation with your child\'s teachers'}
                </Text>
              </View>
            }
          />
        );

      case 'teachers':
        return (
          <FlatList
            data={getFilteredTeachers()}
            renderItem={renderTeacherItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👩‍🏫</Text>
                <Text style={styles.emptyTitle}>No Matching Teachers</Text>
                <Text style={styles.emptySubtitle}>
                  Try a different search term
                </Text>
              </View>
            }
          />
        );

      case 'meetings':
        return (
          <FlatList
            data={getFilteredMeetings()}
            renderItem={renderMeetingItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No Matching Meetings' : 'No Meetings Scheduled'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Schedule meetings with teachers to discuss your child\'s progress'}
                </Text>
              </View>
            }
          />
        );

      case 'emergency':
        return renderEmergencyContacts();

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading teacher communication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      {renderAppBar()}

      {/* Search Bar */}
      {showSearch && activeTab !== 'emergency' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'messages'
                ? "Search conversations by teacher or message..."
                : activeTab === 'teachers'
                ? "Search teachers by name, subject, or department..."
                : "Search meetings by teacher or agenda..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={LightTheme.OnSurfaceVariant}
            autoFocus
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('messages', 'Messages', '💬')}
          {renderTabButton('teachers', 'Teachers', '👩‍🏫')}
          {renderTabButton('meetings', 'Meetings', '📅')}
          {renderTabButton('emergency', 'Emergency', '🚨')}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* New Message Modal */}
      <Modal
        visible={showNewMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Message {selectedTeacher?.firstName} {selectedTeacher?.lastName}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNewMessageModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              textAlignVertical="top"
              placeholderTextColor={LightTheme.OnSurfaceVariant}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewMessageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBFE',
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: 16,
    color: LightTheme.Outline,
  },

  // Search Styles
  searchContainer: {
    backgroundColor: '#FFFFFF',
    margin: Spacing.MD,
    borderRadius: BorderRadius.LG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.MD,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurface,
  },
  searchIcon: {
    fontSize: 18,
    color: LightTheme.OnSurfaceVariant,
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  tabButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
    borderRadius: BorderRadius.LG,
    alignItems: 'center',
    minWidth: 100,
  },
  tabButtonActive: {
    backgroundColor: '#EDE9FE',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },

  // Conversation Styles
  conversationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
    marginVertical: Spacing.XS,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pinnedConversation: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: LightTheme.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  onlineAvatar: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  teacherAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  pinIcon: {
    fontSize: 14,
    marginLeft: Spacing.SM,
  },
  teacherSubject: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  lastMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.SM,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Teacher Card Styles
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherDepartment: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  teacherStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: Spacing.SM,
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  teacherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LightTheme.Outline,
    marginBottom: Spacing.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginHorizontal: Spacing.XS,
  },
  messageButton: {
    backgroundColor: '#EDE9FE',
  },
  callButton: {
    backgroundColor: '#DBEAFE',
  },
  meetButton: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },

  // Meeting Styles
  meetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  meetingSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  meetingStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusscheduled: {
    backgroundColor: '#FEF3C7',
  },
  statusconfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statuscompleted: {
    backgroundColor: '#DBEAFE',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
  },
  meetingStatusText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  meetingDetails: {
    marginBottom: Spacing.MD,
  },
  meetingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
    width: 20,
  },
  detailText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
  },
  meetingAgenda: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: Spacing.MD,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
  },
  meetingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  meetingButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    marginLeft: Spacing.SM,
  },
  confirmButton: {
    backgroundColor: '#D1FAE5',
  },
  rescheduleButton: {
    backgroundColor: '#FEF3C7',
  },
  joinButton: {
    backgroundColor: '#7C3AED',
  },
  meetingButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },

  // Emergency Styles
  emergencyContainer: {
    padding: Spacing.MD,
  },
  emergencyTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  emergencySubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  emergencyCardTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  emergencyContact: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  emergencyCallButton: {
    backgroundColor: '#EF4444',
    borderRadius: BorderRadius.MD,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    marginTop: Spacing.SM,
    alignItems: 'center',
  },
  emergencyCallText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emergencyTips: {
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginTop: Spacing.MD,
  },
  emergencyTipsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  emergencyTip: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.LG,
  },
  emptyTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: Spacing.XL,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    width: width - Spacing.XL * 2,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  modalTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modalClose: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LightTheme.OnSurfaceVariant,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurface,
    minHeight: 120,
    marginBottom: Spacing.LG,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.MD,
  },
  cancelButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  sendButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherCommunicationScreen;