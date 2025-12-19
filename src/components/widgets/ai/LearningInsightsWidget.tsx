/**
 * Learning Insights Widget (ai.learning-insights)
 * Displays AI-generated learning insights including strengths, weaknesses, recommendations
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useLearningInsightsQuery, LearningInsight, InsightType } from "../../../hooks/queries/useLearningInsightsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "ai.learning-insights";

export const LearningInsightsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useLearningInsightsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showMetric = config?.showMetric !== false;
  const showAction = config?.showAction !== false;
  const showSubject = config?.showSubject !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const filterType = config?.filterType as InsightType | "all" | undefined;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";

  // Color mapping using theme colors
  const getInsightColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };


  const getInsightTypeIcon = (type: InsightType) => {
    const icons: Record<InsightType, string> = {
      strength: "arm-flex",
      weakness: "alert-circle-outline",
      recommendation: "lightbulb-on-outline",
      trend: "trending-up",
      achievement: "trophy-outline",
      alert: "bell-alert-outline",
    };
    return icons[type] || "lightbulb-outline";
  };

  const getLocalizedTitle = (insight: LearningInsight) => {
    return getLocalizedField({ title_en: insight.titleEn, title_hi: insight.titleHi }, 'title');
  };

  const getLocalizedDescription = (insight: LearningInsight) => {
    return getLocalizedField({ description_en: insight.descriptionEn, description_hi: insight.descriptionHi }, 'description');
  };

  const getLocalizedActionLabel = (insight: LearningInsight) => {
    return getLocalizedField({ action_label_en: insight.actionLabelEn, action_label_hi: insight.actionLabelHi }, 'action_label');
  };

  const handleInsightPress = (insight: LearningInsight) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "insight_tap", insightId: insight.id, type: insight.insightType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_insight_tap`, level: "info", data: { insightId: insight.id } });
    if (insight.actionRoute) {
      onNavigate?.(insight.actionRoute);
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("ai-insights");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.learningInsights.states.loading", "Analyzing your learning...")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>
          {t("widgets.learningInsights.states.error", "Couldn't load insights")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.learningInsights.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }


  // Empty state
  if (!data || data.insights.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="lightbulb-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.learningInsights.states.empty", "No insights yet")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.learningInsights.states.emptyHint", "Keep learning to get personalized insights")}
        </AppText>
      </View>
    );
  }

  // Filter insights by type if specified
  let filteredInsights = data.insights;
  if (filterType && filterType !== "all") {
    filteredInsights = data.insights.filter(i => i.insightType === filterType);
  }
  const displayInsights = filteredInsights.slice(0, maxItems);

  const renderInsightItem = (insight: LearningInsight, index: number) => {
    const insightColor = getInsightColor(insight.color);

    return (
      <TouchableOpacity
        key={insight.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handleInsightPress(insight)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${insightColor}15` }]}>
          <Icon name={insight.icon || getInsightTypeIcon(insight.insightType)} size={layoutStyle === "cards" ? 24 : 20} color={insightColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "cards" ? styles.cardContent : styles.listContent}>
          <View style={styles.titleRow}>
            <AppText style={[styles.insightTitle, { color: colors.onSurface }]} numberOfLines={layoutStyle === "cards" ? 2 : 1}>
              {getLocalizedTitle(insight)}
            </AppText>
            {showMetric && insight.metricValue !== null && (
              <View style={[styles.metricBadge, { backgroundColor: `${insightColor}15` }]}>
                <AppText style={[styles.metricValue, { color: insightColor }]}>
                  {insight.metricValue}{insight.metricLabel}
                </AppText>
              </View>
            )}
          </View>

          {showSubject && insight.subject && !compactMode && (
            <View style={styles.subjectRow}>
              <Icon name="book-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]}>{insight.subject}</AppText>
            </View>
          )}

          {showDescription && !compactMode && layoutStyle !== "cards" && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedDescription(insight)}
            </AppText>
          )}
        </View>

        {/* Action button */}
        {showAction && insight.actionRoute && !compactMode && layoutStyle !== "cards" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: insightColor }]}
            onPress={() => handleInsightPress(insight)}
            activeOpacity={0.7}
          >
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {getLocalizedActionLabel(insight) || t("widgets.learningInsights.actions.view", "View")}
            </AppText>
          </TouchableOpacity>
        )}

        {/* Unread indicator */}
        {!insight.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Summary banner */}
      {!compactMode && data.unreadCount > 0 && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <Icon name="lightbulb-on" size={16} color={colors.primary} />
          <AppText style={[styles.summaryText, { color: colors.primary }]}>
            {t("widgets.learningInsights.labels.newInsights", "{{count}} new insights for you", { count: data.unreadCount })}
          </AppText>
        </View>
      )}

      {/* Insights list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayInsights.map((insight, index) => renderInsightItem(insight, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayInsights.map((insight, index) => renderInsightItem(insight, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && filteredInsights.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.learningInsights.actions.viewAll", "View All Insights ({{count}})", { count: data.totalCount })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  emptyHint: { fontSize: 11, marginTop: 4, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  summaryBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, position: "relative" },
  cardItem: { width: 160, padding: 14, alignItems: "center", gap: 8, position: "relative" },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 4 },
  cardContent: { alignItems: "center", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  insightTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  metricBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  metricValue: { fontSize: 11, fontWeight: "700" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  subjectText: { fontSize: 10 },
  description: { fontSize: 11, lineHeight: 16 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: "600" },
  unreadDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
