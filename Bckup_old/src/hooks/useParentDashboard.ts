/**
 * Custom hook for Parent Dashboard data
 * Uses React Query for data fetching and caching
 * ✅ NOW USING QUERY KEYS FACTORY!
 */

import { useQuery } from '@tanstack/react-query';
import {
  getParentProfile,
  getParentChildren,
  getParentNotifications,
  getParentFinancialSummary,
} from '../services/api/parentApi';
import { queryKeys } from '../shared/api/queryKeys';

/**
 * Hook to fetch parent dashboard data
 */
export const useParentDashboard = (parentId: string) => {
  // Validate parentId is a valid UUID (not undefined, null, or string "undefined")
  const isValidParentId = parentId &&
                          typeof parentId === 'string' &&
                          parentId !== 'undefined' &&
                          parentId.length > 10; // Basic UUID length check

  console.log('🔍 [useParentDashboard] parentId:', parentId, 'isValid:', isValidParentId);

  // ✅ Fetch parent profile - using query keys factory
  const profileQuery = useQuery({
    queryKey: queryKeys.parent.profile(parentId),
    queryFn: () => getParentProfile(parentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isValidParentId,
  });

  // ✅ Fetch children - using query keys factory
  const childrenQuery = useQuery({
    queryKey: queryKeys.parent.children(parentId),
    queryFn: () => getParentChildren(parentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isValidParentId,
  });

  // ✅ Fetch notifications - using query keys factory
  const notificationsQuery = useQuery({
    queryKey: queryKeys.parent.notifications(parentId),
    queryFn: () => getParentNotifications(parentId, 5),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: isValidParentId,
  });

  // ✅ Fetch financial summary - using query keys factory
  const financialQuery = useQuery({
    queryKey: queryKeys.parent.financial(parentId),
    queryFn: () => getParentFinancialSummary(parentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isValidParentId,
  });

  return {
    profile: profileQuery.data,
    children: childrenQuery.data || [],
    notifications: notificationsQuery.data || [],
    financialSummary: financialQuery.data,
    isLoading:
      profileQuery.isLoading ||
      childrenQuery.isLoading ||
      notificationsQuery.isLoading,
    isError:
      profileQuery.isError ||
      childrenQuery.isError ||
      notificationsQuery.isError,
    refetch: () => {
      profileQuery.refetch();
      childrenQuery.refetch();
      notificationsQuery.refetch();
      financialQuery.refetch();
    },
  };
};
