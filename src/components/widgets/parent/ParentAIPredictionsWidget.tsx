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
import { useAIPredictionsQuery, AIPrediction } from "../../../hooks/queries/parent/useAIPredictionsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentAIPredictionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useAIPredictionsQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 4;
  const showConfidence = config?.showConfidence !== false;
  const showRecommendation = config?.showRecommendation !== false;
  const showPriority = config?.showPriority !== false;
  const showUnreadFirst = config?.showUnreadFirst !== false;
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiPredictions.states.loading")}
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
          {t("widgets.aiPredictions.states.error")}
        </AppText>
      </View>
    );
  }

  let predictions = data?.predictions || [];
  
  // Sort unread first if enabled
  if (showUnreadFirst) {
    predictions = [...predictions].sort((a, b) => {
      if (a.is_read === b.is_read) return 0;
      return a.is_read ? 1 : -1;
    });
  }
  
  const displayPredictions = predictions.slice(0, maxItems);

  // Empty state
  if (displayPredictions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="brain" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.aiPredictions.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiPredictions.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handlePredictionPress = (prediction: AIPrediction) => {
    if (enableTap) {
      onNavigate?.("prediction-details", { predictionId: prediction.id });
    }
  };

  const handleViewAll = () => {
    onNavigate?.("ai-predictions");
  };

  // Get prediction type icon
  const getPredictionTypeIcon = (type: string) => {
    switch (type) {
      case "performance": return "chart-line";
      case "attendance": return "calendar-check";
      case "behavior": return "account-alert";
      case "risk": return "alert-octagon";
      case "achievement": return "trophy";
      default: return "brain";
    }
  };

  // Get prediction type color
  const getPredictionTypeColor = (type: string) => {
    switch (type) {
      case "performance": return colors.primary;
      case "attendance": return "#06B6D4";
      case "behavior": return "#F59E0B";
      case "risk": return colors.error;
      case "achievement": return colors.success;
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

  // Format confidence as percentage
  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return t("widgets.aiPredictions.time.justNow");
    if (diffHours < 24) return t("widgets.aiPredictions.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.aiPredictions.time.yesterday");
    return t("widgets.aiPredictions.time.daysAgo", { count: diffDays });
  };

  // Render prediction item based on layout
  const renderPredictionItem = (prediction: AIPrediction, index: number) => {
    const typeColor = getPredictionTypeColor(prediction.prediction_type);
    const priorityColor = getPriorityColor(prediction.priority);

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={prediction.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handlePredictionPress(prediction)}
          disabled={!enableTap}
        >
          <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(prediction, "title")}
              </AppText>
              {!prediction.is_read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <View style={styles.compactMeta}>
              <AppText style={[styles.compactType, { color: typeColor }]}>
                {t(`widgets.aiPredictions.types.${prediction.prediction_type}`)}
              </AppText>
              {showConfidence && (
                <AppText style={[styles.compactConfidence, { color: colors.onSurfaceVariant }]}>
                  {formatConfidence(prediction.confidence_score)}
                </AppText>
              )}
            </View>
          </View>
          {showPriority && (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
              <AppText style={[styles.priorityText, { color: priorityColor }]}>
                {t(`widgets.aiPredictions.priority.${prediction.priority}`)}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={prediction.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handlePredictionPress(prediction)}
          disabled={!enableTap}
        >
          <View style={[styles.cardIcon, { backgroundColor: `${typeColor}20` }]}>
            <Icon name={getPredictionTypeIcon(prediction.prediction_type)} size={20} color={typeColor} />
          </View>
          {!prediction.is_read && (
            <View style={[styles.cardUnreadDot, { backgroundColor: colors.primary }]} />
          )}
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(prediction, "title")}
          </AppText>
          {showConfidence && (
            <View style={styles.cardConfidence}>
              <Icon name="chart-arc" size={12} color={typeColor} />
              <AppText style={[styles.cardConfidenceText, { color: typeColor }]}>
                {formatConfidence(prediction.confidence_score)}
              </AppText>
            </View>
          )}
          {showPriority && (
            <View style={[styles.cardPriority, { backgroundColor: `${priorityColor}20` }]}>
              <AppText style={[styles.cardPriorityText, { color: priorityColor }]}>
                {t(`widgets.aiPredictions.priority.${prediction.priority}`)}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={prediction.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => handlePredictionPress(prediction)}
        disabled={!enableTap}
      >
        <View style={styles.listLeft}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
            <Icon name={getPredictionTypeIcon(prediction.prediction_type)} size={20} color={typeColor} />
          </View>
          <View style={styles.listContent}>
            <View style={styles.listHeader}>
              <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(prediction, "title")}
              </AppText>
              {!prediction.is_read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <AppText style={[styles.listDescription, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedField(prediction, "description")}
            </AppText>
            <View style={styles.listMeta}>
              <AppText style={[styles.listType, { color: typeColor }]}>
                {t(`widgets.aiPredictions.types.${prediction.prediction_type}`)}
              </AppText>
              <AppText style={[styles.listDot, { color: colors.onSurfaceVariant }]}>•</AppText>
              <AppText style={[styles.listTime, { color: colors.onSurfaceVariant }]}>
                {formatTimeAgo(prediction.created_at)}
              </AppText>
            </View>
            {showRecommendation && prediction.recommendation_en && (
              <View style={[styles.recommendationBox, { backgroundColor: `${colors.primary}10` }]}>
                <Icon name="lightbulb-outline" size={12} color={colors.primary} />
                <AppText style={[styles.recommendationText, { color: colors.primary }]} numberOfLines={1}>
                  {getLocalizedField(prediction, "recommendation")}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.listRight}>
          {showConfidence && (
            <View style={styles.confidenceCircle}>
              <AppText style={[styles.confidenceValue, { color: typeColor }]}>
                {formatConfidence(prediction.confidence_score)}
              </AppText>
              <AppText style={[styles.confidenceLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.aiPredictions.labels.confidence")}
              </AppText>
            </View>
          )}
          {showPriority && (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
              <AppText style={[styles.priorityText, { color: priorityColor }]}>
                {t(`widgets.aiPredictions.priority.${prediction.priority}`)}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Header with unread count */}
      {data && data.unread_count > 0 && (
        <View style={[styles.headerBanner, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="brain" size={16} color={colors.primary} />
          <AppText style={[styles.headerText, { color: colors.primary }]}>
            {t("widgets.aiPredictions.header.unread", { count: data.unread_count })}
          </AppText>
          {data.high_priority_count > 0 && (
            <View style={[styles.highPriorityBadge, { backgroundColor: colors.error }]}>
              <AppText style={styles.highPriorityText}>
                {data.high_priority_count} {t("widgets.aiPredictions.priority.high")}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Predictions List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayPredictions.map((prediction, index) => renderPredictionItem(prediction, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayPredictions.map((prediction, index) => renderPredictionItem(prediction, index))}
        </View>
      )}

      {/* View All Button */}
      {predictions.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.aiPredictions.actions.viewAll", { count: predictions.length })}
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
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
  },
  listLeft: {
    flexDirection: "row",
    flex: 1,
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
  listTime: {
    fontSize: 11,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 8,
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
    alignItems: "center",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardUnreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  cardConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardConfidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardPriority: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardPriorityText: {
    fontSize: 10,
    fontWeight: "600",
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
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
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
  compactConfidence: {
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceCircle: {
    alignItems: "center",
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  confidenceLabel: {
    fontSize: 9,
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
  recommendationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 11,
    flex: 1,
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

export default ParentAIPredictionsWidget;
