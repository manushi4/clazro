import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Text, Button, Chip, Divider, Menu, Snackbar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssignmentDetailQuery } from '../../hooks/queries/teacher';
import { useCloseAssignment, usePublishAssignment } from '../../hooks/mutations/teacher';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'AssignmentDetailTeacher'>;

type Submission = {
  id: string;
  student_user_id: string;
  status: string;
  submitted_at: string | null;
  is_late: boolean;
  score: number | null;
  percentage: number | null;
  grade_letter: string | null;
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: '#9E9E9E', icon: 'clock-outline', label: 'Pending' },
  submitted: { color: '#2196F3', icon: 'file-check-outline', label: 'Submitted' },
  late: { color: '#FF9800', icon: 'clock-alert-outline', label: 'Late' },
  graded: { color: '#4CAF50', icon: 'check-circle-outline', label: 'Graded' },
  returned: { color: '#9C27B0', icon: 'undo', label: 'Returned' },
  resubmit: { color: '#F44336', icon: 'refresh', label: 'Resubmit' },
};

export const AssignmentDetailTeacherScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const customerId = useCustomerId();
  const assignmentId = route.params?.assignmentId || route.params?.id;

  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  // Queries
  const { data: assignment, isLoading, refetch } = useAssignmentDetailQuery(assignmentId);

  const { data: submissions, isLoading: loadingSubmissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ['assignment-submissions', customerId, assignmentId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Submission[];
    },
    enabled: !!customerId && !!assignmentId,
  });

  // Mutations
  const publishAssignment = usePublishAssignment();
  const closeAssignment = useCloseAssignment();

  const filteredSubmissions = submissions?.filter(sub => {
    if (filter === 'pending') return sub.status === 'submitted' || sub.status === 'late';
    if (filter === 'graded') return sub.status === 'graded';
    return true;
  }) || [];

  const pendingCount = submissions?.filter(s => s.status === 'submitted' || s.status === 'late').length || 0;
  const gradedCount = submissions?.filter(s => s.status === 'graded').length || 0;

  const handleRefresh = () => {
    refetch();
    refetchSubmissions();
  };

  const handlePublish = async () => {
    setMenuVisible(false);
    try {
      await publishAssignment.mutateAsync(assignmentId);
      setSnackbarMessage('Assignment published!');
      setSnackbarVisible(true);
    } catch {
      setSnackbarMessage('Failed to publish');
      setSnackbarVisible(true);
    }
  };

  const handleClose = async () => {
    setMenuVisible(false);
    try {
      await closeAssignment.mutateAsync(assignmentId);
      setSnackbarMessage('Assignment closed');
      setSnackbarVisible(true);
    } catch {
      setSnackbarMessage('Failed to close');
      setSnackbarVisible(true);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'draft') return colors.onSurfaceVariant;
    if (status === 'published') return colors.success;
    if (status === 'closed') return colors.error;
    return colors.onSurfaceVariant;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={{ color: colors.error, marginTop: 12 }}>Assignment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderSubmission = ({ item }: { item: Submission }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GradeSubmission', { submissionId: item.id, assignmentId })}
        style={[styles.submissionItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
        <View style={styles.submissionContent}>
          <Text style={[styles.studentName, { color: colors.onSurface }]}>
            Student {item.student_user_id.split('-')[1] || '1'}
          </Text>
          <View style={styles.submissionMeta}>
            <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.submissionStatus, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            {item.submitted_at && (
              <Text style={[styles.submissionDate, { color: colors.onSurfaceVariant }]}>
                {formatDate(item.submitted_at)}
              </Text>
            )}
          </View>
        </View>
        {item.score !== null && (
          <View style={[styles.scoreBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>
              {item.score}/{assignment.max_score}
            </Text>
          </View>
        )}
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {assignment.title_en}
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
              <Icon name="dots-vertical" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          }
        >
          {assignment.status === 'draft' && (
            <Menu.Item onPress={handlePublish} title="Publish" leadingIcon="publish" />
          )}
          {assignment.status === 'published' && (
            <Menu.Item onPress={handleClose} title="Close" leadingIcon="close-circle-outline" />
          )}
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('AssignmentEdit', { assignmentId }); }} title="Edit" leadingIcon="pencil" />
        </Menu>
      </View>

      <FlatList
        data={filteredSubmissions}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Assignment Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
              <View style={styles.infoRow}>
                <Chip mode="flat" style={{ backgroundColor: getStatusColor(assignment.status) + '20' }}>
                  <Text style={{ color: getStatusColor(assignment.status), textTransform: 'capitalize' }}>
                    {assignment.status}
                  </Text>
                </Chip>
                <Chip icon="clipboard-text-outline" mode="outlined">
                  {assignment.assignment_type}
                </Chip>
              </View>

              {assignment.description_en && (
                <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
                  {assignment.description_en}
                </Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Icon name="trophy-outline" size={18} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.onSurface }]}>{assignment.max_score}</Text>
                  <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Max Score</Text>
                </View>
                <View style={styles.stat}>
                  <Icon name="calendar" size={18} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.onSurface }]}>
                    {assignment.due_date ? formatDate(assignment.due_date) : 'No deadline'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Due Date</Text>
                </View>
                <View style={styles.stat}>
                  <Icon name="account-group" size={18} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.onSurface }]}>{submissions?.length || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Submissions</Text>
                </View>
              </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setFilter('all')}
                style={[styles.filterChip, filter === 'all' && { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: filter === 'all' ? colors.onPrimary : colors.onSurfaceVariant }}>
                  All ({submissions?.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilter('pending')}
                style={[styles.filterChip, filter === 'pending' && { backgroundColor: colors.warning }]}
              >
                <Text style={{ color: filter === 'pending' ? '#FFF' : colors.onSurfaceVariant }}>
                  Pending ({pendingCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilter('graded')}
                style={[styles.filterChip, filter === 'graded' && { backgroundColor: colors.success }]}
              >
                <Text style={{ color: filter === 'graded' ? '#FFF' : colors.onSurfaceVariant }}>
                  Graded ({gradedCount})
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Submissions
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox-outline" size={48} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>
              {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
            </Text>
          </View>
        }
      />

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', marginHorizontal: 8 },
  menuBtn: { padding: 8 },
  listContent: { padding: 16 },
  infoCard: { padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  description: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '600' },
  statLabel: { fontSize: 11 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  submissionContent: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '500' },
  submissionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  submissionStatus: { fontSize: 12, fontWeight: '500' },
  submissionDate: { fontSize: 12 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
});

export default AssignmentDetailTeacherScreen;
