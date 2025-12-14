import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { T, Card, Badge, Button, Chip, Row } from '../../ui';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { Colors, BorderRadius, Spacing } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'AssignmentsList'>;

type Assignment = {
  id: string;
  title: string;
  subject?: string | null;
  due_date?: string | null;
  total_points?: number | null;
  status?: string | null;
  priority?: string | null;
};

type Submission = {
  assignment_id: string;
  status?: string | null;
};

export default function AssignmentsList({ navigation }: Props) {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [sampleAssignments, setSampleAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    trackScreenView('AssignmentsList');
  }, []);

  const {
    data: studentInfo,
    isLoading: studentLoading,
    isError: studentError,
  } = useQuery({
    queryKey: ['student-batch', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('students').select('batch_id').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const {
    data: assignmentData,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch,
  } = useQuery<{
    assignments: Assignment[];
    submissions: Submission[];
  }>({
    queryKey: ['assignments-list', studentInfo?.batch_id, user?.id],
    enabled: !!studentInfo?.batch_id && !!user?.id,
    queryFn: async () => {
      const assignments: Assignment[] = [];
      const submissions: Submission[] = [];

      if (!studentInfo?.batch_id) return { assignments, submissions };

      const { data: assignmentRows, error: assignmentError } = await supabase
        .from('assignments')
        .select('id,title,subject,due_date,total_points,status,priority,class_id')
        .eq('class_id', studentInfo.batch_id)
        .order('due_date', { ascending: true });

      if (!assignmentError && assignmentRows) {
        assignmentRows.forEach((row: any) => {
          assignments.push({
            id: row.id,
            title: row.title || 'Untitled Assignment',
            subject: row.subject,
            due_date: row.due_date,
            total_points: row.total_points,
            status: row.status,
            priority: row.priority,
          });
        });
      }

      try {
        const { data: submissionRows } = await supabase
          .from('submissions')
          .select('assignment_id,status')
          .eq('student_id', user?.id || '');
        if (submissionRows) {
          submissionRows.forEach((row: any) => {
            submissions.push({
              assignment_id: row.assignment_id,
              status: row.status,
            });
          });
        }
      } catch (err) {
        // submissions table may not exist; ignore quietly
        console.log('Submissions lookup skipped:', err);
      }

      return { assignments, submissions };
    },
  });

  useEffect(() => {
    console.log('[AssignmentsList] batch_id', studentInfo?.batch_id);
  }, [studentInfo?.batch_id]);

  useEffect(() => {
    if (assignmentData?.assignments) {
      console.log('[AssignmentsList] assignments fetched', assignmentData.assignments.length);
      console.log('[AssignmentsList] assignments sample', assignmentData.assignments.slice(0, 3));
    }
    if (assignmentData?.submissions) {
      console.log('[AssignmentsList] submissions fetched', assignmentData.submissions.length);
    }
  }, [assignmentData]);

  const isLoading = studentLoading || assignmentsLoading;
  const hasError = studentError || assignmentsError;

  const baseAssignments = useMemo(() => {
    if (assignmentData?.assignments && assignmentData.assignments.length > 0) {
      return assignmentData.assignments;
    }
    return sampleAssignments;
  }, [assignmentData?.assignments, sampleAssignments]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    baseAssignments.forEach((a) => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set);
  }, [baseAssignments]);

  const assignments = useMemo(() => {
    const submissionMap = new Map<string, string>();
    assignmentData?.submissions.forEach((s) => {
      submissionMap.set(s.assignment_id, s.status || 'submitted');
    });

    return baseAssignments.map((a) => {
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const now = new Date();
      const submittedStatus = submissionMap.get(a.id);
      let computedStatus: 'Pending' | 'Submitted' | 'Graded' | 'Ended' = 'Pending';

      if (submittedStatus) {
        computedStatus = submittedStatus === 'graded' ? 'Graded' : 'Submitted';
      } else if (dueDate && dueDate < now) {
        computedStatus = 'Ended';
      } else if (a.status && a.status.toLowerCase() !== 'published') {
        computedStatus = 'Ended';
      }

      return {
        ...a,
        computedStatus,
      };
    });
  }, [assignmentData, baseAssignments]);

  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const statusLower = (a.priority || '').toLowerCase();
      const matchesFilter = (() => {
        switch (selectedFilter) {
          case 'Pending':
            return a.computedStatus === 'Pending' && (!dueDate || dueDate >= now);
          case 'Completed':
            return a.computedStatus === 'Submitted' || a.computedStatus === 'Graded' || a.computedStatus === 'Ended';
          case 'High Priority':
            return statusLower === 'high';
          default:
            // Subject filter
            if (subjects.includes(selectedFilter)) {
              return (a.subject || '') === selectedFilter;
            }
            return true;
        }
      })();
      return matchesFilter;
    });
  }, [assignments, selectedFilter, subjects]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    trackAction('assignment_filter_change', 'AssignmentsList', { filter });
  };

  const handleLoadSample = () => {
    const now = new Date();
    const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
    const demo: Assignment[] = [
      {
        id: 'demo-1',
        title: 'Physics - Kinematics Worksheet',
        subject: 'Physics',
        due_date: addDays(2),
        total_points: 20,
        status: 'published',
        priority: 'high',
      },
      {
        id: 'demo-2',
        title: 'Math - Quadratic Equations',
        subject: 'Mathematics',
        due_date: addDays(5),
        total_points: 25,
        status: 'published',
        priority: 'medium',
      },
      {
        id: 'demo-3',
        title: 'Chemistry - Balancing Equations',
        subject: 'Chemistry',
        due_date: addDays(7),
        total_points: 15,
        status: 'published',
        priority: 'low',
      },
    ];
    setSampleAssignments(demo);
    setSelectedFilter('All');
    trackAction('load_sample_assignments', 'AssignmentsList');
  };

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return date.toLocaleString([], opts);
  };

  const priorityBadgeVariant = (priority?: string | null) => {
    const value = (priority || '').toLowerCase();
    if (value === 'high') return 'error';
    if (value === 'medium') return 'warning';
    return 'info';
  };

  const renderAssignmentCard = (assignment: any) => {
    return (
      <TouchableOpacity
        key={assignment.id}
        onPress={() => {
          trackAction('open_assignment', 'AssignmentsList', { assignmentId: assignment.id });
          safeNavigate('AssignmentDetailScreen', { assignmentId: assignment.id });
        }}
        style={styles.cardTouchable}
        accessibilityRole="button"
        accessibilityLabel={`Open assignment ${assignment.title}`}
      >
        <Card style={styles.card}>
          <Row style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <T variant="subtitle" weight="bold" style={styles.cardTitle}>
                {assignment.title}
              </T>
              <T variant="caption" color="textSecondary">
                {assignment.subject || 'General'}
              </T>
            </View>
            <Badge label={assignment.priority || 'Normal'} variant={priorityBadgeVariant(assignment.priority) as any} />
          </Row>
          <View style={styles.metaRow}>
            <T variant="body" color="textSecondary">
              {formatDueDate(assignment.due_date)}
            </T>
            <T variant="body" color="textSecondary">
              {assignment.total_points ? `${assignment.total_points} pts` : 'Points TBD'}
            </T>
          </View>
          <View style={styles.statusRow}>
            <Chip
              label={assignment.computedStatus}
              selected={assignment.computedStatus === 'Pending'}
              variant="filter"
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const filterChips = ['All', 'Pending', 'Completed', 'High Priority', ...subjects];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor as string} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="headline" style={styles.topTitle}>
          Assignments
        </T>
        <TouchableOpacity
          onPress={() => Alert.alert('Filters', 'More filters coming soon')}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <T style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.filterRow}>
          {filterChips.map((chip) => (
            <View key={chip} style={styles.chipItem}>
              <Chip
                label={chip}
                selected={selectedFilter === chip}
                variant="filter"
                onPress={() => handleFilterChange(chip)}
              />
            </View>
          ))}
        </View>

        {filteredAssignments.map(renderAssignmentCard)}

        {!isLoading && filteredAssignments.length === 0 && (
          <Card style={styles.emptyCard}>
            <T variant="title" style={{ marginBottom: Spacing.xs }}>
              🎯 No assignments
            </T>
            <T variant="body" color="textSecondary">
              You’re all caught up for this filter.
            </T>
            <Button variant="secondary" onPress={handleLoadSample} style={{ marginTop: Spacing.sm }}>
              Load sample assignments
            </Button>
          </Card>
        )}

        {hasError && (
          <T variant="body" color="error" style={styles.helperText}>
            Unable to load assignments. Pull to retry.
          </T>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  topTitle: {
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  chipItem: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTouchable: {
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  statusRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
  },
  emptyCard: {
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  helperText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
