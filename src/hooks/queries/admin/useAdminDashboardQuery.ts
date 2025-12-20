import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  alertCount: number;
  usersTrend: number;
  revenueTrend: number;
  pendingApprovals: number;
};

export function useAdminDashboardQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['admin-dashboard', customerId],
    queryFn: async (): Promise<AdminDashboardStats> => {
      const supabase = getSupabaseClient();

      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      // Get active users (logged in within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('last_login_at', yesterday.toISOString());

      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('is_active', false);

      // Get alert count from system_alerts if table exists
      let alertCount = 0;
      try {
        const { count } = await supabase
          .from('system_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('acknowledged', false);
        alertCount = count || 0;
      } catch {
        // Table may not exist yet
        alertCount = 0;
      }

      // Calculate revenue from transactions if table exists
      let revenue = 0;
      try {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('customer_id', customerId)
          .eq('status', 'completed');
        revenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      } catch {
        // Table may not exist yet
        revenue = 0;
      }

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        revenue,
        alertCount,
        usersTrend: 5.2, // Mock trend - would calculate from historical data
        revenueTrend: 12.5, // Mock trend
        pendingApprovals: pendingApprovals || 0,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
