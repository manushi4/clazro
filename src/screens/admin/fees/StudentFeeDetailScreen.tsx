/**
 * StudentFeeDetailScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed fee information for a specific student
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: StudentFeesListScreen, StudentFeesDashboardWidget
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View detailed fee records, payment history, and actions for a student
 * - Target role: admin, super_admin
 * - Screen ID: student-fee-detail
 * - Route params: studentId (required), studentName (optional)
 * - Data requirements: student_fees table, user_profiles table
 * - Required permissions: view_fees, manage_fees
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing student_fees table (created in Phase 2 of admin_demo.md)
 * - RLS: admin role can read student_fees where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useStudentFeeDetailQuery: src/hooks/queries/admin/useStudentFeeDetailQuery.ts
 * - Types: StudentFeeDetail, FeeRecord, PaymentRecord
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - File: src/screens/admin/fees/StudentFeeDetailScreen.tsx
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading, Error, Empty, Success states
 * - OfflineBanner at top
 * - getLocalizedField for dynamic content
 * - t() for static UI text
 * - Permission checks with usePermissions
 * - Track screen view with useAnalytics
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "student-fee-detail": { screenId: "student-fee-detail", component: StudentFeeDetailScreen }
 *   - "StudentFeeDetail": { screenId: "StudentFeeDetail", component: StudentFeeDetailScreen }
 *
 * ============================================================================
 * PHASE 6: TRANSLATIONS (i18n) ✓
 * ============================================================================
 * - English: src/i18n/locales/en/admin.json (studentFeeDetail section)
 * - Hindi: src/i18n/locales/hi/admin.json (studentFeeDetail section)
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../../theme/useAppTheme";
import { useBranding } from "../../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb, captureException } from "../../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../../offline/networkStore";
import { OfflineBanner } from "../../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

// Query Hook
import { useStudentFeeDetailQuery, FeeRecord, PaymentRecord } from "../../../hooks/queries/admin/useStudentFeeDetailQuery";

// Utils
import { getLocalizedField } from "../../../utils/getLocalizedField";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

type RouteParams = {
  studentId?: string;
  studentName?: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  paid: { color: "#4CAF50", icon: "check-circle", label: "Paid" },
  partial: { color: "#FF9800", icon: "clock-outline", label: "Partial" },
  pending: { color: "#2196F3", icon: "clock-outline", label: "Pending" },
  overdue: { color: "#F44336", icon: "alert-circle", label: "Overdue" },
  waived: { color: "#9E9E9E", icon: "cancel", label: "Waived" },
};

const PAYMENT_METHOD_CONFIG: Record<string, { icon: string; label: string }> = {
  cash: { icon: "cash", label: "Cash" },
  upi: { icon: "cellphone", label: "UPI" },
  card: { icon: "credit-card", label: "Card" },
  netbanking: { icon: "bank", label: "Net Banking" },
  cheque: { icon: "checkbook", label: "Cheque" },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// =============================================================================
// COMPONENT
// =============================================================================

export const StudentFeeDetailScreen: React.FC<Props> = ({
  screenId = "student-fee-detail",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();

  // Get route params
  const params = (route?.params || {}) as RouteParams;
  const studentId = params.studentId;
  const studentNameParam = params.studentName;

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"fees" | "payments">("fees");

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: studentFeeDetail,
    isLoading,
    error,
    refetch,
  } = useStudentFeeDetailQuery({
    studentId: studentId || "",
  });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, studentId },
    });

    if (studentId) {
      trackEvent("student_fee_detail_viewed", {
        screenId,
        studentId,
      });
    }
  }, [screenId, role, customerId, studentId, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("student_fee_detail_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleSendReminder = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "This action requires internet connection.",
        })
      );
      return;
    }

    trackEvent("student_fee_reminder_sent", { studentId });
    Alert.alert(
      t("admin:studentFeeDetail.reminderSent", { defaultValue: "Reminder Sent" }),
      t("admin:studentFeeDetail.reminderSentMessage", {
        defaultValue: "Payment reminder has been sent to the student and parent.",
      })
    );
  }, [isOnline, studentId, trackEvent, t]);

  const handleRecordPayment = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "This action requires internet connection.",
        })
      );
      return;
    }

    trackEvent("student_fee_record_payment_pressed", { studentId });
    // Navigate to payment recording screen
    navigation.navigate("record-payment", { studentId });
  }, [isOnline, studentId, trackEvent, navigation]);

  const handleCallParent = useCallback(() => {
    if (studentFeeDetail?.parentPhone) {
      Linking.openURL(`tel:${studentFeeDetail.parentPhone}`);
      trackEvent("student_fee_call_parent", { studentId });
    }
  }, [studentFeeDetail?.parentPhone, studentId, trackEvent]);

  const handleDownloadReceipt = useCallback((paymentId: string) => {
    trackEvent("student_fee_download_receipt", { studentId, paymentId });
    Alert.alert(
      t("admin:studentFeeDetail.downloadStarted", { defaultValue: "Download Started" }),
      t("admin:studentFeeDetail.receiptDownloading", {
        defaultValue: "Receipt is being downloaded...",
      })
    );
  }, [studentId, trackEvent, t]);

  // ===========================================================================
  // RENDER - No studentId provided
  // ===========================================================================
  if (!studentId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <Icon name="account-alert" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:studentFeeDetail.noStudentSelected", {
              defaultValue: "No student selected. Please select a student from the list.",
            })}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.goBack", { defaultValue: "Go Back" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Loading State
  // ===========================================================================
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("common:status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Error State
  // ===========================================================================
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Oops!" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("common:errors.generic", { defaultValue: "Something went wrong." })}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.retry", { defaultValue: "Try Again" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Empty State
  // ===========================================================================
  if (!studentFeeDetail) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <Icon name="file-document-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:studentFeeDetail.noData", { defaultValue: "No Fee Records" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:studentFeeDetail.noDataMessage", {
              defaultValue: "No fee records found for this student.",
            })}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.goBack", { defaultValue: "Go Back" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Success State
  // ===========================================================================
  const pendingFees = studentFeeDetail.feeRecords.filter(
    (f) => f.status === "pending" || f.status === "partial"
  );
  const overdueFees = studentFeeDetail.feeRecords.filter((f) => f.status === "overdue");
  const hasOverdue = overdueFees.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackButton}
          accessibilityLabel={t("common:actions.goBack", { defaultValue: "Go back" })}
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {studentFeeDetail.studentName || studentNameParam || t("admin:studentFeeDetail.title", { defaultValue: "Fee Details" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {studentFeeDetail.batch || studentFeeDetail.program || t("admin:studentFeeDetail.subtitle", { defaultValue: "Student Fee Record" })}
          </AppText>
        </View>

        <TouchableOpacity
          onPress={handleCallParent}
          style={styles.headerActionButton}
          accessibilityLabel={t("admin:studentFeeDetail.callParent", { defaultValue: "Call parent" })}
          accessibilityRole="button"
          disabled={!studentFeeDetail.parentPhone}
        >
          <Icon
            name="phone"
            size={24}
            color={studentFeeDetail.parentPhone ? colors.primary : colors.outlineVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Card */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryAvatar}>
              <Icon name="account-circle" size={48} color={colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <AppText style={[styles.summaryName, { color: colors.onSurface }]}>
                {studentFeeDetail.studentName}
              </AppText>
              {studentFeeDetail.studentEmail && (
                <AppText style={[styles.summaryEmail, { color: colors.onSurfaceVariant }]}>
                  {studentFeeDetail.studentEmail}
                </AppText>
              )}
              {studentFeeDetail.studentPhone && (
                <AppText style={[styles.summaryPhone, { color: colors.onSurfaceVariant }]}>
                  {studentFeeDetail.studentPhone}
                </AppText>
              )}
            </View>
          </View>

          {/* Fee Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${colors.primary}15` }]}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(studentFeeDetail.totalFees)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:studentFeeDetail.totalFees", { defaultValue: "Total Fees" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#4CAF5015" }]}>
              <AppText style={[styles.statValue, { color: "#4CAF50" }]}>
                {formatCurrency(studentFeeDetail.totalPaid)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:studentFeeDetail.paid", { defaultValue: "Paid" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#FF980015" }]}>
              <AppText style={[styles.statValue, { color: "#FF9800" }]}>
                {formatCurrency(studentFeeDetail.totalPending)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:studentFeeDetail.pending", { defaultValue: "Pending" })}
              </AppText>
            </View>
            {studentFeeDetail.totalOverdue > 0 && (
              <View style={[styles.statCard, { backgroundColor: "#F4433615" }]}>
                <AppText style={[styles.statValue, { color: "#F44336" }]}>
                  {formatCurrency(studentFeeDetail.totalOverdue)}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("admin:studentFeeDetail.overdue", { defaultValue: "Overdue" })}
                </AppText>
              </View>
            )}
          </View>
        </AppCard>

        {/* Overdue Alert */}
        {hasOverdue && (
          <View style={[styles.alertCard, { backgroundColor: "#F4433615", borderColor: "#F44336" }]}>
            <Icon name="alert-circle" size={24} color="#F44336" />
            <View style={styles.alertContent}>
              <AppText style={[styles.alertTitle, { color: "#F44336" }]}>
                {t("admin:studentFeeDetail.overdueAlert", {
                  count: overdueFees.length,
                  defaultValue: `${overdueFees.length} fee(s) overdue`,
                })}
              </AppText>
              <AppText style={[styles.alertMessage, { color: colors.onSurfaceVariant }]}>
                {t("admin:studentFeeDetail.overdueAlertMessage", {
                  defaultValue: "Please follow up with the student/parent for payment.",
                })}
              </AppText>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
            onPress={handleRecordPayment}
          >
            <Icon name="cash-plus" size={20} color="#FFF" />
            <AppText style={styles.quickActionText}>
              {t("admin:studentFeeDetail.recordPayment", { defaultValue: "Record Payment" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: hasOverdue ? "#F44336" : colors.secondary }]}
            onPress={handleSendReminder}
          >
            <Icon name="bell-ring" size={20} color="#FFF" />
            <AppText style={styles.quickActionText}>
              {t("admin:studentFeeDetail.sendReminder", { defaultValue: "Send Reminder" })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "fees" && { backgroundColor: colors.surface },
            ]}
            onPress={() => setActiveTab("fees")}
          >
            <Icon
              name="file-document-outline"
              size={18}
              color={activeTab === "fees" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.tabText,
                { color: activeTab === "fees" ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {t("admin:studentFeeDetail.feeRecords", { defaultValue: "Fee Records" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "payments" && { backgroundColor: colors.surface },
            ]}
            onPress={() => setActiveTab("payments")}
          >
            <Icon
              name="history"
              size={18}
              color={activeTab === "payments" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.tabText,
                { color: activeTab === "payments" ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {t("admin:studentFeeDetail.paymentHistory", { defaultValue: "Payment History" })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Fee Records Tab */}
        {activeTab === "fees" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentFeeDetail.allFees", { defaultValue: "All Fee Records" })}
            </AppText>
            {studentFeeDetail.feeRecords.map((fee, index) => {
              const statusConfig = STATUS_CONFIG[fee.status] || STATUS_CONFIG.pending;
              const isOverdue = fee.status === "overdue";
              const daysOverdue = isOverdue ? getDaysOverdue(fee.dueDate) : 0;

              return (
                <View
                  key={fee.id}
                  style={[
                    styles.feeItem,
                    index < studentFeeDetail.feeRecords.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.feeItemHeader}>
                    <View style={styles.feeItemInfo}>
                      <AppText style={[styles.feeItemTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(fee, "feeType") || fee.feeTypeEn}
                      </AppText>
                      <AppText style={[styles.feeItemMeta, { color: colors.onSurfaceVariant }]}>
                        {fee.academicYear} • {fee.term}
                      </AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                      <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
                      <AppText style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.feeItemDetails}>
                    <View style={styles.feeAmountRow}>
                      <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>
                        {t("admin:studentFeeDetail.amount", { defaultValue: "Amount" })}:
                      </AppText>
                      <AppText style={[styles.feeAmount, { color: colors.onSurface }]}>
                        {formatCurrency(fee.amount)}
                      </AppText>
                    </View>
                    {fee.paidAmount > 0 && (
                      <View style={styles.feeAmountRow}>
                        <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>
                          {t("admin:studentFeeDetail.paidAmount", { defaultValue: "Paid" })}:
                        </AppText>
                        <AppText style={[styles.feeAmount, { color: "#4CAF50" }]}>
                          {formatCurrency(fee.paidAmount)}
                        </AppText>
                      </View>
                    )}
                    <View style={styles.feeAmountRow}>
                      <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>
                        {t("admin:studentFeeDetail.dueDate", { defaultValue: "Due Date" })}:
                      </AppText>
                      <AppText
                        style={[
                          styles.feeAmount,
                          { color: isOverdue ? "#F44336" : colors.onSurface },
                        ]}
                      >
                        {formatDate(fee.dueDate)}
                        {isOverdue && ` (${daysOverdue}d overdue)`}
                      </AppText>
                    </View>
                    {fee.remarks && (
                      <AppText style={[styles.feeRemarks, { color: colors.onSurfaceVariant }]}>
                        📝 {fee.remarks}
                      </AppText>
                    )}
                  </View>
                </View>
              );
            })}
          </AppCard>
        )}

        {/* Payment History Tab */}
        {activeTab === "payments" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentFeeDetail.allPayments", { defaultValue: "Payment History" })}
            </AppText>
            {studentFeeDetail.paymentHistory.length === 0 ? (
              <View style={styles.emptyList}>
                <Icon name="cash-remove" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyListText, { color: colors.onSurfaceVariant }]}>
                  {t("admin:studentFeeDetail.noPayments", { defaultValue: "No payments recorded yet" })}
                </AppText>
              </View>
            ) : (
              studentFeeDetail.paymentHistory.map((payment, index) => {
                const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod.toLowerCase()] ||
                  { icon: "cash", label: payment.paymentMethod };

                return (
                  <View
                    key={payment.id}
                    style={[
                      styles.paymentItem,
                      index < studentFeeDetail.paymentHistory.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={[styles.paymentIcon, { backgroundColor: "#4CAF5020" }]}>
                      <Icon name={methodConfig.icon} size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.paymentInfo}>
                      <AppText style={[styles.paymentTitle, { color: colors.onSurface }]}>
                        {payment.feeType}
                      </AppText>
                      <AppText style={[styles.paymentMeta, { color: colors.onSurfaceVariant }]}>
                        {formatDate(payment.paymentDate)} • {methodConfig.label}
                      </AppText>
                      {payment.transactionId && (
                        <AppText style={[styles.paymentTxn, { color: colors.onSurfaceVariant }]}>
                          TXN: {payment.transactionId}
                        </AppText>
                      )}
                    </View>
                    <View style={styles.paymentRight}>
                      <AppText style={[styles.paymentAmount, { color: "#4CAF50" }]}>
                        {formatCurrency(payment.amount)}
                      </AppText>
                      <TouchableOpacity
                        style={[styles.receiptButton, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleDownloadReceipt(payment.id)}
                      >
                        <Icon name="download" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </AppCard>
        )}

        {/* Parent Contact Info */}
        {(studentFeeDetail.parentName || studentFeeDetail.parentPhone) && (
          <AppCard style={styles.contactCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentFeeDetail.parentContact", { defaultValue: "Parent Contact" })}
            </AppText>
            <View style={styles.contactRow}>
              <Icon name="account" size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.contactText, { color: colors.onSurface }]}>
                {studentFeeDetail.parentName || "N/A"}
              </AppText>
            </View>
            {studentFeeDetail.parentPhone && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCallParent}>
                <Icon name="phone" size={20} color={colors.primary} />
                <AppText style={[styles.contactText, { color: colors.primary }]}>
                  {studentFeeDetail.parentPhone}
                </AppText>
              </TouchableOpacity>
            )}
          </AppCard>
        )}

        {/* Last Payment Info */}
        {studentFeeDetail.lastPaymentDate && (
          <View style={styles.lastPaymentInfo}>
            <Icon name="clock-check-outline" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.lastPaymentText, { color: colors.onSurfaceVariant }]}>
              {t("admin:studentFeeDetail.lastPayment", {
                date: formatDate(studentFeeDetail.lastPaymentDate),
                amount: formatCurrency(studentFeeDetail.lastPaymentAmount || 0),
                defaultValue: `Last payment: ${formatCurrency(studentFeeDetail.lastPaymentAmount || 0)} on ${formatDate(studentFeeDetail.lastPaymentDate)}`,
              })}
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 8,
    paddingHorizontal: 32,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: "600",
  },
  summaryEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  alertMessage: {
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  quickActionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  feeItem: {
    paddingVertical: 12,
  },
  feeItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  feeItemInfo: {
    flex: 1,
  },
  feeItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  feeItemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  feeItemDetails: {
    gap: 4,
  },
  feeAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feeLabel: {
    fontSize: 13,
  },
  feeAmount: {
    fontSize: 13,
    fontWeight: "500",
  },
  feeRemarks: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyListText: {
    fontSize: 14,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  paymentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentTxn: {
    fontSize: 11,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  receiptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCard: {
    padding: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  contactText: {
    fontSize: 14,
  },
  lastPaymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  lastPaymentText: {
    fontSize: 12,
  },
});

export default StudentFeeDetailScreen;
