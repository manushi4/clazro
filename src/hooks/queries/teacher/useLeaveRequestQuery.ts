import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export interface LeaveRequest {
  id: string;
  customer_id: string;
  teacher_id: string;
  teacher_name: string;
  leave_type: "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid" | "other";
  start_date: string;
  end_date: string;
  duration_days: number;
  is_half_day: boolean;
  half_day_type: "first_half" | "second_half" | null;
  reason_en: string | null;
  reason_hi: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approver_id: string | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  leaves_available: number | null;
  leaves_used: number | null;
  attachment_url: string | null;
  created_at: string;
}

export interface LeaveBalance {
  sick: { available: number; used: number; total: number };
  casual: { available: number; used: number; total: number };
  earned: { available: number; used: number; total: number };
}

interface UseLeaveRequestQueryOptions {
  status?: "pending" | "approved" | "rejected" | "cancelled" | "all";
  limit?: number;
}

export const useLeaveRequestQuery = (options: UseLeaveRequestQueryOptions = {}) => {
  const { customerId, userId } = useAuthStore();
  const { status = "all", limit = 10 } = options;

  return useQuery<LeaveRequest[]>({
    queryKey: ["teacher", "leave-requests", customerId, userId, status, limit],
    queryFn: async () => {
      let query = supabase
        .from("teacher_leave_requests")
        .select("*")
        .eq("customer_id", customerId)
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as LeaveRequest[];
    },
    enabled: !!customerId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLeaveBalanceQuery = () => {
  const { customerId, userId } = useAuthStore();

  return useQuery<LeaveBalance>({
    queryKey: ["teacher", "leave-balance", customerId, userId],
    queryFn: async () => {
      // Get the most recent leave request to fetch balance info
      const { data, error } = await supabase
        .from("teacher_leave_requests")
        .select("leave_type, leaves_available, leaves_used")
        .eq("customer_id", customerId)
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      // Default balance structure
      const balance: LeaveBalance = {
        sick: { available: 12, used: 0, total: 12 },
        casual: { available: 8, used: 0, total: 8 },
        earned: { available: 15, used: 0, total: 15 },
      };

      // Update from data if available
      if (data && data.length > 0) {
        const recent = data[0];
        if (recent.leaves_available !== null && recent.leaves_used !== null) {
          const leaveType = recent.leave_type as keyof LeaveBalance;
          if (balance[leaveType]) {
            balance[leaveType] = {
              available: recent.leaves_available,
              used: recent.leaves_used,
              total: recent.leaves_available + recent.leaves_used,
            };
          }
        }
      }

      return balance;
    },
    enabled: !!customerId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
