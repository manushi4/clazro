import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAIInsightsQuery, AIInsightRecord, InsightType, InsightPriority } from "../../../hooks/queries/parent/useAIInsightsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.ai-insights-preview";

export const AIInsightsPreviewWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data, isLoading, error } = useAIInsightsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options matching Platform Studio
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";
  const maxItems = (config?.maxItems as number) || 4;
  const showHighPriorityFirst = config?.showHighPriorityFirst !== false;
  const showDescription = config?.showDescription !== false;
  const showActionButton = config?.showActionButton !== false;
  const showCategory = config?.showCategory !== false;
  const showUnreadBadge = config?.showUnreadBadge !== false;
  const enableTap = config?.enableTap !== false;


  const handleInsightPress = (insight: AIInsightRecord) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "insight_tap", insightId: insight.id, type: insight.insight_type });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_insight_tap`, level: "info" });
    if (insight.action_url) {
      onNavigate?.(insight.action_url, { insightId: insight.id });
    } else {
      onNavigate?.("ai-insight-detail", { insightId: insight.id });
    }
  };

  const handleActionPress = (insight: AIInsightRecord) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "action_button", insightId: insight.id });
    if (insight.action_url) {
      onNavigate?.(insight.action_url, { insightId: insight.id });
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("ai-insights");
  };

  const getInsightTypeIcon = (type: InsightType) => {
    const icons: Record<InsightType, string> = {
      performance: "chart-line",
      attendance: "calendar-check",
      behavior: "account-group",
      recommendation: "lightbulb-on",
      alert: "alert-circle",
      achievement: "trophy",
    };
    return icons[type] || "brain";
  };

  const getInsightTypeColor = (type: InsightType, priority: InsightPriority) => {
    if (priority === "high") return colors.error;
    const typeColors: Record<InsightType, string> = {
      performance: colors.success,
      attendance: colors.warning,
      behavior: colors.info,
      recommendation: colors.primary,
      alert: colors.error,
      achievement: colors.tertiary || colors.success,
    };
    return typeColors[type] || colors.primary;
  };

  const getPriorityStyle = (priority: InsightPriority) => {
    switch (priority) {
      case "high":
        return { color: colors.error, bgColor: `${colors.error}15`, label: t("widgets.aiInsights.priority.high") };
      case "normal":
        return { color: colors.warning, bgColor: `${colors.warning}15`, label: t("widgets.aiInsights.priority.normal") };
      default:
        return { color: colors.onSurfaceVariant, bgColor: `${colors.onSurfaceVariant}15`, label: t("widgets.aiInsights.priority.low") };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return t("widgets.aiInsights.time.justNow");
    if (diffHours < 24) return t("widgets.aiInsights.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.aiInsights.time.yesterday");
    return t("widgets.aiInsights.time.daysAgo", { count: diffDays });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiInsights.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.aiInsights.states.error")}
        </AppText>
      </View>
    );
  }

  let insights = data?.insights || [];

  // Sort: high priority first if enabled
  if (showHighPriorityFirst) {
    insights = [...insights].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.is_read === b.is_read ? 0 : a.is_read ? 1 : -1;
    });
  }

  const displayInsights = insights.slice(0, maxItems);
  const unreadCount = data?.unread_count || 0;
  const highPriorityCount = data?.high_priority_count || 0;

  if (displayInsights.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: `${colors.success}10` }]}>
        <Icon name="brain" size={48} color={colors.success} />
        <AppText style={[styles.emptyText, { color: colors.success }]}>
          {t("widgets.aiInsights.states.empty")}
        </AppText>
      </View>
    );
  }


  const renderInsightItem = (insight: AIInsightRecord, index: number) => {
    const typeColor = getInsightTypeColor(insight.insight_type, insight.priority);
    const priorityStyle = getPriorityStyle(insight.priority);
    const isCompact = layoutStyle === "compact" || size === "compact";

    return (
      <TouchableOpacity
        key={insight.id}
        style={[
          styles.insightItem,
          isCompact && styles.insightItemCompact,
          !insight.is_read && { backgroundColor: `${colors.primary}08` },
          { backgroundColor: insight.is_read ? colors.surface : `${colors.primary}08`, borderRadius: borderRadius.medium, shadowColor: colors.shadow || "#000" },
        ]}
        onPress={() => handleInsightPress(insight)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Left: Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${typeColor}15` }]}>
          <Icon name={getInsightTypeIcon(insight.insight_type)} size={22} color={typeColor} />
        </View>

        {/* Middle: Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <AppText
              style={[
                styles.title,
                { color: colors.onSurface },
                !insight.is_read && styles.titleUnread,
              ]}
              numberOfLines={1}
            >
              {getLocalizedField(insight, "title")}
            </AppText>
            {showUnreadBadge && !insight.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: typeColor }]} />
            )}
          </View>

          {showDescription && !isCompact && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedField(insight, "description")}
            </AppText>
          )}

          <View style={styles.metaRow}>
            {showCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: `${typeColor}15` }]}>
                <AppText style={[styles.categoryText, { color: typeColor }]}>
                  {t(`widgets.aiInsights.types.${insight.insight_type}`)}
                </AppText>
              </View>
            )}
            {insight.priority === "high" && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bgColor }]}>
                <Icon name="alert" size={10} color={priorityStyle.color} />
                <AppText style={[styles.priorityText, { color: priorityStyle.color }]}>
                  {priorityStyle.label}
                </AppText>
              </View>
            )}
            <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
              {formatTimeAgo(insight.created_at)}
            </AppText>
          </View>
        </View>

        {/* Right: Action button */}
        {showActionButton && insight.action_url && !isCompact && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleActionPress(insight)}
          >
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with AI badge and counts */}
      {(unreadCount > 0 || highPriorityCount > 0) && (
        <View style={[styles.headerBanner, { backgroundColor: `${colors.primary}10` }]}>
          <View style={styles.headerLeft}>
            <Icon name="brain" size={18} color={colors.primary} />
            <AppText style={[styles.headerText, { color: colors.primary }]}>
              {t("widgets.aiInsights.header.aiPowered")}
            </AppText>
          </View>
          <View style={styles.headerRight}>
            {highPriorityCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.error }]}>
                <AppText style={styles.countText}>{highPriorityCount}</AppText>
              </View>
            )}
            {unreadCount > 0 && (
              <AppText style={[styles.unreadText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.aiInsights.header.unread", { count: unreadCount })}
              </AppText>
            )}
          </View>
        </View>
      )}

      {/* Insights List */}
      <View style={styles.insightsList}>
        {displayInsights.map((insight, index) => renderInsightItem(insight, index))}
      </View>

      {/* View All */}
      {insights.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.aiInsights.actions.viewAll", { count: insights.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  headerBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { fontSize: 13, fontWeight: "600" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  unreadText: { fontSize: 12 },
  insightsList: { gap: 10 },
  insightItem: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  insightItemCompact: { padding: 10, gap: 10 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contentContainer: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "500", flex: 1 },
  titleUnread: { fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  description: { fontSize: 12, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: "600" },
  timeText: { fontSize: 11 },
  actionButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 40, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 16 },
  emptyText: { fontSize: 15, textAlign: "center", fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, gap: 6 },
  viewAllText: { fontSize: 14, fontWeight: "600" },
});
