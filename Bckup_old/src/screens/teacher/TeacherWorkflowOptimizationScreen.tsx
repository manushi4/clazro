/**
 * TeacherWorkflowOptimizationScreen - Phase 47.2: Advanced Class Management Tools
 * Automated attendance, student engagement monitoring, and intervention systems
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
  FlatList,
  Modal,
  Alert,
  Switch,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: string;
  autoDetected: boolean;
  confidence: number;
  location: string;
  deviceInfo?: string;
}

interface EngagementMetrics {
  studentId: string;
  studentName: string;
  sessionId: string;
  participationScore: number;
  attentionLevel: 'high' | 'medium' | 'low';
  interactionCount: number;
  questionAsked: number;
  answeredCorrectly: number;
  timeActive: number;
  screenTime: number;
  distractedTime: number;
  engagementTrend: 'improving' | 'declining' | 'stable';
}

interface PerformanceAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: 'academic' | 'attendance' | 'behavior' | 'engagement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggerDate: string;
  recommendations: string[];
  actionRequired: boolean;
  parentNotified: boolean;
  resolved: boolean;
}

interface InterventionRecommendation {
  id: string;
  studentId: string;
  type: 'individual_support' | 'group_activity' | 'parent_conference' | 'peer_mentoring' | 'resource_allocation';
  priority: 'immediate' | 'urgent' | 'moderate' | 'low';
  title: string;
  description: string;
  expectedOutcome: string;
  timeframe: string;
  resources: string[];
  successMetrics: string[];
  status: 'suggested' | 'approved' | 'in_progress' | 'completed';
}

interface AutomatedTask {
  id: string;
  type: 'attendance_tracking' | 'grade_calculation' | 'progress_reports' | 'parent_communication' | 'assignment_distribution';
  title: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  successRate: number;
}

interface CommunicationTemplate {
  id: string;
  type: 'parent_update' | 'progress_report' | 'concern_notice' | 'achievement_recognition' | 'meeting_request';
  title: string;
  template: string;
  variables: string[];
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  autoSend: boolean;
  recipients: 'parents' | 'students' | 'admin' | 'all';
}

const TeacherWorkflowOptimizationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'attendance' | 'engagement' | 'alerts' | 'automation'>('attendance');
  const [attendanceRecords] = useState<AttendanceRecord[]>(generateMockAttendanceRecords());
  const [engagementData] = useState<EngagementMetrics[]>(generateMockEngagementData());
  const [performanceAlerts] = useState<PerformanceAlert[]>(generateMockPerformanceAlerts());
  const [automatedTasks] = useState<AutomatedTask[]>(generateMockAutomatedTasks());
  const [selectedAlert, setSelectedAlert] = useState<PerformanceAlert | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(true);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const tabs = [
    { id: 'attendance', label: 'Auto Attendance', icon: '📋', count: attendanceRecords.length },
    { id: 'engagement', label: 'Engagement Monitor', icon: '📊', count: engagementData.length },
    { id: 'alerts', label: 'Performance Alerts', icon: '🚨', count: performanceAlerts.filter(a => !a.resolved).length },
    { id: 'automation', label: 'Task Automation', icon: '🤖', count: automatedTasks.filter(t => t.enabled).length },
  ];

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showAlertModal) {
        setShowAlertModal(false);
        setSelectedAlert(null);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showAlertModal]);

  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading workflow data
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      showSnackbar('Failed to load workflow optimization data');
      setIsLoading(false);
    }
  }, [showSnackbar]);

  // Effects
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const handleAlertSelect = (alert: PerformanceAlert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  const handleAlertAction = (alertId: string, action: 'resolve' | 'notify_parent' | 'schedule_intervention') => {
    showSnackbar(`Alert ${action.replace('_', ' ')} completed successfully!`);
    setShowAlertModal(false);
  };

  const toggleAutomatedTask = (taskId: string) => {
    showSnackbar('Automated task settings updated successfully!');
  };

  const renderTabBar = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.tabBar, { backgroundColor: theme.Surface }]}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && [styles.activeTab, { backgroundColor: theme.Primary }]
          ]}
          onPress={() => setSelectedTab(tab.id as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            {
              color: selectedTab === tab.id 
                ? theme.OnPrimary 
                : theme.OnSurface
            }
          ]}>
            {tab.label}
          </Text>
          <View style={[
            styles.countBadge,
            {
              backgroundColor: selectedTab === tab.id 
                ? theme.OnPrimary 
                : theme.Primary
            }
          ]}>
            <Text style={[
              styles.countText,
              {
                color: selectedTab === tab.id 
                  ? theme.Primary 
                  : theme.OnPrimary
              }
            ]}>
              {tab.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAttendanceCard = ({ item }: { item: AttendanceRecord }) => (
    <View style={[styles.attendanceCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.attendanceHeader}>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.OnSurface }]}>
            {item.studentName}
          </Text>
          <Text style={[styles.attendanceTime, { color: theme.OnSurfaceVariant }]}>
            {item.date} at {item.timestamp}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: 
              item.status === 'present' ? '#4CAF50' :
              item.status === 'late' ? '#FF9800' :
              item.status === 'excused' ? '#2196F3' : '#F44336'
          }
        ]}>
          <Text style={styles.statusText}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.attendanceDetails}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
            Detection Method:
          </Text>
          <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
            {item.autoDetected ? 'Auto-detected' : 'Manual entry'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
            Confidence:
          </Text>
          <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
            Location:
          </Text>
          <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
            {item.location}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEngagementCard = ({ item }: { item: EngagementMetrics }) => (
    <View style={[styles.engagementCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.engagementHeader}>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.OnSurface }]}>
            {item.studentName}
          </Text>
          <Text style={[styles.engagementScore, { color: theme.Primary }]}>
            Engagement Score: {Math.round(item.participationScore)}/100
          </Text>
        </View>
        <View style={[
          styles.attentionBadge,
          {
            backgroundColor: 
              item.attentionLevel === 'high' ? '#4CAF50' :
              item.attentionLevel === 'medium' ? '#FF9800' : '#F44336'
          }
        ]}>
          <Text style={styles.attentionText}>
            {item.attentionLevel.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.engagementMetrics}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Questions Asked
          </Text>
          <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
            {item.questionAsked}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Correct Answers
          </Text>
          <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
            {item.answeredCorrectly}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Active Time
          </Text>
          <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
            {Math.round(item.timeActive / 60)}m
          </Text>
        </View>
      </View>

      <View style={styles.trendIndicator}>
        <Text style={[styles.trendLabel, { color: theme.OnSurfaceVariant }]}>
          Trend: 
        </Text>
        <Text style={[
          styles.trendValue,
          {
            color: item.engagementTrend === 'improving' ? '#4CAF50' :
                  item.engagementTrend === 'declining' ? '#F44336' : '#FF9800'
          }
        ]}>
          {item.engagementTrend.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  const renderAlertCard = ({ item }: { item: PerformanceAlert }) => (
    <TouchableOpacity
      style={[styles.alertCard, { backgroundColor: theme.Surface }]}
      onPress={() => handleAlertSelect(item)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, { color: theme.OnSurface }]}>
            {item.title}
          </Text>
          <Text style={[styles.alertStudent, { color: theme.OnSurfaceVariant }]}>
            {item.studentName} • {item.triggerDate}
          </Text>
        </View>
        <View style={[
          styles.severityBadge,
          {
            backgroundColor: 
              item.severity === 'critical' ? '#F44336' :
              item.severity === 'high' ? '#FF5722' :
              item.severity === 'medium' ? '#FF9800' : '#FFC107'
          }
        ]}>
          <Text style={styles.severityText}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.alertDescription, { color: theme.OnSurfaceVariant }]}>
        {item.description}
      </Text>

      <View style={styles.alertActions}>
        <View style={styles.actionStatus}>
          <Text style={[styles.actionLabel, { color: theme.OnSurfaceVariant }]}>
            Action Required: {item.actionRequired ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.actionLabel, { color: theme.OnSurfaceVariant }]}>
            Parent Notified: {item.parentNotified ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAutomationCard = ({ item }: { item: AutomatedTask }) => (
    <View style={[styles.automationCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.automationHeader}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: theme.OnSurface }]}>
            {item.title}
          </Text>
          <Text style={[styles.taskDescription, { color: theme.OnSurfaceVariant }]}>
            {item.description}
          </Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleAutomatedTask(item.id)}
          trackColor={{
            false: theme.Outline,
            true: theme.Primary,
          }}
          thumbColor={item.enabled ? theme.OnPrimary : theme.OnSurfaceVariant}
        />
      </View>

      <View style={styles.automationDetails}>
        <View style={styles.scheduleInfo}>
          <Text style={[styles.scheduleLabel, { color: theme.OnSurfaceVariant }]}>
            Schedule: {item.schedule}
          </Text>
          <Text style={[styles.scheduleLabel, { color: theme.OnSurfaceVariant }]}>
            Last Run: {item.lastRun}
          </Text>
        </View>
        <View style={styles.performanceMetrics}>
          <Text style={[styles.successRate, { color: theme.Primary }]}>
            {Math.round(item.successRate * 100)}% Success
          </Text>
          <View style={[
            styles.statusIndicator,
            {
              backgroundColor: 
                item.status === 'active' ? '#4CAF50' :
                item.status === 'error' ? '#F44336' : '#FF9800'
            }
          ]}>
            <Text style={styles.statusIndicatorText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAlertModal = () => (
    <Modal
      visible={showAlertModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAlertModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedAlert && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowAlertModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.Primary }]}>×</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                    Performance Alert
                  </Text>
                </View>

                {/* Alert Details */}
                <View style={styles.alertDetailsSection}>
                  <Text style={[styles.alertModalTitle, { color: theme.OnSurface }]}>
                    {selectedAlert.title}
                  </Text>
                  <Text style={[styles.alertModalStudent, { color: theme.OnSurfaceVariant }]}>
                    Student: {selectedAlert.studentName}
                  </Text>
                  <Text style={[styles.alertModalDate, { color: theme.OnSurfaceVariant }]}>
                    Triggered: {selectedAlert.triggerDate}
                  </Text>
                </View>

                <View style={styles.alertModalDescription}>
                  <Text style={[styles.descriptionTitle, { color: theme.OnSurface }]}>
                    Description:
                  </Text>
                  <Text style={[styles.descriptionText, { color: theme.OnSurfaceVariant }]}>
                    {selectedAlert.description}
                  </Text>
                </View>

                {/* Recommendations */}
                <View style={styles.recommendationsSection}>
                  <Text style={[styles.recommendationsTitle, { color: theme.OnSurface }]}>
                    Recommended Actions:
                  </Text>
                  {selectedAlert.recommendations.map((recommendation, index) => (
                    <Text key={index} style={[styles.recommendationItem, { color: theme.OnSurfaceVariant }]}>
                      • {recommendation}
                    </Text>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.Primary }]}
                    onPress={() => handleAlertAction(selectedAlert.id, 'resolve')}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
                      Mark Resolved
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => handleAlertAction(selectedAlert.id, 'notify_parent')}
                  >
                    <Text style={styles.actionButtonText}>
                      Notify Parent
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                    onPress={() => handleAlertAction(selectedAlert.id, 'schedule_intervention')}
                  >
                    <Text style={styles.actionButtonText}>
                      Schedule Intervention
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'attendance':
        return (
          <View style={styles.tabContent}>
            <View style={styles.settingsRow}>
              <Text style={[styles.settingLabel, { color: theme.OnSurface }]}>
                Auto Attendance Tracking
              </Text>
              <Switch
                value={autoAttendanceEnabled}
                onValueChange={setAutoAttendanceEnabled}
                trackColor={{
                  false: theme.Outline,
                  true: theme.Primary,
                }}
                thumbColor={autoAttendanceEnabled ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>
            <FlatList
              data={attendanceRecords}
              renderItem={renderAttendanceCard}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );
      
      case 'engagement':
        return (
          <View style={styles.tabContent}>
            <View style={styles.settingsRow}>
              <Text style={[styles.settingLabel, { color: theme.OnSurface }]}>
                Real-time Monitoring
              </Text>
              <Switch
                value={realTimeMonitoring}
                onValueChange={setRealTimeMonitoring}
                trackColor={{
                  false: theme.Outline,
                  true: theme.Primary,
                }}
                thumbColor={realTimeMonitoring ? theme.OnPrimary : theme.OnSurfaceVariant}
              />
            </View>
            <FlatList
              data={engagementData}
              renderItem={renderEngagementCard}
              keyExtractor={item => `${item.studentId}-${item.sessionId}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );
      
      case 'alerts':
        return (
          <FlatList
            data={performanceAlerts.filter(alert => !alert.resolved)}
            renderItem={renderAlertCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
                  No active alerts at this time
                </Text>
              </View>
            }
          />
        );
      
      case 'automation':
        return (
          <FlatList
            data={automatedTasks}
            renderItem={renderAutomationCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      
      default:
        return null;
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => console.log('Navigate back to teacher dashboard')} />
      <Appbar.Content title="Workflow Optimization" subtitle="Automated classroom management" />
      <Appbar.Action icon="robot" onPress={() => setSelectedTab('automation')} />
      <Appbar.Action icon="bell-alert" onPress={() => setSelectedTab('alerts')} />
    </Appbar.Header>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading workflow optimization tools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
      <StatusBar backgroundColor="#059669" barStyle="light-content" />
      {renderAppBar()}

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      {renderContent()}

      {/* Alert Modal */}
      {renderAlertModal()}

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

// Mock data generators
function generateMockAttendanceRecords(): AttendanceRecord[] {
  const students = ['Arjun Sharma', 'Priya Patel', 'Rohit Kumar', 'Sneha Gupta', 'Amit Singh'];
  const statuses: AttendanceRecord['status'][] = ['present', 'absent', 'late', 'excused'];
  
  return Array.from({ length: 15 }, (_, index) => ({
    id: `attendance_${index + 1}`,
    studentId: `student_${(index % 5) + 1}`,
    studentName: students[index % 5],
    date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toLocaleDateString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    timestamp: `${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`,
    autoDetected: Math.random() > 0.3,
    confidence: 0.7 + Math.random() * 0.3,
    location: 'Classroom 10A',
    deviceInfo: Math.random() > 0.5 ? 'Mobile App' : 'Web Portal',
  }));
}

function generateMockEngagementData(): EngagementMetrics[] {
  const students = ['Arjun Sharma', 'Priya Patel', 'Rohit Kumar', 'Sneha Gupta', 'Amit Singh'];
  
  return students.map((name, index) => ({
    studentId: `student_${index + 1}`,
    studentName: name,
    sessionId: `session_${Date.now()}_${index}`,
    participationScore: 40 + Math.random() * 60,
    attentionLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
    interactionCount: Math.floor(Math.random() * 20) + 5,
    questionAsked: Math.floor(Math.random() * 10) + 1,
    answeredCorrectly: Math.floor(Math.random() * 8) + 2,
    timeActive: (Math.random() * 2400) + 1200, // seconds
    screenTime: (Math.random() * 2700) + 1800, // seconds
    distractedTime: Math.random() * 600, // seconds
    engagementTrend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as any,
  }));
}

function generateMockPerformanceAlerts(): PerformanceAlert[] {
  const students = ['Arjun Sharma', 'Priya Patel', 'Rohit Kumar', 'Sneha Gupta', 'Amit Singh'];
  const alertTypes: PerformanceAlert['type'][] = ['academic', 'attendance', 'behavior', 'engagement'];
  const severities: PerformanceAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
  
  return Array.from({ length: 8 }, (_, index) => ({
    id: `alert_${index + 1}`,
    studentId: `student_${(index % 5) + 1}`,
    studentName: students[index % 5],
    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    title: [
      'Declining Math Performance',
      'Poor Attendance Pattern',
      'Engagement Level Drop',
      'Assignment Submission Issues',
      'Behavioral Concerns',
      'Academic Support Needed',
      'Parent Communication Required',
      'Intervention Recommended'
    ][index],
    description: [
      'Student showing consistent decline in mathematics assessments over the past 3 weeks.',
      'Attendance has dropped below 80% in the current month.',
      'Participation in class activities has significantly decreased.',
      'Multiple assignment deadlines missed in the past week.',
      'Disrupting class activities and showing lack of focus.',
      'Requires additional academic support for core subjects.',
      'Need to schedule parent conference to discuss progress.',
      'Immediate intervention needed to prevent academic failure.'
    ][index],
    triggerDate: new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
    recommendations: [
      'Schedule one-on-one tutoring sessions',
      'Implement personalized learning plan',
      'Contact parents for support',
      'Assign peer mentor',
      'Provide additional resources'
    ],
    actionRequired: Math.random() > 0.4,
    parentNotified: Math.random() > 0.6,
    resolved: Math.random() > 0.7,
  }));
}

function generateMockAutomatedTasks(): AutomatedTask[] {
  return [
    {
      id: 'task_1',
      type: 'attendance_tracking',
      title: 'Daily Attendance Sync',
      description: 'Automatically sync attendance data with school management system',
      schedule: 'Daily at 9:00 AM',
      enabled: true,
      lastRun: '2024-01-15 09:00 AM',
      nextRun: '2024-01-16 09:00 AM',
      status: 'active',
      successRate: 0.98,
    },
    {
      id: 'task_2',
      type: 'grade_calculation',
      title: 'Weekly Grade Reports',
      description: 'Calculate and distribute weekly progress reports to parents',
      schedule: 'Every Friday at 5:00 PM',
      enabled: true,
      lastRun: '2024-01-12 17:00 PM',
      nextRun: '2024-01-19 17:00 PM',
      status: 'active',
      successRate: 0.95,
    },
    {
      id: 'task_3',
      type: 'parent_communication',
      title: 'Automated Parent Updates',
      description: 'Send automated updates to parents about student progress',
      schedule: 'Daily at 6:00 PM',
      enabled: false,
      lastRun: '2024-01-10 18:00 PM',
      nextRun: 'Paused',
      status: 'paused',
      successRate: 0.92,
    },
    {
      id: 'task_4',
      type: 'assignment_distribution',
      title: 'Assignment Distribution',
      description: 'Automatically distribute assignments to students based on schedule',
      schedule: 'Monday, Wednesday, Friday at 8:00 AM',
      enabled: true,
      lastRun: '2024-01-15 08:00 AM',
      nextRun: '2024-01-17 08:00 AM',
      status: 'active',
      successRate: 0.97,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  tabBar: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    marginRight: Spacing.SM,
    minWidth: 120,
  },
  activeTab: {
    elevation: 2,
  },
  tabIcon: {
    fontSize: 18,
    marginRight: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginRight: Spacing.XS,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLabel: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  listContainer: {
    padding: Spacing.MD,
    paddingBottom: Spacing.XL,
  },
  attendanceCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 4,
  },
  attendanceTime: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: 'bold',
  },
  attendanceDetails: {
    marginTop: Spacing.SM,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  detailValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  engagementCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  engagementScore: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  attentionBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attentionText: {
    color: 'white',
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: 'bold',
  },
  engagementMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    marginRight: Spacing.XS,
  },
  trendValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: 'bold',
  },
  alertCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 4,
  },
  alertStudent: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  severityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    color: 'white',
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.MD,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionStatus: {
    flex: 1,
  },
  actionLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 2,
  },
  automationCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  automationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  taskTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 18,
  },
  automationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 2,
  },
  performanceMetrics: {
    alignItems: 'flex-end',
  },
  successRate: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusIndicator: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusIndicatorText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XL * 2,
  },
  emptyText: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: Spacing.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    textAlign: 'center',
  },
  alertDetailsSection: {
    marginBottom: Spacing.LG,
  },
  alertModalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  alertModalStudent: {
    fontSize: Typography.bodyLarge.fontSize,
    marginBottom: 4,
  },
  alertModalDate: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  alertModalDescription: {
    marginBottom: Spacing.LG,
  },
  descriptionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  descriptionText: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: Spacing.XL,
  },
  recommendationsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  recommendationItem: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.XS,
  },
  actionButtons: {
    gap: Spacing.MD,
  },
  actionButton: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  actionButtonText: {
    color: 'white',
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
});

export default TeacherWorkflowOptimizationScreen;