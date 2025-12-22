/**
 * useExpenseSummaryQuery - Query hook for expense summary data
 * 
 * Phase 2: Query Hook (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Fetches expense data from financial_transactions table with:
 * - Period-based filtering (week, month, quarter, year)
 * - Category breakdown (salary, utilities, materials, other)
 * - Growth calculation vs previous period
 * - Localized descriptions
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subMonths, subQuarters, subYears, startOfDay, endOfDay } from 'date-fns';

export type ExpensePeriod = 'week' | 'month' | 'quarter' | 'year';

export type ExpenseCategory = 'salary' | 'utilities' | 'materials' | 'other';

export type ExpenseBreakdown = {
  salary: number;
  utilities: number;
  materials: number;
  other: number;
};

export type ExpenseSummaryData = {
  totalExpenses: number;
  growth: number; // Percentage change vs previous period
  breakdown: ExpenseBreakdown;
  pendingExpenses: number;
  transactionCount: number;
  averageExpense: number;
  largestExpense: {
    amount: number;
    description: string;
    category: string;
  } | null;
};

// Demo data for when no real data exists
const DEMO_EXPENSE_DATA: ExpenseSummaryData = {
  totalExpenses: 875000,
  growth: 8.5,
  breakdown: {
    salary: 500000,
    utilities: 125000,
    materials: 150000,
    other: 100000,
  },
  pendingExpenses: 45000,
  transactionCount: 42,
  averageExpense: 20833,
  largestExpense: {
    amount: 150000,
    description: 'Staff Salaries - December',
    category: 'salary',
  },
};

type UseExpenseSummaryQueryOptions = {
  period?: ExpensePeriod;
  enabled?: boolean;
};

/**
 * Get date range for the specified period
 */
function getDateRange(period: ExpensePeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);
  let start: Date;

  switch (period) {
    case 'week':
      start = startOfDay(subDays(now, 7));
      break;
    case 'month':
      start = startOfDay(subMonths(now, 1));
      break;
    case 'quarter':
      start = startOfDay(subQuarters(now, 1));
      break;
    case 'year':
      start = startOfDay(subYears(now, 1));
      break;
    default:
      start = startOfDay(subMonths(now, 1));
  }

  return { start, end };
}

/**
 * Get previous period date range for growth calculation
 */
function getPreviousPeriodRange(period: ExpensePeriod): { start: Date; end: Date } {
  const currentRange = getDateRange(period);
  const periodDuration = currentRange.end.getTime() - currentRange.start.getTime();
  
  return {
    start: new Date(currentRange.start.getTime() - periodDuration),
    end: new Date(currentRange.start.getTime() - 1), // End just before current period starts
  };
}

export function useExpenseSummaryQuery(options: UseExpenseSummaryQueryOptions = {}) {
  const { period = 'month', enabled = true } = options;
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['admin', 'finance', 'expense-summary', customerId, period],
    queryFn: async (): Promise<ExpenseSummaryData> => {
      const supabase = getSupabaseClient();
      const currentRange = getDateRange(period);
      const previousRange = getPreviousPeriodRange(period);

      // Fetch current period expenses
      const { data: currentExpenses, error: currentError } = await supabase
        .from('financial_transactions')
        .select('id, amount, category, description_en, description_hi, status, transaction_date')
        .eq('customer_id', customerId)
        .eq('type', 'expense')
        .gte('transaction_date', currentRange.start.toISOString())
        .lte('transaction_date', currentRange.end.toISOString());

      if (currentError) {
        console.error('[useExpenseSummaryQuery] Error fetching current expenses:', currentError);
        throw currentError;
      }

      // Fetch previous period expenses for growth calculation
      const { data: previousExpenses, error: previousError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'expense')
        .eq('status', 'completed')
        .gte('transaction_date', previousRange.start.toISOString())
        .lte('transaction_date', previousRange.end.toISOString());

      if (previousError) {
        console.error('[useExpenseSummaryQuery] Error fetching previous expenses:', previousError);
        // Don't throw, just log - we can still show current data
      }

      // Calculate totals
      const completedExpenses = currentExpenses?.filter(e => e.status === 'completed') || [];
      const pendingExpensesList = currentExpenses?.filter(e => e.status === 'pending') || [];

      const totalExpenses = completedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const pendingTotal = pendingExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const previousTotal = previousExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

      // Calculate growth percentage (for expenses, positive growth means more spending)
      let growth = 0;
      if (previousTotal > 0) {
        growth = Math.round(((totalExpenses - previousTotal) / previousTotal) * 100);
      } else if (totalExpenses > 0) {
        growth = 100; // 100% increase if no previous data
      }

      // Calculate breakdown by category
      const breakdown: ExpenseBreakdown = {
        salary: 0,
        utilities: 0,
        materials: 0,
        other: 0,
      };

      completedExpenses.forEach(expense => {
        const category = expense.category as ExpenseCategory;
        if (category in breakdown) {
          breakdown[category] += Number(expense.amount || 0);
        } else {
          breakdown.other += Number(expense.amount || 0);
        }
      });

      // Find largest expense
      let largestExpense = null;
      if (completedExpenses.length > 0) {
        const largest = completedExpenses.reduce((max, e) => 
          Number(e.amount || 0) > Number(max.amount || 0) ? e : max
        );
        largestExpense = {
          amount: Number(largest.amount || 0),
          description: largest.description_en || 'Unknown',
          category: largest.category || 'other',
        };
      }

      // Calculate average
      const transactionCount = completedExpenses.length;
      const averageExpense = transactionCount > 0 ? totalExpenses / transactionCount : 0;

      // If no real data, return demo data
      if (totalExpenses === 0 && transactionCount === 0) {
        return DEMO_EXPENSE_DATA;
      }

      if (__DEV__) {
        console.log('[useExpenseSummaryQuery] Data:', {
          customerId,
          period,
          totalExpenses,
          growth,
          breakdown,
          transactionCount,
        });
      }

      return {
        totalExpenses,
        growth,
        breakdown,
        pendingExpenses: pendingTotal,
        transactionCount,
        averageExpense,
        largestExpense,
      };
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export default useExpenseSummaryQuery;
