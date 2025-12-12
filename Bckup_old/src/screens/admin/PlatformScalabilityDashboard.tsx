import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface InfrastructureMetrics {
  servers: {
    total: number;
    active: number;
    utilization: number;
    regions: string[];
  };
  database: {
    connections: number;
    queryTime: number;
    storage: number;
    replication: string;
  };
  cdn: {
    requests: number;
    hitRatio: number;
    bandwidth: number;
    globalNodes: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    uptime: number;
    errorRate: number;
  };
}

interface TenantConfiguration {
  id: string;
  organizationName: string;
  subdomain: string;
  customDomain?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    customCSS?: string;
  };
  features: string[];
  userLimits: {
    students: number;
    teachers: number;
    admins: number;
  };
  storageLimit: number;
  plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'trial' | 'setup';
  createdAt: Date;
  lastActive: Date;
  region: string;
}

interface GlobalDeployment {
  region: string;
  country: string;
  status: 'active' | 'maintenance' | 'deploying' | 'error';
  users: number;
  latency: number;
  uptime: number;
  dataCenter: string;
  compliance: string[];
  languages: string[];
}

interface APIIntegration {
  id: string;
  name: string;
  type: 'authentication' | 'lms' | 'payment' | 'communication' | 'analytics' | 'storage';
  version: string;
  status: 'connected' | 'error' | 'maintenance' | 'deprecated';
  usage: number;
  rateLimits: {
    current: number;
    limit: number;
  };
  lastSync: Date;
  description: string;
  documentation: string;
}

interface ScalabilityAlert {
  id: string;
  type: 'performance' | 'capacity' | 'security' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  recommendation: string;
  timestamp: Date;
  isResolved: boolean;
}

const PlatformScalabilityDashboard: React.FC<{
  adminId: string;
  onNavigate: (screen: string) => void;
}> = ({ adminId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'tenants' | 'global' | 'integrations'>('overview');
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantConfiguration | null>(null);
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);

  // Mock data
  const [infrastructureMetrics] = useState<InfrastructureMetrics>({
    servers: {
      total: 24,
      active: 22,
      utilization: 67.5,
      regions: ['us-east-1', 'eu-west-1', 'ap-south-1', 'ap-southeast-1'],
    },
    database: {
      connections: 1250,
      queryTime: 2.3,
      storage: 2.8,
      replication: 'multi-master',
    },
    cdn: {
      requests: 15600000,
      hitRatio: 94.2,
      bandwidth: 125.7,
      globalNodes: 18,
    },
    performance: {
      responseTime: 187,
      throughput: 8500,
      uptime: 99.97,
      errorRate: 0.03,
    },
  });

  const [tenantConfigurations] = useState<TenantConfiguration[]>([
    {
      id: 'tenant_1',
      organizationName: 'Excellence Education Hub',
      subdomain: 'excellence-edu',
      customDomain: 'learn.excellencehub.com',
      theme: {
        primaryColor: '#1976D2',
        secondaryColor: '#FFC107',
        logo: 'excellence_logo.png',
      },
      features: ['ai-tutoring', 'voice-assessment', 'analytics', 'mobile-app', 'api-access'],
      userLimits: {
        students: 10000,
        teachers: 500,
        admins: 50,
      },
      storageLimit: 500,
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date('2023-08-15'),
      lastActive: new Date(),
      region: 'us-east-1',
    },
    {
      id: 'tenant_2',
      organizationName: 'Bright Minds Coaching',
      subdomain: 'bright-minds',
      theme: {
        primaryColor: '#4CAF50',
        secondaryColor: '#FF5722',
        logo: 'bright_minds_logo.png',
      },
      features: ['basic-features', 'analytics', 'mobile-app'],
      userLimits: {
        students: 5000,
        teachers: 200,
        admins: 20,
      },
      storageLimit: 200,
      plan: 'professional',
      status: 'active',
      createdAt: new Date('2023-11-20'),
      lastActive: new Date(Date.now() - 3600000), // 1 hour ago
      region: 'ap-south-1',
    },
    {
      id: 'tenant_3',
      organizationName: 'Future Leaders Academy',
      subdomain: 'future-leaders',
      theme: {
        primaryColor: '#9C27B0',
        secondaryColor: '#00BCD4',
        logo: 'future_leaders_logo.png',
      },
      features: ['basic-features'],
      userLimits: {
        students: 1000,
        teachers: 50,
        admins: 5,
      },
      storageLimit: 50,
      plan: 'basic',
      status: 'trial',
      createdAt: new Date('2024-12-01'),
      lastActive: new Date(Date.now() - 1800000), // 30 minutes ago
      region: 'eu-west-1',
    },
  ]);

  const [globalDeployments] = useState<GlobalDeployment[]>([
    {
      region: 'North America',
      country: 'United States',
      status: 'active',
      users: 45230,
      latency: 45,
      uptime: 99.98,
      dataCenter: 'AWS us-east-1',
      compliance: ['SOC 2', 'COPPA', 'FERPA'],
      languages: ['English', 'Spanish'],
    },
    {
      region: 'Europe',
      country: 'Ireland',
      status: 'active',
      users: 28450,
      latency: 38,
      uptime: 99.95,
      dataCenter: 'AWS eu-west-1',
      compliance: ['GDPR', 'ISO 27001'],
      languages: ['English', 'French', 'German', 'Spanish'],
    },
    {
      region: 'Asia Pacific',
      country: 'India',
      status: 'active',
      users: 67890,
      latency: 52,
      uptime: 99.96,
      dataCenter: 'AWS ap-south-1',
      compliance: ['DPDP Act 2023'],
      languages: ['Hindi', 'English', 'Bengali', 'Tamil'],
    },
    {
      region: 'Asia Pacific',
      country: 'Singapore',
      status: 'maintenance',
      users: 15620,
      latency: 42,
      uptime: 99.87,
      dataCenter: 'AWS ap-southeast-1',
      compliance: ['PDPA'],
      languages: ['English', 'Chinese', 'Malay'],
    },
  ]);

  const [apiIntegrations] = useState<APIIntegration[]>([
    {
      id: 'integration_1',
      name: 'Google Workspace SSO',
      type: 'authentication',
      version: 'v2.1',
      status: 'connected',
      usage: 15600,
      rateLimits: {
        current: 8750,
        limit: 10000,
      },
      lastSync: new Date(Date.now() - 300000),
      description: 'Single Sign-On integration with Google Workspace for seamless authentication',
      documentation: 'https://docs.google.com/workspace/sso',
    },
    {
      id: 'integration_2',
      name: 'Zoom Video Conferencing',
      type: 'communication',
      version: 'v5.2',
      status: 'connected',
      usage: 23400,
      rateLimits: {
        current: 1200,
        limit: 5000,
      },
      lastSync: new Date(Date.now() - 180000),
      description: 'Video conferencing integration for live classes and meetings',
      documentation: 'https://marketplace.zoom.us/docs',
    },
    {
      id: 'integration_3',
      name: 'Stripe Payment Processing',
      type: 'payment',
      version: 'v3.4',
      status: 'connected',
      usage: 8920,
      rateLimits: {
        current: 450,
        limit: 1000,
      },
      lastSync: new Date(Date.now() - 120000),
      description: 'Secure payment processing for subscriptions and one-time payments',
      documentation: 'https://stripe.com/docs/api',
    },
    {
      id: 'integration_4',
      name: 'AWS S3 Storage',
      type: 'storage',
      version: 'v4.0',
      status: 'connected',
      usage: 45600,
      rateLimits: {
        current: 25000,
        limit: 50000,
      },
      lastSync: new Date(Date.now() - 60000),
      description: 'Scalable cloud storage for documents, videos, and user-generated content',
      documentation: 'https://docs.aws.amazon.com/s3/',
    },
    {
      id: 'integration_5',
      name: 'Legacy LMS Bridge',
      type: 'lms',
      version: 'v1.8',
      status: 'deprecated',
      usage: 1200,
      rateLimits: {
        current: 50,
        limit: 100,
      },
      lastSync: new Date(Date.now() - 86400000),
      description: 'Bridge integration with legacy Learning Management Systems (scheduled for retirement)',
      documentation: 'https://legacy-lms.docs.com/api',
    },
  ]);

  const [scalabilityAlerts] = useState<ScalabilityAlert[]>([
    {
      id: 'alert_1',
      type: 'performance',
      severity: 'warning',
      title: 'Database Query Performance Degradation',
      description: 'Average query response time has increased by 25% over the past hour',
      metric: 'avg_query_time',
      currentValue: 2.8,
      threshold: 2.5,
      recommendation: 'Consider implementing query optimization or adding read replicas',
      timestamp: new Date(Date.now() - 300000),
      isResolved: false,
    },
    {
      id: 'alert_2',
      type: 'capacity',
      severity: 'error',
      title: 'Storage Capacity Critical',
      description: 'Database storage utilization has exceeded 85% threshold',
      metric: 'storage_usage',
      currentValue: 87.5,
      threshold: 85,
      recommendation: 'Immediate action required: Expand storage capacity or implement data archiving',
      timestamp: new Date(Date.now() - 600000),
      isResolved: false,
    },
    {
      id: 'alert_3',
      type: 'security',
      severity: 'info',
      title: 'SSL Certificate Renewal Due',
      description: 'SSL certificates for 3 domains will expire within 30 days',
      metric: 'ssl_expiry_days',
      currentValue: 28,
      threshold: 30,
      recommendation: 'Schedule SSL certificate renewal to avoid service interruption',
      timestamp: new Date(Date.now() - 86400000),
      isResolved: false,
    },
  ]);

  const renderOverview = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* System Health Overview */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.MD }]}>
          Platform Health & Scalability
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[
            { label: 'Global Uptime', value: `${infrastructureMetrics.performance.uptime}%`, trend: '+0.02%', color: '#4CAF50' },
            { label: 'Response Time', value: `${infrastructureMetrics.performance.responseTime}ms`, trend: '-15ms', color: '#2196F3' },
            { label: 'Active Tenants', value: tenantConfigurations.filter(t => t.status === 'active').length.toString(), trend: '+3', color: '#FF9800' },
            { label: 'Global Users', value: globalDeployments.reduce((sum, region) => sum + region.users, 0).toLocaleString(), trend: '+12K', color: '#9C27B0' },
          ].map((metric, index) => (
            <View key={index} style={{
              width: '48%',
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
              alignItems: 'center',
            }}>
              <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                {metric.value}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                {metric.label}
              </Text>
              <View style={{
                backgroundColor: metric.trend.startsWith('+') || metric.trend.startsWith('-15') ? '#E8F5E8' : '#FFEBEE',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                marginTop: 4,
              }}>
                <Text style={[Typography.bodySmall, { 
                  color: metric.trend.startsWith('+') || metric.trend.startsWith('-15') ? '#2E7D32' : '#D32F2F', 
                  fontSize: 10, 
                  fontWeight: '600' 
                }]}>
                  {metric.trend}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Auto-Scaling Configuration */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
            Auto-Scaling Management
          </Text>
          <Switch
            value={autoScalingEnabled}
            onValueChange={setAutoScalingEnabled}
            trackColor={{ false: '#CCC', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.MD }}>
          {[
            { label: 'CPU Threshold', value: '70%', status: 'normal' },
            { label: 'Memory Threshold', value: '80%', status: 'normal' },
            { label: 'Scale-up Time', value: '3 min', status: 'normal' },
            { label: 'Scale-down Time', value: '10 min', status: 'normal' },
          ].map((config, index) => (
            <View key={index} style={{
              alignItems: 'center',
              backgroundColor: LightTheme.SurfaceVariant,
              padding: Spacing.SM,
              borderRadius: 8,
              minWidth: 70,
            }}>
              <Text style={[Typography.bodySmall, { fontWeight: '600' }]}>{config.value}</Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, fontSize: 9 }]}>
                {config.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{
          backgroundColor: autoScalingEnabled ? '#E8F5E8' : '#F5F5F5',
          padding: Spacing.MD,
          borderRadius: 12,
        }}>
          <Text style={[Typography.bodyMedium, { fontWeight: '600', marginBottom: 4 }]}>
            Current Status: {autoScalingEnabled ? 'Active' : 'Disabled'}
          </Text>
          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
            {autoScalingEnabled 
              ? 'System will automatically scale resources based on demand patterns and predefined thresholds'
              : 'Manual scaling required. Resources will not adjust automatically to demand changes'
            }
          </Text>
        </View>
      </View>

      {/* Active Alerts */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
            Active Alerts
          </Text>
          <View style={{
            backgroundColor: scalabilityAlerts.filter(a => !a.isResolved).length > 0 ? '#FFEBEE' : '#E8F5E8',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={[Typography.bodySmall, {
              color: scalabilityAlerts.filter(a => !a.isResolved).length > 0 ? '#D32F2F' : '#2E7D32',
              fontSize: 10,
              fontWeight: '600',
            }]}>
              {scalabilityAlerts.filter(a => !a.isResolved).length} Active
            </Text>
          </View>
        </View>

        {scalabilityAlerts.filter(a => !a.isResolved).slice(0, 3).map((alert) => (
          <View key={alert.id} style={{
            backgroundColor: alert.severity === 'critical' ? '#FFEBEE' : 
                            alert.severity === 'error' ? '#FFF3E0' : 
                            alert.severity === 'warning' ? '#E3F2FD' : '#E8F5E8',
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
            borderLeftWidth: 4,
            borderLeftColor: alert.severity === 'critical' ? '#F44336' : 
                             alert.severity === 'error' ? '#FF5722' : 
                             alert.severity === 'warning' ? '#FF9800' : '#4CAF50',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon 
                    name={alert.type === 'performance' ? 'speed' : 
                          alert.type === 'capacity' ? 'storage' : 
                          alert.type === 'security' ? 'security' : 'rule'} 
                    size={16} 
                    color={alert.severity === 'critical' ? '#F44336' : 
                           alert.severity === 'error' ? '#FF5722' : 
                           alert.severity === 'warning' ? '#FF9800' : '#4CAF50'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>
                    {alert.title}
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {alert.description}
                </Text>
              </View>
              <View style={{
                backgroundColor: alert.severity === 'critical' ? '#F44336' : 
                                alert.severity === 'error' ? '#FF5722' : 
                                alert.severity === 'warning' ? '#FF9800' : '#4CAF50',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={[Typography.bodySmall, {
                  color: '#FFFFFF',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }]}>
                  {alert.severity}
                </Text>
              </View>
            </View>

            <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, fontStyle: 'italic', marginBottom: Spacing.SM }]}>
              Recommendation: {alert.recommendation}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {alert.currentValue} {alert.metric} (threshold: {alert.threshold})
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {alert.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Secondary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => Alert.alert('Alert Management', 'Full alert management interface coming soon')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSecondary, fontWeight: '600' }]}>
            Manage All Alerts
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderInfrastructure = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Infrastructure Overview */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.MD }]}>
          Infrastructure Metrics
        </Text>

        {/* Server Metrics */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Server Infrastructure
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Total Servers', value: infrastructureMetrics.servers.total.toString(), color: '#2196F3' },
              { label: 'Active Servers', value: infrastructureMetrics.servers.active.toString(), color: '#4CAF50' },
              { label: 'Utilization', value: `${infrastructureMetrics.servers.utilization}%`, color: '#FF9800' },
              { label: 'Regions', value: infrastructureMetrics.servers.regions.length.toString(), color: '#9C27B0' },
            ].map((metric, index) => (
              <View key={index} style={{
                width: '48%',
                backgroundColor: LightTheme.SurfaceVariant,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.SM,
                alignItems: 'center',
              }}>
                <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                  {metric.value}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Database Metrics */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Database Performance
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Active Connections', value: infrastructureMetrics.database.connections.toString(), color: '#2196F3' },
              { label: 'Query Time', value: `${infrastructureMetrics.database.queryTime}ms`, color: '#4CAF50' },
              { label: 'Storage Used', value: `${infrastructureMetrics.database.storage}TB`, color: '#FF9800' },
              { label: 'Replication', value: infrastructureMetrics.database.replication, color: '#9C27B0' },
            ].map((metric, index) => (
              <View key={index} style={{
                width: '48%',
                backgroundColor: LightTheme.SurfaceVariant,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.SM,
                alignItems: 'center',
              }}>
                <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                  {typeof metric.value === 'string' && metric.value.includes('multi') ? 'Multi' : metric.value}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CDN Metrics */}
        <View>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            CDN Performance
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Requests/Day', value: `${(infrastructureMetrics.cdn.requests / 1000000).toFixed(1)}M`, color: '#2196F3' },
              { label: 'Hit Ratio', value: `${infrastructureMetrics.cdn.hitRatio}%`, color: '#4CAF50' },
              { label: 'Bandwidth', value: `${infrastructureMetrics.cdn.bandwidth}GB/s`, color: '#FF9800' },
              { label: 'Global Nodes', value: infrastructureMetrics.cdn.globalNodes.toString(), color: '#9C27B0' },
            ].map((metric, index) => (
              <View key={index} style={{
                width: '48%',
                backgroundColor: LightTheme.SurfaceVariant,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.SM,
                alignItems: 'center',
              }}>
                <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                  {metric.value}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTenants = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={tenantConfigurations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedTenant(item);
              setShowTenantModal(true);
            }}
            style={{
              backgroundColor: LightTheme.Surface,
              borderRadius: 12,
              padding: Spacing.MD,
              marginHorizontal: Spacing.MD,
              marginBottom: Spacing.SM,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600' }]}>
                  {item.organizationName}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {item.subdomain}.platform.com
                </Text>
                {item.customDomain && (
                  <Text style={[Typography.bodySmall, { color: LightTheme.Primary, marginTop: 2 }]}>
                    Custom: {item.customDomain}
                  </Text>
                )}
              </View>
              <View style={{
                backgroundColor: item.status === 'active' ? '#E8F5E8' : 
                                item.status === 'trial' ? '#E3F2FD' : 
                                item.status === 'suspended' ? '#FFEBEE' : '#F5F5F5',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={[Typography.bodySmall, {
                  color: item.status === 'active' ? '#2E7D32' : 
                         item.status === 'trial' ? '#1976D2' : 
                         item.status === 'suspended' ? '#D32F2F' : '#666',
                  fontSize: 10,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: item.theme.primaryColor,
                  marginRight: 8,
                }} />
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textTransform: 'capitalize' }]}>
                  {item.plan} Plan
                </Text>
              </View>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {item.region}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Students: {item.userLimits.students.toLocaleString()}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Teachers: {item.userLimits.teachers}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Storage: {item.storageLimit}GB
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {item.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={{
                  backgroundColor: LightTheme.TertiaryContainer,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginRight: 4,
                  marginBottom: 2,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnTertiaryContainer, fontSize: 9 }]}>
                    {feature.replace('-', ' ')}
                  </Text>
                </View>
              ))}
              {item.features.length > 3 && (
                <View style={{
                  backgroundColor: LightTheme.SurfaceVariant,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginRight: 4,
                  marginBottom: 2,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, fontSize: 9 }]}>
                    +{item.features.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: Spacing.MD,
            paddingVertical: Spacing.SM,
          }}>
            <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
              Multi-Tenant Configurations
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Add Tenant', 'New tenant setup wizard coming soon')}
              style={{
                backgroundColor: LightTheme.Primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Icon name="add" size={16} color={LightTheme.OnPrimary} />
              <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, marginLeft: 4, fontWeight: '600' }]}>
                Add Tenant
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'infrastructure':
        return renderInfrastructure();
      case 'tenants':
        return renderTenants();
      case 'global':
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={Typography.titleMedium}>Global Deployment Coming Soon</Text>
        </View>;
      case 'integrations':
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={Typography.titleMedium}>API Integrations Coming Soon</Text>
        </View>;
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.LG,
        paddingVertical: Spacing.MD,
        backgroundColor: LightTheme.Surface,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity onPress={() => onNavigate('back')}>
          <Icon name="arrow-back" size={24} color={LightTheme.OnSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.MD }}>
          <Text style={[Typography.titleLarge, { fontWeight: '700', color: LightTheme.Primary }]}>
            Platform Scalability
          </Text>
          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
            Multi-Tenant Architecture & Global Deployment
          </Text>
        </View>
        <TouchableOpacity>
          <Icon name="cloud" size={24} color={LightTheme.Primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: LightTheme.Surface,
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'infrastructure', label: 'Infrastructure', icon: 'dns' },
            { key: 'tenants', label: 'Tenants', icon: 'business' },
            { key: 'global', label: 'Global', icon: 'public' },
            { key: 'integrations', label: 'APIs', icon: 'api' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginRight: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? LightTheme.Primary : 'transparent',
                minWidth: 80,
              }}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant}
              />
              <Text style={[
                Typography.bodySmall,
                {
                  marginTop: 2,
                  color: activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: 10,
                },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Tenant Details Modal */}
      <Modal visible={showTenantModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.LG,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.LG,
            }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
                Tenant Configuration
              </Text>
              <TouchableOpacity onPress={() => setShowTenantModal(false)}>
                <Icon name="close" size={24} color={LightTheme.OnSurface} />
              </TouchableOpacity>
            </View>

            {selectedTenant && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                  {selectedTenant.organizationName}
                </Text>
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.LG }]}>
                  {selectedTenant.subdomain}.platform.com
                </Text>

                <View style={{
                  backgroundColor: LightTheme.SurfaceVariant,
                  padding: Spacing.MD,
                  borderRadius: 12,
                  marginBottom: Spacing.MD,
                }}>
                  <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                    Configuration Details
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Plan: <Text style={{ fontWeight: '600', textTransform: 'capitalize' }}>{selectedTenant.plan}</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Region: <Text style={{ fontWeight: '600' }}>{selectedTenant.region}</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Storage Limit: <Text style={{ fontWeight: '600' }}>{selectedTenant.storageLimit}GB</Text>
                  </Text>
                  <Text style={[Typography.bodySmall]}>
                    Created: <Text style={{ fontWeight: '600' }}>{selectedTenant.createdAt.toLocaleDateString()}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: LightTheme.Primary,
                    paddingVertical: 12,
                    borderRadius: 25,
                    alignItems: 'center',
                    marginTop: Spacing.MD,
                  }}
                  onPress={() => setShowTenantModal(false)}
                >
                  <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
                    Manage Configuration
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PlatformScalabilityDashboard;