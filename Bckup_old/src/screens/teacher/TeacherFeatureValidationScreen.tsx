/**
 * TeacherFeatureValidationScreen - Phase 48: Complete Teacher Feature Testing
 * Comprehensive validation and testing interface for all teacher features
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
  Switch,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface FeatureTest {
  id: string;
  category: 'assessment' | 'analytics' | 'workflow' | 'communication' | 'management';
  name: string;
  description: string;
  status: 'not_tested' | 'testing' | 'passed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  testSteps: TestStep[];
  dependencies: string[];
  lastTested: string;
  testResults: TestResult[];
  automatedTest: boolean;
  estimatedTime: number; // minutes
}

interface TestStep {
  id: string;
  step: number;
  description: string;
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'passed' | 'failed';
  screenshot?: string;
  notes?: string;
}

interface TestResult {
  id: string;
  testDate: string;
  tester: string;
  status: 'passed' | 'failed';
  issues: TestIssue[];
  performance: PerformanceMetric[];
  notes: string;
}

interface TestIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  description: string;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  workaround?: string;
  resolved: boolean;
}

interface PerformanceMetric {
  metric: 'load_time' | 'response_time' | 'memory_usage' | 'battery_usage';
  value: number;
  unit: string;
  benchmark: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor';
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  features: FeatureTest[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  lastRun: string;
  estimatedDuration: number;
}

const TeacherFeatureValidationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<'all' | FeatureTest['category']>('all');
  const [testSuites] = useState<TestSuite[]>(generateMockTestSuites());
  const [featureTests] = useState<FeatureTest[]>(generateMockFeatureTests());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [automatedTestingEnabled, setAutomatedTestingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const categories = [
    { id: 'all', label: 'All Features', icon: '🔧', color: theme.Primary },
    { id: 'assessment', label: 'Assessment', icon: '📝', color: '#4CAF50' },
    { id: 'analytics', label: 'Analytics', icon: '📊', color: '#2196F3' },
    { id: 'workflow', label: 'Workflow', icon: '⚙️', color: '#FF9800' },
    { id: 'communication', label: 'Communication', icon: '💬', color: '#9C27B0' },
    { id: 'management', label: 'Management', icon: '👥', color: '#F44336' },
  ];

  const filteredTests = selectedCategory === 'all'
    ? featureTests
    : featureTests.filter(test => test.category === selectedCategory);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // No modals to handle in this screen
      return false;
    });
    return backHandler;
  }, []);

  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading test data
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load feature tests:', error);
      showSnackbar('Failed to load feature tests');
      setIsLoading(false);
    }
  }, [showSnackbar]);

  // Effects
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const getStatusColor = (status: FeatureTest['status']) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: FeatureTest['priority']) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
    }
  };

  const runFeatureTest = (featureId: string) => {
    setRunningTests(prev => new Set([...prev, featureId]));

    // Simulate test execution
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(featureId);
        return newSet;
      });

      showSnackbar(
        `Feature test ${success ? 'PASSED' : 'FAILED'}! Test results have been recorded.`
      );
    }, 3000 + Math.random() * 2000); // 3-5 second simulation
  };

  const runAllTests = () => {
    Alert.alert(
      'Run All Tests',
      `This will run ${filteredTests.length} feature tests. Estimated time: ${Math.round(filteredTests.reduce((sum, test) => sum + test.estimatedTime, 0) / 60)} hours.\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Tests',
          onPress: () => {
            filteredTests.forEach(test => runFeatureTest(test.id));
            showSnackbar(`Running ${filteredTests.length} tests...`);
          }
        }
      ]
    );
  };

  const generateTestReport = () => {
    const passedTests = filteredTests.filter(test => test.status === 'passed').length;
    const failedTests = filteredTests.filter(test => test.status === 'failed').length;
    const totalTests = filteredTests.length;
    const coverage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    showSnackbar(
      `Report generated: ${totalTests} tests, ${passedTests} passed, ${failedTests} failed (${coverage}% coverage)`
    );
  };

  const renderCategoryTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContainer}
    >
      {categories.map(category => {
        const count = category.id === 'all' 
          ? featureTests.length 
          : featureTests.filter(test => test.category === category.id).length;
        
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              {
                backgroundColor: selectedCategory === category.id 
                  ? category.color 
                  : theme.Surface
              }
            ]}
            onPress={() => setSelectedCategory(category.id as any)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              {
                color: selectedCategory === category.id 
                  ? 'white' 
                  : theme.OnSurface
              }
            ]}>
              {category.label}
            </Text>
            <View style={[
              styles.categoryCount,
              {
                backgroundColor: selectedCategory === category.id 
                  ? 'rgba(255,255,255,0.3)' 
                  : theme.Primary
              }
            ]}>
              <Text style={[
                styles.categoryCountText,
                {
                  color: selectedCategory === category.id 
                    ? 'white' 
                    : theme.OnPrimary
                }
              ]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderTestSummary = () => {
    const totalTests = filteredTests.length;
    const passedTests = filteredTests.filter(test => test.status === 'passed').length;
    const failedTests = filteredTests.filter(test => test.status === 'failed').length;
    const runningTestsCount = filteredTests.filter(test => runningTests.has(test.id)).length;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.summaryTitle, { color: theme.OnSurface }]}>
          Test Summary - {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategory)?.label}
        </Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.Primary }]}>
              {totalTests}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Total Tests
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {passedTests}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Passed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {failedTests}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Failed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {runningTestsCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Running
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${totalTests > 0 ? (passedTests / totalTests) * 100 : 0}%`,
                backgroundColor: '#4CAF50'
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.OnSurfaceVariant }]}>
          {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}% Coverage
        </Text>
      </View>
    );
  };

  const renderFeatureTest = (test: FeatureTest) => {
    const isRunning = runningTests.has(test.id);
    
    return (
      <View key={test.id} style={[styles.testCard, { backgroundColor: theme.Surface }]}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <Text style={[styles.testName, { color: theme.OnSurface }]}>
              {test.name}
            </Text>
            <Text style={[styles.testDescription, { color: theme.OnSurfaceVariant }]}>
              {test.description}
            </Text>
          </View>
          
          <View style={styles.testBadges}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(test.status) }
            ]}>
              <Text style={styles.badgeText}>
                {isRunning ? 'RUNNING' : test.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
            
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(test.priority) }
            ]}>
              <Text style={styles.badgeText}>
                {test.priority.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.testDetails}>
          <View style={styles.testMeta}>
            <Text style={[styles.metaLabel, { color: theme.OnSurfaceVariant }]}>
              Category: {test.category}
            </Text>
            <Text style={[styles.metaLabel, { color: theme.OnSurfaceVariant }]}>
              Steps: {test.testSteps.length}
            </Text>
            <Text style={[styles.metaLabel, { color: theme.OnSurfaceVariant }]}>
              Duration: {test.estimatedTime}m
            </Text>
          </View>
          
          <Text style={[styles.lastTested, { color: theme.OnSurfaceVariant }]}>
            Last tested: {test.lastTested}
          </Text>
        </View>

        <View style={styles.testActions}>
          <TouchableOpacity
            style={[
              styles.testButton,
              { 
                backgroundColor: isRunning ? theme.Outline : theme.Primary,
                opacity: isRunning ? 0.6 : 1 
              }
            ]}
            onPress={() => runFeatureTest(test.id)}
            disabled={isRunning}
          >
            <Text style={[styles.testButtonText, { color: theme.OnPrimary }]}>
              {isRunning ? 'Testing...' : 'Run Test'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.detailsButton, { borderColor: theme.Outline }]}
            onPress={() => showSnackbar(`Detailed information for ${test.name} test`)}
          >
            <Text style={[styles.detailsButtonText, { color: theme.OnSurface }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => console.log('Navigate back to teacher dashboard')} />
      <Appbar.Content title="Feature Validation" subtitle="Comprehensive testing platform" />
      <Appbar.Action icon="flask" onPress={runAllTests} />
      <Appbar.Action icon="file-document" onPress={generateTestReport} />
    </Appbar.Header>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading feature tests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
      <StatusBar backgroundColor="#059669" barStyle="light-content" />
      {renderAppBar()}

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: theme.Surface }]}>
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: theme.OnSurface }]}>
            Automated Testing
          </Text>
          <Switch
            value={automatedTestingEnabled}
            onValueChange={setAutomatedTestingEnabled}
            trackColor={{
              false: theme.Outline,
              true: theme.Primary,
            }}
            thumbColor={automatedTestingEnabled ? theme.OnPrimary : theme.OnSurfaceVariant}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.Primary }]}
            onPress={runAllTests}
          >
            <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
              Run All Tests
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={generateTestReport}
          >
            <Text style={styles.actionButtonText}>
              Generate Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tabs */}
      {renderCategoryTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Summary */}
        {renderTestSummary()}

        {/* Feature Tests */}
        <View style={styles.testsSection}>
          <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
            Feature Tests ({filteredTests.length})
          </Text>
          
          {filteredTests.map(renderFeatureTest)}
        </View>
      </ScrollView>

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
  );
};

// Mock data generators
function generateMockTestSuites(): TestSuite[] {
  return [
    {
      id: 'suite_1',
      name: 'Assessment System Tests',
      description: 'Complete testing of question bank and grading features',
      features: [],
      totalTests: 15,
      passedTests: 12,
      failedTests: 2,
      coverage: 80,
      lastRun: '2024-01-15 14:30',
      estimatedDuration: 180,
    },
  ];
}

function generateMockFeatureTests(): FeatureTest[] {
  return [
    {
      id: 'test_1',
      category: 'assessment',
      name: 'Question Bank Management',
      description: 'Test question creation, editing, filtering, and import/export functionality',
      status: 'passed',
      priority: 'critical',
      testSteps: [
        {
          id: 'step_1',
          step: 1,
          description: 'Open Question Bank Management screen',
          expectedResult: 'Screen loads with question list',
          status: 'passed',
        },
      ],
      dependencies: [],
      lastTested: '2024-01-15 10:30 AM',
      testResults: [],
      automatedTest: true,
      estimatedTime: 25,
    },
    {
      id: 'test_2',
      category: 'assessment',
      name: 'Assignment Grading System',
      description: 'Test plagiarism detection, feedback system, and rubric-based grading',
      status: 'passed',
      priority: 'critical',
      testSteps: [],
      dependencies: ['test_1'],
      lastTested: '2024-01-15 11:45 AM',
      testResults: [],
      automatedTest: true,
      estimatedTime: 30,
    },
    {
      id: 'test_3',
      category: 'analytics',
      name: 'Student Profile Analytics',
      description: 'Test detailed student profiles, academic history, and learning plans',
      status: 'testing',
      priority: 'high',
      testSteps: [],
      dependencies: [],
      lastTested: '2024-01-15 09:15 AM',
      testResults: [],
      automatedTest: false,
      estimatedTime: 20,
    },
    {
      id: 'test_4',
      category: 'workflow',
      name: 'Automated Attendance Tracking',
      description: 'Test auto-detection, manual entry, and attendance reporting',
      status: 'failed',
      priority: 'high',
      testSteps: [],
      dependencies: [],
      lastTested: '2024-01-14 16:20 PM',
      testResults: [],
      automatedTest: true,
      estimatedTime: 15,
    },
    {
      id: 'test_5',
      category: 'workflow',
      name: 'Performance Alert System',
      description: 'Test alert generation, notification, and intervention recommendations',
      status: 'not_tested',
      priority: 'medium',
      testSteps: [],
      dependencies: ['test_3'],
      lastTested: 'Never',
      testResults: [],
      automatedTest: false,
      estimatedTime: 18,
    },
    {
      id: 'test_6',
      category: 'communication',
      name: 'Parent Communication System',
      description: 'Test automated messaging, template system, and communication logs',
      status: 'not_tested',
      priority: 'medium',
      testSteps: [],
      dependencies: [],
      lastTested: 'Never',
      testResults: [],
      automatedTest: true,
      estimatedTime: 22,
    },
    {
      id: 'test_7',
      category: 'management',
      name: 'Class Management Tools',
      description: 'Test student grouping, assignment distribution, and progress tracking',
      status: 'passed',
      priority: 'high',
      testSteps: [],
      dependencies: [],
      lastTested: '2024-01-15 13:10 PM',
      testResults: [],
      automatedTest: false,
      estimatedTime: 35,
    },
    {
      id: 'test_8',
      category: 'analytics',
      name: 'Assignment Performance Analysis',
      description: 'Test question-wise analysis, class comparison, and improvement recommendations',
      status: 'passed',
      priority: 'high',
      testSteps: [],
      dependencies: ['test_2'],
      lastTested: '2024-01-15 12:05 PM',
      testResults: [],
      automatedTest: true,
      estimatedTime: 28,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    padding: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  controls: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  controlLabel: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  categoryTabs: {
    maxHeight: 80,
  },
  categoryTabsContainer: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: 20,
    marginRight: Spacing.SM,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: Spacing.XS,
  },
  categoryLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginRight: Spacing.XS,
  },
  categoryCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryCountText: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: Spacing.MD,
    padding: Spacing.LG,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.LG,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: Spacing.SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  testsSection: {
    padding: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  testCard: {
    marginBottom: Spacing.MD,
    borderRadius: 12,
    padding: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  testInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  testName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  testDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
  },
  testBadges: {
    gap: Spacing.XS,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  testDetails: {
    marginBottom: Spacing.MD,
  },
  testMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metaLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  lastTested: {
    fontSize: Typography.bodySmall.fontSize,
  },
  testActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  testButton: {
    flex: 2,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
});

export default TeacherFeatureValidationScreen;