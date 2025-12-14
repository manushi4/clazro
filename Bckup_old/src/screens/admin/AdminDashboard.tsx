/**
 * AdminDashboard - Phase 52: Advanced User Management Enhancement
 * Real-time system overview and comprehensive admin metrics
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
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  systemUptime: number;
  apiResponseTime: number;
  errorRate: number;
  storageUsage: number;
  bandwidthUsage: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
}

interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface ResourceUtilization {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

const AdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [systemMetrics] = useState<SystemMetrics>(generateSystemMetrics());
  const [userActivities] = useState<UserActivity[]>(generateUserActivities());
  const [systemAlerts] = useState<SystemAlert[]>(generateSystemAlerts());
  const [resourceUtilization] = useState<ResourceUtilization>(generateResourceUtilization());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAlertAction = (alertId: string, action: 'resolve' | 'escalate' | 'ignore') => {
    Alert.alert(
      'Alert Action',
      `${action.charAt(0).toUpperCase() + action.slice(1)} this alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => Alert.alert('success', `Alert has been ${action}d successfully.`)
        }
      ]
    );
  };

  const exportSystemReport = () => {
    Alert.alert(
      'Export System Report',
      'Generate comprehensive system report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => Alert.alert('Export', 'PDF report generated successfully') },
        { text: 'Excel Data', onPress: () => Alert.alert('Export', 'Excel report generated successfully') },
      ]
    );
  };

  const renderSystemOverview = () => (
    <View style={[styles.overviewCard, { backgroundColor: theme.Surface }]}>
      <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
        System Overview - Real-time
      </Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {systemMetrics.totalUsers.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Total Users
          </Text>
          <Text style={[styles.metricChange, { color: '#4CAF50' }]}>
            +{systemMetrics.newRegistrations} new
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {systemMetrics.activeUsers.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Active Now
          </Text>
          <Text style={[styles.metricChange, { color: '#4CAF50' }]}>
            Online
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {systemMetrics.systemUptime.toFixed(1)}%
          </Text>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            Uptime
          </Text>
          <Text style={[styles.metricChange, { color: '#4CAF50' }]}>
            Excellent
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {systemMetrics.apiResponseTime}ms
          </Text>
          <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
            API Response
          </Text>
          <Text style={[styles.metricChange, { color: '#4CAF50' }]}>
            Fast
          </Text>
        </View>
      </View>

      <View style={styles.timeframeSelector}>
        {(['1h', '24h', '7d', '30d'] as const).map(timeframe => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && [styles.activeTimeframe, { backgroundColor: theme.primary }]
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text style={[
              styles.timeframeText,
              {
                color: selectedTimeframe === timeframe 
                  ? theme.OnPrimary 
                  : theme.OnSurface
              }
            ]}>
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderResourceUtilization = () => (
    <View style={[styles.resourceCard, { backgroundColor: theme.Surface }]}>
      <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
        Resource Utilization
      </Text>

      {Object.entries(resourceUtilization).map(([resource, usage]) => (
        <View key={resource} style={styles.resourceItem}>
          <View style={styles.resourceHeader}>
            <Text style={[styles.resourceName, { color: theme.OnSurface }]}>
              {resource.toUpperCase()}
            </Text>
            <Text style={[styles.resourcePercentage, { color: theme.primary }]}>
              {usage}%
            </Text>
          </View>
          
          <View style={[styles.resourceBar, { backgroundColor: theme.Outline }]}>
            <View 
              style={[
                styles.resourceFill,
                {
                  width: `${usage}%`,
                  backgroundColor: usage > 80 ? '#F44336' : 
                                   usage > 60 ? '#FF9800' : '#4CAF50'
                }
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSystemAlerts = () => (
    <View style={[styles.alertsCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.alertsHeader}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          System Alerts ({systemAlerts.filter(a => !a.resolved).length})
        </Text>
        <TouchableOpacity
          style={[styles.alertsButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Alerts', 'Opening alert management system...')}
        >
          <Text style={[styles.alertsButtonText, { color: theme.OnPrimary }]}>
            Manage All
          </Text>
        </TouchableOpacity>
      </View>

      {systemAlerts.filter(alert => !alert.resolved).slice(0, 5).map(alert => (
        <View key={alert.id} style={[styles.alertItem, { backgroundColor: theme.background }]}>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <View style={[
                styles.severityBadge,
                {
                  backgroundColor: alert.severity === 'critical' ? '#F44336' :
                                   alert.severity === 'high' ? '#FF5722' :
                                   alert.severity === 'medium' ? '#FF9800' : '#4CAF50'
                }
              ]}>
                <Text style={styles.severityText}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.alertTimestamp, { color: theme.OnSurfaceVariant }]}>
                {alert.timestamp}
              </Text>
            </View>
            
            <Text style={[styles.alertTitle, { color: theme.OnSurface }]}>
              {alert.title}
            </Text>
            <Text style={[styles.alertDescription, { color: theme.OnSurfaceVariant }]}>
              {alert.description}
            </Text>
          </View>

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={[styles.alertActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleAlertAction(alert.id, 'resolve')}
            >
              <Text style={styles.alertActionText}>Resolve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.alertActionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => handleAlertAction(alert.id, 'escalate')}
            >
              <Text style={styles.alertActionText}>Escalate</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderRecentActivity = () => (
    <View style={[styles.activityCard, { backgroundColor: theme.Surface }]}>
      <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
        Recent User Activity
      </Text>

      {userActivities.slice(0, 8).map(activity => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={[
            styles.activityStatus,
            {
              backgroundColor: activity.status === 'success' ? '#4CAF50' :
                              activity.status === 'failed' ? '#F44336' : '#FF9800'
            }
          ]} />
          
          <View style={styles.activityContent}>
            <Text style={[styles.activityUser, { color: theme.OnSurface }]}>
              {activity.userName}
            </Text>
            <Text style={[styles.activityAction, { color: theme.OnSurfaceVariant }]}>
              {activity.action}
            </Text>
            <Text style={[styles.activityTime, { color: theme.OnSurfaceVariant }]}>
              {activity.timestamp} • {activity.ipAddress}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={[styles.actionsCard, { backgroundColor: theme.Surface }]}>
      <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
        Quick Actions
      </Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={exportSystemReport}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={[styles.actionText, { color: theme.OnPrimary }]}>
            Export Report
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert('Backup', 'System backup initiated successfully')}
        >
          <Text style={styles.actionIcon}>💾</Text>
          <Text style={[styles.actionText, { color: 'white' }]}>
            System Backup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert('Maintenance', 'Scheduling system maintenance...')}
        >
          <Text style={styles.actionIcon}>🔧</Text>
          <Text style={[styles.actionText, { color: 'white' }]}>
            Maintenance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => Alert.alert('Analytics', 'Opening advanced analytics dashboard...')}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={[styles.actionText, { color: 'white' }]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.OnBackground }]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            Welcome back, {user?.name} • System Status: Online
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.primary }]}
          onPress={onRefresh}
        >
          <Text style={[styles.refreshButtonText, { color: theme.OnPrimary }]}>
            🔄
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderSystemOverview()}
        {renderResourceUtilization()}
        {renderSystemAlerts()}
        {renderRecentActivity()}
        {renderQuickActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock data generators
function generateSystemMetrics(): SystemMetrics {
  return {
    totalUsers: 15347,
    activeUsers: 2847,
    newRegistrations: 127,
    systemUptime: 99.94,
    apiResponseTime: 245,
    errorRate: 0.02,
    storageUsage: 67.5,
    bandwidthUsage: 23.8,
  };
}

function generateUserActivities(): UserActivity[] {
  return [
    {
      id: '1',
      userId: 'usr_001',
      userName: 'Priya Sharma',
      action: 'User login successful',
      timestamp: '2 minutes ago',
      ipAddress: '192.168.1.100',
      userAgent: 'Mobile App v2.1.5',
      status: 'success',
    },
    {
      id: '2',
      userId: 'usr_045',
      userName: 'Rajesh Kumar',
      action: 'Failed login attempt - incorrect password',
      timestamp: '5 minutes ago',
      ipAddress: '203.123.45.67',
      userAgent: 'Web Browser Chrome',
      status: 'failed',
    },
    {
      id: '3',
      userId: 'usr_123',
      userName: 'Anita Verma',
      action: 'Assignment submission completed',
      timestamp: '8 minutes ago',
      ipAddress: '192.168.1.55',
      userAgent: 'Mobile App v2.1.5',
      status: 'success',
    },
    {
      id: '4',
      userId: 'usr_089',
      userName: 'Dev Patel',
      action: 'Password reset requested',
      timestamp: '12 minutes ago',
      ipAddress: '10.0.0.45',
      userAgent: 'Web Browser Firefox',
      status: 'warning',
    },
    {
      id: '5',
      userId: 'usr_234',
      userName: 'Maya Singh',
      action: 'Profile information updated',
      timestamp: '15 minutes ago',
      ipAddress: '192.168.2.78',
      userAgent: 'Mobile App v2.1.5',
      status: 'success',
    },
  ];
}

function generateSystemAlerts(): SystemAlert[] {
  return [
    {
      id: '1',
      type: 'security',
      severity: 'high',
      title: 'Multiple Failed Login Attempts',
      description: 'IP address 203.123.45.67 has attempted login 5 times with incorrect credentials.',
      timestamp: '10 minutes ago',
      resolved: false,
    },
    {
      id: '2',
      type: 'performance',
      severity: 'medium',
      title: 'API Response Time Increase',
      description: 'Average API response time has increased to 350ms over the last hour.',
      timestamp: '25 minutes ago',
      resolved: false,
    },
    {
      id: '3',
      type: 'system',
      severity: 'low',
      title: 'Scheduled Maintenance Reminder',
      description: 'System maintenance scheduled for tonight at 2:00 AM UTC.',
      timestamp: '1 hour ago',
      resolved: false,
    },
    {
      id: '4',
      type: 'user',
      severity: 'medium',
      title: 'High User Registration Rate',
      description: 'Unusual spike in new user registrations - 50% above normal rate.',
      timestamp: '2 hours ago',
      resolved: false,
    },
    {
      id: '5',
      type: 'security',
      severity: 'critical',
      title: 'Potential DDoS Attack',
      description: 'Unusual traffic pattern detected from multiple IP addresses.',
      timestamp: '3 hours ago',
      resolved: true,
    },
  ];
}

function generateResourceUtilization(): ResourceUtilization {
  return {
    cpu: 45,
    memory: 67,
    storage: 23,
    network: 34,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: Spacing.MD,
  },
  overviewCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  metricValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: 'bold',
    marginBottom: Spacing.XS,
  },
  metricLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginBottom: 2,
  },
  metricChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.MD,
  },
  timeframeButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    marginHorizontal: Spacing.XS,
  },
  activeTimeframe: {
    elevation: 2,
  },
  timeframeText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  resourceCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resourceItem: {
    marginBottom: Spacing.MD,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  resourceName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  resourcePercentage: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  resourceBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  resourceFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertsCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  alertsButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
  },
  alertsButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  alertItem: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertContent: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  alertHeader: {
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
  alertTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
  },
  alertTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.XS,
  },
  alertDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 18,
  },
  alertActions: {
    alignItems: 'center',
  },
  alertActionButton: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 4,
    marginBottom: Spacing.XS,
    minWidth: 60,
    alignItems: 'center',
  },
  alertActionText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
    paddingBottom: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  activityStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.MD,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityAction: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: Typography.bodySmall.fontSize,
  },
  actionsCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.MD,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.SM,
  },
  actionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminDashboard;