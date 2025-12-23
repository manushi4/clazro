import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type KpiMetric = {
  id: string;
  customer_id: string;
  metric_key: string;
  category: string;
  label_en: string;
  label_hi?: string;
  value: number;
  previous_value?: number;
  unit?: string;
  format_type: 'number' | 'currency' | 'percentage' | 'duration';
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  allowed_roles: string[];
  status: 'active' | 'inactive';
  last_calculated_at?: string;
  created_at: string;
  updated_at: string;
};

type UseKpiMetricsOptions = {
  category?: string;
  metricKeys?: string[];
  role?: string;
  limit?: number;
};

export function useKpiMetricsQuery(options?: UseKpiMetricsOptions) {
  const customerId = useCustomerId();
  const { category, metricKeys, role, limit } = options || {};

  return useQuery({
    queryKey: ['kpi-metrics', customerId, { category, metricKeys, role, limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('kpi_metrics')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active');

      // Filter by category if provided
      if (category) {
        query = query.eq('category', category);
      }

      // Filter by specific metric keys if provided
      if (metricKeys && metricKeys.length > 0) {
        query = query.in('metric_key', metricKeys);
      }

      // Filter by role if provided
      if (role) {
        query = query.contains('allowed_roles', [role]);
      }

      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }

      // Order by category and then by metric_key for consistent display
      query = query.order('category', { ascending: true }).order('metric_key', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as KpiMetric[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes - KPIs update frequently
  });
}
