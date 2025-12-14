/**
 * Weak Areas Widget (progress.weak-areas)
 * 
 * Shows topics that need attention based on mastery percentage
 * Follows WIDGET_DEVELOPMENT_GUIDE.md patterns
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useWeakAreasQuery, WeakArea } from "../../../hooks/queries/useWeakAreasQuery";
import type { WidgetProps } from "../../../types/widget.types";

const WIDGET_ID = "progress.weak-areas";

type WeakAreasConfig = {
  maxTopics: number;
  showScore: boolean;
  showPracticeButton: boolean;
  showDifficulty: boolean;
  showSubject: boolean;
  showChapter: boolean;
  sortBy: "score" | "attempts" | "recent";
  subjectFilter?: string;
  compactMode: boolean;
  enableTap: boolean;
};

const DEFAULT_CONFIG: WeakAreasConfig = {
  maxTopics: 4,
  showScore: true,
  showPracticeButton: true,
  showDifficulty: true,
  showSubject: true,
  showChapter: false,
  sortBy: "score",
  compactMode: false,
  enableTap: true,
};

export const WeakAreasWidget: React.FC<WidgetProps> = ({
  config: userConfig,
  onNavigate,
  size = "standard",
}) => {
  const { t } = useTranslation("dashboard");
  const { colors, borderRadius } = useAppTheme();
  const { trackWidgetEvent } = useAnalytics();


  const config = { ...DEFAULT_CONFIG, ...userConfig } as WeakAreasConfig;

  const { data, isLoading, error, refetch } = useWeakAreasQuery(
    config.maxTopics,
    config.subjectFilter
  );

  const handleTopicPress = (area: WeakArea) => {
    if (!config.enableTap) return;

    trackWidgetEvent(WIDGET_ID, "click", {
      action: "topic_tap",
      topic_id: area.id,
      topic_name: area.topic_name,
      mastery_percentage: area.mastery_percentage,
    });

    onNavigate?.("topic-detail", { topicId: area.id });
  };

  const handlePracticePress = (area: WeakArea) => {
    trackWidgetEvent(WIDGET_ID, "click", {
      action: "practice_tap",
      topic_id: area.id,
      recommended_action: area.recommended_action,
    });

    switch (area.recommended_action) {
      case "practice":
        onNavigate?.("practice", { topicId: area.id });
        break;
      case "watch_video":
        onNavigate?.("video", { topicId: area.id });
        break;
      case "review":
        onNavigate?.("review", { topicId: area.id });
        break;
      case "ask_doubt":
        onNavigate?.("doubt-submit", { topicId: area.id });
        break;
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("weak-areas");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return colors.success;
      case "medium":
        return colors.warning;
      case "hard":
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "practice":
        return "pencil";
      case "watch_video":
        return "play-circle";
      case "review":
        return "book-open-variant";
      case "ask_doubt":
        return "help-circle";
      default:
        return "arrow-right";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "practice":
        return t("widgets.weakAreas.actions.practice");
      case "watch_video":
        return t("widgets.weakAreas.actions.watchVideo");
      case "review":
        return t("widgets.weakAreas.actions.review");
      case "ask_doubt":
        return t("widgets.weakAreas.actions.askDoubt");
      default:
        return t("widgets.weakAreas.actions.practice");
    }
  };


  const renderTopicCard = (area: WeakArea) => {
    const progressPercent = Math.min(area.mastery_percentage, 100);
    const progressColor =
      progressPercent < 30 ? colors.error : progressPercent < 50 ? colors.warning : colors.success;

    return (
      <TouchableOpacity
        key={area.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.medium,
            borderColor: colors.outline,
            padding: config.compactMode ? 10 : 14,
          },
        ]}
        onPress={() => handleTopicPress(area)}
        disabled={!config.enableTap}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          {/* Topic Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${area.color}20` },
            ]}
          >
            <Icon name={area.icon} size={20} color={area.color} />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Topic Name */}
            <AppText
              style={[
                styles.topicName,
                {
                  color: colors.onSurface,
                  fontSize: config.compactMode ? 14 : 16,
                },
              ]}
            >
              {area.topic_name}
            </AppText>

            {/* Subject & Chapter */}
            {(config.showSubject || config.showChapter) && (
              <View style={styles.metaRow}>
                {config.showSubject && (
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {area.subject_name}
                  </AppText>
                )}
                {config.showChapter && area.chapter_name && (
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {" "}• {area.chapter_name}
                  </AppText>
                )}
              </View>
            )}

            {/* Progress Bar */}
            {config.showScore && (
              <View style={styles.progressSection}>
                <View style={[styles.progressBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
                <View style={styles.progressMeta}>
                  <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                    {area.mastery_percentage}% {t("widgets.weakAreas.labels.mastery")}
                  </AppText>
                  {config.showDifficulty && (
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: `${getDifficultyColor(area.difficulty)}20` },
                      ]}
                    >
                      <AppText
                        style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(area.difficulty) },
                        ]}
                      >
                        {t(`widgets.weakAreas.difficulty.${area.difficulty}`)}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Practice Button */}
            {config.showPracticeButton && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: borderRadius.small,
                  },
                ]}
                onPress={() => handlePracticePress(area)}
              >
                <Icon
                  name={getActionIcon(area.recommended_action)}
                  size={14}
                  color={colors.primary}
                  style={styles.actionIcon}
                />
                <AppText style={[styles.actionText, { color: colors.primary }]}>
                  {getActionText(area.recommended_action)}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {t("widgets.weakAreas.states.loading")}
          </AppText>
        </View>
      </View>
    );
  }

  // Empty state (no weak areas = good!)
  if (error || !data?.areas?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color={colors.success} style={styles.emptyIcon} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("widgets.weakAreas.states.empty")}
          </AppText>
          <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            {t("widgets.weakAreas.states.emptySubtitle")}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary header if more items exist */}
      {data.total_weak_areas > config.maxTopics && (
        <View style={styles.summaryRow}>
          <AppText style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.weakAreas.labels.showing", {
              count: config.maxTopics,
              total: data.total_weak_areas,
            })}
          </AppText>
          <TouchableOpacity onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.weakAreas.actions.viewAll")}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Topics List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {data.areas.map(renderTopicCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    padding: 16,
    alignItems: "center",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 14,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 10,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  topicName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
  },
  progressSection: {
    marginTop: 4,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
