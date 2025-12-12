import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildWeakAreasQuery, WeakArea } from "../../../hooks/queries/parent/useChildWeakAreasQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.weak-areas";

export const ChildWeakAreasWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const maxTopics = (config?.maxTopics as number) || 4;
  const { data: childrenWeakAreas, isLoading, error } = useChildWeakAreasQuery(maxTopics);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showScore = config?.showScore !== false;
  const showPracticeButton = config?.showPracticeButton !== false;
  const showDifficulty = config?.showDifficulty !== false;
  const showSubject = config?.showSubject !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return colors.success;
      case "medium": return colors.warning;
      case "hard": return colors.error;
      default: return colors.onSurfaceVariant;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return colors.error;
    if (percentage < 50) return colors.warning;
    return colors.success;
  };

  const handleTopicPress = (area: WeakArea, childId: string) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "topic_tap", topicId: area.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_topic_tap`, level: "info", data: { topicId: area.id } });
    onNavigate?.(`child-weak-area/${area.id}`, { childId });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-weak-areas-detail");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.weakAreas.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.weakAreas.states.error")}
        </AppText>
      </View>
    );
  }

  if (!childrenWeakAreas || childrenWeakAreas.length === 0 || childrenWeakAreas.every(c => c.areas.length === 0)) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: `${colors.success}10` }]}>
        <Icon name="check-circle" size={40} color={colors.success} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.weakAreas.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.weakAreas.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // For now, show first child's weak areas
  const childData = childrenWeakAreas[0];
  const displayAreas = childData.areas.slice(0, maxTopics);
  const isCompact = size === "compact" || compactMode;

  const renderListItem = (area: WeakArea, index: number) => {
    const progressColor = getProgressColor(area.mastery_percentage);

    return (
      <TouchableOpacity
        key={area.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        onPress={() => handleTopicPress(area, childData.child_user_id)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${area.color}15` }]}>
          <Icon name={area.icon} size={20} color={area.color} />
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <AppText style={[styles.topicName, { color: colors.onSurface }]} numberOfLines={1}>
              {area.topic_name}
            </AppText>
            {showDifficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(area.difficulty)}15` }]}>
                <AppText style={[styles.difficultyText, { color: getDifficultyColor(area.difficulty) }]}>
                  {t(`widgets.weakAreas.difficulty.${area.difficulty}`)}
                </AppText>
              </View>
            )}
          </View>
          {showSubject && (
            <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]}>
              {area.subject_name}
            </AppText>
          )}
          {showScore && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBg, { backgroundColor: `${progressColor}20` }]}>
                <View style={[styles.progressFill, { width: `${area.mastery_percentage}%`, backgroundColor: progressColor }]} />
              </View>
              <AppText style={[styles.progressText, { color: progressColor }]}>
                {area.mastery_percentage}% {t("widgets.weakAreas.mastery")}
              </AppText>
            </View>
          )}
        </View>
        {showPracticeButton && (
          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => handleTopicPress(area, childData.child_user_id)}
          >
            <Icon name="play-circle" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderCardItem = (area: WeakArea, index: number) => {
    const progressColor = getProgressColor(area.mastery_percentage);

    return (
      <TouchableOpacity
        key={area.id}
        style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        onPress={() => handleTopicPress(area, childData.child_user_id)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIconWrapper, { backgroundColor: `${area.color}15` }]}>
          <Icon name={area.icon} size={22} color={area.color} />
        </View>
        <AppText style={[styles.cardTopicName, { color: colors.onSurface }]} numberOfLines={2}>
          {area.topic_name}
        </AppText>
        {showSubject && (
          <AppText style={[styles.cardSubject, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {area.subject_name}
          </AppText>
        )}
        {showScore && (
          <View style={styles.cardProgressSection}>
            <AppText style={[styles.cardProgressText, { color: progressColor }]}>
              {area.mastery_percentage}%
            </AppText>
            <View style={[styles.cardProgressBg, { backgroundColor: `${progressColor}20` }]}>
              <View style={[styles.cardProgressFill, { width: `${area.mastery_percentage}%`, backgroundColor: progressColor }]} />
            </View>
          </View>
        )}
        {showDifficulty && (
          <View style={[styles.cardDifficultyBadge, { backgroundColor: `${getDifficultyColor(area.difficulty)}15` }]}>
            <AppText style={[styles.cardDifficultyText, { color: getDifficultyColor(area.difficulty) }]}>
              {t(`widgets.weakAreas.difficulty.${area.difficulty}`)}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCompactItem = (area: WeakArea, index: number) => {
    const progressColor = getProgressColor(area.mastery_percentage);

    return (
      <TouchableOpacity
        key={area.id}
        style={[styles.compactItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
        onPress={() => handleTopicPress(area, childData.child_user_id)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <Icon name={area.icon} size={16} color={area.color} />
        <AppText style={[styles.compactTopicName, { color: colors.onSurface }]} numberOfLines={1}>
          {area.topic_name}
        </AppText>
        <AppText style={[styles.compactProgress, { color: progressColor }]}>
          {area.mastery_percentage}%
        </AppText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      {childData.critical_count > 0 && !isCompact && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.error}10`, borderRadius: borderRadius.medium }]}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <AppText style={[styles.summaryText, { color: colors.error }]}>
            {t("widgets.weakAreas.criticalCount", { count: childData.critical_count })}
          </AppText>
        </View>
      )}

      {/* Areas List */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayAreas.map((area, index) => renderCardItem(area, index))}
        </ScrollView>
      ) : layoutStyle === "compact" ? (
        <View style={styles.compactContainer}>
          {displayAreas.map((area, index) => renderCompactItem(area, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayAreas.map((area, index) => renderListItem(area, index))}
        </View>
      )}

      {/* View All Button */}
      {childData.total_weak_areas > maxTopics && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.weakAreas.actions.viewAll", { count: childData.total_weak_areas })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Loading/Error/Empty states
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  // Summary banner
  summaryBanner: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  summaryText: { fontSize: 13, fontWeight: "500" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", padding: 12, gap: 12, alignItems: "flex-start" },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 4 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topicName: { fontSize: 14, fontWeight: "600", flex: 1 },
  subjectText: { fontSize: 12 },
  progressSection: { marginTop: 4, gap: 4 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500" },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  difficultyText: { fontSize: 10, fontWeight: "600" },
  practiceButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: { width: 130, padding: 14, alignItems: "center", gap: 6 },
  cardIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardTopicName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  cardSubject: { fontSize: 10, textAlign: "center" },
  cardProgressSection: { alignItems: "center", gap: 4, width: "100%" },
  cardProgressText: { fontSize: 16, fontWeight: "700" },
  cardProgressBg: { height: 4, borderRadius: 2, overflow: "hidden", width: "100%" },
  cardProgressFill: { height: "100%", borderRadius: 2 },
  cardDifficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  cardDifficultyText: { fontSize: 9, fontWeight: "600" },
  // Compact layout
  compactContainer: { gap: 6 },
  compactItem: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
  compactTopicName: { flex: 1, fontSize: 13, fontWeight: "500" },
  compactProgress: { fontSize: 13, fontWeight: "700" },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
