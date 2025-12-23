/**
 * GradeAnalyticsScreen - Dedicated Academic/Grade Analytics Screen
 *
 * Purpose: Shows grade-specific analytics (academic performance, pass rates, grades distribution)
 * Accessible from: KpiGridWidget grade/academic metrics
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
import { useTrendsQuery } from "../../../hooks/queries/admin/useTrendsQuery";
import type { TrendPeriod } from "../../../hooks/queries/admin/useTrendsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const GradeAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  // Fetch grades/academic metric
  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: "grades",
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("grade-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "Grade Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("grade_analytics_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Grade distribution data
  const gradeDistribution = {
    labels: ["A+", "A", "B+", "B", "C", "D"],
    datasets: [{ data: [15, 25, 28, 18, 10, 4] }],
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
          Academic Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="school" size={24} color={colors.primary} />
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
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="chart-line" size={28} color={colors.primary} />
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {formatPercent(data?.currentValue || 78.5)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Avg Score
            </AppText>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.successContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="medal" size={28} color={colors.success} />
            <AppText style={[styles.summaryValue, { color: colors.success }]}>
              {formatPercent(92.3)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Pass Rate
            </AppText>
          </View>
        </View>

        {/* Performance Trend Chart */}
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
                Performance Trend
              </AppText>
            </View>
            <LineChart
              data={{
                labels: data.dataPoints.slice(-7).map((p) => p.label.slice(0, 3)),
                datasets: [{ data: data.dataPoints.slice(-7).map((p) => p.value || 75) }],
              }}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 1,
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

        {/* Grade Distribution */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <View style={styles.chartHeader}>
            <Icon name="chart-bar" size={20} color={colors.primary} />
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Grade Distribution
            </AppText>
          </View>
          <BarChart
            data={gradeDistribution}
            width={chartWidth}
            height={180}
            yAxisLabel=""
            yAxisSuffix="%"
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
          />
        </View>

        {/* Academic Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Academic Overview
          </AppText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="trophy" size={24} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                156
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Top Scorers
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="chart-timeline-variant" size={24} color={colors.success} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                +5.2%
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Improvement
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="alert-circle" size={24} color={colors.error} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                23
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                At Risk
              </AppText>
            </View>
          </View>
        </View>

        {/* Subject Performance */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Subject Performance
          </AppText>
          {[
            { subject: "Mathematics", avg: 82.5, change: 3.2 },
            { subject: "Science", avg: 78.9, change: 1.8 },
            { subject: "English", avg: 85.2, change: -0.5 },
            { subject: "Social Studies", avg: 76.4, change: 2.1 },
            { subject: "Hindi", avg: 81.3, change: 1.5 },
          ].map((item) => (
            <View key={item.subject} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <AppText style={[styles.subjectName, { color: colors.onSurface }]}>
                  {item.subject}
                </AppText>
              </View>
              <View style={styles.scoreInfo}>
                <View
                  style={[
                    styles.scoreBar,
                    { backgroundColor: colors.surfaceVariant, borderRadius: 4 },
                  ]}
                >
                  <View
                    style={[
                      styles.scoreFill,
                      {
                        width: `${item.avg}%`,
                        backgroundColor: item.avg >= 80 ? colors.success : item.avg >= 60 ? colors.warning : colors.error,
                        borderRadius: 4,
                      },
                    ]}
                  />
                </View>
                <View style={styles.scoreValues}>
                  <AppText style={[styles.scoreText, { color: colors.onSurface }]}>
                    {formatPercent(item.avg)}
                  </AppText>
                  <AppText
                    style={[
                      styles.changeText,
                      { color: item.change >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {item.change >= 0 ? "+" : ""}{item.change}%
                  </AppText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Class Rankings */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Class Rankings
          </AppText>
          {[
            { rank: 1, class: "Class 10-A", avg: 84.2, icon: "medal", color: "#FFD700" },
            { rank: 2, class: "Class 9-A", avg: 82.1, icon: "medal-outline", color: "#C0C0C0" },
            { rank: 3, class: "Class 10-B", avg: 80.5, icon: "medal-outline", color: "#CD7F32" },
          ].map((item) => (
            <View key={item.rank} style={styles.rankRow}>
              <View style={[styles.rankBadge, { backgroundColor: `${item.color}20` }]}>
                <Icon name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.rankInfo}>
                <AppText style={[styles.rankClass, { color: colors.onSurface }]}>
                  {item.class}
                </AppText>
                <AppText style={[styles.rankPosition, { color: colors.onSurfaceVariant }]}>
                  Rank #{item.rank}
                </AppText>
              </View>
              <AppText style={[styles.rankAvg, { color: colors.primary }]}>
                {formatPercent(item.avg)}
              </AppText>
            </View>
          ))}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading academic analytics...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load academic data</AppText>
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
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 14, fontWeight: "500" },
  scoreInfo: { flexDirection: "column", alignItems: "flex-end", gap: 4, flex: 1.2 },
  scoreBar: { width: "100%", height: 8, overflow: "hidden" },
  scoreFill: { height: "100%" },
  scoreValues: { flexDirection: "row", gap: 8 },
  scoreText: { fontSize: 14, fontWeight: "600" },
  changeText: { fontSize: 12, fontWeight: "500" },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rankInfo: { flex: 1 },
  rankClass: { fontSize: 14, fontWeight: "500" },
  rankPosition: { fontSize: 12, marginTop: 2 },
  rankAvg: { fontSize: 16, fontWeight: "700" },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default GradeAnalyticsScreen;
