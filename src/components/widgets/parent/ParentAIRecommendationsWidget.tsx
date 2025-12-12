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
import { useAIRecommendationsQuery, AIRecommendation } from "../../../hooks/queries/parent/useAIRecommendationsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentAIRecommendationsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useAIRecommendationsQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showActionButton = config?.showActionButton !== false;
  const showPriority = config?.showPriority !== false;
  const showRelevance = config?.showRelevance !== false;
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiRecommendations.states.loading")}
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
          {t("widgets.aiRecommendations.states.error")}
        </AppText>
      </View>
    );
  }

  const recommendations = data?.recommendations || [];
  const displayRecommendations = recommendations.slice(0, maxItems);

  // Empty state
  if (displayRecommendations.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="lightbulb-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.aiRecommendations.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiRecommendations.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handleRecommendationPress = (recommendation: AIRecommendation) => {
    if (enableTap && recommendation.action_route) {
      onNavigate?.(recommendation.action_route, recommendation.action_params);
    }
  };

  const handleViewAll = () => {
    onNavigate?.("ai-recommendations");
  };

  // Get recommendation type icon
  const getTypeIcon = (type: string, customIcon?: string | null) => {
    if (customIcon) return customIcon;
    switch (type) {
      case "study": return "book-open-variant";
      case "practice": return "pencil-box-outline";
      case "resource": return "play-circle-outline";
      case "activity": return "trophy-outline";
      case "schedule": return "calendar-clock";
      case "goal": return "flag-checkered";
      default: return "lightbulb-outline";
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "study": return colors.primary;
      case "practice": return "#F59E0B";
      case "resource": return "#06B6D4";
      case "activity": return colors.success;
      case "schedule": return "#8B5CF6";
      case "goal": return "#EC4899";
      default: return colors.primary;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return colors.error;
      case "medium": return "#F59E0B";
      case "low": return colors.success;
      default: return colors.onSurfaceVariant;
    }
  };


  // Render recommendation item based on layout
  const renderRecommendationItem = (recommendation: AIRecommendation, index: number) => {
    const typeColor = getTypeColor(recommendation.recommendation_type);
    const priorityColor = getPriorityColor(recommendation.priority);
    const iconName = getTypeIcon(recommendation.recommendation_type, recommendation.icon);

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={recommendation.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleRecommendationPress(recommendation)}
          disabled={!enableTap}
        >
          <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(recommendation, "title")}
            </AppText>
            <View style={styles.compactMeta}>
              <AppText style={[styles.compactType, { color: typeColor }]}>
                {t(`widgets.aiRecommendations.types.${recommendation.recommendation_type}`)}
              </AppText>
              {showRelevance && (
                <AppText style={[styles.compactRelevance, { color: colors.onSurfaceVariant }]}>
                  {Math.round(recommendation.relevance_score * 100)}% match
                </AppText>
              )}
            </View>
          </View>
          {showPriority && (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
              <AppText style={[styles.priorityText, { color: priorityColor }]}>
                {t(`widgets.aiRecommendations.priority.${recommendation.priority}`)}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={recommendation.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleRecommendationPress(recommendation)}
          disabled={!enableTap}
        >
          <View style={[styles.cardIcon, { backgroundColor: `${typeColor}20` }]}>
            <Icon name={iconName} size={22} color={typeColor} />
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(recommendation, "title")}
          </AppText>
          <AppText style={[styles.cardCategory, { color: typeColor }]}>
            {recommendation.category}
          </AppText>
          {showActionButton && recommendation.action_label_en && (
            <View style={[styles.cardAction, { backgroundColor: typeColor }]}>
              <AppText style={styles.cardActionText}>
                {getLocalizedField(recommendation, "action_label")}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={recommendation.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => handleRecommendationPress(recommendation)}
        disabled={!enableTap}
      >
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
          <Icon name={iconName} size={20} color={typeColor} />
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(recommendation, "title")}
            </AppText>
            {showPriority && recommendation.priority === "high" && (
              <View style={[styles.highPriorityDot, { backgroundColor: colors.error }]} />
            )}
          </View>
          {showDescription && (
            <AppText style={[styles.listDescription, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedField(recommendation, "description")}
            </AppText>
          )}
          <View style={styles.listMeta}>
            <AppText style={[styles.listType, { color: typeColor }]}>
              {t(`widgets.aiRecommendations.types.${recommendation.recommendation_type}`)}
            </AppText>
            <AppText style={[styles.listDot, { color: colors.onSurfaceVariant }]}>•</AppText>
            <AppText style={[styles.listCategory, { color: colors.onSurfaceVariant }]}>
              {recommendation.category}
            </AppText>
          </View>
        </View>
        {showActionButton && recommendation.action_label_en && (
          <View style={[styles.actionButton, { backgroundColor: `${typeColor}15` }]}>
            <AppText style={[styles.actionButtonText, { color: typeColor }]}>
              {getLocalizedField(recommendation, "action_label")}
            </AppText>
            <Icon name="chevron-right" size={14} color={typeColor} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with count */}
      {data && data.high_priority_count > 0 && (
        <View style={[styles.headerBanner, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="lightbulb-on" size={16} color={colors.primary} />
          <AppText style={[styles.headerText, { color: colors.primary }]}>
            {t("widgets.aiRecommendations.header.active", { count: data.active_count })}
          </AppText>
          {data.high_priority_count > 0 && (
            <View style={[styles.highPriorityBadge, { backgroundColor: colors.error }]}>
              <AppText style={styles.highPriorityText}>
                {data.high_priority_count} {t("widgets.aiRecommendations.priority.high")}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Recommendations List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayRecommendations.map((rec, index) => renderRecommendationItem(rec, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayRecommendations.map((rec, index) => renderRecommendationItem(rec, index))}
        </View>
      )}

      {/* View All Button */}
      {recommendations.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.aiRecommendations.actions.viewAll", { count: recommendations.length })}
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
  // Header Banner
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  highPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  highPriorityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // List Layout
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  listDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  listType: {
    fontSize: 11,
    fontWeight: "500",
  },
  listDot: {
    fontSize: 10,
  },
  listCategory: {
    fontSize: 11,
  },
  // Cards Layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 160,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: "500",
  },
  cardAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  cardActionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Compact Layout
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  typeBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  compactType: {
    fontSize: 11,
    fontWeight: "500",
  },
  compactRelevance: {
    fontSize: 11,
  },
  // Common
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  highPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
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

export default ParentAIRecommendationsWidget;
