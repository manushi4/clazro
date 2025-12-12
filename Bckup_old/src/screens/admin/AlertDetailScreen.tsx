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

// Alert System Interfaces
interface SystemAlert {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'security' | 'financial' | 'academic' | 'operational' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  source: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  tags: string[];
  affectedUsers?: number;
  estimatedImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
  actionsTaken: AlertAction[];
  relatedAlerts: string[];
  escalationLevel: number;
  autoResolved: boolean;
}

interface AlertAction {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  result: string;
  notes?: string;
}

interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedToday: number;
  averageResolutionTime: number;
  escalatedAlerts: number;
  autoResolvedAlerts: number;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isEnabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

// Mock Data
const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    title: 'High Memory Usage Detected',
    description: 'Server memory usage has exceeded 85% threshold for the past 15 minutes',
    category: 'performance',
    severity: 'high',
    status: 'active',
    source: 'System Monitor',
    sourceId: 'server-01',
    createdAt: '2025-09-03T10:45:00Z',
    updatedAt: '2025-09-03T10:45:00Z',
    assignedTo: 'DevOps Team',
    tags: ['memory', 'performance', 'server'],
    affectedUsers: 1200,
    estimatedImpact: 'significant',
    actionsTaken: [
      {
        id: '1',
        action: 'Memory usage investigation started',
        performedBy: 'System',
        performedAt: '2025-09-03T10:45:00Z',
        result: 'Automated monitoring activated',
      },
    ],
    relatedAlerts: ['2', '3'],
    escalationLevel: 1,
    autoResolved: false,
  },
  {
    id: '2',
    title: 'Course Completion Rate Below Target',
    description: 'Mathematics course completion rate has dropped to 82%, below the 90% target',
    category: 'academic',
    severity: 'medium',
    status: 'acknowledged',
    source: 'Academic Analytics',
    sourceId: 'course-math-101',
    createdAt: '2025-09-03T08:30:00Z',
    updatedAt: '2025-09-03T09:15:00Z',
    assignedTo: 'Academic Team Lead',
    tags: ['completion', 'mathematics', 'academic'],
    affectedUsers: 450,
    estimatedImpact: 'moderate',
    actionsTaken: [
      {
        id: '1',
        action: 'Alert acknowledged and assigned',
        performedBy: 'Dr. Sarah Wilson',
        performedAt: '2025-09-03T09:15:00Z',
        result: 'Investigation team formed',
        notes: 'Will analyze course difficulty and student support needs',
      },
    ],
    relatedAlerts: [],
    escalationLevel: 0,
    autoResolved: false,
  },
  {
    id: '3',
    title: 'Unusual Login Pattern Detected',
    description: 'Multiple failed login attempts from unusual geographic locations',
    category: 'security',
    severity: 'critical',
    status: 'resolved',
    source: 'Security Monitor',
    sourceId: 'auth-service',
    createdAt: '2025-09-03T02:15:00Z',
    updatedAt: '2025-09-03T02:45:00Z',
    assignedTo: 'Security Team',
    resolvedAt: '2025-09-03T02:45:00Z',
    resolvedBy: 'Security Admin',
    tags: ['security', 'login', 'suspicious'],
    affectedUsers: 5,
    estimatedImpact: 'minimal',
    actionsTaken: [
      {
        id: '1',
        action: 'IP addresses blocked',
        performedBy: 'Security System',
        performedAt: '2025-09-03T02:20:00Z',
        result: 'Threats neutralized',
      },
      {
        id: '2',
        action: 'User accounts secured',
        performedBy: 'Security Admin',
        performedAt: '2025-09-03T02:30:00Z',
        result: 'Passwords reset for affected accounts',
        notes: 'Users notified via secure email',
      },
    ],
    relatedAlerts: [],
    escalationLevel: 2,
    autoResolved: false,
  },
  {
    id: '4',
    title: 'Revenue Target Shortfall Alert',
    description: 'Monthly revenue is tracking 12% below target with 5 days remaining',
    category: 'financial',
    severity: 'high',
    status: 'active',
    source: 'Financial Analytics',
    sourceId: 'revenue-tracker',
    createdAt: '2025-09-03T07:00:00Z',
    updatedAt: '2025-09-03T07:00:00Z',
    assignedTo: 'Finance Director',
    tags: ['revenue', 'financial', 'target'],
    estimatedImpact: 'significant',
    actionsTaken: [],
    relatedAlerts: [],
    escalationLevel: 1,
    autoResolved: false,
  },
  {
    id: '5',
    title: 'Database Connection Pool Exhausted',
    description: 'Database connection pool reached maximum capacity, new connections failing',
    category: 'system',
    severity: 'critical',
    status: 'resolved',
    source: 'Database Monitor',
    sourceId: 'db-primary',
    createdAt: '2025-09-03T01:20:00Z',
    updatedAt: '2025-09-03T01:35:00Z',
    resolvedAt: '2025-09-03T01:35:00Z',
    resolvedBy: 'Auto-healing System',
    tags: ['database', 'connections', 'system'],
    affectedUsers: 2000,
    estimatedImpact: 'severe',
    actionsTaken: [
      {
        id: '1',
        action: 'Connection pool automatically increased',
        performedBy: 'Auto-healing System',
        performedAt: '2025-09-03T01:25:00Z',
        result: 'Service restored',
      },
    ],
    relatedAlerts: [],
    escalationLevel: 0,
    autoResolved: true,
  },
];

const mockAlertMetrics: AlertMetrics = {
  totalAlerts: 147,
  activeAlerts: 23,
  resolvedToday: 18,
  averageResolutionTime: 45, // minutes
  escalatedAlerts: 5,
  autoResolvedAlerts: 12,
};

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'High Memory Usage',
    description: 'Triggers when memory usage exceeds 85% for 10 minutes',
    condition: 'memory_usage > 85% for 10min',
    threshold: 85,
    severity: 'high',
    isEnabled: true,
    lastTriggered: '2025-09-03T10:45:00Z',
    triggerCount: 3,
  },
  {
    id: '2',
    name: 'Course Completion Rate',
    description: 'Alerts when course completion drops below 90%',
    condition: 'completion_rate < 90%',
    threshold: 90,
    severity: 'medium',
    isEnabled: true,
    lastTriggered: '2025-09-03T08:30:00Z',
    triggerCount: 1,
  },
  {
    id: '3',
    name: 'Failed Login Attempts',
    description: 'Detects suspicious login patterns',
    condition: 'failed_logins > 5 from same IP in 1min',
    threshold: 5,
    severity: 'critical',
    isEnabled: true,
    lastTriggered: '2025-09-03T02:15:00Z',
    triggerCount: 7,
  },
];

const AlertDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'metrics' | 'rules' | 'insights'>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockSystemAlerts);
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics>(mockAlertMetrics);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(mockAlertRules);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // If route params contain a specific alert ID, select it
    if (route?.params?.alertId) {
      const alert = alerts.find(a => a.id === route.params.alertId);
      if (alert) {
        setSelectedAlert(alert);
      }
    }
  }, [route?.params?.alertId, alerts]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return LightTheme.OnSurface;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444';
      case 'acknowledged': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'suppressed': return '#6B7280';
      default: return LightTheme.OnSurface;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '⚡';
      case 'security': return '🔒';
      case 'financial': return '💰';
      case 'academic': return '📚';
      case 'operational': return '⚙️';
      case 'system': return '🖥️';
      default: return '⚠️';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleAlertAction = (alertId: string, action: 'acknowledge' | 'resolve' | 'suppress' | 'escalate') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setAlerts(prev => prev.map(alert => {
              if (alert.id === alertId) {
                const newAction: AlertAction = {
                  id: Date.now().toString(),
                  action: `Alert ${action}d`,
                  performedBy: 'Current User',
                  performedAt: new Date().toISOString(),
                  result: `Status changed to ${action}d`,
                };
                
                return {
                  ...alert,
                  status: action === 'acknowledge' ? 'acknowledged' : 
                          action === 'resolve' ? 'resolved' : 
                          action === 'suppress' ? 'suppressed' : alert.status,
                  updatedAt: new Date().toISOString(),
                  resolvedAt: action === 'resolve' ? new Date().toISOString() : alert.resolvedAt,
                  resolvedBy: action === 'resolve' ? 'Current User' : alert.resolvedBy,
                  escalationLevel: action === 'escalate' ? alert.escalationLevel + 1 : alert.escalationLevel,
                  actionsTaken: [...alert.actionsTaken, newAction],
                };
              }
              return alert;
            }));
            
            if (selectedAlert && selectedAlert.id === alertId) {
              const updatedAlert = alerts.find(a => a.id === alertId);
              if (updatedAlert) {
                setSelectedAlert(updatedAlert);
              }
            }
            
            Alert.alert('success', `Alert has been ${action}d successfully`);
          }
        }
      ]
    );
  };

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const renderAlertsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Alert Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Severity:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'low', 'medium', 'high', 'critical'].map((severity) => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.filterChip,
                  filterSeverity === severity && styles.filterChipActive,
                  filterSeverity === severity && { backgroundColor: getSeverityColor(severity) }
                ]}
                onPress={() => setFilterSeverity(severity)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterSeverity === severity && styles.filterChipTextActive
                ]}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'active', 'acknowledged', 'resolved', 'suppressed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive,
                  filterStatus === status && { backgroundColor: getStatusColor(status) }
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Alerts List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚨 System Alerts ({filteredAlerts.length})</Text>
        {filteredAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertItem,
              selectedAlert?.id === alert.id && styles.alertItemSelected
            ]}
            onPress={() => setSelectedAlert(alert)}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertIcon}>{getCategoryIcon(alert.category)}</Text>
                <View style={styles.alertTitleSection}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription} numberOfLines={2}>
                    {alert.description}
                  </Text>
                </View>
                <View style={styles.alertBadges}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                    <Text style={styles.badgeText}>{alert.severity.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) }]}>
                    <Text style={styles.badgeText}>{alert.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.alertMeta}>
                <Text style={styles.alertTime}>{formatTimeAgo(alert.createdAt)}</Text>
                <Text style={styles.alertSource}>from {alert.source}</Text>
                {alert.affectedUsers && (
                  <Text style={styles.alertUsers}>👥 {alert.affectedUsers} users affected</Text>
                )}
              </View>
            </View>
            
            {alert.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {alert.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Alert Details */}
      {selectedAlert && (
        <View style={styles.card}>
          <View style={styles.detailHeader}>
            <Text style={styles.cardTitle}>🔍 Alert Details</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setSelectedAlert(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.alertDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Alert ID:</Text>
              <Text style={styles.detailValue}>{selectedAlert.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>
                {getCategoryIcon(selectedAlert.category)} {selectedAlert.category}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Source:</Text>
              <Text style={styles.detailValue}>{selectedAlert.source} ({selectedAlert.sourceId})</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>{new Date(selectedAlert.createdAt).toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Updated:</Text>
              <Text style={styles.detailValue}>{new Date(selectedAlert.updatedAt).toLocaleString()}</Text>
            </View>
            {selectedAlert.assignedTo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned to:</Text>
                <Text style={styles.detailValue}>{selectedAlert.assignedTo}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Impact:</Text>
              <Text style={[styles.detailValue, { 
                color: selectedAlert.estimatedImpact === 'severe' ? '#DC2626' : 
                       selectedAlert.estimatedImpact === 'significant' ? '#EF4444' :
                       selectedAlert.estimatedImpact === 'moderate' ? '#F59E0B' : '#10B981'
              }]}>
                {selectedAlert.estimatedImpact}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Escalation Level:</Text>
              <Text style={styles.detailValue}>{selectedAlert.escalationLevel}</Text>
            </View>
          </View>

          {/* Actions Taken */}
          {selectedAlert.actionsTaken.length > 0 && (
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>📋 Actions Taken</Text>
              {selectedAlert.actionsTaken.map((action, index) => (
                <View key={action.id} style={styles.actionItem}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionTitle}>{action.action}</Text>
                    <Text style={styles.actionTime}>{formatTimeAgo(action.performedAt)}</Text>
                  </View>
                  <Text style={styles.actionPerformer}>by {action.performedBy}</Text>
                  <Text style={styles.actionResult}>Result: {action.result}</Text>
                  {action.notes && (
                    <Text style={styles.actionNotes}>Notes: {action.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {selectedAlert.status === 'active' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleAlertAction(selectedAlert.id, 'acknowledge')}
              >
                <Text style={styles.actionButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
            {(selectedAlert.status === 'active' || selectedAlert.status === 'acknowledged') && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleAlertAction(selectedAlert.id, 'resolve')}
              >
                <Text style={styles.actionButtonText}>Resolve</Text>
              </TouchableOpacity>
            )}
            {selectedAlert.status !== 'suppressed' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                onPress={() => handleAlertAction(selectedAlert.id, 'suppress')}
              >
                <Text style={styles.actionButtonText}>Suppress</Text>
              </TouchableOpacity>
            )}
            {selectedAlert.escalationLevel < 3 && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                onPress={() => handleAlertAction(selectedAlert.id, 'escalate')}
              >
                <Text style={styles.actionButtonText}>Escalate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderMetricsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Alert Metrics Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{alertMetrics.totalAlerts}</Text>
            <Text style={styles.metricLabel}>Total Alerts</Text>
            <Text style={styles.metricSubtext}>Last 30 days</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{alertMetrics.activeAlerts}</Text>
            <Text style={styles.metricLabel}>Active Alerts</Text>
            <Text style={styles.metricSubtext}>Require attention</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{alertMetrics.resolvedToday}</Text>
            <Text style={styles.metricLabel}>Resolved Today</Text>
            <Text style={styles.metricSubtext}>Good progress</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{alertMetrics.averageResolutionTime}m</Text>
            <Text style={styles.metricLabel}>Avg Resolution</Text>
            <Text style={styles.metricSubtext}>Response time</Text>
          </View>
        </View>

        <View style={styles.additionalMetrics}>
          <View style={styles.additionalMetric}>
            <Text style={styles.additionalMetricLabel}>Escalated Alerts:</Text>
            <Text style={[styles.additionalMetricValue, { color: '#F59E0B' }]}>
              {alertMetrics.escalatedAlerts}
            </Text>
          </View>
          <View style={styles.additionalMetric}>
            <Text style={styles.additionalMetricLabel}>Auto-Resolved:</Text>
            <Text style={[styles.additionalMetricValue, { color: '#10B981' }]}>
              {alertMetrics.autoResolvedAlerts}
            </Text>
          </View>
        </View>
      </View>

      {/* Alert Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Alert Distribution by Category</Text>
        <View style={styles.distributionChart}>
          {['performance', 'security', 'financial', 'academic', 'operational', 'system'].map((category) => {
            const categoryAlerts = alerts.filter(a => a.category === category);
            const percentage = (categoryAlerts.length / alerts.length) * 100;
            
            return (
              <View key={category} style={styles.distributionItem}>
                <View style={styles.distributionLabelRow}>
                  <Text style={styles.distributionIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.distributionLabel}>{category}</Text>
                  <Text style={styles.distributionCount}>({categoryAlerts.length})</Text>
                </View>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: getSeverityColor(
                          categoryAlerts.length > 0 ? categoryAlerts[0].severity : 'low'
                        )
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionPercentage}>{percentage.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  const renderRulesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.rulesHeader}>
          <Text style={styles.cardTitle}>⚙️ Alert Rules Configuration</Text>
          <TouchableOpacity style={styles.addRuleButton}>
            <Text style={styles.addRuleButtonText}>+ Add Rule</Text>
          </TouchableOpacity>
        </View>
        
        {alertRules.map((rule) => (
          <View key={rule.id} style={styles.ruleItem}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleTitleSection}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                <Text style={styles.ruleDescription}>{rule.description}</Text>
              </View>
              <View style={styles.ruleControls}>
                <View style={[
                  styles.ruleStatus,
                  { backgroundColor: rule.isEnabled ? '#10B981' : '#6B7280' }
                ]}>
                  <Text style={styles.ruleStatusText}>
                    {rule.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.ruleEditButton}>
                  <Text style={styles.ruleEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.ruleDetails}>
              <View style={styles.ruleDetailRow}>
                <Text style={styles.ruleDetailLabel}>Condition:</Text>
                <Text style={styles.ruleDetailValue}>{rule.condition}</Text>
              </View>
              <View style={styles.ruleDetailRow}>
                <Text style={styles.ruleDetailLabel}>Threshold:</Text>
                <Text style={styles.ruleDetailValue}>{rule.threshold}</Text>
              </View>
              <View style={styles.ruleDetailRow}>
                <Text style={styles.ruleDetailLabel}>Severity:</Text>
                <Text style={[
                  styles.ruleDetailValue,
                  { color: getSeverityColor(rule.severity) }
                ]}>
                  {rule.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.ruleDetailRow}>
                <Text style={styles.ruleDetailLabel}>Trigger Count:</Text>
                <Text style={styles.ruleDetailValue}>{rule.triggerCount}</Text>
              </View>
              {rule.lastTriggered && (
                <View style={styles.ruleDetailRow}>
                  <Text style={styles.ruleDetailLabel}>Last Triggered:</Text>
                  <Text style={styles.ruleDetailValue}>
                    {formatTimeAgo(rule.lastTriggered)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Alert Intelligence & Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🎯 Alert Trends</Text>
          <Text style={styles.insightContent}>
            Alert volume has increased by 23% compared to last month, primarily driven by performance 
            and system alerts. The auto-resolution rate of 67% indicates effective automated responses.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>⚠️ Critical Patterns</Text>
          <Text style={styles.insightContent}>
            Memory usage alerts are occurring with increasing frequency, suggesting potential 
            infrastructure scaling needs. Security alerts show a 15% decrease, indicating improved 
            threat detection and prevention measures.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>📊 Performance Analysis</Text>
          <Text style={styles.insightContent}>
            Average resolution time of 45 minutes is within SLA targets. However, escalated alerts 
            take 3x longer to resolve, suggesting need for better first-level response procedures.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🔮 Predictive Insights</Text>
          <Text style={styles.insightContent}>
            Based on current trends, we predict a 15% increase in performance alerts next month. 
            Proactive capacity planning and monitoring threshold adjustments are recommended.
          </Text>
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>🚀 Recommendations</Text>
          <View style={styles.recommendationsList}>
            <Text style={styles.recommendation}>
              • Implement proactive monitoring for memory usage patterns
            </Text>
            <Text style={styles.recommendation}>
              • Enhance automated response procedures for common alerts
            </Text>
            <Text style={styles.recommendation}>
              • Review and optimize alert rule thresholds based on false positive rates
            </Text>
            <Text style={styles.recommendation}>
              • Establish dedicated response teams for critical system alerts
            </Text>
            <Text style={styles.recommendation}>
              • Implement alert correlation to reduce noise and improve signal quality
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
          <Text style={styles.headerTitle}>Alert Management</Text>
          <Text style={styles.headerSubtitle}>Early Warning & Response System</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStat}>
            🔴 {alertMetrics.activeAlerts} Active
          </Text>
          <Text style={styles.headerStat}>
            ✅ {alertMetrics.resolvedToday} Resolved Today
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'alerts', label: '🚨 Alerts' },
            { key: 'metrics', label: '📊 Metrics' },
            { key: 'rules', label: '⚙️ Rules' },
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
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'metrics' && renderMetricsTab()}
      {activeTab === 'rules' && renderRulesTab()}
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
  headerStats: {
    alignItems: 'flex-end',
    gap: Spacing.XS,
  },
  headerStat: {
    ...Typography.bodySmall,
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
  filtersContainer: {
    marginBottom: Spacing.MD,
    gap: Spacing.MD,
  },
  filterGroup: {
    gap: Spacing.SM,
  },
  filterLabel: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  filterChip: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.FULL,
    marginRight: Spacing.SM,
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
  },
  filterChipText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  alertItem: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    paddingVertical: Spacing.MD,
  },
  alertItemSelected: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.MD,
    borderBottomWidth: 0,
    marginVertical: Spacing.XS,
  },
  alertHeader: {
    marginBottom: Spacing.SM,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    marginTop: Spacing.XS,
  },
  alertTitleSection: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  alertTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  alertDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
  },
  alertBadges: {
    alignItems: 'flex-end',
    gap: Spacing.XS,
  },
  severityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  badgeText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  alertMeta: {
    flexDirection: 'row',
    gap: Spacing.MD,
    alignItems: 'center',
  },
  alertTime: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  alertSource: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  alertUsers: {
    ...Typography.bodySmall,
    color: '#EF4444',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
    marginTop: Spacing.SM,
  },
  tag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  tagText: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontSize: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
  },
  alertDetails: {
    gap: Spacing.SM,
    marginBottom: Spacing.LG,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  actionItem: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  actionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  actionTime: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  actionPerformer: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    marginBottom: Spacing.XS,
  },
  actionResult: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  actionNotes: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    minWidth: isTablet ? '20%' : '40%',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
    marginBottom: Spacing.LG,
  },
  metricCard: {
    flex: 1,
    minWidth: isTablet ? '20%' : '45%',
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  metricValue: {
    ...Typography.displayMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  metricLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    marginBottom: Spacing.XS,
    textAlign: 'center',
  },
  metricSubtext: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontSize: 10,
    textAlign: 'center',
  },
  additionalMetrics: {
    gap: Spacing.MD,
  },
  additionalMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  additionalMetricLabel: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
  },
  additionalMetricValue: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
  },
  distributionChart: {
    gap: Spacing.MD,
  },
  distributionItem: {
    gap: Spacing.SM,
  },
  distributionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  distributionIcon: {
    fontSize: 16,
  },
  distributionLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    flex: 1,
    textTransform: 'capitalize',
  },
  distributionCount: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  distributionBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionPercentage: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'right',
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  addRuleButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#7C3AED',
    borderRadius: BorderRadius.MD,
  },
  addRuleButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ruleItem: {
    backgroundColor: '#F8F9FF',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  ruleTitleSection: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  ruleName: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  ruleDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  ruleControls: {
    alignItems: 'flex-end',
    gap: Spacing.SM,
  },
  ruleStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  ruleStatusText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  ruleEditButton: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.SM,
  },
  ruleEditText: {
    ...Typography.bodySmall,
    color: '#7C3AED',
    fontWeight: '500',
  },
  ruleDetails: {
    gap: Spacing.SM,
  },
  ruleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleDetailLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  ruleDetailValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
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

export default AlertDetailScreen;