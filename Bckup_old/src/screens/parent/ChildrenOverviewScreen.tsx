/**
 * ChildrenOverviewScreen - Consolidated Children Tab View
 *
 * Replaces and consolidates these 4 old screens:
 * - ChildProgressMonitoringScreen
 * - PerformanceAnalyticsScreen
 * - AcademicScheduleScreen
 * - StudyRecommendationsScreen
 *
 * Features:
 * - Real-time children summary with academic performance
 * - Attendance tracking and trends
 * - Pending assignments overview
 * - Recent grades display
 * - Filter by status (All, Active, Needs Attention)
 * - Quick navigation to child details
 * - Pull-to-refresh support
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressBar } from 'react-native-paper';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useChildrenSummary } from '../../hooks/api/useParentAPI';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<ParentStackParamList, 'ChildProgress'>;

type StatusFilter = 'all' | 'active' | 'needs_attention';

const ChildrenOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Get parent ID (fallback to test ID if not authenticated)
  const parentId = (user?.id && typeof user.id === 'string' && user.id !== 'undefined')
    ? user.id
    : '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    trackScreenView('ChildrenOverview', { from: 'ChildrenTab' });
  }, []);

  // Fetch children summary
  const {
    data: children = [],
    isLoading,
    error,
    refetch,
  } = useChildrenSummary(parentId);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = children.length;
    const avgPerformance = total > 0
      ? children.reduce((sum, child) => sum + (child.academic_performance?.average_exam_percentage ?? 0), 0) / total
      : 0;
    const avgAttendance = total > 0
      ? children.reduce((sum, child) => sum + (child.attendance?.attendance_percentage ?? 0), 0) / total
      : 0;
    const totalPendingAssignments = children.reduce((sum, child) => sum + (child.pending_assignments ?? 0), 0);
    const needsAttention = children.filter(child =>
      (child.academic_performance?.average_exam_percentage ?? 0) < 60 ||
      (child.attendance?.attendance_percentage ?? 0) < 75
    ).length;

    return {
      total,
      avgPerformance,
      avgAttendance,
      totalPendingAssignments,
      needsAttention,
    };
  }, [children]);

  // Filter children based on status
  const filteredChildren = useMemo(() => {
    if (statusFilter === 'all') return children;
    if (statusFilter === 'needs_attention') {
      return children.filter(child =>
        (child.academic_performance?.average_exam_percentage ?? 0) < 60 ||
        (child.attendance?.attendance_percentage ?? 0) < 75
      );
    }
    // Active filter
    return children.filter(child =>
      (child.academic_performance?.average_exam_percentage ?? 0) >= 60 &&
      (child.attendance?.attendance_percentage ?? 0) >= 75
    );
  }, [children, statusFilter]);

  // Get performance status
  const getPerformanceStatus = (percentage: number | null | undefined): { label: string; variant: 'success' | 'warning' | 'error' } => {
    const perf = percentage ?? 0;
    if (perf >= 80) return { label: 'Excellent', variant: 'success' };
    if (perf >= 60) return { label: 'Good', variant: 'warning' };
    return { label: 'Needs Help', variant: 'error' };
  };

  // Get attendance status
  const getAttendanceStatus = (percentage: number | null | undefined): { label: string; color: string } => {
    const att = percentage ?? 0;
    if (att >= 90) return { label: 'Excellent', color: Colors.success };
    if (att >= 75) return { label: 'Good', color: Colors.warning };
    return { label: 'Poor', color: Colors.error };
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load children data' : null}
      empty={!isLoading && children.length === 0}
      emptyBody="No children registered. Contact school administration to add children to your account."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Summary Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Children Overview
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Track all your children's progress in one place
            </T>

            {/* Stats Grid */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total Children</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.success }}>
                  {(stats.avgPerformance ?? 0).toFixed(0)}%
                </T>
                <T variant="caption" color="textSecondary">Avg Performance</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.info }}>
                  {(stats.avgAttendance ?? 0).toFixed(0)}%
                </T>
                <T variant="caption" color="textSecondary">Avg Attendance</T>
              </View>
            </Row>

            {/* Secondary Stats */}
            <Row spaceBetween style={{ marginTop: Spacing.lg }}>
              <View style={{ alignItems: 'center' }}>
                <T variant="body" weight="semiBold" style={{ color: Colors.warning }}>
                  {stats.totalPendingAssignments}
                </T>
                <T variant="caption" color="textSecondary">Pending Assignments</T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <T variant="body" weight="semiBold" style={{ color: Colors.error }}>
                  {stats.needsAttention}
                </T>
                <T variant="caption" color="textSecondary">Needs Attention</T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        <Row style={{ flexWrap: 'wrap', gap: Spacing.xs }}>
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'outline'}
            onPress={() => {
              setStatusFilter('all');
              trackAction('filter_status', 'ChildrenOverview', { status: 'all' });
            }}
          >
            All ({children.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'primary' : 'outline'}
            onPress={() => {
              setStatusFilter('active');
              trackAction('filter_status', 'ChildrenOverview', { status: 'active' });
            }}
          >
            Active ({children.filter(c =>
              (c.academic_performance?.average_exam_percentage ?? 0) >= 60 &&
              (c.attendance?.attendance_percentage ?? 0) >= 75
            ).length})
          </Button>
          <Button
            variant={statusFilter === 'needs_attention' ? 'primary' : 'outline'}
            onPress={() => {
              setStatusFilter('needs_attention');
              trackAction('filter_status', 'ChildrenOverview', { status: 'needs_attention' });
            }}
          >
            Needs Attention ({stats.needsAttention})
          </Button>
        </Row>

        {/* Children List */}
        <Col gap="sm">
          {filteredChildren.map((child) => {
            const student = child.student;
            const performance = child.academic_performance;
            const attendance = child.attendance;
            const perfStatus = getPerformanceStatus(performance?.average_exam_percentage);
            const attStatus = getAttendanceStatus(attendance?.attendance_percentage);

            return (
              <Card key={student?.id} variant="elevated">
                <CardContent>
                  {/* Header Row */}
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <T variant="title" weight="bold">
                        {student?.full_name || 'Unknown Student'}
                      </T>
                      <T variant="caption" color="textSecondary">
                        {student?.grade || 'N/A'} • {student?.class_name || 'No Class'}
                      </T>
                    </View>
                    <Badge variant={perfStatus.variant} label={perfStatus.label} />
                  </Row>

                  {/* Academic Performance */}
                  <View style={{ marginTop: Spacing.md }}>
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <T variant="body" weight="semiBold">Academic Performance</T>
                      <T variant="body" weight="bold" style={{ color: Colors.primary }}>
                        {(performance?.average_exam_percentage ?? 0).toFixed(1)}%
                      </T>
                    </Row>
                    <ProgressBar
                      progress={(performance?.average_exam_percentage ?? 0) / 100}
                      color={perfStatus.variant === 'success' ? Colors.success : perfStatus.variant === 'warning' ? Colors.warning : Colors.error}
                      style={{ height: 8, borderRadius: 4 }}
                    />
                  </View>

                  {/* Attendance */}
                  <View style={{ marginTop: Spacing.md }}>
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <T variant="body" weight="semiBold">Attendance</T>
                      <T variant="body" weight="bold" style={{ color: attStatus.color }}>
                        {(attendance?.attendance_percentage ?? 0).toFixed(1)}%
                      </T>
                    </Row>
                    <ProgressBar
                      progress={(attendance?.attendance_percentage ?? 0) / 100}
                      color={attStatus.color}
                      style={{ height: 8, borderRadius: 4 }}
                    />
                    <Row style={{ marginTop: Spacing.xs, gap: Spacing.md }}>
                      <T variant="caption" color="textSecondary">
                        Present: {attendance?.present_days ?? 0}
                      </T>
                      <T variant="caption" color="textSecondary">
                        Absent: {attendance?.absent_days ?? 0}
                      </T>
                      <T variant="caption" color="textSecondary">
                        Late: {attendance?.late_days ?? 0}
                      </T>
                    </Row>
                  </View>

                  {/* Assignments & Grades */}
                  <Row spaceBetween style={{ marginTop: Spacing.md }}>
                    <View>
                      <T variant="caption" color="textSecondary">Pending Assignments</T>
                      <T variant="body" weight="bold" style={{ color: Colors.warning }}>
                        {child.pending_assignments ?? 0}
                      </T>
                    </View>
                    <View>
                      <T variant="caption" color="textSecondary">Recent Grades</T>
                      <T variant="body" weight="bold" style={{ color: Colors.info }}>
                        {child.recent_grades?.length ?? 0} recorded
                      </T>
                    </View>
                  </Row>

                  {/* View Details Button */}
                  <Button
                    variant="primary"
                    onPress={() => {
                      trackAction('view_child_detail', 'ChildrenOverview', {
                        childId: student?.id,
                        childName: student?.full_name,
                      });
                      safeNavigate('ChildDetail', {
                        childId: student?.id || '',
                        childName: student?.full_name || '',
                      });
                    }}
                    style={{ marginTop: Spacing.md }}
                  >
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Col>

        {/* Empty State for Filter */}
        {filteredChildren.length === 0 && children.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No children found with {statusFilter === 'needs_attention' ? 'attention needed' : statusFilter} status
                </T>
                <Button
                  variant="outline"
                  onPress={() => setStatusFilter('all')}
                  style={{ marginTop: Spacing.md }}
                >
                  Show All Children
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});

export default ChildrenOverviewScreen;
