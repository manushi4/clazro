/**
 * Query hook for Recent Viewed widget (recent.viewed)
 * Fetches recently viewed content items for the user
 */
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useNetworkStatus } from "../../offline/networkStore";
import { useDemoUser } from "../useDemoUser";

export type RecentViewedItem = {
  id: string;
  content_type: "lesson" | "video" | "note" | "assignment" | "test" | "resource";
  content_id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  color: string;
  route: string;
  thumbnail_url?: string;
  progress_percent: number;
  duration_seconds?: number;
  last_position_seconds?: number;
  viewed_at: string;
};

async function fetchRecentViewed(userId: string): Promise<RecentViewedItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("recent_viewed")
    .select("*")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to fetch recent viewed: ${error.message}`);
  }

  return data || [];
}

export function useRecentViewedQuery() {
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["recent-viewed", userId],
    queryFn: () => fetchRecentViewed(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: isOnline ? 2 : 0,
  });
}
