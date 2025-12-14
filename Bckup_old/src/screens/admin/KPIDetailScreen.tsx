import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

// Business Intelligence Interfaces
interface KPIMetric {
  id: string;
  name: string;
  displayName: string;
  category: 'financial' | 'academic' | 'operational' | 'strategic';
  currentValue: number;
  targetValue: number;
  previousPeriodValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: string;
  description: string;
  formula: string;
}

interface TrendData {
  period: string;
  value: number;
  target?: number;
}

interface BenchmarkData {
  category: string;
  ourValue: number;
  industryAverage: number;
  topPerformers: number;
  unit: string;
}

interface RiskAssessment {
  id: string;
  kpiId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  probability: number;
  mitigationStrategy: string;
  assignedTo: string;
  dueDate: string;
  status: 'identified' | 'in_progress' | 'resolved' | 'monitoring';
}

// Mock Data
const mockKPIMetrics: KPIMetric[] = [
  {
    id: '1',
    name: 'student_retention_rate',
    displayName: 'Student Retention Rate',
    category: 'academic',
    currentValue: 91.2,
    targetValue: 95.0,
    previousPeriodValue: 89.7,
    unit: '%',
    trend: 'up',
    trendPercentage: 1.7,
    status: 'good',
    lastUpdated: '2025-09-03T10:00:00Z',
    description: 'Percentage of students who continue their enrollment from one semester to the next',
    formula: '(Students Continuing / Total Students at Start) × 100',
  },
  {
    id: '2',
    name: 'revenue_per_student',
    displayName: 'Revenue per Student',
    category: 'financial',
    currentValue: 18450,
    targetValue: 20000,
    previousPeriodValue: 17200,
    unit: '₹',
    trend: 'up',
    trendPercentage: 7.3,
    status: 'good',
    lastUpdated: '2025-09-03T10:00:00Z',
    description: 'Average revenue generated per enrolled student',
    formula: 'Total Revenue / Total Enrolled Students',
  },
  {
    id: '3',
    name: 'course_completion_rate',
    displayName: 'Course Completion Rate',
    category: 'academic',
    currentValue: 87.5,
    targetValue: 90.0,
    previousPeriodValue: 89.2,
    unit: '%',
    trend: 'down',
    trendPercentage: -1.9,
    status: 'warning',
    lastUpdated: '2025-09-03T10:00:00Z',
    description: 'Percentage of enrolled students who successfully complete their courses',
    formula: '(Students Completed / Students Enrolled) × 100',
  },
  {
    id: '4',
    name: 'customer_acquisition_cost',
    displayName: 'Customer Acquisition Cost',
    category: 'financial',
    currentValue: 3250,
    targetValue: 3000,
    previousPeriodValue: 3450,
    unit: '₹',
    trend: 'up',
    trendPercentage: -5.8,
    status: 'good',
    lastUpdated: '2025-09-03T10:00:00Z',
    description: 'Average cost to acquire a new student customer',
    formula: 'Total Marketing & Sales Expenses / New Students Acquired',
  },
  {
    id: '5',
    name: 'teacher_utilization_rate',
    displayName: 'Teacher Utilization Rate',
    category: 'operational',
    currentValue: 78.3,
    targetValue: 85.0,
    previousPeriodValue: 82.1,
    unit: '%',
    trend: 'down',
    trendPercentage: -4.6,
    status: 'warning',
    lastUpdated: '2025-09-03T10:00:00Z',
    description: 'Percentage of available teacher time that is actively utilized for teaching',
    formula: '(Active Teaching Hours / Available Teaching Hours) × 100',
  },
];

const mockTrendData: { [key: string]: TrendData[] } = {
  '1': [
    { period: 'Jan 2025', value: 88.5, target: 95.0 },
    { period: 'Feb 2025', value: 89.1, target: 95.0 },
    { period: 'Mar 2025', value: 89.7, target: 95.0 },
    { period: 'Apr 2025', value: 90.2, target: 95.0 },
    { period: 'May 2025', value: 90.8, target: 95.0 },
    { period: 'Jun 2025', value: 91.2, target: 95.0 },
  ],
  '2': [
    { period: 'Jan 2025', value: 16800, target: 20000 },
    { period: 'Feb 2025', value: 17100, target: 20000 },
    { period: 'Mar 2025', value: 17200, target: 20000 },
    { period: 'Apr 2025', value: 17650, target: 20000 },
    { period: 'May 2025', value: 18100, target: 20000 },
    { period: 'Jun 2025', value: 18450, target: 20000 },
  ],
  '3': [
    { period: 'Jan 2025', value: 91.2, target: 90.0 },
    { period: 'Feb 2025', value: 90.8, target: 90.0 },
    { period: 'Mar 2025', value: 89.2, target: 90.0 },
    { period: 'Apr 2025', value: 88.7, target: 90.0 },
    { period: 'May 2025', value: 87.9, target: 90.0 },
    { period: 'Jun 2025', value: 87.5, target: 90.0 },
  ],
};

const mockBenchmarkData: BenchmarkData[] = [
  {
    category: 'Student Retention',
    ourValue: 91.2,
    industryAverage: 85.5,
    topPerformers: 96.8,
    unit: '%',
  },
  {
    category: 'Revenue per Student',
    ourValue: 18450,
    industryAverage: 16200,
    topPerformers: 24500,
    unit: '₹',
  },
  {
    category: 'Course Completion',
    ourValue: 87.5,
    industryAverage: 82.3,
    topPerformers: 94.2,
    unit: '%',
  },
];

const mockRiskAssessments: RiskAssessment[] = [
  {
    id: '1',
    kpiId: '3',
    riskLevel: 'medium',
    description: 'Declining course completion rate may impact overall satisfaction and retention',
    impact: 'Potential 5-10% decrease in student retention and negative reviews',
    probability: 65,
    mitigationStrategy: 'Implement enhanced student support system and course difficulty optimization',
    assignedTo: 'Academic Team Lead',
    dueDate: '2025-09-15',
    status: 'in_progress',
  },
  {
    id: '2',
    kpiId: '5',
    riskLevel: 'medium',
    description: 'Teacher utilization below target may indicate resource misallocation',
    impact: 'Increased operational costs and potential teacher dissatisfaction',
    probability: 55,
    mitigationStrategy: 'Optimize scheduling system and implement flexible teaching arrangements',
    assignedTo: 'Operations Manager',
    dueDate: '2025-09-20',
    status: 'identified',
  },
];

const KPIDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'benchmarks' | 'risks' | 'insights'>('overview');
  const [selectedKPI, setSelectedKPI] = useState<KPIMetric>(mockKPIMetrics[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendData, setTrendData] = useState<TrendData[]>(mockTrendData[selectedKPI.id] || []);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>(mockRiskAssessments);

  useEffect(() => {
    // If route params contain a specific KPI ID, select it
    if (route?.params?.kpiId) {
      const kpi = mockKPIMetrics.find(k => k.id === route.params.kpiId);
      if (kpi) {
        setSelectedKPI(kpi);
        setTrendData(mockTrendData[kpi.id] || []);
      }
    }
  }, [route?.params?.kpiId]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Alert.alert('success', 'KPI data refreshed successfully');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return LightTheme.OnSurface;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return LightTheme.OnSurface;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '₹') {
      return `₹${value.toLocaleString()}`;
    }
    return `${value}${unit}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* KPI Header Card */}
      <View style={[styles.card, { backgroundColor: getStatusColor(selectedKPI.status) + '10' }]}>
        <View style={styles.kpiHeader}>
          <View style={styles.kpiTitleSection}>
            <Text style={styles.kpiTitle}>{selectedKPI.displayName}</Text>
            <Text style={styles.kpiDescription}>{selectedKPI.description}</Text>
            <View style={styles.kpiMeta}>
              <Text style={styles.kpiCategory}>
                📊 {selectedKPI.category.charAt(0).toUpperCase() + selectedKPI.category.slice(1)}
              </Text>
              <Text style={styles.kpiFormula}>Formula: {selectedKPI.formula}</Text>
            </View>
          </View>
          <View style={[styles.kpiStatus, { backgroundColor: getStatusColor(selectedKPI.status) }]}>
            <Text style={styles.kpiStatusText}>{selectedKPI.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Current Performance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Current Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Current Value</Text>
            <Text style={[styles.performanceValue, { color: getStatusColor(selectedKPI.status) }]}>
              {formatValue(selectedKPI.currentValue, selectedKPI.unit)}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Target Value</Text>
            <Text style={styles.performanceValue}>
              {formatValue(selectedKPI.targetValue, selectedKPI.unit)}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Previous Period</Text>
            <Text style={styles.performanceValue}>
              {formatValue(selectedKPI.previousPeriodValue, selectedKPI.unit)}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Trend</Text>
            <Text style={[styles.performanceTrend, { color: getStatusColor(selectedKPI.status) }]}>
              {getTrendIcon(selectedKPI.trend)} {selectedKPI.trendPercentage > 0 ? '+' : ''}{selectedKPI.trendPercentage}%
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to Target</Text>
            <Text style={styles.progressPercentage}>
              {Math.round((selectedKPI.currentValue / selectedKPI.targetValue) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((selectedKPI.currentValue / selectedKPI.targetValue) * 100, 100)}%`,
                  backgroundColor: getStatusColor(selectedKPI.status)
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('trends')}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>View Trends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('benchmarks')}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('risks')}>
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionText}>Assess Risks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Export', 'KPI report exported')}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderTrendsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Historical Trends (6 Months)</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.legendLabel}>Actual</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#E0E7FF' }]} />
                <Text style={styles.legendLabel}>Target</Text>
              </View>
            </View>
          </View>
          
          {trendData.map((point, index) => (
            <View key={index} style={styles.chartRow}>
              <Text style={styles.chartPeriod}>{point.period}</Text>
              <View style={styles.chartBars}>
                <View style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill,
                      { 
                        width: `${(point.value / (point.target || 100)) * 100}%`,
                        backgroundColor: '#7C3AED'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartValue}>
                  {formatValue(point.value, selectedKPI.unit)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.trendAnalysis}>
          <Text style={styles.analysisTitle}>Trend Analysis</Text>
          <View style={styles.analysisList}>
            <Text style={styles.analysisPoint}>
              • 6-month trend: {selectedKPI.trend === 'up' ? 'Positive' : selectedKPI.trend === 'down' ? 'Negative' : 'Stable'}
            </Text>
            <Text style={styles.analysisPoint}>
              • Average monthly change: {selectedKPI.trendPercentage > 0 ? '+' : ''}{selectedKPI.trendPercentage}%
            </Text>
            <Text style={styles.analysisPoint}>
              • Distance to target: {Math.abs(selectedKPI.targetValue - selectedKPI.currentValue).toFixed(1)}{selectedKPI.unit}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderBenchmarksTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Industry Benchmarking</Text>
        {mockBenchmarkData.map((benchmark, index) => (
          <View key={index} style={styles.benchmarkItem}>
            <Text style={styles.benchmarkCategory}>{benchmark.category}</Text>
            <View style={styles.benchmarkComparison}>
              <View style={styles.benchmarkBar}>
                <View style={styles.benchmarkSection}>
                  <Text style={styles.benchmarkLabel}>Our Value</Text>
                  <View style={[styles.benchmarkFill, { backgroundColor: '#7C3AED', width: '60%' }]} />
                  <Text style={styles.benchmarkValue}>{formatValue(benchmark.ourValue, benchmark.unit)}</Text>
                </View>
                <View style={styles.benchmarkSection}>
                  <Text style={styles.benchmarkLabel}>Industry Avg</Text>
                  <View style={[styles.benchmarkFill, { backgroundColor: '#94A3B8', width: '40%' }]} />
                  <Text style={styles.benchmarkValue}>{formatValue(benchmark.industryAverage, benchmark.unit)}</Text>
                </View>
                <View style={styles.benchmarkSection}>
                  <Text style={styles.benchmarkLabel}>Top Performers</Text>
                  <View style={[styles.benchmarkFill, { backgroundColor: '#10B981', width: '80%' }]} />
                  <Text style={styles.benchmarkValue}>{formatValue(benchmark.topPerformers, benchmark.unit)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.benchmarkInsights}>
          <Text style={styles.insightsTitle}>Competitive Position</Text>
          <View style={styles.insightsList}>
            <Text style={styles.insightPoint}>
              🎯 Above industry average in 2/3 key metrics
            </Text>
            <Text style={styles.insightPoint}>
              📈 Strong performance in student retention and revenue
            </Text>
            <Text style={styles.insightPoint}>
              ⚠️ Course completion needs improvement to match leaders
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderRisksTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚠️ Risk Assessment</Text>
        {riskAssessments
          .filter(risk => risk.kpiId === selectedKPI.id)
          .map((risk) => (
            <View key={risk.id} style={styles.riskItem}>
              <View style={styles.riskHeader}>
                <View style={[styles.riskLevel, { backgroundColor: getRiskColor(risk.riskLevel) }]}>
                  <Text style={styles.riskLevelText}>{risk.riskLevel.toUpperCase()}</Text>
                </View>
                <View style={[styles.riskStatus, { 
                  backgroundColor: risk.status === 'resolved' ? '#4CAF50' : 
                                  risk.status === 'in_progress' ? '#FF9800' : '#94A3B8'
                }]}>
                  <Text style={styles.riskStatusText}>{risk.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.riskDescription}>{risk.description}</Text>
              
              <View style={styles.riskDetails}>
                <View style={styles.riskDetail}>
                  <Text style={styles.riskDetailLabel}>Impact:</Text>
                  <Text style={styles.riskDetailText}>{risk.impact}</Text>
                </View>
                <View style={styles.riskDetail}>
                  <Text style={styles.riskDetailLabel}>Probability:</Text>
                  <Text style={styles.riskDetailText}>{risk.probability}%</Text>
                </View>
                <View style={styles.riskDetail}>
                  <Text style={styles.riskDetailLabel}>Mitigation:</Text>
                  <Text style={styles.riskDetailText}>{risk.mitigationStrategy}</Text>
                </View>
                <View style={styles.riskDetail}>
                  <Text style={styles.riskDetailLabel}>Assigned to:</Text>
                  <Text style={styles.riskDetailText}>{risk.assignedTo}</Text>
                </View>
                <View style={styles.riskDetail}>
                  <Text style={styles.riskDetailLabel}>Due Date:</Text>
                  <Text style={styles.riskDetailText}>{new Date(risk.dueDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          ))}

        {riskAssessments.filter(risk => risk.kpiId === selectedKPI.id).length === 0 && (
          <View style={styles.noRisksContainer}>
            <Text style={styles.noRisksIcon}>✅</Text>
            <Text style={styles.noRisksText}>No active risks identified for this KPI</Text>
            <Text style={styles.noRisksSubtext}>Regular monitoring continues</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 AI-Powered Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🎯 Performance Summary</Text>
          <Text style={styles.insightContent}>
            {selectedKPI.displayName} is currently at {formatValue(selectedKPI.currentValue, selectedKPI.unit)}, 
            which is {selectedKPI.currentValue > selectedKPI.targetValue ? 'above' : 'below'} the target of {formatValue(selectedKPI.targetValue, selectedKPI.unit)}. 
            The {selectedKPI.trendPercentage > 0 ? 'positive' : 'negative'} trend of {Math.abs(selectedKPI.trendPercentage)}% indicates 
            {selectedKPI.trend === 'up' ? ' improvement' : selectedKPI.trend === 'down' ? ' decline' : ' stability'} compared to the previous period.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>📊 Statistical Analysis</Text>
          <Text style={styles.insightContent}>
            Based on 6-month trend data, the {selectedKPI.trend === 'up' ? 'upward' : selectedKPI.trend === 'down' ? 'downward' : 'stable'} trajectory 
            suggests {selectedKPI.trend === 'up' ? 'continued improvement' : selectedKPI.trend === 'down' ? 'need for intervention' : 'consistent performance'}. 
            Correlation analysis shows strong relationship with overall institutional health metrics.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🔮 Predictive Forecast</Text>
          <Text style={styles.insightContent}>
            If current trends continue, we project reaching {formatValue(selectedKPI.currentValue * (1 + selectedKPI.trendPercentage/100), selectedKPI.unit)} 
            by next period. To achieve the target of {formatValue(selectedKPI.targetValue, selectedKPI.unit)}, 
            a {Math.abs(((selectedKPI.targetValue - selectedKPI.currentValue) / selectedKPI.currentValue * 100)).toFixed(1)}% 
            {selectedKPI.currentValue < selectedKPI.targetValue ? 'improvement' : 'adjustment'} is required.
          </Text>
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>🚀 Strategic Recommendations</Text>
          <View style={styles.recommendationsList}>
            <Text style={styles.recommendation}>
              • {selectedKPI.status === 'warning' || selectedKPI.status === 'critical' ? 
                'Immediate action required - implement corrective measures' : 
                'Maintain current performance with regular monitoring'}
            </Text>
            <Text style={styles.recommendation}>
              • {selectedKPI.trend === 'down' ? 
                'Investigate root causes and implement improvement initiatives' : 
                'Leverage successful strategies for other KPIs'}
            </Text>
            <Text style={styles.recommendation}>
              • Benchmark against top performers to identify best practices
            </Text>
            <Text style={styles.recommendation}>
              • Establish early warning indicators to prevent future issues
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>KPI Analysis</Text>
          <Text style={styles.headerSubtitle}>{selectedKPI.displayName}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonActive]} 
          onPress={handleRefreshData}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '⟳' : '🔄'} {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Selector */}
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mockKPIMetrics.map((kpi) => (
            <TouchableOpacity
              key={kpi.id}
              style={[styles.kpiSelector, selectedKPI.id === kpi.id && styles.kpiSelectorActive]}
              onPress={() => {
                setSelectedKPI(kpi);
                setTrendData(mockTrendData[kpi.id] || []);
              }}
            >
              <Text style={[
                styles.kpiSelectorText,
                selectedKPI.id === kpi.id && styles.kpiSelectorTextActive
              ]}>
                {kpi.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'trends', label: '📈 Trends' },
            { key: 'benchmarks', label: '🏆 Benchmarks' },
            { key: 'risks', label: '⚠️ Risks' },
            { key: 'insights', label: '💡 Insights' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'trends' && renderTrendsTab()}
      {activeTab === 'benchmarks' && renderBenchmarksTab()}
      {activeTab === 'risks' && renderRisksTab()}
      {activeTab === 'insights' && renderInsightsTab()}
    </SafeAreaView>
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
    padding: Spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    backgroundColor: '#7C3AED',
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: '#E0E7FF',
    marginTop: Spacing.XS,
  },
  refreshButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  refreshButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  kpiSelector: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
  },
  kpiSelectorActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
  },
  kpiSelectorText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  kpiSelectorTextActive: {
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.MD,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    ...Typography.headlineLarge,
    fontWeight: 'bold',
    marginBottom: Spacing.MD,
    color: LightTheme.OnSurface,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kpiTitleSection: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  kpiTitle: {
    ...Typography.displayMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  kpiDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  kpiMeta: {
    gap: Spacing.SM,
  },
  kpiCategory: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  kpiFormula: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
  kpiStatus: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  kpiStatusText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.LG,
    marginBottom: Spacing.LG,
  },
  performanceItem: {
    flex: 1,
    minWidth: isTablet ? '20%' : '45%',
    alignItems: 'center',
  },
  performanceLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  performanceValue: {
    ...Typography.headlineLarge,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
  },
  performanceTrend: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: Spacing.LG,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  progressLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  progressPercentage: {
    ...Typography.bodyMedium,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    minWidth: isTablet ? '20%' : '45%',
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.SM,
  },
  actionText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  chartContainer: {
    marginVertical: Spacing.MD,
  },
  chartHeader: {
    marginBottom: Spacing.LG,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.LG,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  chartPeriod: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    width: 80,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  chartBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  chartValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    minWidth: 60,
  },
  trendAnalysis: {
    marginTop: Spacing.LG,
    padding: Spacing.MD,
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
  },
  analysisTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  analysisList: {
    gap: Spacing.XS,
  },
  analysisPoint: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  benchmarkItem: {
    marginBottom: Spacing.LG,
  },
  benchmarkCategory: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  benchmarkComparison: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
  },
  benchmarkBar: {
    gap: Spacing.MD,
  },
  benchmarkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  benchmarkLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    width: 100,
  },
  benchmarkFill: {
    height: 16,
    borderRadius: 8,
    minWidth: 20,
  },
  benchmarkValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    minWidth: 60,
  },
  benchmarkInsights: {
    marginTop: Spacing.LG,
    padding: Spacing.MD,
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.MD,
  },
  insightsTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: '#15803D',
    marginBottom: Spacing.SM,
  },
  insightsList: {
    gap: Spacing.XS,
  },
  insightPoint: {
    ...Typography.bodySmall,
    color: '#166534',
  },
  riskItem: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  riskHeader: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  riskLevel: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  riskLevelText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  riskStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  riskStatusText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  riskDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    fontWeight: '500',
  },
  riskDetails: {
    gap: Spacing.SM,
  },
  riskDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  riskDetailLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    width: 80,
  },
  riskDetailText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  noRisksContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.XL,
  },
  noRisksIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  noRisksText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  noRisksSubtext: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  insightCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  insightTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: Spacing.SM,
  },
  insightContent: {
    ...Typography.bodySmall,
    color: '#164E63',
    lineHeight: 18,
  },
  recommendationsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginTop: Spacing.MD,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  recommendationsTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: '#15803D',
    marginBottom: Spacing.SM,
  },
  recommendationsList: {
    gap: Spacing.SM,
  },
  recommendation: {
    ...Typography.bodySmall,
    color: '#166534',
    lineHeight: 18,
  },
});

export default KPIDetailScreen;