import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type TeacherDoubt = {
  id: string;
  customer_id: string;
  teacher_id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  student_class?: string;
  subject_en: string;
  subject_hi?: string;
  chapter_en?: string;
  chapter_hi?: string;
  question: string;
  question_image?: string;
  priority: "low" | "normal" | "high" | "urgent";
  ai_suggestion?: string;
  ai_confidence?: number;
  answer?: string;
  answer_image?: string;
  answered_at?: string;
  is_resolved: boolean;
  is_bookmarked: boolean;
  tags?: string[];
  status: "pending" | "answered" | "resolved" | "archived";
  created_at: string;
  updated_at: string;
};

export function useTeacherDoubtsQuery(options?: {
  limit?: number;
  status?: string;
  priority?: string;
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const status = options?.status;
  const priority = options?.priority;

  return useQuery({
    queryKey: ["teacher-doubts", customerId, { limit, status, priority }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("teacher_doubts")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      } else {
        query = query.neq("status", "archived");
      }

      if (priority) {
        query = query.eq("priority", priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TeacherDoubt[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDoubtDetailQuery(doubtId: string | null) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["doubt-detail", customerId, doubtId],
    queryFn: async () => {
      if (!doubtId) return null;

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("teacher_doubts")
        .select("*")
        .eq("customer_id", customerId)
        .eq("id", doubtId)
        .single();

      if (error) throw error;
      return data as TeacherDoubt;
    },
    enabled: !!customerId && !!doubtId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePendingDoubtsCount() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["pending-doubts-count", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { count, error } = await supabase
        .from("teacher_doubts")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 1,
  });
}
