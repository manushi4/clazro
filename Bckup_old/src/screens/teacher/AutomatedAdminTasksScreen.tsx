import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'attendance' | 'grading' | 'communication' | 'scheduling' | 'reporting' | 'assessment';
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  trigger: {
    type: 'time-based' | 'event-based' | 'condition-based';
    condition: string;
    frequency?: string;
  };
  actions: {
    type: 'email' | 'notification' | 'grade-update' | 'report-generation' | 'task-creation';
    description: string;
    parameters: Record<string, any>;
  }[];
  performance: {
    executed: number;
    successful: number;
    timeSaved: number; // in minutes
    errorRate: number;
  };
  lastRun?: Date;
  nextRun?: Date;
}

interface TaskAutomation {
  id: string;
  taskType: 'grade-processing' | 'attendance-tracking' | 'parent-notifications' | 'report-generation' | 'resource-allocation';
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
  progress: number;
  estimatedCompletion: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  beneficiaries: number;
  timeSaved: number; // in minutes
  accuracy: number; // percentage
  createdAt: Date;
  completedAt?: Date;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'assessment' | 'communication' | 'administrative' | 'analytics';
  description: string;
  steps: {
    id: string;
    name: string;
    type: 'automatic' | 'manual' | 'conditional';
    description: string;
    estimatedTime: number;
    dependencies: string[];
  }[];
  usage: {
    timesUsed: number;
    averageCompletion: number; // minutes
    successRate: number;
    userRating: number;
  };
  isCustomizable: boolean;
  isActive: boolean;
}

interface AutomatedAdminTasksScreenProps {
  onNavigate: (screen: string) => void;
}

export const AutomatedAdminTasksScreen: React.FC<AutomatedAdminTasksScreenProps> = ({
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'tasks' | 'workflows' | 'analytics'>('overview');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock data - replace with actual API calls
  const [automationRules] = useState<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Daily Attendance Alerts',
      description: 'Automatically notify parents when student is absent for 2+ consecutive days',
      category: 'attendance',
      isActive: true,
      priority: 'high',
      trigger: {
        type: 'condition-based',
        condition: 'Student absent for 2+ days',
      },
      actions: [
        {
          type: 'email',
          description: 'Send automated email to parents',
          parameters: { template: 'attendance-concern', includeAttendanceReport: true }
        }
      ],
      performance: {
        executed: 143,
        successful: 139,
        timeSaved: 287, // minutes
        errorRate: 2.8,
      },
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    },
    {
      id: 'rule-2',
      name: 'Weekly Grade Reports',
      description: 'Generate and distribute weekly grade summaries to students and parents',
      category: 'grading',
      isActive: true,
      priority: 'medium',
      trigger: {
        type: 'time-based',
        condition: 'Every Friday at 3 PM',
        frequency: 'weekly',
      },
      actions: [
        {
          type: 'report-generation',
          description: 'Generate grade summary reports',
          parameters: { includeComments: true, format: 'pdf', recipients: ['students', 'parents'] }
        }
      ],
      performance: {
        executed: 52,
        successful: 51,
        timeSaved: 416, // 8 hours per week
        errorRate: 1.9,
      },
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'rule-3',
      name: 'Assignment Deadline Reminders',
      description: 'Send automated reminders 3 days and 1 day before assignment deadlines',
      category: 'communication',
      isActive: true,
      priority: 'medium',
      trigger: {
        type: 'condition-based',
        condition: 'Assignment deadline approaching',
      },
      actions: [
        {
          type: 'notification',
          description: 'Send push notifications to students',
          parameters: { schedule: ['3-days', '1-day'], includeSubmissionLink: true }
        }
      ],
      performance: {
        executed: 89,
        successful: 87,
        timeSaved: 134,
        errorRate: 2.2,
      },
      lastRun: new Date(Date.now() - 8 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 16 * 60 * 60 * 1000),
    },
  ]);

  const [activeTasks] = useState<TaskAutomation[]>([
    {
      id: 'task-1',
      taskType: 'grade-processing',
      title: 'Midterm Exam Grade Processing',
      description: 'Automated processing and analysis of midterm examination results',
      status: 'processing',
      progress: 73,
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000),
      priority: 'high',
      automationLevel: 'semi-automated',
      beneficiaries: 156,
      timeSaved: 240, // 4 hours
      accuracy: 97.8,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'task-2',
      taskType: 'parent-notifications',
      title: 'Monthly Progress Reports Distribution',
      description: 'Bulk generation and distribution of monthly student progress reports',
      status: 'scheduled',
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'medium',
      automationLevel: 'fully-automated',
      beneficiaries: 234,
      timeSaved: 360, // 6 hours
      accuracy: 99.2,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: 'task-3',
      taskType: 'attendance-tracking',
      title: 'Weekly Attendance Analysis',
      description: 'Comprehensive analysis of weekly attendance patterns and trend identification',
      status: 'completed',
      progress: 100,
      estimatedCompletion: new Date(Date.now() - 30 * 60 * 1000),
      priority: 'low',
      automationLevel: 'fully-automated',
      beneficiaries: 198,
      timeSaved: 120,
      accuracy: 98.5,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const [workflowTemplates] = useState<WorkflowTemplate[]>([
    {
      id: 'workflow-1',
      name: 'New Student Onboarding',
      category: 'administrative',
      description: 'Complete workflow for registering and orienting new students',
      steps: [
        {
          id: 'step-1',
          name: 'Document Verification',
          type: 'manual',
          description: 'Verify and upload required documents',
          estimatedTime: 15,
          dependencies: [],
        },
        {
          id: 'step-2',
          name: 'System Account Creation',
          type: 'automatic',
          description: 'Create student and parent accounts in system',
          estimatedTime: 2,
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          name: 'Class Assignment',
          type: 'conditional',
          description: 'Assign to appropriate class based on grade and availability',
          estimatedTime: 5,
          dependencies: ['step-2'],
        },
        {
          id: 'step-4',
          name: 'Welcome Communications',
          type: 'automatic',
          description: 'Send welcome emails and platform access information',
          estimatedTime: 1,
          dependencies: ['step-3'],
        },
      ],
      usage: {
        timesUsed: 34,
        averageCompletion: 23,
        successRate: 97.1,
        userRating: 4.7,
      },
      isCustomizable: true,
      isActive: true,
    },
    {
      id: 'workflow-2',
      name: 'Assignment Lifecycle Management',
      category: 'assessment',
      description: 'End-to-end management of assignment creation, distribution, and evaluation',
      steps: [
        {
          id: 'step-1',
          name: 'Assignment Creation',
          type: 'manual',
          description: 'Create assignment with rubrics and deadlines',
          estimatedTime: 20,
          dependencies: [],
        },
        {
          id: 'step-2',
          name: 'Distribution to Students',
          type: 'automatic',
          description: 'Automatically distribute to enrolled students',
          estimatedTime: 1,
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          name: 'Reminder Notifications',
          type: 'automatic',
          description: 'Send automated reminders before deadline',
          estimatedTime: 0,
          dependencies: ['step-2'],
        },
        {
          id: 'step-4',
          name: 'Submission Collection',
          type: 'automatic',
          description: 'Collect and organize student submissions',
          estimatedTime: 2,
          dependencies: ['step-3'],
        },
        {
          id: 'step-5',
          name: 'Initial Auto-Grading',
          type: 'conditional',
          description: 'Apply auto-grading for objective questions',
          estimatedTime: 5,
          dependencies: ['step-4'],
        },
      ],
      usage: {
        timesUsed: 89,
        averageCompletion: 28,
        successRate: 94.4,
        userRating: 4.5,
      },
      isCustomizable: true,
      isActive: true,
    },
  ]);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading automation data
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load automation data:', error);
      showSnackbar('Failed to load automation data');
      setIsLoading(false);
    }
  }, [showSnackbar]);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showRuleModal) {
        setShowRuleModal(false);
        setSelectedRule(null);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showRuleModal]);

  const cleanup = useCallback(() => {
    // Cleanup if needed
  }, []);

  // Initialize screen
  useEffect(() => {
    initializeScreen();
    return cleanup;
  }, [initializeScreen, cleanup]);

  // Setup BackHandler
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Automated Admin Tasks" subtitle="AI-powered task automation" />
      <Appbar.Action icon="chart-box" onPress={() => setActiveTab('analytics')} />
    </Appbar.Header>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <DashboardCard title="🤖 Automation Overview" style={styles.card}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Active Rules</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>23h</Text>
            <Text style={styles.statLabel}>Time Saved Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>97.3%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Running Tasks</Text>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="⚡ Quick Actions" style={styles.card}>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>🔧</Text>
            <Text style={styles.quickActionTitle}>Create New Rule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionTitle}>Run Workflow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionTitle}>View Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionTitle}>Settings</Text>
          </TouchableOpacity>
        </View>
      </DashboardCard>

      <DashboardCard title="🚀 Recent Activity" style={styles.card}>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>✅</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Weekly Grade Reports Completed</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>⏰</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Assignment Reminders Sent</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📧</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Attendance Alerts Processed</Text>
              <Text style={styles.activityTime}>6 hours ago</Text>
            </View>
          </View>
        </View>
      </DashboardCard>
    </ScrollView>
  );

  const renderRulesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Automation Rules</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowRuleModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Rule</Text>
        </TouchableOpacity>
      </View>

      {automationRules.map((rule) => (
        <DashboardCard key={rule.id} style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Text style={styles.ruleDescription}>{rule.description}</Text>
              <View style={styles.ruleMeta}>
                <Text style={[styles.ruleCategory, { backgroundColor: getCategoryColor(rule.category) }]}>
                  {rule.category.toUpperCase()}
                </Text>
                <Text style={[styles.rulePriority, { color: getPriorityColor(rule.priority) }]}>
                  {rule.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Switch
              value={rule.isActive}
              onValueChange={(value) => {
                // Handle rule toggle
                Alert.alert(
                  value ? 'Activate Rule' : 'Deactivate Rule',
                  `Are you sure you want to ${value ? 'activate' : 'deactivate'} "${rule.name}"?`,
                  [
                    { text: 'Cancel' },
                    { text: 'Confirm' }
                  ]
                );
              }}
              trackColor={{ false: LightTheme.SurfaceVariant, true: LightTheme.Primary }}
            />
          </View>

          <View style={styles.rulePerformance}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Executed</Text>
              <Text style={styles.performanceValue}>{rule.performance.executed}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Success Rate</Text>
              <Text style={styles.performanceValue}>
                {((rule.performance.Successful / rule.performance.executed) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Time Saved</Text>
              <Text style={styles.performanceValue}>{Math.round(rule.performance.timeSaved / 60)}h</Text>
            </View>
          </View>

          <View style={styles.ruleActions}>
            <TouchableOpacity 
              style={styles.ruleActionButton}
              onPress={() => {
                setSelectedRule(rule);
                setShowRuleModal(true);
              }}
            >
              <Text style={styles.ruleActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ruleActionButton}>
              <Text style={styles.ruleActionText}>View Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ruleActionButton}>
              <Text style={styles.ruleActionText}>Test Run</Text>
            </TouchableOpacity>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderTasksTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabTitle}>Active Tasks</Text>
      
      {activeTasks.map((task) => (
        <DashboardCard key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={[styles.taskStatus, { backgroundColor: getStatusColor(task.status) }]}>
              {task.status.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.taskDescription}>{task.description}</Text>
          
          <View style={styles.taskProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${task.progress}%`, backgroundColor: getStatusColor(task.status) }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{task.progress}%</Text>
          </View>

          <View style={styles.taskMetrics}>
            <View style={styles.taskMetric}>
              <Text style={styles.metricLabel}>Beneficiaries</Text>
              <Text style={styles.metricValue}>{task.beneficiaries}</Text>
            </View>
            <View style={styles.taskMetric}>
              <Text style={styles.metricLabel}>Time Saved</Text>
              <Text style={styles.metricValue}>{Math.round(task.timeSaved / 60)}h</Text>
            </View>
            <View style={styles.taskMetric}>
              <Text style={styles.metricLabel}>Accuracy</Text>
              <Text style={styles.metricValue}>{task.accuracy}%</Text>
            </View>
            <View style={styles.taskMetric}>
              <Text style={styles.metricLabel}>ETA</Text>
              <Text style={styles.metricValue}>
                {task.status === 'completed' ? 'Done' : 
                 new Date(task.estimatedCompletion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderWorkflowsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Workflow Templates</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New Workflow</Text>
        </TouchableOpacity>
      </View>

      {workflowTemplates.map((workflow) => (
        <DashboardCard key={workflow.id} style={styles.workflowCard}>
          <View style={styles.workflowHeader}>
            <Text style={styles.workflowName}>{workflow.name}</Text>
            <Text style={[styles.workflowCategory, { backgroundColor: getCategoryColor(workflow.category) }]}>
              {workflow.category.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.workflowDescription}>{workflow.description}</Text>
          
          <View style={styles.workflowSteps}>
            <Text style={styles.stepsTitle}>Steps ({workflow.steps.length})</Text>
            {workflow.steps.slice(0, 3).map((step) => (
              <View key={step.id} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{step.id.split('-')[1]}</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepType}>
                    {step.type} • {step.estimatedTime}min
                  </Text>
                </View>
              </View>
            ))}
            {workflow.steps.length > 3 && (
              <Text style={styles.moreSteps}>+{workflow.steps.length - 3} more steps</Text>
            )}
          </View>

          <View style={styles.workflowMetrics}>
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Used</Text>
              <Text style={styles.metricValue}>{workflow.usage.timesUsed}</Text>
            </View>
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Avg Time</Text>
              <Text style={styles.metricValue}>{workflow.usage.averageCompletion}min</Text>
            </View>
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Success</Text>
              <Text style={styles.metricValue}>{workflow.usage.successRate}%</Text>
            </View>
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Rating</Text>
              <Text style={styles.metricValue}>⭐ {workflow.usage.userRating}</Text>
            </View>
          </View>

          <View style={styles.workflowActions}>
            <TouchableOpacity style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>Run Workflow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Customize</Text>
            </TouchableOpacity>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabTitle}>Automation Analytics</Text>
      
      <DashboardCard title="📈 Performance Metrics" style={styles.card}>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>847h</Text>
            <Text style={styles.analyticsLabel}>Total Time Saved</Text>
            <Text style={styles.analyticsChange}>+23% this month</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>94.7%</Text>
            <Text style={styles.analyticsLabel}>Overall Success Rate</Text>
            <Text style={styles.analyticsChange}>+2.1% this month</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>2,389</Text>
            <Text style={styles.analyticsLabel}>Tasks Automated</Text>
            <Text style={styles.analyticsChange}>+156 this week</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>$12,450</Text>
            <Text style={styles.analyticsLabel}>Cost Savings</Text>
            <Text style={styles.analyticsChange}>+18% this month</Text>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="🎯 Category Breakdown" style={styles.card}>
        <View style={styles.categoryBreakdown}>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>Grading & Assessment</Text>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryFill, { width: '75%', backgroundColor: '#4CAF50' }]} />
            </View>
            <Text style={styles.categoryPercent}>75%</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>Communication</Text>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryFill, { width: '68%', backgroundColor: '#2196F3' }]} />
            </View>
            <Text style={styles.categoryPercent}>68%</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>Attendance Tracking</Text>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryFill, { width: '82%', backgroundColor: '#FF9800' }]} />
            </View>
            <Text style={styles.categoryPercent}>82%</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryName}>Reporting</Text>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryFill, { width: '91%', backgroundColor: '#9C27B0' }]} />
            </View>
            <Text style={styles.categoryPercent}>91%</Text>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="⚠️ Error Analysis" style={styles.card}>
        <View style={styles.errorAnalysis}>
          <Text style={styles.errorTitle}>Common Issues</Text>
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>Network Timeout</Text>
            <Text style={styles.errorCount}>12 occurrences</Text>
            <Text style={styles.errorImpact}>Low impact</Text>
          </View>
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>Data Validation</Text>
            <Text style={styles.errorCount}>8 occurrences</Text>
            <Text style={styles.errorImpact}>Medium impact</Text>
          </View>
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>Permission Denied</Text>
            <Text style={styles.errorCount}>3 occurrences</Text>
            <Text style={styles.errorImpact}>High impact</Text>
          </View>
        </View>
      </DashboardCard>
    </ScrollView>
  );

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      attendance: '#FF9800',
      grading: '#4CAF50',
      communication: '#2196F3',
      scheduling: '#9C27B0',
      reporting: '#FF5722',
      assessment: '#607D8B',
      administrative: '#795548',
      analytics: '#E91E63',
    };
    return colors[category] || LightTheme.Primary;
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#FF5722',
      critical: '#F44336',
      urgent: '#F44336',
    };
    return colors[priority] || LightTheme.OnSurface;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#FF9800',
      processing: '#2196F3',
      completed: '#4CAF50',
      failed: '#F44336',
      scheduled: '#9C27B0',
    };
    return colors[status] || LightTheme.Primary;
  };

  const renderModal = () => (
    <Modal
      visible={showRuleModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRuleModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRuleModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {selectedRule ? 'Edit Automation Rule' : 'New Automation Rule'}
          </Text>
          <TouchableOpacity>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSectionTitle}>Rule Details</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Rule Name"
            defaultValue={selectedRule?.name || ''}
          />
          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            placeholder="Description"
            defaultValue={selectedRule?.description || ''}
            multiline
            numberOfLines={3}
          />
          
          <Text style={styles.modalSectionTitle}>Trigger Conditions</Text>
          <View style={styles.modalSection}>
            <Text style={styles.modalInfo}>Configure when this rule should execute</Text>
          </View>
          
          <Text style={styles.modalSectionTitle}>Actions</Text>
          <View style={styles.modalSection}>
            <Text style={styles.modalInfo}>Define what actions should be taken</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
          <Appbar.BackAction onPress={() => onNavigate('back')} />
          <Appbar.Content title="Automated Admin Tasks" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading automation dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {renderAppBar()}

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'rules', label: '⚙️ Rules' },
          { key: 'tasks', label: '📋 Tasks' },
          { key: 'workflows', label: '🔄 Workflows' },
          { key: 'analytics', label: '📈 Analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'rules' && renderRulesTab()}
      {activeTab === 'tasks' && renderTasksTab()}
      {activeTab === 'workflows' && renderWorkflowsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {renderModal()}

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  backButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
  },
  backButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: LightTheme.Primary,
  },
  tabButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: LightTheme.Primary,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.LG,
  },
  tabTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  addButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  addButtonText: {
    color: LightTheme.OnPrimary,
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  card: {
    marginBottom: Spacing.LG,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  statNumber: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  quickActionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.SM,
  },
  quickActionTitle: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  activityList: {
    gap: Spacing.MD,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.SM,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: Spacing.MD,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    marginBottom: Spacing.XS,
  },
  activityTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  ruleCard: {
    marginBottom: Spacing.MD,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  ruleInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  ruleName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  ruleDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  ruleMeta: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  ruleCategory: {
    fontSize: Typography.labelSmall.fontSize,
    color: '#FFFFFF',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontWeight: '600',
    overflow: 'hidden',
  },
  rulePriority: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  rulePerformance: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
    marginTop: Spacing.MD,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  performanceValue: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  ruleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
  },
  ruleActionButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
  },
  ruleActionText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  taskCard: {
    marginBottom: Spacing.MD,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.MD,
  },
  taskStatus: {
    fontSize: Typography.labelSmall.fontSize,
    color: '#FFFFFF',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontWeight: '600',
    overflow: 'hidden',
  },
  taskDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.MD,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  progressText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    minWidth: 40,
  },
  taskMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
  },
  taskMetric: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  metricValue: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  workflowCard: {
    marginBottom: Spacing.MD,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  workflowName: {
    flex: 1,
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.MD,
  },
  workflowCategory: {
    fontSize: Typography.labelSmall.fontSize,
    color: '#FFFFFF',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontWeight: '600',
    overflow: 'hidden',
  },
  workflowDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  workflowSteps: {
    marginBottom: Spacing.MD,
  },
  stepsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: LightTheme.Primary,
    color: LightTheme.OnPrimary,
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    marginRight: Spacing.MD,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    marginBottom: Spacing.XS,
  },
  stepType: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  moreSteps: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.Primary,
    marginTop: Spacing.SM,
    textAlign: 'center',
  },
  workflowMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    marginVertical: Spacing.MD,
  },
  workflowMetric: {
    alignItems: 'center',
  },
  workflowActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  primaryActionText: {
    color: LightTheme.OnPrimary,
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: LightTheme.OnSecondaryContainer,
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '500',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  analyticsNumber: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  analyticsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  analyticsChange: {
    fontSize: Typography.labelSmall.fontSize,
    color: '#4CAF50',
    fontWeight: '500',
  },
  categoryBreakdown: {
    gap: Spacing.MD,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  categoryName: {
    flex: 2,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  categoryBar: {
    flex: 3,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  categoryFill: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  categoryPercent: {
    flex: 1,
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    textAlign: 'right',
  },
  errorAnalysis: {
    gap: Spacing.MD,
  },
  errorTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  errorType: {
    flex: 2,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  errorCount: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  errorImpact: {
    flex: 1,
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.Error,
    textAlign: 'right',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  modalCancel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  modalTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  modalSave: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.LG,
  },
  modalSectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginTop: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Surface,
    marginBottom: Spacing.MD,
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalSection: {
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  modalInfo: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
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
});

export default AutomatedAdminTasksScreen;