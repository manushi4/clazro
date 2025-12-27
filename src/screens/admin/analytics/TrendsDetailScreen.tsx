/**
 * TrendsDetailScreen - Analytics Trends Detail Screen
 *
 * Purpose: Detailed view of trends analytics with expanded charts and filters
 * Type: Fixed screen with dedicated analytics content
 * Accessible from: TrendsWidget "View Details" button
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
import { useTrendsQuery } from "../../../hooks/queries/admin/useTrendsQuery";
import type { TrendPeriod, TrendMetric } from "../../../hooks/queries/admin/useTrendsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const METRIC_OPTIONS: { value: TrendMetric; label: string; icon: string }[] = [
  { value: "users", label: "Users", icon: "account-group" },
  { value: "revenue", label: "Revenue", icon: "currency-inr" },
  { value: "engagement", label: "Engagement", icon: "chart-line" },
  { value: "content", label: "Content", icon: "file-document" },
];

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const TrendsDetailScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>("users");
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: selectedMetric,
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("trends-detail");
      addBreadcrumb({
        category: "navigation",
        message: "Trends Detail Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMetricChange = (metric: TrendMetric) => {
    setSelectedMetric(metric);
    trackEvent("trends_metric_change", { metric });
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("trends_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel={t("common:actions.back", { defaultValue: "Go back" })}
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("screens.trendsDetail.title", { defaultValue: "Trends Analytics" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        {/* Metric Selector */}
        <View style={styles.selectorSection}>
          <AppText style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            {t("screens.trendsDetail.selectMetric", { defaultValue: "Select Metric" })}
          </AppText>
          <View style={styles.selectorRow}>
            {METRIC_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorBtn,
                  {
                    backgroundColor:
                      selectedMetric === option.value
                        ? colors.primaryContainer
                        : colors.surfaceVariant,
                    borderRadius: borderRadius.medium,
                  },
                ]}
                onPress={() => handleMetricChange(option.value)}
              >
                <Icon
                  name={option.icon}
                  size={18}
                  color={
                    selectedMetric === option.value
                      ? colors.primary
                      : colors.onSurfaceVariant
                  }
                />
                <AppText
                  style={[
                    styles.selectorText,
                    {
                      color:
                        selectedMetric === option.value
                          ? colors.primary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.selectorSection}>
          <AppText style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            {t("screens.trendsDetail.selectPeriod", { defaultValue: "Time Period" })}
          </AppText>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor:
                      selectedPeriod === option.value
                        ? colors.primary
                        : colors.surfaceVariant,
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
                        selectedPeriod === option.value
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart */}
        {data && data.dataPoints && data.dataPoints.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              {t(`screens.trendsDetail.charts.${selectedMetric}`, {
                defaultValue: `${selectedMetric} Trend`,
              })}
            </AppText>
            <LineChart
              data={{
                labels: data.dataPoints.map((d) => d.label),
                datasets: [
                  {
                    data: data.dataPoints.map((d) => d.value),
                    color: () => colors.primary,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.onSurfaceVariant,
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: colors.primary,
                },
                propsForBackgroundLines: {
                  stroke: colors.outlineVariant,
                  strokeWidth: 0.5,
                },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: borderRadius.medium }}
            />

            {/* Statistics */}
            <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant }]}>
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {data.average?.toLocaleString() || "N/A"}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Average
                </AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.success }]}>
                  {data.highest?.toLocaleString() || "N/A"}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Peak
                </AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.error }]}>
                  {data.lowest?.toLocaleString() || "N/A"}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Low
                </AppText>
              </View>
              <View style={styles.statItem}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon
                    name={(data.changePercent || 0) >= 0 ? "arrow-up" : "arrow-down"}
                    size={14}
                    color={(data.changePercent || 0) >= 0 ? colors.success : colors.error}
                  />
                  <AppText
                    style={[
                      styles.statValue,
                      { color: (data.changePercent || 0) >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {Math.abs(data.changePercent || 0)}%
                  </AppText>
                </View>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Change
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading trends...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load trends data</AppText>
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
  selectorSection: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "500" },
  selectorRow: { flexDirection: "row", gap: 8 },
  selectorBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, gap: 6 },
  selectorText: { fontSize: 12, fontWeight: "500" },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  periodText: { fontSize: 13, fontWeight: "500" },
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 16, marginTop: 16, borderTopWidth: 1 },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default TrendsDetailScreen;
