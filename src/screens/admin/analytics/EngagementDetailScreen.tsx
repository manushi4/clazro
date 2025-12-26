/**
 * EngagementDetailScreen - Analytics Engagement Detail Screen
 *
 * Purpose: Detailed view of user engagement metrics and activity patterns
 * Type: Fixed screen with dedicated analytics content
 * Accessible from: EngagementWidget "View Details" button
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LineChart } from "react-native-chart-kit";

import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { OfflineBanner } from "../../../offline/OfflineBanner";
import { AppText } from "../../../ui/components/AppText";
import { useEngagementQuery } from "../../../hooks/queries/admin/useEngagementQuery";
import type { EngagementPeriod } from "../../../hooks/queries/admin/useEngagementQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: EngagementPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const EngagementDetailScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<EngagementPeriod>("week");

  const { data, isLoading, error, refetch, isRefetching } = useEngagementQuery({
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("engagement-detail");
      addBreadcrumb({
        category: "navigation",
        message: "Engagement Detail Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: EngagementPeriod) => {
    setSelectedPeriod(period);
    trackEvent("engagement_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("screens.engagementDetail.title", { defaultValue: "Engagement Analytics" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodBtn,
                {
                  backgroundColor:
                    selectedPeriod === option.value ? colors.primary : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handlePeriodChange(option.value)}
            >
              <AppText
                style={[
                  styles.periodText,
                  {
                    color:
                      selectedPeriod === option.value ? colors.onPrimary : colors.onSurfaceVariant,
                  },
                ]}
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        {data && (
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="account-group" size={24} color={colors.primary} />
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>
                {data.weeklyActiveUsers?.toLocaleString() || 0}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Active Users
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.successContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="clock-outline" size={24} color={colors.success} />
              <AppText style={[styles.summaryValue, { color: colors.success }]}>
                {formatDuration(data.avgSessionDuration || 0)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Avg Session
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.warningContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="gesture-tap" size={24} color={colors.warning} />
              <AppText style={[styles.summaryValue, { color: colors.warning }]}>
                {data.totalSessions?.toLocaleString() || 0}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Sessions
              </AppText>
            </View>
          </View>
        )}

        {/* Engagement Rate Card */}
        {data && (
          <View
            style={[
              styles.rateCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <View style={styles.rateHeader}>
              <AppText style={[styles.rateTitle, { color: colors.onSurface }]}>
                Engagement Rate
              </AppText>
              <View
                style={[
                  styles.rateBadge,
                  {
                    backgroundColor:
                      (data.engagementRate || 0) >= 70
                        ? colors.successContainer
                        : (data.engagementRate || 0) >= 40
                        ? colors.warningContainer
                        : colors.errorContainer,
                  },
                ]}
              >
                <AppText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color:
                      (data.engagementRate || 0) >= 70
                        ? colors.success
                        : (data.engagementRate || 0) >= 40
                        ? colors.warning
                        : colors.error,
                  }}
                >
                  {(data.engagementRate || 0) >= 70
                    ? "Excellent"
                    : (data.engagementRate || 0) >= 40
                    ? "Good"
                    : "Needs Work"}
                </AppText>
              </View>
            </View>
            <View style={styles.rateProgress}>
              <View style={[styles.rateBarBg, { backgroundColor: colors.outlineVariant }]}>
                <View
                  style={[
                    styles.rateBarFill,
                    {
                      backgroundColor:
                        (data.engagementRate || 0) >= 70
                          ? colors.success
                          : (data.engagementRate || 0) >= 40
                          ? colors.warning
                          : colors.error,
                      width: `${Math.min(data.engagementRate || 0, 100)}%`,
                    },
                  ]}
                />
              </View>
              <AppText style={[styles.rateValue, { color: colors.onSurface }]}>
                {data.engagementRate || 0}%
              </AppText>
            </View>
          </View>
        )}

        {/* Activity Trend Chart */}
        {data?.activityTrend && data.activityTrend.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Activity Trend
            </AppText>
            <LineChart
              data={{
                labels: data.activityTrend.map((d) => d.label),
                datasets: [
                  {
                    data: data.activityTrend.map((d) => d.value),
                    color: () => colors.primary,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={chartWidth}
              height={180}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.onSurfaceVariant,
                propsForDots: { r: "3", strokeWidth: "2", stroke: colors.primary },
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              bezier
              style={{ borderRadius: borderRadius.medium }}
            />
          </View>
        )}

        {/* Engagement by Role */}
        {data?.engagementByRole && data.engagementByRole.length > 0 && (
          <View
            style={[
              styles.featuresCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Users by Role
            </AppText>
            {data.engagementByRole.map((role, index) => (
              <View key={role.role} style={styles.featureRow}>
                <View style={styles.featureLeft}>
                  <View
                    style={[
                      styles.featureRank,
                      { backgroundColor: index < 3 ? colors.primaryContainer : colors.surfaceVariant },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: index < 3 ? colors.primary : colors.onSurfaceVariant,
                      }}
                    >
                      {index + 1}
                    </AppText>
                  </View>
                  <View style={styles.featureInfo}>
                    <AppText style={[styles.featureName, { color: colors.onSurface }]}>
                      {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                    </AppText>
                    <AppText style={[styles.featureCount, { color: colors.onSurfaceVariant }]}>
                      {role.count.toLocaleString()} users
                    </AppText>
                  </View>
                </View>
                <View style={styles.featureBar}>
                  <View
                    style={[
                      styles.featureBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${role.percentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading engagement data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load engagement data</AppText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: colors.error }]}
            >
              <AppText style={{ color: colors.onError }}>Retry</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, minWidth: 32, minHeight: 44, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  periodText: { fontSize: 14, fontWeight: "500" },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: { flex: 1, padding: 14, alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  rateCard: { padding: 16, gap: 12 },
  rateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rateTitle: { fontSize: 16, fontWeight: "600" },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rateProgress: { flexDirection: "row", alignItems: "center", gap: 12 },
  rateBarBg: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  rateBarFill: { height: "100%", borderRadius: 5 },
  rateValue: { fontSize: 18, fontWeight: "700", minWidth: 50, textAlign: "right" },
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  featuresCard: { padding: 16, gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  featureRank: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: "500" },
  featureCount: { fontSize: 11 },
  featureBar: { width: 80, height: 6, backgroundColor: "#e0e0e0", borderRadius: 3, overflow: "hidden" },
  featureBarFill: { height: "100%", borderRadius: 3 },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default EngagementDetailScreen;
