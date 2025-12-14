import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  StyleSheet
} from 'react-native';
import { Text, Card, Button, Surface, ProgressBar, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { phase80IntegrationService } from '../../services/integration/Phase80IntegrationService';
import { advancedAIDecisionEngine } from '../../services/intelligence/AdvancedAIDecisionEngine';
import { intelligentWorkflowAutomationService } from '../../services/automation/IntelligentWorkflowAutomationService';
import { proactiveSystemOptimizerService } from '../../services/intelligence/ProactiveSystemOptimizerService';

interface Phase80Status {
  isActive: boolean;
  lastUpdate: string;
  services: {
    aiDecisionEngine: {
      active: boolean;
      totalDecisions: number;
      accuracy: number;
    };
    workflowAutomation: {
      active: boolean;
      activeWorkflows: number;
      completionRate: number;
    };
    proactiveOptimizer: {
      active: boolean;
      optimizationsPerformed: number;
      systemHealth: number;
    };
  };
  integration: {
    crossServiceCommunication: boolean;
    dataSync: boolean;
    performanceMetrics: {
      responseTime: number;
      memoryUsage: number;
      errorRate: number;
    };
  };
}

interface Phase80Insight {
  id: string;
  type: 'decision' | 'workflow' | 'optimization' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  metrics: Record<string, any>;
  timestamp: string;
  source: string;
  actionRequired: boolean;
}

interface Phase80Analytics {
  totalInsights: number;
  intelligentDecisions: number;
  automatedWorkflows: number;
  proactiveOptimizations: number;
  systemImprovements: {
    performanceGains: number;
    errorReductions: number;
    automationSavings: number;
  };
  userExperience: {
    satisfactionScore: number;
    engagementIncrease: number;
    learningOutcomeImprovement: number;
  };
}

const { width } = Dimensions.get('window');

const Phase80ValidationScreen: React.FC = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Phase80Status | null>(null);
  const [insights, setInsights] = useState<Phase80Insight[]>([]);
  const [analytics, setAnalytics] = useState<Phase80Analytics | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'analytics' | 'testing'>('overview');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statusData, insightsData, analyticsData] = await Promise.all([
        phase80IntegrationService.getStatus(),
        phase80IntegrationService.getPhase80Insights(),
        phase80IntegrationService.getPhase80Analytics()
      ]);

      setStatus(statusData);
      setInsights(insightsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading Phase 80 data:', error);
      Alert.alert('error', 'Failed to load Phase 80 data');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const initializePhase80 = useCallback(async () => {
    try {
      setLoading(true);
      await phase80IntegrationService.initialize();
      await loadData();
      Alert.alert('success', 'Phase 80 initialized successfully');
    } catch (error) {
      console.error('Error initializing Phase 80:', error);
      Alert.alert('error', 'Failed to initialize Phase 80');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const runPhase80Tests = useCallback(async () => {
    try {
      setLoading(true);
      
      const testResults = {
        services: [],
        integration: {
          crossServiceCommunication: false,
          dataSync: false,
          performanceTest: false
        },
        errors: []
      };

      // Test AI Decision Engine
      try {
        const aiStatus = await advancedAIDecisionEngine.getStatus();
        testResults.services.push({
          name: 'Advanced AI Decision Engine',
          status: aiStatus.isActive ? 'active' : 'inactive',
          health: aiStatus.isActive ? 'healthy' : 'error'
        });
      } catch (error: any) {
        testResults.services.push({
          name: 'Advanced AI Decision Engine',
          status: 'error',
          health: 'error'
        });
        testResults.errors.push(`AI Engine: ${error.message}`);
      }

      // Test Workflow Automation Service
      try {
        const workflowStatus = await intelligentWorkflowAutomationService.getStatus();
        testResults.services.push({
          name: 'Intelligent Workflow Automation',
          status: workflowStatus.isActive ? 'active' : 'inactive',
          health: workflowStatus.isActive ? 'healthy' : 'error'
        });
      } catch (error: any) {
        testResults.services.push({
          name: 'Intelligent Workflow Automation',
          status: 'error',
          health: 'error'
        });
        testResults.errors.push(`Workflow: ${error.message}`);
      }

      // Test Proactive System Optimizer
      try {
        const optimizerStatus = await proactiveSystemOptimizerService.getStatus();
        testResults.services.push({
          name: 'Proactive System Optimizer',
          status: optimizerStatus.isActive ? 'active' : 'inactive',
          health: optimizerStatus.isActive ? 'healthy' : 'error'
        });
      } catch (error: any) {
        testResults.services.push({
          name: 'Proactive System Optimizer',
          status: 'error',
          health: 'error'
        });
        testResults.errors.push(`Optimizer: ${error.message}`);
      }

      // Test Integration Service
      try {
        const integrationStatus = await phase80IntegrationService.getStatus();
        testResults.integration.crossServiceCommunication = !!integrationStatus?.integration.crossServiceCommunication;
        testResults.integration.dataSync = !!integrationStatus?.integration.dataSync;
        testResults.integration.performanceTest = testResults.services.every(s => s.health === 'healthy');
      } catch (error: any) {
        testResults.errors.push(`Integration: ${error.message}`);
      }

      setTestResults(testResults);
      Alert.alert(
        'Tests Complete',
        `Services: ${testResults.services.filter(s => s.health === 'healthy').length}/${testResults.services.length} healthy\nErrors: ${testResults.errors.length}`
      );
    } catch (error) {
      console.error('Error running tests:', error);
      Alert.alert('error', 'Failed to run Phase 80 tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const executeIntegratedIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      const result = await phase80IntegrationService.executeIntegratedIntelligence({
        userId: 'demo_user',
        context: 'validation_test',
        timestamp: new Date().toISOString()
      });

      Alert.alert(
        'Intelligence Executed',
        `Decisions: ${result.decisions.length}\nWorkflows: ${result.workflows.length}\nOptimizations: ${result.optimizations.length}`
      );
      
      await loadData(); // Refresh data to show updated insights
    } catch (error) {
      console.error('Error executing intelligence:', error);
      Alert.alert('error', 'Failed to execute integrated intelligence');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return theme.error;
      case 'high': return theme.warning;
      case 'medium': return theme.primary;
      case 'low': return theme.Surface;
      default: return theme.Outline;
    }
  };

  const getServiceStatusColor = (active: boolean) => {
    return active ? theme.success : theme.error;
  };

  const renderOverview = () => (
    <View style={styles.section}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.primary }]}>
        Phase 80: Advanced Intelligence & Automation Suite
      </Text>

      {/* Status Card */}
      <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Icon 
              name={status?.isActive ? "check-circle" : "alert-circle"} 
              size={24} 
              color={status?.isActive ? theme.success : theme.error} 
            />
            <Text variant="titleMedium" style={{ marginLeft: 8 }}>
              System Status: {status?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <View style={styles.servicesGrid}>
            <View style={styles.serviceItem}>
              <Text variant="labelMedium" style={{ color: theme.Outline }}>AI Decision Engine</Text>
              <View style={styles.serviceStatus}>
                <Icon 
                  name="brain" 
                  size={16} 
                  color={getServiceStatusColor(status?.services.aiDecisionEngine.active || false)} 
                />
                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                  {status?.services.aiDecisionEngine.totalDecisions || 0} decisions
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.Outline }}>
                {Math.round((status?.services.aiDecisionEngine.accuracy || 0) * 100)}% accuracy
              </Text>
            </View>

            <View style={styles.serviceItem}>
              <Text variant="labelMedium" style={{ color: theme.Outline }}>Workflow Automation</Text>
              <View style={styles.serviceStatus}>
                <Icon 
                  name="cog-clockwise" 
                  size={16} 
                  color={getServiceStatusColor(status?.services.workflowAutomation.active || false)} 
                />
                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                  {status?.services.workflowAutomation.activeWorkflows || 0} active
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.Outline }}>
                {Math.round((status?.services.workflowAutomation.completionRate || 0) * 100)}% completion
              </Text>
            </View>

            <View style={styles.serviceItem}>
              <Text variant="labelMedium" style={{ color: theme.Outline }}>Proactive Optimizer</Text>
              <View style={styles.serviceStatus}>
                <Icon 
                  name="speedometer" 
                  size={16} 
                  color={getServiceStatusColor(status?.services.proactiveOptimizer.active || false)} 
                />
                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                  {status?.services.proactiveOptimizer.optimizationsPerformed || 0} optimizations
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.Outline }}>
                {Math.round((status?.services.proactiveOptimizer.systemHealth || 0) * 100)}% health
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Performance Metrics */}
          <Text variant="titleSmall" style={{ marginBottom: 8 }}>Performance Metrics</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={{ color: theme.Outline }}>Response Time</Text>
              <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                {Math.round(status?.integration.performanceMetrics.responseTime || 0)}ms
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={{ color: theme.Outline }}>Memory Usage</Text>
              <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                {Math.round(status?.integration.performanceMetrics.memoryUsage || 0)}MB
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={{ color: theme.Outline }}>Error Rate</Text>
              <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                {((status?.integration.performanceMetrics.errorRate || 0) * 100).toFixed(2)}%
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={initializePhase80}
              disabled={loading}
              style={styles.actionButton}
            >
              Initialize
            </Button>
            <Button
              mode="outlined"
              onPress={executeIntegratedIntelligence}
              disabled={loading}
              style={styles.actionButton}
            >
              Execute Intelligence
            </Button>
            <Button
              mode="outlined"
              onPress={runPhase80Tests}
              disabled={loading}
              style={styles.actionButton}
            >
              Run Tests
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderInsights = () => (
    <View style={styles.section}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.primary }]}>
        Intelligence Insights ({insights.length})
      </Text>

      {insights.length === 0 ? (
        <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
          <Card.Content style={{ alignItems: 'center', padding: 32 }}>
            <Icon name="lightbulb-outline" size={48} color={theme.Outline} />
            <Text variant="bodyLarge" style={{ marginTop: 16, color: theme.Outline }}>
              No insights available
            </Text>
            <Text variant="bodySmall" style={{ color: theme.Outline, textAlign: 'center', marginTop: 8 }}>
              Execute integrated intelligence to generate insights
            </Text>
          </Card.Content>
        </Card>
      ) : (
        insights.map((insight) => (
          <Card key={insight.id} style={[styles.card, { backgroundColor: theme.Surface }]}>
            <Card.Content>
              <View style={styles.insightHeader}>
                <Chip 
                  style={{ backgroundColor: getPriorityColor(insight.priority) }}
                  textStyle={{ color: theme.OnSurface }}
                >
                  {insight.priority.toUpperCase()}
                </Chip>
                <Chip style={{ backgroundColor: theme.primaryContainer }}>
                  {insight.type}
                </Chip>
              </View>

              <Text variant="titleMedium" style={{ marginVertical: 8 }}>
                {insight.title}
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.Outline, marginBottom: 12 }}>
                {insight.description}
              </Text>

              <View style={styles.insightMeta}>
                <Text variant="labelSmall" style={{ color: theme.Outline }}>
                  Source: {insight.source}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.Outline }}>
                  {new Date(insight.timestamp).toLocaleString()}
                </Text>
              </View>

              {insight.recommendations.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text variant="labelMedium" style={{ marginBottom: 4 }}>Recommendations:</Text>
                  {insight.recommendations.map((rec, index) => (
                    <Text key={index} variant="bodySmall" style={{ color: theme.Outline, marginLeft: 8 }}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.section}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.primary }]}>
        Phase 80 Analytics
      </Text>

      {analytics && (
        <>
          {/* Key Metrics */}
          <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>Key Metrics</Text>
              
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticItem}>
                  <Icon name="brain" size={24} color={theme.primary} />
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
                    {analytics.intelligentDecisions}
                  </Text>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>
                    AI Decisions
                  </Text>
                </View>

                <View style={styles.analyticItem}>
                  <Icon name="cog-clockwise" size={24} color={theme.primary} />
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
                    {analytics.automatedWorkflows}
                  </Text>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>
                    Workflows
                  </Text>
                </View>

                <View style={styles.analyticItem}>
                  <Icon name="speedometer" size={24} color={theme.primary} />
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
                    {analytics.proactiveOptimizations}
                  </Text>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>
                    Optimizations
                  </Text>
                </View>

                <View style={styles.analyticItem}>
                  <Icon name="lightbulb" size={24} color={theme.primary} />
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>
                    {analytics.totalInsights}
                  </Text>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>
                    Insights
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* System Improvements */}
          <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>System Improvements</Text>
              
              <View style={styles.improvementItem}>
                <Text variant="labelMedium">Performance Gains</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={analytics.systemImprovements.performanceGains / 100} 
                    color={theme.success}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall">{analytics.systemImprovements.performanceGains.toFixed(1)}%</Text>
                </View>
              </View>

              <View style={styles.improvementItem}>
                <Text variant="labelMedium">Error Reductions</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={analytics.systemImprovements.errorReductions / 100} 
                    color={theme.primary}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall">{analytics.systemImprovements.errorReductions.toFixed(1)}%</Text>
                </View>
              </View>

              <View style={styles.improvementItem}>
                <Text variant="labelMedium">Automation Savings</Text>
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={Math.min(analytics.systemImprovements.automationSavings / 1000, 1)} 
                    color={theme.Tertiary}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall">{analytics.systemImprovements.automationSavings.toFixed(0)} hrs</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* User Experience */}
          <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>User Experience Impact</Text>
              
              <View style={styles.uxMetrics}>
                <View style={styles.uxItem}>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>Satisfaction</Text>
                  <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                    {analytics.userExperience.satisfactionScore}%
                  </Text>
                </View>

                <View style={styles.uxItem}>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>Engagement</Text>
                  <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                    +{analytics.userExperience.engagementIncrease.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.uxItem}>
                  <Text variant="labelMedium" style={{ color: theme.Outline }}>Learning Outcomes</Text>
                  <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                    +{analytics.userExperience.learningOutcomeImprovement.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </View>
  );

  const renderTesting = () => (
    <View style={styles.section}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.primary }]}>
        Phase 80 System Testing
      </Text>

      <Card style={[styles.card, { backgroundColor: theme.Surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Test Suite</Text>
          <Button
            mode="contained"
            onPress={runPhase80Tests}
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            Run Complete Test Suite
          </Button>

          {testResults && (
            <View>
              <Text variant="titleSmall" style={{ marginBottom: 8 }}>Service Tests</Text>
              {testResults.services.map((service: any, index: number) => (
                <View key={index} style={styles.testResultItem}>
                  <Icon 
                    name={service.health === 'healthy' ? 'check-circle' : 'alert-circle'} 
                    size={20} 
                    color={service.health === 'healthy' ? theme.success : theme.error}
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text variant="bodyMedium">{service.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.Outline }}>
                      Status: {service.status} | Health: {service.health}
                    </Text>
                  </View>
                </View>
              ))}

              <Divider style={{ marginVertical: 16 }} />

              <Text variant="titleSmall" style={{ marginBottom: 8 }}>Integration Tests</Text>
              <View style={styles.testResultItem}>
                <Icon 
                  name={testResults.integration.crossServiceCommunication ? 'check-circle' : 'alert-circle'} 
                  size={20} 
                  color={testResults.integration.crossServiceCommunication ? theme.success : theme.error}
                />
                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>Cross-Service Communication</Text>
              </View>

              <View style={styles.testResultItem}>
                <Icon 
                  name={testResults.integration.dataSync ? 'check-circle' : 'alert-circle'} 
                  size={20} 
                  color={testResults.integration.dataSync ? theme.success : theme.error}
                />
                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>Data Synchronization</Text>
              </View>

              <View style={styles.testResultItem}>
                <Icon 
                  name={testResults.integration.performanceTest ? 'check-circle' : 'alert-circle'} 
                  size={20} 
                  color={testResults.integration.performanceTest ? theme.success : theme.error}
                />
                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>Performance Test</Text>
              </View>

              {testResults.errors.length > 0 && (
                <>
                  <Divider style={{ marginVertical: 16 }} />
                  <Text variant="titleSmall" style={{ marginBottom: 8, color: theme.error }}>
                    Errors ({testResults.errors.length})
                  </Text>
                  {testResults.errors.map((error: string, index: number) => (
                    <Text key={index} variant="bodySmall" style={{ color: theme.error, marginBottom: 4 }}>
                      • {error}
                    </Text>
                  ))}
                </>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'insights': return renderInsights();
      case 'analytics': return renderAnalytics();
      case 'testing': return renderTesting();
      default: return renderOverview();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab Navigation */}
      <Surface style={[styles.tabContainer, { backgroundColor: theme.Surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'view-dashboard' },
            { key: 'insights', label: 'Insights', icon: 'lightbulb' },
            { key: 'analytics', label: 'Analytics', icon: 'chart-line' },
            { key: 'testing', label: 'Testing', icon: 'test-tube' }
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'text'}
              onPress={() => setActiveTab(tab.key as any)}
              style={styles.tab}
              contentStyle={styles.tabContent}
            >
              <Icon name={tab.icon} size={16} />
              <Text style={{ marginLeft: 4 }}>{tab.label}</Text>
            </Button>
          ))}
        </ScrollView>
      </Surface>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    marginHorizontal: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '48%',
    marginBottom: 12,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minWidth: width * 0.25,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  improvementItem: {
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
    height: 8,
  },
  uxMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uxItem: {
    alignItems: 'center',
    flex: 1,
  },
  testResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default Phase80ValidationScreen;