import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export type LeaveType = "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid" | "other";

export type CreateLeaveRequestPayload = {
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
  isHalfDay?: boolean;
  halfDayType?: "first_half" | "second_half";
  attachmentUrl?: string;
};

export type LeaveRequestResult = {
  success: boolean;
  requestId?: string;
  message: string;
};

// Calculate duration in days
function calculateDuration(startDate: string, endDate: string, isHalfDay?: boolean): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
  return isHalfDay ? 0.5 : diffDays;
}

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (payload: CreateLeaveRequestPayload): Promise<LeaveRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { leaveType, startDate, endDate, reason, isHalfDay, halfDayType, attachmentUrl } = payload;

      const durationDays = calculateDuration(startDate, endDate, isHalfDay);

      const { data, error } = await supabase
        .from("teacher_leave_requests")
        .insert({
          customer_id: customerId,
          teacher_id: user?.id || "unknown",
          teacher_name: user?.name || "Unknown Teacher",
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          duration_days: durationDays,
          is_half_day: isHalfDay || false,
          half_day_type: halfDayType || null,
          reason_en: reason || null,
          status: "pending",
          attachment_url: attachmentUrl || null,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId: data?.id,
        message: "Leave request submitted successfully",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

// Cancel a leave request
export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (requestId: string): Promise<LeaveRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { error } = await supabase
        .from("teacher_leave_requests")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("customer_id", customerId)
        .eq("teacher_id", user?.id)
        .in("status", ["pending"]); // Can only cancel pending requests

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId,
        message: "Leave request cancelled",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

// Update a leave request (only pending)
export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: Partial<CreateLeaveRequestPayload>;
    }): Promise<LeaveRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.leaveType) updateData.leave_type = payload.leaveType;
      if (payload.startDate) updateData.start_date = payload.startDate;
      if (payload.endDate) updateData.end_date = payload.endDate;
      if (payload.reason !== undefined) updateData.reason_en = payload.reason;
      if (payload.isHalfDay !== undefined) updateData.is_half_day = payload.isHalfDay;
      if (payload.halfDayType !== undefined) updateData.half_day_type = payload.halfDayType;
      if (payload.attachmentUrl !== undefined) updateData.attachment_url = payload.attachmentUrl;

      // Recalculate duration if dates changed
      if (payload.startDate && payload.endDate) {
        updateData.duration_days = calculateDuration(payload.startDate, payload.endDate, payload.isHalfDay);
      }

      const { error } = await supabase
        .from("teacher_leave_requests")
        .update(updateData)
        .eq("id", requestId)
        .eq("customer_id", customerId)
        .eq("teacher_id", user?.id)
        .eq("status", "pending"); // Can only update pending requests

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId,
        message: "Leave request updated",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-leave-requests"] });
    },
  });
};
