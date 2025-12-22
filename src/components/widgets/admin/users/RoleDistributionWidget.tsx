/**
 * RoleDistributionWidget - Admin Role Distribution Chart
 *
 * Displays a visual breakdown of users by role with percentages
 * and counts using a horizontal bar chart style.
 *
 * Widget ID: users.role-distribution
 * Category: chart
 * Roles: admin, super_admin
 *
 * Phases Completed:
 * - Phase 1: Database Setup (uses profiles table)
 * - Phase 2: Query Hook (useRoleDistributionQuery)
 * - Phase 3: Widget Component (this file)
 * - Phase 4: Translations (EN/HI in admin.json)
 * - Phase 5: Widget Registry (src/config/widgetRegistry.ts)
 * - Phase 6: Platform Studio (platform-studio/src/config/widgetRegistry.ts)
 * - Phase 7: Database Screen Layout (screen_layouts table)
 */

import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import type { WidgetProps } from "../../../../types/widget.types";
import {
  useRoleDistributionQuery,
  ROLE_CONFIG,
  type RoleDistributionData,
} from "../../../../hooks/queries/admin/useRoleDistributionQuery";

type RoleDistributionConfig = {
  showPercentage?: boolean;
  showCount?: boolean;
  showIcon?: boolean;
  enableTap?: boolean;
  chartStyle?: "bar" | "donut";
  showTotalSummary?: boolean;
};

export const RoleDistributionWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");

  // Fetch real data from database
  const { data, isLoading, error } = useRoleDistributionQuery();

  const widgetConfig: RoleDistributionConfig = {
    showPercentage: true,
    showCount: true,
    showIcon: true,
    enableTap: true,
    chartStyle: "bar",
    showTotalSummary: true,
    ...config,
  };

  // Get role color from config or use theme fallback
  const getRoleColor = (role: string): string => {
    return ROLE_CONFIG[role]?.color || colors.primary;
  };

  // Get role icon from config
  const getRoleIcon = (role: string): string => {
    return ROLE_CONFIG[role]?.icon || "account";
  };

  // Calculate max count for bar width scaling
  const maxCount = useMemo(() => {
    if (!data?.distribution) return 1;
    return Math.max(...data.distribution.map((item) => item.count), 1);
  }, [data?.distribution]);

  const handleRolePress = (role: string) => {
    if (!widgetConfig.enableTap) return;
    onNavigate?.("users-management", { filter: role });
  };

  const handleViewAll = () => {
    onNavigate?.("users-management", { view: "analytics" });
  };

  // Loading state
  if (isLoading) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.roleDistribution.title", { defaultValue: "Users by Role" })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.roleDistribution.states.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.roleDistribution.title", { defaultValue: "Users by Role" })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("widgets.roleDistribution.states.error", { defaultValue: "Failed to load data" })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Empty state
  if (!data?.distribution || data.distribution.length === 0) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.roleDistribution.title", { defaultValue: "Users by Role" })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="account-group-outline" size={48} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.roleDistribution.states.empty", { defaultValue: "No user data available" })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  const renderBarItem = (item: RoleDistributionData) => {
    const barWidth = (item.count / maxCount) * 100;
    const roleColor = getRoleColor(item.role);
    const roleIcon = getRoleIcon(item.role);

    return (
      <TouchableOpacity
        key={item.role}
        style={styles.barItem}
        onPress={() => handleRolePress(item.role)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
        accessibilityLabel={t("widgets.roleDistribution.roleHint", {
          role: item.role,
          count: item.count,
          percentage: item.percentage,
          defaultValue: `${item.role}: ${item.count} users (${item.percentage}%)`,
        })}
        accessibilityRole="button"
      >
        <View style={styles.barHeader}>
          <View style={styles.barLabelContainer}>
            {widgetConfig.showIcon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: roleColor + "20" },
                ]}
              >
                <Icon name={roleIcon} size={16} color={roleColor} />
              </View>
            )}
            <AppText style={[styles.barLabel, { color: colors.onSurface }]}>
              {t(`widgets.roleDistribution.roles.${item.role}`, {
                defaultValue: item.role.charAt(0).toUpperCase() + item.role.slice(1),
              })}
            </AppText>
          </View>
          <View style={styles.barStats}>
            {widgetConfig.showCount && (
              <AppText style={[styles.countText, { color: colors.onSurface }]}>
                {item.count.toLocaleString()}
              </AppText>
            )}
            {widgetConfig.showPercentage && (
              <AppText style={[styles.percentText, { color: colors.onSurfaceVariant }]}>
                ({item.percentage}%)
              </AppText>
            )}
          </View>
        </View>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.xs },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${barWidth}%`,
                backgroundColor: roleColor,
                borderRadius: borderRadius.xs,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDonutChart = () => {
    // Simple donut representation using legend only (full donut requires SVG)
    return (
      <View style={styles.donutContainer}>
        <View style={[styles.donutPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
          <AppText style={[styles.donutTotal, { color: colors.onSurface }]}>
            {data.totalUsers.toLocaleString()}
          </AppText>
          <AppText style={[styles.donutLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.roleDistribution.totalUsers", { defaultValue: "Total" })}
          </AppText>
        </View>
        <View style={styles.donutLegend}>
          {data.distribution.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={styles.legendItem}
              onPress={() => handleRolePress(item.role)}
              disabled={!widgetConfig.enableTap}
              activeOpacity={0.7}
            >
              <View style={[styles.legendDot, { backgroundColor: getRoleColor(item.role) }]} />
              <AppText style={[styles.legendText, { color: colors.onSurface }]}>
                {t(`widgets.roleDistribution.roles.${item.role}`, {
                  defaultValue: item.role.charAt(0).toUpperCase() + item.role.slice(1),
                })}
              </AppText>
              <AppText style={[styles.legendCount, { color: colors.onSurfaceVariant }]}>
                {item.count}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t("widgets.roleDistribution.title", { defaultValue: "Users by Role" })}
        </AppText>
        <TouchableOpacity
          onPress={handleViewAll}
          accessibilityLabel={t("widgets.roleDistribution.viewAllHint", {
            defaultValue: "View all analytics",
          })}
          accessibilityRole="button"
        >
          <Icon name="chart-pie" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Total Summary */}
      {widgetConfig.showTotalSummary && (
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
          ]}
        >
          <Icon name="account-group" size={24} color={colors.primary} />
          <View style={styles.summaryText}>
            <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
              {data.totalUsers.toLocaleString()}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.roleDistribution.totalUsers", { defaultValue: "Total Users" })}
            </AppText>
          </View>
        </View>
      )}

      {/* Chart */}
      {widgetConfig.chartStyle === "donut" ? (
        renderDonutChart()
      ) : (
        <View style={styles.barsContainer}>
          {data.distribution.map(renderBarItem)}
        </View>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  // Loading state
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  // Error state
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  // Summary
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
  },
  // Bar chart
  barsContainer: {
    gap: 16,
  },
  barItem: {
    gap: 8,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  barStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
  },
  percentText: {
    fontSize: 12,
  },
  barTrack: {
    height: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
  // Donut chart
  donutContainer: {
    alignItems: "center",
    gap: 16,
  },
  donutPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  donutTotal: {
    fontSize: 18,
    fontWeight: "700",
  },
  donutLabel: {
    fontSize: 10,
  },
  donutLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  legendCount: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default RoleDistributionWidget;
