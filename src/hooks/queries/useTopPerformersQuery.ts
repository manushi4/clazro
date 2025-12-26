/**
 * Top Performers Query Hook
 * Fetches top performing students with optional class filter
 */
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../../hooks/config/useCustomerId";

export type TopPerformer = {
  id: string;
  customer_id: string;
  class_id: string;
  class_name_en: string;
  class_name_hi?: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  rank: number;
  score: number;
  subject_en?: string;
  subject_hi?: string;
  trend: "up" | "down" | "stable";
  period_type: string;
  period_label: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ClassOption = {
  id: string;
  name_en: string;
  name_hi?: string;
};

export function useTopPerformersQuery(options?: {
  limit?: number;
  classId?: string | null;
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 5;
  const classId = options?.classId;

  return useQuery({
    queryKey: ["top-performers", customerId, { limit, classId }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("top_performers")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("rank", { ascending: true })
        .limit(limit);

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TopPerformer[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useClassesForFilterQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["classes-filter", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("top_performers")
        .select("class_id, class_name_en, class_name_hi")
        .eq("customer_id", customerId)
        .eq("status", "active");

      if (error) throw error;

      // Get unique classes
      const uniqueClasses = new Map<string, ClassOption>();
      (data || []).forEach((item: any) => {
        if (!uniqueClasses.has(item.class_id)) {
          uniqueClasses.set(item.class_id, {
            id: item.class_id,
            name_en: item.class_name_en,
            name_hi: item.class_name_hi,
          });
        }
      });

      return Array.from(uniqueClasses.values());
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
