import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subWeeks, subMonths, subQuarters, subYears, format } from 'date-fns';

export type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'year';

export type ComparisonMetric = {
  id: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  unit?: string;
};

export type ComparisonData = {
  period: ComparisonPeriod;
  periodLabel: string;
  previousPeriodLabel: string;
  metrics: ComparisonMetric[];
  summary: {
    improved: number;
    declined: number;
    stable: number;
    overallTrend: 'positive' | 'negative' | 'neutral';
  };
};

type UseComparisonsQueryOptions = {
  period?: ComparisonPeriod;
};

function getDateRanges(period: ComparisonPeriod): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currentLabel: string;
  previousLabel: string;
} {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return {
        currentStart: subDays(now, 7),
        currentEnd: now,
        previousStart: subDays(now, 14),
        previousEnd: subDays(now, 7),
        currentLabel: 'This Week',
        previousLabel: 'Last Week',
      };
    case 'month':
      return {
        currentStart: subMonths(now, 1),
        currentEnd: now,
        previousStart: subMonths(now, 2),
        previousEnd: subMonths(now, 1),
        currentLabel: 'This Month',
        previousLabel: 'Last Month',
      };
    case 'quarter':
      return {
        currentStart: subMonths(now, 3),
        currentEnd: now,
        previousStart: subMonths(now, 6),
        previousEnd: subMonths(now, 3),
        currentLabel: 'This Quarter',
        previousLabel: 'Last Quarter',
      };
    case 'year':
      return {
        currentStart: subYears(now, 1),
        currentEnd: now,
        previousStart: subYears(now, 2),
        previousEnd: subYears(now, 1),
        currentLabel: 'This Year',
        previousLabel: 'Last Year',
      };
    default:
      return {
        currentStart: subDays(now, 7),
        currentEnd: now,
        previousStart: subDays(now, 14),
        previousEnd: subDays(now, 7),
        currentLabel: 'This Week',
        previousLabel: 'Last Week',
      };
  }
}

function calculateChange(current: number, previous: number): { percent: number; direction: 'up' | 'down' | 'stable' } {
  if (previous === 0) {
    return { percent: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'stable' };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  const direction = percent > 2 ? 'up' : percent < -2 ? 'down' : 'stable';
  return { percent: Math.abs(percent), direction };
}

export function useComparisonsQuery(options?: UseComparisonsQueryOptions) {
  const customerId = useCustomerId();
  const period = options?.period || 'week';

  return useQuery({
    queryKey: ['analytics-comparisons', customerId, period],
    queryFn: async (): Promise<ComparisonData> => {
      const supabase = getSupabaseClient();
      const { currentStart, currentEnd, previousStart, previousEnd, currentLabel, previousLabel } = getDateRanges(period);

      // Fetch current period users
      const { count: currentUsers } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', currentEnd.toISOString());

      // Fetch previous period users
      const { count: previousUsers } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', previousEnd.toISOString());

      // Fetch current period revenue
      const { data: currentRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', currentStart.toISOString())
        .lte('transaction_date', currentEnd.toISOString());

      const currentRevenueTotal = currentRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch previous period revenue
      const { data: previousRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', previousStart.toISOString())
        .lt('transaction_date', previousEnd.toISOString());

      const previousRevenueTotal = previousRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Simulate engagement metrics (in production, query actual data)
      const currentEngagement = 72 + Math.floor(Math.random() * 18);
      const previousEngagement = 68 + Math.floor(Math.random() * 18);

      // Simulate content views
      const currentContent = 850 + Math.floor(Math.random() * 300);
      const previousContent = 750 + Math.floor(Math.random() * 300);

      // Simulate active sessions
      const currentSessions = 1200 + Math.floor(Math.random() * 400);
      const previousSessions = 1100 + Math.floor(Math.random() * 400);

      // Calculate changes
      const userChange = calculateChange(currentUsers || 0, previousUsers || 0);
      const revenueChange = calculateChange(currentRevenueTotal, previousRevenueTotal);
      const engagementChange = calculateChange(currentEngagement, previousEngagement);
      const contentChange = calculateChange(currentContent, previousContent);
      const sessionsChange = calculateChange(currentSessions, previousSessions);

      // Build metrics array
      const metrics: ComparisonMetric[] = [
        {
          id: 'users',
          label: 'New Users',
          currentValue: currentUsers || 0,
          previousValue: previousUsers || 0,
          changePercent: userChange.percent,
          changeDirection: userChange.direction,
          icon: 'account-plus',
          color: 'primary',
        },
        {
          id: 'revenue',
          label: 'Revenue',
          currentValue: currentRevenueTotal,
          previousValue: previousRevenueTotal,
          changePercent: revenueChange.percent,
          changeDirection: revenueChange.direction,
          icon: 'currency-inr',
          color: 'success',
          unit: '₹',
        },
        {
          id: 'engagement',
          label: 'Engagement Rate',
          currentValue: currentEngagement,
          previousValue: previousEngagement,
          changePercent: engagementChange.percent,
          changeDirection: engagementChange.direction,
          icon: 'chart-timeline-variant',
          color: 'tertiary',
          unit: '%',
        },
        {
          id: 'content',
          label: 'Content Views',
          currentValue: currentContent,
          previousValue: previousContent,
          changePercent: contentChange.percent,
          changeDirection: contentChange.direction,
          icon: 'file-document-multiple',
          color: 'secondary',
        },
        {
          id: 'sessions',
          label: 'Active Sessions',
          currentValue: currentSessions,
          previousValue: previousSessions,
          changePercent: sessionsChange.percent,
          changeDirection: sessionsChange.direction,
          icon: 'account-clock',
          color: 'warning',
        },
      ];

      // Calculate summary
      const improved = metrics.filter(m => m.changeDirection === 'up').length;
      const declined = metrics.filter(m => m.changeDirection === 'down').length;
      const stable = metrics.filter(m => m.changeDirection === 'stable').length;
      const overallTrend = improved > declined ? 'positive' : improved < declined ? 'negative' : 'neutral';

      return {
        period,
        periodLabel: currentLabel,
        previousPeriodLabel: previousLabel,
        metrics,
        summary: {
          improved,
          declined,
          stable,
          overallTrend,
        },
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
