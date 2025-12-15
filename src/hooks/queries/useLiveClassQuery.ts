import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useNetworkStatus } from "../../offline/networkStore";

export type LiveClass = {
  id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  is_live: boolean;
  teacher_name?: string;
  participants_count?: number;
  subject?: {
    id: string;
    title_en: string;
    title_hi?: string;
    color?: string;
    icon?: string;
  };
};

async function fetchLiveClasses(userId: string): Promise<LiveClass[]> {
  // Get current time and next 24 hours
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("classes")
    .select(`
      id,
      title_en,
      title_hi,
      description_en,
      description_hi,
      start_time,
      end_time,
      meeting_url,
      is_live,
      class_type,
      subject:subjects(id, title_en, title_hi, color, icon)
    `)
    .eq("class_type", "live")
    .gte("start_time", now.toISOString())
    .lte("start_time", tomorrow.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch live classes: ${error.message}`);
  }

  // Transform data to include computed fields
  return (data || []).map((cls) => ({
    ...cls,
    subject: Array.isArray(cls.subject) ? cls.subject[0] : cls.subject,
    // Mock data for demo - in production these would come from a join or RPC
    teacher_name: "Teacher",
    participants_count: Math.floor(Math.random() * 30) + 5,
  }));
}

export function useLiveClassQuery(userId: string) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["live-classes", userId],
    queryFn: () => fetchLiveClasses(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes - live classes need fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!userId,
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
    refetchInterval: isOnline ? 60 * 1000 : false, // Refetch every minute when online
  });
}
