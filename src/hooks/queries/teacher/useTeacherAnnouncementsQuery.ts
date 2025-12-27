import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type TeacherAnnouncement = {
  id: string;
  customer_id: string;
  teacher_id: string;
  title_en: string;
  title_hi?: string;
  content_en: string;
  content_hi?: string;
  target_type: "all" | "class" | "students";
  target_class_id?: string;
  target_class_name?: string;
  target_student_ids?: string[];
  priority: "low" | "normal" | "high" | "urgent";
  icon: string;
  color: string;
  is_pinned: boolean;
  views_count: number;
  acknowledgements_count: number;
  expires_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function useTeacherAnnouncementsQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 5;

  return useQuery({
    queryKey: ["teacher-announcements", customerId, { limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("teacher_announcements")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as TeacherAnnouncement[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}
