/**
 * BatchAnalyticsScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display comprehensive batch analytics with performance metrics,
 *          program-wise breakdown, and trend analysis
 * Type: Fixed (custom component with analytics functionality)
 * Accessible from: BatchPerformanceWidget "View All" tap
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View all batches with analytics, filtering, and comparison
 * - Target role: admin, super_admin
 * - Screen ID: batch-analytics
 * - Route params: program (optional filter), term (optional filter)
 * - Data requirements: batch_performance table
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
 * - useBatchPerformanceQuery: src/hooks/queries/admin/useBatchPerformanceQuery.ts
 * - Types: BatchPerformance, BatchItem
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
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
  program?: string;
  term?: string;
};

type BatchItem = {
  id: string;
  batchId: string;
  name: string;
  program: string;
  avgScore: number;
  passPercentage: number;
  studentCount: number;
  trend: number;
  rank: number;
  testsCount: number;
  attendance: number;
  topScorer: {
    id: string;
    name: string;
    score: number;
  };
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_BATCHES: BatchItem[] = [
  { id: "1", batchId: "batch-jee-adv-2025-a", name: "JEE Advanced 2025-A", program: "JEE", avgScore: 89, passPercentage: 94, studentCount: 45, trend: 5, rank: 1, testsCount: 12, attendance: 96, topScorer: { id: "s1", name: "Rahul Sharma", score: 98 } },
  { id: "2", batchId: "batch-neet-2025-b", name: "NEET 2025-B", program: "NEET", avgScore: 84, passPercentage: 91, studentCount: 52, trend: 3, rank: 2, testsCount: 10, attendance: 94, topScorer: { id: "s2", name: "Priya Singh", score: 96 } },
  { id: "3", batchId: "batch-jee-mains-2025-c", name: "JEE Mains 2025-C", program: "JEE", avgScore: 78, passPercentage: 85, studentCount: 68, trend: -2, rank: 3, testsCount: 14, attendance: 91, topScorer: { id: "s3", name: "Amit Kumar", score: 94 } },
  { id: "4", batchId: "batch-foundation-xi-a", name: "Foundation XI-A", program: "Foundation", avgScore: 76, passPercentage: 88, studentCount: 40, trend: 4, rank: 4, testsCount: 8, attendance: 93, topScorer: { id: "s4", name: "Sneha Patel", score: 92 } },
  { id: "5", batchId: "batch-foundation-xi-b", name: "Foundation XI-B", program: "Foundation", avgScore: 74, passPercentage: 82, studentCount: 38, trend: 1, rank: 5, testsCount: 8, attendance: 90, topScorer: { id: "s5", name: "Vikram Reddy", score: 90 } },
  { id: "6", batchId: "batch-neet-2025-a", name: "NEET 2025-A", program: "NEET", avgScore: 82, passPercentage: 89, studentCount: 55, trend: 2, rank: 6, testsCount: 11, attendance: 95, topScorer: { id: "s6", name: "Anita Gupta", score: 95 } },
  { id: "7", batchId: "batch-jee-adv-2025-b", name: "JEE Advanced 2025-B", program: "JEE", avgScore: 81, passPercentage: 87, studentCount: 42, trend: -1, rank: 7, testsCount: 12, attendance: 92, topScorer: { id: "s7", name: "Karthik Nair", score: 93 } },
  { id: "8", batchId: "batch-foundation-xii-a", name: "Foundation XII-A", program: "Foundation", avgScore: 79, passPercentage: 86, studentCount: 35, trend: 3, rank: 8, testsCount: 9, attendance: 94, topScorer: { id: "s8", name: "Meera Joshi", score: 91 } },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
  All: "#9C27B0",
};

const RANK_BADGES = ["🥇", "🥈", "🥉"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Programs", icon: "view-grid" },
  { value: "JEE", label: "JEE", icon: "atom" },
  { value: "NEET", label: "NEET", icon: "medical-bag" },
  { value: "Foundation", label: "Foundation", icon: "school" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

export const BatchAnalyticsScreen: React.FC<Props> = ({
  screenId = "batch-analytics",
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
  const initialProgram = params.program || "all";

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>(initialProgram);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setBatches(DEMO_BATCHES);
    } catch (err) {
      setError("Failed to load batch analytics");
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
      data: { role, customerId, program: initialProgram },
    });
    loadData();
  }, [screenId, role, customerId, initialProgram, trackScreenView, loadData]);

  // ===========================================================================
  // FILTERED DATA
  // ===========================================================================
  const filteredBatches = useMemo(() => {
    if (filter === "all") return batches;
    return batches.filter((b) => b.program === filter);
  }, [batches, filter]);

  // ===========================================================================
  // SUMMARY STATS
  // ===========================================================================
  const summaryStats = useMemo(() => {
    const data = filteredBatches;
    const totalStudents = data.reduce((sum, b) => sum + b.studentCount, 0);
    const avgScore = data.length > 0 
      ? Math.round(data.reduce((sum, b) => sum + b.avgScore, 0) / data.length) 
      : 0;
    const avgAttendance = data.length > 0
      ? Math.round(data.reduce((sum, b) => sum + b.attendance, 0) / data.length)
      : 0;
    const avgPassRate = data.length > 0
      ? Math.round(data.reduce((sum, b) => sum + b.passPercentage, 0) / data.length)
      : 0;
    return { totalBatches: data.length, totalStudents, avgScore, avgAttendance, avgPassRate };
  }, [filteredBatches]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("batch_analytics_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleBatchPress = useCallback(
    (batch: BatchItem) => {
      trackEvent("batch_analytics_item_pressed", { batchId: batch.batchId });
      navigation.navigate("batch-detail", { batchId: batch.batchId });
    },
    [navigation, trackEvent]
  );

  const handleTopScorerPress = useCallback(
    (batch: BatchItem) => {
      trackEvent("batch_analytics_top_scorer_pressed", { 
        batchId: batch.batchId, 
        studentId: batch.topScorer.id 
      });
      navigation.navigate("student-attendance-detail", { studentId: batch.topScorer.id });
    },
    [navigation, trackEvent]
  );

  const handleStudentCountPress = useCallback(
    (batch: BatchItem) => {
      trackEvent("batch_analytics_student_count_pressed", { batchId: batch.batchId });
      navigation.navigate("batch-students", { batchId: batch.batchId, batchName: batch.name });
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
  // RENDER ITEM
  // ===========================================================================
  const renderBatch = ({ item, index }: { item: BatchItem; index: number }) => {
    const programColor = PROGRAM_COLORS[item.program] || colors.primary;
    const performanceColor = getPerformanceColor(item.avgScore, colors);
    const isTopThree = item.rank <= 3;

    return (
      <TouchableOpacity onPress={() => handleBatchPress(item)} activeOpacity={0.7}>
        <AppCard style={styles.batchCard}>
          {/* Header Row */}
          <View style={styles.batchHeader}>
            <View style={styles.batchNameRow}>
              {isTopThree ? (
                <AppText style={styles.rankBadge}>{RANK_BADGES[item.rank - 1]}</AppText>
              ) : (
                <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>
                  #{item.rank}
                </AppText>
              )}
              <View style={styles.batchInfo}>
                <AppText style={[styles.batchName, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.name}
                </AppText>
                <View style={[styles.programBadge, { backgroundColor: `${programColor}20` }]}>
                  <AppText style={[styles.programText, { color: programColor }]}>
                    {item.program}
                  </AppText>
                </View>
              </View>
            </View>
            <View style={styles.scoreContainer}>
              <AppText style={[styles.avgScore, { color: performanceColor }]}>
                {item.avgScore}%
              </AppText>
              <View style={styles.trendRow}>
                <Icon 
                  name={getTrendIcon(item.trend)} 
                  size={12} 
                  color={getTrendColor(item.trend, colors)} 
                />
                <AppText style={[styles.trendText, { color: getTrendColor(item.trend, colors) }]}>
                  {Math.abs(item.trend)}%
                </AppText>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: performanceColor, width: `${item.avgScore}%` },
              ]}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => handleStudentCountPress(item)}>
              <Icon name="account-group" size={14} color={colors.primary} />
              <AppText style={[styles.statText, { color: colors.primary }]}>
                {item.studentCount} students
              </AppText>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={14} color={colors.success} />
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {item.passPercentage}% pass
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="calendar-check" size={14} color={colors.primary} />
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {item.attendance}% attend
              </AppText>
            </View>
          </View>

          {/* Top Scorer Row */}
          <TouchableOpacity 
            style={[styles.topScorerRow, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => handleTopScorerPress(item)}
          >
            <Icon name="trophy" size={14} color="#FFD700" />
            <AppText style={[styles.topScorerLabel, { color: colors.onSurfaceVariant }]}>
              Top:
            </AppText>
            <AppText style={[styles.topScorerName, { color: colors.onSurface }]} numberOfLines={1}>
              {item.topScorer.name}
            </AppText>
            <AppText style={[styles.topScorerScore, { color: colors.success }]}>
              {item.topScorer.score}%
            </AppText>
            <Icon name="chevron-right" size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </AppCard>
      </TouchableOpacity>
    );
  };

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
            {t("admin:batchAnalytics.title", { defaultValue: "Batch Analytics" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {summaryStats.totalBatches} batches • {summaryStats.totalStudents} students
          </AppText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Summary Stats Card */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {summaryStats.avgScore}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Avg Score
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>
              {summaryStats.avgPassRate}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Pass Rate
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.warning }]}>
              {summaryStats.avgAttendance}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Attendance
            </AppText>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => {
          const chipColor = opt.value === "all" ? colors.primary : PROGRAM_COLORS[opt.value];
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === opt.value ? `${chipColor}20` : colors.surfaceVariant,
                  borderColor: filter === opt.value ? chipColor : "transparent",
                  borderWidth: filter === opt.value ? 1 : 0,
                },
              ]}
              onPress={() => setFilter(opt.value)}
            >
              <Icon
                name={opt.icon}
                size={14}
                color={filter === opt.value ? chipColor : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.filterText,
                  { color: filter === opt.value ? chipColor : colors.onSurfaceVariant },
                ]}
              >
                {opt.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Batch List */}
      <FlatList
        data={filteredBatches}
        renderItem={renderBatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="school-outline" size={64} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t("admin:batchAnalytics.noBatches", { defaultValue: "No batches found" })}
            </AppText>
          </View>
        }
      />
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
  summaryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  batchCard: {
    padding: 14,
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  batchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  rankBadge: {
    fontSize: 18,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 28,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  programBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  programText: {
    fontSize: 10,
    fontWeight: "600",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  avgScore: {
    fontSize: 20,
    fontWeight: "700",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  topScorerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  topScorerLabel: {
    fontSize: 11,
  },
  topScorerName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  topScorerScore: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default BatchAnalyticsScreen;
