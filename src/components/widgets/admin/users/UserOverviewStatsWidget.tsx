/**
 * UserOverviewStatsWidget - Admin User Statistics
 *
 * Displays user statistics including total users, active users,
 * pending approvals, and users by role with trend indicators.
 *
 * Widget ID: users.overview-stats
 * Category: stats
 * Roles: admin, super_admin
 *
 * Phase 1: Database Setup - Uses profiles table (no dedicated table needed)
 * Phase 2: Query Hook - useUserStatsQuery
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - admin.json (EN/HI)
 * Phase 5: Widget Registry - src/config/widgetRegistry.ts
 * Phase 6: Platform Studio - platform-studio/src/config/widgetRegistry.ts
 * Phase 7: Database Screen Layout - screen_layouts table
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import { useUserStatsQuery } from "../../../../hooks/queries/admin/useUserStatsQuery";
import type { WidgetProps } from "../../../../types/widget.types";
import type { UserStatItem } from "../../../../hooks/queries/admin/useUserStatsQuery";

type UserOverviewStatsConfig = {
  showTrends?: boolean;
  columns?: number;
  enableTap?: boolean;
};

export const UserOverviewStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");

  // Fetch real data from database
  const { data, isLoading, error } = useUserStatsQuery();

  const widgetConfig: UserOverviewStatsConfig = {
    showTrends: true,
    columns: 2,
    enableTap: true,
    ...config,
  };

  // Color mapping using theme colors
  const getStatColor = (colorKey: string): string => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      success: colors.success || "#4CAF50",
      warning: colors.warning || "#FF9800",
      error: colors.error,
    };
    return colorMap[colorKey] || colors.primary;
  };

  const handleStatPress = (statId: string) => {
    if (!widgetConfig.enableTap) return;
    onNavigate?.("users-management", { filter: statId });
  };

  const renderTrend = (stat: UserStatItem) => {
    if (!widgetConfig.showTrends || stat.trend === undefined) return null;

    const isPositive = stat.trendDirection === "up";
    // For negative metrics (suspended, pending), up is bad, down is good
    const isNegativeMetric = stat.id === "suspended" || stat.id === "pending";
    const trendColor = isNegativeMetric
      ? isPositive
        ? colors.error
        : colors.success || "#4CAF50"
      : isPositive
        ? colors.success || "#4CAF50"
        : colors.error;

    return (
      <View style={styles.trendContainer}>
        <Icon
          name={isPositive ? "trending-up" : "trending-down"}
          size={12}
          color={trendColor}
        />
        <AppText style={[styles.trendText, { color: trendColor }]}>
          {Math.abs(stat.trend)}%
        </AppText>
      </View>
    );
  };

  const renderStatCard = (stat: UserStatItem) => {
    const statColor = getStatColor(stat.colorKey);
    
    return (
      <TouchableOpacity
        key={stat.id}
        style={[
          styles.statCard,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.md,
          },
        ]}
        onPress={() => handleStatPress(stat.id)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${statColor}20` }]}>
          <Icon name={stat.icon} size={24} color={statColor} />
        </View>
        <AppText style={[styles.statValue, { color: colors.onSurface }]}>
          {stat.value.toLocaleString()}
        </AppText>
        <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
          {t(`widgets.userStats.${stat.id}`, { defaultValue: stat.label })}
        </AppText>
        {renderTrend(stat)}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.userStats.states.loading", { defaultValue: "Loading statistics..." })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("widgets.userStats.states.error", { defaultValue: "Failed to load statistics" })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Empty state
  if (!data?.stats?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="account-group-outline" size={32} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.userStats.states.empty", { defaultValue: "No user data available" })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.container}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t("widgets.userStats.title", { defaultValue: "User Statistics" })}
        </AppText>
      </View>
      <View style={styles.statsGrid}>
        {data.stats.map(renderStatCard)}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default UserOverviewStatsWidget;
