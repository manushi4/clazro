/**
 * LiveClassScreen - Basic live class entry screen for teachers
 * Phase 17: Screen Sharing UI
 * Phase 18: Recording Controls
 * Phase 19: Polling & Quiz Integration
 * Enhanced with screen sharing, recording, polling, and quiz functionality
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
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';
import { ParticipantList } from '../../components/teacher/ParticipantList';
import { Participant } from '../../components/teacher/ParticipantCard';
import { AttendanceWidget } from '../../components/teacher/AttendanceWidget';
import { AttendanceSummary } from '../../components/teacher/AttendanceIndicator';
import ChatWindow from '../../components/teacher/ChatWindow';
import { PrivateMessaging } from '../../components/teacher/PrivateMessaging';
import { ParticipantSpotlightManager } from '../../components/teacher/ParticipantSpotlightManager';
import SpotlightControls from '../../components/teacher/SpotlightControls';
import { WhiteboardManager } from '../../components/teacher/WhiteboardManager';
import { ScreenShareControls } from '../../components/teacher/ScreenShareControls';
import { SharedScreenViewer } from '../../components/teacher/SharedScreenViewer';
import { LiveClassControls } from '../../components/teacher/LiveClassControls';
import { RecordingControls } from '../../components/teacher/RecordingControls';
import { RecordingStatus, RecordingStatusCompact } from '../../components/teacher/RecordingStatus';
import { LivePollCreator, PollQuestion } from '../../components/teacher/LivePollCreator';
import { PollResults } from '../../components/teacher/PollResults';
import { QuickQuizCreator, Quiz, QuizQuestion } from '../../components/teacher/QuickQuizCreator';
import { QuizResults, QuizResponse } from '../../components/teacher/QuizResults';
import { PollManager, ActivePoll, ActiveQuiz } from '../../components/teacher/PollManager';

const { width } = Dimensions.get('window');

interface LiveClassScreenProps {
  classId: string;
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface ClassDetails {
  id: string;
  subject: string;
  grade: string;
  time: string;
  duration: string;
  status: 'preparing' | 'live' | 'ended';
  studentsCount: number;
  startTime?: Date;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export const LiveClassScreen: React.FC<LiveClassScreenProps> = ({
  classId,
  teacherName,
  onNavigate,
}) => {
  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [classDetails, setClassDetails] = useState<ClassDetails>({
    id: classId,
    subject: 'Advanced Mathematics',
    grade: 'Grade 11',
    time: '10:00 AM',
    duration: '90 min',
    status: 'preparing',
    studentsCount: 24,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTab, setSelectedTab] = useState<'info' | 'participants' | 'attendance' | 'chat' | 'spotlight' | 'whiteboard' | 'screen_share' | 'controls' | 'recording' | 'polls'>('info');
  const [showPrivateMessaging, setShowPrivateMessaging] = useState(false);
  
  // Spotlight system states
  const [spotlightSettings, setSpotlightSettings] = useState({
    maxSpotlights: 3,
    autoRotationEnabled: false,
    rotationInterval: 180,
  });

  // Phase 17: Screen sharing states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenViewerVisible, setIsScreenViewerVisible] = useState(false);
  const [isScreenViewerFullscreen, setIsScreenViewerFullscreen] = useState(false);

  // Phase 18: Recording states
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'processing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingFileSize, setRecordingFileSize] = useState<string | undefined>(undefined);

  // Phase 19: Polling & Quiz states
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [activePolls, setActivePolls] = useState<ActivePoll[]>([]);
  const [activeQuizzes, setActiveQuizzes] = useState<ActiveQuiz[]>([]);
  const [pollIdCounter, setPollIdCounter] = useState(1);
  const [quizIdCounter, setQuizIdCounter] = useState(1);

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading class details
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    } catch (error) {
      showSnackbar('Failed to load live class details');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (classDetails.status === 'live') {
        Alert.alert(
          'End Class',
          'Are you sure you want to leave? The class is still live.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => true },
            { text: 'Leave', style: 'destructive', onPress: () => { onNavigate('back'); return false; } },
          ]
        );
        return true;
      }
      onNavigate('back');
      return true;
    });
    return backHandler;
  }, [classDetails.status, onNavigate]);

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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize mock participants when class starts
  useEffect(() => {
    if (classDetails.status === 'live' && participants.length === 0) {
      const mockParticipants: Participant[] = [
        {
          id: 'p1',
          name: 'Sarah Chen',
          avatar: '👩‍🎓',
          isPresent: true,
          joinTime: new Date(Date.now() - 300000), // 5 minutes ago
          audioEnabled: true,
          videoEnabled: true,
          handRaised: false,
          connectionStatus: 'excellent',
          role: 'student',
          attendanceStatus: 'present',
        },
        {
          id: 'p2',
          name: 'Alex Johnson',
          avatar: '👨‍🎓',
          isPresent: true,
          joinTime: new Date(Date.now() - 900000), // 15 minutes ago (late)
          audioEnabled: false,
          videoEnabled: true,
          handRaised: true,
          connectionStatus: 'good',
          role: 'student',
          attendanceStatus: 'late',
        },
        {
          id: 'p3',
          name: 'Emily Davis',
          avatar: '👩‍🎓',
          isPresent: true,
          joinTime: new Date(Date.now() - 180000), // 3 minutes ago
          audioEnabled: true,
          videoEnabled: false,
          handRaised: false,
          connectionStatus: 'excellent',
          role: 'student',
          attendanceStatus: 'present',
        },
        {
          id: 'p4',
          name: 'Michael Brown',
          avatar: '👨‍🎓',
          isPresent: true,
          joinTime: new Date(Date.now() - 120000), // 2 minutes ago
          leaveTime: new Date(Date.now() - 60000), // Left 1 minute ago
          audioEnabled: true,
          videoEnabled: true,
          handRaised: false,
          connectionStatus: 'poor',
          role: 'student',
          attendanceStatus: 'left-early',
        },
        {
          id: 'p5',
          name: 'Jessica Wilson',
          avatar: '👩‍🎓',
          isPresent: false,
          joinTime: new Date(Date.now() - 360000), // 6 minutes ago (left)
          audioEnabled: false,
          videoEnabled: false,
          handRaised: false,
          connectionStatus: 'disconnected',
          role: 'student',
          attendanceStatus: 'absent',
        },
        {
          id: 'teacher',
          name: teacherName,
          avatar: '👨‍🏫',
          isPresent: true,
          joinTime: new Date(Date.now() - 600000), // 10 minutes ago
          audioEnabled: true,
          videoEnabled: true,
          handRaised: false,
          connectionStatus: 'excellent',
          role: 'teacher',
          attendanceStatus: 'present',
        },
      ];
      setParticipants(mockParticipants);
    }
  }, [classDetails.status, participants.length, teacherName]);

  // Phase 18: Recording duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (recordingStatus === 'recording' && recordingStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingDuration(elapsed);
        
        // Update estimated file size (rough calculation: ~1MB per minute)
        const estimatedSizeMB = Math.floor(elapsed / 60);
        if (estimatedSizeMB > 0) {
          setRecordingFileSize(`${estimatedSizeMB} MB`);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [recordingStatus, recordingStartTime]);

  const handleStartClass = () => {
    Alert.alert(
      'Start Live Class',
      `Are you ready to start ${classDetails.subject} for ${classDetails.grade}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Class',
          onPress: () => {
            setClassDetails(prev => ({
              ...prev,
              status: 'live',
              startTime: new Date(),
            }));
            Alert.alert('success', 'Live class started successfully!');
          },
        },
      ]
    );
  };

  const handleEndClass = () => {
    Alert.alert(
      'End Live Class',
      'Are you sure you want to end this class?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: () => {
            setClassDetails(prev => ({ ...prev, status: 'ended' }));
            Alert.alert('Class Ended', 'Class ended successfully. Returning to dashboard.', [
              { text: 'OK', onPress: () => onNavigate('back') },
            ]);
          },
        },
      ]
    );
  };

  // Participant management functions
  const handleToggleAudio = (participantId: string) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, audioEnabled: !p.audioEnabled }
          : p
      )
    );
  };

  const handleToggleVideo = (participantId: string) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, videoEnabled: !p.videoEnabled }
          : p
      )
    );
  };

  const handleToggleHandRaise = (participantId: string) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, handRaised: !p.handRaised }
          : p
      )
    );
  };

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants(prev => 
      prev.filter(p => p.id !== participantId)
    );
  };

  // Phase 17: Screen sharing handlers
  const handleToggleScreenShare = (enabled: boolean) => {
    setIsScreenSharing(enabled);
    setIsScreenViewerVisible(enabled);
    console.log('Screen sharing:', enabled ? 'started' : 'stopped');
  };

  // Phase 18: Enhanced recording handlers
  const handleToggleRecording = (enabled: boolean) => {
    setIsRecording(enabled);
    if (enabled) {
      setRecordingStatus('recording');
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      setRecordingFileSize(undefined);
      console.log('Recording: started');
    } else {
      setRecordingStatus('processing');
      setTimeout(() => {
        setRecordingStatus('idle');
        setRecordingStartTime(null);
        setRecordingDuration(0);
        setRecordingFileSize(undefined);
      }, 2000); // Simulate processing time
      console.log('Recording: stopped');
    }
  };

  const handleStartRecording = () => {
    handleToggleRecording(true);
  };

  const handleStopRecording = () => {
    handleToggleRecording(false);
  };

  const handlePauseRecording = () => {
    if (recordingStatus === 'recording') {
      setRecordingStatus('paused');
      console.log('Recording: paused');
    } else if (recordingStatus === 'paused') {
      setRecordingStatus('recording');
      console.log('Recording: resumed');
    }
  };

  // Phase 19: Polling & Quiz handlers
  const handleCreatePoll = (poll: PollQuestion) => {
    const activePoll: ActivePoll = {
      id: `poll_${pollIdCounter}`,
      question: poll,
      responses: [],
      startTime: new Date(),
      isActive: true,
    };
    
    setActivePolls([...activePolls, activePoll]);
    setPollIdCounter(pollIdCounter + 1);
    
    // Auto-end poll after time limit
    if (poll.timeLimit) {
      setTimeout(() => {
        handleEndPoll(activePoll.id);
      }, poll.timeLimit * 1000);
    }
    
    console.log('Poll created:', poll.question);
  };

  const handleCreateQuiz = (quiz: Quiz) => {
    const activeQuiz: ActiveQuiz = {
      id: `quiz_${quizIdCounter}`,
      quiz,
      responses: [],
      startTime: new Date(),
      isActive: true,
    };
    
    setActiveQuizzes([...activeQuizzes, activeQuiz]);
    setQuizIdCounter(quizIdCounter + 1);
    
    // Auto-end quiz after time limit
    if (quiz.timeLimit) {
      setTimeout(() => {
        handleEndQuiz(activeQuiz.id);
      }, quiz.timeLimit * 1000);
    }
    
    console.log('Quiz created:', quiz.title);
  };

  const handleEndPoll = (pollId: string) => {
    setActivePolls(polls => 
      polls.map(poll => 
        poll.id === pollId 
          ? { ...poll, isActive: false, endTime: new Date() }
          : poll
      )
    );
    console.log('Poll ended:', pollId);
  };

  const handleEndQuiz = (quizId: string) => {
    setActiveQuizzes(quizzes => 
      quizzes.map(quiz => 
        quiz.id === quizId 
          ? { ...quiz, isActive: false, endTime: new Date() }
          : quiz
      )
    );
    console.log('Quiz ended:', quizId);
  };

  const handleSharePollResults = (pollId: string) => {
    const poll = activePolls.find(p => p.id === pollId);
    if (poll) {
      Alert.alert(
        'Share Poll Results',
        `Poll results for "${poll.question.question}" have been shared with students.`
      );
      console.log('Poll results shared:', pollId);
    }
  };

  const handleExportQuizResults = (quizId: string) => {
    const quiz = activeQuizzes.find(q => q.id === quizId);
    if (quiz) {
      Alert.alert(
        'Export Quiz Results',
        `Quiz results for "${quiz.quiz.title}" have been exported.`
      );
      console.log('Quiz results exported:', quizId);
    }
  };

  const handleToggleMute = (muted: boolean) => {
    setIsMuted(muted);
    console.log('Audio:', muted ? 'muted' : 'unmuted');
  };

  const handleToggleTeacherVideo = (enabled: boolean) => {
    setIsVideoEnabled(enabled);
    console.log('Video:', enabled ? 'enabled' : 'disabled');
  };

  const handleScreenViewerFullscreen = () => {
    setIsScreenViewerFullscreen(!isScreenViewerFullscreen);
  };

  const handleCloseScreenViewer = () => {
    setIsScreenViewerVisible(false);
    setIsScreenViewerFullscreen(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'participants',
      title: 'View Participants',
      icon: '👥',
      color: '#2196F3',
      onPress: () => setSelectedTab(selectedTab === 'participants' ? 'info' : 'participants'),
    },
    {
      id: 'chat',
      title: 'Class Chat',
      icon: '💬',
      color: '#4CAF50',
      onPress: () => setSelectedTab(selectedTab === 'chat' ? 'info' : 'chat'),
    },
    {
      id: 'spotlight',
      title: 'Spotlight',
      icon: '🎯',
      color: '#E91E63',
      onPress: () => setSelectedTab(selectedTab === 'spotlight' ? 'info' : 'spotlight'),
    },
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      icon: '📝',
      color: '#FF9800',
      onPress: () => setSelectedTab(selectedTab === 'whiteboard' ? 'info' : 'whiteboard'),
    },
    {
      id: 'screen-share',
      title: 'Screen Share',
      icon: '🖥️',
      color: '#9C27B0',
      onPress: () => setSelectedTab(selectedTab === 'screen_share' ? 'info' : 'screen_share'),
    },
    {
      id: 'recording',
      title: 'Recording',
      icon: '🎥',
      color: '#F44336',
      onPress: () => setSelectedTab(selectedTab === 'recording' ? 'info' : 'recording'),
    },
    {
      id: 'poll',
      title: 'Create Poll',
      icon: '📊',
      color: '#795548',
      onPress: () => setShowPollCreator(true),
    },
    {
      id: 'quiz',
      title: 'Create Quiz',
      icon: '🧠',
      color: '#3F51B5',
      onPress: () => setShowQuizCreator(true),
    },
  ];

  const getStatusColor = () => {
    switch (classDetails.status) {
      case 'live':
        return '#4CAF50';
      case 'preparing':
        return '#FF9800';
      case 'ended':
        return '#9E9E9E';
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  const getStatusText = () => {
    switch (classDetails.status) {
      case 'live':
        return 'LIVE';
      case 'preparing':
        return 'PREPARING';
      case 'ended':
        return 'ENDED';
      default:
        return 'UNKNOWN';
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
      <Appbar.BackAction onPress={() => {
        if (classDetails.status === 'live') {
          Alert.alert(
            'End Class',
            'Are you sure you want to leave? The class is still live.',
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
        title="Live Class"
        subtitle={`${classDetails.subject} • ${getStatusText()}`}
      />
      {recordingStatus !== 'idle' && (
        <View style={styles.headerRecordingStatus}>
          <RecordingStatusCompact
            status={recordingStatus}
            duration={recordingDuration}
            fileSize={recordingFileSize}
          />
        </View>
      )}
      <Appbar.Action icon="clock-outline" onPress={() => {}} />
    </Appbar.Header>
  );

  const renderClassInfo = () => (
    <DashboardCard
      title="Class Information"
      style={styles.classInfoCard}
    >
      <View style={styles.classInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Subject:</Text>
          <Text style={styles.infoValue}>{classDetails.subject}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Grade:</Text>
          <Text style={styles.infoValue}>{classDetails.grade}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scheduled Time:</Text>
          <Text style={styles.infoValue}>{classDetails.time}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValue}>{classDetails.duration}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Expected Students:</Text>
          <Text style={styles.infoValue}>{classDetails.studentsCount}</Text>
        </View>
        {classDetails.startTime && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Started At:</Text>
            <Text style={styles.infoValue}>
              {classDetails.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>
      
      {/* Participant Summary Widget */}
      {classDetails.status === 'live' && participants.length > 0 && (
        <View style={styles.participantSummary}>
          <Text style={styles.summaryTitle}>Live Participant Status</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>✅</Text>
              <Text style={styles.summaryValue}>
                {participants.filter(p => p.isPresent).length}
              </Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>✋</Text>
              <Text style={styles.summaryValue}>
                {participants.filter(p => p.handRaised).length}
              </Text>
              <Text style={styles.summaryLabel}>Hand Raised</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>🎤</Text>
              <Text style={styles.summaryValue}>
                {participants.filter(p => p.audioEnabled && p.isPresent).length}
              </Text>
              <Text style={styles.summaryLabel}>Audio On</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📹</Text>
              <Text style={styles.summaryValue}>
                {participants.filter(p => p.videoEnabled && p.isPresent).length}
              </Text>
              <Text style={styles.summaryLabel}>Video On</Text>
            </View>
          </View>
          
          {participants.filter(p => p.handRaised).length > 0 && (
            <View style={styles.handRaisedAlert}>
              <Text style={styles.alertText}>
                {participants.filter(p => p.handRaised).length} student(s) have raised their hand!
              </Text>
            </View>
          )}
        </View>
      )}
    </DashboardCard>
  );

  const renderMainControls = () => (
    <View style={styles.mainControlsSection}>
      {classDetails.status === 'preparing' && (
        <CoachingButton
          title="🚀 Start Live Class"
          variant="primary"
          size="large"
          onPress={handleStartClass}
          style={styles.mainControlButton}
          testID="start-class-button"
        />
      )}

      {classDetails.status === 'live' && (
        <CoachingButton
          title="⏹️ End Class"
          variant="secondary"
          size="large"
          onPress={handleEndClass}
          style={styles.mainControlButton}
          testID="end-class-button"
        />
      )}

      {classDetails.status === 'ended' && (
        <View style={styles.endedState}>
          <Text style={styles.endedIcon}>✅</Text>
          <Text style={styles.endedTitle}>Class Completed</Text>
          <Text style={styles.endedDescription}>
            Great job! Your class has been successfully completed.
          </Text>
          <CoachingButton
            title="Return to Dashboard"
            variant="primary"
            size="medium"
            onPress={() => onNavigate('back')}
            style={styles.returnButton}
          />
        </View>
      )}
    </View>
  );

  const renderTabNavigation = () => {
    if (classDetails.status !== 'live') return null;

    return (
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'info' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('info')}
          testID="tab-info"
        >
          <Text style={styles.tabIcon}>ℹ️</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'info' && styles.activeTabText
          ]}>
            Class Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'participants' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('participants')}
          testID="tab-participants"
        >
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'participants' && styles.activeTabText
          ]}>
            Participants
          </Text>
          <View style={styles.attendanceSummaryTab}>
            <AttendanceSummary
              presentCount={participants.filter(p => p.isPresent).length}
              totalCount={participants.length}
              size="small"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'attendance' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('attendance')}
          testID="tab-attendance"
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'attendance' && styles.activeTabText
          ]}>
            Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'chat' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('chat')}
          testID="tab-chat"
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'chat' && styles.activeTabText
          ]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'spotlight' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('spotlight')}
          testID="tab-spotlight"
        >
          <Text style={styles.tabIcon}>🎯</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'spotlight' && styles.activeTabText
          ]}>
            Spotlight
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'whiteboard' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('whiteboard')}
          testID="tab-whiteboard"
        >
          <Text style={styles.tabIcon}>📝</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'whiteboard' && styles.activeTabText
          ]}>
            Whiteboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'screen_share' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('screen_share')}
          testID="tab-screen-share"
        >
          <Text style={styles.tabIcon}>🖥️</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'screen_share' && styles.activeTabText
          ]}>
            Screen Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'controls' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('controls')}
          testID="tab-controls"
        >
          <Text style={styles.tabIcon}>🎛️</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'controls' && styles.activeTabText
          ]}>
            Controls
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'recording' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('recording')}
          testID="tab-recording"
        >
          <Text style={styles.tabIcon}>🎥</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'recording' && styles.activeTabText
          ]}>
            Recording
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'polls' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('polls')}
          testID="tab-polls"
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[
            styles.tabText,
            selectedTab === 'polls' && styles.activeTabText
          ]}>
            Polls & Quizzes
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTabContent = () => {
    if (classDetails.status !== 'live') {
      return renderQuickActions();
    }

    switch (selectedTab) {
      case 'participants':
        return renderParticipantManagement();
      case 'attendance':
        return renderAttendanceTracking();
      case 'chat':
        return renderChatSystem();
      case 'spotlight':
        return renderSpotlightSystem();
      case 'whiteboard':
        return renderWhiteboardSystem();
      case 'screen_share':
        return renderScreenShareSystem();
      case 'controls':
        return renderLiveClassControls();
      case 'recording':
        return renderRecordingControls();
      case 'polls':
        return renderPollsAndQuizzes();
      case 'info':
      default:
        return renderQuickActions();
    }
  };

  const renderParticipantManagement = () => (
    <DashboardCard title="Participant Management" style={styles.participantManagementCard}>
      <ParticipantList
        participants={participants}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleTeacherVideo}
        onToggleHandRaise={handleToggleHandRaise}
        onRemoveParticipant={handleRemoveParticipant}
        isTeacherView={true}
        maxHeight={400}
      />
    </DashboardCard>
  );

  const renderAttendanceTracking = () => (
    <View style={styles.attendanceSection}>
      <AttendanceWidget
        participants={participants}
        classStartTime={classDetails.startTime}
        expectedStudents={classDetails.studentsCount}
        onTimeThreshold={5}
      />
      
      <DashboardCard title="Participant Attendance Details" style={styles.attendanceDetailsCard}>
        <ParticipantList
          participants={participants}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleTeacherVideo}
          onToggleHandRaise={handleToggleHandRaise}
          onRemoveParticipant={handleRemoveParticipant}
          isTeacherView={true}
          maxHeight={300}
        />
      </DashboardCard>
    </View>
  );

  const renderChatSystem = () => {
    // Convert participants to chat participants format
    const chatParticipants = participants.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      role: p.role,
      isOnline: p.isPresent,
    }));

    return (
      <View style={styles.chatSection}>
        <View style={styles.chatHeader}>
          <View style={styles.chatTitleSection}>
            <Text style={styles.chatTitle}>💬 Live Class Chat</Text>
            <TouchableOpacity
              style={styles.privateMessageButton}
              onPress={() => setShowPrivateMessaging(true)}
              testID="private-messages-button"
            >
              <Text style={styles.privateMessageIcon}>🔒</Text>
              <Text style={styles.privateMessageText}>Private</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.chatSubtitle}>
            {participants.filter(p => p.isPresent).length} participants online
          </Text>
        </View>
        
        <ChatWindow
          currentUserId={teacherName} // Using teacherName as current user ID
          currentUserRole="teacher"
          participants={chatParticipants}
          classId={classId}
          maxHeight={500}
        />
      </View>
    );
  };

  // Spotlight system handlers
  const handleSpotlightAction = (action: string, participantId: string, data?: any) => {
    switch (action) {
      case 'add':
        console.log('Spotlight added for participant:', participantId, data);
        break;
      case 'remove':
        console.log('Spotlight removed for participant:', participantId);
        break;
      case 'extend':
        console.log('Spotlight extended for participant:', participantId, 'by', data, 'seconds');
        break;
      case 'rotate':
        console.log('Spotlight rotated, participant:', participantId);
        break;
      case 'record':
        Alert.alert('Recording', 'Recording feature will be available in Phase 18');
        break;
      case 'screenshot':
        Alert.alert('Screenshot', 'Screenshot taken for participant ' + (participants.find(p => p.id === participantId)?.name || participantId));
        break;
      default:
        console.log('Unknown spotlight action:', action);
    }
  };

  const handleSpotlightSettingsChange = (settings: { maxSpotlights: number; autoRotationEnabled: boolean; rotationInterval: number }) => {
    setSpotlightSettings(settings);
    console.log('Spotlight settings updated:', settings);
  };

  const renderSpotlightSystem = () => (
    <View style={styles.spotlightSection}>
      <ParticipantSpotlightManager
        participants={participants}
        isTeacherView={true}
        onParticipantUpdate={(updatedParticipant) => {
          setParticipants(prev => 
            prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
          );
        }}
        onSpotlightAction={handleSpotlightAction}
        classStartTime={classDetails.startTime}
        maxHeight={400}
      />
      
      <SpotlightControls
        participants={participants}
        activeSpotlights={[]}
        onAddSpotlight={(participantId, spotlight) => {
          console.log('Adding spotlight:', participantId, spotlight);
          handleSpotlightAction('add', participantId, spotlight);
        }}
        onRemoveSpotlight={(participantId) => {
          handleSpotlightAction('remove', participantId);
        }}
        onUpdateSpotlight={(participantId, updates) => {
          console.log('Updating spotlight:', participantId, updates);
        }}
        maxSpotlights={spotlightSettings.maxSpotlights}
        autoRotationEnabled={spotlightSettings.autoRotationEnabled}
        rotationInterval={spotlightSettings.rotationInterval}
        onSettingsChange={handleSpotlightSettingsChange}
      />
    </View>
  );

  const renderWhiteboardSystem = () => (
    <View style={styles.whiteboardSection}>
      <WhiteboardManager
        isTeacherView={true}
        onPathsChanged={(paths) => {
          console.log('Whiteboard paths changed:', paths.length, 'paths');
        }}
        width={width * 0.95}
        height={400}
      />
    </View>
  );

  const renderScreenShareSystem = () => (
    <View style={styles.screenShareSection}>
      <ScreenShareControls
        isSharing={isScreenSharing}
        onToggleShare={handleToggleScreenShare}
        onSelectWindow={() => console.log('Window selection requested')}
        onSelectRegion={() => console.log('Region selection requested')}
        isTeacherView={true}
      />
      
      {isScreenViewerVisible && (
        <SharedScreenViewer
          streamUrl={isScreenSharing ? 'mock-stream-url' : undefined}
          isVisible={isScreenViewerVisible}
          isFullscreen={isScreenViewerFullscreen}
          onFullscreenToggle={handleScreenViewerFullscreen}
          onClose={handleCloseScreenViewer}
          sharerName={teacherName}
          isTeacherView={true}
        />
      )}
    </View>
  );

  const renderLiveClassControls = () => (
    <View style={styles.controlsSection}>
      <LiveClassControls
        isClassActive={classDetails.status === 'live'}
        participantCount={participants.length}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={handleToggleScreenShare}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleTeacherVideo}
        onShowParticipants={() => setSelectedTab('participants')}
        onShowChat={() => setSelectedTab('chat')}
        onShowWhiteboard={() => setSelectedTab('whiteboard')}
        onShowSettings={() => Alert.alert('Settings', 'Advanced settings coming in future updates')}
        onEndClass={handleEndClass}
        onShowPolls={() => Alert.alert('Polls', 'Interactive polls coming in Phase 19')}
        onShowBreakoutRooms={() => Alert.alert('Breakout Rooms', 'Breakout room management coming in future updates')}
        isTeacherView={true}
      />
    </View>
  );

  const renderQuickActions = () => (
    <DashboardCard title="Quick Actions" style={styles.quickActionsCard}>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionItem, { borderLeftColor: action.color }]}
            onPress={action.onPress}
            disabled={classDetails.status !== 'live' && action.id !== 'participants'}
            testID={`quick-action-${action.id}`}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text 
              style={[
                styles.quickActionTitle,
                (classDetails.status !== 'live' && action.id !== 'participants') && styles.disabledText
              ]}
            >
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {classDetails.status !== 'live' && (
        <Text style={styles.actionsNote}>
          Most actions will be available once the class starts
        </Text>
      )}
    </DashboardCard>
  );

  // Phase 18: Recording controls render function
  const renderRecordingControls = () => (
    <View style={styles.recordingSection}>
      <RecordingControls
        isRecording={recordingStatus === 'recording' || recordingStatus === 'paused'}
        recordingDuration={recordingDuration}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPauseRecording={handlePauseRecording}
        isTeacherView={true}
      />
      
      {recordingStatus !== 'idle' && (
        <View style={styles.recordingStatusContainer}>
          <RecordingStatus
            status={recordingStatus}
            duration={recordingDuration}
            fileSize={recordingFileSize}
          />
        </View>
      )}
    </View>
  );

  // Phase 19: Polls and quizzes render function
  const renderPollsAndQuizzes = () => (
    <View style={styles.pollsSection}>
      <PollManager
        activePolls={activePolls}
        activeQuizzes={activeQuizzes}
        onEndPoll={handleEndPoll}
        onEndQuiz={handleEndQuiz}
        onSharePollResults={handleSharePollResults}
        onExportQuizResults={handleExportQuizResults}
        isTeacherView={true}
      />
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading live class...</Text>
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
          {renderClassInfo()}
          {renderMainControls()}
          {renderTabNavigation()}
          {renderTabContent()}
        </ScrollView>

        {/* Private Messaging Modal */}
        <PrivateMessaging
          visible={showPrivateMessaging}
          onClose={() => setShowPrivateMessaging(false)}
          currentUserId={teacherName}
          currentUserRole="teacher"
          participants={participants.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            role: p.role,
            isOnline: p.isPresent,
          }))}
          classId={classId}
        />

        {/* Phase 19: Polling & Quiz Modals */}
        <LivePollCreator
          visible={showPollCreator}
          onClose={() => setShowPollCreator(false)}
          onCreatePoll={handleCreatePoll}
          isTeacherView={true}
        />

        <QuickQuizCreator
          visible={showQuizCreator}
          onClose={() => setShowQuizCreator(false)}
          onCreateQuiz={handleCreateQuiz}
          isTeacherView={true}
        />

        {/* Snackbar for notifications */}
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
    padding: Spacing.XL,
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
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
  currentTime: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Phase 18: Header recording status styles
  statusContainer: {
    alignItems: 'center',
    gap: Spacing.XS,
  },
  headerRecordingStatus: {
    marginTop: Spacing.XS,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.LG,
    paddingBottom: Spacing.XXL,
  },
  classInfoCard: {
    marginBottom: Spacing.LG,
  },
  classInfo: {
    paddingTop: Spacing.MD,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  infoLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  mainControlsSection: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  mainControlButton: {
    width: '100%',
    maxWidth: 300,
  },
  endedState: {
    alignItems: 'center',
    padding: Spacing.XL,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
  },
  endedIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  endedTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  endedDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  returnButton: {
    minWidth: 200,
  },
  quickActionsCard: {
    marginBottom: Spacing.LG,
  },
  quickActionsGrid: {
    paddingTop: Spacing.MD,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    marginBottom: Spacing.SM,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    borderLeftWidth: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    width: 32,
    textAlign: 'center',
  },
  quickActionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  disabledText: {
    color: LightTheme.OnSurfaceVariant,
    opacity: 0.6,
  },
  actionsNote: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.MD,
    fontStyle: 'italic',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  activeTab: {
    backgroundColor: LightTheme.PrimaryContainer,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  activeTabText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '600',
  },
  participantManagementCard: {
    marginBottom: Spacing.LG,
  },
  attendanceSection: {
    flex: 1,
  },
  attendanceDetailsCard: {
    marginTop: Spacing.LG,
  },
  attendanceSummaryTab: {
    marginLeft: Spacing.SM,
  },
  chatSection: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderTopLeftRadius: BorderRadius.MD,
    borderTopRightRadius: BorderRadius.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  chatTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  chatTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  privateMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.SecondaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  privateMessageIcon: {
    fontSize: 14,
    marginRight: Spacing.XS,
  },
  privateMessageText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSecondaryContainer,
  },
  chatSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  participantSummary: {
    marginTop: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  summaryTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  summaryValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  handRaisedAlert: {
    backgroundColor: LightTheme.ErrorContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  alertText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnErrorContainer,
    fontWeight: '600',
  },
  
  // Spotlight section styles
  spotlightSection: {
    gap: Spacing.MD,
  },
  whiteboardSection: {
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.SM,
  },
  screenShareSection: {
    flex: 1,
    gap: Spacing.MD,
  },
  controlsSection: {
    flex: 1,
  },
  // Phase 18: Recording styles
  recordingSection: {
    flex: 1,
    gap: Spacing.MD,
  },
  recordingStatusContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  // Phase 19: Polls & Quiz styles
  pollsSection: {
    flex: 1,
  },
});

export default LiveClassScreen;