/**
 * Announcement Query Hook
 *
 * Fetches a single announcement by ID for the detail screen.
 * Supports offline caching and localized content.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type Announcement = {
  id: string;
  customer_id: string;
  title_en: string;
  title_hi: string | null;
  content_en: string;
  content_hi: string | null;
  category: string | null;
  priority: "low" | "normal" | "high" | null;
  target_roles: string[] | null;
  is_pinned: boolean;
  attachment_url: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch a single announcement by ID
 */
export function useAnnouncementQuery(announcementId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["announcement", customerId, announcementId],
    queryFn: async () => {
      if (!announcementId) throw new Error("Announcement ID required");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("school_announcements")
        .select("*")
        .eq("id", announcementId)
        .single();

      if (error) throw error;
      return data as Announcement;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!announcementId,
    retry: isOnline ? 2 : 0,
  });
}
