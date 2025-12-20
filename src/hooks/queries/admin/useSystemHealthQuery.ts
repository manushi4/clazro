import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type SystemHealthStatus = 'healthy' | 'warning' | 'critical';

export type SystemHealthData = {
  status: SystemHealthStatus;
  uptime: number; // percentage 0-100
  cpuUsage: number; // percentage 0-100
  memoryUsage: number; // percentage 0-100
  activeUsers: number;
  lastChecked: string;
  apiResponseTime: number; // ms
  databaseStatus: SystemHealthStatus;
  storageUsage: number; // percentage 0-100
};

export function useSystemHealthQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['system-health', customerId],
    queryFn: async (): Promise<SystemHealthData> => {
      const supabase = getSupabaseClient();
      const startTime = Date.now();

      // Get active users (logged in within last 15 minutes)
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .gte('last_login_at', fifteenMinutesAgo.toISOString());

      // Calculate API response time
      const apiResponseTime = Date.now() - startTime;

      // Simulate system metrics (in production, these would come from monitoring service)
      // These values would typically come from a system_health table or external monitoring API
      const uptime = 99.9; // Mock uptime percentage
      const cpuUsage = Math.floor(Math.random() * 30) + 20; // 20-50% mock CPU
      const memoryUsage = Math.floor(Math.random() * 25) + 40; // 40-65% mock memory
      const storageUsage = Math.floor(Math.random() * 20) + 30; // 30-50% mock storage

      // Determine overall status based on metrics
      let status: SystemHealthStatus = 'healthy';
      let databaseStatus: SystemHealthStatus = 'healthy';

      if (apiResponseTime > 2000) {
        databaseStatus = 'critical';
      } else if (apiResponseTime > 1000) {
        databaseStatus = 'warning';
      }

      if (cpuUsage > 90 || memoryUsage > 90 || databaseStatus === 'critical') {
        status = 'critical';
      } else if (cpuUsage > 70 || memoryUsage > 70 || databaseStatus === 'warning') {
        status = 'warning';
      }

      return {
        status,
        uptime,
        cpuUsage,
        memoryUsage,
        activeUsers: activeUsers || 0,
        lastChecked: new Date().toISOString(),
        apiResponseTime,
        databaseStatus,
        storageUsage,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 30, // 30 seconds - refresh more frequently for health data
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}
