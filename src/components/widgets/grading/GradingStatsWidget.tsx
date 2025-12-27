import React from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useGradingStatsQuery } from "../../../hooks/queries/teacher/useGradingStatsQuery";

const GRADE_COLORS = {
  A: "#22c55e", // green
  B: "#3b82f6", // blue
  C: "#f59e0b", // amber
  D: "#f97316", // orange
  F: "#ef4444", // red
};

export const GradingStatsWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const showDistribution = config?.showDistribution !== false;
  const showAvgScore = config?.showAvgScore !== false;

  const { data, isLoading, error, refetch } = useGradingStatsQuery();

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.gradingStats.states.loading", { defaultValue: "Loading stats..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={32} color={colors.error} />
        <AppText style={{ color: colors.error, marginTop: 8 }}>
          {t("widgets.gradingStats.states.error", { defaultValue: "Failed to load stats" })}
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

  // === EMPTY STATE ===
  if (!data || data.totalAssignments === 0) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="clipboard-check-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.gradingStats.states.empty", { defaultValue: "No grading data" })}
        </AppText>
      </View>
    );
  }

  // Calculate max for distribution bar chart
  const maxDistribution = Math.max(
    data.gradeDistribution.A,
    data.gradeDistribution.B,
    data.gradeDistribution.C,
    data.gradeDistribution.D,
    data.gradeDistribution.F,
    1
  );

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Assignments */}
        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Icon name="clipboard-text-outline" size={18} color={colors.primary} />
          </View>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {data.publishedAssignments}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.gradingStats.assignments", { defaultValue: "Assignments" })}
          </AppText>
        </View>

        {/* Pending */}
        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
            <Icon name="clock-outline" size={18} color={colors.warning} />
          </View>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {data.pendingGrading}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.gradingStats.pending", { defaultValue: "Pending" })}
          </AppText>
        </View>

        {/* Graded */}
        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
            <Icon name="check-circle-outline" size={18} color={colors.success} />
          </View>
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {data.gradedCount}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.gradingStats.graded", { defaultValue: "Graded" })}
          </AppText>
        </View>

        {/* Average Score */}
        {showAvgScore && (
          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.secondary}15` }]}>
              <Icon name="chart-line" size={18} color={colors.secondary} />
            </View>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.avgScore}%
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.gradingStats.avgScore", { defaultValue: "Avg Score" })}
            </AppText>
          </View>
        )}
      </View>

      {/* Grade Distribution */}
      {showDistribution && data.gradedCount > 0 && (
        <View style={[styles.distributionContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <AppText style={[styles.distributionTitle, { color: colors.onSurface }]}>
            {t("widgets.gradingStats.distribution", { defaultValue: "Grade Distribution" })}
          </AppText>
          <View style={styles.barChart}>
            {(["A", "B", "C", "D", "F"] as const).map((grade) => (
              <View key={grade} style={styles.barItem}>
                <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                  {grade}
                </AppText>
                <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: GRADE_COLORS[grade],
                        height: `${(data.gradeDistribution[grade] / maxDistribution) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <AppText style={[styles.barValue, { color: colors.onSurfaceVariant }]}>
                  {data.gradeDistribution[grade]}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 70,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  distributionContainer: {
    padding: 12,
  },
  distributionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    gap: 8,
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  barTrack: {
    width: "100%",
    height: 50,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  barValue: {
    fontSize: 11,
  },
});
