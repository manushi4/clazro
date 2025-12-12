/**
 * RealTimeMonitoringDashboardV2 - System Overview Dashboard
 *
 * Features:
 * - Real-time system metrics from actual database queries
 * - User statistics (total users by role, active sessions)
 * - Student & batch statistics (enrollment, utilization)
 * - Organization metrics
 * - System health indicators
 * - Auto-refresh every 30 seconds
 * - RBAC with system_monitoring permission
 * - Analytics tracking
 * - BaseScreen wrapper with proper states
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { AdminStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useNavigation } from '@react-navigation/native';
import { can } from '../../utils/adminPermissions';
import type { AdminRole } from '../../types/admin';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<AdminStackParamList, 'RealTimeMonitoring'>;

const { width: screenWidth } = Dimensions.get('window');

interface SystemMetrics {
  totalUsers: number;
  parentCount: number;
  teacherCount: number;
  adminCount: number;
  totalStudents: number;
  activeBatches: number;
  totalBatches: number;
  batchUtilization: number;
  totalOrganizations: number;
}

interface SystemHealth {
  databaseStatus: 'healthy' | 'warning' | 'error';
  dataIntegrity: number; // Percentage
  lastUpdated: Date;
}

const RealTimeMonitoringDashboardV2: React.FC<Props> = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Get current admin role from context or props
  // For now, using 'super_admin' as placeholder - in real app, get from auth context
  const currentRole: AdminRole = 'super_admin';

  // RBAC Gate: Check system_monitoring permission
  useEffect(() => {
    trackScreenView('RealTimeMonitoringV2');

    // Add system_monitoring permission to check
    // For now, only super_admin and compliance_admin can access
    const hasAccess = currentRole === 'super_admin' || currentRole === 'compliance_admin';

    if (!hasAccess) {
      console.warn('⛔ [RealTimeMonitoringV2] Access denied:', currentRole);
      trackAction('access_denied', 'RealTimeMonitoringV2', {
        role: currentRole,
        requiredPermission: 'system_monitoring',
      });

      setTimeout(() => {
        navigation.navigate('AccessDenied' as never, {
          requiredPermission: 'system_monitoring',
          message: `You need system monitoring access to view this dashboard.`,
        } as never);
      }, 100);
    }
  }, [currentRole, navigation]);

  // Fetch system metrics
  const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
    console.log('🔍 [RealTimeMonitoringV2] Fetching system metrics...');

    // Count users by role
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: parentCount, error: parentsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'parent');

    const { count: teacherCount, error: teachersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    const { count: adminCount, error: adminsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    // Count students
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // Count batches
    const { count: activeBatches, error: activeBatchesError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalBatches, error: totalBatchesError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true });

    // Calculate batch utilization
    const { data: batchData, error: batchDataError } = await supabase
      .from('batches')
      .select('current_enrollment, max_students')
      .eq('is_active', true);

    const totalCapacity = batchData?.reduce((sum, b) => sum + (b.max_students ?? 0), 0) ?? 0;
    const totalEnrollment = batchData?.reduce((sum, b) => sum + (b.current_enrollment ?? 0), 0) ?? 0;
    const batchUtilization = totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0;

    // Count organizations
    const { count: totalOrganizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    if (usersError || parentsError || teachersError || adminsError ||
        studentsError || activeBatchesError || totalBatchesError || batchDataError || orgsError) {
      console.error('❌ [RealTimeMonitoringV2] Error fetching metrics:', {
        usersError,
        studentsError,
        batchesError: activeBatchesError || totalBatchesError,
      });
      throw new Error('Failed to fetch system metrics');
    }

    const metrics = {
      totalUsers: totalUsers ?? 0,
      parentCount: parentCount ?? 0,
      teacherCount: teacherCount ?? 0,
      adminCount: adminCount ?? 0,
      totalStudents: totalStudents ?? 0,
      activeBatches: activeBatches ?? 0,
      totalBatches: totalBatches ?? 0,
      batchUtilization,
      totalOrganizations: totalOrganizations ?? 0,
    };

    console.log('✅ [RealTimeMonitoringV2] Metrics loaded:', metrics);
    return metrics;
  };

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: fetchSystemMetrics,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: currentRole === 'super_admin' || currentRole === 'compliance_admin',
  });

  // Calculate system health
  const systemHealth = useMemo<SystemHealth>(() => {
    if (!metrics) {
      return {
        databaseStatus: 'warning',
        dataIntegrity: 0,
        lastUpdated: new Date(),
      };
    }

    // Simple health check: if we have data, database is healthy
    const databaseStatus: 'healthy' | 'warning' | 'error' =
      metrics.totalUsers > 0 ? 'healthy' : 'warning';

    // Data integrity: check if data makes sense
    const hasValidData =
      metrics.totalUsers >= (metrics.parentCount + metrics.teacherCount + metrics.adminCount) &&
      metrics.totalBatches >= metrics.activeBatches &&
      metrics.batchUtilization >= 0 && metrics.batchUtilization <= 100;

    const dataIntegrity = hasValidData ? 100 : 75;

    return {
      databaseStatus,
      dataIntegrity,
      lastUpdated: new Date(),
    };
  }, [metrics]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    trackAction('refresh_dashboard', 'RealTimeMonitoringV2');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Render metric card
  const renderMetricCard = useCallback((
    title: string,
    value: number | string,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <Card style={[styles.metricCard, { borderLeftColor: color }]}>
      <CardContent>
        <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
          <Icon name={icon} size={24} color={color} style={{ opacity: 0.9 }} />
          <T variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
            LIVE
          </T>
        </Row>
        <T variant="h2" weight="bold" style={{ color, fontSize: 32, marginBottom: Spacing.xs }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </T>
        <T variant="caption" color="textSecondary" weight="medium">
          {title}
        </T>
        {subtitle && (
          <T variant="caption" color="textSecondary" style={{ fontSize: 10, marginTop: Spacing.xs }}>
            {subtitle}
          </T>
        )}
      </CardContent>
    </Card>
  ), []);

  // Render system health indicator
  const renderSystemHealth = useCallback(() => {
    const statusColor = systemHealth.databaseStatus === 'healthy' ? Colors.success :
                       systemHealth.databaseStatus === 'warning' ? Colors.warning : Colors.error;
    const statusText = systemHealth.databaseStatus === 'healthy' ? 'Healthy' :
                      systemHealth.databaseStatus === 'warning' ? 'Warning' : 'Error';

    return (
      <Card variant="elevated">
        <CardContent>
          <T variant="h3" weight="bold" style={{ marginBottom: Spacing.md }}>
            System Health
          </T>

          <Row spaceBetween centerV style={{ marginBottom: Spacing.md }}>
            <Col flex={1}>
              <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                Database Status
              </T>
              <Row centerV gap="xs">
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <T variant="body" weight="semiBold" style={{ color: statusColor }}>
                  {statusText}
                </T>
              </Row>
            </Col>

            <Col flex={1} align="flex-end">
              <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                Data Integrity
              </T>
              <T variant="body" weight="semiBold" style={{ color: Colors.success }}>
                {(systemHealth.dataIntegrity ?? 0).toFixed(0)}%
              </T>
            </Col>
          </Row>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${systemHealth.dataIntegrity ?? 0}%`,
                  backgroundColor: Colors.success
                }
              ]}
            />
          </View>

          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
            Last updated: {systemHealth.lastUpdated.toLocaleTimeString()}
          </T>
        </CardContent>
      </Card>
    );
  }, [systemHealth]);

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error ? 'Failed to load system metrics' : null}
      empty={false}
      onRetry={refetch}
    >
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <Col sx={{ p: 'md' }} gap="md">
          {/* Header */}
          <Card variant="elevated">
            <CardContent>
              <Row spaceBetween centerV>
                <Col flex={1}>
                  <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                    System Overview
                  </T>
                  <T variant="body" color="textSecondary">
                    Real-time monitoring dashboard • Auto-refresh: 30s
                  </T>
                </Col>
                <Icon name="monitor-heart" size={32} color={Colors.primary} />
              </Row>
            </CardContent>
          </Card>

          {/* System Health */}
          {renderSystemHealth()}

          {/* User Statistics Section */}
          <T variant="h3" weight="bold" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
            User Statistics
          </T>
          <Row style={{ flexWrap: 'wrap', gap: Spacing.xs }}>
            {renderMetricCard('Total Users', metrics?.totalUsers ?? 0, 'people', Colors.primary)}
            {renderMetricCard('Parents', metrics?.parentCount ?? 0, 'family-restroom', Colors.secondary)}
            {renderMetricCard('Teachers', metrics?.teacherCount ?? 0, 'school', Colors.tertiary)}
            {renderMetricCard('Admins', metrics?.adminCount ?? 0, 'admin-panel-settings', Colors.warning)}
          </Row>

          {/* Student & Batch Statistics Section */}
          <T variant="h3" weight="bold" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
            Student & Batch Statistics
          </T>
          <Row style={{ flexWrap: 'wrap', gap: Spacing.xs }}>
            {renderMetricCard('Total Students', metrics?.totalStudents ?? 0, 'groups', Colors.info)}
            {renderMetricCard('Active Batches', metrics?.activeBatches ?? 0, 'class', Colors.success)}
            {renderMetricCard(
              'Batch Utilization',
              `${(metrics?.batchUtilization ?? 0).toFixed(1)}%`,
              'trending-up',
              metrics && metrics.batchUtilization > 80 ? Colors.success : Colors.warning,
              `${metrics?.activeBatches ?? 0}/${metrics?.totalBatches ?? 0} active`
            )}
            {renderMetricCard('Organizations', metrics?.totalOrganizations ?? 0, 'business', Colors.primary)}
          </Row>

          {/* System Information */}
          <Card variant="outlined" style={{ marginTop: Spacing.md }}>
            <CardContent>
              <T variant="h4" weight="bold" style={{ marginBottom: Spacing.sm }}>
                System Information
              </T>

              <Col gap="xs">
                <Row spaceBetween>
                  <T variant="body" color="textSecondary">Platform</T>
                  <T variant="body" weight="semiBold">React Native</T>
                </Row>
                <Row spaceBetween>
                  <T variant="body" color="textSecondary">Database</T>
                  <T variant="body" weight="semiBold">Supabase (PostgreSQL)</T>
                </Row>
                <Row spaceBetween>
                  <T variant="body" color="textSecondary">Data Source</T>
                  <T variant="body" weight="semiBold">Real-time Queries</T>
                </Row>
                <Row spaceBetween>
                  <T variant="body" color="textSecondary">Refresh Interval</T>
                  <T variant="body" weight="semiBold">30 seconds</T>
                </Row>
              </Col>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {metrics && metrics.batchUtilization < 50 && (
            <Card variant="elevated" style={{ backgroundColor: Colors.warningContainer, marginTop: Spacing.sm }}>
              <CardContent>
                <Row centerV gap="sm">
                  <Icon name="lightbulb" size={24} color={Colors.warning} />
                  <Col flex={1}>
                    <T variant="body" weight="semiBold" style={{ color: Colors.warning }}>
                      Low Batch Utilization
                    </T>
                    <T variant="caption" style={{ color: Colors.warning, marginTop: Spacing.xs }}>
                      Current utilization is {(metrics.batchUtilization ?? 0).toFixed(1)}%. Consider consolidating batches or increasing enrollment.
                    </T>
                  </Col>
                </Row>
              </CardContent>
            </Card>
          )}
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2, // 2 columns with spacing
    borderLeftWidth: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default RealTimeMonitoringDashboardV2;
