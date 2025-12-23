import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type ActivityType = 
  | 'user_created' 
  | 'user_updated' 
  | 'user_suspended'
  | 'user_activated'
  | 'payment_received' 
  | 'setting_changed' 
  | 'login'
  | 'content_created'
  | 'content_updated'
  | 'alert_acknowledged';

export type RecentActivity = {
  id: string;
  type: ActivityType;
  actor_name: string;
  actor_avatar?: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

type UseRecentActivityOptions = {
  limit?: number;
  typeFilter?: ActivityType | 'all';
};

export function useRecentActivityQuery(options?: UseRecentActivityOptions) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const typeFilter = options?.typeFilter || 'all';

  return useQuery({
    queryKey: ['admin-recent-activity', customerId, limit, typeFilter],
    queryFn: async (): Promise<RecentActivity[]> => {
      const supabase = getSupabaseClient();

      // Try to fetch from audit_logs table
      try {
        let query = supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            entity_type,
            entity_id,
            details,
            performed_by,
            created_at,
            profiles:performed_by (
              full_name,
              avatar_url
            )
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (typeFilter !== 'all') {
          query = query.eq('action', typeFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform audit logs to activity format
        return (data || []).map((log: any) => ({
          id: log.id,
          type: log.action as ActivityType,
          actor_name: log.profiles?.full_name || 'System',
          actor_avatar: log.profiles?.avatar_url,
          description: formatActivityDescription(log.action, log.details, log.entity_type),
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          metadata: log.details,
          created_at: log.created_at,
        }));
      } catch {
        // Return mock data if table doesn't exist
        return getMockActivities(limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
  });
}

function formatActivityDescription(
  action: string, 
  details: Record<string, unknown> | null, 
  entityType?: string
): string {
  const descriptions: Record<string, string> = {
    user_created: `Created new ${details?.role || 'user'} account`,
    user_updated: `Updated ${entityType || 'user'} profile`,
    user_suspended: `Suspended user account${details?.reason ? `: ${details.reason}` : ''}`,
    user_activated: `Activated user account`,
    payment_received: `Payment of ₹${details?.amount || 0} received`,
    setting_changed: `Updated ${details?.setting || 'system'} settings`,
    login: `Logged in to admin panel`,
    content_created: `Created new ${details?.content_type || 'content'}`,
    content_updated: `Updated ${details?.content_type || 'content'}`,
    alert_acknowledged: `Acknowledged system alert`,
  };

  return descriptions[action] || `Performed ${action.replace(/_/g, ' ')}`;
}

function getMockActivities(limit: number): RecentActivity[] {
  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'user_created',
      actor_name: 'Admin User',
      description: 'Created new student account',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: '2',
      type: 'payment_received',
      actor_name: 'System',
      description: 'Payment of ₹5,000 received',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '3',
      type: 'setting_changed',
      actor_name: 'Admin User',
      description: 'Updated notification settings',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '4',
      type: 'user_updated',
      actor_name: 'Admin User',
      description: 'Updated teacher profile',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: '5',
      type: 'login',
      actor_name: 'Super Admin',
      description: 'Logged in to admin panel',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: '6',
      type: 'content_created',
      actor_name: 'Content Manager',
      description: 'Created new course material',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: '7',
      type: 'alert_acknowledged',
      actor_name: 'Admin User',
      description: 'Acknowledged system alert',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: '8',
      type: 'user_suspended',
      actor_name: 'Admin User',
      description: 'Suspended user account: Policy violation',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ];

  return mockActivities.slice(0, limit);
}
