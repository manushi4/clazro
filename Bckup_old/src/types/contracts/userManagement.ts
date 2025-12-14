/**
 * User Management Data Contract - Sprint 1-2
 *
 * Purpose: Lock query interface for user list, filters, and mutations
 * - Keyset pagination support
 * - Filter definitions
 * - Mutation interfaces
 */

import { z } from 'zod';

/**
 * User Status Types
 */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * User Role Types
 */
export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

/**
 * User List Item (for table/list view)
 */
export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  branch_id: string | null;
  branch_name: string | null;
  created_at: string;
  last_active: string | null;
}

/**
 * User List Filters
 */
export interface UserListFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  branch_id?: string;
  limit: number;
  cursor?: string; // for keyset pagination (created_at)
  cursor_id?: string; // for keyset pagination (id)
}

/**
 * User List Response (with keyset pagination)
 */
export interface UserListResponse {
  users: UserListItem[];
  nextCursor: {
    cursor: string;
    cursor_id: string;
  } | null;
  hasMore: boolean;
  totalCount?: number; // optional total count
}

/**
 * User Detail (full profile)
 */
export interface UserDetail extends UserListItem {
  phone: string | null;
  address: string | null;
  metadata: Record<string, any> | null;
  updated_at: string;
}

/**
 * User Mutation Inputs
 */

export interface SuspendUserInput {
  user_id: string;
  reason: string;
  admin_id: string;
  correlation_id?: string;
}

export interface UnsuspendUserInput {
  user_id: string;
  reason: string;
  admin_id: string;
  correlation_id?: string;
}

export interface DeleteUserInput {
  user_id: string;
  reason: string;
  confirmation: string; // must match user email
  admin_id: string;
  correlation_id?: string;
}

export interface ResetPasswordInput {
  user_id: string;
  admin_id: string;
  correlation_id?: string;
}

export interface ChangeRoleInput {
  user_id: string;
  new_role: UserRole;
  reason: string;
  admin_id: string;
  correlation_id?: string;
}

/**
 * Mutation Response
 */
export interface UserMutationResponse {
  success: boolean;
  correlation_id: string;
  message?: string;
}

/**
 * Zod Schemas for validation
 */

export const UserStatusSchema = z.enum(['active', 'suspended', 'deleted']);
export const UserRoleSchema = z.enum(['student', 'parent', 'teacher', 'admin']);

export const UserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  branch_id: z.string().uuid().nullable(),
  branch_name: z.string().nullable(),
  created_at: z.string().datetime(),
  last_active: z.string().datetime().nullable(),
});

export const UserListFiltersSchema = z.object({
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  branch_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100),
  cursor: z.string().optional(),
  cursor_id: z.string().uuid().optional(),
});

export const SuspendUserInputSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  admin_id: z.string().uuid(),
  correlation_id: z.string().uuid().optional(),
});

/**
 * Query Keys for React Query
 */
export const userQueryKeys = {
  all: ['users'] as const,
  list: (filters: UserListFilters) => [...userQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...userQueryKeys.all, 'detail', id] as const,
  search: (query: string) => [...userQueryKeys.all, 'search', query] as const,
} as const;

/**
 * Stale Time Configuration
 */
export const userStaleTime = {
  list: 30 * 1000, // 30 seconds
  detail: 60 * 1000, // 1 minute
  search: 10 * 1000, // 10 seconds (more frequent for search)
} as const;

/**
 * Placeholder data
 */
export const userListPlaceholder: UserListResponse = {
  users: [],
  nextCursor: null,
  hasMore: false,
};
