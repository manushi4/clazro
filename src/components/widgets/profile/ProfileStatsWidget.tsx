import React from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUserStatsQuery, DEMO_USER_ID } from "../../../hooks/queries/useUserStatsQuery";

type StatItem = {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
};

export const ProfileStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("profile");

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as "grid" | "list" | "cards") || "grid";
  const showXP = config?.showXP !== false;
  const showStreak = config?.showStreak !== false;
  const showBadges = config?.showBadges !== false;
  const showStudyTime = config?.showStudyTime !== false;
  const showAssessments = config?.showAssessments !== false;
  const showProgress = config?.showProgress !== false;
  const showTrends = config?.showTrends !== false;
  const compactMode = config?.compactMode === true;

  // Fetch user stats
  const { data: stats, isLoading, error } = useUserStatsQuery(userId || DEMO_USER_ID);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chart-box-outline" size={32} color={colors.error} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.profileStats.states.error")}
        </AppText>
      </View>
    );
  }

  // Format study time
  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Build stats array based on config
  const statItems: StatItem[] = [];

  if (showXP) {
    statItems.push({
      icon: "lightning-bolt",
      value: stats.total_xp.toLocaleString(),
      label: t("widgets.profileStats.labels.totalXP"),
      color: colors.warning,
      trend: "up",
      trendValue: `+${stats.weekly_xp}`,
    });
  }

  if (showStreak) {
    statItems.push({
      icon: "fire",
      value: stats.current_streak,
      label: t("widgets.profileStats.labels.streak"),
      color: colors.error,
      trend: stats.current_streak > 0 ? "up" : "neutral",
      trendValue: t("widgets.profileStats.labels.days"),
    });
  }

  if (showBadges) {
    statItems.push({
      icon: "medal",
      value: stats.badges_count,
      label: t("widgets.profileStats.labels.badges"),
      color: colors.tertiary,
    });
  }

  if (showStudyTime) {
    statItems.push({
      icon: "clock-outline",
      value: formatStudyTime(stats.total_study_time_minutes),
      label: t("widgets.profileStats.labels.studyTime"),
      color: colors.primary,
      trend: "up",
      trendValue: `+${formatStudyTime(stats.weekly_study_time_minutes)}`,
    });
  }

  if (showAssessments) {
    const passRate = stats.tests_taken > 0 
      ? Math.round((stats.tests_passed / stats.tests_taken) * 100) 
      : 0;
    statItems.push({
      icon: "clipboard-check-outline",
      value: `${passRate}%`,
      label: t("widgets.profileStats.labels.passRate"),
      color: colors.success,
    });
  }

  if (showProgress) {
    statItems.push({
      icon: "book-open-variant",
      value: stats.lessons_completed,
      label: t("widgets.profileStats.labels.lessons"),
      color: colors.info,
    });
  }

  // Render stat card
  const renderStatCard = (stat: StatItem, index: number) => {
    const isGrid = layoutStyle === "grid";
    const isCards = layoutStyle === "cards";

    return (
      <View
        key={index}
        style={[
          isGrid ? styles.gridItem : isCards ? styles.cardItem : styles.listItem,
          { 
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.medium,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
          <Icon name={stat.icon} size={compactMode ? 18 : 22} color={stat.color} />
        </View>
        <View style={isCards ? styles.cardContent : styles.statContent}>
          <AppText style={[
            compactMode ? styles.valueCompact : styles.value, 
            { color: colors.onSurface }
          ]}>
            {stat.value}
          </AppText>
          <AppText style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {stat.label}
          </AppText>
          {showTrends && stat.trend && stat.trendValue && (
            <View style={styles.trendContainer}>
              <Icon 
                name={stat.trend === "up" ? "trending-up" : stat.trend === "down" ? "trending-down" : "minus"} 
                size={12} 
                color={stat.trend === "up" ? colors.success : stat.trend === "down" ? colors.error : colors.onSurfaceVariant} 
              />
              <AppText style={[
                styles.trendText, 
                { color: stat.trend === "up" ? colors.success : stat.trend === "down" ? colors.error : colors.onSurfaceVariant }
              ]}>
                {stat.trendValue}
              </AppText>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Cards layout - horizontal scroll
  if (layoutStyle === "cards") {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {statItems.map((stat, index) => renderStatCard(stat, index))}
      </ScrollView>
    );
  }

  // Grid layout (default)
  if (layoutStyle === "grid") {
    return (
      <View style={styles.gridContainer}>
        {statItems.map((stat, index) => renderStatCard(stat, index))}
      </View>
    );
  }

  // List layout
  return (
    <View style={styles.listContainer}>
      {statItems.map((stat, index) => renderStatCard(stat, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48%",
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  // Cards layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 120,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  cardContent: {
    alignItems: "center",
    gap: 2,
  },
  // List layout
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  // Common
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  valueCompact: {
    fontSize: 16,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "500",
  },
});

export default ProfileStatsWidget;
