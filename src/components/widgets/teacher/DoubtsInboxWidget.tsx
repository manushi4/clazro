import React, { useState } from "react";
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
  useTeacherDoubtsQuery,
  type TeacherDoubt,
} from "../../../hooks/queries/teacher/useTeacherDoubtsQuery";

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "urgent":
      return { color: "#F44336", icon: "alert-circle", label: "Urgent" };
    case "high":
      return { color: "#FF9800", icon: "arrow-up-circle", label: "High" };
    case "normal":
      return { color: "#2196F3", icon: "minus-circle", label: "Normal" };
    case "low":
      return { color: "#9E9E9E", icon: "arrow-down-circle", label: "Low" };
    default:
      return { color: "#2196F3", icon: "minus-circle", label: "Normal" };
  }
};

type FilterType = "all" | "pending" | "urgent";

export const DoubtsInboxWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [filter, setFilter] = useState<FilterType>("pending");

  const maxItems = (config?.maxItems as number) || 5;
  const showFilters = config?.showFilters !== false;

  const { data, isLoading, error, refetch } = useTeacherDoubtsQuery({
    limit: maxItems,
    status: filter === "pending" ? "pending" : undefined,
    priority: filter === "urgent" ? "urgent" : undefined,
  });

  const handleDoubtPress = (doubt: TeacherDoubt) => {
    (navigation as any).navigate("DoubtAnswer", { doubtId: doubt.id });
  };

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.doubtsInbox.states.error", { defaultValue: "Failed to load doubts" })}
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

  // Empty
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chat-question-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: "center" }}>
          {t("widgets.doubtsInbox.states.empty", { defaultValue: "No pending doubts!" })}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
          {t("widgets.doubtsInbox.states.emptySubtitle", { defaultValue: "All student questions answered" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      {showFilters && (
        <View style={styles.filterRow}>
          {(["pending", "urgent", "all"] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f ? colors.primary : colors.surfaceVariant,
                  borderRadius: borderRadius.full || 20,
                },
              ]}
            >
              <AppText
                style={{
                  color: filter === f ? colors.onPrimary : colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t(`widgets.doubtsInbox.filters.${f}`, { defaultValue: f.charAt(0).toUpperCase() + f.slice(1) })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Doubts list */}
      <View style={styles.list}>
        {data.map((doubt, index) => {
          const priorityConfig = getPriorityConfig(doubt.priority);

          return (
            <TouchableOpacity
              key={doubt.id}
              onPress={() => handleDoubtPress(doubt)}
              style={[
                styles.doubtItem,
                {
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.medium,
                  borderLeftWidth: 3,
                  borderLeftColor: priorityConfig.color,
                },
                index < data.length - 1 && { marginBottom: 10 },
              ]}
            >
              {/* Student info and priority */}
              <View style={styles.doubtHeader}>
                <View style={styles.studentInfo}>
                  <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
                    <AppText style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                      {doubt.student_name.charAt(0)}
                    </AppText>
                  </View>
                  <View>
                    <AppText style={[styles.studentName, { color: colors.onSurface }]}>
                      {doubt.student_name}
                    </AppText>
                    <AppText style={[styles.className, { color: colors.onSurfaceVariant }]}>
                      {doubt.student_class}
                    </AppText>
                  </View>
                </View>
                <View style={styles.metaInfo}>
                  <View style={[styles.priorityBadge, { backgroundColor: `${priorityConfig.color}15` }]}>
                    <Icon name={priorityConfig.icon} size={12} color={priorityConfig.color} />
                    <AppText style={{ color: priorityConfig.color, fontSize: 10, fontWeight: "600" }}>
                      {priorityConfig.label}
                    </AppText>
                  </View>
                  <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                    {formatTimeAgo(doubt.created_at)}
                  </AppText>
                </View>
              </View>

              {/* Subject and chapter */}
              <View style={styles.subjectRow}>
                <Icon name="book-open-variant" size={14} color={colors.primary} />
                <AppText style={[styles.subjectText, { color: colors.primary }]}>
                  {getLocalizedField(doubt, "subject")}
                </AppText>
                {doubt.chapter_en && (
                  <>
                    <AppText style={{ color: colors.onSurfaceVariant }}> - </AppText>
                    <AppText style={[styles.chapterText, { color: colors.onSurfaceVariant }]}>
                      {getLocalizedField(doubt, "chapter")}
                    </AppText>
                  </>
                )}
              </View>

              {/* Question */}
              <AppText
                style={[styles.question, { color: colors.onSurface }]}
                numberOfLines={2}
              >
                {doubt.question}
              </AppText>

              {/* AI suggestion indicator */}
              {doubt.ai_suggestion && (
                <View style={[styles.aiRow, { backgroundColor: `${colors.tertiary || "#4CAF50"}10` }]}>
                  <Icon name="robot" size={14} color={colors.tertiary || "#4CAF50"} />
                  <AppText style={{ color: colors.tertiary || "#4CAF50", fontSize: 11, flex: 1 }}>
                    AI suggestion available ({doubt.ai_confidence}% confidence)
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View all */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("DoubtsInbox")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.doubtsInbox.viewAll", { defaultValue: "View All Doubts" })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  list: {},
  doubtItem: {
    padding: 12,
    gap: 8,
  },
  doubtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  className: {
    fontSize: 11,
  },
  metaInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chapterText: {
    fontSize: 12,
  },
  question: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
});
