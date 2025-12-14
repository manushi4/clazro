/**
 * Study Streak Widget (progress.streak)
 * Shows study streak progress, achievements, and motivation
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useStudyStreakQuery, type StreakAchievement } from "../../../hooks/queries/useStudyStreakQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "progress.streak";

export const StudyStreakWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useStudyStreakQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const showCurrentStreak = config?.showCurrentStreak !== false;
  const showLongestStreak = config?.showLongestStreak !== false && size !== "compact";
  const showWeeklyGoal = config?.showWeeklyGoal !== false;
  const showAchievements = config?.showAchievements !== false && size !== "compact";
  const showRecentActivity = config?.showRecentActivity !== false && size === "expanded";
  const maxAchievements = (config?.maxAchievements as number) || (size === "expanded" ? 4 : 2);
  const enableTap = config?.enableTap !== false;
  const showMotivation = config?.showMotivation !== false;

  const handleStreakPress = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "streak_tap" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_streak_tap`, level: "info" });
    onNavigate?.("progress/streak");
  };

  const handleAchievementPress = (achievement: StreakAchievement) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "achievement_tap", achievementId: achievement.id });
    onNavigate?.("progress/achievements");
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("progress");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.studyStreak.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.studyStreak.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="fire" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.states.empty")}</AppText>
      </View>
    );
  }

  const weeklyProgress = Math.min((data.current_streak / data.weekly_goal) * 100, 100);
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return colors.success;
    if (streak >= 14) return colors.primary;
    if (streak >= 7) return colors.warning;
    return colors.tertiary;
  };
  const streakColor = getStreakColor(data.current_streak);
  const formatHours = (hours: number) => hours < 1 ? `${Math.round(hours * 60)}m` : `${Math.round(hours * 10) / 10}h`;
  const getAchievementColor = (colorKey: string) => {
    const map: Record<string, string> = { primary: colors.primary, success: colors.success, warning: colors.warning, error: colors.error, tertiary: colors.tertiary };
    return map[colorKey] || colors.primary;
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}

      {showCurrentStreak && (
        <TouchableOpacity style={[styles.streakSection, { backgroundColor: colors.surfaceVariant }]} onPress={enableTap ? handleStreakPress : undefined} disabled={!enableTap} activeOpacity={0.7}>
          <View style={styles.streakHeader}>
            <View style={styles.streakInfo}>
              <View style={styles.streakNumber}>
                <Icon name="fire" size={24} color={streakColor} />
                <AppText style={[styles.streakCount, { color: colors.onSurface }]}>{data.current_streak}</AppText>
              </View>
              <View style={styles.streakLabels}>
                <AppText style={[styles.streakTitle, { color: colors.onSurface }]}>{t("widgets.studyStreak.labels.currentStreak")}</AppText>
                <AppText style={[styles.streakSubtitle, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.labels.days", { count: data.current_streak })}</AppText>
              </View>
            </View>
            {showWeeklyGoal && (
              <View style={styles.goalProgress}>
                <View style={[styles.progressBar, { backgroundColor: `${colors.outline}30` }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: streakColor, width: `${weeklyProgress}%` }]} />
                </View>
                <AppText style={[styles.goalText, { color: colors.onSurfaceVariant }]}>{data.current_streak}/{data.weekly_goal} {t("widgets.studyStreak.labels.weeklyGoal")}</AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {(showLongestStreak || size === "expanded") && (
        <View style={styles.statsRow}>
          {showLongestStreak && (
            <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
              <Icon name="trophy" size={16} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.longest_streak}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.labels.longest")}</AppText>
            </View>
          )}
          {size === "expanded" && (
            <>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="calendar-check" size={16} color={colors.success} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.total_study_days}</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.labels.totalDays")}</AppText>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="clock" size={16} color={colors.info} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{formatHours(data.total_study_hours)}</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{t("widgets.studyStreak.labels.totalHours")}</AppText>
              </View>
            </>
          )}
        </View>
      )}

      {showAchievements && data.achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("widgets.studyStreak.labels.recentAchievements")}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsContainer}>
            {data.achievements.slice(0, maxAchievements).map((achievement) => (
              <TouchableOpacity key={achievement.id} style={[styles.achievementCard, { backgroundColor: colors.surfaceVariant }]} onPress={enableTap ? () => handleAchievementPress(achievement) : undefined} disabled={!enableTap} activeOpacity={0.7}>
                <View style={[styles.achievementIcon, { backgroundColor: `${getAchievementColor(achievement.color)}20` }]}>
                  <Icon name={achievement.icon} size={20} color={getAchievementColor(achievement.color)} />
                </View>
                <AppText style={[styles.achievementTitle, { color: colors.onSurface }]} numberOfLines={1}>{getLocalizedField(achievement, 'title')}</AppText>
                <AppText style={[styles.achievementDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{getLocalizedField(achievement, 'description')}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showRecentActivity && data.recent_activities.length > 0 && (
        <View style={styles.activitySection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>{t("widgets.studyStreak.labels.recentActivity")}</AppText>
          {data.recent_activities.slice(0, 3).map((activity) => (
            <View key={activity.id} style={[styles.activityItem, { backgroundColor: colors.surfaceVariant }]}>
              <View style={styles.activityHeader}>
                <AppText style={[styles.activityDate, { color: colors.onSurface }]}>{new Date(activity.study_date).toLocaleDateString()}</AppText>
                <AppText style={[styles.activityDuration, { color: colors.primary }]}>{formatHours(activity.minutes_studied / 60)}</AppText>
              </View>
              <AppText style={[styles.activityType, { color: colors.onSurfaceVariant }]}>{getLocalizedField(activity, 'activity_type')}</AppText>
              <AppText style={[styles.activitySubjects, { color: colors.onSurfaceVariant }]}>{activity.subjects_studied.join(', ')} • {activity.activities_completed} {t("widgets.studyStreak.labels.activities")}</AppText>
            </View>
          ))}
        </View>
      )}

      {showMotivation && data.milestone_title_en && (
        <View style={[styles.motivationCard, { backgroundColor: `${streakColor}15` }]}>
          <Icon name="star" size={16} color={streakColor} />
          <View style={styles.motivationText}>
            <AppText style={[styles.motivationTitle, { color: colors.onSurface }]}>{getLocalizedField(data, 'milestone_title')}</AppText>
            <AppText style={[styles.motivationDesc, { color: colors.onSurfaceVariant }]}>{getLocalizedField(data, 'milestone_description')}</AppText>
          </View>
        </View>
      )}

      {enableTap && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>{t("widgets.studyStreak.actions.viewAll")}</AppText>
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
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  streakSection: { padding: 16, borderRadius: 12 },
  streakHeader: { gap: 12 },
  streakInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakNumber: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakCount: { fontSize: 28, fontWeight: "700" },
  streakLabels: { flex: 1 },
  streakTitle: { fontSize: 16, fontWeight: "600" },
  streakSubtitle: { fontSize: 13, marginTop: 2 },
  goalProgress: { gap: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  goalText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },
  achievementsSection: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  achievementsContainer: { gap: 12, paddingRight: 4 },
  achievementCard: { width: 120, padding: 12, borderRadius: 12, alignItems: "center", gap: 6 },
  achievementIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  achievementTitle: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  achievementDesc: { fontSize: 10, textAlign: "center" },
  activitySection: { gap: 8 },
  activityItem: { padding: 12, borderRadius: 10, gap: 6 },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activityDate: { fontSize: 13, fontWeight: "600" },
  activityDuration: { fontSize: 13, fontWeight: "700" },
  activityType: { fontSize: 12 },
  activitySubjects: { fontSize: 11 },
  motivationCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, gap: 10 },
  motivationText: { flex: 1 },
  motivationTitle: { fontSize: 13, fontWeight: "600" },
  motivationDesc: { fontSize: 11, marginTop: 2 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
