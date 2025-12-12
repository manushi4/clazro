/**
 * Financial Service Module
 *
 * This module provides API functions for financial operations including
 * payment history, upcoming payments, fee management, and financial summaries.
 */

import { supabase } from '../../supabase/client';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type { FinancialSummary } from '../../../types/supabase-parent.types';

/**
 * Payment record interface (based on typical payment structure)
 * Note: This should be defined in your types file if it exists in the database
 */
export interface Payment {
  id: string;
  parent_id: string;
  student_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  payment_type: string;
  payment_method?: string;
  transaction_id?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Student fee interface
 */
export interface StudentFee {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  description?: string;
  academic_year?: string;
  term?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get financial summary for a parent
 * @param parentId - Parent ID
 * @returns Promise with financial summary
 * @throws {APIError} For errors
 */
export async function getFinancialSummary(parentId: string): Promise<FinancialSummary> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase.rpc('get_parent_financial_summary', {
        p_parent_id: parentId,
      });
    });

    if (error) throw parseSupabaseError(error);

    // Return default values if no data
    if (!data || data.length === 0) {
      return {
        total_paid: 0,
        total_pending: 0,
        payment_count: 0,
      };
    }

    return data[0];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get payment history for a parent
 * @param parentId - Parent ID
 * @param filters - Optional filters (studentId, startDate, endDate, status)
 * @returns Promise with array of payments
 * @throws {APIError} For errors
 */
export async function getPaymentHistory(
  parentId: string,
  filters?: {
    studentId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    limit?: number;
  }
): Promise<Payment[]> {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('parent_id', parentId)
      .order('payment_date', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.startDate) {
      query = query.gte('payment_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('payment_date', filters.endDate);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get upcoming payments that are due
 * @param parentId - Parent ID
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @returns Promise with array of upcoming payments
 * @throws {APIError} For errors
 */
export async function getUpcomingPayments(
  parentId: string,
  daysAhead: number = 30
): Promise<Payment[]> {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('payments')
        .select('*')
        .eq('parent_id', parentId)
        .in('status', ['pending', 'overdue'])
        .gte('due_date', todayStr)
        .lte('due_date', futureDateStr)
        .order('due_date', { ascending: true });
    });

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get a single payment by ID
 * @param paymentId - Payment ID
 * @returns Promise with payment details
 * @throws {NotFoundError} If payment not found
 * @throws {APIError} For other errors
 */
export async function getPaymentById(paymentId: string): Promise<Payment> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
    });

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Payment not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get student fees (tuition, exam fees, etc.)
 * @param studentId - Student ID
 * @param status - Optional status filter
 * @returns Promise with array of student fees
 * @throws {APIError} For errors
 */
export async function getStudentFees(
  studentId: string,
  status?: 'pending' | 'paid' | 'overdue' | 'waived'
): Promise<StudentFee[]> {
  try {
    let query = supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get overdue payments for a parent
 * @param parentId - Parent ID
 * @returns Promise with array of overdue payments
 * @throws {APIError} For errors
 */
export async function getOverduePayments(parentId: string): Promise<Payment[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('payments')
        .select('*')
        .eq('parent_id', parentId)
        .in('status', ['pending', 'overdue'])
        .lt('due_date', today)
        .order('due_date', { ascending: true });
    });

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get total amount due for a parent
 * @param parentId - Parent ID
 * @returns Promise with total amount due
 * @throws {APIError} For errors
 */
export async function getTotalAmountDue(parentId: string): Promise<number> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('payments')
        .select('amount')
        .eq('parent_id', parentId)
        .in('status', ['pending', 'overdue']);
    });

    if (error) throw parseSupabaseError(error);

    if (!data || data.length === 0) return 0;

    // Sum up all amounts
    const total = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return total;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}
