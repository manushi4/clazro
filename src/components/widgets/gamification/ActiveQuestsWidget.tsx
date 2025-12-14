/**
 * Active Quests Widget (quests.active)
 * Displays daily/weekly quests with progress tracking
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useActiveQuestsQuery, Quest } from "../../../hooks/queries/useActiveQuestsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "quests.active";

export const ActiveQuestsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useActiveQuestsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxQuests = (config?.maxQuests as number) || 3;
  const showDaily = config?.showDaily !== false;
  const showWeekly = config?.showWeekly !== false;
  const showProgress = config?.showProgress !== false;
  const showXPReward = config?.showXPReward !== false;
  const showSummary = config?.showSummary !== false;
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;

  const handleQuestPress = (quest: Quest) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "quest_tap", questId: quest.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_quest_tap`, level: "info", data: { questId: quest.id } });
    onNavigate?.(`quests/${quest.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("quests");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.activeQuests.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.activeQuests.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.activeQuests.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const allQuests: Quest[] = [];
  if (showDaily && data?.daily) allQuests.push(...data.daily);
  if (showWeekly && data?.weekly) allQuests.push(...data.weekly);
  const displayQuests = allQuests.slice(0, maxQuests);

  if (displayQuests.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="trophy-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.activeQuests.states.empty")}</AppText>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.primary;
    }
  };

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return t("widgets.activeQuests.labels.daily");
      case 'weekly': return t("widgets.activeQuests.labels.weekly");
      case 'special': return t("widgets.activeQuests.labels.special");
      default: return type;
    }
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}

      {/* Summary Banner */}
      {showSummary && !compactMode && data && (
        <View style={[styles.summaryBanner, { backgroundColor: colors.primaryContainer }]}>
          <View style={styles.summaryItem}>
            <Icon name="check-circle" size={16} color={colors.primary} />
            <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>{data.completed_today}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>{t("widgets.activeQuests.labels.completedToday")}</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.summaryItem}>
            <Icon name="star" size={16} color={colors.warning} />
            <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>{data.total_xp_available}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>{t("widgets.activeQuests.labels.xpAvailable")}</AppText>
          </View>
        </View>
      )}

      {/* Quest List */}
      <View style={[styles.questList, { gap: compactMode ? 8 : 10 }]}>
        {displayQuests.map((quest) => {
          const progress = Math.min((quest.current_value / quest.target_value) * 100, 100);
          const title = getLocalizedField(quest, 'title') || quest.title_en;
          
          return (
            <TouchableOpacity
              key={quest.id}
              style={[styles.questCard, { backgroundColor: colors.surfaceVariant }, compactMode && styles.questCardCompact]}
              onPress={enableTap ? () => handleQuestPress(quest) : undefined}
              disabled={!enableTap}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={[styles.questIcon, { backgroundColor: getDifficultyColor(quest.difficulty) + "20" }]}>
                <AppText style={styles.questEmoji}>{quest.icon}</AppText>
              </View>

              {/* Content */}
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <AppText style={[styles.questTitle, { color: colors.onSurface }, compactMode && styles.questTitleCompact]} numberOfLines={1}>
                    {title}
                  </AppText>
                  <View style={[styles.typeBadge, { backgroundColor: quest.quest_type === 'weekly' ? colors.tertiary + "20" : colors.primary + "20" }]}>
                    <AppText style={[styles.typeText, { color: quest.quest_type === 'weekly' ? colors.tertiary : colors.primary }]}>
                      {getQuestTypeLabel(quest.quest_type)}
                    </AppText>
                  </View>
                </View>

                {/* Progress Bar */}
                {showProgress && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.outline + "40" }]}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: getDifficultyColor(quest.difficulty) }]} />
                    </View>
                    <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                      {quest.current_value}/{quest.target_value}
                    </AppText>
                  </View>
                )}

                {/* XP Reward */}
                {showXPReward && !compactMode && (
                  <View style={styles.rewardContainer}>
                    <Icon name="star" size={12} color={colors.warning} />
                    <AppText style={[styles.rewardText, { color: colors.warning }]}>+{quest.xp_reward} XP</AppText>
                  </View>
                )}
              </View>

              {/* Chevron */}
              {enableTap && (
                <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View All */}
      {enableTap && !compactMode && allQuests.length > maxQuests && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>{t("widgets.activeQuests.actions.viewAll", { count: allQuests.length })}</AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Gamified Hub CTA */}
      {!compactMode && (
        <TouchableOpacity
          style={[styles.gamifiedHubCta, { backgroundColor: colors.primary }]}
          onPress={() => {
            trackWidgetEvent(WIDGET_ID, "click", { action: "gamified_hub" });
            onNavigate?.("gamified-hub");
          }}
          activeOpacity={0.7}
        >
          <Icon name="trophy" size={18} color={colors.onPrimary} />
          <AppText style={[styles.gamifiedHubText, { color: colors.onPrimary }]}>
            {t("widgets.activeQuests.actions.gamifiedHub", { defaultValue: "Gamified Learning Hub" })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  summaryBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12 },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  summaryLabel: { fontSize: 10 },
  summaryDivider: { width: 1, height: 30 },
  questList: {},
  questCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  questCardCompact: { padding: 10 },
  questIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  questEmoji: { fontSize: 22 },
  questContent: { flex: 1, gap: 6 },
  questHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  questTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  questTitleCompact: { fontSize: 13 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500", minWidth: 35 },
  rewardContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 11, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  gamifiedHubCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  gamifiedHubText: { fontSize: 14, fontWeight: "600" },
});
