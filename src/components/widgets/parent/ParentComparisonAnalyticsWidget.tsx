import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useComparisonAnalyticsQuery, ComparisonMetric, ComparisonType } from "../../../hooks/queries/parent/useComparisonAnalyticsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentComparisonAnalyticsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useComparisonAnalyticsQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 5;
  const showInsights = config?.showInsights !== false;
  const showTrend = config?.showTrend !== false;
  const showPercentile = config?.showPercentile !== false;
  const showComparisonBar = config?.showComparisonBar !== false;
  const comparisonType = (config?.comparisonType as ComparisonType) || "class_average";
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.comparisonAnalytics.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.comparisonAnalytics.states.error")}
        </AppText>
      </View>
    );
  }

  // Filter metrics by selected comparison type
  const filteredMetrics = data?.by_type[comparisonType] || data?.metrics || [];
  const displayMetrics = filteredMetrics.slice(0, maxItems);

  // Empty state
  if (displayMetrics.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chart-bar" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.comparisonAnalytics.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.comparisonAnalytics.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handleMetricPress = (metric: ComparisonMetric) => {
    if (enableTap) {
      onNavigate?.("comparison-details", { metricId: metric.id, type: metric.comparison_type });
    }
  };

  const handleViewAll = () => {
    onNavigate?.("comparison-analytics");
  };

  // Get trend icon and color
  const getTrendInfo = (trend: string | null, percentage: number | null) => {
    if (!trend) return { icon: "minus", color: colors.onSurfaceVariant };
    switch (trend) {
      case "up": return { icon: "trending-up", color: colors.success };
      case "down": return { icon: "trending-down", color: colors.error };
      default: return { icon: "minus", color: colors.onSurfaceVariant };
    }
  };

  // Get comparison status color
  const getComparisonColor = (studentValue: number, comparisonValue: number) => {
    const diff = studentValue - comparisonValue;
    if (diff > 5) return colors.success;
    if (diff < -5) return colors.error;
    return colors.warning;
  };

  // Calculate bar widths for comparison visualization
  const getBarWidths = (studentValue: number, comparisonValue: number) => {
    const max = Math.max(studentValue, comparisonValue, 100);
    return {
      student: (studentValue / max) * 100,
      comparison: (comparisonValue / max) * 100,
    };
  };

  // Get metric icon
  const getMetricIcon = (metric: ComparisonMetric) => {
    if (metric.icon) return metric.icon;
    switch (metric.comparison_type) {
      case "class_average": return "account-group";
      case "grade_level": return "school";
      case "historical": return "history";
      default: return "chart-line";
    }
  };


  // Render metric item based on layout
  const renderMetricItem = (metric: ComparisonMetric, index: number) => {
    const trendInfo = getTrendInfo(metric.trend, metric.trend_percentage);
    const comparisonColor = getComparisonColor(metric.student_value, metric.comparison_value);
    const barWidths = getBarWidths(metric.student_value, metric.comparison_value);
    const iconName = getMetricIcon(metric);
    const diff = metric.student_value - metric.comparison_value;

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={metric.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleMetricPress(metric)}
          disabled={!enableTap}
        >
          <Icon name={iconName} size={18} color={comparisonColor} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(metric, "metric_name")}
            </AppText>
            <View style={styles.compactValues}>
              <AppText style={[styles.compactValue, { color: comparisonColor }]}>
                {metric.student_value}{metric.unit}
              </AppText>
              <AppText style={[styles.compactVs, { color: colors.onSurfaceVariant }]}>vs</AppText>
              <AppText style={[styles.compactAvg, { color: colors.onSurfaceVariant }]}>
                {metric.comparison_value}{metric.unit}
              </AppText>
            </View>
          </View>
          {showTrend && metric.trend && (
            <View style={[styles.trendBadge, { backgroundColor: `${trendInfo.color}15` }]}>
              <Icon name={trendInfo.icon} size={14} color={trendInfo.color} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={metric.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderColor: `${comparisonColor}30`, borderWidth: 1 }]}
          onPress={() => handleMetricPress(metric)}
          disabled={!enableTap}
        >
          <View style={[styles.cardIconContainer, { backgroundColor: `${comparisonColor}15` }]}>
            <Icon name={iconName} size={20} color={comparisonColor} />
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(metric, "metric_name")}
          </AppText>
          <View style={styles.cardValueRow}>
            <AppText style={[styles.cardValue, { color: comparisonColor }]}>
              {metric.student_value}{metric.unit}
            </AppText>
            {showTrend && metric.trend && (
              <Icon name={trendInfo.icon} size={14} color={trendInfo.color} />
            )}
          </View>
          <AppText style={[styles.cardComparison, { color: colors.onSurfaceVariant }]}>
            {t("widgets.comparisonAnalytics.labels.vsAverage", { value: metric.comparison_value, unit: metric.unit })}
          </AppText>
          {showPercentile && metric.percentile && (
            <View style={[styles.percentileBadge, { backgroundColor: `${colors.primary}15` }]}>
              <AppText style={[styles.percentileText, { color: colors.primary }]}>
                {t("widgets.comparisonAnalytics.labels.percentile", { value: Math.round(metric.percentile) })}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={metric.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => handleMetricPress(metric)}
        disabled={!enableTap}
      >
        <View style={styles.listHeader}>
          <View style={[styles.metricIcon, { backgroundColor: `${comparisonColor}15` }]}>
            <Icon name={iconName} size={20} color={comparisonColor} />
          </View>
          <View style={styles.listHeaderContent}>
            <View style={styles.listTitleRow}>
              <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(metric, "metric_name")}
              </AppText>
              {metric.subject && (
                <View style={[styles.subjectBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <AppText style={[styles.subjectText, { color: colors.primary }]}>
                    {metric.subject}
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.valueRow}>
              <AppText style={[styles.studentValue, { color: comparisonColor }]}>
                {metric.student_value}{metric.unit}
              </AppText>
              <AppText style={[styles.vsText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.comparisonAnalytics.labels.vs")}
              </AppText>
              <AppText style={[styles.comparisonValue, { color: colors.onSurfaceVariant }]}>
                {metric.comparison_value}{metric.unit} {t("widgets.comparisonAnalytics.labels.avg")}
              </AppText>
            </View>
          </View>
          <View style={styles.listRight}>
            <View style={[styles.diffBadge, { backgroundColor: `${comparisonColor}15` }]}>
              <AppText style={[styles.diffText, { color: comparisonColor }]}>
                {diff > 0 ? "+" : ""}{diff.toFixed(0)}{metric.unit}
              </AppText>
            </View>
            {showTrend && metric.trend && (
              <View style={styles.trendContainer}>
                <Icon name={trendInfo.icon} size={16} color={trendInfo.color} />
                {metric.trend_percentage && (
                  <AppText style={[styles.trendText, { color: trendInfo.color }]}>
                    {metric.trend_percentage > 0 ? "+" : ""}{metric.trend_percentage.toFixed(1)}%
                  </AppText>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Comparison Bar */}
        {showComparisonBar && (
          <View style={styles.barContainer}>
            <View style={styles.barRow}>
              <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.comparisonAnalytics.labels.you")}
              </AppText>
              <View style={[styles.barTrack, { backgroundColor: colors.outline }]}>
                <View style={[styles.barFill, { width: `${barWidths.student}%`, backgroundColor: comparisonColor }]} />
              </View>
            </View>
            <View style={styles.barRow}>
              <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.comparisonAnalytics.labels.average")}
              </AppText>
              <View style={[styles.barTrack, { backgroundColor: colors.outline }]}>
                <View style={[styles.barFill, { width: `${barWidths.comparison}%`, backgroundColor: colors.onSurfaceVariant }]} />
              </View>
            </View>
          </View>
        )}

        {/* Insights */}
        {showInsights && metric.insights_en && (
          <View style={[styles.insightBox, { backgroundColor: `${comparisonColor}10` }]}>
            <Icon name="lightbulb-outline" size={14} color={comparisonColor} />
            <AppText style={[styles.insightText, { color: comparisonColor }]} numberOfLines={2}>
              {getLocalizedField(metric, "insights")}
            </AppText>
          </View>
        )}

        {/* Rank & Percentile */}
        {showPercentile && (metric.rank_position || metric.percentile) && (
          <View style={styles.rankRow}>
            {metric.rank_position && metric.total_in_group && (
              <View style={styles.rankItem}>
                <Icon name="medal" size={14} color={colors.warning} />
                <AppText style={[styles.rankText, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.comparisonAnalytics.labels.rank", { rank: metric.rank_position, total: metric.total_in_group })}
                </AppText>
              </View>
            )}
            {metric.percentile && (
              <View style={styles.rankItem}>
                <Icon name="percent" size={14} color={colors.primary} />
                <AppText style={[styles.rankText, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.comparisonAnalytics.labels.topPercentile", { value: Math.round(100 - metric.percentile) })}
                </AppText>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      {data && (
        <View style={[styles.summaryHeader, { backgroundColor: `${colors.primary}10` }]}>
          <View style={styles.summaryItem}>
            <Icon name="arrow-up-circle" size={18} color={colors.success} />
            <AppText style={[styles.summaryValue, { color: colors.success }]}>{data.above_average_count}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.comparisonAnalytics.summary.aboveAvg")}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <Icon name="trending-up" size={18} color={colors.primary} />
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>{data.improving_count}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.comparisonAnalytics.summary.improving")}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <Icon name="arrow-down-circle" size={18} color={colors.error} />
            <AppText style={[styles.summaryValue, { color: colors.error }]}>{data.below_average_count}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.comparisonAnalytics.summary.belowAvg")}
            </AppText>
          </View>
        </View>
      )}

      {/* Metrics List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayMetrics.map((metric, index) => renderMetricItem(metric, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayMetrics.map((metric, index) => renderMetricItem(metric, index))}
        </View>
      )}

      {/* View All Button */}
      {filteredMetrics.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.comparisonAnalytics.actions.viewAll", { count: filteredMetrics.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  // Summary Header
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 12,
    borderRadius: 10,
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  // List Layout
  listContainer: {
    gap: 10,
  },
  listItem: {
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeaderContent: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: "500",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  studentValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  vsText: {
    fontSize: 11,
  },
  comparisonValue: {
    fontSize: 12,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Comparison Bar
  barContainer: {
    gap: 6,
    marginTop: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    fontSize: 10,
    width: 50,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Insights
  insightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  insightText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  // Rank Row
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rankText: {
    fontSize: 11,
  },
  // Cards Layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 150,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  cardComparison: {
    fontSize: 10,
  },
  percentileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  percentileText: {
    fontSize: 10,
    fontWeight: "500",
  },
  // Compact Layout
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  compactValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  compactVs: {
    fontSize: 10,
  },
  compactAvg: {
    fontSize: 12,
  },
  trendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  // View All
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ParentComparisonAnalyticsWidget;
