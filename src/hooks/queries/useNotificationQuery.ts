/**
 * Notification Query Hook
 * 
 * Fetches a single notification by ID for the detail screen.
 * Supports offline caching and mark-as-read mutation.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type Notification = {
  id: string;
  customer_id: string;
  user_id: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  notification_type: string | null;
  category: string | null;
  priority: "low" | "normal" | "high" | null;
  image_url: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  created_at: string;
};

/**
 * Fetch a single notification by ID
 */
export function useNotificationQuery(notificationId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["notification", customerId, notificationId],
    queryFn: async () => {
      if (!notificationId) throw new Error("Notification ID required");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", notificationId)
        .single();

      if (error) throw error;
      return data as Notification;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!notificationId,
    retry: isOnline ? 2 : 0,
  });
}

/**
 * Mark notification as read mutation
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, notificationId) => {
      // Update the single notification cache
      queryClient.setQueryData(
        ["notification", customerId, notificationId],
        data
      );
      // Invalidate notifications list
      queryClient.invalidateQueries({
        queryKey: ["notifications", customerId],
      });
    },
  });
}

/**
 * Delete notification mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: ["notification", customerId, notificationId],
      });
      // Invalidate notifications list
      queryClient.invalidateQueries({
        queryKey: ["notifications", customerId],
      });
    },
  });
}
