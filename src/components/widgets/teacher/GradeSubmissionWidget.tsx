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

export const GradeSubmissionWidget: React.FC<WidgetProps> = ({
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const customerId = useCustomerId();

  // Get the next submission to grade
  const { data, isLoading, error } = useQuery({
    queryKey: ["next-submission-to-grade", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data: submission, error: subError } = await supabase
        .from("assignment_submissions")
        .select(`
          id,
          student_user_id,
          submitted_at,
          assignment_id,
          assignments (
            id,
            title_en,
            title_hi,
            max_score,
            classes (title_en, title_hi)
          )
        `)
        .eq("customer_id", customerId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;
      if (!submission) return null;

      // Get student name
      const { data: student } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", submission.student_user_id)
        .single();

      // Get total pending count
      const { count } = await supabase
        .from("assignment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "submitted");

      return {
        id: submission.id,
        student_name: student?.full_name || "Student",
        assignment_title_en: (submission.assignments as any)?.title_en || "",
        assignment_title_hi: (submission.assignments as any)?.title_hi,
        class_name: (submission.assignments as any)?.classes?.title_en || "",
        max_score: (submission.assignments as any)?.max_score || 100,
        pending_count: count || 0,
      };
    },
    staleTime: 1000 * 60,
    enabled: !!customerId,
  });

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error, fontSize: 12 }}>
          {t("widgets.gradeSubmission.error", "Failed to load")}
        </AppText>
      </View>
    );
  }

  // Empty state - no pending submissions
  if (!data) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <View style={[styles.emptyIcon, { backgroundColor: `${colors.success}20` }]}>
          <Icon name="check-circle" size={32} color={colors.success} />
        </View>
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.gradeSubmission.allDone", "All Caught Up!")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.gradeSubmission.noSubmissions", "No pending submissions to grade")}
        </AppText>
      </View>
    );
  }

  // Has submission to grade
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.large }]}
      onPress={() => onNavigate?.("GradeSubmission", { submissionId: data.id })}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <AppText style={[styles.badgeText, { color: colors.onPrimary }]}>
            {data.pending_count} {t("widgets.gradeSubmission.pending", "pending")}
          </AppText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Icon name="clipboard-edit-outline" size={40} color={colors.primary} />
        <View style={styles.info}>
          <AppText style={[styles.title, { color: colors.onPrimaryContainer }]}>
            {t("widgets.gradeSubmission.title", "Grade Submission")}
          </AppText>
          <AppText style={[styles.studentName, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
            {data.student_name}
          </AppText>
          <AppText style={[styles.assignment, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
            {getLocalizedField(data, "assignment_title")} - {data.class_name}
          </AppText>
        </View>
      </View>

      {/* Action Button */}
      <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
        <Icon name="pencil" size={20} color={colors.onPrimary} />
        <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
          {t("widgets.gradeSubmission.gradeNow", "Grade Now")}
        </AppText>
        <Icon name="arrow-right" size={20} color={colors.onPrimary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "700",
  },
  assignment: {
    fontSize: 13,
    opacity: 0.8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
