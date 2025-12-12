/**
 * User Permissions Query
 * 
 * Fetches user permissions from Supabase using the get_user_permissions function.
 * Supports role-based permissions with customer and user-level overrides.
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../lib/supabaseClient';
import { useDemoUser } from '../useDemoUser';
import type { PermissionCode } from '../../types/permission.types';

type UserPermissionsResult = {
  permissions: PermissionCode[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Fetch user permissions from database
 */
const fetchUserPermissions = async (
  userId: string,
  customerId: string,
  role: string
): Promise<PermissionCode[]> => {
  const supabase = getSupabaseClient();

  // Call the get_user_permissions function
  const { data, error } = await supabase.rpc('get_user_permissions', {
    p_user_id: userId,
    p_customer_id: customerId,
    p_role: role,
  });

  if (error) {
    console.error('[useUserPermissionsQuery] Error fetching permissions:', error);
    throw error;
  }

  return (data as PermissionCode[]) || [];
};

/**
 * Hook to fetch user permissions from database
 * 
 * @example
 * const { permissions, isLoading } = useUserPermissionsQuery();
 */
export const useUserPermissionsQuery = (): UserPermissionsResult => {
  const { userId, role, customerSlug } = useDemoUser();
  const customerId = DEMO_CUSTOMER_ID;

  const {
    data: permissions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-permissions', userId, customerId, role],
    queryFn: () => fetchUserPermissions(userId, customerId, role),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });

  return {
    permissions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Check a single permission via database
 */
export const useCheckPermissionQuery = (permission: PermissionCode) => {
  const { userId, role } = useDemoUser();
  const customerId = DEMO_CUSTOMER_ID;

  const { data: hasPermission = false, isLoading } = useQuery({
    queryKey: ['check-permission', userId, customerId, role, permission],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('check_user_permission', {
        p_user_id: userId,
        p_customer_id: customerId,
        p_role: role,
        p_permission: permission,
      });

      if (error) {
        console.error('[useCheckPermissionQuery] Error:', error);
        return false;
      }

      return data as boolean;
    },
    staleTime: 1000 * 60 * 5,
  });

  return { hasPermission, isLoading };
};

export default useUserPermissionsQuery;
