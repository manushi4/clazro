/**
 * GrowthDetailScreen - Analytics Growth Detail Screen
 *
 * Purpose: Detailed view of growth metrics with targets and comparisons
 * Type: Fixed screen with dedicated analytics content
 * Accessible from: GrowthWidget "View Details" button
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
import { useGrowthMetricsQuery, GrowthPeriod } from "../../../hooks/queries/admin/useGrowthMetricsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: GrowthPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const GrowthDetailScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<GrowthPeriod>("month");

  const { data, isLoading, error, refetch, isRefetching } = useGrowthMetricsQuery({
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("growth-detail");
      addBreadcrumb({
        category: "navigation",
        message: "Growth Detail Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: GrowthPeriod) => {
    setSelectedPeriod(period);
    trackEvent("growth_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatValue = (value: number, metricId: string): string => {
    if (metricId === "revenue") {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
      return `₹${value.toLocaleString("en-IN")}`;
    }
    if (metricId === "engagement") return `${value}%`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
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
          {t("screens.growthDetail.title", { defaultValue: "Growth Metrics" })}
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

        {/* Overall Growth Banner */}
        {data && (
          <View
            style={[
              styles.overallCard,
              {
                backgroundColor:
                  data.overallDirection === "up"
                    ? colors.successContainer
                    : data.overallDirection === "down"
                    ? colors.errorContainer
                    : colors.surfaceVariant,
                borderRadius: borderRadius.large,
              },
            ]}
          >
            <Icon
              name={
                data.overallDirection === "up"
                  ? "trending-up"
                  : data.overallDirection === "down"
                  ? "trending-down"
                  : "minus"
              }
              size={36}
              color={
                data.overallDirection === "up"
                  ? colors.success
                  : data.overallDirection === "down"
                  ? colors.error
                  : colors.onSurfaceVariant
              }
            />
            <View style={styles.overallText}>
              <AppText
                style={[
                  styles.overallValue,
                  {
                    color:
                      data.overallDirection === "up"
                        ? colors.success
                        : data.overallDirection === "down"
                        ? colors.error
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                {data.overallGrowth}%
              </AppText>
              <AppText style={[styles.overallLabel, { color: colors.onSurfaceVariant }]}>
                Overall Growth vs last {selectedPeriod}
              </AppText>
            </View>
          </View>
        )}

        {/* Metrics Grid */}
        {data?.metrics && (
          <View style={styles.metricsGrid}>
            {data.metrics.map((metric) => (
              <View
                key={metric.id}
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderRadius: borderRadius.medium },
                ]}
              >
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIcon, { backgroundColor: `${colors.primary}20` }]}>
                    <Icon name={metric.icon} size={20} color={colors.primary} />
                  </View>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor:
                          metric.changeDirection === "up"
                            ? colors.successContainer
                            : colors.errorContainer,
                      },
                    ]}
                  >
                    <Icon
                      name={metric.changeDirection === "up" ? "arrow-up" : "arrow-down"}
                      size={12}
                      color={metric.changeDirection === "up" ? colors.success : colors.error}
                    />
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: metric.changeDirection === "up" ? colors.success : colors.error,
                      }}
                    >
                      {metric.changePercent}%
                    </AppText>
                  </View>
                </View>

                <AppText style={[styles.metricValue, { color: colors.onSurface }]}>
                  {formatValue(metric.value, metric.id)}
                </AppText>
                <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                  {metric.label}
                </AppText>

                {/* Target Progress */}
                {metric.target && (
                  <View style={styles.targetSection}>
                    <View style={[styles.targetBar, { backgroundColor: colors.outlineVariant }]}>
                      <View
                        style={[
                          styles.targetFill,
                          {
                            backgroundColor:
                              (metric.targetPercent || 0) >= 100
                                ? colors.success
                                : (metric.targetPercent || 0) >= 80
                                ? colors.warning
                                : colors.error,
                            width: `${Math.min(metric.targetPercent || 0, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <AppText style={[styles.targetText, { color: colors.onSurfaceVariant }]}>
                      {metric.targetPercent}% of target ({formatValue(metric.target, metric.id)})
                    </AppText>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* User Growth Trend Chart */}
        {data?.userGrowthTrend && data.userGrowthTrend.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              User Growth Trend
            </AppText>
            <LineChart
              data={{
                labels: data.userGrowthTrend.map((d) => d.label),
                datasets: [{ data: data.userGrowthTrend.map((d) => d.value), color: () => colors.primary, strokeWidth: 2 }],
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

        {/* Highlights */}
        {data?.highlights && (
          <View style={[styles.highlightsCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>Highlights</AppText>
            <View style={styles.highlightsGrid}>
              <View style={[styles.highlightItem, { backgroundColor: colors.successContainer }]}>
                <Icon name="star" size={20} color={colors.success} />
                <AppText style={[styles.highlightLabel, { color: colors.onSurfaceVariant }]}>Best Performing</AppText>
                <AppText style={[styles.highlightValue, { color: colors.success }]}>{data.highlights.bestPerforming}</AppText>
              </View>
              <View style={[styles.highlightItem, { backgroundColor: colors.warningContainer }]}>
                <Icon name="alert" size={20} color={colors.warning} />
                <AppText style={[styles.highlightLabel, { color: colors.onSurfaceVariant }]}>Needs Attention</AppText>
                <AppText style={[styles.highlightValue, { color: colors.warning }]}>{data.highlights.needsAttention}</AppText>
              </View>
            </View>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading growth data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load growth data</AppText>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4, minWidth: 32, minHeight: 44, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  periodText: { fontSize: 14, fontWeight: "500" },
  overallCard: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  overallText: { flex: 1 },
  overallValue: { fontSize: 32, fontWeight: "700" },
  overallLabel: { fontSize: 13 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: { width: "47%", padding: 16 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  changeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 2 },
  metricValue: { fontSize: 22, fontWeight: "700" },
  metricLabel: { fontSize: 13, marginTop: 2 },
  targetSection: { marginTop: 12, gap: 4 },
  targetBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  targetFill: { height: "100%", borderRadius: 3 },
  targetText: { fontSize: 10 },
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  highlightsCard: { padding: 16 },
  highlightsGrid: { flexDirection: "row", gap: 12 },
  highlightItem: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center", gap: 8 },
  highlightLabel: { fontSize: 11 },
  highlightValue: { fontSize: 14, fontWeight: "600" },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default GrowthDetailScreen;
