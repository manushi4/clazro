/**
 * User Management React Query Hooks - Phase 1
 * Production-grade hooks for user CRUD operations
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  User,
  UserListItem,
  UserQueryFilters,
  UserQueryResult,
  UserDetails,
  SuspendUserPayload,
  UnsuspendUserPayload,
  DeleteUserPayload,
  ResetPasswordPayload,
  ChangeRolePayload,
  userQueryKeys,
  UserStatus,
  UserRoleType,
} from '../types/userManagement';
import { logAudit } from '../utils/auditLogger';

/**
 * Fetch users list with filters and pagination
 */
export function useUsersList(filters: UserQueryFilters = {}) {
  return useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: async (): Promise<UserQueryResult> => {
      const {
        role,
        status,
        search,
        page = 1,
        limit = 20,
      } = filters;

      console.log('📊 [useUsersList] Fetching users:', filters);

      // Build query
      let query = supabase
        .from('users')
        .select('id, email, raw_user_meta_data, created_at, last_sign_in_at', { count: 'exact' });

      // Apply filters
      if (role) {
        query = query.eq('raw_user_meta_data->>role', role);
      }

      if (status) {
        query = query.eq('raw_user_meta_data->>status', status);
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Sort by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ [useUsersList] Error:', error);
        throw error;
      }

      // Transform to UserListItem format
      const users: UserListItem[] = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.raw_user_meta_data?.first_name,
        last_name: user.raw_user_meta_data?.last_name,
        role: (user.raw_user_meta_data?.role || 'parent') as UserRoleType,
        status: (user.raw_user_meta_data?.status || 'active') as UserStatus,
        created_at: user.created_at,
        last_login: user.last_sign_in_at,
      }));

      const total = count || 0;
      const hasMore = total > page * limit;

      console.log(`✅ [useUsersList] Fetched ${users.length}/${total} users`);

      return {
        users,
        total,
        page,
        limit,
        hasMore,
      };
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch single user details
 */
export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: async (): Promise<UserDetails> => {
      console.log('📊 [useUserDetails] Fetching user:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [useUserDetails] Error:', error);
        throw error;
      }

      // Transform to UserDetails format
      const user: UserDetails = {
        id: data.id,
        email: data.email,
        role: (data.raw_user_meta_data?.role || 'parent') as UserRoleType,
        status: (data.raw_user_meta_data?.status || 'active') as UserStatus,
        created_at: data.created_at,
        last_login: data.last_sign_in_at,
        first_name: data.raw_user_meta_data?.first_name,
        last_name: data.raw_user_meta_data?.last_name,
        phone_number: data.raw_user_meta_data?.phone_number,
        profile_image_url: data.raw_user_meta_data?.profile_image_url,
        email_verified: data.email_confirmed_at != null,
      };

      console.log('✅ [useUserDetails] Fetched user details');

      return user;
    },
    enabled: !!userId,
  });
}

/**
 * Suspend user mutation
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SuspendUserPayload) => {
      console.log('🔒 [useSuspendUser] Suspending user:', payload.userId);

      // Update user metadata to set status = 'suspended'
      const { data, error } = await supabase.auth.admin.updateUserById(
        payload.userId,
        {
          user_metadata: {
            status: 'suspended',
            suspended_reason: payload.reason,
            suspended_at: new Date().toISOString(),
          },
        }
      );

      if (error) {
        console.error('❌ [useSuspendUser] Error:', error);
        throw error;
      }

      // Log audit
      await logAudit({
        action: 'suspend_user',
        targetId: payload.userId,
        targetType: 'user',
        metadata: { reason: payload.reason },
      });

      console.log('✅ [useSuspendUser] User suspended');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
}

/**
 * Unsuspend user mutation
 */
export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UnsuspendUserPayload) => {
      console.log('🔓 [useUnsuspendUser] Unsuspending user:', payload.userId);

      // Update user metadata to set status = 'active'
      const { data, error } = await supabase.auth.admin.updateUserById(
        payload.userId,
        {
          user_metadata: {
            status: 'active',
            unsuspended_at: new Date().toISOString(),
          },
        }
      );

      if (error) {
        console.error('❌ [useUnsuspendUser] Error:', error);
        throw error;
      }

      // Log audit
      await logAudit({
        action: 'unsuspend_user',
        targetId: payload.userId,
        targetType: 'user',
      });

      console.log('✅ [useUnsuspendUser] User unsuspended');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DeleteUserPayload) => {
      console.log('🗑️ [useDeleteUser] Deleting user:', payload.userId);

      // Delete user via Supabase Admin API
      const { error } = await supabase.auth.admin.deleteUser(payload.userId);

      if (error) {
        console.error('❌ [useDeleteUser] Error:', error);
        throw error;
      }

      // Log audit
      await logAudit({
        action: 'delete_user',
        targetId: payload.userId,
        targetType: 'user',
      });

      console.log('✅ [useDeleteUser] User deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      console.log('🔑 [useResetPassword] Resetting password for:', payload.email);

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(payload.email);

      if (error) {
        console.error('❌ [useResetPassword] Error:', error);
        throw error;
      }

      // Log audit
      await logAudit({
        action: 'reset_password',
        targetId: payload.userId,
        targetType: 'user',
        metadata: { email: payload.email },
      });

      console.log('✅ [useResetPassword] Password reset email sent');
    },
  });
}

/**
 * Change role mutation
 */
export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChangeRolePayload) => {
      console.log('👤 [useChangeRole] Changing role:', payload);

      // Update user metadata to change role
      const { data, error } = await supabase.auth.admin.updateUserById(
        payload.userId,
        {
          user_metadata: {
            role: payload.newRole,
          },
        }
      );

      if (error) {
        console.error('❌ [useChangeRole] Error:', error);
        throw error;
      }

      // Log audit
      await logAudit({
        action: 'change_role',
        targetId: payload.userId,
        targetType: 'user',
        changes: {
          role: { to: payload.newRole },
        },
      });

      console.log('✅ [useChangeRole] Role changed');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
}
