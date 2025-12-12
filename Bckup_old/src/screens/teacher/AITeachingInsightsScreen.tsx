/**
 * AITeachingInsightsScreen - Phase 32.1: AI Teaching Insights
 * Intelligent teaching support with predictive analytics and lesson optimization
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
  Dimensions,
  FlatList,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

interface AITeachingInsightsScreenProps {
  teacherId: string;
  onNavigate: (screen: string) => void;
}

interface TeachingInsight {
  id: string;
  type: 'lesson-optimization' | 'engagement-pattern' | 'effectiveness' | 'content-gap' | 'strategy-recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: number;
  actionable: boolean;
  suggestions: string[];
  evidence: {
    dataPoints: number;
    accuracy: number;
    sources: string[];
  };
  createdAt: Date;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

interface PredictiveAnalytics {
  id: string;
  modelType: 'student-success' | 'intervention-need' | 'resource-optimization' | 'class-dynamics' | 'learning-outcome';
  prediction: string;
  confidence: number;
  timeline: string;
  factors: {
    name: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  recommendations: {
    action: string;
    priority: number;
    expectedOutcome: string;
    effort: 'low' | 'medium' | 'high';
  }[];
  dataQuality: number;
  lastUpdated: Date;
}

interface LessonOptimization {
  id: string;
  lessonTitle: string;
  subject: string;
  currentScore: number;
  optimizedScore: number;
  improvements: {
    category: 'pacing' | 'engagement' | 'difficulty' | 'resources' | 'assessment';
    suggestion: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }[];
  studentOutcomes: {
    expected: number;
    current: number;
    improvement: number;
  };
  implementationSteps: string[];
  estimatedTime: number;
}

interface StudentEngagementPattern {
  studentId: string;
  studentName: string;
  overallEngagement: number;
  patterns: {
    timeOfDay: { hour: number; engagement: number }[];
    subjects: { subject: string; engagement: number }[];
    activities: { activity: string; engagement: number }[];
  };
  trends: 'improving' | 'stable' | 'declining';
  alerts: {
    type: 'attention-drop' | 'participation-decline' | 'disengagement-risk';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendations: string[];
}

interface TeachingEffectiveness {
  overall: number;
  categories: {
    lessonDelivery: number;
    studentEngagement: number;
    learningOutcomes: number;
    classroomManagement: number;
    assessmentEffectiveness: number;
  };
  trends: {
    date: Date;
    score: number;
  }[];
  strengths: string[];
  improvementAreas: string[];
  benchmarkComparison: {
    schoolAverage: number;
    districtAverage: number;
    nationalAverage: number;
  };
}

export const AITeachingInsightsScreen: React.FC<AITeachingInsightsScreenProps> = ({
  teacherId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'optimization' | 'engagement' | 'effectiveness'>('insights');
  const [insights, setInsights] = useState<TeachingInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalytics[]>([]);
  const [optimizations, setOptimizations] = useState<LessonOptimization[]>([]);
  const [engagementPatterns, setEngagementPatterns] = useState<StudentEngagementPattern[]>([]);
  const [effectiveness, setEffectiveness] = useState<TeachingEffectiveness | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<TeachingInsight | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadAIInsights();
  }, [teacherId]);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showInsightModal) {
        setShowInsightModal(false);
        setSelectedInsight(null);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showInsightModal]);

  const cleanup = useCallback(() => {
    // Cleanup if needed
  }, []);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  const loadAIInsights = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock AI-generated insights - replace with actual AI API calls
      setInsights([
        {
          id: '1',
          type: 'lesson-optimization',
          title: 'Mathematics Lesson Pacing Optimization',
          description: 'AI analysis suggests slowing down quadratic equations explanation by 15% and adding 2 more practice problems.',
          priority: 'high',
          confidence: 0.89,
          impact: 0.82,
          actionable: true,
          suggestions: [
            'Extend quadratic equations section from 20 to 23 minutes',
            'Add visual representation using graphing tools',
            'Include 2 more worked examples before practice',
            'Implement peer discussion for problem-solving'
          ],
          evidence: {
            dataPoints: 247,
            accuracy: 0.89,
            sources: ['student-performance', 'engagement-metrics', 'assessment-results']
          },
          createdAt: new Date('2024-09-03T10:30:00'),
          status: 'new'
        },
        {
          id: '2',
          type: 'engagement-pattern',
          title: 'Class Engagement Decline After 2:30 PM',
          description: 'Student attention and participation drop by 34% in afternoon sessions. AI recommends interactive activities.',
          priority: 'high',
          confidence: 0.94,
          impact: 0.78,
          actionable: true,
          suggestions: [
            'Introduce 5-minute energizer activities',
            'Switch to hands-on learning after 2:30 PM',
            'Implement movement-based learning exercises',
            'Use gamification for afternoon concepts'
          ],
          evidence: {
            dataPoints: 156,
            accuracy: 0.94,
            sources: ['engagement-sensors', 'participation-tracking', 'attention-metrics']
          },
          createdAt: new Date('2024-09-02T15:45:00'),
          status: 'new'
        },
        {
          id: '3',
          type: 'content-gap',
          title: 'Prerequisites Gap in Algebraic Expressions',
          description: '68% of students lack foundational knowledge in basic arithmetic operations affecting algebra performance.',
          priority: 'critical',
          confidence: 0.91,
          impact: 0.95,
          actionable: true,
          suggestions: [
            'Dedicate 2 sessions to arithmetic fundamentals review',
            'Create personalized practice sheets for struggling students',
            'Implement peer tutoring system',
            'Use adaptive learning modules for skill building'
          ],
          evidence: {
            dataPoints: 189,
            accuracy: 0.91,
            sources: ['assessment-analysis', 'error-patterns', 'prerequisite-mapping']
          },
          createdAt: new Date('2024-09-01T14:20:00'),
          status: 'reviewed'
        }
      ]);

      setPredictions([
        {
          id: '1',
          modelType: 'student-success',
          prediction: '7 students at risk of failing mid-term examinations',
          confidence: 0.87,
          timeline: 'Next 3 weeks',
          factors: [
            { name: 'Assignment completion rate', weight: 0.35, impact: 'negative' },
            { name: 'Class participation', weight: 0.28, impact: 'negative' },
            { name: 'Quiz performance trend', weight: 0.22, impact: 'negative' },
            { name: 'Attendance patterns', weight: 0.15, impact: 'negative' }
          ],
          recommendations: [
            {
              action: 'Implement targeted tutoring sessions',
              priority: 1,
              expectedOutcome: 'Improve success rate by 65%',
              effort: 'medium'
            },
            {
              action: 'Create personalized study plans',
              priority: 2,
              expectedOutcome: 'Increase engagement by 45%',
              effort: 'low'
            },
            {
              action: 'Schedule parent conferences',
              priority: 3,
              expectedOutcome: 'Improve home support by 30%',
              effort: 'low'
            }
          ],
          dataQuality: 0.92,
          lastUpdated: new Date('2024-09-03T09:00:00')
        },
        {
          id: '2',
          modelType: 'class-dynamics',
          prediction: 'Optimal class size should be reduced by 3 students for current teaching style',
          confidence: 0.82,
          timeline: 'Immediate implementation',
          factors: [
            { name: 'Individual attention time', weight: 0.40, impact: 'negative' },
            { name: 'Student interaction quality', weight: 0.30, impact: 'negative' },
            { name: 'Classroom management efficiency', weight: 0.20, impact: 'neutral' },
            { name: 'Learning objective coverage', weight: 0.10, impact: 'negative' }
          ],
          recommendations: [
            {
              action: 'Request class size adjustment',
              priority: 1,
              expectedOutcome: 'Improve individual attention by 40%',
              effort: 'high'
            },
            {
              action: 'Implement small group activities',
              priority: 2,
              expectedOutcome: 'Enhance interaction quality by 35%',
              effort: 'medium'
            }
          ],
          dataQuality: 0.88,
          lastUpdated: new Date('2024-09-02T16:30:00')
        }
      ]);

      setOptimizations([
        {
          id: '1',
          lessonTitle: 'Introduction to Trigonometry',
          subject: 'Mathematics',
          currentScore: 72,
          optimizedScore: 89,
          improvements: [
            {
              category: 'pacing',
              suggestion: 'Extend concept introduction by 8 minutes',
              impact: 0.12,
              effort: 'low'
            },
            {
              category: 'engagement',
              suggestion: 'Add real-world applications using smartphone apps',
              impact: 0.18,
              effort: 'medium'
            },
            {
              category: 'assessment',
              suggestion: 'Include formative assessment every 10 minutes',
              impact: 0.15,
              effort: 'low'
            }
          ],
          studentOutcomes: {
            expected: 89,
            current: 72,
            improvement: 17
          },
          implementationSteps: [
            'Prepare real-world trigonometry examples',
            'Download and test trigonometry apps',
            'Create 10-minute interval checkpoints',
            'Design quick formative assessments',
            'Practice extended pacing in dry run'
          ],
          estimatedTime: 45
        }
      ]);

      setEngagementPatterns([
        {
          studentId: '1',
          studentName: 'Arjun Sharma',
          overallEngagement: 78,
          patterns: {
            timeOfDay: [
              { hour: 9, engagement: 85 },
              { hour: 11, engagement: 82 },
              { hour: 14, engagement: 65 },
              { hour: 16, engagement: 58 }
            ],
            subjects: [
              { subject: 'Mathematics', engagement: 85 },
              { subject: 'Physics', engagement: 72 },
              { subject: 'Chemistry', engagement: 80 }
            ],
            activities: [
              { activity: 'Problem Solving', engagement: 90 },
              { activity: 'Lectures', engagement: 65 },
              { activity: 'Group Work', engagement: 82 }
            ]
          },
          trends: 'stable',
          alerts: [
            {
              type: 'attention-drop',
              severity: 'medium',
              description: 'Attention drops significantly after lunch break'
            }
          ],
          recommendations: [
            'Schedule complex topics in morning sessions',
            'Use interactive activities post-lunch',
            'Implement movement breaks every 30 minutes'
          ]
        }
      ]);

      setEffectiveness({
        overall: 85,
        categories: {
          lessonDelivery: 88,
          studentEngagement: 82,
          learningOutcomes: 85,
          classroomManagement: 87,
          assessmentEffectiveness: 83
        },
        trends: [
          { date: new Date('2024-08-01'), score: 78 },
          { date: new Date('2024-08-15'), score: 81 },
          { date: new Date('2024-09-01'), score: 85 }
        ],
        strengths: [
          'Excellent lesson structure and pacing',
          'Strong rapport with students',
          'Effective use of technology in teaching',
          'Clear explanation of complex concepts'
        ],
        improvementAreas: [
          'Increase student-to-student interaction',
          'Diversify assessment methods',
          'Implement more differentiated instruction'
        ],
        benchmarkComparison: {
          schoolAverage: 79,
          districtAverage: 76,
          nationalAverage: 74
        }
      });

    } catch (error) {
      showSnackbar('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImplementInsight = (insight: TeachingInsight) => {
    Alert.alert(
      'Implement AI Recommendation',
      `Are you sure you want to implement: "${insight.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Implement',
          onPress: () => {
            setInsights(prev => prev.map(i =>
              i.id === insight.id ? { ...i, status: 'implemented' } : i
            ));
            Alert.alert('success', 'AI recommendation has been marked as implemented');
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: TeachingInsight['priority']) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#10B981';
    if (confidence >= 0.8) return '#059669';
    if (confidence >= 0.7) return '#F59E0B';
    return '#EF4444';
  };

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

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <DashboardCard title="🎯 AI Insights Summary" style={styles.sectionCard}>
        <View style={styles.insightsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{insights.length}</Text>
            <Text style={styles.summaryLabel}>Total Insights</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#DC2626' }]}>
              {insights.filter(i => i.priority === 'critical').length}
            </Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>
              {insights.filter(i => i.priority === 'high').length}
            </Text>
            <Text style={styles.summaryLabel}>High Priority</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
              {insights.filter(i => i.status === 'implemented').length}
            </Text>
            <Text style={styles.summaryLabel}>Implemented</Text>
          </View>
        </View>
      </DashboardCard>

      {insights.map((insight) => (
        <DashboardCard key={insight.id} title={insight.title} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightMeta}>
              <Text style={[styles.priorityBadge, {
                backgroundColor: getPriorityColor(insight.priority) + '20',
                color: getPriorityColor(insight.priority)
              }]}>
                {insight.priority.toUpperCase()}
              </Text>
              <Text style={[styles.confidenceBadge, {
                backgroundColor: getConfidenceColor(insight.confidence) + '20',
                color: getConfidenceColor(insight.confidence)
              }]}>
                {Math.round(insight.confidence * 100)}% Confidence
              </Text>
            </View>
            <Text style={styles.insightDate}>
              {insight.createdAt.toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.insightDescription}>{insight.description}</Text>

          <View style={styles.impactSection}>
            <Text style={styles.sectionTitle}>Expected Impact</Text>
            <View style={styles.impactBar}>
              <View style={[styles.impactFill, { width: `${insight.impact * 100}%` }]} />
            </View>
            <Text style={styles.impactText}>{Math.round(insight.impact * 100)}% improvement expected</Text>
          </View>

          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            {insight.suggestions.slice(0, 2).map((suggestion, index) => (
              <Text key={index} style={styles.suggestionItem}>• {suggestion}</Text>
            ))}
            {insight.suggestions.length > 2 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedInsight(insight);
                  setShowInsightModal(true);
                }}
              >
                <Text style={styles.viewMoreText}>View all {insight.suggestions.length} suggestions</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.insightActions}>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => {
                setSelectedInsight(insight);
                setShowInsightModal(true);
              }}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
            
            {insight.actionable && insight.status === 'new' && (
              <TouchableOpacity
                style={styles.implementButton}
                onPress={() => handleImplementInsight(insight)}
              >
                <Text style={styles.implementText}>Implement</Text>
              </TouchableOpacity>
            )}

            {insight.status === 'implemented' && (
              <View style={styles.implementedBadge}>
                <Text style={styles.implementedText}>✓ Implemented</Text>
              </View>
            )}
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderPredictionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {predictions.map((prediction) => (
        <DashboardCard key={prediction.id} title={`🔮 ${prediction.modelType.replace('-', ' ').toUpperCase()}`} style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <Text style={styles.predictionText}>{prediction.prediction}</Text>
            <View style={styles.predictionMeta}>
              <Text style={[styles.confidenceBadge, {
                backgroundColor: getConfidenceColor(prediction.confidence) + '20',
                color: getConfidenceColor(prediction.confidence)
              }]}>
                {Math.round(prediction.confidence * 100)}% Confidence
              </Text>
              <Text style={styles.timelineBadge}>{prediction.timeline}</Text>
            </View>
          </View>

          <View style={styles.factorsSection}>
            <Text style={styles.sectionTitle}>Key Factors</Text>
            {prediction.factors.slice(0, 3).map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <View style={styles.factorWeight}>
                  <Text style={styles.factorWeightText}>{Math.round(factor.weight * 100)}%</Text>
                  <Text style={[styles.factorImpact, {
                    color: factor.impact === 'positive' ? '#10B981' :
                          factor.impact === 'negative' ? '#EF4444' : '#6B7280'
                  }]}>
                    {factor.impact === 'positive' ? '↗️' : factor.impact === 'negative' ? '↘️' : '➡️'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {prediction.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationAction}>{rec.action}</Text>
                  <Text style={[styles.effortBadge, {
                    backgroundColor: rec.effort === 'high' ? '#FEE2E2' :
                                   rec.effort === 'medium' ? '#FEF3C7' : '#D1FAE5',
                    color: rec.effort === 'high' ? '#DC2626' :
                           rec.effort === 'medium' ? '#D97706' : '#059669'
                  }]}>
                    {rec.effort} effort
                  </Text>
                </View>
                <Text style={styles.recommendationOutcome}>Expected: {rec.expectedOutcome}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dataQualitySection}>
            <Text style={styles.dataQualityLabel}>Data Quality: </Text>
            <Text style={[styles.dataQualityValue, {
              color: getConfidenceColor(prediction.dataQuality)
            }]}>
              {Math.round(prediction.dataQuality * 100)}%
            </Text>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderOptimizationTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {optimizations.map((optimization) => (
        <DashboardCard key={optimization.id} title={optimization.lessonTitle} style={styles.optimizationCard}>
          <View style={styles.optimizationHeader}>
            <Text style={styles.subjectBadge}>{optimization.subject}</Text>
            <View style={styles.scoreComparison}>
              <Text style={styles.currentScore}>Current: {optimization.currentScore}%</Text>
              <Text style={styles.optimizedScore}>Optimized: {optimization.optimizedScore}%</Text>
              <Text style={styles.improvement}>
                +{optimization.optimizedScore - optimization.currentScore}%
              </Text>
            </View>
          </View>

          <View style={styles.improvementsSection}>
            <Text style={styles.sectionTitle}>Suggested Improvements</Text>
            {optimization.improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <View style={styles.improvementHeader}>
                  <Text style={styles.improvementCategory}>
                    {improvement.category.replace('-', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.improvementImpact}>
                    +{Math.round(improvement.impact * 100)}%
                  </Text>
                </View>
                <Text style={styles.improvementSuggestion}>{improvement.suggestion}</Text>
                <Text style={[styles.improvementEffort, {
                  color: improvement.effort === 'high' ? '#DC2626' :
                        improvement.effort === 'medium' ? '#D97706' : '#059669'
                }]}>
                  {improvement.effort} effort required
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.implementationSection}>
            <Text style={styles.sectionTitle}>Implementation Steps</Text>
            {optimization.implementationSteps.map((step, index) => (
              <Text key={index} style={styles.implementationStep}>
                {index + 1}. {step}
              </Text>
            ))}
            <Text style={styles.estimatedTime}>
              Estimated preparation time: {optimization.estimatedTime} minutes
            </Text>
          </View>

          <TouchableOpacity style={styles.optimizeButton}>
            <Text style={styles.optimizeButtonText}>Apply Optimization</Text>
          </TouchableOpacity>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderEngagementTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {engagementPatterns.map((pattern) => (
        <DashboardCard key={pattern.studentId} title={`📊 ${pattern.studentName}`} style={styles.engagementCard}>
          <View style={styles.engagementHeader}>
            <Text style={styles.overallEngagement}>
              Overall Engagement: <Text style={[styles.engagementScore, {
                color: pattern.overallEngagement >= 80 ? '#10B981' :
                      pattern.overallEngagement >= 60 ? '#F59E0B' : '#EF4444'
              }]}>
                {pattern.overallEngagement}%
              </Text>
            </Text>
            <Text style={[styles.trendIndicator, {
              color: pattern.trends === 'improving' ? '#10B981' :
                    pattern.trends === 'declining' ? '#EF4444' : '#6B7280'
            }]}>
              {pattern.trends === 'improving' ? '📈 Improving' :
               pattern.trends === 'declining' ? '📉 Declining' : '➡️ Stable'}
            </Text>
          </View>

          <View style={styles.patternsSection}>
            <Text style={styles.sectionTitle}>Engagement by Subject</Text>
            {pattern.patterns.subjects.map((subject, index) => (
              <View key={index} style={styles.patternItem}>
                <Text style={styles.patternName}>{subject.subject}</Text>
                <View style={styles.engagementBar}>
                  <View style={[styles.engagementBarFill, {
                    width: `${subject.engagement}%`,
                    backgroundColor: subject.engagement >= 80 ? '#10B981' :
                                   subject.engagement >= 60 ? '#F59E0B' : '#EF4444'
                  }]} />
                </View>
                <Text style={styles.engagementValue}>{subject.engagement}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {pattern.alerts.map((alert, index) => (
              <View key={index} style={[styles.alertItem, {
                borderLeftColor: alert.severity === 'high' ? '#DC2626' :
                                alert.severity === 'medium' ? '#F59E0B' : '#6B7280'
              }]}>
                <Text style={styles.alertType}>{alert.type.replace('-', ' ').toUpperCase()}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {pattern.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderEffectivenessTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {effectiveness && (
        <DashboardCard title="📈 Teaching Effectiveness Analysis" style={styles.effectivenessCard}>
          <View style={styles.effectivenessHeader}>
            <Text style={styles.overallScore}>
              Overall Score: <Text style={[styles.effectivenessScore, {
                color: effectiveness.overall >= 85 ? '#10B981' :
                      effectiveness.overall >= 70 ? '#F59E0B' : '#EF4444'
              }]}>
                {effectiveness.overall}%
              </Text>
            </Text>
          </View>

          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {Object.entries(effectiveness.categories).map(([category, score]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>
                  {category.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                </Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, {
                    width: `${score}%`,
                    backgroundColor: score >= 85 ? '#10B981' :
                                   score >= 70 ? '#F59E0B' : '#EF4444'
                  }]} />
                </View>
                <Text style={styles.scoreValue}>{score}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.benchmarkSection}>
            <Text style={styles.sectionTitle}>Benchmark Comparison</Text>
            <View style={styles.benchmarkItem}>
              <Text style={styles.benchmarkLabel}>School Average</Text>
              <Text style={[styles.benchmarkValue, {
                color: effectiveness.overall >= effectiveness.benchmarkComparison.schoolAverage ? '#10B981' : '#EF4444'
              }]}>
                {effectiveness.benchmarkComparison.schoolAverage}%
              </Text>
            </View>
            <View style={styles.benchmarkItem}>
              <Text style={styles.benchmarkLabel}>District Average</Text>
              <Text style={[styles.benchmarkValue, {
                color: effectiveness.overall >= effectiveness.benchmarkComparison.districtAverage ? '#10B981' : '#EF4444'
              }]}>
                {effectiveness.benchmarkComparison.districtAverage}%
              </Text>
            </View>
            <View style={styles.benchmarkItem}>
              <Text style={styles.benchmarkLabel}>National Average</Text>
              <Text style={[styles.benchmarkValue, {
                color: effectiveness.overall >= effectiveness.benchmarkComparison.nationalAverage ? '#10B981' : '#EF4444'
              }]}>
                {effectiveness.benchmarkComparison.nationalAverage}%
              </Text>
            </View>
          </View>

          <View style={styles.strengthsSection}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            {effectiveness.strengths.map((strength, index) => (
              <Text key={index} style={styles.strengthItem}>✅ {strength}</Text>
            ))}
          </View>

          <View style={styles.improvementSection}>
            <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            {effectiveness.improvementAreas.map((area, index) => (
              <Text key={index} style={styles.improvementAreaItem}>💡 {area}</Text>
            ))}
          </View>
        </DashboardCard>
      )}
    </ScrollView>
  );

  const renderInsightModal = () => (
    <Modal
      visible={showInsightModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowInsightModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedInsight && (
              <>
                <Text style={styles.modalTitle}>{selectedInsight.title}</Text>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.priorityBadge, {
                    backgroundColor: getPriorityColor(selectedInsight.priority) + '20',
                    color: getPriorityColor(selectedInsight.priority)
                  }]}>
                    {selectedInsight.priority.toUpperCase()}
                  </Text>
                  <Text style={[styles.confidenceBadge, {
                    backgroundColor: getConfidenceColor(selectedInsight.confidence) + '20',
                    color: getConfidenceColor(selectedInsight.confidence)
                  }]}>
                    {Math.round(selectedInsight.confidence * 100)}% Confidence
                  </Text>
                </View>

                <Text style={styles.modalDescription}>{selectedInsight.description}</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>All AI Suggestions:</Text>
                  {selectedInsight.suggestions.map((suggestion, index) => (
                    <Text key={index} style={styles.modalSuggestion}>• {suggestion}</Text>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Evidence & Data:</Text>
                  <Text style={styles.modalEvidence}>
                    • Analysis based on {selectedInsight.evidence.dataPoints} data points
                  </Text>
                  <Text style={styles.modalEvidence}>
                    • Model accuracy: {Math.round(selectedInsight.evidence.accuracy * 100)}%
                  </Text>
                  <Text style={styles.modalEvidence}>
                    • Data sources: {selectedInsight.evidence.sources.join(', ')}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowInsightModal(false)}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                  {selectedInsight.actionable && selectedInsight.status === 'new' && (
                    <TouchableOpacity
                      style={styles.modalImplementButton}
                      onPress={() => {
                        handleImplementInsight(selectedInsight);
                        setShowInsightModal(false);
                      }}
                    >
                      <Text style={styles.modalImplementText}>Implement</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="AI Teaching Insights" subtitle="Intelligent teaching support & analytics" />
      <Appbar.Action icon="brain" onPress={() => setActiveTab('predictions')} />
      <Appbar.Action icon="lightbulb-on" onPress={() => setActiveTab('insights')} />
    </Appbar.Header>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="AI Teaching Insights" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Analyzing teaching data with AI...</Text>
          <Text style={styles.loadingSubtext}>Generating personalized insights</Text>
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
            {renderTabButton('insights', 'Insights', '🎯')}
            {renderTabButton('predictions', 'Predictions', '🔮')}
            {renderTabButton('optimization', 'Optimization', '⚡')}
            {renderTabButton('engagement', 'Engagement', '📊')}
            {renderTabButton('effectiveness', 'Effectiveness', '📈')}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'insights' && renderInsightsTab()}
          {activeTab === 'predictions' && renderPredictionsTab()}
          {activeTab === 'optimization' && renderOptimizationTab()}
          {activeTab === 'engagement' && renderEngagementTab()}
          {activeTab === 'effectiveness' && renderEffectivenessTab()}
        </View>

        {renderInsightModal()}

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
  },
  loadingText: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  loadingSubtext: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
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
    minWidth: 90,
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

  // Insights Summary Styles
  insightsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },

  // Insight Card Styles
  insightCard: {
    marginBottom: Spacing.MD,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  insightMeta: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '700',
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  insightDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  insightDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  impactSection: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  impactBar: {
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: Spacing.SM,
  },
  impactFill: {
    height: '100%',
    backgroundColor: LightTheme.Primary,
  },
  impactText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  suggestionsSection: {
    marginBottom: Spacing.LG,
  },
  suggestionItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  viewMoreText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '600',
    marginTop: Spacing.SM,
  },
  insightActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
    alignItems: 'center',
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  implementButton: {
    flex: 1,
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  implementText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  implementedBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  implementedText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#059669',
    fontWeight: '600',
  },

  // Predictions Styles
  predictionCard: {
    marginBottom: Spacing.MD,
  },
  predictionHeader: {
    marginBottom: Spacing.LG,
  },
  predictionText: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    lineHeight: 22,
  },
  predictionMeta: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  timelineBadge: {
    backgroundColor: LightTheme.TertiaryContainer,
    color: LightTheme.OnTertiaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  factorsSection: {
    marginBottom: Spacing.LG,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  factorName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  factorWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  factorWeightText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
  },
  factorImpact: {
    fontSize: 16,
  },
  recommendationsSection: {
    marginBottom: Spacing.LG,
  },
  recommendationItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  recommendationAction: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
    marginRight: Spacing.SM,
  },
  effortBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  recommendationOutcome: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  dataQualitySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataQualityLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  dataQualityValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },

  // Optimization Styles
  optimizationCard: {
    marginBottom: Spacing.MD,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
  },
  subjectBadge: {
    backgroundColor: LightTheme.PrimaryContainer,
    color: LightTheme.OnPrimaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  scoreComparison: {
    alignItems: 'flex-end',
  },
  currentScore: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  optimizedScore: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.Primary,
  },
  improvement: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: '#10B981',
  },
  improvementsSection: {
    marginBottom: Spacing.LG,
  },
  improvementItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  improvementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  improvementCategory: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.Primary,
  },
  improvementImpact: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: '#10B981',
  },
  improvementSuggestion: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  improvementEffort: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  implementationSection: {
    marginBottom: Spacing.LG,
  },
  implementationStep: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  estimatedTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    marginTop: Spacing.SM,
  },
  optimizeButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optimizeButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },

  // Engagement Styles
  engagementCard: {
    marginBottom: Spacing.MD,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  overallEngagement: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurface,
  },
  engagementScore: {
    fontWeight: '700',
  },
  trendIndicator: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  patternsSection: {
    marginBottom: Spacing.LG,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    gap: Spacing.MD,
  },
  patternName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    width: 80,
  },
  engagementBar: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  engagementBarFill: {
    height: '100%',
  },
  engagementValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  alertsSection: {
    marginBottom: Spacing.LG,
  },
  alertItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderLeftWidth: 4,
    marginBottom: Spacing.SM,
  },
  alertType: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  alertDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  recommendationText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },

  // Effectiveness Styles
  effectivenessCard: {
    marginBottom: Spacing.MD,
  },
  effectivenessHeader: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  overallScore: {
    fontSize: Typography.titleLarge.fontSize,
    color: LightTheme.OnSurface,
  },
  effectivenessScore: {
    fontWeight: Typography.titleLarge.fontWeight,
  },
  categoriesSection: {
    marginBottom: Spacing.LG,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    gap: Spacing.MD,
  },
  categoryName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    width: 120,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
  },
  scoreValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  benchmarkSection: {
    marginBottom: Spacing.LG,
  },
  benchmarkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.SM,
  },
  benchmarkLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  benchmarkValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  strengthsSection: {
    marginBottom: Spacing.LG,
  },
  strengthItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#059669',
    marginBottom: Spacing.SM,
  },
  improvementSection: {
    marginBottom: Spacing.LG,
  },
  improvementAreaItem: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#D97706',
    marginBottom: Spacing.SM,
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.MD,
    marginBottom: Spacing.LG,
  },
  modalDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  modalSection: {
    marginBottom: Spacing.LG,
  },
  modalSectionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  modalSuggestion: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  modalEvidence: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginTop: Spacing.LG,
  },
  modalCloseButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.ErrorContainer,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnErrorContainer,
    fontWeight: '600',
  },
  modalImplementButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.Primary,
    alignItems: 'center',
  },
  modalImplementText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
});

export default AITeachingInsightsScreen;