import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export type CreateSubstituteRequestPayload = {
  className: string;
  classId?: string;
  subject: string;
  requestDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reason?: string;
  notes?: string;
};

export type SubstituteRequestResult = {
  success: boolean;
  requestId?: string;
  message: string;
};

export const useRequestSubstitute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (payload: CreateSubstituteRequestPayload): Promise<SubstituteRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { className, classId, subject, requestDate, startTime, endTime, reason, notes } = payload;

      const { data, error } = await supabase
        .from("substitute_requests")
        .insert({
          customer_id: customerId,
          requester_id: user?.id || "unknown",
          requester_name: user?.name || "Unknown Teacher",
          class_id: classId || null,
          class_name: className,
          subject,
          request_date: requestDate,
          start_time: startTime,
          end_time: endTime,
          reason: reason || null,
          notes: notes || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId: data?.id,
        message: "Substitute request created successfully",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitute-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-substitute"] });
    },
  });
};

// Cancel a substitute request
export const useCancelSubstituteRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (requestId: string): Promise<SubstituteRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { error } = await supabase
        .from("substitute_requests")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("customer_id", customerId)
        .eq("requester_id", user?.id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId,
        message: "Request cancelled successfully",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitute-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-substitute"] });
    },
  });
};

// Accept a substitute request (as a substitute teacher)
export const useAcceptSubstituteRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useMutation({
    mutationFn: async (requestId: string): Promise<SubstituteRequestResult> => {
      if (!customerId) {
        throw new Error("No customer ID available");
      }

      const { error } = await supabase
        .from("substitute_requests")
        .update({
          substitute_id: user?.id,
          substitute_name: user?.name || "Unknown Teacher",
          status: "fulfilled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("customer_id", customerId)
        .eq("status", "pending");

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        requestId,
        message: "You have accepted the substitute request",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitute-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-substitute"] });
    },
  });
};
