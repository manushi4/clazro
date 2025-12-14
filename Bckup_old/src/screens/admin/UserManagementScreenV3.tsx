/**
 * UserManagementScreen v3.0 - MODERN UI WITH MATERIAL DESIGN 3 ✨
 * Enhanced with better visual hierarchy and UX improvements
 *
 * Features:
 * ✅ Real Supabase data (profiles table)
 * ✅ Modern card design with user avatars/initials
 * ✅ Overflow menu for secondary actions (cleaner UI)
 * ✅ Enhanced stats cards with icons and better visuals
 * ✅ Search debounce (300ms) for better performance
 * ✅ Loading indicators during mutations
 * ✅ Better filter UI with active state indicators
 * ✅ RBAC gate at screen entry (manage_users permission)
 * ✅ 5 CRUD mutations with confirmation + audit
 * ✅ Pull-to-refresh
 * ✅ Performance optimized (useMemo, useCallback, React.memo)
 * ✅ Full accessibility labels
 * ✅ TypeScript strict mode compliance
 *
 * UI Improvements from v2.1:
 * - User avatars with initials
 * - Overflow menu instead of 5 buttons per card
 * - Enhanced stats cards with icons
 * - Search debounce for better performance
 * - Better filter chips with active state
 * - Loading states for mutations
 * - Improved spacing and layout
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Menu, Searchbar, IconButton, Portal, Dialog, Button as PaperButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, CardContent, CardHeader } from '../../ui/surfaces/Card';
import { Row, Col, T, Button as UIButton } from '../../ui';
import { Badge, Chip } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { can } from '../../utils/adminPermissions';
import type { AdminRole } from '../../types/admin';
import { logAudit } from '../../utils/auditLogger';
import { useDeleteUser, useResetPassword, useChangeRole } from '../../hooks/useUserManagement';
import { useAdminRole } from '../../hooks/useAdminRole';

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
  console.log('📥 [UserManagementV3] Fetching users:', params);

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
    console.error('❌ [UserManagementV3] Error fetching users:', error);
    throw error;
  }

  console.log(`✅ [UserManagementV3] Fetched ${data?.length || 0} users`);
  return data || [];
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user initials from full name
 */
const getUserInitials = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/**
 * Get role badge color
 */
const getRoleBadgeColor = (role: User['role']): string => {
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
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

const UserManagementScreenV3: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role: currentRole } = useAdminRole();
  const navigation = useNavigation();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student' | 'parent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState<string | null>(null);
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Search debounce - 300ms
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
    trackScreenView('UserManagementV3');

    // RBAC gate: Check manage_users permission
    if (!can(currentRole, 'user_management')) {
      console.warn('⛔ [UserManagementV3] Access denied:', currentRole);
      trackAction('access_denied', 'UserManagementV3', {
        role: currentRole,
        requiredPermission: 'user_management',
      });

      // Navigate to AccessDenied screen
      setTimeout(() => {
        navigation.navigate('AccessDenied' as never, {
          requiredPermission: 'user_management',
          message: `You need 'user_management' permission to access User Management.`,
        });
      }, 100);
    }
  }, [currentRole, navigation]);

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
    queryKey: ['users', roleFilter, statusFilter, debouncedSearch],
    queryFn: () =>
      fetchUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: debouncedSearch,
      }),
    staleTime: 30000, // 30 seconds
    enabled: can(currentRole, 'user_management'), // Only fetch if user has permission
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
      console.log('🔒 [UserManagementV3] Suspending user:', userId);

      // 1. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [UserManagementV3] Suspend failed:', updateError);
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

      console.log('✅ [UserManagementV3] User suspended');
      return { success: true };
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const suspendedUser = users?.find(u => u.id === userId);
      if (suspendedUser) {
        Alert.alert('Success', `User ${suspendedUser.full_name} has been suspended`);
      }
      setUserMenuVisible(null);
    },
    onError: (error: any) => {
      console.error('❌ [UserManagementV3] Suspend mutation error:', error);
      Alert.alert('Error', `Failed to suspend user: ${error.message || 'Unknown error'}`);
    },
  });

  /**
   * Unsuspend user mutation
   * Sets is_active = true + audit logging
   */
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔓 [UserManagementV3] Unsuspending user:', userId);

      // 1. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [UserManagementV3] Unsuspend failed:', updateError);
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

      console.log('✅ [UserManagementV3] User unsuspended');
      return { success: true };
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const unsuspendedUser = users?.find(u => u.id === userId);
      if (unsuspendedUser) {
        Alert.alert('Success', `User ${unsuspendedUser.full_name} has been unsuspended`);
      }
      setUserMenuVisible(null);
    },
    onError: (error: any) => {
      console.error('❌ [UserManagementV3] Unsuspend mutation error:', error);
      Alert.alert('Error', `Failed to unsuspend user: ${error.message || 'Unknown error'}`);
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
      const targetUser = users?.find(u => u.id === payload.userId);
      deleteUserMutationBase.mutate(payload, {
        onSuccess: () => {
          if (targetUser) {
            Alert.alert('Success', `User ${targetUser.full_name} has been deleted`);
          }
          setUserMenuVisible(null);
        },
        onError: (error: any) => {
          Alert.alert('Error', `Failed to delete user: ${error.message || 'Unknown error'}`);
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
          Alert.alert('Success', `Password reset email sent to ${payload.email}`);
          setUserMenuVisible(null);
        },
        onError: (error: any) => {
          Alert.alert('Error', `Failed to reset password: ${error.message || 'Unknown error'}`);
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
      const targetUser = users?.find(u => u.id === payload.userId);
      changeRoleMutationBase.mutate({ userId: payload.userId, newRole: payload.newRole }, {
        onSuccess: () => {
          if (targetUser) {
            Alert.alert('Success', `Role changed for ${targetUser.full_name} to ${payload.newRole}`);
          }
          setUserMenuVisible(null);
          setRoleDialogVisible(false);
          setSelectedUser(null);
        },
        onError: (error: any) => {
          Alert.alert('Error', `Failed to change role: ${error.message || 'Unknown error'}`);
        },
      });
    },
  };

  // ============================================
  // COMPUTED VALUES - Performance Optimization
  // ============================================

  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, suspended: 0, byRole: {} as Record<string, number> };

    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      suspended: users.filter((u) => !u.is_active).length,
      byRole,
    };
  }, [users]);

  const hasUsers = useMemo(() => users && users.length > 0, [users]);

  const hasActiveFilters = useMemo(() => {
    return roleFilter !== 'all' || statusFilter !== 'all' || debouncedSearch !== '';
  }, [roleFilter, statusFilter, debouncedSearch]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle suspend user
   * Shows confirmation dialog before mutation
   */
  const handleSuspendUser = useCallback(
    (userId: string, userName: string) => {
      trackAction('suspend_user_attempt', 'UserManagementV3', { userId });

      Alert.alert(
        'Suspend User',
        `Are you sure you want to suspend ${userName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => trackAction('suspend_user_cancelled', 'UserManagementV3', { userId }),
          },
          {
            text: 'Suspend',
            style: 'destructive',
            onPress: () => {
              trackAction('suspend_user_confirmed', 'UserManagementV3', { userId });
              suspendUserMutation.mutate(userId);
            },
          },
        ]
      );
    },
    [suspendUserMutation]
  );

  /**
   * Handle unsuspend user
   * Shows confirmation dialog before mutation
   */
  const handleUnsuspendUser = useCallback(
    (userId: string, userName: string) => {
      trackAction('unsuspend_user_attempt', 'UserManagementV3', { userId });

      Alert.alert(
        'Unsuspend User',
        `Are you sure you want to unsuspend ${userName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => trackAction('unsuspend_user_cancelled', 'UserManagementV3', { userId }),
          },
          {
            text: 'Unsuspend',
            onPress: () => {
              trackAction('unsuspend_user_confirmed', 'UserManagementV3', { userId });
              unsuspendUserMutation.mutate(userId);
            },
          },
        ]
      );
    },
    [unsuspendUserMutation]
  );

  /**
   * Handle delete user
   * Uses Phase 0 confirmDialog + Phase 1 hook
   */
  const handleDeleteUser = useCallback(
    (userId: string, userName: string) => {
      trackAction('delete_user_attempt', 'UserManagementV3', { userId });

      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${userName}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => trackAction('delete_user_cancelled', 'UserManagementV3', { userId }),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              trackAction('delete_user_confirmed', 'UserManagementV3', { userId });
              deleteUserMutation.mutate({ userId });
            },
          },
        ]
      );
    },
    [deleteUserMutation]
  );

  /**
   * Handle reset password
   * Uses Phase 0 confirmDialog + Phase 1 hook
   */
  const handleResetPassword = useCallback(
    (userId: string, email: string) => {
      trackAction('reset_password_attempt', 'UserManagementV3', { userId });

      Alert.alert(
        'Reset Password',
        `Send password reset email to ${email}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => trackAction('reset_password_cancelled', 'UserManagementV3', { userId }),
          },
          {
            text: 'Send Email',
            onPress: () => {
              trackAction('reset_password_confirmed', 'UserManagementV3', { userId });
              resetPasswordMutation.mutate({ userId, email });
            },
          },
        ]
      );
    },
    [resetPasswordMutation]
  );

  /**
   * Handle change role - Show role selection dialog
   */
  const handleChangeRole = useCallback(
    async (targetUser: User) => {
      trackAction('change_role_attempt', 'UserManagementV3', { userId: targetUser.id, currentRole: targetUser.role });
      setSelectedUser(targetUser);
      setRoleDialogVisible(true);
      setUserMenuVisible(null);
    },
    []
  );

  /**
   * Confirm and execute role change
   */
  const confirmAndChangeRole = useCallback(
    (newRole: User['role']) => {
      if (!selectedUser) return;

      Alert.alert(
        'Change Role',
        `Change ${selectedUser.full_name}'s role from ${selectedUser.role} to ${newRole}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              trackAction('change_role_cancelled', 'UserManagementV3', { userId: selectedUser.id, newRole });
              setRoleDialogVisible(false);
              setSelectedUser(null);
            },
          },
          {
            text: 'Change Role',
            onPress: () => {
              trackAction('change_role_confirmed', 'UserManagementV3', { userId: selectedUser.id, newRole });
              changeRoleMutation.mutate({ userId: selectedUser.id, newRole });
            },
          },
        ]
      );
    },
    [selectedUser, changeRoleMutation]
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    trackAction('search_users', 'UserManagementV3', { query });
  }, []);

  /**
   * Handle role filter change
   */
  const handleRoleFilterChange = useCallback((role: typeof roleFilter) => {
    setRoleFilter(role);
    setRoleMenuVisible(false);
    trackAction('filter_users_by_role', 'UserManagementV3', { role });
  }, []);

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = useCallback((status: typeof statusFilter) => {
    setStatusFilter(status);
    setStatusMenuVisible(false);
    trackAction('filter_users_by_status', 'UserManagementV3', { status });
  }, []);

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setRoleFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setDebouncedSearch('');
    trackAction('clear_filters', 'UserManagementV3');
  }, []);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    trackAction('refresh_users', 'UserManagementV3');
    refetch();
  }, [refetch]);

  // ============================================
  // UI COMPONENTS
  // ============================================

  /**
   * Enhanced Stats Cards Component with Icons
   */
  const EnhancedStatsCards = useMemo(
    () => (
      <Row gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        <EnhancedStatCard
          icon="people"
          label="Total Users"
          value={stats.total.toString()}
          color={Colors.primary}
        />
        <EnhancedStatCard
          icon="check-circle"
          label="Active"
          value={stats.active.toString()}
          color={Colors.success}
        />
        <EnhancedStatCard
          icon="block"
          label="Suspended"
          value={stats.suspended.toString()}
          color={Colors.error}
        />
      </Row>
    ),
    [stats]
  );

  /**
   * Filters Section Component with Enhanced UI
   */
  const FiltersSection = useMemo(
    () => (
      <Col gap={Spacing.md} style={{ paddingHorizontal: Spacing.md }}>
        {/* Search Bar */}
        <Searchbar
          placeholder="Search by name or email..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          accessibilityLabel="Search users"
          style={styles.searchbar}
          icon="magnify"
        />

        {/* Filters Row */}
        <Row spaceBetween centerV style={{ flexWrap: 'wrap' }}>
          <Row gap={Spacing.sm} style={{ flex: 1, flexWrap: 'wrap' }}>
            {/* Role Filter */}
            <Menu
              visible={roleMenuVisible}
              onDismiss={() => setRoleMenuVisible(false)}
              anchor={
                <Chip
                  onPress={() => setRoleMenuVisible(true)}
                  accessibilityLabel="Filter by role"
                  style={[
                    styles.filterChip,
                    roleFilter !== 'all' && styles.filterChipActive
                  ]}
                >
                  {roleFilter !== 'all' && <Icon name="check" size={16} color={Colors.primary} style={{ marginRight: 4 }} />}
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
              <Menu.Item onPress={() => handleStatusFilterChange('all')} title="All Status" />
              <Menu.Item onPress={() => handleStatusFilterChange('active')} title="Active" />
              <Menu.Item onPress={() => handleStatusFilterChange('suspended')} title="Suspended" />
            </Menu>
          </Row>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <UIButton
              variant="text"
              onPress={handleClearFilters}
              accessibilityLabel="Clear all filters"
              style={{ paddingHorizontal: Spacing.sm }}
            >
              Clear All
            </UIButton>
          )}
        </Row>
      </Col>
    ),
    [
      searchQuery,
      roleFilter,
      statusFilter,
      roleMenuVisible,
      statusMenuVisible,
      hasActiveFilters,
      handleSearchChange,
      handleRoleFilterChange,
      handleStatusFilterChange,
      handleClearFilters,
    ]
  );

  /**
   * Modern User Card Component with Avatar and Overflow Menu
   */
  const ModernUserCard = React.memo<{ user: User }>(({ user }) => {
    const isMenuOpen = userMenuVisible === user.id;
    const isMutating =
      suspendUserMutation.isPending ||
      unsuspendUserMutation.isPending ||
      deleteUserMutation.isPending ||
      resetPasswordMutation.isPending ||
      changeRoleMutation.isPending;

    return (
      <Card style={styles.userCard}>
        <CardContent>
          <Row spaceBetween centerV>
            {/* Left: Avatar + User Info */}
            <Row gap={Spacing.md} centerV style={{ flex: 1 }}>
              {/* Avatar with Initials */}
              <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(user.role) + '20' }]}>
                <T variant="body" weight="bold" style={{ color: getRoleBadgeColor(user.role) }}>
                  {getUserInitials(user.full_name)}
                </T>
              </View>

              {/* User Info */}
              <Col style={{ flex: 1 }}>
                <T variant="body" weight="semiBold" numberOfLines={1}>
                  {user.full_name}
                </T>
                <T variant="caption" color="textSecondary" numberOfLines={1}>
                  {user.email}
                </T>
                <Row gap={Spacing.xs} style={{ marginTop: Spacing.xs }}>
                  <T variant="caption" color="textSecondary">
                    {formatDate(user.updated_at)}
                  </T>
                </Row>
              </Col>
            </Row>

            {/* Right: Badges + Menu */}
            <Row gap={Spacing.xs} centerV>
              {/* Role Badge */}
              <Badge
                style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                accessibilityLabel={`Role: ${user.role}`}
              >
                {user.role}
              </Badge>

              {/* Status Badge */}
              <Badge
                style={{
                  backgroundColor: user.is_active ? Colors.success : Colors.error,
                }}
                accessibilityLabel={user.is_active ? 'Active' : 'Suspended'}
              >
                {user.is_active ? 'Active' : 'Suspended'}
              </Badge>

              {/* Overflow Menu */}
              <Menu
                visible={isMenuOpen}
                onDismiss={() => setUserMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="more-vert"
                    size={20}
                    onPress={() => setUserMenuVisible(user.id)}
                    accessibilityLabel={`Actions for ${user.full_name}`}
                    disabled={isMutating}
                  />
                }
              >
                {/* Primary Action: Suspend/Unsuspend */}
                {user.is_active ? (
                  <Menu.Item
                    onPress={() => handleSuspendUser(user.id, user.full_name)}
                    title="Suspend User"
                    leadingIcon="block"
                  />
                ) : (
                  <Menu.Item
                    onPress={() => handleUnsuspendUser(user.id, user.full_name)}
                    title="Unsuspend User"
                    leadingIcon="check-circle"
                  />
                )}

                {/* Secondary Actions */}
                <Menu.Item
                  onPress={() => handleResetPassword(user.id, user.email)}
                  title="Reset Password"
                  leadingIcon="lock-reset"
                />
                <Menu.Item
                  onPress={() => handleChangeRole(user)}
                  title="Change Role"
                  leadingIcon="swap-horiz"
                />
                <Menu.Item
                  onPress={() => handleDeleteUser(user.id, user.full_name)}
                  title="Delete User"
                  leadingIcon="delete"
                />
              </Menu>
            </Row>
          </Row>

          {/* Loading Indicator during Mutation */}
          {isMutating && userMenuVisible === user.id && (
            <View style={styles.loadingOverlay}>
              <T variant="caption" color="textSecondary">
                Processing...
              </T>
            </View>
          )}
        </CardContent>
      </Card>
    );
  });

  /**
   * Users List Component
   */
  const UsersList = useMemo(
    () => (
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ModernUserCard user={item} />}
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
              <Icon name="people-outline" size={64} color={Colors.textSecondary} style={{ opacity: 0.5 }} />
              <T variant="body1" color="textSecondary" align="center" style={{ marginTop: Spacing.md }}>
                No users found
              </T>
              <T variant="caption" color="textSecondary" align="center">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No users available'}
              </T>
              {hasActiveFilters && (
                <UIButton
                  variant="outlined"
                  onPress={handleClearFilters}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </UIButton>
              )}
            </View>
          )
        }
      />
    ),
    [users, isLoading, isRefetching, handleRefresh, hasActiveFilters, handleClearFilters]
  );

  // ============================================
  // RENDER
  // ============================================

  // Early return if no permission
  if (!can(currentRole, 'user_management')) {
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
          <T variant="h5" weight="bold">User Management</T>
          <T variant="body2" color="textSecondary">
            Manage users, roles, and permissions
          </T>
        </View>

        {/* Enhanced Stats Cards */}
        {EnhancedStatsCards}

        {/* Filters */}
        {FiltersSection}

        {/* Users List */}
        <View style={{ flex: 1 }}>{UsersList}</View>
      </Col>

      {/* Role Change Dialog */}
      <Portal>
        <Dialog visible={roleDialogVisible} onDismiss={() => {
          setRoleDialogVisible(false);
          setSelectedUser(null);
        }}>
          <Dialog.Title>Change User Role</Dialog.Title>
          <Dialog.Content>
            <T variant="body">
              Select a new role for {selectedUser?.full_name}:
            </T>
            <Col gap={Spacing.sm} style={{ marginTop: Spacing.md }}>
              {(['admin', 'teacher', 'student', 'parent'] as User['role'][])
                .filter(role => role !== selectedUser?.role)
                .map(role => (
                  <PaperButton
                    key={role}
                    mode="outlined"
                    onPress={() => confirmAndChangeRole(role)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </PaperButton>
                ))}
            </Col>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => {
              setRoleDialogVisible(false);
              setSelectedUser(null);
            }}>
              Cancel
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </BaseScreen>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Enhanced Stat Card Component with Icon
 */
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

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  searchbar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
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
    elevation: 3,
    borderRadius: 12,
  },
  userCard: {
    marginBottom: Spacing.md,
    elevation: 2,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  loadingOverlay: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
});

export default UserManagementScreenV3;
