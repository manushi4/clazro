/**
 * TeacherAIAnalyticsDashboard - Phase 47.3: Advanced Analytics Engine
 * AI-powered analytics dashboard with predictive insights, teaching effectiveness, and student performance analysis
 * Features: Performance prediction, learning gap analysis, engagement metrics, automated recommendations
 * Manushi Coaching Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Portal, Snackbar } from 'react-native-paper';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface StudentPerformancePrediction {
  studentId: string;
  studentName: string;
  currentGrade: number;
  predictedGrade: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  interventionSuggestions: string[];
  strengths: string[];
  weaknesses: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
}

interface LearningGap {
  id: string;
  topic: string;
  subject: string;
  affectedStudents: number;
  totalStudents: number;
  gapSeverity: 'minor' | 'moderate' | 'major';
  suggestedActions: string[];
  timeToAddress: number; // in days
}

interface ClassEngagement {
  classId: string;
  className: string;
  subject: string;
  avgEngagement: number;
  peakEngagementTime: string;
  lowEngagementTime: string;
  engagementTrend: number; // percentage change
  attentionSpan: number; // in minutes
  interactionRate: number;
  participationRate: number;
}

interface TeachingEffectiveness {
  metric: string;
  score: number;
  maxScore: number;
  comparison: number; // compared to other teachers
  trend: number; // week-over-week change
  recommendations: string[];
  strengths: string[];
}

interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'later';
  actionItems: string[];
  estimatedTimeToImplement: number; // in minutes
}

interface AnalyticsData {
  totalStudents: number;
  averagePerformance: number;
  improvementRate: number;
  atRiskStudents: number;
  topPerformers: number;
  engagementScore: number;
  teachingEffectivenessScore: number;
}

interface TeacherAIAnalyticsDashboardProps {
  teacherId?: string;
  teacherName?: string;
  onNavigate?: (screen: string, params?: any) => void;
}

const TeacherAIAnalyticsDashboard: React.FC<TeacherAIAnalyticsDashboardProps> = ({
  teacherId = 'teacher_123',
  teacherName = 'Dr. Anjali Verma',
  onNavigate,
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performancePredictions, setPerformancePredictions] = useState<StudentPerformancePrediction[]>([]);
  const [learningGaps, setLearningGaps] = useState<LearningGap[]>([]);
  const [classEngagements, setClassEngagements] = useState<ClassEngagement[]>([]);
  const [teachingEffectiveness, setTeachingEffectiveness] = useState<TeachingEffectiveness[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'engagement' | 'effectiveness' | 'insights'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('week');
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
      // No modals to handle in this screen, just allow back navigation
      return false;
    });
    return backHandler;
  }, []);

  const cleanup = useCallback(() => {
    // Cleanup if needed
  }, []);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await initializeAnalyticsData();
      setIsLoading(false);
    };
    loadData();
  }, [selectedTimeframe]);

  const initializeAnalyticsData = () => {
    // Initialize overview analytics data
    const mockAnalyticsData: AnalyticsData = {
      totalStudents: 127,
      averagePerformance: 83.5,
      improvementRate: 12.3,
      atRiskStudents: 8,
      topPerformers: 23,
      engagementScore: 78.2,
      teachingEffectivenessScore: 87.1
    };

    // Initialize performance predictions
    const mockPredictions: StudentPerformancePrediction[] = [
      {
        studentId: 'std001',
        studentName: 'Rahul Sharma',
        currentGrade: 72,
        predictedGrade: 85,
        confidence: 89,
        riskLevel: 'low',
        interventionSuggestions: [
          'Provide additional practice problems',
          'Schedule one-on-one session',
          'Recommend peer study group'
        ],
        strengths: ['Problem solving', 'Conceptual understanding'],
        weaknesses: ['Time management', 'Complex calculations'],
        trendDirection: 'improving'
      },
      {
        studentId: 'std002',
        studentName: 'Priya Patel',
        currentGrade: 91,
        predictedGrade: 87,
        confidence: 76,
        riskLevel: 'medium',
        interventionSuggestions: [
          'Monitor stress levels',
          'Review study habits',
          'Provide advanced challenges'
        ],
        strengths: ['Quick learning', 'Analytical thinking'],
        weaknesses: ['Test anxiety', 'Perfectionism'],
        trendDirection: 'declining'
      },
      {
        studentId: 'std003',
        studentName: 'Arjun Kumar',
        currentGrade: 58,
        predictedGrade: 62,
        confidence: 92,
        riskLevel: 'high',
        interventionSuggestions: [
          'Immediate intervention required',
          'Basic concept revision',
          'Parent-teacher meeting',
          'Alternative learning approach'
        ],
        strengths: ['Effort', 'Attendance'],
        weaknesses: ['Foundation gaps', 'Confidence issues'],
        trendDirection: 'stable'
      }
    ];

    // Initialize learning gaps
    const mockLearningGaps: LearningGap[] = [
      {
        id: 'gap001',
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        affectedStudents: 23,
        totalStudents: 45,
        gapSeverity: 'major',
        suggestedActions: [
          'Reteach with visual aids',
          'Provide extra practice sessions',
          'Use real-world examples',
          'Peer tutoring program'
        ],
        timeToAddress: 7
      },
      {
        id: 'gap002',
        topic: 'Organic Chemistry Nomenclature',
        subject: 'Chemistry',
        affectedStudents: 18,
        totalStudents: 42,
        gapSeverity: 'moderate',
        suggestedActions: [
          'Interactive naming exercises',
          'Memory techniques',
          'Group practice sessions'
        ],
        timeToAddress: 5
      },
      {
        id: 'gap003',
        topic: 'Wave Optics',
        subject: 'Physics',
        affectedStudents: 12,
        totalStudents: 38,
        gapSeverity: 'minor',
        suggestedActions: [
          'Demonstration experiments',
          'Animation videos',
          'Practice problems'
        ],
        timeToAddress: 3
      }
    ];

    // Initialize class engagement data
    const mockEngagements: ClassEngagement[] = [
      {
        classId: 'class001',
        className: 'Mathematics 12-A',
        subject: 'Mathematics',
        avgEngagement: 82.5,
        peakEngagementTime: '10:30 AM',
        lowEngagementTime: '2:30 PM',
        engagementTrend: 8.3,
        attentionSpan: 23,
        interactionRate: 67.4,
        participationRate: 78.9
      },
      {
        classId: 'class002',
        className: 'Physics 11-B',
        subject: 'Physics',
        avgEngagement: 75.2,
        peakEngagementTime: '11:15 AM',
        lowEngagementTime: '3:00 PM',
        engagementTrend: -2.1,
        attentionSpan: 19,
        interactionRate: 58.3,
        participationRate: 72.6
      }
    ];

    // Initialize teaching effectiveness metrics
    const mockEffectiveness: TeachingEffectiveness[] = [
      {
        metric: 'Student Performance Improvement',
        score: 87,
        maxScore: 100,
        comparison: 15, // 15% better than average
        trend: 5.2,
        recommendations: [
          'Continue current methodology',
          'Share best practices with colleagues',
          'Focus on struggling students'
        ],
        strengths: [
          'Clear explanations',
          'Interactive teaching style',
          'Regular assessments'
        ]
      },
      {
        metric: 'Class Engagement',
        score: 78,
        maxScore: 100,
        comparison: 8,
        trend: -1.3,
        recommendations: [
          'Incorporate more interactive elements',
          'Use multimedia resources',
          'Vary teaching methods'
        ],
        strengths: [
          'Student rapport',
          'Subject expertise',
          'Enthusiasm'
        ]
      },
      {
        metric: 'Learning Outcome Achievement',
        score: 91,
        maxScore: 100,
        comparison: 22,
        trend: 3.8,
        recommendations: [
          'Maintain current approach',
          'Mentor other teachers',
          'Explore advanced techniques'
        ],
        strengths: [
          'Curriculum alignment',
          'Assessment quality',
          'Feedback provision'
        ]
      }
    ];

    // Initialize AI insights
    const mockInsights: AIInsight[] = [
      {
        id: 'insight001',
        type: 'alert',
        title: 'Declining Engagement in Afternoon Classes',
        description: 'Student engagement drops by 23% in classes after 2 PM. Consider schedule optimization.',
        impact: 'high',
        urgency: 'soon',
        actionItems: [
          'Move complex topics to morning sessions',
          'Add interactive breaks in afternoon',
          'Use energizing activities after 2 PM'
        ],
        estimatedTimeToImplement: 30
      },
      {
        id: 'insight002',
        type: 'prediction',
        title: '8 Students at Risk of Failing',
        description: 'AI model predicts 8 students likely to fail without intervention by next assessment.',
        impact: 'high',
        urgency: 'immediate',
        actionItems: [
          'Schedule individual consultations',
          'Provide additional resources',
          'Contact parents/guardians',
          'Create personalized study plans'
        ],
        estimatedTimeToImplement: 120
      },
      {
        id: 'insight003',
        type: 'opportunity',
        title: 'High Performer Optimization',
        description: '23 students showing excellence - opportunity to accelerate their learning.',
        impact: 'medium',
        urgency: 'later',
        actionItems: [
          'Provide advanced challenges',
          'Peer mentoring opportunities',
          'Competition participation',
          'Independent research projects'
        ],
        estimatedTimeToImplement: 60
      },
      {
        id: 'insight004',
        type: 'recommendation',
        title: 'Teaching Method Optimization',
        description: 'Visual learners (67% of class) would benefit from more diagram-based explanations.',
        impact: 'medium',
        urgency: 'soon',
        actionItems: [
          'Incorporate more visual aids',
          'Use mind mapping techniques',
          'Add infographics to lessons',
          'Implement drawing exercises'
        ],
        estimatedTimeToImplement: 45
      }
    ];

    setAnalyticsData(mockAnalyticsData);
    setPerformancePredictions(mockPredictions);
    setLearningGaps(mockLearningGaps);
    setClassEngagements(mockEngagements);
    setTeachingEffectiveness(mockEffectiveness);
    setAIInsights(mockInsights);
  };

  const handleStudentIntervention = (studentId: string) => {
    const student = performancePredictions.find(p => p.studentId === studentId);
    if (!student) return;

    Alert.alert(
      'Student Intervention',
      `Create intervention plan for ${student.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Plan',
          onPress: () => {
            Alert.alert('success', `Intervention plan created for ${student.studentName}!`);
          }
        }
      ]
    );
  };

  const handleLearningGapAction = (gapId: string) => {
    const gap = learningGaps.find(g => g.id === gapId);
    if (!gap) return;

    Alert.alert(
      'Address Learning Gap',
      `Implement suggested actions for ${gap.topic}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Implement',
          onPress: () => {
            Alert.alert('success', `Action plan initiated for ${gap.topic}!`);
          }
        }
      ]
    );
  };

  const handleInsightAction = (insightId: string) => {
    const insight = aiInsights.find(i => i.id === insightId);
    if (!insight) return;

    Alert.alert(
      'AI Insight Action',
      `Would you like to implement the recommended actions?`,
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Get Started',
          onPress: () => {
            Alert.alert('Action Started', `Implementation plan created. Estimated time: ${insight.estimatedTimeToImplement} minutes.`);
          }
        }
      ]
    );
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return '#4ECDC4';
      case 'medium': return '#FFD93D';
      case 'high': return '#FF6B6B';
      default: return LightTheme.Surface;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return '#4ECDC4';
      case 'moderate': return '#FFD93D';
      case 'major': return '#FF6B6B';
      default: return LightTheme.Surface;
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'low': return '#4ECDC4';
      case 'medium': return '#FFD93D';
      case 'high': return '#FF6B6B';
      default: return LightTheme.Surface;
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{analyticsData?.totalStudents}</Text>
          <Text style={styles.metricLabel}>Total Students</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{analyticsData?.averagePerformance}%</Text>
          <Text style={styles.metricLabel}>Avg Performance</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#4ECDC4' }]}>
            +{analyticsData?.improvementRate}%
          </Text>
          <Text style={styles.metricLabel}>Improvement Rate</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#FF6B6B' }]}>
            {analyticsData?.atRiskStudents}
          </Text>
          <Text style={styles.metricLabel}>At Risk Students</Text>
        </View>
      </View>

      {/* Quick Insights */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🤖 AI Quick Insights</Text>
        {aiInsights.slice(0, 3).map((insight) => (
          <TouchableOpacity 
            key={insight.id} 
            style={styles.quickInsightItem}
            onPress={() => handleInsightAction(insight.id)}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.insightTypeIcon}>
                {insight.type === 'alert' ? '⚠️' : 
                 insight.type === 'prediction' ? '🔮' :
                 insight.type === 'opportunity' ? '🎯' : '💡'}
              </Text>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) }]}>
                <Text style={styles.impactText}>{insight.impact.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setSelectedTab('insights')}
        >
          <Text style={styles.viewAllButtonText}>View All Insights</Text>
        </TouchableOpacity>
      </View>

      {/* Teaching Effectiveness Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📈 Teaching Effectiveness</Text>
        {teachingEffectiveness.slice(0, 2).map((metric, index) => (
          <View key={index} style={styles.effectivenessItem}>
            <View style={styles.effectivenessHeader}>
              <Text style={styles.effectivenessMetric}>{metric.metric}</Text>
              <Text style={styles.effectivenessScore}>{metric.score}%</Text>
            </View>
            <View style={styles.effectivenessBarContainer}>
              <View style={[styles.effectivenessBar, { width: `${metric.score}%` }]} />
            </View>
            <Text style={styles.effectivenessComparison}>
              {metric.comparison > 0 ? '+' : ''}{metric.comparison}% vs peers
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPredictionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        AI-powered predictions based on learning patterns, assessment history, and engagement metrics
      </Text>
      
      {performancePredictions.map((prediction) => (
        <TouchableOpacity
          key={prediction.studentId}
          style={styles.predictionCard}
          onPress={() => handleStudentIntervention(prediction.studentId)}
        >
          <View style={styles.predictionHeader}>
            <Text style={styles.studentName}>{prediction.studentName}</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(prediction.riskLevel) }]}>
              <Text style={styles.riskText}>{prediction.riskLevel.toUpperCase()} RISK</Text>
            </View>
          </View>
          
          <View style={styles.gradeComparison}>
            <View style={styles.gradeItem}>
              <Text style={styles.gradeLabel}>Current</Text>
              <Text style={styles.currentGrade}>{prediction.currentGrade}%</Text>
            </View>
            
            <Text style={styles.gradeArrow}>
              {prediction.trendDirection === 'improving' ? '↗️' : 
               prediction.trendDirection === 'declining' ? '↘️' : '➡️'}
            </Text>
            
            <View style={styles.gradeItem}>
              <Text style={styles.gradeLabel}>Predicted</Text>
              <Text style={[
                styles.predictedGrade,
                { color: prediction.predictedGrade > prediction.currentGrade ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                {prediction.predictedGrade}%
              </Text>
            </View>
          </View>
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>AI Confidence: {prediction.confidence}%</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${prediction.confidence}%` }]} />
            </View>
          </View>
          
          <View style={styles.analysisSection}>
            <View style={styles.analysisColumn}>
              <Text style={styles.analysisTitle}>💪 Strengths</Text>
              {prediction.strengths.map((strength, i) => (
                <Text key={i} style={styles.strengthItem}>• {strength}</Text>
              ))}
            </View>
            
            <View style={styles.analysisColumn}>
              <Text style={styles.analysisTitle}>🎯 Focus Areas</Text>
              {prediction.weaknesses.map((weakness, i) => (
                <Text key={i} style={styles.weaknessItem}>• {weakness}</Text>
              ))}
            </View>
          </View>
          
          {prediction.interventionSuggestions.length > 0 && (
            <View style={styles.interventionSection}>
              <Text style={styles.interventionTitle}>💡 Suggested Interventions</Text>
              {prediction.interventionSuggestions.slice(0, 2).map((suggestion, i) => (
                <Text key={i} style={styles.interventionItem}>• {suggestion}</Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEngagementTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Real-time engagement analytics and attention pattern analysis for your classes
      </Text>
      
      {classEngagements.map((engagement) => (
        <View key={engagement.classId} style={styles.engagementCard}>
          <View style={styles.engagementHeader}>
            <Text style={styles.className}>{engagement.className}</Text>
            <Text style={styles.engagementScore}>{engagement.avgEngagement}%</Text>
          </View>
          
          <View style={styles.engagementMetrics}>
            <View style={styles.engagementMetric}>
              <Text style={styles.metricIcon}>⏰</Text>
              <View>
                <Text style={styles.metricValue}>{engagement.attentionSpan}min</Text>
                <Text style={styles.metricName}>Attention Span</Text>
              </View>
            </View>
            
            <View style={styles.engagementMetric}>
              <Text style={styles.metricIcon}>🗣️</Text>
              <View>
                <Text style={styles.metricValue}>{engagement.interactionRate}%</Text>
                <Text style={styles.metricName}>Interaction Rate</Text>
              </View>
            </View>
            
            <View style={styles.engagementMetric}>
              <Text style={styles.metricIcon}>🙋</Text>
              <View>
                <Text style={styles.metricValue}>{engagement.participationRate}%</Text>
                <Text style={styles.metricName}>Participation</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.timeAnalysis}>
            <Text style={styles.timeAnalysisTitle}>⏰ Time Analysis</Text>
            <View style={styles.timeAnalysisRow}>
              <Text style={styles.timeItem}>
                Peak: <Text style={styles.timeValue}>{engagement.peakEngagementTime}</Text>
              </Text>
              <Text style={styles.timeItem}>
                Low: <Text style={styles.timeValue}>{engagement.lowEngagementTime}</Text>
              </Text>
            </View>
          </View>
          
          <View style={styles.trendContainer}>
            <Text style={styles.trendLabel}>
              Trend: <Text style={[
                styles.trendValue,
                { color: engagement.engagementTrend > 0 ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                {engagement.engagementTrend > 0 ? '+' : ''}{engagement.engagementTrend}%
              </Text>
            </Text>
          </View>
        </View>
      ))}
      
      {/* Learning Gaps Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🎯 Learning Gaps Identified</Text>
        {learningGaps.map((gap) => (
          <TouchableOpacity
            key={gap.id}
            style={styles.gapCard}
            onPress={() => handleLearningGapAction(gap.id)}
          >
            <View style={styles.gapHeader}>
              <Text style={styles.gapTopic}>{gap.topic}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(gap.gapSeverity) }]}>
                <Text style={styles.severityText}>{gap.gapSeverity.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.gapSubject}>📚 {gap.subject}</Text>
            
            <View style={styles.gapStats}>
              <Text style={styles.gapStat}>
                Affected: {gap.affectedStudents}/{gap.totalStudents} students
              </Text>
              <Text style={styles.gapStat}>
                Time to address: {gap.timeToAddress} days
              </Text>
            </View>
            
            <View style={styles.gapActions}>
              <Text style={styles.gapActionsTitle}>Suggested Actions:</Text>
              {gap.suggestedActions.slice(0, 2).map((action, i) => (
                <Text key={i} style={styles.gapAction}>• {action}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEffectivenessTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Comprehensive analysis of your teaching effectiveness with AI-powered recommendations
      </Text>
      
      {teachingEffectiveness.map((metric, index) => (
        <View key={index} style={styles.effectivenessCard}>
          <Text style={styles.effectivenessCardTitle}>{metric.metric}</Text>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{metric.score}/{metric.maxScore}</Text>
            <Text style={styles.scoreComparison}>
              {metric.comparison > 0 ? '+' : ''}{metric.comparison}% vs peers
            </Text>
          </View>
          
          <View style={styles.scoreBarContainer}>
            <View style={[styles.scoreBar, { width: `${(metric.score / metric.maxScore) * 100}%` }]} />
          </View>
          
          <View style={styles.trendInfo}>
            <Text style={styles.trendLabel}>Week-over-week change:</Text>
            <Text style={[
              styles.trendChange,
              { color: metric.trend > 0 ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {metric.trend > 0 ? '+' : ''}{metric.trend}%
            </Text>
          </View>
          
          <View style={styles.strengthsSection}>
            <Text style={styles.strengthsTitle}>🌟 Your Strengths</Text>
            {metric.strengths.map((strength, i) => (
              <Text key={i} style={styles.strengthText}>• {strength}</Text>
            ))}
          </View>
          
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>💡 AI Recommendations</Text>
            {metric.recommendations.map((recommendation, i) => (
              <Text key={i} style={styles.recommendationText}>• {recommendation}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        AI-powered insights and actionable recommendations to enhance your teaching effectiveness
      </Text>

      {aiInsights.map((insight) => (
        <TouchableOpacity
          key={insight.id}
          style={styles.fullInsightCard}
          onPress={() => handleInsightAction(insight.id)}
        >
          <View style={styles.fullInsightHeader}>
            <Text style={styles.insightTypeIconLarge}>
              {insight.type === 'alert' ? '⚠️' :
               insight.type === 'prediction' ? '🔮' :
               insight.type === 'opportunity' ? '🎯' : '💡'}
            </Text>

            <View style={styles.insightTitleSection}>
              <Text style={styles.fullInsightTitle}>{insight.title}</Text>
              <Text style={styles.insightType}>{insight.type.toUpperCase()}</Text>
            </View>

            <View style={styles.insightBadges}>
              <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) }]}>
                <Text style={styles.badgeText}>{insight.impact.toUpperCase()}</Text>
              </View>
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>{insight.urgency.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.fullInsightDescription}>{insight.description}</Text>

          <View style={styles.actionItemsSection}>
            <Text style={styles.actionItemsTitle}>📋 Action Items</Text>
            {insight.actionItems.map((item, i) => (
              <View key={i} style={styles.actionItem}>
                <Text style={styles.actionItemBullet}>•</Text>
                <Text style={styles.actionItemText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.implementationInfo}>
            <Text style={styles.implementationTime}>
              ⏱️ Estimated time: {insight.estimatedTimeToImplement} minutes
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate?.('teacher-dashboard')} />
      <Appbar.Content title="AI Analytics Dashboard" subtitle={`Teaching insights for ${teacherName}`} />
      <Appbar.Action icon="chart-line" onPress={() => setSelectedTab('predictions')} />
      <Appbar.Action icon="lightbulb" onPress={() => setSelectedTab('insights')} />
    </Appbar.Header>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
          <Appbar.BackAction onPress={() => onNavigate?.('teacher-dashboard')} />
          <Appbar.Content title="AI Analytics Dashboard" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading AI analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {renderAppBar()}

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {(['week', 'month', 'semester'] as const).map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.activeTimeframeButton
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.activeTimeframeText
            ]}>
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'predictions', label: 'Predictions', icon: '🔮' },
          { key: 'engagement', label: 'Engagement', icon: '📈' },
          { key: 'effectiveness', label: 'Teaching', icon: '🎯' },
          { key: 'insights', label: 'AI Insights', icon: '🤖' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'predictions' && renderPredictionsTab()}
        {selectedTab === 'engagement' && renderEngagementTab()}
        {selectedTab === 'effectiveness' && renderEffectivenessTab()}
        {selectedTab === 'insights' && renderInsightsTab()}
      </ScrollView>

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
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    justifyContent: 'center',
    gap: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  timeframeButton: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 6,
  },
  activeTimeframeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeframeText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  activeTimeframeText: {
    opacity: 1,
    fontWeight: 'bold',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: LightTheme.Primary,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    fontSize: 11,
  },
  activeTabText: {
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: Spacing.LG,
  },
  tabDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XL,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
    marginBottom: Spacing.LG,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - Spacing.LG * 3) / 2,
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricNumber: {
    ...Typography.headlineMedium,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.SM,
  },
  sectionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.MD,
  },
  quickInsightItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  insightTypeIcon: {
    fontSize: 20,
    marginRight: Spacing.SM,
  },
  insightTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  impactText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  insightDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 18,
  },
  viewAllButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LightTheme.Primary,
    marginTop: Spacing.SM,
  },
  viewAllButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  effectivenessItem: {
    marginBottom: Spacing.LG,
  },
  effectivenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  effectivenessMetric: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  effectivenessScore: {
    ...Typography.titleMedium,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  effectivenessBarContainer: {
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.SM,
  },
  effectivenessBar: {
    height: '100%',
    backgroundColor: LightTheme.Primary,
    borderRadius: 4,
  },
  effectivenessComparison: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  predictionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  studentName: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  gradeComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.LG,
    gap: Spacing.LG,
  },
  gradeItem: {
    alignItems: 'center',
  },
  gradeLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  currentGrade: {
    ...Typography.headlineMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
  },
  gradeArrow: {
    fontSize: 24,
  },
  predictedGrade: {
    ...Typography.headlineMedium,
    fontWeight: 'bold',
  },
  confidenceContainer: {
    marginBottom: Spacing.LG,
  },
  confidenceLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: LightTheme.Tertiary,
    borderRadius: 4,
  },
  analysisSection: {
    flexDirection: 'row',
    gap: Spacing.LG,
    marginBottom: Spacing.LG,
  },
  analysisColumn: {
    flex: 1,
  },
  analysisTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  strengthItem: {
    ...Typography.bodyMedium,
    color: '#4ECDC4',
    marginBottom: Spacing.XS,
  },
  weaknessItem: {
    ...Typography.bodyMedium,
    color: '#FF8C42',
    marginBottom: Spacing.XS,
  },
  interventionSection: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
  },
  interventionTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  interventionItem: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  engagementCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  className: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  engagementScore: {
    ...Typography.headlineMedium,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  engagementMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.LG,
  },
  engagementMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: Spacing.SM,
  },
  metricValue: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricName: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  timeAnalysis: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  timeAnalysisTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  timeAnalysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
  },
  timeValue: {
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  trendContainer: {
    alignItems: 'center',
  },
  trendLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
  },
  trendValue: {
    fontWeight: 'bold',
  },
  gapCard: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  gapTopic: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  gapSubject: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    marginBottom: Spacing.SM,
  },
  gapStats: {
    marginBottom: Spacing.MD,
  },
  gapStat: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  gapActions: {},
  gapActionsTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  gapAction: {
    ...Typography.bodySmall,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  effectivenessCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  effectivenessCardTitle: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.LG,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  scoreValue: {
    ...Typography.headlineLarge,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  scoreComparison: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.SM,
  },
  scoreBarContainer: {
    height: 12,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.LG,
  },
  scoreBar: {
    height: '100%',
    backgroundColor: LightTheme.Primary,
    borderRadius: 6,
  },
  trendInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.LG,
  },
  trendLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
  },
  trendChange: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
  },
  strengthsSection: {
    marginBottom: Spacing.LG,
  },
  strengthsTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  strengthText: {
    ...Typography.bodyMedium,
    color: '#4ECDC4',
    marginBottom: Spacing.XS,
  },
  recommendationsSection: {},
  recommendationsTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.SM,
  },
  recommendationText: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  fullInsightCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 16,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fullInsightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  insightTypeIconLarge: {
    fontSize: 32,
    marginRight: Spacing.MD,
  },
  insightTitleSection: {
    flex: 1,
  },
  fullInsightTitle: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.XS,
  },
  insightType: {
    ...Typography.labelMedium,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: 'bold',
  },
  insightBadges: {
    gap: Spacing.XS,
  },
  urgencyBadge: {
    backgroundColor: LightTheme.OutlineVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  urgencyText: {
    ...Typography.labelSmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: 'bold',
    fontSize: 10,
  },
  fullInsightDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  actionItemsSection: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  actionItemsTitle: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.MD,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  actionItemBullet: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    marginRight: Spacing.SM,
    fontWeight: 'bold',
  },
  actionItemText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    flex: 1,
    lineHeight: 20,
  },
  implementationInfo: {
    alignItems: 'center',
  },
  implementationTime: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
});

export default TeacherAIAnalyticsDashboard;