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
import { getLocalizedField } from "../../../utils/getLocalizedField";

type SubmissionItem = {
  id: string;
  student_user_id: string;
  student_name: string;
  assignment_id: string;
  assignment_title_en: string;
  assignment_title_hi?: string;
  class_name: string;
  submitted_at: string;
  status: string;
};

export const SubmissionsListWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const customerId = useCustomerId();

  const maxItems = (config?.maxItems as number) || 5;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pending-submissions-list", customerId, maxItems],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // First get submissions with assignment info
      const { data: submissions, error: subError } = await supabase
        .from("assignment_submissions")
        .select(`
          id,
          student_user_id,
          submitted_at,
          status,
          assignment_id,
          assignments (
            id,
            title_en,
            title_hi,
            class_id,
            classes (
              id,
              title_en,
              title_hi
            )
          )
        `)
        .eq("customer_id", customerId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(maxItems);

      if (subError) throw subError;
      if (!submissions?.length) return [];

      // Get student names
      const studentIds = [...new Set(submissions.map(s => s.student_user_id))];
      const { data: students } = await supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      const studentMap = new Map(students?.map(s => [s.user_id, s.full_name]) || []);

      return submissions.map((item: any) => ({
        id: item.id,
        student_user_id: item.student_user_id,
        student_name: studentMap.get(item.student_user_id) || "Unknown Student",
        assignment_id: item.assignment_id,
        assignment_title_en: item.assignments?.title_en || "",
        assignment_title_hi: item.assignments?.title_hi,
        class_name: item.assignments?.classes?.title_en || "",
        submitted_at: item.submitted_at,
        status: item.status,
      })) as SubmissionItem[];
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!customerId,
  });

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t("widgets.submissionsList.timeAgo.minutes", { count: diffMins });
    } else if (diffHours < 24) {
      return t("widgets.submissionsList.timeAgo.hours", { count: diffHours });
    } else {
      return t("widgets.submissionsList.timeAgo.days", { count: diffDays });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.submissionsList.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.submissionsList.states.error")}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common:actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="check-circle-outline" size={32} color={colors.success} />
        <AppText style={{ color: colors.onSurfaceVariant, fontWeight: "600" }}>
          {t("widgets.submissionsList.states.empty")}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
          {t("widgets.submissionsList.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      {data.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.submissionItem,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
          onPress={() => onNavigate?.("GradeSubmission", { submissionId: item.id })}
          accessibilityLabel={`${item.student_name} - ${getLocalizedField(item, "assignment_title")}`}
        >
          {/* Student avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <AppText style={[styles.avatarText, { color: colors.onPrimary }]}>
              {item.student_name.charAt(0).toUpperCase()}
            </AppText>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
              {item.student_name}
            </AppText>
            <AppText style={[styles.assignmentTitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {getLocalizedField(item, "assignment_title")}
            </AppText>
            {item.class_name ? (
              <View style={styles.metaRow}>
                <Icon name="google-classroom" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {item.class_name}
                </AppText>
                <View style={[styles.dot, { backgroundColor: colors.outline }]} />
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(item.submitted_at)}
                </AppText>
              </View>
            ) : (
              <View style={styles.metaRow}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(item.submitted_at)}
                </AppText>
              </View>
            )}
          </View>

          {/* Grade button */}
          <View style={[styles.gradeBtn, { backgroundColor: colors.primary }]}>
            <Icon name="pencil" size={16} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>
      ))}

      {/* View All Link */}
      <TouchableOpacity
        onPress={() => onNavigate?.("GradingHub")}
        style={styles.viewAllRow}
        accessibilityLabel={t("widgets.submissionsList.viewAll")}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.submissionsList.viewAll")}
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
  submissionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
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
  assignmentTitle: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  gradeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
