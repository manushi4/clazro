import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type TeacherMessage = {
  id: string;
  customer_id: string;
  teacher_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "parent" | "student" | "admin" | "teacher";
  sender_avatar?: string;
  student_id?: string;
  student_name?: string;
  subject: string;
  preview: string;
  content?: string;
  is_read: boolean;
  is_starred: boolean;
  thread_id?: string;
  reply_count: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export function useTeacherMessagesQuery(options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const unreadOnly = options?.unreadOnly || false;

  return useQuery({
    queryKey: ["teacher-messages", customerId, { limit, unreadOnly }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("teacher_messages")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TeacherMessage[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUnreadMessagesCount() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["teacher-messages-unread-count", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { count, error } = await supabase
        .from("teacher_messages")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "active")
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 1,
  });
}
