import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';

interface ComplianceRule {
  id: string;
  title: string;
  category: 'academic' | 'financial' | 'operational' | 'legal';
  status: 'compliant' | 'non_compliant' | 'pending' | 'requires_attention';
  lastChecked: string;
  nextDue: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actions: ComplianceAction[];
}

interface ComplianceAction {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface AuditTrail {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  category: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
}

interface ComplianceMetrics {
  overallScore: number;
  totalRules: number;
  compliantRules: number;
  pendingActions: number;
  criticalIssues: number;
  trendsData: { month: string; score: number }[];
}

interface ComplianceAuditScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ComplianceAuditScreen({ onNavigate }: ComplianceAuditScreenProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'actions' | 'audit'>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [complianceActions, setComplianceActions] = useState<ComplianceAction[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    overallScore: 0,
    totalRules: 0,
    compliantRules: 0,
    pendingActions: 0,
    criticalIssues: 0,
    trendsData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
    
    if (autoRefresh) {
      const interval = setInterval(loadComplianceData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      const mockRules: ComplianceRule[] = [
        {
          id: 'CR001',
          title: 'Student Data Privacy (COPPA)',
          category: 'legal',
          status: 'compliant',
          lastChecked: '2025-09-01',
          nextDue: '2025-12-01',
          riskLevel: 'high',
          description: 'Compliance with Children\'s Online Privacy Protection Act',
          actions: []
        },
        {
          id: 'CR002',
          title: 'Financial Record Keeping',
          category: 'financial',
          status: 'requires_attention',
          lastChecked: '2025-08-28',
          nextDue: '2025-09-15',
          riskLevel: 'medium',
          description: 'Proper documentation and storage of financial transactions',
          actions: [
            {
              id: 'CA001',
              title: 'Update quarterly financial reports',
              priority: 'high',
              dueDate: '2025-09-15',
              assignedTo: 'Finance Team',
              status: 'pending'
            }
          ]
        },
        {
          id: 'CR003',
          title: 'Academic Standards Alignment',
          category: 'academic',
          status: 'compliant',
          lastChecked: '2025-09-02',
          nextDue: '2025-10-01',
          riskLevel: 'low',
          description: 'Curriculum alignment with state educational standards',
          actions: []
        },
        {
          id: 'CR004',
          title: 'Operational Safety Protocols',
          category: 'operational',
          status: 'non_compliant',
          lastChecked: '2025-08-25',
          nextDue: '2025-09-10',
          riskLevel: 'critical',
          description: 'Safety procedures and emergency response protocols',
          actions: [
            {
              id: 'CA002',
              title: 'Conduct fire drill training',
              priority: 'high',
              dueDate: '2025-09-10',
              assignedTo: 'Operations Manager',
              status: 'in_progress'
            },
            {
              id: 'CA003',
              title: 'Update emergency contact system',
              priority: 'medium',
              dueDate: '2025-09-12',
              assignedTo: 'IT Team',
              status: 'pending'
            }
          ]
        }
      ];

      const mockActions: ComplianceAction[] = mockRules.flatMap(rule => rule.actions);

      const mockAuditTrail: AuditTrail[] = [
        {
          id: 'AT001',
          timestamp: '2025-09-03 14:30:00',
          action: 'Compliance Check Completed',
          user: 'Sarah Johnson',
          category: 'Academic',
          details: 'Academic Standards Alignment reviewed and marked compliant',
          impact: 'low'
        },
        {
          id: 'AT002',
          timestamp: '2025-09-03 10:15:00',
          action: 'Risk Assessment Updated',
          user: 'Mike Wilson',
          category: 'Operational',
          details: 'Safety protocols marked as non-compliant, critical risk assigned',
          impact: 'high'
        },
        {
          id: 'AT003',
          timestamp: '2025-09-02 16:45:00',
          action: 'Action Item Created',
          user: 'Emily Davis',
          category: 'Financial',
          details: 'Created action item for quarterly financial report update',
          impact: 'medium'
        }
      ];

      const complianceMetrics: ComplianceMetrics = {
        overallScore: 75,
        totalRules: mockRules.length,
        compliantRules: mockRules.filter(rule => rule.status === 'compliant').length,
        pendingActions: mockActions.filter(action => action.status === 'pending').length,
        criticalIssues: mockRules.filter(rule => rule.riskLevel === 'critical').length,
        trendsData: [
          { month: 'May', score: 68 },
          { month: 'Jun', score: 72 },
          { month: 'Jul', score: 70 },
          { month: 'Aug', score: 78 },
          { month: 'Sep', score: 75 }
        ]
      };

      setComplianceRules(mockRules);
      setComplianceActions(mockActions);
      setAuditTrail(mockAuditTrail);
      setMetrics(complianceMetrics);
      
    } catch (error) {
      console.error('Error loading compliance data:', error);
      Alert.alert('error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = (ruleId: string) => {
    Alert.alert('Audit Started', 'Compliance audit has been initiated for this rule.');
  };

  const handleBackNavigation = () => {
    onNavigate('back');
  };

  const handleCreateAction = () => {
    Alert.alert('Create Action', 'Action item creation dialog would open here.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#4CAF50';
      case 'non_compliant': return '#F44336';
      case 'requires_attention': return '#FF9800';
      case 'pending': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return '#388E3C';
      default: return '#9E9E9E';
    }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.overallScore}%</Text>
          <Text style={styles.metricLabel}>Compliance Score</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.compliantRules}/{metrics.totalRules}</Text>
          <Text style={styles.metricLabel}>Compliant Rules</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#F44336' }]}>{metrics.pendingActions}</Text>
          <Text style={styles.metricLabel}>Pending Actions</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#D32F2F' }]}>{metrics.criticalIssues}</Text>
          <Text style={styles.metricLabel}>Critical Issues</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Compliance Trends</Text>
        <View style={styles.chartContainer}>
          {metrics.trendsData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={[styles.bar, { height: data.score * 2 }]} />
              <Text style={styles.chartLabel}>{data.month}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Generate Report', 'Compliance report generation started')}>
          <Text style={styles.quickActionText}>📊 Generate Compliance Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Schedule Audit', 'Audit scheduling interface would open')}>
          <Text style={styles.quickActionText}>🔍 Schedule Comprehensive Audit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Risk Assessment', 'Risk assessment tool would open')}>
          <Text style={styles.quickActionText}>⚠️ Run Risk Assessment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRules = () => (
    <ScrollView style={styles.tabContent}>
      {complianceRules.map((rule) => (
        <View key={rule.id} style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rule.status) }]}>
              <Text style={styles.statusText}>{rule.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <View style={styles.ruleDetails}>
            <Text style={styles.ruleCategory}>📂 {rule.category.toUpperCase()}</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(rule.riskLevel) }]}>
              <Text style={styles.riskText}>{rule.riskLevel.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.ruleDescription}>{rule.description}</Text>
          <View style={styles.ruleDates}>
            <Text style={styles.dateText}>Last Checked: {rule.lastChecked}</Text>
            <Text style={styles.dateText}>Next Due: {rule.nextDue}</Text>
          </View>
          <TouchableOpacity 
            style={styles.auditButton} 
            onPress={() => handleRunAudit(rule.id)}
          >
            <Text style={styles.auditButtonText}>🔍 Run Audit</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderActions = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.actionsHeader}>
        <Text style={styles.sectionTitle}>Compliance Actions</Text>
        <TouchableOpacity style={styles.createActionButton} onPress={handleCreateAction}>
          <Text style={styles.createActionText}>+ New Action</Text>
        </TouchableOpacity>
      </View>
      
      {complianceActions.map((action) => (
        <View key={action.id} style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <View style={[styles.priorityBadge, { 
              backgroundColor: action.priority === 'high' ? '#F44336' : 
                             action.priority === 'medium' ? '#FF9800' : '#4CAF50' 
            }]}>
              <Text style={styles.priorityText}>{action.priority.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.actionAssigned}>👤 {action.assignedTo}</Text>
          <Text style={styles.actionDue}>📅 Due: {action.dueDate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(action.status) }]}>
            <Text style={styles.statusText}>{action.status.replace('_', ' ')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAudit = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Audit Trail</Text>
      {auditTrail.map((entry) => (
        <View key={entry.id} style={styles.auditEntry}>
          <View style={styles.auditHeader}>
            <Text style={styles.auditAction}>{entry.action}</Text>
            <View style={[styles.impactBadge, { 
              backgroundColor: entry.impact === 'high' ? '#F44336' : 
                             entry.impact === 'medium' ? '#FF9800' : '#4CAF50' 
            }]}>
              <Text style={styles.impactText}>{entry.impact.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.auditUser}>👤 {entry.user}</Text>
          <Text style={styles.auditCategory}>📂 {entry.category}</Text>
          <Text style={styles.auditDetails}>{entry.details}</Text>
          <Text style={styles.auditTimestamp}>🕐 {entry.timestamp}</Text>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Compliance & Audit</Text>
        <View style={styles.headerControls}>
          <Text style={styles.refreshLabel}>Auto Refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoRefresh ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'rules', label: '📋 Rules' },
          { key: 'actions', label: '✅ Actions' },
          { key: 'audit', label: '🔍 Audit Trail' }
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
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'actions' && renderActions()}
        {activeTab === 'audit' && renderAudit()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshLabel: {
    color: '#FFFFFF',
    marginRight: 8,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ruleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleCategory: {
    fontSize: 12,
    color: '#666',
  },
  ruleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ruleDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  auditButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  auditButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actionAssigned: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actionDue: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  auditEntry: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  auditAction: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  auditUser: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  auditCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  auditDetails: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
  },
  auditTimestamp: {
    fontSize: 10,
    color: '#999',
  },
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});