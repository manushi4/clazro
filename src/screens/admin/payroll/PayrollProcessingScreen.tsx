/**
 * PayrollProcessingScreen - Fixed Screen (Admin)
 *
 * Purpose: Process pending teacher salaries in bulk or individually
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: TeacherPayrollWidget "Process Pending Salaries" button
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: Bulk process pending teacher salaries with confirmation
 * - Target role: admin, super_admin
 * - Screen ID: payroll-processing
 * - Route params: month (optional - defaults to current month)
 * - Data requirements: teacher_payroll table, user_profiles table
 * - Required permissions: manage_payroll, process_payments
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing teacher_payroll table (created in Phase 3 of admin_demo.md)
 * - RLS: admin role can update teacher_payroll where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useTeacherPayrollQuery: Fetch pending payroll records (reuses existing hook)
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
import { useTeacherPayrollQuery } from "../../../hooks/queries/admin/useTeacherPayrollQuery";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";
import { format } from "date-fns";

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
  month?: string; // 'YYYY-MM' format
  teacherId?: string; // Optional - if processing single teacher
};

type PendingTeacher = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Bank Transfer", icon: "bank" },
  { id: "upi", label: "UPI", icon: "cellphone" },
  { id: "cheque", label: "Cheque", icon: "checkbook" },
  { id: "cash", label: "Cash", icon: "cash" },
];

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

const getMonthName = (monthStr?: string): string => {
  if (!monthStr) return format(new Date(), "MMMM yyyy");
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM yyyy");
};

// =============================================================================
// COMPONENT
// =============================================================================

export const PayrollProcessingScreen: React.FC<Props> = ({
  screenId = "payroll-processing",
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
  const month = params.month || format(new Date(), "yyyy-MM");
  const preSelectedTeacherId = params.teacherId;

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: payrollData,
    isLoading,
    error,
    refetch,
  } = useTeacherPayrollQuery({ month });

  // Get pending teachers from payroll data
  const pendingTeachers = useMemo(() => {
    return payrollData?.pendingTeachers || [];
  }, [payrollData]);

  // Calculate totals
  const selectedTotal = useMemo(() => {
    return pendingTeachers
      .filter((t) => selectedTeachers.has(t.id))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [pendingTeachers, selectedTeachers]);

  const allSelected = useMemo(() => {
    return pendingTeachers.length > 0 && selectedTeachers.size === pendingTeachers.length;
  }, [pendingTeachers, selectedTeachers]);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, month },
    });

    trackEvent("payroll_processing_opened", {
      screenId,
      month,
      preSelectedTeacherId,
    });
  }, [screenId, role, customerId, month, preSelectedTeacherId, trackScreenView, trackEvent]);

  // Pre-select teacher if provided
  useEffect(() => {
    if (preSelectedTeacherId && pendingTeachers.some((t) => t.id === preSelectedTeacherId)) {
      setSelectedTeachers(new Set([preSelectedTeacherId]));
    }
  }, [preSelectedTeacherId, pendingTeachers]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("payroll_processing_back_pressed");
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

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedTeachers(new Set());
      trackEvent("payroll_processing_deselect_all");
    } else {
      setSelectedTeachers(new Set(pendingTeachers.map((t) => t.id)));
      trackEvent("payroll_processing_select_all", { count: pendingTeachers.length });
    }
  }, [allSelected, pendingTeachers, trackEvent]);

  const handleToggleTeacher = useCallback((teacherId: string) => {
    setSelectedTeachers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  }, []);

  const handleProcessPayroll = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "This action requires internet connection.",
        })
      );
      return;
    }

    if (selectedTeachers.size === 0) {
      Alert.alert(
        t("admin:payrollProcessing.noSelection", { defaultValue: "No Selection" }),
        t("admin:payrollProcessing.selectTeachers", {
          defaultValue: "Please select at least one teacher to process.",
        })
      );
      return;
    }

    const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

    Alert.alert(
      t("admin:payrollProcessing.confirmTitle", { defaultValue: "Confirm Payment" }),
      t("admin:payrollProcessing.confirmMessage", {
        defaultValue: `Process ${formatCurrency(selectedTotal)} for ${selectedTeachers.size} teacher(s) via ${selectedMethod?.label}?`,
        count: selectedTeachers.size,
        amount: formatCurrency(selectedTotal),
        method: selectedMethod?.label,
      }),
      [
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("common:actions.confirm", { defaultValue: "Confirm" }),
          onPress: processPayments,
        },
      ]
    );
  }, [isOnline, selectedTeachers, selectedTotal, paymentMethod, t]);

  const processPayments = useCallback(async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    trackEvent("payroll_processing_started", {
      count: selectedTeachers.size,
      amount: selectedTotal,
      method: paymentMethod,
    });

    // Simulate processing (in real app, this would call a mutation)
    const teacherIds = Array.from(selectedTeachers);
    for (let i = 0; i < teacherIds.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessedCount(i + 1);
    }

    setIsProcessing(false);

    trackEvent("payroll_processing_completed", {
      count: selectedTeachers.size,
      amount: selectedTotal,
      method: paymentMethod,
    });

    Alert.alert(
      t("admin:payrollProcessing.successTitle", { defaultValue: "Payment Processed" }),
      t("admin:payrollProcessing.successMessage", {
        defaultValue: `Successfully processed ${formatCurrency(selectedTotal)} for ${selectedTeachers.size} teacher(s).`,
        count: selectedTeachers.size,
        amount: formatCurrency(selectedTotal),
      }),
      [
        {
          text: t("common:actions.done", { defaultValue: "Done" }),
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [selectedTeachers, selectedTotal, paymentMethod, trackEvent, navigation, t]);

  const handleTeacherDetail = useCallback((teacherId: string) => {
    trackEvent("payroll_processing_teacher_detail", { teacherId });
    navigation.navigate("teacher-payroll-detail", { teacherId, month });
  }, [navigation, month, trackEvent]);

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
  if (pendingTeachers.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
              {t("admin:payrollProcessing.title", { defaultValue: "Process Payroll" })}
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {getMonthName(month)}
            </AppText>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.centerContent}>
          <Icon name="check-circle" size={64} color={colors.success} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:payrollProcessing.allPaid", { defaultValue: "All Paid!" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:payrollProcessing.noPending", {
              defaultValue: "No pending salaries for this month.",
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
  // RENDER - Processing State
  // ===========================================================================
  if (isProcessing) {
    const progress = (processedCount / selectedTeachers.size) * 100;
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.processingTitle, { color: colors.onSurface }]}>
            {t("admin:payrollProcessing.processing", { defaultValue: "Processing Payments..." })}
          </AppText>
          <AppText style={[styles.processingCount, { color: colors.onSurfaceVariant }]}>
            {processedCount} / {selectedTeachers.size}
          </AppText>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progress}%` },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Success State
  // ===========================================================================
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
            {t("admin:payrollProcessing.title", { defaultValue: "Process Payroll" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {getMonthName(month)}
          </AppText>
        </View>

        <View style={styles.headerRight} />
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
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("admin:payrollProcessing.pendingPayroll", { defaultValue: "Pending Payroll" })}
            </AppText>
            <AppText style={[styles.summaryAmount, { color: colors.primary }]}>
              {formatCurrency(payrollData?.pendingAmount || 0)}
            </AppText>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
                {payrollData?.pendingCount || 0}
              </AppText>
              <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:payrollProcessing.teachers", { defaultValue: "Teachers" })}
              </AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryStat}>
              <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
                {selectedTeachers.size}
              </AppText>
              <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:payrollProcessing.selected", { defaultValue: "Selected" })}
              </AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryStat}>
              <AppText style={[styles.summaryStatValue, { color: colors.success }]}>
                {formatCurrency(selectedTotal)}
              </AppText>
              <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:payrollProcessing.toProcess", { defaultValue: "To Process" })}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Payment Method Selection */}
        <AppCard style={styles.methodCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("admin:payrollProcessing.paymentMethod", { defaultValue: "Payment Method" })}
          </AppText>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  {
                    backgroundColor:
                      paymentMethod === method.id ? `${colors.primary}15` : colors.surfaceVariant,
                    borderColor: paymentMethod === method.id ? colors.primary : "transparent",
                    borderRadius: borderRadius.medium,
                  },
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Icon
                  name={method.icon}
                  size={24}
                  color={paymentMethod === method.id ? colors.primary : colors.onSurfaceVariant}
                />
                <AppText
                  style={[
                    styles.methodLabel,
                    { color: paymentMethod === method.id ? colors.primary : colors.onSurfaceVariant },
                  ]}
                >
                  {method.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Teachers List */}
        <AppCard style={styles.teachersCard}>
          <View style={styles.teachersHeader}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:payrollProcessing.selectTeachers", { defaultValue: "Select Teachers" })}
            </AppText>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <Icon
                name={allSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={colors.primary}
              />
              <AppText style={[styles.selectAllText, { color: colors.primary }]}>
                {allSelected
                  ? t("admin:payrollProcessing.deselectAll", { defaultValue: "Deselect All" })
                  : t("admin:payrollProcessing.selectAll", { defaultValue: "Select All" })}
              </AppText>
            </TouchableOpacity>
          </View>

          {pendingTeachers.map((teacher, index) => (
            <TouchableOpacity
              key={teacher.id}
              style={[
                styles.teacherRow,
                index < pendingTeachers.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              onPress={() => handleToggleTeacher(teacher.id)}
              onLongPress={() => handleTeacherDetail(teacher.id)}
            >
              <Icon
                name={selectedTeachers.has(teacher.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={selectedTeachers.has(teacher.id) ? colors.primary : colors.onSurfaceVariant}
              />
              <View style={styles.teacherInfo}>
                <AppText style={[styles.teacherName, { color: colors.onSurface }]} numberOfLines={1}>
                  {teacher.name}
                </AppText>
                <AppText style={[styles.teacherDue, { color: colors.onSurfaceVariant }]}>
                  Due: {teacher.dueDate}
                </AppText>
              </View>
              <AppText style={[styles.teacherAmount, { color: colors.warning }]}>
                {formatCurrency(teacher.amount)}
              </AppText>
            </TouchableOpacity>
          ))}
        </AppCard>
      </ScrollView>

      {/* Process Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
        <TouchableOpacity
          style={[
            styles.processButton,
            {
              backgroundColor: selectedTeachers.size > 0 ? colors.primary : colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
          onPress={handleProcessPayroll}
          disabled={selectedTeachers.size === 0}
          accessibilityLabel={t("admin:payrollProcessing.processPayments", { defaultValue: "Process Payments" })}
          accessibilityRole="button"
        >
          <Icon name="credit-card-check" size={20} color={selectedTeachers.size > 0 ? "#FFF" : colors.onSurfaceVariant} />
          <AppText
            style={[
              styles.processButtonText,
              { color: selectedTeachers.size > 0 ? "#FFF" : colors.onSurfaceVariant },
            ]}
          >
            {selectedTeachers.size > 0
              ? t("admin:payrollProcessing.processAmount", {
                  defaultValue: `Process ${formatCurrency(selectedTotal)}`,
                  amount: formatCurrency(selectedTotal),
                })
              : t("admin:payrollProcessing.selectToProcess", { defaultValue: "Select Teachers to Process" })}
          </AppText>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  processingCount: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    padding: 4,
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
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryStat: {
    alignItems: "center",
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  summaryStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },

  methodCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  teachersCard: {
    padding: 16,
  },
  teachersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: "500",
  },
  teacherDue: {
    fontSize: 11,
    marginTop: 2,
  },
  teacherAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  processButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default PayrollProcessingScreen;
