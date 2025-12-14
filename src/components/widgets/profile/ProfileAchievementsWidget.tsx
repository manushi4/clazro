import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useUserAchievementsQuery,
  useAchievementStats,
  AchievementWithProgress,
  DEMO_USER_ID,
} from "../../../hooks/queries/useUserAchievementsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

// Rarity config with colors and glow
const RARITY_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  common: { color: "#9CA3AF", glow: "#9CA3AF30", label: "⚪" },
  uncommon: { color: "#10B981", glow: "#10B98130", label: "🟢" },
  rare: { color: "#3B82F6", glow: "#3B82F630", label: "🔵" },
  epic: { color: "#8B5CF6", glow: "#8B5CF630", label: "🟣" },
  legendary: { color: "#F59E0B", glow: "#F59E0B40", label: "🌟" },
};

export const ProfileAchievementsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("profile");

  // Config options
  const layoutStyle = (config?.layoutStyle as "grid" | "list" | "cards") || "cards";
  const maxItems = (config?.maxItems as number) || 6;
  const showProgress = config?.showProgress !== false;
  const showPoints = config?.showPoints !== false;
  const showLocked = config?.showLocked !== false;
  const showSummary = config?.showSummary !== false;
  const filterCategory = config?.filterCategory as string | undefined;

  // Fetch achievements
  const { data: achievements, isLoading, error } = useUserAchievementsQuery(
    userId || DEMO_USER_ID
  );
  const stats = useAchievementStats(achievements);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !achievements) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="trophy-broken" size={32} color={colors.error} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.achievements.states.error")}
        </AppText>
      </View>
    );
  }

  // Filter achievements
  let filteredAchievements = achievements;
  if (filterCategory && filterCategory !== "all") {
    filteredAchievements = achievements.filter(a => a.category === filterCategory);
  }
  if (!showLocked) {
    filteredAchievements = filteredAchievements.filter(a => a.unlocked);
  }

  // Get next achievement to unlock (closest to completion)
  const inProgressAchievements = filteredAchievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => {
      const aPercent = a.progress / a.requirement_value;
      const bPercent = b.progress / b.requirement_value;
      return bPercent - aPercent;
    });
  const nextToUnlock = inProgressAchievements[0];

  // Empty state
  if (filteredAchievements.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="trophy-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.achievements.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          Start learning to earn badges!
        </AppText>
      </View>
    );
  }

  // Calculate overall progress
  const overallProgress = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;

  // Render achievement badge (enhanced)
  const renderBadge = (achievement: AchievementWithProgress, size: "small" | "medium" | "large" = "medium") => {
    const rarity = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
    const badgeSize = size === "small" ? 44 : size === "large" ? 64 : 52;
    const iconSize = size === "small" ? 20 : size === "large" ? 28 : 24;
    const title = getLocalizedField(achievement, "title");

    return (
      <View
        key={achievement.id}
        style={[
          styles.badgeWrapper,
          size === "large" && styles.badgeWrapperLarge,
        ]}
      >
        {/* Glow effect for unlocked */}
        {achievement.unlocked && (
          <View
            style={[
              styles.badgeGlow,
              {
                width: badgeSize + 12,
                height: badgeSize + 12,
                borderRadius: (badgeSize + 12) / 2,
                backgroundColor: rarity.glow,
              },
            ]}
          />
        )}
        
        {/* Badge circle */}
        <View
          style={[
            styles.badgeCircle,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: achievement.unlocked ? `${achievement.color}20` : colors.outline + "20",
              borderColor: achievement.unlocked ? achievement.color : colors.outline,
              borderWidth: achievement.unlocked ? 3 : 2,
            },
          ]}
        >
          <Icon
            name={achievement.unlocked ? achievement.icon : "lock-outline"}
            size={iconSize}
            color={achievement.unlocked ? achievement.color : colors.onSurfaceVariant}
          />
        </View>

        {/* Unlocked sparkle */}
        {achievement.unlocked && (
          <View style={[styles.sparkle, { backgroundColor: colors.success }]}>
            <Icon name="check-bold" size={10} color="#fff" />
          </View>
        )}

        {/* Title */}
        <AppText
          style={[
            styles.badgeTitle,
            size === "large" && styles.badgeTitleLarge,
            { color: achievement.unlocked ? colors.onSurface : colors.onSurfaceVariant },
          ]}
          numberOfLines={2}
        >
          {title}
        </AppText>

        {/* Points */}
        {showPoints && (
          <View style={styles.pointsRow}>
            <Icon name="star" size={10} color={colors.warning} />
            <AppText style={[styles.pointsValue, { color: colors.onSurfaceVariant }]}>
              {achievement.points}
            </AppText>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Progress Section */}
      {showSummary && (
        <View style={[styles.progressSection, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
          {/* Progress bar header */}
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Icon name="trophy" size={20} color={colors.warning} />
              <AppText style={[styles.progressTitle, { color: colors.onSurface }]}>
                {t("widgets.achievements.labels.progress")}
              </AppText>
            </View>
            <AppText style={[styles.progressPercent, { color: colors.primary }]}>
              {Math.round(overallProgress)}%
            </AppText>
          </View>

          {/* Main progress bar */}
          <View style={[styles.mainProgressBar, { backgroundColor: colors.outline + "30" }]}>
            <View
              style={[
                styles.mainProgressFill,
                {
                  width: `${overallProgress}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            {/* Milestone markers */}
            {[25, 50, 75].map(milestone => (
              <View
                key={milestone}
                style={[
                  styles.milestone,
                  { left: `${milestone}%`, backgroundColor: overallProgress >= milestone ? colors.primary : colors.outline },
                ]}
              />
            ))}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {stats.unlocked}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.achievements.labels.unlocked")}
              </AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {stats.total - stats.unlocked}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.achievements.labels.locked")}
              </AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
            <View style={styles.statItem}>
              <View style={styles.pointsDisplay}>
                <Icon name="star" size={14} color={colors.warning} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {stats.earnedPoints}
                </AppText>
              </View>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.achievements.labels.points")}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Next to Unlock Section */}
      {showProgress && nextToUnlock && (
        <View style={[styles.nextUnlockSection, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium, borderColor: colors.primary, borderWidth: 1 }]}>
          <View style={styles.nextUnlockHeader}>
            <Icon name="target" size={16} color={colors.primary} />
            <AppText style={[styles.nextUnlockTitle, { color: colors.primary }]}>
              Almost there!
            </AppText>
          </View>
          <View style={styles.nextUnlockContent}>
            <View style={[styles.nextBadgeCircle, { backgroundColor: `${nextToUnlock.color}20`, borderColor: nextToUnlock.color }]}>
              <Icon name={nextToUnlock.icon} size={20} color={nextToUnlock.color} />
            </View>
            <View style={styles.nextUnlockInfo}>
              <AppText style={[styles.nextUnlockName, { color: colors.onSurface }]}>
                {getLocalizedField(nextToUnlock, "title")}
              </AppText>
              <View style={styles.nextProgressContainer}>
                <View style={[styles.nextProgressBar, { backgroundColor: colors.outline + "30" }]}>
                  <View
                    style={[
                      styles.nextProgressFill,
                      {
                        width: `${(nextToUnlock.progress / nextToUnlock.requirement_value) * 100}%`,
                        backgroundColor: nextToUnlock.color,
                      },
                    ]}
                  />
                </View>
                <AppText style={[styles.nextProgressText, { color: colors.onSurfaceVariant }]}>
                  {nextToUnlock.progress}/{nextToUnlock.requirement_value}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
          🏆 Your Badges
        </AppText>
        
        {/* Cards layout - horizontal scroll */}
        {layoutStyle === "cards" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {filteredAchievements.slice(0, maxItems).map(a => renderBadge(a, "medium"))}
          </ScrollView>
        )}

        {/* Grid layout */}
        {layoutStyle === "grid" && (
          <View style={styles.gridContainer}>
            {filteredAchievements.slice(0, maxItems).map(a => renderBadge(a, "small"))}
          </View>
        )}

        {/* List layout */}
        {layoutStyle === "list" && (
          <View style={styles.listContainer}>
            {filteredAchievements.slice(0, maxItems).map(a => (
              <View
                key={a.id}
                style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
              >
                {renderBadge(a, "small")}
                <View style={styles.listItemInfo}>
                  <AppText style={[styles.listItemDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                    {getLocalizedField(a, "description")}
                  </AppText>
                  {!a.unlocked && a.progress > 0 && (
                    <View style={styles.listProgressContainer}>
                      <View style={[styles.listProgressBar, { backgroundColor: colors.outline + "30" }]}>
                        <View
                          style={[
                            styles.listProgressFill,
                            { width: `${(a.progress / a.requirement_value) * 100}%`, backgroundColor: a.color },
                          ]}
                        />
                      </View>
                      <AppText style={[styles.listProgressText, { color: colors.onSurfaceVariant }]}>
                        {a.progress}/{a.requirement_value}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* View all link */}
      {filteredAchievements.length > maxItems && (
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: colors.primaryContainer }]}
          onPress={() => onNavigate?.("achievements")}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.achievements.actions.viewAll")} ({filteredAchievements.length})
          </AppText>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
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
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
  },

  // Progress Section
  progressSection: {
    padding: 16,
    gap: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "700",
  },
  mainProgressBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  mainProgressFill: {
    height: "100%",
    borderRadius: 6,
  },
  milestone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Next to Unlock Section
  nextUnlockSection: {
    padding: 12,
    gap: 8,
  },
  nextUnlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextUnlockTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  nextUnlockContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nextBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  nextUnlockInfo: {
    flex: 1,
    gap: 6,
  },
  nextUnlockName: {
    fontSize: 13,
    fontWeight: "600",
  },
  nextProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  nextProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  nextProgressText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Badges Section
  badgesSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Badge Wrapper
  badgeWrapper: {
    alignItems: "center",
    width: 80,
    gap: 6,
  },
  badgeWrapperLarge: {
    width: 100,
  },
  badgeGlow: {
    position: "absolute",
    top: -6,
  },
  badgeCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    position: "absolute",
    top: 0,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  badgeTitleLarge: {
    fontSize: 11,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pointsValue: {
    fontSize: 10,
  },

  // Cards layout
  cardsScroll: {
    gap: 8,
    paddingVertical: 8,
    paddingRight: 8,
  },

  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },

  // List layout
  listContainer: {
    gap: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  listItemInfo: {
    flex: 1,
    gap: 6,
  },
  listItemDesc: {
    fontSize: 11,
  },
  listProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  listProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  listProgressText: {
    fontSize: 10,
  },

  // View all button
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ProfileAchievementsWidget;
