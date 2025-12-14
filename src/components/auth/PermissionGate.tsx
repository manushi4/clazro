/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user permissions.
 * Provides declarative permission checking in JSX.
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="assignments.edit">
 *   <EditButton />
 * </PermissionGate>
 * 
 * // Multiple permissions (all required)
 * <PermissionGate permissions={['assignments.view', 'assignments.edit']} requireAll>
 *   <ManagePanel />
 * </PermissionGate>
 * 
 * // Multiple permissions (any one)
 * <PermissionGate permissions={['teacher', 'admin']} requireAll={false}>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * // With fallback
 * <PermissionGate permission="premium.access" fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </PermissionGate>
 * 
 * // Role-based
 * <PermissionGate roles={['teacher', 'admin']}>
 *   <TeacherDashboard />
 * </PermissionGate>
 */

import React, { ReactNode } from 'react';
import { 
  useHasPermission, 
  useHasAllPermissions, 
  useHasAnyPermission,
  useHasRole 
} from '../../hooks/usePermissions';
import type { PermissionCode, Role } from '../../types/permission.types';

type PermissionGateProps = {
  /** Single permission to check */
  permission?: PermissionCode;
  /** Multiple permissions to check */
  permissions?: PermissionCode[];
  /** If true, all permissions required. If false, any one permission. Default: true */
  requireAll?: boolean;
  /** Allowed roles (alternative to permission check) */
  roles?: Role[];
  /** Content to render if permission check passes */
  children: ReactNode;
  /** Content to render if permission check fails */
  fallback?: ReactNode;
};

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = true,
  roles,
  children,
  fallback = null,
}) => {
  // Single permission check
  const hasSinglePermission = useHasPermission(permission || '');
  
  // Multiple permissions check
  const hasAllPermissions = useHasAllPermissions(permissions || []);
  const hasAnyPermission = useHasAnyPermission(permissions || []);
  
  // Role check
  const hasRole = useHasRole(roles || []);

  // Determine if access is granted
  let hasAccess = false;

  if (roles && roles.length > 0) {
    // Role-based check
    hasAccess = hasRole;
  } else if (permission) {
    // Single permission check
    hasAccess = hasSinglePermission;
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    hasAccess = requireAll ? hasAllPermissions : hasAnyPermission;
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return <>{hasAccess ? children : fallback}</>;
};

/**
 * RoleGate Component
 * 
 * Simplified gate for role-based access control.
 * 
 * @example
 * <RoleGate roles={['teacher', 'admin']}>
 *   <AdminPanel />
 * </RoleGate>
 */
type RoleGateProps = {
  /** Allowed roles */
  roles: Role | Role[];
  /** Content to render if role check passes */
  children: ReactNode;
  /** Content to render if role check fails */
  fallback?: ReactNode;
};

export const RoleGate: React.FC<RoleGateProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const hasRole = useHasRole(roles);
  return <>{hasRole ? children : fallback}</>;
};

/**
 * useCanAccess Hook
 * 
 * Programmatic permission checking for complex logic.
 * 
 * @example
 * const { canView, canEdit, canDelete } = useCanAccess({
 *   canView: 'assignments.view',
 *   canEdit: 'assignments.edit',
 *   canDelete: 'assignments.delete',
 * });
 */
export function useCanAccess<T extends Record<string, PermissionCode>>(
  permissionMap: T
): Record<keyof T, boolean> {
  const { hasPermission } = require('../../hooks/usePermissions').usePermissions();
  
  const result = {} as Record<keyof T, boolean>;
  for (const key in permissionMap) {
    result[key] = hasPermission(permissionMap[key]);
  }
  return result;
}

export default PermissionGate;
