/**
 * BatchListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display list of all batches with performance metrics
 * Type: Dynamic (widget-based)
 * Accessible from: BatchPerformanceWidget "View All" button
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
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../../theme/useAppTheme";

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
import { useBatchPerformanceQuery } from "../../../hooks/queries/admin/useBatchPerformanceQuery";

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
  onFocused?: () => void;
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
// COMPONENT
// =============================================================================

export const BatchListScreen: React.FC<Props> = ({
  screenId = "batch-list",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [programFilter, setProgramFilter] = useState<string | null>(null);

  // Fetch all batches (no limit)
  const { data, isLoading, error, refetch } = useBatchPerformanceQuery({ limit: 50 });

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  const handleBack = useCallback(() => {
    trackEvent("batch_list_back_pressed");
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

  const handleBatchTap = useCallback((batchId: string, batchName: string) => {
    trackEvent("batch_list_batch_tap", { batchId, batchName });
    navigation.navigate("batch-detail", { batchId });
  }, [navigation, trackEvent]);

  const getPerformanceColor = (score: number): string => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  // Filter batches by program
  const filteredBatches = programFilter
    ? data?.batches.filter(b => b.program === programFilter)
    : data?.batches;

  // Loading state
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

  // Error state
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
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.retry", { defaultValue: "Try Again" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("admin:batchList.title", { defaultValue: "All Batches" })}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Program Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: colors.outlineVariant },
              !programFilter && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setProgramFilter(null)}
          >
            <AppText style={[styles.filterChipText, { color: !programFilter ? "#FFF" : colors.onSurface }]}>
              All ({data?.batches.length || 0})
            </AppText>
          </TouchableOpacity>
          {["JEE", "NEET", "Foundation"].map((program) => {
            const count = data?.batches.filter(b => b.program === program).length || 0;
            const isActive = programFilter === program;
            return (
              <TouchableOpacity
                key={program}
                style={[
                  styles.filterChip,
                  { borderColor: PROGRAM_COLORS[program] },
                  isActive && { backgroundColor: PROGRAM_COLORS[program] },
                ]}
                onPress={() => setProgramFilter(isActive ? null : program)}
              >
                <AppText style={[styles.filterChipText, { color: isActive ? "#FFF" : PROGRAM_COLORS[program] }]}>
                  {program} ({count})
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary */}
      {data && (
        <View style={[styles.summaryBar, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>{data.totalBatches}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Batches</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>{data.overallAvg}%</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Avg Score</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <View style={styles.trendRow}>
              <Icon
                name={data.overallTrend >= 0 ? "trending-up" : "trending-down"}
                size={16}
                color={data.overallTrend >= 0 ? colors.success : colors.error}
              />
              <AppText style={[styles.summaryValue, { color: data.overallTrend >= 0 ? colors.success : colors.error }]}>
                {data.overallTrend >= 0 ? "+" : ""}{data.overallTrend}%
              </AppText>
            </View>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>vs Last Term</AppText>
          </View>
        </View>
      )}

      {/* Batch List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {filteredBatches?.map((batch, index) => {
          const programColor = PROGRAM_COLORS[batch.program] || colors.primary;
          const performanceColor = getPerformanceColor(batch.avgScore);
          const isTopThree = batch.rank <= 3;

          return (
            <TouchableOpacity
              key={batch.id}
              style={[styles.batchCard, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
              onPress={() => handleBatchTap(batch.batchId, batch.name)}
            >
              <View style={styles.batchHeader}>
                <View style={styles.batchRankName}>
                  {isTopThree ? (
                    <AppText style={styles.rankBadge}>{RANK_BADGES[batch.rank - 1]}</AppText>
                  ) : (
                    <View style={[styles.rankCircle, { backgroundColor: colors.surfaceVariant }]}>
                      <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>{batch.rank}</AppText>
                    </View>
                  )}
                  <View style={styles.batchNameContainer}>
                    <AppText style={[styles.batchName, { color: colors.onSurface }]} numberOfLines={1}>
                      {batch.name}
                    </AppText>
                    <View style={[styles.programBadge, { backgroundColor: `${programColor}20` }]}>
                      <AppText style={[styles.programBadgeText, { color: programColor }]}>{batch.program}</AppText>
                    </View>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </View>

              <View style={styles.progressRow}>
                <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[styles.progressFill, { backgroundColor: performanceColor, width: `${batch.avgScore}%` }]}
                  />
                </View>
                <AppText style={[styles.avgScore, { color: performanceColor }]}>{batch.avgScore}%</AppText>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="account-group" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                    {batch.studentCount} students
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Icon name="clipboard-text" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                    {batch.testsCount} tests
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Icon
                    name={batch.trend >= 0 ? "trending-up" : "trending-down"}
                    size={14}
                    color={batch.trend >= 0 ? colors.success : colors.error}
                  />
                  <AppText style={[styles.statText, { color: batch.trend >= 0 ? colors.success : colors.error }]}>
                    {batch.trend >= 0 ? "+" : ""}{batch.trend}%
                  </AppText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredBatches?.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="school-outline" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No batches found for this filter
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
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  errorMessage: { fontSize: 14, textAlign: "center" },
  actionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  actionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerSpacer: { width: 32 },

  filterContainer: { paddingVertical: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: "500" },

  summaryBar: { flexDirection: "row", marginHorizontal: 16, borderRadius: 8, padding: 12, marginBottom: 8 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  summaryDivider: { width: 1, marginHorizontal: 8 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  scrollView: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  batchCard: { padding: 14 },
  batchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  batchRankName: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rankBadge: { fontSize: 20 },
  rankCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rankNumber: { fontSize: 12, fontWeight: "600" },
  batchNameContainer: { flex: 1 },
  batchName: { fontSize: 14, fontWeight: "600" },
  programBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  programBadgeText: { fontSize: 10, fontWeight: "600" },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  avgScore: { fontSize: 13, fontWeight: "700", minWidth: 45, textAlign: "right" },

  statsRow: { flexDirection: "row", gap: 16 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 11 },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
});

export default BatchListScreen;
