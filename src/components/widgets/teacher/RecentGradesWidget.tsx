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

type RecentGrade = {
  id: string;
  student_user_id: string;
  student_name: string;
  assignment_title: string;
  score: number;
  max_score: number;
  percentage: number;
  grade_letter: string;
  graded_at: string;
};

function useRecentGradesQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['recent-grades', customerId, { limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          student_user_id,
          score,
          max_score,
          percentage,
          grade_letter,
          graded_at,
          assignment:assignments(id, title_en, title_hi)
        `)
        .eq('customer_id', customerId)
        .eq('status', 'graded')
        .not('graded_at', 'is', null)
        .order('graded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Map to expected format with student names
      return (data || []).map((item: any) => ({
        id: item.id,
        student_user_id: item.student_user_id,
        student_name: `Student ${item.student_user_id.split('-')[1] || '1'}`, // Demo name
        assignment_title: item.assignment?.title_en || 'Unknown Assignment',
        score: item.score,
        max_score: item.max_score || 100,
        percentage: item.percentage,
        grade_letter: item.grade_letter || 'N/A',
        graded_at: item.graded_at,
      })) as RecentGrade[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export const RecentGradesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const maxItems = (config?.maxItems as number) || 5;

  const { data, isLoading, error, refetch } = useRecentGradesQuery({ limit: maxItems });

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.primary;
    if (percentage >= 40) return colors.warning;
    return colors.error;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("widgets.recentGrades.timeAgo.minutes", { count: diffMins });
    if (diffHours < 24) return t("widgets.recentGrades.timeAgo.hours", { count: diffHours });
    return t("widgets.recentGrades.timeAgo.days", { count: diffDays });
  };

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.recentGrades.states.loading", { defaultValue: "Loading..." })}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.recentGrades.states.error", { defaultValue: "Failed to load" })}
        </AppText>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="clipboard-check-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.recentGrades.states.empty", { defaultValue: "No recent grades" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((item) => {
        const gradeColor = getGradeColor(item.percentage);

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate?.("GradeSubmission", { submissionId: item.id })}
            style={[styles.item, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            {/* Grade Circle */}
            <View style={[styles.gradeCircle, { backgroundColor: `${gradeColor}20`, borderColor: gradeColor }]}>
              <AppText style={[styles.gradeLetter, { color: gradeColor }]}>
                {item.grade_letter}
              </AppText>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.student_name}
              </AppText>
              <AppText style={[styles.assignment, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.assignment_title}
              </AppText>
              <View style={styles.metaRow}>
                <AppText style={[styles.score, { color: colors.onSurfaceVariant }]}>
                  {item.score}/{item.max_score}
                </AppText>
                <AppText style={[styles.time, { color: colors.onSurfaceVariant }]}>
                  {formatTime(item.graded_at)}
                </AppText>
              </View>
            </View>

            {/* Percentage */}
            <View style={[styles.percentBadge, { backgroundColor: `${gradeColor}15` }]}>
              <AppText style={[styles.percentText, { color: gradeColor }]}>
                {Math.round(item.percentage)}%
              </AppText>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={() => onNavigate?.("GradingHistory")}
        style={styles.viewAllRow}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.recentGrades.viewAll", { defaultValue: "View All Grades" })}
        </AppText>
        <Icon name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  stateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  gradeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  gradeLetter: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  assignment: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  score: {
    fontSize: 11,
    fontWeight: "500",
  },
  time: {
    fontSize: 11,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
