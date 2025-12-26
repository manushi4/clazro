import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../../hooks/config/useCustomerId";

type GradingStats = {
  totalAssignments: number;
  publishedAssignments: number;
  totalSubmissions: number;
  pendingGrading: number;
  gradedCount: number;
  avgScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
};

function useGradingStatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['grading-stats', customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get assignment counts
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, status')
        .eq('customer_id', customerId);

      const totalAssignments = assignments?.length || 0;
      const publishedAssignments = assignments?.filter(a => a.status === 'published').length || 0;

      // Get submission stats
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('status, score, percentage, grade_letter')
        .eq('customer_id', customerId);

      const totalSubmissions = submissions?.length || 0;
      const pendingGrading = submissions?.filter(s => s.status === 'submitted' || s.status === 'late').length || 0;
      const gradedSubmissions = submissions?.filter(s => s.status === 'graded') || [];
      const gradedCount = gradedSubmissions.length;

      // Calculate average score
      const scores = gradedSubmissions.map(s => s.percentage).filter(Boolean);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Grade distribution
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      gradedSubmissions.forEach(s => {
        const letter = s.grade_letter?.charAt(0);
        if (letter === 'A') gradeDistribution.A++;
        else if (letter === 'B') gradeDistribution.B++;
        else if (letter === 'C') gradeDistribution.C++;
        else if (letter === 'D') gradeDistribution.D++;
        else if (letter === 'F') gradeDistribution.F++;
      });

      return {
        totalAssignments,
        publishedAssignments,
        totalSubmissions,
        pendingGrading,
        gradedCount,
        avgScore,
        gradeDistribution,
      } as GradingStats;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export const GradingStatsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const showDistribution = config?.showDistribution !== false;

  const { data, isLoading, error } = useGradingStatsQuery();

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.gradingStats.states.error", { defaultValue: "Failed to load stats" })}
        </AppText>
      </View>
    );
  }

  const stats = [
    {
      label: t("widgets.gradingStats.assignments", { defaultValue: "Assignments" }),
      value: data.publishedAssignments,
      icon: "file-document-multiple-outline",
      color: colors.primary,
    },
    {
      label: t("widgets.gradingStats.pending", { defaultValue: "Pending" }),
      value: data.pendingGrading,
      icon: "clock-outline",
      color: data.pendingGrading > 0 ? colors.warning : colors.success,
    },
    {
      label: t("widgets.gradingStats.graded", { defaultValue: "Graded" }),
      value: data.gradedCount,
      icon: "check-circle-outline",
      color: colors.success,
    },
    {
      label: t("widgets.gradingStats.avgScore", { defaultValue: "Avg Score" }),
      value: `${data.avgScore}%`,
      icon: "chart-line",
      color: data.avgScore >= 70 ? colors.success : data.avgScore >= 50 ? colors.warning : colors.error,
    },
  ];

  const gradeColors: Record<string, string> = {
    A: '#4CAF50',
    B: '#8BC34A',
    C: '#FFC107',
    D: '#FF9800',
    F: '#F44336',
  };

  const totalGraded = Object.values(data.gradeDistribution).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
              <Icon name={stat.icon} size={20} color={stat.color} />
            </View>
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {stat.value}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {stat.label}
            </AppText>
          </View>
        ))}
      </View>

      {/* Grade Distribution */}
      {showDistribution && totalGraded > 0 && (
        <View style={[styles.distributionCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <AppText style={[styles.distributionTitle, { color: colors.onSurface }]}>
            {t("widgets.gradingStats.distribution", { defaultValue: "Grade Distribution" })}
          </AppText>
          <View style={styles.distributionBars}>
            {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
              const count = data.gradeDistribution[grade];
              const percent = totalGraded > 0 ? (count / totalGraded) * 100 : 0;

              return (
                <View key={grade} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: gradeColors[grade],
                          height: `${Math.max(percent, 5)}%`,
                        }
                      ]}
                    />
                  </View>
                  <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                    {grade}
                  </AppText>
                  <AppText style={[styles.barCount, { color: colors.onSurfaceVariant }]}>
                    {count}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  stateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  distributionCard: {
    padding: 12,
    gap: 10,
  },
  distributionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  distributionBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
  barContainer: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  barWrapper: {
    height: 50,
    width: 24,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  barCount: {
    fontSize: 10,
  },
});
