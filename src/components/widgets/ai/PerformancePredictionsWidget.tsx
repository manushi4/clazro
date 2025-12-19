/**
 * Performance Predictions Widget (ai.performance-predictions)
 * Displays AI-generated performance predictions for exams, grades, and milestones
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
import { usePerformancePredictionsQuery, PerformancePrediction, PredictionType } from "../../../hooks/queries/usePerformancePredictionsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "ai.performance-predictions";

export const PerformancePredictionsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = usePerformancePredictionsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showConfidence = config?.showConfidence !== false;
  const showAction = config?.showAction !== false;
  const showSubject = config?.showSubject !== false;
  const showProgress = config?.showProgress !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const filterType = config?.filterType as PredictionType | "all" | undefined;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";

  // Color mapping using theme colors
  const getPredictionColor = (colorKey: string) => {
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

  const getPredictionTypeIcon = (type: PredictionType) => {
    const icons: Record<PredictionType, string> = {
      exam_score: "file-document-outline",
      subject_grade: "school-outline",
      improvement: "trending-up",
      risk: "alert-outline",
      milestone: "flag-checkered",
      trend: "chart-line",
    };
    return icons[type] || "chart-line";
  };

  const getLocalizedTitle = (prediction: PerformancePrediction) => {
    return getLocalizedField({ title_en: prediction.titleEn, title_hi: prediction.titleHi }, 'title');
  };

  const getLocalizedDescription = (prediction: PerformancePrediction) => {
    return getLocalizedField({ description_en: prediction.descriptionEn, description_hi: prediction.descriptionHi }, 'description');
  };

  const getLocalizedActionLabel = (prediction: PerformancePrediction) => {
    return getLocalizedField({ action_label_en: prediction.actionLabelEn, action_label_hi: prediction.actionLabelHi }, 'action_label');
  };

  const handlePredictionPress = (prediction: PerformancePrediction) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "prediction_tap", predictionId: prediction.id, type: prediction.predictionType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_prediction_tap`, level: "info", data: { predictionId: prediction.id } });
    if (prediction.actionRoute) {
      onNavigate?.(prediction.actionRoute);
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("ai-predictions");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.performancePredictions.states.loading", "Analyzing performance...")}
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
          {t("widgets.performancePredictions.states.error", "Couldn't load predictions")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.performancePredictions.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.predictions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="chart-line" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.performancePredictions.states.empty", "No predictions yet")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.performancePredictions.states.emptyHint", "Keep learning to get performance predictions")}
        </AppText>
      </View>
    );
  }

  // Filter predictions by type if specified
  let filteredPredictions = data.predictions;
  if (filterType && filterType !== "all") {
    filteredPredictions = data.predictions.filter(p => p.predictionType === filterType);
  }
  const displayPredictions = filteredPredictions.slice(0, maxItems);

  const renderProgressBar = (prediction: PerformancePrediction, predictionColor: string) => {
    if (!showProgress || prediction.currentValue === null || prediction.targetValue === null) return null;
    const progress = Math.min((prediction.currentValue / prediction.targetValue) * 100, 100);
    
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${predictionColor}20` }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: predictionColor }]} />
        </View>
        <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
          {prediction.currentValue}/{prediction.targetValue}
        </AppText>
      </View>
    );
  };

  const renderPredictionItem = (prediction: PerformancePrediction, index: number) => {
    const predictionColor = getPredictionColor(prediction.color);

    return (
      <TouchableOpacity
        key={prediction.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handlePredictionPress(prediction)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${predictionColor}15` }]}>
          <Icon name={prediction.icon || getPredictionTypeIcon(prediction.predictionType)} size={layoutStyle === "cards" ? 24 : 20} color={predictionColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "cards" ? styles.cardContent : styles.listContent}>
          <View style={styles.titleRow}>
            <AppText style={[styles.predictionTitle, { color: colors.onSurface }]} numberOfLines={layoutStyle === "cards" ? 2 : 1}>
              {getLocalizedTitle(prediction)}
            </AppText>
            {prediction.predictedLabel && (
              <View style={[styles.predictionBadge, { backgroundColor: `${predictionColor}15` }]}>
                <AppText style={[styles.predictionValue, { color: predictionColor }]}>
                  {prediction.predictedLabel}
                </AppText>
              </View>
            )}
          </View>

          {showSubject && prediction.subject && !compactMode && (
            <View style={styles.subjectRow}>
              <Icon name="book-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]}>{prediction.subject}</AppText>
            </View>
          )}

          {showDescription && !compactMode && layoutStyle !== "cards" && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedDescription(prediction)}
            </AppText>
          )}

          {renderProgressBar(prediction, predictionColor)}

          {showConfidence && !compactMode && (
            <View style={styles.confidenceRow}>
              <Icon name="shield-check-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.confidenceText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.performancePredictions.labels.confidence", "{{value}}% confidence", { value: Math.round(prediction.confidenceScore * 100) })}
              </AppText>
            </View>
          )}
        </View>

        {/* Action button */}
        {showAction && prediction.actionRoute && !compactMode && layoutStyle !== "cards" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: predictionColor }]}
            onPress={() => handlePredictionPress(prediction)}
            activeOpacity={0.7}
          >
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {getLocalizedActionLabel(prediction) || t("widgets.performancePredictions.actions.view", "View")}
            </AppText>
          </TouchableOpacity>
        )}

        {/* Positive/Negative indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: prediction.isPositive ? colors.success : colors.error }]} />
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
      {!compactMode && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <View style={styles.summaryItem}>
            <Icon name="trending-up" size={14} color={colors.success} />
            <AppText style={[styles.summaryText, { color: colors.success }]}>
              {t("widgets.performancePredictions.labels.positive", "{{count}} positive", { count: data.positiveCount })}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Icon name="alert-outline" size={14} color={colors.warning} />
            <AppText style={[styles.summaryText, { color: colors.warning }]}>
              {t("widgets.performancePredictions.labels.needsAttention", "{{count}} needs attention", { count: data.negativeCount })}
            </AppText>
          </View>
        </View>
      )}

      {/* Predictions list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayPredictions.map((prediction, index) => renderPredictionItem(prediction, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayPredictions.map((prediction, index) => renderPredictionItem(prediction, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && filteredPredictions.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.performancePredictions.actions.viewAll", "View All Predictions ({{count}})", { count: data.totalCount })}
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
  summaryBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 10 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  summaryDivider: { width: 1, height: 16, backgroundColor: "#E0E0E0" },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, position: "relative" },
  cardItem: { width: 160, padding: 14, alignItems: "center", gap: 8, position: "relative" },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 4 },
  cardContent: { alignItems: "center", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  predictionTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  predictionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  predictionValue: { fontSize: 11, fontWeight: "700" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  subjectText: { fontSize: 10 },
  description: { fontSize: 11, lineHeight: 16 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: "500" },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  confidenceText: { fontSize: 10 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: "600" },
  statusIndicator: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
