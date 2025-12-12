/**
 * OrganizationManagementScreen v3.0 - PRODUCTION READY WITH MODERN UI
 * Phase 2b: Batches Management with Enhanced UX
 *
 * Features:
 * ✅ Real Supabase data (batches table)
 * ✅ RBAC gate at screen entry (manage_branches permission)
 * ✅ Search with 300ms debounce
 * ✅ Filter (academic year, grade level, status) with active state indicators
 * ✅ Clear filters button
 * ✅ Create batch with audit logging
 * ✅ Edit batch with audit logging
 * ✅ Toggle batch status with audit logging
 * ✅ Enhanced stats cards with Material icons
 * ✅ Grade level visual badges with colors
 * ✅ Enrollment capacity progress bars
 * ✅ Overflow menu for batch actions
 * ✅ Material Design modal form
 * ✅ BaseScreen wrapper with all states
 * ✅ Safe navigation with analytics tracking
 * ✅ Performance optimized (useMemo, useCallback, React.memo)
 * ✅ Accessibility labels
 * ✅ Pull-to-refresh
 * ✅ TypeScript strict mode compliance
 *
 * UI Improvements over V2:
 * 1. Enhanced stats cards with icons (school, check-circle, users)
 * 2. Search debounce (300ms) - reduces unnecessary queries
 * 3. Filter chips with active state visual indicators
 * 4. Clear all filters button for quick reset
 * 5. Grade level color-coded badges
 * 6. Enrollment capacity progress bars (visual representation)
 * 7. Overflow menu for batch actions (reduces button clutter)
 * 8. Material Design modal with better input styling
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Alert as RNAlert, StyleSheet, FlatList, RefreshControl, Modal, ScrollView } from 'react-native';
import { IconButton, Menu, Searchbar, FAB, Portal, Dialog, TextInput as PaperTextInput, ProgressBar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, CardContent, CardHeader } from '../../ui/surfaces/Card';
import { Row, Col, T, Spacer, Button as UIButton } from '../../ui';
import { Badge, Chip } from '../../ui';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  console.log('📥 [OrganizationManagementV3] Fetching batches:', params);

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
    console.error('❌ [OrganizationManagementV3] Error fetching batches:', error);
    throw error;
  }

  console.log(`✅ [OrganizationManagementV3] Fetched ${data?.length || 0} batches`);
  return data || [];
};

// ============================================
// MAIN COMPONENT
// ============================================

const OrganizationManagementScreenV3: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentRole = (user as any)?.role as AdminRole;
  const navigation = useNavigation();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState<'all' | string>('all');
  const [gradeLevelFilter, setGradeLevelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [gradeMenuVisible, setGradeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchMenuVisible, setBatchMenuVisible] = useState<string | null>(null);

  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    grade_level: '',
    section: '',
    academic_year: '',
    max_students: '',
  });

  // ============================================
  // SEARCH DEBOUNCE (300ms)
  // ============================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ============================================
  // ANALYTICS & RBAC GATE
  // ============================================

  useEffect(() => {
    trackScreenView('OrganizationManagementV3');

    // RBAC gate: Check manage_branches permission
    if (!can(currentRole, 'manage_branches')) {
      console.warn('⛔ [OrganizationManagementV3] Access denied:', currentRole);
      trackAction('access_denied', 'OrganizationManagementV3', {
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
    queryKey: ['batches', academicYearFilter, gradeLevelFilter, statusFilter, debouncedSearch],
    queryFn: () =>
      fetchBatches({
        academicYear: academicYearFilter,
        gradeLevel: gradeLevelFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: debouncedSearch,
      }),
    staleTime: 30000, // 30 seconds
    enabled: can(currentRole, 'manage_branches'),
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createBatchMutation = useMutation({
    mutationFn: async (batchData: BatchFormData) => {
      console.log('➕ [OrganizationManagementV3] Creating batch:', batchData);

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

      console.log('✅ [OrganizationManagementV3] Batch created');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setCreateModalVisible(false);
      resetForm();
      RNAlert.alert('Success', 'Batch created successfully');
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagementV3] Create error:', error);
      RNAlert.alert('Error', error.message || 'Failed to create batch');
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ batchId, updates }: { batchId: string; updates: Partial<Batch> }) => {
      console.log('✏️ [OrganizationManagementV3] Updating batch:', batchId);

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

      console.log('✅ [OrganizationManagementV3] Batch updated');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setEditingBatch(null);
      resetForm();
      RNAlert.alert('Success', 'Batch updated successfully');
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagementV3] Update error:', error);
      RNAlert.alert('Error', error.message || 'Failed to update batch');
    },
  });

  const toggleBatchStatusMutation = useMutation({
    mutationFn: async ({ batchId, currentStatus }: { batchId: string; currentStatus: boolean }) => {
      const newStatus = !currentStatus;
      console.log(`🔄 [OrganizationManagementV3] Toggling batch ${batchId} to ${newStatus}`);

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

      console.log('✅ [OrganizationManagementV3] Batch status toggled');
      return { success: true, newStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      const action = result.newStatus ? 'activated' : 'deactivated';
      RNAlert.alert('Success', `Batch ${action} successfully`);
    },
    onError: (error: any) => {
      console.error('❌ [OrganizationManagementV3] Toggle error:', error);
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
      totalStudents: batches.reduce((sum, b) => sum + (b.current_enrollment ?? 0), 0),
    };
  }, [batches]);

  const hasBatches = useMemo(() => batches && batches.length > 0, [batches]);

  const hasActiveFilters = useMemo(
    () => academicYearFilter !== 'all' || gradeLevelFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '',
    [academicYearFilter, gradeLevelFilter, statusFilter, searchQuery]
  );

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleToggleStatus = useCallback(
    (batch: Batch) => {
      setBatchMenuVisible(null);
      const action = batch.is_active ? 'Deactivate' : 'Activate';
      trackAction(`${action.toLowerCase()}_batch_attempt`, 'OrganizationManagementV3', { batchId: batch.id });

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
              trackAction(`${action.toLowerCase()}_batch_confirmed`, 'OrganizationManagementV3', { batchId: batch.id });
              toggleBatchStatusMutation.mutate({ batchId: batch.id, currentStatus: batch.is_active });
            },
          },
        ]
      );
    },
    [toggleBatchStatusMutation]
  );

  const handleEditBatch = useCallback((batch: Batch) => {
    setBatchMenuVisible(null);
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      grade_level: batch.grade_level,
      section: batch.section || '',
      academic_year: batch.academic_year || '',
      max_students: batch.max_students?.toString() || '',
    });
    trackAction('edit_batch', 'OrganizationManagementV3', { batchId: batch.id });
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

  const handleClearFilters = useCallback(() => {
    setAcademicYearFilter('all');
    setGradeLevelFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    trackAction('clear_filters', 'OrganizationManagementV3');
  }, []);

  const handleRefresh = useCallback(() => {
    trackAction('refresh_batches', 'OrganizationManagementV3');
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

  const getGradeBadgeColor = useCallback((grade: string): string => {
    const gradeNum = parseInt(grade);
    if (gradeNum >= 11) return Colors.primary;
    if (gradeNum >= 10) return Colors.success;
    return Colors.warning;
  }, []);

  const getEnrollmentProgress = useCallback((current: number, max: number | null): number => {
    if (!max || max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  }, []);

  // ============================================
  // UI COMPONENTS
  // ============================================

  // Enhanced Stats Cards with Material Icons
  const EnhancedStatCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    color: string;
  }> = React.memo(({ icon, label, value, color }) => (
    <Card style={[styles.statCard, { flex: 1 }]}>
      <CardContent>
        <Col gap={Spacing.xs} align="center">
          <Icon name={icon} size={32} color={color} style={{ opacity: 0.9 }} />
          <T variant="h3" color={color} weight="bold">
            {value}
          </T>
          <T variant="caption" color="textSecondary" align="center">
            {label}
          </T>
        </Col>
      </CardContent>
    </Card>
  ));

  const StatsCards = useMemo(
    () => (
      <Row gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        <EnhancedStatCard icon="school" label="Total Batches" value={stats.total.toString()} color={Colors.primary} />
        <EnhancedStatCard icon="check-circle" label="Active" value={stats.active.toString()} color={Colors.success} />
        <EnhancedStatCard icon="users" label="Students" value={stats.totalStudents.toString()} color={Colors.warning} />
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

        <Row gap={Spacing.sm} style={{ flexWrap: 'wrap' }}>
          <Menu
            visible={yearMenuVisible}
            onDismiss={() => setYearMenuVisible(false)}
            anchor={
              <Chip
                onPress={() => setYearMenuVisible(true)}
                accessibilityLabel="Filter by academic year"
                style={[
                  styles.filterChip,
                  academicYearFilter !== 'all' && styles.filterChipActive
                ]}
              >
                {academicYearFilter !== 'all' && <Icon name="check" size={16} color={Colors.primary} style={{ marginRight: 4 }} />}
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
              <Chip
                onPress={() => setGradeMenuVisible(true)}
                accessibilityLabel="Filter by grade"
                style={[
                  styles.filterChip,
                  gradeLevelFilter !== 'all' && styles.filterChipActive
                ]}
              >
                {gradeLevelFilter !== 'all' && <Icon name="check" size={16} color={Colors.primary} style={{ marginRight: 4 }} />}
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
              <Chip
                onPress={() => setStatusMenuVisible(true)}
                accessibilityLabel="Filter by status"
                style={[
                  styles.filterChip,
                  statusFilter !== 'all' && styles.filterChipActive
                ]}
              >
                {statusFilter !== 'all' && <Icon name="check" size={16} color={Colors.primary} style={{ marginRight: 4 }} />}
                Status: {statusFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => { setStatusFilter('all'); setStatusMenuVisible(false); }} title="All" />
            <Menu.Item onPress={() => { setStatusFilter('active'); setStatusMenuVisible(false); }} title="Active" />
            <Menu.Item onPress={() => { setStatusFilter('inactive'); setStatusMenuVisible(false); }} title="Inactive" />
          </Menu>

          {hasActiveFilters && (
            <Chip
              onPress={handleClearFilters}
              accessibilityLabel="Clear all filters"
              style={[styles.filterChip, { backgroundColor: Colors.error + '15', borderColor: Colors.error }]}
            >
              <Icon name="close" size={16} color={Colors.error} style={{ marginRight: 4 }} />
              Clear All
            </Chip>
          )}
        </Row>
      </Col>
    ),
    [searchQuery, academicYearFilter, gradeLevelFilter, statusFilter, yearMenuVisible, gradeMenuVisible, statusMenuVisible, hasActiveFilters, handleClearFilters]
  );

  const BatchCard = React.memo<{ batch: Batch }>(({ batch }) => {
    const enrollmentProgress = getEnrollmentProgress(batch.current_enrollment, batch.max_students);
    const isMenuOpen = batchMenuVisible === batch.id;
    const isMutating = toggleBatchStatusMutation.isPending || updateBatchMutation.isPending;

    return (
      <Card style={styles.batchCard}>
        <CardHeader
          title={
            <Row centerV gap={Spacing.xs}>
              <T variant="body1" weight="semiBold">
                {batch.name}
              </T>
              <Badge
                style={{
                  backgroundColor: getGradeBadgeColor(batch.grade_level) + '20',
                }}
              >
                <T variant="caption" color={getGradeBadgeColor(batch.grade_level)} weight="bold">
                  Grade {batch.grade_level}
                </T>
              </Badge>
            </Row>
          }
          subtitle={batch.section ? `Section: ${batch.section}` : undefined}
          right={
            <Row centerV gap={Spacing.xs}>
              <Badge
                style={{
                  backgroundColor: batch.is_active ? Colors.success + '20' : Colors.error + '20',
                }}
                accessibilityLabel={batch.is_active ? 'Active' : 'Inactive'}
              >
                <T variant="caption" color={batch.is_active ? Colors.success : Colors.error} weight="bold">
                  {batch.is_active ? 'Active' : 'Inactive'}
                </T>
              </Badge>

              <Menu
                visible={isMenuOpen}
                onDismiss={() => setBatchMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="more-vert"
                    size={20}
                    onPress={() => setBatchMenuVisible(batch.id)}
                    accessibilityLabel={`Actions for ${batch.name}`}
                    disabled={isMutating}
                  />
                }
              >
                <Menu.Item
                  onPress={() => handleEditBatch(batch)}
                  title="Edit Batch"
                  leadingIcon="edit"
                />
                <Menu.Item
                  onPress={() => handleToggleStatus(batch)}
                  title={batch.is_active ? 'Deactivate' : 'Activate'}
                  leadingIcon={batch.is_active ? 'block' : 'check-circle'}
                />
              </Menu>
            </Row>
          }
        />
        <CardContent>
          <Col gap={Spacing.sm}>
            <T variant="body2" color="textSecondary">
              Academic Year: {batch.academic_year || 'N/A'}
            </T>

            {/* Enrollment Capacity with Progress Bar */}
            <View>
              <Row spaceBetween centerV style={{ marginBottom: 4 }}>
                <T variant="body2" weight="semiBold">
                  Enrollment
                </T>
                <T variant="body2" color="textSecondary">
                  {batch.current_enrollment}{batch.max_students ? ` / ${batch.max_students}` : ''} students
                </T>
              </Row>
              {batch.max_students && (
                <ProgressBar
                  progress={(enrollmentProgress ?? 0) / 100}
                  color={
                    enrollmentProgress >= 90
                      ? Colors.error
                      : enrollmentProgress >= 75
                      ? Colors.warning
                      : Colors.success
                  }
                  style={styles.progressBar}
                />
              )}
            </View>

            <T variant="caption" color="textSecondary">
              Created: {formatDate(batch.created_at)}
            </T>

            {isMutating && isMenuOpen && (
              <View style={styles.loadingOverlay}>
                <T variant="caption" color="textSecondary">
                  Processing...
                </T>
              </View>
            )}
          </Col>
        </CardContent>
      </Card>
    );
  });

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
              <T variant="body1" color="textSecondary" align="center">
                {hasActiveFilters ? 'No batches match your filters' : 'No batches found'}
              </T>
              {hasActiveFilters && (
                <UIButton variant="text" onPress={handleClearFilters} style={{ marginTop: Spacing.sm }}>
                  Clear Filters
                </UIButton>
              )}
            </View>
          )
        }
      />
    ),
    [batches, isLoading, isRefetching, handleRefresh, hasActiveFilters, handleClearFilters]
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
            <T variant="body2" color="textSecondary">
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
          trackAction('create_batch_open', 'OrganizationManagementV3');
        }}
        accessibilityLabel="Create new batch"
      />

      {/* Material Design Modal Form */}
      <Portal>
        <Dialog
          visible={createModalVisible || editingBatch !== null}
          onDismiss={() => {
            setCreateModalVisible(false);
            setEditingBatch(null);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>{editingBatch ? 'Edit Batch' : 'Create Batch'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <PaperTextInput
                label="Batch Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                mode="outlined"
                style={styles.dialogInput}
              />

              <PaperTextInput
                label="Grade Level * (e.g., 10, 11, 12)"
                value={formData.grade_level}
                onChangeText={(text) => setFormData({ ...formData, grade_level: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.dialogInput}
              />

              <PaperTextInput
                label="Section (e.g., A, B, Science)"
                value={formData.section}
                onChangeText={(text) => setFormData({ ...formData, section: text })}
                mode="outlined"
                style={styles.dialogInput}
              />

              <PaperTextInput
                label="Academic Year (e.g., 2024-2025)"
                value={formData.academic_year}
                onChangeText={(text) => setFormData({ ...formData, academic_year: text })}
                mode="outlined"
                style={styles.dialogInput}
              />

              <PaperTextInput
                label="Max Students"
                value={formData.max_students}
                onChangeText={(text) => setFormData({ ...formData, max_students: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.dialogInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <UIButton
              variant="text"
              onPress={() => {
                setCreateModalVisible(false);
                setEditingBatch(null);
              }}
            >
              Cancel
            </UIButton>
            <UIButton
              variant="text"
              onPress={editingBatch ? handleSaveEdit : handleCreateBatch}
            >
              {editingBatch ? 'Save' : 'Create'}
            </UIButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  searchbar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  statCard: {
    elevation: 2,
  },
  batchCard: {
    marginBottom: Spacing.md,
    elevation: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: Spacing.md,
  },
  dialogInput: {
    marginBottom: Spacing.md,
  },
});

export default OrganizationManagementScreenV3;
