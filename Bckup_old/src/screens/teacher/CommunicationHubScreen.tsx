/**
 * CommunicationHubScreen - Phase 31.2: Class Communication Hub
 * Multi-channel communication with announcement broadcasting and attendance tracking
 * Manushi Coaching Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Switch,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

interface CommunicationHubScreenProps {
  teacherId: string;
  onNavigate: (screen: string) => void;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  parentContact: string;
  parentEmail: string;
  grade: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  lastSeen: Date;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'assignment' | 'event' | 'emergency';
  targetAudience: 'all-students' | 'specific-students' | 'parents' | 'both';
  recipients: string[];
  scheduledTime?: Date;
  deliveryStatus: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  attachments?: string[];
  createdAt: Date;
  createdBy: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
}

interface AttendanceSession {
  id: string;
  date: Date;
  classId: string;
  className: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  status: 'ongoing' | 'completed' | 'pending';
  startTime: Date;
  endTime?: Date;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  type: 'absence-followup' | 'performance-alert' | 'meeting-request' | 'general-update';
  variables: string[];
}

export const CommunicationHubScreen: React.FC<CommunicationHubScreenProps> = ({
  teacherId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'attendance' | 'messaging' | 'templates'>('announcements');
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceSession | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Announcement Modal State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState<Announcement['type']>('general');
  const [targetAudience, setTargetAudience] = useState<Announcement['targetAudience']>('all-students');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [announcementPriority, setAnnouncementPriority] = useState<Announcement['priority']>('medium');
  const [scheduleAnnouncement, setScheduleAnnouncement] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showAnnouncementModal || showAttendanceModal || showMessageModal) {
        setShowAnnouncementModal(false);
        setShowAttendanceModal(false);
        setShowMessageModal(false);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showAnnouncementModal, showAttendanceModal, showMessageModal]);

  const cleanup = useCallback(() => {
    // Cleanup any active resources
  }, []);

  useEffect(() => {
    loadCommunicationData();
  }, [teacherId]);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const loadCommunicationData = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with actual API calls
      setStudents([
        {
          id: '1',
          name: 'Arjun Sharma',
          avatar: 'AS',
          parentContact: '+91 98765 43210',
          parentEmail: 'parent.arjun@email.com',
          grade: '10th',
          status: 'present',
          lastSeen: new Date('2024-09-03T09:00:00')
        },
        {
          id: '2',
          name: 'Priya Patel',
          avatar: 'PP',
          parentContact: '+91 98765 43211',
          parentEmail: 'parent.priya@email.com',
          grade: '10th',
          status: 'absent',
          lastSeen: new Date('2024-09-02T10:30:00')
        },
        {
          id: '3',
          name: 'Rahul Kumar',
          avatar: 'RK',
          parentContact: '+91 98765 43212',
          parentEmail: 'parent.rahul@email.com',
          grade: '10th',
          status: 'late',
          lastSeen: new Date('2024-09-03T09:15:00')
        },
        {
          id: '4',
          name: 'Anjali Singh',
          avatar: 'AS',
          parentContact: '+91 98765 43213',
          parentEmail: 'parent.anjali@email.com',
          grade: '10th',
          status: 'present',
          lastSeen: new Date('2024-09-03T08:45:00')
        }
      ]);

      setAnnouncements([
        {
          id: '1',
          title: 'Mid-term Examination Schedule',
          message: 'Dear students and parents, the mid-term examinations will commence from October 15th, 2024. Please ensure all assignments are submitted before the exam period.',
          type: 'assignment',
          targetAudience: 'both',
          recipients: ['all'],
          deliveryStatus: { sent: 45, delivered: 42, read: 38, failed: 3 },
          createdAt: new Date('2024-09-01T14:30:00'),
          createdBy: 'Dr. Sarah Wilson',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Parent-Teacher Meeting',
          message: 'You are invited to attend the parent-teacher meeting scheduled for September 20th, 2024 at 4:00 PM to discuss your ward\'s academic progress.',
          type: 'event',
          targetAudience: 'parents',
          recipients: ['selected'],
          deliveryStatus: { sent: 25, delivered: 24, read: 20, failed: 1 },
          createdAt: new Date('2024-08-28T16:00:00'),
          createdBy: 'Dr. Sarah Wilson',
          priority: 'medium'
        }
      ]);

      setAttendanceSessions([
        {
          id: '1',
          date: new Date('2024-09-03'),
          classId: 'math-101',
          className: 'Mathematics - Advanced',
          totalStudents: 28,
          presentCount: 25,
          absentCount: 2,
          lateCount: 1,
          status: 'completed',
          startTime: new Date('2024-09-03T09:00:00'),
          endTime: new Date('2024-09-03T10:30:00')
        },
        {
          id: '2',
          date: new Date('2024-09-02'),
          classId: 'physics-201',
          className: 'Physics - Mechanics',
          totalStudents: 30,
          presentCount: 28,
          absentCount: 1,
          lateCount: 1,
          status: 'completed',
          startTime: new Date('2024-09-02T11:00:00'),
          endTime: new Date('2024-09-02T12:30:00')
        }
      ]);

      setTemplates([
        {
          id: '1',
          name: 'Absence Follow-up',
          subject: 'Student Absence Notification',
          message: 'Dear {PARENT_NAME}, your ward {STUDENT_NAME} was absent from {CLASS_NAME} on {DATE}. Please contact us if this absence was due to an emergency.',
          type: 'absence-followup',
          variables: ['PARENT_NAME', 'STUDENT_NAME', 'CLASS_NAME', 'DATE']
        },
        {
          id: '2',
          name: 'Performance Alert',
          subject: 'Academic Performance Update',
          message: 'Dear {PARENT_NAME}, we would like to discuss {STUDENT_NAME}\'s recent academic performance in {SUBJECT}. Please schedule a meeting at your convenience.',
          type: 'performance-alert',
          variables: ['PARENT_NAME', 'STUDENT_NAME', 'SUBJECT']
        }
      ]);

    } catch (error) {
      Alert.alert('error', 'Failed to load communication data');
      showSnackbar('Failed to load communication data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('error', 'Please fill in all required fields');
      return;
    }

    try {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title: announcementTitle,
        message: announcementMessage,
        type: announcementType,
        targetAudience,
        recipients: targetAudience === 'all-students' ? ['all'] : selectedStudents,
        scheduledTime: scheduleAnnouncement ? scheduledTime : undefined,
        deliveryStatus: { sent: 0, delivered: 0, read: 0, failed: 0 },
        createdAt: new Date(),
        createdBy: 'Dr. Sarah Wilson',
        priority: announcementPriority
      };

      // Simulate sending announcement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setShowAnnouncementModal(false);
      resetAnnouncementForm();
      
      Alert.alert('success', 'Announcement sent successfully!');
    } catch (error) {
      Alert.alert('error', 'Failed to send announcement');
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementType('general');
    setTargetAudience('all-students');
    setSelectedStudents([]);
    setAnnouncementPriority('medium');
    setScheduleAnnouncement(false);
  };

  const startAttendanceSession = (classInfo: { id: string, name: string }) => {
    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      date: new Date(),
      classId: classInfo.id,
      className: classInfo.name,
      totalStudents: students.length,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      status: 'ongoing',
      startTime: new Date()
    };

    setCurrentAttendance(newSession);
    setShowAttendanceModal(true);
  };

  const markAttendance = (studentId: string, status: Student['status']) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, status } : student
    ));

    if (currentAttendance) {
      const updatedStudents = students.map(student => 
        student.id === studentId ? { ...student, status } : student
      );
      
      const presentCount = updatedStudents.filter(s => s.status === 'present').length;
      const absentCount = updatedStudents.filter(s => s.status === 'absent').length;
      const lateCount = updatedStudents.filter(s => s.status === 'late').length;

      setCurrentAttendance(prev => prev ? {
        ...prev,
        presentCount,
        absentCount,
        lateCount
      } : null);
    }
  };

  const completeAttendanceSession = () => {
    if (currentAttendance) {
      const completedSession = {
        ...currentAttendance,
        status: 'completed' as const,
        endTime: new Date()
      };

      setAttendanceSessions(prev => [completedSession, ...prev]);
      setCurrentAttendance(null);
      setShowAttendanceModal(false);
      
      Alert.alert('success', 'Attendance session completed successfully!');
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content
        title="Communication Hub"
        subtitle="Multi-channel messaging & attendance"
      />
      <Appbar.Action
        icon="bell"
        onPress={() => setActiveTab('announcements')}
      />
      <Appbar.Action
        icon="message"
        onPress={() => setActiveTab('messaging')}
      />
    </Appbar.Header>
  );

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderAnnouncementsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowAnnouncementModal(true)}
      >
        <Text style={styles.createButtonText}>📢 Create Announcement</Text>
      </TouchableOpacity>

      {announcements.map((announcement) => (
        <DashboardCard key={announcement.id} title={announcement.title} style={styles.sectionCard}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementMeta}>
              <Text style={[styles.announcementType, {
                backgroundColor: announcement.type === 'emergency' ? '#FEE2E2' :
                               announcement.type === 'urgent' ? '#FEF3C7' :
                               announcement.type === 'assignment' ? '#E0E7FF' :
                               announcement.type === 'event' ? '#D1FAE5' : '#F3F4F6',
                color: announcement.type === 'emergency' ? '#DC2626' :
                       announcement.type === 'urgent' ? '#D97706' :
                       announcement.type === 'assignment' ? '#4338CA' :
                       announcement.type === 'event' ? '#059669' : '#374151'
              }]}>
                {announcement.type.toUpperCase()}
              </Text>
              <Text style={[styles.priorityBadge, {
                backgroundColor: announcement.priority === 'emergency' ? '#DC2626' :
                               announcement.priority === 'high' ? '#EF4444' :
                               announcement.priority === 'medium' ? '#F59E0B' : '#6B7280',
              }]}>
                {announcement.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.announcementDate}>
              {announcement.createdAt.toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.announcementMessage}>{announcement.message}</Text>

          <View style={styles.deliveryStatus}>
            <Text style={styles.deliveryTitle}>Delivery Status:</Text>
            <View style={styles.deliveryStats}>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryNumber}>{announcement.deliveryStatus.sent}</Text>
                <Text style={styles.deliveryLabel}>Sent</Text>
              </View>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryNumber}>{announcement.deliveryStatus.delivered}</Text>
                <Text style={styles.deliveryLabel}>Delivered</Text>
              </View>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryNumber}>{announcement.deliveryStatus.read}</Text>
                <Text style={styles.deliveryLabel}>Read</Text>
              </View>
              <View style={styles.deliveryStat}>
                <Text style={[styles.deliveryNumber, { color: '#DC2626' }]}>
                  {announcement.deliveryStatus.failed}
                </Text>
                <Text style={styles.deliveryLabel}>Failed</Text>
              </View>
            </View>
          </View>

          <View style={styles.announcementActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('View Details', 'Detailed announcement analytics')}
            >
              <Text style={styles.actionButtonText}>📊 View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Resend', 'Resend to failed recipients')}
            >
              <Text style={styles.actionButtonText}>🔄 Resend Failed</Text>
            </TouchableOpacity>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderAttendanceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => startAttendanceSession({ id: 'current-class', name: 'Current Class Session' })}
      >
        <Text style={styles.createButtonText}>✅ Start Attendance</Text>
      </TouchableOpacity>

      <DashboardCard title="📊 Attendance Overview" style={styles.sectionCard}>
        <View style={styles.attendanceOverview}>
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNumber, { color: '#059669' }]}>
                {students.filter(s => s.status === 'present').length}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                {students.filter(s => s.status === 'absent').length}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>
                {students.filter(s => s.status === 'late').length}
              </Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={styles.statNumber}>{students.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
      </DashboardCard>

      {attendanceSessions.map((session) => (
        <DashboardCard 
          key={session.id} 
          title={`📅 ${session.className}`} 
          style={styles.sectionCard}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionDate}>
              {session.date.toLocaleDateString()} • {session.startTime.toLocaleTimeString()}
            </Text>
            <Text style={[styles.sessionStatus, {
              backgroundColor: session.status === 'completed' ? '#D1FAE5' :
                             session.status === 'ongoing' ? '#FEF3C7' : '#F3F4F6',
              color: session.status === 'completed' ? '#059669' :
                     session.status === 'ongoing' ? '#D97706' : '#374151'
            }]}>
              {session.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.sessionStats}>
            <Text style={styles.sessionStat}>
              Present: <Text style={styles.statValue}>{session.presentCount}</Text>
            </Text>
            <Text style={styles.sessionStat}>
              Absent: <Text style={styles.statValue}>{session.absentCount}</Text>
            </Text>
            <Text style={styles.sessionStat}>
              Late: <Text style={styles.statValue}>{session.lateCount}</Text>
            </Text>
            <Text style={styles.sessionStat}>
              Total: <Text style={styles.statValue}>{session.totalStudents}</Text>
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => Alert.alert('Session Details', 'View detailed attendance report')}
          >
            <Text style={styles.viewDetailsText}>View Detailed Report</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderMessagingTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowMessageModal(true)}
      >
        <Text style={styles.createButtonText}>💬 Send Message</Text>
      </TouchableOpacity>

      <DashboardCard title="👥 Student List" style={styles.sectionCard}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentItem}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>{student.avatar}</Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentGrade}>{student.grade} • {student.parentContact}</Text>
                <Text style={styles.lastSeen}>
                  Last seen: {student.lastSeen.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.studentActions}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => Alert.alert('Contact', `Calling ${student.parentContact}`)}
              >
                <Text style={styles.contactButtonText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => Alert.alert('Email', `Sending email to ${student.parentEmail}`)}
              >
                <Text style={styles.contactButtonText}>📧</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </DashboardCard>
    </ScrollView>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => Alert.alert('Create Template', 'Create new communication template')}
      >
        <Text style={styles.createButtonText}>📝 Create Template</Text>
      </TouchableOpacity>

      {templates.map((template) => (
        <DashboardCard key={template.id} title={template.name} style={styles.sectionCard}>
          <Text style={styles.templateType}>Type: {template.type.replace('-', ' ').toUpperCase()}</Text>
          <Text style={styles.templateSubject}>Subject: {template.subject}</Text>
          <Text style={styles.templateMessage}>{template.message}</Text>
          
          <View style={styles.templateVariables}>
            <Text style={styles.variablesTitle}>Variables:</Text>
            <View style={styles.variablesList}>
              {template.variables.map((variable, index) => (
                <Text key={index} style={styles.variableTag}>
                  {`{${variable}}`}
                </Text>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.useTemplateButton}
            onPress={() => Alert.alert('Use Template', 'Apply template to new message')}
          >
            <Text style={styles.useTemplateText}>Use Template</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderAnnouncementModal = () => (
    <Modal
      visible={showAnnouncementModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAnnouncementModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Create Announcement</Text>
            
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
              placeholder="Enter announcement title"
              maxLength={100}
            />

            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={announcementMessage}
              onChangeText={setAnnouncementMessage}
              placeholder="Enter announcement message"
              multiline={true}
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(['general', 'urgent', 'assignment', 'event', 'emergency'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, announcementType === type && styles.selectedType]}
                  onPress={() => setAnnouncementType(type)}
                >
                  <Text style={[styles.typeText, announcementType === type && styles.selectedTypeText]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.prioritySelector}>
              {(['low', 'medium', 'high', 'emergency'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.priorityOption, announcementPriority === priority && styles.selectedPriority]}
                  onPress={() => setAnnouncementPriority(priority)}
                >
                  <Text style={[styles.priorityText, announcementPriority === priority && styles.selectedPriorityText]}>
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.scheduleOption}>
              <Text style={styles.inputLabel}>Schedule for later</Text>
              <Switch
                value={scheduleAnnouncement}
                onValueChange={setScheduleAnnouncement}
                trackColor={{ false: '#E5E7EB', true: LightTheme.Primary }}
                thumbColor={scheduleAnnouncement ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAnnouncementModal(false);
                  resetAnnouncementForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendAnnouncement}
              >
                <Text style={styles.sendButtonText}>
                  {scheduleAnnouncement ? 'Schedule' : 'Send Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAttendanceModal = () => (
    <Modal
      visible={showAttendanceModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAttendanceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Take Attendance</Text>
          <Text style={styles.modalSubtitle}>
            {currentAttendance?.className} • {currentAttendance?.date.toLocaleDateString()}
          </Text>

          <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
            {students.map((student) => (
              <View key={student.id} style={styles.attendanceStudentItem}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>{student.avatar}</Text>
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentGrade}>{student.grade}</Text>
                  </View>
                </View>
                
                <View style={styles.attendanceOptions}>
                  {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.attendanceOption,
                        student.status === status && styles.selectedAttendance,
                        {
                          backgroundColor: student.status === status ? 
                            (status === 'present' ? '#D1FAE5' :
                             status === 'absent' ? '#FEE2E2' :
                             status === 'late' ? '#FEF3C7' : '#E5E7EB') : '#F9FAFB'
                        }
                      ]}
                      onPress={() => markAttendance(student.id, status)}
                    >
                      <Text style={[
                        styles.attendanceOptionText,
                        {
                          color: student.status === status ?
                            (status === 'present' ? '#059669' :
                             status === 'absent' ? '#DC2626' :
                             status === 'late' ? '#D97706' : '#374151') : '#6B7280'
                        }
                      ]}>
                        {status === 'present' ? 'P' :
                         status === 'absent' ? 'A' :
                         status === 'late' ? 'L' : 'E'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.attendanceSummary}>
            <Text style={styles.summaryText}>
              Present: {currentAttendance?.presentCount || 0} | 
              Absent: {currentAttendance?.absentCount || 0} | 
              Late: {currentAttendance?.lateCount || 0}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowAttendanceModal(false);
                setCurrentAttendance(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={completeAttendanceSession}
            >
              <Text style={styles.completeButtonText}>Complete Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Communication Hub" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading communication hub...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <SafeAreaView style={styles.container}>
        {renderAppBar()}

        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {renderTabButton('announcements', 'Announcements', '📢')}
            {renderTabButton('attendance', 'Attendance', '✅')}
            {renderTabButton('messaging', 'Messaging', '💬')}
            {renderTabButton('templates', 'Templates', '📝')}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'announcements' && renderAnnouncementsTab()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'messaging' && renderMessagingTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
        </View>

        {renderAnnouncementModal()}
        {renderAttendanceModal()}

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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightTheme.Background,
    gap: Spacing.MD,
  },
  loadingText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.MD,
  },
  header: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  backButton: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#D1FAE5',
    marginTop: 2,
  },
  headerSpacer: {
    width: 48,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.SM,
  },
  tabButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
    minWidth: 90,
  },
  activeTabButton: {
    backgroundColor: LightTheme.PrimaryContainer,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  activeTabText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.LG,
  },
  sectionCard: {
    marginBottom: Spacing.LG,
  },
  createButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },

  // Announcements Styles
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  announcementMeta: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  announcementType: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  announcementDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  announcementMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  deliveryStatus: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  deliveryTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  deliveryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryStat: {
    alignItems: 'center',
    flex: 1,
  },
  deliveryNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  deliveryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  announcementActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },

  // Attendance Styles
  attendanceOverview: {
    marginBottom: Spacing.MD,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceStat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  sessionDate: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  sessionStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  sessionStat: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  statValue: {
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: LightTheme.PrimaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },

  // Student/Messaging Styles
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LightTheme.PrimaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  avatarText: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnPrimaryContainer,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  studentGrade: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  lastSeen: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  studentActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.SecondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 16,
  },

  // Template Styles
  templateType: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  templateSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  templateMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
    marginBottom: Spacing.MD,
    fontStyle: 'italic',
  },
  templateVariables: {
    marginBottom: Spacing.LG,
  },
  variablesTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  variableTag: {
    backgroundColor: LightTheme.TertiaryContainer,
    color: LightTheme.OnTertiaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: 'monospace',
  },
  useTemplateButton: {
    backgroundColor: LightTheme.Tertiary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  useTemplateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnTertiary,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.LG,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.XL,
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  modalSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  inputLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    marginTop: Spacing.MD,
  },
  textInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.MD,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  typeOption: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: '#FFFFFF',
  },
  selectedType: {
    backgroundColor: LightTheme.PrimaryContainer,
    borderColor: LightTheme.Primary,
  },
  typeText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  selectedTypeText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedPriority: {
    backgroundColor: LightTheme.SecondaryContainer,
    borderColor: LightTheme.Secondary,
  },
  priorityText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  selectedPriorityText: {
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  scheduleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginTop: Spacing.LG,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.ErrorContainer,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnErrorContainer,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.Primary,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.Primary,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },

  // Attendance Modal Styles
  studentsList: {
    maxHeight: 300,
    marginBottom: Spacing.LG,
  },
  attendanceStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  attendanceOptions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  attendanceOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  selectedAttendance: {
    borderWidth: 2,
  },
  attendanceOptionText: {
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: '700',
  },
  attendanceSummary: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.LG,
  },
  summaryText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default CommunicationHubScreen;