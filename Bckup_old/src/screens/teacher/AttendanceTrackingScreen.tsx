/**
 * AttendanceTrackingScreen - Phase 31.2: Advanced Attendance Management
 * Comprehensive attendance tracking with analytics and automated reporting
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
  Modal,
  FlatList,
  Dimensions,
  TextInput,
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';

// Import Supabase services (requires attendance service creation)
import { useAuth } from '../../context/AuthContext';
// TODO: Create attendance services for: getStudentAttendance, getClassSessions, getAttendanceAlerts, markAttendance

const { width } = Dimensions.get('window');

interface AttendanceTrackingScreenProps {
  teacherId: string;
  onNavigate: (screen: string) => void;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  rollNumber: string;
  grade: string;
  parentContact: string;
  overallAttendance: number;
  monthlyAttendance: number;
  weeklyAttendance: number;
  consecutiveAbsent: number;
  lastPresent: Date;
  attendanceStatus: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  attendanceHistory: AttendanceRecord[];
}

interface AttendanceRecord {
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  arrivalTime?: Date;
  reason?: string;
  markedBy: string;
  modifiedAt?: Date;
  notes?: string;
}

interface ClassSession {
  id: string;
  className: string;
  subject: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface AttendanceReport {
  id: string;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  averageAttendance: number;
  studentsAtRisk: number;
  perfectAttendance: number;
  generatedAt: Date;
}

interface AttendanceAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: 'consecutive-absence' | 'low-attendance' | 'sudden-drop' | 'pattern-change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
  createdAt: Date;
  acknowledged: boolean;
}

export const AttendanceTrackingScreen: React.FC<AttendanceTrackingScreenProps> = ({
  teacherId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'sessions' | 'reports' | 'alerts'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showStudentModal || showReportModal) {
        setShowStudentModal(false);
        setShowReportModal(false);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showStudentModal, showReportModal]);

  const cleanup = useCallback(() => {
    // Cleanup any active resources
  }, []);

  useEffect(() => {
    loadAttendanceData();
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

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with actual API calls
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Arjun Sharma',
          avatar: 'AS',
          rollNumber: 'MS2024001',
          grade: '10th',
          parentContact: '+91 98765 43210',
          overallAttendance: 94,
          monthlyAttendance: 90,
          weeklyAttendance: 100,
          consecutiveAbsent: 0,
          lastPresent: new Date('2024-09-03'),
          attendanceStatus: 'excellent',
          attendanceHistory: [
            { date: new Date('2024-09-03'), status: 'present', arrivalTime: new Date('2024-09-03T09:00:00'), markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-02'), status: 'late', arrivalTime: new Date('2024-09-02T09:15:00'), markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-01'), status: 'absent', reason: 'Medical appointment', markedBy: 'Dr. Sarah Wilson' }
          ]
        },
        {
          id: '2',
          name: 'Priya Patel',
          avatar: 'PP',
          rollNumber: 'MS2024002',
          grade: '10th',
          parentContact: '+91 98765 43211',
          overallAttendance: 78,
          monthlyAttendance: 75,
          weeklyAttendance: 60,
          consecutiveAbsent: 2,
          lastPresent: new Date('2024-08-30'),
          attendanceStatus: 'average',
          attendanceHistory: [
            { date: new Date('2024-09-03'), status: 'absent', reason: 'Family emergency', markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-02'), status: 'absent', reason: 'Illness', markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-01'), status: 'present', arrivalTime: new Date('2024-09-01T08:55:00'), markedBy: 'Dr. Sarah Wilson' }
          ]
        },
        {
          id: '3',
          name: 'Rahul Kumar',
          avatar: 'RK',
          rollNumber: 'MS2024003',
          grade: '10th',
          parentContact: '+91 98765 43212',
          overallAttendance: 65,
          monthlyAttendance: 60,
          weeklyAttendance: 40,
          consecutiveAbsent: 1,
          lastPresent: new Date('2024-09-02'),
          attendanceStatus: 'poor',
          attendanceHistory: [
            { date: new Date('2024-09-03'), status: 'absent', markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-02'), status: 'present', arrivalTime: new Date('2024-09-02T09:30:00'), markedBy: 'Dr. Sarah Wilson' },
            { date: new Date('2024-09-01'), status: 'late', arrivalTime: new Date('2024-09-01T09:45:00'), markedBy: 'Dr. Sarah Wilson' }
          ]
        }
      ];

      setStudents(mockStudents);

      setClassSessions([
        {
          id: '1',
          className: 'Mathematics Advanced',
          subject: 'Mathematics',
          date: new Date('2024-09-03'),
          startTime: new Date('2024-09-03T09:00:00'),
          endTime: new Date('2024-09-03T10:30:00'),
          totalStudents: 28,
          presentCount: 25,
          absentCount: 2,
          lateCount: 1,
          excusedCount: 0,
          attendanceRate: 89.3,
          status: 'completed'
        },
        {
          id: '2',
          className: 'Physics Mechanics',
          subject: 'Physics',
          date: new Date('2024-09-02'),
          startTime: new Date('2024-09-02T11:00:00'),
          endTime: new Date('2024-09-02T12:30:00'),
          totalStudents: 30,
          presentCount: 27,
          absentCount: 2,
          lateCount: 1,
          excusedCount: 0,
          attendanceRate: 90.0,
          status: 'completed'
        }
      ]);

      setReports([
        {
          id: '1',
          title: 'Monthly Attendance Report - August 2024',
          period: 'monthly',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-31'),
          totalSessions: 22,
          averageAttendance: 85.5,
          studentsAtRisk: 8,
          perfectAttendance: 12,
          generatedAt: new Date('2024-09-01')
        },
        {
          id: '2',
          title: 'Weekly Attendance Summary - Week 35',
          period: 'weekly',
          startDate: new Date('2024-08-26'),
          endDate: new Date('2024-09-01'),
          totalSessions: 5,
          averageAttendance: 87.2,
          studentsAtRisk: 5,
          perfectAttendance: 18,
          generatedAt: new Date('2024-09-02')
        }
      ]);

      setAlerts([
        {
          id: '1',
          studentId: '2',
          studentName: 'Priya Patel',
          type: 'consecutive-absence',
          severity: 'high',
          message: 'Student has been absent for 2 consecutive days',
          suggestedAction: 'Contact parent immediately to check on student wellbeing',
          createdAt: new Date('2024-09-03T10:00:00'),
          acknowledged: false
        },
        {
          id: '2',
          studentId: '3',
          studentName: 'Rahul Kumar',
          type: 'low-attendance',
          severity: 'critical',
          message: 'Overall attendance has dropped below 70% threshold',
          suggestedAction: 'Schedule parent meeting to discuss intervention strategies',
          createdAt: new Date('2024-09-02T14:30:00'),
          acknowledged: false
        }
      ]);

    } catch (error) {
      Alert.alert('error', 'Failed to load attendance data');
      showSnackbar('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return '#10B981'; // Excellent - Green
    if (percentage >= 85) return '#059669'; // Good - Dark Green
    if (percentage >= 75) return '#F59E0B'; // Average - Yellow
    if (percentage >= 65) return '#EF4444'; // Poor - Red
    return '#DC2626'; // Critical - Dark Red
  };

  const getStatusColor = (status: Student['attendanceStatus']) => {
    switch (status) {
      case 'excellent': return '#10B981';
      case 'good': return '#059669';
      case 'average': return '#F59E0B';
      case 'poor': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    Alert.alert('Alert Acknowledged', 'Alert has been marked as acknowledged');
  };

  const generateReport = (type: AttendanceReport['period']) => {
    const newReport: AttendanceReport = {
      id: Date.now().toString(),
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Attendance Report - ${new Date().toLocaleDateString()}`,
      period: type,
      startDate: new Date(),
      endDate: new Date(),
      totalSessions: Math.floor(Math.random() * 20) + 10,
      averageAttendance: Math.floor(Math.random() * 20) + 75,
      studentsAtRisk: Math.floor(Math.random() * 10) + 3,
      perfectAttendance: Math.floor(Math.random() * 15) + 5,
      generatedAt: new Date()
    };

    setReports(prev => [newReport, ...prev]);
    Alert.alert('Report Generated', `${type} report has been generated successfully`);
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content
        title="Attendance Tracking"
        subtitle="Advanced attendance analytics"
      />
      <Appbar.Action
        icon="chart-bar"
        onPress={() => setActiveTab('reports')}
      />
      <Appbar.Action
        icon="alert"
        onPress={() => setActiveTab('alerts')}
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
      <DashboardCard title="📊 Attendance Overview" style={styles.sectionCard}>
        <View style={styles.overviewStats}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {Math.round(students.reduce((sum, s) => sum + s.overallAttendance, 0) / students.length)}%
            </Text>
            <Text style={styles.statLabel}>Class Average</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>
              {students.filter(s => s.attendanceStatus === 'excellent' || s.attendanceStatus === 'good').length}
            </Text>
            <Text style={styles.statLabel}>Good Standing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              {students.filter(s => s.attendanceStatus === 'poor' || s.attendanceStatus === 'critical').length}
            </Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#DC2626' }]}>
              {alerts.filter(a => !a.acknowledged).length}
            </Text>
            <Text style={styles.statLabel}>New Alerts</Text>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="📈 Attendance Trends" style={styles.sectionCard}>
        <View style={styles.trendChart}>
          <Text style={styles.trendTitle}>Last 7 Days Average</Text>
          <View style={styles.trendBars}>
            {[92, 88, 94, 87, 91, 89, 93].map((value, index) => (
              <View key={index} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    { height: `${value}%`, backgroundColor: getAttendanceColor(value) }
                  ]}
                />
                <Text style={styles.trendBarLabel}>{value}%</Text>
                <Text style={styles.trendBarDay}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="⚠️ Recent Alerts" style={styles.sectionCard}>
        {alerts.slice(0, 3).map((alert) => (
          <View key={alert.id} style={[styles.alertItem, { opacity: alert.acknowledged ? 0.6 : 1 }]}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertSeverity, {
                backgroundColor: alert.severity === 'critical' ? '#FEE2E2' :
                               alert.severity === 'high' ? '#FEF3C7' :
                               alert.severity === 'medium' ? '#E0E7FF' : '#F3F4F6',
                color: alert.severity === 'critical' ? '#DC2626' :
                       alert.severity === 'high' ? '#D97706' :
                       alert.severity === 'medium' ? '#4338CA' : '#374151'
              }]}>
                {alert.severity.toUpperCase()}
              </Text>
              <Text style={styles.alertTime}>
                {alert.createdAt.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.alertStudent}>{alert.studentName}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            {!alert.acknowledged && (
              <TouchableOpacity
                style={styles.acknowledgeButton}
                onPress={() => handleAcknowledgeAlert(alert.id)}
              >
                <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.viewAllAlertsButton}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={styles.viewAllAlertsText}>View All Alerts ({alerts.length})</Text>
        </TouchableOpacity>
      </DashboardCard>
    </ScrollView>
  );

  const renderStudentsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.filterButton, filterPeriod === period && styles.activeFilterButton]}
            onPress={() => setFilterPeriod(period)}
          >
            <Text style={[styles.filterText, filterPeriod === period && styles.activeFilterText]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredStudents.map((student) => (
        <DashboardCard key={student.id} title={student.name} style={styles.studentCard}>
          <TouchableOpacity
            onPress={() => {
              setSelectedStudent(student);
              setShowStudentModal(true);
            }}
          >
            <View style={styles.studentHeader}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>{student.avatar}</Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.rollNumber}>{student.rollNumber} • {student.grade}</Text>
                  <Text style={styles.parentContact}>Parent: {student.parentContact}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: getStatusColor(student.attendanceStatus) + '20',
              }]}>
                <Text style={[styles.statusText, {
                  color: getStatusColor(student.attendanceStatus)
                }]}>
                  {student.attendanceStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.attendanceMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Overall</Text>
                <Text style={[styles.metricValue, { color: getAttendanceColor(student.overallAttendance) }]}>
                  {student.overallAttendance}%
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Monthly</Text>
                <Text style={[styles.metricValue, { color: getAttendanceColor(student.monthlyAttendance) }]}>
                  {student.monthlyAttendance}%
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Weekly</Text>
                <Text style={[styles.metricValue, { color: getAttendanceColor(student.weeklyAttendance) }]}>
                  {student.weeklyAttendance}%
                </Text>
              </View>
            </View>

            {student.consecutiveAbsent > 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ {student.consecutiveAbsent} consecutive absent days
                </Text>
              </View>
            )}

            <Text style={styles.lastSeen}>
              Last present: {student.lastPresent.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderSessionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {classSessions.map((session) => (
        <DashboardCard key={session.id} title={session.className} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionDate}>
              {session.date.toLocaleDateString()} • {session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}
            </Text>
            <Text style={[styles.sessionStatus, {
              backgroundColor: session.status === 'completed' ? '#D1FAE5' :
                             session.status === 'ongoing' ? '#FEF3C7' :
                             session.status === 'scheduled' ? '#E0E7FF' : '#FEE2E2',
              color: session.status === 'completed' ? '#059669' :
                     session.status === 'ongoing' ? '#D97706' :
                     session.status === 'scheduled' ? '#4338CA' : '#DC2626'
            }]}>
              {session.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.sessionStats}>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatNumber}>{session.presentCount}</Text>
              <Text style={styles.sessionStatLabel}>Present</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatNumber}>{session.absentCount}</Text>
              <Text style={styles.sessionStatLabel}>Absent</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatNumber}>{session.lateCount}</Text>
              <Text style={styles.sessionStatLabel}>Late</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={[styles.sessionStatNumber, { color: getAttendanceColor(session.attendanceRate) }]}>
                {session.attendanceRate.toFixed(1)}%
              </Text>
              <Text style={styles.sessionStatLabel}>Rate</Text>
            </View>
          </View>

          <View style={styles.attendanceBar}>
            <View
              style={[
                styles.attendanceBarFill,
                { 
                  width: `${session.attendanceRate}%`,
                  backgroundColor: getAttendanceColor(session.attendanceRate)
                }
              ]}
            />
          </View>

          <TouchableOpacity
            style={styles.viewSessionButton}
            onPress={() => Alert.alert('Session Details', `View detailed attendance for ${session.className}`)}
          >
            <Text style={styles.viewSessionText}>View Details</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderReportsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.reportActions}>
        {(['daily', 'weekly', 'monthly', 'custom'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.generateReportButton}
            onPress={() => generateReport(type)}
          >
            <Text style={styles.generateReportText}>Generate {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {reports.map((report) => (
        <DashboardCard key={report.id} title={report.title} style={styles.reportCard}>
          <View style={styles.reportMeta}>
            <Text style={styles.reportPeriod}>
              {report.startDate.toLocaleDateString()} - {report.endDate.toLocaleDateString()}
            </Text>
            <Text style={styles.reportGenerated}>
              Generated: {report.generatedAt.toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.reportSummary}>
            <View style={styles.reportStat}>
              <Text style={styles.reportStatNumber}>{report.totalSessions}</Text>
              <Text style={styles.reportStatLabel}>Total Sessions</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNumber, { color: getAttendanceColor(report.averageAttendance) }]}>
                {report.averageAttendance}%
              </Text>
              <Text style={styles.reportStatLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNumber, { color: '#EF4444' }]}>{report.studentsAtRisk}</Text>
              <Text style={styles.reportStatLabel}>At Risk</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNumber, { color: '#10B981' }]}>{report.perfectAttendance}</Text>
              <Text style={styles.reportStatLabel}>Perfect</Text>
            </View>
          </View>

          <View style={styles.reportActions}>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={() => Alert.alert('Download Report', 'Downloading attendance report...')}
            >
              <Text style={styles.reportActionText}>📥 Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={() => Alert.alert('Share Report', 'Sharing attendance report...')}
            >
              <Text style={styles.reportActionText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={() => Alert.alert('Email Report', 'Emailing attendance report...')}
            >
              <Text style={styles.reportActionText}>📧 Email</Text>
            </TouchableOpacity>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderAlertsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📊 Alert Summary" style={styles.sectionCard}>
        <View style={styles.alertSummary}>
          <View style={styles.alertStat}>
            <Text style={[styles.alertStatNumber, { color: '#DC2626' }]}>
              {alerts.filter(a => a.severity === 'critical').length}
            </Text>
            <Text style={styles.alertStatLabel}>Critical</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={[styles.alertStatNumber, { color: '#EF4444' }]}>
              {alerts.filter(a => a.severity === 'high').length}
            </Text>
            <Text style={styles.alertStatLabel}>High</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={[styles.alertStatNumber, { color: '#F59E0B' }]}>
              {alerts.filter(a => a.severity === 'medium').length}
            </Text>
            <Text style={styles.alertStatLabel}>Medium</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={[styles.alertStatNumber, { color: '#6B7280' }]}>
              {alerts.filter(a => a.acknowledged).length}
            </Text>
            <Text style={styles.alertStatLabel}>Resolved</Text>
          </View>
        </View>
      </DashboardCard>

      {alerts.map((alert) => (
        <DashboardCard 
          key={alert.id} 
          title={`🚨 ${alert.type.replace('-', ' ').toUpperCase()}`}
          style={[styles.alertCard, { opacity: alert.acknowledged ? 0.6 : 1 }]}
        >
          <View style={styles.alertDetailHeader}>
            <Text style={styles.alertStudentName}>{alert.studentName}</Text>
            <View style={styles.alertMetaTags}>
              <Text style={[styles.alertSeverityTag, {
                backgroundColor: alert.severity === 'critical' ? '#FEE2E2' :
                               alert.severity === 'high' ? '#FEF3C7' :
                               alert.severity === 'medium' ? '#E0E7FF' : '#F3F4F6',
                color: alert.severity === 'critical' ? '#DC2626' :
                       alert.severity === 'high' ? '#D97706' :
                       alert.severity === 'medium' ? '#4338CA' : '#374151'
              }]}>
                {alert.severity.toUpperCase()}
              </Text>
              <Text style={styles.alertTimestamp}>
                {alert.createdAt.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.alertDetailMessage}>{alert.message}</Text>
          
          <View style={styles.suggestedActionContainer}>
            <Text style={styles.suggestedActionTitle}>💡 Suggested Action:</Text>
            <Text style={styles.suggestedActionText}>{alert.suggestedAction}</Text>
          </View>

          <View style={styles.alertActions}>
            {!alert.acknowledged && (
              <TouchableOpacity
                style={styles.acknowledgeActionButton}
                onPress={() => handleAcknowledgeAlert(alert.id)}
              >
                <Text style={styles.acknowledgeActionText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.contactParentButton}
              onPress={() => Alert.alert('Contact Parent', `Contacting parent of ${alert.studentName}`)}
            >
              <Text style={styles.contactParentText}>📞 Contact Parent</Text>
            </TouchableOpacity>
          </View>

          {alert.acknowledged && (
            <View style={styles.resolvedBanner}>
              <Text style={styles.resolvedText}>✅ Resolved</Text>
            </View>
          )}
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderStudentModal = () => (
    <Modal
      visible={showStudentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStudentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{selectedStudent?.name} - Attendance History</Text>
            
            <View style={styles.studentModalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatLabel}>Overall</Text>
                <Text style={[styles.modalStatValue, { 
                  color: getAttendanceColor(selectedStudent?.overallAttendance || 0) 
                }]}>
                  {selectedStudent?.overallAttendance}%
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatLabel}>This Month</Text>
                <Text style={[styles.modalStatValue, { 
                  color: getAttendanceColor(selectedStudent?.monthlyAttendance || 0) 
                }]}>
                  {selectedStudent?.monthlyAttendance}%
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatLabel}>Consecutive Absent</Text>
                <Text style={[styles.modalStatValue, { 
                  color: (selectedStudent?.consecutiveAbsent || 0) > 0 ? '#EF4444' : '#10B981' 
                }]}>
                  {selectedStudent?.consecutiveAbsent || 0}
                </Text>
              </View>
            </View>

            <Text style={styles.historyTitle}>Recent Attendance History:</Text>
            {selectedStudent?.attendanceHistory.map((record, index) => (
              <View key={index} style={styles.historyRecord}>
                <Text style={styles.historyDate}>{record.date.toLocaleDateString()}</Text>
                <Text style={[styles.historyStatus, {
                  color: record.status === 'present' ? '#10B981' :
                        record.status === 'late' ? '#F59E0B' :
                        record.status === 'absent' ? '#EF4444' : '#6B7280'
                }]}>
                  {record.status.toUpperCase()}
                </Text>
                {record.arrivalTime && (
                  <Text style={styles.historyTime}>
                    {record.arrivalTime.toLocaleTimeString()}
                  </Text>
                )}
                {record.reason && (
                  <Text style={styles.historyReason}>Reason: {record.reason}</Text>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowStudentModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
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
          <Appbar.Content title="Attendance Tracking" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
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
            {renderTabButton('overview', 'Overview', '📊')}
            {renderTabButton('students', 'Students', '👥')}
            {renderTabButton('sessions', 'Sessions', '📅')}
            {renderTabButton('reports', 'Reports', '📈')}
            {renderTabButton('alerts', 'Alerts', '🚨')}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'sessions' && renderSessionsTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
        </View>

        {renderStudentModal()}

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

  // Overview Styles
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginHorizontal: Spacing.XS,
  },
  statNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  trendChart: {
    alignItems: 'center',
  },
  trendTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: Spacing.SM,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 20,
  },
  trendBarLabel: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSurface,
    marginTop: Spacing.XS,
    fontWeight: '600',
  },
  trendBarDay: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },

  // Alert Styles
  alertItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  alertSeverity: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  alertStudent: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  alertMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  acknowledgeButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    alignSelf: 'flex-start',
  },
  acknowledgeButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  viewAllAlertsButton: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
  },
  viewAllAlertsText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },

  // Student Styles
  searchContainer: {
    marginBottom: Spacing.LG,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.LG,
    gap: Spacing.SM,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: LightTheme.PrimaryContainer,
    borderColor: LightTheme.Primary,
  },
  filterText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  activeFilterText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '600',
  },
  studentCard: {
    marginBottom: Spacing.MD,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
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
  rollNumber: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  parentContact: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  statusText: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '700',
  },
  attendanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  metricValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  warningText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  lastSeen: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },

  // Session Styles
  sessionCard: {
    marginBottom: Spacing.MD,
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
    alignItems: 'center',
    flex: 1,
  },
  sessionStatNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  sessionStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  attendanceBar: {
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.MD,
  },
  attendanceBarFill: {
    height: '100%',
  },
  viewSessionButton: {
    backgroundColor: LightTheme.PrimaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  viewSessionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },

  // Report Styles
  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
    marginBottom: Spacing.LG,
  },
  generateReportButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    minWidth: '48%',
    alignItems: 'center',
  },
  generateReportText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  reportCard: {
    marginBottom: Spacing.MD,
  },
  reportMeta: {
    marginBottom: Spacing.MD,
  },
  reportPeriod: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  reportGenerated: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  reportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  reportStat: {
    alignItems: 'center',
    flex: 1,
  },
  reportStatNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  reportStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  reportActionButton: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
    marginHorizontal: Spacing.XS,
  },
  reportActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },

  // Alert Tab Styles
  alertSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertStat: {
    alignItems: 'center',
    flex: 1,
  },
  alertStatNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    marginBottom: Spacing.XS,
  },
  alertStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  alertCard: {
    marginBottom: Spacing.MD,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  alertStudentName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
    marginRight: Spacing.MD,
  },
  alertMetaTags: {
    alignItems: 'flex-end',
  },
  alertSeverityTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  alertTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  alertDetailMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  suggestedActionContainer: {
    backgroundColor: LightTheme.TertiaryContainer,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.LG,
  },
  suggestedActionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnTertiaryContainer,
    marginBottom: Spacing.SM,
  },
  suggestedActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnTertiaryContainer,
    lineHeight: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  acknowledgeActionButton: {
    flex: 1,
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  acknowledgeActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  contactParentButton: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  contactParentText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
  resolvedBanner: {
    backgroundColor: '#D1FAE5',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginTop: Spacing.MD,
    alignItems: 'center',
  },
  resolvedText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#059669',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  studentModalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  modalStat: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  modalStatValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
  },
  historyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  historyRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  historyDate: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  historyStatus: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  historyTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
    textAlign: 'right',
  },
  historyReason: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    marginTop: Spacing.XS,
  },
  modalCloseButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.LG,
  },
  modalCloseText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
});

export default AttendanceTrackingScreen;