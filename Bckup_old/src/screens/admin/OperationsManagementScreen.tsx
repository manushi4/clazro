/**
 * OperationsManagementScreen - Phase 41: Operations & Compliance Management
 * Operational Excellence Platform with Workflow Automation
 * Process optimization, resource allocation, incident management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Switch,
} from 'react-native';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface OperationsManagementScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

interface OperationalMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface WorkflowProcess {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  automationLevel: number;
  efficiency: number;
  lastRun: Date;
  nextRun: Date;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: Date;
  resolvedAt?: Date;
}

interface ResourceAllocation {
  id: string;
  resource: string;
  allocated: number;
  capacity: number;
  utilization: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
}

const OperationsManagementScreen: React.FC<OperationsManagementScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'incidents' | 'resources'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const handleBackNavigation = () => {
    onNavigate('back');
  };

  // Mock operational data
  const operationalMetrics: OperationalMetric[] = [
    {
      id: '1',
      title: 'System Uptime',
      value: '99.97%',
      change: '+0.02%',
      changeType: 'increase',
      icon: '⚡',
      status: 'excellent',
    },
    {
      id: '2',
      title: 'Process Automation',
      value: '73%',
      change: '+12%',
      changeType: 'increase',
      icon: '🤖',
      status: 'good',
    },
    {
      id: '3',
      title: 'Resource Utilization',
      value: '87%',
      change: '+5%',
      changeType: 'increase',
      icon: '📊',
      status: 'warning',
    },
    {
      id: '4',
      title: 'Incident Response',
      value: '2.3h',
      change: '-45min',
      changeType: 'decrease',
      icon: '🚨',
      status: 'good',
    },
  ];

  const workflowProcesses: WorkflowProcess[] = [
    {
      id: '1',
      name: 'Student Enrollment',
      description: 'Automated student registration and onboarding process',
      status: 'active',
      automationLevel: 85,
      efficiency: 92,
      lastRun: new Date('2025-03-03T08:00:00'),
      nextRun: new Date('2025-03-04T08:00:00'),
    },
    {
      id: '2',
      name: 'Payment Processing',
      description: 'Automated fee collection and invoice generation',
      status: 'active',
      automationLevel: 95,
      efficiency: 98,
      lastRun: new Date('2025-03-03T12:00:00'),
      nextRun: new Date('2025-03-03T18:00:00'),
    },
    {
      id: '3',
      name: 'Performance Reports',
      description: 'Weekly academic performance report generation',
      status: 'paused',
      automationLevel: 70,
      efficiency: 78,
      lastRun: new Date('2025-02-28T09:00:00'),
      nextRun: new Date('2025-03-07T09:00:00'),
    },
  ];

  const incidents: Incident[] = [
    {
      id: '1',
      title: 'Database Connection Timeout',
      description: 'Intermittent database connection issues affecting user login',
      severity: 'high',
      status: 'investigating',
      assignedTo: 'DevOps Team',
      createdAt: new Date('2025-03-03T10:30:00'),
    },
    {
      id: '2',
      title: 'Payment Gateway Delay',
      description: 'Slower response times from primary payment gateway',
      severity: 'medium',
      status: 'resolved',
      assignedTo: 'Finance Team',
      createdAt: new Date('2025-03-02T14:15:00'),
      resolvedAt: new Date('2025-03-02T16:45:00'),
    },
    {
      id: '3',
      title: 'Mobile App Crash',
      description: 'App crashes on specific Android versions during video playback',
      severity: 'critical',
      status: 'open',
      assignedTo: 'Mobile Team',
      createdAt: new Date('2025-03-03T09:00:00'),
    },
  ];

  const resourceAllocations: ResourceAllocation[] = [
    {
      id: '1',
      resource: 'Server Infrastructure',
      allocated: 45,
      capacity: 60,
      utilization: 75,
      cost: 12500,
      trend: 'up',
    },
    {
      id: '2',
      resource: 'Teaching Staff',
      allocated: 28,
      capacity: 32,
      utilization: 88,
      cost: 89600,
      trend: 'stable',
    },
    {
      id: '3',
      resource: 'Support Staff',
      allocated: 12,
      capacity: 15,
      utilization: 80,
      cost: 24000,
      trend: 'down',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'draft': return '#9E9E9E';
      case 'open': return '#F44336';
      case 'investigating': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#FFC107';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('back')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Operations Management</Text>
          <Text style={styles.headerSubtitle}>Operational Excellence & Process Optimization</Text>
        </View>
        <View style={styles.refreshContainer}>
          <Text style={styles.refreshLabel}>Auto Refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
            thumbColor={autoRefresh ? LightTheme.OnPrimary : LightTheme.OnSurface}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      {([
        { key: 'overview', label: 'Overview', icon: '📊' },
        { key: 'workflows', label: 'Workflows', icon: '⚙️' },
        { key: 'incidents', label: 'Incidents', icon: '🚨' },
        { key: 'resources', label: 'Resources', icon: '📋' },
      ] as const).map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.tabActive
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabText,
            activeTab === tab.key && styles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.metricsGrid}>
        {operationalMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricIcon}>{metric.icon}</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(metric.status) }
              ]} />
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            <View style={styles.metricChangeContainer}>
              <Text style={[
                styles.metricChange,
                metric.changeType === 'increase' ? styles.metricIncrease :
                metric.changeType === 'decrease' ? styles.metricDecrease :
                styles.metricNeutral
              ]}>
                {metric.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('compliance-audit')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Compliance Audit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('strategic-planning')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionText}>Strategic Planning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('workflow-builder')}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionText}>Workflow Builder</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('risk-assessment')}
          >
            <Text style={styles.actionIcon}>⚖️</Text>
            <Text style={styles.actionText}>Risk Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWorkflows = () => (
    <View style={styles.workflowsContainer}>
      {workflowProcesses.map((workflow) => (
        <View key={workflow.id} style={styles.workflowCard}>
          <View style={styles.workflowHeader}>
            <View style={styles.workflowInfo}>
              <Text style={styles.workflowName}>{workflow.name}</Text>
              <Text style={styles.workflowDescription}>{workflow.description}</Text>
            </View>
            <View style={[
              styles.workflowStatus,
              { backgroundColor: getStatusColor(workflow.status) + '20' }
            ]}>
              <Text style={[
                styles.workflowStatusText,
                { color: getStatusColor(workflow.status) }
              ]}>
                {workflow.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.workflowMetrics}>
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Automation</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${workflow.automationLevel}%`,
                    backgroundColor: workflow.automationLevel > 80 ? '#4CAF50' : 
                                   workflow.automationLevel > 60 ? '#FF9800' : '#F44336'
                  }
                ]} />
              </View>
              <Text style={styles.progressText}>{workflow.automationLevel}%</Text>
            </View>
            
            <View style={styles.workflowMetric}>
              <Text style={styles.metricLabel}>Efficiency</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${workflow.efficiency}%`,
                    backgroundColor: workflow.efficiency > 90 ? '#4CAF50' : 
                                   workflow.efficiency > 75 ? '#FF9800' : '#F44336'
                  }
                ]} />
              </View>
              <Text style={styles.progressText}>{workflow.efficiency}%</Text>
            </View>
          </View>
          
          <View style={styles.workflowSchedule}>
            <Text style={styles.scheduleText}>
              Last Run: {workflow.lastRun.toLocaleDateString()} at {workflow.lastRun.toLocaleTimeString()}
            </Text>
            <Text style={styles.scheduleText}>
              Next Run: {workflow.nextRun.toLocaleDateString()} at {workflow.nextRun.toLocaleTimeString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderIncidents = () => (
    <View style={styles.incidentsContainer}>
      {incidents.map((incident) => (
        <View key={incident.id} style={styles.incidentCard}>
          <View style={styles.incidentHeader}>
            <View style={styles.incidentInfo}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>
              <Text style={styles.incidentDescription}>{incident.description}</Text>
            </View>
            <View style={styles.incidentTags}>
              <View style={[
                styles.severityTag,
                { backgroundColor: getSeverityColor(incident.severity) + '20' }
              ]}>
                <Text style={[
                  styles.severityText,
                  { color: getSeverityColor(incident.severity) }
                ]}>
                  {incident.severity}
                </Text>
              </View>
              <View style={[
                styles.statusTag,
                { backgroundColor: getStatusColor(incident.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(incident.status) }
                ]}>
                  {incident.status}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.incidentDetails}>
            <Text style={styles.incidentAssigned}>Assigned to: {incident.assignedTo}</Text>
            <Text style={styles.incidentTime}>
              Created: {incident.createdAt.toLocaleDateString()} at {incident.createdAt.toLocaleTimeString()}
            </Text>
            {incident.resolvedAt && (
              <Text style={styles.incidentTime}>
                Resolved: {incident.resolvedAt.toLocaleDateString()} at {incident.resolvedAt.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderResources = () => (
    <View style={styles.resourcesContainer}>
      {resourceAllocations.map((resource) => (
        <View key={resource.id} style={styles.resourceCard}>
          <View style={styles.resourceHeader}>
            <Text style={styles.resourceName}>{resource.resource}</Text>
            <View style={styles.resourceTrend}>
              <Text style={styles.trendIcon}>
                {resource.trend === 'up' ? '↗️' : resource.trend === 'down' ? '↘️' : '➡️'}
              </Text>
              <Text style={styles.resourceCost}>${resource.cost.toLocaleString()}/mo</Text>
            </View>
          </View>
          
          <View style={styles.resourceMetrics}>
            <View style={styles.resourceAllocation}>
              <Text style={styles.allocationLabel}>Allocation</Text>
              <Text style={styles.allocationValue}>{resource.allocated}/{resource.capacity}</Text>
              <View style={styles.allocationBar}>
                <View style={[
                  styles.allocationFill,
                  { 
                    width: `${(resource.allocated / resource.capacity) * 100}%`,
                    backgroundColor: resource.utilization > 90 ? '#F44336' : 
                                   resource.utilization > 75 ? '#FF9800' : '#4CAF50'
                  }
                ]} />
              </View>
            </View>
            
            <View style={styles.utilizationMetric}>
              <Text style={styles.utilizationLabel}>Utilization</Text>
              <Text style={styles.utilizationValue}>{resource.utilization}%</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabSelector()}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'resources' && renderResources()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    backgroundColor: LightTheme.Primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.LG,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  backButtonText: {
    fontSize: 24,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnPrimary,
    opacity: 0.8,
  },
  refreshContainer: {
    alignItems: 'center',
  },
  refreshLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnPrimary,
    marginBottom: Spacing.XS,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    margin: Spacing.MD,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: LightTheme.Primary,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: Spacing.MD,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.XS,
    marginBottom: Spacing.LG,
  },
  metricCard: {
    width: (width - Spacing.MD * 2 - Spacing.XS * 2) / 2,
    backgroundColor: LightTheme.Surface,
    margin: Spacing.XS,
    padding: Spacing.LG,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  metricIcon: {
    fontSize: 24,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  metricTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  metricChangeContainer: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  metricChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
  },
  metricIncrease: {
    color: '#4CAF50',
  },
  metricDecrease: {
    color: '#F44336',
  },
  metricNeutral: {
    color: LightTheme.OnSurfaceVariant,
  },
  quickActions: {
    marginTop: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.XS,
  },
  actionButton: {
    width: (width - Spacing.MD * 2 - Spacing.XS * 2) / 2,
    backgroundColor: LightTheme.Surface,
    margin: Spacing.XS,
    padding: Spacing.LG,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  actionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  workflowsContainer: {
    padding: Spacing.MD,
  },
  workflowCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
  },
  workflowInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  workflowName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  workflowDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  workflowStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  workflowStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workflowMetrics: {
    marginBottom: Spacing.LG,
  },
  workflowMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    marginHorizontal: Spacing.SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  workflowSchedule: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingTop: Spacing.SM,
  },
  scheduleText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  incidentsContainer: {
    padding: Spacing.MD,
  },
  incidentCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  incidentInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  incidentTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  incidentDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  incidentTags: {
    alignItems: 'flex-end',
  },
  severityTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    marginBottom: Spacing.XS,
  },
  severityText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  incidentDetails: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingTop: Spacing.SM,
  },
  incidentAssigned: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  incidentTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  resourcesContainer: {
    padding: Spacing.MD,
  },
  resourceCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  resourceName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  resourceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  resourceCost: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  resourceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceAllocation: {
    flex: 1,
    marginRight: Spacing.LG,
  },
  allocationLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  allocationValue: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  allocationBar: {
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
  },
  allocationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationMetric: {
    alignItems: 'center',
  },
  utilizationLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  utilizationValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
});

export default OperationsManagementScreen;