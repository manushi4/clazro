/**
 * OrganizationManagementScreen v2.0 - PRODUCTION READY
 * Phase 2b: Batches Management with Real Data
 *
 * Features:
 * ✅ Real Supabase data (batches table)
 * ✅ RBAC gate at screen entry (manage_branches permission)
 * ✅ Search and filter (academic year, grade level, status)
 * ✅ Create batch with audit logging
 * ✅ Edit batch with audit logging
 * ✅ Toggle batch status (activate/deactivate) with audit
 * ✅ Stats cards (total, active, total students)
 * ✅ BaseScreen wrapper with all states
 * ✅ Safe navigation with analytics tracking
 * ✅ Performance optimized (useMemo, useCallback, React.memo)
 * ✅ Accessibility labels
 * ✅ Pull-to-refresh
 * ✅ TypeScript strict mode compliance
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Alert as RNAlert, StyleSheet, FlatList, TextInput, RefreshControl, Modal, ScrollView } from 'react-native';
import { IconButton, Menu, Searchbar, FAB } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, CardContent, CardHeader } from '../../ui/surfaces/Card';
import { Row, Col, T, Spacer, Button as UIButton } from '../../ui';
import { Badge, Chip } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { can, AdminRole } from '../../utils/adminPermissions';
import { logAudit } from '../../utils/auditLogger';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Batch {
  id: string;
  name: string;
  grade_level: string;
  section: string | null;
  academic_year: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number | null;
  current_enrollment: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FetchBatchesParams {
  academicYear?: string;
  gradeLevel?: string;
  isActive?: boolean;
  search?: string;
}

interface BatchFormData {
  name: string;
  grade_level: string;
  section: string;
  academic_year: string;
  max_students: string;
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

const fetchBatches = async (params: FetchBatchesParams): Promise<Batch[]> => {
  console.log('📥 [OrganizationManagement] Fetching batches:', params);

  let query = supabase
    .from('batches')
    .select('*')
    .order('grade_level', { ascending: true })
    .order('section', { ascending: true });

  if (params.academicYear && params.academicYear !== 'all') {
    query = query.eq('academic_year', params.academicYear);
  }

  if (params.gradeLevel && params.gradeLevel !== 'all') {
    query = query.eq('grade_level', params.gradeLevel);
  }

  if (params.isActive !== undefined) {
    query = query.eq('is_active', params.isActive);
  }

  if (params.search && params.search.trim() !== '') {
    const searchTerm = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${searchTerm},section.ilike.${searchTerm}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [OrganizationManagement] Error fetching batches:', error);
    throw error;
  }

  console.log(`✅ [OrganizationManagement] Fetched ${data?.length || 0} batches`);
  return data || [];
};

// ============================================
// MAIN COMPONENT
// ============================================

const OrganizationManagementScreenV2: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentRole = (user as any)?.role as AdminRole;
  const navigation = useNavigation();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState<'all' | string>('all');
  const [gradeLevelFilter, setGradeLevelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [gradeMenuVisible, setGradeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    grade_level: '',
    section: '',
    academic_year: '',
    max_students: '',
  });

  // ============================================
  // ANALYTICS & RBAC GATE
  // ============================================

  useEffect(() => {
    trackScreenView('OrganizationManagementV2');

    // RBAC gate: Check manage_branches permission
    if (!can(currentRole, 'manage_branches')) {
      console.warn('⛔ [OrganizationManagement] Access denied:', currentRole);
      trackAction('access_denied', 'OrganizationManagementV2', {
        role: currentRole,
        requiredPermission: 'manage_branches',
      });

      setTimeout(() => {
        navigation.navigate('AccessDenied' as never, {
          requiredPermission: 'manage_branches',
          message: `You need 'manage_branches' permission to access Organization Management.`,
        });
      }, 100);
    }
  }, [currentRole, navigation]);

  // ============================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ============================================

  const {
    data: batches,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Batch[]>({
    queryKey: ['batches', academicYearFilter, gradeLevelFilter, statusFilter, searchQuery],
    queryFn: () =>
      fetchBatches({
        academicYear: academicYearFilter,
        gradeLevel: gradeLevelFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery,
      }),
    staleTime: 30000, // 30 seconds
    enabled: can(currentRole, 'manage_branches'),
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createBatchMutation = useMutation({
    mutationFn: async (batchData: BatchFormData) => {
      console.log('➕ [OrganizationManagement] Creating batch:', batchData);

      const { error } = await supabase.from('batches').insert({
        name: batchData.name,
        grade_level: batchData.grade_level,
        section: batchData.section || null,
        academic_year: batchData.academic_year || null,
        max_students: batchData.max_students ? parseInt(batchData.max_students) : null,
        current_enrollment: 0,
        is_active: true,
      });

      if (error) throw error;

      await logAudit({
        action: 'create_branch',
        targetType: 'branch',
        metadata: {
          batch_name: batchData.name,
          grade_level: batchData.grade_level,
          section: batchData.section,
        },
      });

      console.log('✅ [OrganizationManagement] Batch created');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setCreateModalVisible(false);
      resetForm();
      RNAlert.alert('Success', 'Batch created successfully');
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagement] Create error:', error);
      RNAlert.alert('Error', error.message || 'Failed to create batch');
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ batchId, updates }: { batchId: string; updates: Partial<Batch> }) => {
      console.log('✏️ [OrganizationManagement] Updating batch:', batchId);

      const { error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;

      await logAudit({
        action: 'update_branch',
        targetId: batchId,
        targetType: 'branch',
        changes: updates,
      });

      console.log('✅ [OrganizationManagement] Batch updated');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setEditingBatch(null);
      resetForm();
      RNAlert.alert('Success', 'Batch updated successfully');
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagement] Update error:', error);
      RNAlert.alert('Error', error.message || 'Failed to update batch');
    },
  });

  const toggleBatchStatusMutation = useMutation({
    mutationFn: async ({ batchId, currentStatus }: { batchId: string; currentStatus: boolean }) => {
      const newStatus = !currentStatus;
      console.log(`🔄 [OrganizationManagement] Toggling batch ${batchId} to ${newStatus}`);

      const { error } = await supabase
        .from('batches')
        .update({ is_active: newStatus })
        .eq('id', batchId);

      if (error) throw error;

      await logAudit({
        action: 'update_branch',
        targetId: batchId,
        targetType: 'branch',
        changes: {
          is_active: { from: currentStatus, to: newStatus },
        },
        metadata: {
          action_type: newStatus ? 'activate' : 'deactivate',
        },
      });

      console.log('✅ [OrganizationManagement] Batch status toggled');
      return { success: true, newStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      const action = result.newStatus ? 'activated' : 'deactivated';
      RNAlert.alert('Success', `Batch ${action} successfully`);
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagement] Toggle error:', error);
      RNAlert.alert('Error', error.message || 'Failed to update batch status');
    },
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const stats = useMemo(() => {
    if (!batches) return { total: 0, active: 0, totalStudents: 0 };

    return {
      total: batches.length,
      active: batches.filter((b) => b.is_active).length,
      totalStudents: batches.reduce((sum, b) => sum + (b.current_enrollment || 0), 0),
    };
  }, [batches]);

  const hasBatches = useMemo(() => batches && batches.length > 0, [batches]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleToggleStatus = useCallback(
    (batch: Batch) => {
      const action = batch.is_active ? 'Deactivate' : 'Activate';
      trackAction(`${action.toLowerCase()}_batch_attempt`, 'OrganizationManagementV2', { batchId: batch.id });

      RNAlert.alert(
        `${action} Batch`,
        `Are you sure you want to ${action.toLowerCase()} "${batch.name}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: action,
            style: batch.is_active ? 'destructive' : 'default',
            onPress: () => {
              trackAction(`${action.toLowerCase()}_batch_confirmed`, 'OrganizationManagementV2', { batchId: batch.id });
              toggleBatchStatusMutation.mutate({ batchId: batch.id, currentStatus: batch.is_active });
            },
          },
        ]
      );
    },
    [toggleBatchStatusMutation]
  );

  const handleEditBatch = useCallback((batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      grade_level: batch.grade_level,
      section: batch.section || '',
      academic_year: batch.academic_year || '',
      max_students: batch.max_students?.toString() || '',
    });
    trackAction('edit_batch', 'OrganizationManagementV2', { batchId: batch.id });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingBatch) return;

    updateBatchMutation.mutate({
      batchId: editingBatch.id,
      updates: {
        name: formData.name,
        grade_level: formData.grade_level,
        section: formData.section || null,
        academic_year: formData.academic_year || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
      },
    });
  }, [editingBatch, formData, updateBatchMutation]);

  const handleCreateBatch = useCallback(() => {
    if (!formData.name || !formData.grade_level) {
      RNAlert.alert('Validation Error', 'Name and Grade Level are required');
      return;
    }

    createBatchMutation.mutate(formData);
  }, [formData, createBatchMutation]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      grade_level: '',
      section: '',
      academic_year: '',
      max_students: '',
    });
  }, []);

  const handleRefresh = useCallback(() => {
    trackAction('refresh_batches', 'OrganizationManagementV2');
    refetch();
  }, [refetch]);

  // ============================================
  // FORMAT HELPERS
  // ============================================

  const formatDate = useCallback((dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // ============================================
  // UI COMPONENTS
  // ============================================

  const StatsCards = useMemo(
    () => (
      <Row gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        <StatCard label="Total Batches" value={stats.total.toString()} color={Colors.primary} />
        <StatCard label="Active" value={stats.active.toString()} color={Colors.success} />
        <StatCard label="Students" value={stats.totalStudents.toString()} color={Colors.warning} />
      </Row>
    ),
    [stats]
  );

  const FiltersSection = useMemo(
    () => (
      <Col gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        <Searchbar
          placeholder="Search batches"
          onChangeText={setSearchQuery}
          value={searchQuery}
          accessibilityLabel="Search batches"
          style={styles.searchbar}
        />

        <Row gap={Spacing.sm}>
          <Menu
            visible={yearMenuVisible}
            onDismiss={() => setYearMenuVisible(false)}
            anchor={
              <Chip onPress={() => setYearMenuVisible(true)} accessibilityLabel="Filter by academic year">
                Year: {academicYearFilter === 'all' ? 'All' : academicYearFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => { setAcademicYearFilter('all'); setYearMenuVisible(false); }} title="All Years" />
            <Menu.Item onPress={() => { setAcademicYearFilter('2024-2025'); setYearMenuVisible(false); }} title="2024-2025" />
            <Menu.Item onPress={() => { setAcademicYearFilter('2023-2024'); setYearMenuVisible(false); }} title="2023-2024" />
          </Menu>

          <Menu
            visible={gradeMenuVisible}
            onDismiss={() => setGradeMenuVisible(false)}
            anchor={
              <Chip onPress={() => setGradeMenuVisible(true)} accessibilityLabel="Filter by grade">
                Grade: {gradeLevelFilter === 'all' ? 'All' : gradeLevelFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => { setGradeLevelFilter('all'); setGradeMenuVisible(false); }} title="All Grades" />
            {['9', '10', '11', '12'].map((grade) => (
              <Menu.Item key={grade} onPress={() => { setGradeLevelFilter(grade); setGradeMenuVisible(false); }} title={`Grade ${grade}`} />
            ))}
          </Menu>

          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Chip onPress={() => setStatusMenuVisible(true)} accessibilityLabel="Filter by status">
                Status: {statusFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => { setStatusFilter('all'); setStatusMenuVisible(false); }} title="All" />
            <Menu.Item onPress={() => { setStatusFilter('active'); setStatusMenuVisible(false); }} title="Active" />
            <Menu.Item onPress={() => { setStatusFilter('inactive'); setStatusMenuVisible(false); }} title="Inactive" />
          </Menu>
        </Row>
      </Col>
    ),
    [searchQuery, academicYearFilter, gradeLevelFilter, statusFilter, yearMenuVisible, gradeMenuVisible, statusMenuVisible]
  );

  const BatchCard = React.memo<{ batch: Batch }>(({ batch }) => (
    <Card style={styles.batchCard}>
      <CardHeader
        title={batch.name}
        subtitle={`${batch.grade_level}${batch.section ? ` - ${batch.section}` : ''}`}
        right={
          <Badge
            style={{
              backgroundColor: batch.is_active ? Colors.success : Colors.error,
            }}
            accessibilityLabel={batch.is_active ? 'Active' : 'Inactive'}
          >
            {batch.is_active ? 'Active' : 'Inactive'}
          </Badge>
        }
      />
      <CardContent>
        <Col gap={Spacing.sm}>
          <T variant="body2">Academic Year: {batch.academic_year || 'N/A'}</T>
          <T variant="body2">
            Enrollment: {batch.current_enrollment}{batch.max_students ? ` / ${batch.max_students}` : ''}
          </T>
          <T variant="caption" color={Colors.textSecondary}>
            Created: {formatDate(batch.created_at)}
          </T>

          <Row gap={Spacing.sm} style={{ marginTop: Spacing.sm }}>
            <UIButton
              variant="outlined"
              onPress={() => handleEditBatch(batch)}
              accessibilityLabel={`Edit ${batch.name}`}
              style={{ flex: 1 }}
            >
              Edit
            </UIButton>
            <UIButton
              variant={batch.is_active ? 'outlined' : 'contained'}
              onPress={() => handleToggleStatus(batch)}
              accessibilityLabel={`${batch.is_active ? 'Deactivate' : 'Activate'} ${batch.name}`}
              style={{ flex: 1 }}
            >
              {batch.is_active ? 'Deactivate' : 'Activate'}
            </UIButton>
          </Row>
        </Col>
      </CardContent>
    </Card>
  ));

  const BatchesList = useMemo(
    () => (
      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BatchCard batch={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} accessibilityLabel="Pull to refresh" />
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <T variant="body1" color={Colors.textSecondary} align="center">
                No batches found
              </T>
            </View>
          )
        }
      />
    ),
    [batches, isLoading, isRefetching, handleRefresh]
  );

  // ============================================
  // RENDER
  // ============================================

  if (!can(currentRole, 'manage_branches')) {
    return null;
  }

  return (
    <>
      <BaseScreen
        scrollable={false}
        loading={isLoading}
        error={error ? (error as Error).message : undefined}
        empty={!hasBatches && !isLoading}
        emptyMessage="No batches found"
      >
        <Col gap={Spacing.lg} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
            <T variant="h5">Batches Management</T>
            <T variant="body2" color={Colors.textSecondary}>
              Manage class batches and groups
            </T>
          </View>

          {StatsCards}
          {FiltersSection}

          <View style={{ flex: 1 }}>{BatchesList}</View>
        </Col>
      </BaseScreen>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          setCreateModalVisible(true);
          resetForm();
          trackAction('create_batch_open', 'OrganizationManagementV2');
        }}
        accessibilityLabel="Create new batch"
      />

      <Modal
        visible={createModalVisible || editingBatch !== null}
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setEditingBatch(null);
        }}
      >
        <ScrollView style={styles.modalContainer}>
          <T variant="h5">{editingBatch ? 'Edit Batch' : 'Create Batch'}</T>
          <Spacer size={Spacing.lg} />

          <TextInput
            placeholder="Batch Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Grade Level * (e.g., 10, 11, 12)"
            value={formData.grade_level}
            onChangeText={(text) => setFormData({ ...formData, grade_level: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Section (e.g., A, B, Science)"
            value={formData.section}
            onChangeText={(text) => setFormData({ ...formData, section: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Academic Year (e.g., 2024-2025)"
            value={formData.academic_year}
            onChangeText={(text) => setFormData({ ...formData, academic_year: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Max Students"
            value={formData.max_students}
            onChangeText={(text) => setFormData({ ...formData, max_students: text })}
            keyboardType="numeric"
            style={styles.input}
          />

          <Row gap={Spacing.md}>
            <UIButton
              variant="outlined"
              onPress={() => {
                setCreateModalVisible(false);
                setEditingBatch(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </UIButton>
            <UIButton
              variant="contained"
              onPress={editingBatch ? handleSaveEdit : handleCreateBatch}
              style={{ flex: 1 }}
            >
              {editingBatch ? 'Save' : 'Create'}
            </UIButton>
          </Row>
        </ScrollView>
      </Modal>
    </>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const StatCard: React.FC<{
  label: string;
  value: string;
  color: string;
}> = React.memo(({ label, value, color }) => (
  <Card style={[styles.statCard, { flex: 1 }]}>
    <CardContent>
      <Col gap={Spacing.xs} align="center">
        <T variant="h4" color={color} weight="bold">
          {value}
        </T>
        <T variant="caption" color={Colors.textSecondary}>
          {label}
        </T>
      </Col>
    </CardContent>
  </Card>
));

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  searchbar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCard: {
    elevation: 2,
  },
  batchCard: {
    marginBottom: Spacing.md,
    elevation: 1,
  },
  listContainer: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
});

export default OrganizationManagementScreenV2;
