/**
 * IntelligentAnalyticsDashboard - Phase 90: Admin Analytics & Reporting Overhaul
 * Advanced admin analytics with real-time insights, predictive modeling,
 * and comprehensive business intelligence for educational institutions
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
  FlatList,
  Animated,
  Vibration,
} from 'react-native';
// import ReactNativeHapticFeedback from 'react-native-haptic-feedback'; // Replaced with Vibration API
import {LightTheme} from '../../theme/colors';
import {Typography} from '../../theme/typography';
import {Spacing, BorderRadius} from '../../theme/spacing';
import {EnhancedTouchableButton} from '../core/EnhancedTouchableButton';

const {width, height} = Dimensions.get('window');

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  category: 'financial' | 'academic' | 'operational' | 'engagement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  historical: HistoricalData[];
}

export interface HistoricalData {
  date: string;
  value: number;
}

export interface PredictiveInsight {
  id: string;
  type: 'revenue_forecast' | 'enrollment_prediction' | 'risk_assessment' | 'opportunity_identification';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  predictedValue: number;
  currentValue: number;
  factors: InfluencingFactor[];
  recommendations: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

export interface InfluencingFactor {
  name: string;
  weight: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'financial' | 'academic' | 'operational' | 'technical';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  affectedMetrics: string[];
  suggestedActions: string[];
}

export interface DepartmentAnalytics {
  department: string;
  metrics: BusinessMetric[];
  performance: number;
  trends: {
    enrollment: number;
    satisfaction: number;
    revenue: number;
    efficiency: number;
  };
  alerts: PerformanceAlert[];
}

interface IntelligentAnalyticsDashboardProps {
  metrics: BusinessMetric[];
  insights: PredictiveInsight[];
  alerts: PerformanceAlert[];
  departments: DepartmentAnalytics[];
  onMetricClick: (metricId: string) => void;
  onAlertAction: (alertId: string, action: string) => void;
  onExportReport: (format: 'pdf' | 'excel' | 'csv') => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const IntelligentAnalyticsDashboard: React.FC<IntelligentAnalyticsDashboardProps> = ({
  metrics,
  insights,
  alerts,
  departments,
  onMetricClick,
  onAlertAction,
  onExportReport,
  refreshing = false,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'alerts' | 'departments'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Animation values
  const cardScale = useRef(new Animated.Value(1)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;

  // Sample data if none provided
  const defaultMetrics: BusinessMetric[] = [
    {
      id: 'revenue',
      name: 'Monthly Revenue',
      value: 125000,
      unit: '₹',
      change: 12.5,
      trend: 'up',
      target: 150000,
      category: 'financial',
      priority: 'critical',
      historical: [
        {date: '2025-08-01', value: 110000},
        {date: '2025-08-15', value: 118000},
        {date: '2025-09-01', value: 125000},
      ],
    },
    {
      id: 'enrollment',
      name: 'Active Students',
      value: 1247,
      unit: 'students',
      change: 8.3,
      trend: 'up',
      target: 1500,
      category: 'academic',
      priority: 'high',
      historical: [
        {date: '2025-08-01', value: 1150},
        {date: '2025-08-15', value: 1200},
        {date: '2025-09-01', value: 1247},
      ],
    },
    {
      id: 'satisfaction',
      name: 'Student Satisfaction',
      value: 4.6,
      unit: '/5',
      change: 0.2,
      trend: 'up',
      target: 4.8,
      category: 'engagement',
      priority: 'medium',
      historical: [
        {date: '2025-08-01', value: 4.4},
        {date: '2025-08-15', value: 4.5},
        {date: '2025-09-01', value: 4.6},
      ],
    },
    {
      id: 'efficiency',
      name: 'Operational Efficiency',
      value: 87,
      unit: '%',
      change: -2.1,
      trend: 'down',
      target: 90,
      category: 'operational',
      priority: 'high',
      historical: [
        {date: '2025-08-01', value: 89},
        {date: '2025-08-15', value: 88},
        {date: '2025-09-01', value: 87},
      ],
    },
  ];

  const defaultInsights: PredictiveInsight[] = [
    {
      id: 'insight1',
      type: 'enrollment_prediction',
      title: 'Enrollment Growth Forecast',
      description: 'Based on current trends, enrollment is projected to reach 1,450 students by December 2025',
      confidence: 0.89,
      timeframe: '3 months',
      predictedValue: 1450,
      currentValue: 1247,
      factors: [
        {name: 'Marketing Campaign Performance', weight: 0.4, trend: 'increasing'},
        {name: 'Student Satisfaction Scores', weight: 0.3, trend: 'increasing'},
        {name: 'Seasonal Enrollment Patterns', weight: 0.3, trend: 'stable'},
      ],
      recommendations: [
        'Increase marketing budget allocation by 15%',
        'Focus on referral programs during peak enrollment periods',
        'Enhance online course offerings to capture remote students',
      ],
      impact: 'positive',
    },
    {
      id: 'insight2',
      type: 'risk_assessment',
      title: 'Teacher Retention Risk',
      description: 'Current data indicates 18% probability of teacher turnover in next quarter',
      confidence: 0.76,
      timeframe: '3 months',
      predictedValue: 18,
      currentValue: 12,
      factors: [
        {name: 'Workload Increase', weight: 0.5, trend: 'increasing'},
        {name: 'Compensation Satisfaction', weight: 0.3, trend: 'decreasing'},
        {name: 'Professional Development Opportunities', weight: 0.2, trend: 'stable'},
      ],
      recommendations: [
        'Implement teacher workload assessment and redistribution',
        'Review and adjust compensation packages',
        'Increase professional development budget by 25%',
      ],
      impact: 'negative',
    },
  ];

  const defaultAlerts: PerformanceAlert[] = [
    {
      id: 'alert1',
      severity: 'critical',
      category: 'financial',
      title: 'Revenue Target Shortfall',
      description: 'Monthly revenue is 16.7% below target with 5 days remaining in the month',
      timestamp: '2025-09-15T10:30:00Z',
      status: 'active',
      affectedMetrics: ['revenue', 'enrollment'],
      suggestedActions: [
        'Launch targeted enrollment campaign',
        'Accelerate payment collection for pending fees',
        'Review pricing strategy for new courses',
      ],
    },
    {
      id: 'alert2',
      severity: 'warning',
      category: 'operational',
      title: 'System Performance Degradation',
      description: 'Platform response time increased by 23% over the last 48 hours',
      timestamp: '2025-09-15T08:15:00Z',
      status: 'acknowledged',
      affectedMetrics: ['efficiency'],
      suggestedActions: [
        'Scale server infrastructure',
        'Optimize database queries',
        'Review third-party service performance',
      ],
    },
  ];

  const activeMetrics = metrics.length > 0 ? metrics : defaultMetrics;
  const activeInsights = insights.length > 0 ? insights : defaultInsights;
  const activeAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  useEffect(() => {
    // Pulse animation for critical alerts
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical' && alert.status === 'active');
    if (criticalAlerts.length > 0) {
      Animated.sequence([
        Animated.spring(alertPulse, {
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(alertPulse, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeAlerts, alertPulse]);

  // Handle tab change
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    Animated.sequence([
      Animated.spring(cardScale, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    Vibration.vibrate(10); // Light haptic feedback
  };

  // Render metric card
  const renderMetricCard = (metric: BusinessMetric) => {
    const isPositiveTrend = metric.trend === 'up';
    const trendColor = isPositiveTrend ? '#10B981' : metric.trend === 'down' ? '#EF4444' : '#6B7280';
    const progressPercentage = metric.target ? (metric.value / metric.target) * 100 : 0;

    return (
      <TouchableOpacity
        key={metric.id}
        style={styles.metricCard}
        onPress={() => onMetricClick(metric.id)}
      >
        <View style={styles.metricHeader}>
          <Text style={styles.metricName}>{metric.name}</Text>
          <Text style={[styles.metricPriority, {color: getPriorityColor(metric.priority)}]}>
            {metric.priority.toUpperCase()}
          </Text>
        </View>

        <View style={styles.metricValue}>
          <Text style={styles.metricNumber}>
            {metric.unit === '₹' ? `₹${(metric.value / 1000).toFixed(0)}K` : `${metric.value}${metric.unit !== 'students' ? metric.unit : ''}`}
          </Text>
          <View style={[styles.metricTrend, {backgroundColor: trendColor + '20'}]}>
            <Text style={[styles.metricChange, {color: trendColor}]}>
              {isPositiveTrend ? '↗' : metric.trend === 'down' ? '↘' : '→'} {Math.abs(metric.change)}%
            </Text>
          </View>
        </View>

        {metric.target && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${Math.min(progressPercentage, 100)}%`}]} />
            </View>
            <Text style={styles.progressText}>
              {progressPercentage.toFixed(0)}% of target
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render insight card
  const renderInsightCard = (insight: PredictiveInsight) => {
    const impactColor = insight.impact === 'positive' ? '#10B981' : insight.impact === 'negative' ? '#EF4444' : '#6B7280';

    return (
      <View key={insight.id} style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <View style={[styles.insightConfidence, {backgroundColor: impactColor + '20'}]}>
            <Text style={[styles.insightConfidenceText, {color: impactColor}]}>
              {Math.round(insight.confidence * 100)}%
            </Text>
          </View>
        </View>

        <Text style={styles.insightDescription}>{insight.description}</Text>

        <View style={styles.insightMetrics}>
          <View style={styles.insightMetric}>
            <Text style={styles.insightMetricLabel}>Current</Text>
            <Text style={styles.insightMetricValue}>{insight.currentValue}</Text>
          </View>
          <View style={styles.insightMetric}>
            <Text style={styles.insightMetricLabel}>Predicted</Text>
            <Text style={[styles.insightMetricValue, {color: impactColor}]}>{insight.predictedValue}</Text>
          </View>
          <View style={styles.insightMetric}>
            <Text style={styles.insightMetricLabel}>Timeframe</Text>
            <Text style={styles.insightMetricValue}>{insight.timeframe}</Text>
          </View>
        </View>

        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {insight.recommendations.slice(0, 2).map((rec, index) => (
            <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
          ))}
        </View>
      </View>
    );
  };

  // Render alert card
  const renderAlertCard = (alert: PerformanceAlert) => {
    const severityColor = getSeverityColor(alert.severity);

    return (
      <Animated.View key={alert.id} style={[styles.alertCard, {borderLeftColor: severityColor, transform: [{scale: alertPulse}]}]}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={[styles.alertSeverity, {color: severityColor}]}>
            {alert.severity.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.alertDescription}>{alert.description}</Text>
        <Text style={styles.alertTimestamp}>
          {new Date(alert.timestamp).toLocaleString()}
        </Text>

        <View style={styles.alertActions}>
          {alert.suggestedActions.slice(0, 1).map((action, index) => (
            <Text key={index} style={styles.alertAction}>💡 {action}</Text>
          ))}
        </View>

        <View style={styles.alertButtons}>
          <EnhancedTouchableButton
            onPress={() => onAlertAction(alert.id, 'acknowledge')}
            title="Acknowledge"
            variant="secondary"
            size="small"
            style={styles.alertButton}
          />
          <EnhancedTouchableButton
            onPress={() => onAlertAction(alert.id, 'resolve')}
            title="Resolve"
            variant="primary"
            size="small"
            style={styles.alertButton}
          />
        </View>
      </Animated.View>
    );
  };

  // Helper functions
  const getPriorityColor = (priority: BusinessMetric['priority']) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            <Text style={styles.sectionTitle}>📊 Key Performance Metrics</Text>
            <FlatList
              data={activeMetrics}
              renderItem={({item}) => renderMetricCard(item)}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.metricsRow}
            />
          </View>
        );
      case 'insights':
        return (
          <View>
            <Text style={styles.sectionTitle}>🔮 Predictive Insights</Text>
            {activeInsights.map(renderInsightCard)}
          </View>
        );
      case 'alerts':
        return (
          <View>
            <Text style={styles.sectionTitle}>🚨 Performance Alerts</Text>
            {activeAlerts.map(renderAlertCard)}
          </View>
        );
      case 'departments':
        return (
          <View>
            <Text style={styles.sectionTitle}>🏢 Department Analytics</Text>
            <Text style={styles.comingSoonText}>Department analytics coming soon...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Export Options */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => onExportReport('pdf')}
        >
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['overview', 'insights', 'alerts', 'departments'] as const).map((tab) => (
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.Surface,
    elevation: 2,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
  },
  exportButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.SM,
  },
  exportButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  metricsRow: {
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    width: (width - Spacing.LG * 3) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  metricName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
    fontWeight: '500',
  },
  metricPriority: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metricNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
  },
  metricTrend: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  metricChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: Spacing.SM,
  },
  progressBar: {
    height: 4,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 2,
    marginBottom: Spacing.XS,
  },
  progressFill: {
    height: '100%',
    backgroundColor: LightTheme.Primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  insightTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  insightConfidence: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  insightConfidenceText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  insightDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  insightMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  insightMetric: {
    alignItems: 'center',
  },
  insightMetricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  insightMetricValue: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
    paddingTop: Spacing.MD,
  },
  recommendationsTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  recommendationItem: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
    lineHeight: 18,
  },
  alertCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    borderLeftWidth: 4,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  alertTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  alertSeverity: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  alertDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  alertTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  alertActions: {
    marginBottom: Spacing.MD,
  },
  alertAction: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  alertButton: {
    flex: 1,
  },
  comingSoonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.XL,
  },
});

export default IntelligentAnalyticsDashboard;