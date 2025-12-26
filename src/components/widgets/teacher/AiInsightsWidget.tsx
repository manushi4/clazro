import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useAiInsightsQuery,
  useUnreadInsightsCount,
  INSIGHT_TYPE_CONFIG,
  PRIORITY_CONFIG,
  type AiInsight,
  type InsightType,
} from "../../../hooks/queries/teacher/useAiInsightsQuery";

type FilterType = "all" | "unread" | "high_priority";

export const AiInsightsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // === STATE ===
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 5;
  const showPriorityBadge = config?.showPriorityBadge !== false;
  const showUnreadCount = config?.showUnreadCount !== false;

  // === DATA ===
  const { data: unreadCount } = useUnreadInsightsCount();
  const {
    data: insights,
    isLoading,
    error,
    refetch,
  } = useAiInsightsQuery({
    limit: maxItems,
    status: activeFilter === "unread" ? "unread" : "all",
    priority: activeFilter === "high_priority" ? "high" : "all",
  });

  // === HELPERS ===
  const getInsightIcon = (type: InsightType): string => {
    return INSIGHT_TYPE_CONFIG[type]?.icon || "lightbulb";
  };

  const getInsightColor = (type: InsightType): string => {
    return INSIGHT_TYPE_CONFIG[type]?.color || colors.primary;
  };

  const getPriorityColor = (priority: string): string => {
    return (
      PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.color ||
      colors.onSurfaceVariant
    );
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return t("widgets.aiInsights.time.minutesAgo", {
        count: diffMins,
        defaultValue: `${diffMins}m ago`,
      });
    } else if (diffHours < 24) {
      return t("widgets.aiInsights.time.hoursAgo", {
        count: diffHours,
        defaultValue: `${diffHours}h ago`,
      });
    } else {
      return t("widgets.aiInsights.time.daysAgo", {
        count: diffDays,
        defaultValue: `${diffDays}d ago`,
      });
    }
  };

  const filters: { key: FilterType; labelKey: string }[] = [
    { key: "all", labelKey: "widgets.aiInsights.filters.all" },
    { key: "unread", labelKey: "widgets.aiInsights.filters.unread" },
    { key: "high_priority", labelKey: "widgets.aiInsights.filters.highPriority" },
  ];

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.aiInsights.states.loading", {
            defaultValue: "Loading insights...",
          })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large },
        ]}
      >
        <Icon name="alert-circle-outline" size={28} color={colors.error} />
        <AppText style={{ color: colors.error, marginTop: 8 }}>
          {t("widgets.aiInsights.states.error", {
            defaultValue: "Failed to load insights",
          })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[
            styles.retryButton,
            { backgroundColor: colors.error, borderRadius: borderRadius.small },
          ]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!insights || insights.length === 0) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large },
        ]}
      >
        <Icon name="robot-outline" size={36} color={colors.onSurfaceVariant} />
        <AppText
          style={{
            color: colors.onSurfaceVariant,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {t("widgets.aiInsights.states.empty", {
            defaultValue: "No AI insights available.\nCheck back later!",
          })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {/* Header with unread count */}
      {showUnreadCount && unreadCount !== undefined && unreadCount > 0 && (
        <View style={styles.headerRow}>
          <View
            style={[
              styles.unreadBadge,
              { backgroundColor: colors.error, borderRadius: borderRadius.full },
            ]}
          >
            <Icon name="bell" size={12} color={colors.onError} />
            <AppText style={[styles.unreadText, { color: colors.onError }]}>
              {unreadCount}{" "}
              {t("widgets.aiInsights.unread", { defaultValue: "unread" })}
            </AppText>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceVariant,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <AppText
                style={[
                  styles.filterText,
                  { color: isActive ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {t(filter.labelKey, { defaultValue: filter.key })}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Insights list */}
      <View style={styles.insightsList}>
        {insights.slice(0, maxItems).map((insight: AiInsight) => (
          <TouchableOpacity
            key={insight.id}
            onPress={() => {
              if (insight.action_url) {
                onNavigate?.(insight.action_url, {
                  id: insight.related_entity_id,
                  insightId: insight.id,
                });
              }
            }}
            style={[
              styles.insightItem,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                borderLeftWidth: 3,
                borderLeftColor: getInsightColor(insight.insight_type),
              },
            ]}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${getInsightColor(insight.insight_type)}20`,
                  borderRadius: borderRadius.small,
                },
              ]}
            >
              <Icon
                name={getInsightIcon(insight.insight_type)}
                size={20}
                color={getInsightColor(insight.insight_type)}
              />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <AppText
                  style={[
                    styles.insightTitle,
                    {
                      color: colors.onSurface,
                      fontWeight: insight.status === "unread" ? "600" : "400",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {getLocalizedField(insight, "title")}
                </AppText>
                {insight.status === "unread" && (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>

              {insight.description_en && (
                <AppText
                  style={[styles.insightDescription, { color: colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {getLocalizedField(insight, "description")}
                </AppText>
              )}

              <View style={styles.metaRow}>
                {/* Priority badge */}
                {showPriorityBadge && (
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: `${getPriorityColor(insight.priority)}20`,
                        borderRadius: borderRadius.small,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(insight.priority) },
                      ]}
                    >
                      {t(`widgets.aiInsights.priority.${insight.priority}`, {
                        defaultValue: insight.priority,
                      })}
                    </AppText>
                  </View>
                )}

                {/* Related entity */}
                {insight.related_entity_name && (
                  <AppText
                    style={[styles.entityText, { color: colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {insight.related_entity_name}
                  </AppText>
                )}

                {/* Time ago */}
                <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                  {getTimeAgo(insight.generated_at)}
                </AppText>
              </View>
            </View>

            {/* Action arrow */}
            {insight.is_actionable && (
              <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* View all button */}
      <TouchableOpacity
        onPress={() => onNavigate?.("AiInsightsList")}
        style={[
          styles.viewAllButton,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        ]}
      >
        <Icon name="robot" size={18} color={colors.primary} />
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.aiInsights.actions.viewAll", {
            defaultValue: "View All Insights",
          })}
        </AppText>
        <Icon name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: -4,
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "600",
  },
  filterContainer: {
    maxHeight: 40,
  },
  filterContent: {
    gap: 8,
    paddingRight: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  insightsList: {
    gap: 10,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insightTitle: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  entityText: {
    fontSize: 11,
    flex: 1,
  },
  timeText: {
    fontSize: 10,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
