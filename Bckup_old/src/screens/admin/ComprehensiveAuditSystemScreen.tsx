/**
 * ComprehensiveAuditSystemScreen - Phase 52.2: Audit & Security Systems
 * Complete user action logging and security event monitoring
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
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'parent' | 'admin';
  action: string;
  resource: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  responseTime: number;
  dataAccessed?: string[];
  changes?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  geolocation?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_failure' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent: string;
  automated: boolean;
  resolved: boolean;
  investigator?: string;
  resolutionNotes?: string;
}

interface ComplianceMetric {
  category: string;
  metric: string;
  currentValue: number;
  target: number;
  unit: string;
  status: 'compliant' | 'warning' | 'violation';
  lastUpdated: string;
}

interface DataAccessReport {
  id: string;
  dataType: string;
  accessCount: number;
  uniqueUsers: number;
  sensitiveAccess: number;
  avgResponseTime: number;
  complianceScore: number;
  violations: number;
}

const ComprehensiveAuditSystemScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'logs' | 'security' | 'compliance' | 'reports'>('logs');
  const [auditLogs] = useState<AuditLog[]>(generateAuditLogs());
  const [securityEvents] = useState<SecurityEvent[]>(generateSecurityEvents());
  const [complianceMetrics] = useState<ComplianceMetric[]>(generateComplianceMetrics());
  const [dataAccessReports] = useState<DataAccessReport[]>(generateDataAccessReports());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const tabs = [
    { id: 'logs', label: 'Audit Logs', icon: '📋' },
    { id: 'security', label: 'Security Events', icon: '🔒' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSecurityEventAction = (eventId: string, action: 'investigate' | 'resolve' | 'escalate') => {
    Alert.alert(
      'Security Event Action',
      `${action.charAt(0).toUpperCase() + action.slice(1)} this security event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => Alert.alert('success', `Security event has been ${action}d successfully.`)
        }
      ]
    );
  };

  const exportAuditReport = (type: 'logs' | 'security' | 'compliance') => {
    Alert.alert(
      'Export Audit Report',
      `Export ${type} report in which format?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => Alert.alert('Export', `${type} PDF report exported successfully`) },
        { text: 'CSV Data', onPress: () => Alert.alert('Export', `${type} CSV data exported successfully`) },
        { text: 'JSON Format', onPress: () => Alert.alert('Export', `${type} JSON report exported successfully`) },
      ]
    );
  };

  const renderTabBar = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.tabBar, { backgroundColor: theme.Surface }]}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && [styles.activeTab, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setSelectedTab(tab.id as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            {
              color: selectedTab === tab.id 
                ? theme.OnPrimary 
                : theme.OnSurface
            }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAuditLogsTab = () => {
    const filteredLogs = filterRisk === 'all' 
      ? auditLogs 
      : auditLogs.filter(log => log.riskLevel === filterRisk);

    return (
      <View style={styles.tabContent}>
        <View style={styles.filterHeader}>
          <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
            Audit Trail ({filteredLogs.length} entries)
          </Text>
          
          <View style={styles.riskFilter}>
            {(['all', 'low', 'medium', 'high', 'critical'] as const).map(risk => (
              <TouchableOpacity
                key={risk}
                style={[
                  styles.filterButton,
                  filterRisk === risk && [styles.activeFilter, { backgroundColor: theme.primary }]
                ]}
                onPress={() => setFilterRisk(risk)}
              >
                <Text style={[
                  styles.filterText,
                  {
                    color: filterRisk === risk 
                      ? theme.OnPrimary 
                      : theme.OnSurface
                  }
                ]}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.logCard, { backgroundColor: theme.Surface }]}
              onPress={() => {
                setSelectedLog(item);
                setShowLogModal(true);
              }}
            >
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={[styles.logUser, { color: theme.OnSurface }]}>
                    {item.userName} ({item.userRole})
                  </Text>
                  <Text style={[styles.logAction, { color: theme.OnSurfaceVariant }]}>
                    {item.action}
                  </Text>
                </View>
                
                <View style={styles.logMetrics}>
                  <View style={[
                    styles.riskBadge,
                    {
                      backgroundColor: item.riskLevel === 'critical' ? '#F44336' :
                                       item.riskLevel === 'high' ? '#FF5722' :
                                       item.riskLevel === 'medium' ? '#FF9800' : '#4CAF50'
                    }
                  ]}>
                    <Text style={styles.riskText}>
                      {item.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                  
                  <Text style={[styles.statusCode, { 
                    color: item.statusCode < 300 ? '#4CAF50' : 
                           item.statusCode < 400 ? '#FF9800' : '#F44336' 
                  }]}>
                    {item.statusCode}
                  </Text>
                </View>
              </View>

              <View style={styles.logDetails}>
                <Text style={[styles.logResource, { color: theme.OnSurfaceVariant }]}>
                  {item.method} {item.resource}
                </Text>
                <Text style={[styles.logTimestamp, { color: theme.OnSurfaceVariant }]}>
                  {item.timestamp} • {item.ipAddress} • {item.responseTime}ms
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderSecurityEventsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Security Events ({securityEvents.filter(e => !e.resolved).length} active)
        </Text>
        
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          onPress={() => exportAuditReport('security')}
        >
          <Text style={[styles.exportButtonText, { color: theme.OnPrimary }]}>
            📤 Export
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {securityEvents.map(event => (
          <View key={event.id} style={[styles.eventCard, { backgroundColor: theme.Surface }]}>
            <View style={styles.eventHeader}>
              <View style={[
                styles.severityBadge,
                {
                  backgroundColor: event.severity === 'critical' ? '#F44336' :
                                   event.severity === 'high' ? '#FF5722' :
                                   event.severity === 'medium' ? '#FF9800' : '#4CAF50'
                }
              ]}>
                <Text style={styles.severityText}>
                  {event.severity.toUpperCase()}
                </Text>
              </View>
              
              <Text style={[styles.eventTimestamp, { color: theme.OnSurfaceVariant }]}>
                {event.timestamp}
              </Text>
              
              {event.automated && (
                <Text style={[styles.automatedBadge, { color: theme.primary }]}>
                  🤖 Auto-detected
                </Text>
              )}
            </View>

            <Text style={[styles.eventTitle, { color: theme.OnSurface }]}>
              {event.title}
            </Text>
            <Text style={[styles.eventDescription, { color: theme.OnSurfaceVariant }]}>
              {event.description}
            </Text>

            <View style={styles.eventDetails}>
              <Text style={[styles.eventDetail, { color: theme.OnSurfaceVariant }]}>
                IP: {event.ipAddress}
              </Text>
              {event.userName && (
                <Text style={[styles.eventDetail, { color: theme.OnSurfaceVariant }]}>
                  User: {event.userName}
                </Text>
              )}
            </View>

            {!event.resolved && (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.eventActionButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => handleSecurityEventAction(event.id, 'investigate')}
                >
                  <Text style={styles.eventActionText}>Investigate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.eventActionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleSecurityEventAction(event.id, 'resolve')}
                >
                  <Text style={styles.eventActionText}>Resolve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.eventActionButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => handleSecurityEventAction(event.id, 'escalate')}
                >
                  <Text style={styles.eventActionText}>Escalate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderComplianceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Compliance Monitoring
        </Text>
        
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          onPress={() => exportAuditReport('compliance')}
        >
          <Text style={[styles.exportButtonText, { color: theme.OnPrimary }]}>
            📋 Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {complianceMetrics.map((metric, index) => (
          <View key={index} style={[styles.complianceCard, { backgroundColor: theme.Surface }]}>
            <View style={styles.complianceHeader}>
              <Text style={[styles.complianceCategory, { color: theme.primary }]}>
                {metric.category}
              </Text>
              
              <View style={[
                styles.complianceStatus,
                {
                  backgroundColor: metric.status === 'compliant' ? '#4CAF50' :
                                   metric.status === 'warning' ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.complianceStatusText}>
                  {metric.status === 'compliant' ? '✓' : 
                   metric.status === 'warning' ? '⚠' : '✗'}
                </Text>
              </View>
            </View>

            <Text style={[styles.complianceMetric, { color: theme.OnSurface }]}>
              {metric.metric}
            </Text>

            <View style={styles.complianceValues}>
              <Text style={[styles.complianceValue, { color: theme.primary }]}>
                Current: {metric.currentValue}{metric.unit}
              </Text>
              <Text style={[styles.complianceTarget, { color: theme.OnSurfaceVariant }]}>
                Target: {metric.target}{metric.unit}
              </Text>
            </View>

            <Text style={[styles.complianceUpdated, { color: theme.OnSurfaceVariant }]}>
              Last updated: {metric.lastUpdated}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Data Access Reports
        </Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {dataAccessReports.map(report => (
          <View key={report.id} style={[styles.reportCard, { backgroundColor: theme.Surface }]}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportType, { color: theme.OnSurface }]}>
                {report.dataType}
              </Text>
              <Text style={[styles.reportScore, { color: theme.primary }]}>
                {report.complianceScore}% Compliant
              </Text>
            </View>

            <View style={styles.reportMetrics}>
              <View style={styles.reportMetric}>
                <Text style={[styles.reportMetricValue, { color: theme.primary }]}>
                  {report.accessCount.toLocaleString()}
                </Text>
                <Text style={[styles.reportMetricLabel, { color: theme.OnSurfaceVariant }]}>
                  Total Access
                </Text>
              </View>

              <View style={styles.reportMetric}>
                <Text style={[styles.reportMetricValue, { color: theme.primary }]}>
                  {report.uniqueUsers}
                </Text>
                <Text style={[styles.reportMetricLabel, { color: theme.OnSurfaceVariant }]}>
                  Unique Users
                </Text>
              </View>

              <View style={styles.reportMetric}>
                <Text style={[styles.reportMetricValue, { color: '#FF9800' }]}>
                  {report.sensitiveAccess}
                </Text>
                <Text style={[styles.reportMetricLabel, { color: theme.OnSurfaceVariant }]}>
                  Sensitive Access
                </Text>
              </View>
            </View>

            {report.violations > 0 && (
              <Text style={[styles.reportViolations, { color: '#F44336' }]}>
                ⚠ {report.violations} compliance violations detected
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderLogModal = () => (
    <Modal
      visible={showLogModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowLogModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedLog && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowLogModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.primary }]}>×</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                    Audit Log Details
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    User Information
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Name: {selectedLog.userName}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    ID: {selectedLog.userId}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Role: {selectedLog.userRole}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    Action Details
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Action: {selectedLog.action}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Resource: {selectedLog.resource}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Method: {selectedLog.method}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Status: {selectedLog.statusCode}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    Technical Details
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    IP Address: {selectedLog.ipAddress}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    User Agent: {selectedLog.userAgent}
                  </Text>
                  <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                    Response Time: {selectedLog.responseTime}ms
                  </Text>
                  {selectedLog.geolocation && (
                    <Text style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                      Location: {selectedLog.geolocation}
                    </Text>
                  )}
                </View>

                {selectedLog.dataAccessed && selectedLog.dataAccessed.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                      Data Accessed
                    </Text>
                    {selectedLog.dataAccessed.map((data, index) => (
                      <Text key={index} style={[styles.modalDetailText, { color: theme.OnSurfaceVariant }]}>
                        • {data}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'logs':
        return renderAuditLogsTab();
      case 'security':
        return renderSecurityEventsTab();
      case 'compliance':
        return renderComplianceTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderAuditLogsTab();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.OnBackground }]}>
          Comprehensive Audit System
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Complete monitoring and compliance tracking
        </Text>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      {renderContent()}

      {/* Log Detail Modal */}
      {renderLogModal()}
    </SafeAreaView>
  );
};

// Mock data generators
function generateAuditLogs(): AuditLog[] {
  return [
    {
      id: '1',
      timestamp: '2024-01-20 14:30:25',
      userId: 'usr_001',
      userName: 'Priya Sharma',
      userRole: 'student',
      action: 'Assignment Submission',
      resource: '/api/assignments/submit',
      method: 'POST',
      ipAddress: '192.168.1.100',
      userAgent: 'Mobile App v2.1.5',
      statusCode: 200,
      responseTime: 245,
      dataAccessed: ['assignment_content', 'user_profile', 'submission_metadata'],
      riskLevel: 'low',
      geolocation: 'Mumbai, India',
    },
    {
      id: '2',
      timestamp: '2024-01-20 14:25:18',
      userId: 'usr_045',
      userName: 'Rajesh Kumar',
      userRole: 'teacher',
      action: 'Bulk Grade Export',
      resource: '/api/grades/export',
      method: 'GET',
      ipAddress: '203.123.45.67',
      userAgent: 'Web Browser Chrome',
      statusCode: 200,
      responseTime: 1200,
      dataAccessed: ['student_grades', 'personal_information', 'performance_data'],
      riskLevel: 'high',
      geolocation: 'Delhi, India',
    },
    {
      id: '3',
      timestamp: '2024-01-20 14:20:10',
      userId: 'usr_123',
      userName: 'Anita Verma',
      userRole: 'parent',
      action: 'Child Progress Access',
      resource: '/api/progress/child/789',
      method: 'GET',
      ipAddress: '192.168.1.55',
      userAgent: 'Mobile App v2.1.5',
      statusCode: 200,
      responseTime: 180,
      dataAccessed: ['child_academic_records', 'attendance_data'],
      riskLevel: 'medium',
    },
    {
      id: '4',
      timestamp: '2024-01-20 14:15:33',
      userId: 'usr_089',
      userName: 'Dev Patel',
      userRole: 'admin',
      action: 'User Data Modification',
      resource: '/api/users/456/update',
      method: 'PUT',
      ipAddress: '10.0.0.45',
      userAgent: 'Web Browser Firefox',
      statusCode: 200,
      responseTime: 320,
      dataAccessed: ['user_profile', 'sensitive_information', 'access_permissions'],
      changes: {
        email: 'old@example.com -> new@example.com',
        role: 'student -> teacher'
      },
      riskLevel: 'critical',
    },
  ];
}

function generateSecurityEvents(): SecurityEvent[] {
  return [
    {
      id: '1',
      type: 'login_failure',
      severity: 'high',
      title: 'Multiple Failed Login Attempts',
      description: 'User attempted login 5 times with incorrect credentials within 10 minutes.',
      timestamp: '2024-01-20 14:25:00',
      userId: 'usr_unknown',
      userName: 'Unknown',
      ipAddress: '203.123.45.67',
      userAgent: 'Web Browser Chrome',
      automated: true,
      resolved: false,
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'critical',
      title: 'Unusual Data Access Pattern',
      description: 'Admin user accessed student records from multiple geographic locations within 1 hour.',
      timestamp: '2024-01-20 13:45:00',
      userId: 'usr_089',
      userName: 'Dev Patel',
      ipAddress: '192.168.1.200',
      userAgent: 'Web Browser Safari',
      automated: true,
      resolved: false,
    },
    {
      id: '3',
      type: 'unauthorized_access',
      severity: 'medium',
      title: 'Access to Restricted Resource',
      description: 'Teacher attempted to access admin-only financial reports.',
      timestamp: '2024-01-20 13:30:00',
      userId: 'usr_045',
      userName: 'Rajesh Kumar',
      ipAddress: '203.123.45.67',
      userAgent: 'Web Browser Chrome',
      automated: true,
      resolved: true,
      investigator: 'Security Team',
      resolutionNotes: 'User education provided. Access permissions reviewed.',
    },
  ];
}

function generateComplianceMetrics(): ComplianceMetric[] {
  return [
    {
      category: 'Data Privacy (FERPA)',
      metric: 'Unauthorized Access Incidents',
      currentValue: 0,
      target: 0,
      unit: ' incidents',
      status: 'compliant',
      lastUpdated: '2024-01-20 12:00:00',
    },
    {
      category: 'Data Retention',
      metric: 'Records Older Than Policy Limit',
      currentValue: 12,
      target: 0,
      unit: ' records',
      status: 'violation',
      lastUpdated: '2024-01-20 12:00:00',
    },
    {
      category: 'Access Control',
      metric: 'Users with Excessive Permissions',
      currentValue: 3,
      target: 5,
      unit: ' users',
      status: 'compliant',
      lastUpdated: '2024-01-20 12:00:00',
    },
    {
      category: 'Audit Logging',
      metric: 'Log Coverage Percentage',
      currentValue: 95,
      target: 100,
      unit: '%',
      status: 'warning',
      lastUpdated: '2024-01-20 12:00:00',
    },
    {
      category: 'Data Encryption',
      metric: 'Unencrypted Data Transmissions',
      currentValue: 0,
      target: 0,
      unit: ' transmissions',
      status: 'compliant',
      lastUpdated: '2024-01-20 12:00:00',
    },
  ];
}

function generateDataAccessReports(): DataAccessReport[] {
  return [
    {
      id: '1',
      dataType: 'Student Academic Records',
      accessCount: 15678,
      uniqueUsers: 234,
      sensitiveAccess: 45,
      avgResponseTime: 180,
      complianceScore: 94,
      violations: 2,
    },
    {
      id: '2',
      dataType: 'Financial Information',
      accessCount: 3421,
      uniqueUsers: 89,
      sensitiveAccess: 234,
      avgResponseTime: 320,
      complianceScore: 87,
      violations: 8,
    },
    {
      id: '3',
      dataType: 'Personal Identifiable Information',
      accessCount: 8901,
      uniqueUsers: 156,
      sensitiveAccess: 890,
      avgResponseTime: 210,
      complianceScore: 92,
      violations: 5,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabBar: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    marginRight: Spacing.SM,
    minWidth: 120,
  },
  activeTab: {
    elevation: 2,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.MD,
  },
  filterHeader: {
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  riskFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    marginRight: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  activeFilter: {
    elevation: 2,
  },
  filterText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  exportButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  logCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  logInfo: {
    flex: 1,
  },
  logUser: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  logAction: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  logMetrics: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: Spacing.XS,
  },
  riskText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  statusCode: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: Spacing.SM,
  },
  logResource: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  logTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
  },
  eventCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  severityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  severityText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  eventTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
    flex: 1,
  },
  automatedBadge: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  eventDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  eventDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.MD,
  },
  eventDetail: {
    fontSize: Typography.bodySmall.fontSize,
    marginRight: Spacing.LG,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eventActionButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  eventActionText: {
    color: 'white',
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  complianceCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  complianceCategory: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  complianceStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  complianceMetric: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  complianceValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  complianceValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  complianceTarget: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  complianceUpdated: {
    fontSize: Typography.bodySmall.fontSize,
  },
  reportCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  reportType: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  reportScore: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: 'bold',
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportMetricValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reportMetricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  reportViolations: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: Spacing.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: Spacing.LG,
  },
  modalSectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  modalDetailText: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.XS,
    lineHeight: 18,
  },
});

export default ComprehensiveAuditSystemScreen;