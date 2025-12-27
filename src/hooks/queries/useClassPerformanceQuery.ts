import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../../hooks/config/useCustomerId";

export type ClassPerformance = {
  id: string;
  customer_id: string;
  user_id: string;
  student_name?: string;
  class_id?: string;
  class_name_en?: string;
  class_name_hi?: string;
  subject_en: string;
  subject_hi?: string;
  score: number;
  max_score: number;
  grade: string;
  rank: number;
  class_average: number;
  previous_score?: number;
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

export function useClassPerformanceQuery(options?: {
  limit?: number;
  classId?: string | null;
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 6;
  const classId = options?.classId;

  return useQuery({
    queryKey: ["class-performance", customerId, { limit, classId }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("class_performance")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("score", { ascending: false })
        .limit(limit);

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ClassPerformance[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClassesForPerformanceQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["classes-for-performance", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("class_performance")
        .select("class_id, class_name_en, class_name_hi")
        .eq("customer_id", customerId)
        .eq("status", "active");

      if (error) throw error;

      // Get unique classes
      const uniqueClasses = new Map<string, ClassOption>();
      (data || []).forEach((item: any) => {
        if (item.class_id && !uniqueClasses.has(item.class_id)) {
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
    staleTime: 1000 * 60 * 30,
  });
}
