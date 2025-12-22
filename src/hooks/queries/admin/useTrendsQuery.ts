import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subWeeks, subMonths, format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export type TrendMetric = 'users' | 'revenue' | 'engagement' | 'content';
export type TrendPeriod = 'week' | 'month' | 'quarter';

export type TrendDataPoint = {
  label: string;
  value: number;
  date: string;
};

export type TrendData = {
  metric: TrendMetric;
  period: TrendPeriod;
  dataPoints: TrendDataPoint[];
  currentValue: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'stable';
  average: number;
  highest: number;
  lowest: number;
  highestLabel: string;
  lowestLabel: string;
};

type UseTrendsQueryOptions = {
  metric?: TrendMetric;
  period?: TrendPeriod;
};

function getDateRangeAndLabels(period: TrendPeriod): { startDate: Date; labels: string[]; groupBy: 'day' | 'week' | 'month' } {
  const now = new Date();
  
  switch (period) {
    case 'week':
      // Last 7 days
      return {
        startDate: subDays(now, 6),
        labels: Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), 'EEE')),
        groupBy: 'day',
      };
    case 'month':
      // Last 4 weeks
      return {
        startDate: subWeeks(now, 3),
        labels: ['W1', 'W2', 'W3', 'W4'],
        groupBy: 'week',
      };
    case 'quarter':
      // Last 3 months
      return {
        startDate: subMonths(now, 2),
        labels: Array.from({ length: 3 }, (_, i) => format(subMonths(now, 2 - i), 'MMM')),
        groupBy: 'month',
      };
    default:
      return {
        startDate: subDays(now, 6),
        labels: Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), 'EEE')),
        groupBy: 'day',
      };
  }
}

export function useTrendsQuery(options?: UseTrendsQueryOptions) {
  const customerId = useCustomerId();
  const metric = options?.metric || 'users';
  const period = options?.period || 'week';

  return useQuery({
    queryKey: ['analytics-trends', customerId, metric, period],
    queryFn: async (): Promise<TrendData> => {
      const supabase = getSupabaseClient();
      const { startDate, labels, groupBy } = getDateRangeAndLabels(period);
      const now = new Date();

      let dataPoints: TrendDataPoint[] = [];
      let currentValue = 0;
      let previousValue = 0;

      switch (metric) {
        case 'users': {
          // Fetch user registrations over time
          const { data: users, error } = await supabase
            .from('user_profiles')
            .select('created_at')
            .eq('customer_id', customerId)
            .gte('created_at', startDate.toISOString());

          if (error) throw error;

          // Group by period
          const grouped: Record<string, number> = {};
          labels.forEach(label => { grouped[label] = 0; });

          users?.forEach((user) => {
            const date = new Date(user.created_at);
            let label: string;
            
            if (groupBy === 'day') {
              label = format(date, 'EEE');
            } else if (groupBy === 'week') {
              const weekIndex = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
              label = `W${4 - Math.min(weekIndex, 3)}`;
            } else {
              label = format(date, 'MMM');
            }
            
            if (grouped[label] !== undefined) {
              grouped[label]++;
            }
          });

          dataPoints = labels.map((label, index) => ({
            label,
            value: grouped[label] || 0,
            date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
          }));

          // Get total users for current and previous period
          const { count: totalUsers } = await supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerId);

          currentValue = totalUsers || 0;
          
          // Previous period count (approximate)
          const prevStartDate = period === 'week' ? subDays(startDate, 7) :
                               period === 'month' ? subMonths(startDate, 1) :
                               subMonths(startDate, 3);
          
          const { count: prevUsers } = await supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .lt('created_at', startDate.toISOString());

          previousValue = prevUsers || 0;
          break;
        }

        case 'revenue': {
          // Fetch revenue over time
          const { data: transactions, error } = await supabase
            .from('financial_transactions')
            .select('amount, transaction_date')
            .eq('customer_id', customerId)
            .eq('type', 'income')
            .eq('status', 'completed')
            .gte('transaction_date', startDate.toISOString());

          if (error) throw error;

          // Group by period
          const grouped: Record<string, number> = {};
          labels.forEach(label => { grouped[label] = 0; });

          transactions?.forEach((t) => {
            const date = new Date(t.transaction_date);
            let label: string;
            
            if (groupBy === 'day') {
              label = format(date, 'EEE');
            } else if (groupBy === 'week') {
              const weekIndex = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
              label = `W${4 - Math.min(weekIndex, 3)}`;
            } else {
              label = format(date, 'MMM');
            }
            
            if (grouped[label] !== undefined) {
              grouped[label] += Number(t.amount);
            }
          });

          dataPoints = labels.map((label, index) => ({
            label,
            value: grouped[label] || 0,
            date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
          }));

          currentValue = dataPoints.reduce((sum, d) => sum + d.value, 0);

          // Previous period revenue
          const prevEndDate = startDate;
          const prevStartDate = period === 'week' ? subDays(startDate, 7) :
                               period === 'month' ? subMonths(startDate, 1) :
                               subMonths(startDate, 3);

          const { data: prevTransactions } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('customer_id', customerId)
            .eq('type', 'income')
            .eq('status', 'completed')
            .gte('transaction_date', prevStartDate.toISOString())
            .lt('transaction_date', prevEndDate.toISOString());

          previousValue = prevTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          break;
        }

        case 'engagement': {
          // Simulate engagement data (active sessions, logins, etc.)
          // In production, this would query actual engagement metrics
          const baseValue = 100;
          dataPoints = labels.map((label, index) => ({
            label,
            value: Math.floor(baseValue + Math.random() * 50 - 25 + index * 5),
            date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
          }));

          currentValue = dataPoints[dataPoints.length - 1]?.value || 0;
          previousValue = dataPoints[0]?.value || 0;
          break;
        }

        case 'content': {
          // Content views/interactions
          // In production, this would query content analytics
          const baseValue = 50;
          dataPoints = labels.map((label, index) => ({
            label,
            value: Math.floor(baseValue + Math.random() * 30 + index * 3),
            date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
          }));

          currentValue = dataPoints.reduce((sum, d) => sum + d.value, 0);
          previousValue = currentValue * 0.85; // Simulate 15% growth
          break;
        }
      }

      // Calculate statistics
      const values = dataPoints.map(d => d.value);
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const highest = Math.max(...values, 0);
      const lowest = Math.min(...values, 0);
      
      const highestIndex = values.indexOf(highest);
      const lowestIndex = values.indexOf(lowest);
      
      const changePercent = previousValue > 0 
        ? Math.round(((currentValue - previousValue) / previousValue) * 100)
        : currentValue > 0 ? 100 : 0;
      
      const changeDirection: 'up' | 'down' | 'stable' = 
        changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable';

      return {
        metric,
        period,
        dataPoints,
        currentValue,
        previousValue,
        changePercent,
        changeDirection,
        average: Math.round(average),
        highest,
        lowest,
        highestLabel: dataPoints[highestIndex]?.label || '',
        lowestLabel: dataPoints[lowestIndex]?.label || '',
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
