import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useAtRiskStudentsQuery,
  type AtRiskStudent,
} from "../../../hooks/queries/teacher/useAtRiskStudentsQuery";

const RISK_ICONS: Record<string, string> = {
  critical: "alert-circle",
  high: "alert",
  medium: "alert-outline",
  low: "information-outline",
};

const TREND_ICONS: Record<string, string> = {
  improving: "trending-up",
  stable: "trending-neutral",
  declining: "trending-down",
};

export const AtRiskStudentsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // Config with defaults
  const maxItems = (config?.maxItems as number) || 5;
  const showMetrics = config?.showMetrics !== false;
  const showTrend = config?.showTrend !== false;
  const filterRiskLevel = config?.filterRiskLevel as string | undefined;

  // Data
  const { data, isLoading, error, refetch } = useAtRiskStudentsQuery({
    limit: maxItems,
    riskLevel: filterRiskLevel as
      | "low"
      | "medium"
      | "high"
      | "critical"
      | undefined,
    status: "active",
  });

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return colors.error;
      case "high":
        return colors.warning;
      case "medium":
        return "#F59E0B"; // Amber
      case "low":
        return colors.success;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Trend colors
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return colors.success;
      case "declining":
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Format percentage
  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return "--";
    return `${Math.round(value)}%`;
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.errorContainer },
        ]}
      >
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.atRiskStudents.states.error", {
            defaultValue: "Failed to load",
          })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data?.length) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <Icon name="emoticon-happy-outline" size={32} color={colors.success} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.atRiskStudents.states.empty", {
            defaultValue: "No at-risk students",
          })}
        </AppText>
      </View>
    );
  }

  // Get total count for View All button
  const totalCount = data?.length || 0;
  const showViewAll = config?.showViewAll !== false && totalCount > 0;

  // Success state
  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((student: AtRiskStudent) => {
        const riskColor = getRiskColor(student.risk_level);
        const trendColor = getTrendColor(student.recent_trend);

        return (
          <TouchableOpacity
            key={student.id}
            onPress={() =>
              onNavigate?.("StudentDetail", { studentId: student.student_id })
            }
            style={[
              styles.studentCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                borderLeftColor: riskColor,
              },
            ]}
          >
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.studentInfo}>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: `${riskColor}20` },
                  ]}
                >
                  <Icon
                    name={RISK_ICONS[student.risk_level] || "alert"}
                    size={14}
                    color={riskColor}
                  />
                  <AppText style={[styles.riskText, { color: riskColor }]}>
                    {student.risk_level.toUpperCase()}
                  </AppText>
                </View>
                <AppText
                  style={[styles.studentName, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {getLocalizedField(student, "student_name")}
                </AppText>
              </View>
              {showTrend && (
                <View style={styles.trendContainer}>
                  <Icon
                    name={TREND_ICONS[student.recent_trend] || "trending-neutral"}
                    size={16}
                    color={trendColor}
                  />
                </View>
              )}
            </View>

            {/* Class Info */}
            <View style={styles.classRow}>
              <Icon
                name="school-outline"
                size={14}
                color={colors.onSurfaceVariant}
              />
              <AppText
                style={[styles.classText, { color: colors.onSurfaceVariant }]}
              >
                {student.class_name}
                {student.section ? ` - ${student.section}` : ""}
                {student.roll_number ? ` (Roll: ${student.roll_number})` : ""}
              </AppText>
            </View>

            {/* Primary Concern */}
            <AppText
              style={[styles.concernText, { color: colors.onSurface }]}
              numberOfLines={2}
            >
              {getLocalizedField(student, "primary_concern")}
            </AppText>

            {/* Metrics Row */}
            {showMetrics && (
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Icon
                    name="calendar-check"
                    size={12}
                    color={colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.metricValue,
                      {
                        color:
                          (student.attendance_rate || 0) < 75
                            ? colors.error
                            : colors.onSurface,
                      },
                    ]}
                  >
                    {formatPercent(student.attendance_rate)}
                  </AppText>
                  <AppText
                    style={[
                      styles.metricLabel,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {t("widgets.atRiskStudents.metrics.attendance", {
                      defaultValue: "Attend",
                    })}
                  </AppText>
                </View>
                <View style={styles.metric}>
                  <Icon
                    name="clipboard-check-outline"
                    size={12}
                    color={colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.metricValue,
                      {
                        color:
                          (student.assignment_completion_rate || 0) < 70
                            ? colors.warning
                            : colors.onSurface,
                      },
                    ]}
                  >
                    {formatPercent(student.assignment_completion_rate)}
                  </AppText>
                  <AppText
                    style={[
                      styles.metricLabel,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {t("widgets.atRiskStudents.metrics.assignments", {
                      defaultValue: "Tasks",
                    })}
                  </AppText>
                </View>
                <View style={styles.metric}>
                  <Icon
                    name="chart-line"
                    size={12}
                    color={colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.metricValue,
                      {
                        color:
                          (student.average_score || 0) < 50
                            ? colors.error
                            : colors.onSurface,
                      },
                    ]}
                  >
                    {formatPercent(student.average_score)}
                  </AppText>
                  <AppText
                    style={[
                      styles.metricLabel,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {t("widgets.atRiskStudents.metrics.score", {
                      defaultValue: "Score",
                    })}
                  </AppText>
                </View>
              </View>
            )}

            {/* Follow-up indicator */}
            {student.follow_up_date && (
              <View
                style={[
                  styles.followUpRow,
                  { backgroundColor: `${colors.primary}10` },
                ]}
              >
                <Icon name="clock-outline" size={12} color={colors.primary} />
                <AppText
                  style={[styles.followUpText, { color: colors.primary }]}
                >
                  {t("widgets.atRiskStudents.followUp", {
                    defaultValue: "Follow-up:",
                  })}{" "}
                  {new Date(student.follow_up_date).toLocaleDateString()}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* View All Button */}
      {showViewAll && (
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("AtRiskStudents")}
          style={[
            styles.viewAllButton,
            { backgroundColor: `${colors.primary}10` },
          ]}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.atRiskStudents.actions.viewAll", {
              defaultValue: "View All Students",
            })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
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
  studentCard: {
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  trendContainer: {
    padding: 4,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classText: {
    fontSize: 12,
  },
  concernText: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  metric: {
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  metricLabel: {
    fontSize: 10,
  },
  followUpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  followUpText: {
    fontSize: 11,
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
