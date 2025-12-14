import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildStatsQuery } from "../../../hooks/queries/parent/useChildStatsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.child-stats";

type StatItem = {
  key: string;
  icon: string;
  value: string | number;
  label: string;
  color: string;
  trend?: "up" | "down" | "neutral";
};

export const ChildStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: childrenStats, isLoading, error } = useChildStatsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const columns = parseInt(config?.columns as string) || 2;
  const showXP = config?.showXP !== false;
  const showStreak = config?.showStreak !== false;
  const showBadges = config?.showBadges !== false;
  const showStudyTime = config?.showStudyTime !== false;
  const showTests = config?.showTests !== false;
  const showAssignments = config?.showAssignments !== false;
  const showTrends = config?.showTrends !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "grid" | "list" | "cards") || "grid";

  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStatPress = (statKey: string) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "stat_tap", statKey });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_stat_tap`, level: "info", data: { statKey } });
    onNavigate?.(`child-stats/${statKey}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-stats-detail");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childStats.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.childStats.states.error")}
        </AppText>
      </View>
    );
  }

  if (!childrenStats || childrenStats.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chart-box-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childStats.states.empty")}
        </AppText>
      </View>
    );
  }

  // For now, show first child's stats
  const stats = childrenStats[0];
  const isCompact = size === "compact" || compactMode;

  // Build stats array based on config
  const statItems: StatItem[] = [];

  if (showXP) {
    statItems.push({
      key: "xp",
      icon: "star-circle",
      value: stats.total_xp.toLocaleString(),
      label: t("widgets.childStats.stats.xp"),
      color: colors.warning,
      trend: stats.weekly_xp > 0 ? "up" : "neutral",
    });
  }

  if (showStreak) {
    statItems.push({
      key: "streak",
      icon: "fire",
      value: stats.current_streak,
      label: t("widgets.childStats.stats.streak"),
      color: colors.error,
      trend: stats.current_streak >= stats.longest_streak ? "up" : "neutral",
    });
  }

  if (showBadges) {
    statItems.push({
      key: "badges",
      icon: "medal",
      value: stats.badges_count,
      label: t("widgets.childStats.stats.badges"),
      color: colors.info,
    });
  }

  if (showStudyTime) {
    statItems.push({
      key: "studyTime",
      icon: "clock-outline",
      value: formatStudyTime(stats.total_study_time_minutes),
      label: t("widgets.childStats.stats.studyTime"),
      color: colors.success,
      trend: stats.weekly_study_time_minutes > 0 ? "up" : "neutral",
    });
  }

  if (showTests) {
    statItems.push({
      key: "tests",
      icon: "file-document-check",
      value: `${stats.tests_passed}/${stats.tests_taken}`,
      label: t("widgets.childStats.stats.tests"),
      color: colors.primary,
    });
  }

  if (showAssignments) {
    statItems.push({
      key: "assignments",
      icon: "clipboard-check",
      value: stats.assignments_completed,
      label: t("widgets.childStats.stats.assignments"),
      color: colors.tertiary || colors.info,
      trend: stats.assignments_pending > 0 ? "down" : "up",
    });
  }

  const renderTrendIcon = (trend?: "up" | "down" | "neutral") => {
    if (!showTrends || !trend || trend === "neutral") return null;
    return (
      <Icon
        name={trend === "up" ? "trending-up" : "trending-down"}
        size={12}
        color={trend === "up" ? colors.success : colors.error}
        style={styles.trendIcon}
      />
    );
  };

  const renderGridItem = (item: StatItem) => (
    <TouchableOpacity
      key={item.key}
      style={[
        styles.gridItem,
        { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        isCompact && styles.gridItemCompact,
      ]}
      onPress={() => handleStatPress(item.key)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${item.color}15` }]}>
        <Icon name={item.icon} size={isCompact ? 18 : 22} color={item.color} />
      </View>
      <View style={styles.statContent}>
        <View style={styles.valueRow}>
          <AppText style={[styles.statValue, { color: colors.onSurface }, isCompact && styles.statValueCompact]}>
            {item.value}
          </AppText>
          {renderTrendIcon(item.trend)}
        </View>
        <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {item.label}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = (item: StatItem) => (
    <TouchableOpacity
      key={item.key}
      style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleStatPress(item.key)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.listIconWrapper, { backgroundColor: `${item.color}15` }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      <AppText style={[styles.listLabel, { color: colors.onSurface }]}>{item.label}</AppText>
      <View style={styles.listValueRow}>
        <AppText style={[styles.listValue, { color: item.color }]}>{item.value}</AppText>
        {renderTrendIcon(item.trend)}
      </View>
    </TouchableOpacity>
  );

  const renderCardItem = (item: StatItem) => (
    <TouchableOpacity
      key={item.key}
      style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleStatPress(item.key)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrapper, { backgroundColor: `${item.color}15` }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <AppText style={[styles.cardValue, { color: item.color }]}>{item.value}</AppText>
      <AppText style={[styles.cardLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {item.label}
      </AppText>
      {showTrends && item.trend && item.trend !== "neutral" && (
        <View style={[styles.cardTrend, { backgroundColor: item.trend === "up" ? `${colors.success}15` : `${colors.error}15` }]}>
          <Icon
            name={item.trend === "up" ? "arrow-up" : "arrow-down"}
            size={10}
            color={item.trend === "up" ? colors.success : colors.error}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {layoutStyle === "list" ? (
        <View style={styles.listContainer}>
          {statItems.map(renderListItem)}
        </View>
      ) : layoutStyle === "cards" ? (
        <View style={[styles.cardsContainer, { gap: 10 }]}>
          {statItems.map(renderCardItem)}
        </View>
      ) : (
        <View style={[styles.gridContainer, { gap: 10 }]}>
          {statItems.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.gridCell,
                { width: `${100 / columns - 2}%` },
              ]}
            >
              {renderGridItem(item)}
            </View>
          ))}
        </View>
      )}

      {/* View All Button */}
      {enableTap && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.childStats.actions.viewAll")}
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
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  // Grid layout
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridCell: { marginBottom: 10 },
  gridItem: { padding: 14, alignItems: "center", gap: 8, flex: 1 },
  gridItemCompact: { padding: 10, gap: 6 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statContent: { alignItems: "center", gap: 2 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statValueCompact: { fontSize: 15 },
  statLabel: { fontSize: 11, textAlign: "center" },
  trendIcon: { marginLeft: 2 },
  // List layout
  listContainer: { gap: 8 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  listIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  listLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  listValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  listValue: { fontSize: 16, fontWeight: "700" },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardItem: { width: "48%", padding: 14, alignItems: "center", gap: 6, marginBottom: 10, position: "relative" },
  cardIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardValue: { fontSize: 20, fontWeight: "700" },
  cardLabel: { fontSize: 11, textAlign: "center" },
  cardTrend: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
