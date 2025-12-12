/**
 * SecurityComplianceScreen - Phase 54: Security & Compliance Enhancement
 * Multi-factor authentication system and comprehensive compliance framework
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
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface SecurityMetric {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'encryption' | 'monitoring' | 'compliance';
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  description: string;
}

interface ComplianceStandard {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  requirements: ComplianceRequirement[];
  overallCompliance: number;
  lastAudit: string;
  nextAudit: string;
  status: 'compliant' | 'partial' | 'non-compliant';
}

interface ComplianceRequirement {
  id: string;
  requirement: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string;
  lastVerified: string;
}

interface MFAMethod {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'authenticator' | 'biometric' | 'hardware_key';
  enabled: boolean;
  users: number;
  successRate: number;
  description: string;
  icon: string;
}

interface SecurityThreat {
  id: string;
  type: 'malware' | 'phishing' | 'brute_force' | 'data_breach' | 'insider_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: string;
  source: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  affectedUsers: number;
  mitigationSteps: string[];
}

interface AccessControl {
  role: string;
  users: number;
  permissions: string[];
  lastReview: string;
  excessivePermissions: number;
  riskyAccess: number;
}

const SecurityComplianceScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'mfa' | 'compliance' | 'threats' | 'access'>('overview');
  const [securityMetrics] = useState<SecurityMetric[]>(generateSecurityMetrics());
  const [complianceStandards] = useState<ComplianceStandard[]>(generateComplianceStandards());
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>(generateMFAMethods());
  const [securityThreats] = useState<SecurityThreat[]>(generateSecurityThreats());
  const [accessControls] = useState<AccessControl[]>(generateAccessControls());
  const [refreshing, setRefreshing] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [selectedMFA, setSelectedMFA] = useState<MFAMethod | null>(null);

  const tabs = [
    { id: 'overview', label: 'Security Overview', icon: '🔒' },
    { id: 'mfa', label: 'Multi-Factor Auth', icon: '🔐' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'threats', label: 'Threat Monitor', icon: '🚨' },
    { id: 'access', label: 'Access Control', icon: '👥' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleMFAMethod = (methodId: string) => {
    setMfaMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, enabled: !method.enabled }
          : method
      )
    );
    
    Alert.alert(
      'MFA Method Updated',
      'Multi-factor authentication method status has been updated successfully.'
    );
  };

  const handleSecurityScan = () => {
    Alert.alert(
      'Security Scan',
      'Start comprehensive security vulnerability scan? This may take 15-30 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Scan', 
          onPress: () => Alert.alert('Scan Started', 'Security vulnerability scan is now running in the background.')
        }
      ]
    );
  };

  const handleComplianceAudit = (standardId: string) => {
    Alert.alert(
      'Compliance Audit',
      'Generate compliance audit report for this standard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => Alert.alert('Export', 'PDF compliance report generated successfully') },
        { text: 'Excel Data', onPress: () => Alert.alert('Export', 'Excel compliance data exported successfully') },
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

  const renderSecurityOverview = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.overviewHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Security Posture Dashboard
        </Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleSecurityScan}
        >
          <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
            🔍 Security Scan
          </Text>
        </TouchableOpacity>
      </View>

      {securityMetrics.map(metric => (
        <View key={metric.id} style={[styles.metricCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.metricHeader}>
            <View style={styles.metricInfo}>
              <Text style={[styles.metricName, { color: theme.OnSurface }]}>
                {metric.name}
              </Text>
              <Text style={[styles.metricCategory, { color: theme.primary }]}>
                {metric.category.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
            
            <View style={[
              styles.securityStatus,
              {
                backgroundColor: metric.status === 'good' ? '#4CAF50' :
                                 metric.status === 'warning' ? '#FF9800' : '#F44336'
              }
            ]}>
              <Text style={styles.securityStatusText}>
                {metric.status === 'good' ? '✓' : 
                 metric.status === 'warning' ? '⚠' : '✗'}
              </Text>
            </View>
          </View>

          <Text style={[styles.metricDescription, { color: theme.OnSurfaceVariant }]}>
            {metric.description}
          </Text>

          <View style={styles.metricValues}>
            <Text style={[styles.metricCurrent, { color: theme.primary }]}>
              Current: {metric.currentValue}{metric.unit}
            </Text>
            <Text style={[styles.metricTarget, { color: theme.OnSurfaceVariant }]}>
              Target: {metric.targetValue}{metric.unit}
            </Text>
          </View>

          <View style={styles.metricTrend}>
            <Text style={[
              styles.trendIndicator,
              {
                color: metric.trend === 'improving' ? '#4CAF50' :
                       metric.trend === 'declining' ? '#F44336' : '#FF9800'
              }
            ]}>
              {metric.trend === 'improving' ? '↗️ Improving' :
               metric.trend === 'declining' ? '↘️ Needs Attention' : '→ Stable'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderMFATab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.mfaHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Multi-Factor Authentication
        </Text>
        
        <Text style={[styles.mfaStats, { color: theme.primary }]}>
          {Math.round((mfaMethods.reduce((acc, method) => acc + method.users, 0) / 15347) * 100)}% Adoption Rate
        </Text>
      </View>

      {mfaMethods.map(method => (
        <View key={method.id} style={[styles.mfaCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.mfaMethodHeader}>
            <View style={styles.mfaMethodInfo}>
              <Text style={styles.mfaMethodIcon}>{method.icon}</Text>
              <View style={styles.mfaMethodDetails}>
                <Text style={[styles.mfaMethodName, { color: theme.OnSurface }]}>
                  {method.name}
                </Text>
                <Text style={[styles.mfaMethodDescription, { color: theme.OnSurfaceVariant }]}>
                  {method.description}
                </Text>
              </View>
            </View>
            
            <Switch
              value={method.enabled}
              onValueChange={() => toggleMFAMethod(method.id)}
              trackColor={{ false: theme.Outline, true: theme.primary }}
              thumbColor={method.enabled ? theme.OnPrimary : theme.OnSurface}
            />
          </View>

          {method.enabled && (
            <View style={styles.mfaStats}>
              <View style={styles.mfaStat}>
                <Text style={[styles.mfaStatValue, { color: theme.primary }]}>
                  {method.users.toLocaleString()}
                </Text>
                <Text style={[styles.mfaStatLabel, { color: theme.OnSurfaceVariant }]}>
                  Active Users
                </Text>
              </View>

              <View style={styles.mfaStat}>
                <Text style={[styles.mfaStatValue, { color: theme.primary }]}>
                  {method.successRate}%
                </Text>
                <Text style={[styles.mfaStatLabel, { color: theme.OnSurfaceVariant }]}>
                  Success Rate
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.mfaConfigButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setSelectedMFA(method);
                  setShowMFAModal(true);
                }}
              >
                <Text style={[styles.mfaConfigButtonText, { color: theme.OnPrimary }]}>
                  Configure
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderComplianceTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Compliance Standards
      </Text>

      {complianceStandards.map(standard => (
        <View key={standard.id} style={[styles.complianceCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.complianceHeader}>
            <View style={styles.complianceInfo}>
              <Text style={[styles.complianceName, { color: theme.OnSurface }]}>
                {standard.name}
              </Text>
              <Text style={[styles.complianceAbbr, { color: theme.primary }]}>
                {standard.abbreviation}
              </Text>
            </View>
            
            <View style={styles.complianceScore}>
              <Text style={[styles.compliancePercentage, { color: theme.primary }]}>
                {standard.overallCompliance}%
              </Text>
              <View style={[
                styles.complianceStatusBadge,
                {
                  backgroundColor: standard.status === 'compliant' ? '#4CAF50' :
                                   standard.status === 'partial' ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.complianceStatusText}>
                  {standard.status === 'compliant' ? '✓' : 
                   standard.status === 'partial' ? '⚠' : '✗'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.complianceDescription, { color: theme.OnSurfaceVariant }]}>
            {standard.description}
          </Text>

          <View style={styles.complianceDates}>
            <Text style={[styles.complianceDate, { color: theme.OnSurfaceVariant }]}>
              Last Audit: {standard.lastAudit}
            </Text>
            <Text style={[styles.complianceDate, { color: theme.OnSurfaceVariant }]}>
              Next Audit: {standard.nextAudit}
            </Text>
          </View>

          <View style={styles.requirementsSummary}>
            <Text style={[styles.requirementsTitle, { color: theme.OnSurface }]}>
              Requirements Status:
            </Text>
            <View style={styles.requirementsStats}>
              <Text style={[styles.requirementsStat, { color: '#4CAF50' }]}>
                ✓ {standard.requirements.filter(r => r.status === 'met').length} Met
              </Text>
              <Text style={[styles.requirementsStat, { color: '#FF9800' }]}>
                ⚠ {standard.requirements.filter(r => r.status === 'partial').length} Partial
              </Text>
              <Text style={[styles.requirementsStat, { color: '#F44336' }]}>
                ✗ {standard.requirements.filter(r => r.status === 'not_met').length} Not Met
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.auditButton, { backgroundColor: theme.primary }]}
            onPress={() => handleComplianceAudit(standard.id)}
          >
            <Text style={[styles.auditButtonText, { color: theme.OnPrimary }]}>
              📋 Generate Audit Report
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderThreatsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Security Threat Monitoring
      </Text>

      {securityThreats.map(threat => (
        <View key={threat.id} style={[styles.threatCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.threatHeader}>
            <View style={[
              styles.severityBadge,
              {
                backgroundColor: threat.severity === 'critical' ? '#F44336' :
                                 threat.severity === 'high' ? '#FF5722' :
                                 threat.severity === 'medium' ? '#FF9800' : '#4CAF50'
              }
            ]}>
              <Text style={styles.severityText}>
                {threat.severity.toUpperCase()}
              </Text>
            </View>
            
            <View style={[
              styles.threatStatusBadge,
              {
                backgroundColor: threat.status === 'resolved' ? '#4CAF50' :
                                 threat.status === 'mitigated' ? '#2196F3' :
                                 threat.status === 'investigating' ? '#FF9800' : '#F44336'
              }
            ]}>
              <Text style={styles.threatStatusText}>
                {threat.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={[styles.threatTitle, { color: theme.OnSurface }]}>
            {threat.title}
          </Text>
          <Text style={[styles.threatDescription, { color: theme.OnSurfaceVariant }]}>
            {threat.description}
          </Text>

          <View style={styles.threatDetails}>
            <Text style={[styles.threatDetail, { color: theme.OnSurfaceVariant }]}>
              Detected: {threat.detectedAt}
            </Text>
            <Text style={[styles.threatDetail, { color: theme.OnSurfaceVariant }]}>
              Source: {threat.source}
            </Text>
            <Text style={[styles.threatDetail, { color: theme.OnSurfaceVariant }]}>
              Affected Users: {threat.affectedUsers}
            </Text>
          </View>

          {threat.mitigationSteps.length > 0 && (
            <View style={styles.mitigationSteps}>
              <Text style={[styles.mitigationTitle, { color: theme.OnSurface }]}>
                Mitigation Steps:
              </Text>
              {threat.mitigationSteps.map((step, index) => (
                <Text key={index} style={[styles.mitigationStep, { color: theme.OnSurfaceVariant }]}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderAccessControlTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Access Control Management
      </Text>

      {accessControls.map((access, index) => (
        <View key={index} style={[styles.accessCard, { backgroundColor: theme.Surface }]}>
          <View style={styles.accessHeader}>
            <Text style={[styles.accessRole, { color: theme.OnSurface }]}>
              {access.role}
            </Text>
            <Text style={[styles.accessUserCount, { color: theme.primary }]}>
              {access.users} users
            </Text>
          </View>

          <View style={styles.accessMetrics}>
            <View style={styles.accessMetric}>
              <Text style={[styles.accessMetricValue, { color: '#FF9800' }]}>
                {access.excessivePermissions}
              </Text>
              <Text style={[styles.accessMetricLabel, { color: theme.OnSurfaceVariant }]}>
                Excessive Permissions
              </Text>
            </View>

            <View style={styles.accessMetric}>
              <Text style={[styles.accessMetricValue, { color: '#F44336' }]}>
                {access.riskyAccess}
              </Text>
              <Text style={[styles.accessMetricLabel, { color: theme.OnSurfaceVariant }]}>
                Risky Access Patterns
              </Text>
            </View>

            <View style={styles.accessMetric}>
              <Text style={[styles.accessMetricValue, { color: theme.primary }]}>
                {access.permissions.length}
              </Text>
              <Text style={[styles.accessMetricLabel, { color: theme.OnSurfaceVariant }]}>
                Total Permissions
              </Text>
            </View>
          </View>

          <Text style={[styles.accessLastReview, { color: theme.OnSurfaceVariant }]}>
            Last Review: {access.lastReview}
          </Text>

          <View style={styles.accessActions}>
            <TouchableOpacity
              style={[styles.accessActionButton, { backgroundColor: theme.primary }]}
              onPress={() => Alert.alert('Access Review', `Starting access review for ${access.role} role...`)}
            >
              <Text style={[styles.accessActionText, { color: theme.OnPrimary }]}>
                Review Access
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accessActionButton, styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={() => Alert.alert('Permissions', `Viewing detailed permissions for ${access.role} role...`)}
            >
              <Text style={[styles.accessActionText, { color: theme.primary }]}>
                View Permissions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderMFAModal = () => (
    <Modal
      visible={showMFAModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowMFAModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMFAModal(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>×</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              Configure {selectedMFA?.name}
            </Text>
          </View>

          {selectedMFA && (
            <ScrollView>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                  Settings
                </Text>
                <View style={styles.modalSetting}>
                  <Text style={[styles.modalSettingLabel, { color: theme.OnSurfaceVariant }]}>
                    Require for all logins
                  </Text>
                  <Switch
                    value={true}
                    trackColor={{ false: theme.Outline, true: theme.primary }}
                  />
                </View>
                
                <View style={styles.modalSetting}>
                  <Text style={[styles.modalSettingLabel, { color: theme.OnSurfaceVariant }]}>
                    Remember device for 30 days
                  </Text>
                  <Switch
                    value={false}
                    trackColor={{ false: theme.Outline, true: theme.primary }}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setShowMFAModal(false);
                  Alert.alert('Saved', 'MFA configuration has been saved successfully.');
                }}
              >
                <Text style={[styles.modalSaveButtonText, { color: theme.OnPrimary }]}>
                  Save Configuration
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderSecurityOverview();
      case 'mfa':
        return renderMFATab();
      case 'compliance':
        return renderComplianceTab();
      case 'threats':
        return renderThreatsTab();
      case 'access':
        return renderAccessControlTab();
      default:
        return renderSecurityOverview();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.OnBackground }]}>
          Security & Compliance
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Advanced security monitoring and compliance management
        </Text>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      {renderContent()}

      {/* MFA Configuration Modal */}
      {renderMFAModal()}
    </SafeAreaView>
  );
};

// Mock data generators
function generateSecurityMetrics(): SecurityMetric[] {
  return [
    {
      id: '1',
      name: 'Password Strength Score',
      category: 'authentication',
      currentValue: 87,
      targetValue: 90,
      unit: '%',
      status: 'warning',
      trend: 'improving',
      description: 'Average password strength across all user accounts',
    },
    {
      id: '2',
      name: 'Multi-Factor Authentication Adoption',
      category: 'authentication',
      currentValue: 78,
      targetValue: 95,
      unit: '%',
      status: 'warning',
      trend: 'improving',
      description: 'Percentage of users with MFA enabled',
    },
    {
      id: '3',
      name: 'Data Encryption Coverage',
      category: 'encryption',
      currentValue: 100,
      targetValue: 100,
      unit: '%',
      status: 'good',
      trend: 'stable',
      description: 'Percentage of sensitive data encrypted at rest and in transit',
    },
    {
      id: '4',
      name: 'Security Incident Response Time',
      category: 'monitoring',
      currentValue: 15,
      targetValue: 30,
      unit: ' minutes',
      status: 'good',
      trend: 'improving',
      description: 'Average time to respond to security incidents',
    },
    {
      id: '5',
      name: 'Compliance Score',
      category: 'compliance',
      currentValue: 92,
      targetValue: 95,
      unit: '%',
      status: 'good',
      trend: 'stable',
      description: 'Overall compliance with regulatory standards',
    },
  ];
}

function generateComplianceStandards(): ComplianceStandard[] {
  return [
    {
      id: '1',
      name: 'Family Educational Rights and Privacy Act',
      abbreviation: 'FERPA',
      description: 'Protects the privacy of student education records',
      requirements: [
        {
          id: '1',
          requirement: 'Written consent for disclosure of records',
          status: 'met',
          evidence: 'Consent forms implemented and stored securely',
          lastVerified: '2024-01-15',
        },
        {
          id: '2',
          requirement: 'Directory information policy',
          status: 'met',
          evidence: 'Policy documented and communicated to parents',
          lastVerified: '2024-01-15',
        },
        {
          id: '3',
          requirement: 'Access logs for student records',
          status: 'partial',
          evidence: 'Logs maintained but need automated monitoring',
          lastVerified: '2024-01-10',
        },
      ],
      overallCompliance: 89,
      lastAudit: '2024-01-01',
      nextAudit: '2024-07-01',
      status: 'partial',
    },
    {
      id: '2',
      name: 'General Data Protection Regulation',
      abbreviation: 'GDPR',
      description: 'EU regulation on data protection and privacy',
      requirements: [
        {
          id: '4',
          requirement: 'Data subject consent management',
          status: 'met',
          evidence: 'Granular consent system implemented',
          lastVerified: '2024-01-18',
        },
        {
          id: '5',
          requirement: 'Right to be forgotten implementation',
          status: 'met',
          evidence: 'Data deletion processes automated',
          lastVerified: '2024-01-16',
        },
        {
          id: '6',
          requirement: 'Data breach notification (72h)',
          status: 'met',
          evidence: 'Automated notification system in place',
          lastVerified: '2024-01-12',
        },
      ],
      overallCompliance: 96,
      lastAudit: '2023-12-15',
      nextAudit: '2024-06-15',
      status: 'compliant',
    },
  ];
}

function generateMFAMethods(): MFAMethod[] {
  return [
    {
      id: '1',
      name: 'SMS Authentication',
      type: 'sms',
      enabled: true,
      users: 8934,
      successRate: 94.5,
      description: 'Text message verification codes',
      icon: '📱',
    },
    {
      id: '2',
      name: 'Email Authentication',
      type: 'email',
      enabled: true,
      users: 12456,
      successRate: 97.2,
      description: 'Email verification codes and links',
      icon: '📧',
    },
    {
      id: '3',
      name: 'Authenticator App',
      type: 'authenticator',
      enabled: true,
      users: 3421,
      successRate: 98.7,
      description: 'Time-based one-time passwords (TOTP)',
      icon: '🔐',
    },
    {
      id: '4',
      name: 'Biometric Authentication',
      type: 'biometric',
      enabled: false,
      users: 0,
      successRate: 0,
      description: 'Fingerprint and face recognition',
      icon: '👆',
    },
    {
      id: '5',
      name: 'Hardware Security Keys',
      type: 'hardware_key',
      enabled: false,
      users: 0,
      successRate: 0,
      description: 'FIDO2/WebAuthn compatible keys',
      icon: '🔑',
    },
  ];
}

function generateSecurityThreats(): SecurityThreat[] {
  return [
    {
      id: '1',
      type: 'brute_force',
      severity: 'high',
      title: 'Brute Force Attack Detected',
      description: 'Multiple failed login attempts from suspicious IP ranges targeting admin accounts',
      detectedAt: '2024-01-20 14:23:00',
      source: '203.45.67.0/24',
      status: 'investigating',
      affectedUsers: 0,
      mitigationSteps: [
        'IP ranges blocked automatically',
        'Enhanced monitoring activated',
        'Admin accounts temporarily locked',
        'Investigating attack source'
      ],
    },
    {
      id: '2',
      type: 'phishing',
      severity: 'medium',
      title: 'Phishing Email Campaign',
      description: 'Suspicious emails mimicking platform login pages sent to user base',
      detectedAt: '2024-01-19 09:15:00',
      source: 'External email campaign',
      status: 'mitigated',
      affectedUsers: 23,
      mitigationSteps: [
        'Malicious emails quarantined',
        'User education emails sent',
        'Two-factor authentication enforced',
        'Domain reputation updated'
      ],
    },
  ];
}

function generateAccessControls(): AccessControl[] {
  return [
    {
      role: 'Super Administrator',
      users: 3,
      permissions: ['system.admin', 'user.manage', 'data.export', 'security.config'],
      lastReview: '2024-01-01',
      excessivePermissions: 0,
      riskyAccess: 1,
    },
    {
      role: 'Teacher',
      users: 245,
      permissions: ['class.manage', 'student.grade', 'assignment.create'],
      lastReview: '2023-12-15',
      excessivePermissions: 12,
      riskyAccess: 3,
    },
    {
      role: 'Student',
      users: 12678,
      permissions: ['assignment.submit', 'progress.view', 'profile.edit'],
      lastReview: '2024-01-10',
      excessivePermissions: 5,
      riskyAccess: 0,
    },
    {
      role: 'Parent',
      users: 8934,
      permissions: ['child.progress.view', 'payment.make', 'communication.send'],
      lastReview: '2024-01-05',
      excessivePermissions: 23,
      riskyAccess: 2,
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
    minWidth: 140,
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
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  actionButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  metricCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  metricCategory: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  securityStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metricCurrent: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  metricTarget: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  metricTrend: {
    alignItems: 'center',
  },
  trendIndicator: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  mfaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  mfaStats: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  mfaCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  mfaMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  mfaMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mfaMethodIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
  },
  mfaMethodDetails: {
    flex: 1,
  },
  mfaMethodName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  mfaMethodDescription: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  mfaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  mfaStat: {
    alignItems: 'center',
  },
  mfaStatValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mfaStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  mfaConfigButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
  },
  mfaConfigButtonText: {
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
    marginBottom: Spacing.MD,
  },
  complianceInfo: {
    flex: 1,
  },
  complianceName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  complianceAbbr: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: 'bold',
  },
  complianceScore: {
    alignItems: 'center',
  },
  compliancePercentage: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: 'bold',
    marginBottom: Spacing.XS,
  },
  complianceStatusBadge: {
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
  complianceDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.MD,
  },
  complianceDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  complianceDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  requirementsSummary: {
    marginBottom: Spacing.MD,
  },
  requirementsTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  requirementsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  requirementsStat: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  auditButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 6,
    alignItems: 'center',
  },
  auditButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  threatCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  severityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  threatStatusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  threatStatusText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  threatTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  threatDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.MD,
  },
  threatDetails: {
    marginBottom: Spacing.MD,
  },
  threatDetail: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 2,
  },
  mitigationSteps: {
    marginTop: Spacing.SM,
  },
  mitigationTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  mitigationStep: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.XS,
    lineHeight: 18,
  },
  accessCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
  },
  accessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  accessRole: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  accessUserCount: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  accessMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  accessMetric: {
    alignItems: 'center',
  },
  accessMetricValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  accessMetricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  accessLastReview: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  accessActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accessActionButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: Spacing.XS,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  accessActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.7,
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
    marginBottom: Spacing.MD,
  },
  modalSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  modalSettingLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    flex: 1,
  },
  modalSaveButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
  },
});

export default SecurityComplianceScreen;