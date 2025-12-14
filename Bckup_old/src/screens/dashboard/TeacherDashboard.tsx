/**
 * TeacherDashboard - Teacher role interface for coaching platform
 * Based on comprehensive coaching research requirements
 * Features: Control Center, Student Management, Assignment Hub, Communication, AI Assistance
 * User Journey: App Launch → Daily Overview → Class Management → Student Insights → Communication
 * Workflow: Class Preparation → Live Teaching → Post-Class Activities → Student Engagement
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

interface TeacherDashboardProps {
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface ClassSession {
  id: string;
  subject: string;
  grade: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'live' | 'completed';
  studentsCount: number;
  attendanceRate: number;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  overallScore: number;
  recentActivity: string;
  status: 'active' | 'needs-attention' | 'excellent';
  trend: 'up' | 'down' | 'stable';
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  needsGrading: number;
  status: 'active' | 'completed' | 'overdue';
}

interface AIInsight {
  id: string;
  type: 'grading' | 'performance' | 'engagement' | 'suggestion';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherName,
  onNavigate,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'students' | 'assignments' | 'communication'>('overview');

  // Sample data based on coaching platform requirements
  const todayClasses: ClassSession[] = [
    {
      id: '1',
      subject: 'Advanced Mathematics',
      grade: 'Grade 11',
      time: '10:00 AM',
      duration: '90 min',
      status: 'live',
      studentsCount: 24,
      attendanceRate: 92,
    },
    {
      id: '2',
      subject: 'Physics Lab',
      grade: 'Grade 10',
      time: '2:00 PM',
      duration: '60 min',
      status: 'upcoming',
      studentsCount: 18,
      attendanceRate: 88,
    },
    {
      id: '3',
      subject: 'Chemistry Coaching',
      grade: 'Grade 12',
      time: '4:30 PM',
      duration: '75 min',
      status: 'upcoming',
      studentsCount: 21,
      attendanceRate: 95,
    },
  ];

  const students: Student[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      grade: 'Grade 11',
      avatar: '👩‍🎓',
      overallScore: 94,
      recentActivity: 'Submitted Math Assignment',
      status: 'excellent',
      trend: 'up',
    },
    {
      id: '2',
      name: 'Alex Johnson',
      grade: 'Grade 11',
      avatar: '👨‍🎓',
      overallScore: 67,
      recentActivity: 'Missed Physics Lab',
      status: 'needs-attention',
      trend: 'down',
    },
    {
      id: '3',
      name: 'Emily Davis',
      grade: 'Grade 10',
      avatar: '👩‍🎓',
      overallScore: 85,
      recentActivity: 'Completed Practice Test',
      status: 'active',
      trend: 'up',
    },
    {
      id: '4',
      name: 'Michael Brown',
      grade: 'Grade 12',
      avatar: '👨‍🎓',
      overallScore: 78,
      recentActivity: 'Asked doubt in Chemistry',
      status: 'active',
      trend: 'stable',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Calculus Integration Problems',
      subject: 'Mathematics',
      dueDate: 'Tomorrow',
      submittedCount: 18,
      totalStudents: 24,
      needsGrading: 12,
      status: 'active',
    },
    {
      id: '2',
      title: 'Physics Motion Analysis',
      subject: 'Physics',
      dueDate: 'Today',
      submittedCount: 15,
      totalStudents: 18,
      needsGrading: 8,
      status: 'overdue',
    },
    {
      id: '3',
      title: 'Chemical Equations Practice',
      subject: 'Chemistry',
      dueDate: 'Next Week',
      submittedCount: 21,
      totalStudents: 21,
      needsGrading: 0,
      status: 'completed',
    },
  ];

  const aiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'grading',
      title: 'Auto-Grade Physics Quiz',
      description: '15 physics quizzes ready for automated grading',
      action: 'Review & Apply',
      priority: 'high',
    },
    {
      id: '2',
      type: 'performance',
      title: 'Student Performance Alert',
      description: '3 students showing declining performance in Math',
      action: 'View Details',
      priority: 'high',
    },
    {
      id: '3',
      type: 'engagement',
      title: 'Engagement Opportunity',
      description: 'Suggest interactive activities for Chemistry class',
      action: 'Get Suggestions',
      priority: 'medium',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#9E9E9E';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getStudentStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'needs-attention': return '#F44336';
      case 'active': return '#2196F3';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'overdue': return '#F44336';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.teacherName}>{teacherName}</Text>
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{todayClasses.length}</Text>
          <Text style={styles.statLabel}>Classes Today</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Active Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{assignments.filter(a => a.needsGrading > 0).length}</Text>
          <Text style={styles.statLabel}>Need Grading</Text>
        </View>
      </View>
    </View>
  );

  const renderControlCenter = () => (
    <View style={styles.controlSection}>
      <Text style={styles.sectionTitle}>📋 Control Center</Text>
      
      {todayClasses.map((classSession) => (
        <TouchableOpacity 
          key={classSession.id}
          style={[
            styles.classControlCard,
            classSession.status === 'live' && styles.liveClassCard
          ]}
          onPress={() => onNavigate('class-control')}
        >
          <View style={styles.classControlHeader}>
            <View style={styles.classControlInfo}>
              <Text style={styles.classSubject}>{classSession.subject}</Text>
              <Text style={styles.classGrade}>{classSession.grade} • {classSession.studentsCount} students</Text>
              <Text style={styles.classTime}>{classSession.time} • {classSession.duration}</Text>
            </View>
            
            <View style={styles.classControlActions}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(classSession.status) }]}>
                <Text style={styles.statusText}>
                  {classSession.status === 'live' ? 'LIVE' : classSession.status.toUpperCase()}
                </Text>
              </View>
              
              {classSession.status === 'live' && (
                <CoachingButton
                  title="Control Class"
                  variant="primary"
                  size="small"
                  onPress={() => onNavigate('live-control')}
                  style={styles.controlButton}
                />
              )}
              
              {classSession.status === 'upcoming' && (
                <CoachingButton
                  title="Start Class"
                  variant="secondary"
                  size="small"
                  onPress={() => onNavigate('start-class')}
                  style={styles.controlButton}
                />
              )}
            </View>
          </View>

          <View style={styles.attendanceInfo}>
            <Text style={styles.attendanceLabel}>Attendance Rate:</Text>
            <View style={styles.attendanceBar}>
              <View 
                style={[styles.attendanceFill, { width: `${classSession.attendanceRate}%` }]}
              />
            </View>
            <Text style={styles.attendancePercent}>{classSession.attendanceRate}%</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStudentManagement = () => (
    <View style={styles.studentsSection}>
      <Text style={styles.sectionTitle}>👥 Student Management</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentsScroll}>
        {students.map((student) => (
          <TouchableOpacity 
            key={student.id}
            style={styles.studentCard}
            onPress={() => onNavigate('student-detail')}
          >
            <View style={styles.studentHeader}>
              <Text style={styles.studentAvatar}>{student.avatar}</Text>
              <View style={[styles.studentStatus, { backgroundColor: getStudentStatusColor(student.status) }]} />
            </View>
            
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentGrade}>{student.grade}</Text>
            
            <View style={styles.studentScore}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={[styles.scoreValue, { color: getStudentStatusColor(student.status) }]}>
                {student.overallScore}%
              </Text>
            </View>
            
            <Text style={styles.studentActivity}>{student.recentActivity}</Text>
            
            <Text style={styles.studentTrend}>
              {student.trend === 'up' ? '📈' : student.trend === 'down' ? '📉' : '➡️'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAssignmentHub = () => (
    <View style={styles.assignmentsSection}>
      <Text style={styles.sectionTitle}>📝 Assignment Hub</Text>
      
      {assignments.map((assignment) => (
        <TouchableOpacity 
          key={assignment.id}
          style={styles.assignmentCard}
          onPress={() => onNavigate('assignment-detail')}
        >
          <View style={styles.assignmentHeader}>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentTitle}>{assignment.title}</Text>
              <Text style={styles.assignmentSubject}>{assignment.subject} • Due {assignment.dueDate}</Text>
            </View>
            
            <View style={[styles.assignmentStatusBadge, { backgroundColor: getAssignmentStatusColor(assignment.status) }]}>
              <Text style={styles.assignmentStatusText}>{assignment.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.assignmentProgress}>
            <Text style={styles.submissionText}>
              {assignment.submittedCount}/{assignment.totalStudents} submitted
            </Text>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(assignment.submittedCount / assignment.totalStudents) * 100}%` }
                ]}
              />
            </View>
            
            {assignment.needsGrading > 0 && (
              <Text style={styles.gradingNeeded}>
                {assignment.needsGrading} need grading
              </Text>
            )}
          </View>

          {assignment.needsGrading > 0 && (
            <CoachingButton
              title="Grade Submissions"
              variant="secondary"
              size="small"
              onPress={() => onNavigate('grade-assignment')}
              style={styles.gradeButton}
            />
          )}
        </TouchableOpacity>
      ))}

      <CoachingButton
        title="+ Create New Assignment"
        variant="primary"
        size="medium"
        onPress={() => onNavigate('create-assignment')}
        style={styles.createAssignmentButton}
      />
    </View>
  );

  const renderAIAssistance = () => (
    <View style={styles.aiSection}>
      <Text style={styles.sectionTitle}>🤖 AI Teaching Assistant</Text>
      
      {aiInsights.map((insight) => (
        <TouchableOpacity 
          key={insight.id}
          style={styles.aiInsightCard}
          onPress={() => onNavigate('ai-insight')}
        >
          <View style={styles.aiInsightHeader}>
            <View style={styles.aiInsightInfo}>
              <Text style={styles.aiInsightTitle}>{insight.title}</Text>
              <Text style={styles.aiInsightDescription}>{insight.description}</Text>
            </View>
            
            <View style={styles.aiInsightMeta}>
              <Text style={styles.aiInsightType}>
                {insight.type === 'grading' ? '📊' :
                 insight.type === 'performance' ? '📈' :
                 insight.type === 'engagement' ? '🎯' : '💡'}
              </Text>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(insight.priority) }]} />
            </View>
          </View>
          
          <CoachingButton
            title={insight.action}
            variant="role-based"
            size="small"
            onPress={() => onNavigate('ai-action')}
            style={styles.aiActionButton}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'overview', label: 'Overview', icon: '📊' },
        { key: 'students', label: 'Students', icon: '👥' },
        { key: 'assignments', label: 'Assignments', icon: '📝' },
        { key: 'communication', label: 'Messages', icon: '💬' },
      ].map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            selectedTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('take-attendance')}
        >
          <Text style={styles.quickActionIcon}>✅</Text>
          <Text style={styles.quickActionTitle}>Take Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('send-announcement')}
        >
          <Text style={styles.quickActionIcon}>📢</Text>
          <Text style={styles.quickActionTitle}>Send Announcement</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('schedule-class')}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionTitle}>Schedule Class</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('view-reports')}
        >
          <Text style={styles.quickActionIcon}>📈</Text>
          <Text style={styles.quickActionTitle}>View Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabNavigation()}
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'overview' && (
            <>
              {renderControlCenter()}
              {renderQuickActions()}
              {renderAIAssistance()}
            </>
          )}
          
          {selectedTab === 'students' && renderStudentManagement()}
          {selectedTab === 'assignments' && renderAssignmentHub()}
          {selectedTab === 'communication' && (
            <View style={styles.comingSoonSection}>
              <Text style={styles.comingSoonTitle}>💬 Communication Center</Text>
              <Text style={styles.comingSoonText}>
                Multi-channel messaging system coming in next update
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XL,
  },
  greetingContainer: {
    marginBottom: Spacing.LG,
  },
  greetingText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  teacherName: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.SurfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#7C4DFF',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  activeTabLabel: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  controlSection: {
    padding: Spacing.LG,
  },
  classControlCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  liveClassCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  classControlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  classControlInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  classGrade: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  classTime: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  classControlActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controlButton: {
    minWidth: 100,
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginRight: Spacing.SM,
  },
  attendanceBar: {
    flex: 1,
    height: 6,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 3,
    marginRight: Spacing.SM,
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  attendancePercent: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    minWidth: 35,
  },
  studentsSection: {
    padding: Spacing.LG,
  },
  studentsScroll: {
    marginTop: Spacing.MD,
  },
  studentCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginRight: Spacing.MD,
    width: width * 0.4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  studentAvatar: {
    fontSize: 32,
  },
  studentStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  studentName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  studentGrade: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  studentScore: {
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  scoreLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  scoreValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
  },
  studentActivity: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  studentTrend: {
    textAlign: 'center',
    fontSize: 16,
  },
  assignmentsSection: {
    padding: Spacing.LG,
  },
  assignmentCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  assignmentSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  assignmentStatusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  assignmentStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assignmentProgress: {
    marginBottom: Spacing.MD,
  },
  submissionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  progressBar: {
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    marginBottom: Spacing.XS,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C4DFF',
    borderRadius: 4,
  },
  gradingNeeded: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#F44336',
    fontWeight: '600',
  },
  gradeButton: {
    alignSelf: 'flex-start',
  },
  createAssignmentButton: {
    marginTop: Spacing.MD,
  },
  quickActionsSection: {
    padding: Spacing.LG,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.MD,
  },
  quickActionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: (width - Spacing.LG * 2 - Spacing.MD) / 2,
    marginBottom: Spacing.MD,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  quickActionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  aiSection: {
    padding: Spacing.LG,
  },
  aiInsightCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  aiInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  aiInsightInfo: {
    flex: 1,
  },
  aiInsightTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  aiInsightDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  aiInsightMeta: {
    alignItems: 'center',
  },
  aiInsightType: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aiActionButton: {
    alignSelf: 'flex-start',
  },
  comingSoonSection: {
    padding: Spacing.LG,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  comingSoonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
});

export default TeacherDashboard;