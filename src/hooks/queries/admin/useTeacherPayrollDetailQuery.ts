/**
 * useTeacherPayrollDetailQuery - Query hook for teacher payroll detail
 *
 * Purpose: Fetch detailed payroll information for a specific teacher
 * Used by: TeacherPayrollDetailScreen
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type PayrollBreakdown = {
  baseSalary: number;
  allowances: {
    hra: number;
    da: number;
    ta: number;
    medical: number;
    special: number;
    other: number;
  };
  deductions: {
    pf: number;
    tax: number;
    insurance: number;
    loan: number;
    other: number;
  };
  bonuses: {
    performance: number;
    festival: number;
    other: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
};

export type PaymentHistory = {
  id: string;
  month: string;
  monthName: string;
  year: number;
  netSalary: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed';
};

export type TeacherPayrollDetail = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  department: string;
  designation: string;
  joiningDate: string;
  employeeId: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  panNumber: string;
  month: string;
  monthName: string;
  year: number;
  breakdown: PayrollBreakdown;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  remarks: string | null;
  paymentHistory: PaymentHistory[];
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_TEACHER_PAYROLL_DETAIL: TeacherPayrollDetail = {
  teacherId: 'teacher-001',
  teacherName: 'Dr. Rajesh Kumar',
  teacherEmail: 'rajesh.kumar@allen.ac.in',
  teacherPhone: '+91 98765 43210',
  department: 'Physics',
  designation: 'Senior Faculty',
  joiningDate: '2018-06-15',
  employeeId: 'EMP-2018-0042',
  bankName: 'State Bank of India',
  bankAccount: 'XXXX XXXX 4521',
  ifscCode: 'SBIN0001234',
  panNumber: 'ABCDE1234F',
  month: '12',
  monthName: 'December',
  year: 2024,
  breakdown: {
    baseSalary: 85000,
    allowances: {
      hra: 25500,
      da: 8500,
      ta: 5000,
      medical: 3000,
      special: 10000,
      other: 2000,
    },
    deductions: {
      pf: 10200,
      tax: 12500,
      insurance: 2000,
      loan: 5000,
      other: 500,
    },
    bonuses: {
      performance: 15000,
      festival: 0,
      other: 0,
    },
    grossSalary: 154000,
    totalDeductions: 30200,
    netSalary: 123800,
  },
  status: 'paid',
  paymentDate: '2024-12-01',
  paymentMethod: 'Bank Transfer',
  transactionId: 'TXN-2024-12-00042',
  remarks: 'December 2024 salary processed',
  paymentHistory: [
    {
      id: 'pay-001',
      month: '12',
      monthName: 'December',
      year: 2024,
      netSalary: 123800,
      paymentDate: '2024-12-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-12-00042',
      status: 'paid',
    },
    {
      id: 'pay-002',
      month: '11',
      monthName: 'November',
      year: 2024,
      netSalary: 108800,
      paymentDate: '2024-11-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-11-00042',
      status: 'paid',
    },
    {
      id: 'pay-003',
      month: '10',
      monthName: 'October',
      year: 2024,
      netSalary: 108800,
      paymentDate: '2024-10-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-10-00042',
      status: 'paid',
    },
    {
      id: 'pay-004',
      month: '09',
      monthName: 'September',
      year: 2024,
      netSalary: 108800,
      paymentDate: '2024-09-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-09-00042',
      status: 'paid',
    },
    {
      id: 'pay-005',
      month: '08',
      monthName: 'August',
      year: 2024,
      netSalary: 108800,
      paymentDate: '2024-08-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-08-00042',
      status: 'paid',
    },
    {
      id: 'pay-006',
      month: '07',
      monthName: 'July',
      year: 2024,
      netSalary: 108800,
      paymentDate: '2024-07-01',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-2024-07-00042',
      status: 'paid',
    },
  ],
};

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export type TeacherPayrollDetailQueryOptions = {
  teacherId: string;
  month?: string; // 'YYYY-MM' format, defaults to current month
  enabled?: boolean;
};

// =============================================================================
// QUERY HOOK
// =============================================================================

export function useTeacherPayrollDetailQuery(options: TeacherPayrollDetailQueryOptions) {
  const { teacherId, month, enabled = true } = options;
  const customerId = useCustomerId() || DEMO_CUSTOMER_ID;

  // Get current month if not provided
  const currentDate = new Date();
  const targetMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  return useQuery<TeacherPayrollDetail, Error>({
    queryKey: ['teacher-payroll-detail', customerId, teacherId, targetMonth],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      try {
        // Fetch teacher profile
        const { data: teacher, error: teacherError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            department,
            designation,
            joining_date,
            employee_id,
            bank_name,
            bank_account,
            ifsc_code,
            pan_number
          `)
          .eq('id', teacherId)
          .eq('customer_id', customerId)
          .single();

        if (teacherError || !teacher) {
          console.warn('Error fetching teacher, using demo data:', teacherError);
          return DEMO_TEACHER_PAYROLL_DETAIL;
        }

        // Fetch payroll for the month
        const { data: payroll, error: payrollError } = await supabase
          .from('teacher_payroll')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('customer_id', customerId)
          .eq('month', targetMonth)
          .single();

        if (payrollError) {
          console.warn('Error fetching payroll, using demo data:', payrollError);
          return DEMO_TEACHER_PAYROLL_DETAIL;
        }

        // Fetch payment history (last 6 months)
        const { data: history, error: historyError } = await supabase
          .from('teacher_payroll')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('customer_id', customerId)
          .order('month', { ascending: false })
          .limit(6);

        if (historyError) {
          console.warn('Error fetching history:', historyError);
        }

        // Parse month
        const [year, monthNum] = targetMonth.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parseInt(monthNum) - 1];

        // Build breakdown (simplified - in production would have detailed columns)
        const baseSalary = payroll?.base_salary || 0;
        const allowances = payroll?.allowances || 0;
        const deductions = payroll?.deductions || 0;
        const bonuses = payroll?.bonuses || 0;
        const netSalary = payroll?.net_salary || 0;

        const breakdown: PayrollBreakdown = {
          baseSalary,
          allowances: {
            hra: allowances * 0.4,
            da: allowances * 0.15,
            ta: allowances * 0.1,
            medical: allowances * 0.1,
            special: allowances * 0.2,
            other: allowances * 0.05,
          },
          deductions: {
            pf: deductions * 0.35,
            tax: deductions * 0.4,
            insurance: deductions * 0.1,
            loan: deductions * 0.1,
            other: deductions * 0.05,
          },
          bonuses: {
            performance: bonuses * 0.7,
            festival: bonuses * 0.2,
            other: bonuses * 0.1,
          },
          grossSalary: baseSalary + allowances + bonuses,
          totalDeductions: deductions,
          netSalary,
        };

        // Build payment history
        const paymentHistory: PaymentHistory[] = (history || []).map((h: any) => {
          const [hYear, hMonth] = h.month.split('-');
          return {
            id: h.id,
            month: hMonth,
            monthName: monthNames[parseInt(hMonth) - 1],
            year: parseInt(hYear),
            netSalary: h.net_salary,
            paymentDate: h.payment_date,
            paymentMethod: h.payment_method,
            transactionId: h.transaction_id,
            status: h.status,
          };
        });

        return {
          teacherId: teacher.id,
          teacherName: teacher.full_name || 'Unknown',
          teacherEmail: teacher.email || '',
          teacherPhone: teacher.phone || '',
          department: teacher.department || 'General',
          designation: teacher.designation || 'Faculty',
          joiningDate: teacher.joining_date || '',
          employeeId: teacher.employee_id || '',
          bankName: teacher.bank_name || '',
          bankAccount: teacher.bank_account || '',
          ifscCode: teacher.ifsc_code || '',
          panNumber: teacher.pan_number || '',
          month: monthNum,
          monthName,
          year: parseInt(year),
          breakdown,
          status: payroll?.status || 'pending',
          paymentDate: payroll?.payment_date,
          paymentMethod: payroll?.payment_method,
          transactionId: payroll?.transaction_id,
          remarks: payroll?.remarks,
          paymentHistory,
        };
      } catch (error) {
        console.warn('Error in teacher payroll detail query, using demo data:', error);
        return DEMO_TEACHER_PAYROLL_DETAIL;
      }
    },
    enabled: enabled && !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}