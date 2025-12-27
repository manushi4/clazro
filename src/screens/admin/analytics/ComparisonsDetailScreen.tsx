/**
 * ComparisonsDetailScreen - Analytics Comparisons Detail Screen
 *
 * Purpose: Detailed view comparing metrics across different time periods
 * Type: Fixed screen with dedicated analytics content
 * Accessible from: ComparisonsWidget "View Details" button
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
import { BarChart } from "react-native-chart-kit";

import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { OfflineBanner } from "../../../offline/OfflineBanner";
import { AppText } from "../../../ui/components/AppText";
import { useComparisonsQuery } from "../../../hooks/queries/admin/useComparisonsQuery";
import type { ComparisonPeriod } from "../../../hooks/queries/admin/useComparisonsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: ComparisonPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export const ComparisonsDetailScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>("week");

  const { data, isLoading, error, refetch, isRefetching } = useComparisonsQuery({
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("comparisons-detail");
      addBreadcrumb({
        category: "navigation",
        message: "Comparisons Detail Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: ComparisonPeriod) => {
    setSelectedPeriod(period);
    trackEvent("comparison_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatValue = (value: number, unit?: string): string => {
    if (unit === "₹") {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
      return `₹${value.toLocaleString("en-IN")}`;
    }
    if (unit === "%") return `${value}%`;
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
          {t("screens.comparisonsDetail.title", { defaultValue: "Comparisons" })}
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

        {/* Summary Card */}
        {data && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  data.summary.overallTrend === "positive"
                    ? colors.successContainer
                    : data.summary.overallTrend === "negative"
                    ? colors.errorContainer
                    : colors.surfaceVariant,
                borderRadius: borderRadius.large,
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Icon
                name={
                  data.summary.overallTrend === "positive"
                    ? "trending-up"
                    : data.summary.overallTrend === "negative"
                    ? "trending-down"
                    : "minus"
                }
                size={32}
                color={
                  data.summary.overallTrend === "positive"
                    ? colors.success
                    : data.summary.overallTrend === "negative"
                    ? colors.error
                    : colors.onSurfaceVariant
                }
              />
              <AppText
                style={[
                  styles.summaryTitle,
                  {
                    color:
                      data.summary.overallTrend === "positive"
                        ? colors.success
                        : data.summary.overallTrend === "negative"
                        ? colors.error
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                {data.summary.overallTrend === "positive"
                  ? "Overall Positive"
                  : data.summary.overallTrend === "negative"
                  ? "Overall Negative"
                  : "Neutral Trend"}
              </AppText>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <AppText style={[styles.summaryStatValue, { color: colors.success }]}>
                  {data.summary.improved}
                </AppText>
                <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                  Improved
                </AppText>
              </View>
              <View style={styles.summaryStat}>
                <AppText style={[styles.summaryStatValue, { color: colors.error }]}>
                  {data.summary.declined}
                </AppText>
                <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                  Declined
                </AppText>
              </View>
              <View style={styles.summaryStat}>
                <AppText style={[styles.summaryStatValue, { color: colors.onSurfaceVariant }]}>
                  {data.summary.stable}
                </AppText>
                <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                  Stable
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* Comparison Chart */}
        {data?.metrics && data.metrics.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              {data.periodLabel} vs {data.previousPeriodLabel}
            </AppText>
            <BarChart
              data={{
                labels: data.metrics.slice(0, 4).map((m) => m.label.split(" ")[0]),
                datasets: [{ data: data.metrics.slice(0, 4).map((m) => m.currentValue || 0) }],
              }}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.onSurfaceVariant,
                barPercentage: 0.6,
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              style={{ borderRadius: borderRadius.medium }}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* Metrics Table */}
        {data?.metrics && data.metrics.length > 0 && (
          <View
            style={[
              styles.tableCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Detailed Comparison
            </AppText>
            <View style={[styles.tableHeader, { backgroundColor: colors.surfaceVariant }]}>
              <AppText
                style={[styles.tableHeaderCell, styles.tableNameCol, { color: colors.onSurfaceVariant }]}
              >
                Metric
              </AppText>
              <AppText
                style={[styles.tableHeaderCell, styles.tableValueCol, { color: colors.onSurfaceVariant }]}
              >
                Current
              </AppText>
              <AppText
                style={[styles.tableHeaderCell, styles.tableValueCol, { color: colors.onSurfaceVariant }]}
              >
                Previous
              </AppText>
              <AppText
                style={[styles.tableHeaderCell, styles.tableChangeCol, { color: colors.onSurfaceVariant }]}
              >
                Change
              </AppText>
            </View>
            {data.metrics.map((metric, index) => (
              <View
                key={metric.id}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: colors.outlineVariant,
                    borderBottomWidth: index < data.metrics.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={[styles.tableCell, styles.tableNameCol]}>
                  <View style={styles.metricNameRow}>
                    <Icon name={metric.icon} size={16} color={colors.primary} />
                    <AppText style={[styles.tableName, { color: colors.onSurface }]}>
                      {metric.label}
                    </AppText>
                  </View>
                </View>
                <AppText
                  style={[
                    styles.tableCell,
                    styles.tableValueCol,
                    styles.tableValue,
                    { color: colors.onSurface },
                  ]}
                >
                  {formatValue(metric.currentValue, metric.unit)}
                </AppText>
                <AppText
                  style={[
                    styles.tableCell,
                    styles.tableValueCol,
                    styles.tableValue,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {formatValue(metric.previousValue, metric.unit)}
                </AppText>
                <View style={[styles.tableCell, styles.tableChangeCol]}>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor:
                          metric.changeDirection === "up"
                            ? colors.successContainer
                            : metric.changeDirection === "down"
                            ? colors.errorContainer
                            : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Icon
                      name={
                        metric.changeDirection === "up"
                          ? "arrow-up"
                          : metric.changeDirection === "down"
                          ? "arrow-down"
                          : "minus"
                      }
                      size={12}
                      color={
                        metric.changeDirection === "up"
                          ? colors.success
                          : metric.changeDirection === "down"
                          ? colors.error
                          : colors.onSurfaceVariant
                      }
                    />
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color:
                          metric.changeDirection === "up"
                            ? colors.success
                            : metric.changeDirection === "down"
                            ? colors.error
                            : colors.onSurfaceVariant,
                      }}
                    >
                      {metric.changePercent}%
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading comparison data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load comparison data</AppText>
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
  summaryCard: { padding: 20, gap: 16 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryTitle: { fontSize: 18, fontWeight: "600" },
  summaryStats: { flexDirection: "row", justifyContent: "space-around" },
  summaryStat: { alignItems: "center", gap: 4 },
  summaryStatValue: { fontSize: 24, fontWeight: "700" },
  summaryStatLabel: { fontSize: 12 },
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  tableCard: { padding: 16 },
  tableHeader: { flexDirection: "row", padding: 10, borderRadius: 8, marginBottom: 4 },
  tableHeaderCell: { fontSize: 11, fontWeight: "600" },
  tableNameCol: { flex: 1 },
  tableValueCol: { width: 70, textAlign: "right" },
  tableChangeCol: { width: 60, alignItems: "flex-end" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  tableCell: {},
  metricNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tableName: { fontSize: 13, fontWeight: "500" },
  tableValue: { fontSize: 13, fontWeight: "600" },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default ComparisonsDetailScreen;
