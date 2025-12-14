import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Appbar,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { LightTheme } from '../../theme/colors';
import DashboardCard from '../../components/core/DashboardCard';
import { useChildrenSummary as useParentChildren, useAIInsights } from '../../hooks/api/useParentAPI';
// TODO: Import hooks when backend services are ready
const usePerformanceMetrics = () => ({ data: null, isLoading: false, refetch: async () => {} });
const usePerformanceComparisons = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useAcademicPredictions = () => ({ data: null, isLoading: false, refetch: async () => {} });
const useBehaviorTrends = () => ({ data: [], isLoading: false, refetch: async () => {} });

interface Child {
  id: string;
  name: string;
  grade: string;
  class: string;
  avatar: string;
  overallGrade: number;
  attendance: number;
  isActive: boolean;
}

interface PerformanceMetric {
  id: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  trend: 'improving' | 'stable' | 'declining';
  unit: string;
  category: 'academic' | 'behavioral' | 'attendance' | 'participation';
  benchmark: number;
  percentile: number;
}

interface DetailedReport {
  id: string;
  title: string;
  type: 'academic' | 'behavioral' | 'comprehensive' | 'custom';
  dateRange: string;
  subjects: string[];
  format: 'pdf' | 'excel' | 'csv';
  size: string;
  generated: Date;
  downloadUrl: string;
}

interface ComparisonData {
  category: string;
  childScore: number;
  classAverage: number;
  gradeAverage: number;
  nationalAverage: number;
  maxScore: number;
}

interface PerformanceAnalyticsScreenProps {
  parentId?: string;
  onNavigate: (screen: string) => void;
}

export const PerformanceAnalyticsScreen: React.FC<PerformanceAnalyticsScreenProps> = ({
  parentId = '11111111-1111-1111-1111-111111111111', // Default for testing
  onNavigate,
}) => {
  const { theme } = useTheme();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'reports' | 'comparisons' | 'insights'>('metrics');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'term' | 'year'>('month');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data using real hooks
  const {
    data: childrenData = [],
    isLoading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useParentChildren(parentId);

  const {
    data: metricsData = [],
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = usePerformanceMetrics(selectedChild || '', selectedTimeframe, {
    enabled: !!selectedChild
  });

  const {
    data: comparisonsData = [],
    isLoading: comparisonsLoading,
    error: comparisonsError,
    refetch: refetchComparisons,
  } = usePerformanceComparisons(selectedChild || '', {
    enabled: !!selectedChild
  });

  const {
    data: insightsData = [],
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useAIInsights(parentId, { studentId: selectedChild || undefined });

  const {
    data: predictionsData = [],
    isLoading: predictionsLoading,
    error: predictionsError,
    refetch: refetchPredictions,
  } = useAcademicPredictions(selectedChild || '', {
    enabled: !!selectedChild
  });

  const {
    data: behaviorTrendsData = [],
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useBehaviorTrends(selectedChild || '', {
    enabled: !!selectedChild
  });

  // Set initial selected child when data loads
  React.useEffect(() => {
    if (childrenData && childrenData.length > 0 && !selectedChild) {
      const firstChild = childrenData[0];
      const studentId = firstChild.student?.id || firstChild.student_id || '';
      setSelectedChild(studentId);
    }
  }, [childrenData, selectedChild]);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Build array of refetch promises conditionally
      const refetchPromises: any[] = [
        refetchChildren(),
        refetchInsights(),
      ];

      // Only add child-specific refetches if a child is selected
      if (selectedChild) {
        refetchPromises.push(
          refetchMetrics(),
          refetchComparisons(),
          refetchPredictions(),
          refetchTrends()
        );
      }

      // Use allSettled to allow partial success
      const results = await Promise.allSettled(refetchPromises);

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        showSnackbar('Data refreshed successfully');
      } else if (succeeded.length > 0) {
        showSnackbar(`Partially refreshed (${failed.length} section(s) failed)`);
        console.warn('Some refetches failed:', failed);
      } else {
        throw new Error('All refetches failed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showSnackbar('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchChildren,
    refetchMetrics,
    refetchComparisons,
    refetchInsights,
    refetchPredictions,
    refetchTrends,
    selectedChild,
    showSnackbar,
  ]);

  // Loading state
  const isLoading = childrenLoading || (selectedChild && (metricsLoading || comparisonsLoading || insightsLoading));

  // Error handling - moved to useEffect to prevent infinite render loops
  React.useEffect(() => {
    if (childrenError) {
      showSnackbar(`Error loading children: ${childrenError.message}`);
    }
  }, [childrenError, showSnackbar]);

  React.useEffect(() => {
    if (metricsError && selectedChild) {
      showSnackbar(`Error loading metrics: ${metricsError.message}`);
    }
  }, [metricsError, selectedChild, showSnackbar]);

  React.useEffect(() => {
    if (comparisonsError && selectedChild) {
      showSnackbar(`Error loading comparisons: ${comparisonsError.message}`);
    }
  }, [comparisonsError, selectedChild, showSnackbar]);

  // Transform children data
  const children: Child[] = React.useMemo(() => {
    if (!childrenData) return [];

    return childrenData.map((student: any, index: number) => ({
      id: student.id,
      name: student.full_name || student.student_name || 'Student',
      grade: student.grade || 'N/A',
      class: student.class || 'N/A',
      avatar: index % 2 === 0 ? '👦' : '👧',
      overallGrade: 0, // Will be calculated from metrics
      attendance: 0, // Will be calculated from behavior trends
      isActive: student.status === 'active',
    }));
  }, [childrenData]);

  // Use real metrics data from hook (already in correct format)
  const metrics: PerformanceMetric[] = metricsData || [];

  // Use real comparisons data from hook (already in correct format)
  const comparisons: ComparisonData[] = comparisonsData || [];

  // Report generation feature not implemented yet - hide reports section
  const reports: DetailedReport[] = [];

  const currentChild = children.find(child => child.id === selectedChild);

  const renderChildSelector = () => (
    <DashboardCard title="Select Child" style={styles.childSelectorCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.childSelectorContainer}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childSelectorItem,
                selectedChild === child.id && styles.childSelectorItemActive,
              ]}
              onPress={() => setSelectedChild(child.id)}
            >
              <Text style={styles.childAvatar}>{child.avatar}</Text>
              <Text style={[
                styles.childSelectorName,
                selectedChild === child.id && styles.childSelectorNameActive,
              ]}>
                {child.name}
              </Text>
              <Text style={[
                styles.childSelectorGrade,
                selectedChild === child.id && styles.childSelectorGradeActive,
              ]}>
                Grade {child.grade}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </DashboardCard>
  );

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {(['week', 'month', 'term', 'year'] as const).map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive,
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text style={[
            styles.timeframeButtonText,
            selectedTimeframe === timeframe && styles.timeframeButtonTextActive,
          ]}>
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      {(['metrics', 'reports', 'comparisons', 'insights'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === tab && styles.tabButtonTextActive,
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return '#10B981';
      case 'declining':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderMetrics = () => (
    <DashboardCard title="📊 Performance Metrics" style={styles.contentCard}>
      <Text style={styles.cardDescription}>
        Detailed performance analysis for {currentChild?.name} over the selected timeframe
      </Text>

      <FlatList
        data={metrics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricName}>{item.metric}</Text>
              <View style={styles.metricTrendContainer}>
                <Text style={styles.metricTrendIcon}>{getTrendIcon(item.trend)}</Text>
                <Text style={[styles.metricTrend, { color: getTrendColor(item.trend) }]}>
                  {item.trend}
                </Text>
              </View>
            </View>
            
            <View style={styles.metricValues}>
              <View style={styles.metricCurrentContainer}>
                <Text style={styles.metricCurrentLabel}>Current</Text>
                <Text style={styles.metricCurrentValue}>
                  {item.currentValue}{item.unit}
                </Text>
              </View>
              
              <View style={styles.metricComparisonContainer}>
                <Text style={styles.metricComparisonLabel}>vs Previous</Text>
                <Text style={[
                  styles.metricComparisonValue,
                  { color: getTrendColor(item.trend) }
                ]}>
                  {item.currentValue > item.previousValue ? '+' : ''}
                  {(item.currentValue - item.previousValue).toFixed(1)}{item.unit}
                </Text>
              </View>
            </View>
            
            <View style={styles.metricBenchmarkContainer}>
              <Text style={styles.metricBenchmarkLabel}>
                Benchmark: {item.benchmark}{item.unit} | 
                Percentile: {item.percentile}th
              </Text>
            </View>
            
            <View style={styles.metricProgressBar}>
              <View
                style={[
                  styles.metricProgressFill,
                  {
                    width: `${Math.min((item.currentValue / item.benchmark) * 100, 100)}%`,
                    backgroundColor: item.currentValue >= item.benchmark ? '#10B981' : '#F59E0B',
                  }
                ]}
              />
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </DashboardCard>
  );

  const renderReports = () => (
    <DashboardCard title="📋 Generated Reports" style={styles.contentCard}>
      <Text style={styles.cardDescription}>
        Download detailed performance reports for {currentChild?.name}
      </Text>
      
      <TouchableOpacity style={styles.generateReportButton}>
        <Text style={styles.generateReportButtonText}>🆕 Generate New Report</Text>
      </TouchableOpacity>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportItem}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <View style={styles.reportTypeContainer}>
                <Text style={styles.reportType}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.reportDateRange}>{item.dateRange}</Text>
            
            <View style={styles.reportSubjects}>
              <Text style={styles.reportSubjectsLabel}>Subjects:</Text>
              <Text style={styles.reportSubjectsText}>
                {item.subjects.join(', ')}
              </Text>
            </View>
            
            <View style={styles.reportDetails}>
              <Text style={styles.reportDetailItem}>📄 {item.format.toUpperCase()}</Text>
              <Text style={styles.reportDetailItem}>💾 {item.size}</Text>
              <Text style={styles.reportDetailItem}>
                📅 {item.generated.toLocaleDateString()}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>⬇️ Download Report</Text>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </DashboardCard>
  );

  const renderComparisons = () => (
    <DashboardCard title="📊 Comparative Analysis" style={styles.contentCard}>
      <Text style={styles.cardDescription}>
        Compare {currentChild?.name}'s performance against class, grade, and national averages
      </Text>

      <FlatList
        data={comparisons}
        keyExtractor={(item) => item.category}
        renderItem={({ item }) => (
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonSubject}>{item.category}</Text>
            
            <View style={styles.comparisonBars}>
              <View style={styles.comparisonBarRow}>
                <Text style={styles.comparisonLabel}>Your Child</Text>
                <View style={styles.comparisonBarContainer}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.comparisonBarChild,
                      { width: `${(item.childScore / item.maxScore) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.comparisonValue}>{item.childScore}%</Text>
              </View>
              
              <View style={styles.comparisonBarRow}>
                <Text style={styles.comparisonLabel}>Class Avg</Text>
                <View style={styles.comparisonBarContainer}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.comparisonBarClass,
                      { width: `${(item.classAverage / item.maxScore) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.comparisonValue}>{item.classAverage}%</Text>
              </View>
              
              <View style={styles.comparisonBarRow}>
                <Text style={styles.comparisonLabel}>Grade Avg</Text>
                <View style={styles.comparisonBarContainer}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.comparisonBarGrade,
                      { width: `${(item.gradeAverage / item.maxScore) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.comparisonValue}>{item.gradeAverage}%</Text>
              </View>
              
              <View style={styles.comparisonBarRow}>
                <Text style={styles.comparisonLabel}>National Avg</Text>
                <View style={styles.comparisonBarContainer}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.comparisonBarNational,
                      { width: `${(item.nationalAverage / item.maxScore) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.comparisonValue}>{item.nationalAverage}%</Text>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </DashboardCard>
  );

  const renderInsights = () => {
    // Get icon based on insight category/severity
    const getInsightIcon = (category: string, severity: string) => {
      if (severity === 'positive') return '🎯';
      if (severity === 'critical' || severity === 'high') return '⚠️';
      if (category === 'academic_performance') return '📊';
      if (category === 'behavioral_analysis') return '👥';
      if (category === 'subject_strength') return '🌟';
      if (category === 'subject_weakness') return '📚';
      if (category === 'engagement_level') return '🔥';
      if (category === 'time_management') return '⏰';
      return '💡';
    };

    return (
      <DashboardCard title="🧠 AI-Powered Insights" style={styles.contentCard}>
        <Text style={styles.cardDescription}>
          Intelligent analysis and recommendations for {currentChild?.name}
        </Text>

        <View style={styles.insightContainer}>
          {/* AI Insights */}
          {insightsData && insightsData.length > 0 ? (
            insightsData.map((insight: any) => (
              <View key={insight.id} style={styles.insightItem}>
                <Text style={styles.insightIcon}>
                  {getInsightIcon(insight.insight_category, insight.severity)}
                </Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>
                    {insight.summary}
                    {insight.detailed_analysis && `\n\n${insight.detailed_analysis}`}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>💡</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>No Insights Available</Text>
                <Text style={styles.insightDescription}>
                  AI insights will appear here as more data becomes available.
                </Text>
              </View>
            </View>
          )}

          {/* Academic Predictions */}
          {predictionsData && predictionsData.length > 0 && (
            <>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🔮</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Predictive Analysis</Text>
                  {predictionsData.map((pred: any, index: number) => (
                    <Text key={pred.id} style={styles.insightDescription}>
                      {index > 0 && '\n'}
                      • {pred.summary}
                      {pred.improvement_recommendations && pred.improvement_recommendations.length > 0 && (
                        `\n  Recommendations: ${pred.improvement_recommendations.slice(0, 2).join(', ')}`
                      )}
                    </Text>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Behavior Trends Summary */}
          {behaviorTrendsData && behaviorTrendsData.length > 0 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📈</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Behavior & Progress Trends</Text>
                {behaviorTrendsData.map((trend: any) => (
                  <Text key={trend.id} style={styles.insightDescription}>
                    • {trend.title}: {trend.summary}
                    {'\n'}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </DashboardCard>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'metrics':
        return renderMetrics();
      case 'reports':
        return renderReports();
      case 'comparisons':
        return renderComparisons();
      case 'insights':
        return renderInsights();
      default:
        return renderMetrics();
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => onNavigate('back')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Performance Analytics</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={LightTheme.Primary} />
            <Text style={styles.loadingText}>Loading performance analytics...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[LightTheme.Primary]}
              />
            }
          >
            {renderChildSelector()}
            {renderTimeframeSelector()}
            {renderTabSelector()}
            {renderContent()}

            <TouchableOpacity
              style={styles.exportAllButton}
              onPress={() => showSnackbar('Export feature coming soon!')}
            >
              <Text style={styles.exportAllButtonText}>📊 Export All Analytics Data</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

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
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.LG,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.XXL,
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  content: {
    flex: 1,
    padding: Spacing.LG,
  },
  childSelectorCard: {
    marginBottom: Spacing.LG,
  },
  childSelectorContainer: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  childSelectorItem: {
    alignItems: 'center',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
  },
  childSelectorItemActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  childAvatar: {
    fontSize: 32,
    marginBottom: Spacing.XS,
  },
  childSelectorName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  childSelectorNameActive: {
    color: '#7C3AED',
  },
  childSelectorGrade: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  childSelectorGradeActive: {
    color: '#7C3AED',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.XS,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#7C3AED',
  },
  timeframeButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.XS,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.XS,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentCard: {
    marginBottom: Spacing.LG,
  },
  cardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
    lineHeight: 20,
    textAlign: 'center',
  },
  metricItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  metricName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  metricTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTrendIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  metricTrend: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metricCurrentContainer: {
    alignItems: 'flex-start',
  },
  metricCurrentLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  metricCurrentValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
  },
  metricComparisonContainer: {
    alignItems: 'flex-end',
  },
  metricComparisonLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  metricComparisonValue: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  metricBenchmarkContainer: {
    marginBottom: Spacing.SM,
  },
  metricBenchmarkLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  metricProgressBar: {
    height: 6,
    backgroundColor: LightTheme.Outline,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  generateReportButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  generateReportButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  reportTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
    marginRight: Spacing.SM,
  },
  reportTypeContainer: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  reportType: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportDateRange: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  reportSubjects: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  reportSubjectsLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  reportSubjectsText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  reportDetailItem: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  downloadButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  comparisonItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  comparisonSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  comparisonBars: {
    gap: Spacing.SM,
  },
  comparisonBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    width: 80,
    textAlign: 'right',
    marginRight: Spacing.SM,
  },
  comparisonBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.Outline,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: Spacing.SM,
  },
  comparisonBar: {
    height: '100%',
    borderRadius: 4,
  },
  comparisonBarChild: {
    backgroundColor: '#7C3AED',
  },
  comparisonBarClass: {
    backgroundColor: '#10B981',
  },
  comparisonBarGrade: {
    backgroundColor: '#F59E0B',
  },
  comparisonBarNational: {
    backgroundColor: '#6B7280',
  },
  comparisonValue: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    width: 40,
    textAlign: 'right',
  },
  insightContainer: {
    gap: Spacing.LG,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    marginTop: Spacing.XS,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  insightDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
  },
  exportAllButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
    marginBottom: Spacing.XL,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  exportAllButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default PerformanceAnalyticsScreen;