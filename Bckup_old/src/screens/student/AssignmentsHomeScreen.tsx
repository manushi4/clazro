import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'AssignmentsHomeScreen'>;

type AssignmentStatus = 'upcoming' | 'overdue' | 'completed';
type AssignmentType = 'homework' | 'project' | 'quiz' | 'other';
type AssignmentPriority = 'low' | 'medium' | 'high';

interface AssignmentItem {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  type: AssignmentType;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate: string;
  dueLabel: string;
  totalPoints?: number;
  obtainedPoints?: number;
}

const MOCK_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'a1',
    title: 'Algebra Worksheet 03',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    type: 'homework',
    status: 'upcoming',
    priority: 'high',
    dueDate: '2025-01-14T09:00:00Z',
    dueLabel: 'in 2 days',
    totalPoints: 20,
    obtainedPoints: 0,
  },
  {
    id: 'a2',
    title: 'Physics - Numericals Set 01',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    type: 'homework',
    status: 'overdue',
    priority: 'high',
    dueDate: '2025-01-10T09:00:00Z',
    dueLabel: '1 day overdue',
    totalPoints: 15,
    obtainedPoints: 0,
  },
  {
    id: 'a3',
    title: 'Chemistry: Acids & Bases Quiz',
    subjectName: 'Chemistry',
    subjectCode: 'CHEM',
    type: 'quiz',
    status: 'completed',
    priority: 'medium',
    dueDate: '2025-01-08T09:00:00Z',
    dueLabel: 'completed',
    totalPoints: 25,
    obtainedPoints: 21,
  },
  {
    id: 'a4',
    title: 'English - Essay Draft',
    subjectName: 'English',
    subjectCode: 'ENG',
    type: 'project',
    status: 'upcoming',
    priority: 'medium',
    dueDate: '2025-01-16T09:00:00Z',
    dueLabel: 'in 4 days',
    totalPoints: 30,
    obtainedPoints: 0,
  },
  {
    id: 'a5',
    title: 'Physics Lab Report',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    type: 'project',
    status: 'completed',
    priority: 'low',
    dueDate: '2025-01-05T09:00:00Z',
    dueLabel: 'submitted',
    totalPoints: 20,
    obtainedPoints: 18,
  },
  {
    id: 'a6',
    title: 'Geometry Problem Set',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    type: 'homework',
    status: 'upcoming',
    priority: 'low',
    dueDate: '2025-01-18T09:00:00Z',
    dueLabel: 'in 6 days',
    totalPoints: 15,
    obtainedPoints: 0,
  },
  {
    id: 'a7',
    title: 'Chemistry Lab Prep',
    subjectName: 'Chemistry',
    subjectCode: 'CHEM',
    type: 'other',
    status: 'overdue',
    priority: 'medium',
    dueDate: '2025-01-09T09:00:00Z',
    dueLabel: '2 days overdue',
    totalPoints: 10,
    obtainedPoints: 0,
  },
];

// TODO: Replace with Supabase-backed assignments fetching.
function useAssignmentsMock() {
  return { assignments: MOCK_ASSIGNMENTS };
}

const typeLabel = (type: AssignmentType) => {
  switch (type) {
    case 'homework':
      return 'Homework';
    case 'project':
      return 'Project';
    case 'quiz':
      return 'Quiz';
    default:
      return 'Other';
  }
};

const statusLabel = (status: AssignmentStatus) => {
  if (status === 'upcoming') return 'Pending';
  if (status === 'overdue') return 'Overdue';
  return 'Completed';
};

const priorityColor = (priority: AssignmentPriority) => {
  if (priority === 'high') return Colors.error;
  if (priority === 'medium') return Colors.warning;
  return Colors.primary;
};

type StatusFilter = 'all' | AssignmentStatus;
type SubjectFilter = 'all' | string;
type TypeFilter = 'all' | AssignmentType;

export default function AssignmentsHomeScreen({ navigation }: Props) {
  const { assignments } = useAssignmentsMock();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    trackScreenView('AssignmentsHomeScreen');
  }, []);

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => map.set(a.subjectCode, a.subjectName));
    return Array.from(map.entries());
  }, [assignments]);

  const summary = useMemo(() => {
    const upcomingCount = assignments.filter((a) => a.status === 'upcoming').length;
    const overdueCount = assignments.filter((a) => a.status === 'overdue').length;
    const completed = assignments.filter((a) => a.status === 'completed' && a.totalPoints && a.obtainedPoints);
    const avg =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, a) => sum + ((a.obtainedPoints || 0) / (a.totalPoints || 1)) * 100, 0) /
              completed.length
          )
        : null;
    return { upcomingCount, overdueCount, avg };
  }, [assignments]);

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (subjectFilter !== 'all' && a.subjectCode !== subjectFilter) return false;
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        return true;
      }),
    [assignments, statusFilter, subjectFilter, typeFilter]
  );

  const handleFilterChange = (payload: { status?: StatusFilter; subject?: SubjectFilter; type?: TypeFilter }) => {
    if (payload.status !== undefined) setStatusFilter(payload.status);
    if (payload.subject !== undefined) setSubjectFilter(payload.subject);
    if (payload.type !== undefined) setTypeFilter(payload.type);
    trackAction('assignments_filter_change', 'AssignmentsHomeScreen', {
      statusFilter: payload.status ?? statusFilter,
      subjectFilter: payload.subject ?? subjectFilter,
      typeFilter: payload.type ?? typeFilter,
    });
  };

  const handleAssignmentPress = useCallback(
    (assignment: AssignmentItem) => {
      trackAction('open_assignment_detail', 'AssignmentsHomeScreen', {
        assignmentId: assignment.id,
        status: assignment.status,
      });
      navigation.navigate('AssignmentDetailScreen', { assignmentId: assignment.id } as any);
    },
    [navigation]
  );

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, opts);
  };

  return (
    <BaseScreen backgroundColor={Colors.background} contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <T variant="title">Assignments</T>
        <T variant="caption" color="textSecondary">
          Keep track of your homework, projects and quizzes.
        </T>
      </View>

      <Card style={styles.summaryCard}>
        <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
          This week
        </T>
        <T variant="body" color="textSecondary">
          • {summary.upcomingCount + summary.overdueCount} due (upcoming + overdue)
        </T>
        <T variant="body" color="textSecondary">
          • {summary.overdueCount} overdue
        </T>
        <T variant="body" color="textSecondary">
          • Avg grade: {summary.avg !== null ? `${summary.avg}%` : '—'}
        </T>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <Row style={styles.chipsRow}>
          {(['all', 'upcoming', 'overdue', 'completed'] as StatusFilter[]).map((status) => (
            <Chip
              key={status}
              label={status === 'all' ? 'All' : statusLabel(status as AssignmentStatus)}
              selected={statusFilter === status}
              variant="filter"
              onPress={() => handleFilterChange({ status })}
            />
          ))}
        </Row>
      </ScrollView>

      <Card style={styles.filtersCard}>
        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
          Subject:
        </T>
        <Row style={styles.chipsRow}>
          <Chip
            label="All"
            selected={subjectFilter === 'all'}
            variant="filter"
            onPress={() => handleFilterChange({ subject: 'all' })}
          />
          {subjects.map(([code, name]) => (
            <Chip
              key={code}
              label={name}
              selected={subjectFilter === code}
              variant="filter"
              onPress={() => handleFilterChange({ subject: code })}
            />
          ))}
        </Row>

        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs, marginTop: Spacing.sm }}>
          Type:
        </T>
        <Row style={styles.chipsRow}>
          {(['all', 'homework', 'project', 'quiz', 'other'] as (AssignmentType | 'all')[]).map((type) => (
            <Chip
              key={type}
              label={type === 'all' ? 'All' : typeLabel(type as AssignmentType)}
              selected={typeFilter === type}
              variant="filter"
              onPress={() => handleFilterChange({ type })}
            />
          ))}
        </Row>
      </Card>

      <View style={styles.assignmentList}>
        {filteredAssignments.map((assignment) => (
          <TouchableOpacity
            key={assignment.id}
            onPress={() => handleAssignmentPress(assignment)}
            style={styles.assignmentTouchable}
            accessibilityRole="button"
            accessibilityLabel={`Open ${assignment.title}`}
          >
            <Card style={styles.assignmentCard}>
              <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
                {assignment.title}
              </T>
              <T variant="caption" color="textSecondary">
                {assignment.subjectName} • {typeLabel(assignment.type)}
              </T>
              <T variant="caption" color="textSecondary">
                Due: {formatDate(assignment.dueDate)} • {assignment.dueLabel}
              </T>
              <Row style={styles.assignmentMetaRow}>
                <Chip label={`Status: ${statusLabel(assignment.status)}`} variant="assist" />
                <Chip
                  label={`Priority: ${assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}`}
                  variant="assist"
                  style={{ backgroundColor: priorityColor(assignment.priority) + '20' }}
                />
              </Row>
            </Card>
          </TouchableOpacity>
        ))}

        {filteredAssignments.length === 0 && (
          <Card style={styles.emptyStateCard}>
            <T variant="title" style={{ marginBottom: Spacing.xs }}>
              ✅ No assignments here.
            </T>
            <T variant="body" color="textSecondary">
              Try changing filters or check again later.
            </T>
          </Card>
        )}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  headerContainer: {
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.resting,
  },
  filtersRow: {
    marginBottom: Spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filtersCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...Shadows.resting,
  },
  assignmentList: {
    marginTop: Spacing.sm,
  },
  assignmentTouchable: {
    marginBottom: Spacing.sm,
  },
  assignmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.resting,
  },
  assignmentMetaRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyStateCard: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.resting,
  },
});
