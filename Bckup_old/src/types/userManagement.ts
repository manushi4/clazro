/**
 * User Management Data Contracts - Phase 1
 * Production-grade types and Zod schemas for user management
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { z } from 'zod';

/**
 * User Status Types
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * User Role Types
 */
export type UserRoleType = 'parent' | 'teacher' | 'student' | 'admin' | 'staff';

/**
 * User Type (from Supabase users table + profiles)
 */
export interface User {
  id: string;
  email: string;
  role: UserRoleType;
  status: UserStatus;
  created_at: string;
  last_login?: string;

  // Profile data
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image_url?: string;

  // Metadata
  email_verified?: boolean;
  phone_verified?: boolean;
}

/**
 * User List Item (optimized for list view)
 */
export interface UserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRoleType;
  status: UserStatus;
  created_at: string;
  last_login?: string;
}

/**
 * User Details (full user data for detail view)
 */
export interface UserDetails extends User {
  // Additional details not needed in list
  address?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  notes?: string;
}

/**
 * User Query Filters
 */
export interface UserQueryFilters {
  role?: UserRoleType;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * User Query Result (with pagination)
 */
export interface UserQueryResult {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * User Action Payloads
 */
export interface SuspendUserPayload {
  userId: string;
  reason: string;
}

export interface UnsuspendUserPayload {
  userId: string;
}

export interface DeleteUserPayload {
  userId: string;
}

export interface ResetPasswordPayload {
  userId: string;
  email: string;
}

export interface ChangeRolePayload {
  userId: string;
  newRole: UserRoleType;
}

/**
 * Zod Schemas for Validation
 */

export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const UserRoleSchema = z.enum(['parent', 'teacher', 'student', 'admin', 'staff']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  created_at: z.string().datetime(),
  last_login: z.string().datetime().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  profile_image_url: z.string().url().optional(),
  email_verified: z.boolean().optional(),
  phone_verified: z.boolean().optional(),
});

export const UserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  created_at: z.string().datetime(),
  last_login: z.string().datetime().optional(),
});

export const UserQueryFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const SuspendUserPayloadSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const ChangeRolePayloadSchema = z.object({
  userId: z.string().uuid(),
  newRole: UserRoleSchema,
});

/**
 * Query Keys (for React Query)
 */
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: UserQueryFilters) => [...userQueryKeys.lists(), filters] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
};

/**
 * Helper Functions
 */

export function getUserFullName(user: UserListItem | User): string {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.email.split('@')[0];
}

export function getUserStatusLabel(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  };
  return labels[status];
}

export function getUserRoleLabel(role: UserRoleType): string {
  const labels: Record<UserRoleType, string> = {
    parent: 'Parent',
    teacher: 'Teacher',
    student: 'Student',
    admin: 'Admin',
    staff: 'Staff',
  };
  return labels[role];
}

export function getUserStatusColor(status: UserStatus): string {
  const colors: Record<UserStatus, string> = {
    active: '#10B981',      // Green
    inactive: '#6B7280',    // Gray
    suspended: '#EF4444',   // Red
  };
  return colors[status];
}
