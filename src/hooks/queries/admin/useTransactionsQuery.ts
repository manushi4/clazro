/**
 * useTransactionsQuery - Query hook for financial transactions list
 * 
 * Phase 2: Query Hook (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Fetches transactions from financial_transactions table with:
 * - Type filtering (income, expense, all)
 * - Status filtering (completed, pending, failed)
 * - Category filtering
 * - Pagination support
 * - Sorting options
 * - Uses useCustomerId() for RLS compliance
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type TransactionCategory = 'fees' | 'subscription' | 'salary' | 'utilities' | 'materials' | 'other';

export type Transaction = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  status: TransactionStatus;
  reference?: string;
  transaction_date: string;
  created_at: string;
};

export type TransactionsData = {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
};

// Demo data for when no real data exists
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    type: 'income',
    category: 'fees',
    amount: 25000,
    description: 'Tuition Fee - Class 10A',
    status: 'completed',
    reference: 'TXN-001',
    transaction_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    type: 'expense',
    category: 'salary',
    amount: 45000,
    description: 'Teacher Salary - December',
    status: 'completed',
    reference: 'TXN-002',
    transaction_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    type: 'income',
    category: 'subscription',
    amount: 5000,
    description: 'Premium Subscription',
    status: 'completed',
    reference: 'TXN-003',
    transaction_date: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'demo-4',
    type: 'expense',
    category: 'utilities',
    amount: 8500,
    description: 'Electricity Bill',
    status: 'pending',
    reference: 'TXN-004',
    transaction_date: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'demo-5',
    type: 'income',
    category: 'fees',
    amount: 15000,
    description: 'Exam Fee Collection',
    status: 'completed',
    reference: 'TXN-005',
    transaction_date: new Date(Date.now() - 345600000).toISOString(),
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
];

export type UseTransactionsQueryOptions = {
  limit?: number;
  offset?: number;
  typeFilter?: TransactionType | 'all';
  statusFilter?: TransactionStatus | 'all';
  categoryFilter?: TransactionCategory | 'all';
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
};

export function useTransactionsQuery(options: UseTransactionsQueryOptions = {}) {
  const {
    limit = 5,
    offset = 0,
    typeFilter = 'all',
    statusFilter = 'all',
    categoryFilter = 'all',
    sortBy = 'date',
    sortOrder = 'desc',
    enabled = true,
  } = options;

  const customerId = useCustomerId();

  return useQuery({
    queryKey: [
      'admin',
      'finance',
      'transactions',
      customerId,
      { limit, offset, typeFilter, statusFilter, categoryFilter, sortBy, sortOrder },
    ],
    queryFn: async (): Promise<TransactionsData> => {
      const supabase = getSupabaseClient();

      try {
        // Build query
        let query = supabase
          .from('financial_transactions')
          .select('id, type, category, amount, description_en, description_hi, status, reference, transaction_date, created_at', { count: 'exact' })
          .eq('customer_id', customerId);

        // Apply type filter
        if (typeFilter !== 'all') {
          query = query.eq('type', typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter);
        }

        // Apply sorting
        const sortColumn = sortBy === 'amount' ? 'amount' : 'transaction_date';
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          console.warn('[useTransactionsQuery] Error fetching transactions, using demo data:', error);
          return {
            transactions: DEMO_TRANSACTIONS,
            totalCount: DEMO_TRANSACTIONS.length,
            hasMore: false,
          };
        }

        // Map data to Transaction type
        const transactions: Transaction[] = (data || []).map(item => ({
          id: item.id,
          type: item.type as TransactionType,
          category: (item.category || 'other') as TransactionCategory,
          amount: Number(item.amount || 0),
          description: item.description_en || 'Transaction',
          status: (item.status || 'completed') as TransactionStatus,
          reference: item.reference || undefined,
          transaction_date: item.transaction_date,
          created_at: item.created_at,
        }));

        const totalCount = count || 0;
        const hasMore = offset + transactions.length < totalCount;

        // If no real data, return demo data
        if (transactions.length === 0 && offset === 0) {
          return {
            transactions: DEMO_TRANSACTIONS,
            totalCount: DEMO_TRANSACTIONS.length,
            hasMore: false,
          };
        }

        if (__DEV__) {
          console.log('[useTransactionsQuery] Data:', {
            customerId,
            count: transactions.length,
            totalCount,
            hasMore,
            filters: { typeFilter, statusFilter, categoryFilter },
          });
        }

        return {
          transactions,
          totalCount,
          hasMore,
        };
      } catch (error) {
        console.warn('[useTransactionsQuery] Query failed, using demo data:', error);
        return {
          transactions: DEMO_TRANSACTIONS,
          totalCount: DEMO_TRANSACTIONS.length,
          hasMore: false,
        };
      }
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
}

export default useTransactionsQuery;
