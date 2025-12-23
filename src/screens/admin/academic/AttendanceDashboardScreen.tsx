/**
 * AttendanceDashboardScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display comprehensive attendance analytics with student/teacher
 *          breakdown, batch-wise attendance, trends, and alerts
 * Type: Fixed (custom component with dashboard functionality)
 * Accessible from: AttendanceOverviewWidget "Details" tap
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View detailed attendance analytics and management
 * - Target role: admin, super_admin
 * - Screen ID: attendance-dashboard
 * - Route params: type (optional: 'students' | 'teachers'), date (optional)
 * - Data requirements: daily_attendance table, user_profiles table
 * - Required permissions: view_attendance, view_analytics
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing daily_attendance table (created in Phase 4 of admin_demo.md)
 * - RLS: admin role can read where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useAttendanceOverviewQuery: src/hooks/queries/admin/useAttendanceOverviewQuery.ts
 * - Types: AttendanceOverview, AttendanceStats
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
  type?: "students" | "teachers";
  date?: string;
};

type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
  trend: number;
};

type BatchAttendance = {
  id: string;
  name: string;
  program: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

type WeeklyTrend = {
  date: string;
  day: string;
  studentPercentage: number;
  teacherPercentage: number;
};

type AbsentPerson = {
  id: string;
  name: string;
  type: "student" | "teacher";
  batch?: string;
  subject?: string;
  reason: string | null;
  daysAbsent: number;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_STUDENT_STATS: AttendanceStats = {
  present: 1840,
  absent: 120,
  late: 30,
  excused: 10,
  total: 2000,
  percentage: 92,
  trend: 2,
};

const DEMO_TEACHER_STATS: AttendanceStats = {
  present: 58,
  absent: 1,
  late: 1,
  excused: 0,
  total: 60,
  percentage: 98,
  trend: 1,
};

const DEMO_BATCH_ATTENDANCE: BatchAttendance[] = [
  { id: "b1", name: "JEE Advanced 2025-A", program: "JEE", present: 43, absent: 2, total: 45, percentage: 96 },
  { id: "b2", name: "NEET 2025-B", program: "NEET", present: 48, absent: 4, total: 52, percentage: 92 },
  { id: "b3", name: "JEE Mains 2025-C", program: "JEE", present: 62, absent: 6, total: 68, percentage: 91 },
  { id: "b4", name: "Foundation XI-A", program: "Foundation", present: 36, absent: 4, total: 40, percentage: 90 },
  { id: "b5", name: "Foundation XI-B", program: "Foundation", present: 32, absent: 6, total: 38, percentage: 84 },
  { id: "b6", name: "NEET 2025-A", program: "NEET", present: 40, absent: 15, total: 55, percentage: 73 },
];

const DEMO_WEEKLY_TREND: WeeklyTrend[] = [
  { date: "2024-12-16", day: "Mon", studentPercentage: 91, teacherPercentage: 97 },
  { date: "2024-12-17", day: "Tue", studentPercentage: 93, teacherPercentage: 98 },
  { date: "2024-12-18", day: "Wed", studentPercentage: 90, teacherPercentage: 100 },
  { date: "2024-12-19", day: "Thu", studentPercentage: 94, teacherPercentage: 98 },
  { date: "2024-12-20", day: "Fri", studentPercentage: 89, teacherPercentage: 97 },
  { date: "2024-12-21", day: "Sat", studentPercentage: 92, teacherPercentage: 98 },
  { date: "2024-12-22", day: "Sun", studentPercentage: 92, teacherPercentage: 98 },
];

const DEMO_ABSENT_TODAY: AbsentPerson[] = [
  { id: "a1", name: "Rahul Sharma", type: "student", batch: "JEE-A", reason: "Medical", daysAbsent: 1 },
  { id: "a2", name: "Priya Singh", type: "student", batch: "NEET-B", reason: null, daysAbsent: 2 },
  { id: "a3", name: "Amit Kumar", type: "student", batch: "JEE-B", reason: "Family emergency", daysAbsent: 1 },
  { id: "a4", name: "Sneha Patel", type: "student", batch: "Found-A", reason: "Sick", daysAbsent: 3 },
  { id: "a5", name: "Vikram Reddy", type: "student", batch: "NEET-A", reason: null, daysAbsent: 1 },
  { id: "a6", name: "Dr. Meera Joshi", type: "teacher", subject: "Biology", reason: "Conference", daysAbsent: 1 },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
};

const TAB_OPTIONS = [
  { value: "overview", label: "Overview", icon: "view-dashboard" },
  { value: "students", label: "Students", icon: "account-school" },
  { value: "teachers", label: "Teachers", icon: "human-male-board" },
  { value: "batches", label: "Batches", icon: "account-group" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getAttendanceColor = (percentage: number, colors: any): string => {
  if (percentage >= 90) return colors.success || "#4CAF50";
  if (percentage >= 80) return colors.warning || "#FF9800";
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AttendanceDashboardScreen: React.FC<Props> = ({
  screenId = "attendance-dashboard",
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
  const initialType = params.type || "overview";
  const selectedDate = params.date || new Date().toISOString().split("T")[0];

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialType === "students" || initialType === "teachers" ? initialType : "overview");
  const [studentStats, setStudentStats] = useState<AttendanceStats>(DEMO_STUDENT_STATS);
  const [teacherStats, setTeacherStats] = useState<AttendanceStats>(DEMO_TEACHER_STATS);
  const [batchAttendance, setBatchAttendance] = useState<BatchAttendance[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [absentToday, setAbsentToday] = useState<AbsentPerson[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStudentStats(DEMO_STUDENT_STATS);
      setTeacherStats(DEMO_TEACHER_STATS);
      setBatchAttendance(DEMO_BATCH_ATTENDANCE);
      setWeeklyTrend(DEMO_WEEKLY_TREND);
      setAbsentToday(DEMO_ABSENT_TODAY);
    } catch (err) {
      setError("Failed to load attendance data");
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
      data: { role, customerId, type: initialType },
    });
    loadData();
  }, [screenId, role, customerId, initialType, trackScreenView, loadData]);

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================
  const lowAttendanceBatches = useMemo(() => {
    return batchAttendance.filter((b) => b.percentage < 80);
  }, [batchAttendance]);

  const filteredAbsent = useMemo(() => {
    if (activeTab === "students") return absentToday.filter((a) => a.type === "student");
    if (activeTab === "teachers") return absentToday.filter((a) => a.type === "teacher");
    return absentToday;
  }, [absentToday, activeTab]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("attendance_dashboard_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleAbsentPersonPress = useCallback(
    (person: AbsentPerson) => {
      trackEvent("attendance_dashboard_absent_pressed", { personId: person.id, type: person.type });
      if (person.type === "student") {
        navigation.navigate("student-attendance-detail", { studentId: person.id });
      }
    },
    [navigation, trackEvent]
  );

  const handleBatchPress = useCallback(
    (batch: BatchAttendance) => {
      trackEvent("attendance_dashboard_batch_pressed", { batchId: batch.id });
      navigation.navigate("batch-detail", { batchId: batch.id });
    },
    [navigation, trackEvent]
  );

  const handleViewAllAbsent = useCallback(() => {
    trackEvent("attendance_dashboard_view_all_absent");
    navigation.navigate("absent-list", {});
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
            {t("admin:attendanceDashboard.title", { defaultValue: "Attendance Dashboard" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {formatDate(selectedDate)}
          </AppText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.tabItem,
                {
                  backgroundColor: activeTab === tab.value ? colors.primaryContainer : "transparent",
                  borderRadius: borderRadius.medium,
                },
              ]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.value ? colors.primary : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.tabText,
                  { color: activeTab === tab.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {tab.label}
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
        {(activeTab === "overview" || activeTab === "students") && (
          <View style={styles.statsCardsRow}>
            <AppCard style={[styles.statsCard, { flex: 1 }]}>
              <Icon name="account-school" size={28} color={colors.primary} />
              <AppText style={[styles.statsCardValue, { color: colors.onSurface }]}>
                {studentStats.percentage}%
              </AppText>
              <AppText style={[styles.statsCardLabel, { color: colors.onSurfaceVariant }]}>
                Student Attendance
              </AppText>
              <AppText style={[styles.statsCardCount, { color: colors.onSurfaceVariant }]}>
                {studentStats.present} / {studentStats.total}
              </AppText>
              <View style={styles.trendRow}>
                <Icon
                  name={getTrendIcon(studentStats.trend)}
                  size={14}
                  color={getTrendColor(studentStats.trend, colors)}
                />
                <AppText style={[styles.trendText, { color: getTrendColor(studentStats.trend, colors) }]}>
                  {studentStats.trend > 0 ? "+" : ""}{studentStats.trend}% vs avg
                </AppText>
              </View>
            </AppCard>
          </View>
        )}

        {(activeTab === "overview" || activeTab === "teachers") && (
          <View style={styles.statsCardsRow}>
            <AppCard style={[styles.statsCard, { flex: 1 }]}>
              <Icon name="human-male-board" size={28} color={colors.tertiary || colors.secondary} />
              <AppText style={[styles.statsCardValue, { color: colors.onSurface }]}>
                {teacherStats.percentage}%
              </AppText>
              <AppText style={[styles.statsCardLabel, { color: colors.onSurfaceVariant }]}>
                Teacher Attendance
              </AppText>
              <AppText style={[styles.statsCardCount, { color: colors.onSurfaceVariant }]}>
                {teacherStats.present} / {teacherStats.total}
              </AppText>
              <View style={styles.trendRow}>
                <Icon
                  name={getTrendIcon(teacherStats.trend)}
                  size={14}
                  color={getTrendColor(teacherStats.trend, colors)}
                />
                <AppText style={[styles.trendText, { color: getTrendColor(teacherStats.trend, colors) }]}>
                  {teacherStats.trend > 0 ? "+" : ""}{teacherStats.trend}% vs avg
                </AppText>
              </View>
            </AppCard>
          </View>
        )}

        {/* Weekly Trend Chart */}
        {activeTab === "overview" && weeklyTrend.length > 0 && (
          <AppCard style={styles.trendCard}>
            <View style={styles.sectionHeader}>
              <Icon name="chart-line" size={18} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Weekly Trend
              </AppText>
            </View>
            <View style={styles.trendChart}>
              {weeklyTrend.map((day, index) => (
                <View key={day.date} style={styles.trendBarContainer}>
                  <View style={styles.trendBarsWrapper}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: day.studentPercentage * 0.6,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: day.teacherPercentage * 0.6,
                          backgroundColor: colors.tertiary || colors.secondary,
                        },
                      ]}
                    />
                  </View>
                  <AppText style={[styles.trendDayLabel, { color: colors.onSurfaceVariant }]}>
                    {day.day}
                  </AppText>
                </View>
              ))}
            </View>
            <View style={styles.trendLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>Students</AppText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.tertiary || colors.secondary }]} />
                <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>Teachers</AppText>
              </View>
            </View>
          </AppCard>
        )}

        {/* Batch Attendance List */}
        {(activeTab === "overview" || activeTab === "batches") && batchAttendance.length > 0 && (
          <AppCard style={styles.batchCard}>
            <View style={styles.sectionHeader}>
              <Icon name="account-group" size={18} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Batch-wise Attendance
              </AppText>
            </View>
            {batchAttendance.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={[styles.batchItem, { borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleBatchPress(batch)}
              >
                <View style={styles.batchInfo}>
                  <View style={styles.batchNameRow}>
                    <View
                      style={[
                        styles.programDot,
                        { backgroundColor: PROGRAM_COLORS[batch.program] || colors.primary },
                      ]}
                    />
                    <AppText style={[styles.batchName, { color: colors.onSurface }]} numberOfLines={1}>
                      {batch.name}
                    </AppText>
                  </View>
                  <AppText style={[styles.batchCount, { color: colors.onSurfaceVariant }]}>
                    {batch.present}/{batch.total} present
                  </AppText>
                </View>
                <View style={styles.batchPercentage}>
                  <AppText
                    style={[
                      styles.batchPercentageText,
                      { color: getAttendanceColor(batch.percentage, colors) },
                    ]}
                  >
                    {batch.percentage}%
                  </AppText>
                  <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Absent Today List */}
        {filteredAbsent.length > 0 && (
          <AppCard style={styles.absentCard}>
            <View style={styles.sectionHeader}>
              <Icon name="alert-circle-outline" size={18} color={colors.warning} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Absent Today ({filteredAbsent.length})
              </AppText>
              <TouchableOpacity onPress={handleViewAllAbsent}>
                <AppText style={[styles.viewAllText, { color: colors.primary }]}>View All</AppText>
              </TouchableOpacity>
            </View>
            {filteredAbsent.slice(0, 5).map((person) => (
              <TouchableOpacity
                key={person.id}
                style={[styles.absentItem, { borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleAbsentPersonPress(person)}
              >
                <View style={styles.absentInfo}>
                  <View style={styles.absentNameRow}>
                    <Icon
                      name={person.type === "student" ? "account-school" : "human-male-board"}
                      size={16}
                      color={person.type === "student" ? colors.primary : colors.tertiary || colors.secondary}
                    />
                    <AppText style={[styles.absentName, { color: colors.onSurface }]} numberOfLines={1}>
                      {person.name}
                    </AppText>
                  </View>
                  <AppText style={[styles.absentDetail, { color: colors.onSurfaceVariant }]}>
                    {person.type === "student" ? person.batch : person.subject}
                    {person.reason ? ` • ${person.reason}` : ""}
                  </AppText>
                </View>
                {person.daysAbsent > 1 && (
                  <View style={[styles.daysAbsentBadge, { backgroundColor: `${colors.error}20` }]}>
                    <AppText style={[styles.daysAbsentText, { color: colors.error }]}>
                      {person.daysAbsent} days
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Low Attendance Alerts */}
        {activeTab === "overview" && lowAttendanceBatches.length > 0 && (
          <AppCard style={[styles.alertCard, { backgroundColor: `${colors.warning}10` }]}>
            <View style={styles.sectionHeader}>
              <Icon name="bell-alert-outline" size={18} color={colors.warning} />
              <AppText style={[styles.sectionTitle, { color: colors.warning }]}>
                Low Attendance Alerts
              </AppText>
            </View>
            {lowAttendanceBatches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={styles.alertItem}
                onPress={() => handleBatchPress(batch)}
              >
                <AppText style={[styles.alertText, { color: colors.onSurface }]}>
                  ⚠️ {batch.name} has only {batch.percentage}% attendance today
                </AppText>
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
  headerRight: {
    width: 32,
  },
  tabContainer: {
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  tabText: {
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
    gap: 12,
  },
  statsCard: {
    padding: 16,
    alignItems: "center",
  },
  statsCardValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  statsCardLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  statsCardCount: {
    fontSize: 12,
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
  trendCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
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
    width: 12,
    borderRadius: 4,
  },
  trendDayLabel: {
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
  batchCard: {
    padding: 16,
  },
  batchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  batchInfo: {
    flex: 1,
  },
  batchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  programDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  batchName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  batchCount: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 16,
  },
  batchPercentage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  batchPercentageText: {
    fontSize: 15,
    fontWeight: "600",
  },
  absentCard: {
    padding: 16,
  },
  absentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  absentInfo: {
    flex: 1,
  },
  absentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  absentName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  absentDetail: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 24,
  },
  daysAbsentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysAbsentText: {
    fontSize: 11,
    fontWeight: "600",
  },
  alertCard: {
    padding: 16,
  },
  alertItem: {
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 13,
  },
});

export default AttendanceDashboardScreen;
