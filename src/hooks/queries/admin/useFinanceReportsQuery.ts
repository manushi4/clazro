/**
 * useFinanceReportsQuery - Finance Reports Data Hook
 * Sprint 6: Finance Charts + Reports
 *
 * Purpose: Fetch comprehensive financial report data for the finance-reports screen
 * Used by: FinanceReportsScreen, MonthlyChartWidget, CategoryBreakdownWidget, CollectionRateWidget
 *
 * Features:
 * - Monthly trend data (revenue vs expenses)
 * - Category breakdown (revenue and expense categories)
 * - Collection rate metrics
 * - Period comparison (current vs previous)
 * - Export-ready data formatting
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import {
  subDays,
  subMonths,
  subQuarters,
  subYears,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
} from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';
export type ReportType = 'monthly' | 'category' | 'collection' | 'summary' | 'transactions';

export type MonthlyTrendPoint = {
  month: string;
  monthLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type CategoryItem = {
  category: string;
  categoryLabel: string;
  amount: number;
  percentage: number;
  color: string;
};

export type CollectionMetrics = {
  collectionRate: number;
  collected: number;
  pending: number;
  overdue: number;
  totalExpected: number;
};

export type PeriodComparison = {
  currentPeriod: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  previousPeriod: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  growth: {
    revenue: number;
    expenses: number;
    profit: number;
  };
};

export type FinanceReportsData = {
  // Monthly trend data (for line charts)
  monthlyTrend: MonthlyTrendPoint[];
  labels: string[];
  revenue: number[];
  expenses: number[];

  // Category breakdown (for pie charts)
  revenueCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  categories: {
    tuition: number;
    exam: number;
    materials: number;
    other: number;
  };

  // Collection metrics
  collectionRate: number;
  collected: number;
  pending: number;
  overdue: number;

  // Summary totals
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;

  // Period comparison
  comparison: PeriodComparison;

  // Metadata
  period: ReportPeriod;
  generatedAt: string;
};

export type UseFinanceReportsQueryOptions = {
  type?: ReportType;
  period?: ReportPeriod;
  months?: number;
  enabled?: boolean;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const REVENUE_CATEGORY_COLORS: Record<string, string> = {
  fees: '#4CAF50',
  tuition: '#4CAF50',
  subscription: '#2196F3',
  exam: '#9C27B0',
  materials: '#FF9800',
  other: '#607D8B',
};

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  salary: '#F44336',
  utilities: '#FF5722',
  materials: '#FF9800',
  maintenance: '#795548',
  marketing: '#E91E63',
  other: '#9E9E9E',
};

const CATEGORY_LABELS: Record<string, string> = {
  fees: 'Tuition Fees',
  tuition: 'Tuition Fees',
  subscription: 'Subscriptions',
  exam: 'Exam Fees',
  materials: 'Materials',
  salary: 'Salaries',
  utilities: 'Utilities',
  maintenance: 'Maintenance',
  marketing: 'Marketing',
  other: 'Other',
};

// Demo data for development/testing
const DEMO_FINANCE_REPORTS: FinanceReportsData = {
  monthlyTrend: [
    { month: '2024-07', monthLabel: 'Jul', revenue: 180000, expenses: 120000, profit: 60000 },
    { month: '2024-08', monthLabel: 'Aug', revenue: 195000, expenses: 125000, profit: 70000 },
    { month: '2024-09', monthLabel: 'Sep', revenue: 210000, expenses: 130000, profit: 80000 },
    { month: '2024-10', monthLabel: 'Oct', revenue: 225000, expenses: 140000, profit: 85000 },
    { month: '2024-11', monthLabel: 'Nov', revenue: 240000, expenses: 145000, profit: 95000 },
    { month: '2024-12', monthLabel: 'Dec', revenue: 250000, expenses: 150000, profit: 100000 },
  ],
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  revenue: [180000, 195000, 210000, 225000, 240000, 250000],
  expenses: [120000, 125000, 130000, 140000, 145000, 150000],
  revenueCategories: [
    { category: 'tuition', categoryLabel: 'Tuition Fees', amount: 850000, percentage: 68, color: '#4CAF50' },
    { category: 'exam', categoryLabel: 'Exam Fees', amount: 200000, percentage: 16, color: '#9C27B0' },
    { category: 'materials', categoryLabel: 'Materials', amount: 125000, percentage: 10, color: '#FF9800' },
    { category: 'other', categoryLabel: 'Other', amount: 75000, percentage: 6, color: '#607D8B' },
  ],
  expenseCategories: [
    { category: 'salary', categoryLabel: 'Salaries', amount: 500000, percentage: 58, color: '#F44336' },
    { category: 'utilities', categoryLabel: 'Utilities', amount: 150000, percentage: 17, color: '#FF5722' },
    { category: 'materials', categoryLabel: 'Materials', amount: 125000, percentage: 15, color: '#FF9800' },
    { category: 'other', categoryLabel: 'Other', amount: 85000, percentage: 10, color: '#9E9E9E' },
  ],
  categories: {
    tuition: 850000,
    exam: 200000,
    materials: 125000,
    other: 75000,
  },
  collectionRate: 88,
  collected: 1100000,
  pending: 125000,
  overdue: 25000,
  totalRevenue: 1250000,
  totalExpenses: 860000,
  netProfit: 390000,
  profitMargin: 31.2,
  comparison: {
    currentPeriod: { revenue: 1250000, expenses: 860000, profit: 390000 },
    previousPeriod: { revenue: 1100000, expenses: 800000, profit: 300000 },
    growth: { revenue: 13.6, expenses: 7.5, profit: 30.0 },
  },
  period: 'month',
  generatedAt: new Date().toISOString(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPeriodDates(period: ReportPeriod): { startDate: Date; previousStartDate: Date; previousEndDate: Date } {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;
  let previousEndDate: Date;

  switch (period) {
    case 'week':
      startDate = subDays(now, 7);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subDays(previousEndDate, 7);
      break;
    case 'month':
      startDate = subMonths(now, 1);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subMonths(previousEndDate, 1);
      break;
    case 'quarter':
      startDate = subQuarters(now, 1);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subQuarters(previousEndDate, 1);
      break;
    case 'year':
      startDate = subYears(now, 1);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subYears(previousEndDate, 1);
      break;
    default:
      startDate = subMonths(now, 1);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = subMonths(previousEndDate, 1);
  }

  return { startDate, previousStartDate, previousEndDate };
}

function calculatePercentages(items: { category: string; amount: number }[]): CategoryItem[] {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return [];

  return items.map((item) => ({
    category: item.category,
    categoryLabel: CATEGORY_LABELS[item.category] || item.category,
    amount: item.amount,
    percentage: Math.round((item.amount / total) * 100),
    color: REVENUE_CATEGORY_COLORS[item.category] || EXPENSE_CATEGORY_COLORS[item.category] || '#607D8B',
  }));
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useFinanceReportsQuery(options?: UseFinanceReportsQueryOptions) {
  const customerId = useCustomerId();
  const type = options?.type || 'summary';
  const period = options?.period || 'month';
  const months = options?.months || 6;
  const enabled = options?.enabled !== false;

  return useQuery({
    queryKey: ['finance-reports', customerId, type, period, months],
    queryFn: async (): Promise<FinanceReportsData> => {
      const supabase = getSupabaseClient();
      const { startDate, previousStartDate, previousEndDate } = getPeriodDates(period);
      const now = new Date();

      // Fetch monthly data for trend chart
      const monthlyStartDate = startOfMonth(subMonths(now, months - 1));
      const { data: monthlyTransactions } = await supabase
        .from('financial_transactions')
        .select('amount, type, category, transaction_date, status')
        .eq('customer_id', customerId)
        .eq('status', 'completed')
        .gte('transaction_date', monthlyStartDate.toISOString())
        .order('transaction_date', { ascending: true });

      // Fetch current period transactions
      const { data: currentTransactions } = await supabase
        .from('financial_transactions')
        .select('amount, type, category, status')
        .eq('customer_id', customerId)
        .gte('transaction_date', startDate.toISOString());

      // Fetch previous period transactions
      const { data: previousTransactions } = await supabase
        .from('financial_transactions')
        .select('amount, type, category, status')
        .eq('customer_id', customerId)
        .gte('transaction_date', previousStartDate.toISOString())
        .lt('transaction_date', previousEndDate.toISOString());

      // Fetch pending/overdue payments
      const { data: pendingPayments } = await supabase
        .from('financial_transactions')
        .select('amount, due_date, status')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .in('status', ['pending', 'overdue']);

      // Process monthly trend data
      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(now, months - 1 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      monthlyTransactions?.forEach((t) => {
        const monthKey = format(parseISO(t.transaction_date), 'yyyy-MM');
        if (monthlyData[monthKey]) {
          if (t.type === 'income') {
            monthlyData[monthKey].revenue += Number(t.amount);
          } else if (t.type === 'expense') {
            monthlyData[monthKey].expenses += Number(t.amount);
          }
        }
      });

      const monthlyTrend: MonthlyTrendPoint[] = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        monthLabel: format(parseISO(month + '-01'), 'MMM'),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));

      // Process category breakdowns
      const revenueByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};

      currentTransactions?.forEach((t) => {
        if (t.status === 'completed') {
          const category = t.category || 'other';
          if (t.type === 'income') {
            revenueByCategory[category] = (revenueByCategory[category] || 0) + Number(t.amount);
          } else if (t.type === 'expense') {
            expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(t.amount);
          }
        }
      });

      const revenueCategories = calculatePercentages(
        Object.entries(revenueByCategory).map(([category, amount]) => ({ category, amount }))
      ).sort((a, b) => b.amount - a.amount);

      const expenseCategories = calculatePercentages(
        Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount }))
      ).sort((a, b) => b.amount - a.amount);

      // Calculate totals
      const totalRevenue = currentTransactions
        ?.filter((t) => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpenses = currentTransactions
        ?.filter((t) => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const previousRevenue = previousTransactions
        ?.filter((t) => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const previousExpenses = previousTransactions
        ?.filter((t) => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate collection metrics
      const pending = pendingPayments
        ?.filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const overdue = pendingPayments
        ?.filter((p) => p.status === 'overdue' || (p.due_date && new Date(p.due_date) < now))
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const totalExpected = totalRevenue + pending + overdue;
      const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 100;

      // Calculate growth percentages
      const revenueGrowth = previousRevenue > 0
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10
        : totalRevenue > 0 ? 100 : 0;

      const expenseGrowth = previousExpenses > 0
        ? Math.round(((totalExpenses - previousExpenses) / previousExpenses) * 1000) / 10
        : totalExpenses > 0 ? 100 : 0;

      const netProfit = totalRevenue - totalExpenses;
      const previousProfit = previousRevenue - previousExpenses;
      const profitGrowth = previousProfit > 0
        ? Math.round(((netProfit - previousProfit) / previousProfit) * 1000) / 10
        : netProfit > 0 ? 100 : 0;

      const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

      // If no real data, return demo data
      if (totalRevenue === 0 && totalExpenses === 0 && monthlyTrend.every((m) => m.revenue === 0)) {
        return DEMO_FINANCE_REPORTS;
      }

      return {
        monthlyTrend,
        labels: monthlyTrend.map((m) => m.monthLabel),
        revenue: monthlyTrend.map((m) => m.revenue),
        expenses: monthlyTrend.map((m) => m.expenses),
        revenueCategories,
        expenseCategories,
        categories: {
          tuition: revenueByCategory['tuition'] || revenueByCategory['fees'] || 0,
          exam: revenueByCategory['exam'] || 0,
          materials: revenueByCategory['materials'] || 0,
          other: revenueByCategory['other'] || 0,
        },
        collectionRate,
        collected: totalRevenue,
        pending,
        overdue,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        comparison: {
          currentPeriod: { revenue: totalRevenue, expenses: totalExpenses, profit: netProfit },
          previousPeriod: { revenue: previousRevenue, expenses: previousExpenses, profit: previousProfit },
          growth: { revenue: revenueGrowth, expenses: expenseGrowth, profit: profitGrowth },
        },
        period,
        generatedAt: new Date().toISOString(),
      };
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export default useFinanceReportsQuery;
