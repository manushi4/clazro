/**
 * Financial Reports Data Contracts - Phase 2
 * Production-grade types and Zod schemas for financial reporting
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { z } from 'zod';

/**
 * Period Types for Reports
 */
export type PeriodType = 'monthly' | 'quarterly' | 'yearly';

/**
 * Currency Types
 */
export type CurrencyType = 'USD' | 'INR' | 'EUR' | 'GBP';

/**
 * Metric Types
 */
export type MetricType = 'revenue' | 'subscriptions' | 'expenses' | 'profit';

/**
 * Change Direction for Metrics
 */
export type ChangeType = 'increase' | 'decrease' | 'neutral';

/**
 * Financial Metric Interface
 */
export interface FinancialMetric {
  metric_type: MetricType;
  amount: number;
  currency: CurrencyType;
  change_percentage: number;
  change_type: ChangeType;
  period_start: string; // ISO date
  period_end: string; // ISO date
}

/**
 * Revenue Breakdown by Branch/Class
 */
export interface RevenueBreakdown {
  id: string;
  branch_id?: string;
  branch_name: string;
  class_id?: string;
  class_name?: string;
  revenue: number;
  expenses: number;
  profit: number;
  period: string;
  currency: CurrencyType;
}

/**
 * Outstanding Dues Summary
 */
export interface OutstandingDues {
  total_due: number;
  overdue_count: number;
  overdue_amount: number;
  currency: CurrencyType;
  by_class: Array<{
    class_id: string;
    class_name: string;
    amount: number;
    student_count: number;
  }>;
}

/**
 * Payment Gateway Performance
 */
export interface PaymentGateway {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  transactions_count: number;
  revenue: number;
  fees: number;
  currency: CurrencyType;
  success_rate: number; // Percentage
}

/**
 * Financial Report Filters
 */
export interface FinancialReportFilters {
  period_type: PeriodType;
  currency: CurrencyType;
  branch_id?: string;
  class_id?: string;
  start_date?: string; // ISO date
  end_date?: string; // ISO date
}

/**
 * Export Options
 */
export interface ExportOptions {
  format: 'csv' | 'pdf';
  period_type: PeriodType;
  currency: CurrencyType;
  include_charts: boolean;
  include_breakdown: boolean;
}

/**
 * Zod Schemas for Validation
 */

export const PeriodTypeSchema = z.enum(['monthly', 'quarterly', 'yearly']);

export const CurrencyTypeSchema = z.enum(['USD', 'INR', 'EUR', 'GBP']);

export const MetricTypeSchema = z.enum(['revenue', 'subscriptions', 'expenses', 'profit']);

export const ChangeTypeSchema = z.enum(['increase', 'decrease', 'neutral']);

export const FinancialMetricSchema = z.object({
  metric_type: MetricTypeSchema,
  amount: z.number(),
  currency: CurrencyTypeSchema,
  change_percentage: z.number(),
  change_type: ChangeTypeSchema,
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
});

export const RevenueBreakdownSchema = z.object({
  id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  branch_name: z.string(),
  class_id: z.string().uuid().optional(),
  class_name: z.string().optional(),
  revenue: z.number(),
  expenses: z.number(),
  profit: z.number(),
  period: z.string(),
  currency: CurrencyTypeSchema,
});

export const OutstandingDuesSchema = z.object({
  total_due: z.number(),
  overdue_count: z.number().int(),
  overdue_amount: z.number(),
  currency: CurrencyTypeSchema,
  by_class: z.array(
    z.object({
      class_id: z.string().uuid(),
      class_name: z.string(),
      amount: z.number(),
      student_count: z.number().int(),
    })
  ),
});

export const PaymentGatewaySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  transactions_count: z.number().int(),
  revenue: z.number(),
  fees: z.number(),
  currency: CurrencyTypeSchema,
  success_rate: z.number().min(0).max(100),
});

export const FinancialReportFiltersSchema = z.object({
  period_type: PeriodTypeSchema,
  currency: CurrencyTypeSchema,
  branch_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const ExportOptionsSchema = z.object({
  format: z.enum(['csv', 'pdf']),
  period_type: PeriodTypeSchema,
  currency: CurrencyTypeSchema,
  include_charts: z.boolean(),
  include_breakdown: z.boolean(),
});

/**
 * Query Keys (for React Query)
 */
export const financialQueryKeys = {
  all: ['financial_reports'] as const,
  metrics: (filters: FinancialReportFilters) =>
    [...financialQueryKeys.all, 'metrics', filters] as const,
  revenue: (filters: FinancialReportFilters) =>
    [...financialQueryKeys.all, 'revenue', filters] as const,
  dues: (filters: FinancialReportFilters) =>
    [...financialQueryKeys.all, 'dues', filters] as const,
  gateways: (currency: CurrencyType) =>
    [...financialQueryKeys.all, 'gateways', currency] as const,
};

/**
 * Helper Functions
 */

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: CurrencyType): string {
  const symbols: Record<CurrencyType, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbols[currency]}${formatted}`;
}

/**
 * Format change percentage
 */
export function formatChangePercentage(percentage: number, changeType: ChangeType): string {
  const sign = changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : '';
  return `${sign}${Math.abs(percentage).toFixed(1)}%`;
}

/**
 * Get change type from two values
 */
export function getChangeType(current: number, previous: number): ChangeType {
  if (current > previous) return 'increase';
  if (current < previous) return 'decrease';
  return 'neutral';
}

/**
 * Calculate change percentage
 */
export function calculateChangePercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get period label
 */
export function getPeriodLabel(periodType: PeriodType): string {
  const labels: Record<PeriodType, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return labels[periodType];
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  const symbols: Record<CurrencyType, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency];
}

/**
 * Get metric icon
 */
export function getMetricIcon(metricType: MetricType): string {
  const icons: Record<MetricType, string> = {
    revenue: '💰',
    subscriptions: '🔄',
    expenses: '📊',
    profit: '📈',
  };
  return icons[metricType];
}

/**
 * Get metric label
 */
export function getMetricLabel(metricType: MetricType): string {
  const labels: Record<MetricType, string> = {
    revenue: 'Total Revenue',
    subscriptions: 'Monthly Subscriptions',
    expenses: 'Operating Expenses',
    profit: 'Net Profit',
  };
  return labels[metricType];
}

/**
 * Get change color
 */
export function getChangeColor(changeType: ChangeType): string {
  const colors: Record<ChangeType, string> = {
    increase: '#4CAF50', // Green
    decrease: '#F44336', // Red
    neutral: '#9E9E9E', // Gray
  };
  return colors[changeType];
}
