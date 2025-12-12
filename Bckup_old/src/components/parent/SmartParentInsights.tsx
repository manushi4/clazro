/**
 * SmartParentInsights - Phase 89: AI-Powered Parent Intelligence Dashboard
 * Advanced parent analytics with predictive insights, behavioral analysis,
 * and personalized recommendations for child development
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
// import ReactNativeHapticFeedback from 'react-native-haptic-feedback'; // Not installed
import {LightTheme} from '../../theme/colors';
import {Typography} from '../../theme/typography';
import {Spacing, BorderRadius} from '../../theme/spacing';
import {EnhancedTouchableButton} from '../core/EnhancedTouchableButton';

const {width} = Dimensions.get('window');

export interface ChildInsight {
  id: string;
  name: string;
  grade: string;
  aiScore: number;
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  behaviorTrends: BehaviorTrend[];
  academicPredictions: AcademicPrediction[];
  recommendedActions: RecommendedAction[];
}

export interface RiskFactor {
  id: string;
  type: 'academic' | 'behavioral' | 'social' | 'health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number;
  suggestedIntervention: string;
  timeline: string;
}

export interface Opportunity {
  id: string;
  category: 'academic_excellence' | 'skill_development' | 'leadership' | 'creativity';
  title: string;
  description: string;
  confidence: number;
  requirements: string[];
  expectedOutcome: string;
}

export interface BehaviorTrend {
  id: string;
  metric: string;
  currentValue: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  weeklyData: number[];
  insights: string;
}

export interface AcademicPrediction {
  subject: string;
  currentGrade: number;
  predictedGrade: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export interface RecommendedAction {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'academic' | 'behavioral' | 'social' | 'health' | 'enrichment';
  title: string;
  description: string;
  estimatedImpact: number;
  timeToImplement: string;
  resources: string[];
}

interface SmartParentInsightsProps {
  children: ChildInsight[];
  onActionTaken: (actionId: string, childId: string) => void;
  onDetailView: (childId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const SmartParentInsights: React.FC<SmartParentInsightsProps> = ({
  children,
  onActionTaken,
  onDetailView,
  refreshing = false,
  onRefresh,
}) => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'opportunities' | 'actions'>('overview');

  // Animation values
  const cardScale = useRef(new Animated.Value(1)).current;
  const tabAnimation = useRef(new Animated.Value(0)).current;

  // Fallback data for development/testing only - Real data comes from parent component via props
  const defaultChildren: ChildInsight[] = [
    {
      id: 'child1',
      name: 'Aarav Sharma',
      grade: '10th Grade',
      aiScore: 85,
      riskFactors: [
        {
          id: 'risk1',
          type: 'academic',
          severity: 'medium',
          description: 'Mathematics performance declining by 15% over last month',
          probability: 0.7,
          suggestedIntervention: 'Additional tutoring in algebra concepts',
          timeline: '2 weeks',
        },
      ],
      opportunities: [
        {
          id: 'opp1',
          category: 'academic_excellence',
          title: 'Science Olympiad Potential',
          description: 'Strong analytical skills suggest high probability of success',
          confidence: 0.9,
          requirements: ['Physics foundation course', 'Laboratory experience'],
          expectedOutcome: 'Regional level competition readiness',
        },
      ],
      behaviorTrends: [
        {
          id: 'trend1',
          metric: 'Study Hours',
          currentValue: 3.2,
          trend: 'improving',
          changePercentage: 15,
          weeklyData: [2.5, 2.8, 3.0, 3.1, 3.2],
          insights: 'Consistent improvement in daily study habits',
        },
      ],
      academicPredictions: [
        {
          subject: 'Mathematics',
          currentGrade: 78,
          predictedGrade: 72,
          confidence: 0.8,
          factors: ['Recent test scores', 'Homework completion rate', 'Class participation'],
          recommendations: ['Focus on problem-solving techniques', 'Regular practice sessions'],
        },
      ],
      recommendedActions: [
        {
          id: 'action1',
          priority: 'high',
          category: 'academic',
          title: 'Schedule Math Tutor',
          description: 'Connect with specialized algebra tutor to address current gaps',
          estimatedImpact: 0.8,
          timeToImplement: '1 week',
          resources: ['Recommended tutors list', 'Schedule coordination'],
        },
      ],
    },
  ];

  const activeChildren = children.length > 0 ? children : defaultChildren;
  const currentChild = selectedChild
    ? activeChildren.find(child => child.id === selectedChild)
    : activeChildren[0];

  useEffect(() => {
    if (selectedChild === null && activeChildren.length > 0) {
      setSelectedChild(activeChildren[0].id);
    }
  }, [activeChildren, selectedChild]);

  // Handle child selection
  const handleChildSelect = (childId: string) => {
    setSelectedChild(childId);
    Animated.sequence([
      Animated.spring(cardScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    // ReactNativeHapticFeedback.trigger('impactLight'); // Haptic feedback not installed
  };

  // Handle tab change
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    Animated.timing(tabAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // ReactNativeHapticFeedback.trigger('impactLight'); // Haptic feedback not installed
  };

  // Render AI Score Circle
  const renderAIScore = () => {
    if (!currentChild) return null;

    const score = currentChild.aiScore;
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

    return (
      <View style={styles.aiScoreContainer}>
        <View style={[styles.aiScoreCircle, {borderColor: color}]}>
          <Text style={[styles.aiScoreNumber, {color}]}>{score}</Text>
          <Text style={styles.aiScoreLabel}>AI Score</Text>
        </View>
        <View style={styles.aiScoreDescription}>
          <Text style={styles.aiScoreTitle}>Intelligence Analysis</Text>
          <Text style={styles.aiScoreSubtitle}>
            {score >= 80 ? 'Excellent Progress' : score >= 60 ? 'Good Development' : 'Needs Attention'}
          </Text>
        </View>
      </View>
    );
  };

  // Render Risk Factors
  const renderRiskFactors = () => {
    if (!currentChild) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🚨 Risk Analysis</Text>
        {currentChild.riskFactors.map((risk) => (
          <View key={risk.id} style={[styles.riskCard, {borderLeftColor: getRiskColor(risk.severity)}]}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskType}>{risk.type.toUpperCase()}</Text>
              <Text style={[styles.riskSeverity, {color: getRiskColor(risk.severity)}]}>
                {risk.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.riskDescription}>{risk.description}</Text>
            <Text style={styles.riskProbability}>Probability: {Math.round(risk.probability * 100)}%</Text>
            <Text style={styles.riskIntervention}>💡 {risk.suggestedIntervention}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Opportunities
  const renderOpportunities = () => {
    if (!currentChild) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🌟 Growth Opportunities</Text>
        {currentChild.opportunities.map((opportunity) => (
          <View key={opportunity.id} style={styles.opportunityCard}>
            <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
            <Text style={styles.opportunityCategory}>{opportunity.category.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.opportunityDescription}>{opportunity.description}</Text>
            <Text style={styles.opportunityConfidence}>
              Confidence: {Math.round(opportunity.confidence * 100)}%
            </Text>
            <Text style={styles.opportunityOutcome}>Expected: {opportunity.expectedOutcome}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Recommended Actions
  const renderRecommendedActions = () => {
    if (!currentChild) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🎯 Recommended Actions</Text>
        {currentChild.recommendedActions.map((action) => (
          <View key={action.id} style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={[styles.actionPriority, {color: getPriorityColor(action.priority)}]}>
                {action.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.actionDescription}>{action.description}</Text>
            <View style={styles.actionMetrics}>
              <Text style={styles.actionMetric}>Impact: {Math.round(action.estimatedImpact * 100)}%</Text>
              <Text style={styles.actionMetric}>Time: {action.timeToImplement}</Text>
            </View>
            <EnhancedTouchableButton
              onPress={() => onActionTaken(action.id, currentChild.id)}
              title="Take Action"
              subtitle="Implement this recommendation"
              icon="🚀"
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          </View>
        ))}
      </View>
    );
  };

  // Helper functions
  const getRiskColor = (severity: RiskFactor['severity']) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: RecommendedAction['priority']) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {renderAIScore()}
            {renderRiskFactors()}
          </View>
        );
      case 'risks':
        return renderRiskFactors();
      case 'opportunities':
        return renderOpportunities();
      case 'actions':
        return renderRecommendedActions();
      default:
        return null;
    }
  };

  if (!currentChild) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No child data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Child Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.childSelector}
        contentContainerStyle={styles.childSelectorContent}
      >
        {activeChildren.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childSelectorItem,
              selectedChild === child.id && styles.childSelectorItemActive,
            ]}
            onPress={() => handleChildSelect(child.id)}
          >
            <Text style={[
              styles.childSelectorText,
              selectedChild === child.id && styles.childSelectorTextActive,
            ]}>
              {child.name}
            </Text>
            <Text style={styles.childSelectorGrade}>{child.grade}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['overview', 'risks', 'opportunities', 'actions'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={[styles.content, {transform: [{scale: cardScale}]}]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {renderTabContent()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.LG,
  },
  emptyText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  childSelector: {
    paddingVertical: Spacing.MD,
  },
  childSelectorContent: {
    paddingHorizontal: Spacing.LG,
  },
  childSelectorItem: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginRight: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  childSelectorItemActive: {
    backgroundColor: LightTheme.Primary,
  },
  childSelectorText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
  },
  childSelectorTextActive: {
    color: LightTheme.OnPrimary,
  },
  childSelectorGrade: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    paddingHorizontal: Spacing.LG,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: LightTheme.Primary,
  },
  tabText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  tabTextActive: {
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.LG,
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.LG,
  },
  aiScoreNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  aiScoreLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  aiScoreDescription: {
    flex: 1,
  },
  aiScoreTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  aiScoreSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  sectionContainer: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  riskCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    borderLeftWidth: 4,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 1,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  riskType: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
  },
  riskSeverity: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  riskDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  riskProbability: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  riskIntervention: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.Primary,
    fontStyle: 'italic',
  },
  opportunityCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  opportunityTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: Spacing.XS,
  },
  opportunityCategory: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#047857',
    marginBottom: Spacing.SM,
  },
  opportunityDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#065F46',
    marginBottom: Spacing.SM,
  },
  opportunityConfidence: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#047857',
    marginBottom: Spacing.XS,
  },
  opportunityOutcome: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#065F46',
    fontStyle: 'italic',
  },
  actionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  actionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  actionPriority: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  actionDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  actionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  actionMetric: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  actionButton: {
    marginTop: Spacing.SM,
  },
});

export default SmartParentInsights;