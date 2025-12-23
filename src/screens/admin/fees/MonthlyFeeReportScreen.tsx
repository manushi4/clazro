/**
 * MonthlyFeeReportScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed fee collection report for a specific month
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: FeeCollectionTrendWidget, StudentFeesListScreen
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View monthly collection summary, daily breakdown, program breakdown
 * - Target role: admin, super_admin
 * - Screen ID: monthly-fee-report
 * - Route params: month (string), year (number)
 * - Data requirements: fee_payments table, student_fees table
 * - Required permissions: view_fees, view_reports
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing fee_payments and student_fees tables
 * - RLS: admin role can read where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useMonthlyFeeReportQuery: src/hooks/queries/admin/useMonthlyFeeReportQuery.ts
 * - Types: MonthlyFeeReport, DailyCollection, ProgramCollection, PaymentMethodBreakdown
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - File: src/screens/admin/fees/MonthlyFeeReportScreen.tsx
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
  Dimensions,
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
import { useMonthlyFeeReportQuery, DailyCollection, ProgramCollection, PaymentMethodBreakdown } from "../../../hooks/queries/admin/useMonthlyFeeReportQuery";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  month?: string;
  year?: number;
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
  });
};

const getMonthName = (month: string): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[parseInt(month) - 1] || 'Unknown';
};

// =============================================================================
// COMPONENT
// =============================================================================

export const MonthlyFeeReportScreen: React.FC<Props> = ({
  screenId = "monthly-fee-report",
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

  // Get route params with defaults
  const params = (route?.params || {}) as RouteParams;
  const currentDate = new Date();
  const month = params.month || String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = params.year || currentDate.getFullYear();

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "program" | "method">("daily");

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useMonthlyFeeReportQuery({
    month,
    year,
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
      data: { role, customerId, month, year },
    });

    trackEvent("monthly_fee_report_viewed", {
      screenId,
      month,
      year,
    });
  }, [screenId, role, customerId, month, year, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("monthly_fee_report_back_pressed");
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

  const handleDayPress = useCallback((day: DailyCollection) => {
    trackEvent("monthly_fee_report_day_pressed", { date: day.date });
    // Could navigate to daily detail screen
  }, [trackEvent]);

  const handleProgramPress = useCallback((program: ProgramCollection) => {
    trackEvent("monthly_fee_report_program_pressed", { program: program.program });
    navigation.navigate("student-fees-list", { filter: "program", program: program.program });
  }, [navigation, trackEvent]);

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
  if (!report) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.centerContent}>
          <Icon name="file-document-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:monthlyFeeReport.noData", { defaultValue: "No Report Data" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:monthlyFeeReport.noDataMessage", {
              defaultValue: "No fee collection data found for this month.",
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
            {report.monthName} {report.year}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {t("admin:monthlyFeeReport.subtitle", { defaultValue: "Fee Collection Report" })}
          </AppText>
        </View>

        <View style={styles.headerActionButton} />
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
            <Icon name="chart-line" size={32} color={colors.primary} />
            <View style={styles.summaryTitleContainer}>
              <AppText style={[styles.summaryTitle, { color: colors.onSurface }]}>
                {t("admin:monthlyFeeReport.collectionSummary", { defaultValue: "Collection Summary" })}
              </AppText>
              <View style={styles.growthBadge}>
                <Icon
                  name={report.growthVsLastMonth >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={report.growthVsLastMonth >= 0 ? "#4CAF50" : "#F44336"}
                />
                <AppText
                  style={[
                    styles.growthText,
                    { color: report.growthVsLastMonth >= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {Math.abs(report.growthVsLastMonth).toFixed(1)}% vs last month
                </AppText>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${colors.primary}15` }]}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(report.totalExpected)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:monthlyFeeReport.expected", { defaultValue: "Expected" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#4CAF5015" }]}>
              <AppText style={[styles.statValue, { color: "#4CAF50" }]}>
                {formatCurrency(report.totalCollected)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:monthlyFeeReport.collected", { defaultValue: "Collected" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#FF980015" }]}>
              <AppText style={[styles.statValue, { color: "#FF9800" }]}>
                {formatCurrency(report.totalPending)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:monthlyFeeReport.pending", { defaultValue: "Pending" })}
              </AppText>
            </View>
          </View>

          {/* Collection Rate */}
          <View style={styles.collectionRateContainer}>
            <View style={styles.collectionRateHeader}>
              <AppText style={[styles.collectionRateLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:monthlyFeeReport.collectionRate", { defaultValue: "Collection Rate" })}
              </AppText>
              <AppText style={[styles.collectionRateValue, { color: colors.primary }]}>
                {report.collectionRate.toFixed(1)}%
              </AppText>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: report.collectionRate >= 80 ? "#4CAF50" : report.collectionRate >= 60 ? "#FF9800" : "#F44336",
                    width: `${Math.min(report.collectionRate, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </AppCard>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, { backgroundColor: colors.surface }]}>
            <Icon name="account-group" size={24} color={colors.primary} />
            <AppText style={[styles.quickStatValue, { color: colors.onSurface }]}>
              {report.totalStudents}
            </AppText>
            <AppText style={[styles.quickStatLabel, { color: colors.onSurfaceVariant }]}>
              {t("admin:monthlyFeeReport.totalStudents", { defaultValue: "Students" })}
            </AppText>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: colors.surface }]}>
            <Icon name="receipt" size={24} color="#4CAF50" />
            <AppText style={[styles.quickStatValue, { color: colors.onSurface }]}>
              {report.totalTransactions}
            </AppText>
            <AppText style={[styles.quickStatLabel, { color: colors.onSurfaceVariant }]}>
              {t("admin:monthlyFeeReport.transactions", { defaultValue: "Transactions" })}
            </AppText>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: colors.surface }]}>
            <Icon name="cash" size={24} color="#FF9800" />
            <AppText style={[styles.quickStatValue, { color: colors.onSurface }]}>
              {formatCurrency(report.averageTransactionSize)}
            </AppText>
            <AppText style={[styles.quickStatLabel, { color: colors.onSurfaceVariant }]}>
              {t("admin:monthlyFeeReport.avgTransaction", { defaultValue: "Avg. Txn" })}
            </AppText>
          </View>
        </View>

        {/* Peak Collection Card */}
        <AppCard style={styles.peakCard}>
          <View style={styles.peakCardContent}>
            <Icon name="star" size={24} color="#FFD700" />
            <View style={styles.peakCardText}>
              <AppText style={[styles.peakCardTitle, { color: colors.onSurface }]}>
                {t("admin:monthlyFeeReport.peakCollection", { defaultValue: "Peak Collection Day" })}
              </AppText>
              <AppText style={[styles.peakCardValue, { color: colors.primary }]}>
                {formatDate(report.peakCollectionDay)} - {formatCurrency(report.peakCollectionAmount)}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "daily" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("daily")}
          >
            <Icon
              name="calendar"
              size={16}
              color={activeTab === "daily" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "daily" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:monthlyFeeReport.daily", { defaultValue: "Daily" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "program" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("program")}
          >
            <Icon
              name="school"
              size={16}
              color={activeTab === "program" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "program" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:monthlyFeeReport.byProgram", { defaultValue: "Program" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "method" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("method")}
          >
            <Icon
              name="credit-card"
              size={16}
              color={activeTab === "method" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "method" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:monthlyFeeReport.byMethod", { defaultValue: "Method" })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Daily Collections Tab */}
        {activeTab === "daily" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:monthlyFeeReport.dailyBreakdown", { defaultValue: "Daily Collection Breakdown" })}
            </AppText>
            {report.dailyCollections.map((day, index) => (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.listItem,
                  index < report.dailyCollections.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
                onPress={() => handleDayPress(day)}
              >
                <View style={styles.listItemLeft}>
                  <AppText style={[styles.listItemTitle, { color: colors.onSurface }]}>
                    {formatDate(day.date)}
                  </AppText>
                  <AppText style={[styles.listItemSubtitle, { color: colors.onSurfaceVariant }]}>
                    {day.studentCount} students • {day.transactions} transactions
                  </AppText>
                </View>
                <AppText style={[styles.listItemValue, { color: "#4CAF50" }]}>
                  {formatCurrency(day.amount)}
                </AppText>
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Program Breakdown Tab */}
        {activeTab === "program" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:monthlyFeeReport.programBreakdown", { defaultValue: "Program-wise Collection" })}
            </AppText>
            {report.byProgram.map((program, index) => (
              <TouchableOpacity
                key={program.program}
                style={[
                  styles.programItem,
                  index < report.byProgram.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
                onPress={() => handleProgramPress(program)}
              >
                <View style={styles.programHeader}>
                  <AppText style={[styles.programName, { color: colors.onSurface }]}>
                    {program.program}
                  </AppText>
                  <AppText style={[styles.programStudents, { color: colors.onSurfaceVariant }]}>
                    {program.studentCount} students
                  </AppText>
                </View>
                <View style={styles.programStats}>
                  <View style={styles.programStatItem}>
                    <AppText style={[styles.programStatLabel, { color: colors.onSurfaceVariant }]}>
                      Expected
                    </AppText>
                    <AppText style={[styles.programStatValue, { color: colors.onSurface }]}>
                      {formatCurrency(program.expected)}
                    </AppText>
                  </View>
                  <View style={styles.programStatItem}>
                    <AppText style={[styles.programStatLabel, { color: colors.onSurfaceVariant }]}>
                      Collected
                    </AppText>
                    <AppText style={[styles.programStatValue, { color: "#4CAF50" }]}>
                      {formatCurrency(program.collected)}
                    </AppText>
                  </View>
                  <View style={styles.programStatItem}>
                    <AppText style={[styles.programStatLabel, { color: colors.onSurfaceVariant }]}>
                      Rate
                    </AppText>
                    <AppText
                      style={[
                        styles.programStatValue,
                        { color: program.collectionRate >= 80 ? "#4CAF50" : program.collectionRate >= 60 ? "#FF9800" : "#F44336" },
                      ]}
                    >
                      {program.collectionRate.toFixed(0)}%
                    </AppText>
                  </View>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant, marginTop: 8 }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: program.collectionRate >= 80 ? "#4CAF50" : program.collectionRate >= 60 ? "#FF9800" : "#F44336",
                        width: `${Math.min(program.collectionRate, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Payment Method Tab */}
        {activeTab === "method" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:monthlyFeeReport.paymentMethods", { defaultValue: "Payment Method Breakdown" })}
            </AppText>
            {report.byPaymentMethod.map((method, index) => {
              const methodIcons: Record<string, string> = {
                UPI: "cellphone",
                "Net Banking": "bank",
                Cash: "cash",
                Card: "credit-card",
                Cheque: "checkbook",
              };
              return (
                <View
                  key={method.method}
                  style={[
                    styles.methodItem,
                    index < report.byPaymentMethod.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.methodLeft}>
                    <View style={[styles.methodIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Icon name={methodIcons[method.method] || "cash"} size={20} color={colors.primary} />
                    </View>
                    <View>
                      <AppText style={[styles.methodName, { color: colors.onSurface }]}>
                        {method.method}
                      </AppText>
                      <AppText style={[styles.methodCount, { color: colors.onSurfaceVariant }]}>
                        {method.transactionCount} transactions
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.methodRight}>
                    <AppText style={[styles.methodAmount, { color: "#4CAF50" }]}>
                      {formatCurrency(method.amount)}
                    </AppText>
                    <AppText style={[styles.methodPercentage, { color: colors.onSurfaceVariant }]}>
                      {method.percentage.toFixed(1)}%
                    </AppText>
                  </View>
                </View>
              );
            })}
          </AppCard>
        )}

        {/* Top Collectors Card */}
        <AppCard style={styles.listCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("admin:monthlyFeeReport.topCollectors", { defaultValue: "Top Collectors" })}
          </AppText>
          {report.topCollectors.slice(0, 5).map((collector, index) => (
            <View
              key={collector.id}
              style={[
                styles.collectorItem,
                index < Math.min(report.topCollectors.length, 5) - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.collectorRank}>
                <AppText style={[styles.collectorRankText, { color: index < 3 ? "#FFD700" : colors.onSurfaceVariant }]}>
                  #{index + 1}
                </AppText>
              </View>
              <View style={styles.collectorInfo}>
                <AppText style={[styles.collectorName, { color: colors.onSurface }]}>
                  {collector.name}
                </AppText>
                <AppText style={[styles.collectorStudents, { color: colors.onSurfaceVariant }]}>
                  {collector.studentCount} students
                </AppText>
              </View>
              <AppText style={[styles.collectorAmount, { color: "#4CAF50" }]}>
                {formatCurrency(collector.amount)}
              </AppText>
            </View>
          ))}
        </AppCard>

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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  growthText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  collectionRateContainer: {
    marginTop: 8,
  },
  collectionRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collectionRateLabel: {
    fontSize: 13,
  },
  collectionRateValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  quickStatsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  peakCard: {
    padding: 12,
    marginBottom: 12,
  },
  peakCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  peakCardText: {
    marginLeft: 12,
  },
  peakCardTitle: {
    fontSize: 12,
  },
  peakCardValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
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
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  listCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  listItemSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  programItem: {
    paddingVertical: 12,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  programName: {
    fontSize: 14,
    fontWeight: "600",
  },
  programStudents: {
    fontSize: 11,
  },
  programStats: {
    flexDirection: "row",
    marginTop: 8,
  },
  programStatItem: {
    flex: 1,
  },
  programStatLabel: {
    fontSize: 10,
  },
  programStatValue: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "500",
  },
  methodCount: {
    fontSize: 11,
    marginTop: 2,
  },
  methodRight: {
    alignItems: "flex-end",
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  methodPercentage: {
    fontSize: 11,
    marginTop: 2,
  },
  collectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  collectorRank: {
    width: 32,
  },
  collectorRankText: {
    fontSize: 14,
    fontWeight: "700",
  },
  collectorInfo: {
    flex: 1,
  },
  collectorName: {
    fontSize: 14,
    fontWeight: "500",
  },
  collectorStudents: {
    fontSize: 11,
    marginTop: 2,
  },
  collectorAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 24,
  },
});