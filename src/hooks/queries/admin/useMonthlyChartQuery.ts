import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export type MonthlyChartPeriod = 3 | 6 | 12;

export type MonthlyDataPoint = {
  month: string;
  monthLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type MonthlyChartData = {
  dataPoints: MonthlyDataPoint[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  averageRevenue: number;
  averageExpenses: number;
  highestRevenueMonth: string;
  lowestExpenseMonth: string;
};

type UseMonthlyChartOptions = {
  months?: MonthlyChartPeriod;
};

export function useMonthlyChartQuery(options?: UseMonthlyChartOptions) {
  const customerId = useCustomerId();
  const months = options?.months || 6;

  return useQuery({
    queryKey: ['monthly-chart', customerId, months],
    queryFn: async (): Promise<MonthlyChartData> => {
      const supabase = getSupabaseClient();
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, months - 1));

      // Fetch all transactions for the period
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('amount, type, transaction_date, status')
        .eq('customer_id', customerId)
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Initialize monthly data structure
      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      
      // Create entries for each month in the range
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(now, months - 1 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      // Aggregate transactions by month
      transactions?.forEach((t) => {
        const monthKey = format(new Date(t.transaction_date), 'yyyy-MM');
        if (monthlyData[monthKey]) {
          if (t.type === 'income') {
            monthlyData[monthKey].revenue += Number(t.amount);
          } else if (t.type === 'expense') {
            monthlyData[monthKey].expenses += Number(t.amount);
          }
        }
      });

      // Convert to array of data points
      const dataPoints: MonthlyDataPoint[] = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        monthLabel: format(new Date(month + '-01'), 'MMM'),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));

      // Calculate totals and averages
      const totalRevenue = dataPoints.reduce((sum, d) => sum + d.revenue, 0);
      const totalExpenses = dataPoints.reduce((sum, d) => sum + d.expenses, 0);
      const totalProfit = totalRevenue - totalExpenses;
      const averageRevenue = totalRevenue / months;
      const averageExpenses = totalExpenses / months;

      // Find highest revenue and lowest expense months
      const highestRevenueMonth = dataPoints.reduce((max, d) => 
        d.revenue > max.revenue ? d : max, dataPoints[0])?.monthLabel || '';
      const lowestExpenseMonth = dataPoints.reduce((min, d) => 
        d.expenses < min.expenses ? d : min, dataPoints[0])?.monthLabel || '';

      return {
        dataPoints,
        totalRevenue,
        totalExpenses,
        totalProfit,
        averageRevenue,
        averageExpenses,
        highestRevenueMonth,
        lowestExpenseMonth,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
