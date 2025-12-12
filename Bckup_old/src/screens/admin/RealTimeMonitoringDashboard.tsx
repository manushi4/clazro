import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
// Chart components replaced with basic visualizations

import { videoCallService, VideoCallSession, CallStatistics } from '../../services/video/VideoCallService';
import { notificationService, SystemAlert, NotificationBatch } from '../../services/notifications/NotificationService';
import { realTimeMessagingService, MessageThread } from '../../services/messaging/RealTimeMessagingService';
import { realTimeCollaborationService, CollaborationSession } from '../../services/collaboration/RealTimeCollaborationService';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardMetrics {
  activeSessions: {
    videoCalls: number;
    collaborations: number;
    messages: number;
  };
  systemHealth: {
    serverLoad: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  };
  userActivity: {
    activeUsers: number;
    peakUsers: number;
    newUsers: number;
    sessionDuration: number;
  };
  contentMetrics: {
    documentsShared: number;
    messagesExchanged: number;
    assignmentsCompleted: number;
    doubtsResolved: number;
  };
}

interface AlertSummary {
  critical: number;
  warnings: number;
  info: number;
  resolved: number;
}

const RealTimeMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeSessions: { videoCalls: 0, collaborations: 0, messages: 0 },
    systemHealth: { serverLoad: 0, memoryUsage: 0, responseTime: 0, errorRate: 0 },
    userActivity: { activeUsers: 0, peakUsers: 0, newUsers: 0, sessionDuration: 0 },
    contentMetrics: { documentsShared: 0, messagesExchanged: 0, assignmentsCompleted: 0, doubtsResolved: 0 }
  });

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({
    critical: 0, warnings: 0, info: 0, resolved: 0
  });

  const [activeCalls, setActiveCalls] = useState<VideoCallSession[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState<CollaborationSession[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationBatch[]>([]);
  const [performanceData, setPerformanceData] = useState({
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
      strokeWidth: 2
    }]
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // Real-time data updates
  useFocusEffect(
    useCallback(() => {
      const updateInterval = setInterval(() => {
        loadDashboardData();
      }, 30000); // Update every 30 seconds

      loadDashboardData();
      setupEventListeners();

      return () => {
        clearInterval(updateInterval);
        cleanupEventListeners();
      };
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      // Load system metrics
      await Promise.all([
        loadSystemMetrics(),
        loadSystemAlerts(),
        loadActiveSessions(),
        loadPerformanceData(),
        loadNotificationBatches()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('error', 'Failed to load dashboard data');
    }
  };

  const loadSystemMetrics = async () => {
    // Simulate system metrics - in real app, this would come from monitoring service
    const newMetrics: DashboardMetrics = {
      activeSessions: {
        videoCalls: Math.floor(Math.random() * 25) + 5,
        collaborations: Math.floor(Math.random() * 15) + 3,
        messages: Math.floor(Math.random() * 100) + 20
      },
      systemHealth: {
        serverLoad: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        responseTime: Math.random() * 500 + 100,
        errorRate: Math.random() * 5
      },
      userActivity: {
        activeUsers: Math.floor(Math.random() * 500) + 100,
        peakUsers: Math.floor(Math.random() * 200) + 300,
        newUsers: Math.floor(Math.random() * 50) + 10,
        sessionDuration: Math.random() * 120 + 30
      },
      contentMetrics: {
        documentsShared: Math.floor(Math.random() * 50) + 20,
        messagesExchanged: Math.floor(Math.random() * 1000) + 200,
        assignmentsCompleted: Math.floor(Math.random() * 30) + 10,
        doubtsResolved: Math.floor(Math.random() * 25) + 5
      }
    };

    setMetrics(newMetrics);
  };

  const loadSystemAlerts = async () => {
    const alerts = notificationService.getSystemAlerts({ limit: 20 });
    setSystemAlerts(alerts);

    const summary = alerts.reduce(
      (acc, alert) => {
        if (alert.resolvedAt) {
          acc.resolved++;
        } else {
          switch (alert.severity) {
            case 'critical': acc.critical++; break;
            case 'error': case 'warning': acc.warnings++; break;
            case 'info': acc.info++; break;
          }
        }
        return acc;
      },
      { critical: 0, warnings: 0, info: 0, resolved: 0 }
    );

    setAlertSummary(summary);
  };

  const loadActiveSessions = async () => {
    // In real implementation, these would come from the services
    setActiveCalls([]);
    setActiveCollaborations([]);
  };

  const loadPerformanceData = async () => {
    const now = new Date();
    const labels = [];
    const data = [];

    // Generate time-based performance data
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(time.getHours().toString().padStart(2, '0') + ':00');
      data.push(Math.random() * 100 + 20);
    }

    setPerformanceData({
      labels: labels.slice(-6), // Show last 6 hours
      datasets: [{
        data: data.slice(-6),
        color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
        strokeWidth: 2
      }]
    });
  };

  const loadNotificationBatches = async () => {
    // In real implementation, this would fetch from notification service
    setRecentNotifications([]);
  };

  const setupEventListeners = () => {
    // Listen for system alerts
    notificationService.on('systemAlertCreated', handleSystemAlert);
    notificationService.on('systemAlertResolved', handleAlertResolved);

    // Listen for video call events
    videoCallService.on('callCreated', handleCallCreated);
    videoCallService.on('callEnded', handleCallEnded);

    // Listen for collaboration events
    realTimeCollaborationService.on('sessionCreated', handleCollaborationCreated);
    realTimeCollaborationService.on('sessionEnded', handleCollaborationEnded);
  };

  const cleanupEventListeners = () => {
    notificationService.removeAllListeners();
    videoCallService.removeAllListeners();
    realTimeCollaborationService.removeAllListeners();
  };

  const handleSystemAlert = (alert: SystemAlert) => {
    setSystemAlerts(prev => [alert, ...prev.slice(0, 19)]);
    
    if (alert.severity === 'critical' || alert.severity === 'error') {
      Alert.alert(
        'System Alert',
        `${alert.title}: ${alert.message}`,
        [
          { text: 'Acknowledge', onPress: () => acknowledgeAlert(alert.id) },
          { text: 'View Details', onPress: () => viewAlertDetails(alert) }
        ]
      );
    }
  };

  const handleAlertResolved = ({ alert }: { alert: SystemAlert }) => {
    setSystemAlerts(prev => 
      prev.map(a => a.id === alert.id ? alert : a)
    );
  };

  const handleCallCreated = (session: VideoCallSession) => {
    setActiveCalls(prev => [...prev, session]);
  };

  const handleCallEnded = (session: VideoCallSession) => {
    setActiveCalls(prev => prev.filter(call => call.id !== session.id));
  };

  const handleCollaborationCreated = (session: CollaborationSession) => {
    setActiveCollaborations(prev => [...prev, session]);
  };

  const handleCollaborationEnded = (session: CollaborationSession) => {
    setActiveCollaborations(prev => prev.filter(collab => collab.id !== session.id));
  };

  const acknowledgeAlert = async (alertId: string) => {
    await notificationService.acknowledgeSystemAlert(alertId, 'admin_user');
    loadSystemAlerts();
  };

  const viewAlertDetails = (alert: SystemAlert) => {
    Alert.alert(
      alert.title,
      `${alert.message}\n\nSource: ${alert.source}\nTime: ${alert.createdAt.toLocaleString()}`,
      [
        { text: 'Close' },
        { 
          text: 'Mark Resolved', 
          onPress: () => resolveAlert(alert.id) 
        }
      ]
    );
  };

  const resolveAlert = async (alertId: string) => {
    Alert.prompt(
      'Resolve Alert',
      'Please provide a resolution note:',
      async (resolution) => {
        if (resolution) {
          await notificationService.resolveSystemAlert(alertId, resolution, 'admin_user');
          loadSystemAlerts();
        }
      }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    trend?: 'up' | 'down' | 'stable'
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Icon 
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat'} 
            size={16} 
            color={trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : '#9E9E9E'} 
          />
          <Text style={[styles.trendText, {
            color: trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : '#9E9E9E'
          }]}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            {Math.floor(Math.random() * 10)}%
          </Text>
        </View>
      )}
    </View>
  );

  const renderSystemHealthIndicator = () => {
    const getHealthColor = (value: number, isInverted = false) => {
      if (isInverted) {
        if (value < 30) return '#4CAF50';
        if (value < 70) return '#FF9800';
        return '#F44336';
      } else {
        if (value > 70) return '#4CAF50';
        if (value > 30) return '#FF9800';
        return '#F44336';
      }
    };

    return (
      <View style={styles.healthIndicator}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.healthMetrics}>
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Server Load</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${metrics.systemHealth.serverLoad}%`,
                    backgroundColor: getHealthColor(metrics.systemHealth.serverLoad, true)
                  }
                ]} 
              />
            </View>
            <Text style={styles.healthValue}>{metrics.systemHealth.serverLoad.toFixed(1)}%</Text>
          </View>

          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Memory Usage</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${metrics.systemHealth.memoryUsage}%`,
                    backgroundColor: getHealthColor(metrics.systemHealth.memoryUsage, true)
                  }
                ]} 
              />
            </View>
            <Text style={styles.healthValue}>{metrics.systemHealth.memoryUsage.toFixed(1)}%</Text>
          </View>

          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Response Time</Text>
            <Text style={styles.healthValue}>{metrics.systemHealth.responseTime.toFixed(0)}ms</Text>
          </View>

          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Error Rate</Text>
            <Text style={[styles.healthValue, {
              color: metrics.systemHealth.errorRate > 2 ? '#F44336' : '#4CAF50'
            }]}>
              {metrics.systemHealth.errorRate.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActiveSessionsPanel = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Active Sessions</Text>
      <View style={styles.sessionsContainer}>
        <TouchableOpacity style={styles.sessionCard}>
          <Icon name="videocam" size={24} color="#6750A4" />
          <Text style={styles.sessionCount}>{metrics.activeSessions.videoCalls}</Text>
          <Text style={styles.sessionLabel}>Video Calls</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sessionCard}>
          <Icon name="groups" size={24} color="#625B71" />
          <Text style={styles.sessionCount}>{metrics.activeSessions.collaborations}</Text>
          <Text style={styles.sessionLabel}>Collaborations</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sessionCard}>
          <Icon name="chat" size={24} color="#7D5260" />
          <Text style={styles.sessionCount}>{metrics.activeSessions.messages}</Text>
          <Text style={styles.sessionLabel}>Active Chats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAlertsPanel = () => (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.sectionTitle}>System Alerts</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="arrow-forward" size={16} color="#6750A4" />
        </TouchableOpacity>
      </View>

      <View style={styles.alertSummary}>
        <View style={[styles.alertBadge, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.alertCount, { color: '#D32F2F' }]}>{alertSummary.critical}</Text>
          <Text style={styles.alertLabel}>Critical</Text>
        </View>

        <View style={[styles.alertBadge, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.alertCount, { color: '#F57C00' }]}>{alertSummary.warnings}</Text>
          <Text style={styles.alertLabel}>Warnings</Text>
        </View>

        <View style={[styles.alertBadge, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.alertCount, { color: '#388E3C' }]}>{alertSummary.resolved}</Text>
          <Text style={styles.alertLabel}>Resolved</Text>
        </View>
      </View>

      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
        {systemAlerts.slice(0, 5).map((alert) => (
          <TouchableOpacity 
            key={alert.id} 
            style={styles.alertItem}
            onPress={() => viewAlertDetails(alert)}
          >
            <View style={styles.alertHeader}>
              <Icon 
                name={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'} 
                size={20} 
                color={alert.severity === 'critical' ? '#D32F2F' : alert.severity === 'warning' ? '#F57C00' : '#1976D2'} 
              />
              <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
              <Text style={styles.alertTime}>{new Date(alert.createdAt).toLocaleTimeString()}</Text>
            </View>
            <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
            {!alert.resolvedAt && (
              <TouchableOpacity 
                style={styles.acknowledgeButton}
                onPress={() => acknowledgeAlert(alert.id)}
              >
                <Text style={styles.acknowledgeText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPerformanceChart = () => (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.timeRangeSelector}>
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeText,
                selectedTimeRange === range && styles.timeRangeTextActive
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Simple Performance Chart Replacement */}
      <View style={[styles.chart, { backgroundColor: '#ffffff', padding: 16, borderRadius: 16 }]}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#1C1B1F' }}>
          Performance Metrics
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'end', height: 150 }}>
          {performanceData.datasets[0]?.data?.map((value, index) => (
            <View key={index} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 24,
                  height: Math.max(value * 3, 20),
                  backgroundColor: '#6750A4',
                  marginBottom: 8,
                  borderRadius: 4,
                }}
              />
              <Text style={{ fontSize: 12, color: '#49454F' }}>
                {performanceData.labels?.[index] || `${index + 1}`}
              </Text>
            </View>
          )) || null}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Real-Time Monitoring</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#6750A4" />
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard('Active Users', metrics.userActivity.activeUsers, 'people', '#6750A4', 'up')}
        {renderMetricCard('Peak Users', metrics.userActivity.peakUsers, 'trending-up', '#625B71', 'stable')}
        {renderMetricCard('New Users', metrics.userActivity.newUsers, 'person-add', '#7D5260', 'up')}
        {renderMetricCard('Avg Session', `${metrics.userActivity.sessionDuration.toFixed(0)}m`, 'access-time', '#EADDFF', 'down')}
      </View>

      {/* System Health */}
      {renderSystemHealthIndicator()}

      {/* Active Sessions */}
      {renderActiveSessionsPanel()}

      {/* Performance Chart */}
      {renderPerformanceChart()}

      {/* System Alerts */}
      {renderAlertsPanel()}

      {/* Content Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard('Documents Shared', metrics.contentMetrics.documentsShared, 'folder-shared', '#4CAF50')}
        {renderMetricCard('Messages Sent', metrics.contentMetrics.messagesExchanged, 'message', '#2196F3')}
        {renderMetricCard('Assignments Done', metrics.contentMetrics.assignmentsCompleted, 'assignment-turned-in', '#FF9800')}
        {renderMetricCard('Doubts Resolved', metrics.contentMetrics.doubtsResolved, 'help', '#9C27B0')}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1B1F',
  },
  settingsButton: {
    padding: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    width: (screenWidth - 40) / 2,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#49454F',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6750A4',
    marginRight: 4,
  },
  healthIndicator: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  healthMetrics: {
    marginTop: 16,
  },
  healthMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 14,
    color: '#49454F',
    width: 100,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E7E0EC',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1F',
    width: 60,
    textAlign: 'right',
  },
  sessionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7F2FA',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  sessionCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1B1F',
    marginTop: 8,
  },
  sessionLabel: {
    fontSize: 12,
    color: '#49454F',
    marginTop: 4,
  },
  alertSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  alertBadge: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  alertCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertLabel: {
    fontSize: 12,
    color: '#49454F',
    marginTop: 4,
  },
  alertsList: {
    maxHeight: 200,
  },
  alertItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F7F2FA',
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1B1F',
    flex: 1,
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#49454F',
  },
  alertMessage: {
    fontSize: 12,
    color: '#49454F',
    marginBottom: 8,
  },
  acknowledgeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8DEF8',
    borderRadius: 6,
  },
  acknowledgeText: {
    fontSize: 12,
    color: '#6750A4',
    fontWeight: '500',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E7E0EC',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  timeRangeButtonActive: {
    backgroundColor: '#6750A4',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#49454F',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default RealTimeMonitoringDashboard;