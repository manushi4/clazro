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

// Advanced Analytics Interfaces
interface AnalyticsMetric {
  id: string;
  name: string;
  displayName: string;
  value: number;
  previousValue: number;
  unit: string;
  category: 'enrollment' | 'financial' | 'academic' | 'operational' | 'predictive';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: string;
  status: 'good' | 'warning' | 'critical';
}

interface PredictiveModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  accuracy: number;
  lastTrained: string;
  nextUpdate: string;
  predictions: {
    nextQuarter: number;
    nextSemester: number;
    nextYear: number;
  };
  confidence: number;
  status: 'active' | 'training' | 'needs_update';
}

interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'gauge';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  configuration: {
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    colors?: string[];
    showLegend?: boolean;
    refreshRate?: number;
  };
}

interface InstitutionalData {
  totalStudents: number;
  activeTeachers: number;
  courseCompletionRate: number;
  averageGrade: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  retentionRate: number;
  satisfactionScore: number;
}

// Mock Data
const mockAnalyticsMetrics: AnalyticsMetric[] = [
  {
    id: '1',
    name: 'total_enrollment',
    displayName: 'Total Enrollment',
    value: 15420,
    previousValue: 14890,
    unit: 'students',
    category: 'enrollment',
    trend: 'up',
    trendPercentage: 3.6,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'good',
  },
  {
    id: '2',
    name: 'monthly_revenue',
    displayName: 'Monthly Revenue',
    value: 2840000,
    previousValue: 2650000,
    unit: '₹',
    category: 'financial',
    trend: 'up',
    trendPercentage: 7.2,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'good',
  },
  {
    id: '3',
    name: 'course_completion_rate',
    displayName: 'Course Completion Rate',
    value: 87.5,
    previousValue: 89.2,
    unit: '%',
    category: 'academic',
    trend: 'down',
    trendPercentage: -1.9,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'warning',
  },
  {
    id: '4',
    name: 'student_satisfaction',
    displayName: 'Student Satisfaction',
    value: 4.6,
    previousValue: 4.4,
    unit: '/5',
    category: 'operational',
    trend: 'up',
    trendPercentage: 4.5,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'good',
  },
  {
    id: '5',
    name: 'predicted_next_quarter_enrollment',
    displayName: 'Predicted Q4 Enrollment',
    value: 16800,
    previousValue: 15420,
    unit: 'students',
    category: 'predictive',
    trend: 'up',
    trendPercentage: 8.9,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'good',
  },
  {
    id: '6',
    name: 'resource_utilization',
    displayName: 'Resource Utilization',
    value: 78.3,
    previousValue: 82.1,
    unit: '%',
    category: 'operational',
    trend: 'down',
    trendPercentage: -4.6,
    lastUpdated: '2025-09-03T10:30:00Z',
    status: 'warning',
  },
];

const mockPredictiveModels: PredictiveModel[] = [
  {
    id: '1',
    name: 'enrollment_forecasting',
    displayName: 'Enrollment Forecasting',
    description: 'Predicts student enrollment trends based on historical data, market conditions, and seasonal patterns',
    accuracy: 94.2,
    lastTrained: '2025-09-01T00:00:00Z',
    nextUpdate: '2025-09-15T00:00:00Z',
    predictions: {
      nextQuarter: 16800,
      nextSemester: 17500,
      nextYear: 19200,
    },
    confidence: 92.5,
    status: 'active',
  },
  {
    id: '2',
    name: 'retention_analysis',
    displayName: 'Student Retention Analysis',
    description: 'Identifies students at risk of dropping out and suggests intervention strategies',
    accuracy: 89.7,
    lastTrained: '2025-08-28T00:00:00Z',
    nextUpdate: '2025-09-12T00:00:00Z',
    predictions: {
      nextQuarter: 91.2,
      nextSemester: 88.7,
      nextYear: 90.1,
    },
    confidence: 87.3,
    status: 'active',
  },
  {
    id: '3',
    name: 'revenue_optimization',
    displayName: 'Revenue Optimization',
    description: 'Forecasts revenue streams and identifies optimization opportunities',
    accuracy: 96.1,
    lastTrained: '2025-09-02T00:00:00Z',
    nextUpdate: '2025-09-16T00:00:00Z',
    predictions: {
      nextQuarter: 3200000,
      nextSemester: 6800000,
      nextYear: 14500000,
    },
    confidence: 94.8,
    status: 'active',
  },
  {
    id: '4',
    name: 'performance_prediction',
    displayName: 'Academic Performance Prediction',
    description: 'Predicts student academic performance and identifies intervention needs',
    accuracy: 85.4,
    lastTrained: '2025-08-25T00:00:00Z',
    nextUpdate: '2025-09-10T00:00:00Z',
    predictions: {
      nextQuarter: 88.5,
      nextSemester: 89.2,
      nextYear: 91.0,
    },
    confidence: 83.1,
    status: 'needs_update',
  },
];

const mockInstitutionalData: InstitutionalData = {
  totalStudents: 15420,
  activeTeachers: 342,
  courseCompletionRate: 87.5,
  averageGrade: 8.4,
  revenueThisMonth: 2840000,
  expensesThisMonth: 1960000,
  retentionRate: 91.2,
  satisfactionScore: 4.6,
};

const AdvancedAnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'predictive' | 'dashboards' | 'reports'>('overview');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<'all' | 'enrollment' | 'financial' | 'academic' | 'operational' | 'predictive'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [institutionalData, setInstitutionalData] = useState<InstitutionalData>(mockInstitutionalData);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetric[]>(mockAnalyticsMetrics);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>(mockPredictiveModels);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setAnalyticsMetrics(prev => 
        prev.map(metric => ({
          ...metric,
          lastUpdated: new Date().toISOString(),
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredMetrics = selectedMetricCategory === 'all' 
    ? analyticsMetrics 
    : analyticsMetrics.filter(metric => metric.category === selectedMetricCategory);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
      Alert.alert('success', 'Analytics data refreshed successfully');
    }, 2000);
  };

  const handleExportReport = () => {
    Alert.alert('Export Report', 'Choose export format:', [
      { text: 'PDF', onPress: () => Alert.alert('Exporting', 'PDF report generation started') },
      { text: 'Excel', onPress: () => Alert.alert('Exporting', 'Excel report generation started') },
      { text: 'PowerBI', onPress: () => Alert.alert('Exporting', 'PowerBI integration started') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return LightTheme.OnSurface;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '₹') {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return `${value}${unit}`;
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Executive Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📊 Executive Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{institutionalData.totalStudents.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Students</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{(institutionalData.revenueThisMonth / 100000).toFixed(1)}L</Text>
            <Text style={styles.summaryLabel}>Monthly Revenue</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{institutionalData.courseCompletionRate}%</Text>
            <Text style={styles.summaryLabel}>Completion Rate</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{institutionalData.satisfactionScore}/5</Text>
            <Text style={styles.summaryLabel}>Satisfaction</Text>
          </View>
        </View>
      </View>

      {/* Key Performance Indicators */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          {analyticsMetrics.slice(0, 4).map((metric) => (
            <View key={metric.id} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiTitle}>{metric.displayName}</Text>
                <Text style={[styles.kpiStatus, { color: getStatusColor(metric.status) }]}>
                  {getTrendIcon(metric.trend)} {metric.trendPercentage > 0 ? '+' : ''}{metric.trendPercentage}%
                </Text>
              </View>
              <Text style={styles.kpiValue}>
                {formatValue(metric.value, metric.unit)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Quick Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🔄</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>Enrollment increased by 3.6% this month</Text>
              <Text style={styles.insightSubtext}>Driven by new course launches and referral program</Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>💰</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>Revenue up 7.2% compared to last month</Text>
              <Text style={styles.insightSubtext}>Premium course subscriptions showing strong growth</Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⚠️</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>Course completion rate decreased by 1.9%</Text>
              <Text style={styles.insightSubtext}>Recommend reviewing course difficulty and support</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMetricsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
        {(['all', 'enrollment', 'financial', 'academic', 'operational', 'predictive'] as const).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryFilter,
              selectedMetricCategory === category && styles.categoryFilterActive
            ]}
            onPress={() => setSelectedMetricCategory(category)}
          >
            <Text style={[
              styles.categoryFilterText,
              selectedMetricCategory === category && styles.categoryFilterTextActive
            ]}>
              {category === 'all' ? 'All Metrics' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Metrics List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Analytics Metrics ({filteredMetrics.length})</Text>
        {filteredMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <View>
                <Text style={styles.metricName}>{metric.displayName}</Text>
                <Text style={styles.metricCategory}>{metric.category}</Text>
              </View>
              <View style={styles.metricValue}>
                <Text style={[styles.metricValueText, { color: getStatusColor(metric.status) }]}>
                  {formatValue(metric.value, metric.unit)}
                </Text>
                <Text style={[styles.metricTrend, { color: getStatusColor(metric.status) }]}>
                  {getTrendIcon(metric.trend)} {metric.trendPercentage > 0 ? '+' : ''}{metric.trendPercentage}%
                </Text>
              </View>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.metricTimestamp}>
                Last updated: {new Date(metric.lastUpdated).toLocaleString()}
              </Text>
              <TouchableOpacity style={styles.metricAction}>
                <Text style={styles.metricActionText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPredictiveTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔮 Predictive Models</Text>
        {predictiveModels.map((model) => (
          <View key={model.id} style={styles.modelCard}>
            <View style={styles.modelHeader}>
              <View>
                <Text style={styles.modelName}>{model.displayName}</Text>
                <Text style={styles.modelDescription}>{model.description}</Text>
              </View>
              <View style={[
                styles.modelStatus,
                { backgroundColor: model.status === 'active' ? '#4CAF50' : model.status === 'training' ? '#FF9800' : '#F44336' }
              ]}>
                <Text style={styles.modelStatusText}>
                  {model.status === 'active' ? '●' : model.status === 'training' ? '⟳' : '⚠'}
                </Text>
              </View>
            </View>
            
            <View style={styles.modelMetrics}>
              <View style={styles.modelMetric}>
                <Text style={styles.modelMetricLabel}>Accuracy</Text>
                <Text style={styles.modelMetricValue}>{model.accuracy}%</Text>
              </View>
              <View style={styles.modelMetric}>
                <Text style={styles.modelMetricLabel}>Confidence</Text>
                <Text style={styles.modelMetricValue}>{model.confidence}%</Text>
              </View>
            </View>

            <View style={styles.predictionsGrid}>
              <Text style={styles.predictionsTitle}>Predictions:</Text>
              <View style={styles.predictions}>
                <View style={styles.prediction}>
                  <Text style={styles.predictionLabel}>Next Quarter</Text>
                  <Text style={styles.predictionValue}>
                    {model.name === 'revenue_optimization' ? `₹${(model.predictions.nextQuarter / 100000).toFixed(1)}L` : 
                     model.name === 'retention_analysis' || model.name === 'performance_prediction' ? `${model.predictions.nextQuarter}%` :
                     model.predictions.nextQuarter.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.prediction}>
                  <Text style={styles.predictionLabel}>Next Semester</Text>
                  <Text style={styles.predictionValue}>
                    {model.name === 'revenue_optimization' ? `₹${(model.predictions.nextSemester / 100000).toFixed(1)}L` :
                     model.name === 'retention_analysis' || model.name === 'performance_prediction' ? `${model.predictions.nextSemester}%` :
                     model.predictions.nextSemester.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.prediction}>
                  <Text style={styles.predictionLabel}>Next Year</Text>
                  <Text style={styles.predictionValue}>
                    {model.name === 'revenue_optimization' ? `₹${(model.predictions.nextYear / 100000).toFixed(1)}L` :
                     model.name === 'retention_analysis' || model.name === 'performance_prediction' ? `${model.predictions.nextYear}%` :
                     model.predictions.nextYear.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modelFooter}>
              <Text style={styles.modelTimestamp}>
                Last trained: {new Date(model.lastTrained).toLocaleDateString()}
              </Text>
              <TouchableOpacity style={styles.modelAction}>
                <Text style={styles.modelActionText}>Configure Model</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDashboardsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Custom Dashboards</Text>
        <View style={styles.dashboardBuilder}>
          <View style={styles.builderHeader}>
            <Text style={styles.builderTitle}>Dashboard Builder</Text>
            <TouchableOpacity style={styles.builderAction}>
              <Text style={styles.builderActionText}>+ New Dashboard</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dashboardGrid}>
            <View style={styles.dashboardCard}>
              <Text style={styles.dashboardName}>Executive Overview</Text>
              <Text style={styles.dashboardDescription}>High-level KPIs and trends</Text>
              <Text style={styles.dashboardWidgets}>8 widgets • Last updated: 2 hours ago</Text>
            </View>
            <View style={styles.dashboardCard}>
              <Text style={styles.dashboardName}>Financial Analytics</Text>
              <Text style={styles.dashboardDescription}>Revenue, costs, and profitability</Text>
              <Text style={styles.dashboardWidgets}>12 widgets • Last updated: 1 hour ago</Text>
            </View>
            <View style={styles.dashboardCard}>
              <Text style={styles.dashboardName}>Student Performance</Text>
              <Text style={styles.dashboardDescription}>Academic progress and engagement</Text>
              <Text style={styles.dashboardWidgets}>15 widgets • Last updated: 30 mins ago</Text>
            </View>
          </View>
        </View>

        <View style={styles.widgetLibrary}>
          <Text style={styles.libraryTitle}>Widget Library</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.widgetOption}>
              <Text style={styles.widgetIcon}>📊</Text>
              <Text style={styles.widgetName}>Chart</Text>
            </View>
            <View style={styles.widgetOption}>
              <Text style={styles.widgetIcon}>📈</Text>
              <Text style={styles.widgetName}>Trend</Text>
            </View>
            <View style={styles.widgetOption}>
              <Text style={styles.widgetIcon}>🔢</Text>
              <Text style={styles.widgetName}>Metric</Text>
            </View>
            <View style={styles.widgetOption}>
              <Text style={styles.widgetIcon}>📋</Text>
              <Text style={styles.widgetName}>Table</Text>
            </View>
            <View style={styles.widgetOption}>
              <Text style={styles.widgetIcon}>🗺️</Text>
              <Text style={styles.widgetName}>Heatmap</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );

  const renderReportsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Automated Reports</Text>
        
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Scheduled Reports</Text>
          <View style={styles.reportItem}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Weekly Executive Summary</Text>
              <Text style={styles.reportSchedule}>Every Monday 9:00 AM</Text>
            </View>
            <TouchableOpacity style={styles.reportAction}>
              <Text style={styles.reportActionText}>Configure</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportItem}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Monthly Financial Analysis</Text>
              <Text style={styles.reportSchedule}>1st of every month 8:00 AM</Text>
            </View>
            <TouchableOpacity style={styles.reportAction}>
              <Text style={styles.reportActionText}>Configure</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportItem}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Quarterly Performance Review</Text>
              <Text style={styles.reportSchedule}>First Monday of quarter</Text>
            </View>
            <TouchableOpacity style={styles.reportAction}>
              <Text style={styles.reportActionText}>Configure</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Export Options</Text>
          <View style={styles.exportGrid}>
            <TouchableOpacity style={styles.exportOption} onPress={handleExportReport}>
              <Text style={styles.exportIcon}>📄</Text>
              <Text style={styles.exportName}>PDF Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={handleExportReport}>
              <Text style={styles.exportIcon}>📊</Text>
              <Text style={styles.exportName}>Excel Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={handleExportReport}>
              <Text style={styles.exportIcon}>📈</Text>
              <Text style={styles.exportName}>PowerBI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOption} onPress={handleExportReport}>
              <Text style={styles.exportIcon}>📋</Text>
              <Text style={styles.exportName}>CSV Data</Text>
            </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Advanced Analytics</Text>
          <Text style={styles.headerSubtitle}>Institutional Intelligence & Reporting</Text>
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: '📊 Overview', emoji: '📊' },
            { key: 'metrics', label: '📈 Metrics', emoji: '📈' },
            { key: 'predictive', label: '🔮 Predictive', emoji: '🔮' },
            { key: 'dashboards', label: '📋 Dashboards', emoji: '📋' },
            { key: 'reports', label: '📄 Reports', emoji: '📄' },
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
      {activeTab === 'metrics' && renderMetricsTab()}
      {activeTab === 'predictive' && renderPredictiveTab()}
      {activeTab === 'dashboards' && renderDashboardsTab()}
      {activeTab === 'reports' && renderReportsTab()}
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
  summaryCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  summaryTitle: {
    ...Typography.headlineLarge,
    fontWeight: 'bold',
    marginBottom: Spacing.MD,
    color: '#7C3AED',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: isTablet ? '24%' : '48%',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  summaryValue: {
    ...Typography.displayMedium,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: isTablet ? '24%' : '48%',
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  kpiTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  kpiStatus: {
    ...Typography.bodySmall,
    fontWeight: 'bold',
  },
  kpiValue: {
    ...Typography.headlineLarge,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
  },
  insightsList: {
    gap: Spacing.MD,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    marginTop: Spacing.XS,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  insightSubtext: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  categoryFilters: {
    marginBottom: Spacing.MD,
  },
  categoryFilter: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.FULL,
    marginRight: Spacing.SM,
  },
  categoryFilterActive: {
    backgroundColor: '#7C3AED',
  },
  categoryFilterText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  metricItem: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    paddingVertical: Spacing.MD,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  metricName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  metricCategory: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
    textTransform: 'capitalize',
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricValueText: {
    ...Typography.headlineMedium,
    fontWeight: 'bold',
  },
  metricTrend: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginTop: Spacing.XS,
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTimestamp: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  metricAction: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.SM,
  },
  metricActionText: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  modelCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  modelName: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modelDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  modelStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelStatusText: {
    color: '#FFFFFF',
    fontSize: 8,
  },
  modelMetrics: {
    flexDirection: 'row',
    gap: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  modelMetric: {
    alignItems: 'center',
  },
  modelMetricLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  modelMetricValue: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginTop: Spacing.XS,
  },
  predictionsGrid: {
    marginBottom: Spacing.MD,
  },
  predictionsTitle: {
    ...Typography.bodySmall,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  predictions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prediction: {
    alignItems: 'center',
  },
  predictionLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  predictionValue: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginTop: Spacing.XS,
  },
  modelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelTimestamp: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  modelAction: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    backgroundColor: '#7C3AED',
    borderRadius: BorderRadius.SM,
  },
  modelActionText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dashboardBuilder: {
    marginBottom: Spacing.LG,
  },
  builderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  builderTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
  },
  builderAction: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#7C3AED',
    borderRadius: BorderRadius.MD,
  },
  builderActionText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dashboardGrid: {
    gap: Spacing.MD,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  dashboardName: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  dashboardDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  dashboardWidgets: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  widgetLibrary: {
    marginTop: Spacing.LG,
  },
  libraryTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  widgetOption: {
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.SM,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    minWidth: 80,
  },
  widgetIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  widgetName: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  reportSection: {
    marginBottom: Spacing.LG,
  },
  reportSectionTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  reportSchedule: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  reportAction: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.SM,
  },
  reportActionText: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  exportOption: {
    width: isTablet ? '23%' : '48%',
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  exportIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  exportName: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
});

export default AdvancedAnalyticsScreen;