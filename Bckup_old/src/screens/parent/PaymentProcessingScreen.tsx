import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';
import { usePaymentHistory, useFinancialSummary as useParentFinancialSummary } from '../../hooks/api/useParentAPI';

interface PaymentGateway {
  id: string;
  name: string;
  logo: string;
  processingFee: number;
  isAvailable: boolean;
  methods: string[];
  description: string;
}

interface PendingFee {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: 'tuition' | 'lab' | 'library' | 'transport' | 'other';
  isOverdue: boolean;
  lateFee?: number;
}

interface PaymentHistory {
  id: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  status: 'success' | 'pending' | 'failed';
  receiptUrl?: string;
  transactionId: string;
}

interface InstallmentPlan {
  id: string;
  totalAmount: number;
  installments: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  processingFee: number;
  isActive: boolean;
}

interface FinancialAnalytics {
  totalPaid: number;
  totalPending: number;
  monthlySpending: number;
  averageMonthly: number;
  compareWithPreviousYear: number;
  taxSavings: number;
}

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'PaymentProcessing'>;

export const PaymentProcessingScreen: React.FC<Props> = ({ navigation, route }) => {
  // Use hardcoded parentId for now (in production, get from auth context)
  const parentId = 'parent-001';
  const [activeTab, setActiveTab] = useState<'payment' | 'history' | 'plans' | 'analytics'>('payment');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [selectedGateway, setSelectedGateway] = useState<string>('razorpay');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Real data hooks - Phase 1 implementation
  const {
    data: paymentHistoryData = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = usePaymentHistory(parentId);

  const {
    data: financialSummaryData = null,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useParentFinancialSummary(parentId);

  const isLoading = historyLoading || summaryLoading;

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return backHandler;
  }, [navigation]);

  // Handle errors
  useEffect(() => {
    if (historyError) {
      showSnackbar('Failed to load payment history');
    }
    if (summaryError) {
      showSnackbar('Failed to load financial summary');
    }
  }, [historyError, summaryError, showSnackbar]);

  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Transform payment history from Supabase
  const paymentHistory: PaymentHistory[] = React.useMemo(() => {
    if (!paymentHistoryData) return [];

    return paymentHistoryData.map((payment: any) => ({
      id: payment.id,
      description: payment.notes || `Payment ${payment.transaction_id}`,
      amount: parseFloat(payment.amount),
      date: payment.payment_date,
      method: payment.payment_method || 'Unknown',
      status: payment.status as 'success' | 'pending' | 'failed',
      receiptUrl: payment.receipt_url || undefined,
      transactionId: payment.transaction_id || payment.gateway_payment_id || 'N/A',
    }));
  }, [paymentHistoryData]);

  // Transform financial analytics from Supabase summary view
  const analytics: FinancialAnalytics = React.useMemo(() => {
    if (!financialSummaryData) {
      return {
        totalPaid: 0,
        totalPending: 0,
        monthlySpending: 0,
        averageMonthly: 0,
        compareWithPreviousYear: 0,
        taxSavings: 0,
      };
    }

    const totalPaid = parseFloat(financialSummaryData.total_paid || '0');
    const totalPending = parseFloat(financialSummaryData.total_pending || '0');

    return {
      totalPaid,
      totalPending,
      monthlySpending: totalPaid / 12, // Approximate
      averageMonthly: totalPaid / 12,
      compareWithPreviousYear: 0, // Not available in Phase 1
      taxSavings: totalPaid * 0.08, // Approximate 8% tax savings
    };
  }, [financialSummaryData]);

  // Keep mock data for reference
  const mockPaymentGateways: PaymentGateway[] = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      logo: '💳',
      processingFee: 2.4,
      isAvailable: true,
      methods: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'],
      description: 'Most popular payment gateway in India with instant processing',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      logo: '💸',
      processingFee: 2.9,
      isAvailable: true,
      methods: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
      description: 'International payment processing with advanced security',
    },
    {
      id: 'paytm',
      name: 'Paytm',
      logo: '📱',
      processingFee: 2.0,
      isAvailable: true,
      methods: ['UPI', 'Wallet', 'Net Banking', 'Card'],
      description: 'Digital wallet integration with cashback offers',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      logo: '📲',
      processingFee: 1.8,
      isAvailable: true,
      methods: ['UPI', 'Wallet', 'Card'],
      description: 'UPI-focused payments with instant settlements',
    },
  ];

  const mockPendingFees: PendingFee[] = [
    {
      id: '1',
      description: 'December 2024 Monthly Tuition Fee',
      amount: 2500,
      dueDate: '2024-12-05',
      category: 'tuition',
      isOverdue: false,
    },
    {
      id: '2',
      description: 'Science Lab Equipment Fee',
      amount: 350,
      dueDate: '2024-12-10',
      category: 'lab',
      isOverdue: false,
    },
    {
      id: '3',
      description: 'November Transport Fee',
      amount: 180,
      dueDate: '2024-11-30',
      category: 'transport',
      isOverdue: true,
      lateFee: 25,
    },
    {
      id: '4',
      description: 'Library Annual Membership',
      amount: 120,
      dueDate: '2024-12-15',
      category: 'library',
      isOverdue: false,
    },
  ];

  const mockPaymentHistory: PaymentHistory[] = [
    {
      id: '1',
      description: 'November 2024 Monthly Tuition',
      amount: 2500,
      date: '2024-11-15',
      method: 'UPI - PhonePe',
      status: 'success',
      receiptUrl: '#',
      transactionId: 'TXN001234567',
    },
    {
      id: '2',
      description: 'October Lab Fee',
      amount: 300,
      date: '2024-10-20',
      method: 'Credit Card - Razorpay',
      status: 'success',
      receiptUrl: '#',
      transactionId: 'TXN001234566',
    },
    {
      id: '3',
      description: 'September Transport Fee',
      amount: 180,
      date: '2024-09-28',
      method: 'Net Banking - HDFC',
      status: 'success',
      receiptUrl: '#',
      transactionId: 'TXN001234565',
    },
    {
      id: '4',
      description: 'August Tuition Fee',
      amount: 2500,
      date: '2024-08-15',
      method: 'UPI - GPay',
      status: 'success',
      receiptUrl: '#',
      transactionId: 'TXN001234564',
    },
  ];

  const mockInstallmentPlans: InstallmentPlan[] = [
    {
      id: '1',
      totalAmount: 30000,
      installments: 12,
      monthlyAmount: 2700,
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      processingFee: 600,
      isActive: true,
    },
    {
      id: '2',
      totalAmount: 15000,
      installments: 6,
      monthlyAmount: 2650,
      startDate: '2024-07-15',
      endDate: '2024-12-15',
      processingFee: 300,
      isActive: false,
    },
  ];

  const mockAnalytics: FinancialAnalytics = {
    totalPaid: 28450,
    totalPending: 3150,
    monthlySpending: 2850,
    averageMonthly: 2650,
    compareWithPreviousYear: 5.2,
    taxSavings: 1800,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tuition': return '🎓';
      case 'lab': return '🔬';
      case 'library': return '📚';
      case 'transport': return '🚌';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      {(['payment', 'history', 'plans', 'analytics'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === tab && styles.tabButtonTextActive,
          ]}>
            {tab === 'payment' ? 'Pay Now' :
             tab === 'history' ? 'History' :
             tab === 'plans' ? 'Plans' : 'Analytics'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="💳 Pending Payments" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Outstanding fees and charges requiring payment
        </Text>
        
        {mockPendingFees.map((fee) => (
          <TouchableOpacity key={fee.id} style={styles.feeItem}>
            <View style={styles.feeHeader}>
              <View style={styles.feeInfo}>
                <Text style={styles.feeIcon}>{getCategoryIcon(fee.category)}</Text>
                <View style={styles.feeDetails}>
                  <Text style={styles.feeDescription}>{fee.description}</Text>
                  <Text style={styles.feeDueDate}>
                    Due: {new Date(fee.dueDate).toLocaleDateString()}
                  </Text>
                  {fee.isOverdue && fee.lateFee && (
                    <Text style={styles.lateFeeText}>+ Late Fee: ₹{fee.lateFee}</Text>
                  )}
                </View>
              </View>
              <View style={styles.feeAmount}>
                <Text style={styles.feeAmountText}>
                  ₹{fee.amount + (fee.lateFee || 0)}
                </Text>
                {fee.isOverdue && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            ₹{mockPendingFees.reduce((sum, fee) => sum + fee.amount + (fee.lateFee || 0), 0)}
          </Text>
        </View>
      </DashboardCard>

      <DashboardCard title="🏦 Payment Gateway Selection" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Choose your preferred payment method and gateway
        </Text>
        
        <FlatList
          data={mockPaymentGateways}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.gatewayItem,
                selectedGateway === item.id && styles.gatewayItemSelected,
              ]}
              onPress={() => setSelectedGateway(item.id)}
            >
              <View style={styles.gatewayHeader}>
                <Text style={styles.gatewayLogo}>{item.logo}</Text>
                <View style={styles.gatewayInfo}>
                  <Text style={styles.gatewayName}>{item.name}</Text>
                  <Text style={styles.gatewayDescription}>{item.description}</Text>
                  <Text style={styles.processingFee}>
                    Processing Fee: {item.processingFee}%
                  </Text>
                </View>
                {selectedGateway === item.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.paymentMethods}>
                {item.methods.map((method, index) => (
                  <View key={index} style={styles.methodTag}>
                    <Text style={styles.methodTagText}>{method}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.payNowButton}
        onPress={() => {
          const total = mockPendingFees.reduce((sum, fee) => sum + fee.amount + (fee.lateFee || 0), 0);
          const gateway = mockPaymentGateways.find(g => g.id === selectedGateway)?.name;
          showSnackbar(`Processing payment of ₹${total} via ${gateway}. Redirecting to payment gateway...`);
        }}
      >
        <Text style={styles.payNowButtonText}>
          💳 Pay Now - ₹{mockPendingFees.reduce((sum, fee) => sum + fee.amount + (fee.lateFee || 0), 0)}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistorySection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📋 Payment History" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Complete record of all transactions and payments
        </Text>
        
        <FlatList
          data={mockPaymentHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDescription}>{item.description}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString()} • {item.method}
                  </Text>
                  <Text style={styles.transactionId}>ID: {item.transactionId}</Text>
                </View>
                <View style={styles.historyAmount}>
                  <Text style={styles.historyAmountText}>₹{item.amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              {item.receiptUrl && (
                <TouchableOpacity style={styles.receiptButton}>
                  <Text style={styles.receiptButtonText}>📄 Download Receipt</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => showSnackbar('Payment history will be exported to PDF')}
      >
        <Text style={styles.exportButtonText}>📊 Export Payment History</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPlansSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📅 Installment Plans" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Manage your payment plans and installment schedules
        </Text>
        
        <FlatList
          data={mockInstallmentPlans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.planItem}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>
                  {item.installments}-Month Payment Plan
                </Text>
                <View style={[
                  styles.planStatusBadge,
                  { backgroundColor: item.isActive ? '#10B981' : '#6B7280' }
                ]}>
                  <Text style={styles.planStatusText}>
                    {item.isActive ? 'ACTIVE' : 'COMPLETED'}
                  </Text>
                </View>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Total Amount:</Text>
                  <Text style={styles.planDetailValue}>₹{item.totalAmount}</Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Monthly Payment:</Text>
                  <Text style={styles.planDetailValue}>₹{item.monthlyAmount}</Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Duration:</Text>
                  <Text style={styles.planDetailValue}>
                    {new Date(item.startDate).toLocaleDateString()} -
                    {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Processing Fee:</Text>
                  <Text style={styles.planDetailValue}>₹{item.processingFee}</Text>
                </View>
              </View>

              {item.isActive && (
                <TouchableOpacity style={styles.planActionButton}>
                  <Text style={styles.planActionButtonText}>View Plan Details</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.createPlanButton}
        onPress={() => showSnackbar('Create a new installment plan')}
      >
        <Text style={styles.createPlanButtonText}>➕ Create New Payment Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAnalyticsSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="📊 Financial Analytics" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Comprehensive analysis of your education expenses and spending patterns
        </Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>₹{mockAnalytics.totalPaid.toLocaleString()}</Text>
            <Text style={styles.analyticsLabel}>Total Paid This Year</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>₹{mockAnalytics.totalPending.toLocaleString()}</Text>
            <Text style={styles.analyticsLabel}>Pending Payments</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>₹{mockAnalytics.monthlySpending.toLocaleString()}</Text>
            <Text style={styles.analyticsLabel}>This Month</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>₹{mockAnalytics.averageMonthly.toLocaleString()}</Text>
            <Text style={styles.analyticsLabel}>Monthly Average</Text>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="📈 Spending Insights" style={styles.sectionCard}>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📊</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Year-over-Year Comparison</Text>
            <Text style={styles.insightDescription}>
              Your education expenses have increased by {mockAnalytics.compareWithPreviousYear}% 
              compared to the previous year, primarily due to additional lab fees and transport costs.
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>💡</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Cost Optimization</Text>
            <Text style={styles.insightDescription}>
              Consider switching to an annual payment plan to save up to ₹500 on processing fees. 
              Your current monthly payments incur higher transaction costs.
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>🏛️</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Tax Benefits</Text>
            <Text style={styles.insightDescription}>
              You can claim ₹{mockAnalytics.taxSavings.toLocaleString()} as tax deduction 
              under Section 80C for education expenses this financial year.
            </Text>
          </View>
        </View>
      </DashboardCard>

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => showSnackbar('Generate tax-compliant financial report')}
      >
        <Text style={styles.reportButtonText}>📋 Generate Tax Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C3AED' }}>
      <Appbar.BackAction onPress={() => navigation.goBack()} />
      <Appbar.Content title="Payment Center" subtitle="Manage payments and installments" />
      <Appbar.Action icon="wallet" onPress={() => showSnackbar('Payment wallet')} />
    </Appbar.Header>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading payment center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      {renderAppBar()}

      {renderTabNavigation()}

      {activeTab === 'payment' && renderPaymentSection()}
      {activeTab === 'history' && renderHistorySection()}
      {activeTab === 'plans' && renderPlansSection()}
      {activeTab === 'analytics' && renderAnalyticsSection()}

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: 16,
    color: LightTheme.Outline,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.SurfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.LG,
  },
  sectionCard: {
    marginBottom: Spacing.LG,
  },
  cardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
    lineHeight: 20,
    textAlign: 'center',
  },
  feeItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  feeIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
  },
  feeDetails: {
    flex: 1,
  },
  feeDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  feeDueDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  lateFeeText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: Spacing.XS,
  },
  feeAmount: {
    alignItems: 'flex-end',
  },
  feeAmountText: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  overdueBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  overdueBadgeText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
    marginTop: Spacing.MD,
  },
  totalLabel: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  totalAmount: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: '#7C3AED',
  },
  gatewayItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gatewayItemSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#EDE9FE',
  },
  gatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  gatewayLogo: {
    fontSize: 32,
    marginRight: Spacing.MD,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  gatewayDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 16,
    marginBottom: Spacing.XS,
  },
  processingFee: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#F59E0B',
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  methodTag: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  methodTagText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  payNowButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  payNowButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  historyDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  transactionId: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontFamily: 'monospace',
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusBadgeText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  receiptButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
  },
  receiptButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: LightTheme.secondaryContainer,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
  },
  exportButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  planItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  planTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  planStatusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  planStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: Spacing.MD,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.XS,
  },
  planDetailLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  planDetailValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  planActionButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  planActionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  createPlanButton: {
    backgroundColor: LightTheme.primaryContainer,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  createPlanButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#7C3AED',
    fontWeight: '600',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  analyticsCard: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    width: (width - Spacing.LG * 3) / 2,
    marginBottom: Spacing.MD,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: Spacing.XS,
  },
  analyticsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    marginTop: Spacing.XS,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  insightDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
  },
  reportButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.MD,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  reportButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default PaymentProcessingScreen;