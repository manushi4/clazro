/**
 * EnhancedAssessmentAnalyticsScreen - Phase 47.1: Detailed Student Analytics
 * Comprehensive student profiling and analytics dashboard
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
  Dimensions,
  BackHandler,
  Share,
} from 'react-native';
import { Appbar, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  class: string;
  section: string;
  profileImage?: string;
  academicHistory: AcademicRecord[];
  learningDifficulties: LearningDifficulty[];
  participationPatterns: ParticipationPattern[];
  communicationLog: CommunicationRecord[];
  individualLearningPlan: LearningPlan;
  overallPerformance: PerformanceMetrics;
}

interface AcademicRecord {
  id: string;
  subject: string;
  academicYear: string;
  semester: string;
  grade: string;
  percentage: number;
  rank: number;
  totalStudents: number;
  assignments: AssignmentRecord[];
  examScores: ExamScore[];
  attendancePercentage: number;
  behaviorNotes: string[];
}

interface LearningDifficulty {
  id: string;
  type: 'mathematical' | 'language' | 'comprehension' | 'attention' | 'memory' | 'social';
  severity: 'mild' | 'moderate' | 'severe';
  identifiedDate: string;
  description: string;
  interventions: Intervention[];
  progress: string;
  recommendedStrategies: string[];
}

interface ParticipationPattern {
  id: string;
  activity: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  engagement: 'high' | 'medium' | 'low';
  qualityScore: number;
  trends: TrendData[];
  peakTimes: string[];
  preferredMethods: string[];
}

interface CommunicationRecord {
  id: string;
  date: string;
  type: 'parent_meeting' | 'phone_call' | 'email' | 'incident_report' | 'progress_update';
  participants: string[];
  subject: string;
  summary: string;
  actionItems: ActionItem[];
  followUpDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface LearningPlan {
  id: string;
  createdDate: string;
  lastUpdated: string;
  goals: LearningGoal[];
  strategies: TeachingStrategy[];
  accommodations: Accommodation[];
  assessmentMethods: AssessmentMethod[];
  progressMilestones: Milestone[];
  reviewSchedule: ReviewSchedule;
}

interface AssignmentAnalysis {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  totalQuestions: number;
  questionPerformance: QuestionPerformance[];
  difficultyAnalysis: DifficultyAnalysis;
  learningObjectives: ObjectivePerformance[];
  classComparison: ClassPerformanceData;
  improvementRecommendations: ImprovementRecommendation[];
}

interface QuestionPerformance {
  questionId: string;
  questionText: string;
  correctAnswers: number;
  incorrectAnswers: number;
  partialCredit: number;
  averageTime: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  learningObjective: string;
  commonMistakes: CommonMistake[];
}

interface ClassPerformanceData {
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  scoreDistribution: ScoreDistribution[];
  topPerformers: string[];
  strugglingStudents: string[];
  classRank: number;
}

interface ImprovementRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content_knowledge' | 'skill_development' | 'study_habits' | 'engagement';
  recommendation: string;
  expectedOutcome: string;
  timeframe: string;
  resources: string[];
  trackingMethod: string;
}

const EnhancedAssessmentAnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [selectedView, setSelectedView] = useState<'students' | 'assignments'>('students');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentAnalysis | null>(null);
  const [students] = useState<StudentProfile[]>(generateMockStudents());
  const [assignments] = useState<AssignmentAnalysis[]>(generateMockAssignments());
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const viewTabs = [
    { id: 'students', label: 'Student Profiles', icon: '=d' },
    { id: 'assignments', label: 'Assignment Analysis', icon: '=�' },
  ];

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading analytics data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    } catch (error) {
      showSnackbar('Failed to load student analytics data');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showStudentModal || showAssignmentModal) {
        setShowStudentModal(false);
        setShowAssignmentModal(false);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showStudentModal, showAssignmentModal]);

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

  const handleStudentSelect = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleAssignmentSelect = (assignment: AssignmentAnalysis) => {
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleExport = async () => {
    try {
      let exportData = '';
      const timestamp = new Date().toLocaleString();

      if (selectedView === 'students') {
        // Export student profiles
        exportData = `STUDENT ANALYTICS REPORT\nGenerated: ${timestamp}\n\n`;
        exportData += `Total Students: ${students.length}\n\n`;

        students.forEach((student, index) => {
          exportData += `${index + 1}. ${student.name}\n`;
          exportData += `   Class: ${student.class} - ${student.section}\n`;
          exportData += `   Enrollment: ${student.enrollmentNumber}\n`;
          exportData += `   Overall Grade: ${student.overallPerformance.overallGrade}%\n`;
          exportData += `   Attendance: ${student.overallPerformance.attendanceRate}%\n`;
          exportData += `   Engagement: ${student.overallPerformance.engagementLevel}\n`;
          exportData += `   Risk Level: ${student.overallPerformance.riskLevel}\n`;
          exportData += `   Trend: ${student.overallPerformance.improvementTrend}\n\n`;
        });
      } else {
        // Export assignment analysis
        exportData = `ASSIGNMENT ANALYTICS REPORT\nGenerated: ${timestamp}\n\n`;
        exportData += `Total Assignments: ${assignments.length}\n\n`;

        assignments.forEach((assignment, index) => {
          exportData += `${index + 1}. ${assignment.title}\n`;
          exportData += `   Subject: ${assignment.subject}\n`;
          exportData += `   Total Questions: ${assignment.totalQuestions}\n`;
          exportData += `   Class Average: ${assignment.classComparison.averageScore}%\n`;
          exportData += `   Median Score: ${assignment.classComparison.medianScore}%\n`;
          exportData += `   Std Deviation: ${assignment.classComparison.standardDeviation.toFixed(1)}\n`;
          exportData += `   Difficulty: Easy(${assignment.difficultyAnalysis.easyQuestions}) Medium(${assignment.difficultyAnalysis.mediumQuestions}) Hard(${assignment.difficultyAnalysis.hardQuestions})\n`;
          exportData += `   Top Performers: ${assignment.classComparison.topPerformers.join(', ')}\n`;
          exportData += `   Need Support: ${assignment.classComparison.strugglingStudents.join(', ')}\n\n`;
        });
      }

      await Share.share({
        message: exportData,
        title: `${selectedView === 'students' ? 'Student' : 'Assignment'} Analytics Report`,
      });

      showSnackbar('Export successful');
    } catch (error) {
      if ((error as any).message !== 'User did not share') {
        console.error('Export error:', error);
        showSnackbar('Export failed');
      }
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
      <Appbar.Content
        title="Assessment Analytics"
        subtitle="Detailed student profiles and assignment analysis"
      />
      <Appbar.Action
        icon={selectedView === 'students' ? 'account-group' : 'file-document'}
        onPress={() => {
          const newView = selectedView === 'students' ? 'assignments' : 'students';
          setSelectedView(newView);
          showSnackbar(`Switched to ${newView === 'students' ? 'Student Profiles' : 'Assignment Analysis'}`);
        }}
      />
      <Appbar.Action icon="export" onPress={handleExport} />
    </Appbar.Header>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.Surface }]}>
      {viewTabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedView === tab.id && [styles.activeTab, { backgroundColor: theme.Primary }]
          ]}
          onPress={() => setSelectedView(tab.id as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            {
              color: selectedView === tab.id 
                ? theme.OnPrimary 
                : theme.OnSurface
            }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStudentCard = ({ item }: { item: StudentProfile }) => (
    <TouchableOpacity
      style={[styles.studentCard, { backgroundColor: theme.Surface }]}
      onPress={() => handleStudentSelect(item)}
    >
      <View style={styles.studentHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.Primary }]}>
          <Text style={[styles.avatarText, { color: theme.OnPrimary }]}>
            {item.name?.split(' ').map(n => n?.[0] || '').join('') || 'U'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.OnSurface }]}>
            {item.name}
          </Text>
          <Text style={[styles.studentDetails, { color: theme.OnSurfaceVariant }]}>
            {item.class} " {item.section} " #{item.enrollmentNumber}
          </Text>
        </View>
        <View style={styles.performanceIndicator}>
          <View style={[
            styles.performanceCircle,
            {
              backgroundColor: item.overallPerformance.overallGrade >= 80
                ? '#4CAF50' : item.overallPerformance.overallGrade >= 60
                  ? '#FF9800' : '#F44336'
            }
          ]}>
            <Text style={styles.performanceText}>
              {Math.round(item.overallPerformance.overallGrade)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Attendance
          </Text>
          <Text style={[styles.statValue, { color: theme.OnSurface }]}>
            {item.overallPerformance.attendanceRate}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Engagement
          </Text>
          <Text style={[styles.statValue, { color: theme.OnSurface }]}>
            {item.overallPerformance.engagementLevel}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Risk Level
          </Text>
          <Text style={[
            styles.statValue,
            {
              color: item.overallPerformance.riskLevel === 'low'
                ? '#4CAF50' : item.overallPerformance.riskLevel === 'medium'
                  ? '#FF9800' : '#F44336'
            }
          ]}>
            {item.overallPerformance.riskLevel.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAssignmentCard = ({ item }: { item: AssignmentAnalysis }) => (
    <TouchableOpacity
      style={[styles.assignmentCard, { backgroundColor: theme.Surface }]}
      onPress={() => handleAssignmentSelect(item)}
    >
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={[styles.assignmentTitle, { color: theme.OnSurface }]}>
            {item.title}
          </Text>
          <Text style={[styles.assignmentSubject, { color: theme.OnSurfaceVariant }]}>
            {item.subject} " {item.totalQuestions} questions
          </Text>
        </View>
        <View style={styles.assignmentStats}>
          <Text style={[styles.avgScore, { color: theme.Primary }]}>
            {Math.round(item.classComparison.averageScore)}%
          </Text>
        </View>
      </View>

      <View style={styles.difficultyBreakdown}>
        <View style={styles.difficultyItem}>
          <Text style={[styles.difficultyLabel, { color: theme.OnSurfaceVariant }]}>
            Easy
          </Text>
          <Text style={[styles.difficultyValue, { color: '#4CAF50' }]}>
            {item.difficultyAnalysis.easyQuestions}
          </Text>
        </View>
        <View style={styles.difficultyItem}>
          <Text style={[styles.difficultyLabel, { color: theme.OnSurfaceVariant }]}>
            Medium
          </Text>
          <Text style={[styles.difficultyValue, { color: '#FF9800' }]}>
            {item.difficultyAnalysis.mediumQuestions}
          </Text>
        </View>
        <View style={styles.difficultyItem}>
          <Text style={[styles.difficultyLabel, { color: theme.OnSurfaceVariant }]}>
            Hard
          </Text>
          <Text style={[styles.difficultyValue, { color: '#F44336' }]}>
            {item.difficultyAnalysis.hardQuestions}
          </Text>
        </View>
      </View>

      <View style={styles.recommendationPreview}>
        <Text style={[styles.recommendationTitle, { color: theme.OnSurface }]}>
          Key Recommendations:
        </Text>
        {item.improvementRecommendations.slice(0, 2).map(rec => (
          <Text key={rec.id} style={[styles.recommendationText, { color: theme.OnSurfaceVariant }]}>
            " {rec.recommendation.substring(0, 60)}...
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderStudentModal = () => (
    <Modal
      visible={showStudentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStudentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedStudent && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowStudentModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.Primary }]}>�</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                    Student Profile
                  </Text>
                </View>

                {/* Student Info */}
                <View style={styles.modalStudentInfo}>
                  <View style={[styles.modalAvatar, { backgroundColor: theme.Primary }]}>
                    <Text style={[styles.modalAvatarText, { color: theme.OnPrimary }]}>
                      {selectedStudent.name?.split(' ').map(n => n?.[0] || '').join('') || 'U'}
                    </Text>
                  </View>
                  <Text style={[styles.modalStudentName, { color: theme.OnSurface }]}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={[styles.modalStudentDetails, { color: theme.OnSurfaceVariant }]}>
                    {selectedStudent.class} " {selectedStudent.section}
                  </Text>
                </View>

                {/* Academic History */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Academic History
                  </Text>
                  {selectedStudent.academicHistory.map(record => (
                    <View key={record.id} style={[styles.academicCard, { backgroundColor: theme.Background }]}>
                      <Text style={[styles.academicSubject, { color: theme.OnSurface }]}>
                        {record.subject} - {record.academicYear}
                      </Text>
                      <Text style={[styles.academicGrade, { color: theme.OnSurfaceVariant }]}>
                        Grade: {record.grade} ({record.percentage}%) " Rank: {record.rank}/{record.totalStudents}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Learning Difficulties */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Learning Considerations
                  </Text>
                  {selectedStudent.learningDifficulties.map(difficulty => (
                    <View key={difficulty.id} style={[styles.difficultyCard, { backgroundColor: theme.Background }]}>
                      <Text style={[styles.difficultyType, { color: theme.OnSurface }]}>
                        {difficulty.type.replace('_', ' ').toUpperCase()} - {difficulty.severity}
                      </Text>
                      <Text style={[styles.difficultyDescription, { color: theme.OnSurfaceVariant }]}>
                        {difficulty.description}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Individual Learning Plan */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Individual Learning Plan
                  </Text>
                  <View style={[styles.planCard, { backgroundColor: theme.Background }]}>
                    <Text style={[styles.planTitle, { color: theme.OnSurface }]}>
                      Current Goals ({selectedStudent.individualLearningPlan.goals.length})
                    </Text>
                    {selectedStudent.individualLearningPlan.goals.slice(0, 3).map(goal => (
                      <Text key={goal.id} style={[styles.planGoal, { color: theme.OnSurfaceVariant }]}>
                        " {goal.description}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Communication Log */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Communication Log
                  </Text>
                  {selectedStudent.communicationLog.slice(0, 3).map(record => (
                    <View key={record.id} style={[styles.communicationCard, { backgroundColor: theme.Background }]}>
                      <Text style={[styles.communicationDate, { color: theme.OnSurface }]}>
                        {record.type.replace('_', ' ').toUpperCase()} - {record.date}
                      </Text>
                      <Text style={[styles.communicationSubject, { color: theme.OnSurfaceVariant }]}>
                        {record.subject}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAssignmentModal = () => (
    <Modal
      visible={showAssignmentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAssignmentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedAssignment && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowAssignmentModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.Primary }]}>�</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                    Assignment Analysis
                  </Text>
                </View>

                {/* Assignment Info */}
                <View style={styles.modalAssignmentInfo}>
                  <Text style={[styles.modalAssignmentTitle, { color: theme.OnSurface }]}>
                    {selectedAssignment.title}
                  </Text>
                  <Text style={[styles.modalAssignmentDetails, { color: theme.OnSurfaceVariant }]}>
                    {selectedAssignment.subject} " {selectedAssignment.totalQuestions} questions
                  </Text>
                </View>

                {/* Class Performance */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Class Performance
                  </Text>
                  <View style={[styles.performanceStatsCard, { backgroundColor: theme.Background }]}>
                    <View style={styles.statRow}>
                      <Text style={[styles.statName, { color: theme.OnSurfaceVariant }]}>Average Score:</Text>
                      <Text style={[styles.statData, { color: theme.OnSurface }]}>
                        {selectedAssignment.classComparison.averageScore}%
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statName, { color: theme.OnSurfaceVariant }]}>Median Score:</Text>
                      <Text style={[styles.statData, { color: theme.OnSurface }]}>
                        {selectedAssignment.classComparison.medianScore}%
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statName, { color: theme.OnSurfaceVariant }]}>Standard Deviation:</Text>
                      <Text style={[styles.statData, { color: theme.OnSurface }]}>
                        {selectedAssignment.classComparison.standardDeviation.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Question Performance */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Question Analysis
                  </Text>
                  {selectedAssignment.questionPerformance.slice(0, 5).map(question => (
                    <View key={question.questionId} style={[styles.questionCard, { backgroundColor: theme.Background }]}>
                      <Text style={[styles.questionText, { color: theme.OnSurface }]}>
                        Q{question.questionId}: {question.questionText.substring(0, 60)}...
                      </Text>
                      <View style={styles.questionStats}>
                        <Text style={[styles.questionStat, { color: '#4CAF50' }]}>
                           {question.correctAnswers}
                        </Text>
                        <Text style={[styles.questionStat, { color: '#F44336' }]}>
                           {question.incorrectAnswers}
                        </Text>
                        <Text style={[styles.questionStat, { color: theme.OnSurfaceVariant }]}>
                          {question.difficultyLevel}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Recommendations */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
                    Improvement Recommendations
                  </Text>
                  {selectedAssignment.improvementRecommendations.map(rec => (
                    <View key={rec.id} style={[styles.recommendationCard, { backgroundColor: theme.Background }]}>
                      <Text style={[styles.recPriority, { 
                        color: rec.priority === 'high' ? '#F44336' : 
                              rec.priority === 'medium' ? '#FF9800' : '#4CAF50'
                      }]}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </Text>
                      <Text style={[styles.recText, { color: theme.OnSurface }]}>
                        {rec.recommendation}
                      </Text>
                      <Text style={[styles.recOutcome, { color: theme.OnSurfaceVariant }]}>
                        Expected: {rec.expectedOutcome}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
        <StatusBar backgroundColor={theme.Primary} barStyle="light-content" />
        <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
          <Appbar.Content title="Assessment Analytics" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.Primary} />
          <Text style={[styles.loadingText, { color: theme.OnSurfaceVariant }]}>
            Loading student analytics data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
      <StatusBar backgroundColor={theme.Primary} barStyle="light-content" />

      {renderAppBar()}

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <View style={styles.content}>
        {selectedView === 'students' ? (
          <FlatList
            data={students}
            renderItem={renderStudentCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <FlatList
            data={assignments}
            renderItem={renderAssignmentCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modals */}
      {renderStudentModal()}
      {renderAssignmentModal()}

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

// Mock data generators
function generateMockStudents(): StudentProfile[] {
  return [
    {
      id: '1',
      name: 'Arjun Sharma',
      email: 'arjun.sharma@student.edu',
      enrollmentNumber: 'MS2024001',
      class: 'Class 10',
      section: 'A',
      academicHistory: generateMockAcademicHistory(),
      learningDifficulties: generateMockLearningDifficulties(),
      participationPatterns: generateMockParticipationPatterns(),
      communicationLog: generateMockCommunicationLog(),
      individualLearningPlan: generateMockLearningPlan(),
      overallPerformance: {
        overallGrade: 85.5,
        attendanceRate: 92,
        engagementLevel: 'high',
        riskLevel: 'low',
        improvementTrend: 'positive',
        lastAssessmentScore: 88,
      },
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya.patel@student.edu',
      enrollmentNumber: 'MS2024002',
      class: 'Class 10',
      section: 'A',
      academicHistory: generateMockAcademicHistory(),
      learningDifficulties: [
        {
          id: '1',
          type: 'mathematical',
          severity: 'mild',
          identifiedDate: '2024-01-15',
          description: 'Difficulty with complex algebraic expressions',
          interventions: [],
          progress: 'improving',
          recommendedStrategies: ['Visual aids', 'Step-by-step breakdown'],
        },
      ],
      participationPatterns: generateMockParticipationPatterns(),
      communicationLog: generateMockCommunicationLog(),
      individualLearningPlan: generateMockLearningPlan(),
      overallPerformance: {
        overallGrade: 72.3,
        attendanceRate: 88,
        engagementLevel: 'medium',
        riskLevel: 'medium',
        improvementTrend: 'stable',
        lastAssessmentScore: 74,
      },
    },
    {
      id: '3',
      name: 'Rohit Kumar',
      email: 'rohit.kumar@student.edu',
      enrollmentNumber: 'MS2024003',
      class: 'Class 10',
      section: 'A',
      academicHistory: generateMockAcademicHistory(),
      learningDifficulties: [],
      participationPatterns: generateMockParticipationPatterns(),
      communicationLog: generateMockCommunicationLog(),
      individualLearningPlan: generateMockLearningPlan(),
      overallPerformance: {
        overallGrade: 94.2,
        attendanceRate: 98,
        engagementLevel: 'high',
        riskLevel: 'low',
        improvementTrend: 'positive',
        lastAssessmentScore: 96,
      },
    },
  ];
}

function generateMockAssignments(): AssignmentAnalysis[] {
  return [
    {
      id: '1',
      assignmentId: 'ASSIGN_001',
      title: 'Quadratic Equations Assessment',
      subject: 'Mathematics',
      totalQuestions: 25,
      questionPerformance: generateMockQuestionPerformance(),
      difficultyAnalysis: {
        easyQuestions: 8,
        mediumQuestions: 12,
        hardQuestions: 5,
        overallDifficulty: 'medium',
      },
      learningObjectives: [],
      classComparison: {
        averageScore: 76.5,
        medianScore: 78.0,
        standardDeviation: 12.3,
        scoreDistribution: [],
        topPerformers: ['Rohit Kumar', 'Sneha Gupta'],
        strugglingStudents: ['Amit Singh', 'Ravi Mehta'],
        classRank: 1,
      },
      improvementRecommendations: [
        {
          id: '1',
          priority: 'high',
          category: 'content_knowledge',
          recommendation: 'Focus on discriminant concept for quadratic equations',
          expectedOutcome: '15% improvement in related questions',
          timeframe: '2 weeks',
          resources: ['Khan Academy videos', 'Practice worksheets'],
          trackingMethod: 'Weekly quizzes',
        },
        {
          id: '2',
          priority: 'medium',
          category: 'skill_development',
          recommendation: 'Practice more word problems involving quadratic equations',
          expectedOutcome: '10% improvement in application questions',
          timeframe: '3 weeks',
          resources: ['Textbook exercises', 'Online practice tests'],
          trackingMethod: 'Assignment submissions',
        },
      ],
    },
  ];
}

function generateMockAcademicHistory(): AcademicRecord[] {
  return [
    {
      id: '1',
      subject: 'Mathematics',
      academicYear: '2023-24',
      semester: 'Semester 2',
      grade: 'A',
      percentage: 87,
      rank: 5,
      totalStudents: 45,
      assignments: [],
      examScores: [],
      attendancePercentage: 95,
      behaviorNotes: ['Participates actively in class', 'Shows good problem-solving skills'],
    },
  ];
}

function generateMockLearningDifficulties(): LearningDifficulty[] {
  return [];
}

function generateMockParticipationPatterns(): ParticipationPattern[] {
  return [
    {
      id: '1',
      activity: 'Class Discussion',
      frequency: 'daily',
      engagement: 'high',
      qualityScore: 8.5,
      trends: [],
      peakTimes: ['Morning sessions'],
      preferredMethods: ['Verbal participation', 'Interactive activities'],
    },
  ];
}

function generateMockCommunicationLog(): CommunicationRecord[] {
  return [
    {
      id: '1',
      date: '2024-01-20',
      type: 'parent_meeting',
      participants: ['Teacher', 'Parent', 'Student'],
      subject: 'Academic Progress Discussion',
      summary: 'Discussed student performance and future goals',
      actionItems: [],
      status: 'completed',
    },
  ];
}

function generateMockLearningPlan(): LearningPlan {
  return {
    id: '1',
    createdDate: '2024-01-10',
    lastUpdated: '2024-01-25',
    goals: [
      {
        id: '1',
        description: 'Improve mathematical problem-solving skills',
        targetDate: '2024-03-01',
        status: 'in_progress',
        progress: 65,
      },
    ],
    strategies: [],
    accommodations: [],
    assessmentMethods: [],
    progressMilestones: [],
    reviewSchedule: {
      frequency: 'monthly',
      nextReview: '2024-02-25',
    },
  };
}

function generateMockQuestionPerformance(): QuestionPerformance[] {
  return Array.from({ length: 10 }, (_, index) => ({
    questionId: (index + 1).toString(),
    questionText: `Sample question ${index + 1} about quadratic equations and their applications`,
    correctAnswers: Math.floor(Math.random() * 30) + 10,
    incorrectAnswers: Math.floor(Math.random() * 20) + 5,
    partialCredit: Math.floor(Math.random() * 10),
    averageTime: Math.floor(Math.random() * 300) + 120,
    difficultyLevel: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
    learningObjective: `Objective ${index + 1}`,
    commonMistakes: [],
  }));
}

// Additional interfaces
interface PerformanceMetrics {
  overallGrade: number;
  attendanceRate: number;
  engagementLevel: 'high' | 'medium' | 'low';
  riskLevel: 'high' | 'medium' | 'low';
  improvementTrend: 'positive' | 'negative' | 'stable';
  lastAssessmentScore: number;
}

interface LearningGoal {
  id: string;
  description: string;
  targetDate: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
}

interface DifficultyAnalysis {
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
  overallDifficulty: 'easy' | 'medium' | 'hard';
}

interface CommonMistake {
  id: string;
  mistake: string;
  frequency: number;
  suggestion: string;
}

interface ScoreDistribution {
  range: string;
  count: number;
}

interface TrendData {
  date: string;
  value: number;
}

interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

interface Intervention {
  id: string;
  type: string;
  description: string;
  startDate: string;
  effectiveness: number;
}

interface TeachingStrategy {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
}

interface Accommodation {
  id: string;
  type: string;
  description: string;
  approved: boolean;
}

interface AssessmentMethod {
  id: string;
  method: string;
  frequency: string;
  weight: number;
}

interface Milestone {
  id: string;
  description: string;
  targetDate: string;
  achieved: boolean;
}

interface ReviewSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextReview: string;
}

interface AssignmentRecord {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  submissionDate: string;
}

interface ExamScore {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
}

interface ObjectivePerformance {
  id: string;
  objective: string;
  performance: number;
  mastery: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.LG,
    fontSize: Typography.bodyLarge.fontSize,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.XS,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: 8,
  },
  activeTab: {
    elevation: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginRight: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.MD,
    paddingBottom: Spacing.XL,
  },
  studentCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  avatarText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  performanceIndicator: {
    alignItems: 'center',
  },
  performanceCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceText: {
    color: 'white',
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: 'bold',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 2,
  },
  statValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  assignmentCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
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
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  assignmentStats: {
    alignItems: 'center',
  },
  avgScore: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: 'bold',
  },
  difficultyBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  difficultyItem: {
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 2,
  },
  difficultyValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  recommendationPreview: {
    marginTop: Spacing.SM,
  },
  recommendationTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.XS,
  },
  recommendationText: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 2,
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
  modalStudentInfo: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.MD,
  },
  modalAvatarText: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: 'bold',
  },
  modalStudentName: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  modalStudentDetails: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  modalSection: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  academicCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  academicSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  academicGrade: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  difficultyCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  difficultyType: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  difficultyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  planCard: {
    borderRadius: 8,
    padding: Spacing.MD,
  },
  planTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  planGoal: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
  },
  communicationCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  communicationDate: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  communicationSubject: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  modalAssignmentInfo: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
  },
  modalAssignmentTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  modalAssignmentDetails: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  performanceStatsCard: {
    borderRadius: 8,
    padding: Spacing.MD,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  statName: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  statData: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  questionCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  questionText: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.SM,
  },
  questionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  questionStat: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  recommendationCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  recPriority: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: Spacing.XS,
  },
  recText: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.XS,
  },
  recOutcome: {
    fontSize: Typography.bodySmall.fontSize,
  },
});

export default EnhancedAssessmentAnalyticsScreen;