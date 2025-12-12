/**
 * Parent API Hooks
 * React Query hooks for parent-related data fetching
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getParentDashboard,
  getParentById,
  getChildrenSummary,
  getActionItems,
  getAIInsights,
  getFinancialSummary,
} from '../../services/backend/parent/parentDashboardService';
import {
  getFees,
  getFeeBalance,
  getOverdueFees,
  initiatePayment,
  getPaymentHistory,
  downloadReceipt,
  getInvoices,
  downloadInvoice,
} from '../../services/backend/parent/parentFinancialService';

// Type imports
import type {
  ParentDashboard,
  Parent,
  ChildSummary,
  ParentActionItem,
  AIInsight,
  FinancialSummary,
  ActionItemFilters,
  StudentFee,
  FeeBalance,
  Payment,
  PaymentMethod,
  FeeFilters,
  PaymentFilters,
} from '../../types/database/parent';

// ==================== DASHBOARD HOOKS ====================

/**
 * Hook to fetch parent dashboard data
 * @param parentId - The parent UUID
 * @param enabled - Whether to enable the query (default: true)
 */
export function useParentDashboard(
  parentId: string,
  enabled: boolean = true
): UseQueryResult<ParentDashboard, Error> {
  return useQuery({
    queryKey: ['parentDashboard', parentId],
    queryFn: () => getParentDashboard(parentId),
    enabled: enabled && !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch parent information
 * @param parentId - The parent UUID
 */
export function useParent(parentId: string): UseQueryResult<Parent | null, Error> {
  return useQuery({
    queryKey: ['parent', parentId],
    queryFn: () => getParentById(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch children summary
 * @param parentId - The parent UUID
 */
export function useChildrenSummary(parentId: string): UseQueryResult<ChildSummary[], Error> {
  return useQuery({
    queryKey: ['childrenSummary', parentId],
    queryFn: () => getChildrenSummary(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== ACTION ITEMS HOOKS ====================

/**
 * Hook to fetch action items
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 */
export function useActionItems(
  parentId: string,
  filters?: ActionItemFilters
): UseQueryResult<ParentActionItem[], Error> {
  return useQuery({
    queryKey: ['actionItems', parentId, filters],
    queryFn: () => getActionItems(parentId, filters),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ==================== AI INSIGHTS HOOKS ====================

/**
 * Hook to fetch AI insights
 * @param parentId - The parent UUID
 * @param studentId - Optional student filter
 */
export function useAIInsights(
  parentId: string,
  studentId?: string
): UseQueryResult<AIInsight[], Error> {
  return useQuery({
    queryKey: ['aiInsights', parentId, studentId],
    queryFn: () => getAIInsights(parentId, studentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== FINANCIAL HOOKS ====================

/**
 * Hook to fetch financial summary
 * @param parentId - The parent UUID
 */
export function useFinancialSummary(parentId: string): UseQueryResult<FinancialSummary, Error> {
  return useQuery({
    queryKey: ['financialSummary', parentId],
    queryFn: () => getFinancialSummary(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch fees
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 */
export function useFees(
  parentId: string,
  filters?: FeeFilters
): UseQueryResult<StudentFee[], Error> {
  return useQuery({
    queryKey: ['fees', parentId, filters],
    queryFn: () => getFees(parentId, filters),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch fee balance
 * @param parentId - The parent UUID
 */
export function useFeeBalance(parentId: string): UseQueryResult<FeeBalance, Error> {
  return useQuery({
    queryKey: ['feeBalance', parentId],
    queryFn: () => getFeeBalance(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch overdue fees
 * @param parentId - The parent UUID
 */
export function useOverdueFees(parentId: string): UseQueryResult<StudentFee[], Error> {
  return useQuery({
    queryKey: ['overdueFees', parentId],
    queryFn: () => getOverdueFees(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch payment history
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 */
export function usePaymentHistory(
  parentId: string,
  filters?: PaymentFilters
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: ['paymentHistory', parentId, filters],
    queryFn: () => getPaymentHistory(parentId, filters),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch invoices
 * @param parentId - The parent UUID
 */
export function useInvoices(parentId: string): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['invoices', parentId],
    queryFn: () => getInvoices(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook to initiate payment
 */
export function useInitiatePayment(): UseMutationResult<
  Payment,
  Error,
  { parentId: string; feeIds: string[]; paymentMethod: PaymentMethod }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, feeIds, paymentMethod }) =>
      initiatePayment(parentId, feeIds, paymentMethod),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['financialSummary', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['fees', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['feeBalance', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', variables.parentId] });
    },
  });
}

/**
 * Hook to download receipt
 */
export function useDownloadReceipt(): UseMutationResult<string, Error, string> {
  return useMutation({
    mutationFn: (paymentId: string) => downloadReceipt(paymentId),
  });
}

/**
 * Hook to download invoice
 */
export function useDownloadInvoice(): UseMutationResult<string, Error, string> {
  return useMutation({
    mutationFn: (invoiceId: string) => downloadInvoice(invoiceId),
  });
}
