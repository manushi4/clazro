/**
 * QualityAssuranceTestingScreen - Phase 59: Quality Assurance & Testing
 * Comprehensive testing suite with automated testing, load testing, and bug fixing
 * Security testing, usability testing, and performance optimization
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
  Switch,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeOut, SlideInUp, SlideInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface TestSuite {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'usability';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  assignee: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  environment: string;
  reproduction: string[];
  tags: string[];
}

interface TestMetrics {
  id: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  category: 'performance' | 'quality' | 'coverage' | 'reliability';
  description: string;
}

interface AutomatedTest {
  id: string;
  testName: string;
  testType: 'api' | 'ui' | 'database' | 'security' | 'performance';
  status: 'scheduled' | 'running' | 'passed' | 'failed' | 'disabled';
  frequency: 'continuous' | 'daily' | 'weekly' | 'on_demand';
  lastResult: TestResult;
  configuration: TestConfiguration;
}

interface TestResult {
  status: 'passed' | 'failed' | 'error';
  duration: number;
  timestamp: Date;
  details: string;
  assertions: number;
  errors?: string[];
}

interface TestConfiguration {
  timeout: number;
  retries: number;
  environment: string;
  dataSet: string;
  parallelExecution: boolean;
}

interface QualityAssuranceTestingScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const QualityAssuranceTestingScreen: React.FC<QualityAssuranceTestingScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'automated' | 'bugs' | 'performance' | 'security'>('overview');
  const [testSuites, setTestSuites] = useState<TestSuite[]>(generateTestSuites());
  const [bugReports, setBugReports] = useState<BugReport[]>(generateBugReports());
  const [testMetrics, setTestMetrics] = useState<TestMetrics[]>(generateTestMetrics());
  const [automatedTests, setAutomatedTests] = useState<AutomatedTest[]>(generateAutomatedTests());
  const [refreshing, setRefreshing] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [automatedTesting, setAutomatedTesting] = useState(true);
  const [continuousIntegration, setContinuousIntegration] = useState(true);

  useEffect(() => {
    // Simulate real-time test execution updates
    const interval = setInterval(() => {
      if (testingInProgress) {
        setTestSuites(prev => prev.map(suite => {
          if (suite.status === 'running') {
            const newPassed = Math.min(suite.totalTests, suite.passedTests + Math.floor(Math.random() * 3));
            return {
              ...suite,
              passedTests: newPassed,
              failedTests: Math.floor(Math.random() * 2),
              coverage: Math.min(100, suite.coverage + Math.random() * 5),
            };
          }
          return suite;
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [testingInProgress]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setTestSuites(generateTestSuites());
      setBugReports(generateBugReports());
      setTestMetrics(generateTestMetrics());
      setRefreshing(false);
    }, 2000);
  };

  const handleRunAllTests = () => {
    Alert.alert(
      'Run Complete Test Suite',
      'This will execute all automated tests including unit, integration, E2E, performance, and security tests. This may take 30-60 minutes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run All Tests', 
          onPress: () => {
            setTestingInProgress(true);
            setTestSuites(prev => prev.map(suite => ({
              ...suite,
              status: 'running',
              passedTests: 0,
              failedTests: 0,
            })));
            
            // Simulate test completion
            setTimeout(() => {
              setTestingInProgress(false);
              setTestSuites(prev => prev.map(suite => ({
                ...suite,
                status: 'completed',
                passedTests: Math.floor(suite.totalTests * 0.92),
                failedTests: Math.floor(suite.totalTests * 0.08),
                coverage: Math.floor(Math.random() * 10) + 90,
              })));
              Alert.alert('Tests Complete', 'All test suites have completed successfully. Check individual results for details.');
            }, 10000);
          }
        }
      ]
    );
  };

  const handleRunLoadTest = () => {
    Alert.alert(
      'Load Testing',
      'Start comprehensive load testing? This will simulate high user traffic and may affect system performance temporarily.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Load Test', 
          onPress: () => {
            Alert.alert('Load Test Started', 'Load testing is running with 10,000 simulated users. Results will be available in 15-20 minutes.');
          }
        }
      ]
    );
  };

  const handleSecurityScan = () => {
    Alert.alert(
      'Security Vulnerability Scan',
      'Run comprehensive security testing including penetration testing and vulnerability scanning?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run Security Scan', 
          onPress: () => {
            Alert.alert('Security Scan Started', 'Security vulnerability scan is running. This includes OWASP Top 10 checks and will complete in 20-30 minutes.');
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Quality Assurance Overview
      </Text>
      
      {/* Test Status Summary */}
      <Animated.View entering={FadeInUp} style={[styles.summaryCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Test Execution Summary
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {testSuites.reduce((acc, suite) => acc + suite.passedTests, 0)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.OnSurfaceVariant }]}>
              Tests Passed
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {testSuites.reduce((acc, suite) => acc + suite.failedTests, 0)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.OnSurfaceVariant }]}>
              Tests Failed
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {Math.round(testSuites.reduce((acc, suite) => acc + suite.coverage, 0) / testSuites.length)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.OnSurfaceVariant }]}>
              Code Coverage
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
              {bugReports.filter(bug => bug.status === 'open').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.OnSurfaceVariant }]}>
              Open Bugs
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
            onPress={handleRunAllTests}
            disabled={testingInProgress}
          >
            <Text style={[styles.quickActionText, { color: theme.OnPrimary }]}>
              {testingInProgress ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.secondary }]}
            onPress={handleRunLoadTest}
          >
            <Text style={[styles.quickActionText, { color: theme.OnSecondary }]}>
              Load Test
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Test Suites Status */}
      <Animated.View entering={FadeInUp.delay(200)} style={[styles.suitesCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Test Suites Status
        </Text>
        
        {testSuites.slice(0, 6).map((suite, index) => (
          <Animated.View
            key={suite.id}
            animation="fadeInLeft"
            delay={index * 100}
            style={styles.suiteRow}
          >
            <View style={styles.suiteInfo}>
              <Text style={[styles.suiteName, { color: theme.OnSurface }]}>
                {suite.name}
              </Text>
              <Text style={[styles.suiteStats, { color: theme.OnSurfaceVariant }]}>
                {suite.passedTests}/{suite.totalTests} passed • {suite.coverage}% coverage
              </Text>
            </View>
            
            <View style={[
              styles.suiteStatus,
              {
                backgroundColor: 
                  suite.status === 'completed' && suite.failedTests === 0 ? '#4CAF50' :
                  suite.status === 'completed' && suite.failedTests > 0 ? '#FF9800' :
                  suite.status === 'running' ? '#2196F3' :
                  suite.status === 'failed' ? '#F44336' : '#9E9E9E'
              }
            ]}>
              <Text style={styles.suiteStatusText}>
                {suite.status === 'completed' && suite.failedTests === 0 ? '✓' :
                 suite.status === 'completed' && suite.failedTests > 0 ? '⚠' :
                 suite.status === 'running' ? '⟳' :
                 suite.status === 'failed' ? '✗' : '○'}
              </Text>
            </View>
            
            {suite.status === 'running' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.round((suite.passedTests / suite.totalTests) * 100)}%`,
                        backgroundColor: theme.primary
                      }
                    ]}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        ))}
      </Animated.View>

      {/* Quality Metrics */}
      <Animated.View entering={FadeInUp.delay(400)} style={[styles.metricsCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Quality Metrics
        </Text>
        
        {testMetrics.slice(0, 4).map((metric, index) => (
          <View key={metric.id} style={styles.metricRow}>
            <View style={styles.metricInfo}>
              <Text style={[styles.metricName, { color: theme.OnSurface }]}>
                {metric.metric}
              </Text>
              <Text style={[styles.metricDescription, { color: theme.OnSurfaceVariant }]}>
                {metric.description}
              </Text>
            </View>
            
            <View style={styles.metricValues}>
              <Text style={[
                styles.metricValue,
                { 
                  color: metric.status === 'good' ? '#4CAF50' :
                        metric.status === 'warning' ? '#FF9800' : '#F44336'
                }
              ]}>
                {metric.currentValue}{metric.unit}
              </Text>
              <Text style={[styles.metricTarget, { color: theme.OnSurfaceVariant }]}>
                Target: {metric.targetValue}{metric.unit}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );

  const renderAutomated = () => (
    <View>
      <View style={styles.automatedHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Automated Testing
        </Text>
        <View style={styles.automatedControls}>
          <Switch
            value={automatedTesting}
            onValueChange={setAutomatedTesting}
            trackColor={{ false: theme.Outline, true: theme.primary }}
          />
          <Text style={[styles.controlLabel, { color: theme.OnSurfaceVariant }]}>
            Auto Tests
          </Text>
        </View>
      </View>

      {automatedTests.map((test, index) => (
        <Animated.View
          key={test.id}
          animation="fadeInRight"
          delay={index * 100}
          style={[styles.automatedTestCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.testHeader}>
            <View style={styles.testInfo}>
              <Text style={[styles.testName, { color: theme.OnSurface }]}>
                {test.testName}
              </Text>
              <Text style={[styles.testType, { color: theme.OnSurfaceVariant }]}>
                {test.testType.toUpperCase()} • {test.frequency}
              </Text>
            </View>
            
            <View style={[
              styles.testStatus,
              {
                backgroundColor: 
                  test.status === 'passed' ? '#4CAF50' :
                  test.status === 'failed' ? '#F44336' :
                  test.status === 'running' ? '#2196F3' :
                  test.status === 'disabled' ? '#9E9E9E' : '#FF9800'
              }
            ]}>
              <Text style={styles.testStatusText}>
                {test.status === 'passed' ? '✓' :
                 test.status === 'failed' ? '✗' :
                 test.status === 'running' ? '⟳' :
                 test.status === 'disabled' ? '○' : '⏱'}
              </Text>
            </View>
          </View>
          
          <View style={styles.testDetails}>
            <Text style={[styles.testDetail, { color: theme.OnSurfaceVariant }]}>
              Last run: {test.lastResult.timestamp.toLocaleDateString()}
            </Text>
            <Text style={[styles.testDetail, { color: theme.OnSurfaceVariant }]}>
              Duration: {test.lastResult.duration}ms
            </Text>
            <Text style={[styles.testDetail, { color: theme.OnSurfaceVariant }]}>
              Assertions: {test.lastResult.assertions}
            </Text>
          </View>
          
          <View style={styles.testActions}>
            <TouchableOpacity
              style={[styles.testActionButton, { backgroundColor: theme.primaryContainer }]}
              onPress={() => Alert.alert('Test', `Running ${test.testName}...`)}
            >
              <Text style={[styles.testActionText, { color: theme.OnPrimaryContainer }]}>
                Run Test
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testActionButton, { backgroundColor: theme.secondaryContainer }]}
              onPress={() => Alert.alert('Configuration', `Configuring ${test.testName}...`)}
            >
              <Text style={[styles.testActionText, { color: theme.OnSecondaryContainer }]}>
                Configure
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderBugs = () => (
    <View>
      <View style={styles.bugsHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Bug Reports & Issues
        </Text>
        <TouchableOpacity
          style={[styles.newBugButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('New Bug', 'Bug reporting interface will open soon.')}
        >
          <Text style={[styles.newBugButtonText, { color: theme.OnPrimary }]}>
            New Bug
          </Text>
        </TouchableOpacity>
      </View>

      {bugReports.map((bug, index) => (
        <Animated.View
          key={bug.id}
          animation="fadeInLeft"
          delay={index * 100}
        >
          <TouchableOpacity
            style={[styles.bugCard, { backgroundColor: theme.Surface }]}
            onPress={() => {
              setSelectedBug(bug);
              setShowBugModal(true);
            }}
          >
            <View style={styles.bugHeader}>
              <View style={styles.bugInfo}>
                <Text style={[styles.bugTitle, { color: theme.OnSurface }]}>
                  {bug.title}
                </Text>
                <Text style={[styles.bugMeta, { color: theme.OnSurfaceVariant }]}>
                  {bug.severity.toUpperCase()} • {bug.priority.toUpperCase()} • {bug.reporter}
                </Text>
              </View>
              
              <View style={[
                styles.bugSeverity,
                {
                  backgroundColor: 
                    bug.severity === 'critical' ? '#F44336' :
                    bug.severity === 'high' ? '#FF9800' :
                    bug.severity === 'medium' ? '#2196F3' : '#4CAF50'
                }
              ]}>
                <Text style={styles.bugSeverityText}>
                  {bug.severity === 'critical' ? '!!!' :
                   bug.severity === 'high' ? '!!' :
                   bug.severity === 'medium' ? '!' : '○'}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.bugDescription, { color: theme.OnSurfaceVariant }]} numberOfLines={2}>
              {bug.description}
            </Text>
            
            <View style={styles.bugFooter}>
              <View style={[
                styles.bugStatus,
                {
                  backgroundColor: 
                    bug.status === 'resolved' ? '#4CAF50' :
                    bug.status === 'in_progress' ? '#2196F3' :
                    bug.status === 'open' ? '#FF9800' : '#9E9E9E'
                }
              ]}>
                <Text style={styles.bugStatusText}>
                  {bug.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              
              <Text style={[styles.bugDate, { color: theme.OnSurfaceVariant }]}>
                {bug.createdAt.toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.bugTags}>
              {bug.tags.slice(0, 3).map(tag => (
                <View key={tag} style={[styles.bugTag, { backgroundColor: theme.primaryContainer }]}>
                  <Text style={[styles.bugTagText, { color: theme.OnPrimaryContainer }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderPerformance = () => (
    <View>
      <View style={styles.performanceHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Performance Testing
        </Text>
        <TouchableOpacity
          style={[styles.loadTestButton, { backgroundColor: theme.secondary }]}
          onPress={handleRunLoadTest}
        >
          <Text style={[styles.loadTestButtonText, { color: theme.OnSecondary }]}>
            Run Load Test
          </Text>
        </TouchableOpacity>
      </View>

      {testMetrics.filter(metric => metric.category === 'performance').map((metric, index) => (
        <Animated.View
          key={metric.id}
          entering={FadeInUp.delay(index * 150)}
          style={[styles.performanceCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.performanceHeader}>
            <Text style={[styles.performanceName, { color: theme.OnSurface }]}>
              {metric.metric}
            </Text>
            <View style={[
              styles.performanceStatus,
              {
                backgroundColor: 
                  metric.status === 'good' ? '#4CAF50' :
                  metric.status === 'warning' ? '#FF9800' : '#F44336'
              }
            ]}>
              <Text style={styles.performanceStatusText}>
                {metric.status === 'good' ? '✓' :
                 metric.status === 'warning' ? '⚠' : '✗'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.performanceDescription, { color: theme.OnSurfaceVariant }]}>
            {metric.description}
          </Text>
          
          <View style={styles.performanceValues}>
            <View style={styles.performanceValue}>
              <Text style={[styles.valueNumber, { color: theme.primary }]}>
                {metric.currentValue}{metric.unit}
              </Text>
              <Text style={[styles.valueLabel, { color: theme.OnSurfaceVariant }]}>
                Current
              </Text>
            </View>
            
            <View style={styles.performanceValue}>
              <Text style={[styles.valueNumber, { color: theme.OnSurfaceVariant }]}>
                {metric.targetValue}{metric.unit}
              </Text>
              <Text style={[styles.valueLabel, { color: theme.OnSurfaceVariant }]}>
                Target
              </Text>
            </View>
            
            <View style={styles.performanceValue}>
              <Text style={[
                styles.trendIndicator,
                { 
                  color: metric.trend === 'improving' ? '#4CAF50' :
                        metric.trend === 'stable' ? '#FF9800' : '#F44336'
                }
              ]}>
                {metric.trend === 'improving' ? '↗' :
                 metric.trend === 'stable' ? '→' : '↘'}
              </Text>
              <Text style={[styles.valueLabel, { color: theme.OnSurfaceVariant }]}>
                Trend
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderSecurity = () => (
    <View>
      <View style={styles.securityHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Security Testing
        </Text>
        <TouchableOpacity
          style={[styles.securityScanButton, { backgroundColor: theme.error }]}
          onPress={handleSecurityScan}
        >
          <Text style={[styles.securityScanButtonText, { color: theme.OnError }]}>
            Security Scan
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.securityOverview, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Security Test Results
        </Text>
        
        <View style={styles.securityMetrics}>
          <View style={styles.securityMetric}>
            <Text style={[styles.securityValue, { color: '#4CAF50' }]}>0</Text>
            <Text style={[styles.securityLabel, { color: theme.OnSurfaceVariant }]}>
              Critical Vulnerabilities
            </Text>
          </View>
          
          <View style={styles.securityMetric}>
            <Text style={[styles.securityValue, { color: '#FF9800' }]}>2</Text>
            <Text style={[styles.securityLabel, { color: theme.OnSurfaceVariant }]}>
              Medium Risk Issues
            </Text>
          </View>
          
          <View style={styles.securityMetric}>
            <Text style={[styles.securityValue, { color: '#2196F3' }]}>5</Text>
            <Text style={[styles.securityLabel, { color: theme.OnSurfaceVariant }]}>
              Recommendations
            </Text>
          </View>
        </View>
        
        <View style={styles.securityChecks}>
          <Text style={[styles.securityChecksTitle, { color: theme.OnSurface }]}>
            OWASP Top 10 Compliance
          </Text>
          
          {[
            'Injection Attacks',
            'Broken Authentication',
            'Sensitive Data Exposure',
            'XML External Entities',
            'Broken Access Control',
          ].map((check, index) => (
            <View key={check} style={styles.securityCheck}>
              <View style={[styles.checkIndicator, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.checkIndicatorText}>✓</Text>
              </View>
              <Text style={[styles.checkName, { color: theme.OnSurface }]}>
                {check}
              </Text>
            </View>
          ))}
        </View>
      </View>
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
            Quality Assurance & Testing
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            Comprehensive testing suite and quality management
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Switch
            value={continuousIntegration}
            onValueChange={setContinuousIntegration}
            trackColor={{ false: theme.Outline, true: theme.primary }}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'automated', 'bugs', 'performance', 'security'].map(tab => (
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
        {selectedTab === 'automated' && renderAutomated()}
        {selectedTab === 'bugs' && renderBugs()}
        {selectedTab === 'performance' && renderPerformance()}
        {selectedTab === 'security' && renderSecurity()}
      </ScrollView>

      {/* Bug Detail Modal */}
      <Modal
        visible={showBugModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.Surface }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              {selectedBug?.title}
            </Text>
            <TouchableOpacity onPress={() => setShowBugModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedBug && (
              <View>
                <Text style={[styles.modalDescription, { color: theme.OnBackground }]}>
                  {selectedBug.description}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Bug Details
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Severity: {selectedBug.severity}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Priority: {selectedBug.priority}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Status: {selectedBug.status}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Environment: {selectedBug.environment}
                  </Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Reproduction Steps
                  </Text>
                  {selectedBug.reproduction.map((step, index) => (
                    <Text key={index} style={[styles.modalStep, { color: theme.OnSurfaceVariant }]}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowBugModal(false);
                    Alert.alert('Bug Updated', `Bug ${selectedBug.title} has been updated.`);
                  }}
                >
                  <Text style={[styles.modalActionButtonText, { color: theme.OnPrimary }]}>
                    Update Bug Status
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
function generateTestSuites(): TestSuite[] {
  return [
    {
      id: '1',
      name: 'Unit Tests',
      category: 'unit',
      totalTests: 284,
      passedTests: 279,
      failedTests: 5,
      skippedTests: 0,
      duration: 12340,
      coverage: 94,
      status: 'completed',
      lastRun: new Date(),
      priority: 'critical',
    },
    {
      id: '2',
      name: 'Integration Tests',
      category: 'integration',
      totalTests: 156,
      passedTests: 148,
      failedTests: 8,
      skippedTests: 0,
      duration: 45670,
      coverage: 87,
      status: 'completed',
      lastRun: new Date(),
      priority: 'high',
    },
    {
      id: '3',
      name: 'End-to-End Tests',
      category: 'e2e',
      totalTests: 89,
      passedTests: 82,
      failedTests: 7,
      skippedTests: 0,
      duration: 123450,
      coverage: 78,
      status: 'completed',
      lastRun: new Date(),
      priority: 'high',
    },
    {
      id: '4',
      name: 'Performance Tests',
      category: 'performance',
      totalTests: 34,
      passedTests: 31,
      failedTests: 3,
      skippedTests: 0,
      duration: 234560,
      coverage: 85,
      status: 'completed',
      lastRun: new Date(),
      priority: 'medium',
    },
    {
      id: '5',
      name: 'Security Tests',
      category: 'security',
      totalTests: 67,
      passedTests: 65,
      failedTests: 2,
      skippedTests: 0,
      duration: 67890,
      coverage: 92,
      status: 'completed',
      lastRun: new Date(),
      priority: 'critical',
    },
    {
      id: '6',
      name: 'Usability Tests',
      category: 'usability',
      totalTests: 45,
      passedTests: 41,
      failedTests: 4,
      skippedTests: 0,
      duration: 98760,
      coverage: 76,
      status: 'completed',
      lastRun: new Date(),
      priority: 'medium',
    },
  ];
}

function generateBugReports(): BugReport[] {
  return [
    {
      id: '1',
      title: 'Login button not responsive on mobile devices',
      description: 'The login button becomes unresponsive after multiple tap attempts on mobile devices, requiring app restart.',
      severity: 'high',
      priority: 'p1',
      status: 'open',
      assignee: 'John Doe',
      reporter: 'Jane Smith',
      createdAt: new Date(2025, 8, 1),
      updatedAt: new Date(2025, 8, 5),
      environment: 'Mobile - Android 14',
      reproduction: [
        'Open the app on Android device',
        'Navigate to login screen',
        'Tap login button multiple times quickly',
        'Observe button becomes unresponsive'
      ],
      tags: ['mobile', 'login', 'ui'],
    },
    {
      id: '2',
      title: 'Assignment submission fails for large files',
      description: 'Students unable to submit assignments larger than 10MB, showing timeout error.',
      severity: 'critical',
      priority: 'p1',
      status: 'in_progress',
      assignee: 'Alice Johnson',
      reporter: 'Teacher Mike',
      createdAt: new Date(2025, 7, 28),
      updatedAt: new Date(2025, 8, 6),
      environment: 'Web - Chrome 118',
      reproduction: [
        'Login as student',
        'Navigate to assignment submission',
        'Attempt to upload file larger than 10MB',
        'Observe timeout error after 2 minutes'
      ],
      tags: ['assignment', 'upload', 'timeout'],
    },
    {
      id: '3',
      title: 'Grade calculations showing incorrect averages',
      description: 'Teacher gradebook displays wrong average calculations for weighted assignments.',
      severity: 'medium',
      priority: 'p2',
      status: 'resolved',
      assignee: 'Bob Wilson',
      reporter: 'Teacher Sarah',
      createdAt: new Date(2025, 7, 15),
      updatedAt: new Date(2025, 8, 2),
      environment: 'Web - All browsers',
      reproduction: [
        'Login as teacher',
        'Create weighted assignments',
        'Enter grades for students',
        'Check grade average calculation'
      ],
      tags: ['grades', 'calculation', 'teacher'],
    },
  ];
}

function generateTestMetrics(): TestMetrics[] {
  return [
    {
      id: '1',
      metric: 'Code Coverage',
      currentValue: 89,
      targetValue: 90,
      unit: '%',
      status: 'warning',
      trend: 'improving',
      category: 'coverage',
      description: 'Percentage of code covered by automated tests',
    },
    {
      id: '2',
      metric: 'Test Success Rate',
      currentValue: 94,
      targetValue: 95,
      unit: '%',
      status: 'warning',
      trend: 'stable',
      category: 'quality',
      description: 'Percentage of tests that pass on first run',
    },
    {
      id: '3',
      metric: 'App Load Time',
      currentValue: 2.1,
      targetValue: 3.0,
      unit: 's',
      status: 'good',
      trend: 'improving',
      category: 'performance',
      description: 'Average time for app to become interactive',
    },
    {
      id: '4',
      metric: 'API Response Time',
      currentValue: 247,
      targetValue: 500,
      unit: 'ms',
      status: 'good',
      trend: 'improving',
      category: 'performance',
      description: 'Average response time for API endpoints',
    },
    {
      id: '5',
      metric: 'Mean Time to Recovery',
      currentValue: 18,
      targetValue: 30,
      unit: 'min',
      status: 'good',
      trend: 'stable',
      category: 'reliability',
      description: 'Average time to fix critical production issues',
    },
  ];
}

function generateAutomatedTests(): AutomatedTest[] {
  return [
    {
      id: '1',
      testName: 'User Authentication API',
      testType: 'api',
      status: 'passed',
      frequency: 'continuous',
      lastResult: {
        status: 'passed',
        duration: 1234,
        timestamp: new Date(),
        details: 'All authentication endpoints working correctly',
        assertions: 45,
      },
      configuration: {
        timeout: 30000,
        retries: 3,
        environment: 'staging',
        dataSet: 'test_users',
        parallelExecution: true,
      },
    },
    {
      id: '2',
      testName: 'Student Dashboard UI',
      testType: 'ui',
      status: 'passed',
      frequency: 'daily',
      lastResult: {
        status: 'passed',
        duration: 5678,
        timestamp: new Date(),
        details: 'UI elements render correctly and are interactive',
        assertions: 23,
      },
      configuration: {
        timeout: 60000,
        retries: 2,
        environment: 'staging',
        dataSet: 'sample_data',
        parallelExecution: false,
      },
    },
    {
      id: '3',
      testName: 'Database Performance',
      testType: 'database',
      status: 'warning',
      frequency: 'weekly',
      lastResult: {
        status: 'passed',
        duration: 9876,
        timestamp: new Date(),
        details: 'Some queries slower than expected but within limits',
        assertions: 12,
      },
      configuration: {
        timeout: 120000,
        retries: 1,
        environment: 'staging',
        dataSet: 'performance_data',
        parallelExecution: false,
      },
    },
  ];
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
  summaryCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  summaryValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  suitesCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suiteInfo: {
    flex: 1,
  },
  suiteName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  suiteStats: {
    fontSize: Typography.bodySmall.fontSize,
  },
  suiteStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.MD,
  },
  suiteStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginLeft: Spacing.SM,
    width: 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricsCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  metricName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricDescription: {
    fontSize: Typography.bodySmall.fontSize,
  },
  metricValues: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  metricTarget: {
    fontSize: Typography.bodySmall.fontSize,
  },
  automatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  automatedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  controlLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  automatedTestCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  testType: {
    fontSize: Typography.bodySmall.fontSize,
    textTransform: 'capitalize',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  testDetail: {
    fontSize: Typography.bodySmall.fontSize,
  },
  testActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  testActionButton: {
    flex: 1,
    paddingVertical: Spacing.XS,
    borderRadius: 6,
    alignItems: 'center',
  },
  testActionText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  bugsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  newBugButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  newBugButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  bugCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  bugInfo: {
    flex: 1,
  },
  bugTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  bugMeta: {
    fontSize: Typography.bodySmall.fontSize,
  },
  bugSeverity: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bugSeverityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bugDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  bugFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  bugStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bugStatusText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  bugDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  bugTags: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  bugTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bugTagText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  loadTestButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  loadTestButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  performanceStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  performanceDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  performanceValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceValue: {
    alignItems: 'center',
  },
  valueNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  valueLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  trendIndicator: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  securityScanButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  securityScanButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  securityOverview: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  securityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.LG,
  },
  securityMetric: {
    alignItems: 'center',
  },
  securityValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  securityLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginTop: 4,
  },
  securityChecks: {
    marginTop: Spacing.MD,
  },
  securityChecksTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  securityCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.XS,
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.SM,
  },
  checkIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkName: {
    fontSize: Typography.bodyMedium.fontSize,
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
  modalStep: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
    marginLeft: Spacing.SM,
  },
  modalActionButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  modalActionButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
});

export default QualityAssuranceTestingScreen;