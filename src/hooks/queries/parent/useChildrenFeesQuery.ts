import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type FeeStatus = "pending" | "overdue" | "partial" | "paid";
export type FeeType = "tuition" | "exam" | "transport" | "library" | "lab" | "other";

export type FeeRecord = {
  id: string;
  student_user_id: string;
  fee_type: FeeType;
  title_en: string;
  title_hi: string | null;
  amount: number;
  due_date: string;
  paid_amount: number | null;
  paid_date: string | null;
  status: FeeStatus;
};

export type ChildFeeSummary = {
  child_user_id: string;
  child_name: string;
  pending_fees: FeeRecord[];
  overdue_fees: FeeRecord[];
  partial_fees: FeeRecord[];
  total_pending: number;
  total_overdue: number;
  next_due_date: string | null;
};

export function useChildrenFeesQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["children-fees", customerId, parentUserId],
    queryFn: async (): Promise<ChildFeeSummary[]> => {
      const supabase = getSupabaseClient();

      // Get parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) return [];

      const childIds = childrenData.map((c) => c.child_user_id);

      // Fetch fee records for all children (pending, overdue, partial only)
      const { data: feeRecords, error: feeError } = await supabase
        .from("fee_records")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .in("status", ["pending", "overdue", "partial"])
        .order("due_date", { ascending: true });

      if (feeError) throw feeError;

      // Process data for each child
      const summaries: ChildFeeSummary[] = childrenData.map((child, index) => {
        const childFees = (feeRecords || []).filter(
          (f) => f.student_user_id === child.child_user_id
        );

        const pendingFees = childFees.filter((f) => f.status === "pending");
        const overdueFees = childFees.filter((f) => f.status === "overdue");
        const partialFees = childFees.filter((f) => f.status === "partial");

        const totalPending = pendingFees.reduce((sum, f) => sum + Number(f.amount), 0);
        const totalOverdue = overdueFees.reduce((sum, f) => sum + Number(f.amount), 0);
        const partialRemaining = partialFees.reduce(
          (sum, f) => sum + (Number(f.amount) - (Number(f.paid_amount) || 0)),
          0
        );

        // Find next due date from pending fees
        const nextDue = pendingFees.length > 0 ? pendingFees[0].due_date : null;

        return {
          child_user_id: child.child_user_id,
          child_name: `Child ${index + 1}`,
          pending_fees: pendingFees.map(mapFeeRecord),
          overdue_fees: overdueFees.map(mapFeeRecord),
          partial_fees: partialFees.map(mapFeeRecord),
          total_pending: totalPending + partialRemaining,
          total_overdue: totalOverdue,
          next_due_date: nextDue,
        };
      });

      return summaries;
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5,
  });
}

function mapFeeRecord(f: any): FeeRecord {
  return {
    id: f.id,
    student_user_id: f.student_user_id,
    fee_type: f.fee_type,
    title_en: f.title_en,
    title_hi: f.title_hi,
    amount: Number(f.amount),
    due_date: f.due_date,
    paid_amount: f.paid_amount ? Number(f.paid_amount) : null,
    paid_date: f.paid_date,
    status: f.status,
  };
}
