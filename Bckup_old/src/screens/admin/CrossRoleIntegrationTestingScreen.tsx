/**
 * CrossRoleIntegrationTestingScreen - Phase 56: Cross-Role Integration Testing
 * Complete system integration and cross-role workflow testing
 * End-to-end testing across all roles with performance optimization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface IntegrationTest {
  id: string;
  name: string;
  description: string;
  roles: ('student' | 'teacher' | 'parent' | 'admin')[];
  category: 'workflow' | 'data_sync' | 'real_time' | 'communication' | 'performance';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  lastRun?: Date;
  errorDetails?: string;
  performanceMetrics?: IntegrationMetrics;
}

interface IntegrationMetrics {
  responseTime: number;
  dataConsistency: number;
  userSatisfaction: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
}

interface WorkflowStep {
  id: string;
  stepName: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  action: string;
  expectedOutcome: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executionTime?: number;
}

interface IntegrationSuite {
  id: string;
  name: string;
  description: string;
  tests: IntegrationTest[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  progress: number;
  estimatedTime: number;
  isRunning: boolean;
}

interface CrossRoleIntegrationTestingScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const CrossRoleIntegrationTestingScreen: React.FC<CrossRoleIntegrationTestingScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'tests' | 'performance'>('overview');
  const [integrationSuites, setIntegrationSuites] = useState<IntegrationSuite[]>(generateIntegrationSuites());
  const [integrationTests, setIntegrationTests] = useState<IntegrationTest[]>(generateIntegrationTests());
  const [workflows, setWorkflows] = useState<WorkflowStep[]>(generateWorkflowSteps());
  const [refreshing, setRefreshing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<IntegrationTest | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setIntegrationTests(prev => prev.map(test => ({
          ...test,
          lastRun: new Date(),
          performanceMetrics: generatePerformanceMetrics(),
        })));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIntegrationSuites(generateIntegrationSuites());
      setIntegrationTests(generateIntegrationTests());
      setRefreshing(false);
    }, 2000);
  };

  const handleRunTest = (test: IntegrationTest) => {
    setTestRunning(true);
    setSelectedTest(test);
    
    Alert.alert(
      'Run Integration Test',
      `Start "${test.name}" integration test? This will test cross-role workflows and may take several minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run Test', 
          onPress: () => {
            // Simulate test execution
            setTimeout(() => {
              setTestRunning(false);
              Alert.alert('Test Complete', 'Integration test completed successfully with performance metrics updated.');
            }, 5000);
          }
        }
      ]
    );
  };

  const handleRunAllTests = () => {
    Alert.alert(
      'Run All Integration Tests',
      'Run complete integration test suite? This will test all cross-role workflows and may take 30-60 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run All Tests', 
          onPress: () => {
            setTestRunning(true);
            // Simulate full test suite execution
            setTimeout(() => {
              setTestRunning(false);
              Alert.alert('All Tests Complete', 'Complete integration test suite finished. View detailed results in the reports section.');
            }, 10000);
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Integration Testing Overview
      </Text>
      
      {integrationSuites.map(suite => (
        <View key={suite.id} style={[styles.suiteCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.suiteHeader}>
            <Text style={[styles.suiteName, { color: theme.OnSurface }]}>
              {suite.name}
            </Text>
            <View style={[
              styles.suiteStatus,
              { backgroundColor: suite.isRunning ? '#FF9800' : '#4CAF50' }
            ]}>
              <Text style={styles.suiteStatusText}>
                {suite.isRunning ? 'Running' : 'Ready'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.suiteDescription, { color: theme.OnSurfaceVariant }]}>
            {suite.description}
          </Text>
          
          <View style={styles.suiteMetrics}>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
                {suite.totalTests}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Total Tests
              </Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                {suite.passedTests}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Passed
              </Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: '#F44336' }]}>
                {suite.failedTests}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Failed
              </Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
                {Math.round(suite.progress)}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Progress
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.runButton, { backgroundColor: theme.primary }]}
            onPress={() => handleRunTest(integrationTests[0])}
          >
            <Text style={[styles.runButtonText, { color: theme.OnPrimary }]}>
              Run Suite
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderTests = () => (
    <View>
      <View style={styles.testHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Integration Tests
        </Text>
        <TouchableOpacity
          style={[styles.runAllButton, { backgroundColor: theme.primary }]}
          onPress={handleRunAllTests}
          disabled={testRunning}
        >
          <Text style={[styles.runAllButtonText, { color: theme.OnPrimary }]}>
            {testRunning ? 'Running...' : 'Run All'}
          </Text>
        </TouchableOpacity>
      </View>

      {integrationTests.map(test => (
        <TouchableOpacity
          key={test.id}
          style={[styles.testCard, { backgroundColor: theme.Surface }]}
          onPress={() => {
            setSelectedTest(test);
            setShowTestModal(true);
          }}
        >
          <View style={styles.testCardHeader}>
            <View style={styles.testInfo}>
              <Text style={[styles.testName, { color: theme.OnSurface }]}>
                {test.name}
              </Text>
              <Text style={[styles.testDescription, { color: theme.OnSurfaceVariant }]}>
                {test.description}
              </Text>
            </View>
            
            <View style={[
              styles.testStatus,
              {
                backgroundColor: 
                  test.status === 'passed' ? '#4CAF50' :
                  test.status === 'failed' ? '#F44336' :
                  test.status === 'warning' ? '#FF9800' :
                  test.status === 'running' ? '#2196F3' : '#9E9E9E'
              }
            ]}>
              <Text style={styles.testStatusText}>
                {test.status === 'passed' ? '✓' :
                 test.status === 'failed' ? '✗' :
                 test.status === 'warning' ? '⚠' :
                 test.status === 'running' ? '⟳' : '○'}
              </Text>
            </View>
          </View>
          
          <View style={styles.testRoles}>
            {test.roles.map(role => (
              <View key={role} style={[styles.roleTag, { backgroundColor: theme.primaryContainer }]}>
                <Text style={[styles.roleText, { color: theme.OnPrimaryContainer }]}>
                  {role}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.testMetrics}>
            <Text style={[styles.testMetric, { color: theme.OnSurfaceVariant }]}>
              Category: {test.category}
            </Text>
            <Text style={[styles.testMetric, { color: theme.OnSurfaceVariant }]}>
              Priority: {test.priority}
            </Text>
            {test.duration && (
              <Text style={[styles.testMetric, { color: theme.OnSurfaceVariant }]}>
                Duration: {test.duration}ms
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPerformance = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Performance Metrics
      </Text>
      
      {integrationTests
        .filter(test => test.performanceMetrics)
        .map(test => (
          <View key={test.id} style={[styles.performanceCard, { backgroundColor: theme.Surface }]}>
            <Text style={[styles.performanceName, { color: theme.OnSurface }]}>
              {test.name}
            </Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {test.performanceMetrics?.responseTime}ms
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Response Time
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {test.performanceMetrics?.dataConsistency}%
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Data Consistency
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {test.performanceMetrics?.errorRate}%
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Error Rate
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {test.performanceMetrics?.throughput}
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Throughput/sec
                </Text>
              </View>
            </View>
          </View>
        ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />
      
      <View style={[styles.header, { backgroundColor: theme.Surface }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onNavigate('back')}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
            Cross-Role Integration Testing
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            Complete system integration and workflow testing
          </Text>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.autoRefreshContainer}>
            <Text style={[styles.autoRefreshLabel, { color: theme.OnSurfaceVariant }]}>
              Auto
            </Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: theme.Outline, true: theme.primary }}
            />
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'tests', 'performance'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && { backgroundColor: theme.primaryContainer }
            ]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              { 
                color: selectedTab === tab 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant 
              }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'tests' && renderTests()}
        {selectedTab === 'performance' && renderPerformance()}
      </ScrollView>

      {/* Test Detail Modal */}
      <Modal
        visible={showTestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.Surface }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              {selectedTest?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowTestModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedTest && (
              <View>
                <Text style={[styles.modalDescription, { color: theme.OnBackground }]}>
                  {selectedTest.description}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Test Details
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Category: {selectedTest.category}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Priority: {selectedTest.priority}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Status: {selectedTest.status}
                  </Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Involved Roles
                  </Text>
                  <View style={styles.modalRoles}>
                    {selectedTest.roles.map(role => (
                      <View key={role} style={[styles.modalRoleTag, { backgroundColor: theme.primaryContainer }]}>
                        <Text style={[styles.modalRoleText, { color: theme.OnPrimaryContainer }]}>
                          {role}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {selectedTest.performanceMetrics && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                      Performance Metrics
                    </Text>
                    <View style={styles.modalMetrics}>
                      <Text style={[styles.modalMetric, { color: theme.OnSurfaceVariant }]}>
                        Response Time: {selectedTest.performanceMetrics.responseTime}ms
                      </Text>
                      <Text style={[styles.modalMetric, { color: theme.OnSurfaceVariant }]}>
                        Data Consistency: {selectedTest.performanceMetrics.dataConsistency}%
                      </Text>
                      <Text style={[styles.modalMetric, { color: theme.OnSurfaceVariant }]}>
                        Error Rate: {selectedTest.performanceMetrics.errorRate}%
                      </Text>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[styles.modalRunButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowTestModal(false);
                    handleRunTest(selectedTest);
                  }}
                >
                  <Text style={[styles.modalRunButtonText, { color: theme.OnPrimary }]}>
                    Run This Test
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Helper functions to generate mock data
function generateIntegrationSuites(): IntegrationSuite[] {
  return [
    {
      id: '1',
      name: 'Student-Teacher Workflow Integration',
      description: 'Complete workflow testing between student and teacher interactions',
      tests: [],
      totalTests: 25,
      passedTests: 22,
      failedTests: 1,
      progress: 88,
      estimatedTime: 15,
      isRunning: false,
    },
    {
      id: '2',
      name: 'Parent-Student Communication Flow',
      description: 'Testing parent access to student progress and communication workflows',
      tests: [],
      totalTests: 18,
      passedTests: 16,
      failedTests: 0,
      progress: 89,
      estimatedTime: 12,
      isRunning: false,
    },
    {
      id: '3',
      name: 'Admin System Management',
      description: 'Administrative oversight and system management integration testing',
      tests: [],
      totalTests: 32,
      passedTests: 28,
      failedTests: 2,
      progress: 87.5,
      estimatedTime: 20,
      isRunning: false,
    },
  ];
}

function generateIntegrationTests(): IntegrationTest[] {
  return [
    {
      id: '1',
      name: 'Assignment Submission Flow',
      description: 'Test complete assignment submission from student to teacher grading',
      roles: ['student', 'teacher'],
      category: 'workflow',
      status: 'passed',
      priority: 'high',
      duration: 2340,
      lastRun: new Date(),
      performanceMetrics: generatePerformanceMetrics(),
    },
    {
      id: '2',
      name: 'Real-time Communication',
      description: 'Test real-time messaging between all roles',
      roles: ['student', 'teacher', 'parent', 'admin'],
      category: 'real_time',
      status: 'passed',
      priority: 'critical',
      duration: 1890,
      lastRun: new Date(),
      performanceMetrics: generatePerformanceMetrics(),
    },
    {
      id: '3',
      name: 'Parent Progress Access',
      description: 'Test parent access to student progress and performance data',
      roles: ['parent', 'student'],
      category: 'data_sync',
      status: 'warning',
      priority: 'medium',
      duration: 3200,
      lastRun: new Date(),
      performanceMetrics: generatePerformanceMetrics(),
    },
    {
      id: '4',
      name: 'Admin User Management',
      description: 'Test admin capabilities for user management across all roles',
      roles: ['admin', 'teacher', 'student', 'parent'],
      category: 'workflow',
      status: 'passed',
      priority: 'high',
      duration: 4100,
      lastRun: new Date(),
      performanceMetrics: generatePerformanceMetrics(),
    },
    {
      id: '5',
      name: 'Cross-Platform Data Sync',
      description: 'Test data synchronization across mobile and web platforms',
      roles: ['student', 'teacher', 'parent'],
      category: 'data_sync',
      status: 'running',
      priority: 'critical',
      performanceMetrics: generatePerformanceMetrics(),
    },
  ];
}

function generateWorkflowSteps(): WorkflowStep[] {
  return [
    {
      id: '1',
      stepName: 'Student Assignment Submission',
      role: 'student',
      action: 'Submit assignment with file attachments',
      expectedOutcome: 'Assignment successfully submitted and notifies teacher',
      status: 'completed',
      executionTime: 1200,
    },
    {
      id: '2',
      stepName: 'Teacher Assignment Review',
      role: 'teacher',
      action: 'Review submitted assignment and provide feedback',
      expectedOutcome: 'Assignment graded and feedback provided to student',
      status: 'completed',
      executionTime: 2800,
    },
    {
      id: '3',
      stepName: 'Parent Progress Notification',
      role: 'parent',
      action: 'Receive notification of student assignment completion',
      expectedOutcome: 'Parent notified and can view assignment details',
      status: 'executing',
    },
  ];
}

function generatePerformanceMetrics(): IntegrationMetrics {
  return {
    responseTime: Math.floor(Math.random() * 2000) + 500,
    dataConsistency: Math.floor(Math.random() * 10) + 90,
    userSatisfaction: Math.floor(Math.random() * 20) + 80,
    errorRate: Math.random() * 2,
    throughput: Math.floor(Math.random() * 100) + 50,
    memoryUsage: Math.floor(Math.random() * 30) + 40,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: Spacing.MD,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    lineHeight: Typography.headlineSmall.lineHeight,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
  },
  autoRefreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  autoRefreshLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    gap: Spacing.XS,
  },
  tab: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 20,
  },
  tabText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    marginVertical: Spacing.MD,
  },
  suiteCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  suiteName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    flex: 1,
  },
  suiteStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suiteStatusText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  suiteDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  suiteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  runButton: {
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  runAllButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  runAllButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  testCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  testInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  testName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 4,
  },
  testDescription: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  testStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testStatusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testRoles: {
    flexDirection: 'row',
    gap: Spacing.XS,
    marginBottom: Spacing.SM,
  },
  roleTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  testMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testMetric: {
    fontSize: Typography.bodySmall.fontSize,
  },
  performanceCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceMetric: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  performanceValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  performanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    flex: 1,
  },
  modalCloseButton: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
    paddingTop: Spacing.MD,
  },
  modalDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    marginBottom: Spacing.LG,
  },
  modalSection: {
    marginBottom: Spacing.LG,
  },
  modalSectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  modalDetail: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
  },
  modalRoles: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  modalRoleTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalRoleText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  modalMetrics: {
    gap: 4,
  },
  modalMetric: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  modalRunButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  modalRunButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
});

export default CrossRoleIntegrationTestingScreen;