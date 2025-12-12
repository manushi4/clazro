/**
 * ChildDetailScreen - PHASE 2: Children Management
 * Complete child profile with academic overview, attendance, and quick actions
 *
 * Features:
 * - Full child profile information
 * - Academic performance overview
 * - Attendance summary with percentage
 * - Recent activities timeline
 * - Quick action buttons
 * - Real-time data from Supabase
 * - Pull to refresh
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { IconButton, ProgressBar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardHeader, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import type { ParentStackParamList } from '../../types/navigation';
import { safeNavigate } from '../../utils/navigationService';
import { trackAction } from '../../utils/navigationAnalytics';
import { supabase } from '../../lib/supabase';
import {
  getStudentAttendanceSummary,
  getUpcomingClasses,
  getPendingAssignments,
} from '../../services/api/parentApi';

type Props = NativeStackScreenProps<ParentStackParamList, 'ChildDetail'>;

interface ChildProfile {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  batch_id: string;
  enrollment_date: string;
  status: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
}

interface SubjectGrade {
  subject: string;
  grade: number;
  total: number;
  percentage: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'exam' | 'attendance' | 'announcement';
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

const ChildDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { childId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  console.log('👶 [ChildDetail] Loading details for child:', childId);

  // ============================================
  // Fetch child profile
  // ============================================
  const {
    data: childProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['childProfile', childId],
    queryFn: async () => {
      console.log('📞 [ChildDetail] Fetching child profile...');
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', childId)
        .single();

      if (error) {
        console.error('❌ [ChildDetail] Profile error:', error);
        throw error;
      }

      console.log('✅ [ChildDetail] Profile loaded:', data?.full_name);
      return data as ChildProfile;
    },
    enabled: !!childId,
  });

  // ============================================
  // Fetch attendance summary
  // ============================================
  const {
    data: attendanceData,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['studentAttendance', childId],
    queryFn: () => getStudentAttendanceSummary(childId),
    enabled: !!childId,
  });

  // ============================================
  // Fetch upcoming classes
  // ============================================
  const {
    data: upcomingClasses = [],
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['upcomingClasses', childId],
    queryFn: () => getUpcomingClasses(childId, 3),
    enabled: !!childId,
  });

  // ============================================
  // Fetch pending assignments
  // ============================================
  const {
    data: pendingAssignments = [],
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ['pendingAssignments', childId],
    queryFn: () => getPendingAssignments(childId),
    enabled: !!childId,
  });

  // ============================================
  // Fetch subject grades
  // ============================================
  const {
    data: subjectGrades = [],
    refetch: refetchGrades,
  } = useQuery({
    queryKey: ['subjectGrades', childId],
    queryFn: async () => {
      console.log('📚 [ChildDetail] Fetching subject grades...');
      const { data, error } = await supabase
        .from('student_grades')
        .select('subject, grade, total_marks')
        .eq('student_id', childId)
        .order('subject');

      if (error) {
        console.error('❌ [ChildDetail] Grades error:', error);
        return [];
      }

      // Calculate percentages
      const gradesWithPercentage = (data || []).map(item => ({
        subject: item.subject,
        grade: item.grade || 0,
        total: item.total_marks || 100,
        percentage: item.total_marks ? (item.grade / item.total_marks) * 100 : 0,
      }));

      console.log('✅ [ChildDetail] Loaded', gradesWithPercentage.length, 'subject grades');
      return gradesWithPercentage as SubjectGrade[];
    },
    enabled: !!childId,
  });

  // ============================================
  // Calculate overall performance
  // ============================================
  const overallPerformance = useMemo(() => {
    if (subjectGrades.length === 0) return 0;
    const totalPercentage = subjectGrades.reduce((sum, grade) => sum + grade.percentage, 0);
    return totalPercentage / subjectGrades.length;
  }, [subjectGrades]);

  // Analytics tracking
  React.useEffect(() => {
    console.log('✅ [ChildDetail] Screen mounted for child:', childProfile?.full_name);
    trackAction('view_child_detail', 'ChildDetail', { childId });
  }, [childId, childProfile?.full_name]);

  // ============================================
  // Event Handlers
  // ============================================
  const handleRefresh = async () => {
    console.log('🔄 [ChildDetail] Refreshing all data...');
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchAttendance(),
      refetchClasses(),
      refetchAssignments(),
      refetchGrades(),
    ]);
    setRefreshing(false);
    console.log('✅ [ChildDetail] Refresh complete');
  };

  const handleViewAllAssignments = () => {
    trackAction('view_all_assignments', 'ChildDetail', { childId });
    safeNavigate('AssignmentsList', { studentId: childId });
  };

  const handleViewAttendance = () => {
    trackAction('view_attendance', 'ChildDetail', { childId });
    console.log('TODO: Navigate to AttendanceDetailScreen');
  };

  const handleViewSubject = (subject: string) => {
    trackAction('view_subject_detail', 'ChildDetail', { childId, subject });
    safeNavigate('SubjectDetail', { studentId: childId, subject });
  };

  const handleMessageTeacher = () => {
    trackAction('message_teacher', 'ChildDetail', { childId });
    safeNavigate('TeacherList', { studentId: childId });
  };

  // ============================================
  // Get attendance color and status
  // ============================================
  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 90) return { color: Colors.success, status: 'Excellent' };
    if (percentage >= 75) return { color: Colors.primary, status: 'Good' };
    if (percentage >= 60) return { color: Colors.warning, status: 'Fair' };
    return { color: Colors.error, status: 'Poor' };
  };

  const isLoading = profileLoading;
  const error = profileError;

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error}
      empty={!childProfile}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <Col sx={{ p: 'md' }}>
          {/* Header Card with Profile */}
          <Card variant="elevated" style={styles.headerCard}>
            <CardContent>
              <Row gap="base" centerV>
                {/* Avatar Circle */}
                <View style={styles.avatar}>
                  <T variant="display" style={{ fontSize: 48 }}>
                    {childProfile?.full_name?.charAt(0).toUpperCase() || '👤'}
                  </T>
                </View>

                {/* Name and Info */}
                <Col flex={1}>
                  <T variant="title" weight="bold" numberOfLines={1}>
                    {childProfile?.full_name || 'Student Name'}
                  </T>
                  <T variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                    ID: {childProfile?.student_id || 'N/A'}
                  </T>
                  {childProfile?.email && (
                    <T variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                      {childProfile.email}
                    </T>
                  )}
                  <Badge
                    variant={childProfile?.status === 'active' ? 'success' : 'default'}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  >
                    {childProfile?.status?.toUpperCase() || 'N/A'}
                  </Badge>
                </Col>
              </Row>

              {/* Enrollment Date */}
              {childProfile?.enrollment_date && (
                <Row centerV gap="xs" style={{ marginTop: Spacing.base }}>
                  <IconButton
                    icon="calendar"
                    size={16}
                    iconColor={Colors.textSecondary}
                    style={{ margin: 0 }}
                  />
                  <T variant="caption" color="textSecondary">
                    Enrolled on {new Date(childProfile.enrollment_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </T>
                </Row>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Row gap="sm" style={{ marginTop: Spacing.md }}>
            <Button
              variant="outlined"
              size="sm"
              onPress={handleViewAttendance}
              style={{ flex: 1 }}
            >
              📊 Attendance
            </Button>
            <Button
              variant="outlined"
              size="sm"
              onPress={handleViewAllAssignments}
              style={{ flex: 1 }}
            >
              📝 Assignments
            </Button>
            <Button
              variant="outlined"
              size="sm"
              onPress={handleMessageTeacher}
              style={{ flex: 1 }}
            >
              💬 Message
            </Button>
          </Row>

          {/* MD3 Navigation Cards - Hybrid Approach */}
          <T variant="title" weight="semiBold" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Detailed Insights
          </T>

          {/* 1. Academic Performance Card */}
          <Pressable
            onPress={() => {
              trackAction('view_academics_detail', 'ChildDetail', { childId, childName: childProfile?.full_name });
              safeNavigate('AcademicsDetail', { childId, childName: childProfile?.full_name });
            }}
            android_ripple={{ color: Colors.primary + '1F' }}
          >
            <Card variant="elevated" style={styles.navigationCard}>
              <CardContent>
                <Row spaceBetween centerV>
                  <Row gap="sm" centerV flex={1}>
                    <View style={[styles.cardIcon, { backgroundColor: Colors.primary + '1F' }]}>
                      <T variant="title" style={{ fontSize: 24 }}>🎓</T>
                    </View>
                    <Col flex={1}>
                      <T variant="body" weight="semiBold">Academic Performance</T>
                      <T variant="caption" color="textSecondary" numberOfLines={1}>
                        {subjectGrades.length} subjects • {(overallPerformance ?? 0).toFixed(0)}% overall
                      </T>
                    </Col>
                  </Row>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={Colors.textSecondary}
                    style={{ margin: 0 }}
                  />
                </Row>
              </CardContent>
            </Card>
          </Pressable>

          {/* 2. Behavior Tracking Card */}
          <Pressable
            onPress={() => {
              trackAction('view_behavior_detail', 'ChildDetail', { childId, childName: childProfile?.full_name });
              safeNavigate('BehaviorTracking', { childId, childName: childProfile?.full_name });
            }}
            android_ripple={{ color: Colors.secondary + '1F' }}
          >
            <Card variant="elevated" style={styles.navigationCard}>
              <CardContent>
                <Row spaceBetween centerV>
                  <Row gap="sm" centerV flex={1}>
                    <View style={[styles.cardIcon, { backgroundColor: Colors.secondary + '1F' }]}>
                      <T variant="title" style={{ fontSize: 24 }}>📊</T>
                    </View>
                    <Col flex={1}>
                      <T variant="body" weight="semiBold">Behavior Tracking</T>
                      <T variant="caption" color="textSecondary" numberOfLines={1}>
                        View behavioral progress and teacher notes
                      </T>
                    </Col>
                  </Row>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={Colors.textSecondary}
                    style={{ margin: 0 }}
                  />
                </Row>
              </CardContent>
            </Card>
          </Pressable>

          {/* 3. Goals & Milestones Card */}
          <Pressable
            onPress={() => {
              trackAction('view_goals_detail', 'ChildDetail', { childId, childName: childProfile?.full_name });
              safeNavigate('GoalsAndMilestones', { childId, childName: childProfile?.full_name });
            }}
            android_ripple={{ color: Colors.success + '1F' }}
          >
            <Card variant="elevated" style={styles.navigationCard}>
              <CardContent>
                <Row spaceBetween centerV>
                  <Row gap="sm" centerV flex={1}>
                    <View style={[styles.cardIcon, { backgroundColor: Colors.success + '1F' }]}>
                      <T variant="title" style={{ fontSize: 24 }}>🎯</T>
                    </View>
                    <Col flex={1}>
                      <T variant="body" weight="semiBold">Goals & Milestones</T>
                      <T variant="caption" color="textSecondary" numberOfLines={1}>
                        Track achievements and progress
                      </T>
                    </Col>
                  </Row>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={Colors.textSecondary}
                    style={{ margin: 0 }}
                  />
                </Row>
              </CardContent>
            </Card>
          </Pressable>

          {/* 4. AI Insights Card */}
          <Pressable
            onPress={() => {
              trackAction('view_insights_detail', 'ChildDetail', { childId, childName: childProfile?.full_name });
              safeNavigate('StudentInsights', { childId, childName: childProfile?.full_name });
            }}
            android_ripple={{ color: Colors.warning + '1F' }}
          >
            <Card variant="elevated" style={styles.navigationCard}>
              <CardContent>
                <Row spaceBetween centerV>
                  <Row gap="sm" centerV flex={1}>
                    <View style={[styles.cardIcon, { backgroundColor: Colors.warning + '1F' }]}>
                      <T variant="title" style={{ fontSize: 24 }}>💡</T>
                    </View>
                    <Col flex={1}>
                      <T variant="body" weight="semiBold">AI Insights</T>
                      <T variant="caption" color="textSecondary" numberOfLines={1}>
                        Personalized recommendations and analysis
                      </T>
                    </Col>
                  </Row>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={Colors.textSecondary}
                    style={{ margin: 0 }}
                  />
                </Row>
              </CardContent>
            </Card>
          </Pressable>

          {/* Academic Overview */}
          <T variant="title" weight="semiBold" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Academic Overview
          </T>
          <Card variant="elevated">
            <CardContent>
              {/* Overall Performance */}
              <Row spaceBetween centerV style={{ marginBottom: Spacing.base }}>
                <T variant="body" weight="medium">Overall Performance</T>
                <T variant="title" weight="bold" color="primary">
                  {(overallPerformance ?? 0).toFixed(1)}%
                </T>
              </Row>
              <ProgressBar
                progress={(overallPerformance ?? 0) / 100}
                color={(overallPerformance ?? 0) >= 75 ? Colors.success : Colors.primary}
                style={styles.progressBar}
              />

              {/* Subject Breakdown */}
              {subjectGrades.length > 0 && (
                <Col gap="sm" style={{ marginTop: Spacing.base }}>
                  <T variant="caption" weight="semiBold" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                    SUBJECT BREAKDOWN
                  </T>
                  {subjectGrades.slice(0, 4).map((subject) => (
                    <Pressable
                      key={subject.subject}
                      onPress={() => handleViewSubject(subject.subject)}
                      android_ripple={{ color: Colors.primary + '1F' }}
                    >
                      <Row spaceBetween centerV style={styles.subjectRow}>
                        <T variant="body" flex={1} numberOfLines={1}>{subject.subject}</T>
                        <Row gap="sm" centerV>
                          <T variant="body" color="textSecondary">
                            {subject.grade}/{subject.total}
                          </T>
                          <T
                            variant="body"
                            weight="semiBold"
                            color={(subject.percentage ?? 0) >= 75 ? 'success' : 'textSecondary'}
                            style={{ minWidth: 50, textAlign: 'right' }}
                          >
                            {(subject.percentage ?? 0).toFixed(0)}%
                          </T>
                          <IconButton
                            icon="chevron-right"
                            size={20}
                            iconColor={Colors.textSecondary}
                            style={{ margin: 0 }}
                          />
                        </Row>
                      </Row>
                    </Pressable>
                  ))}
                  {subjectGrades.length > 4 && (
                    <Pressable
                      onPress={() => {
                        trackAction('view_all_subjects', 'ChildDetail', { childId, count: subjectGrades.length });
                        safeNavigate('AssignmentsList', { studentId: childId });
                      }}
                      android_ripple={{ color: Colors.primary + '1F' }}
                    >
                      <Row centerV gap="xs" style={{ paddingVertical: Spacing.xs }}>
                        <T variant="caption" color="primary" weight="medium">
                          View {subjectGrades.length - 4} more subjects
                        </T>
                        <IconButton
                          icon="chevron-right"
                          size={16}
                          iconColor={Colors.primary}
                          style={{ margin: 0 }}
                        />
                      </Row>
                    </Pressable>
                  )}
                </Col>
              )}

              {subjectGrades.length === 0 && (
                <T variant="caption" color="textSecondary" align="center" style={{ marginTop: Spacing.sm }}>
                  No grade data available yet
                </T>
              )}
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <T variant="title" weight="semiBold" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Attendance
          </T>
          <Card variant="elevated">
            <CardContent>
              {attendanceData ? (
                <>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.base }}>
                    <T variant="body" weight="medium">Attendance Rate</T>
                    <Row gap="xs" centerV>
                      <T
                        variant="title"
                        weight="bold"
                        style={{ color: getAttendanceStatus(attendanceData.percentage ?? 0).color }}
                      >
                        {(attendanceData.percentage ?? 0).toFixed(1)}%
                      </T>
                      <Badge variant={(attendanceData.percentage ?? 0) >= 75 ? 'success' : 'error'}>
                        {getAttendanceStatus(attendanceData.percentage ?? 0).status}
                      </Badge>
                    </Row>
                  </Row>
                  <ProgressBar
                    progress={(attendanceData.percentage ?? 0) / 100}
                    color={getAttendanceStatus(attendanceData.percentage ?? 0).color}
                    style={styles.progressBar}
                  />

                  {/* Attendance Stats */}
                  <Row spaceBetween style={{ marginTop: Spacing.base }}>
                    <Col centerH flex={1}>
                      <T variant="headline" weight="bold">{attendanceData.total_classes || 0}</T>
                      <T variant="caption" color="textSecondary">Total Classes</T>
                    </Col>
                    <Col centerH flex={1}>
                      <T variant="headline" weight="bold" color="success">{attendanceData.present || 0}</T>
                      <T variant="caption" color="textSecondary">Present</T>
                    </Col>
                    <Col centerH flex={1}>
                      <T variant="headline" weight="bold" color="error">{attendanceData.absent || 0}</T>
                      <T variant="caption" color="textSecondary">Absent</T>
                    </Col>
                  </Row>
                </>
              ) : (
                <T variant="caption" color="textSecondary" align="center">
                  No attendance data available yet
                </T>
              )}
            </CardContent>
          </Card>

          {/* Pending Assignments */}
          {pendingAssignments.length > 0 && (
            <>
              <Row spaceBetween centerV style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
                <T variant="title" weight="semiBold">Pending Assignments</T>
                <Badge variant="warning">{pendingAssignments.length}</Badge>
              </Row>
              <Card variant="elevated">
                <CardContent>
                  <Col gap="sm">
                    {pendingAssignments.slice(0, 3).map((item: any) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          trackAction('view_assignment', 'ChildDetail', { assignmentId: item.assignment.id });
                          safeNavigate('AssignmentDetail', { assignmentId: item.assignment.id });
                        }}
                        android_ripple={{ color: Colors.primary + '1F' }}
                      >
                        <Row spaceBetween centerV style={styles.assignmentRow}>
                          <Col flex={1}>
                            <T variant="body" weight="medium" numberOfLines={1}>
                              {item.assignment.title}
                            </T>
                            <T variant="caption" color="textSecondary">
                              {item.assignment.subject} • Due {new Date(item.assignment.due_date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </T>
                          </Col>
                          <IconButton
                            icon="chevron-right"
                            size={20}
                            iconColor={Colors.textSecondary}
                            style={{ margin: 0 }}
                          />
                        </Row>
                      </Pressable>
                    ))}
                    {pendingAssignments.length > 3 && (
                      <Pressable
                        onPress={handleViewAllAssignments}
                        android_ripple={{ color: Colors.primary + '1F' }}
                      >
                        <Row centerV gap="xs" style={{ paddingVertical: Spacing.xs }}>
                          <T variant="caption" color="primary" weight="medium">
                            View all {pendingAssignments.length} assignments
                          </T>
                          <IconButton
                            icon="chevron-right"
                            size={16}
                            iconColor={Colors.primary}
                            style={{ margin: 0 }}
                          />
                        </Row>
                      </Pressable>
                    )}
                  </Col>
                </CardContent>
              </Card>
            </>
          )}

          {/* Upcoming Classes */}
          {upcomingClasses.length > 0 && (
            <>
              <T variant="title" weight="semiBold" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
                Upcoming Classes
              </T>
              <Card variant="elevated">
                <CardContent>
                  <Col gap="sm">
                    {upcomingClasses.map((classItem: any) => (
                      <Row key={classItem.id} gap="base" centerV style={styles.classRow}>
                        <View style={styles.classIconContainer}>
                          <IconButton
                            icon="book-open-variant"
                            size={24}
                            iconColor={Colors.primary}
                            style={{ margin: 0 }}
                          />
                        </View>
                        <Col flex={1}>
                          <T variant="body" weight="medium" numberOfLines={1}>
                            {classItem.title || classItem.subject}
                          </T>
                          <T variant="caption" color="textSecondary">
                            {classItem.teacher?.full_name || 'Teacher'} • {new Date(classItem.scheduled_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </T>
                        </Col>
                      </Row>
                    ))}
                  </Col>
                </CardContent>
              </Card>
            </>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 24 }} />
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: Colors.primaryContainer,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
  },
  subjectRow: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  assignmentRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  classRow: {
    paddingVertical: Spacing.sm,
  },
  classIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationCard: {
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChildDetailScreen;
