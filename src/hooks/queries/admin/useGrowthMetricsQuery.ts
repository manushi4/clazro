import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { subDays, subWeeks, subMonths, format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export type GrowthPeriod = 'week' | 'month' | 'quarter';

export type GrowthMetric = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'stable';
  target?: number;
  targetPercent?: number;
  icon: string;
  color: string;
};

export type GrowthTrendPoint = {
  label: string;
  value: number;
  date: string;
};

export type GrowthData = {
  period: GrowthPeriod;
  metrics: GrowthMetric[];
  overallGrowth: number;
  overallDirection: 'up' | 'down' | 'stable';
  userGrowthTrend: GrowthTrendPoint[];
  revenueGrowthTrend: GrowthTrendPoint[];
  highlights: {
    bestPerforming: string;
    needsAttention: string;
    onTrack: number;
    belowTarget: number;
  };
};

type UseGrowthMetricsQueryOptions = {
  period?: GrowthPeriod;
};

function getDateRange(period: GrowthPeriod): { startDate: Date; previousStartDate: Date; labels: string[] } {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return {
        startDate: subDays(now, 7),
        previousStartDate: subDays(now, 14),
        labels: Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), 'EEE')),
      };
    case 'month':
      return {
        startDate: subMonths(now, 1),
        previousStartDate: subMonths(now, 2),
        labels: ['W1', 'W2', 'W3', 'W4'],
      };
    case 'quarter':
      return {
        startDate: subMonths(now, 3),
        previousStartDate: subMonths(now, 6),
        labels: Array.from({ length: 3 }, (_, i) => format(subMonths(now, 2 - i), 'MMM')),
      };
    default:
      return {
        startDate: subDays(now, 7),
        previousStartDate: subDays(now, 14),
        labels: Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), 'EEE')),
      };
  }
}

function calculateChange(current: number, previous: number): { percent: number; direction: 'up' | 'down' | 'stable' } {
  if (previous === 0) {
    return { percent: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'stable' };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  const direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable';
  return { percent: Math.abs(percent), direction };
}

export function useGrowthMetricsQuery(options?: UseGrowthMetricsQueryOptions) {
  const customerId = useCustomerId();
  const period = options?.period || 'week';

  return useQuery({
    queryKey: ['analytics-growth', customerId, period],
    queryFn: async (): Promise<GrowthData> => {
      const supabase = getSupabaseClient();
      const { startDate, previousStartDate, labels } = getDateRange(period);
      const now = new Date();

      // Fetch current period users
      const { count: currentUsers } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', startDate.toISOString());

      // Fetch previous period users
      const { count: previousUsers } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch current period revenue
      const { data: currentRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      const currentRevenueTotal = currentRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch previous period revenue
      const { data: previousRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', previousStartDate.toISOString())
        .lt('transaction_date', startDate.toISOString());

      const previousRevenueTotal = previousRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch total users for active rate calculation
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      // Calculate metrics
      const userChange = calculateChange(currentUsers || 0, previousUsers || 0);
      const revenueChange = calculateChange(currentRevenueTotal, previousRevenueTotal);
      
      // Simulate engagement and content metrics (in production, query actual data)
      const currentEngagement = 75 + Math.floor(Math.random() * 15);
      const previousEngagement = 70 + Math.floor(Math.random() * 15);
      const engagementChange = calculateChange(currentEngagement, previousEngagement);

      const currentContent = 120 + Math.floor(Math.random() * 30);
      const previousContent = 100 + Math.floor(Math.random() * 30);
      const contentChange = calculateChange(currentContent, previousContent);

      // Build metrics array
      const metrics: GrowthMetric[] = [
        {
          id: 'users',
          label: 'New Users',
          value: currentUsers || 0,
          previousValue: previousUsers || 0,
          changePercent: userChange.percent,
          changeDirection: userChange.direction,
          target: Math.ceil((previousUsers || 1) * 1.1), // 10% growth target
          targetPercent: Math.round(((currentUsers || 0) / Math.ceil((previousUsers || 1) * 1.1)) * 100),
          icon: 'account-plus',
          color: 'primary',
        },
        {
          id: 'revenue',
          label: 'Revenue',
          value: currentRevenueTotal,
          previousValue: previousRevenueTotal,
          changePercent: revenueChange.percent,
          changeDirection: revenueChange.direction,
          target: Math.ceil(previousRevenueTotal * 1.15), // 15% growth target
          targetPercent: Math.round((currentRevenueTotal / Math.ceil(previousRevenueTotal * 1.15 || 1)) * 100),
          icon: 'currency-inr',
          color: 'success',
        },
        {
          id: 'engagement',
          label: 'Engagement Rate',
          value: currentEngagement,
          previousValue: previousEngagement,
          changePercent: engagementChange.percent,
          changeDirection: engagementChange.direction,
          target: 85,
          targetPercent: Math.round((currentEngagement / 85) * 100),
          icon: 'chart-timeline-variant',
          color: 'tertiary',
        },
        {
          id: 'content',
          label: 'Content Views',
          value: currentContent,
          previousValue: previousContent,
          changePercent: contentChange.percent,
          changeDirection: contentChange.direction,
          target: 150,
          targetPercent: Math.round((currentContent / 150) * 100),
          icon: 'file-document-multiple',
          color: 'secondary',
        },
      ];

      // Calculate overall growth
      const growthValues = metrics.map(m => m.changeDirection === 'up' ? m.changePercent : -m.changePercent);
      const overallGrowth = Math.round(growthValues.reduce((a, b) => a + b, 0) / growthValues.length);
      const overallDirection = overallGrowth > 0 ? 'up' : overallGrowth < 0 ? 'down' : 'stable';

      // Generate trend data
      const userGrowthTrend: GrowthTrendPoint[] = labels.map((label, index) => ({
        label,
        value: Math.floor((currentUsers || 0) / labels.length * (index + 1) + Math.random() * 5),
        date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
      }));

      const revenueGrowthTrend: GrowthTrendPoint[] = labels.map((label, index) => ({
        label,
        value: Math.floor(currentRevenueTotal / labels.length * (index + 1) + Math.random() * 1000),
        date: format(subDays(now, labels.length - 1 - index), 'yyyy-MM-dd'),
      }));

      // Calculate highlights
      const sortedByGrowth = [...metrics].sort((a, b) => {
        const aVal = a.changeDirection === 'up' ? a.changePercent : -a.changePercent;
        const bVal = b.changeDirection === 'up' ? b.changePercent : -b.changePercent;
        return bVal - aVal;
      });

      const onTrack = metrics.filter(m => (m.targetPercent || 0) >= 100).length;
      const belowTarget = metrics.filter(m => (m.targetPercent || 0) < 80).length;

      return {
        period,
        metrics,
        overallGrowth: Math.abs(overallGrowth),
        overallDirection,
        userGrowthTrend,
        revenueGrowthTrend,
        highlights: {
          bestPerforming: sortedByGrowth[0]?.label || 'N/A',
          needsAttention: sortedByGrowth[sortedByGrowth.length - 1]?.label || 'N/A',
          onTrack,
          belowTarget,
        },
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
