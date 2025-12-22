/**
 * BatchDetailScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed information about a specific batch including
 *          performance metrics, student list, test history, and subject breakdown
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: BatchPerformanceWidget batch row tap
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View comprehensive batch details with performance analytics
 * - Target role: admin, super_admin
 * - Screen ID: batch-detail
 * - Route params: batchId (required)
 * - Data requirements: batch_performance table, user_profiles table
 * - Required permissions: view_batches, view_analytics
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing batch_performance table (created in Phase 4 of admin_demo.md)
 * - RLS: admin role can read batch_performance where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useBatchDetailQuery: src/hooks/queries/admin/useBatchDetailQuery.ts
 * - Types: BatchDetailData, BatchStudent, BatchTest, BatchSubject
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
import { useBatchDetailQuery, BatchStudent, BatchTest, BatchSubject } from "../../../hooks/queries/admin/useBatchDetailQuery";

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
  batchId?: string;
  activeTab?: "overview" | "students" | "tests" | "subjects";
  highlightStudent?: string;
  viewMode?: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
};

const RANK_BADGES = ["🥇", "🥈", "🥉"];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPerformanceColor = (score: number, colors: any): string => {
  if (score >= 85) return colors.success || "#4CAF50";
  if (score >= 70) return colors.warning || "#FF9800";
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

export const BatchDetailScreen: React.FC<Props> = ({
  screenId = "batch-detail",
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
  const batchId = params.batchId;
  const initialTab = params.activeTab || "overview";
  const highlightStudentId = params.highlightStudent;

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "tests" | "subjects">(initialTab);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: batchDetail,
    isLoading,
    error,
    refetch,
  } = useBatchDetailQuery({ batchId: batchId || "" });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, batchId },
    });

    if (batchId) {
      trackEvent("batch_detail_viewed", { screenId, batchId });
    }
  }, [screenId, role, customerId, batchId, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("batch_detail_back_pressed");
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

  const handleStudentTap = useCallback((studentId: string) => {
    trackEvent("batch_detail_student_tap", { batchId, studentId });
    // Navigate to student attendance detail since student-detail screen doesn't exist for admin
    navigation.navigate("student-attendance-detail", { studentId });
  }, [navigation, batchId, trackEvent]);

  const handleTestTap = useCallback((testId: string) => {
    trackEvent("batch_detail_test_tap", { batchId, testId });
    navigation.navigate("test-detail", { testId });
  }, [navigation, batchId, trackEvent]);

  const handleViewAllStudents = useCallback(() => {
    trackEvent("batch_detail_view_all_students", { batchId });
    // Stay on current screen and switch to students tab since batch-students screen doesn't exist
    setActiveTab("students");
  }, [batchId, trackEvent]);

  const handleContactTeacher = useCallback(() => {
    if (batchDetail?.teacher?.phone) {
      trackEvent("batch_detail_contact_teacher", { batchId });
    }
  }, [batchDetail?.teacher?.phone, batchId, trackEvent]);

  // ===========================================================================
  // RENDER - No batchId provided
  // ===========================================================================
  if (!batchId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="school-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:batchDetail.noBatchSelected", { defaultValue: "No batch selected. Please select a batch from the list." })}
          </AppText>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleBack}>
            <AppText style={styles.actionButtonText}>{t("common:actions.goBack", { defaultValue: "Go Back" })}</AppText>
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
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <AppText style={styles.actionButtonText}>{t("common:actions.retry", { defaultValue: "Try Again" })}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Empty State
  // ===========================================================================
  if (!batchDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="school-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:batchDetail.noData", { defaultValue: "Batch Not Found" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:batchDetail.noDataMessage", { defaultValue: "The requested batch could not be found." })}
          </AppText>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleBack}>
            <AppText style={styles.actionButtonText}>{t("common:actions.goBack", { defaultValue: "Go Back" })}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Success State
  // ===========================================================================
  const programColor = PROGRAM_COLORS[batchDetail.program] || colors.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton} accessibilityLabel="Go back" accessibilityRole="button">
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {batchDetail.name}
          </AppText>
          <View style={styles.headerBadgeRow}>
            <View style={[styles.programBadge, { backgroundColor: `${programColor}20` }]}>
              <AppText style={[styles.programBadgeText, { color: programColor }]}>{batchDetail.program}</AppText>
            </View>
            {batchDetail.rank <= 3 && (
              <AppText style={styles.rankBadge}>{RANK_BADGES[batchDetail.rank - 1]}</AppText>
            )}
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Performance Summary Card */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: getPerformanceColor(batchDetail.avgScore, colors) }]}>
                {batchDetail.avgScore}%
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Avg Score</AppText>
              <View style={styles.trendRow}>
                <Icon name={getTrendIcon(batchDetail.trend)} size={14} color={getTrendColor(batchDetail.trend, colors)} />
                <AppText style={[styles.trendText, { color: getTrendColor(batchDetail.trend, colors) }]}>
                  {Math.abs(batchDetail.trend)}%
                </AppText>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>{batchDetail.passPercentage}%</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Pass Rate</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>{batchDetail.studentCount}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Students</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>{batchDetail.attendance}%</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Attendance</AppText>
            </View>
          </View>
        </AppCard>

        {/* Batch Info Card */}
        <AppCard style={styles.infoCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("admin:batchDetail.batchInfo", { defaultValue: "Batch Information" })}
          </AppText>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Term:</AppText>
            <AppText style={[styles.infoValue, { color: colors.onSurface }]}>{batchDetail.term}</AppText>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Schedule:</AppText>
            <AppText style={[styles.infoValue, { color: colors.onSurface }]}>{batchDetail.schedule}</AppText>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Venue:</AppText>
            <AppText style={[styles.infoValue, { color: colors.onSurface }]}>{batchDetail.venue}</AppText>
          </View>
          <View style={styles.infoRow}>
            <Icon name="file-document-outline" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Tests:</AppText>
            <AppText style={[styles.infoValue, { color: colors.onSurface }]}>{batchDetail.testsCount} conducted</AppText>
          </View>
          {batchDetail.teacher && (
            <TouchableOpacity style={styles.teacherRow} onPress={handleContactTeacher}>
              <Icon name="account-tie" size={16} color={colors.primary} />
              <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Teacher:</AppText>
              <AppText style={[styles.infoValue, { color: colors.primary }]}>{batchDetail.teacher.name}</AppText>
              <Icon name="phone" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </AppCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          {(["overview", "students", "tests", "subjects"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.surface }]}
              onPress={() => setActiveTab(tab)}
            >
              <AppText style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === "overview" && batchDetail.topScorer && (
          <AppCard style={styles.topScorerCard}>
            <View style={styles.topScorerHeader}>
              <Icon name="trophy" size={24} color="#FFD700" />
              <AppText style={[styles.topScorerTitle, { color: colors.onSurface }]}>Top Scorer</AppText>
            </View>
            <TouchableOpacity style={styles.topScorerContent} onPress={() => handleStudentTap(batchDetail.topScorer!.id)}>
              <View style={styles.topScorerInfo}>
                <AppText style={[styles.topScorerName, { color: colors.onSurface }]}>{batchDetail.topScorer.name}</AppText>
                <AppText style={[styles.topScorerScore, { color: colors.success }]}>{batchDetail.topScorer.score}%</AppText>
              </View>
              <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </AppCard>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <AppCard style={styles.listCard}>
            <View style={styles.listHeader}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>Top Students</AppText>
              <TouchableOpacity onPress={handleViewAllStudents}>
                <AppText style={[styles.viewAllText, { color: colors.primary }]}>View All</AppText>
              </TouchableOpacity>
            </View>
            {batchDetail.topStudents.map((student, index) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.studentRow, index < batchDetail.topStudents.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleStudentTap(student.id)}
              >
                <View style={styles.studentRank}>
                  {index < 3 ? (
                    <AppText style={styles.rankEmoji}>{RANK_BADGES[index]}</AppText>
                  ) : (
                    <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>#{student.rank}</AppText>
                  )}
                </View>
                <View style={styles.studentInfo}>
                  <AppText style={[styles.studentName, { color: colors.onSurface }]}>{student.name}</AppText>
                  <AppText style={[styles.studentRoll, { color: colors.onSurfaceVariant }]}>{student.rollNumber}</AppText>
                </View>
                <View style={styles.studentStats}>
                  <AppText style={[styles.studentScore, { color: getPerformanceColor(student.avgScore, colors) }]}>{student.avgScore}%</AppText>
                  <View style={styles.studentTrend}>
                    <Icon name={getTrendIcon(student.trend)} size={12} color={getTrendColor(student.trend, colors)} />
                    <AppText style={[styles.studentTrendText, { color: getTrendColor(student.trend, colors) }]}>{Math.abs(student.trend)}%</AppText>
                  </View>
                </View>
                <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Tests Tab */}
        {activeTab === "tests" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Tests</AppText>
            {batchDetail.recentTests.map((test, index) => (
              <TouchableOpacity
                key={test.id}
                style={[styles.testRow, index < batchDetail.recentTests.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleTestTap(test.id)}
              >
                <View style={styles.testInfo}>
                  <AppText style={[styles.testName, { color: colors.onSurface }]}>{test.name}</AppText>
                  <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>{formatDate(test.date)}</AppText>
                </View>
                <View style={styles.testStats}>
                  <View style={styles.testStatItem}>
                    <AppText style={[styles.testStatValue, { color: getPerformanceColor(test.avgScore, colors) }]}>{test.avgScore}%</AppText>
                    <AppText style={[styles.testStatLabel, { color: colors.onSurfaceVariant }]}>Avg</AppText>
                  </View>
                  <View style={styles.testStatItem}>
                    <AppText style={[styles.testStatValue, { color: colors.success }]}>{test.highestScore}%</AppText>
                    <AppText style={[styles.testStatLabel, { color: colors.onSurfaceVariant }]}>High</AppText>
                  </View>
                  <View style={styles.testStatItem}>
                    <AppText style={[styles.testStatValue, { color: colors.primary }]}>{test.passPercentage}%</AppText>
                    <AppText style={[styles.testStatLabel, { color: colors.onSurfaceVariant }]}>Pass</AppText>
                  </View>
                </View>
                <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </AppCard>
        )}

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <AppCard style={styles.listCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>Subject Performance</AppText>
            {batchDetail.subjectPerformance.map((subject, index) => (
              <View
                key={subject.id}
                style={[styles.subjectRow, index < batchDetail.subjectPerformance.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant }]}
              >
                <View style={styles.subjectInfo}>
                  <AppText style={[styles.subjectName, { color: colors.onSurface }]}>{subject.name}</AppText>
                  <AppText style={[styles.subjectTopScorer, { color: colors.onSurfaceVariant }]}>
                    Top: {subject.topScorer} ({subject.topScore}%)
                  </AppText>
                </View>
                <View style={styles.subjectStats}>
                  <View style={styles.subjectStatItem}>
                    <AppText style={[styles.subjectStatValue, { color: getPerformanceColor(subject.avgScore, colors) }]}>{subject.avgScore}%</AppText>
                    <AppText style={[styles.subjectStatLabel, { color: colors.onSurfaceVariant }]}>Avg</AppText>
                  </View>
                  <View style={styles.subjectStatItem}>
                    <AppText style={[styles.subjectStatValue, { color: colors.primary }]}>{subject.passPercentage}%</AppText>
                    <AppText style={[styles.subjectStatLabel, { color: colors.onSurfaceVariant }]}>Pass</AppText>
                  </View>
                </View>
                {/* Progress Bar */}
                <View style={[styles.subjectProgressBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={[styles.subjectProgressFill, { backgroundColor: getPerformanceColor(subject.avgScore, colors), width: `${subject.avgScore}%` }]} />
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  programBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  programBadgeText: { fontSize: 11, fontWeight: "600" },
  rankBadge: { fontSize: 16 },
  headerRight: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },

  summaryCard: { padding: 16 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  trendText: { fontSize: 11, fontWeight: "500" },
  infoCard: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  infoLabel: { fontSize: 12, width: 70 },
  infoValue: { fontSize: 13, flex: 1 },
  teacherRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  tabContainer: { flexDirection: "row", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabText: { fontSize: 12, fontWeight: "500" },
  topScorerCard: { padding: 16 },
  topScorerHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  topScorerTitle: { fontSize: 14, fontWeight: "600" },
  topScorerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topScorerInfo: { flex: 1 },
  topScorerName: { fontSize: 15, fontWeight: "500" },
  topScorerScore: { fontSize: 18, fontWeight: "700", marginTop: 2 },

  listCard: { padding: 16 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  studentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  studentRank: { width: 28, alignItems: "center" },
  rankEmoji: { fontSize: 18 },
  rankNumber: { fontSize: 12, fontWeight: "500" },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: "500" },
  studentRoll: { fontSize: 11, marginTop: 2 },
  studentStats: { alignItems: "flex-end" },
  studentScore: { fontSize: 14, fontWeight: "600" },
  studentTrend: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  studentTrendText: { fontSize: 10 },
  testRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  testInfo: { flex: 1 },
  testName: { fontSize: 14, fontWeight: "500" },
  testDate: { fontSize: 11, marginTop: 2 },
  testStats: { flexDirection: "row", gap: 12 },
  testStatItem: { alignItems: "center" },
  testStatValue: { fontSize: 13, fontWeight: "600" },
  testStatLabel: { fontSize: 9, marginTop: 1 },
  subjectRow: { paddingVertical: 12 },
  subjectInfo: { marginBottom: 8 },
  subjectName: { fontSize: 14, fontWeight: "500" },
  subjectTopScorer: { fontSize: 11, marginTop: 2 },
  subjectStats: { flexDirection: "row", gap: 16, marginBottom: 8 },
  subjectStatItem: { alignItems: "center" },
  subjectStatValue: { fontSize: 14, fontWeight: "600" },
  subjectStatLabel: { fontSize: 10 },
  subjectProgressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  subjectProgressFill: { height: "100%", borderRadius: 3 },
});

export default BatchDetailScreen;
