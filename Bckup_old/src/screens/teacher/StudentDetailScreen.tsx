/**
 * StudentDetailScreen - Phase 31.1: Individual Student Tracking
 * Comprehensive student profiles with academic performance, intervention tools
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
  Image,
  FlatList,
  Dimensions,
  Modal,
  BackHandler,
  Linking,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

interface StudentDetailScreenProps {
  studentId: string;
  teacherId: string;
  onNavigate: (screen: string) => void;
}

interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  rollNumber: string;
  parentContact: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  joiningDate: string;
  currentStatus: 'active' | 'inactive' | 'suspended';
  riskLevel: 'low' | 'medium' | 'high';
}

interface AcademicPerformance {
  subject: string;
  currentGrade: number;
  previousGrade: number;
  trend: 'improving' | 'stable' | 'declining';
  attendance: number;
  assignments: {
    completed: number;
    total: number;
    averageScore: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface AttendanceRecord {
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
  duration?: number;
}

interface CommunicationLog {
  id: string;
  date: Date;
  type: 'parent-meeting' | 'phone-call' | 'email' | 'in-person' | 'emergency';
  participants: string[];
  subject: string;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments?: string[];
}

interface InterventionPlan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed' | 'paused';
  milestones: {
    id: string;
    description: string;
    targetDate: Date;
    completed: boolean;
    completedDate?: Date;
  }[];
  resources: string[];
  assignedTo: string[];
  progress: number;
}

export const StudentDetailScreen: React.FC<StudentDetailScreenProps> = ({
  studentId,
  teacherId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'attendance' | 'communication' | 'intervention'>('overview');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [performance, setPerformance] = useState<AcademicPerformance[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [interventions, setInterventions] = useState<InterventionPlan[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showContactModal) {
        setShowContactModal(false);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showContactModal]);

  const cleanup = useCallback(() => {
    // Cleanup any active resources
  }, []);

  const loadStudentData = async () => {
    try {
      // Simulate API calls to load student data
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with actual API calls
      setStudent({
        id: studentId,
        name: 'Arjun Sharma',
        avatar: 'https://example.com/avatar.jpg',
        grade: '10th Standard',
        rollNumber: 'MS2024001',
        parentContact: '+91 98765 43210',
        email: 'arjun.sharma@student.manushi.edu',
        dateOfBirth: '2008-03-15',
        address: '123, Model Town, New Delhi - 110009',
        emergencyContact: '+91 98765 43211',
        joiningDate: '2023-04-01',
        currentStatus: 'active',
        riskLevel: 'medium',
      });

      setPerformance([
        {
          subject: 'Mathematics',
          currentGrade: 85,
          previousGrade: 78,
          trend: 'improving',
          attendance: 94,
          assignments: { completed: 18, total: 20, averageScore: 82 },
          strengths: ['Algebra', 'Geometry'],
          weaknesses: ['Trigonometry', 'Statistics'],
          recommendations: ['Additional practice in trigonometry', 'Consider advanced algebra topics']
        },
        {
          subject: 'Physics',
          currentGrade: 78,
          previousGrade: 82,
          trend: 'declining',
          attendance: 89,
          assignments: { completed: 16, total: 18, averageScore: 76 },
          strengths: ['Mechanics', 'Optics'],
          weaknesses: ['Electricity', 'Modern Physics'],
          recommendations: ['Extra sessions on electricity', 'Lab work improvement needed']
        },
        {
          subject: 'Chemistry',
          currentGrade: 88,
          previousGrade: 85,
          trend: 'improving',
          attendance: 96,
          assignments: { completed: 19, total: 20, averageScore: 87 },
          strengths: ['Organic Chemistry', 'Physical Chemistry'],
          weaknesses: ['Inorganic Chemistry'],
          recommendations: ['Maintain current performance', 'Focus on periodic table trends']
        }
      ]);

      setAttendance([
        { date: new Date('2024-09-02'), status: 'present' },
        { date: new Date('2024-09-01'), status: 'late', reason: 'Transport delay', duration: 15 },
        { date: new Date('2024-08-31'), status: 'absent', reason: 'Medical appointment' },
        { date: new Date('2024-08-30'), status: 'present' },
        { date: new Date('2024-08-29'), status: 'present' }
      ]);

      setCommunications([
        {
          id: '1',
          date: new Date('2024-08-28'),
          type: 'parent-meeting',
          participants: ['Mr. Sharma (Father)', 'Mrs. Sharma (Mother)'],
          subject: 'Mid-term Progress Discussion',
          summary: 'Discussed Arjun\'s declining physics performance. Parents agreed to arrange extra coaching.',
          followUpRequired: true,
          followUpDate: new Date('2024-09-15')
        },
        {
          id: '2',
          date: new Date('2024-08-20'),
          type: 'phone-call',
          participants: ['Mrs. Sharma (Mother)'],
          subject: 'Attendance Concern',
          summary: 'Called to discuss recent absences. Mother informed about medical treatments.',
          followUpRequired: false
        }
      ]);

      setInterventions([
        {
          id: '1',
          title: 'Physics Performance Improvement',
          description: 'Structured plan to improve physics grades through targeted practice and additional support',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-11-30'),
          status: 'active',
          progress: 25,
          milestones: [
            {
              id: '1',
              description: 'Complete diagnostic assessment',
              targetDate: new Date('2024-09-10'),
              completed: true,
              completedDate: new Date('2024-09-08')
            },
            {
              id: '2',
              description: 'Begin extra physics sessions',
              targetDate: new Date('2024-09-15'),
              completed: false
            },
            {
              id: '3',
              description: 'Mid-intervention assessment',
              targetDate: new Date('2024-10-15'),
              completed: false
            }
          ],
          resources: ['Physics workbook', 'Online simulation tools', 'Peer study group'],
          assignedTo: ['Physics Teacher', 'Academic Coordinator']
        }
      ]);

    } catch (error) {
      Alert.alert('error', 'Failed to load student data');
      showSnackbar('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleContactParent = (type: 'call' | 'email' | 'meeting') => {
    setShowContactModal(false);
    Alert.alert(
      'Contact Parent',
      `Initiating ${type} with student's parents. This will be logged in communication history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => {
          // Add to communication log
          Alert.alert('success', `${type} initiated and logged successfully.`);
        }}
      ]
    );
  };

  const handleEmailParent = async () => {
    try {
      if (!student?.email) {
        showSnackbar('Student email not available');
        return;
      }

      const subject = `Regarding ${student.name} - ${student.grade}`;
      const body = `Dear Parent,\n\nI am writing to discuss ${student.name}'s academic progress.\n\nBest regards,\nTeacher`;

      const emailUrl = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(emailUrl);

      if (canOpen) {
        await Linking.openURL(emailUrl);
        showSnackbar('Opening email client...');
      } else {
        showSnackbar('No email app available');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      showSnackbar('Failed to open email client');
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content
        title="Student Details"
        subtitle={student?.name || 'Loading...'}
      />
      <Appbar.Action
        icon="phone"
        onPress={() => setShowContactModal(true)}
      />
      <Appbar.Action
        icon="email"
        onPress={handleEmailParent}
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

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📋 Student Profile" style={styles.sectionCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {student?.name?.split(' ').map(n => n?.[0] || '').join('') || 'U'}
              </Text>
            </View>
            <View style={[styles.statusIndicator, {
              backgroundColor: student?.riskLevel === 'high' ? '#EF4444' : 
                              student?.riskLevel === 'medium' ? '#F59E0B' : '#10B981'
            }]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{student?.name}</Text>
            <Text style={styles.studentGrade}>{student?.grade}</Text>
            <Text style={styles.rollNumber}>Roll No: {student?.rollNumber}</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status: </Text>
              <Text style={[styles.statusValue, {
                color: student?.currentStatus === 'active' ? '#10B981' : '#EF4444'
              }]}>
                {student?.currentStatus?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>📞 Parent Contact:</Text>
            <Text style={styles.contactValue}>{student?.parentContact}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>📧 Email:</Text>
            <Text style={styles.contactValue}>{student?.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>🏠 Address:</Text>
            <Text style={styles.contactValue}>{student?.address}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => setShowContactModal(true)}
        >
          <Text style={styles.contactButtonText}>📞 Contact Parent</Text>
        </TouchableOpacity>
      </DashboardCard>

      <DashboardCard title="📊 Quick Performance Summary" style={styles.sectionCard}>
        <View style={styles.performanceSummary}>
          {performance.slice(0, 3).map((subject, index) => (
            <View key={index} style={styles.subjectSummary}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <Text style={[styles.trendIndicator, {
                  color: subject.trend === 'improving' ? '#10B981' : 
                        subject.trend === 'declining' ? '#EF4444' : '#6B7280'
                }]}>
                  {subject.trend === 'improving' ? '📈' : 
                   subject.trend === 'declining' ? '📉' : '➡️'}
                </Text>
              </View>
              <Text style={styles.currentGrade}>Current: {subject.currentGrade}%</Text>
              <Text style={styles.attendance}>Attendance: {subject.attendance}%</Text>
            </View>
          ))}
        </View>
      </DashboardCard>

      <DashboardCard title="⚠️ At-Risk Assessment" style={styles.sectionCard}>
        <View style={styles.riskAssessment}>
          <View style={[styles.riskIndicator, {
            backgroundColor: student?.riskLevel === 'high' ? '#FEE2E2' : 
                            student?.riskLevel === 'medium' ? '#FEF3C7' : '#D1FAE5'
          }]}>
            <Text style={[styles.riskLevel, {
              color: student?.riskLevel === 'high' ? '#DC2626' : 
                     student?.riskLevel === 'medium' ? '#D97706' : '#059669'
            }]}>
              {student?.riskLevel?.toUpperCase()} RISK
            </Text>
          </View>
          <Text style={styles.riskDescription}>
            {student?.riskLevel === 'high' ? 'Requires immediate intervention and close monitoring' :
             student?.riskLevel === 'medium' ? 'Needs additional support and regular check-ins' :
             'Performing well with standard support'}
          </Text>
        </View>
      </DashboardCard>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {performance.map((subject, index) => (
        <DashboardCard key={index} title={`📚 ${subject.subject}`} style={styles.sectionCard}>
          <View style={styles.performanceDetail}>
            <View style={styles.gradeSection}>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeLabel}>Current Grade</Text>
                <Text style={styles.gradeValue}>{subject.currentGrade}%</Text>
              </View>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeLabel}>Previous Grade</Text>
                <Text style={styles.gradeValue}>{subject.previousGrade}%</Text>
              </View>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeLabel}>Trend</Text>
                <Text style={[styles.trendValue, {
                  color: subject.trend === 'improving' ? '#10B981' : 
                        subject.trend === 'declining' ? '#EF4444' : '#6B7280'
                }]}>
                  {subject.trend === 'improving' ? '↗️ Improving' : 
                   subject.trend === 'declining' ? '↘️ Declining' : '➡️ Stable'}
                </Text>
              </View>
            </View>

            <View style={styles.assignmentSection}>
              <Text style={styles.sectionTitle}>Assignment Performance</Text>
              <Text style={styles.assignmentText}>
                Completed: {subject.assignments.completed}/{subject.assignments.total} assignments
              </Text>
              <Text style={styles.assignmentText}>
                Average Score: {subject.assignments.averageScore}%
              </Text>
              <Text style={styles.assignmentText}>
                Attendance: {subject.attendance}%
              </Text>
            </View>

            <View style={styles.strengthsSection}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              {subject.strengths.map((strength, i) => (
                <Text key={i} style={styles.strengthItem}>✅ {strength}</Text>
              ))}
            </View>

            <View style={styles.weaknessesSection}>
              <Text style={styles.sectionTitle}>Areas for Improvement</Text>
              {subject.weaknesses.map((weakness, i) => (
                <Text key={i} style={styles.weaknessItem}>⚠️ {weakness}</Text>
              ))}
            </View>

            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {subject.recommendations.map((rec, i) => (
                <Text key={i} style={styles.recommendationItem}>💡 {rec}</Text>
              ))}
            </View>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderAttendanceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📅 Attendance Records" style={styles.sectionCard}>
        <View style={styles.attendanceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>94%</Text>
            <Text style={styles.statLabel}>Overall Attendance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Days Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Late Arrivals</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Records</Text>
        {attendance.map((record, index) => (
          <View key={index} style={styles.attendanceRecord}>
            <View style={styles.recordDate}>
              <Text style={styles.dateText}>{record.date.toDateString()}</Text>
            </View>
            <View style={styles.recordStatus}>
              <Text style={[styles.statusBadge, {
                backgroundColor: record.status === 'present' ? '#D1FAE5' :
                               record.status === 'late' ? '#FEF3C7' :
                               record.status === 'absent' ? '#FEE2E2' : '#E5E7EB',
                color: record.status === 'present' ? '#059669' :
                       record.status === 'late' ? '#D97706' :
                       record.status === 'absent' ? '#DC2626' : '#374151'
              }]}>
                {record.status.toUpperCase()}
              </Text>
            </View>
            {record.reason && (
              <Text style={styles.recordReason}>Reason: {record.reason}</Text>
            )}
          </View>
        ))}
      </DashboardCard>
    </ScrollView>
  );

  const renderCommunicationTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="💬 Communication History" style={styles.sectionCard}>
        <TouchableOpacity 
          style={styles.addCommunicationButton}
          onPress={() => Alert.alert('Add Communication', 'Feature to add new communication log')}
        >
          <Text style={styles.addCommunicationText}>+ Add New Communication</Text>
        </TouchableOpacity>

        {communications.map((comm) => (
          <View key={comm.id} style={styles.communicationItem}>
            <View style={styles.commHeader}>
              <Text style={styles.commDate}>{comm.date.toDateString()}</Text>
              <Text style={[styles.commType, {
                backgroundColor: comm.type === 'emergency' ? '#FEE2E2' :
                               comm.type === 'parent-meeting' ? '#E0E7FF' :
                               comm.type === 'phone-call' ? '#FEF3C7' : '#F3F4F6',
                color: comm.type === 'emergency' ? '#DC2626' :
                       comm.type === 'parent-meeting' ? '#4338CA' :
                       comm.type === 'phone-call' ? '#D97706' : '#374151'
              }]}>
                {comm.type.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.commSubject}>{comm.subject}</Text>
            <Text style={styles.commParticipants}>
              Participants: {comm.participants.join(', ')}
            </Text>
            <Text style={styles.commSummary}>{comm.summary}</Text>
            
            {comm.followUpRequired && (
              <View style={styles.followUpAlert}>
                <Text style={styles.followUpText}>
                  ⏰ Follow-up required by: {comm.followUpDate?.toDateString()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </DashboardCard>
    </ScrollView>
  );

  const renderInterventionTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="🎯 Intervention Plans" style={styles.sectionCard}>
        <TouchableOpacity 
          style={styles.addInterventionButton}
          onPress={() => Alert.alert('Create Intervention', 'Feature to create new intervention plan')}
        >
          <Text style={styles.addInterventionText}>+ Create New Intervention</Text>
        </TouchableOpacity>

        {interventions.map((intervention) => (
          <View key={intervention.id} style={styles.interventionItem}>
            <View style={styles.interventionHeader}>
              <Text style={styles.interventionTitle}>{intervention.title}</Text>
              <Text style={[styles.interventionStatus, {
                backgroundColor: intervention.status === 'active' ? '#D1FAE5' :
                               intervention.status === 'completed' ? '#E0E7FF' :
                               intervention.status === 'paused' ? '#FEF3C7' : '#F3F4F6',
                color: intervention.status === 'active' ? '#059669' :
                       intervention.status === 'completed' ? '#4338CA' :
                       intervention.status === 'paused' ? '#D97706' : '#374151'
              }]}>
                {intervention.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.interventionDescription}>{intervention.description}</Text>
            
            <View style={styles.interventionDates}>
              <Text style={styles.dateRange}>
                📅 {intervention.startDate.toDateString()} - {intervention.endDate.toDateString()}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress: {intervention.progress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${intervention.progress}%` }]} />
              </View>
            </View>

            <View style={styles.milestonesSection}>
              <Text style={styles.sectionTitle}>Milestones</Text>
              {intervention.milestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <Text style={styles.milestoneIcon}>
                    {milestone.completed ? '✅' : '🔲'}
                  </Text>
                  <View style={styles.milestoneContent}>
                    <Text style={[styles.milestoneDescription, {
                      textDecorationLine: milestone.completed ? 'line-through' : 'none',
                      color: milestone.completed ? '#6B7280' : LightTheme.OnSurface
                    }]}>
                      {milestone.description}
                    </Text>
                    <Text style={styles.milestoneDate}>
                      Target: {milestone.targetDate.toDateString()}
                    </Text>
                    {milestone.completedDate && (
                      <Text style={styles.completedDate}>
                        Completed: {milestone.completedDate.toDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.resourcesSection}>
              <Text style={styles.sectionTitle}>Resources</Text>
              {intervention.resources.map((resource, i) => (
                <Text key={i} style={styles.resourceItem}>📚 {resource}</Text>
              ))}
            </View>

            <View style={styles.assignedSection}>
              <Text style={styles.sectionTitle}>Assigned To</Text>
              <Text style={styles.assignedList}>{intervention.assignedTo.join(', ')}</Text>
            </View>
          </View>
        ))}
      </DashboardCard>
    </ScrollView>
  );

  const renderContactModal = () => (
    <Modal
      visible={showContactModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowContactModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Contact Parent</Text>
          <Text style={styles.modalSubtitle}>Choose communication method:</Text>
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => handleContactParent('call')}
          >
            <Text style={styles.modalOptionIcon}>📞</Text>
            <Text style={styles.modalOptionText}>Phone Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => handleContactParent('email')}
          >
            <Text style={styles.modalOptionIcon}>📧</Text>
            <Text style={styles.modalOptionText}>Send Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => handleContactParent('meeting')}
          >
            <Text style={styles.modalOptionIcon}>👥</Text>
            <Text style={styles.modalOptionText}>Schedule Meeting</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalCancelButton}
            onPress={() => setShowContactModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
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
          <Appbar.Content title="Student Details" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading student details...</Text>
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
            {renderTabButton('overview', 'Overview', '👤')}
            {renderTabButton('performance', 'Performance', '📊')}
            {renderTabButton('attendance', 'Attendance', '📅')}
            {renderTabButton('communication', 'Communication', '💬')}
            {renderTabButton('intervention', 'Intervention', '🎯')}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'communication' && renderCommunicationTab()}
          {activeTab === 'intervention' && renderInterventionTab()}
        </View>

        {renderContactModal()}

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
    minWidth: 80,
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

  // Profile Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LightTheme.PrimaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.LG,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LightTheme.OnPrimaryContainer,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  studentGrade: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  rollNumber: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  statusValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  contactInfo: {
    marginBottom: Spacing.LG,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  contactLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    width: 120,
  },
  contactValue: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  contactButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },

  // Performance Summary Styles
  performanceSummary: {
    gap: Spacing.MD,
  },
  subjectSummary: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  subjectName: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  trendIndicator: {
    fontSize: 16,
  },
  currentGrade: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  attendance: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },

  // Risk Assessment Styles
  riskAssessment: {
    alignItems: 'center',
  },
  riskIndicator: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.SM,
  },
  riskLevel: {
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: '700',
  },
  riskDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },

  // Performance Detail Styles
  performanceDetail: {
    gap: Spacing.LG,
  },
  gradeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradeInfo: {
    alignItems: 'center',
    flex: 1,
  },
  gradeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  gradeValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  trendValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  assignmentSection: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  sectionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  assignmentText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  strengthsSection: {
    backgroundColor: '#D1FAE5',
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  strengthItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#059669',
    marginBottom: Spacing.XS,
  },
  weaknessesSection: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  weaknessItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#D97706',
    marginBottom: Spacing.XS,
  },
  recommendationsSection: {
    backgroundColor: '#E0E7FF',
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  recommendationItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#4338CA',
    marginBottom: Spacing.XS,
  },

  // Attendance Styles
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  attendanceRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  recordDate: {
    flex: 2,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  recordStatus: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  recordReason: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    flex: 2,
    textAlign: 'right',
  },

  // Communication Styles
  addCommunicationButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  addCommunicationText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  communicationItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  commHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  commDate: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  commType: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  commSubject: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  commParticipants: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  commSummary: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  followUpAlert: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  followUpText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#92400E',
    fontWeight: '600',
  },

  // Intervention Styles
  addInterventionButton: {
    backgroundColor: LightTheme.Secondary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  addInterventionText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSecondary,
    fontWeight: '600',
  },
  interventionItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.LG,
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  interventionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
    marginRight: Spacing.SM,
  },
  interventionStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  interventionDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  interventionDates: {
    marginBottom: Spacing.MD,
  },
  dateRange: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  progressSection: {
    marginBottom: Spacing.MD,
  },
  progressLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LightTheme.Primary,
  },
  milestonesSection: {
    marginBottom: Spacing.MD,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  milestoneIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
    marginTop: 2,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.XS,
  },
  milestoneDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  completedDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#059669',
    fontWeight: '600',
  },
  resourcesSection: {
    marginBottom: Spacing.MD,
  },
  resourceItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  assignedSection: {
    marginBottom: Spacing.MD,
  },
  assignedList: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.XL,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  modalSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XL,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.SM,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: Spacing.LG,
  },
  modalOptionText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modalCancelButton: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
    backgroundColor: LightTheme.ErrorContainer,
  },
  modalCancelText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnErrorContainer,
    fontWeight: '600',
  },
});

export default StudentDetailScreen;