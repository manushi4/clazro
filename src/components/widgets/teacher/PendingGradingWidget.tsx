import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import { usePendingGradingQuery, PendingGradingItem } from "../../../hooks/queries/teacher/usePendingGradingQuery";

const TYPE_ICONS: Record<string, string> = {
  assignment: "file-document-outline",
  test: "clipboard-text-outline",
  quiz: "help-circle-outline",
  project: "folder-outline",
};

export const PendingGradingWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 5;
  const showProgress = config?.showProgress !== false;
  const showDueDate = config?.showDueDate !== false;

  // === DATA ===
  const { data, isLoading, error, refetch } = usePendingGradingQuery({ limit: maxItems });

  // === HELPERS ===
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'normal': return colors.primary;
      case 'low': return colors.onSurfaceVariant;
      default: return colors.onSurfaceVariant;
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: t("widgets.pendingGrading.overdue", { days: Math.abs(diffDays) }), isOverdue: true };
    } else if (diffDays === 0) {
      return { text: t("widgets.pendingGrading.dueToday"), isOverdue: false };
    } else if (diffDays === 1) {
      return { text: t("widgets.pendingGrading.dueTomorrow"), isOverdue: false };
    } else {
      return { text: t("widgets.pendingGrading.dueIn", { days: diffDays }), isOverdue: false };
    }
  };

  const getProgressPercent = (item: PendingGradingItem) => {
    if (item.total_submissions === 0) return 0;
    return Math.round((item.graded_count / item.total_submissions) * 100);
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.pendingGrading.states.loading")}
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
          {t("widgets.pendingGrading.states.error")}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("widgets.pendingGrading.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="check-circle-outline" size={32} color={colors.success} />
        <AppText style={{ color: colors.onSurfaceVariant, fontWeight: "600" }}>
          {t("widgets.pendingGrading.states.empty")}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
          {t("widgets.pendingGrading.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((item) => {
        const dueInfo = formatDueDate(item.due_date);
        const progressPercent = getProgressPercent(item);
        const priorityColor = getPriorityColor(item.priority);
        const pendingCount = item.total_submissions - item.graded_count;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate?.("AssignmentDetailTeacher", { assignmentId: item.id })}
            style={[
              styles.item,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                borderLeftWidth: 3,
                borderLeftColor: priorityColor,
              }
            ]}
            accessibilityLabel={`${getLocalizedField(item, 'title')}, ${pendingCount} pending`}
          >
            {/* Icon */}
            <View style={[styles.iconBox, { backgroundColor: `${priorityColor}15` }]}>
              <Icon
                name={TYPE_ICONS[item.type] || "file-outline"}
                size={20}
                color={priorityColor}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Title & Type */}
              <View style={styles.titleRow}>
                <AppText style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
                  {getLocalizedField(item, 'title')}
                </AppText>
                <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <AppText style={[styles.typeText, { color: colors.primary }]}>
                    {t(`widgets.pendingGrading.types.${item.type}`)}
                  </AppText>
                </View>
              </View>

              {/* Class & Subject */}
              <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.class_name} - {item.subject}
              </AppText>

              {/* Progress bar */}
              {showProgress && (
                <View style={styles.progressRow}>
                  <View style={[styles.progressBar, { backgroundColor: colors.outline }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: progressPercent === 100 ? colors.success : colors.primary,
                          width: `${progressPercent}%`
                        }
                      ]}
                    />
                  </View>
                  <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                    {item.graded_count}/{item.total_submissions}
                  </AppText>
                </View>
              )}

              {/* Due date */}
              {showDueDate && dueInfo && (
                <View style={styles.dueRow}>
                  <Icon
                    name="clock-outline"
                    size={12}
                    color={dueInfo.isOverdue ? colors.error : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.dueText,
                      { color: dueInfo.isOverdue ? colors.error : colors.onSurfaceVariant }
                    ]}
                  >
                    {dueInfo.text}
                  </AppText>
                </View>
              )}
            </View>

            {/* Pending count badge */}
            <View style={[styles.pendingBadge, { backgroundColor: priorityColor }]}>
              <AppText style={[styles.pendingCount, { color: colors.surface }]}>
                {pendingCount}
              </AppText>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* View All Link */}
      <TouchableOpacity
        onPress={() => onNavigate?.("GradingHub")}
        style={styles.viewAllRow}
        accessibilityLabel={t("widgets.pendingGrading.viewAll")}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.pendingGrading.viewAll")}
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
    alignItems: "flex-start",
    padding: 12,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "right",
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  dueText: {
    fontSize: 11,
  },
  pendingBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pendingCount: {
    fontSize: 12,
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
