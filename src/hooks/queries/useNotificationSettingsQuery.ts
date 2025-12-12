import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "../../types/notification.types";

/**
 * Fetch customer notification settings from Supabase
 */
const fetchNotificationSettings = async (
  customerId: string
): Promise<NotificationSettings> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error) {
    // Return defaults if no settings found
    if (error.code === "PGRST116") {
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        customer_id: customerId,
      };
    }
    throw error;
  }

  return data as NotificationSettings;
};

/**
 * Hook to get customer notification settings
 */
export const useNotificationSettingsQuery = (customerId: string | null) => {
  return useQuery({
    queryKey: ["notification-settings", customerId],
    queryFn: () => fetchNotificationSettings(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Check if notification should be shown based on settings
 */
export const shouldShowNotification = (
  settings: NotificationSettings,
  category: string
): boolean => {
  // Check if notifications are globally enabled
  if (!settings.notifications_enabled) {
    return false;
  }

  // Check if category is enabled
  const categoryKey = category as keyof typeof settings.categories;
  if (settings.categories[categoryKey] === false) {
    return false;
  }

  // Check quiet hours
  if (settings.quiet_hours_enabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const start = settings.quiet_hours_start;
    const end = settings.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return false;
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return false;
      }
    }
  }

  return true;
};
