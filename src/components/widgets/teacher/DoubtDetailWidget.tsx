import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import { useDoubtDetailQuery } from "../../../hooks/queries/teacher/useTeacherDoubtsQuery";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "urgent":
      return { color: "#F44336", icon: "alert-circle", label: "Urgent" };
    case "high":
      return { color: "#FF9800", icon: "arrow-up-circle", label: "High Priority" };
    case "normal":
      return { color: "#2196F3", icon: "minus-circle", label: "Normal" };
    case "low":
      return { color: "#9E9E9E", icon: "arrow-down-circle", label: "Low Priority" };
    default:
      return { color: "#2196F3", icon: "minus-circle", label: "Normal" };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "#FF9800", label: "Pending" };
    case "answered":
      return { color: "#2196F3", label: "Answered" };
    case "resolved":
      return { color: "#4CAF50", label: "Resolved" };
    default:
      return { color: "#9E9E9E", label: status };
  }
};

export const DoubtDetailWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const doubtId = (config?.doubtId as string) || (route.params as any)?.doubtId;

  const { data: doubt, isLoading, error, refetch } = useDoubtDetailQuery(doubtId);

  const handleAnswer = () => {
    (navigation as any).navigate("DoubtAnswer", { doubtId });
  };

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.doubtDetail.states.loading", { defaultValue: "Loading doubt..." })}
        </AppText>
      </View>
    );
  }

  // Error
  if (error || !doubt) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.doubtDetail.states.error", { defaultValue: "Doubt not found" })}
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

  const priorityConfig = getPriorityConfig(doubt.priority);
  const statusConfig = getStatusConfig(doubt.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Student card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
        <View style={styles.studentHeader}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
            <AppText style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}>
              {doubt.student_name.charAt(0)}
            </AppText>
          </View>
          <View style={styles.studentDetails}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]}>
              {doubt.student_name}
            </AppText>
            <AppText style={[styles.className, { color: colors.onSurfaceVariant }]}>
              {doubt.student_class}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
            <AppText style={{ color: statusConfig.color, fontSize: 11, fontWeight: "600" }}>
              {statusConfig.label}
            </AppText>
          </View>
        </View>
      </View>

      {/* Question card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
        <View style={styles.cardHeader}>
          <View style={styles.subjectRow}>
            <Icon name="book-open-variant" size={16} color={colors.primary} />
            <AppText style={[styles.subjectText, { color: colors.primary }]}>
              {getLocalizedField(doubt, "subject")}
            </AppText>
            {doubt.chapter_en && (
              <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                {" "}/ {getLocalizedField(doubt, "chapter")}
              </AppText>
            )}
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityConfig.color}15` }]}>
            <Icon name={priorityConfig.icon} size={14} color={priorityConfig.color} />
            <AppText style={{ color: priorityConfig.color, fontSize: 11, fontWeight: "600" }}>
              {priorityConfig.label}
            </AppText>
          </View>
        </View>

        <AppText style={[styles.questionLabel, { color: colors.onSurfaceVariant }]}>
          {t("widgets.doubtDetail.question", { defaultValue: "Question" })}
        </AppText>
        <AppText style={[styles.questionText, { color: colors.onSurface }]}>
          {doubt.question}
        </AppText>

        <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
          Asked on {formatDate(doubt.created_at)}
        </AppText>
      </View>

      {/* AI Suggestion card */}
      {doubt.ai_suggestion && (
        <View style={[styles.card, styles.aiCard, { backgroundColor: `${colors.tertiary || "#4CAF50"}08`, borderRadius: borderRadius.medium, borderColor: `${colors.tertiary || "#4CAF50"}30` }]}>
          <View style={styles.aiHeader}>
            <Icon name="robot" size={20} color={colors.tertiary || "#4CAF50"} />
            <AppText style={[styles.aiTitle, { color: colors.tertiary || "#4CAF50" }]}>
              {t("widgets.doubtDetail.aiSuggestion", { defaultValue: "AI Suggested Answer" })}
            </AppText>
            {doubt.ai_confidence && (
              <View style={[styles.confidenceBadge, { backgroundColor: colors.tertiary || "#4CAF50" }]}>
                <AppText style={styles.confidenceText}>{doubt.ai_confidence}%</AppText>
              </View>
            )}
          </View>
          <AppText style={[styles.aiText, { color: colors.onSurface }]}>
            {doubt.ai_suggestion}
          </AppText>
          <TouchableOpacity
            style={[styles.useAiBtn, { backgroundColor: colors.tertiary || "#4CAF50" }]}
            onPress={handleAnswer}
          >
            <Icon name="check" size={16} color="#fff" />
            <AppText style={styles.useAiBtnText}>
              {t("widgets.doubtDetail.useAiAnswer", { defaultValue: "Use This Answer" })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Answer card (if answered) */}
      {doubt.answer && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
          <View style={styles.answerHeader}>
            <Icon name="check-circle" size={18} color="#4CAF50" />
            <AppText style={[styles.answerTitle, { color: "#4CAF50" }]}>
              {t("widgets.doubtDetail.yourAnswer", { defaultValue: "Your Answer" })}
            </AppText>
          </View>
          <AppText style={[styles.answerText, { color: colors.onSurface }]}>
            {doubt.answer}
          </AppText>
          {doubt.answered_at && (
            <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
              Answered on {formatDate(doubt.answered_at)}
            </AppText>
          )}
        </View>
      )}

      {/* Action buttons */}
      {doubt.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.answerBtn, { backgroundColor: colors.primary }]}
            onPress={handleAnswer}
          >
            <Icon name="message-reply-text" size={20} color={colors.onPrimary} />
            <AppText style={{ color: colors.onPrimary, fontWeight: "600" }}>
              {t("widgets.doubtDetail.answerNow", { defaultValue: "Answer Now" })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  className: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  questionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 12,
  },
  aiCard: {
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
  },
  useAiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  useAiBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    paddingVertical: 12,
  },
  answerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
});
