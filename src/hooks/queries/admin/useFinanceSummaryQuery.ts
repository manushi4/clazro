import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subMonths, subQuarters, subYears, startOfDay } from 'date-fns';

export type FinancePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';

export type FinanceSummaryData = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  growth: number;
  breakdown: {
    fees: number;
    subscriptions: number;
    other: number;
  };
  expenseBreakdown: {
    salary: number;
    utilities: number;
    materials: number;
    other: number;
  };
  pendingPayments: number;
  collectionRate: number;
};

// Demo data for when no real data exists
const DEMO_FINANCE_DATA: FinanceSummaryData = {
  totalRevenue: 1250000,
  totalExpenses: 875000,
  netProfit: 375000,
  growth: 12.5,
  breakdown: {
    fees: 950000,
    subscriptions: 200000,
    other: 100000,
  },
  expenseBreakdown: {
    salary: 500000,
    utilities: 125000,
    materials: 150000,
    other: 100000,
  },
  pendingPayments: 175000,
  collectionRate: 88,
};

type UseFinanceSummaryOptions = {
  period?: FinancePeriod;
};

function getPeriodDates(period: FinancePeriod): { startDate: Date; previousStartDate: Date } {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;

  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      previousStartDate = startOfDay(subDays(now, 1));
      break;
    case 'week':
      startDate = subDays(now, 7);
      previousStartDate = subDays(now, 14);
      break;
    case 'month':
      startDate = subMonths(now, 1);
      previousStartDate = subMonths(now, 2);
      break;
    case 'quarter':
      startDate = subQuarters(now, 1);
      previousStartDate = subQuarters(now, 2);
      break;
    case 'year':
      startDate = subYears(now, 1);
      previousStartDate = subYears(now, 2);
      break;
    default:
      startDate = subMonths(now, 1);
      previousStartDate = subMonths(now, 2);
  }

  return { startDate, previousStartDate };
}

export function useFinanceSummaryQuery(options?: UseFinanceSummaryOptions) {
  const customerId = useCustomerId();
  const period = options?.period || 'month';

  return useQuery({
    queryKey: ['finance-summary', customerId, period],
    queryFn: async (): Promise<FinanceSummaryData> => {
      const supabase = getSupabaseClient();
      const { startDate, previousStartDate } = getPeriodDates(period);

      // Fetch current period income
      const { data: currentIncome } = await supabase
        .from('financial_transactions')
        .select('amount, category')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      // Fetch current period expenses
      const { data: currentExpenses } = await supabase
        .from('financial_transactions')
        .select('amount, category')
        .eq('customer_id', customerId)
        .eq('type', 'expense')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      // Fetch previous period income (for growth calculation)
      const { data: previousIncome } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', previousStartDate.toISOString())
        .lt('transaction_date', startDate.toISOString());

      // Fetch pending payments
      const { data: pendingData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'pending');

      // Calculate totals
      const totalRevenue = currentIncome?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = currentExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const previousRevenue = previousIncome?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const pendingPayments = pendingData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate growth percentage
      const growth = previousRevenue > 0
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
        : totalRevenue > 0 ? 100 : 0;

      // Revenue breakdown by category
      const breakdown = {
        fees: currentIncome?.filter(t => t.category === 'fees').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        subscriptions: currentIncome?.filter(t => t.category === 'subscription').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        other: currentIncome?.filter(t => !['fees', 'subscription'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      // Expense breakdown by category
      const expenseBreakdown = {
        salary: currentExpenses?.filter(t => t.category === 'salary').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        utilities: currentExpenses?.filter(t => t.category === 'utilities').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        materials: currentExpenses?.filter(t => t.category === 'materials').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        other: currentExpenses?.filter(t => !['salary', 'utilities', 'materials'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      // Calculate collection rate
      const totalExpected = totalRevenue + pendingPayments;
      const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 100;

      // If no real data, return demo data
      if (totalRevenue === 0 && totalExpenses === 0) {
        return DEMO_FINANCE_DATA;
      }

      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        growth,
        breakdown,
        expenseBreakdown,
        pendingPayments,
        collectionRate,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
