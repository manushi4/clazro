/**
 * Stats Grid Widget (stats.grid)
 * Displays user statistics in a configurable grid layout
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
import { useStatsGridQuery } from "../../../hooks/queries/useStatsGridQuery";

const WIDGET_ID = "stats.grid";

type StatItem = { key: string; icon: string; value: string | number; label: string; color: string; trend?: number };

export const StatsGridWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useStatsGridQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const columns = (config?.columns as number) || 2;
  const showXP = config?.showXP !== false;
  const showStreak = config?.showStreak !== false;
  const showBadges = config?.showBadges !== false;
  const showStudyTime = config?.showStudyTime !== false;
  const showTests = config?.showTests !== false;
  const showAssignments = config?.showAssignments !== false;
  const showTrends = config?.showTrends !== false;
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;

  const handleStatPress = (statKey: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "stat_tap", stat: statKey });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_stat_tap`, level: "info", data: { stat: statKey } });
    onNavigate?.(`stats/${statKey}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("stats");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.statsGrid.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.statsGrid.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.statsGrid.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="chart-box-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.statsGrid.states.empty")}</AppText>
      </View>
    );
  }

  // Format helpers
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
  };
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  // Build stats array based on config
  const stats: StatItem[] = [];
  if (showXP) stats.push({ key: "xp", icon: "star", value: formatNumber(data.total_xp), label: t("widgets.statsGrid.labels.totalXP"), color: colors.warning, trend: showTrends ? 12 : undefined });
  if (showStreak) stats.push({ key: "streak", icon: "fire", value: data.current_streak, label: t("widgets.statsGrid.labels.streak"), color: colors.error, trend: showTrends && data.current_streak > 0 ? 5 : undefined });
  if (showBadges) stats.push({ key: "badges", icon: "medal", value: data.badges_count, label: t("widgets.statsGrid.labels.badges"), color: colors.tertiary });
  if (showStudyTime) stats.push({ key: "studyTime", icon: "clock-outline", value: formatTime(data.weekly_study_time_minutes), label: t("widgets.statsGrid.labels.studyTime"), color: colors.info, trend: showTrends ? 8 : undefined });
  if (showTests) stats.push({ key: "tests", icon: "clipboard-check", value: `${data.tests_passed}/${data.tests_taken}`, label: t("widgets.statsGrid.labels.testsPassed"), color: colors.success });
  if (showAssignments) stats.push({ key: "assignments", icon: "file-document-outline", value: data.assignments_completed, label: t("widgets.statsGrid.labels.assignments"), color: colors.primary });

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}

      <View style={[styles.grid, { gap: compactMode ? 8 : 12 }]}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.key}
            style={[styles.statCard, { backgroundColor: colors.surfaceVariant, width: `${100 / columns - 2}%` }, compactMode && styles.statCardCompact]}
            onPress={enableTap ? () => handleStatPress(stat.key) : undefined}
            disabled={!enableTap}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
              <Icon name={stat.icon} size={compactMode ? 16 : 20} color={stat.color} />
            </View>
            <AppText style={[styles.statValue, { color: colors.onSurface }, compactMode && styles.statValueCompact]}>{stat.value}</AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }, compactMode && styles.statLabelCompact]} numberOfLines={1}>{stat.label}</AppText>
            {stat.trend !== undefined && !compactMode && (
              <View style={styles.trendContainer}>
                <Icon name={stat.trend >= 0 ? "trending-up" : "trending-down"} size={12} color={stat.trend >= 0 ? colors.success : colors.error} />
                <AppText style={[styles.trendText, { color: stat.trend >= 0 ? colors.success : colors.error }]}>{Math.abs(stat.trend)}%</AppText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {enableTap && !compactMode && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>{t("widgets.statsGrid.actions.viewAll")}</AppText>
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
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  statCardCompact: { padding: 10, borderRadius: 10 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statValueCompact: { fontSize: 16 },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: "center" },
  statLabelCompact: { fontSize: 10 },
  trendContainer: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  trendText: { fontSize: 10, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
