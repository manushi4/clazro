/**
 * FinancialReportsScreen - Phase 40: Financial Administration
 * Comprehensive Financial Operations and Reporting
 * Multi-currency support, accounting integration, financial forecasting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface FinancialReportsScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

interface FinancialMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
}

interface RevenueData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface PaymentGateway {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  transactions: number;
  revenue: number;
  fees: number;
}

const FinancialReportsScreen: React.FC<FinancialReportsScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Mock financial data
  const financialMetrics: FinancialMetric[] = [
    {
      id: '1',
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5%',
      changeType: 'increase',
      icon: '💰',
    },
    {
      id: '2', 
      title: 'Monthly Subscriptions',
      value: '$89,250',
      change: '+8.3%',
      changeType: 'increase',
      icon: '🔄',
    },
    {
      id: '3',
      title: 'Operating Expenses',
      value: '$45,820',
      change: '-2.1%',
      changeType: 'decrease',
      icon: '📊',
    },
    {
      id: '4',
      title: 'Net Profit',
      value: '$79,610',
      change: '+15.7%',
      changeType: 'increase',
      icon: '📈',
    },
  ];

  const revenueData: RevenueData[] = [
    { period: 'Jan 2025', revenue: 98500, expenses: 42000, profit: 56500 },
    { period: 'Feb 2025', revenue: 105200, expenses: 44500, profit: 60700 },
    { period: 'Mar 2025', revenue: 125430, expenses: 45820, profit: 79610 },
  ];

  const paymentGateways: PaymentGateway[] = [
    {
      id: '1',
      name: 'Razorpay',
      status: 'active',
      transactions: 1250,
      revenue: 89420,
      fees: 2682,
    },
    {
      id: '2', 
      name: 'Stripe',
      status: 'active',
      transactions: 890,
      revenue: 36010,
      fees: 1080,
    },
    {
      id: '3',
      name: 'PayPal',
      status: 'inactive',
      transactions: 0,
      revenue: 0,
      fees: 0,
    },
  ];

  const currencies = ['USD', 'INR', 'EUR', 'GBP'];

  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('back')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Financial Reports</Text>
          <Text style={styles.headerSubtitle}>Comprehensive Financial Analysis</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderPeriodSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Report Period</Text>
      <View style={styles.periodSelector}>
        {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrencySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Currency</Text>
      <View style={styles.currencySelector}>
        {currencies.map((currency) => (
          <TouchableOpacity
            key={currency}
            style={[
              styles.currencyButton,
              selectedCurrency === currency && styles.currencyButtonActive
            ]}
            onPress={() => setSelectedCurrency(currency)}
          >
            <Text style={[
              styles.currencyButtonText,
              selectedCurrency === currency && styles.currencyButtonTextActive
            ]}>
              {currency}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFinancialMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Key Financial Metrics</Text>
      <View style={styles.metricsGrid}>
        {financialMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            <View style={styles.metricChangeContainer}>
              <Text style={[
                styles.metricChange,
                metric.changeType === 'increase' ? styles.metricIncrease :
                metric.changeType === 'decrease' ? styles.metricDecrease :
                styles.metricNeutral
              ]}>
                {metric.change}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRevenueChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Revenue Trend</Text>
      <View style={styles.chartContent}>
        {revenueData.map((data, index) => (
          <View key={index} style={styles.chartBar}>
            <Text style={styles.chartPeriod}>{data.period}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.revenueBar, { height: (data.revenue / 150000) * 100 }]} />
              <View style={[styles.expenseBar, { height: (data.expenses / 150000) * 100 }]} />
              <View style={[styles.profitBar, { height: (data.profit / 150000) * 100 }]} />
            </View>
            <Text style={styles.chartValue}>${(data.profit / 1000).toFixed(0)}k</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: LightTheme.Primary }]} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.legendText}>Profit</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentGateways = () => (
    <View style={styles.gatewayContainer}>
      <Text style={styles.sectionTitle}>Payment Gateway Performance</Text>
      {paymentGateways.map((gateway) => (
        <View key={gateway.id} style={styles.gatewayCard}>
          <View style={styles.gatewayHeader}>
            <Text style={styles.gatewayName}>{gateway.name}</Text>
            <View style={[
              styles.gatewayStatus,
              gateway.status === 'active' ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                gateway.status === 'active' ? styles.statusActiveText : styles.statusInactiveText
              ]}>
                {gateway.status}
              </Text>
            </View>
          </View>
          <View style={styles.gatewayMetrics}>
            <View style={styles.gatewayMetric}>
              <Text style={styles.metricLabel}>Transactions</Text>
              <Text style={styles.metricNumber}>{gateway.transactions.toLocaleString()}</Text>
            </View>
            <View style={styles.gatewayMetric}>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricNumber}>${gateway.revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.gatewayMetric}>
              <Text style={styles.metricLabel}>Fees</Text>
              <Text style={styles.metricNumber}>${gateway.fees.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onNavigate('payment-settings')}
      >
        <Text style={styles.actionIcon}>⚙️</Text>
        <Text style={styles.actionText}>Payment Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onNavigate('export-reports')}
      >
        <Text style={styles.actionIcon}>📊</Text>
        <Text style={styles.actionText}>Export Reports</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderPeriodSelector()}
        {renderCurrencySelector()}
        {renderFinancialMetrics()}
        {renderRevenueChart()}
        {renderPaymentGateways()}
        {renderActionButtons()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    backgroundColor: LightTheme.Primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.LG,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  backButtonText: {
    fontSize: 24,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnPrimary,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  selectorContainer: {
    backgroundColor: LightTheme.Surface,
    margin: Spacing.MD,
    padding: Spacing.LG,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectorLabel: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: LightTheme.Primary,
  },
  periodButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  currencySelector: {
    flexDirection: 'row',
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: 4,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
    borderRadius: 8,
  },
  currencyButtonActive: {
    backgroundColor: LightTheme.Primary,
  },
  currencyButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  currencyButtonTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  metricsContainer: {
    margin: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.XS,
  },
  metricCard: {
    width: (width - Spacing.MD * 2 - Spacing.XS * 2) / 2,
    backgroundColor: LightTheme.Surface,
    margin: Spacing.XS,
    padding: Spacing.LG,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  metricValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  metricTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  metricChangeContainer: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  metricChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
  },
  metricIncrease: {
    color: '#4CAF50',
  },
  metricDecrease: {
    color: '#F44336',
  },
  metricNeutral: {
    color: LightTheme.OnSurfaceVariant,
  },
  chartContainer: {
    backgroundColor: LightTheme.Surface,
    margin: Spacing.MD,
    padding: Spacing.LG,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: Spacing.LG,
  },
  chartBar: {
    alignItems: 'center',
  },
  chartPeriod: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 60,
    justifyContent: 'space-between',
  },
  revenueBar: {
    width: 16,
    backgroundColor: LightTheme.Primary,
    borderRadius: 8,
  },
  expenseBar: {
    width: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  profitBar: {
    width: 16,
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
  },
  chartValue: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurface,
    marginTop: Spacing.SM,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.SM,
    marginVertical: Spacing.XS,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.XS,
  },
  legendText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  gatewayContainer: {
    margin: Spacing.MD,
  },
  gatewayCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gatewayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  gatewayName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  gatewayStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E8',
  },
  statusInactive: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusActiveText: {
    color: '#4CAF50',
  },
  statusInactiveText: {
    color: '#FF9800',
  },
  gatewayMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gatewayMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  metricNumber: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  actionContainer: {
    flexDirection: 'row',
    margin: Spacing.MD,
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.LG,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: Spacing.XS,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  actionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
});

export default FinancialReportsScreen;