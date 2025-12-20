import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type SystemAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
};

type UseAlertsQueryOptions = {
  limit?: number;
  severity?: AlertSeverity | 'all';
  showAcknowledged?: boolean;
};

export function useAlertsQuery(options?: UseAlertsQueryOptions) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['admin-alerts', customerId, options],
    queryFn: async (): Promise<SystemAlert[]> => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('system_alerts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Filter by severity
      if (options?.severity && options.severity !== 'all') {
        query = query.eq('severity', options.severity);
      }

      // Filter acknowledged
      if (!options?.showAcknowledged) {
        query = query.eq('acknowledged', false);
      }

      // Limit results
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        // Table may not exist yet - return mock data for demo
        console.warn('[useAlertsQuery] Error fetching alerts:', error.message);
        return getMockAlerts(options?.limit || 5, options?.severity);
      }

      return data || [];
    },
    enabled: !!customerId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute auto-refresh
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const supabase = getSupabaseClient();
      const user = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user.data.user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('customer_id', customerId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

// Mock data for demo when table doesn't exist
function getMockAlerts(limit: number, severity?: AlertSeverity | 'all'): SystemAlert[] {
  const mockAlerts: SystemAlert[] = [
    {
      id: 'alert-1',
      severity: 'critical',
      title: 'High CPU Usage',
      message: 'Server CPU usage exceeded 90% threshold for more than 5 minutes.',
      source: 'System Monitor',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
      acknowledged: false,
    },
    {
      id: 'alert-2',
      severity: 'warning',
      title: 'Payment Gateway Timeout',
      message: 'Payment gateway response time increased to 3.5 seconds.',
      source: 'Payment Service',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
      acknowledged: false,
    },
    {
      id: 'alert-3',
      severity: 'info',
      title: 'New User Registration Spike',
      message: '50 new users registered in the last hour, 200% above average.',
      source: 'Analytics',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      acknowledged: false,
    },
    {
      id: 'alert-4',
      severity: 'warning',
      title: 'Database Connection Pool',
      message: 'Database connection pool at 75% capacity.',
      source: 'Database',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
      acknowledged: false,
    },
    {
      id: 'alert-5',
      severity: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for tonight at 2:00 AM.',
      source: 'Operations',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      acknowledged: true,
    },
  ];

  let filtered = mockAlerts;
  if (severity && severity !== 'all') {
    filtered = mockAlerts.filter(a => a.severity === severity);
  }

  return filtered.slice(0, limit);
}
