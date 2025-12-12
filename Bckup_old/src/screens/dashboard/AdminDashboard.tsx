/**
 * AdminDashboard - Admin role interface for coaching platform
 * Based on comprehensive coaching research requirements
 * Features: Executive Summary, Operations Center, Financial Dashboard, System Administration, Analytics Engine
 * User Journey: System Overview → Operations Management → Analytics → User Management → Reports
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

interface AdminDashboardProps {
  adminName: string;
  onNavigate: (screen: string) => void;
}

interface SystemKPI {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
}

interface UserMetric {
  role: 'Students' | 'Teachers' | 'Parents';
  total: number;
  active: number;
  growth: number;
  color: string;
}

interface FinancialMetric {
  title: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
}

interface AnalyticsData {
  userEngagement: {
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
    retention: number;
  };
  performance: {
    appPerformance: number;
    systemUptime: number;
    responseTime: number;
    errorRate: number;
  };
  content: {
    totalClasses: number;
    totalAssignments: number;
    averageGrades: number;
    completionRate: number;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminName,
  onNavigate,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'operations' | 'financial' | 'analytics'>('overview');
  const [systemHealth, setSystemHealth] = useState<'excellent' | 'good' | 'warning' | 'critical'>('excellent');

  // Sample data based on coaching platform requirements
  const systemKPIs: SystemKPI[] = [
    {
      title: 'Total Users',
      value: '12,847',
      change: 8.2,
      trend: 'up',
      color: '#4CAF50',
      icon: '👥',
    },
    {
      title: 'Active Sessions',
      value: '2,341',
      change: 15.3,
      trend: 'up',
      color: '#2196F3',
      icon: '🔴',
    },
    {
      title: 'System Uptime',
      value: '99.97%',
      change: 0.02,
      trend: 'up',
      color: '#4CAF50',
      icon: '⚡',
    },
    {
      title: 'Revenue (Monthly)',
      value: '₹8,47,250',
      change: 12.5,
      trend: 'up',
      color: '#FF9800',
      icon: '💰',
    },
  ];

  const userMetrics: UserMetric[] = [
    {
      role: 'Students',
      total: 8420,
      active: 7156,
      growth: 12.3,
      color: '#6750A4',
    },
    {
      role: 'Teachers',
      total: 342,
      active: 298,
      growth: 8.7,
      color: '#7C4DFF',
    },
    {
      role: 'Parents',
      total: 4085,
      active: 3421,
      growth: 15.2,
      color: '#E91E63',
    },
  ];

  const financialMetrics: FinancialMetric[] = [
    {
      title: 'Monthly Revenue',
      amount: 847250,
      percentage: 12.5,
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'Subscription Revenue',
      amount: 692400,
      percentage: 8.3,
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'One-time Payments',
      amount: 154850,
      percentage: 25.7,
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'Refunds & Adjustments',
      amount: -8920,
      percentage: -3.2,
      trend: 'down',
      period: 'vs last month',
    },
  ];

  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'High Memory Usage',
      description: 'Database server memory usage at 87%. Consider optimization.',
      timestamp: '15 minutes ago',
      priority: 'medium',
      resolved: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Scheduled Maintenance',
      description: 'System maintenance scheduled for tonight 2:00-4:00 AM.',
      timestamp: '2 hours ago',
      priority: 'low',
      resolved: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'Backup Completed',
      description: 'Daily backup completed successfully. All data secured.',
      timestamp: '6 hours ago',
      priority: 'low',
      resolved: true,
    },
    {
      id: '4',
      type: 'error',
      title: 'Payment Gateway Issue',
      description: 'Payment gateway experiencing intermittent failures.',
      timestamp: '1 day ago',
      priority: 'high',
      resolved: true,
    },
  ];

  const analyticsData: AnalyticsData = {
    userEngagement: {
      dailyActive: 5420,
      weeklyActive: 8930,
      monthlyActive: 11250,
      retention: 78.5,
    },
    performance: {
      appPerformance: 94.2,
      systemUptime: 99.97,
      responseTime: 245,
      errorRate: 0.12,
    },
    content: {
      totalClasses: 1247,
      totalAssignments: 3894,
      averageGrades: 82.5,
      completionRate: 89.3,
    },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      case 'success': return '#4CAF50';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.adminName}>{adminName}</Text>
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.systemHealthContainer}>
        <Text style={styles.systemHealthLabel}>System Health</Text>
        <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth) }]}>
          <Text style={styles.healthText}>{systemHealth.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  const renderExecutiveSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>📊 Executive Summary</Text>
      
      <View style={styles.kpiGrid}>
        {systemKPIs.map((kpi, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.kpiCard}
            onPress={() => onNavigate('kpi-detail')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiIcon}>{kpi.icon}</Text>
              <Text style={styles.kpiTitle}>{kpi.title}</Text>
            </View>
            
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            
            <View style={styles.kpiChange}>
              <Text style={[styles.changeValue, { color: kpi.color }]}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </Text>
              <Text style={styles.changeTrend}>
                {kpi.trend === 'up' ? '📈' : kpi.trend === 'down' ? '📉' : '➡️'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.alertsContainer}>
        <Text style={styles.alertsTitle}>System Alerts</Text>
        {systemAlerts.slice(0, 3).map((alert) => (
          <TouchableOpacity 
            key={alert.id}
            style={[
              styles.alertCard,
              { borderLeftColor: getAlertColor(alert.type) },
              alert.resolved && styles.resolvedAlert
            ]}
            onPress={() => onNavigate('alert-detail')}
          >
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDescription} numberOfLines={2}>
                {alert.description}
              </Text>
              <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
            </View>
            
            <View style={styles.alertMeta}>
              <Text style={styles.alertType}>
                {alert.type === 'error' ? '❌' :
                 alert.type === 'warning' ? '⚠️' :
                 alert.type === 'info' ? 'ℹ️' : '✅'}
              </Text>
              {alert.resolved && <Text style={styles.resolvedText}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOperationsCenter = () => (
    <View style={styles.operationsSection}>
      <Text style={styles.sectionTitle}>⚙️ Operations Center</Text>
      
      <View style={styles.userMetricsContainer}>
        <Text style={styles.metricsTitle}>User Management Overview</Text>
        
        {userMetrics.map((metric, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.userMetricCard}
            onPress={() => onNavigate('user-management')}
          >
            <View style={styles.userMetricHeader}>
              <Text style={styles.userRole}>{metric.role}</Text>
              <Text style={[styles.userGrowth, { color: metric.color }]}>
                +{metric.growth}%
              </Text>
            </View>
            
            <View style={styles.userStats}>
              <View style={styles.userStat}>
                <Text style={styles.userNumber}>{metric.total.toLocaleString()}</Text>
                <Text style={styles.userLabel}>Total</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={[styles.userNumber, { color: metric.color }]}>
                  {metric.active.toLocaleString()}
                </Text>
                <Text style={styles.userLabel}>Active</Text>
              </View>
            </View>
            
            <View style={styles.activityBar}>
              <View style={styles.activityBarBackground}>
                <View 
                  style={[
                    styles.activityBarFill,
                    { 
                      width: `${(metric.active / metric.total) * 100}%`,
                      backgroundColor: metric.color
                    }
                  ]}
                />
              </View>
              <Text style={styles.activityPercentage}>
                {Math.round((metric.active / metric.total) * 100)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.operationsActions}>
        <Text style={styles.actionsTitle}>Quick Operations</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.operationCard}
            onPress={() => onNavigate('user-management')}
          >
            <Text style={styles.operationIcon}>👥</Text>
            <Text style={styles.operationTitle}>Manage Users</Text>
            <Text style={styles.operationDescription}>Add, edit, or deactivate users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.operationCard}
            onPress={() => onNavigate('system-settings')}
          >
            <Text style={styles.operationIcon}>⚙️</Text>
            <Text style={styles.operationTitle}>System Settings</Text>
            <Text style={styles.operationDescription}>Configure platform settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.operationCard}
            onPress={() => onNavigate('content-management')}
          >
            <Text style={styles.operationIcon}>📚</Text>
            <Text style={styles.operationTitle}>Content Management</Text>
            <Text style={styles.operationDescription}>Manage courses and materials</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.operationCard}
            onPress={() => onNavigate('support-center')}
          >
            <Text style={styles.operationIcon}>🎧</Text>
            <Text style={styles.operationTitle}>Support Center</Text>
            <Text style={styles.operationDescription}>Handle user support tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFinancialDashboard = () => (
    <View style={styles.financialSection}>
      <Text style={styles.sectionTitle}>💰 Financial Dashboard</Text>
      
      <View style={styles.financialOverview}>
        <View style={styles.totalRevenueCard}>
          <Text style={styles.totalRevenueLabel}>Total Monthly Revenue</Text>
          <Text style={styles.totalRevenueAmount}>₹8,47,250</Text>
          <Text style={styles.totalRevenueChange}>+12.5% from last month</Text>
        </View>
      </View>

      {financialMetrics.map((metric, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.financialCard}
          onPress={() => onNavigate('financial-detail')}
        >
          <View style={styles.financialHeader}>
            <View style={styles.financialInfo}>
              <Text style={styles.financialTitle}>{metric.title}</Text>
              <Text style={styles.financialPeriod}>{metric.period}</Text>
            </View>
            
            <View style={styles.financialAmountContainer}>
              <Text style={[
                styles.financialAmount,
                { color: metric.amount >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatCurrency(metric.amount)}
              </Text>
              <Text style={[
                styles.financialPercentage,
                { color: metric.trend === 'up' ? '#4CAF50' : '#F44336' }
              ]}>
                {metric.percentage > 0 ? '+' : ''}{metric.percentage}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.financialActions}>
        <CoachingButton
          title="📊 View Detailed Reports"
          variant="primary"
          size="medium"
          onPress={() => onNavigate('financial-reports')}
          style={styles.financialActionButton}
        />
        
        <CoachingButton
          title="⚙️ Configure Payments"
          variant="secondary"
          size="medium"
          onPress={() => onNavigate('payment-settings')}
          style={styles.financialActionButton}
        />
      </View>
    </View>
  );

  const renderAnalyticsEngine = () => (
    <View style={styles.analyticsSection}>
      <Text style={styles.sectionTitle}>📈 Analytics Engine</Text>
      
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>User Engagement</Text>
          <View style={styles.analyticsMetrics}>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.userEngagement.dailyActive.toLocaleString()}</Text>
              <Text style={styles.analyticsLabel}>Daily Active</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.userEngagement.retention}%</Text>
              <Text style={styles.analyticsLabel}>Retention</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>System Performance</Text>
          <View style={styles.analyticsMetrics}>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.performance.systemUptime}%</Text>
              <Text style={styles.analyticsLabel}>Uptime</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.performance.responseTime}ms</Text>
              <Text style={styles.analyticsLabel}>Response Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Content Analytics</Text>
          <View style={styles.analyticsMetrics}>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.content.totalClasses.toLocaleString()}</Text>
              <Text style={styles.analyticsLabel}>Total Classes</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.content.completionRate}%</Text>
              <Text style={styles.analyticsLabel}>Completion Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Academic Performance</Text>
          <View style={styles.analyticsMetrics}>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.content.averageGrades}%</Text>
              <Text style={styles.analyticsLabel}>Avg. Grades</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <Text style={styles.analyticsNumber}>{analyticsData.content.totalAssignments.toLocaleString()}</Text>
              <Text style={styles.analyticsLabel}>Assignments</Text>
            </View>
          </View>
        </View>
      </View>

      <CoachingButton
        title="📊 View Advanced Analytics"
        variant="primary"
        size="large"
        onPress={() => onNavigate('advanced-analytics')}
        style={styles.advancedAnalyticsButton}
      />
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'overview', label: 'Overview', icon: '📊' },
        { key: 'operations', label: 'Operations', icon: '⚙️' },
        { key: 'financial', label: 'Financial', icon: '💰' },
        { key: 'analytics', label: 'Analytics', icon: '📈' },
      ].map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            selectedTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5722" />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabNavigation()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'overview' && renderExecutiveSummary()}
          {selectedTab === 'operations' && renderOperationsCenter()}
          {selectedTab === 'financial' && renderFinancialDashboard()}
          {selectedTab === 'analytics' && renderAnalyticsEngine()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    backgroundColor: '#FF5722',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  adminName: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemHealthContainer: {
    alignItems: 'flex-end',
  },
  systemHealthLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.XS,
  },
  healthIndicator: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  healthText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.SurfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  activeTabLabel: {
    color: '#FF5722',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  summarySection: {
    padding: Spacing.LG,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.XL,
  },
  kpiCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: (width - Spacing.LG * 2 - Spacing.MD) / 2,
    marginBottom: Spacing.MD,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  kpiIcon: {
    fontSize: 20,
    marginRight: Spacing.SM,
  },
  kpiTitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  kpiValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeValue: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  changeTrend: {
    fontSize: 16,
  },
  alertsContainer: {
    marginTop: Spacing.LG,
  },
  alertsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  alertCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderLeftWidth: 4,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  resolvedAlert: {
    opacity: 0.6,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  alertDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodySmall.lineHeight,
    marginBottom: Spacing.XS,
  },
  alertTimestamp: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  alertMeta: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertType: {
    fontSize: 18,
  },
  resolvedText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: Spacing.XS,
  },
  operationsSection: {
    padding: Spacing.LG,
  },
  userMetricsContainer: {
    marginBottom: Spacing.XL,
  },
  metricsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  userMetricCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  userRole: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  userGrowth: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  userStat: {
    alignItems: 'center',
  },
  userNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  userLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  activityBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  activityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityPercentage: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    minWidth: 35,
  },
  operationsActions: {
    marginTop: Spacing.LG,
  },
  actionsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  operationCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: (width - Spacing.LG * 2 - Spacing.MD) / 2,
    marginBottom: Spacing.MD,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operationIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  operationTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  operationDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  financialSection: {
    padding: Spacing.LG,
  },
  financialOverview: {
    marginBottom: Spacing.XL,
  },
  totalRevenueCard: {
    backgroundColor: '#FF5722',
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  totalRevenueLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.SM,
  },
  totalRevenueAmount: {
    fontSize: Typography.displaySmall.fontSize,
    fontWeight: Typography.displaySmall.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  totalRevenueChange: {
    fontSize: Typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  financialCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  financialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialInfo: {
    flex: 1,
  },
  financialTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  financialPeriod: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  financialAmountContainer: {
    alignItems: 'flex-end',
  },
  financialAmount: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
  },
  financialPercentage: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  financialActions: {
    marginTop: Spacing.LG,
  },
  financialActionButton: {
    marginBottom: Spacing.MD,
  },
  analyticsSection: {
    padding: Spacing.LG,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.XL,
  },
  analyticsCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: (width - Spacing.LG * 2 - Spacing.MD) / 2,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsCardTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  analyticsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsMetric: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#FF5722',
    marginBottom: Spacing.XS,
  },
  analyticsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  advancedAnalyticsButton: {
    marginTop: Spacing.MD,
  },
});

export default AdminDashboard;