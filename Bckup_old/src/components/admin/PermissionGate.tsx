/**
 * PermissionGate Component - v1.0
 *
 * Conditional rendering wrapper for RBAC enforcement at component level
 * Part of ADMIN_IMPLEMENTATION_STRATEGY.md Phase 0
 *
 * Features:
 * - Conditionally render children based on admin permissions
 * - Support for single or multiple permissions (ANY/ALL logic)
 * - Optional fallback UI for access denied
 * - Automatic navigation to AccessDeniedScreen if specified
 * - TypeScript strict mode compliance
 *
 * Usage:
 * ```tsx
 * // Single permission check
 * <PermissionGate permission="manage_users">
 *   <Button onPress={deleteUser}>Delete User</Button>
 * </PermissionGate>
 *
 * // Multiple permissions (ANY)
 * <PermissionGate permissions={['manage_users', 'suspend_accounts']} mode="any">
 *   <Button>Suspend Account</Button>
 * </PermissionGate>
 *
 * // Multiple permissions (ALL)
 * <PermissionGate permissions={['manage_security', 'manage_users']} mode="all">
 *   <Button>Change User Role</Button>
 * </PermissionGate>
 *
 * // With custom fallback
 * <PermissionGate permission="export_data" fallback={<Text>Access Denied</Text>}>
 *   <Button>Export Report</Button>
 * </PermissionGate>
 *
 * // Navigate to AccessDeniedScreen
 * <PermissionGate
 *   permission="manage_users"
 *   navigateOnDenied
 *   requiredAction="User Management"
 * >
 *   <UserManagementScreen />
 * </PermissionGate>
 * ```
 */

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  can,
  canAny,
  canAll,
  AdminRole,
  AdminPermission
} from '../../utils/adminPermissions';
import { useNavigation } from '@react-navigation/native';

export interface PermissionGateProps {
  /**
   * Single permission to check (use this OR permissions, not both)
   */
  permission?: AdminPermission;

  /**
   * Multiple permissions to check (use this OR permission, not both)
   */
  permissions?: AdminPermission[];

  /**
   * How to combine multiple permissions
   * - "any": User needs at least one permission (OR logic)
   * - "all": User needs all permissions (AND logic)
   * @default "any"
   */
  mode?: 'any' | 'all';

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback UI when access is denied
   * If not provided, returns null (hides content)
   */
  fallback?: ReactNode;

  /**
   * If true, navigate to AccessDeniedScreen when access is denied
   * Requires `requiredAction` prop to describe what was attempted
   */
  navigateOnDenied?: boolean;

  /**
   * Description of the attempted action for AccessDeniedScreen
   * Only used when navigateOnDenied=true
   */
  requiredAction?: string;
}

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on admin RBAC permissions.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  mode = 'any',
  children,
  fallback = null,
  navigateOnDenied = false,
  requiredAction,
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Get admin role from user metadata
  const adminRole = (user?.user_metadata?.role || user?.user_metadata?.admin_role) as AdminRole | undefined;

  // Validate props
  if (!permission && !permissions) {
    console.error('❌ [PermissionGate] Either permission or permissions prop is required');
    return <>{fallback}</>;
  }

  if (permission && permissions) {
    console.error('❌ [PermissionGate] Cannot use both permission and permissions props');
    return <>{fallback}</>;
  }

  // Check permission(s)
  let hasAccess = false;

  if (permission) {
    // Single permission check
    hasAccess = can(adminRole, permission);
  } else if (permissions) {
    // Multiple permissions check
    hasAccess = mode === 'all'
      ? canAll(adminRole, permissions)
      : canAny(adminRole, permissions);
  }

  // Handle access denied with navigation
  useEffect(() => {
    if (!hasAccess && navigateOnDenied) {
      const requiredPermission = permission || (permissions && permissions[0]);

      if (requiredPermission) {
        // @ts-ignore - Navigation typing
        navigation.navigate('AccessDeniedScreen', {
          requiredPermission,
          userRole: adminRole,
          attemptedAction: requiredAction || 'Unknown Action',
        });
      }
    }
  }, [hasAccess, navigateOnDenied, permission, permissions, adminRole, requiredAction, navigation]);

  // Log access check in development
  if (__DEV__) {
    const permStr = permission || (permissions?.join(', '));
    console.log(
      `🔐 [PermissionGate] Role: ${adminRole || 'none'}, ` +
      `Required: ${permStr}, ` +
      `Mode: ${mode}, ` +
      `Access: ${hasAccess ? 'GRANTED' : 'DENIED'}`
    );
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Hook version of PermissionGate for imperative checks
 *
 * Usage:
 * ```tsx
 * const { hasPermission, adminRole } = usePermissionGate();
 *
 * if (hasPermission('manage_users')) {
 *   // Show delete button
 * }
 * ```
 */
export function usePermissionGate() {
  const { user } = useAuth();
  const adminRole = (user?.user_metadata?.role || user?.user_metadata?.admin_role) as AdminRole | undefined;

  return {
    adminRole,
    hasPermission: (permission: AdminPermission) => can(adminRole, permission),
    hasAnyPermission: (permissions: AdminPermission[]) => canAny(adminRole, permissions),
    hasAllPermissions: (permissions: AdminPermission[]) => canAll(adminRole, permissions),
  };
}
