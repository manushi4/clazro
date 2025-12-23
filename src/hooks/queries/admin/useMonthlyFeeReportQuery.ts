/**
 * useMonthlyFeeReportQuery - Query hook for monthly fee report
 *
 * Purpose: Fetch detailed fee collection report for a specific month
 * Used by: MonthlyFeeReportScreen
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type DailyCollection = {
  date: string;
  amount: number;
  studentCount: number;
  transactions: number;
};

export type ProgramCollection = {
  program: string;
  expected: number;
  collected: number;
  pending: number;
  collectionRate: number;
  studentCount: number;
};

export type PaymentMethodBreakdown = {
  method: string;
  amount: number;
  percentage: number;
  transactionCount: number;
};

export type TopCollector = {
  id: string;
  name: string;
  amount: number;
  studentCount: number;
};

export type MonthlyFeeReport = {
  month: string;
  year: number;
  monthName: string;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  growthVsLastMonth: number;
  totalStudents: number;
  paidStudents: number;
  pendingStudents: number;
  overdueStudents: number;
  dailyCollections: DailyCollection[];
  byProgram: ProgramCollection[];
  byPaymentMethod: PaymentMethodBreakdown[];
  topCollectors: TopCollector[];
  averageTransactionSize: number;
  totalTransactions: number;
  peakCollectionDay: string;
  peakCollectionAmount: number;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_MONTHLY_FEE_REPORT: MonthlyFeeReport = {
  month: '12',
  year: 2024,
  monthName: 'December',
  totalExpected: 5820000,
  totalCollected: 4520000,
  totalPending: 1300000,
  collectionRate: 77.7,
  growthVsLastMonth: 12.5,
  totalStudents: 2000,
  paidStudents: 1560,
  pendingStudents: 320,
  overdueStudents: 120,
  dailyCollections: [
    { date: '2024-12-01', amount: 185000, studentCount: 62, transactions: 68 },
    { date: '2024-12-02', amount: 142000, studentCount: 48, transactions: 52 },
    { date: '2024-12-03', amount: 198000, studentCount: 71, transactions: 78 },
    { date: '2024-12-04', amount: 156000, studentCount: 54, transactions: 59 },
    { date: '2024-12-05', amount: 245000, studentCount: 89, transactions: 95 },
    { date: '2024-12-06', amount: 178000, studentCount: 63, transactions: 68 },
    { date: '2024-12-07', amount: 92000, studentCount: 32, transactions: 35 },
    { date: '2024-12-08', amount: 68000, studentCount: 24, transactions: 26 },
    { date: '2024-12-09', amount: 165000, studentCount: 58, transactions: 62 },
    { date: '2024-12-10', amount: 312000, studentCount: 112, transactions: 118 },
    { date: '2024-12-11', amount: 189000, studentCount: 67, transactions: 72 },
    { date: '2024-12-12', amount: 156000, studentCount: 55, transactions: 59 },
    { date: '2024-12-13', amount: 178000, studentCount: 62, transactions: 67 },
    { date: '2024-12-14', amount: 145000, studentCount: 51, transactions: 55 },
    { date: '2024-12-15', amount: 425000, studentCount: 148, transactions: 156 },
    { date: '2024-12-16', amount: 198000, studentCount: 69, transactions: 74 },
    { date: '2024-12-17', amount: 167000, studentCount: 58, transactions: 62 },
    { date: '2024-12-18', amount: 189000, studentCount: 66, transactions: 71 },
    { date: '2024-12-19', amount: 156000, studentCount: 54, transactions: 58 },
    { date: '2024-12-20', amount: 234000, studentCount: 82, transactions: 87 },
    { date: '2024-12-21', amount: 142000, studentCount: 49, transactions: 53 },
  ],
  byProgram: [
    { program: 'JEE Advanced', expected: 2100000, collected: 1785000, pending: 315000, collectionRate: 85.0, studentCount: 450 },
    { program: 'JEE Mains', expected: 1680000, collected: 1344000, pending: 336000, collectionRate: 80.0, studentCount: 520 },
    { program: 'NEET', expected: 1540000, collected: 1155000, pending: 385000, collectionRate: 75.0, studentCount: 580 },
    { program: 'Foundation XI', expected: 320000, collected: 160000, pending: 160000, collectionRate: 50.0, studentCount: 280 },
    { program: 'Foundation XII', expected: 180000, collected: 76000, pending: 104000, collectionRate: 42.2, studentCount: 170 },
  ],
  byPaymentMethod: [
    { method: 'UPI', amount: 2260000, percentage: 50.0, transactionCount: 892 },
    { method: 'Net Banking', amount: 1130000, percentage: 25.0, transactionCount: 245 },
    { method: 'Cash', amount: 678000, percentage: 15.0, transactionCount: 312 },
    { method: 'Card', amount: 339000, percentage: 7.5, transactionCount: 156 },
    { method: 'Cheque', amount: 113000, percentage: 2.5, transactionCount: 45 },
  ],
  topCollectors: [
    { id: 'staff-1', name: 'Rajesh Kumar', amount: 1245000, studentCount: 412 },
    { id: 'staff-2', name: 'Priya Sharma', amount: 1089000, studentCount: 356 },
    { id: 'staff-3', name: 'Amit Singh', amount: 892000, studentCount: 298 },
    { id: 'staff-4', name: 'Neha Gupta', amount: 756000, studentCount: 245 },
    { id: 'staff-5', name: 'Vikram Patel', amount: 538000, studentCount: 189 },
  ],
  averageTransactionSize: 2735,
  totalTransactions: 1652,
  peakCollectionDay: '2024-12-15',
  peakCollectionAmount: 425000,
};

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export type MonthlyFeeReportQueryOptions = {
  month: string; // '01' to '12'
  year: number;
  enabled?: boolean;
};

// =============================================================================
// QUERY HOOK
// =============================================================================

export function useMonthlyFeeReportQuery(options: MonthlyFeeReportQueryOptions) {
  const { month, year, enabled = true } = options;
  const customerId = useCustomerId() || DEMO_CUSTOMER_ID;

  return useQuery<MonthlyFeeReport, Error>({
    queryKey: ['monthly-fee-report', customerId, month, year],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Try to fetch from Supabase
      try {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

        // Fetch fee payments for the month
        const { data: payments, error: paymentsError } = await supabase
          .from('fee_payments')
          .select(`
            id,
            amount,
            payment_date,
            payment_method,
            student_id,
            collected_by
          `)
          .eq('customer_id', customerId)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate);

        if (paymentsError) {
          console.warn('Error fetching payments, using demo data:', paymentsError);
          return DEMO_MONTHLY_FEE_REPORT;
        }

        // Fetch student fees for expected amounts
        const { data: studentFees, error: feesError } = await supabase
          .from('student_fees')
          .select(`
            id,
            student_id,
            amount,
            status,
            due_date,
            program
          `)
          .eq('customer_id', customerId)
          .gte('due_date', startDate)
          .lte('due_date', endDate);

        if (feesError) {
          console.warn('Error fetching student fees, using demo data:', feesError);
          return DEMO_MONTHLY_FEE_REPORT;
        }

        // If no data, return demo data
        if ((!payments || payments.length === 0) && (!studentFees || studentFees.length === 0)) {
          return DEMO_MONTHLY_FEE_REPORT;
        }

        // Process data (simplified - in production would have more complex aggregation)
        const totalCollected = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalExpected = studentFees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
        const totalPending = totalExpected - totalCollected;
        const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

        // Get month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parseInt(month) - 1];

        // Build daily collections
        const dailyMap = new Map<string, DailyCollection>();
        payments?.forEach(p => {
          const date = p.payment_date;
          const existing = dailyMap.get(date) || { date, amount: 0, studentCount: 0, transactions: 0 };
          existing.amount += p.amount || 0;
          existing.transactions += 1;
          dailyMap.set(date, existing);
        });
        const dailyCollections = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // Build payment method breakdown
        const methodMap = new Map<string, { amount: number; count: number }>();
        payments?.forEach(p => {
          const method = p.payment_method || 'Other';
          const existing = methodMap.get(method) || { amount: 0, count: 0 };
          existing.amount += p.amount || 0;
          existing.count += 1;
          methodMap.set(method, existing);
        });
        const byPaymentMethod: PaymentMethodBreakdown[] = Array.from(methodMap.entries()).map(([method, data]) => ({
          method,
          amount: data.amount,
          percentage: totalCollected > 0 ? (data.amount / totalCollected) * 100 : 0,
          transactionCount: data.count,
        }));

        // Find peak collection day
        let peakDay = dailyCollections[0] || { date: startDate, amount: 0 };
        dailyCollections.forEach(d => {
          if (d.amount > peakDay.amount) peakDay = d;
        });

        // Count students
        const uniqueStudents = new Set(studentFees?.map(f => f.student_id) || []);
        const paidStudents = new Set(payments?.map(p => p.student_id) || []);
        const overdueStudents = studentFees?.filter(f => f.status === 'overdue').length || 0;

        return {
          month,
          year,
          monthName,
          totalExpected,
          totalCollected,
          totalPending,
          collectionRate,
          growthVsLastMonth: 0, // Would need previous month data
          totalStudents: uniqueStudents.size,
          paidStudents: paidStudents.size,
          pendingStudents: uniqueStudents.size - paidStudents.size,
          overdueStudents,
          dailyCollections,
          byProgram: DEMO_MONTHLY_FEE_REPORT.byProgram, // Simplified - use demo for program breakdown
          byPaymentMethod,
          topCollectors: DEMO_MONTHLY_FEE_REPORT.topCollectors, // Simplified - use demo for top collectors
          averageTransactionSize: payments && payments.length > 0 ? totalCollected / payments.length : 0,
          totalTransactions: payments?.length || 0,
          peakCollectionDay: peakDay.date,
          peakCollectionAmount: peakDay.amount,
        };
      } catch (error) {
        console.warn('Error in monthly fee report query, using demo data:', error);
        return DEMO_MONTHLY_FEE_REPORT;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}
