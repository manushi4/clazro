/**
 * Notifications List Query Hook
 *
 * Fetches paginated notifications with filter support for the notifications screen.
 * Features: filtering by category, read status, pagination, search
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";
import { useDemoUser } from "../useDemoUser";
import { NotificationCategory } from "../../types/notification.types";

export type NotificationListItem = {
  id: string;
  customer_id: string;
  user_id: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  notification_type: string;
  category: NotificationCategory | string;
  priority: "low" | "normal" | "high";
  image_url: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  expires_at: string | null;
  created_at: string;
  // Computed fields
  icon: string;
  color: string;
  time_ago: string;
};

export type NotificationsListFilters = {
  category?: NotificationCategory | "all";
  readStatus?: "all" | "read" | "unread";
  priority?: "all" | "low" | "normal" | "high";
  searchQuery?: string;
};

export type NotificationsListData = {
  notifications: NotificationListItem[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
};

// Map notification types to icons
const TYPE_ICONS: Record<string, string> = {
  assignment: "clipboard-text",
  test: "file-document",
  announcement: "bullhorn",
  doubt: "help-circle",
  attendance: "calendar-check",
  grade: "school",
  schedule: "calendar",
  reminder: "bell-ring",
  message: "message-text",
  alert: "alert-circle",
  system: "cog",
  default: "bell",
};

// Map categories to colors
const CATEGORY_COLORS: Record<string, string> = {
  assignments: "#6366F1",
  tests: "#8B5CF6",
  announcements: "#F59E0B",
  doubts: "#10B981",
  attendance: "#EF4444",
  grades: "#3B82F6",
  schedule: "#EC4899",
  reminders: "#F97316",
  system: "#6B7280",
  default: "#6B7280",
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Demo data for development/offline
const DEMO_NOTIFICATIONS: NotificationListItem[] = [
  {
    id: "demo-1",
    customer_id: "demo",
    user_id: "demo",
    title: "New Assignment Submitted",
    body: "Rahul Sharma submitted Math homework early. Review and grade.",
    data: { studentId: "s1", assignmentId: "a1" },
    notification_type: "assignment",
    category: "assignments",
    priority: "high",
    image_url: null,
    action_url: "screen:assignment-detail",
    is_read: false,
    read_at: null,
    sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    icon: "clipboard-text",
    color: "#6366F1",
    time_ago: "30m ago",
  },
  {
    id: "demo-2",
    customer_id: "demo",
    user_id: "demo",
    title: "Doubt Pending Response",
    body: "Priya asked a question about quadratic equations. 3 students waiting.",
    data: { doubtId: "d1" },
    notification_type: "doubt",
    category: "doubts",
    priority: "normal",
    image_url: null,
    action_url: "screen:doubt-detail",
    is_read: false,
    read_at: null,
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: "help-circle",
    color: "#10B981",
    time_ago: "2h ago",
  },
  {
    id: "demo-3",
    customer_id: "demo",
    user_id: "demo",
    title: "Attendance Reminder",
    body: "Don't forget to mark attendance for Class 10-A today.",
    data: { classId: "c1" },
    notification_type: "attendance",
    category: "attendance",
    priority: "high",
    image_url: null,
    action_url: "screen:attendance",
    is_read: false,
    read_at: null,
    sent_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    icon: "calendar-check",
    color: "#EF4444",
    time_ago: "4h ago",
  },
  {
    id: "demo-4",
    customer_id: "demo",
    user_id: "demo",
    title: "Staff Meeting Tomorrow",
    body: "Monthly staff meeting scheduled for 10:00 AM in Conference Room.",
    data: null,
    notification_type: "announcement",
    category: "announcements",
    priority: "normal",
    image_url: null,
    action_url: null,
    is_read: true,
    read_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    icon: "bullhorn",
    color: "#F59E0B",
    time_ago: "1d ago",
  },
  {
    id: "demo-5",
    customer_id: "demo",
    user_id: "demo",
    title: "Test Results Published",
    body: "Class 9-B Science test results are now available. Average: 72%",
    data: { testId: "t1" },
    notification_type: "grade",
    category: "grades",
    priority: "normal",
    image_url: null,
    action_url: "screen:test-results",
    is_read: true,
    read_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    icon: "school",
    color: "#3B82F6",
    time_ago: "2d ago",
  },
  {
    id: "demo-6",
    customer_id: "demo",
    user_id: "demo",
    title: "Schedule Change",
    body: "Your class timing for Thursday has been updated. Check schedule.",
    data: null,
    notification_type: "schedule",
    category: "schedule",
    priority: "low",
    image_url: null,
    action_url: "screen:schedule",
    is_read: true,
    read_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    icon: "calendar",
    color: "#EC4899",
    time_ago: "3d ago",
  },
];

function transformNotification(item: Record<string, unknown>): NotificationListItem {
  const notificationType = (item.notification_type as string) || "default";
  const category = (item.category as string) || "default";
  const sentAt = (item.sent_at as string) || (item.created_at as string);

  return {
    id: item.id as string,
    customer_id: item.customer_id as string,
    user_id: item.user_id as string,
    title: item.title as string,
    body: item.body as string | null,
    data: item.data as Record<string, unknown> | null,
    notification_type: notificationType,
    category: category,
    priority: (item.priority as "low" | "normal" | "high") || "normal",
    image_url: item.image_url as string | null,
    action_url: item.action_url as string | null,
    is_read: (item.is_read as boolean) || false,
    read_at: item.read_at as string | null,
    sent_at: sentAt,
    expires_at: item.expires_at as string | null,
    created_at: item.created_at as string,
    icon: TYPE_ICONS[notificationType] || TYPE_ICONS.default,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.default,
    time_ago: getTimeAgo(sentAt),
  };
}

function filterDemoData(
  data: NotificationListItem[],
  filters: NotificationsListFilters
): NotificationListItem[] {
  let filtered = [...data];

  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter((n) => n.category === filters.category);
  }

  if (filters.readStatus === "read") {
    filtered = filtered.filter((n) => n.is_read);
  } else if (filters.readStatus === "unread") {
    filtered = filtered.filter((n) => !n.is_read);
  }

  if (filters.priority && filters.priority !== "all") {
    filtered = filtered.filter((n) => n.priority === filters.priority);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.body && n.body.toLowerCase().includes(query))
    );
  }

  return filtered;
}

/**
 * Fetch notifications list with filters
 */
export function useNotificationsListQuery(
  filters: NotificationsListFilters = {},
  pageSize: number = 20
) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["notifications-list", customerId, userId, filters, pageSize],
    queryFn: async (): Promise<NotificationsListData> => {
      // Return demo data if no customerId
      if (!customerId || !userId) {
        console.log("No customerId/userId, using demo notifications");
        const filtered = filterDemoData(DEMO_NOTIFICATIONS, filters);
        return {
          notifications: filtered.slice(0, pageSize),
          totalCount: filtered.length,
          unreadCount: filtered.filter((n) => !n.is_read).length,
          hasMore: filtered.length > pageSize,
        };
      }

      const supabase = getSupabaseClient();

      // Build query
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("customer_id", customerId)
        .eq("user_id", userId);

      // Apply filters
      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.readStatus === "read") {
        query = query.eq("is_read", true);
      } else if (filters.readStatus === "unread") {
        query = query.eq("is_read", false);
      }

      if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,body.ilike.%${filters.searchQuery}%`
        );
      }

      // Order and limit
      query = query.order("sent_at", { ascending: false }).limit(pageSize);

      const { data, error, count } = await query;

      if (error) {
        console.warn("Notifications list query failed:", error);
        // Return demo data on error
        const filtered = filterDemoData(DEMO_NOTIFICATIONS, filters);
        return {
          notifications: filtered.slice(0, pageSize),
          totalCount: filtered.length,
          unreadCount: filtered.filter((n) => !n.is_read).length,
          hasMore: filtered.length > pageSize,
        };
      }

      const notifications = (data || []).map(transformNotification);

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("user_id", userId)
        .eq("is_read", false);

      return {
        notifications,
        totalCount: count || notifications.length,
        unreadCount: unreadCount || 0,
        hasMore: (count || 0) > pageSize,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: isOnline ? 2 : 0,
  });
}

/**
 * Infinite scroll notifications query
 */
export function useInfiniteNotificationsQuery(
  filters: NotificationsListFilters = {},
  pageSize: number = 20
) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useInfiniteQuery({
    queryKey: ["notifications-infinite", customerId, userId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Return demo data if no customerId
      if (!customerId || !userId) {
        const filtered = filterDemoData(DEMO_NOTIFICATIONS, filters);
        const start = pageParam * pageSize;
        const end = start + pageSize;
        return {
          notifications: filtered.slice(start, end),
          nextPage: end < filtered.length ? pageParam + 1 : undefined,
        };
      }

      const supabase = getSupabaseClient();

      // Build query
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("customer_id", customerId)
        .eq("user_id", userId);

      // Apply filters
      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.readStatus === "read") {
        query = query.eq("is_read", true);
      } else if (filters.readStatus === "unread") {
        query = query.eq("is_read", false);
      }

      if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,body.ilike.%${filters.searchQuery}%`
        );
      }

      // Pagination
      const offset = pageParam * pageSize;
      query = query
        .order("sent_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const notifications = (data || []).map(transformNotification);

      return {
        notifications,
        nextPage: notifications.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}

export { TYPE_ICONS, CATEGORY_COLORS };
