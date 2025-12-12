import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type NotificationPriority = "low" | "normal" | "high";

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  category: string;
  priority: NotificationPriority;
  is_read: boolean;
  sent_at: string;
  data: Record<string, any> | null;
};

export type NotificationsSummary = {
  notifications: NotificationRecord[];
  unread_count: number;
  total_count: number;
};

export function useParentNotificationsQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["parent-notifications", customerId, parentUserId],
    queryFn: async (): Promise<NotificationsSummary> => {
      const supabase = getSupabaseClient();

      // Fetch notifications for parent user
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("id, title, body, notification_type, category, priority, is_read, sent_at, data")
        .eq("customer_id", customerId)
        .eq("user_id", parentUserId)
        .order("sent_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const records = (notifications || []).map(mapNotificationRecord);
      const unreadCount = records.filter((n) => !n.is_read).length;

      return {
        notifications: records,
        unread_count: unreadCount,
        total_count: records.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

function mapNotificationRecord(n: any): NotificationRecord {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    notification_type: n.notification_type,
    category: n.category,
    priority: n.priority,
    is_read: n.is_read,
    sent_at: n.sent_at,
    data: n.data,
  };
}
