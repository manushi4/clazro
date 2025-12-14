import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  Switch,
  Animated,
  StatusBar,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface VoiceAssessment {
  id: string;
  title: string;
  subject: string;
  type: 'oral-exam' | 'conversational' | 'pronunciation' | 'presentation' | 'interview';
  duration: number;
  language: 'hindi' | 'english' | 'mixed' | 'regional';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: VoiceQuestion[];
  totalStudents: number;
  completedStudents: number;
  averageScore: number;
  createdAt: Date;
  deadline: Date;
  isActive: boolean;
  aiAccuracy: number;
}

interface VoiceQuestion {
  id: string;
  text: string;
  expectedResponse: string[];
  type: 'open-ended' | 'guided' | 'structured';
  maxDuration: number;
  evaluationCriteria: {
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    grammar: number;
    content: number;
  };
  aiKeywords: string[];
}

interface StudentVoiceResponse {
  id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  questionId: string;
  audioUrl: string;
  transcription: string;
  duration: number;
  scores: {
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    grammar: number;
    content: number;
    overall: number;
  };
  aiConfidence: number;
  feedback: string[];
  improvementSuggestions: string[];
  submittedAt: Date;
  reviewStatus: 'pending' | 'ai-reviewed' | 'teacher-reviewed' | 'final';
}

interface VoiceProctoringSession {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'interrupted' | 'flagged';
  biometricVerified: boolean;
  environmentScore: number;
  suspiciousActivities: SuspiciousActivity[];
  voicePrint: string;
  confidenceLevel: number;
}

interface SuspiciousActivity {
  id: string;
  type: 'background-noise' | 'multiple-voices' | 'device-switch' | 'environment-change' | 'silence-break';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidenceUrl?: string;
  aiConfidence: number;
}

interface AssessmentAnalytics {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  averageAccuracy: number;
  totalStudentResponses: number;
  aiProcessingTime: number;
  languageDistribution: {
    hindi: number;
    english: number;
    mixed: number;
    regional: number;
  };
  subjectPerformance: {
    subject: string;
    averageScore: number;
    completionRate: number;
  }[];
}

const VoiceAIAssessmentSystem: React.FC<{
  teacherId: string;
  onNavigate: (screen: string) => void;
}> = ({ teacherId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'assessments' | 'responses' | 'proctoring'>('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<VoiceAssessment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recordingAnimation] = useState(new Animated.Value(1));
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
      if (showCreateModal) {
        setShowCreateModal(false);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showCreateModal]);

  // Initialize screen
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    };
    init();
  }, []);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Mock data
  const [assessmentAnalytics] = useState<AssessmentAnalytics>({
    totalAssessments: 45,
    activeAssessments: 8,
    completedAssessments: 37,
    averageAccuracy: 94.5,
    totalStudentResponses: 1250,
    aiProcessingTime: 2.3,
    languageDistribution: {
      hindi: 35,
      english: 40,
      mixed: 20,
      regional: 5,
    },
    subjectPerformance: [
      { subject: 'English Literature', averageScore: 87.5, completionRate: 94 },
      { subject: 'Hindi Language', averageScore: 89.2, completionRate: 96 },
      { subject: 'Science Communication', averageScore: 85.8, completionRate: 91 },
      { subject: 'History Discussion', averageScore: 88.1, completionRate: 93 },
    ],
  });

  const [voiceAssessments] = useState<VoiceAssessment[]>([
    {
      id: '1',
      title: 'English Poetry Recitation & Analysis',
      subject: 'English Literature',
      type: 'presentation',
      duration: 15,
      language: 'english',
      difficulty: 'intermediate',
      questions: [],
      totalStudents: 32,
      completedStudents: 28,
      averageScore: 87.5,
      createdAt: new Date('2024-12-01'),
      deadline: new Date('2024-12-15'),
      isActive: true,
      aiAccuracy: 96.2,
    },
    {
      id: '2',
      title: 'Hindi Vyakaran Mulyankan',
      subject: 'Hindi Language',
      type: 'conversational',
      duration: 20,
      language: 'hindi',
      difficulty: 'advanced',
      questions: [],
      totalStudents: 28,
      completedStudents: 25,
      averageScore: 89.2,
      createdAt: new Date('2024-11-28'),
      deadline: new Date('2024-12-12'),
      isActive: true,
      aiAccuracy: 94.8,
    },
    {
      id: '3',
      title: 'Science Concept Explanation',
      subject: 'Science Communication',
      type: 'oral-exam',
      duration: 25,
      language: 'mixed',
      difficulty: 'intermediate',
      questions: [],
      totalStudents: 35,
      completedStudents: 35,
      averageScore: 85.8,
      createdAt: new Date('2024-11-25'),
      deadline: new Date('2024-12-10'),
      isActive: false,
      aiAccuracy: 93.5,
    },
  ]);

  const [studentResponses] = useState<StudentVoiceResponse[]>([
    {
      id: '1',
      studentId: 'student_1',
      studentName: 'अनिका शर्मा',
      assessmentId: '1',
      questionId: 'q1',
      audioUrl: 'audio_1.wav',
      transcription: 'Shall I compare thee to a summer\'s day? Thou art more lovely and more temperate...',
      duration: 145,
      scores: {
        pronunciation: 92,
        fluency: 88,
        vocabulary: 90,
        grammar: 85,
        content: 87,
        overall: 88.4,
      },
      aiConfidence: 94.5,
      feedback: [
        'Excellent pronunciation of classical English',
        'Good emotional expression in delivery',
        'Minor hesitation in rhythm'
      ],
      improvementSuggestions: [
        'Practice maintaining consistent rhythm',
        'Work on smoother transitions between verses'
      ],
      submittedAt: new Date('2024-12-05T10:30:00'),
      reviewStatus: 'ai-reviewed',
    },
    {
      id: '2',
      studentId: 'student_2',
      studentName: 'राहुल गुप्ता',
      assessmentId: '2',
      questionId: 'q2',
      audioUrl: 'audio_2.wav',
      transcription: 'व्याकरण हमारी भाषा की आधारशिला है। इसके बिना हम अपने विचारों को स्पष्ट रूप से व्यक्त नहीं कर सकते।',
      duration: 180,
      scores: {
        pronunciation: 95,
        fluency: 91,
        vocabulary: 89,
        grammar: 93,
        content: 90,
        overall: 91.6,
      },
      aiConfidence: 96.8,
      feedback: [
        'Outstanding Hindi pronunciation',
        'Clear articulation and good pace',
        'Excellent use of grammatical structures'
      ],
      improvementSuggestions: [
        'Continue maintaining this excellent level',
        'Consider exploring more complex vocabulary'
      ],
      submittedAt: new Date('2024-12-04T14:15:00'),
      reviewStatus: 'teacher-reviewed',
    },
  ]);

  const [proctoringSessions] = useState<VoiceProctoringSession[]>([
    {
      id: '1',
      assessmentId: '1',
      studentId: 'student_1',
      studentName: 'अनिका शर्मा',
      startTime: new Date('2024-12-05T10:00:00'),
      endTime: new Date('2024-12-05T10:15:00'),
      status: 'completed',
      biometricVerified: true,
      environmentScore: 95,
      suspiciousActivities: [],
      voicePrint: 'vp_12345abcdef',
      confidenceLevel: 98.2,
    },
    {
      id: '2',
      assessmentId: '2',
      studentId: 'student_3',
      studentName: 'प्रिया पटेल',
      startTime: new Date('2024-12-05T11:00:00'),
      status: 'active',
      biometricVerified: true,
      environmentScore: 78,
      suspiciousActivities: [
        {
          id: 'sa_1',
          type: 'background-noise',
          timestamp: new Date('2024-12-05T11:05:00'),
          severity: 'low',
          description: 'Minor background conversation detected',
          aiConfidence: 87.3,
        },
      ],
      voicePrint: 'vp_67890fedcba',
      confidenceLevel: 89.7,
    },
  ]);

  const startRecordingAnimation = () => {
    setIsRecording(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecordingAnimation = () => {
    setIsRecording(false);
    recordingAnimation.stopAnimation();
    recordingAnimation.setValue(1);
  };

  const renderDashboard = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Analytics Overview */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.MD }]}>
          Voice AI Assessment Analytics
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[
            { label: 'Total Assessments', value: assessmentAnalytics.totalAssessments.toString(), color: '#2196F3' },
            { label: 'Active Now', value: assessmentAnalytics.activeAssessments.toString(), color: '#4CAF50' },
            { label: 'AI Accuracy', value: `${assessmentAnalytics.averageAccuracy}%`, color: '#FF9800' },
            { label: 'Processing Time', value: `${assessmentAnalytics.aiProcessingTime}s`, color: '#9C27B0' },
          ].map((metric, index) => (
            <View key={index} style={{
              width: '48%',
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
              alignItems: 'center',
            }}>
              <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                {metric.value}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                {metric.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Language Distribution */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
          Language Distribution
        </Text>

        {Object.entries(assessmentAnalytics.languageDistribution).map(([language, percentage]) => (
          <View key={language} style={{ marginBottom: Spacing.MD }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[Typography.bodyMedium, { textTransform: 'capitalize' }]}>{language}</Text>
              <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>{percentage}%</Text>
            </View>
            <View style={{
              height: 8,
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 4,
            }}>
              <View style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: language === 'hindi' ? '#FF9800' : 
                               language === 'english' ? '#2196F3' : 
                               language === 'mixed' ? '#4CAF50' : '#9C27B0',
                borderRadius: 4,
              }} />
            </View>
          </View>
        ))}
      </View>

      {/* Subject Performance */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
          Subject Performance Analysis
        </Text>

        {assessmentAnalytics.subjectPerformance.map((subject, index) => (
          <View key={index} style={{
            backgroundColor: LightTheme.SurfaceVariant,
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodyLarge, { fontWeight: '600' }]}>{subject.subject}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: LightTheme.Primary }]}>
                  {subject.averageScore}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {subject.completionRate}% completion
                </Text>
              </View>
            </View>
            <View style={{
              height: 4,
              backgroundColor: LightTheme.Outline + '30',
              borderRadius: 2,
            }}>
              <View style={{
                height: '100%',
                width: `${subject.averageScore}%`,
                backgroundColor: LightTheme.Primary,
                borderRadius: 2,
              }} />
            </View>
          </View>
        ))}
      </View>

      {/* Live Proctoring Sessions */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
            Live Proctoring Sessions
          </Text>
          <View style={{
            backgroundColor: '#E8F5E8',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#4CAF50',
              marginRight: 4,
            }} />
            <Text style={[Typography.bodySmall, { color: '#2E7D32', fontSize: 10 }]}>
              {proctoringsessions.filter(s => s.status === 'active').length} Active
            </Text>
          </View>
        </View>

        {proctoringServices.filter(s => s.status === 'active' || s.status === 'flagged').slice(0, 3).map((session) => (
          <View key={session.id} style={{
            backgroundColor: session.status === 'flagged' ? '#FFEBEE' : LightTheme.SurfaceVariant,
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
            borderLeftWidth: 4,
            borderLeftColor: session.status === 'active' ? '#4CAF50' : 
                            session.status === 'flagged' ? '#F44336' : '#9E9E9E',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyLarge, { fontWeight: '600' }]}>
                  {session.studentName}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  Assessment: {voiceAssessments.find(a => a.id === session.assessmentId)?.title || 'Unknown'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{
                  backgroundColor: session.status === 'active' ? '#E8F5E8' : '#FFEBEE',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={[Typography.bodySmall, {
                    color: session.status === 'active' ? '#2E7D32' : '#D32F2F',
                    fontSize: 10,
                    textTransform: 'uppercase',
                  }]}>
                    {session.status}
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  Confidence: {session.confidenceLevel}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Environment Score: {session.environmentScore}% • 
                {session.suspiciousActivities.length} alerts
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: LightTheme.Primary,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
                onPress={() => setActiveTab('proctoring')}
              >
                <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
                  Monitor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Secondary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('proctoring')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSecondary, fontWeight: '600' }]}>
            View All Sessions
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAssessments = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={voiceAssessments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedAssessment(item)}
            style={{
              backgroundColor: LightTheme.Surface,
              borderRadius: 12,
              padding: Spacing.MD,
              marginHorizontal: Spacing.MD,
              marginBottom: Spacing.SM,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600' }]}>
                  {item.title}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {item.subject} • {item.duration} mins • {item.language}
                </Text>
              </View>
              <View style={{
                backgroundColor: item.isActive ? '#E8F5E8' : '#F5F5F5',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={[Typography.bodySmall, {
                  color: item.isActive ? '#2E7D32' : '#666',
                  fontSize: 10,
                  fontWeight: '600',
                }]}>
                  {item.isActive ? 'Active' : 'Completed'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {item.completedStudents}/{item.totalStudents} students completed
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.Primary, fontWeight: '600' }]}>
                Avg: {item.averageScore}% • AI: {item.aiAccuracy}%
              </Text>
            </View>

            <View style={{
              height: 4,
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 2,
              marginBottom: Spacing.SM,
            }}>
              <View style={{
                height: '100%',
                width: `${(item.completedStudents / item.totalStudents) * 100}%`,
                backgroundColor: LightTheme.Primary,
                borderRadius: 2,
              }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Deadline: {item.deadline.toLocaleDateString('hi-IN')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="mic" size={16} color={LightTheme.Primary} />
                <Text style={[Typography.bodySmall, { color: LightTheme.Primary, marginLeft: 4 }]}>
                  Voice AI
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: Spacing.MD,
            paddingVertical: Spacing.SM,
          }}>
            <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
              Voice Assessments
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                backgroundColor: LightTheme.Primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Icon name="add" size={16} color={LightTheme.OnPrimary} />
              <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, marginLeft: 4, fontWeight: '600' }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  // AI Assessment Creator Component
  const renderAssessmentCreator = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
      title: '',
      subject: '',
      type: 'oral-exam',
      duration: 30,
      language: 'english',
      difficulty: 'intermediate',
      questions: [],
      proctoring: true,
      adaptiveQuestions: false,
    });

    const steps = ['Basic Info', 'Questions', 'Settings', 'Review'];

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Progress Indicator */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: Spacing.LG,
          backgroundColor: LightTheme.Surface,
          marginBottom: Spacing.MD,
        }}>
          {steps.map((step, index) => (
            <View key={index} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: index <= currentStep ? LightTheme.Primary : LightTheme.SurfaceVariant,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <Text style={[Typography.bodySmall, { 
                  color: index <= currentStep ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                  fontWeight: '600' 
                }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[Typography.bodySmall, { 
                color: index <= currentStep ? LightTheme.Primary : LightTheme.OnSurfaceVariant 
              }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Form Content */}
        <View style={{ padding: Spacing.LG }}>
          {currentStep === 0 && (
            <View>
              <Text style={[Typography.titleLarge, { marginBottom: Spacing.LG }]}>Assessment Details</Text>
              
              <View style={{ marginBottom: Spacing.MD }}>
                <Text style={[Typography.bodyMedium, { marginBottom: Spacing.SM, fontWeight: '600' }]}>Title</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: LightTheme.Outline,
                    borderRadius: 8,
                    padding: Spacing.MD,
                    backgroundColor: LightTheme.Surface,
                  }}
                  value={formData.title}
                  onChangeText={(text) => setFormData({...formData, title: text})}
                  placeholder="Enter assessment title"
                />
              </View>

              <View style={{ marginBottom: Spacing.MD }}>
                <Text style={[Typography.bodyMedium, { marginBottom: Spacing.SM, fontWeight: '600' }]}>Subject</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['English', 'Hindi', 'Math', 'Science', 'History'].map((subject) => (
                    <TouchableOpacity
                      key={subject}
                      onPress={() => setFormData({...formData, subject})}
                      style={{
                        backgroundColor: formData.subject === subject ? LightTheme.Primary : LightTheme.SurfaceVariant,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{
                        color: formData.subject === subject ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                      }}>
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: Spacing.MD }}>
                <Text style={[Typography.bodyMedium, { marginBottom: Spacing.SM, fontWeight: '600' }]}>Assessment Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { key: 'oral-exam', label: 'Oral Exam' },
                    { key: 'conversational', label: 'Conversation' },
                    { key: 'pronunciation', label: 'Pronunciation' },
                    { key: 'presentation', label: 'Presentation' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      onPress={() => setFormData({...formData, type: type.key})}
                      style={{
                        backgroundColor: formData.type === type.key ? LightTheme.Primary : LightTheme.SurfaceVariant,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{
                        color: formData.type === type.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                      }}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View>
              <Text style={[Typography.titleLarge, { marginBottom: Spacing.LG }]}>AI Question Generation</Text>
              
              <View style={{
                backgroundColor: LightTheme.PrimaryContainer,
                padding: Spacing.MD,
                borderRadius: 12,
                marginBottom: Spacing.LG,
              }}>
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimaryContainer, marginBottom: Spacing.SM }]}>
                  AI-Powered Question Creation
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer }]}>
                  Our AI will generate contextual questions based on your curriculum and difficulty preferences.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: LightTheme.Primary,
                  padding: Spacing.MD,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: Spacing.MD,
                }}
              >
                <Icon name="auto-fix-high" size={24} color={LightTheme.OnPrimary} />
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, marginTop: 4 }]}>
                  Generate Questions with AI
                </Text>
              </TouchableOpacity>

              <View>
                <Text style={[Typography.bodyMedium, { marginBottom: Spacing.SM, fontWeight: '600' }]}>
                  Sample Generated Questions:
                </Text>
                {[
                  "Describe your favorite hobby in detail for 2 minutes",
                  "Explain the water cycle using simple terms",
                  "Tell me about a memorable experience from your childhood",
                ].map((question, index) => (
                  <View key={index} style={{
                    backgroundColor: LightTheme.Surface,
                    padding: Spacing.MD,
                    borderRadius: 8,
                    marginBottom: Spacing.SM,
                    borderLeftWidth: 3,
                    borderLeftColor: LightTheme.Primary,
                  }}>
                    <Text style={[Typography.bodyMedium]}>{question}</Text>
                    <View style={{ flexDirection: 'row', marginTop: Spacing.SM, justifyContent: 'space-between' }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                        Duration: 2-3 minutes
                      </Text>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={{ marginRight: 12 }}>
                          <Icon name="edit" size={16} color={LightTheme.Primary} />
                        </TouchableOpacity>
                        <TouchableOpacity>
                          <Icon name="delete" size={16} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            marginTop: Spacing.LG,
            paddingTop: Spacing.MD,
          }}>
            <TouchableOpacity
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                backgroundColor: currentStep === 0 ? LightTheme.SurfaceVariant : LightTheme.Outline,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                opacity: currentStep === 0 ? 0.5 : 1,
              }}
            >
              <Text style={{ color: LightTheme.OnSurfaceVariant }}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              style={{
                backgroundColor: LightTheme.Primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: LightTheme.OnPrimary }}>
                {currentStep === steps.length - 1 ? 'Create Assessment' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Student Responses Component
  const renderStudentResponses = () => {
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const studentResponses = [
      {
        id: '1',
        studentName: 'Rahul Kumar',
        studentId: 'STU001',
        assessment: 'English Conversation Assessment',
        submittedAt: new Date(),
        status: 'completed',
        score: 85,
        duration: '4:32',
        aiAnalysis: {
          pronunciation: 78,
          fluency: 82,
          vocabulary: 90,
          grammar: 85,
          content: 88,
          overallFeedback: 'Good conversational skills with minor pronunciation improvements needed.',
        },
        transcription: 'Hello, my name is Rahul. I am from Delhi and I study in class 10...',
        flaggedIssues: ['Background noise detected'],
      },
      {
        id: '2',
        studentName: 'Priya Sharma',
        studentId: 'STU002',
        assessment: 'English Conversation Assessment',
        submittedAt: new Date(),
        status: 'pending',
        score: null,
        duration: '3:45',
        aiAnalysis: null,
        transcription: 'Processing...',
        flaggedIssues: [],
      },
    ];

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Filter Tabs */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: LightTheme.Surface,
          padding: Spacing.MD,
          marginBottom: Spacing.MD,
        }}>
          {[
            { key: 'all', label: 'All Responses', count: studentResponses.length },
            { key: 'completed', label: 'Completed', count: 1 },
            { key: 'pending', label: 'Pending Review', count: 1 },
            { key: 'flagged', label: 'Flagged', count: 1 },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilterStatus(tab.key)}
              style={{
                backgroundColor: filterStatus === tab.key ? LightTheme.Primary : 'transparent',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: filterStatus === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurface,
                fontSize: 12,
                fontWeight: '500',
              }}>
                {tab.label}
              </Text>
              <View style={{
                backgroundColor: filterStatus === tab.key ? LightTheme.OnPrimary : LightTheme.Primary,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 4,
              }}>
                <Text style={{
                  color: filterStatus === tab.key ? LightTheme.Primary : LightTheme.OnPrimary,
                  fontSize: 10,
                  fontWeight: '600',
                }}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Response List */}
        <View style={{ paddingHorizontal: Spacing.MD }}>
          {studentResponses.map((response) => (
            <TouchableOpacity
              key={response.id}
              onPress={() => setSelectedResponse(selectedResponse === response.id ? null : response.id)}
              style={{
                backgroundColor: LightTheme.Surface,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.MD,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>{response.studentName}</Text>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                    ID: {response.studentId} • Duration: {response.duration}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: response.status === 'completed' ? '#E8F5E8' : '#FFF3E0',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: response.status === 'completed' ? '#2E7D32' : '#F57C00',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {response.status.toUpperCase()}
                    </Text>
                  </View>
                  {response.score && (
                    <Text style={[Typography.titleSmall, { fontWeight: '600', marginTop: 4 }]}>
                      {response.score}%
                    </Text>
                  )}
                </View>
              </View>

              {selectedResponse === response.id && response.aiAnalysis && (
                <View style={{ marginTop: Spacing.MD, paddingTop: Spacing.MD, borderTopWidth: 1, borderTopColor: LightTheme.Outline }}>
                  {/* AI Analysis */}
                  <Text style={[Typography.bodyMedium, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                    AI Analysis
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.MD }}>
                    {Object.entries(response.aiAnalysis).filter(([key]) => key !== 'overallFeedback').map(([key, value]) => (
                      <View key={key} style={{ width: '50%', marginBottom: 8 }}>
                        <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textTransform: 'capitalize' }]}>
                          {key}:
                        </Text>
                        <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>{value}%</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={{
                    backgroundColor: LightTheme.PrimaryContainer,
                    padding: Spacing.SM,
                    borderRadius: 8,
                    marginBottom: Spacing.MD,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer }]}>
                      {response.aiAnalysis.overallFeedback}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.Primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                        Play Recording
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.SecondaryContainer,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSecondaryContainer, textAlign: 'center' }]}>
                        View Transcript
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Live Proctoring Component
  const renderLiveProctoring = () => {
    const [activeProctoring, setActiveProctoring] = useState(false);
    const [monitoredStudents] = useState([
      {
        id: '1',
        name: 'Rahul Kumar',
        status: 'active',
        suspicionLevel: 'low',
        currentQuestion: 2,
        timeRemaining: '8:32',
        flags: [],
      },
      {
        id: '2',
        name: 'Priya Sharma',
        status: 'active',
        suspicionLevel: 'medium',
        currentQuestion: 1,
        timeRemaining: '12:15',
        flags: ['Tab switched', 'Face not visible'],
      },
      {
        id: '3',
        name: 'Amit Singh',
        status: 'completed',
        suspicionLevel: 'low',
        currentQuestion: 5,
        timeRemaining: '0:00',
        flags: [],
      },
    ]);

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Proctoring Status */}
        <View style={{
          backgroundColor: LightTheme.Surface,
          padding: Spacing.LG,
          marginBottom: Spacing.MD,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
            <Text style={[Typography.titleLarge, { fontWeight: '600' }]}>Live Proctoring Session</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[Typography.bodyMedium, { marginRight: 8 }]}>Active</Text>
              <Switch
                value={activeProctoring}
                onValueChange={setActiveProctoring}
                trackColor={{ false: LightTheme.SurfaceVariant, true: LightTheme.Primary }}
                thumbColor={LightTheme.Surface}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600', color: LightTheme.Primary }]}>3</Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Active Students</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600', color: '#FF9800' }]}>2</Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Flagged Issues</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600', color: '#4CAF50' }]}>1</Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* AI Monitoring Features */}
        <View style={{
          backgroundColor: LightTheme.Surface,
          padding: Spacing.LG,
          margin: Spacing.MD,
          borderRadius: 12,
        }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            AI Monitoring Features
          </Text>
          
          {[
            { icon: 'face-recognition', title: 'Face Recognition', status: 'Active', color: '#4CAF50' },
            { icon: 'screen-share', title: 'Screen Monitoring', status: 'Active', color: '#4CAF50' },
            { icon: 'record-voice-over', title: 'Voice Pattern Analysis', status: 'Active', color: '#4CAF50' },
            { icon: 'security', title: 'Behavior Analysis', status: 'Active', color: '#4CAF50' },
          ].map((feature, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: Spacing.SM,
              borderBottomWidth: index < 3 ? 1 : 0,
              borderBottomColor: LightTheme.Outline,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={feature.icon} size={20} color={LightTheme.Primary} />
                <Text style={[Typography.bodyMedium, { marginLeft: 12 }]}>{feature.title}</Text>
              </View>
              <View style={{
                backgroundColor: `${feature.color}20`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ color: feature.color, fontSize: 10, fontWeight: '600' }}>
                  {feature.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Student Monitoring Grid */}
        <View style={{ paddingHorizontal: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Student Monitoring
          </Text>
          
          {monitoredStudents.map((student) => (
            <View key={student.id} style={{
              backgroundColor: LightTheme.Surface,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.MD,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
                <View>
                  <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>{student.name}</Text>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                    Question {student.currentQuestion}/5 • {student.timeRemaining} remaining
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: 
                      student.suspicionLevel === 'low' ? '#E8F5E8' :
                      student.suspicionLevel === 'medium' ? '#FFF3E0' : '#FFEBEE',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: 
                        student.suspicionLevel === 'low' ? '#2E7D32' :
                        student.suspicionLevel === 'medium' ? '#F57C00' : '#C62828',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {student.suspicionLevel.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>
              </View>

              {student.flags.length > 0 && (
                <View style={{ marginTop: Spacing.SM }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: 4 }]}>
                    Recent Flags:
                  </Text>
                  {student.flags.map((flag, index) => (
                    <View key={index} style={{
                      backgroundColor: '#FFEBEE',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}>
                      <Text style={[Typography.bodySmall, { color: '#C62828' }]}>⚠️ {flag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', marginTop: Spacing.SM, gap: 8 }}>
                <TouchableOpacity style={{
                  backgroundColor: LightTheme.Primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  flex: 1,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                    View Live Feed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                  backgroundColor: LightTheme.SecondaryContainer,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  flex: 1,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSecondaryContainer, textAlign: 'center' }]}>
                    Send Alert
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'assessments':
        return renderAssessments();
      case 'create':
        return renderAssessmentCreator();
      case 'responses':
        return renderStudentResponses();
      case 'proctoring':
        return renderLiveProctoring();
      default:
        return renderDashboard();
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Voice AI Assessment" subtitle="Intelligent Voice Evaluation" />
      <Appbar.Action icon={isRecording ? "stop" : "microphone"} onPress={() => isRecording ? stopRecordingAnimation() : startRecordingAnimation()} />
    </Appbar.Header>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Voice AI Assessment" subtitle="Loading..." />
        </Appbar.Header>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.MD }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ fontSize: Typography.bodyMedium.fontSize, color: LightTheme.OnSurfaceVariant }}>
            Loading Voice AI Assessment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {renderAppBar()}

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: LightTheme.Surface,
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
            { key: 'assessments', label: 'Assessments', icon: 'assignment' },
            { key: 'create', label: 'Create', icon: 'add-circle' },
            { key: 'responses', label: 'Responses', icon: 'record-voice-over' },
            { key: 'proctoring', label: 'Proctoring', icon: 'security' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginRight: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? LightTheme.Primary : 'transparent',
                minWidth: 80,
              }}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant}
              />
              <Text style={[
                Typography.bodySmall,
                {
                  marginTop: 2,
                  color: activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: 10,
                },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Create Assessment Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.LG,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.LG,
            }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
                Create Voice Assessment
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color={LightTheme.OnSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[Typography.bodyLarge, { textAlign: 'center', color: LightTheme.OnSurfaceVariant, marginTop: 50 }]}>
                Voice Assessment Creator
              </Text>
              <Text style={[Typography.bodySmall, { textAlign: 'center', color: LightTheme.OnSurfaceVariant, marginTop: 8 }]}>
                Advanced AI-powered assessment creation tool
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: LightTheme.Primary,
                  paddingVertical: 12,
                  borderRadius: 25,
                  alignItems: 'center',
                  marginTop: 30,
                }}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

export default VoiceAIAssessmentSystem;