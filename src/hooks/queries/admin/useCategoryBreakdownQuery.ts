import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subMonths, subQuarters, subYears, startOfDay } from 'date-fns';

export type CategoryBreakdownPeriod = 'week' | 'month' | 'quarter' | 'year';
export type CategoryBreakdownType = 'revenue' | 'expense' | 'both';

export type CategoryItem = {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
};

export type CategoryBreakdownData = {
  revenueCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  totalRevenue: number;
  totalExpenses: number;
  topRevenueCategory: string;
  topExpenseCategory: string;
};

type UseCategoryBreakdownOptions = {
  period?: CategoryBreakdownPeriod;
  type?: CategoryBreakdownType;
};

// Category colors for consistent display
const CATEGORY_COLORS: Record<string, string> = {
  // Revenue categories
  fees: '#4CAF50',
  subscription: '#2196F3',
  donation: '#9C27B0',
  grant: '#FF9800',
  other_income: '#607D8B',
  // Expense categories
  salary: '#F44336',
  utilities: '#E91E63',
  materials: '#673AB7',
  maintenance: '#3F51B5',
  marketing: '#00BCD4',
  other_expense: '#795548',
  // Default
  other: '#9E9E9E',
};

function getPeriodStartDate(period: CategoryBreakdownPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return subDays(now, 7);
    case 'month':
      return subMonths(now, 1);
    case 'quarter':
      return subQuarters(now, 1);
    case 'year':
      return subYears(now, 1);
    default:
      return subMonths(now, 1);
  }
}

function getCategoryColor(category: string, type: 'income' | 'expense'): string {
  const key = category.toLowerCase().replace(/\s+/g, '_');
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  if (type === 'income') return CATEGORY_COLORS.other_income;
  return CATEGORY_COLORS.other_expense;
}

export function useCategoryBreakdownQuery(options?: UseCategoryBreakdownOptions) {
  const customerId = useCustomerId();
  const period = options?.period || 'month';
  const type = options?.type || 'both';

  return useQuery({
    queryKey: ['category-breakdown', customerId, period, type],
    queryFn: async (): Promise<CategoryBreakdownData> => {
      const supabase = getSupabaseClient();
      const startDate = getPeriodStartDate(period);

      // Fetch revenue transactions by category
      const { data: revenueData, error: revenueError } = await supabase
        .from('financial_transactions')
        .select('amount, category')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      if (revenueError) throw revenueError;

      // Fetch expense transactions by category
      const { data: expenseData, error: expenseError } = await supabase
        .from('financial_transactions')
        .select('amount, category')
        .eq('customer_id', customerId)
        .eq('type', 'expense')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      if (expenseError) throw expenseError;

      // Aggregate revenue by category
      const revenueByCategory: Record<string, { amount: number; count: number }> = {};
      revenueData?.forEach((t) => {
        const cat = t.category || 'other';
        if (!revenueByCategory[cat]) {
          revenueByCategory[cat] = { amount: 0, count: 0 };
        }
        revenueByCategory[cat].amount += Number(t.amount);
        revenueByCategory[cat].count += 1;
      });

      // Aggregate expenses by category
      const expenseByCategory: Record<string, { amount: number; count: number }> = {};
      expenseData?.forEach((t) => {
        const cat = t.category || 'other';
        if (!expenseByCategory[cat]) {
          expenseByCategory[cat] = { amount: 0, count: 0 };
        }
        expenseByCategory[cat].amount += Number(t.amount);
        expenseByCategory[cat].count += 1;
      });

      // Calculate totals
      const totalRevenue = Object.values(revenueByCategory).reduce((sum, c) => sum + c.amount, 0);
      const totalExpenses = Object.values(expenseByCategory).reduce((sum, c) => sum + c.amount, 0);

      // Convert to CategoryItem arrays with percentages
      const revenueCategories: CategoryItem[] = Object.entries(revenueByCategory)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          percentage: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0,
          color: getCategoryColor(category, 'income'),
          transactionCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      const expenseCategories: CategoryItem[] = Object.entries(expenseByCategory)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0,
          color: getCategoryColor(category, 'expense'),
          transactionCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Find top categories
      const topRevenueCategory = revenueCategories[0]?.category || '';
      const topExpenseCategory = expenseCategories[0]?.category || '';

      return {
        revenueCategories,
        expenseCategories,
        totalRevenue,
        totalExpenses,
        topRevenueCategory,
        topExpenseCategory,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
