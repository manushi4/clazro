/**
 * ClassPreparationScreen - Phase 29.2 Class Preparation & Scheduling
 * Pre-class Setup Tools and Comprehensive Scheduling System
 * 
 * Features:
 * - Lesson plan integration with class materials
 * - Technology setup verification (audio/video/screen)
 * - Student notification and reminder system
 * - Material pre-loading and organization
 * - Backup plan preparation tools
 * - Advanced scheduling with recurring classes
 * - Student enrollment management
 * - Automated resource preparation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

interface ClassPreparationScreenProps {
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  objectives: string[];
  materials: string[];
  activities: string[];
  assessments: string[];
  isReady: boolean;
}

interface TechSetupCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
  isRequired: boolean;
}

interface ClassSchedule {
  id: string;
  title: string;
  subject: string;
  grade: string;
  date: Date;
  time: string;
  duration: number;
  enrolledStudents: number;
  maxStudents: number;
  status: 'scheduled' | 'preparing' | 'ready' | 'live' | 'completed';
  lessonPlanId?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

interface NotificationSettings {
  studentReminders: boolean;
  reminderTiming: '15min' | '30min' | '1hour' | '1day';
  parentNotifications: boolean;
  materialPreloading: boolean;
  autoTechCheck: boolean;
}

export const ClassPreparationScreen: React.FC<ClassPreparationScreenProps> = ({
  teacherName,
  onNavigate,
}) => {
  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [selectedTab, setSelectedTab] = useState<'schedule' | 'lesson-plan' | 'tech-check' | 'materials' | 'notifications'>('schedule');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Lesson plan states
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([
    {
      id: 'lp1',
      title: 'Quadratic Equations: Advanced Problem Solving',
      subject: 'Mathematics',
      duration: 90,
      objectives: [
        'Solve complex quadratic equations using multiple methods',
        'Apply quadratic equations to real-world problems',
        'Understand the relationship between roots and coefficients'
      ],
      materials: [
        'Graphing calculator',
        'Quadratic formula reference sheet',
        'Practice problem sets',
        'Interactive whiteboard templates'
      ],
      activities: [
        'Warm-up: Quick review of factoring (10 min)',
        'Interactive demonstration: Quadratic formula derivation (20 min)',
        'Guided practice: Problem solving techniques (30 min)',
        'Group work: Real-world applications (20 min)',
        'Wrap-up: Key concepts summary (10 min)'
      ],
      assessments: [
        'Exit ticket: 3 quadratic problems',
        'Participation in group discussions',
        'Understanding check: verbal questioning'
      ],
      isReady: true,
    }
  ]);

  // Technology setup checks
  const [techChecks, setTechChecks] = useState<TechSetupCheck[]>([
    {
      id: 'audio',
      name: 'Audio System',
      description: 'Microphone and speaker quality test',
      status: 'passed',
      isRequired: true,
    },
    {
      id: 'video',
      name: 'Video Camera',
      description: 'Camera quality and positioning check',
      status: 'passed',
      isRequired: true,
    },
    {
      id: 'screen',
      name: 'Screen Sharing',
      description: 'Screen share functionality test',
      status: 'pending',
      isRequired: true,
    },
    {
      id: 'whiteboard',
      name: 'Interactive Whiteboard',
      description: 'Whiteboard tools and responsiveness',
      status: 'passed',
      isRequired: false,
    },
    {
      id: 'recording',
      name: 'Recording System',
      description: 'Recording quality and storage check',
      status: 'pending',
      isRequired: false,
    },
    {
      id: 'internet',
      name: 'Internet Connection',
      description: 'Bandwidth and stability test',
      status: 'passed',
      isRequired: true,
    }
  ]);

  // Class schedules
  const [schedules, setSchedules] = useState<ClassSchedule[]>([
    {
      id: 'class1',
      title: 'Advanced Mathematics',
      subject: 'Mathematics',
      grade: 'Grade 11',
      date: new Date(Date.now() + 3600000), // 1 hour from now
      time: '10:00 AM',
      duration: 90,
      enrolledStudents: 24,
      maxStudents: 30,
      status: 'preparing',
      lessonPlanId: 'lp1',
      isRecurring: true,
      recurringPattern: 'weekly',
    },
    {
      id: 'class2',
      title: 'Calculus Basics',
      subject: 'Mathematics',
      grade: 'Grade 12',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '2:00 PM',
      duration: 60,
      enrolledStudents: 18,
      maxStudents: 25,
      status: 'scheduled',
      isRecurring: false,
    }
  ]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    studentReminders: true,
    reminderTiming: '30min',
    parentNotifications: true,
    materialPreloading: true,
    autoTechCheck: true,
  });

  // Modal states
  const [showScheduleCreator, setShowScheduleCreator] = useState(false);
  const [showLessonPlanEditor, setShowLessonPlanEditor] = useState(false);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      showSnackbar('Class preparation tools loaded');
    } catch (error) {
      showSnackbar('Failed to load class preparation data');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const hasActiveClasses = schedules.some(s => s.status === 'preparing' || s.status === 'ready');
      if (hasActiveClasses) {
        Alert.alert(
          'Classes in Preparation',
          'You have classes being prepared. Are you sure you want to leave?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => onNavigate('back'),
            },
          ]
        );
        return true;
      }
      return false;
    });
    return backHandler;
  }, [schedules, onNavigate]);

  const cleanup = useCallback(() => {
    // Cleanup function for component unmount
  }, []);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Initialize screen on mount
  useEffect(() => {
    initializeScreen();
    const backHandler = setupBackHandler();
    return () => {
      backHandler.remove();
      cleanup();
    };
  }, [initializeScreen, setupBackHandler, cleanup]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Technology setup handlers
  const handleTechCheck = (checkId: string) => {
    setTechChecks(prev => 
      prev.map(check => 
        check.id === checkId 
          ? { ...check, status: check.status === 'pending' ? 'passed' : 'pending' }
          : check
      )
    );
    
    const check = techChecks.find(c => c.id === checkId);
    if (check) {
      Alert.alert(
        'Technology Check',
        `${check.name} check ${check.status === 'pending' ? 'started' : 'completed'}`,
      );
    }
  };

  const handleRunAllTechChecks = () => {
    Alert.alert(
      'Running All Tech Checks',
      'Running comprehensive technology verification. This will take about 2 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Checks',
          onPress: () => {
            setTechChecks(prev => 
              prev.map(check => ({ ...check, status: 'pending' }))
            );
            
            // Simulate checks completing over time
            setTimeout(() => {
              setTechChecks(prev => 
                prev.map(check => ({ ...check, status: 'passed' }))
              );
              Alert.alert('Tech Check Complete', 'All systems are ready for your class!');
            }, 3000);
          },
        },
      ]
    );
  };

  // Class preparation handlers
  const handleStartClassPreparation = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    setSchedules(prev => 
      prev.map(s => 
        s.id === scheduleId 
          ? { ...s, status: 'preparing' }
          : s
      )
    );

    Alert.alert(
      'Class Preparation Started',
      `Preparing for ${schedule.title}. Running pre-flight checks and loading materials.`,
    );

    // Simulate preparation process
    setTimeout(() => {
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: 'ready' }
            : s
        )
      );
      Alert.alert('Class Ready', `${schedule.title} is ready to start!`);
    }, 2000);
  };

  const handleStartClass = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    Alert.alert(
      'Start Live Class',
      `Start ${schedule.title} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Class',
          onPress: () => {
            setSchedules(prev => 
              prev.map(s => 
                s.id === scheduleId 
                  ? { ...s, status: 'live' }
                  : s
              )
            );
            // Navigate to advanced class control
            onNavigate('class-control');
          },
        },
      ]
    );
  };

  // Notification handlers
  const handleNotificationToggle = (setting: keyof NotificationSettings, value?: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value !== undefined ? value : !prev[setting],
    }));
  };

  const handleSendReminders = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    Alert.alert(
      'Send Reminders',
      `Send class reminders to ${schedule.enrolledStudents} students for "${schedule.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Alert.alert('Reminders Sent', 'Class reminders have been sent to all enrolled students and their parents.');
          },
        },
      ]
    );
  };

  // Material preparation handlers
  const handlePreloadMaterials = (lessonPlanId: string) => {
    const lessonPlan = lessonPlans.find(lp => lp.id === lessonPlanId);
    if (!lessonPlan) return;

    Alert.alert(
      'Preloading Materials',
      `Preparing ${lessonPlan.materials.length} materials for "${lessonPlan.title}". This may take a few minutes.`,
    );

    // Simulate material loading
    setTimeout(() => {
      Alert.alert('Materials Ready', 'All class materials have been preloaded and are ready for use.');
    }, 2000);
  };

  const renderAppBar = () => {
    const upcomingClasses = schedules.filter(s => s.status === 'scheduled' || s.status === 'preparing');
    const readyClasses = schedules.filter(s => s.status === 'ready');

    return (
      <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
        <Appbar.BackAction onPress={() => onNavigate('back')} />
        <Appbar.Content
          title="Class Preparation"
          subtitle={`${upcomingClasses.length} upcoming • ${readyClasses.length} ready`}
        />
        <Appbar.Action
          icon="clock-outline"
          onPress={() => showSnackbar(`Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
        />
        <Appbar.Action
          icon={selectedTab === 'tech-check' ? 'check-circle' : 'cog'}
          onPress={() => {
            if (selectedTab === 'tech-check') {
              handleRunAllTechChecks();
            } else {
              setSelectedTab('tech-check');
            }
          }}
        />
      </Appbar.Header>
    );
  };

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { id: 'schedule', title: 'Schedule', icon: '📅' },
        { id: 'lesson-plan', title: 'Lesson Plans', icon: '📝' },
        { id: 'tech-check', title: 'Tech Check', icon: '🔧' },
        { id: 'materials', title: 'Materials', icon: '📚' },
        { id: 'notifications', title: 'Notifications', icon: '🔔' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            selectedTab === tab.id && styles.activeTab
          ]}
          onPress={() => setSelectedTab(tab.id as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabText,
            selectedTab === tab.id && styles.activeTabText
          ]}>
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderScheduleManagement = () => (
    <View style={styles.scheduleSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Classes</Text>
        <CoachingButton
          title="+ Schedule Class"
          variant="primary"
          size="small"
          onPress={() => setShowScheduleCreator(true)}
          style={styles.createButton}
        />
      </View>
      
      {schedules
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(schedule => (
          <DashboardCard key={schedule.id} title={schedule.title} style={styles.scheduleCard}>
            <View style={styles.scheduleInfo}>
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleText}>📚 {schedule.subject} - {schedule.grade}</Text>
                <Text style={styles.scheduleText}>📅 {schedule.date.toDateString()}</Text>
                <Text style={styles.scheduleText}>⏰ {schedule.time} ({schedule.duration} min)</Text>
                <Text style={styles.scheduleText}>👥 {schedule.enrolledStudents}/{schedule.maxStudents} students</Text>
                
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(schedule.status)}</Text>
                  </View>
                  
                  {schedule.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Text style={styles.recurringText}>🔄 {schedule.recurringPattern}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.scheduleActions}>
                {schedule.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStartClassPreparation(schedule.id)}
                  >
                    <Text style={styles.actionText}>Prepare</Text>
                  </TouchableOpacity>
                )}
                
                {schedule.status === 'preparing' && (
                  <View style={styles.preparingIndicator}>
                    <Text style={styles.preparingText}>⏳ Preparing...</Text>
                  </View>
                )}
                
                {schedule.status === 'ready' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleStartClass(schedule.id)}
                  >
                    <Text style={[styles.actionText, styles.startText]}>Start Class</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.reminderButton}
                  onPress={() => handleSendReminders(schedule.id)}
                >
                  <Text style={styles.reminderText}>Send Reminders</Text>
                </TouchableOpacity>
              </View>
            </View>
          </DashboardCard>
        ))
      }
    </View>
  );

  const renderLessonPlanManagement = () => (
    <View style={styles.lessonPlanSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lesson Plans</Text>
        <CoachingButton
          title="+ Create Plan"
          variant="primary"
          size="small"
          onPress={() => setShowLessonPlanEditor(true)}
          style={styles.createButton}
        />
      </View>
      
      {lessonPlans.map(plan => (
        <DashboardCard key={plan.id} title={plan.title} style={styles.lessonPlanCard}>
          <View style={styles.lessonPlanInfo}>
            <View style={styles.planMeta}>
              <Text style={styles.planText}>📚 {plan.subject} • ⏱️ {plan.duration} minutes</Text>
              <View style={[styles.readyBadge, { backgroundColor: plan.isReady ? '#4CAF50' : '#FF9800' }]}>
                <Text style={styles.readyText}>{plan.isReady ? '✓ Ready' : '⚠ Draft'}</Text>
              </View>
            </View>
            
            <View style={styles.planSections}>
              <View style={styles.planSection}>
                <Text style={styles.planSectionTitle}>🎯 Objectives ({plan.objectives.length})</Text>
                <Text style={styles.planSectionPreview}>
                  {plan.objectives?.[0] || plan.objectives?.join(', ') || 'No objectives'}...
                </Text>
              </View>

              <View style={styles.planSection}>
                <Text style={styles.planSectionTitle}>📋 Materials ({plan.materials.length})</Text>
                <Text style={styles.planSectionPreview}>
                  {plan.materials.slice(0, 2).join(', ')}...
                </Text>
              </View>

              <View style={styles.planSection}>
                <Text style={styles.planSectionTitle}>🎪 Activities ({plan.activities.length})</Text>
                <Text style={styles.planSectionPreview}>
                  {plan.activities?.[0] || plan.activities?.join(', ') || 'No activities'}...
                </Text>
              </View>
            </View>
            
            <View style={styles.planActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedLessonPlan(plan);
                  setShowLessonPlanEditor(true);
                }}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePreloadMaterials(plan.id)}
              >
                <Text style={styles.actionText}>Preload Materials</Text>
              </TouchableOpacity>
            </View>
          </View>
        </DashboardCard>
      ))}
    </View>
  );

  const renderTechCheck = () => (
    <View style={styles.techCheckSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Technology Setup</Text>
        <CoachingButton
          title="Run All Checks"
          variant="primary"
          size="small"
          onPress={handleRunAllTechChecks}
          style={styles.createButton}
        />
      </View>
      
      {techChecks.map(check => (
        <DashboardCard key={check.id} title={check.name} style={styles.techCheckCard}>
          <View style={styles.techCheckInfo}>
            <View style={styles.checkDetails}>
              <Text style={styles.checkDescription}>{check.description}</Text>
              <Text style={styles.checkRequired}>
                {check.isRequired ? '🔴 Required' : '⚪ Optional'}
              </Text>
            </View>
            
            <View style={styles.checkStatus}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getCheckStatusColor(check.status) }
              ]}>
                <Text style={styles.statusIcon}>{getCheckStatusIcon(check.status)}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.checkButton}
                onPress={() => handleTechCheck(check.id)}
              >
                <Text style={styles.checkButtonText}>
                  {check.status === 'pending' ? 'Test' : 'Retest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </DashboardCard>
      ))}
      
      <View style={styles.techSummary}>
        <Text style={styles.techSummaryTitle}>System Status</Text>
        <Text style={styles.techSummaryText}>
          {techChecks.filter(c => c.status === 'passed').length} of {techChecks.length} checks passed
        </Text>
        <Text style={styles.techSummaryText}>
          {techChecks.filter(c => c.isRequired && c.status !== 'passed').length === 0 
            ? '✅ All required systems ready' 
            : '❌ Some required systems need attention'}
        </Text>
      </View>
    </View>
  );

  const renderMaterialsManagement = () => (
    <View style={styles.materialsSection}>
      <Text style={styles.sectionTitle}>Material Library</Text>
      
      {lessonPlans.map(plan => (
        <DashboardCard key={plan.id} title={`${plan.title} Materials`} style={styles.materialsCard}>
          <View style={styles.materialsList}>
            {plan.materials.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <Text style={styles.materialIcon}>📄</Text>
                <Text style={styles.materialName}>{material}</Text>
                <TouchableOpacity
                  style={styles.preloadButton}
                  onPress={() => Alert.alert('Preloaded', `${material} has been preloaded`)}
                >
                  <Text style={styles.preloadText}>Preload</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </DashboardCard>
      ))}
      
      <DashboardCard title="Backup Materials" style={styles.backupCard}>
        <Text style={styles.backupDescription}>
          🛡️ Emergency resources ready in case of technical issues:
        </Text>
        <View style={styles.backupList}>
          <Text style={styles.backupItem}>• Offline worksheet PDFs</Text>
          <Text style={styles.backupItem}>• Audio-only lesson plan</Text>
          <Text style={styles.backupItem}>• Alternative assessment methods</Text>
          <Text style={styles.backupItem}>• Student engagement activities</Text>
        </View>
      </DashboardCard>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.notificationSection}>
      <Text style={styles.sectionTitle}>Notification & Reminder Settings</Text>
      
      <DashboardCard title="Student & Parent Notifications" style={styles.notificationCard}>
        <View style={styles.notificationControls}>
          {Object.entries(notificationSettings).map(([key, value]) => (
            <View key={key} style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  {getNotificationTitle(key)}
                </Text>
                <Text style={styles.notificationDesc}>
                  {getNotificationDescription(key)}
                </Text>
              </View>
              
              {key === 'reminderTiming' ? (
                <TouchableOpacity
                  style={styles.timingSelector}
                  onPress={() => {
                    const options = ['15min', '30min', '1hour', '1day'];
                    const currentIndex = options.indexOf(value as string);
                    const nextValue = options[(currentIndex + 1) % options.length];
                    handleNotificationToggle(key, nextValue);
                  }}
                >
                  <Text style={styles.timingText}>{value}</Text>
                </TouchableOpacity>
              ) : (
                <Switch
                  value={value as boolean}
                  onValueChange={(newValue) => handleNotificationToggle(key as any, newValue)}
                  trackColor={{ false: '#E0E0E0', true: '#7C4DFF' }}
                  thumbColor={value ? '#FFFFFF' : '#F4F3F4'}
                />
              )}
            </View>
          ))}
        </View>
      </DashboardCard>
      
      <DashboardCard title="Automated Preparation" style={styles.automationCard}>
        <Text style={styles.automationDescription}>
          🤖 When enabled, the system will automatically:
        </Text>
        <View style={styles.automationList}>
          <Text style={styles.automationItem}>
            • Run technology checks 30 minutes before class
          </Text>
          <Text style={styles.automationItem}>
            • Preload all lesson materials and resources
          </Text>
          <Text style={styles.automationItem}>
            • Send reminder notifications to students
          </Text>
          <Text style={styles.automationItem}>
            • Prepare whiteboard templates and tools
          </Text>
          <Text style={styles.automationItem}>
            • Initialize recording and attendance systems
          </Text>
        </View>
      </DashboardCard>
    </View>
  );

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#4CAF50';
      case 'ready':
        return '#2196F3';
      case 'preparing':
        return '#FF9800';
      case 'scheduled':
        return '#9E9E9E';
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE NOW';
      case 'ready':
        return 'READY';
      case 'preparing':
        return 'PREPARING';
      case 'scheduled':
        return 'SCHEDULED';
      default:
        return 'UNKNOWN';
    }
  };

  const getCheckStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getNotificationTitle = (key: string) => {
    switch (key) {
      case 'studentReminders':
        return '📱 Student Reminders';
      case 'reminderTiming':
        return '⏰ Reminder Timing';
      case 'parentNotifications':
        return '👨‍👩‍👧‍👦 Parent Notifications';
      case 'materialPreloading':
        return '📚 Auto-Preload Materials';
      case 'autoTechCheck':
        return '🔧 Auto Tech Check';
      default:
        return key;
    }
  };

  const getNotificationDescription = (key: string) => {
    switch (key) {
      case 'studentReminders':
        return 'Send reminders to students before class starts';
      case 'reminderTiming':
        return 'How early to send class reminders';
      case 'parentNotifications':
        return 'Notify parents about upcoming classes';
      case 'materialPreloading':
        return 'Automatically prepare materials before class';
      case 'autoTechCheck':
        return 'Run system checks before each class';
      default:
        return '';
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'lesson-plan':
        return renderLessonPlanManagement();
      case 'tech-check':
        return renderTechCheck();
      case 'materials':
        return renderMaterialsManagement();
      case 'notifications':
        return renderNotificationSettings();
      case 'schedule':
      default:
        return renderScheduleManagement();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
        <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Class Preparation" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>Loading class preparation tools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />

      {renderAppBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabNavigation()}
        {renderTabContent()}
      </ScrollView>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
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
    backgroundColor: LightTheme.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
  },
  loadingText: {
    marginTop: Spacing.LG,
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.LG,
    paddingBottom: Spacing.XXL,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.SM,
    padding: Spacing.XS,
    marginBottom: Spacing.LG,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  activeTab: {
    backgroundColor: LightTheme.PrimaryContainer,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  createButton: {
    minWidth: 120,
  },
  scheduleSection: {
    gap: Spacing.MD,
  },
  scheduleCard: {
    marginBottom: Spacing.MD,
  },
  scheduleInfo: {
    paddingTop: Spacing.MD,
  },
  scheduleDetails: {
    marginBottom: Spacing.MD,
  },
  scheduleText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginTop: Spacing.SM,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recurringBadge: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  recurringText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSecondaryContainer,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  actionButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
  },
  startButton: {
    backgroundColor: LightTheme.PrimaryContainer,
  },
  actionText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
    textAlign: 'center',
  },
  startText: {
    color: LightTheme.OnPrimaryContainer,
  },
  preparingIndicator: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.TertiaryContainer,
    borderRadius: BorderRadius.SM,
  },
  preparingText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnTertiaryContainer,
    fontWeight: '500',
    textAlign: 'center',
  },
  reminderButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  reminderText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  lessonPlanSection: {
    gap: Spacing.MD,
  },
  lessonPlanCard: {
    marginBottom: Spacing.MD,
  },
  lessonPlanInfo: {
    paddingTop: Spacing.MD,
  },
  planMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  planText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  readyBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  readyText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planSections: {
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  planSection: {
    marginBottom: Spacing.SM,
  },
  planSectionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  planSectionPreview: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  techCheckSection: {
    gap: Spacing.MD,
  },
  techCheckCard: {
    marginBottom: Spacing.MD,
  },
  techCheckInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.MD,
  },
  checkDetails: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  checkDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  checkRequired: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  checkStatus: {
    alignItems: 'center',
    gap: Spacing.SM,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
  },
  checkButton: {
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
  },
  checkButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
  techSummary: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
  },
  techSummaryTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  techSummaryText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  materialsSection: {
    gap: Spacing.MD,
  },
  materialsCard: {
    marginBottom: Spacing.MD,
  },
  materialsList: {
    paddingTop: Spacing.MD,
    gap: Spacing.SM,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  materialIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  materialName: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
  },
  preloadButton: {
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    backgroundColor: LightTheme.PrimaryContainer,
    borderRadius: BorderRadius.SM,
  },
  preloadText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  backupCard: {
    marginTop: Spacing.MD,
  },
  backupDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginTop: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  backupList: {
    gap: Spacing.XS,
  },
  backupItem: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  notificationSection: {
    gap: Spacing.MD,
  },
  notificationCard: {
    marginBottom: Spacing.MD,
  },
  notificationControls: {
    paddingTop: Spacing.MD,
    gap: Spacing.LG,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  notificationInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  notificationTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  notificationDesc: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  timingSelector: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
    minWidth: 80,
  },
  timingText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
    textAlign: 'center',
  },
  automationCard: {
    marginTop: Spacing.MD,
  },
  automationDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginTop: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  automationList: {
    gap: Spacing.XS,
  },
  automationItem: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
  },
});

export default ClassPreparationScreen;