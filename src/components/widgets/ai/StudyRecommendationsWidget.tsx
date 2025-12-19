/**
 * Study Recommendations Widget (ai.study-recommendations)
 * Displays AI-generated personalized study recommendations
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
import { useStudyRecommendationsQuery, StudyRecommendation, RecommendationType } from "../../../hooks/queries/useStudyRecommendationsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "ai.study-recommendations";

export const StudyRecommendationsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useStudyRecommendationsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showConfidence = config?.showConfidence !== false;
  const showAction = config?.showAction !== false;
  const showSubject = config?.showSubject !== false;
  const showTime = config?.showTime !== false;
  const showDifficulty = config?.showDifficulty !== false;
  const showReason = config?.showReason !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const filterType = config?.filterType as RecommendationType | "all" | undefined;
  const filterDifficulty = config?.filterDifficulty as string | "all" | undefined;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";


  // Color mapping using theme colors
  const getRecommendationColor = (colorKey: string) => {
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

  const getTypeIcon = (type: RecommendationType) => {
    const icons: Record<RecommendationType, string> = {
      content: "play-circle-outline",
      practice: "pencil-outline",
      revision: "book-open-outline",
      challenge: "trophy-outline",
      remedial: "alert-circle-outline",
      enrichment: "star-outline",
    };
    return icons[type] || "lightbulb-outline";
  };

  const getDifficultyLabel = (difficulty: string | null) => {
    if (!difficulty) return null;
    const labels: Record<string, string> = {
      easy: t("widgets.studyRecommendations.difficulty.easy", "Easy"),
      medium: t("widgets.studyRecommendations.difficulty.medium", "Medium"),
      hard: t("widgets.studyRecommendations.difficulty.hard", "Hard"),
    };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    if (!difficulty) return colors.onSurfaceVariant;
    const diffColors: Record<string, string> = {
      easy: colors.success,
      medium: colors.warning,
      hard: colors.error,
    };
    return diffColors[difficulty] || colors.onSurfaceVariant;
  };

  const getLocalizedTitle = (rec: StudyRecommendation) => {
    return getLocalizedField({ title_en: rec.titleEn, title_hi: rec.titleHi }, 'title');
  };

  const getLocalizedDescription = (rec: StudyRecommendation) => {
    return getLocalizedField({ description_en: rec.descriptionEn, description_hi: rec.descriptionHi }, 'description');
  };

  const getLocalizedReason = (rec: StudyRecommendation) => {
    return getLocalizedField({ reason_en: rec.reasonEn, reason_hi: rec.reasonHi }, 'reason');
  };

  const getLocalizedActionLabel = (rec: StudyRecommendation) => {
    return getLocalizedField({ action_label_en: rec.actionLabelEn, action_label_hi: rec.actionLabelHi }, 'action_label');
  };

  const handleRecommendationPress = (rec: StudyRecommendation) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "recommendation_tap", recId: rec.id, type: rec.recommendationType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_recommendation_tap`, level: "info", data: { recId: rec.id } });
    if (rec.actionRoute) {
      onNavigate?.(rec.actionRoute);
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("study-recommendations");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyRecommendations.states.loading", "Finding recommendations...")}
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
          {t("widgets.studyRecommendations.states.error", "Couldn't load recommendations")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.studyRecommendations.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.recommendations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="check-circle" size={32} color={colors.success} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyRecommendations.states.empty", "No recommendations right now")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyRecommendations.states.emptyHint", "Keep learning to get personalized suggestions")}
        </AppText>
      </View>
    );
  }


  // Filter recommendations
  let filteredRecs = data.recommendations;
  if (filterType && filterType !== "all") {
    filteredRecs = filteredRecs.filter(r => r.recommendationType === filterType);
  }
  if (filterDifficulty && filterDifficulty !== "all") {
    filteredRecs = filteredRecs.filter(r => r.difficulty === filterDifficulty);
  }
  const displayRecs = filteredRecs.slice(0, maxItems);

  const renderConfidenceBadge = (rec: StudyRecommendation, recColor: string) => {
    if (!showConfidence || rec.confidenceScore === null) return null;
    const confidencePercent = Math.round(rec.confidenceScore * 100);
    
    return (
      <View style={[styles.confidenceBadge, { backgroundColor: `${recColor}15` }]}>
        <Icon name="check-decagram" size={10} color={recColor} />
        <AppText style={[styles.confidenceText, { color: recColor }]}>
          {t("widgets.studyRecommendations.labels.confidence", "{{value}}%", { value: confidencePercent })}
        </AppText>
      </View>
    );
  };

  const renderRecommendationItem = (rec: StudyRecommendation, index: number) => {
    const recColor = getRecommendationColor(rec.color);

    return (
      <TouchableOpacity
        key={rec.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          rec.priority <= 2 && { borderLeftWidth: 3, borderLeftColor: recColor }
        ]}
        onPress={() => handleRecommendationPress(rec)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${recColor}15` }]}>
          <Icon name={rec.icon || getTypeIcon(rec.recommendationType)} size={layoutStyle === "cards" ? 24 : 20} color={recColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "cards" ? styles.cardContent : styles.listContent}>
          <View style={styles.titleRow}>
            <AppText style={[styles.recTitle, { color: colors.onSurface }]} numberOfLines={layoutStyle === "cards" ? 2 : 1}>
              {getLocalizedTitle(rec)}
            </AppText>
            {renderConfidenceBadge(rec, recColor)}
          </View>

          {showSubject && rec.subject && !compactMode && (
            <View style={styles.subjectRow}>
              <Icon name="book-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]}>
                {rec.subject}{rec.topic ? ` • ${rec.topic}` : ''}
              </AppText>
            </View>
          )}

          {showDescription && !compactMode && layoutStyle !== "cards" && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedDescription(rec)}
            </AppText>
          )}

          {showReason && rec.reasonEn && !compactMode && (
            <View style={styles.reasonRow}>
              <Icon name="lightbulb-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.reasonText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {getLocalizedReason(rec)}
              </AppText>
            </View>
          )}

          {/* Meta info row */}
          {!compactMode && (showTime || showDifficulty) && (
            <View style={styles.metaRow}>
              {showTime && rec.estimatedTimeMinutes && (
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={10} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.studyRecommendations.labels.minutes", "{{count}} min", { count: rec.estimatedTimeMinutes })}
                  </AppText>
                </View>
              )}
              {showDifficulty && rec.difficulty && (
                <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(rec.difficulty)}15` }]}>
                  <AppText style={[styles.difficultyText, { color: getDifficultyColor(rec.difficulty) }]}>
                    {getDifficultyLabel(rec.difficulty)}
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action button */}
        {showAction && rec.actionRoute && !compactMode && layoutStyle !== "cards" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: recColor }]}
            onPress={() => handleRecommendationPress(rec)}
            activeOpacity={0.7}
          >
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {getLocalizedActionLabel(rec) || t("widgets.studyRecommendations.actions.start", "Start")}
            </AppText>
          </TouchableOpacity>
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
      {!compactMode && data.highPriorityCount > 0 && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <Icon name="star-circle" size={16} color={colors.primary} />
          <AppText style={[styles.summaryText, { color: colors.primary }]}>
            {t("widgets.studyRecommendations.labels.highPriority", "{{count}} high priority recommendations", { count: data.highPriorityCount })}
          </AppText>
        </View>
      )}

      {/* Recommendations list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayRecs.map((rec, index) => renderRecommendationItem(rec, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayRecs.map((rec, index) => renderRecommendationItem(rec, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && filteredRecs.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.studyRecommendations.actions.viewAll", "View All ({{count}})", { count: data.totalCount })}
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
  recTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  confidenceBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  confidenceText: { fontSize: 10, fontWeight: "600" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  subjectText: { fontSize: 10 },
  description: { fontSize: 11, lineHeight: 16 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  reasonText: { fontSize: 10, fontStyle: "italic" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10 },
  difficultyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 10, fontWeight: "600" },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
