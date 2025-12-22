/**
 * StudentAttendanceDetailScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed attendance history and statistics for a specific student
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: AttendanceOverviewWidget absent student tap, AbsentListScreen student tap
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View comprehensive attendance details for a student
 * - Target role: admin, super_admin
 * - Screen ID: student-attendance-detail
 * - Route params: studentId (required)
 * - Data requirements: daily_attendance table, user_profiles table
 * - Required permissions: view_attendance, view_students
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing daily_attendance table (created in Phase 4 of admin_demo.md)
 * - RLS: admin role can read daily_attendance where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useStudentAttendanceDetailQuery: src/hooks/queries/admin/useStudentAttendanceDetailQuery.ts
 * - Types: StudentAttendanceDetailData, AttendanceRecord, AttendanceStats
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 */

import React, { useEffect, useCallback, useState } from "react";
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

// Query Hook
import { 
  useStudentAttendanceDetailQuery, 
  AttendanceRecord,
  MonthlyAttendance 
} from "../../../hooks/queries/admin/useStudentAttendanceDetailQuery";

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

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  present: { icon: "check-circle", color: "#4CAF50", label: "Present" },
  absent: { icon: "close-circle", color: "#F44336", label: "Absent" },
  late: { icon: "clock-alert", color: "#FF9800", label: "Late" },
  "half-day": { icon: "circle-half-full", color: "#2196F3", label: "Half Day" },
  excused: { icon: "account-check", color: "#9C27B0", label: "Excused" },
};

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (time: string | null): string => {
  if (!time) return "-";
  return time;
};

const getAttendanceColor = (percentage: number, colors: any): string => {
  if (percentage >= 90) return colors.success || "#4CAF50";
  if (percentage >= 75) return colors.warning || "#FF9800";
  return colors.error || "#F44336";
};

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

// =============================================================================
// COMPONENT
// =============================================================================

export const StudentAttendanceDetailScreen: React.FC<Props> = ({
  screenId = "student-attendance-detail",
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
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "monthly">("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: attendanceDetail,
    isLoading,
    error,
    refetch,
  } = useStudentAttendanceDetailQuery({ 
    studentId: studentId || "", 
    period: selectedPeriod 
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
      trackEvent("student_attendance_detail_viewed", { screenId, studentId });
    }
  }, [screenId, role, customerId, studentId, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("student_attendance_detail_back_pressed");
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

  const handleBatchTap = useCallback(() => {
    if (attendanceDetail?.batchId) {
      trackEvent("student_attendance_batch_tap", { studentId, batchId: attendanceDetail.batchId });
      navigation.navigate("batch-attendance", { batchId: attendanceDetail.batchId });
    }
  }, [navigation, studentId, attendanceDetail?.batchId, trackEvent]);

  const handleContactParent = useCallback(() => {
    trackEvent("student_attendance_contact_parent", { studentId });
    navigation.navigate("compose-message", { 
      recipientType: "parent", 
      studentId,
      template: "attendance-concern" 
    });
  }, [navigation, studentId, trackEvent]);

  const handlePeriodChange = useCallback((period: "month" | "quarter" | "year") => {
    setSelectedPeriod(period);
    trackEvent("student_attendance_period_changed", { studentId, period });
  }, [studentId, trackEvent]);

  // ===========================================================================
  // RENDER - No studentId provided
  // ===========================================================================
  if (!studentId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="account-alert" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:studentAttendance.noStudentSelected", { 
              defaultValue: "No student selected. Please select a student from the list." 
            })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
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
            {t("common:errors.generic", { defaultValue: "Something went wrong." })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={() => refetch()}
            accessibilityLabel="Try again"
            accessibilityRole="button"
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
  if (!attendanceDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="calendar-blank" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:studentAttendance.noData", { defaultValue: "No Attendance Data" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:studentAttendance.noDataMessage", { 
              defaultValue: "No attendance records found for this student." 
            })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
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
  const programColor = PROGRAM_COLORS[attendanceDetail.program] || colors.primary;
  const { stats } = attendanceDetail;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.headerBackButton} 
          accessibilityLabel="Go back" 
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {attendanceDetail.studentName}
          </AppText>
          <View style={styles.headerBadgeRow}>
            <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {attendanceDetail.rollNumber}
            </AppText>
            <View style={[styles.programBadge, { backgroundColor: `${programColor}20` }]}>
              <AppText style={[styles.programBadgeText, { color: programColor }]}>
                {attendanceDetail.program}
              </AppText>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleContactParent} 
          style={styles.headerActionButton}
          accessibilityLabel="Contact parent"
          accessibilityRole="button"
        >
          <Icon name="message-text" size={22} color={colors.primary} />
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
        {/* Alerts */}
        {attendanceDetail.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {attendanceDetail.alerts.map((alert, index) => (
              <View 
                key={index} 
                style={[
                  styles.alertCard, 
                  { 
                    backgroundColor: alert.severity === 'critical' 
                      ? `${colors.error}15` 
                      : `${colors.warning}15`,
                    borderLeftColor: alert.severity === 'critical' 
                      ? colors.error 
                      : colors.warning,
                  }
                ]}
              >
                <Icon 
                  name={alert.severity === 'critical' ? "alert-circle" : "alert"} 
                  size={18} 
                  color={alert.severity === 'critical' ? colors.error : colors.warning} 
                />
                <AppText style={[styles.alertText, { color: colors.onSurface }]}>
                  {alert.message}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {/* Attendance Summary Card */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentAttendance.summary", { defaultValue: "Attendance Summary" })}
            </AppText>
            <TouchableOpacity onPress={handleBatchTap} style={styles.batchLink}>
              <AppText style={[styles.batchLinkText, { color: colors.primary }]}>
                {attendanceDetail.batch}
              </AppText>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Main Percentage */}
          <View style={styles.mainStatContainer}>
            <View style={styles.percentageCircle}>
              <AppText 
                style={[
                  styles.percentageValue, 
                  { color: getAttendanceColor(stats.attendancePercentage, colors) }
                ]}
              >
                {stats.attendancePercentage}%
              </AppText>
              <AppText style={[styles.percentageLabel, { color: colors.onSurfaceVariant }]}>
                Attendance
              </AppText>
            </View>
            <View style={styles.trendContainer}>
              <Icon 
                name={getTrendIcon(stats.trend)} 
                size={20} 
                color={getTrendColor(stats.trend, colors)} 
              />
              <AppText style={[styles.trendText, { color: getTrendColor(stats.trend, colors) }]}>
                {Math.abs(stats.trend)}% vs last month
              </AppText>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>{stats.presentDays}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Present</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <Icon name="close-circle" size={20} color="#F44336" />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>{stats.absentDays}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Absent</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <Icon name="clock-alert" size={20} color="#FF9800" />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>{stats.lateDays}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Late</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <Icon name="fire" size={20} color="#FF5722" />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>{stats.currentStreak}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Streak</AppText>
            </View>
          </View>
        </AppCard>

        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.surfaceVariant }]}>
          {(["month", "quarter", "year"] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton, 
                selectedPeriod === period && { backgroundColor: colors.surface }
              ]}
              onPress={() => handlePeriodChange(period)}
            >
              <AppText 
                style={[
                  styles.periodButtonText, 
                  { color: selectedPeriod === period ? colors.primary : colors.onSurfaceVariant }
                ]}
              >
                {period === "month" ? "This Month" : period === "quarter" ? "Quarter" : "Year"}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          {(["overview", "history", "monthly"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.surface }]}
              onPress={() => setActiveTab(tab)}
            >
              <AppText 
                style={[
                  styles.tabText, 
                  { color: activeTab === tab ? colors.primary : colors.onSurfaceVariant }
                ]}
              >
                {tab === "overview" ? "Overview" : tab === "history" ? "History" : "Monthly"}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <AppCard style={styles.overviewCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentAttendance.streakInfo", { defaultValue: "Streak Information" })}
            </AppText>
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Icon name="fire" size={32} color="#FF5722" />
                <AppText style={[styles.streakValue, { color: colors.onSurface }]}>
                  {stats.currentStreak} days
                </AppText>
                <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>
                  Current Streak
                </AppText>
              </View>
              <View style={styles.streakItem}>
                <Icon name="trophy" size={32} color="#FFD700" />
                <AppText style={[styles.streakValue, { color: colors.onSurface }]}>
                  {stats.longestStreak} days
                </AppText>
                <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>
                  Best Streak
                </AppText>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.totalDaysRow}>
              <AppText style={[styles.totalDaysLabel, { color: colors.onSurfaceVariant }]}>
                Total School Days
              </AppText>
              <AppText style={[styles.totalDaysValue, { color: colors.onSurface }]}>
                {stats.totalDays}
              </AppText>
            </View>
          </AppCard>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <AppCard style={styles.historyCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentAttendance.recentHistory", { defaultValue: "Recent Attendance" })}
            </AppText>
            {attendanceDetail.recentRecords.map((record, index) => {
              const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.present;
              return (
                <View
                  key={record.id}
                  style={[
                    styles.historyRow,
                    index < attendanceDetail.recentRecords.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.historyDate}>
                    <AppText style={[styles.historyDateText, { color: colors.onSurface }]}>
                      {formatDate(record.date)}
                    </AppText>
                  </View>
                  <View style={styles.historyStatus}>
                    <Icon name={statusConfig.icon} size={20} color={statusConfig.color} />
                    <AppText style={[styles.historyStatusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </AppText>
                  </View>
                  <View style={styles.historyTime}>
                    {record.checkInTime && (
                      <AppText style={[styles.historyTimeText, { color: colors.onSurfaceVariant }]}>
                        {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}
                      </AppText>
                    )}
                    {record.reason && (
                      <AppText style={[styles.historyReason, { color: colors.onSurfaceVariant }]}>
                        {record.reason}
                      </AppText>
                    )}
                  </View>
                </View>
              );
            })}
          </AppCard>
        )}

        {/* Monthly Tab */}
        {activeTab === "monthly" && (
          <AppCard style={styles.monthlyCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:studentAttendance.monthlyBreakdown", { defaultValue: "Monthly Breakdown" })}
            </AppText>
            {attendanceDetail.monthlyHistory.map((month, index) => (
              <View
                key={`${month.month}-${month.year}`}
                style={[
                  styles.monthlyRow,
                  index < attendanceDetail.monthlyHistory.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.monthlyInfo}>
                  <AppText style={[styles.monthlyName, { color: colors.onSurface }]}>
                    {month.month} {month.year}
                  </AppText>
                  <AppText style={[styles.monthlyDays, { color: colors.onSurfaceVariant }]}>
                    {month.present}/{month.total} days
                  </AppText>
                </View>
                <View style={styles.monthlyStats}>
                  <AppText 
                    style={[
                      styles.monthlyPercentage, 
                      { color: getAttendanceColor(month.percentage, colors) }
                    ]}
                  >
                    {month.percentage}%
                  </AppText>
                </View>
                {/* Progress Bar */}
                <View style={[styles.monthlyProgressBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View 
                    style={[
                      styles.monthlyProgressFill, 
                      { 
                        backgroundColor: getAttendanceColor(month.percentage, colors), 
                        width: `${month.percentage}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
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
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  errorMessage: { fontSize: 14, textAlign: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  emptyMessage: { fontSize: 14, textAlign: "center" },
  actionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  actionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  headerSubtitle: { fontSize: 12 },
  programBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  programBadgeText: { fontSize: 10, fontWeight: "600" },
  headerActionButton: { padding: 8 },

  // Content
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },

  // Alerts
  alertsContainer: { gap: 8 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 8, borderLeftWidth: 4 },
  alertText: { flex: 1, fontSize: 13 },

  // Summary Card
  summaryCard: { padding: 16 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  batchLink: { flexDirection: "row", alignItems: "center" },
  batchLinkText: { fontSize: 12 },
  mainStatContainer: { alignItems: "center", marginBottom: 20 },
  percentageCircle: { alignItems: "center", marginBottom: 8 },
  percentageValue: { fontSize: 48, fontWeight: "700" },
  percentageLabel: { fontSize: 12 },
  trendContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { fontSize: 12 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 40 },

  // Period Selector
  periodSelector: { flexDirection: "row", borderRadius: 8, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  periodButtonText: { fontSize: 12, fontWeight: "500" },

  // Tab Container
  tabContainer: { flexDirection: "row", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabText: { fontSize: 12, fontWeight: "500" },

  // Overview Card
  overviewCard: { padding: 16 },
  streakRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  streakItem: { alignItems: "center" },
  streakValue: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  streakLabel: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginVertical: 16 },
  totalDaysRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalDaysLabel: { fontSize: 13 },
  totalDaysValue: { fontSize: 16, fontWeight: "600" },

  // History Card
  historyCard: { padding: 16 },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  historyDate: { width: 70 },
  historyDateText: { fontSize: 12, fontWeight: "500" },
  historyStatus: { flexDirection: "row", alignItems: "center", gap: 6, width: 90 },
  historyStatusText: { fontSize: 12, fontWeight: "500" },
  historyTime: { flex: 1, alignItems: "flex-end" },
  historyTimeText: { fontSize: 11 },
  historyReason: { fontSize: 10, fontStyle: "italic", marginTop: 2 },

  // Monthly Card
  monthlyCard: { padding: 16 },
  monthlyRow: { paddingVertical: 12 },
  monthlyInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  monthlyName: { fontSize: 14, fontWeight: "500" },
  monthlyDays: { fontSize: 12 },
  monthlyStats: { position: "absolute", right: 0, top: 12 },
  monthlyPercentage: { fontSize: 16, fontWeight: "700" },
  monthlyProgressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  monthlyProgressFill: { height: "100%", borderRadius: 3 },
});

export default StudentAttendanceDetailScreen;
