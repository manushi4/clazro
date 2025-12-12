/**
 * Financial Metrics Data Contract - Sprint 3
 *
 * Purpose: Lock query interface for financial reports and analytics
 * - Revenue trends
 * - Branch breakdown
 * - Dues aging
 * - Payment status tracking
 */

import { z } from 'zod';

/**
 * Payment Status Types
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

/**
 * Payment Method Types
 */
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

/**
 * Revenue Trend Data Point
 */
export interface RevenueTrendPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  payment_count: number;
  avg_payment: number;
}

/**
 * Revenue Trend Response
 */
export interface RevenueTrendResponse {
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  data_points: RevenueTrendPoint[];
  total_revenue: number;
  total_payments: number;
  avg_revenue_per_day: number;
}

/**
 * Branch Revenue Breakdown
 */
export interface BranchRevenueItem {
  branch_id: string;
  branch_name: string;
  revenue: number;
  payment_count: number;
  percentage_of_total: number;
  target_revenue: number | null;
  variance: number | null; // revenue - target
}

/**
 * Dues Aging Bucket
 */
export interface DuesAgingBucket {
  age_range: string; // e.g., "0-30 days", "31-60 days"
  count: number;
  total_amount: number;
  percentage_of_total: number;
}

/**
 * Dues Aging Report
 */
export interface DuesAgingReport {
  as_of_date: string;
  buckets: DuesAgingBucket[];
  total_outstanding: number;
  total_count: number;
  oldest_due_date: string | null;
}

/**
 * Payment Status Summary
 */
export interface PaymentStatusSummary {
  status: PaymentStatus;
  count: number;
  total_amount: number;
  percentage_of_total: number;
}

/**
 * Payment List Item
 */
export interface PaymentListItem {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_date: string;
  created_at: string;
  branch_id: string | null;
  branch_name: string | null;
  reference_number: string | null;
}

/**
 * Payment List Filters
 */
export interface PaymentListFilters {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  branch_id?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  min_amount?: number;
  max_amount?: number;
  search?: string; // student name or reference number
  limit: number;
  cursor?: string; // payment_date for keyset
  cursor_id?: string; // id for keyset
}

/**
 * Payment List Response
 */
export interface PaymentListResponse {
  payments: PaymentListItem[];
  nextCursor: {
    cursor: string;
    cursor_id: string;
  } | null;
  hasMore: boolean;
  totalCount?: number;
  totalAmount?: number;
}

/**
 * Financial Dashboard Summary
 */
export interface FinancialDashboardSummary {
  mtd_revenue: number;
  mtd_revenue_growth: number; // percentage vs last month
  ytd_revenue: number;
  outstanding_dues: number;
  payment_success_rate: number; // percentage
  avg_transaction_value: number;
  total_refunds_mtd: number;
}

/**
 * Revenue vs Target
 */
export interface RevenueVsTarget {
  period: 'monthly' | 'quarterly' | 'yearly';
  period_label: string; // e.g., "Jan 2025", "Q1 2025"
  actual_revenue: number;
  target_revenue: number;
  variance: number;
  variance_percentage: number;
  on_track: boolean;
}

/**
 * Dunning Configuration (for overdue payments)
 */
export interface DunningLadder {
  id: string;
  days_overdue: number;
  action: 'email' | 'sms' | 'whatsapp' | 'phone_call';
  template_id: string;
  is_active: boolean;
  escalate_to_next_ladder: boolean;
}

/**
 * Zod Schemas
 */

export const PaymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled',
]);

export const PaymentMethodSchema = z.enum([
  'cash',
  'card',
  'upi',
  'bank_transfer',
  'cheque',
  'other',
]);

export const PaymentListFiltersSchema = z.object({
  status: PaymentStatusSchema.optional(),
  payment_method: PaymentMethodSchema.optional(),
  branch_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100),
  cursor: z.string().optional(),
  cursor_id: z.string().uuid().optional(),
});

export const RevenueTrendPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revenue: z.number().min(0),
  payment_count: z.number().int().min(0),
  avg_payment: z.number().min(0),
});

/**
 * Query Keys
 */
export const financialQueryKeys = {
  all: ['financial'] as const,
  dashboard: () => [...financialQueryKeys.all, 'dashboard'] as const,
  revenueTrend: (period: 'daily' | 'weekly' | 'monthly', days: number) =>
    [...financialQueryKeys.all, 'revenue_trend', period, days] as const,
  branchRevenue: (start_date: string, end_date: string) =>
    [...financialQueryKeys.all, 'branch_revenue', start_date, end_date] as const,
  duesAging: () => [...financialQueryKeys.all, 'dues_aging'] as const,
  paymentList: (filters: PaymentListFilters) =>
    [...financialQueryKeys.all, 'payment_list', filters] as const,
  revenueVsTarget: (period: 'monthly' | 'quarterly' | 'yearly') =>
    [...financialQueryKeys.all, 'revenue_vs_target', period] as const,
} as const;

/**
 * Stale Time Configuration
 */
export const financialStaleTime = {
  dashboard: 60 * 1000, // 1 minute
  revenueTrend: 5 * 60 * 1000, // 5 minutes (historical data)
  branchRevenue: 5 * 60 * 1000, // 5 minutes
  duesAging: 10 * 60 * 1000, // 10 minutes (slow-changing data)
  paymentList: 30 * 1000, // 30 seconds
  revenueVsTarget: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Placeholder data
 */
export const financialDashboardPlaceholder: FinancialDashboardSummary = {
  mtd_revenue: 0,
  mtd_revenue_growth: 0,
  ytd_revenue: 0,
  outstanding_dues: 0,
  payment_success_rate: 0,
  avg_transaction_value: 0,
  total_refunds_mtd: 0,
};

export const revenueTrendPlaceholder: RevenueTrendResponse = {
  period: 'daily',
  start_date: new Date().toISOString().split('T')[0]!,
  end_date: new Date().toISOString().split('T')[0]!,
  data_points: [],
  total_revenue: 0,
  total_payments: 0,
  avg_revenue_per_day: 0,
};

export const paymentListPlaceholder: PaymentListResponse = {
  payments: [],
  nextCursor: null,
  hasMore: false,
};

/**
 * Export Budget Configuration (from Sprint 0 performance budgets)
 */
export const FINANCIAL_EXPORT_BUDGETS = {
  small: 5000, // < 1k rows - 5 seconds
  medium: 30000, // < 10k rows - 30 seconds
  large: 180000, // < 100k rows - 3 minutes
} as const;
