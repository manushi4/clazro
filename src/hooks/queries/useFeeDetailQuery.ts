/**
 * Fee Detail Query Hook
 *
 * Fetches a single fee record by ID for the detail screen.
 * Supports offline caching and localized content.
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type FeeStatus = "pending" | "overdue" | "partial" | "paid";
export type FeeType = "tuition" | "exam" | "transport" | "library" | "lab" | "other";

export type FeeDetail = {
  id: string;
  customer_id: string;
  student_user_id: string;
  fee_type: FeeType;
  title_en: string;
  title_hi: string | null;
  amount: number;
  due_date: string;
  paid_amount: number | null;
  paid_date: string | null;
  status: FeeStatus;
  payment_method: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  child_name?: string;
  child_class?: string;
};

/**
 * Fetch a single fee record by ID
 */
export function useFeeDetailQuery(feeId: string | undefined) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["fee-detail", customerId, feeId],
    queryFn: async () => {
      if (!feeId) throw new Error("Fee ID required");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("fee_records")
        .select("*")
        .eq("id", feeId)
        .single();

      if (error) throw error;
      return data as FeeDetail;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!customerId && !!feeId,
    retry: isOnline ? 2 : 0,
  });
}
