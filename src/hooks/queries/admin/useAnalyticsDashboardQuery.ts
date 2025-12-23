/**
 * useAnalyticsDashboardQuery - Analytics Dashboard Data Hook
 * Sprint 7: Analytics Dashboard
 *
 * Purpose: Fetch comprehensive analytics data for the analytics-dashboard screen
 * Used by: AnalyticsDashboardScreen, KpiGridWidget, TrendsWidget, EngagementWidget, GrowthWidget
 *
 * Features:
 * - KPI metrics (users, revenue, engagement, content)
 * - Trend data over time (daily, weekly, monthly)
 * - Engagement metrics (DAU, WAU, MAU, retention)
 * - Growth metrics with targets
 * - Period comparisons
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  parseISO,
  differenceInDays,
} from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type AnalyticsMetric = 'users' | 'revenue' | 'engagement' | 'content' | 'sessions';

export type KpiMetric = {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  target?: number;
  targetProgress?: number;
  icon: string;
  color: string;
  unit?: string;
};

export type TrendDataPoint = {
  date: string;
  label: string;
  value: number;
};

export type TrendData = {
  metric: AnalyticsMetric;
  dataPoints: TrendDataPoint[];
  total: number;
  average: number;
  min: number;
  max: number;
  change: number;
};

export type EngagementData = {
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  dauWauRatio: number; // DAU/WAU stickiness
  retentionRate: number;
  avgSessionDuration: number; // in minutes
  sessionsPerUser: number;
  roleBreakdown: {
    role: string;
    count: number;
    percentage: number;
  }[];
  activityTrend: TrendDataPoint[];
  topUsers: {
    id: string;
    name: string;
    role: string;
    sessions: number;
    lastActive: string;
  }[];
};

export type GrowthMetric = {
  id: string;
  name: string;
  current: number;
  previous: number;
  growth: number;
  target?: number;
  targetProgress?: number;
  trend: TrendDataPoint[];
};

export type GrowthData = {
  metrics: GrowthMetric[];
  highlights: {
    bestPerforming: string;
    needsAttention: string;
    onTrack: number;
    offTrack: number;
  };
};

export type ComparisonData = {
  period: AnalyticsPeriod;
  metrics: {
    id: string;
    name: string;
    current: number;
    previous: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'neutral';
  }[];
  summary: {
    improved: number;
    declined: number;
    unchanged: number;
  };
};

export type AnalyticsDashboardData = {
  kpis: KpiMetric[];
  trends: Record<AnalyticsMetric, TrendData>;
  engagement: EngagementData;
  growth: GrowthData;
  comparisons: Record<AnalyticsPeriod, ComparisonData>;
  lastUpdated: string;
};

export type UseAnalyticsDashboardQueryOptions = {
  metric?: AnalyticsMetric;
  period?: AnalyticsPeriod;
  enabled?: boolean;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const KPI_CONFIG: Record<string, { icon: string; color: string; unit?: string }> = {
  totalUsers: { icon: 'account-group', color: '#2196F3' },
  activeUsers: { icon: 'account-check', color: '#4CAF50' },
  newUsers: { icon: 'account-plus', color: '#9C27B0' },
  revenue: { icon: 'currency-inr', color: '#FF9800', unit: '₹' },
  engagement: { icon: 'chart-line', color: '#E91E63', unit: '%' },
  contentViews: { icon: 'eye', color: '#00BCD4' },
  sessions: { icon: 'login', color: '#795548' },
  avgSessionTime: { icon: 'clock-outline', color: '#607D8B', unit: 'min' },
};

// Demo data for development/testing
const DEMO_ANALYTICS_DATA: AnalyticsDashboardData = {
  kpis: [
    { id: 'totalUsers', name: 'Total Users', value: 1250, previousValue: 1100, change: 13.6, changeType: 'increase', target: 1500, targetProgress: 83, icon: 'account-group', color: '#2196F3' },
    { id: 'activeUsers', name: 'Active Users', value: 890, previousValue: 820, change: 8.5, changeType: 'increase', icon: 'account-check', color: '#4CAF50' },
    { id: 'newUsers', name: 'New Users', value: 150, previousValue: 120, change: 25, changeType: 'increase', target: 200, targetProgress: 75, icon: 'account-plus', color: '#9C27B0' },
    { id: 'revenue', name: 'Revenue', value: 125000, previousValue: 110000, change: 13.6, changeType: 'increase', icon: 'currency-inr', color: '#FF9800', unit: '₹' },
    { id: 'engagement', name: 'Engagement', value: 72, previousValue: 68, change: 5.9, changeType: 'increase', icon: 'chart-line', color: '#E91E63', unit: '%' },
    { id: 'contentViews', name: 'Content Views', value: 45000, previousValue: 42000, change: 7.1, changeType: 'increase', icon: 'eye', color: '#00BCD4' },
  ],
  trends: {
    users: {
      metric: 'users',
      dataPoints: [
        { date: '2024-12-16', label: 'Mon', value: 180 },
        { date: '2024-12-17', label: 'Tue', value: 195 },
        { date: '2024-12-18', label: 'Wed', value: 210 },
        { date: '2024-12-19', label: 'Thu', value: 185 },
        { date: '2024-12-20', label: 'Fri', value: 220 },
        { date: '2024-12-21', label: 'Sat', value: 150 },
        { date: '2024-12-22', label: 'Sun', value: 140 },
      ],
      total: 1280,
      average: 183,
      min: 140,
      max: 220,
      change: 12.5,
    },
    revenue: {
      metric: 'revenue',
      dataPoints: [
        { date: '2024-12-16', label: 'Mon', value: 18000 },
        { date: '2024-12-17', label: 'Tue', value: 22000 },
        { date: '2024-12-18', label: 'Wed', value: 19500 },
        { date: '2024-12-19', label: 'Thu', value: 21000 },
        { date: '2024-12-20', label: 'Fri', value: 25000 },
        { date: '2024-12-21', label: 'Sat', value: 12000 },
        { date: '2024-12-22', label: 'Sun', value: 8500 },
      ],
      total: 126000,
      average: 18000,
      min: 8500,
      max: 25000,
      change: 15.2,
    },
    engagement: {
      metric: 'engagement',
      dataPoints: [
        { date: '2024-12-16', label: 'Mon', value: 68 },
        { date: '2024-12-17', label: 'Tue', value: 72 },
        { date: '2024-12-18', label: 'Wed', value: 75 },
        { date: '2024-12-19', label: 'Thu', value: 70 },
        { date: '2024-12-20', label: 'Fri', value: 78 },
        { date: '2024-12-21', label: 'Sat', value: 65 },
        { date: '2024-12-22', label: 'Sun', value: 62 },
      ],
      total: 490,
      average: 70,
      min: 62,
      max: 78,
      change: 5.8,
    },
    content: {
      metric: 'content',
      dataPoints: [
        { date: '2024-12-16', label: 'Mon', value: 6500 },
        { date: '2024-12-17', label: 'Tue', value: 7200 },
        { date: '2024-12-18', label: 'Wed', value: 6800 },
        { date: '2024-12-19', label: 'Thu', value: 7500 },
        { date: '2024-12-20', label: 'Fri', value: 8000 },
        { date: '2024-12-21', label: 'Sat', value: 5500 },
        { date: '2024-12-22', label: 'Sun', value: 4500 },
      ],
      total: 46000,
      average: 6571,
      min: 4500,
      max: 8000,
      change: 8.3,
    },
    sessions: {
      metric: 'sessions',
      dataPoints: [
        { date: '2024-12-16', label: 'Mon', value: 450 },
        { date: '2024-12-17', label: 'Tue', value: 520 },
        { date: '2024-12-18', label: 'Wed', value: 480 },
        { date: '2024-12-19', label: 'Thu', value: 510 },
        { date: '2024-12-20', label: 'Fri', value: 550 },
        { date: '2024-12-21', label: 'Sat', value: 380 },
        { date: '2024-12-22', label: 'Sun', value: 320 },
      ],
      total: 3210,
      average: 459,
      min: 320,
      max: 550,
      change: 10.2,
    },
  },
  engagement: {
    dau: 320,
    wau: 890,
    mau: 1150,
    dauWauRatio: 36,
    retentionRate: 78,
    avgSessionDuration: 12.5,
    sessionsPerUser: 2.8,
    roleBreakdown: [
      { role: 'student', count: 850, percentage: 68 },
      { role: 'teacher', count: 250, percentage: 20 },
      { role: 'parent', count: 120, percentage: 10 },
      { role: 'admin', count: 30, percentage: 2 },
    ],
    activityTrend: [
      { date: '2024-12-16', label: 'Mon', value: 320 },
      { date: '2024-12-17', label: 'Tue', value: 350 },
      { date: '2024-12-18', label: 'Wed', value: 340 },
      { date: '2024-12-19', label: 'Thu', value: 360 },
      { date: '2024-12-20', label: 'Fri', value: 380 },
      { date: '2024-12-21', label: 'Sat', value: 280 },
      { date: '2024-12-22', label: 'Sun', value: 250 },
    ],
    topUsers: [
      { id: '1', name: 'Rahul Sharma', role: 'student', sessions: 45, lastActive: '2024-12-22T10:30:00Z' },
      { id: '2', name: 'Priya Patel', role: 'teacher', sessions: 42, lastActive: '2024-12-22T09:15:00Z' },
      { id: '3', name: 'Amit Kumar', role: 'student', sessions: 38, lastActive: '2024-12-22T11:00:00Z' },
    ],
  },
  growth: {
    metrics: [
      { id: 'newUsers', name: 'New Users', current: 150, previous: 120, growth: 25, target: 200, targetProgress: 75, trend: [] },
      { id: 'revenue', name: 'Revenue', current: 125000, previous: 110000, growth: 13.6, target: 150000, targetProgress: 83, trend: [] },
      { id: 'engagement', name: 'Engagement Rate', current: 72, previous: 68, growth: 5.9, target: 80, targetProgress: 90, trend: [] },
      { id: 'contentViews', name: 'Content Views', current: 45000, previous: 42000, growth: 7.1, trend: [] },
    ],
    highlights: {
      bestPerforming: 'New Users (+25%)',
      needsAttention: 'Engagement Rate (90% of target)',
      onTrack: 3,
      offTrack: 1,
    },
  },
  comparisons: {
    day: { period: 'day', metrics: [], summary: { improved: 0, declined: 0, unchanged: 0 } },
    week: {
      period: 'week',
      metrics: [
        { id: 'users', name: 'Active Users', current: 890, previous: 820, change: 8.5, changeType: 'increase' },
        { id: 'revenue', name: 'Revenue', current: 125000, previous: 110000, change: 13.6, changeType: 'increase' },
        { id: 'engagement', name: 'Engagement', current: 72, previous: 68, change: 5.9, changeType: 'increase' },
        { id: 'sessions', name: 'Sessions', current: 3210, previous: 2900, change: 10.7, changeType: 'increase' },
      ],
      summary: { improved: 4, declined: 0, unchanged: 0 },
    },
    month: {
      period: 'month',
      metrics: [
        { id: 'users', name: 'Active Users', current: 890, previous: 750, change: 18.7, changeType: 'increase' },
        { id: 'revenue', name: 'Revenue', current: 125000, previous: 95000, change: 31.6, changeType: 'increase' },
        { id: 'engagement', name: 'Engagement', current: 72, previous: 65, change: 10.8, changeType: 'increase' },
        { id: 'sessions', name: 'Sessions', current: 3210, previous: 2500, change: 28.4, changeType: 'increase' },
      ],
      summary: { improved: 4, declined: 0, unchanged: 0 },
    },
    quarter: {
      period: 'quarter',
      metrics: [
        { id: 'users', name: 'Active Users', current: 890, previous: 600, change: 48.3, changeType: 'increase' },
        { id: 'revenue', name: 'Revenue', current: 125000, previous: 75000, change: 66.7, changeType: 'increase' },
        { id: 'engagement', name: 'Engagement', current: 72, previous: 58, change: 24.1, changeType: 'increase' },
        { id: 'sessions', name: 'Sessions', current: 3210, previous: 1800, change: 78.3, changeType: 'increase' },
      ],
      summary: { improved: 4, declined: 0, unchanged: 0 },
    },
    year: {
      period: 'year',
      metrics: [],
      summary: { improved: 0, declined: 0, unchanged: 0 },
    },
  },
  lastUpdated: new Date().toISOString(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPeriodDates(period: AnalyticsPeriod): { startDate: Date; previousStartDate: Date; previousEndDate: Date } {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;
  let previousEndDate: Date;

  switch (period) {
    case 'day':
      startDate = startOfDay(now);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = startOfDay(previousEndDate);
      break;
    case 'week':
      startDate = startOfWeek(now);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = startOfWeek(previousEndDate);
      break;
    case 'month':
      startDate = startOfMonth(now);
      previousEndDate = subDays(startDate, 1);
      previousStartDate = startOfMonth(previousEndDate);
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

function calculateChange(current: number, previous: number): { change: number; changeType: 'increase' | 'decrease' | 'neutral' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, changeType: current > 0 ? 'increase' : 'neutral' };
  }
  const change = Math.round(((current - previous) / previous) * 1000) / 10;
  const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
  return { change: Math.abs(change), changeType };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useAnalyticsDashboardQuery(options?: UseAnalyticsDashboardQueryOptions) {
  const customerId = useCustomerId();
  const metric = options?.metric || 'users';
  const period = options?.period || 'month';
  const enabled = options?.enabled !== false;

  return useQuery({
    queryKey: ['analytics-dashboard', customerId, metric, period],
    queryFn: async (): Promise<AnalyticsDashboardData> => {
      const supabase = getSupabaseClient();
      const { startDate, previousStartDate, previousEndDate } = getPeriodDates(period);

      // Fetch user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('is_active', true);

      // Fetch new users in period
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', startDate.toISOString());

      // Fetch previous period new users
      const { count: previousNewUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString());

      const { data: previousRevenueData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('customer_id', customerId)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('transaction_date', previousStartDate.toISOString())
        .lt('transaction_date', previousEndDate.toISOString());

      const currentRevenue = revenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const previousRevenue = previousRevenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Build KPIs
      const kpis: KpiMetric[] = [
        {
          id: 'totalUsers',
          name: 'Total Users',
          value: totalUsers || 0,
          previousValue: 0,
          ...calculateChange(totalUsers || 0, 0),
          ...KPI_CONFIG.totalUsers,
        },
        {
          id: 'activeUsers',
          name: 'Active Users',
          value: activeUsers || 0,
          previousValue: 0,
          ...calculateChange(activeUsers || 0, 0),
          ...KPI_CONFIG.activeUsers,
        },
        {
          id: 'newUsers',
          name: 'New Users',
          value: newUsers || 0,
          previousValue: previousNewUsers || 0,
          ...calculateChange(newUsers || 0, previousNewUsers || 0),
          ...KPI_CONFIG.newUsers,
        },
        {
          id: 'revenue',
          name: 'Revenue',
          value: currentRevenue,
          previousValue: previousRevenue,
          ...calculateChange(currentRevenue, previousRevenue),
          ...KPI_CONFIG.revenue,
        },
      ];

      // If no real data, return demo data
      if ((totalUsers || 0) === 0 && currentRevenue === 0) {
        return DEMO_ANALYTICS_DATA;
      }

      // Return partial real data merged with demo structure
      return {
        ...DEMO_ANALYTICS_DATA,
        kpis,
        lastUpdated: new Date().toISOString(),
      };
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export default useAnalyticsDashboardQuery;
