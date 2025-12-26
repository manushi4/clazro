import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useClassStatsQuery } from "../../../hooks/queries/teacher/useClassStatsQuery";

type StatItem = {
  key: string;
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
};

export const ClassStatsWidget: React.FC<WidgetProps> = ({ config }) => {
  const route = useRoute();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Get classId from route params or config
  const classId = (route.params as any)?.classId || (config?.classId as string) || "demo-1";

  // Config with defaults
  const layoutStyle = (config?.layoutStyle as "grid" | "list") || "grid";
  const showTrends = config?.showTrends !== false;
  const columns = (config?.columns as number) || 2;

  // Data
  const { data, isLoading, error, refetch } = useClassStatsQuery(classId);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classStats.states.loading", { defaultValue: "Loading stats..." })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.classStats.states.error", { defaultValue: "Failed to load stats" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Build stats array
  const stats: StatItem[] = [
    {
      key: "students",
      label: t("widgets.classStats.totalStudents", { defaultValue: "Total Students" }),
      value: data.totalStudents,
      icon: "account-group",
      color: colors.primary,
    },
    {
      key: "attendance",
      label: t("widgets.classStats.attendanceRate", { defaultValue: "Attendance" }),
      value: `${data.attendanceRate}%`,
      icon: "calendar-check",
      color: data.attendanceRate >= 85 ? "#4CAF50" : data.attendanceRate >= 70 ? "#FF9800" : "#F44336",
      trend: data.attendanceRate >= 90 ? "up" : data.attendanceRate >= 80 ? "stable" : "down",
    },
    {
      key: "avgScore",
      label: t("widgets.classStats.averageScore", { defaultValue: "Average Score" }),
      value: data.averageScore.toFixed(1),
      icon: "chart-line",
      color: data.averageScore >= 75 ? "#4CAF50" : data.averageScore >= 60 ? "#FF9800" : "#F44336",
      trend: data.improvementRate > 0 ? "up" : data.improvementRate < 0 ? "down" : "stable",
      trendValue: `${data.improvementRate > 0 ? "+" : ""}${data.improvementRate}%`,
    },
    {
      key: "pending",
      label: t("widgets.classStats.pendingAssignments", { defaultValue: "Pending Work" }),
      value: data.assignmentsPending,
      icon: "clipboard-clock",
      color: data.assignmentsPending > 10 ? "#F44336" : data.assignmentsPending > 5 ? "#FF9800" : "#4CAF50",
    },
    {
      key: "topPerformers",
      label: t("widgets.classStats.topPerformers", { defaultValue: "Top Performers" }),
      value: data.topPerformers,
      icon: "star",
      color: "#FFD700",
    },
    {
      key: "atRisk",
      label: t("widgets.classStats.atRisk", { defaultValue: "At Risk" }),
      value: data.atRiskStudents,
      icon: "alert",
      color: data.atRiskStudents > 3 ? "#F44336" : data.atRiskStudents > 0 ? "#FF9800" : "#4CAF50",
    },
  ];

  // Grid layout
  if (layoutStyle === "grid") {
    return (
      <View style={[styles.gridContainer, { gap: 10 }]}>
        {stats.map((stat) => (
          <View
            key={stat.key}
            style={[
              styles.gridItem,
              {
                width: `${100 / columns - 2}%`,
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
          >
            <View style={styles.gridHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${stat.color}15` }]}>
                <Icon name={stat.icon} size={18} color={stat.color} />
              </View>
              {showTrends && stat.trend && (
                <View style={styles.trendContainer}>
                  <Icon
                    name={stat.trend === "up" ? "trending-up" : stat.trend === "down" ? "trending-down" : "minus"}
                    size={14}
                    color={stat.trend === "up" ? "#4CAF50" : stat.trend === "down" ? "#F44336" : colors.onSurfaceVariant}
                  />
                  {stat.trendValue && (
                    <AppText
                      style={[
                        styles.trendText,
                        {
                          color: stat.trend === "up" ? "#4CAF50" : stat.trend === "down" ? "#F44336" : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {stat.trendValue}
                    </AppText>
                  )}
                </View>
              )}
            </View>
            <AppText style={[styles.gridValue, { color: colors.onSurface }]}>
              {stat.value}
            </AppText>
            <AppText style={[styles.gridLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {stat.label}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  // List layout
  return (
    <View style={styles.listContainer}>
      {stats.map((stat) => (
        <View
          key={stat.key}
          style={[
            styles.listItem,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${stat.color}15` }]}>
            <Icon name={stat.icon} size={20} color={stat.color} />
          </View>
          <View style={styles.listContent}>
            <AppText style={[styles.listLabel, { color: colors.onSurfaceVariant }]}>
              {stat.label}
            </AppText>
            <AppText style={[styles.listValue, { color: colors.onSurface }]}>
              {stat.value}
            </AppText>
          </View>
          {showTrends && stat.trend && (
            <View style={styles.trendContainer}>
              <Icon
                name={stat.trend === "up" ? "trending-up" : stat.trend === "down" ? "trending-down" : "minus"}
                size={16}
                color={stat.trend === "up" ? "#4CAF50" : stat.trend === "down" ? "#F44336" : colors.onSurfaceVariant}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stateContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  gridItem: {
    padding: 12,
    marginBottom: 4,
  },
  gridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "500",
  },
  gridValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 11,
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
  listContent: {
    flex: 1,
  },
  listLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  listValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});
