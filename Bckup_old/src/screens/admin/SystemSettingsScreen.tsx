/**
 * SystemSettingsScreen - Phase 38.1: System Settings Management
 * Comprehensive configuration interface with platform-wide settings, branding,
 * feature controls, performance monitoring, and automated maintenance tools
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Type definitions for System Settings Management
interface SystemConfiguration {
  id: string;
  category: 'general' | 'security' | 'integrations' | 'performance' | 'backup';
  name: string;
  displayName: string;
  description: string;
  value: any;
  dataType: 'boolean' | 'string' | 'number' | 'array' | 'object';
  isRequired: boolean;
  isReadonly: boolean;
  validationRules?: ValidationRule[];
  lastModified: string;
  modifiedBy: string;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'required';
  value: any;
  message: string;
}

interface BrandingConfiguration {
  id: string;
  institutionName: string;
  institutionLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon?: string;
  loginBackground?: string;
  customCSS?: string;
  customDomains: string[];
  footerText?: string;
  supportEmail: string;
  supportPhone?: string;
  isWhiteLabel: boolean;
}

interface FeatureControl {
  id: string;
  featureName: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
  enabledForRoles: string[];
  restrictions?: FeatureRestriction[];
  usageLimit?: number;
  usageCount: number;
  lastToggled: string;
  toggledBy: string;
}

interface FeatureRestriction {
  type: 'time_based' | 'user_limit' | 'usage_quota' | 'ip_restriction';
  configuration: any;
}

interface IntegrationService {
  id: string;
  serviceName: string;
  displayName: string;
  description: string;
  category: 'authentication' | 'payment' | 'communication' | 'storage' | 'analytics';
  isEnabled: boolean;
  configuration: IntegrationConfiguration;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  errorMessage?: string;
}

interface IntegrationConfiguration {
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  webhookUrl?: string;
  customFields: { [key: string]: any };
}

interface SystemHealth {
  id: string;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeUsers: number;
  databaseConnections: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

interface PerformanceMetric {
  id: string;
  name: string;
  displayName: string;
  category: 'system' | 'application' | 'database' | 'network';
  currentValue: number;
  threshold: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
}

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'backup' | 'optimization' | 'update' | 'monitoring';
  schedule: string; // Cron expression
  isEnabled: boolean;
  lastRun?: string;
  nextRun: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  duration?: number;
  result?: string;
}

interface BackupConfiguration {
  id: string;
  backupType: 'full' | 'incremental' | 'differential';
  schedule: string; // Cron expression
  retention: number; // Days
  compression: boolean;
  encryption: boolean;
  destination: 'local' | 'cloud' | 'both';
  cloudProvider?: 'aws' | 'azure' | 'gcp';
  isEnabled: boolean;
  lastBackup?: string;
  nextBackup: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
}

interface SystemSettingsScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const SystemSettingsScreen: React.FC<SystemSettingsScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'features' | 'integrations' | 'monitoring'>('general');
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration[]>([]);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfiguration | null>(null);
  const [featureControls, setFeatureControls] = useState<FeatureControl[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationService[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [backupConfig, setBackupConfig] = useState<BackupConfiguration[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfiguration | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationService | null>(null);

  // Initialize data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load system configuration
      const configData: SystemConfiguration[] = [
        {
          id: 'config_001',
          category: 'general',
          name: 'institution_name',
          displayName: 'Institution Name',
          description: 'Official name of the educational institution',
          value: 'Manushi Coaching Institute',
          dataType: 'string',
          isRequired: true,
          isReadonly: false,
          lastModified: '2024-12-01T10:00:00Z',
          modifiedBy: adminId,
        },
        {
          id: 'config_002',
          category: 'security',
          name: 'max_login_attempts',
          displayName: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lockout',
          value: 5,
          dataType: 'number',
          isRequired: true,
          isReadonly: false,
          validationRules: [
            { type: 'min', value: 1, message: 'Must be at least 1' },
            { type: 'max', value: 10, message: 'Must be at most 10' }
          ],
          lastModified: '2024-11-15T14:30:00Z',
          modifiedBy: 'admin_001',
        },
        {
          id: 'config_003',
          category: 'performance',
          name: 'session_timeout',
          displayName: 'Session Timeout (minutes)',
          description: 'User session timeout duration in minutes',
          value: 60,
          dataType: 'number',
          isRequired: true,
          isReadonly: false,
          validationRules: [
            { type: 'min', value: 15, message: 'Must be at least 15 minutes' },
            { type: 'max', value: 480, message: 'Must be at most 8 hours' }
          ],
          lastModified: '2024-11-20T09:15:00Z',
          modifiedBy: adminId,
        },
        {
          id: 'config_004',
          category: 'integrations',
          name: 'api_rate_limit',
          displayName: 'API Rate Limit (per minute)',
          description: 'Maximum API calls allowed per minute per user',
          value: 100,
          dataType: 'number',
          isRequired: true,
          isReadonly: false,
          validationRules: [
            { type: 'min', value: 10, message: 'Must be at least 10' },
            { type: 'max', value: 1000, message: 'Must be at most 1000' }
          ],
          lastModified: '2024-12-01T08:00:00Z',
          modifiedBy: 'admin_002',
        },
        {
          id: 'config_005',
          category: 'backup',
          name: 'auto_backup_enabled',
          displayName: 'Automatic Backups',
          description: 'Enable automatic daily backups',
          value: true,
          dataType: 'boolean',
          isRequired: true,
          isReadonly: false,
          lastModified: '2024-11-25T16:45:00Z',
          modifiedBy: adminId,
        },
      ];

      // Load branding configuration
      const brandingData: BrandingConfiguration = {
        id: 'brand_001',
        institutionName: 'Manushi Coaching Institute',
        primaryColor: '#7C3AED',
        secondaryColor: '#EDE9FE',
        accentColor: '#DB2777',
        customDomains: ['learn.manushi.edu', 'portal.manushi.edu'],
        footerText: '© 2024 Manushi Coaching Institute. All rights reserved.',
        supportEmail: 'support@manushi.edu',
        supportPhone: '+1-555-MANUSHI',
        isWhiteLabel: false,
      };

      // Load feature controls
      const featuresData: FeatureControl[] = [
        {
          id: 'feat_001',
          featureName: 'live_classes',
          displayName: 'Live Classes',
          description: 'Enable live video classes functionality',
          isEnabled: true,
          enabledForRoles: ['teacher', 'student'],
          usageLimit: 1000,
          usageCount: 756,
          lastToggled: '2024-11-01T10:00:00Z',
          toggledBy: adminId,
        },
        {
          id: 'feat_002',
          featureName: 'ai_tutoring',
          displayName: 'AI Tutoring',
          description: 'Enable AI-powered tutoring and assistance',
          isEnabled: true,
          enabledForRoles: ['student'],
          usageLimit: 5000,
          usageCount: 3240,
          lastToggled: '2024-10-15T14:30:00Z',
          toggledBy: 'admin_001',
        },
        {
          id: 'feat_003',
          featureName: 'mobile_app',
          displayName: 'Mobile App Access',
          description: 'Allow access via mobile applications',
          isEnabled: true,
          enabledForRoles: ['student', 'teacher', 'parent'],
          lastToggled: '2024-09-01T08:00:00Z',
          toggledBy: adminId,
        },
        {
          id: 'feat_004',
          featureName: 'bulk_operations',
          displayName: 'Bulk Operations',
          description: 'Enable bulk user management operations',
          isEnabled: true,
          enabledForRoles: ['admin'],
          restrictions: [
            {
              type: 'user_limit',
              configuration: { maxUsers: 1000 }
            }
          ],
          lastToggled: '2024-11-10T12:00:00Z',
          toggledBy: adminId,
        },
        {
          id: 'feat_005',
          featureName: 'advanced_analytics',
          displayName: 'Advanced Analytics',
          description: 'Enable advanced reporting and analytics features',
          isEnabled: false,
          enabledForRoles: ['admin', 'teacher'],
          lastToggled: '2024-12-01T09:30:00Z',
          toggledBy: adminId,
        },
      ];

      // Load integrations
      const integrationsData: IntegrationService[] = [
        {
          id: 'int_001',
          serviceName: 'google_workspace',
          displayName: 'Google Workspace',
          description: 'Integration with Google Workspace for SSO and collaboration',
          category: 'authentication',
          isEnabled: true,
          configuration: {
            apiKey: 'gw_****_****_****',
            baseUrl: 'https://workspace.google.com',
            customFields: {
              domain: 'manushi.edu',
              enableSSO: true,
              syncCalendar: true,
            }
          },
          status: 'connected',
          lastSync: '2024-12-03T10:15:00Z',
        },
        {
          id: 'int_002',
          serviceName: 'stripe_payments',
          displayName: 'Stripe Payments',
          description: 'Payment processing integration with Stripe',
          category: 'payment',
          isEnabled: true,
          configuration: {
            apiKey: 'sk_****_****_****',
            webhookUrl: 'https://api.manushi.edu/webhooks/stripe',
            customFields: {
              currency: 'USD',
              enableRecurring: true,
              feePercentage: 2.9,
            }
          },
          status: 'connected',
          lastSync: '2024-12-03T09:45:00Z',
        },
        {
          id: 'int_003',
          serviceName: 'aws_s3',
          displayName: 'AWS S3 Storage',
          description: 'Cloud storage integration with Amazon S3',
          category: 'storage',
          isEnabled: true,
          configuration: {
            apiKey: 'AKIA****_****_****',
            secretKey: '****_****_****',
            customFields: {
              bucketName: 'manushi-content',
              region: 'us-east-1',
              encryption: true,
            }
          },
          status: 'connected',
          lastSync: '2024-12-03T11:00:00Z',
        },
        {
          id: 'int_004',
          serviceName: 'sendgrid_email',
          displayName: 'SendGrid Email',
          description: 'Email service integration with SendGrid',
          category: 'communication',
          isEnabled: false,
          configuration: {
            apiKey: '',
            customFields: {
              fromEmail: 'noreply@manushi.edu',
              fromName: 'Manushi Coaching Institute',
            }
          },
          status: 'disconnected',
        },
        {
          id: 'int_005',
          serviceName: 'google_analytics',
          displayName: 'Google Analytics',
          description: 'Website and app analytics integration',
          category: 'analytics',
          isEnabled: true,
          configuration: {
            apiKey: 'GA-****-****',
            customFields: {
              trackingId: 'G-XXXXXXXXXX',
              enableEcommerce: true,
              enableEvents: true,
            }
          },
          status: 'connected',
          lastSync: '2024-12-03T10:30:00Z',
        },
      ];

      // Load system health
      const healthData: SystemHealth = {
        id: 'health_001',
        timestamp: new Date().toISOString(),
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 34.5,
        networkLatency: 12,
        activeUsers: 1247,
        databaseConnections: 23,
        responseTime: 185,
        errorRate: 0.02,
        uptime: 99.94,
      };

      // Load performance metrics
      const performanceData: PerformanceMetric[] = [
        {
          id: 'perf_001',
          name: 'response_time',
          displayName: 'Average Response Time',
          category: 'application',
          currentValue: 185,
          threshold: 300,
          unit: 'ms',
          status: 'healthy',
          trend: 'stable',
          recommendations: ['Consider CDN optimization', 'Review database queries'],
        },
        {
          id: 'perf_002',
          name: 'memory_usage',
          displayName: 'Memory Usage',
          category: 'system',
          currentValue: 67.8,
          threshold: 85,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          recommendations: ['Monitor for memory leaks', 'Consider scaling up'],
        },
        {
          id: 'perf_003',
          name: 'error_rate',
          displayName: 'Error Rate',
          category: 'application',
          currentValue: 0.02,
          threshold: 1,
          unit: '%',
          status: 'healthy',
          trend: 'improving',
          recommendations: ['Continue monitoring', 'Review error logs weekly'],
        },
        {
          id: 'perf_004',
          name: 'database_connections',
          displayName: 'Database Connections',
          category: 'database',
          currentValue: 23,
          threshold: 100,
          unit: 'connections',
          status: 'healthy',
          trend: 'stable',
          recommendations: ['Connection pooling is optimal'],
        },
      ];

      // Load maintenance tasks
      const maintenanceData: MaintenanceTask[] = [
        {
          id: 'maint_001',
          name: 'daily_cleanup',
          description: 'Clean up temporary files and logs',
          type: 'cleanup',
          schedule: '0 2 * * *', // Daily at 2 AM
          isEnabled: true,
          lastRun: '2024-12-03T02:00:00Z',
          nextRun: '2024-12-04T02:00:00Z',
          status: 'completed',
          duration: 45, // minutes
          result: 'Cleaned 2.3GB of temporary files',
        },
        {
          id: 'maint_002',
          name: 'weekly_backup',
          description: 'Full system backup',
          type: 'backup',
          schedule: '0 1 * * 0', // Weekly on Sunday at 1 AM
          isEnabled: true,
          lastRun: '2024-12-01T01:00:00Z',
          nextRun: '2024-12-08T01:00:00Z',
          status: 'completed',
          duration: 180, // minutes
          result: 'Backup completed: 45.2GB archived',
        },
        {
          id: 'maint_003',
          name: 'database_optimization',
          description: 'Optimize database indexes and statistics',
          type: 'optimization',
          schedule: '0 3 */7 * *', // Every 7 days at 3 AM
          isEnabled: true,
          lastRun: '2024-11-28T03:00:00Z',
          nextRun: '2024-12-05T03:00:00Z',
          status: 'scheduled',
        },
        {
          id: 'maint_004',
          name: 'security_scan',
          description: 'System security vulnerability scan',
          type: 'monitoring',
          schedule: '0 0 */3 * *', // Every 3 days at midnight
          isEnabled: true,
          lastRun: '2024-12-02T00:00:00Z',
          nextRun: '2024-12-05T00:00:00Z',
          status: 'completed',
          duration: 25,
          result: 'No vulnerabilities detected',
        },
      ];

      // Load backup configuration
      const backupData: BackupConfiguration[] = [
        {
          id: 'backup_001',
          backupType: 'full',
          schedule: '0 1 * * 0', // Weekly full backup
          retention: 30,
          compression: true,
          encryption: true,
          destination: 'both',
          cloudProvider: 'aws',
          isEnabled: true,
          lastBackup: '2024-12-01T01:00:00Z',
          nextBackup: '2024-12-08T01:00:00Z',
          status: 'completed',
        },
        {
          id: 'backup_002',
          backupType: 'incremental',
          schedule: '0 2 * * 1-6', // Daily incremental backup
          retention: 7,
          compression: true,
          encryption: true,
          destination: 'cloud',
          cloudProvider: 'aws',
          isEnabled: true,
          lastBackup: '2024-12-03T02:00:00Z',
          nextBackup: '2024-12-04T02:00:00Z',
          status: 'completed',
        },
      ];

      setSystemConfig(configData);
      setBrandingConfig(brandingData);
      setFeatureControls(featuresData);
      setIntegrations(integrationsData);
      setSystemHealth(healthData);
      setPerformanceMetrics(performanceData);
      setMaintenanceTasks(maintenanceData);
      setBackupConfig(backupData);
    } catch (error) {
      Alert.alert('error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Configuration management
  const handleEditConfig = (config: SystemConfiguration) => {
    setSelectedConfig(config);
    setShowConfigModal(true);
  };

  const handleSaveConfig = (configId: string, newValue: any) => {
    setSystemConfig(configs => configs.map(config => 
      config.id === configId 
        ? { ...config, value: newValue, lastModified: new Date().toISOString(), modifiedBy: adminId }
        : config
    ));
    Alert.alert('success', 'Configuration updated successfully');
  };

  const handleToggleFeature = (featureId: string) => {
    setFeatureControls(features => features.map(feature =>
      feature.id === featureId
        ? { 
            ...feature, 
            isEnabled: !feature.isEnabled,
            lastToggled: new Date().toISOString(),
            toggledBy: adminId 
          }
        : feature
    ));
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(integrations => integrations.map(integration =>
      integration.id === integrationId
        ? { 
            ...integration, 
            isEnabled: !integration.isEnabled,
            status: integration.isEnabled ? 'disconnected' : 'connected'
          }
        : integration
    ));
  };

  const handleRunMaintenance = (taskId: string) => {
    Alert.alert(
      'Run Maintenance Task',
      'Are you sure you want to run this maintenance task now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run',
          onPress: () => {
            setMaintenanceTasks(tasks => tasks.map(task =>
              task.id === taskId
                ? { ...task, status: 'running' as const }
                : task
            ));
            
            // Simulate task completion after 3 seconds
            setTimeout(() => {
              setMaintenanceTasks(tasks => tasks.map(task =>
                task.id === taskId
                  ? { 
                      ...task, 
                      status: 'completed' as const,
                      lastRun: new Date().toISOString(),
                      duration: Math.floor(Math.random() * 60) + 10,
                      result: 'Manual execution completed successfully'
                    }
                  : task
              ));
              Alert.alert('success', 'Maintenance task completed successfully');
            }, 3000);
          }
        }
      ]
    );
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
      case 'healthy': return LightTheme.Success;
      case 'running':
      case 'pending':
      case 'warning': return LightTheme.Warning;
      case 'disconnected':
      case 'failed':
      case 'error':
      case 'critical': return LightTheme.Error;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getHealthColor = (value: number, threshold: number, reverse: boolean = false) => {
    const ratio = value / threshold;
    if (reverse) {
      return ratio < 0.5 ? LightTheme.Success : ratio < 0.8 ? LightTheme.Warning : LightTheme.Error;
    }
    return ratio < 0.7 ? LightTheme.Success : ratio < 0.9 ? LightTheme.Warning : LightTheme.Error;
  };

  // Render functions
  const renderConfigItem = (config: SystemConfiguration) => (
    <View key={config.id} style={styles.configCard}>
      <View style={styles.configHeader}>
        <View style={styles.configInfo}>
          <Text style={styles.configTitle}>{config.displayName}</Text>
          <Text style={styles.configDescription}>{config.description}</Text>
          <Text style={styles.configMeta}>
            Modified: {new Date(config.lastModified).toLocaleDateString()} by {config.modifiedBy}
          </Text>
        </View>
        <View style={styles.configValue}>
          {config.dataType === 'boolean' ? (
            <Switch
              value={config.value as boolean}
              onValueChange={(newValue) => handleSaveConfig(config.id, newValue)}
              disabled={config.isReadonly}
              trackColor={{ false: LightTheme.Outline, true: LightTheme.primaryContainer }}
              thumbColor={config.value ? LightTheme.Primary : LightTheme.OnSurfaceVariant}
            />
          ) : (
            <TouchableOpacity
              style={[styles.configValueButton, config.isReadonly && styles.readonlyButton]}
              onPress={() => !config.isReadonly && handleEditConfig(config)}
            >
              <Text style={styles.configValueText}>{String(config.value)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderFeatureItem = (feature: FeatureControl) => (
    <View key={feature.id} style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <View style={styles.featureInfo}>
          <Text style={styles.featureTitle}>{feature.displayName}</Text>
          <Text style={styles.featureDescription}>{feature.description}</Text>
          <View style={styles.featureMeta}>
            <Text style={styles.featureMetaText}>
              Roles: {feature.enabledForRoles.join(', ')}
            </Text>
            {feature.usageLimit && (
              <Text style={styles.featureMetaText}>
                Usage: {feature.usageCount}/{feature.usageLimit}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={feature.isEnabled}
          onValueChange={() => handleToggleFeature(feature.id)}
          trackColor={{ false: LightTheme.Outline, true: LightTheme.primaryContainer }}
          thumbColor={feature.isEnabled ? LightTheme.Primary : LightTheme.OnSurfaceVariant}
        />
      </View>
      {feature.usageLimit && (
        <View style={styles.usageBar}>
          <View style={styles.usageProgress}>
            <View style={[styles.usageProgressFill, {
              width: `${(feature.usageCount / feature.usageLimit) * 100}%`,
              backgroundColor: feature.usageCount > feature.usageLimit * 0.9 ? LightTheme.Error : LightTheme.Success
            }]} />
          </View>
        </View>
      )}
    </View>
  );

  const renderIntegrationItem = (integration: IntegrationService) => (
    <View key={integration.id} style={styles.integrationCard}>
      <View style={styles.integrationHeader}>
        <View style={styles.integrationInfo}>
          <Text style={styles.integrationTitle}>{integration.displayName}</Text>
          <Text style={styles.integrationDescription}>{integration.description}</Text>
          <View style={styles.integrationMeta}>
            <View style={[styles.statusTag, { backgroundColor: getStatusColor(integration.status) }]}>
              <Text style={styles.statusTagText}>{integration.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.categoryTag}>{integration.category.toUpperCase()}</Text>
          </View>
          {integration.lastSync && (
            <Text style={styles.syncText}>
              Last sync: {new Date(integration.lastSync).toLocaleString()}
            </Text>
          )}
        </View>
        <Switch
          value={integration.isEnabled}
          onValueChange={() => handleToggleIntegration(integration.id)}
          trackColor={{ false: LightTheme.Outline, true: LightTheme.primaryContainer }}
          thumbColor={integration.isEnabled ? LightTheme.Primary : LightTheme.OnSurfaceVariant}
        />
      </View>
      <View style={styles.integrationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.configureButton]}
          onPress={() => {
            setSelectedIntegration(integration);
            setShowIntegrationModal(true);
          }}
        >
          <Text style={styles.actionButtonText}>Configure</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={() => Alert.alert('Test Connection', `Testing ${integration.displayName} connection...`)}
        >
          <Text style={styles.actionButtonText}>Test</Text>
        </TouchableOpacity>
      </View>
      {integration.errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {integration.errorMessage}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('back')}
        >
          <Text style={styles.backButtonText}>← Admin Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => Alert.alert('Changes Saved', 'All configuration changes have been applied')}
        >
          <Text style={styles.saveButtonText}>💾 Save All</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['general', 'branding', 'features', 'integrations', 'monitoring'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'general' && (
          <View>
            <Text style={styles.sectionTitle}>General Configuration</Text>
            {systemConfig
              .filter(config => config.category === 'general' || config.category === 'security')
              .map(renderConfigItem)}
          </View>
        )}

        {activeTab === 'branding' && brandingConfig && (
          <View>
            <Text style={styles.sectionTitle}>Branding & White-Label Configuration</Text>
            <View style={styles.brandingPreview}>
              <View style={[styles.colorSwatch, { backgroundColor: brandingConfig.primaryColor }]}>
                <Text style={styles.colorLabel}>Primary</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: brandingConfig.secondaryColor }]}>
                <Text style={styles.colorLabel}>Secondary</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: brandingConfig.accentColor }]}>
                <Text style={styles.colorLabel}>Accent</Text>
              </View>
            </View>
            <View style={styles.brandingCard}>
              <Text style={styles.brandingTitle}>Institution: {brandingConfig.institutionName}</Text>
              <Text style={styles.brandingText}>Support: {brandingConfig.supportEmail}</Text>
              <Text style={styles.brandingText}>Domains: {brandingConfig.customDomains.length} configured</Text>
              <Text style={styles.brandingText}>
                White-label: {brandingConfig.isWhiteLabel ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'features' && (
          <View>
            <Text style={styles.sectionTitle}>Feature Controls</Text>
            {featureControls.map(renderFeatureItem)}
          </View>
        )}

        {activeTab === 'integrations' && (
          <View>
            <Text style={styles.sectionTitle}>Third-Party Integrations</Text>
            {integrations.map(renderIntegrationItem)}
          </View>
        )}

        {activeTab === 'monitoring' && systemHealth && (
          <View>
            <Text style={styles.sectionTitle}>System Health & Performance</Text>
            
            {/* System Health Overview */}
            <View style={styles.healthCard}>
              <Text style={styles.healthTitle}>System Health Overview</Text>
              <View style={styles.healthGrid}>
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{systemHealth.cpuUsage.toFixed(1)}%</Text>
                  <Text style={styles.healthLabel}>CPU</Text>
                  <View style={[styles.healthIndicator, { 
                    backgroundColor: getHealthColor(systemHealth.cpuUsage, 100) 
                  }]} />
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{systemHealth.memoryUsage.toFixed(1)}%</Text>
                  <Text style={styles.healthLabel}>Memory</Text>
                  <View style={[styles.healthIndicator, { 
                    backgroundColor: getHealthColor(systemHealth.memoryUsage, 100) 
                  }]} />
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{systemHealth.diskUsage.toFixed(1)}%</Text>
                  <Text style={styles.healthLabel}>Disk</Text>
                  <View style={[styles.healthIndicator, { 
                    backgroundColor: getHealthColor(systemHealth.diskUsage, 100) 
                  }]} />
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{systemHealth.uptime.toFixed(2)}%</Text>
                  <Text style={styles.healthLabel}>Uptime</Text>
                  <View style={[styles.healthIndicator, { 
                    backgroundColor: getHealthColor(systemHealth.uptime, 100, true) 
                  }]} />
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <Text style={styles.subsectionTitle}>Performance Metrics</Text>
            {performanceMetrics.map((metric) => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricTitle}>{metric.displayName}</Text>
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(metric.status) }]}>
                    <Text style={styles.statusTagText}>{metric.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.metricValue}>
                  <Text style={styles.metricNumber}>
                    {metric.currentValue} {metric.unit}
                  </Text>
                  <Text style={styles.metricThreshold}>
                    Threshold: {metric.threshold} {metric.unit}
                  </Text>
                </View>
                {metric.recommendations.length > 0 && (
                  <View style={styles.recommendations}>
                    <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                    {metric.recommendations.map((rec, index) => (
                      <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Maintenance Tasks */}
            <Text style={styles.subsectionTitle}>Automated Maintenance</Text>
            {maintenanceTasks.map((task) => (
              <View key={task.id} style={styles.maintenanceCard}>
                <View style={styles.maintenanceHeader}>
                  <View style={styles.maintenanceInfo}>
                    <Text style={styles.maintenanceTitle}>{task.name}</Text>
                    <Text style={styles.maintenanceDescription}>{task.description}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusTagText}>{task.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.maintenanceDetails}>
                  <Text style={styles.maintenanceText}>Schedule: {task.schedule}</Text>
                  <Text style={styles.maintenanceText}>Next run: {new Date(task.nextRun).toLocaleString()}</Text>
                  {task.lastRun && (
                    <Text style={styles.maintenanceText}>
                      Last run: {new Date(task.lastRun).toLocaleString()}
                      {task.duration && ` (${task.duration}m)`}
                    </Text>
                  )}
                  {task.result && (
                    <Text style={styles.resultText}>{task.result}</Text>
                  )}
                </View>
                <View style={styles.maintenanceActions}>
                  <Switch
                    value={task.isEnabled}
                    onValueChange={(enabled) => {
                      setMaintenanceTasks(tasks => tasks.map(t =>
                        t.id === task.id ? { ...t, isEnabled: enabled } : t
                      ));
                    }}
                    trackColor={{ false: LightTheme.Outline, true: LightTheme.primaryContainer }}
                    thumbColor={task.isEnabled ? LightTheme.Primary : LightTheme.OnSurfaceVariant}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.runButton]}
                    onPress={() => handleRunMaintenance(task.id)}
                    disabled={task.status === 'running'}
                  >
                    <Text style={styles.actionButtonText}>
                      {task.status === 'running' ? 'Running...' : 'Run Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  backButton: {
    padding: Spacing.XS,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: LightTheme.Success,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  saveButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    paddingHorizontal: Spacing.MD,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: LightTheme.Primary,
  },
  tabText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  activeTabText: {
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.MD,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  subsectionTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginTop: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  configCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  configTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  configDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  configMeta: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  configValue: {
    alignItems: 'flex-end',
  },
  configValueButton: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.XS,
  },
  readonlyButton: {
    backgroundColor: LightTheme.Outline,
  },
  configValueText: {
    ...Typography.bodySmall,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  brandingPreview: {
    flexDirection: 'row',
    marginBottom: Spacing.MD,
    gap: Spacing.SM,
  },
  colorSwatch: {
    flex: 1,
    height: 60,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorLabel: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  brandingCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  brandingTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  brandingText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS / 2,
  },
  featureCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  featureInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  featureDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  featureMeta: {
    gap: Spacing.XS / 2,
  },
  featureMetaText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  usageBar: {
    marginTop: Spacing.SM,
  },
  usageProgress: {
    height: 4,
    backgroundColor: LightTheme.Outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
  },
  integrationCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  integrationInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  integrationTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  integrationDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  integrationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  statusTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  statusTagText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  categoryTag: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  syncText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
  integrationActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.XS,
    alignItems: 'center',
    borderRadius: BorderRadius.XS,
  },
  configureButton: {
    backgroundColor: LightTheme.Info,
  },
  testButton: {
    backgroundColor: LightTheme.Warning,
  },
  runButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: LightTheme.errorContainer,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
    marginTop: Spacing.SM,
  },
  errorText: {
    ...Typography.bodySmall,
    color: LightTheme.Error,
  },
  healthCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  healthTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  healthItem: {
    flex: 1,
    alignItems: 'center',
  },
  healthValue: {
    ...Typography.headlineSmall,
    color: LightTheme.OnSurface,
    fontWeight: '700',
  },
  healthLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginVertical: Spacing.XS,
  },
  healthIndicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  metricCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metricTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metricNumber: {
    ...Typography.headlineSmall,
    color: LightTheme.Primary,
    fontWeight: '700',
  },
  metricThreshold: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  recommendations: {
    backgroundColor: LightTheme.Background,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
  },
  recommendationsTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  recommendationText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  maintenanceCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  maintenanceInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  maintenanceTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  maintenanceDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  maintenanceDetails: {
    marginBottom: Spacing.SM,
  },
  maintenanceText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  resultText: {
    ...Typography.bodySmall,
    color: LightTheme.Success,
    fontStyle: 'italic',
    marginTop: Spacing.XS / 2,
  },
  maintenanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SystemSettingsScreen;