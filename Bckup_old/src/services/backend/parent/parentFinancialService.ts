/**
 * Parent Financial Service
 * Manage payments and fee tracking
 *
 * Database Tables:
 * - payments
 * - student_fees
 * - invoices
 * - financial_summary_by_parent (view)
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import {
  StudentFee,
  Payment,
  FeeBalance,
  PaymentMethod,
  FeeFilters,
  PaymentFilters,
} from '../../../types/database/parent';

// ==================== FEE MANAGEMENT ====================

/**
 * Get all fees for a parent's children
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 * @returns Promise<StudentFee[]>
 */
export async function getFees(parentId: string, filters?: FeeFilters): Promise<StudentFee[]> {
  // Get parent's children
  const { data: relationships, error: relError } = await supabase
    .from('parent_child_relationships')
    .select('student_id')
    .eq('parent_id', parentId);

  if (relError) {
    handleSupabaseError(relError, 'getFees - relationships');
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const studentIds = relationships.map((r) => r.student_id);

  let query = supabase.from('student_fees').select('*').in('student_id', studentIds);

  if (filters?.student_id) {
    query = query.eq('student_id', filters.student_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.fee_type) {
    query = query.eq('fee_type', filters.fee_type);
  }

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getFees');
  }

  return data || [];
}

/**
 * Get fee balance for a parent (all children combined)
 * @param parentId - The parent UUID
 * @returns Promise<FeeBalance>
 */
export async function getFeeBalance(parentId: string): Promise<FeeBalance> {
  const fees = await getFees(parentId);

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = fees.reduce((sum, fee) => sum + fee.paid_amount, 0);
  const balanceDue = fees.reduce((sum, fee) => sum + fee.balance, 0);

  const overdueFees = fees.filter(
    (fee) => fee.status === 'overdue' || new Date(fee.due_date) < new Date()
  );
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.balance, 0);

  return {
    total_fees: totalFees,
    total_paid: totalPaid,
    balance_due: balanceDue,
    overdue_amount: overdueAmount,
  };
}

/**
 * Get overdue fees for a parent
 * @param parentId - The parent UUID
 * @returns Promise<StudentFee[]>
 */
export async function getOverdueFees(parentId: string): Promise<StudentFee[]> {
  const fees = await getFees(parentId);
  const now = new Date();

  return fees.filter((fee) => {
    return (
      (fee.status === 'overdue' || new Date(fee.due_date) < now) &&
      fee.balance > 0
    );
  });
}

// ==================== PAYMENTS ====================

/**
 * Initiate a payment for fees
 * @param parentId - The parent UUID
 * @param feeIds - Array of fee IDs to pay
 * @param paymentMethod - Payment method
 * @returns Promise<Payment>
 */
export async function initiatePayment(
  parentId: string,
  feeIds: string[],
  paymentMethod: PaymentMethod
): Promise<Payment> {
  // Calculate total amount from fees
  const { data: fees, error: feesError } = await supabase
    .from('student_fees')
    .select('*')
    .in('id', feeIds);

  if (feesError) {
    handleSupabaseError(feesError, 'initiatePayment - fees');
  }

  if (!fees || fees.length === 0) {
    throw new Error('No valid fees found for payment');
  }

  const totalAmount = fees.reduce((sum, fee) => sum + fee.balance, 0);

  // Create payment record
  const { data, error } = await supabase
    .from('payments')
    .insert({
      parent_id: parentId,
      student_id: fees[0].student_id, // Primary student
      amount: totalAmount,
      payment_method: paymentMethod,
      status: 'pending',
      notes: `Payment for ${fees.length} fee(s)`,
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'initiatePayment');
  }

  // In production, this would integrate with payment gateway
  // For now, return the payment record
  return data;
}

/**
 * Get payment history for a parent
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 * @returns Promise<Payment[]>
 */
export async function getPaymentHistory(
  parentId: string,
  filters?: PaymentFilters
): Promise<Payment[]> {
  let query = supabase
    .from('payments')
    .select('*')
    .eq('parent_id', parentId)
    .order('processed_at', { ascending: false });

  if (filters?.start_date) {
    query = query.gte('processed_at', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('processed_at', filters.end_date);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getPaymentHistory');
  }

  return data || [];
}

/**
 * Download payment receipt
 * @param paymentId - The payment UUID
 * @returns Promise<string> - Receipt URL
 */
export async function downloadReceipt(paymentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('payments')
    .select('receipt_url')
    .eq('id', paymentId)
    .single();

  if (error) {
    handleSupabaseError(error, 'downloadReceipt');
  }

  if (!data?.receipt_url) {
    throw new Error('Receipt not available for this payment');
  }

  return data.receipt_url;
}

// ==================== INVOICES ====================

/**
 * Get invoices for a parent
 * @param parentId - The parent UUID
 * @returns Promise<any[]>
 */
export async function getInvoices(parentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getInvoices');
  }

  return data || [];
}

/**
 * Download invoice PDF
 * @param invoiceId - The invoice UUID
 * @returns Promise<string> - Invoice URL
 */
export async function downloadInvoice(invoiceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_url')
    .eq('id', invoiceId)
    .single();

  if (error) {
    handleSupabaseError(error, 'downloadInvoice');
  }

  if (!data?.invoice_url) {
    throw new Error('Invoice file not available');
  }

  return data.invoice_url;
}
