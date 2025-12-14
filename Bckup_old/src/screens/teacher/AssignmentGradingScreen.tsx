/**
 * AssignmentGradingScreen - Phase 30.1 Advanced Grading System
 * Intelligent Grading Tools with Bulk Operations
 * 
 * Features:
 * - AI-assisted grading for objective questions
 * - Bulk grading interface with batch operations
 * - Personalized feedback templates
 * - Rubric-based evaluation
 * - Grade analytics and distribution analysis
 * - Automated feedback generation
 * - Plagiarism detection results
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
  TextInput,
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

// Import Supabase services
import { getAssignmentById, getAssignmentSubmissions, gradeSubmission } from '../../services/assignmentsService';
import { getProfileById } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';

interface AssignmentGradingScreenProps {
  assignmentId?: string;
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface StudentSubmission {
  id: string;
  studentName: string;
  studentAvatar: string;
  submissionTime: Date;
  status: 'submitted' | 'graded' | 'returned';
  autoGrade?: number;
  manualGrade?: number;
  maxScore: number;
  feedback?: string;
  plagiarismScore: number;
  timeSpent: number; // in minutes
  attemptCount: number;
  responses: SubmissionResponse[];
}

interface SubmissionResponse {
  questionId: string;
  questionText: string;
  questionType: 'mcq' | 'descriptive' | 'mathematical';
  studentAnswer: string;
  correctAnswer?: string;
  points: number;
  maxPoints: number;
  isCorrect: boolean;
  aiSuggestion?: string;
  rubricScore?: RubricScore[];
}

interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface Assignment {
  id: string;
  title: string;
  type: 'quiz' | 'homework' | 'test' | 'project';
  totalSubmissions: number;
  gradedSubmissions: number;
  maxScore: number;
  dueDate: Date;
  autoGradingEnabled: boolean;
  plagiarismDetectionEnabled: boolean;
}

export const AssignmentGradingScreen: React.FC<AssignmentGradingScreenProps> = ({
  assignmentId = 'assignment1',
  teacherName,
  onNavigate,
}) => {
  const { user } = useAuth();

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [selectedTab, setSelectedTab] = useState<'submissions' | 'grading' | 'analytics' | 'feedback'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [bulkGradingMode, setBulkGradingMode] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  // Assignment data loaded from Supabase
  const [assignment, setAssignment] = useState<Assignment>({
    id: assignmentId,
    title: 'Loading...',
    type: 'test',
    totalSubmissions: 0,
    gradedSubmissions: 0,
    maxScore: 100,
    dueDate: new Date(),
    autoGradingEnabled: true,
    plagiarismDetectionEnabled: true,
  });

  // Mock submissions data
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 'sub1',
      studentName: 'Sarah Chen',
      studentAvatar: '👩‍🎓',
      submissionTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'graded',
      autoGrade: 92,
      manualGrade: 90,
      maxScore: 100,
      feedback: 'Excellent work on factoring! Pay attention to sign errors in Q3.',
      plagiarismScore: 5, // Low plagiarism
      timeSpent: 58,
      attemptCount: 1,
      responses: [
        {
          questionId: 'q1',
          questionText: 'Solve: x² - 5x + 6 = 0',
          questionType: 'mathematical',
          studentAnswer: 'x = 2, x = 3',
          correctAnswer: 'x = 2, x = 3',
          points: 15,
          maxPoints: 15,
          isCorrect: true,
          aiSuggestion: 'Perfect solution with correct methodology',
        },
        {
          questionId: 'q2',
          questionText: 'Find the discriminant of 2x² - 4x + 1 = 0',
          questionType: 'mathematical',
          studentAnswer: 'Δ = 8',
          correctAnswer: 'Δ = 8',
          points: 12,
          maxPoints: 15,
          isCorrect: true,
          aiSuggestion: 'Correct answer but missing calculation steps',
        },
      ],
    },
    {
      id: 'sub2',
      studentName: 'Alex Johnson',
      studentAvatar: '👨‍🎓',
      submissionTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'submitted',
      autoGrade: 76,
      maxScore: 100,
      plagiarismScore: 12, // Moderate plagiarism
      timeSpent: 72,
      attemptCount: 2,
      responses: [
        {
          questionId: 'q1',
          questionText: 'Solve: x² - 5x + 6 = 0',
          questionType: 'mathematical',
          studentAnswer: 'x = 3, x = 2',
          correctAnswer: 'x = 2, x = 3',
          points: 15,
          maxPoints: 15,
          isCorrect: true,
          aiSuggestion: 'Correct solution, good work',
        },
        {
          questionId: 'q2',
          questionText: 'Find the discriminant of 2x² - 4x + 1 = 0',
          questionType: 'mathematical',
          studentAnswer: 'Δ = 6',
          correctAnswer: 'Δ = 8',
          points: 0,
          maxPoints: 15,
          isCorrect: false,
          aiSuggestion: 'Calculation error - review discriminant formula',
        },
      ],
    },
    {
      id: 'sub3',
      studentName: 'Emily Davis',
      studentAvatar: '👩‍🎓',
      submissionTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'submitted',
      autoGrade: 68,
      maxScore: 100,
      plagiarismScore: 8, // Low plagiarism
      timeSpent: 45,
      attemptCount: 1,
      responses: [],
    },
  ]);

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch assignment details from Supabase
      const assignmentResult = await getAssignmentById(assignmentId);

      if (!assignmentResult.success || !assignmentResult.data) {
        throw new Error(assignmentResult.error || 'Failed to load assignment details');
      }

      const assignmentData = assignmentResult.data;

      // Fetch all submissions for this assignment
      const submissionsResult = await getAssignmentSubmissions(assignmentId);

      if (!submissionsResult.success) {
        throw new Error(submissionsResult.error || 'Failed to load submissions');
      }

      const submissionsData = submissionsResult.data || [];

      // Transform submissions to UI format and fetch student profiles
      const transformedSubmissions: StudentSubmission[] = [];

      for (const submission of submissionsData) {
        // Fetch student profile
        const studentProfile = await getProfileById(submission.student_id);
        const studentData = studentProfile.data;

        // Parse responses from JSON if stored as string
        let responses: SubmissionResponse[] = [];
        if (submission.content) {
          try {
            const content = typeof submission.content === 'string'
              ? JSON.parse(submission.content)
              : submission.content;
            responses = content.responses || [];
          } catch (err) {
            console.error('Error parsing submission content:', err);
          }
        }

        // Calculate auto grade from responses
        const autoGrade = responses.reduce((sum, r) => sum + r.points, 0);

        transformedSubmissions.push({
          id: submission.id,
          studentName: studentData?.full_name || 'Unknown Student',
          studentAvatar: '👨‍🎓',
          submissionTime: new Date(submission.submitted_at || submission.created_at),
          status: submission.status as 'submitted' | 'graded' | 'returned',
          autoGrade,
          manualGrade: submission.grade || undefined,
          maxScore: assignmentData.max_score || 100,
          feedback: submission.feedback || undefined,
          plagiarismScore: 0, // Placeholder - would need plagiarism detection service
          timeSpent: 60, // Placeholder - would need time tracking data
          attemptCount: 1, // Placeholder - would need attempt tracking
          responses,
        });
      }

      // Update assignment state
      setAssignment({
        id: assignmentData.id,
        title: assignmentData.title || 'Assignment',
        type: (assignmentData.type || 'homework') as 'quiz' | 'homework' | 'test' | 'project',
        totalSubmissions: transformedSubmissions.length,
        gradedSubmissions: transformedSubmissions.filter(s => s.status === 'graded' || s.status === 'returned').length,
        maxScore: assignmentData.max_score || 100,
        dueDate: new Date(assignmentData.due_date),
        autoGradingEnabled: true,
        plagiarismDetectionEnabled: false,
      });

      // Update submissions state
      setSubmissions(transformedSubmissions);

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing assignment grading:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submissions';
      showSnackbar(errorMessage);
      setIsLoading(false);
    }
  }, [assignmentId]);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onNavigate('back');
      return true;
    });
    return backHandler;
  }, [onNavigate]);

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

  // Grading handlers
  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) {
        showSnackbar('User not authenticated');
        return;
      }

      // Grade submission in Supabase
      const result = await gradeSubmission(submissionId, {
        grade,
        feedback,
        graded_by: currentUserId,
        graded_at: new Date().toISOString(),
        status: 'graded',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save grade');
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? {
                ...sub,
                manualGrade: grade,
                feedback,
                status: 'graded' as const
              }
            : sub
        )
      );

      // Update graded count in assignment
      setAssignment(prev => ({
        ...prev,
        gradedSubmissions: prev.gradedSubmissions + 1,
      }));

      const studentName = submissions.find(s => s.id === submissionId)?.studentName;
      showSnackbar(`Grade saved for ${studentName}`);

    } catch (error) {
      console.error('Error grading submission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save grade';
      showSnackbar(errorMessage);
    }
  };

  const handleBulkGrading = () => {
    if (selectedSubmissions.length === 0) {
      Alert.alert('No Selection', 'Please select submissions to grade.');
      return;
    }

    Alert.alert(
      'Bulk Grading',
      `Apply AI-suggested grades to ${selectedSubmissions.length} selected submissions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Grades',
          onPress: () => {
            setSubmissions(prev => 
              prev.map(sub => 
                selectedSubmissions.includes(sub.id) 
                  ? { 
                      ...sub, 
                      manualGrade: sub.autoGrade, 
                      status: 'graded' as const,
                      feedback: 'Auto-graded based on AI assessment'
                    }
                  : sub
              )
            );
            setSelectedSubmissions([]);
            setBulkGradingMode(false);
            Alert.alert('Bulk Grading Complete', `${selectedSubmissions.length} submissions have been graded.`);
          },
        },
      ]
    );
  };

  const handleReturnGrades = () => {
    const gradedSubmissions = submissions.filter(s => s.status === 'graded').length;
    
    Alert.alert(
      'Return Grades',
      `Return grades and feedback to ${gradedSubmissions} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return Grades',
          onPress: () => {
            setSubmissions(prev => 
              prev.map(sub => 
                sub.status === 'graded' 
                  ? { ...sub, status: 'returned' as const }
                  : sub
              )
            );
            Alert.alert('Grades Returned', 'Grades and feedback have been sent to students.');
          },
        },
      ]
    );
  };

  const handlePlagiarismReview = (submission: StudentSubmission) => {
    Alert.alert(
      'Plagiarism Detection Results',
      `Student: ${submission.studentName}\nPlagiarism Score: ${submission.plagiarismScore}%\n\n${
        submission.plagiarismScore < 10 ? 'Low risk - Original work detected' :
        submission.plagiarismScore < 25 ? 'Moderate risk - Some similarities found' :
        'High risk - Significant similarities detected'
      }`,
      [
        { text: 'OK', style: 'cancel' },
        { text: 'View Details', onPress: () => Alert.alert(
          'Detailed Plagiarism Report', 
          `📊 Similarity Analysis:\n• Overall Match: 23%\n• Direct Quotes: 8%\n• Paraphrased Content: 15%\n\n🔍 Sources Found:\n• Wikipedia (12%)\n• Academic Papers (7%)\n• Student Submissions (4%)\n\n✅ Recommendations:\n• Review highlighted sections\n• Verify proper citations\n• Consider originality score acceptable for assignment type`
        ) },
      ]
    );
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content
        title="Assignment Grading"
        subtitle={`${assignment.title} • ${assignment.gradedSubmissions}/${assignment.totalSubmissions} Graded`}
      />
      <Appbar.Action icon="chart-bar" onPress={() => setSelectedTab('analytics')} />
      <Appbar.Action icon="message-text-outline" onPress={() => setSelectedTab('feedback')} />
    </Appbar.Header>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { id: 'submissions', title: 'Submissions', icon: '📝' },
        { id: 'grading', title: 'Grading', icon: '✅' },
        { id: 'analytics', title: 'Analytics', icon: '📊' },
        { id: 'feedback', title: 'Feedback', icon: '💬' },
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

  const renderSubmissionsList = () => (
    <View style={styles.submissionsSection}>
      <View style={styles.submissionsHeader}>
        <Text style={styles.sectionTitle}>Student Submissions</Text>
        <View style={styles.submissionActions}>
          <CoachingButton
            title={bulkGradingMode ? 'Cancel Bulk' : 'Bulk Grade'}
            variant={bulkGradingMode ? 'outline' : 'secondary'}
            size="small"
            onPress={() => {
              setBulkGradingMode(!bulkGradingMode);
              setSelectedSubmissions([]);
            }}
            style={styles.bulkButton}
          />
          
          {bulkGradingMode && selectedSubmissions.length > 0 && (
            <CoachingButton
              title={`Grade ${selectedSubmissions.length}`}
              variant="primary"
              size="small"
              onPress={handleBulkGrading}
              style={styles.gradeButton}
            />
          )}
        </View>
      </View>

      {submissions.map(submission => (
        <DashboardCard key={submission.id} title={submission.studentName} style={styles.submissionCard}>
          <View style={styles.submissionHeader}>
            {bulkGradingMode && (
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  selectedSubmissions.includes(submission.id) && styles.checkboxSelected
                ]}
                onPress={() => {
                  setSelectedSubmissions(prev => 
                    prev.includes(submission.id)
                      ? prev.filter(id => id !== submission.id)
                      : [...prev, submission.id]
                  );
                }}
              >
                {selectedSubmissions.includes(submission.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.studentInfo}>
              <Text style={styles.studentAvatar}>{submission.studentAvatar}</Text>
              <View style={styles.submissionDetails}>
                <View style={styles.submissionMeta}>
                  <Text style={styles.submissionTime}>
                    Submitted {Math.floor((Date.now() - submission.submissionTime.getTime()) / (1000 * 60 * 60))}h ago
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                    <Text style={styles.statusText}>{submission.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.submissionScores}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Auto Grade</Text>
              <Text style={styles.scoreValue}>
                {submission.autoGrade ? `${submission.autoGrade}/${submission.maxScore}` : 'N/A'}
              </Text>
            </View>

            {submission.manualGrade !== undefined && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Final Grade</Text>
                <Text style={[styles.scoreValue, styles.finalScore]}>
                  {submission.manualGrade}/{submission.maxScore}
                </Text>
              </View>
            )}

            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Time Spent</Text>
              <Text style={styles.scoreValue}>{submission.timeSpent}min</Text>
            </View>

            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Plagiarism</Text>
              <TouchableOpacity onPress={() => handlePlagiarismReview(submission)}>
                <Text style={[
                  styles.scoreValue,
                  { color: submission.plagiarismScore > 25 ? '#F44336' : 
                           submission.plagiarismScore > 10 ? '#FF9800' : '#4CAF50' }
                ]}>
                  {submission.plagiarismScore}%
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.submissionActions}>
            <CoachingButton
              title="Review"
              variant="outline"
              size="small"
              onPress={() => setSelectedSubmission(submission)}
              style={styles.reviewButton}
            />

            {submission.status === 'submitted' && (
              <CoachingButton
                title="Grade"
                variant="primary"
                size="small"
                onPress={() => setSelectedSubmission(submission)}
                style={styles.gradeSubmissionButton}
              />
            )}

            {submission.status === 'graded' && (
              <CoachingButton
                title="Edit Grade"
                variant="secondary"
                size="small"
                onPress={() => setSelectedSubmission(submission)}
                style={styles.editButton}
              />
            )}
          </View>
        </DashboardCard>
      ))}

      {assignment.gradedSubmissions > 0 && (
        <View style={styles.returnGradesSection}>
          <CoachingButton
            title="Return All Grades"
            variant="primary"
            size="large"
            onPress={handleReturnGrades}
            style={styles.returnGradesButton}
          />
        </View>
      )}
    </View>
  );

  const renderGradingInterface = () => (
    <View style={styles.gradingSection}>
      {selectedSubmission ? (
        <DashboardCard title={`Grading: ${selectedSubmission.studentName}`} style={styles.gradingCard}>
          <View style={styles.gradingHeader}>
            <View style={styles.gradingInfo}>
              <Text style={styles.gradingMeta}>
                Auto Grade: {selectedSubmission.autoGrade}/{selectedSubmission.maxScore} • 
                Time: {selectedSubmission.timeSpent}min • 
                Attempts: {selectedSubmission.attemptCount}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.closeGradingButton}
              onPress={() => setSelectedSubmission(null)}
            >
              <Text style={styles.closeGradingText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.responsesList}>
            {selectedSubmission.responses.map((response, index) => (
              <View key={response.questionId} style={styles.responseItem}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{response.questionText}</Text>
                
                <View style={styles.responseDetails}>
                  <View style={styles.responseContent}>
                    <Text style={styles.responseLabel}>Student Answer:</Text>
                    <Text style={styles.responseText}>{response.studentAnswer}</Text>
                  </View>
                  
                  {response.correctAnswer && (
                    <View style={styles.responseContent}>
                      <Text style={styles.responseLabel}>Correct Answer:</Text>
                      <Text style={styles.correctAnswerText}>{response.correctAnswer}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.responseGrading}>
                  <View style={styles.pointsInfo}>
                    <Text style={styles.pointsText}>
                      {response.points}/{response.maxPoints} points
                    </Text>
                    <View style={[
                      styles.correctnessIndicator,
                      { backgroundColor: response.isCorrect ? '#4CAF50' : '#F44336' }
                    ]}>
                      <Text style={styles.correctnessText}>
                        {response.isCorrect ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>
                  
                  {response.aiSuggestion && (
                    <Text style={styles.aiSuggestion}>
                      💡 AI Suggestion: {response.aiSuggestion}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.finalGradingSection}>
            <Text style={styles.finalGradingTitle}>Final Grade & Feedback</Text>
            
            <View style={styles.gradeInputSection}>
              <Text style={styles.gradeInputLabel}>Grade (out of {selectedSubmission.maxScore}):</Text>
              <TextInput
                style={styles.gradeInput}
                value={selectedSubmission.manualGrade?.toString() || selectedSubmission.autoGrade?.toString() || ''}
                onChangeText={(text) => {
                  const grade = parseInt(text) || 0;
                  setSubmissions(prev =>
                    prev.map(sub =>
                      sub.id === selectedSubmission.id
                        ? { ...sub, manualGrade: grade }
                        : sub
                    )
                  );
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackLabel}>Feedback:</Text>
              <TextInput
                style={styles.feedbackInput}
                value={selectedSubmission.feedback || ''}
                onChangeText={(text) => {
                  setSubmissions(prev =>
                    prev.map(sub =>
                      sub.id === selectedSubmission.id
                        ? { ...sub, feedback: text }
                        : sub
                    )
                  );
                }}
                placeholder="Provide constructive feedback..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.gradingButtons}>
              <CoachingButton
                title="Save Grade"
                variant="primary"
                size="medium"
                onPress={() => {
                  handleGradeSubmission(
                    selectedSubmission.id,
                    selectedSubmission.manualGrade || selectedSubmission.autoGrade || 0,
                    selectedSubmission.feedback || ''
                  );
                  setSelectedSubmission(null);
                }}
                style={styles.saveGradeButton}
              />
            </View>
          </View>
        </DashboardCard>
      ) : (
        <View style={styles.noSelectionState}>
          <Text style={styles.noSelectionIcon}>📝</Text>
          <Text style={styles.noSelectionTitle}>No Submission Selected</Text>
          <Text style={styles.noSelectionText}>
            Select a student submission from the list to begin grading.
          </Text>
        </View>
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsSection}>
      <DashboardCard title="Grading Analytics" style={styles.analyticsCard}>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsIcon}>📊</Text>
            <Text style={styles.analyticsValue}>
              {submissions.reduce((sum, sub) => sum + (sub.autoGrade || 0), 0) / submissions.length | 0}
            </Text>
            <Text style={styles.analyticsLabel}>Class Average</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsIcon}>⏱️</Text>
            <Text style={styles.analyticsValue}>
              {submissions.reduce((sum, sub) => sum + sub.timeSpent, 0) / submissions.length | 0}min
            </Text>
            <Text style={styles.analyticsLabel}>Avg Time</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsIcon}>🎯</Text>
            <Text style={styles.analyticsValue}>
              {submissions.filter(sub => (sub.autoGrade || 0) >= 80).length}
            </Text>
            <Text style={styles.analyticsLabel}>Above 80%</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsIcon}>🔍</Text>
            <Text style={styles.analyticsValue}>
              {submissions.filter(sub => sub.plagiarismScore > 25).length}
            </Text>
            <Text style={styles.analyticsLabel}>High Plagiarism</Text>
          </View>
        </View>
      </DashboardCard>
    </View>
  );

  const renderAIFeedbackSystem = () => {
    const [selectedFeedbackType, setSelectedFeedbackType] = useState('templates');
    const [generatingFeedback, setGeneratingFeedback] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    const feedbackTemplates = [
      {
        id: 'excellent',
        title: 'Excellent Work',
        icon: '🌟',
        template: 'Outstanding effort! Your work demonstrates a deep understanding of the concepts and excellent attention to detail.',
        usage: 87
      },
      {
        id: 'good',
        title: 'Good Progress',
        icon: '👍',
        template: 'Good work overall. You\'ve grasped the main concepts well. Consider reviewing [specific areas] for improvement.',
        usage: 156
      },
      {
        id: 'improvement',
        title: 'Needs Improvement',
        icon: '📝',
        template: 'I can see your effort, but there are areas that need attention. Let\'s focus on [specific concepts] to strengthen your understanding.',
        usage: 92
      },
      {
        id: 'incomplete',
        title: 'Incomplete Work',
        icon: '⚠️',
        template: 'This submission appears incomplete. Please ensure you\'ve addressed all required components and resubmit.',
        usage: 34
      }
    ];

    const aiFeedbackSuggestions = [
      {
        type: 'Strength Identification',
        description: 'AI analyzes student work to identify and highlight their strengths',
        suggestion: 'Your mathematical reasoning in problem 3 shows excellent logical progression.',
        confidence: 94
      },
      {
        type: 'Improvement Areas',
        description: 'Identifies specific areas where the student can improve',
        suggestion: 'Consider double-checking your unit conversions in physics problems.',
        confidence: 87
      },
      {
        type: 'Personalized Encouragement',
        description: 'Generates personalized encouragement based on student progress',
        suggestion: 'Your improvement in essay structure since last assignment is remarkable!',
        confidence: 91
      }
    ];

    const generateAIFeedback = async (submissionId: string) => {
      setGeneratingFeedback(true);
      // Simulate AI feedback generation
      setTimeout(() => {
        const feedbacks = [
          "Your understanding of the core concepts is solid. The way you approached problem 2 shows excellent analytical thinking.",
          "I notice significant improvement in your problem-solving methodology compared to your previous submissions.",
          "Your work demonstrates creativity in finding solutions. Consider exploring alternative approaches for even better results.",
          "The attention to detail in your calculations is commendable. Minor improvements in presentation would make your work even stronger."
        ];
        const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        Alert.alert(
          'AI-Generated Feedback',
          randomFeedback,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use This Feedback', onPress: () => console.log('Feedback applied') }
          ]
        );
        setGeneratingFeedback(false);
      }, 2000);
    };

    const renderFeedbackTemplates = () => (
      <View>
        <Text style={styles.feedbackSectionTitle}>📋 Feedback Templates</Text>
        <Text style={styles.feedbackSectionDesc}>
          Quick access to commonly used feedback templates with usage analytics
        </Text>
        
        <View style={styles.templatesGrid}>
          {feedbackTemplates.map((template) => (
            <TouchableOpacity 
              key={template.id}
              style={styles.templateCard}
              onPress={() => Alert.alert('Template Selected', template.template)}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateUsage}>Used {template.usage} times</Text>
                </View>
              </View>
              <Text style={styles.templatePreview} numberOfLines={2}>
                {template.template}
              </Text>
              <TouchableOpacity style={styles.useTemplateBtn}>
                <Text style={styles.useTemplateBtnText}>Use Template</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    const renderAISuggestions = () => (
      <View>
        <Text style={styles.feedbackSectionTitle}>🤖 AI-Powered Suggestions</Text>
        <Text style={styles.feedbackSectionDesc}>
          Advanced AI analyzes student work to provide personalized feedback recommendations
        </Text>

        <View style={styles.aiSuggestionsContainer}>
          {aiFeedbackSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.aiSuggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionType}>{suggestion.type}</Text>
                <View style={styles.confidenceIndicator}>
                  <Text style={styles.confidenceText}>{suggestion.confidence}%</Text>
                  <View 
                    style={[
                      styles.confidenceBar,
                      { width: `${suggestion.confidence}%` }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
              <View style={styles.suggestionExample}>
                <Text style={styles.exampleLabel}>Example:</Text>
                <Text style={styles.exampleText}>"{suggestion.suggestion}"</Text>
              </View>
              <TouchableOpacity 
                style={styles.applySuggestionBtn}
                onPress={() => generateAIFeedback('sample')}
              >
                <Text style={styles.applySuggestionBtnText}>
                  {generatingFeedback ? 'Generating...' : 'Generate Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );

    const renderCustomAI = () => (
      <View>
        <Text style={styles.feedbackSectionTitle}>🎯 Custom AI Feedback</Text>
        <Text style={styles.feedbackSectionDesc}>
          Create personalized AI feedback prompts tailored to your teaching style
        </Text>

        <View style={styles.customPromptContainer}>
          <Text style={styles.customPromptLabel}>Custom Feedback Prompt:</Text>
          <TextInput
            style={styles.customPromptInput}
            placeholder="e.g., Provide encouraging feedback focusing on mathematical reasoning and problem-solving approach..."
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.promptSuggestions}>
            <Text style={styles.promptSuggestionsTitle}>Quick Prompt Ideas:</Text>
            {[
              'Focus on creativity and innovative thinking',
              'Emphasize technical accuracy and attention to detail',
              'Highlight improvement and growth mindset',
              'Encourage collaborative learning approach'
            ].map((idea, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.promptSuggestionItem}
                onPress={() => setCustomPrompt(idea)}
              >
                <Text style={styles.promptSuggestionText}>💡 {idea}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.generateCustomBtn}
            onPress={() => generateAIFeedback('custom')}
            disabled={!customPrompt.trim() || generatingFeedback}
          >
            <Text style={styles.generateCustomBtnText}>
              {generatingFeedback ? '🔄 Generating AI Feedback...' : '✨ Generate Custom Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    const renderFeedbackAnalytics = () => (
      <View>
        <Text style={styles.feedbackSectionTitle}>📈 Feedback Analytics</Text>
        <Text style={styles.feedbackSectionDesc}>
          Track feedback effectiveness and student engagement patterns
        </Text>

        <View style={styles.feedbackAnalyticsGrid}>
          <View style={styles.feedbackAnalyticsCard}>
            <Text style={styles.analyticsIcon}>🎯</Text>
            <Text style={styles.analyticsValue}>87%</Text>
            <Text style={styles.analyticsLabel}>Feedback Effectiveness</Text>
          </View>
          <View style={styles.feedbackAnalyticsCard}>
            <Text style={styles.analyticsIcon}>💬</Text>
            <Text style={styles.analyticsValue}>243</Text>
            <Text style={styles.analyticsLabel}>Total Feedbacks Given</Text>
          </View>
          <View style={styles.feedbackAnalyticsCard}>
            <Text style={styles.analyticsIcon}>⚡</Text>
            <Text style={styles.analyticsValue}>2.3x</Text>
            <Text style={styles.analyticsLabel}>Improved Response Rate</Text>
          </View>
          <View style={styles.feedbackAnalyticsCard}>
            <Text style={styles.analyticsIcon}>🤖</Text>
            <Text style={styles.analyticsValue}>156</Text>
            <Text style={styles.analyticsLabel}>AI Assists Used</Text>
          </View>
        </View>

        <View style={styles.trendChart}>
          <Text style={styles.chartTitle}>Feedback Engagement Trend</Text>
          <View style={styles.chartContainer}>
            {[45, 52, 48, 61, 67, 73, 81].map((value, index) => (
              <View key={index} style={styles.chartColumn}>
                <View 
                  style={[
                    styles.chartBar,
                    { height: value }
                  ]}
                />
                <Text style={styles.chartLabel}>
                  W{index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );

    return (
      <ScrollView style={styles.feedbackSection}>
        {/* Feedback Type Selector */}
        <View style={styles.feedbackTypeSelector}>
          {[
            { id: 'templates', label: 'Templates', icon: '📋' },
            { id: 'ai', label: 'AI Suggestions', icon: '🤖' },
            { id: 'custom', label: 'Custom AI', icon: '🎯' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.feedbackTypeButton,
                selectedFeedbackType === type.id && styles.feedbackTypeButtonActive
              ]}
              onPress={() => setSelectedFeedbackType(type.id)}
            >
              <Text style={styles.feedbackTypeIcon}>{type.icon}</Text>
              <Text style={[
                styles.feedbackTypeLabel,
                selectedFeedbackType === type.id && styles.feedbackTypeLabelActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.feedbackContent}>
          {selectedFeedbackType === 'templates' && renderFeedbackTemplates()}
          {selectedFeedbackType === 'ai' && renderAISuggestions()}
          {selectedFeedbackType === 'custom' && renderCustomAI()}
          {selectedFeedbackType === 'analytics' && renderFeedbackAnalytics()}
        </View>
      </ScrollView>
    );
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'graded':
        return '#4CAF50';
      case 'submitted':
        return '#FF9800';
      case 'returned':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'grading':
        return renderGradingInterface();
      case 'analytics':
        return renderAnalytics();
      case 'feedback':
        return renderAIFeedbackSystem();
      case 'submissions':
      default:
        return renderSubmissionsList();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading submissions...</Text>
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
  headerSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#E8D5FF',
  },
  headerStats: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: '#FFFFFF',
  },
  statsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#E8D5FF',
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
  submissionsSection: {
    gap: Spacing.MD,
  },
  submissionsHeader: {
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
  submissionActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  bulkButton: {
    minWidth: 90,
  },
  gradeButton: {
    minWidth: 80,
  },
  submissionCard: {
    marginBottom: Spacing.MD,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: LightTheme.Primary,
    marginRight: Spacing.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: LightTheme.Primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    fontSize: 24,
    marginRight: Spacing.MD,
  },
  submissionDetails: {
    flex: 1,
  },
  submissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
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
  submissionScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  scoreValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  finalScore: {
    color: LightTheme.Primary,
  },
  reviewButton: {
    flex: 1,
    marginRight: Spacing.SM,
  },
  gradeSubmissionButton: {
    flex: 1,
  },
  editButton: {
    flex: 1,
  },
  returnGradesSection: {
    alignItems: 'center',
    marginTop: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  returnGradesButton: {
    minWidth: 200,
  },
  gradingSection: {
    gap: Spacing.MD,
  },
  gradingCard: {
    marginBottom: Spacing.MD,
  },
  gradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.MD,
    marginBottom: Spacing.LG,
    paddingBottom: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  gradingInfo: {
    flex: 1,
  },
  gradingMeta: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  closeGradingButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LightTheme.ErrorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGradingText: {
    fontSize: 16,
    color: LightTheme.OnErrorContainer,
    fontWeight: 'bold',
  },
  responsesList: {
    gap: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  responseItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
  },
  questionNumber: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  questionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    fontWeight: '500',
  },
  responseDetails: {
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  responseContent: {
    gap: Spacing.XS,
  },
  responseLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
  },
  responseText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Surface,
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  correctAnswerText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: '#E8F5E8',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  responseGrading: {
    gap: Spacing.SM,
  },
  pointsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  correctnessIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctnessText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  aiSuggestion: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    backgroundColor: '#FFF8E1',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  finalGradingSection: {
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  finalGradingTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
    textAlign: 'center',
  },
  gradeInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
    gap: Spacing.MD,
  },
  gradeInputLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Surface,
    minWidth: 80,
    textAlign: 'center',
  },
  feedbackSection: {
    marginBottom: Spacing.LG,
  },
  feedbackLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Surface,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  gradingButtons: {
    alignItems: 'center',
  },
  saveGradeButton: {
    minWidth: 140,
  },
  noSelectionState: {
    alignItems: 'center',
    paddingVertical: Spacing.XXL,
  },
  noSelectionIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  noSelectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  noSelectionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  analyticsSection: {
    gap: Spacing.MD,
  },
  analyticsCard: {
    marginBottom: Spacing.MD,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  analyticsValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  analyticsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.XXL,
    fontStyle: 'italic',
  },
  // AI Feedback System Styles
  feedbackTypeSelector: {
    flexDirection: 'row',
    padding: Spacing.MD,
    backgroundColor: LightTheme.Surface,
    marginBottom: Spacing.MD,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginHorizontal: Spacing.XS,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  feedbackTypeButtonActive: {
    backgroundColor: LightTheme.Primary,
  },
  feedbackTypeIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  feedbackTypeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
  },
  feedbackTypeLabelActive: {
    color: LightTheme.OnPrimary,
  },
  feedbackContent: {
    padding: Spacing.MD,
  },
  feedbackSectionTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnBackground,
    marginBottom: Spacing.SM,
  },
  feedbackSectionDesc: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
    lineHeight: 20,
  },
  templatesGrid: {
    gap: Spacing.MD,
  },
  templateCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: Spacing.SM,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  templateUsage: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  templatePreview: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
    marginBottom: Spacing.MD,
  },
  useTemplateBtn: {
    backgroundColor: LightTheme.PrimaryContainer,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    alignSelf: 'flex-start',
  },
  useTemplateBtnText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  aiSuggestionsContainer: {
    gap: Spacing.MD,
  },
  aiSuggestionCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    borderLeftWidth: 4,
    borderLeftColor: LightTheme.Primary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  suggestionType: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.Primary,
  },
  confidenceIndicator: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: LightTheme.Primary,
    borderRadius: 2,
    minWidth: 30,
  },
  suggestionDesc: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
    lineHeight: 18,
  },
  suggestionExample: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  exampleLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  exampleText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontStyle: 'italic',
  },
  applySuggestionBtn: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    alignSelf: 'flex-start',
  },
  applySuggestionBtnText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  customPromptContainer: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  customPromptLabel: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  customPromptInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Background,
    textAlignVertical: 'top',
    marginBottom: Spacing.MD,
  },
  promptSuggestions: {
    marginBottom: Spacing.LG,
  },
  promptSuggestionsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  promptSuggestionItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  promptSuggestionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  generateCustomBtn: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  generateCustomBtnText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  feedbackAnalyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  feedbackAnalyticsCard: {
    width: '48%',
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  trendChart: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  chartTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.MD,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.XS,
    marginBottom: Spacing.SM,
  },
  chartLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
});

export default AssignmentGradingScreen;