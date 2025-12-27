import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../../hooks/config/useCustomerId";

type TopPerformer = {
  id: string;
  name: string;
  className: string;
  avgScore: number;
  attendance: number;
  rank: number;
  trend: "up" | "stable" | "down";
};

function useTopPerformersQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["top-performers", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get attendance stats (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("student_user_id, class_id, status")
        .eq("customer_id", customerId)
        .gte("attendance_date", thirtyDaysAgo);

      // Get grading data
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("student_user_id, percentage, graded_at")
        .eq("customer_id", customerId)
        .eq("status", "graded")
        .order("graded_at", { ascending: false });

      // Get classes for names
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name_en")
        .eq("customer_id", customerId);

      const classMap = new Map(classes?.map((c) => [c.id, c.name_en]) || []);

      // Aggregate per student
      const studentStats: Record<string, {
        classId: string;
        presentCount: number;
        totalCount: number;
        scores: number[];
        recentScores: number[];
        olderScores: number[];
      }> = {};

      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      attendance?.forEach((record) => {
        const key = record.student_user_id;
        if (!studentStats[key]) {
          studentStats[key] = {
            classId: record.class_id,
            presentCount: 0,
            totalCount: 0,
            scores: [],
            recentScores: [],
            olderScores: [],
          };
        }
        studentStats[key].totalCount++;
        if (record.status === "present") {
          studentStats[key].presentCount++;
        }
      });

      submissions?.forEach((sub) => {
        const key = sub.student_user_id;
        if (studentStats[key] && sub.percentage !== null) {
          studentStats[key].scores.push(sub.percentage);
          if (sub.graded_at && sub.graded_at >= twoWeeksAgo) {
            studentStats[key].recentScores.push(sub.percentage);
          } else {
            studentStats[key].olderScores.push(sub.percentage);
          }
        }
      });

      // Calculate and sort top performers
      const performers: TopPerformer[] = Object.entries(studentStats)
        .map(([studentId, data]) => {
          const attendancePct = data.totalCount > 0
            ? Math.round((data.presentCount / data.totalCount) * 100)
            : 0;
          const avgScore = data.scores.length > 0
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            : 0;

          // Calculate trend
          const recentAvg = data.recentScores.length > 0
            ? data.recentScores.reduce((a, b) => a + b, 0) / data.recentScores.length
            : avgScore;
          const olderAvg = data.olderScores.length > 0
            ? data.olderScores.reduce((a, b) => a + b, 0) / data.olderScores.length
            : avgScore;

          let trend: TopPerformer["trend"] = "stable";
          if (recentAvg > olderAvg + 5) trend = "up";
          else if (recentAvg < olderAvg - 5) trend = "down";

          return {
            id: studentId,
            name: `Student ${studentId.split("-")[1] || "1"}`,
            className: classMap.get(data.classId) || "Unknown Class",
            avgScore,
            attendance: attendancePct,
            rank: 0,
            trend,
          };
        })
        .filter((s) => s.avgScore >= 70 && s.attendance >= 80)
        .sort((a, b) => {
          // Composite score: 60% academics, 40% attendance
          const scoreA = a.avgScore * 0.6 + a.attendance * 0.4;
          const scoreB = b.avgScore * 0.6 + b.attendance * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, 10)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      return performers;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export const TopPerformersWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const maxItems = (config?.maxItems as number) || 5;

  const { data: performers, isLoading, error } = useTopPerformersQuery();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !performers) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>Failed to load data</AppText>
      </View>
    );
  }

  if (performers.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="medal-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.topPerformers.noData", { defaultValue: "No top performers yet" })}
        </AppText>
      </View>
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return colors.primary;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return "medal";
    return "star";
  };

  const getTrendIcon = (trend: TopPerformer["trend"]) => {
    switch (trend) {
      case "up": return "trending-up";
      case "down": return "trending-down";
      default: return "minus";
    }
  };

  const getTrendColor = (trend: TopPerformer["trend"]) => {
    switch (trend) {
      case "up": return "#4CAF50";
      case "down": return "#F44336";
      default: return colors.onSurfaceVariant;
    }
  };

  return (
    <View style={styles.container}>
      {performers.slice(0, maxItems).map((student) => (
        <TouchableOpacity
          key={student.id}
          style={[styles.studentCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={() => onNavigate?.("StudentDetail", { studentId: student.id })}
          activeOpacity={0.7}
        >
          <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(student.rank)}20` }]}>
            <Icon name={getRankIcon(student.rank)} size={16} color={getRankColor(student.rank)} />
            <AppText style={[styles.rankText, { color: getRankColor(student.rank) }]}>
              #{student.rank}
            </AppText>
          </View>

          <View style={styles.studentInfo}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
              {student.name}
            </AppText>
            <AppText style={[styles.className, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {student.className}
            </AppText>
          </View>

          <View style={styles.statsColumn}>
            <View style={styles.statRow}>
              <Icon name="chart-line" size={12} color={colors.primary} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {student.avgScore}%
              </AppText>
            </View>
            <View style={styles.statRow}>
              <Icon name="calendar-check" size={12} color="#4CAF50" />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {student.attendance}%
              </AppText>
            </View>
          </View>

          <View style={[styles.trendBadge, { backgroundColor: `${getTrendColor(student.trend)}15` }]}>
            <Icon name={getTrendIcon(student.trend)} size={16} color={getTrendColor(student.trend)} />
          </View>
        </TouchableOpacity>
      ))}

      {performers.length > maxItems && (
        <TouchableOpacity
          style={[styles.viewAllBtn, { backgroundColor: colors.surface }]}
          onPress={() => onNavigate?.("TopPerformersDetail")}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.topPerformers.viewAll", { defaultValue: "View All Top Performers" })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  className: {
    fontSize: 11,
    marginTop: 2,
  },
  statsColumn: {
    gap: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  trendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

export default TopPerformersWidget;
