/**
 * TeacherPayrollDetailScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed payroll information for a specific teacher
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: TeacherPayrollWidget, TeacherPayrollListScreen
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View detailed salary breakdown, payment history for a teacher
 * - Target role: admin, super_admin
 * - Screen ID: teacher-payroll-detail
 * - Route params: teacherId (required), month (optional - defaults to current)
 * - Data requirements: teacher_payroll table, user_profiles table
 * - Required permissions: view_payroll, manage_payroll
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing teacher_payroll table (created in Phase 3 of admin_demo.md)
 * - RLS: admin role can read teacher_payroll where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useTeacherPayrollDetailQuery: src/hooks/queries/admin/useTeacherPayrollDetailQuery.ts
 * - Types: TeacherPayrollDetail, PayrollBreakdown, PaymentHistory
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - File: src/screens/admin/payroll/TeacherPayrollDetailScreen.tsx
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading, Error, Empty, Success states
 * - OfflineBanner at top
 * - Track screen view with useAnalytics
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
import { addBreadcrumb } from "../../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../../offline/networkStore";
import { OfflineBanner } from "../../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

// Query Hook
import { useTeacherPayrollDetailQuery, PaymentHistory } from "../../../hooks/queries/admin/useTeacherPayrollDetailQuery";

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
  teacherId?: string;
  month?: string; // 'YYYY-MM' format
};

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  paid: { color: "#4CAF50", icon: "check-circle", label: "Paid" },
  processing: { color: "#2196F3", icon: "clock-outline", label: "Processing" },
  pending: { color: "#FF9800", icon: "clock-outline", label: "Pending" },
  failed: { color: "#F44336", icon: "alert-circle", label: "Failed" },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =============================================================================
// COMPONENT
// =============================================================================

export const TeacherPayrollDetailScreen: React.FC<Props> = ({
  screenId = "teacher-payroll-detail",
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
  const teacherId = params.teacherId;
  const month = params.month;

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"breakdown" | "history">("breakdown");

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: payrollDetail,
    isLoading,
    error,
    refetch,
  } = useTeacherPayrollDetailQuery({
    teacherId: teacherId || "",
    month,
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
      data: { role, customerId, teacherId, month },
    });

    if (teacherId) {
      trackEvent("teacher_payroll_detail_viewed", {
        screenId,
        teacherId,
        month,
      });
    }
  }, [screenId, role, customerId, teacherId, month, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("teacher_payroll_detail_back_pressed");
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

  const handleCallTeacher = useCallback(() => {
    if (payrollDetail?.teacherPhone) {
      Linking.openURL(`tel:${payrollDetail.teacherPhone}`);
      trackEvent("teacher_payroll_call_teacher", { teacherId });
    }
  }, [payrollDetail?.teacherPhone, teacherId, trackEvent]);

  const handleEmailTeacher = useCallback(() => {
    if (payrollDetail?.teacherEmail) {
      Linking.openURL(`mailto:${payrollDetail.teacherEmail}`);
      trackEvent("teacher_payroll_email_teacher", { teacherId });
    }
  }, [payrollDetail?.teacherEmail, teacherId, trackEvent]);

  const handleDownloadPayslip = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "This action requires internet connection.",
        })
      );
      return;
    }

    trackEvent("teacher_payroll_download_payslip", { teacherId, month });
    Alert.alert(
      t("admin:teacherPayrollDetail.downloadStarted", { defaultValue: "Download Started" }),
      t("admin:teacherPayrollDetail.payslipDownloading", {
        defaultValue: "Payslip is being downloaded...",
      })
    );
  }, [isOnline, teacherId, month, trackEvent, t]);

  const handleProcessPayment = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "This action requires internet connection.",
        })
      );
      return;
    }

    trackEvent("teacher_payroll_process_payment", { teacherId, month });
    navigation.navigate("payroll-processing", { teacherId, month });
  }, [isOnline, teacherId, month, trackEvent, navigation, t]);

  // ===========================================================================
  // RENDER - No teacherId provided
  // ===========================================================================
  if (!teacherId) {
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
            {t("admin:teacherPayrollDetail.noTeacherSelected", {
              defaultValue: "No teacher selected. Please select a teacher from the list.",
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
  if (!payrollDetail) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <Icon name="file-document-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:teacherPayrollDetail.noData", { defaultValue: "No Payroll Data" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:teacherPayrollDetail.noDataMessage", {
              defaultValue: "No payroll records found for this teacher.",
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
  const statusConfig = STATUS_CONFIG[payrollDetail.status] || STATUS_CONFIG.pending;
  const isPending = payrollDetail.status === "pending";

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
            {payrollDetail.teacherName}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {payrollDetail.monthName} {payrollDetail.year} Payslip
          </AppText>
        </View>

        <TouchableOpacity
          onPress={handleDownloadPayslip}
          style={styles.headerActionButton}
          accessibilityLabel={t("admin:teacherPayrollDetail.downloadPayslip", { defaultValue: "Download payslip" })}
          accessibilityRole="button"
        >
          <Icon name="download" size={24} color={colors.primary} />
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
        {/* Teacher Info Card */}
        <AppCard style={styles.teacherCard}>
          <View style={styles.teacherHeader}>
            <View style={styles.teacherAvatar}>
              <Icon name="account-circle" size={56} color={colors.primary} />
            </View>
            <View style={styles.teacherInfo}>
              <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                {payrollDetail.teacherName}
              </AppText>
              <AppText style={[styles.teacherDesignation, { color: colors.onSurfaceVariant }]}>
                {payrollDetail.designation} • {payrollDetail.department}
              </AppText>
              <AppText style={[styles.teacherEmpId, { color: colors.onSurfaceVariant }]}>
                {payrollDetail.employeeId}
              </AppText>
            </View>
          </View>

          {/* Contact Actions */}
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={handleCallTeacher}
              disabled={!payrollDetail.teacherPhone}
            >
              <Icon name="phone" size={18} color={colors.primary} />
              <AppText style={[styles.contactButtonText, { color: colors.primary }]}>Call</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={handleEmailTeacher}
              disabled={!payrollDetail.teacherEmail}
            >
              <Icon name="email" size={18} color={colors.primary} />
              <AppText style={[styles.contactButtonText, { color: colors.primary }]}>Email</AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Net Salary Card */}
        <AppCard style={styles.salaryCard}>
          <View style={styles.salaryHeader}>
            <View>
              <AppText style={[styles.salaryLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:teacherPayrollDetail.netSalary", { defaultValue: "Net Salary" })}
              </AppText>
              <AppText style={[styles.salaryAmount, { color: colors.primary }]}>
                {formatCurrency(payrollDetail.breakdown.netSalary)}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Icon name={statusConfig.icon} size={16} color={statusConfig.color} />
              <AppText style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </AppText>
            </View>
          </View>

          {payrollDetail.paymentDate && (
            <View style={styles.paymentInfo}>
              <AppText style={[styles.paymentInfoText, { color: colors.onSurfaceVariant }]}>
                Paid on {formatDate(payrollDetail.paymentDate)} via {payrollDetail.paymentMethod}
              </AppText>
              {payrollDetail.transactionId && (
                <AppText style={[styles.transactionId, { color: colors.onSurfaceVariant }]}>
                  Txn: {payrollDetail.transactionId}
                </AppText>
              )}
            </View>
          )}

          {isPending && (
            <TouchableOpacity
              style={[styles.processButton, { backgroundColor: colors.primary }]}
              onPress={handleProcessPayment}
            >
              <Icon name="credit-card-outline" size={18} color="#FFF" />
              <AppText style={styles.processButtonText}>
                {t("admin:teacherPayrollDetail.processPayment", { defaultValue: "Process Payment" })}
              </AppText>
            </TouchableOpacity>
          )}
        </AppCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "breakdown" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("breakdown")}
          >
            <Icon
              name="format-list-bulleted"
              size={16}
              color={activeTab === "breakdown" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "breakdown" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:teacherPayrollDetail.breakdown", { defaultValue: "Breakdown" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("history")}
          >
            <Icon
              name="history"
              size={16}
              color={activeTab === "history" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "history" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:teacherPayrollDetail.history", { defaultValue: "History" })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Breakdown Tab */}
        {activeTab === "breakdown" && (
          <>
            {/* Earnings Section */}
            <AppCard style={styles.breakdownCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:teacherPayrollDetail.earnings", { defaultValue: "Earnings" })}
              </AppText>

              <View style={styles.breakdownRow}>
                <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                  Base Salary
                </AppText>
                <AppText style={[styles.breakdownValue, { color: colors.onSurface }]}>
                  {formatCurrency(payrollDetail.breakdown.baseSalary)}
                </AppText>
              </View>

              <AppText style={[styles.subSectionTitle, { color: colors.onSurfaceVariant }]}>
                Allowances
              </AppText>
              {Object.entries(payrollDetail.breakdown.allowances).map(([key, value]) => (
                <View key={key} style={styles.breakdownSubRow}>
                  <AppText style={[styles.breakdownSubLabel, { color: colors.onSurfaceVariant }]}>
                    {key.toUpperCase()}
                  </AppText>
                  <AppText style={[styles.breakdownSubValue, { color: colors.onSurface }]}>
                    {formatCurrency(value)}
                  </AppText>
                </View>
              ))}

              {payrollDetail.breakdown.bonuses.performance > 0 && (
                <>
                  <AppText style={[styles.subSectionTitle, { color: colors.onSurfaceVariant }]}>
                    Bonuses
                  </AppText>
                  {Object.entries(payrollDetail.breakdown.bonuses).map(([key, value]) => 
                    value > 0 && (
                      <View key={key} style={styles.breakdownSubRow}>
                        <AppText style={[styles.breakdownSubLabel, { color: colors.onSurfaceVariant }]}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </AppText>
                        <AppText style={[styles.breakdownSubValue, { color: "#4CAF50" }]}>
                          +{formatCurrency(value)}
                        </AppText>
                      </View>
                    )
                  )}
                </>
              )}

              <View style={[styles.totalRow, { borderTopColor: colors.outlineVariant }]}>
                <AppText style={[styles.totalLabel, { color: colors.onSurface }]}>
                  Gross Salary
                </AppText>
                <AppText style={[styles.totalValue, { color: "#4CAF50" }]}>
                  {formatCurrency(payrollDetail.breakdown.grossSalary)}
                </AppText>
              </View>
            </AppCard>

            {/* Deductions Section */}
            <AppCard style={styles.breakdownCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:teacherPayrollDetail.deductions", { defaultValue: "Deductions" })}
              </AppText>

              {Object.entries(payrollDetail.breakdown.deductions).map(([key, value]) => 
                value > 0 && (
                  <View key={key} style={styles.breakdownRow}>
                    <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
                      {key.toUpperCase()}
                    </AppText>
                    <AppText style={[styles.breakdownValue, { color: "#F44336" }]}>
                      -{formatCurrency(value)}
                    </AppText>
                  </View>
                )
              )}

              <View style={[styles.totalRow, { borderTopColor: colors.outlineVariant }]}>
                <AppText style={[styles.totalLabel, { color: colors.onSurface }]}>
                  Total Deductions
                </AppText>
                <AppText style={[styles.totalValue, { color: "#F44336" }]}>
                  -{formatCurrency(payrollDetail.breakdown.totalDeductions)}
                </AppText>
              </View>
            </AppCard>

            {/* Bank Details */}
            <AppCard style={styles.bankCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:teacherPayrollDetail.bankDetails", { defaultValue: "Bank Details" })}
              </AppText>
              <View style={styles.bankRow}>
                <AppText style={[styles.bankLabel, { color: colors.onSurfaceVariant }]}>Bank</AppText>
                <AppText style={[styles.bankValue, { color: colors.onSurface }]}>{payrollDetail.bankName || "-"}</AppText>
              </View>
              <View style={styles.bankRow}>
                <AppText style={[styles.bankLabel, { color: colors.onSurfaceVariant }]}>Account</AppText>
                <AppText style={[styles.bankValue, { color: colors.onSurface }]}>{payrollDetail.bankAccount || "-"}</AppText>
              </View>
              <View style={styles.bankRow}>
                <AppText style={[styles.bankLabel, { color: colors.onSurfaceVariant }]}>IFSC</AppText>
                <AppText style={[styles.bankValue, { color: colors.onSurface }]}>{payrollDetail.ifscCode || "-"}</AppText>
              </View>
              <View style={styles.bankRow}>
                <AppText style={[styles.bankLabel, { color: colors.onSurfaceVariant }]}>PAN</AppText>
                <AppText style={[styles.bankValue, { color: colors.onSurface }]}>{payrollDetail.panNumber || "-"}</AppText>
              </View>
            </AppCard>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <AppCard style={styles.historyCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:teacherPayrollDetail.paymentHistory", { defaultValue: "Payment History" })}
            </AppText>
            {payrollDetail.paymentHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Icon name="history" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyHistoryText, { color: colors.onSurfaceVariant }]}>
                  No payment history available
                </AppText>
              </View>
            ) : (
              payrollDetail.paymentHistory.map((payment, index) => {
                const paymentStatus = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                return (
                  <View
                    key={payment.id}
                    style={[
                      styles.historyItem,
                      index < payrollDetail.paymentHistory.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.historyItemLeft}>
                      <AppText style={[styles.historyMonth, { color: colors.onSurface }]}>
                        {payment.monthName} {payment.year}
                      </AppText>
                      <AppText style={[styles.historyDate, { color: colors.onSurfaceVariant }]}>
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "Not paid yet"}
                      </AppText>
                    </View>
                    <View style={styles.historyItemRight}>
                      <AppText style={[styles.historyAmount, { color: colors.onSurface }]}>
                        {formatCurrency(payment.netSalary)}
                      </AppText>
                      <View style={[styles.historyStatus, { backgroundColor: `${paymentStatus.color}20` }]}>
                        <AppText style={[styles.historyStatusText, { color: paymentStatus.color }]}>
                          {paymentStatus.label}
                        </AppText>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </AppCard>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
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
  },
  teacherCard: {
    padding: 16,
    marginBottom: 12,
  },
  teacherHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  teacherAvatar: {
    marginRight: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: "600",
  },
  teacherDesignation: {
    fontSize: 13,
    marginTop: 2,
  },
  teacherEmpId: {
    fontSize: 12,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  salaryCard: {
    padding: 16,
    marginBottom: 12,
  },
  salaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  salaryLabel: {
    fontSize: 12,
  },
  salaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentInfo: {
    marginTop: 12,
  },
  paymentInfoText: {
    fontSize: 12,
  },
  transactionId: {
    fontSize: 11,
    marginTop: 2,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  processButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  breakdownCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakdownSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingLeft: 12,
  },
  breakdownSubLabel: {
    fontSize: 12,
  },
  breakdownSubValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  bankCard: {
    padding: 16,
    marginBottom: 12,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  bankLabel: {
    fontSize: 13,
  },
  bankValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  historyCard: {
    padding: 16,
    marginBottom: 12,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyHistoryText: {
    fontSize: 13,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: "500",
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyItemRight: {
    alignItems: "flex-end",
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 24,
  },
});