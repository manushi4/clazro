/**
 * Placeholder Data Utility Hook
 * Week 1, Days 5-7: PlaceholderData pattern for React Query
 *
 * Purpose: Provide placeholder data during loading to prevent layout shift
 *
 * Benefits:
 * - Instant skeleton rendering (no flash of empty state)
 * - Better perceived performance
 * - Smoother UX transitions
 *
 * Usage:
 * const { data } = useQuery({
 *   queryKey: ['users'],
 *   queryFn: fetchUsers,
 *   placeholderData: usePlaceholderData(userListPlaceholder),
 * });
 */

import { useCallback } from 'react';

/**
 * Returns a memoized function that provides placeholder data
 * to React Query during the initial load.
 *
 * @param placeholder - The placeholder data structure
 * @returns Memoized placeholder function
 *
 * @example
 * const { data } = useQuery({
 *   queryKey: userQueryKeys.list(filters),
 *   queryFn: () => fetchUsers(filters),
 *   placeholderData: usePlaceholderData(userListPlaceholder),
 *   staleTime: userStaleTime.list,
 * });
 */
export function usePlaceholderData<T>(placeholder: T) {
  return useCallback(() => placeholder, [placeholder]);
}

/**
 * Placeholder Data Patterns
 *
 * These match the data contracts in src/types/contracts/
 */

// User list placeholder
export const USER_LIST_PLACEHOLDER = {
  users: [],
  nextCursor: null,
  hasMore: false,
} as const;

// Support tickets placeholder
export const TICKET_LIST_PLACEHOLDER = {
  tickets: [],
  nextCursor: null,
  hasMore: false,
} as const;

// Dashboard KPIs placeholder
// Week 2, Days 8-10: Updated to match DashboardKPIs interface
export const DASHBOARD_KPIS_PLACEHOLDER = {
  activeUsers: 0,
  mtdRevenue: 0,
  openTickets: 0,
  attendanceRate: 0,
  totalUsers: 0,
  activeStudents: 0,
  pendingFees: 0,
  timestamp: new Date().toISOString(),
} as const;

// Financial metrics placeholder
export const FINANCIAL_METRICS_PLACEHOLDER = {
  mtd_revenue: 0,
  mtd_revenue_growth: 0,
  ytd_revenue: 0,
  outstanding_dues: 0,
  payment_success_rate: 0,
  avg_transaction_value: 0,
  total_refunds_mtd: 0,
} as const;

// Payment list placeholder
export const PAYMENT_LIST_PLACEHOLDER = {
  payments: [],
  nextCursor: null,
  hasMore: false,
  totalAmount: 0,
} as const;

/**
 * Helper to generate skeleton placeholder items
 * for lists that need to show N skeleton cards
 *
 * @param count - Number of skeleton items
 * @returns Array of placeholder items
 *
 * @example
 * const { data } = useQuery({
 *   queryKey: ['users'],
 *   queryFn: fetchUsers,
 *   placeholderData: () => ({
 *     users: generateSkeletonItems(5),
 *     nextCursor: null,
 *     hasMore: false,
 *   }),
 * });
 */
export function generateSkeletonItems<T extends { id: string }>(
  count: number,
  template?: Partial<T>
): T[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `skeleton-${index}`,
    ...template,
  })) as T[];
}

/**
 * Hook for infinite queries with placeholder data
 *
 * @param placeholder - The placeholder page structure
 * @returns Memoized placeholder pages
 *
 * @example
 * const { data } = useInfiniteQuery({
 *   queryKey: ['tickets'],
 *   queryFn: ({ pageParam }) => fetchTickets(pageParam),
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   placeholderData: useInfinitePlaceholderData({
 *     tickets: [],
 *     nextCursor: null,
 *     hasMore: false,
 *   }),
 * });
 */
export function useInfinitePlaceholderData<T>(placeholder: T) {
  return useCallback(
    () => ({
      pages: [placeholder],
      pageParams: [null],
    }),
    [placeholder]
  );
}

/**
 * TypeScript utility to ensure placeholder matches actual data shape
 *
 * @example
 * const placeholder: PlaceholderOf<UserListResponse> = {
 *   users: [],
 *   nextCursor: null,
 *   hasMore: false,
 * };
 */
export type PlaceholderOf<T> = T extends Array<infer U>
  ? U[]
  : T extends object
  ? { [K in keyof T]: PlaceholderOf<T[K]> }
  : T;

/**
 * Example Usage in a Component:
 *
 * ```typescript
 * import { useQuery } from '@tanstack/react-query';
 * import { usePlaceholderData, USER_LIST_PLACEHOLDER } from '../hooks/usePlaceholderData';
 * import { userQueryKeys, userStaleTime } from '../types/contracts/userManagement';
 * import { UserListItemSkeleton, SkeletonList } from '../components/skeletons/AdminSkeletons';
 *
 * function UserManagementScreen() {
 *   const { data, isLoading } = useQuery({
 *     queryKey: userQueryKeys.list(filters),
 *     queryFn: () => fetchUsers(filters),
 *     placeholderData: usePlaceholderData(USER_LIST_PLACEHOLDER),
 *     staleTime: userStaleTime.list,
 *   });
 *
 *   // During initial load, data = USER_LIST_PLACEHOLDER
 *   // This allows FlatList to render immediately with skeleton items
 *
 *   return (
 *     <BaseScreen loading={isLoading && data.users.length === 0}>
 *       <FlatList
 *         data={data.users}
 *         renderItem={({ item }) =>
 *           isLoading ? <UserListItemSkeleton /> : <UserCard user={item} />
 *         }
 *       />
 *     </BaseScreen>
 *   );
 * }
 * ```
 *
 * Why This Works:
 * 1. React Query receives placeholderData immediately (no loading state initially)
 * 2. FlatList renders with empty array [] from placeholder
 * 3. Skeleton components show instantly
 * 4. When real data arrives, FlatList updates smoothly
 * 5. No layout shift because FlatList was already rendered
 */
