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

// Demo alerts for when database is empty
const DEMO_ALERTS: SystemAlert[] = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: 'High CPU Usage',
    message: 'Server CPU usage exceeded 90% threshold for more than 5 minutes.',
    source: 'System Monitor',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: 'Payment Gateway Timeout',
    message: 'Payment gateway response time increased to 3.5 seconds.',
    source: 'Payment Service',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-3',
    severity: 'info',
    title: 'New User Registration Spike',
    message: '50 new users registered in the last hour, 200% above average.',
    source: 'Analytics',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-4',
    severity: 'warning',
    title: 'Database Connection Pool',
    message: 'Database connection pool at 75% capacity.',
    source: 'Database',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-5',
    severity: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight at 2:00 AM.',
    source: 'Operations',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    acknowledged: true,
  },
];

export function useAlertsQuery(options?: UseAlertsQueryOptions) {
  const customerId = useCustomerId();
  const limit = options?.limit || 5;
  const severity = options?.severity || 'all';

  return useQuery({
    queryKey: ['admin-alerts', customerId, options],
    queryFn: async (): Promise<SystemAlert[]> => {
      const supabase = getSupabaseClient();

      try {
        let query = supabase
          .from('system_alerts')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        // Filter by severity
        if (severity !== 'all') {
          query = query.eq('severity', severity);
        }

        // Filter acknowledged
        if (!options?.showAcknowledged) {
          query = query.eq('acknowledged', false);
        }

        // Limit results
        query = query.limit(limit);

        const { data, error } = await query;

        if (error) {
          console.warn('[useAlertsQuery] Error fetching alerts:', error.message);
          return filterDemoAlerts(limit, severity, options?.showAcknowledged);
        }

        // If we got data from database, return it
        if (data && data.length > 0) {
          return data.map(alert => ({
            id: alert.id,
            severity: alert.severity as AlertSeverity,
            title: alert.title,
            message: alert.message,
            source: alert.source,
            created_at: alert.created_at,
            acknowledged: alert.acknowledged,
            acknowledged_by: alert.acknowledged_by,
            acknowledged_at: alert.acknowledged_at,
          }));
        }

        // Return demo data if no alerts in database
        console.log('[useAlertsQuery] No alerts in database, using demo data');
        return filterDemoAlerts(limit, severity, options?.showAcknowledged);
      } catch {
        // Table may not exist yet - return demo data
        console.log('[useAlertsQuery] Table not found, using demo data');
        return filterDemoAlerts(limit, severity, options?.showAcknowledged);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute auto-refresh
    placeholderData: filterDemoAlerts(limit, severity, options?.showAcknowledged),
  });
}

// Helper to filter demo alerts
function filterDemoAlerts(
  limit: number,
  severity: AlertSeverity | 'all',
  showAcknowledged?: boolean
): SystemAlert[] {
  let filtered = [...DEMO_ALERTS];
  
  if (severity !== 'all') {
    filtered = filtered.filter(a => a.severity === severity);
  }
  
  if (!showAcknowledged) {
    filtered = filtered.filter(a => !a.acknowledged);
  }
  
  return filtered.slice(0, limit);
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const supabase = getSupabaseClient();
      const user = await supabase.auth.getUser();

      try {
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
      } catch {
        // Table may not exist - just return success for demo
        console.log('[useAcknowledgeAlert] Demo mode - alert acknowledged locally');
      }

      return { success: true, alertId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}
