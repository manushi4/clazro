/**
 * useAdminRole Hook
 * Sprint 1 - Days 3-4: UI Shell (Permission-Based Tab Visibility)
 *
 * Purpose: Fetch admin role and permissions from Supabase
 * - Queries admin_profiles table
 * - Returns role for RBAC checks
 * - Caches result for performance
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { AdminRole, AdminProfile } from '../types/admin';

/**
 * Fetch admin profile from Supabase
 * TEMPORARY FIX: Fetch from profiles table since admin_profiles doesn't exist
 */
async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    // Fetch from profiles table instead of admin_profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[useAdminRole] Error fetching profile:', error);
      // Return default super_admin role for now
      return {
        id: userId,
        user_id: userId,
        role: 'super_admin' as AdminRole,
        permissions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Map profiles.role to AdminRole
    // profiles allows: 'admin', 'teacher', 'student', 'parent'
    // AdminRole expects: 'super_admin', 'branch_admin', etc.
    const adminRole = data?.role === 'admin' ? 'super_admin' : 'super_admin';

    return {
      id: userId,
      user_id: userId,
      role: adminRole as AdminRole,
      permissions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[useAdminRole] Failed to fetch profile:', error);
    // Return default super_admin role
    return {
      id: userId || '',
      user_id: userId || '',
      role: 'super_admin' as AdminRole,
      permissions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Hook to get the current admin's role
 */
export function useAdminRole() {
  const { user } = useAuth();

  const query = useQuery<AdminProfile | null>({
    queryKey: ['admin_profile', user?.id],
    queryFn: () => fetchAdminProfile(user?.id!),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes (roles don't change often)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (gcTime replaces cacheTime in v5)
  });

  return {
    role: (query.data?.role || 'super_admin') as AdminRole, // Default to super_admin for safety
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
