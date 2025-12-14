/**
 * AssignmentsListScreen - View all assignments for a student
 *
 * Features:
 * - Display all assignments with submission status
 * - Filter by status (All/Pending/Submitted/Graded/Overdue)
 * - Filter by subject
 * - Show assignment details (title, subject, due date, points)
 * - Display days until due or overdue status
 * - Show submission status and score (if graded)
 * - Pull to refresh
 * - Navigate to assignment detail
 *
 * Data Sources:
 * - assignments table (LEFT JOIN assignment_submissions)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'AssignmentsList'>;

type StatusFilter = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  due_date: string;
  total_points: number;
  status: string;
  // From LEFT JOIN with assignment_submissions
  submission_id: string | null;
  submission_status: string | null;
  submission_date: string | null;
  score: number | null;
  feedback: string | null;
}

const AssignmentsListScreen: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  useEffect(() => {
    trackScreenView('AssignmentsList', { studentId, from: 'ChildDetail' });
  }, [studentId]);

  // Fetch assignments with submissions
  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignments', studentId],
    queryFn: async () => {
      console.log('🔍 [AssignmentsList] Fetching assignments for student:', studentId);

      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'published')
        .order('due_date', { ascending: true });

      if (assignmentsError) {
        console.error('❌ [AssignmentsList] Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Fetch submissions for this student
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId);

      if (submissionsError) {
        console.error('❌ [AssignmentsList] Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      // Merge assignments with their submissions
      const flattenedData = assignmentsData.map((assignment: any) => {
        const studentSubmission = submissionsData?.find(
          (sub: any) => sub.assignment_id === assignment.id
        );

        return {
          id: assignment.id,
          title: assignment.title,
          subject: assignment.subject,
          description: assignment.description,
          due_date: assignment.due_date,
          total_points: assignment.total_points,
          status: assignment.status,
          submission_id: studentSubmission?.id || null,
          submission_status: studentSubmission?.status || null,
          submission_date: studentSubmission?.submission_date || null,
          score: studentSubmission?.score || null,
          feedback: studentSubmission?.feedback || null,
        } as Assignment;
      });

      console.log('✅ [AssignmentsList] Loaded', flattenedData.length, 'assignments');
      return flattenedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper: Calculate assignment status
  const getAssignmentStatus = (assignment: Assignment): StatusFilter => {
    const isPastDue = new Date() > new Date(assignment.due_date);

    if (assignment.submission_status === 'graded') return 'graded';
    if (assignment.submission_id) return 'submitted';
    if (isPastDue) return 'overdue';
    return 'pending';
  };

  // Helper: Calculate days until due
  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(assignments.map(a => a.subject));
    return Array.from(uniqueSubjects).sort();
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const assignmentStatus = getAssignmentStatus(assignment);
      const matchesStatus = statusFilter === 'all' || assignmentStatus === statusFilter;
      const matchesSubject = subjectFilter === 'all' || assignment.subject === subjectFilter;
      return matchesStatus && matchesSubject;
    });
  }, [assignments, statusFilter, subjectFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const graded = assignments.filter(a => a.submission_status === 'graded').length;
    const submitted = assignments.filter(a => a.submission_id && a.submission_status !== 'graded').length;
    const pending = assignments.filter(a => {
      const status = getAssignmentStatus(a);
      return status === 'pending';
    }).length;
    const overdue = assignments.filter(a => {
      const status = getAssignmentStatus(a);
      return status === 'overdue';
    }).length;

    return { total, graded, submitted, pending, overdue };
  }, [assignments]);

  // Get status badge variant
  const getStatusBadgeVariant = (status: StatusFilter): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'graded': return 'success';
      case 'submitted': return 'info';
      case 'overdue': return 'error';
      default: return 'warning';
    }
  };

  // Get subject color
  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      'Mathematics': Colors.primary,
      'Science': Colors.success,
      'English': Colors.accent,
      'Physics': Colors.info,
      'Chemistry': Colors.warning,
      'Biology': Colors.success,
      'Computer Science': Colors.primary,
    };
    return colors[subject] || Colors.textSecondary;
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load assignments' : null}
      empty={!isLoading && assignments.length === 0}
      emptyBody="No assignments have been posted yet"
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header Card with Stats */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
              📚 All Assignments
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Track all assignments and submissions
            </T>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.success }}>
                  {stats.graded}
                </T>
                <T variant="caption" color="textSecondary">Graded</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.info }}>
                  {stats.submitted}
                </T>
                <T variant="caption" color="textSecondary">Submitted</T>
              </View>
              {stats.overdue > 0 && (
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.error }}>
                    {stats.overdue}
                  </T>
                  <T variant="caption" color="textSecondary">Overdue</T>
                </View>
              )}
            </Row>
          </CardContent>
        </Card>

        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'graded', label: 'Graded' },
                { value: 'overdue', label: 'Overdue' },
              ],
              onChange: (value) => {
                trackAction('filter_status', 'AssignmentsList', { status: value });
                setStatusFilter(value as StatusFilter);
              },
            },
            ...(subjects.length > 1 ? [{
              label: 'Subject',
              value: subjectFilter,
              options: [
                { value: 'all', label: 'All Subjects' },
                ...subjects.map(s => ({ value: s, label: s })),
              ],
              onChange: (value) => {
                trackAction('filter_subject', 'AssignmentsList', { subject: value });
                setSubjectFilter(value);
              },
            }] : []),
          ]}
          activeFilters={[
            statusFilter !== 'all' && {
              label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
              variant: 'info' as const
            },
            subjectFilter !== 'all' && {
              label: subjectFilter,
              variant: 'success' as const
            },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setStatusFilter('all');
            setSubjectFilter('all');
            trackAction('clear_filters', 'AssignmentsList');
          }}
        />

        {/* Assignments List */}
        <Col gap="sm">
          {filteredAssignments.map(assignment => {
            const assignmentStatus = getAssignmentStatus(assignment);
            const daysUntilDue = getDaysUntilDue(assignment.due_date);
            const subjectColor = getSubjectColor(assignment.subject);
            const isOverdue = assignmentStatus === 'overdue';

            return (
              <Card
                key={assignment.id}
                variant="elevated"
                style={isOverdue ? { borderLeftWidth: 4, borderLeftColor: Colors.error } : undefined}
              >
                <CardContent>
                  {/* Header Row */}
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <Badge
                      variant="default"
                      label={assignment.subject}
                      style={{ backgroundColor: subjectColor + '20' }}
                    />
                    <Badge
                      variant={getStatusBadgeVariant(assignmentStatus)}
                      label={assignmentStatus.toUpperCase()}
                    />
                  </Row>

                  {/* Title */}
                  <T variant="body" weight="semiBold" style={{ marginTop: Spacing.xs }}>
                    {assignment.title}
                  </T>

                  {/* Description */}
                  {assignment.description && (
                    <T variant="body" color="textSecondary" style={{ marginTop: Spacing.xs }} numberOfLines={2}>
                      {assignment.description}
                    </T>
                  )}

                  {/* Details Row */}
                  <Row spaceBetween style={{ marginTop: Spacing.sm }}>
                    <Col>
                      <T variant="caption" color="textSecondary">Due Date</T>
                      <T variant="body" weight="semiBold" color={isOverdue ? 'error' : 'textPrimary'}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </T>
                      <T variant="caption" color={isOverdue ? 'error' : 'textSecondary'}>
                        {daysUntilDue > 0
                          ? `${daysUntilDue} days remaining`
                          : daysUntilDue === 0
                          ? 'Due today'
                          : `${Math.abs(daysUntilDue)} days overdue`}
                      </T>
                    </Col>

                    <Col centerH>
                      <T variant="caption" color="textSecondary">Points</T>
                      <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                        {assignment.total_points}
                      </T>
                    </Col>

                    {assignmentStatus === 'graded' && assignment.score !== null && (
                      <Col centerH>
                        <T variant="caption" color="textSecondary">Score</T>
                        <T
                          variant="display"
                          weight="bold"
                          style={{ fontSize: 24 }}
                          color={assignment.score >= (assignment.total_points * 0.7) ? 'success' : 'warning'}
                        >
                          {assignment.score}
                        </T>
                        <T variant="caption" color="textSecondary">
                          {((assignment.score / assignment.total_points) * 100).toFixed(0)}%
                        </T>
                      </Col>
                    )}
                  </Row>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    onPress={() => {
                      trackAction('view_assignment', 'AssignmentsList', { assignmentId: assignment.id });
                      safeNavigate('AssignmentDetail', {
                        assignmentId: assignment.id,
                        studentId,
                      });
                    }}
                    style={{ marginTop: Spacing.sm }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Col>

        {/* Empty State for Filter */}
        {filteredAssignments.length === 0 && assignments.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary">
                  No {statusFilter !== 'all' && statusFilter} {subjectFilter !== 'all' && subjectFilter} assignments found
                </T>
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

export default AssignmentsListScreen;
