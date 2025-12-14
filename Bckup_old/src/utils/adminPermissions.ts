import type { AdminRole, AdminPermission } from '../types/admin';

/**
 * Admin permission constants
 */
export const ADMIN_PERMISSIONS = {
  USER_MANAGEMENT: 'user_management' as AdminPermission,
  FEE_MANAGEMENT: 'fee_management' as AdminPermission,
  SYSTEM_SETTINGS: 'system_settings' as AdminPermission,
  ANALYTICS_VIEW: 'analytics_view' as AdminPermission,
  AUDIT_LOGS_VIEW: 'audit_logs_view' as AdminPermission,
  ANNOUNCEMENTS: 'announcements' as AdminPermission,
  BULK_OPERATIONS: 'bulk_operations' as AdminPermission,
  COMPLIANCE_REPORTS: 'compliance_reports' as AdminPermission,
};

/**
 * Role-based permission mapping
 * Maps each admin role to their allowed permissions
 */
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    ADMIN_PERMISSIONS.USER_MANAGEMENT,
    ADMIN_PERMISSIONS.FEE_MANAGEMENT,
    ADMIN_PERMISSIONS.SYSTEM_SETTINGS,
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
    ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW,
    ADMIN_PERMISSIONS.ANNOUNCEMENTS,
    ADMIN_PERMISSIONS.BULK_OPERATIONS,
    ADMIN_PERMISSIONS.COMPLIANCE_REPORTS,
  ],
  branch_admin: [
    ADMIN_PERMISSIONS.USER_MANAGEMENT,
    ADMIN_PERMISSIONS.FEE_MANAGEMENT,
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
    ADMIN_PERMISSIONS.ANNOUNCEMENTS,
  ],
  finance_admin: [
    ADMIN_PERMISSIONS.FEE_MANAGEMENT,
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
  ],
  academic_coordinator: [
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
    ADMIN_PERMISSIONS.ANNOUNCEMENTS,
  ],
  compliance_admin: [
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
    ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW,
    ADMIN_PERMISSIONS.COMPLIANCE_REPORTS,
  ],
};

/**
 * Check if an admin role has a specific permission
 * @param role - Admin role to check
 * @param permission - Permission to verify
 * @returns true if role has permission, false otherwise
 */
export const hasPermission = (
  role: AdminRole,
  permission: AdminPermission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission);
};

/**
 * Verify permission and throw error if not authorized
 * @param role - Admin role to check
 * @param permission - Permission to verify
 * @throws Error if permission not granted
 */
export const checkPermission = (
  role: AdminRole,
  permission: AdminPermission
): void => {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `Insufficient permissions: ${role} does not have ${permission}`
    );
  }
};

/**
 * Get all permissions for a role
 * @param role - Admin role
 * @returns Array of permissions for the role
 */
export const getRolePermissions = (role: AdminRole): AdminPermission[] => {
  return ROLE_PERMISSIONS[role];
};

/**
 * Alias for hasPermission - shorter syntax for RBAC checks
 * @param role - Admin role to check
 * @param permission - Permission to verify (can use string for flexibility)
 * @returns true if role has permission, false otherwise
 */
export const can = (
  role: AdminRole,
  permission: string
): boolean => {
  // Guard: if role is undefined or invalid, return false
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }

  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission as AdminPermission);
};
