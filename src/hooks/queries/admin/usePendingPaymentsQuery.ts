/**
 * usePendingPaymentsQuery - Query hook for pending payments list
 * 
 * Phase 2: Query Hook (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Fetches pending payments from financial_transactions table with:
 * - Filter for pending status
 * - Overdue detection based on transaction_date
 * - Sorting by date (oldest first for urgency)
 * - Uses useCustomerId() for RLS compliance
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type PaymentCategory = 'fees' | 'subscription' | 'salary' | 'utilities' | 'materials' | 'other';

export type PendingPayment = {
  id: string;
  category: PaymentCategory;
  amount: number;
  description: string;
  reference?: string;
  transaction_date: string;
  isOverdue: boolean;
  daysOverdue: number;
  user_id?: string;
  created_at: string;
};

export type PendingPaymentsData = {
  payments: PendingPayment[];
  totalCount: number;
  overdueCount: number;
  totalPendingAmount: number;
  hasMore: boolean;
};

// Demo data for when no real data exists
const DEMO_PENDING_PAYMENTS: PendingPayment[] = [
  {
    id: 'demo-pending-1',
    category: 'fees',
    amount: 15000,
    description: 'Tuition Fee - Rahul Sharma',
    reference: 'FEE-2024-001',
    transaction_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    isOverdue: true,
    daysOverdue: 5,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-pending-2',
    category: 'fees',
    amount: 12000,
    description: 'Exam Fee - Priya Patel',
    reference: 'FEE-2024-002',
    transaction_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    isOverdue: true,
    daysOverdue: 2,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-pending-3',
    category: 'utilities',
    amount: 8500,
    description: 'Internet Bill - December',
    reference: 'UTIL-2024-001',
    transaction_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    isOverdue: false,
    daysOverdue: 0,
    created_at: new Date().toISOString(),
  },
];

export type UsePendingPaymentsQueryOptions = {
  limit?: number;
  offset?: number;
  showOverdueOnly?: boolean;
  categoryFilter?: PaymentCategory | 'all';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
};

export function usePendingPaymentsQuery(options: UsePendingPaymentsQueryOptions = {}) {
  const {
    limit = 5,
    offset = 0,
    showOverdueOnly = false,
    categoryFilter = 'all',
    sortOrder = 'asc', // Oldest first by default (most urgent)
    enabled = true,
  } = options;

  const customerId = useCustomerId();

  return useQuery({
    queryKey: [
      'admin',
      'finance',
      'pending-payments',
      customerId,
      { limit, offset, showOverdueOnly, categoryFilter, sortOrder },
    ],
    queryFn: async (): Promise<PendingPaymentsData> => {
      const supabase = getSupabaseClient();
      const now = new Date();

      // Build query for pending payments
      let query = supabase
        .from('financial_transactions')
        .select('id, category, amount, description_en, description_hi, reference_number, transaction_date, user_id, created_at', { count: 'exact' })
        .eq('customer_id', customerId)
        .eq('status', 'pending');

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Apply sorting (oldest first for urgency by default)
      query = query.order('transaction_date', { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[usePendingPaymentsQuery] Error fetching pending payments:', error);
        throw error;
      }

      // Calculate overdue status and map data
      const payments: PendingPayment[] = (data || []).map(item => {
        const transactionDate = new Date(item.transaction_date);
        const diffTime = now.getTime() - transactionDate.getTime();
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = daysOverdue > 0;

        return {
          id: item.id,
          category: (item.category || 'other') as PaymentCategory,
          amount: Number(item.amount || 0),
          description: item.description_en || 'Payment',
          reference: item.reference_number || undefined,
          transaction_date: item.transaction_date,
          isOverdue,
          daysOverdue: Math.max(0, daysOverdue),
          user_id: item.user_id || undefined,
          created_at: item.created_at,
        };
      });

      // Filter overdue only if requested
      const filteredPayments = showOverdueOnly 
        ? payments.filter(p => p.isOverdue)
        : payments;

      // Calculate totals
      const overdueCount = payments.filter(p => p.isOverdue).length;
      const totalPendingAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalCount = count || 0;
      const hasMore = offset + payments.length < totalCount;

      // If no real data, return demo data
      if (payments.length === 0 && offset === 0) {
        const demoOverdueCount = DEMO_PENDING_PAYMENTS.filter(p => p.isOverdue).length;
        const demoTotalAmount = DEMO_PENDING_PAYMENTS.reduce((sum, p) => sum + p.amount, 0);
        return {
          payments: DEMO_PENDING_PAYMENTS,
          totalCount: DEMO_PENDING_PAYMENTS.length,
          overdueCount: demoOverdueCount,
          totalPendingAmount: demoTotalAmount,
          hasMore: false,
        };
      }

      if (__DEV__) {
        console.log('[usePendingPaymentsQuery] Data:', {
          customerId,
          count: filteredPayments.length,
          totalCount,
          overdueCount,
          totalPendingAmount,
          hasMore,
        });
      }

      return {
        payments: filteredPayments,
        totalCount,
        overdueCount,
        totalPendingAmount,
        hasMore,
      };
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
}

export default usePendingPaymentsQuery;
