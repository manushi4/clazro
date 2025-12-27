import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type ParentContact = {
  id: string;
  customer_id: string;
  parent_id: string;
  parent_name: string;
  parent_phone?: string;
  parent_email?: string;
  parent_avatar?: string;
  relation: "father" | "mother" | "guardian" | "parent";
  student_id: string;
  student_name: string;
  student_class?: string;
  student_roll_no?: string;
  is_primary: boolean;
  last_contacted_at?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function useParentContactsQuery(options?: {
  limit?: number;
  searchQuery?: string;
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const searchQuery = options?.searchQuery;

  return useQuery({
    queryKey: ["parent-contacts", customerId, { limit, searchQuery }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("parent_contacts")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("parent_name", { ascending: true })
        .limit(limit);

      if (searchQuery) {
        query = query.or(
          `parent_name.ilike.%${searchQuery}%,student_name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ParentContact[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10,
  });
}
