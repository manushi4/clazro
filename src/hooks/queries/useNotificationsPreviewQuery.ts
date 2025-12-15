/**
 * Notifications Preview Query Hook
 * Fetches recent notifications for preview widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useNetworkStatus } from '../../offline/networkStore';
import { useDemoUser } from '../useDemoUser';

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  notification_type: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  sent_at: string;
  icon: string;
  color: string;
  time_ago: string;
};

export type NotificationsPreviewData = {
  notifications: NotificationItem[];
  totalCount: number;
  unreadCount: number;
};

// Map notification types to icons
const TYPE_ICONS: Record<string, string> = {
  event: 'calendar',
  academic: 'school',
  alert: 'alert-circle',
  announcement: 'bullhorn',
  reminder: 'bell-ring',
  message: 'message-text',
  default: 'bell',
};

// Map categories to colors
const CATEGORY_COLORS: Record<string, string> = {
  school: '#6366F1',
  results: '#10B981',
  attendance: '#F59E0B',
  fees: '#EF4444',
  academic: '#8B5CF6',
  default: '#6B7280',
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export function useNotificationsPreviewQuery(maxItems: number = 5) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['notifications-preview', customerId, userId, maxItems],
    queryFn: async (): Promise<NotificationsPreviewData> => {
      const supabase = getSupabaseClient();

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(maxItems);

      if (error) {
        console.warn('Notifications preview query failed:', error);
        throw error;
      }

      const notifications: NotificationItem[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        body: item.body,
        notification_type: item.notification_type || 'default',
        category: item.category || 'default',
        priority: item.priority || 'normal',
        is_read: item.is_read || false,
        sent_at: item.sent_at,
        icon: TYPE_ICONS[item.notification_type] || TYPE_ICONS.default,
        color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
        time_ago: getTimeAgo(item.sent_at),
      }));

      const unreadCount = notifications.filter(n => !n.is_read).length;

      return {
        notifications,
        totalCount: count || notifications.length,
        unreadCount,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: isOnline ? 2 : 0,
  });
}
