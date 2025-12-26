/**
 * SessionsAnalyticsScreen - Dedicated Sessions Analytics Screen
 *
 * Purpose: Shows session-specific analytics (active sessions, session duration, activity)
 * Accessible from: ComparisonsWidget "Active Sessions" metric, KpiGrid session metrics
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
import { LineChart, BarChart } from "react-native-chart-kit";

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

export const SessionsAnalyticsScreen: React.FC = () => {
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
      trackScreenView("sessions-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "Sessions Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: EngagementPeriod) => {
    setSelectedPeriod(period);
    trackEvent("sessions_analytics_period_change", { period });
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

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  // Session data by hour (mock for visualization)
  const hourlyData = [
    { hour: "6AM", sessions: 120 },
    { hour: "9AM", sessions: 450 },
    { hour: "12PM", sessions: 380 },
    { hour: "3PM", sessions: 520 },
    { hour: "6PM", sessions: 680 },
    { hour: "9PM", sessions: 420 },
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
          Sessions Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="clock-outline" size={24} color={colors.tertiary} />
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
                    selectedPeriod === option.value ? colors.tertiary : colors.surfaceVariant,
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

        {/* Session Summary Cards */}
        {data && (
          <View style={styles.summaryGrid}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.tertiaryContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="play-circle" size={28} color={colors.tertiary} />
              <AppText style={[styles.summaryValue, { color: colors.tertiary }]}>
                {formatNumber(data.totalSessions)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Total Sessions
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="account-check" size={28} color={colors.primary} />
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>
                {formatNumber(data.weeklyActiveUsers)}
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
              <Icon name="timer" size={28} color={colors.success} />
              <AppText style={[styles.summaryValue, { color: colors.success }]}>
                {formatDuration(data.avgSessionDuration)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Avg Duration
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.warningContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="repeat" size={28} color={colors.warning} />
              <AppText style={[styles.summaryValue, { color: colors.warning }]}>
                {(data.engagementRate * 100).toFixed(0)}%
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Return Rate
              </AppText>
            </View>
          </View>
        )}

        {/* Sessions by Hour Chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <View style={styles.chartHeader}>
            <Icon name="chart-bar" size={20} color={colors.tertiary} />
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Sessions by Time
            </AppText>
          </View>
          <BarChart
            data={{
              labels: hourlyData.map((d) => d.hour),
              datasets: [{ data: hourlyData.map((d) => d.sessions) }],
            }}
            width={chartWidth}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: () => colors.tertiary,
              labelColor: () => colors.onSurfaceVariant,
              barPercentage: 0.6,
              propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
            }}
            style={{ borderRadius: borderRadius.medium }}
            showValuesOnTopOfBars
          />
        </View>

        {/* Activity Trend */}
        {data?.activityTrend && data.activityTrend.length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.surface, borderRadius: borderRadius.large },
            ]}
          >
            <View style={styles.chartHeader}>
              <Icon name="chart-line" size={20} color={colors.primary} />
              <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
                Session Trend
              </AppText>
            </View>
            <LineChart
              data={{
                labels: data.activityTrend.slice(-7).map((p) => p.label.slice(0, 3)),
                datasets: [{ data: data.activityTrend.slice(-7).map((p) => p.sessions || 0) }],
              }}
              width={chartWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.tertiary,
                labelColor: () => colors.onSurfaceVariant,
                propsForDots: { r: "4", strokeWidth: "2", stroke: colors.tertiary },
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              bezier
              style={{ borderRadius: borderRadius.medium }}
            />
          </View>
        )}

        {/* Session Breakdown */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Session Breakdown
          </AppText>
          <View style={styles.breakdownList}>
            <View style={[styles.breakdownItem, { borderBottomColor: colors.outlineVariant }]}>
              <View style={styles.breakdownLeft}>
                <Icon name="cellphone" size={20} color={colors.primary} />
                <AppText style={[styles.breakdownLabel, { color: colors.onSurface }]}>
                  Mobile App
                </AppText>
              </View>
              <AppText style={[styles.breakdownValue, { color: colors.primary }]}>78%</AppText>
            </View>
            <View style={[styles.breakdownItem, { borderBottomColor: colors.outlineVariant }]}>
              <View style={styles.breakdownLeft}>
                <Icon name="laptop" size={20} color={colors.tertiary} />
                <AppText style={[styles.breakdownLabel, { color: colors.onSurface }]}>
                  Web Browser
                </AppText>
              </View>
              <AppText style={[styles.breakdownValue, { color: colors.tertiary }]}>18%</AppText>
            </View>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Icon name="tablet" size={20} color={colors.secondary} />
                <AppText style={[styles.breakdownLabel, { color: colors.onSurface }]}>
                  Tablet
                </AppText>
              </View>
              <AppText style={[styles.breakdownValue, { color: colors.secondary }]}>4%</AppText>
            </View>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading session data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load session data</AppText>
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
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryCard: { width: "47%", padding: 14, alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  statsCard: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  breakdownList: { gap: 0 },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  breakdownLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  breakdownLabel: { fontSize: 14 },
  breakdownValue: { fontSize: 16, fontWeight: "700" },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default SessionsAnalyticsScreen;
