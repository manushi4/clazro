/**
 * Connections List Query Hook
 * Fetches student connections for the connections.list widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type ConnectionItem = {
  id: string;
  connectedUserId: string;
  connectionType: 'classmate' | 'study_buddy' | 'mentor' | 'mentee' | 'friend';
  status: 'pending' | 'active' | 'blocked';
  name: string;
  avatarUrl: string | null;
  className: string | null;
  school: string | null;
  isOnline: boolean;
  lastActiveAt: string | null;
  mutualSubjects: string[];
  xpPoints: number;
  streakDays: number;
};

export type ConnectionsListData = {
  connections: ConnectionItem[];
  totalCount: number;
  onlineCount: number;
  pendingCount: number;
};

const MOCK_DATA: ConnectionsListData = {
  connections: [
    { id: '1', connectedUserId: 'u1', connectionType: 'study_buddy', status: 'active', name: 'Rahul Sharma', avatarUrl: null, className: 'Class 10-A', school: null, isOnline: true, lastActiveAt: new Date().toISOString(), mutualSubjects: ['Mathematics', 'Physics'], xpPoints: 2450, streakDays: 12 },
    { id: '2', connectedUserId: 'u2', connectionType: 'classmate', status: 'active', name: 'Priya Patel', avatarUrl: null, className: 'Class 10-A', school: null, isOnline: false, lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), mutualSubjects: ['Chemistry'], xpPoints: 1890, streakDays: 8 },
    { id: '3', connectedUserId: 'u3', connectionType: 'friend', status: 'active', name: 'Amit Kumar', avatarUrl: null, className: 'Class 10-B', school: null, isOnline: true, lastActiveAt: new Date().toISOString(), mutualSubjects: ['Mathematics', 'English'], xpPoints: 3200, streakDays: 15 },
  ],
  totalCount: 5,
  onlineCount: 2,
  pendingCount: 1,
};

export function useConnectionsListQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['connections-list', customerId, userId],
    queryFn: async (): Promise<ConnectionsListData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('student_connections')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .neq('status', 'blocked')
        .order('is_online', { ascending: false })
        .order('last_active_at', { ascending: false });

      if (error) {
        console.warn('Connections list query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const connections: ConnectionItem[] = data.map((item: any) => ({
        id: item.id,
        connectedUserId: item.connected_user_id,
        connectionType: item.connection_type,
        status: item.status,
        name: item.connected_user_name,
        avatarUrl: item.connected_user_avatar_url,
        className: item.connected_user_class,
        school: item.connected_user_school,
        isOnline: item.is_online || false,
        lastActiveAt: item.last_active_at,
        mutualSubjects: item.mutual_subjects || [],
        xpPoints: item.xp_points || 0,
        streakDays: item.streak_days || 0,
      }));

      const onlineCount = connections.filter(c => c.isOnline && c.status === 'active').length;
      const pendingCount = connections.filter(c => c.status === 'pending').length;

      return {
        connections,
        totalCount: connections.length,
        onlineCount,
        pendingCount,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: isOnline ? 2 : 0,
  });
}
