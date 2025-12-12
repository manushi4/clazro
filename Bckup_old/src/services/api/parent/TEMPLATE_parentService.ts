/**
 * ============================================================================
 * PARENT SERVICE - COMPLETE TEMPLATE WITH BEST PRACTICES
 * ============================================================================
 *
 * This file demonstrates best practices for creating API service functions
 * that interact with Supabase. Use this as a reference template when creating
 * other service modules (academic, financial, insights, communications, actionItems).
 *
 * KEY CONCEPTS:
 * 1. Each function is a simple async function that returns a Promise
 * 2. Functions use the Supabase client for database operations
 * 3. Error handling is centralized using the errorHandler module
 * 4. TypeScript types ensure type safety throughout
 * 5. Functions are pure and focused on a single responsibility
 * 6. Retry logic is applied to read operations for resilience
 *
 * PATTERN OVERVIEW:
 * - Simple queries: Use .select() with filters
 * - Complex queries: Use RPC functions or joins
 * - Mutations: Use .insert(), .update(), .delete()
 * - Filtering: Use Supabase query methods (.eq, .in, .gte, etc.)
 * - Pagination: Use .range() or limit/offset
 * - Ordering: Use .order()
 *
 * @module parentService
 */

import { supabase } from '../../supabase/client';
import {
  parseSupabaseError,
  retryWithBackoff,
  NotFoundError,
  ValidationError,
} from '../errorHandler';
import type {
  Parent,
  ParentDashboardSummary,
  ChildInfo,
  ParentChildRelationship,
  NotificationChannel,
} from '../../../types/supabase-parent.types';

// ============================================================================
// SIMPLE READ OPERATIONS
// ============================================================================

/**
 * Pattern 1: Simple Single Record Query
 *
 * This is the most basic pattern - fetch a single record by ID.
 *
 * KEY POINTS:
 * - Use .single() when you expect exactly one result
 * - Use retryWithBackoff() for resilience against transient failures
 * - Throw NotFoundError when data is null for better error handling
 * - Always parse errors using parseSupabaseError()
 *
 * @param parentId - The unique identifier for the parent
 * @returns Promise resolving to the parent profile
 * @throws {NotFoundError} When parent profile doesn't exist
 * @throws {APIError} For database or network errors
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await getParentProfile('PARENT_123');
 *   console.log('Parent name:', profile.parent_id);
 * } catch (error) {
 *   if (error instanceof NotFoundError) {
 *     console.log('Parent not found');
 *   }
 * }
 * ```
 */
export async function getParentProfile(parentId: string): Promise<Parent> {
  try {
    // retryWithBackoff automatically retries on network/transient errors
    // Default: 3 retries with exponential backoff (1s, 2s, 4s)
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('parents') // Table name
        .select('*') // Select all columns (or specify specific columns)
        .eq('parent_id', parentId) // WHERE parent_id = parentId
        .single(); // Expect exactly one result
    });

    // Check for database errors
    if (error) throw parseSupabaseError(error);

    // Check for null data (shouldn't happen with .single() but good practice)
    if (!data) throw new NotFoundError('Parent profile not found');

    return data;
  } catch (error) {
    // Re-parse and re-throw to ensure consistent error handling
    throw parseSupabaseError(error);
  }
}

/**
 * Pattern 2: Simple List Query with Filtering
 *
 * Fetch multiple records with filtering and ordering.
 *
 * KEY POINTS:
 * - Use .select() without .single() for multiple results
 * - Apply filters using .eq(), .in(), .gte(), .lte(), etc.
 * - Use .order() for sorting
 * - Return empty array if no data (not null)
 * - Use retryWithBackoff for read operations
 *
 * @param parentId - The parent ID to filter by
 * @returns Promise resolving to array of child relationships
 * @throws {APIError} For database or network errors
 *
 * @example
 * ```typescript
 * const children = await getParentChildRelationships('PARENT_123');
 * console.log(`Parent has ${children.length} children`);
 * children.forEach(child => {
 *   if (child.is_primary_contact) {
 *     console.log('Primary contact for:', child.student_id);
 *   }
 * });
 * ```
 */
export async function getParentChildRelationships(
  parentId: string
): Promise<ParentChildRelationship[]> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('parent_child_relationships')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true) // Additional filter
        .order('created_at', { ascending: false }); // Order by most recent
    });

    if (error) throw parseSupabaseError(error);

    // Return empty array if no data (IMPORTANT: don't return null)
    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// COMPLEX READ OPERATIONS (RPC FUNCTIONS)
// ============================================================================

/**
 * Pattern 3: RPC Function Call
 *
 * For complex queries that involve joins, aggregations, or custom logic,
 * use Supabase RPC functions (stored procedures/functions in PostgreSQL).
 *
 * WHY USE RPC?
 * - Complex joins across multiple tables
 * - Aggregations and calculations
 * - Business logic that's better in the database
 * - Performance optimization (single round trip)
 *
 * KEY POINTS:
 * - Use .rpc('function_name', { params }) syntax
 * - Pass parameters with p_ prefix (PostgreSQL convention)
 * - RPC functions return arrays, even for single results
 * - Handle empty results gracefully
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to array of child information with joins
 * @throws {APIError} For database or network errors
 *
 * @example
 * ```typescript
 * // This RPC call executes a PostgreSQL function that:
 * // - Joins parent_child_relationships with students table
 * // - Includes batch enrollment information
 * // - Returns formatted child information
 * const children = await getParentChildren('PARENT_123');
 * children.forEach(child => {
 *   console.log(`${child.student_name} - ${child.relationship_type}`);
 * });
 * ```
 */
export async function getParentChildren(parentId: string): Promise<ChildInfo[]> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase.rpc('get_parent_children', {
        p_parent_id: parentId, // Parameter name matches PostgreSQL function
      });
    });

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Pattern 4: RPC with Aggregations
 *
 * Demonstrates calling an RPC function that returns aggregated data.
 *
 * WHEN TO USE:
 * - Dashboard summaries
 * - Report generation
 * - Statistics and metrics
 * - Count queries across multiple tables
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to dashboard summary with counts
 * @throws {APIError} For database or network errors
 *
 * @example
 * ```typescript
 * const summary = await getParentDashboardSummary('PARENT_123');
 * console.log(`Unread messages: ${summary.unread_messages}`);
 * console.log(`Pending actions: ${summary.pending_actions}`);
 * console.log(`Active insights: ${summary.active_insights}`);
 * ```
 */
export async function getParentDashboardSummary(
  parentId: string
): Promise<ParentDashboardSummary> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase.rpc('get_parent_dashboard_summary', {
        p_parent_id: parentId,
      });
    });

    if (error) throw parseSupabaseError(error);

    // RPC functions return arrays, so extract first element
    if (!data || data.length === 0) {
      // Return default values if no data (parent has no activity yet)
      return {
        parent_id: parentId,
        total_children: 0,
        unread_messages: 0,
        pending_actions: 0,
        active_insights: 0,
        critical_risks: 0,
      };
    }

    return data[0];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// PAGINATION PATTERN
// ============================================================================

/**
 * Pattern 5: Paginated Query with Filters
 *
 * Demonstrates pagination using limit/offset or range.
 *
 * PAGINATION OPTIONS:
 * 1. .range(from, to) - More efficient, PostgreSQL native
 * 2. .limit(n).offset(n) - More familiar to developers
 *
 * KEY POINTS:
 * - Always include total count when paginating
 * - Use count: 'exact' for total, count: 'estimated' for performance
 * - Return both data and metadata (page, total, hasMore)
 * - Consider cursor-based pagination for infinite scroll
 *
 * @param parentId - The parent ID
 * @param options - Pagination and filter options
 * @returns Promise resolving to paginated results
 * @throws {APIError} For database or network errors
 *
 * @example
 * ```typescript
 * // Get first page
 * const page1 = await getParentChildrenPaginated('PARENT_123', {
 *   page: 1,
 *   limit: 10,
 * });
 *
 * console.log(`Showing ${page1.data.length} of ${page1.total}`);
 * console.log(`Has more: ${page1.hasMore}`);
 *
 * // Get second page
 * const page2 = await getParentChildrenPaginated('PARENT_123', {
 *   page: 2,
 *   limit: 10,
 * });
 * ```
 */
export interface PaginationOptions {
  page: number; // 1-based page number
  limit: number; // Items per page
  isActive?: boolean; // Optional filter
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getParentChildrenPaginated(
  parentId: string,
  options: PaginationOptions
): Promise<PaginatedResponse<ParentChildRelationship>> {
  try {
    const { page, limit, isActive } = options;

    // Calculate range (0-based for Supabase)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('parent_child_relationships')
      .select('*', { count: 'exact' }) // Include total count
      .eq('parent_id', parentId);

    // Apply optional filters
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Apply pagination and ordering
    const { data, error, count } = await retryWithBackoff(async () => {
      return await query
        .order('created_at', { ascending: false })
        .range(from, to);
    });

    if (error) throw parseSupabaseError(error);

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// UPDATE OPERATIONS (MUTATIONS)
// ============================================================================

/**
 * Pattern 6: Simple Update
 *
 * Update a single record by ID.
 *
 * KEY POINTS:
 * - Use .update() for modifications
 * - Use .select() after update to return updated data
 * - Use .single() when updating one record
 * - Add updated_at timestamp automatically
 * - Don't use retryWithBackoff for mutations (not idempotent)
 * - Validate input before sending to database
 *
 * WHY NOT RETRY MUTATIONS?
 * - Updates might succeed but fail to return (causes duplicate operations)
 * - Not idempotent like reads
 * - Better to fail fast and let React Query handle retry at hook level
 *
 * @param parentId - The parent ID
 * @param updates - Partial parent data to update
 * @returns Promise resolving to updated parent profile
 * @throws {NotFoundError} When parent doesn't exist
 * @throws {ValidationError} When update data is invalid
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * const updated = await updateParentProfile('PARENT_123', {
 *   primary_phone: '+1234567890',
 *   city: 'San Francisco',
 *   state: 'CA',
 * });
 * console.log('Updated profile:', updated);
 * ```
 */
export async function updateParentProfile(
  parentId: string,
  updates: Partial<Omit<Parent, 'id' | 'parent_id' | 'created_at' | 'created_by'>>
): Promise<Parent> {
  try {
    // Input validation (add more as needed)
    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update');
    }

    // Add updated_at timestamp automatically
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Execute update (NO retryWithBackoff for mutations)
    const { data, error } = await supabase
      .from('parents')
      .update(updateData)
      .eq('parent_id', parentId)
      .select() // Return updated record
      .single(); // Expect one result

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Parent profile not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Pattern 7: Specialized Update Function
 *
 * Demonstrates a focused update function for a specific use case.
 *
 * BENEFITS:
 * - Clear intent and purpose
 * - Type-safe parameters
 * - Easy to use from components
 * - Can include business logic validation
 *
 * @param parentId - The parent ID
 * @param preferences - Notification preferences
 * @returns Promise resolving to updated parent profile
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * await updateNotificationPreferences('PARENT_123', {
 *   ai_insights_enabled: true,
 *   weekly_report_enabled: true,
 *   preferred_communication_method: 'email',
 * });
 * ```
 */
export async function updateNotificationPreferences(
  parentId: string,
  preferences: {
    ai_insights_enabled?: boolean;
    weekly_report_enabled?: boolean;
    alert_notifications_enabled?: boolean;
    payment_reminder_enabled?: boolean;
    payment_reminder_days_before?: number;
    preferred_communication_method?: NotificationChannel;
  }
): Promise<Parent> {
  // Validation: payment_reminder_days_before should be positive
  if (
    preferences.payment_reminder_days_before !== undefined &&
    preferences.payment_reminder_days_before < 0
  ) {
    throw new ValidationError(
      'Payment reminder days must be a positive number',
      'payment_reminder_days_before'
    );
  }

  // Reuse the generic update function
  return updateParentProfile(parentId, preferences);
}

/**
 * Pattern 8: Update with Side Effects
 *
 * Demonstrates an update that also sets related fields.
 *
 * USE CASES:
 * - Marking completion timestamps
 * - Setting status flags
 * - Recording action metadata
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to updated parent profile
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * // After parent completes onboarding flow
 * const updated = await completeOnboarding('PARENT_123');
 * console.log('Onboarding completed at:', updated.onboarding_completed_at);
 * ```
 */
export async function completeOnboarding(parentId: string): Promise<Parent> {
  return updateParentProfile(parentId, {
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  });
}

// ============================================================================
// ADVANCED QUERY PATTERNS
// ============================================================================

/**
 * Pattern 9: Multiple Filters with OR/AND Logic
 *
 * Demonstrates complex filtering with multiple conditions.
 *
 * FILTER METHODS:
 * - .eq(column, value) - Equals
 * - .neq(column, value) - Not equals
 * - .gt(column, value) - Greater than
 * - .gte(column, value) - Greater than or equal
 * - .lt(column, value) - Less than
 * - .lte(column, value) - Less than or equal
 * - .like(column, pattern) - Pattern matching
 * - .ilike(column, pattern) - Case-insensitive pattern matching
 * - .in(column, array) - In array
 * - .is(column, value) - Is (for null checks)
 * - .or(filters) - OR logic
 *
 * @param parentId - The parent ID
 * @param filters - Filter options
 * @returns Promise resolving to filtered relationships
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * // Get all primary contacts who can view academic records
 * const primaryContacts = await getParentChildrenFiltered('PARENT_123', {
 *   isPrimaryContact: true,
 *   canViewAcademicRecords: true,
 * });
 *
 * // Get relationships for specific students
 * const specific = await getParentChildrenFiltered('PARENT_123', {
 *   studentIds: ['STUDENT_1', 'STUDENT_2'],
 * });
 * ```
 */
export interface ChildRelationshipFilters {
  isPrimaryContact?: boolean;
  canViewAcademicRecords?: boolean;
  canViewFinancialRecords?: boolean;
  relationshipTypes?: string[];
  studentIds?: string[];
}

export async function getParentChildrenFiltered(
  parentId: string,
  filters: ChildRelationshipFilters
): Promise<ParentChildRelationship[]> {
  try {
    let query = supabase
      .from('parent_child_relationships')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true);

    // Apply optional filters
    if (filters.isPrimaryContact !== undefined) {
      query = query.eq('is_primary_contact', filters.isPrimaryContact);
    }

    if (filters.canViewAcademicRecords !== undefined) {
      query = query.eq('can_view_academic_records', filters.canViewAcademicRecords);
    }

    if (filters.canViewFinancialRecords !== undefined) {
      query = query.eq('can_view_financial_records', filters.canViewFinancialRecords);
    }

    if (filters.relationshipTypes && filters.relationshipTypes.length > 0) {
      query = query.in('relationship_type', filters.relationshipTypes);
    }

    if (filters.studentIds && filters.studentIds.length > 0) {
      query = query.in('student_id', filters.studentIds);
    }

    const { data, error } = await retryWithBackoff(async () => {
      return await query.order('created_at', { ascending: false });
    });

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Pattern 10: Existence Check
 *
 * Efficiently check if a record exists without fetching all data.
 *
 * KEY POINTS:
 * - Use .select('id') or .select('count') for minimal data transfer
 * - Return boolean, not the record
 * - Use for validation before operations
 * - Don't throw errors, just return false
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to true if parent exists, false otherwise
 *
 * @example
 * ```typescript
 * if (await parentExists('PARENT_123')) {
 *   // Proceed with operation
 * } else {
 *   // Show error or redirect
 * }
 * ```
 */
export async function parentExists(parentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('parents')
      .select('parent_id') // Only select ID, minimal data transfer
      .eq('parent_id', parentId)
      .single();

    return !error && !!data;
  } catch (error) {
    // Don't throw, just return false
    return false;
  }
}

/**
 * Pattern 11: Calculated Field Retrieval
 *
 * Get a calculated or derived value from a record.
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to profile completion percentage (0-100)
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * const completion = await getProfileCompletionPercentage('PARENT_123');
 * if (completion < 100) {
 *   console.log(`Profile is ${completion}% complete`);
 * }
 * ```
 */
export async function getProfileCompletionPercentage(
  parentId: string
): Promise<number> {
  try {
    const profile = await getParentProfile(parentId);
    return profile.profile_completion_percentage || 0;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Pattern 12: Compound Update
 *
 * Update multiple related fields in a single transaction.
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to updated parent profile
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * // User accepts terms during registration
 * const updated = await acceptTermsAndPrivacy('PARENT_123');
 * ```
 */
export async function acceptTermsAndPrivacy(parentId: string): Promise<Parent> {
  const now = new Date().toISOString();

  return updateParentProfile(parentId, {
    terms_accepted_at: now,
    privacy_policy_accepted_at: now,
    data_sharing_consent: true,
  });
}

/**
 * Pattern 13: Tracking Update
 *
 * Update a tracking field (like last_login_at).
 *
 * @param parentId - The parent ID
 * @returns Promise resolving to updated parent profile
 * @throws {APIError} For database errors
 *
 * @example
 * ```typescript
 * // Call this when parent logs in
 * await updateLastLogin('PARENT_123');
 * ```
 */
export async function updateLastLogin(parentId: string): Promise<Parent> {
  return updateParentProfile(parentId, {
    last_login_at: new Date().toISOString(),
  });
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

/**
 * SUMMARY OF PATTERNS:
 *
 * 1. Simple Single Record Query - Basic .select().single()
 * 2. Simple List Query - .select() with filters and ordering
 * 3. RPC Function Call - Complex queries with joins
 * 4. RPC with Aggregations - Dashboard summaries and metrics
 * 5. Paginated Query - Limit/offset or range-based pagination
 * 6. Simple Update - Basic .update() with validation
 * 7. Specialized Update - Focused update for specific use case
 * 8. Update with Side Effects - Update with related fields
 * 9. Multiple Filters - Complex filtering with AND/OR
 * 10. Existence Check - Efficient boolean checks
 * 11. Calculated Field Retrieval - Get derived values
 * 12. Compound Update - Multiple related fields
 * 13. Tracking Update - Update tracking fields
 *
 * BEST PRACTICES CHECKLIST:
 * ✅ Use TypeScript for type safety
 * ✅ Use retryWithBackoff for read operations
 * ✅ Don't retry mutations (handle at React Query level)
 * ✅ Parse all errors with parseSupabaseError()
 * ✅ Return empty arrays, not null, for list queries
 * ✅ Throw NotFoundError when data is missing
 * ✅ Validate input before database operations
 * ✅ Add timestamps (updated_at) automatically
 * ✅ Use JSDoc comments for documentation
 * ✅ Provide clear examples in comments
 * ✅ Keep functions focused and single-purpose
 * ✅ Use descriptive parameter names
 * ✅ Export all functions for use in hooks
 *
 * WHEN TO USE EACH PATTERN:
 * - Pattern 1-2: Simple CRUD operations
 * - Pattern 3-4: Complex queries with joins/aggregations
 * - Pattern 5: Lists with pagination (tables, infinite scroll)
 * - Pattern 6-8: Data mutations and updates
 * - Pattern 9: Advanced filtering needs
 * - Pattern 10-13: Utility and helper functions
 *
 * NEXT STEPS:
 * 1. Create corresponding React Query hooks (see TEMPLATE_useParentAPI.ts)
 * 2. Use these functions in your hooks
 * 3. Import hooks in components
 * 4. Replicate this pattern for other services
 */
