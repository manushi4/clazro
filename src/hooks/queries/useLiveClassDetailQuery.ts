/**
 * Live Class Detail Query Hook
 *
 * Fetches a single live class by ID for the live class detail screen.
 * Supports offline caching and joins with subjects/teachers.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type LiveClassDetail = {
  id: string;
  customer_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  class_type: string | null;
  room: string | null;
  start_time: string;
  end_time: string;
  is_live: boolean | null;
  meeting_url: string | null;
  recurrence_rule: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  subject?: {
    id: string;
    title_en: string;
    title_hi: string | null;
    icon: string | null;
    color: string | null;
  } | null;
  teacher?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Fetch a single live class by ID with subject and teacher details
 */
export function useLiveClassDetailQuery(classId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["live-class-detail", customerId, classId],
    queryFn: async () => {
      if (!classId) throw new Error("Class ID required");

      const supabase = getSupabaseClient();

      // Fetch live class with joined subject and teacher data
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          subject:subjects(id, title_en, title_hi, icon, color),
          teacher:user_profiles!classes_teacher_id_fkey(id, first_name, last_name, display_name, avatar_url)
        `)
        .eq("id", classId)
        .single();

      if (error) {
        // If join fails, try fetching just the class
        const { data: classOnly, error: classError } = await supabase
          .from("classes")
          .select("*")
          .eq("id", classId)
          .single();

        if (classError) throw classError;
        return classOnly as LiveClassDetail;
      }

      return data as LiveClassDetail;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - live classes need fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!customerId && !!classId,
    retry: isOnline ? 2 : 0,
    refetchInterval: isOnline ? 30 * 1000 : false, // Refetch every 30 seconds when online
  });
}
