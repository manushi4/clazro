/**
 * Financial Reports React Query Hooks - Phase 2
 * Production-grade hooks for financial data fetching
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  FinancialMetric,
  RevenueBreakdown,
  OutstandingDues,
  PaymentGateway,
  FinancialReportFilters,
  CurrencyType,
  financialQueryKeys,
  MetricType,
  getChangeType,
  calculateChangePercentage,
} from '../types/financialReports';

/**
 * Fetch financial metrics (revenue, subscriptions, expenses, profit)
 * Uses real Supabase RPC function: get_financial_metrics()
 */
export function useFinancialMetrics(filters: FinancialReportFilters) {
  return useQuery({
    queryKey: financialQueryKeys.metrics(filters),
    queryFn: async (): Promise<FinancialMetric[]> => {
      console.log('📊 [useFinancialMetrics] Fetching metrics:', filters);

      try {
        const { data, error } = await supabase.rpc('get_financial_metrics', {
          p_period_type: filters.period_type,
          p_currency: filters.currency,
          p_start_date: filters.start_date || null,
          p_end_date: filters.end_date || null,
        });

        if (error) {
          console.error('❌ [useFinancialMetrics] Error fetching metrics:', error);
          throw error;
        }

        console.log(`✅ [useFinancialMetrics] Fetched ${data?.length || 0} metrics`);
        return data || [];
      } catch (error) {
        console.error('❌ [useFinancialMetrics] Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data doesn't change frequently
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch revenue breakdown by branch/class
 * Uses real Supabase RPC function: get_revenue_breakdown()
 */
export function useRevenueBreakdown(filters: FinancialReportFilters) {
  return useQuery({
    queryKey: financialQueryKeys.revenue(filters),
    queryFn: async (): Promise<RevenueBreakdown[]> => {
      console.log('📊 [useRevenueBreakdown] Fetching revenue breakdown:', filters);

      try {
        const { data, error } = await supabase.rpc('get_revenue_breakdown', {
          p_period_type: filters.period_type,
          p_currency: filters.currency,
          p_branch_id: filters.branch_id || null,
        });

        if (error) {
          console.error('❌ [useRevenueBreakdown] Error fetching revenue:', error);
          throw error;
        }

        console.log(`✅ [useRevenueBreakdown] Fetched ${data?.length || 0} breakdown items`);
        return data || [];
      } catch (error) {
        console.error('❌ [useRevenueBreakdown] Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch outstanding dues summary
 * Uses real Supabase RPC function: get_outstanding_dues()
 */
export function useOutstandingDues(filters: FinancialReportFilters) {
  return useQuery({
    queryKey: financialQueryKeys.dues(filters),
    queryFn: async (): Promise<OutstandingDues> => {
      console.log('📊 [useOutstandingDues] Fetching outstanding dues:', filters);

      try {
        const { data, error } = await supabase.rpc('get_outstanding_dues', {
          p_currency: filters.currency,
        });

        if (error) {
          console.error('❌ [useOutstandingDues] Error fetching dues:', error);
          throw error;
        }

        // RPC returns array with single row, extract first element
        const duesData = data && data.length > 0 ? data[0] : null;

        if (!duesData) {
          console.log('⚠️ [useOutstandingDues] No dues data found');
          return {
            total_due: 0,
            overdue_count: 0,
            overdue_amount: 0,
            currency: filters.currency,
            by_class: [],
          };
        }

        console.log('✅ [useOutstandingDues] Fetched outstanding dues');
        return {
          total_due: duesData.total_due || 0,
          overdue_count: duesData.overdue_count || 0,
          overdue_amount: duesData.overdue_amount || 0,
          currency: duesData.currency || filters.currency,
          by_class: duesData.by_class || [],
        };
      } catch (error) {
        console.error('❌ [useOutstandingDues] Error:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dues data updates more frequently
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch payment gateway performance
 * NOTE: Returns aggregated data from payments table grouped by gateway
 * Consider creating payment_gateways table if gateway config needs to be stored
 */
export function usePaymentGateways(currency: CurrencyType) {
  return useQuery({
    queryKey: financialQueryKeys.gateways(currency),
    queryFn: async (): Promise<PaymentGateway[]> => {
      console.log('📊 [usePaymentGateways] Fetching payment gateways:', currency);

      try {
        // Aggregate payment data by gateway
        // NOTE: This assumes payments table has payment_gateway column
        // Adjust based on your actual schema
        const { data, error } = await supabase
          .from('payments')
          .select('payment_gateway, amount, status, gateway_fee')
          .eq('currency', currency)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (error) {
          console.error('❌ [usePaymentGateways] Error fetching gateways:', error);
          throw error;
        }

        // Aggregate by gateway
        const gatewayMap = new Map<string, {
          name: string;
          transactions_count: number;
          revenue: number;
          fees: number;
          success_count: number;
          total_count: number;
        }>();

        (data || []).forEach((payment: any) => {
          const gateway = payment.payment_gateway || 'Unknown';
          const existing = gatewayMap.get(gateway) || {
            name: gateway,
            transactions_count: 0,
            revenue: 0,
            fees: 0,
            success_count: 0,
            total_count: 0,
          };

          existing.total_count++;
          if (payment.status === 'completed') {
            existing.success_count++;
            existing.transactions_count++;
            existing.revenue += payment.amount || 0;
            existing.fees += payment.gateway_fee || 0;
          }

          gatewayMap.set(gateway, existing);
        });

        // Convert to array
        const gateways: PaymentGateway[] = Array.from(gatewayMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          status: data.transactions_count > 0 ? 'active' : 'inactive',
          transactions_count: data.transactions_count,
          revenue: data.revenue,
          fees: data.fees,
          currency,
          success_rate: data.total_count > 0 ? (data.success_count / data.total_count) * 100 : 0,
        }));

        // Sort by revenue
        gateways.sort((a, b) => b.revenue - a.revenue);

        console.log(`✅ [usePaymentGateways] Fetched ${gateways.length} gateways`);
        return gateways;
      } catch (error) {
        console.error('❌ [usePaymentGateways] Error:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - gateway data rarely changes
    refetchOnWindowFocus: false,
  });
}

/**
 * Helper: Get all financial data at once
 * Useful for exporting comprehensive reports
 */
export function useFinancialReportsAll(filters: FinancialReportFilters) {
  const metrics = useFinancialMetrics(filters);
  const revenue = useRevenueBreakdown(filters);
  const dues = useOutstandingDues(filters);
  const gateways = usePaymentGateways(filters.currency);

  return {
    metrics,
    revenue,
    dues,
    gateways,
    isLoading:
      metrics.isLoading || revenue.isLoading || dues.isLoading || gateways.isLoading,
    isError: metrics.isError || revenue.isError || dues.isError || gateways.isError,
    error: metrics.error || revenue.error || dues.error || gateways.error,
    refetchAll: () => {
      metrics.refetch();
      revenue.refetch();
      dues.refetch();
      gateways.refetch();
    },
  };
}
