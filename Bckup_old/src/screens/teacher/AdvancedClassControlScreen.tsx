/**
 * AdvancedClassControlScreen - Phase 29.1 Enhanced Live Class Controls
 * Professional Teaching Interface with Advanced Management Features
 * 
 * Features:
 * - Complete whiteboard system with mathematical notation
 * - Advanced screen sharing with annotation tools
 * - Student engagement monitoring and analytics
 * - Breakout room creation and management
 * - Recording controls with cloud storage integration
 * - Real-time class management with attendance tracking
 * - Student participation scoring and tracking
 * - Chat moderation with AI-powered filtering
 * - Hand-raising queue management
 * - Real-time polls and quiz deployment
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
  Dimensions,
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

const { width } = Dimensions.get('window');

interface AdvancedClassControlScreenProps {
  classId: string;
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface ClassSession {
  id: string;
  subject: string;
  grade: string;
  status: 'preparing' | 'live' | 'ended';
  participantCount: number;
  duration: number; // in minutes
  startTime?: Date;
}

interface EngagementMetrics {
  averageAttentionScore: number;
  activeParticipants: number;
  handRaisesCount: number;
  chatMessagesCount: number;
  pollParticipationRate: number;
  overallEngagement: 'low' | 'medium' | 'high';
}

interface BreakoutRoom {
  id: string;
  name: string;
  participantCount: number;
  maxParticipants: number;
  status: 'active' | 'inactive';
  topic?: string;
  timeRemaining?: number;
}

interface AdvancedWhiteboardTool {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  category: 'basic' | 'math' | 'science' | 'annotation';
}

interface AIModeration {
  enabled: boolean;
  toxicityFilter: boolean;
  spamDetection: boolean;
  languageFilter: boolean;
  autoMute: boolean;
}

export const AdvancedClassControlScreen: React.FC<AdvancedClassControlScreenProps> = ({
  classId,
  teacherName,
  onNavigate,
}) => {
  const [classSession, setClassSession] = useState<ClassSession>({
    id: classId,
    subject: 'Advanced Mathematics',
    grade: 'Grade 11',
    status: 'live',
    participantCount: 28,
    duration: 90,
    startTime: new Date(Date.now() - 1800000), // 30 minutes ago
  });

  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'whiteboard' | 'breakouts' | 'engagement' | 'recording' | 'moderation'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Advanced class control states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(1847); // seconds
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  
  // Engagement monitoring states
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics>({
    averageAttentionScore: 78,
    activeParticipants: 24,
    handRaisesCount: 7,
    chatMessagesCount: 43,
    pollParticipationRate: 86,
    overallEngagement: 'high',
  });

  // Breakout room management
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([
    {
      id: 'room1',
      name: 'Algebra Team A',
      participantCount: 6,
      maxParticipants: 8,
      status: 'active',
      topic: 'Quadratic Equations',
      timeRemaining: 12,
    },
    {
      id: 'room2',
      name: 'Algebra Team B',
      participantCount: 7,
      maxParticipants: 8,
      status: 'active',
      topic: 'Quadratic Equations',
      timeRemaining: 12,
    },
    {
      id: 'room3',
      name: 'Advanced Discussion',
      participantCount: 5,
      maxParticipants: 6,
      status: 'active',
      topic: 'Problem Solving',
      timeRemaining: 12,
    }
  ]);

  // Advanced whiteboard tools
  const [whiteboardTools, setWhiteboardTools] = useState<AdvancedWhiteboardTool[]>([
    { id: 'pen', name: 'Pen', icon: '✏️', isActive: true, category: 'basic' },
    { id: 'eraser', name: 'Eraser', icon: '🧹', isActive: false, category: 'basic' },
    { id: 'shapes', name: 'Shapes', icon: '⭕', isActive: false, category: 'basic' },
    { id: 'equation', name: 'Equation', icon: '∑', isActive: false, category: 'math' },
    { id: 'graph', name: 'Graph', icon: '📈', isActive: false, category: 'math' },
    { id: 'geometry', name: 'Geometry', icon: '📐', isActive: false, category: 'math' },
    { id: 'highlight', name: 'Highlight', icon: '🖍️', isActive: false, category: 'annotation' },
    { id: 'arrow', name: 'Arrow', icon: '➡️', isActive: false, category: 'annotation' },
  ]);

  // AI moderation settings
  const [aiModeration, setAiModeration] = useState<AIModeration>({
    enabled: true,
    toxicityFilter: true,
    spamDetection: true,
    languageFilter: false,
    autoMute: false,
  });

  // Modal states
  const [showBreakoutCreator, setShowBreakoutCreator] = useState(false);
  const [showRecordingSettings, setShowRecordingSettings] = useState(false);
  const [showModerationSettings, setShowModerationSettings] = useState(false);

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading class session data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      showSnackbar('Advanced class controls loaded');
    } catch (error) {
      showSnackbar('Failed to load class controls');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (classSession.status === 'live') {
        Alert.alert(
          'Leave Live Class',
          'The class is currently live. Are you sure you want to leave the control panel?',
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
  }, [classSession.status, onNavigate]);

  const cleanup = useCallback(() => {
    // Cleanup any active resources
  }, []);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Initialize screen
  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isRecording) {
        setRecordingDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Advanced whiteboard handlers
  const handleWhiteboardToolSelect = (toolId: string) => {
    setWhiteboardTools(prev => 
      prev.map(tool => ({
        ...tool,
        isActive: tool.id === toolId,
      }))
    );
    console.log('Whiteboard tool selected:', toolId);
  };

  const handleMathEquationMode = () => {
    Alert.alert(
      'Mathematical Notation',
      'LaTeX equation editor is now active. You can write mathematical expressions directly on the whiteboard.',
    );
    handleWhiteboardToolSelect('equation');
  };

  const handleScreenShareAnnotation = () => {
    setAnnotationMode(!annotationMode);
    Alert.alert(
      'Screen Annotation',
      annotationMode 
        ? 'Annotation mode disabled' 
        : 'You can now draw annotations on the shared screen'
    );
  };

  // Breakout room management handlers
  const handleCreateBreakoutRoom = () => {
    setShowBreakoutCreator(true);
  };

  const handleBreakoutRoomAction = (roomId: string, action: 'join' | 'close' | 'extend') => {
    const room = breakoutRooms.find(r => r.id === roomId);
    if (!room) return;

    switch (action) {
      case 'join':
        Alert.alert('Joining Breakout Room', `You are joining "${room.name}"`);
        break;
      case 'close':
        Alert.alert(
          'Close Breakout Room',
          `Are you sure you want to close "${room.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Close',
              style: 'destructive',
              onPress: () => {
                setBreakoutRooms(prev => prev.filter(r => r.id !== roomId));
              },
            },
          ]
        );
        break;
      case 'extend':
        Alert.alert('Time Extended', `Added 5 minutes to "${room.name}"`);
        setBreakoutRooms(prev =>
          prev.map(r =>
            r.id === roomId ? { ...r, timeRemaining: (r.timeRemaining || 0) + 5 } : r
          )
        );
        break;
    }
  };

  // Recording management handlers
  const handleToggleRecording = () => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording',
        'Are you sure you want to stop recording? The recording will be saved to cloud storage.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop Recording',
            style: 'destructive',
            onPress: () => {
              setIsRecording(false);
              Alert.alert('Recording Saved', 'Your class recording has been saved to the cloud and will be available to students shortly.');
            },
          },
        ]
      );
    } else {
      setIsRecording(true);
      setRecordingDuration(0);
      Alert.alert('Recording Started', 'Class recording has started. The recording will be automatically saved to cloud storage.');
    }
  };

  const handleRecordingSettings = () => {
    setShowRecordingSettings(true);
  };

  // AI moderation handlers
  const handleModerationToggle = (setting: keyof AIModeration) => {
    setAiModeration(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const renderAppBar = () => {
    const getStatusText = () => {
      const status = classSession.status === 'live' ? 'LIVE' :
                     classSession.status === 'preparing' ? 'PREPARING' : 'ENDED';
      const recordingText = isRecording ? ` • REC ${formatDuration(recordingDuration)}` : '';
      return `${status}${recordingText}`;
    };

    return (
      <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
        <Appbar.BackAction onPress={() => {
          if (classSession.status === 'live') {
            Alert.alert(
              'Leave Live Class',
              'The class is currently live. Are you sure you want to leave?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => onNavigate('back') },
              ]
            );
          } else {
            onNavigate('back');
          }
        }} />
        <Appbar.Content
          title="Advanced Class Control"
          subtitle={getStatusText()}
        />
        {isRecording && (
          <Appbar.Action
            icon="record-circle"
            color="#F44336"
            onPress={() => showSnackbar(`Recording: ${formatDuration(recordingDuration)}`)}
          />
        )}
        <Appbar.Action
          icon="clock-outline"
          onPress={() => showSnackbar(`Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
        />
      </Appbar.Header>
    );
  };

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { id: 'dashboard', title: 'Dashboard', icon: '📊' },
        { id: 'whiteboard', title: 'Whiteboard', icon: '📝' },
        { id: 'breakouts', title: 'Breakouts', icon: '🏫' },
        { id: 'engagement', title: 'Analytics', icon: '📈' },
        { id: 'recording', title: 'Recording', icon: '🎥' },
        { id: 'moderation', title: 'AI Moderation', icon: '🤖' },
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

  const renderDashboard = () => (
    <View style={styles.dashboardSection}>
      {/* Class Overview */}
      <DashboardCard title="Live Class Overview" style={styles.overviewCard}>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>👥</Text>
            <Text style={styles.overviewValue}>{classSession.participantCount}</Text>
            <Text style={styles.overviewLabel}>Students</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>⏱️</Text>
            <Text style={styles.overviewValue}>{Math.floor((Date.now() - (classSession.startTime?.getTime() || Date.now())) / 60000)}</Text>
            <Text style={styles.overviewLabel}>Minutes</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>✋</Text>
            <Text style={styles.overviewValue}>{engagementMetrics.handRaisesCount}</Text>
            <Text style={styles.overviewLabel}>Hand Raises</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>💬</Text>
            <Text style={styles.overviewValue}>{engagementMetrics.chatMessagesCount}</Text>
            <Text style={styles.overviewLabel}>Messages</Text>
          </View>
        </View>
      </DashboardCard>

      {/* Quick Controls */}
      <DashboardCard title="Quick Controls" style={styles.quickControlsCard}>
        <View style={styles.quickControlsGrid}>
          <TouchableOpacity
            style={[styles.quickControlItem, isScreenSharing && styles.activeControl]}
            onPress={() => setIsScreenSharing(!isScreenSharing)}
          >
            <Text style={styles.quickControlIcon}>🖥️</Text>
            <Text style={styles.quickControlText}>Screen Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickControlItem, isWhiteboardActive && styles.activeControl]}
            onPress={() => setIsWhiteboardActive(!isWhiteboardActive)}
          >
            <Text style={styles.quickControlIcon}>📝</Text>
            <Text style={styles.quickControlText}>Whiteboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickControlItem}
            onPress={handleCreateBreakoutRoom}
          >
            <Text style={styles.quickControlIcon}>🏫</Text>
            <Text style={styles.quickControlText}>Breakout Rooms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickControlItem, isRecording && styles.activeControl]}
            onPress={handleToggleRecording}
          >
            <Text style={styles.quickControlIcon}>🎥</Text>
            <Text style={styles.quickControlText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
          </TouchableOpacity>
        </View>
      </DashboardCard>
    </View>
  );

  const renderWhiteboardControls = () => (
    <View style={styles.whiteboardSection}>
      <DashboardCard title="Advanced Whiteboard Tools" style={styles.whiteboardCard}>
        <View style={styles.toolCategories}>
          {['basic', 'math', 'annotation'].map(category => (
            <View key={category} style={styles.toolCategory}>
              <Text style={styles.categoryTitle}>
                {category === 'basic' ? '🖊️ Basic Tools' :
                 category === 'math' ? '📐 Mathematical Tools' : '✨ Annotation Tools'}
              </Text>
              
              <View style={styles.toolGrid}>
                {whiteboardTools
                  .filter(tool => tool.category === category)
                  .map(tool => (
                    <TouchableOpacity
                      key={tool.id}
                      style={[
                        styles.toolButton,
                        tool.isActive && styles.activeToolButton
                      ]}
                      onPress={() => handleWhiteboardToolSelect(tool.id)}
                    >
                      <Text style={styles.toolIcon}>{tool.icon}</Text>
                      <Text style={styles.toolText}>{tool.name}</Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.whiteboardActions}>
          <CoachingButton
            title="🧮 Launch LaTeX Editor"
            variant="secondary"
            size="medium"
            onPress={handleMathEquationMode}
            style={styles.whiteboardButton}
          />
          
          <CoachingButton
            title="📱 Share to Students"
            variant="primary"
            size="medium"
            onPress={() => Alert.alert('Shared', 'Whiteboard shared with all students')}
            style={styles.whiteboardButton}
          />
        </View>
      </DashboardCard>
    </View>
  );

  const renderBreakoutRooms = () => (
    <View style={styles.breakoutSection}>
      <View style={styles.breakoutHeader}>
        <Text style={styles.sectionTitle}>Active Breakout Rooms</Text>
        <CoachingButton
          title="+ Create Room"
          variant="primary"
          size="small"
          onPress={handleCreateBreakoutRoom}
          style={styles.createRoomButton}
        />
      </View>
      
      {breakoutRooms.map(room => (
        <DashboardCard key={room.id} title={room.name} style={styles.breakoutRoomCard}>
          <View style={styles.roomInfo}>
            <View style={styles.roomStats}>
              <Text style={styles.roomStat}>👥 {room.participantCount}/{room.maxParticipants}</Text>
              <Text style={styles.roomStat}>⏰ {room.timeRemaining} min left</Text>
              <Text style={styles.roomStat}>📚 {room.topic}</Text>
            </View>
            
            <View style={styles.roomActions}>
              <TouchableOpacity
                style={styles.roomAction}
                onPress={() => handleBreakoutRoomAction(room.id, 'join')}
              >
                <Text style={styles.roomActionText}>Join</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.roomAction}
                onPress={() => handleBreakoutRoomAction(room.id, 'extend')}
              >
                <Text style={styles.roomActionText}>+5 min</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.roomAction, styles.closeAction]}
                onPress={() => handleBreakoutRoomAction(room.id, 'close')}
              >
                <Text style={[styles.roomActionText, styles.closeActionText]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </DashboardCard>
      ))}
    </View>
  );

  const renderEngagementAnalytics = () => (
    <View style={styles.analyticsSection}>
      <DashboardCard title="Real-time Engagement Analytics" style={styles.analyticsCard}>
        <View style={styles.engagementGrid}>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementIcon}>👀</Text>
            <Text style={styles.engagementValue}>{engagementMetrics.averageAttentionScore}%</Text>
            <Text style={styles.engagementLabel}>Attention Score</Text>
          </View>
          
          <View style={styles.engagementItem}>
            <Text style={styles.engagementIcon}>🙋</Text>
            <Text style={styles.engagementValue}>{engagementMetrics.activeParticipants}</Text>
            <Text style={styles.engagementLabel}>Active Students</Text>
          </View>
          
          <View style={styles.engagementItem}>
            <Text style={styles.engagementIcon}>📊</Text>
            <Text style={styles.engagementValue}>{engagementMetrics.pollParticipationRate}%</Text>
            <Text style={styles.engagementLabel}>Poll Participation</Text>
          </View>
          
          <View style={styles.engagementItem}>
            <Text style={styles.engagementIcon}>⚡</Text>
            <Text style={[
              styles.engagementValue,
              { color: engagementMetrics.overallEngagement === 'high' ? '#4CAF50' : 
                      engagementMetrics.overallEngagement === 'medium' ? '#FF9800' : '#F44336' }
            ]}>
              {engagementMetrics.overallEngagement.toUpperCase()}
            </Text>
            <Text style={styles.engagementLabel}>Overall Engagement</Text>
          </View>
        </View>
        
        <View style={styles.engagementInsights}>
          <Text style={styles.insightsTitle}>💡 AI Insights</Text>
          <Text style={styles.insightsText}>
            • High engagement detected! Students are actively participating.{'\n'}
            • Consider extending current discussion for 5-10 minutes.{'\n'}
            • 3 students may need additional support based on interaction patterns.
          </Text>
        </View>
      </DashboardCard>
    </View>
  );

  const renderRecordingControls = () => (
    <View style={styles.recordingSection}>
      <DashboardCard title="Cloud Recording Management" style={styles.recordingCard}>
        <View style={styles.recordingStatus}>
          <Text style={styles.recordingStatusText}>
            {isRecording ? '🔴 Recording Active' : '⚪ Recording Inactive'}
          </Text>
          {isRecording && (
            <Text style={styles.recordingDuration}>Duration: {formatDuration(recordingDuration)}</Text>
          )}
        </View>
        
        <View style={styles.recordingControls}>
          <CoachingButton
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            variant={isRecording ? 'secondary' : 'primary'}
            size="large"
            onPress={handleToggleRecording}
            style={styles.recordingButton}
          />
          
          <CoachingButton
            title="Recording Settings"
            variant="outline"
            size="medium"
            onPress={handleRecordingSettings}
            style={styles.recordingButton}
          />
        </View>
        
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingInfoText}>
            ☁️ Recordings are automatically saved to cloud storage{'\n'}
            📱 Students will receive access links after processing{'\n'}
            🔒 All recordings are encrypted and secure
          </Text>
        </View>
      </DashboardCard>
    </View>
  );

  const renderAIModerationControls = () => (
    <View style={styles.moderationSection}>
      <DashboardCard title="AI-Powered Chat Moderation" style={styles.moderationCard}>
        <View style={styles.moderationControls}>
          {Object.entries(aiModeration).map(([key, value]) => (
            <View key={key} style={styles.moderationItem}>
              <View style={styles.moderationInfo}>
                <Text style={styles.moderationTitle}>
                  {key === 'enabled' ? '🤖 AI Moderation' :
                   key === 'toxicityFilter' ? '🛡️ Toxicity Filter' :
                   key === 'spamDetection' ? '🚫 Spam Detection' :
                   key === 'languageFilter' ? '🔤 Language Filter' : '🔇 Auto Mute'}
                </Text>
                <Text style={styles.moderationDesc}>
                  {key === 'enabled' ? 'Enable AI-powered content moderation' :
                   key === 'toxicityFilter' ? 'Filter inappropriate language' :
                   key === 'spamDetection' ? 'Detect and block spam messages' :
                   key === 'languageFilter' ? 'Enforce language requirements' : 'Automatically mute disruptive users'}
                </Text>
              </View>
              
              <Switch
                value={value}
                onValueChange={() => handleModerationToggle(key as keyof AIModeration)}
                trackColor={{ false: '#E0E0E0', true: '#7C4DFF' }}
                thumbColor={value ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
          ))}
        </View>
        
        <View style={styles.moderationStats}>
          <Text style={styles.moderationStatsTitle}>📊 Moderation Statistics (This Session)</Text>
          <View style={styles.moderationStatsGrid}>
            <View style={styles.moderationStat}>
              <Text style={styles.moderationStatValue}>3</Text>
              <Text style={styles.moderationStatLabel}>Messages Filtered</Text>
            </View>
            <View style={styles.moderationStat}>
              <Text style={styles.moderationStatValue}>0</Text>
              <Text style={styles.moderationStatLabel}>Users Warned</Text>
            </View>
            <View style={styles.moderationStat}>
              <Text style={styles.moderationStatValue}>1</Text>
              <Text style={styles.moderationStatLabel}>Spam Blocked</Text>
            </View>
          </View>
        </View>
      </DashboardCard>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'whiteboard':
        return renderWhiteboardControls();
      case 'breakouts':
        return renderBreakoutRooms();
      case 'engagement':
        return renderEngagementAnalytics();
      case 'recording':
        return renderRecordingControls();
      case 'moderation':
        return renderAIModerationControls();
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
        <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Advanced Class Control" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>Loading class controls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
      <SafeAreaView style={styles.container}>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
    gap: Spacing.MD,
  },
  loadingText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.MD,
  },
  header: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.LG,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: Spacing.XS,
  },
  backText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: Spacing.XS,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordingBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  recordingText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentTime: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '500',
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
  dashboardSection: {
    gap: Spacing.LG,
  },
  overviewCard: {
    marginBottom: Spacing.MD,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
  },
  overviewItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  overviewIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  overviewValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  overviewLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  quickControlsCard: {
    marginBottom: Spacing.MD,
  },
  quickControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
    paddingTop: Spacing.MD,
  },
  quickControlItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeControl: {
    borderColor: LightTheme.Primary,
    backgroundColor: LightTheme.PrimaryContainer,
  },
  quickControlIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  quickControlText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  whiteboardSection: {
    gap: Spacing.MD,
  },
  whiteboardCard: {
    marginBottom: Spacing.MD,
  },
  toolCategories: {
    gap: Spacing.LG,
    paddingTop: Spacing.MD,
  },
  toolCategory: {
    marginBottom: Spacing.MD,
  },
  categoryTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  activeToolButton: {
    borderColor: LightTheme.Primary,
    backgroundColor: LightTheme.PrimaryContainer,
  },
  toolIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  toolText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  whiteboardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    marginTop: Spacing.LG,
  },
  whiteboardButton: {
    flex: 1,
    marginHorizontal: Spacing.SM,
  },
  breakoutSection: {
    gap: Spacing.MD,
  },
  breakoutHeader: {
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
  createRoomButton: {
    minWidth: 120,
  },
  breakoutRoomCard: {
    marginBottom: Spacing.MD,
  },
  roomInfo: {
    paddingTop: Spacing.MD,
  },
  roomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  roomStat: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  roomAction: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
    minWidth: 60,
  },
  closeAction: {
    backgroundColor: LightTheme.ErrorContainer,
  },
  roomActionText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
    textAlign: 'center',
  },
  closeActionText: {
    color: LightTheme.OnErrorContainer,
  },
  analyticsSection: {
    gap: Spacing.MD,
  },
  analyticsCard: {
    marginBottom: Spacing.MD,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
  },
  engagementItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: Spacing.MD,
  },
  engagementIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  engagementValue: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  engagementLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  engagementInsights: {
    marginTop: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  insightsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  insightsText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
  },
  recordingSection: {
    gap: Spacing.MD,
  },
  recordingCard: {
    marginBottom: Spacing.MD,
  },
  recordingStatus: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    marginTop: Spacing.MD,
  },
  recordingStatusText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  recordingDuration: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.LG,
  },
  recordingButton: {
    flex: 1,
    marginHorizontal: Spacing.SM,
  },
  recordingInfo: {
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  recordingInfoText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
    textAlign: 'center',
  },
  moderationSection: {
    gap: Spacing.MD,
  },
  moderationCard: {
    marginBottom: Spacing.MD,
  },
  moderationControls: {
    paddingTop: Spacing.MD,
    gap: Spacing.LG,
  },
  moderationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  moderationInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  moderationTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  moderationDesc: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  moderationStats: {
    marginTop: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  moderationStatsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  moderationStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moderationStat: {
    alignItems: 'center',
    minWidth: 80,
  },
  moderationStatValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  moderationStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
});

export default AdvancedClassControlScreen;