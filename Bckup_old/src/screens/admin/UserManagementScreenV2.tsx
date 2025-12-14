/**
 * UserManagementScreen v2.1 - PRODUCTION READY ✅
 * Phase 1 Complete: User Management with Real Data + All CRUD Actions
 *
 * Features:
 * ✅ Real Supabase data (profiles table)
 * ✅ RBAC gate at screen entry (manage_users permission)
 * ✅ Search and filter (role, is_active)
 * ✅ Suspend user mutation with confirmation + audit
 * ✅ Unsuspend user mutation with confirmation + audit
 * ✅ Delete user mutation with confirmation + audit (Phase 1)
 * ✅ Reset password with confirmation + audit (Phase 1)
 * ✅ Change role with confirmation + audit (Phase 1)
 * ✅ Stats cards (total, active, suspended)
 * ✅ BaseScreen wrapper with all states
 * ✅ Safe navigation with analytics tracking
 * ✅ Performance optimized (useMemo, useCallback, React.memo)
 * ✅ Accessibility labels
 * ✅ Pull-to-refresh
 * ✅ TypeScript strict mode compliance
 * ✅ Phase 0 utilities (confirmDialog, snackbar)
 * ✅ Phase 1 hooks (useDeleteUser, useResetPassword, useChangeRole)
 *
 * Omitted (for Phase 2+):
 * ❌ Create user flow
 * ❌ Edit user flow
 * ❌ Bulk operations
 * ❌ Export functionality
 *
 * Dependencies:
 * - profiles table (with is_active field)
 * - audit_logs table (Phase 0)
 * - adminPermissions.ts (Phase 0)
 * - auditLogger.ts (Phase 0)
 * - confirmDialog.ts (Phase 0)
 * - snackbar.ts (Phase 0)
 * - useUserManagement.ts hooks (Phase 1)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Menu, Searchbar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, CardContent, CardHeader } from '../../ui/surfaces/Card';
import { Row, Col, T, Button as UIButton } from '../../ui';
import { Badge, Chip } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { can, AdminRole } from '../../utils/adminPermissions';
import { logAudit } from '../../utils/auditLogger';
import { useDeleteUser, useResetPassword, useChangeRole } from '../../hooks/useUserManagement';

// Sprint 1: New utility providers
import { useConfirmDialog, useDestructiveAction } from '../../shared/components/ConfirmDialog';
import { useAdminFeedback } from '../../shared/components/SnackbarProvider';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

interface FetchUsersParams {
  role?: 'admin' | 'teacher' | 'student' | 'parent';
  isActive?: boolean;
  search?: string;
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Fetch users from Supabase profiles table
 * Uses is_active field for filtering (not status)
 */
const fetchUsers = async (params: FetchUsersParams): Promise<User[]> => {
  console.log('📥 [UserManagement] Fetching users:', params);

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, updated_at, created_at')
    .order('created_at', { ascending: false });

  if (params.role) {
    query = query.eq('role', params.role);
  }

  if (params.isActive !== undefined) {
    query = query.eq('is_active', params.isActive);
  }

  if (params.search && params.search.trim() !== '') {
    const searchTerm = `%${params.search.trim()}%`;
    query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [UserManagement] Error fetching users:', error);
    throw error;
  }

  console.log(`✅ [UserManagement] Fetched ${data?.length || 0} users`);
  return data || [];
};

// ============================================
// MAIN COMPONENT
// ============================================

const UserManagementScreenV2: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentRole = (user as any)?.role as AdminRole;
  const navigation = useNavigation();

  // Sprint 1: New utility hooks
  const { showConfirm } = useConfirmDialog();
  const { confirmDelete, confirmSuspend, confirmUnsuspend, confirmResetPassword, confirmRoleChange } = useDestructiveAction();
  const { userSuspended, userUnsuspended, userDeleted, passwordResetSent, roleChanged, actionFailed } = useAdminFeedback();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student' | 'parent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // ============================================
  // ANALYTICS & RBAC GATE
  // ============================================

  useEffect(() => {
    trackScreenView('UserManagementV2');

    // RBAC gate: Check manage_users permission
    if (!can(currentRole, 'manage_users')) {
      console.warn('⛔ [UserManagement] Access denied:', currentRole);
      trackAction('access_denied', 'UserManagementV2', {
        role: currentRole,
        requiredPermission: 'manage_users',
      });

      // Navigate to AccessDenied screen
      setTimeout(() => {
        navigation.navigate('AccessDenied' as never, {
          requiredPermission: 'manage_users',
          message: `You need 'manage_users' permission to access User Management.`,
        });
      }, 100);
    }
  }, [currentRole]);

  // ============================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ============================================

  const {
    data: users,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<User[]>({
    queryKey: ['users', roleFilter, statusFilter, searchQuery],
    queryFn: () =>
      fetchUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery,
      }),
    staleTime: 30000, // 30 seconds
    enabled: can(currentRole, 'manage_users'), // Only fetch if user has permission
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Suspend user mutation
   * Sets is_active = false + audit logging
   */
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔒 [UserManagement] Suspending user:', userId);

      // 1. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [UserManagement] Suspend failed:', updateError);
        throw updateError;
      }

      // 2. MANDATORY AUDIT LOG
      await logAudit({
        action: 'suspend_user',
        targetId: userId,
        targetType: 'user',
        changes: {
          is_active: { from: true, to: false },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      console.log('✅ [UserManagement] User suspended');
      return { success: true };
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const suspendedUser = users?.find(u => u.id === userId);
      if (suspendedUser) {
        userSuspended(suspendedUser.full_name);
      }
    },
    onError: (error: any) => {
      console.error('❌ [UserManagement] Suspend mutation error:', error);
      actionFailed('suspend user', error.message || 'Unknown error');
    },
  });

  /**
   * Unsuspend user mutation
   * Sets is_active = true + audit logging
   */
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔓 [UserManagement] Unsuspending user:', userId);

      // 1. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [UserManagement] Unsuspend failed:', updateError);
        throw updateError;
      }

      // 2. MANDATORY AUDIT LOG
      await logAudit({
        action: 'unsuspend_user',
        targetId: userId,
        targetType: 'user',
        changes: {
          is_active: { from: false, to: true },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      console.log('✅ [UserManagement] User unsuspended');
      return { success: true };
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const unsuspendedUser = users?.find(u => u.id === userId);
      if (unsuspendedUser) {
        userUnsuspended(unsuspendedUser.full_name);
      }
    },
    onError: (error: any) => {
      console.error('❌ [UserManagement] Unsuspend mutation error:', error);
      actionFailed('unsuspend user', error.message || 'Unknown error');
    },
  });

  /**
   * Delete user mutation (using Phase 1 hook)
   * Wrapped with snackbar feedback
   */
  const deleteUserMutationBase = useDeleteUser();
  const deleteUserMutation = {
    ...deleteUserMutationBase,
    mutate: (payload: { userId: string }) => {
      const user = users?.find(u => u.id === payload.userId);
      deleteUserMutationBase.mutate(payload, {
        onSuccess: () => {
          if (user) {
            userDeleted(user.full_name);
          }
        },
        onError: (error: any) => {
          actionFailed('delete user', error.message || 'Unknown error');
        },
      });
    },
  };

  /**
   * Reset password mutation (using Phase 1 hook)
   * Wrapped with snackbar feedback
   */
  const resetPasswordMutationBase = useResetPassword();
  const resetPasswordMutation = {
    ...resetPasswordMutationBase,
    mutate: (payload: { userId: string; email: string }) => {
      resetPasswordMutationBase.mutate(payload, {
        onSuccess: () => {
          passwordResetSent(payload.email);
        },
        onError: (error: any) => {
          actionFailed('reset password', error.message || 'Unknown error');
        },
      });
    },
  };

  /**
   * Change role mutation (using Phase 1 hook)
   * Wrapped with snackbar feedback
   */
  const changeRoleMutationBase = useChangeRole();
  const changeRoleMutation = {
    ...changeRoleMutationBase,
    mutate: (payload: { userId: string; newRole: User['role'] }) => {
      const user = users?.find(u => u.id === payload.userId);
      changeRoleMutationBase.mutate({ userId: payload.userId, newRole: payload.newRole }, {
        onSuccess: () => {
          if (user) {
            roleChanged(user.full_name, payload.newRole);
          }
        },
        onError: (error: any) => {
          actionFailed('change role', error.message || 'Unknown error');
        },
      });
    },
  };

  // ============================================
  // COMPUTED VALUES - Performance Optimization
  // ============================================

  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, suspended: 0 };

    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      suspended: users.filter((u) => !u.is_active).length,
    };
  }, [users]);

  const hasUsers = useMemo(() => users && users.length > 0, [users]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle suspend user
   * Shows confirmation dialog before mutation
   */
  const handleSuspendUser = useCallback(
    async (userId: string, userName: string) => {
      trackAction('suspend_user_attempt', 'UserManagementV2', { userId });

      const confirmed = await confirmSuspend(userName);

      if (!confirmed) {
        trackAction('suspend_user_cancelled', 'UserManagementV2', { userId });
        return;
      }

      trackAction('suspend_user_confirmed', 'UserManagementV2', { userId });
      suspendUserMutation.mutate(userId);
    },
    [suspendUserMutation, confirmSuspend]
  );

  /**
   * Handle unsuspend user
   * Shows confirmation dialog before mutation
   */
  const handleUnsuspendUser = useCallback(
    async (userId: string, userName: string) => {
      trackAction('unsuspend_user_attempt', 'UserManagementV2', { userId });

      const confirmed = await confirmUnsuspend(userName);

      if (!confirmed) {
        trackAction('unsuspend_user_cancelled', 'UserManagementV2', { userId });
        return;
      }

      trackAction('unsuspend_user_confirmed', 'UserManagementV2', { userId });
      unsuspendUserMutation.mutate(userId);
    },
    [unsuspendUserMutation, confirmUnsuspend]
  );

  /**
   * Handle delete user
   * Uses Phase 0 confirmDialog + Phase 1 hook
   */
  const handleDeleteUser = useCallback(
    async (userId: string, userName: string) => {
      trackAction('delete_user_attempt', 'UserManagementV2', { userId });

      const confirmed = await confirmDelete(userName, 'user');
      if (!confirmed) {
        trackAction('delete_user_cancelled', 'UserManagementV2', { userId });
        return;
      }

      trackAction('delete_user_confirmed', 'UserManagementV2', { userId });
      deleteUserMutation.mutate({ userId });
    },
    [deleteUserMutation, confirmDelete]
  );

  /**
   * Handle reset password
   * Uses Phase 0 confirmDialog + Phase 1 hook
   */
  const handleResetPassword = useCallback(
    async (userId: string, email: string) => {
      trackAction('reset_password_attempt', 'UserManagementV2', { userId });

      const confirmed = await confirmResetPassword(email);
      if (!confirmed) {
        trackAction('reset_password_cancelled', 'UserManagementV2', { userId });
        return;
      }

      trackAction('reset_password_confirmed', 'UserManagementV2', { userId });
      resetPasswordMutation.mutate({ userId, email });
    },
    [resetPasswordMutation, confirmResetPassword]
  );

  /**
   * Handle change role
   * Helper to show confirm and mutate for a specific role
   */
  const confirmAndChangeRole = useCallback(
    async (userId: string, userName: string, currentRole: User['role'], newRole: User['role']) => {
      const confirmed = await confirmRoleChange(userName, currentRole, newRole);
      if (confirmed) {
        trackAction('change_role_confirmed', 'UserManagementV2', { userId, newRole });
        changeRoleMutation.mutate({ userId, newRole });
      } else {
        trackAction('change_role_cancelled', 'UserManagementV2', { userId, newRole });
      }
    },
    [changeRoleMutation, confirmRoleChange]
  );

  /**
   * Handle change role - Show role picker
   * Uses showConfirm to present each role option
   */
  const handleChangeRole = useCallback(
    async (userId: string, currentRole: User['role'], userName: string) => {
      trackAction('change_role_attempt', 'UserManagementV2', { userId, currentRole });

      // Show role selection confirm dialog
      const roleOptions: User['role'][] = ['admin', 'teacher', 'student', 'parent'];
      const otherRoles = roleOptions.filter(r => r !== currentRole);

      // For simplicity, show confirms for each role sequentially
      // User can cancel to skip to the next option
      for (const newRole of otherRoles) {
        const selectRole = await showConfirm({
          title: 'Change Role',
          message: `Change "${userName}" from ${currentRole} to ${newRole}?`,
          confirmText: `Change to ${newRole}`,
          cancelText: `Skip / Try next role`,
          confirmColor: 'warning',
        });

        if (selectRole) {
          // User selected this role, now confirm the change
          await confirmAndChangeRole(userId, userName, currentRole, newRole);
          return; // Exit after handling the selected role
        }
        // If cancelled, continue to next role option
      }

      trackAction('change_role_cancelled', 'UserManagementV2', { userId });
    },
    [confirmAndChangeRole, showConfirm]
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    trackAction('search_users', 'UserManagementV2', { query });
  }, []);

  /**
   * Handle role filter change
   */
  const handleRoleFilterChange = useCallback((role: typeof roleFilter) => {
    setRoleFilter(role);
    setRoleMenuVisible(false);
    trackAction('filter_users_by_role', 'UserManagementV2', { role });
  }, []);

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = useCallback((status: typeof statusFilter) => {
    setStatusFilter(status);
    setStatusMenuVisible(false);
    trackAction('filter_users_by_status', 'UserManagementV2', { status });
  }, []);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    trackAction('refresh_users', 'UserManagementV2');
    refetch();
  }, [refetch]);

  // ============================================
  // FORMAT HELPERS - Memoized
  // ============================================

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getRoleBadgeColor = useCallback((role: User['role']): string => {
    switch (role) {
      case 'admin':
        return Colors.error;
      case 'teacher':
        return Colors.primary;
      case 'student':
        return Colors.success;
      case 'parent':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  }, []);

  // ============================================
  // UI COMPONENTS
  // ============================================

  /**
   * Stats Cards Component
   */
  const StatsCards = useMemo(
    () => (
      <Row gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        <StatCard
          label="Total Users"
          value={stats.total.toString()}
          color={Colors.primary}
        />
        <StatCard
          label="Active"
          value={stats.active.toString()}
          color={Colors.success}
        />
        <StatCard
          label="Suspended"
          value={stats.suspended.toString()}
          color={Colors.error}
        />
      </Row>
    ),
    [stats]
  );

  /**
   * Filters Section Component
   */
  const FiltersSection = useMemo(
    () => (
      <Col gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        {/* Search Bar */}
        <Searchbar
          placeholder="Search by name or email"
          onChangeText={handleSearchChange}
          value={searchQuery}
          accessibilityLabel="Search users"
          style={styles.searchbar}
        />

        {/* Filters Row */}
        <Row gap={Spacing.sm}>
          {/* Role Filter */}
          <Menu
            visible={roleMenuVisible}
            onDismiss={() => setRoleMenuVisible(false)}
            anchor={
              <Chip
                onPress={() => setRoleMenuVisible(true)}
                accessibilityLabel="Filter by role"
              >
                Role: {roleFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => handleRoleFilterChange('all')} title="All Roles" />
            <Menu.Item onPress={() => handleRoleFilterChange('admin')} title="Admin" />
            <Menu.Item onPress={() => handleRoleFilterChange('teacher')} title="Teacher" />
            <Menu.Item onPress={() => handleRoleFilterChange('student')} title="Student" />
            <Menu.Item onPress={() => handleRoleFilterChange('parent')} title="Parent" />
          </Menu>

          {/* Status Filter */}
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Chip
                onPress={() => setStatusMenuVisible(true)}
                accessibilityLabel="Filter by status"
              >
                Status: {statusFilter}
              </Chip>
            }
          >
            <Menu.Item onPress={() => handleStatusFilterChange('all')} title="All Status" />
            <Menu.Item onPress={() => handleStatusFilterChange('active')} title="Active" />
            <Menu.Item onPress={() => handleStatusFilterChange('suspended')} title="Suspended" />
          </Menu>
        </Row>
      </Col>
    ),
    [
      searchQuery,
      roleFilter,
      statusFilter,
      roleMenuVisible,
      statusMenuVisible,
      handleSearchChange,
      handleRoleFilterChange,
      handleStatusFilterChange,
    ]
  );

  /**
   * User Card Component (Memoized)
   */
  const UserCard = React.memo<{ user: User }>(({ user }) => (
    <Card style={styles.userCard}>
      <CardHeader
        title={user.full_name}
        subtitle={user.email}
        right={
          <Row gap={Spacing.xs}>
            <Badge
              style={{ backgroundColor: getRoleBadgeColor(user.role) }}
              accessibilityLabel={`Role: ${user.role}`}
            >
              {user.role}
            </Badge>
            <Badge
              style={{
                backgroundColor: user.is_active ? Colors.success : Colors.error,
              }}
              accessibilityLabel={user.is_active ? 'Active' : 'Suspended'}
            >
              {user.is_active ? 'Active' : 'Suspended'}
            </Badge>
          </Row>
        }
      />
      <CardContent>
        <Col gap={Spacing.sm}>
          <T variant="caption" color={Colors.textSecondary}>
            Created: {formatDate(user.created_at)}
          </T>
          <T variant="caption" color={Colors.textSecondary}>
            Last Updated: {formatDate(user.updated_at)}
          </T>

          {/* Action Buttons */}
          <Row gap={Spacing.sm} style={{ marginTop: Spacing.sm }}>
            {user.is_active ? (
              <UIButton
                variant="outlined"
                onPress={() => handleSuspendUser(user.id, user.full_name)}
                accessibilityLabel={`Suspend ${user.full_name}`}
                style={{ flex: 1 }}
              >
                Suspend
              </UIButton>
            ) : (
              <UIButton
                variant="contained"
                onPress={() => handleUnsuspendUser(user.id, user.full_name)}
                accessibilityLabel={`Unsuspend ${user.full_name}`}
                style={{ flex: 1 }}
              >
                Unsuspend
              </UIButton>
            )}
          </Row>

          {/* Additional Action Buttons - Phase 1 */}
          <Row gap={Spacing.sm} style={{ marginTop: Spacing.xs }}>
            <UIButton
              variant="text"
              onPress={() => handleResetPassword(user.id, user.email)}
              accessibilityLabel={`Reset password for ${user.full_name}`}
              style={{ flex: 1 }}
            >
              Reset Password
            </UIButton>
            <UIButton
              variant="text"
              onPress={() => handleChangeRole(user.id, user.role, user.full_name)}
              accessibilityLabel={`Change role for ${user.full_name}`}
              style={{ flex: 1 }}
            >
              Change Role
            </UIButton>
            <UIButton
              variant="text"
              onPress={() => handleDeleteUser(user.id, user.full_name)}
              accessibilityLabel={`Delete ${user.full_name}`}
              style={{ flex: 1 }}
            >
              Delete
            </UIButton>
          </Row>
        </Col>
      </CardContent>
    </Card>
  ));

  /**
   * Users List Component
   */
  const UsersList = useMemo(
    () => (
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            accessibilityLabel="Pull to refresh"
          />
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <T variant="body1" color={Colors.textSecondary} align="center">
                No users found
              </T>
              <T variant="caption" color={Colors.textSecondary} align="center">
                Try adjusting your filters
              </T>
            </View>
          )
        }
      />
    ),
    [users, isLoading, isRefetching, handleRefresh]
  );

  // ============================================
  // RENDER
  // ============================================

  // Early return if no permission
  if (!can(currentRole, 'manage_users')) {
    return null; // Will navigate to AccessDeniedScreen via useEffect
  }

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error ? (error as Error).message : undefined}
      empty={!hasUsers && !isLoading}
      emptyMessage="No users found"
    >
      <Col gap={Spacing.lg} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
          <T variant="h5">User Management</T>
          <T variant="body2" color={Colors.textSecondary}>
            Manage users and permissions
          </T>
        </View>

        {/* Stats Cards */}
        {StatsCards}

        {/* Filters */}
        {FiltersSection}

        {/* Users List */}
        <View style={{ flex: 1 }}>{UsersList}</View>
      </Col>
    </BaseScreen>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Stat Card Component
 */
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
  userCard: {
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
});

export default UserManagementScreenV2;
