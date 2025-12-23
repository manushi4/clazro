/**
 * FeeReportsScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display comprehensive fee reports with filtering and drill-down capabilities
 * Type: Fixed (custom component with report functionality)
 * Accessible from: FeeCollectionTrendWidget, Finance Dashboard
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View fee reports by period, program, and payment method
 * - Target role: admin, super_admin
 * - Screen ID: fee-reports
 * - Route params: period (optional), year (optional)
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
 * - useFeeReportsQuery: src/hooks/queries/admin/useFeeReportsQuery.ts
 * - Types: FeeReport, MonthlyReport, ProgramReport
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - File: src/screens/admin/fees/FeeReportsScreen.tsx
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading, Error, Empty, Success states
 * - OfflineBanner at top
 * - Track screen view with useAnalytics
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
  period?: "month" | "quarter" | "year";
  year?: number;
};

type MonthlyReport = {
  month: string;
  monthName: string;
  year: number;
  expected: number;
  collected: number;
  pending: number;
  collectionRate: number;
  studentCount: number;
  transactions: number;
};

type ProgramReport = {
  program: string;
  expected: number;
  collected: number;
  pending: number;
  collectionRate: number;
  studentCount: number;
};

type FeeReportData = {
  year: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  overallCollectionRate: number;
  monthlyReports: MonthlyReport[];
  programReports: ProgramReport[];
  yearOverYearGrowth: number;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_FEE_REPORTS: Record<number, FeeReportData> = {
  2024: {
    year: 2024,
    totalExpected: 52000000,
    totalCollected: 42000000,
    totalPending: 10000000,
    overallCollectionRate: 80.8,
    yearOverYearGrowth: 12.5,
    monthlyReports: [
      { month: "01", monthName: "January", year: 2024, expected: 4500000, collected: 3800000, pending: 700000, collectionRate: 84.4, studentCount: 180, transactions: 165 },
      { month: "02", monthName: "February", year: 2024, expected: 4200000, collected: 3500000, pending: 700000, collectionRate: 83.3, studentCount: 175, transactions: 158 },
      { month: "03", monthName: "March", year: 2024, expected: 4800000, collected: 4000000, pending: 800000, collectionRate: 83.3, studentCount: 190, transactions: 172 },
      { month: "04", monthName: "April", year: 2024, expected: 4000000, collected: 3200000, pending: 800000, collectionRate: 80.0, studentCount: 160, transactions: 145 },
      { month: "05", monthName: "May", year: 2024, expected: 4300000, collected: 3400000, pending: 900000, collectionRate: 79.1, studentCount: 172, transactions: 155 },
      { month: "06", monthName: "June", year: 2024, expected: 4600000, collected: 3700000, pending: 900000, collectionRate: 80.4, studentCount: 184, transactions: 168 },
      { month: "07", monthName: "July", year: 2024, expected: 5000000, collected: 4200000, pending: 800000, collectionRate: 84.0, studentCount: 200, transactions: 185 },
      { month: "08", monthName: "August", year: 2024, expected: 4800000, collected: 3900000, pending: 900000, collectionRate: 81.3, studentCount: 192, transactions: 175 },
      { month: "09", monthName: "September", year: 2024, expected: 4400000, collected: 3500000, pending: 900000, collectionRate: 79.5, studentCount: 176, transactions: 160 },
      { month: "10", monthName: "October", year: 2024, expected: 4200000, collected: 3300000, pending: 900000, collectionRate: 78.6, studentCount: 168, transactions: 152 },
      { month: "11", monthName: "November", year: 2024, expected: 3800000, collected: 2900000, pending: 900000, collectionRate: 76.3, studentCount: 152, transactions: 138 },
      { month: "12", monthName: "December", year: 2024, expected: 3400000, collected: 2600000, pending: 800000, collectionRate: 76.5, studentCount: 136, transactions: 124 },
    ],
    programReports: [
      { program: "JEE Advanced", expected: 18000000, collected: 15000000, pending: 3000000, collectionRate: 83.3, studentCount: 120 },
      { program: "JEE Mains", expected: 14000000, collected: 11200000, pending: 2800000, collectionRate: 80.0, studentCount: 140 },
      { program: "NEET", expected: 12000000, collected: 9600000, pending: 2400000, collectionRate: 80.0, studentCount: 100 },
      { program: "Foundation XI", expected: 5000000, collected: 4000000, pending: 1000000, collectionRate: 80.0, studentCount: 80 },
      { program: "Foundation XII", expected: 3000000, collected: 2200000, pending: 800000, collectionRate: 73.3, studentCount: 60 },
    ],
  },
  2025: {
    year: 2025,
    totalExpected: 58000000,
    totalCollected: 12000000,
    totalPending: 46000000,
    overallCollectionRate: 20.7,
    yearOverYearGrowth: 15.2,
    monthlyReports: [
      { month: "01", monthName: "January", year: 2025, expected: 5200000, collected: 4500000, pending: 700000, collectionRate: 86.5, studentCount: 208, transactions: 190 },
      { month: "02", monthName: "February", year: 2025, expected: 4800000, collected: 4000000, pending: 800000, collectionRate: 83.3, studentCount: 192, transactions: 175 },
      { month: "03", monthName: "March", year: 2025, expected: 5000000, collected: 3500000, pending: 1500000, collectionRate: 70.0, studentCount: 200, transactions: 160 },
    ],
    programReports: [
      { program: "JEE Advanced", expected: 20000000, collected: 4500000, pending: 15500000, collectionRate: 22.5, studentCount: 130 },
      { program: "JEE Mains", expected: 16000000, collected: 3200000, pending: 12800000, collectionRate: 20.0, studentCount: 160 },
      { program: "NEET", expected: 14000000, collected: 2800000, pending: 11200000, collectionRate: 20.0, studentCount: 120 },
      { program: "Foundation XI", expected: 5000000, collected: 1000000, pending: 4000000, collectionRate: 20.0, studentCount: 90 },
      { program: "Foundation XII", expected: 3000000, collected: 500000, pending: 2500000, collectionRate: 16.7, studentCount: 70 },
    ],
  },
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

const getCollectionRateColor = (rate: number): string => {
  if (rate >= 80) return "#4CAF50";
  if (rate >= 60) return "#FF9800";
  return "#F44336";
};

// =============================================================================
// COMPONENT
// =============================================================================

export const FeeReportsScreen: React.FC<Props> = ({
  screenId = "fee-reports",
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
  const initialYear = params.year || currentDate.getFullYear();

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [activeTab, setActiveTab] = useState<"monthly" | "program">("monthly");
  const [reportData, setReportData] = useState<FeeReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      const data = DEMO_FEE_REPORTS[selectedYear] || DEMO_FEE_REPORTS[2024];
      setReportData(data);
    } catch (err) {
      setError("Failed to load fee reports");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, year: selectedYear },
    });
    loadData();
  }, [screenId, role, customerId, selectedYear, trackScreenView, loadData]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("fee_reports_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleYearChange = useCallback((year: number) => {
    trackEvent("fee_reports_year_changed", { year });
    setSelectedYear(year);
    setIsLoading(true);
  }, [trackEvent]);

  const handleMonthPress = useCallback((month: MonthlyReport) => {
    trackEvent("fee_reports_month_pressed", { month: month.month, year: month.year });
    navigation.navigate("monthly-fee-report", { month: month.month, year: month.year });
  }, [navigation, trackEvent]);

  const handleProgramPress = useCallback((program: ProgramReport) => {
    trackEvent("fee_reports_program_pressed", { program: program.program });
    navigation.navigate("student-fees-list", { filter: "program", program: program.program });
  }, [navigation, trackEvent]);

  // ===========================================================================
  // RENDER - Loading State
  // ===========================================================================
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Oops!" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {error}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={loadData}
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
  if (!reportData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="file-document-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:feeReports.noData", { defaultValue: "No Report Data" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:feeReports.noDataMessage", { defaultValue: "No fee reports found for this year." })}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
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
            {t("admin:feeReports.title", { defaultValue: "Fee Reports" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {selectedYear}
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
        {/* Year Selector */}
        <View style={styles.yearSelector}>
          {[2024, 2025].map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && { backgroundColor: colors.primaryContainer },
                { borderRadius: borderRadius.medium },
              ]}
              onPress={() => handleYearChange(year)}
            >
              <AppText
                style={[
                  styles.yearButtonText,
                  { color: selectedYear === year ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {year}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="chart-pie" size={28} color={colors.primary} />
            <View style={styles.summaryTitleContainer}>
              <AppText style={[styles.summaryTitle, { color: colors.onSurface }]}>
                {t("admin:feeReports.yearSummary", { defaultValue: "Year Summary" })}
              </AppText>
              <View style={styles.growthBadge}>
                <Icon
                  name={reportData.yearOverYearGrowth >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={reportData.yearOverYearGrowth >= 0 ? "#4CAF50" : "#F44336"}
                />
                <AppText
                  style={[
                    styles.growthText,
                    { color: reportData.yearOverYearGrowth >= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {Math.abs(reportData.yearOverYearGrowth).toFixed(1)}% YoY
                </AppText>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${colors.primary}15` }]}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(reportData.totalExpected)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:feeReports.expected", { defaultValue: "Expected" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#4CAF5015" }]}>
              <AppText style={[styles.statValue, { color: "#4CAF50" }]}>
                {formatCurrency(reportData.totalCollected)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:feeReports.collected", { defaultValue: "Collected" })}
              </AppText>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#FF980015" }]}>
              <AppText style={[styles.statValue, { color: "#FF9800" }]}>
                {formatCurrency(reportData.totalPending)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:feeReports.pending", { defaultValue: "Pending" })}
              </AppText>
            </View>
          </View>

          {/* Collection Rate */}
          <View style={styles.collectionRateContainer}>
            <View style={styles.collectionRateHeader}>
              <AppText style={[styles.collectionRateLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:feeReports.collectionRate", { defaultValue: "Collection Rate" })}
              </AppText>
              <AppText style={[styles.collectionRateValue, { color: getCollectionRateColor(reportData.overallCollectionRate) }]}>
                {reportData.overallCollectionRate.toFixed(1)}%
              </AppText>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: getCollectionRateColor(reportData.overallCollectionRate),
                    width: `${Math.min(reportData.overallCollectionRate, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </AppCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "monthly" && { backgroundColor: colors.surface }]}
            onPress={() => setActiveTab("monthly")}
          >
            <Icon
              name="calendar-month"
              size={16}
              color={activeTab === "monthly" ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[styles.tabText, { color: activeTab === "monthly" ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t("admin:feeReports.monthly", { defaultValue: "Monthly" })}
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
              {t("admin:feeReports.byProgram", { defaultValue: "By Program" })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Monthly Reports Tab */}
        {activeTab === "monthly" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:feeReports.monthlyBreakdown", { defaultValue: "Monthly Breakdown" })}
            </AppText>
            {reportData.monthlyReports.map((month, index) => (
              <TouchableOpacity
                key={`${month.year}-${month.month}`}
                style={[
                  styles.listItem,
                  index < reportData.monthlyReports.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
                onPress={() => handleMonthPress(month)}
              >
                <View style={styles.listItemLeft}>
                  <AppText style={[styles.listItemTitle, { color: colors.onSurface }]}>
                    {month.monthName}
                  </AppText>
                  <AppText style={[styles.listItemSubtitle, { color: colors.onSurfaceVariant }]}>
                    {month.studentCount} students • {month.transactions} transactions
                  </AppText>
                </View>
                <View style={styles.listItemRight}>
                  <AppText style={[styles.listItemValue, { color: "#4CAF50" }]}>
                    {formatCurrency(month.collected)}
                  </AppText>
                  <AppText
                    style={[
                      styles.listItemRate,
                      { color: getCollectionRateColor(month.collectionRate) },
                    ]}
                  >
                    {month.collectionRate.toFixed(0)}%
                  </AppText>
                </View>
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Program Reports Tab */}
        {activeTab === "program" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:feeReports.programBreakdown", { defaultValue: "Program-wise Collection" })}
            </AppText>
            {reportData.programReports.map((program, index) => (
              <TouchableOpacity
                key={program.program}
                style={[
                  styles.programItem,
                  index < reportData.programReports.length - 1 && {
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
                        { color: getCollectionRateColor(program.collectionRate) },
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
                        backgroundColor: getCollectionRateColor(program.collectionRate),
                        width: `${Math.min(program.collectionRate, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </AppCard>
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
    fontSize: 18,
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
    color: "#FFFFFF",
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
  headerActionButton: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  yearSelector: {
    flexDirection: "row",
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
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
    fontSize: 12,
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
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
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
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
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
  listItemRight: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  listItemRate: {
    fontSize: 11,
    marginTop: 2,
  },
  programItem: {
    paddingVertical: 12,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    justifyContent: "space-between",
  },
  programStatItem: {
    alignItems: "center",
  },
  programStatLabel: {
    fontSize: 10,
  },
  programStatValue: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
});

export default FeeReportsScreen;
