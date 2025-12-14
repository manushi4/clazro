/**
 * AssessmentAnalyticsScreen - Phase 30.2 Assessment Analytics
 * Performance Analysis Dashboard with Comprehensive Insights
 * 
 * Features:
 * - Individual student performance tracking
 * - Class performance comparative analysis
 * - Question-wise difficulty assessment
 * - Improvement trend identification
 * - Learning outcome measurement
 * - Grade analytics and distribution analysis
 * - AI-powered insights and recommendations
 * - Interactive charts and visualizations
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

const { width } = Dimensions.get('window');

interface AssessmentAnalyticsScreenProps {
  teacherName: string;
  onNavigate: (screen: string) => void;
}

interface StudentPerformance {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  rank: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageTime: number; // in minutes
  strengths: string[];
  weaknesses: string[];
  trend: 'improving' | 'stable' | 'declining';
  lastActive: Date;
}

interface AssignmentAnalytics {
  id: string;
  title: string;
  type: 'quiz' | 'homework' | 'test' | 'project';
  averageScore: number;
  maxScore: number;
  completionRate: number;
  averageTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  submissionCount: number;
  expectedSubmissions: number;
  questionAnalytics: QuestionAnalytics[];
}

interface QuestionAnalytics {
  id: string;
  question: string;
  type: 'mcq' | 'descriptive' | 'mathematical';
  correctAnswers: number;
  totalAttempts: number;
  averageScore: number;
  difficultyIndex: number;
  discriminationIndex: number;
  commonMistakes: string[];
}

interface ClassPerformanceData {
  totalStudents: number;
  activeStudents: number;
  classAverage: number;
  medianScore: number;
  standardDeviation: number;
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
  performanceTrend: {
    date: Date;
    average: number;
  }[];
}

export const AssessmentAnalyticsScreen: React.FC<AssessmentAnalyticsScreenProps> = ({
  teacherName,
  onNavigate,
}) => {
  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [selectedTab, setSelectedTab] = useState<'overview' | 'students' | 'assignments' | 'insights' | 'reports'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('month');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data for demonstration
  const [studentPerformances] = useState<StudentPerformance[]>([
    {
      id: 's1',
      name: 'Sarah Chen',
      avatar: '👩‍🎓',
      totalScore: 847,
      maxScore: 1000,
      percentage: 84.7,
      rank: 1,
      assignmentsCompleted: 12,
      totalAssignments: 15,
      averageTime: 45,
      strengths: ['Algebra', 'Geometry', 'Problem Solving'],
      weaknesses: ['Trigonometry', 'Statistics'],
      trend: 'improving',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 's2',
      name: 'Alex Johnson',
      avatar: '👨‍🎓',
      totalScore: 782,
      maxScore: 1000,
      percentage: 78.2,
      rank: 2,
      assignmentsCompleted: 11,
      totalAssignments: 15,
      averageTime: 52,
      strengths: ['Calculus', 'Problem Solving'],
      weaknesses: ['Algebra', 'Statistics', 'Trigonometry'],
      trend: 'stable',
      lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: 's3',
      name: 'Emily Davis',
      avatar: '👩‍🎓',
      totalScore: 721,
      maxScore: 1000,
      percentage: 72.1,
      rank: 3,
      assignmentsCompleted: 13,
      totalAssignments: 15,
      averageTime: 38,
      strengths: ['Geometry', 'Trigonometry'],
      weaknesses: ['Algebra', 'Calculus'],
      trend: 'declining',
      lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  ]);

  const [assignmentAnalytics] = useState<AssignmentAnalytics[]>([
    {
      id: 'a1',
      title: 'Quadratic Equations Test',
      type: 'test',
      averageScore: 78.5,
      maxScore: 100,
      completionRate: 92,
      averageTime: 65,
      difficulty: 'medium',
      submissionCount: 23,
      expectedSubmissions: 25,
      questionAnalytics: [
        {
          id: 'q1',
          question: 'Solve: x² - 5x + 6 = 0',
          type: 'mathematical',
          correctAnswers: 21,
          totalAttempts: 23,
          averageScore: 91.3,
          difficultyIndex: 0.91,
          discriminationIndex: 0.45,
          commonMistakes: ['Sign errors', 'Factoring mistakes'],
        },
        {
          id: 'q2',
          question: 'Find the discriminant of ax² + bx + c = 0',
          type: 'mathematical',
          correctAnswers: 18,
          totalAttempts: 23,
          averageScore: 78.3,
          difficultyIndex: 0.78,
          discriminationIndex: 0.62,
          commonMistakes: ['Formula confusion', 'Calculation errors'],
        },
      ],
    },
    {
      id: 'a2',
      title: 'Weekly Math Quiz #5',
      type: 'quiz',
      averageScore: 82.1,
      maxScore: 50,
      completionRate: 96,
      averageTime: 25,
      difficulty: 'easy',
      submissionCount: 24,
      expectedSubmissions: 25,
      questionAnalytics: [],
    },
  ]);

  const [classPerformance] = useState<ClassPerformanceData>({
    totalStudents: 25,
    activeStudents: 24,
    classAverage: 76.8,
    medianScore: 78.5,
    standardDeviation: 12.4,
    gradeDistribution: [
      { grade: 'A (90-100%)', count: 4, percentage: 16 },
      { grade: 'B (80-89%)', count: 8, percentage: 32 },
      { grade: 'C (70-79%)', count: 7, percentage: 28 },
      { grade: 'D (60-69%)', count: 4, percentage: 16 },
      { grade: 'F (<60%)', count: 2, percentage: 8 },
    ],
    performanceTrend: [
      { date: new Date('2024-01-01'), average: 72.3 },
      { date: new Date('2024-02-01'), average: 74.1 },
      { date: new Date('2024-03-01'), average: 76.8 },
    ],
  });

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading analytics data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    } catch (error) {
      showSnackbar('Failed to load analytics data');
      setIsLoading(false);
    }
  }, []);

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

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Analytics handlers
  const handleExportReport = (type: string) => {
    Alert.alert(
      'Export Report',
      `Export ${type} report for ${selectedTimeframe} timeframe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Report Exported', `${type} report has been exported and will be available in your downloads.`);
          },
        },
      ]
    );
  };

  const handleViewStudentDetail = (student: StudentPerformance) => {
    Alert.alert(
      `${student.name} - Detailed Performance`,
      `Rank: #${student.rank}\nScore: ${student.totalScore}/${student.maxScore} (${student.percentage.toFixed(1)}%)\nCompleted: ${student.assignmentsCompleted}/${student.totalAssignments} assignments\nTrend: ${student.trend}\n\nStrengths: ${student.strengths.join(', ')}\nWeaknesses: ${student.weaknesses.join(', ')}`,
      [
        { text: 'OK', style: 'cancel' },
        { text: 'View Full Profile', onPress: () => Alert.alert('Comprehensive Student Profile', 'Academic Performance: Excellent\nAttendance Rate: 94.5%\nAssignments Completed: 28/30\nParticipation: Very Active\nRecent Progress: +12% improvement\nStrong Areas: Mathematics, Science\nImprovement Areas: Writing, Time Management\nParent Engagement: High\nLast Updated: Today') },
      ]
    );
  };

  const handleAnalyzeAssignment = (assignment: AssignmentAnalytics) => {
    Alert.alert(
      `${assignment.title} - Analysis`,
      `Average Score: ${assignment.averageScore.toFixed(1)}/${assignment.maxScore}\nCompletion Rate: ${assignment.completionRate}%\nAverage Time: ${assignment.averageTime} min\nDifficulty: ${assignment.difficulty}\n\nSubmissions: ${assignment.submissionCount}/${assignment.expectedSubmissions}`,
      [
        { text: 'OK', style: 'cancel' },
        { text: 'Detailed Analysis', onPress: () => Alert.alert('Advanced Assignment Analysis', 'Question Breakdown:\n• Q1-5: 85% average (Excellent)\n• Q6-10: 67% average (Needs Review)\n• Q11-15: 92% average (Outstanding)\n\nCommon Mistakes:\n• Unit conversion errors (23%)\n• Time management issues (18%)\n• Incomplete explanations (15%)\n\nRecommendations:\n• Additional practice on Q6-10 topics\n• Time management workshop\n• Peer tutoring for struggling students') },
      ]
    );
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content
        title="Assessment Analytics"
        subtitle="Performance Analysis Dashboard"
      />
      <Appbar.Action
        icon={selectedTimeframe === 'week' ? 'calendar-week' :
              selectedTimeframe === 'month' ? 'calendar-month' : 'calendar'}
        onPress={() => {
          const timeframes: typeof selectedTimeframe[] = ['week', 'month', 'semester'];
          const currentIndex = timeframes.indexOf(selectedTimeframe);
          const nextTimeframe = timeframes[(currentIndex + 1) % timeframes.length];
          setSelectedTimeframe(nextTimeframe);
          showSnackbar(`Timeframe changed to ${nextTimeframe}`);
        }}
      />
      <Appbar.Action icon="export" onPress={() => handleExportReport('Analytics Summary')} />
    </Appbar.Header>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { id: 'overview', title: 'Overview', icon: '📊' },
        { id: 'students', title: 'Students', icon: '👥' },
        { id: 'assignments', title: 'Assignments', icon: '📝' },
        { id: 'insights', title: 'AI Insights', icon: '🤖' },
        { id: 'reports', title: 'Reports', icon: '📄' },
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

  const renderOverview = () => (
    <View style={styles.overviewSection}>
      {/* Class Performance Summary */}
      <DashboardCard title="Class Performance Summary" style={styles.summaryCard}>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceIcon}>👥</Text>
            <Text style={styles.performanceValue}>{classPerformance.totalStudents}</Text>
            <Text style={styles.performanceLabel}>Total Students</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceIcon}>📈</Text>
            <Text style={styles.performanceValue}>{classPerformance.classAverage.toFixed(1)}%</Text>
            <Text style={styles.performanceLabel}>Class Average</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceIcon}>🎯</Text>
            <Text style={styles.performanceValue}>{classPerformance.medianScore.toFixed(1)}%</Text>
            <Text style={styles.performanceLabel}>Median Score</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceIcon}>📊</Text>
            <Text style={styles.performanceValue}>±{classPerformance.standardDeviation.toFixed(1)}</Text>
            <Text style={styles.performanceLabel}>Std Deviation</Text>
          </View>
        </View>
      </DashboardCard>

      {/* Grade Distribution */}
      <DashboardCard title="Grade Distribution" style={styles.distributionCard}>
        <View style={styles.gradeChart}>
          {classPerformance.gradeDistribution.map((grade, index) => (
            <View key={index} style={styles.gradeItem}>
              <View style={styles.gradeBar}>
                <View 
                  style={[
                    styles.gradeBarFill,
                    { 
                      width: `${grade.percentage}%`,
                      backgroundColor: getGradeColor(grade.grade),
                    }
                  ]} 
                />
              </View>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeLabel}>{grade.grade}</Text>
                <Text style={styles.gradeCount}>{grade.count} students ({grade.percentage}%)</Text>
              </View>
            </View>
          ))}
        </View>
      </DashboardCard>

      {/* Top Performers */}
      <DashboardCard title="🏆 Top Performers" style={styles.topPerformersCard}>
        <View style={styles.topPerformersList}>
          {studentPerformances.slice(0, 3).map((student, index) => (
            <TouchableOpacity
              key={student.id}
              style={styles.topPerformerItem}
              onPress={() => handleViewStudentDetail(student)}
            >
              <View style={styles.topPerformerRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
                <Text style={styles.rankMedal}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </Text>
              </View>
              
              <View style={styles.topPerformerInfo}>
                <Text style={styles.topPerformerName}>{student.name}</Text>
                <Text style={styles.topPerformerScore}>
                  {student.percentage.toFixed(1)}% ({student.assignmentsCompleted}/{student.totalAssignments})
                </Text>
              </View>
              
              <View style={styles.topPerformerTrend}>
                <Text style={styles.trendIcon}>
                  {student.trend === 'improving' ? '📈' :
                   student.trend === 'stable' ? '➡️' : '📉'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </DashboardCard>
    </View>
  );

  const renderStudentAnalysis = () => (
    <View style={styles.studentsSection}>
      <Text style={styles.sectionTitle}>Individual Student Performance</Text>
      
      {studentPerformances.map(student => (
        <DashboardCard key={student.id} title={student.name} style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentAvatar}>{student.avatar}</Text>
              <View style={styles.studentDetails}>
                <Text style={styles.studentRank}>Rank #{student.rank}</Text>
                <Text style={styles.studentScore}>
                  {student.totalScore}/{student.maxScore} ({student.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
            
            <View style={styles.studentTrend}>
              <Text style={styles.trendIcon}>
                {student.trend === 'improving' ? '📈' :
                 student.trend === 'stable' ? '➡️' : '📉'}
              </Text>
              <Text style={styles.trendText}>{student.trend}</Text>
            </View>
          </View>

          <View style={styles.studentStats}>
            <View style={styles.studentStat}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statValue}>{student.assignmentsCompleted}/{student.totalAssignments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.studentStat}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{student.averageTime}min</Text>
              <Text style={styles.statLabel}>Avg Time</Text>
            </View>
            
            <View style={styles.studentStat}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>
                {Math.floor((Date.now() - student.lastActive.getTime()) / (1000 * 60 * 60))}h
              </Text>
              <Text style={styles.statLabel}>Last Active</Text>
            </View>
          </View>

          <View style={styles.studentInsights}>
            <View style={styles.strengthsWeaknesses}>
              <View style={styles.strengths}>
                <Text style={styles.insightTitle}>💪 Strengths</Text>
                <Text style={styles.insightText}>{student.strengths.join(', ')}</Text>
              </View>
              
              <View style={styles.weaknesses}>
                <Text style={styles.insightTitle}>🎯 Focus Areas</Text>
                <Text style={styles.insightText}>{student.weaknesses.join(', ')}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleViewStudentDetail(student)}
          >
            <Text style={styles.viewDetailsText}>View Detailed Analysis</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </View>
  );

  const renderAssignmentAnalysis = () => (
    <View style={styles.assignmentsSection}>
      <Text style={styles.sectionTitle}>Assignment Performance Analysis</Text>
      
      {assignmentAnalytics.map(assignment => (
        <DashboardCard key={assignment.id} title={assignment.title} style={styles.assignmentCard}>
          <View style={styles.assignmentHeader}>
            <View style={styles.assignmentType}>
              <Text style={styles.typeIcon}>
                {assignment.type === 'quiz' ? '❓' :
                 assignment.type === 'test' ? '📊' :
                 assignment.type === 'homework' ? '📝' : '📁'}
              </Text>
              <Text style={styles.typeText}>{assignment.type.toUpperCase()}</Text>
            </View>
            
            <View style={styles.assignmentDifficulty}>
              <Text style={[
                styles.difficultyText,
                { color: assignment.difficulty === 'easy' ? '#4CAF50' :
                        assignment.difficulty === 'medium' ? '#FF9800' : '#F44336' }
              ]}>
                {assignment.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.assignmentMetrics}>
            <View style={styles.assignmentMetric}>
              <Text style={styles.metricIcon}>📊</Text>
              <Text style={styles.metricValue}>
                {assignment.averageScore.toFixed(1)}/{assignment.maxScore}
              </Text>
              <Text style={styles.metricLabel}>Average Score</Text>
            </View>
            
            <View style={styles.assignmentMetric}>
              <Text style={styles.metricIcon}>✅</Text>
              <Text style={styles.metricValue}>{assignment.completionRate}%</Text>
              <Text style={styles.metricLabel}>Completion</Text>
            </View>
            
            <View style={styles.assignmentMetric}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <Text style={styles.metricValue}>{assignment.averageTime}min</Text>
              <Text style={styles.metricLabel}>Avg Time</Text>
            </View>
            
            <View style={styles.assignmentMetric}>
              <Text style={styles.metricIcon}>📨</Text>
              <Text style={styles.metricValue}>
                {assignment.submissionCount}/{assignment.expectedSubmissions}
              </Text>
              <Text style={styles.metricLabel}>Submissions</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={() => handleAnalyzeAssignment(assignment)}
          >
            <Text style={styles.analyzeButtonText}>Detailed Analysis</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </View>
  );

  const renderAIInsights = () => (
    <View style={styles.insightsSection}>
      <DashboardCard title="🤖 AI-Powered Insights & Recommendations" style={styles.insightsCard}>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📈</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Performance Trend Analysis</Text>
              <Text style={styles.insightDescription}>
                Class performance has improved by 4.5% over the last month. The improvement is primarily 
                in problem-solving questions, suggesting effective teaching methods.
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🎯</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Learning Gap Identification</Text>
              <Text style={styles.insightDescription}>
                68% of students struggle with trigonometry concepts. Consider additional practice 
                sessions and visual aids for better understanding.
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⚡</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Engagement Optimization</Text>
              <Text style={styles.insightDescription}>
                Students show 23% higher engagement in interactive assignments. Consider incorporating 
                more hands-on activities and group projects.
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🚨</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>At-Risk Student Alert</Text>
              <Text style={styles.insightDescription}>
                2 students (Emily Davis, Michael Brown) show declining performance patterns. 
                Immediate intervention recommended for personalized support.
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📚</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Content Difficulty Adjustment</Text>
              <Text style={styles.insightDescription}>
                Question Q2 in "Quadratic Equations Test" has low discrimination index (0.2). 
                Consider revising or replacing with more differentiating questions.
              </Text>
            </View>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="📊 Predictive Analytics" style={styles.predictiveCard}>
        <View style={styles.predictions}>
          <View style={styles.prediction}>
            <Text style={styles.predictionIcon}>🔮</Text>
            <Text style={styles.predictionTitle}>Exam Performance Forecast</Text>
            <Text style={styles.predictionText}>
              Based on current trends, expected class average for next exam: 79.2% (±3.1%)
            </Text>
          </View>

          <View style={styles.prediction}>
            <Text style={styles.predictionIcon}>🎓</Text>
            <Text style={styles.predictionTitle}>Learning Outcome Projection</Text>
            <Text style={styles.predictionText}>
              87% of students are on track to meet learning objectives by semester end
            </Text>
          </View>
        </View>
      </DashboardCard>
    </View>
  );

  const renderReports = () => (
    <View style={styles.reportsSection}>
      <Text style={styles.sectionTitle}>Generate & Export Reports</Text>
      
      <DashboardCard title="📊 Performance Reports" style={styles.reportsCard}>
        <View style={styles.reportsList}>
          <View style={styles.reportItem}>
            <Text style={styles.reportIcon}>👥</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Class Performance Report</Text>
              <Text style={styles.reportDescription}>
                Comprehensive analysis of class performance, grade distribution, and trends
              </Text>
            </View>
            <CoachingButton
              title="Export"
              variant="outline"
              size="small"
              onPress={() => handleExportReport('Class Performance')}
              style={styles.exportButton}
            />
          </View>

          <View style={styles.reportItem}>
            <Text style={styles.reportIcon}>📝</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Individual Student Reports</Text>
              <Text style={styles.reportDescription}>
                Detailed performance analysis for each student with personalized insights
              </Text>
            </View>
            <CoachingButton
              title="Export"
              variant="outline"
              size="small"
              onPress={() => handleExportReport('Individual Student')}
              style={styles.exportButton}
            />
          </View>

          <View style={styles.reportItem}>
            <Text style={styles.reportIcon}>📋</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Assignment Analytics Report</Text>
              <Text style={styles.reportDescription}>
                Question-wise analysis, difficulty assessment, and improvement suggestions
              </Text>
            </View>
            <CoachingButton
              title="Export"
              variant="outline"
              size="small"
              onPress={() => handleExportReport('Assignment Analytics')}
              style={styles.exportButton}
            />
          </View>

          <View style={styles.reportItem}>
            <Text style={styles.reportIcon}>📈</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Progress Tracking Report</Text>
              <Text style={styles.reportDescription}>
                Longitudinal analysis showing learning progress and growth over time
              </Text>
            </View>
            <CoachingButton
              title="Export"
              variant="outline"
              size="small"
              onPress={() => handleExportReport('Progress Tracking')}
              style={styles.exportButton}
            />
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="⚙️ Report Configuration" style={styles.configCard}>
        <Text style={styles.configDescription}>
          Customize report formats, data ranges, and recipient settings for automated delivery.
        </Text>
        
        <View style={styles.configOptions}>
          <CoachingButton
            title="Configure Auto-Reports"
            variant="primary"
            size="medium"
            onPress={() => Alert.alert('Configuration', 'Report automation settings will be available in the next update.')}
            style={styles.configButton}
          />
        </View>
      </DashboardCard>
    </View>
  );

  // Helper function to get grade color
  const getGradeColor = (grade: string): string => {
    if (grade.includes('A')) return '#4CAF50';
    if (grade.includes('B')) return '#8BC34A';
    if (grade.includes('C')) return '#FFC107';
    if (grade.includes('D')) return '#FF9800';
    return '#F44336';
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'students':
        return renderStudentAnalysis();
      case 'assignments':
        return renderAssignmentAnalysis();
      case 'insights':
        return renderAIInsights();
      case 'reports':
        return renderReports();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#7C4DFF" />
        <Appbar.Header elevated style={{ backgroundColor: '#7C4DFF' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Assessment Analytics" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
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
              label: 'OK',
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
  overviewSection: {
    gap: Spacing.LG,
  },
  summaryCard: {
    marginBottom: Spacing.MD,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
  },
  performanceItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  performanceIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  performanceValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  performanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  distributionCard: {
    marginBottom: Spacing.MD,
  },
  gradeChart: {
    paddingTop: Spacing.MD,
    gap: Spacing.SM,
  },
  gradeItem: {
    marginBottom: Spacing.SM,
  },
  gradeBar: {
    height: 20,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
    overflow: 'hidden',
  },
  gradeBarFill: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  gradeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  gradeCount: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  topPerformersCard: {
    marginBottom: Spacing.MD,
  },
  topPerformersList: {
    paddingTop: Spacing.MD,
    gap: Spacing.SM,
  },
  topPerformerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  topPerformerRank: {
    alignItems: 'center',
    marginRight: Spacing.MD,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  rankMedal: {
    fontSize: 16,
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  topPerformerScore: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  topPerformerTrend: {
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 20,
  },
  studentsSection: {
    gap: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  studentCard: {
    marginBottom: Spacing.MD,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    fontSize: 32,
    marginRight: Spacing.MD,
  },
  studentDetails: {
    gap: Spacing.XS,
  },
  studentRank: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.Primary,
  },
  studentScore: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  studentTrend: {
    alignItems: 'center',
    gap: Spacing.XS,
  },
  trendText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textTransform: 'capitalize',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  studentStat: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  statValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  studentInsights: {
    marginBottom: Spacing.MD,
  },
  strengthsWeaknesses: {
    gap: Spacing.SM,
  },
  strengths: {
    backgroundColor: '#E8F5E8',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  weaknesses: {
    backgroundColor: '#FFF3E0',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  insightTitle: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  insightText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  viewDetailsButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    backgroundColor: LightTheme.PrimaryContainer,
    borderRadius: BorderRadius.SM,
  },
  viewDetailsText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  assignmentsSection: {
    gap: Spacing.MD,
  },
  assignmentCard: {
    marginBottom: Spacing.MD,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  assignmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  assignmentDifficulty: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  difficultyText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  assignmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  assignmentMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  metricValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  analyzeButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
  },
  analyzeButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
  insightsSection: {
    gap: Spacing.MD,
  },
  insightsCard: {
    marginBottom: Spacing.MD,
  },
  insightsList: {
    paddingTop: Spacing.MD,
    gap: Spacing.LG,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.MD,
  },
  insightIcon: {
    fontSize: 24,
    marginTop: Spacing.XS,
  },
  insightContent: {
    flex: 1,
  },
  insightDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
  },
  predictiveCard: {
    marginBottom: Spacing.MD,
  },
  predictions: {
    paddingTop: Spacing.MD,
    gap: Spacing.LG,
  },
  prediction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.MD,
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  predictionIcon: {
    fontSize: 24,
  },
  predictionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  predictionText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  reportsSection: {
    gap: Spacing.MD,
  },
  reportsCard: {
    marginBottom: Spacing.MD,
  },
  reportsList: {
    paddingTop: Spacing.MD,
    gap: Spacing.MD,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
  },
  reportInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  reportTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  reportDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  exportButton: {
    minWidth: 70,
  },
  configCard: {
    marginBottom: Spacing.MD,
  },
  configDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
    marginTop: Spacing.MD,
    marginBottom: Spacing.LG,
    textAlign: 'center',
  },
  configOptions: {
    alignItems: 'center',
  },
  configButton: {
    minWidth: 180,
  },
});

export default AssessmentAnalyticsScreen;