/**
 * useStudentFeeDetailQuery - Query hook for student fee detail
 *
 * Purpose: Fetch detailed fee information for a specific student
 * Used by: StudentFeeDetailScreen
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type FeeRecord = {
  id: string;
  studentId: string;
  academicYear: string;
  term: string;
  feeType: string;
  feeTypeEn: string;
  feeTypeHi?: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentFeeDetail = {
  studentId: string;
  studentName: string;
  studentNameHi?: string;
  studentEmail?: string;
  studentPhone?: string;
  batch?: string;
  program?: string;
  enrollmentDate?: string;
  parentName?: string;
  parentPhone?: string;
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  feeRecords: FeeRecord[];
  paymentHistory: PaymentRecord[];
};

export type PaymentRecord = {
  id: string;
  feeId: string;
  feeType: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  receiptNumber?: string;
  status: 'success' | 'pending' | 'failed';
};

// Demo data for when no real data exists
const DEMO_STUDENT_FEE_DETAIL: StudentFeeDetail = {
  studentId: 'demo-student-1',
  studentName: 'Rahul Sharma',
  studentNameHi: 'राहुल शर्मा',
  studentEmail: 'rahul.sharma@example.com',
  studentPhone: '+91 98765 43210',
  batch: 'JEE Advanced 2025-A',
  program: 'JEE',
  enrollmentDate: '2024-04-01',
  parentName: 'Suresh Sharma',
  parentPhone: '+91 98765 43211',
  totalFees: 150000,
  totalPaid: 100000,
  totalPending: 50000,
  totalOverdue: 25000,
  lastPaymentDate: '2024-11-15',
  lastPaymentAmount: 25000,
  feeRecords: [
    {
      id: 'fee-1',
      studentId: 'demo-student-1',
      academicYear: '2024-25',
      term: 'Q1',
      feeType: 'tuition',
      feeTypeEn: 'Tuition Fee - Q1',
      feeTypeHi: 'ट्यूशन फीस - Q1',
      amount: 50000,
      dueDate: '2024-04-15',
      paidAmount: 50000,
      paidDate: '2024-04-10',
      paymentMethod: 'upi',
      transactionId: 'TXN001234',
      status: 'paid',
      createdAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-04-10T00:00:00Z',
    },
    {
      id: 'fee-2',
      studentId: 'demo-student-1',
      academicYear: '2024-25',
      term: 'Q2',
      feeType: 'tuition',
      feeTypeEn: 'Tuition Fee - Q2',
      feeTypeHi: 'ट्यूशन फीस - Q2',
      amount: 50000,
      dueDate: '2024-07-15',
      paidAmount: 50000,
      paidDate: '2024-07-12',
      paymentMethod: 'netbanking',
      transactionId: 'TXN005678',
      status: 'paid',
      createdAt: '2024-07-01T00:00:00Z',
      updatedAt: '2024-07-12T00:00:00Z',
    },
    {
      id: 'fee-3',
      studentId: 'demo-student-1',
      academicYear: '2024-25',
      term: 'Q3',
      feeType: 'tuition',
      feeTypeEn: 'Tuition Fee - Q3',
      feeTypeHi: 'ट्यूशन फीस - Q3',
      amount: 50000,
      dueDate: '2024-10-15',
      paidAmount: 0,
      status: 'overdue',
      remarks: 'Payment reminder sent',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
    },
    {
      id: 'fee-4',
      studentId: 'demo-student-1',
      academicYear: '2024-25',
      term: 'Annual',
      feeType: 'exam',
      feeTypeEn: 'Examination Fee',
      feeTypeHi: 'परीक्षा शुल्क',
      amount: 5000,
      dueDate: '2024-12-31',
      paidAmount: 0,
      status: 'pending',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
    },
    {
      id: 'fee-5',
      studentId: 'demo-student-1',
      academicYear: '2024-25',
      term: 'Annual',
      feeType: 'library',
      feeTypeEn: 'Library Fee',
      feeTypeHi: 'पुस्तकालय शुल्क',
      amount: 2000,
      dueDate: '2024-12-31',
      paidAmount: 0,
      status: 'pending',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
    },
  ],
  paymentHistory: [
    {
      id: 'pay-1',
      feeId: 'fee-1',
      feeType: 'Tuition Fee - Q1',
      amount: 50000,
      paymentDate: '2024-04-10',
      paymentMethod: 'UPI',
      transactionId: 'TXN001234',
      receiptNumber: 'RCP-2024-001',
      status: 'success',
    },
    {
      id: 'pay-2',
      feeId: 'fee-2',
      feeType: 'Tuition Fee - Q2',
      amount: 50000,
      paymentDate: '2024-07-12',
      paymentMethod: 'Net Banking',
      transactionId: 'TXN005678',
      receiptNumber: 'RCP-2024-002',
      status: 'success',
    },
  ],
};

type UseStudentFeeDetailOptions = {
  studentId: string;
};

export function useStudentFeeDetailQuery(options: UseStudentFeeDetailOptions) {
  const customerId = useCustomerId();
  const { studentId } = options;

  return useQuery({
    queryKey: ['student-fee-detail', customerId, studentId],
    queryFn: async (): Promise<StudentFeeDetail> => {
      const supabase = getSupabaseClient();

      // Fetch student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) {
        console.warn('Error fetching student profile:', profileError);
        return DEMO_STUDENT_FEE_DETAIL;
      }

      // Fetch student fees
      const { data: fees, error: feesError } = await supabase
        .from('student_fees')
        .select('*')
        .eq('customer_id', customerId)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      if (feesError) {
        console.warn('Error fetching student fees:', feesError);
        return DEMO_STUDENT_FEE_DETAIL;
      }

      // If no data, return demo data
      if (!fees || fees.length === 0) {
        return DEMO_STUDENT_FEE_DETAIL;
      }

      // Calculate totals
      const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);
      const totalPaid = fees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
      const totalPending = totalFees - totalPaid;

      // Calculate overdue
      const today = new Date();
      const overdueFees = fees.filter(f =>
        f.status !== 'paid' &&
        f.status !== 'waived' &&
        new Date(f.due_date) < today
      );
      const totalOverdue = overdueFees.reduce((sum, f) =>
        sum + (Number(f.amount) - Number(f.paid_amount || 0)), 0
      );

      // Get last payment
      const paidFees = fees.filter(f => f.paid_date).sort((a, b) =>
        new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime()
      );
      const lastPayment = paidFees[0];

      // Map fee records
      const feeRecords: FeeRecord[] = fees.map(f => ({
        id: f.id,
        studentId: f.student_id,
        academicYear: f.academic_year,
        term: f.term,
        feeType: f.fee_type,
        feeTypeEn: f.fee_type_en,
        feeTypeHi: f.fee_type_hi,
        amount: Number(f.amount),
        dueDate: f.due_date,
        paidAmount: Number(f.paid_amount || 0),
        paidDate: f.paid_date,
        paymentMethod: f.payment_method,
        transactionId: f.transaction_id,
        status: f.status,
        remarks: f.remarks,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));

      // Build payment history from paid fees
      const paymentHistory: PaymentRecord[] = fees
        .filter(f => f.paid_date && f.paid_amount > 0)
        .map(f => ({
          id: `pay-${f.id}`,
          feeId: f.id,
          feeType: f.fee_type_en || f.fee_type,
          amount: Number(f.paid_amount),
          paymentDate: f.paid_date,
          paymentMethod: f.payment_method || 'Unknown',
          transactionId: f.transaction_id,
          receiptNumber: `RCP-${f.id.slice(0, 8).toUpperCase()}`,
          status: 'success' as const,
        }))
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

      return {
        studentId,
        studentName: studentProfile?.full_name || studentProfile?.display_name || 'Unknown Student',
        studentNameHi: studentProfile?.full_name_hi,
        studentEmail: studentProfile?.email,
        studentPhone: studentProfile?.phone,
        batch: studentProfile?.batch_name,
        program: studentProfile?.program,
        enrollmentDate: studentProfile?.enrollment_date,
        parentName: studentProfile?.parent_name,
        parentPhone: studentProfile?.parent_phone,
        totalFees,
        totalPaid,
        totalPending,
        totalOverdue,
        lastPaymentDate: lastPayment?.paid_date,
        lastPaymentAmount: lastPayment ? Number(lastPayment.paid_amount) : undefined,
        feeRecords,
        paymentHistory,
      };
    },
    enabled: !!customerId && !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
