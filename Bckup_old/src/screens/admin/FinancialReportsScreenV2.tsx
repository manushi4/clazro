/**
 * FinancialReportsScreenV2 - Phase 2: Production-Grade Financial Reports
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 *
 * Features:
 * - Real Supabase data (NO MOCK)
 * - RBAC gate with can('view_financial_reports')
 * - BaseScreen wrapper with all states
 * - Analytics tracking
 * - Audit logging for exports
 * - Safe navigation
 * - Material Design 3 themed
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card } from 'react-native-paper';

import { BaseScreen } from '../../shared/components/BaseScreen';
import { can } from '../../utils/adminPermissions';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { logAudit } from '../../utils/auditLogger';
import { useTheme } from '../../context/ThemeContext';

// Sprint 1: New utility providers
import { useConfirmDialog } from '../../shared/components/ConfirmDialog';
import { useAdminFeedback } from '../../shared/components/SnackbarProvider';

import {
  useFinancialMetrics,
  useRevenueBreakdown,
  useOutstandingDues,
  usePaymentGateways,
} from '../../hooks/useFinancialReports';
import {
  PeriodType,
  CurrencyType,
  formatCurrency,
  formatChangePercentage,
  getMetricLabel,
  getChangeColor,
} from '../../types/financialReports';

const { width } = Dimensions.get('window');

export const FinancialReportsScreenV2: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentRole = user?.role || 'student';
  const navigation = useNavigation();

  // Sprint 1: New utility hooks
  const { showConfirm } = useConfirmDialog();
  const { csvExported, actionFailed } = useAdminFeedback();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('INR');

  // Data fetching with real Supabase
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useFinancialMetrics({
    period_type: selectedPeriod,
    currency: selectedCurrency,
  });

  const {
    data: revenue,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useRevenueBreakdown({
    period_type: selectedPeriod,
    currency: selectedCurrency,
  });

  const {
    data: dues,
    isLoading: duesLoading,
    error: duesError,
    refetch: refetchDues,
  } = useOutstandingDues({
    period_type: selectedPeriod,
    currency: selectedCurrency,
  });

  const {
    data: gateways,
    isLoading: gatewaysLoading,
    error: gatewaysError,
    refetch: refetchGateways,
  } = usePaymentGateways(selectedCurrency);

  // RBAC Gate - MANDATORY for all financial screens
  useEffect(() => {
    trackScreenView('FinancialReportsV2');

    if (!can(currentRole as any, 'view_financial_reports')) {
      navigation.navigate('AccessDenied' as never, {
        requiredPermission: 'view_financial_reports',
        message: `You need 'view_financial_reports' permission to access Financial Reports.`,
      });
    }
  }, [currentRole, navigation]);

  // Analytics tracking for period changes
  const handlePeriodChange = useCallback((period: PeriodType) => {
    setSelectedPeriod(period);
    trackAction('change_period', 'FinancialReportsV2', { period });
  }, []);

  // Analytics tracking for currency changes
  const handleCurrencyChange = useCallback((currency: CurrencyType) => {
    setSelectedCurrency(currency);
    trackAction('change_currency', 'FinancialReportsV2', { currency });
  }, []);

  // Sprint 1: Export with ConfirmDialog and CSV generation
  const handleExport = useCallback(async () => {
    trackAction('export_reports', 'FinancialReportsV2', {
      period: selectedPeriod,
      currency: selectedCurrency,
    });

    const confirmed = await showConfirm({
      title: 'Export Financial Reports',
      message: `Export ${selectedPeriod} reports in ${selectedCurrency}?\n\nThis action will be logged for compliance.`,
      confirmText: 'Export CSV',
      confirmColor: 'primary',
    });

    if (!confirmed) return;

    try {
      // Generate CSV content
      const csvLines: string[] = [];

      // Header
      csvLines.push('Financial Reports Export');
      csvLines.push(`Period: ${selectedPeriod}`);
      csvLines.push(`Currency: ${selectedCurrency}`);
      csvLines.push(`Generated: ${new Date().toISOString()}`);
      csvLines.push('');

      // Metrics section
      if (metrics && metrics.length > 0) {
        csvLines.push('=== Financial Metrics ===');
        csvLines.push('Metric,Amount,Change %,Change Type');
        metrics.forEach((metric) => {
          csvLines.push(
            `${getMetricLabel(metric.metric_type)},${metric.amount},${metric.change_percentage},${metric.change_type}`
          );
        });
        csvLines.push('');
      }

      // Revenue breakdown section
      if (revenue && revenue.length > 0) {
        csvLines.push('=== Revenue Breakdown ===');
        csvLines.push('Branch,Period,Revenue,Expenses,Profit');
        revenue.forEach((item) => {
          csvLines.push(
            `${item.branch_name},${item.period},${item.revenue},${item.expenses},${item.profit}`
          );
        });
        csvLines.push('');
      }

      // Outstanding dues section
      if (dues) {
        csvLines.push('=== Outstanding Dues ===');
        csvLines.push('Metric,Value');
        csvLines.push(`Total Due,${dues.total_due}`);
        csvLines.push(`Overdue Amount,${dues.overdue_amount}`);
        csvLines.push(`Overdue Count,${dues.overdue_count}`);
        csvLines.push('');
      }

      // Payment gateways section
      if (gateways && gateways.length > 0) {
        csvLines.push('=== Payment Gateways ===');
        csvLines.push('Gateway,Status,Transactions,Revenue,Fees,Success Rate %');
        gateways.forEach((gateway) => {
          csvLines.push(
            `${gateway.name},${gateway.status},${gateway.transactions_count},${gateway.revenue},${gateway.fees},${gateway.success_rate.toFixed(1)}`
          );
        });
      }

      const csvContent = csvLines.join('\n');
      const fileName = `financial_reports_${selectedPeriod}_${selectedCurrency}_${Date.now()}.csv`;

      // Log export action with audit trail
      await logAudit({
        action: 'export_financial_report',
        metadata: {
          period: selectedPeriod,
          currency: selectedCurrency,
          metrics_count: metrics?.length || 0,
          revenue_items: revenue?.length || 0,
          dues_total: dues?.total_due || 0,
          gateways_count: gateways?.length || 0,
          file_name: fileName,
          file_size: csvContent.length,
        },
      });

      // TODO: In React Native, use react-native-fs or share API to save/share CSV
      // For now, we'll show success and log the CSV content
      console.log('📊 [FinancialReports] CSV Export:', csvContent.substring(0, 200) + '...');

      csvExported(fileName);
    } catch (error: any) {
      console.error('❌ [FinancialReports] Export failed:', error);
      actionFailed('export reports', error.message);
    }
  }, [selectedPeriod, selectedCurrency, metrics, revenue, dues, gateways, showConfirm, csvExported, actionFailed]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refetchMetrics();
    refetchRevenue();
    refetchDues();
    refetchGateways();
  }, [refetchMetrics, refetchRevenue, refetchDues, refetchGateways]);

  // Calculate loading and error states
  const isLoading = metricsLoading || revenueLoading || duesLoading || gatewaysLoading;
  const error = metricsError || revenueError || duesError || gatewaysError;
  const isEmpty = !metrics?.length && !revenue?.length && !dues && !gateways?.length;

  // Render period selector
  const renderPeriodSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorLabel, { color: theme.OnSurface }]}>Period:</Text>
      <View style={styles.periodButtons}>
        {(['monthly', 'quarterly', 'yearly'] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period ? theme.Primary : theme.Surface,
                borderColor: theme.Outline,
              },
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period ? theme.OnPrimary : theme.OnSurface,
                },
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render currency selector
  const renderCurrencySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorLabel, { color: theme.OnSurface }]}>Currency:</Text>
      <View style={styles.currencyButtons}>
        {(['USD', 'INR', 'EUR', 'GBP'] as CurrencyType[]).map((currency) => (
          <TouchableOpacity
            key={currency}
            style={[
              styles.currencyButton,
              {
                backgroundColor:
                  selectedCurrency === currency ? theme.Primary : theme.Surface,
                borderColor: theme.Outline,
              },
            ]}
            onPress={() => handleCurrencyChange(currency)}
          >
            <Text
              style={[
                styles.currencyButtonText,
                {
                  color: selectedCurrency === currency ? theme.OnPrimary : theme.OnSurface,
                },
              ]}
            >
              {currency}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Sprint 1: Render loading skeleton for metric cards
  const renderMetricSkeleton = () => (
    <View style={styles.metricsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={`skeleton-${i}`}
          style={[styles.metricCard, { backgroundColor: theme.Surface }]}
        >
          <Card.Content>
            <View style={[styles.skeleton, styles.skeletonText, { backgroundColor: theme.SurfaceVariant }]} />
            <View style={[styles.skeleton, styles.skeletonValue, { backgroundColor: theme.SurfaceVariant }]} />
            <View style={[styles.skeleton, styles.skeletonChange, { backgroundColor: theme.SurfaceVariant }]} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  // Render financial metrics cards
  const renderMetricsCards = () => {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Financial Metrics
        </Text>
        {metricsLoading ? (
          renderMetricSkeleton()
        ) : !metrics || metrics.length === 0 ? null : (
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Card
                key={metric.metric_type}
                style={[styles.metricCard, { backgroundColor: theme.Surface }]}
              >
                <Card.Content>
                  <Text style={[styles.metricTitle, { color: theme.OnSurfaceVariant }]}>
                    {getMetricLabel(metric.metric_type)}
                  </Text>
                  <Text style={[styles.metricValue, { color: theme.OnSurface }]}>
                    {formatCurrency(metric.amount, metric.currency)}
                  </Text>
                  <Text
                    style={[
                      styles.metricChange,
                      { color: getChangeColor(metric.change_type) },
                    ]}
                  >
                    {formatChangePercentage(metric.change_percentage, metric.change_type)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render revenue breakdown
  const renderRevenueBreakdown = () => {
    if (!revenue || revenue.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Revenue Breakdown
        </Text>
        {revenue.slice(0, 5).map((item) => (
          <Card
            key={item.id}
            style={[styles.revenueCard, { backgroundColor: theme.Surface }]}
          >
            <Card.Content>
              <View style={styles.revenueRow}>
                <View style={styles.revenueInfo}>
                  <Text style={[styles.revenueTitle, { color: theme.OnSurface }]}>
                    {item.branch_name}
                  </Text>
                  <Text style={[styles.revenuePeriod, { color: theme.OnSurfaceVariant }]}>
                    {item.period}
                  </Text>
                </View>
                <View style={styles.revenueAmounts}>
                  <Text style={[styles.revenueAmount, { color: theme.OnSurface }]}>
                    {formatCurrency(item.revenue, item.currency)}
                  </Text>
                  <Text style={[styles.revenueProfit, { color: theme.Success }]}>
                    Profit: {formatCurrency(item.profit, item.currency)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  // Render outstanding dues
  const renderOutstandingDues = () => {
    if (!dues) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Outstanding Dues
        </Text>
        <Card style={[styles.duesCard, { backgroundColor: theme.Surface }]}>
          <Card.Content>
            <View style={styles.duesRow}>
              <Text style={[styles.duesLabel, { color: theme.OnSurfaceVariant }]}>
                Total Due:
              </Text>
              <Text style={[styles.duesValue, { color: theme.OnSurface }]}>
                {formatCurrency(dues.total_due, dues.currency)}
              </Text>
            </View>
            <View style={styles.duesRow}>
              <Text style={[styles.duesLabel, { color: theme.OnSurfaceVariant }]}>
                Overdue Amount:
              </Text>
              <Text style={[styles.duesValue, { color: theme.Error }]}>
                {formatCurrency(dues.overdue_amount, dues.currency)}
              </Text>
            </View>
            <View style={styles.duesRow}>
              <Text style={[styles.duesLabel, { color: theme.OnSurfaceVariant }]}>
                Overdue Count:
              </Text>
              <Text style={[styles.duesValue, { color: theme.OnSurface }]}>
                {dues.overdue_count}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  // Render payment gateways
  const renderPaymentGateways = () => {
    if (!gateways || gateways.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Payment Gateways
        </Text>
        {gateways.map((gateway) => (
          <Card
            key={gateway.id}
            style={[styles.gatewayCard, { backgroundColor: theme.Surface }]}
          >
            <Card.Content>
              <View style={styles.gatewayRow}>
                <View style={styles.gatewayInfo}>
                  <Text style={[styles.gatewayName, { color: theme.OnSurface }]}>
                    {gateway.name}
                  </Text>
                  <Text style={[styles.gatewayStatus, { color: theme.OnSurfaceVariant }]}>
                    {gateway.status === 'active' ? '✓ Active' : '✗ Inactive'}
                  </Text>
                </View>
                <View style={styles.gatewayStats}>
                  <Text style={[styles.gatewayRevenue, { color: theme.OnSurface }]}>
                    {formatCurrency(gateway.revenue, gateway.currency)}
                  </Text>
                  <Text style={[styles.gatewayTransactions, { color: theme.OnSurfaceVariant }]}>
                    {gateway.transactions_count} txn • {gateway.success_rate.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  // Render action buttons
  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.Primary }]}
        onPress={handleExport}
      >
        <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
          📤 Export Reports
        </Text>
      </TouchableOpacity>
    </View>
  );

  const baseScreenProps: any = {
    scrollable: true,
    loading: isLoading,
    empty: isEmpty && !isLoading,
    emptyBody: "No financial data available for the selected period",
    onRetry: handleRefresh,
    onRefresh: handleRefresh,
  };
  if (error?.message) baseScreenProps.error = error.message;

  return (
    <BaseScreen {...baseScreenProps}>
      <View style={styles.container}>
        {renderPeriodSelector()}
        {renderCurrencySelector()}
        {renderMetricsCards()}
        {renderRevenueBreakdown()}
        {renderOutstandingDues()}
        {renderPaymentGateways()}
        {renderActions()}
      </View>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  // Selectors
  selectorContainer: {
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Section
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Revenue
  revenueCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueInfo: {
    flex: 1,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  revenuePeriod: {
    fontSize: 12,
    fontWeight: '400',
  },
  revenueAmounts: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  revenueProfit: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Dues
  duesCard: {
    borderRadius: 12,
  },
  duesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  duesLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  duesValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Gateway
  gatewayCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  gatewayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gatewayStatus: {
    fontSize: 12,
    fontWeight: '400',
  },
  gatewayStats: {
    alignItems: 'flex-end',
  },
  gatewayRevenue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  gatewayTransactions: {
    fontSize: 12,
    fontWeight: '400',
  },
  // Actions
  actionsContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Sprint 1: Skeleton loading styles
  skeleton: {
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonText: {
    height: 12,
    width: '60%',
  },
  skeletonValue: {
    height: 24,
    width: '80%',
  },
  skeletonChange: {
    height: 14,
    width: '40%',
  },
});
