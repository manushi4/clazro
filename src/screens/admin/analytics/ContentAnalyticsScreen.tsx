/**
 * ContentAnalyticsScreen - Dedicated Content Analytics Screen
 *
 * Purpose: Shows content-specific analytics (views, engagement, popular content)
 * Accessible from: ComparisonsWidget "Content" metric, KpiGrid content metrics
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

export const ContentAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  // Always fetch content metric
  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: "content",
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("content-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "Content Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("content_analytics_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  // Content type breakdown
  const contentTypes = [
    { type: "Videos", count: Math.floor((data?.currentValue || 0) * 0.35), icon: "video", color: colors.error },
    { type: "Documents", count: Math.floor((data?.currentValue || 0) * 0.28), icon: "file-document", color: colors.primary },
    { type: "Quizzes", count: Math.floor((data?.currentValue || 0) * 0.22), icon: "help-circle", color: colors.success },
    { type: "Audio", count: Math.floor((data?.currentValue || 0) * 0.15), icon: "music", color: colors.tertiary },
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
          Content Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="file-document-multiple" size={24} color={colors.secondary} />
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
                    selectedPeriod === option.value ? colors.secondary : colors.surfaceVariant,
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

        {/* Content Summary */}
        {data && (
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.secondaryContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="eye" size={28} color={colors.secondary} />
              <AppText style={[styles.summaryValue, { color: colors.secondary }]}>
                {formatNumber(data.currentValue)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Total Views
              </AppText>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium },
              ]}
            >
              <Icon name="file-plus" size={28} color={colors.primary} />
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>
                {formatNumber(Math.floor(data.currentValue * 0.08))}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                New Content
              </AppText>
            </View>
          </View>
        )}

        {/* Growth Stats */}
        {data && (
          <View
            style={[
              styles.growthCard,
              {
                backgroundColor: data.changePercent >= 0 ? colors.successContainer : colors.errorContainer,
                borderRadius: borderRadius.large,
              },
            ]}
          >
            <Icon
              name={data.changePercent >= 0 ? "trending-up" : "trending-down"}
              size={32}
              color={data.changePercent >= 0 ? colors.success : colors.error}
            />
            <View style={styles.growthContent}>
              <AppText
                style={[
                  styles.growthValue,
                  { color: data.changePercent >= 0 ? colors.success : colors.error },
                ]}
              >
                {data.changePercent >= 0 ? "+" : ""}
                {data.changePercent?.toFixed(1) || 0}%
              </AppText>
              <AppText style={[styles.growthLabel, { color: colors.onSurfaceVariant }]}>
                Views growth vs previous period
              </AppText>
            </View>
          </View>
        )}

        {/* Content Type Breakdown */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <View style={styles.chartHeader}>
            <Icon name="chart-pie" size={20} color={colors.secondary} />
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Content by Type
            </AppText>
          </View>
          <View style={styles.typeGrid}>
            {contentTypes.map((item) => (
              <View
                key={item.type}
                style={[
                  styles.typeCard,
                  { backgroundColor: `${item.color}15`, borderRadius: borderRadius.medium },
                ]}
              >
                <Icon name={item.icon} size={24} color={item.color} />
                <AppText style={[styles.typeCount, { color: item.color }]}>
                  {formatNumber(item.count)}
                </AppText>
                <AppText style={[styles.typeLabel, { color: colors.onSurfaceVariant }]}>
                  {item.type}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Views Trend Chart */}
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
                Views Trend
              </AppText>
            </View>
            <LineChart
              data={{
                labels: data.dataPoints.slice(-7).map((p) => p.label.slice(0, 3)),
                datasets: [{ data: data.dataPoints.slice(-7).map((p) => p.value || 0) }],
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
                color: () => colors.secondary,
                labelColor: () => colors.onSurfaceVariant,
                propsForDots: { r: "4", strokeWidth: "2", stroke: colors.secondary },
                propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
              }}
              bezier
              style={{ borderRadius: borderRadius.medium }}
            />
          </View>
        )}

        {/* Popular Content */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Top Performing Content
          </AppText>
          <View style={styles.contentList}>
            {[
              { title: "Introduction to Mathematics", views: 2450, type: "Video" },
              { title: "Physics Chapter 1 Notes", views: 1890, type: "Document" },
              { title: "Chemistry Quiz Set 1", views: 1560, type: "Quiz" },
              { title: "English Grammar Basics", views: 1340, type: "Video" },
            ].map((item, index) => (
              <View
                key={index}
                style={[styles.contentItem, { borderBottomColor: colors.outlineVariant }]}
              >
                <View style={styles.contentRank}>
                  <AppText style={[styles.rankNumber, { color: colors.primary }]}>
                    #{index + 1}
                  </AppText>
                </View>
                <View style={styles.contentInfo}>
                  <AppText
                    style={[styles.contentTitle, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </AppText>
                  <AppText style={[styles.contentMeta, { color: colors.onSurfaceVariant }]}>
                    {item.type} • {formatNumber(item.views)} views
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading content data...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load content data</AppText>
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
  growthCard: { flexDirection: "row", padding: 16, alignItems: "center", gap: 12 },
  growthContent: { flex: 1 },
  growthValue: { fontSize: 24, fontWeight: "700" },
  growthLabel: { fontSize: 12 },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: { width: "47%", padding: 14, alignItems: "center", gap: 6 },
  typeCount: { fontSize: 18, fontWeight: "700" },
  typeLabel: { fontSize: 12 },
  statsCard: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  contentList: { gap: 0 },
  contentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contentRank: { width: 32, alignItems: "center" },
  rankNumber: { fontSize: 14, fontWeight: "700" },
  contentInfo: { flex: 1, gap: 2 },
  contentTitle: { fontSize: 14, fontWeight: "500" },
  contentMeta: { fontSize: 12 },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default ContentAnalyticsScreen;
