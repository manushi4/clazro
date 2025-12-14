import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useUserActivitiesQuery,
  groupActivitiesByDate,
  getTodayStats,
  UserActivity,
  DEMO_USER_ID,
} from "../../../hooks/queries/useUserActivitiesQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

// Activity type icons and colors
const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; emoji: string }> = {
  lesson_completed: { icon: "book-check", color: "#10B981", emoji: "📚" },
  test_taken: { icon: "clipboard-check", color: "#3B82F6", emoji: "📝" },
  assignment_submitted: { icon: "file-document-check", color: "#06B6D4", emoji: "✅" },
  doubt_asked: { icon: "help-circle", color: "#8B5CF6", emoji: "❓" },
  doubt_resolved: { icon: "lightbulb-on", color: "#F59E0B", emoji: "💡" },
  badge_earned: { icon: "medal", color: "#F59E0B", emoji: "🏆" },
  streak_milestone: { icon: "fire", color: "#EF4444", emoji: "🔥" },
  xp_earned: { icon: "star", color: "#F59E0B", emoji: "⭐" },
  note_created: { icon: "note-text", color: "#14B8A6", emoji: "📝" },
  video_watched: { icon: "play-circle", color: "#EC4899", emoji: "🎬" },
  quiz_completed: { icon: "checkbox-marked-circle", color: "#8B5CF6", emoji: "✨" },
  login: { icon: "login", color: "#6366F1", emoji: "👋" },
  level_up: { icon: "arrow-up-bold-circle", color: "#F59E0B", emoji: "🚀" },
};

export const ProfileActivityWidget: React.FC<WidgetProps> = ({
  config,
  userId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("profile");

  // Config options
  const layoutStyle = (config?.layoutStyle as "timeline" | "list" | "cards") || "timeline";
  const maxItems = (config?.maxItems as number) || 10;
  const showTodayStats = config?.showTodayStats !== false;
  const showPoints = config?.showPoints !== false;
  const showTime = config?.showTime !== false;
  const showGroupHeaders = config?.showGroupHeaders !== false;
  const compactMode = config?.compactMode === true;

  // Fetch activities
  const { data: activities, isLoading, error } = useUserActivitiesQuery(
    userId || DEMO_USER_ID,
    maxItems
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !activities) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="history" size={32} color={colors.error} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.activity.states.error")}
        </AppText>
      </View>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Icon name="rocket-launch" size={32} color={colors.primary} />
        </View>
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.activity.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          Start learning to see your activity here!
        </AppText>
      </View>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);
  const todayStats = getTodayStats(activities);

  // Format relative time
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Render single activity item
  const renderActivity = (activity: UserActivity, isLast: boolean, showLine: boolean = true) => {
    const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.lesson_completed;
    const title = getLocalizedField(activity, "title");
    const description = getLocalizedField(activity, "description");

    return (
      <View key={activity.id} style={styles.activityRow}>
        {/* Timeline line */}
        {layoutStyle === "timeline" && showLine && (
          <View style={styles.timelineColumn}>
            <View style={[styles.timelineDot, { backgroundColor: activity.color || config.color }]}>
              <Icon name={activity.icon || config.icon} size={14} color="#fff" />
            </View>
            {!isLast && (
              <View style={[styles.timelineLine, { backgroundColor: colors.outline + "40" }]} />
            )}
          </View>
        )}

        {/* Activity card */}
        <View
          style={[
            styles.activityCard,
            compactMode && styles.activityCardCompact,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
              borderLeftColor: activity.color || config.color,
            },
          ]}
        >
          {/* Header row */}
          <View style={styles.activityHeader}>
            {layoutStyle !== "timeline" && (
              <View style={[styles.activityIcon, { backgroundColor: (activity.color || config.color) + "20" }]}>
                <Icon name={activity.icon || config.icon} size={16} color={activity.color || config.color} />
              </View>
            )}
            <View style={styles.activityTitleContainer}>
              <AppText style={[styles.activityTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {title}
              </AppText>
              {showTime && (
                <AppText style={[styles.activityTime, { color: colors.onSurfaceVariant }]}>
                  {formatTime(activity.activity_at)}
                </AppText>
              )}
            </View>
            {showPoints && activity.points_earned > 0 && (
              <View style={[styles.pointsBadge, { backgroundColor: colors.warning + "20" }]}>
                <Icon name="star" size={10} color={colors.warning} />
                <AppText style={[styles.pointsText, { color: colors.warning }]}>
                  +{activity.points_earned}
                </AppText>
              </View>
            )}
          </View>

          {/* Description */}
          {!compactMode && description && (
            <AppText style={[styles.activityDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {description}
            </AppText>
          )}

          {/* Meta row */}
          {!compactMode && (activity.duration_minutes || activity.score) && (
            <View style={styles.metaRow}>
              {activity.duration_minutes && (
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {activity.duration_minutes} min
                  </AppText>
                </View>
              )}
              {activity.score && (
                <View style={styles.metaItem}>
                  <Icon name="percent" size={12} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {activity.score}%
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Today's Stats Banner */}
      {showTodayStats && todayStats.count > 0 && (
        <View style={[styles.todayBanner, { backgroundColor: colors.primary + "15", borderRadius: borderRadius.medium }]}>
          <View style={styles.todayHeader}>
            <Icon name="calendar-today" size={18} color={colors.primary} />
            <AppText style={[styles.todayTitle, { color: colors.primary }]}>
              Today's Progress
            </AppText>
          </View>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <AppText style={[styles.todayStatValue, { color: colors.onSurface }]}>
                {todayStats.count}
              </AppText>
              <AppText style={[styles.todayStatLabel, { color: colors.onSurfaceVariant }]}>
                Activities
              </AppText>
            </View>
            <View style={[styles.todayDivider, { backgroundColor: colors.primary + "30" }]} />
            <View style={styles.todayStat}>
              <View style={styles.todayStatRow}>
                <Icon name="star" size={14} color={colors.warning} />
                <AppText style={[styles.todayStatValue, { color: colors.onSurface }]}>
                  {todayStats.points}
                </AppText>
              </View>
              <AppText style={[styles.todayStatLabel, { color: colors.onSurfaceVariant }]}>
                XP Earned
              </AppText>
            </View>
            {todayStats.minutes > 0 && (
              <>
                <View style={[styles.todayDivider, { backgroundColor: colors.primary + "30" }]} />
                <View style={styles.todayStat}>
                  <AppText style={[styles.todayStatValue, { color: colors.onSurface }]}>
                    {todayStats.minutes}m
                  </AppText>
                  <AppText style={[styles.todayStatLabel, { color: colors.onSurfaceVariant }]}>
                    Study Time
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Activity Feed */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {activities.slice(0, maxItems).map((activity, i) => (
            <View key={activity.id} style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
              <View style={[styles.cardIcon, { backgroundColor: (activity.color || ACTIVITY_CONFIG[activity.activity_type]?.color || colors.primary) + "20" }]}>
                <Icon
                  name={activity.icon || ACTIVITY_CONFIG[activity.activity_type]?.icon || "check"}
                  size={20}
                  color={activity.color || ACTIVITY_CONFIG[activity.activity_type]?.color || colors.primary}
                />
              </View>
              <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                {getLocalizedField(activity, "title")}
              </AppText>
              <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
                {formatTime(activity.activity_at)}
              </AppText>
              {activity.points_earned > 0 && (
                <View style={[styles.cardPoints, { backgroundColor: colors.warning + "20" }]}>
                  <Icon name="star" size={10} color={colors.warning} />
                  <AppText style={[styles.cardPointsText, { color: colors.warning }]}>
                    +{activity.points_earned}
                  </AppText>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.feedContainer}>
          {showGroupHeaders ? (
            groupedActivities.map((group, groupIndex) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={[styles.dateBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <AppText style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                      {group.label}
                    </AppText>
                  </View>
                  <View style={[styles.dateLine, { backgroundColor: colors.outline + "30" }]} />
                </View>
                {group.activities.map((activity, i) =>
                  renderActivity(activity, i === group.activities.length - 1 && groupIndex === groupedActivities.length - 1, layoutStyle === "timeline")
                )}
              </View>
            ))
          ) : (
            activities.slice(0, maxItems).map((activity, i) =>
              renderActivity(activity, i === Math.min(activities.length, maxItems) - 1, layoutStyle === "timeline")
            )
          )}
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },

  // Today's Stats Banner
  todayBanner: {
    padding: 14,
    gap: 10,
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  todayStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  todayStat: {
    alignItems: "center",
    gap: 2,
  },
  todayStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  todayStatValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayStatLabel: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  todayDivider: {
    width: 1,
    height: 32,
  },

  // Feed Container
  feedContainer: {
    gap: 4,
  },

  // Date Group
  dateGroup: {
    gap: 8,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateLine: {
    flex: 1,
    height: 1,
  },

  // Activity Row
  activityRow: {
    flexDirection: "row",
    gap: 12,
  },

  // Timeline
  timelineColumn: {
    alignItems: "center",
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 1,
  },

  // Activity Card
  activityCard: {
    flex: 1,
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  activityCardCompact: {
    padding: 10,
    gap: 4,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitleContainer: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  activityTime: {
    fontSize: 10,
  },
  activityDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 0,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },

  // Cards Layout
  cardsScroll: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 8,
  },
  cardItem: {
    width: 120,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  cardTime: {
    fontSize: 9,
  },
  cardPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardPointsText: {
    fontSize: 9,
    fontWeight: "600",
  },
});

export default ProfileActivityWidget;
