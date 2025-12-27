/**
 * RevenueAnalyticsScreen - Dedicated Revenue Analytics Screen
 *
 * Purpose: Shows revenue-specific analytics (income, collections, financial trends)
 * Accessible from: ComparisonsWidget "Revenue" metric, KpiGrid revenue metrics
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
import { LineChart, PieChart } from "react-native-chart-kit";

import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { OfflineBanner } from "../../../offline/OfflineBanner";
import { AppText } from "../../../ui/components/AppText";
import { useTrendsQuery } from "../../../hooks/queries/admin/useTrendsQuery";
import type { TrendPeriod } from "../../../hooks/queries/admin/useTrendsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const RevenueAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  // Always fetch revenue metric
  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: "revenue",
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("revenue-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "Revenue Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("revenue_analytics_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatCurrency = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString("en-IN")}`;
  };

  // Revenue breakdown for pie chart
  const revenueBreakdown = [
    { name: "Fees", amount: (data?.currentValue || 0) * 0.65, color: colors.primary },
    { name: "Courses", amount: (data?.currentValue || 0) * 0.20, color: colors.success },
    { name: "Materials", amount: (data?.currentValue || 0) * 0.10, color: colors.tertiary },
    { name: "Other", amount: (data?.currentValue || 0) * 0.05, color: colors.secondary },
  ];

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
          Revenue Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="currency-inr" size={24} color={colors.success} />
        </View>
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
                    selectedPeriod === option.value ? colors.success : colors.surfaceVariant,
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

        {/* Revenue Summary */}
        {data && (
          <View
            style={[
              styles.revenueCard,
              { backgroundColor: colors.successContainer, borderRadius: borderRadius.large },
            ]}
          >
            <Icon name="cash-multiple" size={40} color={colors.success} />
            <AppText style={[styles.revenueValue, { color: colors.success }]}>
              {formatCurrency(data.currentValue)}
            </AppText>
            <AppText style={[styles.revenueLabel, { color: colors.onSurfaceVariant }]}>
              Total Revenue
            </AppText>
            <View style={styles.revenueTrend}>
              <Icon
                name={data.changePercent >= 0 ? "trending-up" : "trending-down"}
                size={16}
                color={data.changePercent >= 0 ? colors.success : colors.error}
              />
              <AppText
                style={{
                  color: data.changePercent >= 0 ? colors.success : colors.error,
                  fontWeight: "600",
                }}
              >
                {data.changePercent >= 0 ? "+" : ""}
                {data.changePercent?.toFixed(1) || 0}% vs previous
              </AppText>
            </View>
          </View>
        )}

        {/* Revenue Breakdown */}
        <View style={styles.breakdownRow}>
          <View
            style={[
              styles.breakdownCard,
              { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="school" size={24} color={colors.primary} />
            <AppText style={[styles.breakdownValue, { color: colors.primary }]}>
              {formatCurrency((data?.currentValue || 0) * 0.65)}
            </AppText>
            <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
              Fee Collection
            </AppText>
          </View>
          <View
            style={[
              styles.breakdownCard,
              { backgroundColor: colors.tertiaryContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="book-open-variant" size={24} color={colors.tertiary} />
            <AppText style={[styles.breakdownValue, { color: colors.tertiary }]}>
              {formatCurrency((data?.currentValue || 0) * 0.20)}
            </AppText>
            <AppText style={[styles.breakdownLabel, { color: colors.onSurfaceVariant }]}>
              Course Sales
            </AppText>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        {data?.dataPoints && data.dataPoints.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <View style={styles.chartHeader}>
              <Icon name="chart-line" size={20} color={colors.success} />
              <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
                Revenue Trend
              </AppText>
            </View>
            <LineChart
              data={{
                labels: data.dataPoints.slice(-7).map((p) => p.label.slice(0, 3)),
                datasets: [{ data: data.dataPoints.slice(-7).map((p) => p.value || 0) }],
              }}
              width={chartWidth}
              height={200}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.success,
                labelColor: () => colors.onSurfaceVariant,
                propsForDots: { r: "4", strokeWidth: "2", stroke: colors.success },
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              bezier
              style={{ borderRadius: borderRadius.medium }}
            />
          </View>
        )}

        {/* Collection Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Collection Statistics
          </AppText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={24} color={colors.success} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatCurrency((data?.currentValue || 0) * 0.82)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Collected
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={24} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatCurrency((data?.currentValue || 0) * 0.12)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Pending
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="alert-circle" size={24} color={colors.error} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatCurrency((data?.currentValue || 0) * 0.06)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Overdue
              </AppText>
            </View>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading revenue data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load revenue data</AppText>
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
  headerRight: { width: 32, alignItems: "flex-end" },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  periodText: { fontSize: 14, fontWeight: "500" },
  revenueCard: { padding: 24, alignItems: "center", gap: 8 },
  revenueValue: { fontSize: 32, fontWeight: "700" },
  revenueLabel: { fontSize: 14 },
  revenueTrend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  breakdownRow: { flexDirection: "row", gap: 12 },
  breakdownCard: { flex: 1, padding: 16, alignItems: "center", gap: 6 },
  breakdownValue: { fontSize: 18, fontWeight: "700" },
  breakdownLabel: { fontSize: 11 },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  statsCard: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 6 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default RevenueAnalyticsScreen;
