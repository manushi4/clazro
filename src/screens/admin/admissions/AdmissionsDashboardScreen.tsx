/**
 * AdmissionsDashboardScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display comprehensive admission analytics with funnel visualization,
 *          program breakdown, source analysis, and recent activity
 * Type: Dynamic (dashboard with analytics)
 * Accessible from: AdmissionStatsWidget "View All" tap (when configured for dashboard)
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View detailed admission analytics and management
 * - Target role: admin, super_admin
 * - Screen ID: admissions-dashboard
 * - Route params: period (optional: 'month' | 'quarter' | 'year')
 * - Data requirements: admissions table
 * - Required permissions: view_admissions, view_analytics
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing admissions table (created in Phase 5 of admin_demo.md)
 * - RLS: admin role can read where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useAdmissionStatsQuery: src/hooks/queries/admin/useAdmissionStatsQuery.ts
 * - Types: AdmissionStats
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
};

type AdmissionSummary = {
  totalInquiries: number;
  totalAdmitted: number;
  conversionRate: number;
  inquiriesTrend: number;
  admittedTrend: number;
  conversionTrend: number;
  pendingFollowUps: number;
};

type ProgramStats = {
  program: string;
  inquiries: number;
  admitted: number;
  percentage: number;
  conversionRate: number;
};

type SourceStats = {
  source: string;
  count: number;
  percentage: number;
  icon: string;
};

type FunnelStage = {
  stage: string;
  count: number;
  percentage: number;
  color: string;
};

type RecentAdmission = {
  id: string;
  studentName: string;
  program: string;
  status: string;
  date: string;
  counselor: string;
};

type MonthlyTrend = {
  month: string;
  inquiries: number;
  admitted: number;
};


// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_SUMMARY: AdmissionSummary = {
  totalInquiries: 156,
  totalAdmitted: 89,
  conversionRate: 57,
  inquiriesTrend: 23,
  admittedTrend: 18,
  conversionTrend: 5,
  pendingFollowUps: 23,
};

const DEMO_PROGRAM_STATS: ProgramStats[] = [
  { program: "JEE", inquiries: 68, admitted: 45, percentage: 51, conversionRate: 66 },
  { program: "NEET", inquiries: 52, admitted: 32, percentage: 36, conversionRate: 62 },
  { program: "Foundation", inquiries: 36, admitted: 12, percentage: 13, conversionRate: 33 },
];

const DEMO_SOURCE_STATS: SourceStats[] = [
  { source: "Walk-in", count: 45, percentage: 29, icon: "walk" },
  { source: "Website", count: 38, percentage: 24, icon: "web" },
  { source: "Referral", count: 32, percentage: 21, icon: "account-group" },
  { source: "Advertisement", count: 25, percentage: 16, icon: "bullhorn" },
  { source: "Social Media", count: 16, percentage: 10, icon: "instagram" },
];

const DEMO_FUNNEL: FunnelStage[] = [
  { stage: "Inquiries", count: 156, percentage: 100, color: "#2196F3" },
  { stage: "Demo Scheduled", count: 112, percentage: 72, color: "#03A9F4" },
  { stage: "Demo Done", count: 98, percentage: 63, color: "#00BCD4" },
  { stage: "Negotiation", count: 95, percentage: 61, color: "#009688" },
  { stage: "Admitted", count: 89, percentage: 57, color: "#4CAF50" },
];

const DEMO_RECENT: RecentAdmission[] = [
  { id: "r1", studentName: "Arjun Mehta", program: "JEE", status: "admitted", date: "2024-12-20", counselor: "Ms. Priya" },
  { id: "r2", studentName: "Sneha Gupta", program: "NEET", status: "admitted", date: "2024-12-19", counselor: "Mr. Sharma" },
  { id: "r3", studentName: "Rahul Singh", program: "JEE", status: "admitted", date: "2024-12-18", counselor: "Ms. Priya" },
  { id: "r4", studentName: "Priya Patel", program: "Foundation", status: "admitted", date: "2024-12-17", counselor: "Mr. Sharma" },
  { id: "r5", studentName: "Amit Kumar", program: "NEET", status: "admitted", date: "2024-12-16", counselor: "Ms. Priya" },
];

const DEMO_MONTHLY_TREND: MonthlyTrend[] = [
  { month: "Jul", inquiries: 120, admitted: 65 },
  { month: "Aug", inquiries: 135, admitted: 72 },
  { month: "Sep", inquiries: 142, admitted: 78 },
  { month: "Oct", inquiries: 128, admitted: 70 },
  { month: "Nov", inquiries: 145, admitted: 82 },
  { month: "Dec", inquiries: 156, admitted: 89 },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
};

const PERIOD_OPTIONS = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getTrendIcon = (trend: number): string => {
  if (trend > 0) return "trending-up";
  if (trend < 0) return "trending-down";
  return "minus";
};

const getTrendColor = (trend: number, colors: any): string => {
  if (trend > 0) return colors.success || "#4CAF50";
  if (trend < 0) return colors.error || "#F44336";
  return colors.onSurfaceVariant;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};


// =============================================================================
// COMPONENT
// =============================================================================

export const AdmissionsDashboardScreen: React.FC<Props> = ({
  screenId = "admissions-dashboard",
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
  const initialPeriod = params.period || "month";

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [summary, setSummary] = useState<AdmissionSummary>(DEMO_SUMMARY);
  const [programStats, setProgramStats] = useState<ProgramStats[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSummary(DEMO_SUMMARY);
      setProgramStats(DEMO_PROGRAM_STATS);
      setSourceStats(DEMO_SOURCE_STATS);
      setFunnel(DEMO_FUNNEL);
      setRecentAdmissions(DEMO_RECENT);
      setMonthlyTrend(DEMO_MONTHLY_TREND);
    } catch (err) {
      setError("Failed to load admission data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, period: initialPeriod },
    });
    loadData();
  }, [screenId, role, customerId, initialPeriod, trackScreenView, loadData]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("admissions_dashboard_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleViewAllAdmissions = useCallback(() => {
    trackEvent("admissions_dashboard_view_all");
    navigation.navigate("admissions-list", {});
  }, [navigation, trackEvent]);

  const handleInquiriesTap = useCallback(() => {
    trackEvent("admissions_dashboard_inquiries_tap");
    navigation.navigate("admissions-list", { status: "inquiry" });
  }, [navigation, trackEvent]);

  const handleAdmittedTap = useCallback(() => {
    trackEvent("admissions_dashboard_admitted_tap");
    navigation.navigate("admissions-list", { status: "admitted" });
  }, [navigation, trackEvent]);

  const handlePendingFollowUpTap = useCallback(() => {
    trackEvent("admissions_dashboard_pending_followup_tap");
    navigation.navigate("admissions-list", { status: "follow-up" });
  }, [navigation, trackEvent]);

  const handleProgramTap = useCallback(
    (program: string) => {
      trackEvent("admissions_dashboard_program_tap", { program });
      navigation.navigate("admissions-list", { program });
    },
    [navigation, trackEvent]
  );

  const handleAddInquiry = useCallback(() => {
    trackEvent("admissions_dashboard_add_inquiry");
    navigation.navigate("admission-create", {});
  }, [navigation, trackEvent]);

  const handleRecentAdmissionTap = useCallback(
    (admission: RecentAdmission) => {
      trackEvent("admissions_dashboard_recent_tap", { admissionId: admission.id });
      navigation.navigate("admission-detail", { admissionId: admission.id });
    },
    [navigation, trackEvent]
  );

  const handleFunnelStageTap = useCallback(
    (stage: FunnelStage) => {
      trackEvent("admissions_dashboard_funnel_tap", { stage: stage.stage });
      const statusMap: Record<string, string> = {
        "Inquiries": "inquiry",
        "Demo Scheduled": "demo-scheduled",
        "Demo Done": "demo-done",
        "Negotiation": "negotiation",
        "Admitted": "admitted",
      };
      navigation.navigate("admissions-list", { status: statusMap[stage.stage] || "inquiry" });
    },
    [navigation, trackEvent]
  );


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
  // RENDER - Success State
  // ===========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:admissionsDashboard.title", { defaultValue: "Admissions Dashboard" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            December 2024
          </AppText>
        </View>
        <TouchableOpacity onPress={handleAddInquiry} style={styles.addBtn}>
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={[styles.periodContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.periodChip,
                {
                  backgroundColor: selectedPeriod === opt.value ? colors.primaryContainer : "transparent",
                  borderRadius: borderRadius.medium,
                },
              ]}
              onPress={() => setSelectedPeriod(opt.value)}
            >
              <AppText
                style={[
                  styles.periodText,
                  { color: selectedPeriod === opt.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {opt.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Stats Cards */}
        <View style={styles.statsCardsRow}>
          <TouchableOpacity
            style={[styles.statsCard, { backgroundColor: colors.surface }]}
            onPress={handleInquiriesTap}
          >
            <Icon name="help-circle-outline" size={24} color={colors.primary} />
            <AppText style={[styles.statsCardValue, { color: colors.onSurface }]}>
              {summary.totalInquiries}
            </AppText>
            <AppText style={[styles.statsCardLabel, { color: colors.onSurfaceVariant }]}>
              Inquiries
            </AppText>
            <View style={styles.trendRow}>
              <Icon
                name={getTrendIcon(summary.inquiriesTrend)}
                size={14}
                color={getTrendColor(summary.inquiriesTrend, colors)}
              />
              <AppText style={[styles.trendText, { color: getTrendColor(summary.inquiriesTrend, colors) }]}>
                {summary.inquiriesTrend > 0 ? "+" : ""}{summary.inquiriesTrend}%
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statsCard, { backgroundColor: colors.surface }]}
            onPress={handleAdmittedTap}
          >
            <Icon name="check-circle-outline" size={24} color={colors.success} />
            <AppText style={[styles.statsCardValue, { color: colors.onSurface }]}>
              {summary.totalAdmitted}
            </AppText>
            <AppText style={[styles.statsCardLabel, { color: colors.onSurfaceVariant }]}>
              Admitted
            </AppText>
            <View style={styles.trendRow}>
              <Icon
                name={getTrendIcon(summary.admittedTrend)}
                size={14}
                color={getTrendColor(summary.admittedTrend, colors)}
              />
              <AppText style={[styles.trendText, { color: getTrendColor(summary.admittedTrend, colors) }]}>
                {summary.admittedTrend > 0 ? "+" : ""}{summary.admittedTrend}%
              </AppText>
            </View>
          </TouchableOpacity>

          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <Icon name="percent" size={24} color={colors.tertiary || colors.secondary} />
            <AppText style={[styles.statsCardValue, { color: colors.onSurface }]}>
              {summary.conversionRate}%
            </AppText>
            <AppText style={[styles.statsCardLabel, { color: colors.onSurfaceVariant }]}>
              Conversion
            </AppText>
            <View style={styles.trendRow}>
              <Icon
                name={getTrendIcon(summary.conversionTrend)}
                size={14}
                color={getTrendColor(summary.conversionTrend, colors)}
              />
              <AppText style={[styles.trendText, { color: getTrendColor(summary.conversionTrend, colors) }]}>
                {summary.conversionTrend > 0 ? "+" : ""}{summary.conversionTrend}%
              </AppText>
            </View>
          </View>
        </View>


        {/* Conversion Funnel */}
        <AppCard style={styles.funnelCard}>
          <View style={styles.sectionHeader}>
            <Icon name="filter-variant" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Conversion Funnel
            </AppText>
          </View>
          <View style={styles.funnelContainer}>
            {funnel.map((stage, index) => (
              <TouchableOpacity
                key={stage.stage}
                style={styles.funnelStage}
                onPress={() => handleFunnelStageTap(stage)}
              >
                <View style={styles.funnelBarContainer}>
                  <View
                    style={[
                      styles.funnelBar,
                      {
                        width: `${stage.percentage}%`,
                        backgroundColor: stage.color,
                        borderRadius: borderRadius.small,
                      },
                    ]}
                  />
                </View>
                <View style={styles.funnelLabelRow}>
                  <AppText style={[styles.funnelLabel, { color: colors.onSurface }]}>
                    {stage.stage}
                  </AppText>
                  <AppText style={[styles.funnelCount, { color: colors.onSurfaceVariant }]}>
                    {stage.count} ({stage.percentage}%)
                  </AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Program Breakdown */}
        <AppCard style={styles.programCard}>
          <View style={styles.sectionHeader}>
            <Icon name="school" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              By Program
            </AppText>
          </View>
          {programStats.map((program) => (
            <TouchableOpacity
              key={program.program}
              style={[styles.programItem, { borderBottomColor: colors.outlineVariant }]}
              onPress={() => handleProgramTap(program.program)}
            >
              <View style={styles.programInfo}>
                <View style={styles.programNameRow}>
                  <View
                    style={[
                      styles.programDot,
                      { backgroundColor: PROGRAM_COLORS[program.program] || colors.primary },
                    ]}
                  />
                  <AppText style={[styles.programName, { color: colors.onSurface }]}>
                    {program.program}
                  </AppText>
                </View>
                <View style={styles.programStatsRow}>
                  <AppText style={[styles.programStat, { color: colors.onSurfaceVariant }]}>
                    {program.inquiries} inquiries
                  </AppText>
                  <AppText style={[styles.programStat, { color: colors.success }]}>
                    {program.admitted} admitted
                  </AppText>
                </View>
              </View>
              <View style={styles.programRight}>
                <AppText style={[styles.programPercentage, { color: colors.primary }]}>
                  {program.conversionRate}%
                </AppText>
                <AppText style={[styles.programConvLabel, { color: colors.onSurfaceVariant }]}>
                  conversion
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </AppCard>

        {/* Source Analysis */}
        <AppCard style={styles.sourceCard}>
          <View style={styles.sectionHeader}>
            <Icon name="source-branch" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Lead Sources
            </AppText>
          </View>
          <View style={styles.sourceList}>
            {sourceStats.map((source) => (
              <View key={source.source} style={styles.sourceItem}>
                <View style={[styles.sourceIconContainer, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon name={source.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.sourceInfo}>
                  <AppText style={[styles.sourceName, { color: colors.onSurface }]}>
                    {source.source}
                  </AppText>
                  <View style={[styles.sourceBarContainer, { backgroundColor: colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.sourceBarFill,
                        {
                          width: `${source.percentage}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
                <AppText style={[styles.sourceCount, { color: colors.onSurfaceVariant }]}>
                  {source.count} ({source.percentage}%)
                </AppText>
              </View>
            ))}
          </View>
        </AppCard>

        {/* Monthly Trend Chart */}
        <AppCard style={styles.trendCard}>
          <View style={styles.sectionHeader}>
            <Icon name="chart-line" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Monthly Trend
            </AppText>
          </View>
          <View style={styles.trendChart}>
            {monthlyTrend.map((month) => (
              <View key={month.month} style={styles.trendBarContainer}>
                <View style={styles.trendBarsWrapper}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: (month.inquiries / 160) * 60,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: (month.admitted / 160) * 60,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
                <AppText style={[styles.trendMonthLabel, { color: colors.onSurfaceVariant }]}>
                  {month.month}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>Inquiries</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>Admitted</AppText>
            </View>
          </View>
        </AppCard>


        {/* Pending Follow-ups Alert */}
        {summary.pendingFollowUps > 0 && (
          <TouchableOpacity
            style={[styles.pendingAlert, { backgroundColor: `${colors.warning}15` }]}
            onPress={handlePendingFollowUpTap}
          >
            <Icon name="clock-alert-outline" size={20} color={colors.warning} />
            <View style={styles.pendingAlertContent}>
              <AppText style={[styles.pendingAlertTitle, { color: colors.warning }]}>
                {summary.pendingFollowUps} Pending Follow-ups
              </AppText>
              <AppText style={[styles.pendingAlertSubtitle, { color: colors.onSurfaceVariant }]}>
                Tap to view and take action
              </AppText>
            </View>
            <Icon name="chevron-right" size={20} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Recent Admissions */}
        <AppCard style={styles.recentCard}>
          <View style={styles.sectionHeader}>
            <Icon name="history" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Recent Admissions
            </AppText>
            <TouchableOpacity onPress={handleViewAllAdmissions}>
              <AppText style={[styles.viewAllText, { color: colors.primary }]}>View All</AppText>
            </TouchableOpacity>
          </View>
          {recentAdmissions.map((admission) => (
            <TouchableOpacity
              key={admission.id}
              style={[styles.recentItem, { borderBottomColor: colors.outlineVariant }]}
              onPress={() => handleRecentAdmissionTap(admission)}
            >
              <View
                style={[
                  styles.recentAvatar,
                  { backgroundColor: PROGRAM_COLORS[admission.program] || colors.primaryContainer },
                ]}
              >
                <AppText style={styles.recentAvatarText}>
                  {admission.studentName.charAt(0)}
                </AppText>
              </View>
              <View style={styles.recentInfo}>
                <AppText style={[styles.recentName, { color: colors.onSurface }]}>
                  {admission.studentName}
                </AppText>
                <AppText style={[styles.recentDetail, { color: colors.onSurfaceVariant }]}>
                  {admission.program} • {formatDate(admission.date)} • {admission.counselor}
                </AppText>
              </View>
              <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </AppCard>

        {/* Add New Inquiry Button */}
        <TouchableOpacity
          style={[styles.addInquiryButton, { backgroundColor: colors.primary }]}
          onPress={handleAddInquiry}
        >
          <Icon name="plus" size={20} color={colors.onPrimary} />
          <AppText style={[styles.addInquiryText, { color: colors.onPrimary }]}>
            Add New Inquiry
          </AppText>
        </TouchableOpacity>
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
  backBtn: {
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
  addBtn: {
    padding: 4,
  },
  periodContainer: {
    paddingVertical: 8,
  },
  periodScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsCardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statsCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },
  statsCardLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  funnelCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
  funnelContainer: {
    gap: 10,
  },
  funnelStage: {
    gap: 4,
  },
  funnelBarContainer: {
    height: 20,
    backgroundColor: "transparent",
  },
  funnelBar: {
    height: "100%",
  },
  funnelLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  funnelLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  funnelCount: {
    fontSize: 11,
  },
  programCard: {
    padding: 16,
  },
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  programInfo: {
    flex: 1,
  },
  programNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  programDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  programName: {
    fontSize: 14,
    fontWeight: "600",
  },
  programStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginLeft: 18,
  },
  programStat: {
    fontSize: 12,
  },
  programRight: {
    alignItems: "flex-end",
  },
  programPercentage: {
    fontSize: 18,
    fontWeight: "700",
  },
  programConvLabel: {
    fontSize: 10,
  },
  sourceCard: {
    padding: 16,
  },
  sourceList: {
    gap: 12,
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sourceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sourceInfo: {
    flex: 1,
    gap: 4,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: "500",
  },
  sourceBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  sourceBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  sourceCount: {
    fontSize: 11,
    width: 60,
    textAlign: "right",
  },
  trendCard: {
    padding: 16,
  },
  trendChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
    marginBottom: 12,
  },
  trendBarContainer: {
    alignItems: "center",
    gap: 4,
  },
  trendBarsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  trendBar: {
    width: 14,
    borderRadius: 4,
  },
  trendMonthLabel: {
    fontSize: 10,
  },
  trendLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  pendingAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  pendingAlertContent: {
    flex: 1,
  },
  pendingAlertTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  pendingAlertSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  recentCard: {
    padding: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  recentAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "500",
  },
  recentDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  addInquiryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addInquiryText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default AdmissionsDashboardScreen;
