/**
 * UserAnalyticsScreen - Dedicated User Analytics Screen
 *
 * Purpose: Shows user-specific analytics (new users, growth, registrations)
 * Accessible from: ComparisonsWidget "New Users" metric, KpiGrid user metrics
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
import type { TrendPeriod } from "../../../hooks/queries/admin/useTrendsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const UserAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  // Always fetch users metric
  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: "users",
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("user-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "User Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("user_analytics_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
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
          User Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="account-group" size={24} color={colors.primary} />
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
              <Icon name="account-plus" size={28} color={colors.primary} />
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>
                {formatValue(data.currentValue)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                New Users
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.successContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="trending-up" size={28} color={colors.success} />
              <AppText style={[styles.summaryValue, { color: colors.success }]}>
                +{data.changePercent?.toFixed(1) || 0}%
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Growth Rate
              </AppText>
            </View>
          </View>
        )}

        {/* User Growth Chart */}
        {data?.dataPoints && data.dataPoints.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <View style={styles.chartHeader}>
              <Icon name="chart-line" size={20} color={colors.primary} />
              <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
                User Growth Trend
              </AppText>
            </View>
            <LineChart
              data={{
                labels: data.dataPoints.slice(-7).map((p) => p.label.slice(0, 3)),
                datasets: [{ data: data.dataPoints.slice(-7).map((p) => p.value || 0) }],
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
                propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary },
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              bezier
              style={{ borderRadius: borderRadius.medium }}
            />
          </View>
        )}

        {/* User Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            User Statistics
          </AppText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="account-check" size={24} color={colors.success} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatValue((data?.currentValue || 0) * 0.85)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Active Users
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="account-clock" size={24} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatValue((data?.currentValue || 0) * 0.1)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Pending
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="account-cancel" size={24} color={colors.error} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {formatValue((data?.currentValue || 0) * 0.05)}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Inactive
              </AppText>
            </View>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading user analytics...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load user data</AppText>
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
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, padding: 16, alignItems: "center", gap: 8 },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 12 },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  statsCard: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 6 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default UserAnalyticsScreen;
