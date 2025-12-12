import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type PaymentMethod = "upi" | "card" | "netbanking" | "cash" | "cheque" | "other";
export type FeeType = "tuition" | "exam" | "transport" | "library" | "lab" | "other";

export type PaymentRecord = {
  id: string;
  student_user_id: string;
  fee_type: FeeType;
  title_en: string;
  title_hi: string | null;
  amount: number;
  paid_amount: number;
  paid_date: string;
  payment_method: PaymentMethod | null;
  receipt_number: string | null;
};

export type PaymentHistorySummary = {
  payments: PaymentRecord[];
  total_paid: number;
  payment_count: number;
};

export function usePaymentHistoryQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["payment-history", customerId, parentUserId],
    queryFn: async (): Promise<PaymentHistorySummary> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) {
        return { payments: [], total_paid: 0, payment_count: 0 };
      }

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch paid fee records for all children
      const { data: paidRecords, error: feeError } = await supabase
        .from("fee_records")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .eq("status", "paid")
        .order("paid_date", { ascending: false });

      if (feeError) throw feeError;

      const payments: PaymentRecord[] = (paidRecords || []).map((f) => ({
        id: f.id,
        student_user_id: f.student_user_id,
        fee_type: f.fee_type,
        title_en: f.title_en,
        title_hi: f.title_hi,
        amount: Number(f.amount),
        paid_amount: Number(f.paid_amount),
        paid_date: f.paid_date,
        payment_method: f.payment_method,
        receipt_number: f.receipt_number,
      }));

      const total_paid = payments.reduce((sum, p) => sum + p.paid_amount, 0);

      return {
        payments,
        total_paid,
        payment_count: payments.length,
      };
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5,
  });
}
