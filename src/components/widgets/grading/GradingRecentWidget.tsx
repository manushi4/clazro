import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import { useRecentGradingQuery, RecentGradingItem } from "../../../hooks/queries/teacher/useRecentGradingQuery";

export const GradingRecentWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 5;
  const showScore = config?.showScore !== false;
  const showPercentage = config?.showPercentage !== false;

  // === DATA ===
  const { data, isLoading, error, refetch } = useRecentGradingQuery({ limit: maxItems });

  // === HELPERS ===
  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.primary;
    if (percentage >= 40) return colors.warning;
    return colors.error;
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("widgets.gradingRecent.timeAgo.minutes", { count: diffMins, defaultValue: `${diffMins}m ago` });
    if (diffHours < 24) return t("widgets.gradingRecent.timeAgo.hours", { count: diffHours, defaultValue: `${diffHours}h ago` });
    return t("widgets.gradingRecent.timeAgo.days", { count: diffDays, defaultValue: `${diffDays}d ago` });
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.gradingRecent.states.loading", { defaultValue: "Loading..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.gradingRecent.states.error", { defaultValue: "Failed to load" })}
        </AppText>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common:actions.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="clipboard-check-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, fontWeight: "600" }}>
          {t("widgets.gradingRecent.states.empty", { defaultValue: "No recent grades" })}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
          {t("widgets.gradingRecent.states.emptySubtitle", { defaultValue: "Graded submissions will appear here" })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((item: RecentGradingItem) => {
        const gradeColor = getGradeColor(item.percentage);

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate?.("GradeSubmission", { submissionId: item.id })}
            style={[styles.item, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            accessibilityLabel={`${item.student_name} - ${getLocalizedField(item, 'assignment_title')}`}
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
                {getLocalizedField(item, 'assignment_title')}
              </AppText>
              <View style={styles.metaRow}>
                {showScore && (
                  <AppText style={[styles.score, { color: colors.onSurfaceVariant }]}>
                    {item.score}/{item.max_score}
                  </AppText>
                )}
                <AppText style={[styles.time, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(item.graded_at)}
                </AppText>
              </View>
            </View>

            {/* Percentage Badge */}
            {showPercentage && (
              <View style={[styles.percentBadge, { backgroundColor: `${gradeColor}15` }]}>
                <AppText style={[styles.percentText, { color: gradeColor }]}>
                  {Math.round(item.percentage)}%
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* View All Link */}
      <TouchableOpacity
        onPress={() => onNavigate?.("GradingHistory")}
        style={styles.viewAllRow}
        accessibilityLabel={t("widgets.gradingRecent.viewAll", { defaultValue: "View All Grades" })}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.gradingRecent.viewAll", { defaultValue: "View All Grades" })}
        </AppText>
        <Icon name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
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
