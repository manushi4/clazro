/**
 * Permission Hooks
 * 
 * Provides hooks for checking user permissions.
 * Fetches permissions from Supabase database with fallback to config.
 * 
 * @example
 * // Check single permission
 * const canViewAssignments = useHasPermission('assignments.view');
 * 
 * // Check multiple permissions (all required)
 * const canManage = useHasAllPermissions(['assignments.view', 'assignments.edit']);
 * 
 * // Check multiple permissions (any one)
 * const canAccess = useHasAnyPermission(['assignments.view', 'tests.view']);
 * 
 * // Get all permissions for current role
 * const { permissions, hasPermission } = usePermissions();
 */

import { useMemo, useCallback } from 'react';
import { useConfigStore } from '../stores/configStore';
import { useDemoUser } from './useDemoUser';
import { PermissionService } from '../services/config/permissionService';
import { useUserPermissionsQuery } from './queries/useUserPermissionsQuery';
import type { PermissionCode, Role } from '../types/permission.types';

/**
 * Get all permissions and permission checking utilities for current user
 * Fetches from database with fallback to config-based permissions
 */
export function usePermissions() {
  const { config } = useConfigStore();
  const { role } = useDemoUser();
  
  // Fetch permissions from database
  const { permissions: dbPermissions, isLoading, error } = useUserPermissionsQuery();

  // Fallback to config-based permissions if DB fetch fails or is loading
  const configPermissions = useMemo(() => {
    if (!config) return [];
    const permissionSet = PermissionService.getPermissionSet(config, role);
    return permissionSet?.permissions || [];
  }, [config, role]);

  // Use DB permissions if available, otherwise fallback to config
  const permissions = useMemo(() => {
    if (dbPermissions.length > 0) return dbPermissions;
    return configPermissions;
  }, [dbPermissions, configPermissions]);

  const hasPermission = useCallback(
    (permission: PermissionCode): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: PermissionCode[]): boolean => {
      return requiredPermissions.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: PermissionCode[]): boolean => {
      return requiredPermissions.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  return {
    /** Current user's role */
    role,
    /** Array of all permission codes for current role */
    permissions,
    /** Check if user has a specific permission */
    hasPermission,
    /** Check if user has ALL of the specified permissions */
    hasAllPermissions,
    /** Check if user has ANY of the specified permissions */
    hasAnyPermission,
    /** Whether permissions are being loaded from DB */
    isLoading,
    /** Whether permissions came from database (vs config fallback) */
    isFromDatabase: dbPermissions.length > 0,
    /** Error if DB fetch failed */
    error,
  };
}

/**
 * Check if current user has a specific permission
 * Uses database permissions with config fallback
 * @param permission - Permission code to check
 * @returns boolean - true if user has permission
 * 
 * @example
 * const canEdit = useHasPermission('assignments.edit');
 * if (!canEdit) return <NoAccessMessage />;
 */
export function useHasPermission(permission: PermissionCode): boolean {
  const { permissions } = usePermissions();
  return permissions.includes(permission);
}

/**
 * Check if current user has ALL of the specified permissions
 * @param requiredPermissions - Array of permission codes (all required)
 * @returns boolean - true if user has all permissions
 * 
 * @example
 * const canManageAssignments = useHasAllPermissions(['assignments.view', 'assignments.edit', 'assignments.delete']);
 */
export function useHasAllPermissions(requiredPermissions: PermissionCode[]): boolean {
  const { permissions } = usePermissions();
  if (requiredPermissions.length === 0) return false;
  return requiredPermissions.every((p) => permissions.includes(p));
}

/**
 * Check if current user has ANY of the specified permissions
 * @param requiredPermissions - Array of permission codes (any one required)
 * @returns boolean - true if user has at least one permission
 * 
 * @example
 * const canAccessStudy = useHasAnyPermission(['assignments.view', 'tests.view', 'library.view']);
 */
export function useHasAnyPermission(requiredPermissions: PermissionCode[]): boolean {
  const { permissions } = usePermissions();
  if (requiredPermissions.length === 0) return false;
  return requiredPermissions.some((p) => permissions.includes(p));
}

/**
 * Check if current user has a specific role
 * @param allowedRoles - Role or array of roles to check
 * @returns boolean - true if user has one of the allowed roles
 * 
 * @example
 * const isTeacherOrAdmin = useHasRole(['teacher', 'admin']);
 */
export function useHasRole(allowedRoles: Role | Role[]): boolean {
  const { role } = useDemoUser();
  
  return useMemo(() => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(role);
  }, [role, allowedRoles]);
}

/**
 * Get current user's role
 * @returns Role - current user's role
 */
export function useCurrentRole(): Role {
  const { role } = useDemoUser();
  return role;
}

// ============================================
// Permission Constants (common permission codes)
// ============================================

export const PERMISSIONS = {
  // Feature viewing
  FEATURE_VIEW: 'feature.view',
  FEATURE_MANAGE: 'feature.manage',
  
  // Assignments
  ASSIGNMENTS_VIEW: 'assignments.view',
  ASSIGNMENTS_CREATE: 'assignments.create',
  ASSIGNMENTS_EDIT: 'assignments.edit',
  ASSIGNMENTS_DELETE: 'assignments.delete',
  ASSIGNMENTS_MANAGE: 'assignments.manage',
  
  // Tests
  TESTS_VIEW: 'tests.view',
  TESTS_CREATE: 'tests.create',
  TESTS_MANAGE: 'tests.manage',
  
  // Doubts
  DOUBTS_VIEW: 'doubts.view',
  DOUBTS_CREATE: 'doubts.create',
  DOUBTS_RESPOND: 'doubts.respond',
  
  // AI Tutor
  AI_TUTOR_USE: 'ai.tutor.use',
  
  // Progress
  PROGRESS_VIEW: 'progress.view',
  PROGRESS_VIEW_ALL: 'progress.view.all',
  
  // Schedule
  SCHEDULE_VIEW: 'schedule.view',
  SCHEDULE_MANAGE: 'schedule.manage',
  
  // Live Class
  LIVECLASS_JOIN: 'liveclass.join',
  LIVECLASS_HOST: 'liveclass.host',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // Config/Admin
  CONFIG_VIEW: 'config.view',
  CONFIG_MANAGE: 'config.manage',
  THEME_MANAGE: 'theme.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
