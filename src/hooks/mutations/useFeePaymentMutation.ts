/**
 * Fee Payment Mutation Hook
 *
 * Handles fee payment processing and status updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cash" | "cheque";

export type PaymentInput = {
  feeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
};

export type PaymentResult = {
  success: boolean;
  receiptNumber: string;
  paidDate: string;
  message: string;
};

/**
 * Process a fee payment
 */
export function useFeePaymentMutation() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PaymentInput): Promise<PaymentResult> => {
      const supabase = getSupabaseClient();

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const paidDate = new Date().toISOString().split("T")[0];

      // Get current fee record
      const { data: feeRecord, error: fetchError } = await supabase
        .from("fee_records")
        .select("amount, paid_amount, status")
        .eq("id", input.feeId)
        .single();

      if (fetchError) throw fetchError;
      if (!feeRecord) throw new Error("Fee record not found");

      const currentPaid = feeRecord.paid_amount || 0;
      const newPaidAmount = currentPaid + input.amount;
      const totalAmount = feeRecord.amount;

      // Determine new status
      let newStatus: string;
      if (newPaidAmount >= totalAmount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial";
      } else {
        newStatus = feeRecord.status;
      }

      // Update fee record
      const { error: updateError } = await supabase
        .from("fee_records")
        .update({
          paid_amount: newPaidAmount,
          paid_date: paidDate,
          payment_method: input.paymentMethod,
          receipt_number: receiptNumber,
          status: newStatus,
          notes: input.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.feeId);

      if (updateError) throw updateError;

      return {
        success: true,
        receiptNumber,
        paidDate,
        message: newStatus === "paid" ? "Payment completed successfully" : "Partial payment recorded",
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["fee-detail"] });
      queryClient.invalidateQueries({ queryKey: ["children-fees"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
  });
}
