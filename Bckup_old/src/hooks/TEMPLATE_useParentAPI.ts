/**
 * ============================================================================
 * PARENT API HOOKS - COMPLETE TEMPLATE WITH REACT QUERY BEST PRACTICES
 * ============================================================================
 *
 * This file demonstrates best practices for creating React Query hooks that
 * wrap API service functions. These hooks handle data fetching, caching,
 * mutations, optimistic updates, and error handling.
 *
 * REACT QUERY CORE CONCEPTS:
 *
 * 1. QUERIES (useQuery):
 *    - For READ operations (GET requests)
 *    - Automatically cached and managed
 *    - Auto-refetch on focus, mount, reconnect
 *    - Provide loading, error, and data states
 *
 * 2. MUTATIONS (useMutation):
 *    - For WRITE operations (POST, PUT, DELETE)
 *    - Not cached by default
 *    - Trigger side effects (invalidate queries, optimistic updates)
 *    - Provide loading, error, and success states
 *
 * 3. QUERY KEYS:
 *    - Unique identifiers for cached data
 *    - Used for invalidation and cache management
 *    - Should be structured and hierarchical
 *
 * 4. INVALIDATION:
 *    - Marks cached data as stale
 *    - Triggers automatic refetch
 *    - Use after mutations to refresh data
 *
 * 5. OPTIMISTIC UPDATES:
 *    - Update UI immediately before server response
 *    - Roll back on error
 *    - Improves perceived performance
 *
 * @module useParentAPI
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import {
  getParentProfile,
  updateParentProfile,
  getParentChildren,
  getParentDashboardSummary,
  getParentChildrenPaginated,
  updateNotificationPreferences,
  completeOnboarding,
  updateLastLogin,
  parentExists,
  getProfileCompletionPercentage,
  acceptTermsAndPrivacy,
  getParentChildRelationships,
  getParentChildrenFiltered,
} from '../services/api/parent/TEMPLATE_parentService';
import type {
  Parent,
  ParentDashboardSummary,
  ChildInfo,
  ParentChildRelationship,
  NotificationChannel,
} from '../types/supabase-parent.types';
import type {
  PaginationOptions,
  PaginatedResponse,
  ChildRelationshipFilters,
} from '../services/api/parent/TEMPLATE_parentService';
import { APIError } from '../services/api/errorHandler';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

/**
 * Query Key Factory Pattern
 *
 * BENEFITS:
 * - Centralized key management
 * - Type-safe query keys
 * - Prevents typos and inconsistencies
 * - Easy to invalidate related queries
 * - Self-documenting
 *
 * STRUCTURE:
 * - ['parent'] - All parent queries
 * - ['parent', parentId] - Specific parent
 * - ['parent', parentId, 'profile'] - Parent profile
 * - ['parent', parentId, 'children'] - Parent's children
 * - etc.
 *
 * WHY THIS MATTERS:
 * - Can invalidate all parent data: queryClient.invalidateQueries(['parent'])
 * - Can invalidate specific parent: queryClient.invalidateQueries(['parent', id])
 * - Can invalidate just children: queryClient.invalidateQueries(['parent', id, 'children'])
 */
export const parentKeys = {
  // Base key for all parent-related queries
  all: ['parent'] as const,

  // All queries for a specific parent
  detail: (parentId: string) => [...parentKeys.all, parentId] as const,

  // Parent profile
  profile: (parentId: string) => [...parentKeys.detail(parentId), 'profile'] as const,

  // Parent's children
  children: (parentId: string) => [...parentKeys.detail(parentId), 'children'] as const,

  // Parent's children with filters
  childrenFiltered: (parentId: string, filters: ChildRelationshipFilters) =>
    [...parentKeys.children(parentId), 'filtered', filters] as const,

  // Parent's children with pagination
  childrenPaginated: (parentId: string, options: PaginationOptions) =>
    [...parentKeys.children(parentId), 'paginated', options] as const,

  // Dashboard summary
  dashboard: (parentId: string) => [...parentKeys.detail(parentId), 'dashboard'] as const,

  // Profile completion
  completion: (parentId: string) => [...parentKeys.detail(parentId), 'completion'] as const,

  // Existence check
  exists: (parentId: string) => [...parentKeys.detail(parentId), 'exists'] as const,
} as const;

// ============================================================================
// SIMPLE QUERY HOOKS
// ============================================================================

/**
 * Pattern 1: Basic useQuery Hook
 *
 * The simplest pattern - fetch data with automatic caching and refetching.
 *
 * REACT QUERY OPTIONS:
 * - enabled: Only run query when true (useful for conditional fetching)
 * - staleTime: How long data is considered fresh (default: 0)
 * - cacheTime: How long unused data stays in cache (default: 5 minutes)
 * - refetchOnWindowFocus: Refetch when window regains focus (default: true)
 * - refetchOnMount: Refetch when component mounts (default: true)
 * - retry: Number of retry attempts on failure (default: 3)
 *
 * RETURN VALUES:
 * - data: The fetched data (undefined while loading)
 * - isLoading: True on first fetch
 * - isFetching: True on any fetch (including refetch)
 * - isError: True if query failed
 * - error: The error object if failed
 * - refetch: Manual refetch function
 *
 * @param parentId - The parent ID
 * @param options - Additional React Query options
 * @returns Query result with parent profile
 *
 * @example
 * ```typescript
 * function ParentProfileScreen({ parentId }: Props) {
 *   const { data: profile, isLoading, error } = useParentProfile(parentId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!profile) return <NotFound />;
 *
 *   return (
 *     <View>
 *       <Text>Name: {profile.parent_id}</Text>
 *       <Text>Phone: {profile.primary_phone}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useParentProfile(
  parentId: string,
  options?: Omit<UseQueryOptions<Parent, APIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Parent, APIError>({
    // Unique query key - React Query uses this for caching
    queryKey: parentKeys.profile(parentId),

    // Function that fetches the data
    queryFn: () => getParentProfile(parentId),

    // Don't fetch if parentId is empty/undefined
    enabled: !!parentId,

    // Consider data fresh for 5 minutes (won't refetch on mount/focus)
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Keep unused data in cache for 10 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes

    // Merge with any additional options passed by caller
    ...options,
  });
}

/**
 * Pattern 2: Query Hook with Array Response
 *
 * Demonstrates handling queries that return arrays.
 *
 * KEY POINTS:
 * - Default to empty array if data is undefined
 * - TypeScript ensures type safety
 * - Can map/filter/sort the data in component
 *
 * @param parentId - The parent ID
 * @param options - Additional React Query options
 * @returns Query result with array of children
 *
 * @example
 * ```typescript
 * function ChildrenListScreen({ parentId }: Props) {
 *   const { data: children = [], isLoading } = useParentChildren(parentId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <FlatList
 *       data={children}
 *       keyExtractor={(item) => item.student_id}
 *       renderItem={({ item }) => (
 *         <ChildCard child={item} />
 *       )}
 *       ListEmptyComponent={<EmptyState message="No children found" />}
 *     />
 *   );
 * }
 * ```
 */
export function useParentChildren(
  parentId: string,
  options?: Omit<UseQueryOptions<ChildInfo[], APIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ChildInfo[], APIError>({
    queryKey: parentKeys.children(parentId),
    queryFn: () => getParentChildren(parentId),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Pattern 3: Query Hook with Complex Response
 *
 * Demonstrates handling RPC calls with aggregated data.
 *
 * @param parentId - The parent ID
 * @param options - Additional React Query options
 * @returns Query result with dashboard summary
 *
 * @example
 * ```typescript
 * function DashboardScreen({ parentId }: Props) {
 *   const { data: summary, isLoading } = useDashboardSummary(parentId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <View>
 *       <StatCard
 *         label="Total Children"
 *         value={summary?.total_children || 0}
 *       />
 *       <StatCard
 *         label="Unread Messages"
 *         value={summary?.unread_messages || 0}
 *         urgent={summary?.unread_messages > 0}
 *       />
 *       <StatCard
 *         label="Pending Actions"
 *         value={summary?.pending_actions || 0}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useDashboardSummary(
  parentId: string,
  options?: Omit<UseQueryOptions<ParentDashboardSummary, APIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ParentDashboardSummary, APIError>({
    queryKey: parentKeys.dashboard(parentId),
    queryFn: () => getParentDashboardSummary(parentId),
    enabled: !!parentId,
    // Shorter stale time for dashboard (more dynamic data)
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// ADVANCED QUERY HOOKS
// ============================================================================

/**
 * Pattern 4: Query with Filters
 *
 * Demonstrates a query with dynamic filter parameters.
 *
 * KEY POINTS:
 * - Include filters in query key (different filters = different cache)
 * - Disabled when filters are invalid
 * - Use shorter stale time for filtered results
 *
 * @param parentId - The parent ID
 * @param filters - Filter options
 * @param options - Additional React Query options
 * @returns Query result with filtered children
 *
 * @example
 * ```typescript
 * function PrimaryContactsScreen({ parentId }: Props) {
 *   const filters: ChildRelationshipFilters = {
 *     isPrimaryContact: true,
 *     canViewAcademicRecords: true,
 *   };
 *
 *   const { data: primaryContacts = [] } = useParentChildrenFiltered(
 *     parentId,
 *     filters
 *   );
 *
 *   return (
 *     <View>
 *       {primaryContacts.map(child => (
 *         <ContactCard key={child.id} relationship={child} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useParentChildrenFiltered(
  parentId: string,
  filters: ChildRelationshipFilters,
  options?: Omit<
    UseQueryOptions<ParentChildRelationship[], APIError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ParentChildRelationship[], APIError>({
    // Include filters in query key - different filters = different cache entry
    queryKey: parentKeys.childrenFiltered(parentId, filters),
    queryFn: () => getParentChildrenFiltered(parentId, filters),
    enabled: !!parentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Pattern 5: Paginated Query
 *
 * Demonstrates pagination with React Query.
 *
 * KEY POINTS:
 * - Include pagination params in query key
 * - Use keepPreviousData to prevent loading flicker
 * - Return pagination metadata alongside data
 *
 * @param parentId - The parent ID
 * @param options - Pagination options
 * @param queryOptions - Additional React Query options
 * @returns Query result with paginated children
 *
 * @example
 * ```typescript
 * function PaginatedChildrenList({ parentId }: Props) {
 *   const [page, setPage] = useState(1);
 *   const limit = 10;
 *
 *   const {
 *     data: result,
 *     isLoading,
 *     isFetching
 *   } = useParentChildrenPaginated(parentId, { page, limit });
 *
 *   return (
 *     <View>
 *       <FlatList
 *         data={result?.data || []}
 *         renderItem={({ item }) => <ChildCard child={item} />}
 *       />
 *       <Pagination
 *         current={page}
 *         total={result?.totalPages || 0}
 *         onPageChange={setPage}
 *         isLoading={isFetching}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useParentChildrenPaginated(
  parentId: string,
  paginationOptions: PaginationOptions,
  queryOptions?: Omit<
    UseQueryOptions<PaginatedResponse<ParentChildRelationship>, APIError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<PaginatedResponse<ParentChildRelationship>, APIError>({
    queryKey: parentKeys.childrenPaginated(parentId, paginationOptions),
    queryFn: () => getParentChildrenPaginated(parentId, paginationOptions),
    enabled: !!parentId && paginationOptions.page > 0 && paginationOptions.limit > 0,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000,
    // Keep previous data while fetching next page (prevents flicker)
    keepPreviousData: true,
    ...queryOptions,
  });
}

/**
 * Pattern 6: Utility Query Hook
 *
 * Query hook for simple utility functions.
 *
 * @param parentId - The parent ID
 * @param options - Additional React Query options
 * @returns Query result with completion percentage
 *
 * @example
 * ```typescript
 * function ProfileProgress({ parentId }: Props) {
 *   const { data: completion = 0 } = useProfileCompletion(parentId);
 *
 *   return (
 *     <ProgressBar
 *       value={completion}
 *       label={`${completion}% Complete`}
 *     />
 *   );
 * }
 * ```
 */
export function useProfileCompletion(
  parentId: string,
  options?: Omit<UseQueryOptions<number, APIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<number, APIError>({
    queryKey: parentKeys.completion(parentId),
    queryFn: () => getProfileCompletionPercentage(parentId),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Pattern 7: Boolean Query Hook
 *
 * Query hook that returns a boolean value.
 *
 * @param parentId - The parent ID
 * @param options - Additional React Query options
 * @returns Query result indicating if parent exists
 *
 * @example
 * ```typescript
 * function ValidateParent({ parentId }: Props) {
 *   const { data: exists = false, isLoading } = useParentExists(parentId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!exists) return <NotFoundScreen />;
 *
 *   return <ParentDashboard parentId={parentId} />;
 * }
 * ```
 */
export function useParentExists(
  parentId: string,
  options?: Omit<UseQueryOptions<boolean, APIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<boolean, APIError>({
    queryKey: parentKeys.exists(parentId),
    queryFn: () => parentExists(parentId),
    enabled: !!parentId,
    staleTime: 10 * 60 * 1000, // 10 minutes (existence rarely changes)
    cacheTime: 15 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Pattern 8: Simple Update Mutation
 *
 * The most common mutation pattern - update with cache invalidation.
 *
 * MUTATION LIFECYCLE:
 * 1. onMutate: Called before mutation (setup optimistic update)
 * 2. mutationFn: Execute the actual mutation
 * 3. onSuccess: Called if mutation succeeds (invalidate queries)
 * 4. onError: Called if mutation fails (handle/rollback)
 * 5. onSettled: Called always (cleanup)
 *
 * CACHE INVALIDATION:
 * - Marks queries as stale
 * - Triggers automatic refetch of active queries
 * - Essential for keeping UI in sync
 *
 * @param options - Mutation options
 * @returns Mutation result with update function
 *
 * @example
 * ```typescript
 * function EditProfileScreen({ parentId }: Props) {
 *   const { mutate: updateProfile, isLoading } = useUpdateParentProfile();
 *
 *   const handleSave = (formData: Partial<Parent>) => {
 *     updateProfile(
 *       { parentId, updates: formData },
 *       {
 *         onSuccess: () => {
 *           Alert.alert('Success', 'Profile updated');
 *           navigation.goBack();
 *         },
 *         onError: (error) => {
 *           Alert.alert('Error', error.message);
 *         },
 *       }
 *     );
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSave} isSubmitting={isLoading} />
 *   );
 * }
 * ```
 */
export function useUpdateParentProfile(
  options?: UseMutationOptions<
    Parent,
    APIError,
    { parentId: string; updates: Partial<Parent> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    Parent,
    APIError,
    { parentId: string; updates: Partial<Parent> }
  >({
    // The mutation function
    mutationFn: ({ parentId, updates }) => updateParentProfile(parentId, updates),

    // Called on successful mutation
    onSuccess: (updatedProfile, variables) => {
      // Invalidate and refetch parent profile
      queryClient.invalidateQueries(parentKeys.profile(variables.parentId));

      // Also invalidate the parent detail (catches all related queries)
      queryClient.invalidateQueries(parentKeys.detail(variables.parentId));

      // Call user-provided onSuccess if exists
      options?.onSuccess?.(updatedProfile, variables, undefined);
    },

    // Called on mutation error
    onError: (error, variables, context) => {
      console.error('Failed to update parent profile:', error);
      options?.onError?.(error, variables, context);
    },

    // Merge with any additional options
    ...options,
  });
}

/**
 * Pattern 9: Mutation with Optimistic Update
 *
 * Demonstrates optimistic updates - update UI immediately, rollback on error.
 *
 * OPTIMISTIC UPDATE FLOW:
 * 1. onMutate: Update cache with optimistic data
 * 2. Save snapshot of old data for rollback
 * 3. Return context (snapshot) to other callbacks
 * 4. onError: Use snapshot to rollback if mutation fails
 * 5. onSettled: Invalidate queries to ensure sync
 *
 * WHEN TO USE:
 * - Simple updates where failure is rare
 * - Improve perceived performance
 * - User expects immediate feedback
 *
 * WHEN NOT TO USE:
 * - Complex updates with side effects
 * - High chance of failure
 * - Critical operations (payments, etc.)
 *
 * @param options - Mutation options
 * @returns Mutation result with update function
 *
 * @example
 * ```typescript
 * function NotificationToggle({ parentId }: Props) {
 *   const { data: profile } = useParentProfile(parentId);
 *   const { mutate: updatePrefs } = useUpdateNotificationPreferences();
 *
 *   const toggleInsights = () => {
 *     updatePrefs({
 *       parentId,
 *       preferences: {
 *         ai_insights_enabled: !profile?.ai_insights_enabled,
 *       },
 *     });
 *     // UI updates immediately, before server responds!
 *   };
 *
 *   return (
 *     <Switch
 *       value={profile?.ai_insights_enabled}
 *       onValueChange={toggleInsights}
 *     />
 *   );
 * }
 * ```
 */
export function useUpdateNotificationPreferences(
  options?: UseMutationOptions<
    Parent,
    APIError,
    {
      parentId: string;
      preferences: {
        ai_insights_enabled?: boolean;
        weekly_report_enabled?: boolean;
        alert_notifications_enabled?: boolean;
        payment_reminder_enabled?: boolean;
        payment_reminder_days_before?: number;
        preferred_communication_method?: NotificationChannel;
      };
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    Parent,
    APIError,
    {
      parentId: string;
      preferences: {
        ai_insights_enabled?: boolean;
        weekly_report_enabled?: boolean;
        alert_notifications_enabled?: boolean;
        payment_reminder_enabled?: boolean;
        payment_reminder_days_before?: number;
        preferred_communication_method?: NotificationChannel;
      };
    },
    { previousProfile: Parent | undefined } // Context type for rollback
  >({
    mutationFn: ({ parentId, preferences }) =>
      updateNotificationPreferences(parentId, preferences),

    // 1. OPTIMISTIC UPDATE - Update cache immediately
    onMutate: async ({ parentId, preferences }) => {
      // Cancel any outgoing refetches (prevent overwriting optimistic update)
      await queryClient.cancelQueries(parentKeys.profile(parentId));

      // Snapshot the current value (for rollback)
      const previousProfile = queryClient.getQueryData<Parent>(
        parentKeys.profile(parentId)
      );

      // Optimistically update cache
      if (previousProfile) {
        queryClient.setQueryData<Parent>(parentKeys.profile(parentId), {
          ...previousProfile,
          ...preferences,
          updated_at: new Date().toISOString(),
        });
      }

      // Return context with snapshot
      return { previousProfile };
    },

    // 2. ON ERROR - Rollback to snapshot
    onError: (error, variables, context) => {
      // Rollback to previous value
      if (context?.previousProfile) {
        queryClient.setQueryData(
          parentKeys.profile(variables.parentId),
          context.previousProfile
        );
      }

      console.error('Failed to update notification preferences:', error);
      options?.onError?.(error, variables, context);
    },

    // 3. ON SETTLED - Always refetch to ensure sync
    onSettled: (data, error, variables) => {
      // Refetch to ensure we have the latest data from server
      queryClient.invalidateQueries(parentKeys.profile(variables.parentId));
      queryClient.invalidateQueries(parentKeys.detail(variables.parentId));
    },

    ...options,
  });
}

/**
 * Pattern 10: Simple Action Mutation
 *
 * Mutation for simple actions without complex updates.
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * function OnboardingFlow({ parentId }: Props) {
 *   const { mutate: complete, isLoading } = useCompleteOnboarding();
 *
 *   const handleComplete = () => {
 *     complete(parentId, {
 *       onSuccess: () => {
 *         navigation.navigate('Dashboard');
 *       },
 *     });
 *   };
 *
 *   return (
 *     <Button
 *       title="Complete Onboarding"
 *       onPress={handleComplete}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export function useCompleteOnboarding(
  options?: UseMutationOptions<Parent, APIError, string>
) {
  const queryClient = useQueryClient();

  return useMutation<Parent, APIError, string>({
    mutationFn: (parentId) => completeOnboarding(parentId),
    onSuccess: (data, parentId) => {
      queryClient.invalidateQueries(parentKeys.profile(parentId));
      queryClient.invalidateQueries(parentKeys.detail(parentId));
      options?.onSuccess?.(data, parentId, undefined);
    },
    ...options,
  });
}

/**
 * Pattern 11: Tracking Mutation
 *
 * Mutation for tracking updates (silent, no user feedback).
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * function App() {
 *   const { data: user } = useCurrentUser();
 *   const { mutate: updateLogin } = useUpdateLastLogin();
 *
 *   useEffect(() => {
 *     if (user?.parent_id) {
 *       // Track login silently
 *       updateLogin(user.parent_id);
 *     }
 *   }, [user?.parent_id]);
 *
 *   return <AppNavigator />;
 * }
 * ```
 */
export function useUpdateLastLogin(
  options?: UseMutationOptions<Parent, APIError, string>
) {
  const queryClient = useQueryClient();

  return useMutation<Parent, APIError, string>({
    mutationFn: (parentId) => updateLastLogin(parentId),
    onSuccess: (data, parentId) => {
      // Update cache silently (no invalidation needed)
      queryClient.setQueryData(parentKeys.profile(parentId), data);
      options?.onSuccess?.(data, parentId, undefined);
    },
    // Don't log errors for tracking (silent operation)
    onError: () => {
      // Silently fail
    },
    ...options,
  });
}

/**
 * Pattern 12: Multi-field Mutation
 *
 * Mutation that updates multiple related fields.
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * function TermsScreen({ parentId }: Props) {
 *   const { mutate: accept, isLoading } = useAcceptTerms();
 *
 *   const handleAccept = () => {
 *     accept(parentId, {
 *       onSuccess: () => {
 *         navigation.navigate('Onboarding');
 *       },
 *     });
 *   };
 *
 *   return (
 *     <View>
 *       <TermsContent />
 *       <Button
 *         title="I Accept"
 *         onPress={handleAccept}
 *         loading={isLoading}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useAcceptTerms(
  options?: UseMutationOptions<Parent, APIError, string>
) {
  const queryClient = useQueryClient();

  return useMutation<Parent, APIError, string>({
    mutationFn: (parentId) => acceptTermsAndPrivacy(parentId),
    onSuccess: (data, parentId) => {
      queryClient.invalidateQueries(parentKeys.profile(parentId));
      queryClient.invalidateQueries(parentKeys.detail(parentId));
      options?.onSuccess?.(data, parentId, undefined);
    },
    ...options,
  });
}

// ============================================================================
// COMPOUND HOOKS (Multiple Queries/Mutations)
// ============================================================================

/**
 * Pattern 13: Compound Hook
 *
 * Combines multiple queries for common use cases.
 *
 * BENEFITS:
 * - Simplifies component code
 * - Encapsulates common query patterns
 * - Provides combined loading states
 * - Reusable across components
 *
 * @param parentId - The parent ID
 * @returns Combined query results
 *
 * @example
 * ```typescript
 * function ParentDashboard({ parentId }: Props) {
 *   const {
 *     profile,
 *     children,
 *     summary,
 *     isLoading,
 *     hasError,
 *   } = useParentDashboardData(parentId);
 *
 *   if (isLoading) return <LoadingScreen />;
 *   if (hasError) return <ErrorScreen />;
 *
 *   return (
 *     <View>
 *       <Header profile={profile} />
 *       <SummaryCards summary={summary} />
 *       <ChildrenList children={children} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useParentDashboardData(parentId: string) {
  const profileQuery = useParentProfile(parentId);
  const childrenQuery = useParentChildren(parentId);
  const summaryQuery = useDashboardSummary(parentId);

  return {
    // Individual query data
    profile: profileQuery.data,
    children: childrenQuery.data || [],
    summary: summaryQuery.data,

    // Combined loading state
    isLoading:
      profileQuery.isLoading ||
      childrenQuery.isLoading ||
      summaryQuery.isLoading,

    // Combined fetching state
    isFetching:
      profileQuery.isFetching ||
      childrenQuery.isFetching ||
      summaryQuery.isFetching,

    // Combined error state
    hasError: profileQuery.isError || childrenQuery.isError || summaryQuery.isError,

    // Individual errors
    errors: {
      profile: profileQuery.error,
      children: childrenQuery.error,
      summary: summaryQuery.error,
    },

    // Refetch all queries
    refetchAll: () => {
      profileQuery.refetch();
      childrenQuery.refetch();
      summaryQuery.refetch();
    },
  };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Pattern 14: Prefetch Hook
 *
 * Hook to prefetch data before it's needed.
 *
 * USE CASES:
 * - Prefetch on navigation/hover
 * - Warm cache for better UX
 * - Load data before rendering
 *
 * @returns Prefetch functions
 *
 * @example
 * ```typescript
 * function ChildListItem({ studentId, parentId }: Props) {
 *   const { prefetchProfile } = usePrefetchParentData();
 *
 *   const handlePress = () => {
 *     // Prefetch before navigation
 *     prefetchProfile(parentId);
 *     navigation.navigate('ParentDetail', { parentId });
 *   };
 *
 *   return (
 *     <TouchableOpacity onPress={handlePress}>
 *       <Text>View Parent</Text>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */
export function usePrefetchParentData() {
  const queryClient = useQueryClient();

  return {
    prefetchProfile: (parentId: string) => {
      queryClient.prefetchQuery({
        queryKey: parentKeys.profile(parentId),
        queryFn: () => getParentProfile(parentId),
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchChildren: (parentId: string) => {
      queryClient.prefetchQuery({
        queryKey: parentKeys.children(parentId),
        queryFn: () => getParentChildren(parentId),
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchDashboard: (parentId: string) => {
      queryClient.prefetchQuery({
        queryKey: parentKeys.dashboard(parentId),
        queryFn: () => getParentDashboardSummary(parentId),
        staleTime: 60 * 1000,
      });
    },
  };
}

/**
 * Pattern 15: Cache Invalidation Hook
 *
 * Hook for manual cache invalidation.
 *
 * @returns Invalidation functions
 *
 * @example
 * ```typescript
 * function RefreshButton({ parentId }: Props) {
 *   const { invalidateProfile, invalidateAll } = useInvalidateParentCache();
 *
 *   return (
 *     <Button
 *       title="Refresh"
 *       onPress={() => invalidateAll(parentId)}
 *     />
 *   );
 * }
 * ```
 */
export function useInvalidateParentCache() {
  const queryClient = useQueryClient();

  return {
    invalidateProfile: (parentId: string) => {
      queryClient.invalidateQueries(parentKeys.profile(parentId));
    },

    invalidateChildren: (parentId: string) => {
      queryClient.invalidateQueries(parentKeys.children(parentId));
    },

    invalidateDashboard: (parentId: string) => {
      queryClient.invalidateQueries(parentKeys.dashboard(parentId));
    },

    invalidateAll: (parentId: string) => {
      queryClient.invalidateQueries(parentKeys.detail(parentId));
    },

    invalidateAllParents: () => {
      queryClient.invalidateQueries(parentKeys.all);
    },
  };
}

// ============================================================================
// SUMMARY AND BEST PRACTICES
// ============================================================================

/**
 * HOOKS SUMMARY:
 *
 * QUERY HOOKS (READ):
 * 1. useParentProfile - Fetch parent profile
 * 2. useParentChildren - Fetch children list
 * 3. useDashboardSummary - Fetch dashboard data
 * 4. useParentChildrenFiltered - Fetch with filters
 * 5. useParentChildrenPaginated - Fetch with pagination
 * 6. useProfileCompletion - Fetch completion percentage
 * 7. useParentExists - Check existence
 *
 * MUTATION HOOKS (WRITE):
 * 8. useUpdateParentProfile - Update with invalidation
 * 9. useUpdateNotificationPreferences - Update with optimistic
 * 10. useCompleteOnboarding - Simple action
 * 11. useUpdateLastLogin - Silent tracking
 * 12. useAcceptTerms - Multi-field update
 *
 * COMPOUND HOOKS:
 * 13. useParentDashboardData - Multiple queries
 * 14. usePrefetchParentData - Prefetch utilities
 * 15. useInvalidateParentCache - Cache management
 *
 * BEST PRACTICES:
 * ✅ Use query key factory for consistency
 * ✅ Include proper TypeScript types
 * ✅ Set appropriate staleTime/cacheTime
 * ✅ Invalidate queries after mutations
 * ✅ Use optimistic updates for simple cases
 * ✅ Handle loading/error states in components
 * ✅ Provide default values for arrays
 * ✅ Use enabled option for conditional fetching
 * ✅ Prefetch on navigation for better UX
 * ✅ Combine related queries in compound hooks
 *
 * ANTI-PATTERNS TO AVOID:
 * ❌ Don't fetch same data multiple times (use query key correctly)
 * ❌ Don't forget to invalidate after mutations
 * ❌ Don't use mutations for read operations
 * ❌ Don't set staleTime too low (causes excessive refetches)
 * ❌ Don't ignore error states
 * ❌ Don't use optimistic updates for critical operations
 * ❌ Don't duplicate query keys across files
 * ❌ Don't forget to check enabled conditions
 *
 * PERFORMANCE TIPS:
 * 💡 Set longer staleTime for static data
 * 💡 Use keepPreviousData for pagination
 * 💡 Prefetch on hover/navigation intent
 * 💡 Use select to transform data (memoized)
 * 💡 Invalidate specific queries, not all
 * 💡 Use compound hooks to reduce re-renders
 * 💡 Cache expensive transformations
 * 💡 Use suspense mode for better UX (React 18+)
 */
