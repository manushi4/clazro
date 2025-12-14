/**
 * Learning Goals Widget (progress.goals)
 * Displays user's learning goals with progress tracking
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useLearningGoalsQuery, LearningGoal, GoalType } from "../../../hooks/queries/useLearningGoalsQuery";

const WIDGET_ID = "progress.goals";

export const LearningGoalsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Config options
  const maxGoals = Math.min((config?.maxGoals as number) || 4, 10);
  const showProgress = config?.showProgress !== false;
  const showDeadline = config?.showDeadline !== false;
  const showPriority = config?.showPriority !== false;
  const goalTypes = config?.goalTypes as GoalType[] | undefined;
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;
  const showAddButton = config?.showAddButton !== false;
  
  const { data, isLoading, error, refetch } = useLearningGoalsQuery(goalTypes, 'active');

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, goalsCount: data?.goals?.length, loadTime: Date.now() - renderStart.current });
  }, []);

  const handleGoalPress = (goal: LearningGoal) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "goal_tap", goalId: goal.id, goalType: goal.goal_type });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_goal_tap`, level: "info", data: { goalId: goal.id } });
    onNavigate?.(`goal/${goal.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("goals");
  };

  const handleAddGoal = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "add_goal" });
    onNavigate?.("goals/new");
  };


  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.learningGoals.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="flag-remove" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.learningGoals.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.learningGoals.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.goals?.length) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="flag-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.learningGoals.states.empty")}</AppText>
        {showAddButton && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddGoal}>
            <Icon name="plus" size={16} color={colors.onPrimary} />
            <AppText style={[styles.addButtonText, { color: colors.onPrimary }]}>{t("widgets.learningGoals.actions.addGoal")}</AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const displayGoals = data.goals.slice(0, maxGoals);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: t("widgets.learningGoals.types.daily"),
      weekly: t("widgets.learningGoals.types.weekly"),
      monthly: t("widgets.learningGoals.types.monthly"),
      streak: t("widgets.learningGoals.types.streak"),
      subject: t("widgets.learningGoals.types.subject"),
      custom: t("widgets.learningGoals.types.custom"),
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return colors.error;
    if (priority === 2) return colors.warning;
    return colors.onSurfaceVariant;
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}

      {/* Summary */}
      {!compactMode && (
        <View style={[styles.summaryRow, { backgroundColor: colors.primaryContainer }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>{data.active_count}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onPrimaryContainer }]}>{t("widgets.learningGoals.labels.active")}</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outline + "30" }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>{data.completed_count}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onPrimaryContainer }]}>{t("widgets.learningGoals.labels.completed")}</AppText>
          </View>
        </View>
      )}

      {/* Goals List */}
      <View style={styles.goalsList}>
        {displayGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.goalCard, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => handleGoalPress(goal)}
            disabled={!enableTap}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <View style={[styles.goalIcon, { backgroundColor: goal.color + "20" }]}>
              <Icon name={goal.icon} size={compactMode ? 18 : 22} color={goal.color} />
            </View>

            {/* Content */}
            <View style={styles.goalContent}>
              <View style={styles.goalHeader}>
                <AppText style={[styles.goalTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {goal.title}
                </AppText>
                {showPriority && goal.priority <= 2 && (
                  <Icon name="flag" size={14} color={getPriorityColor(goal.priority)} />
                )}
              </View>

              {/* Progress Bar */}
              {showProgress && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.outline + "30" }]}>
                    <View style={[styles.progressFill, { width: `${goal.progress_percentage}%`, backgroundColor: goal.color }]} />
                  </View>
                  <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                    {goal.current_value}/{goal.target_value} {goal.unit}
                  </AppText>
                </View>
              )}

              {/* Footer */}
              <View style={styles.goalFooter}>
                <View style={[styles.typeBadge, { backgroundColor: goal.color + "15" }]}>
                  <AppText style={[styles.typeText, { color: goal.color }]}>{getTypeLabel(goal.goal_type)}</AppText>
                </View>
                {showDeadline && goal.days_remaining !== undefined && (
                  <AppText style={[styles.deadlineText, { color: goal.days_remaining <= 1 ? colors.error : colors.onSurfaceVariant }]}>
                    {goal.days_remaining === 0 ? t("widgets.learningGoals.labels.dueToday") : 
                     goal.days_remaining === 1 ? t("widgets.learningGoals.labels.dueTomorrow") :
                     t("widgets.learningGoals.labels.daysLeft", { count: goal.days_remaining })}
                  </AppText>
                )}
              </View>
            </View>

            {/* Chevron */}
            {enableTap && <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* View All / Add Goal */}
      {!compactMode && (
        <View style={styles.actionsRow}>
          {data.goals.length > maxGoals && (
            <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll}>
              <AppText style={[styles.viewAllText, { color: colors.primary }]}>
                {t("widgets.learningGoals.actions.viewAll", { count: data.goals.length })}
              </AppText>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          {showAddButton && (
            <TouchableOpacity style={[styles.addGoalButton, { backgroundColor: colors.primary }]} onPress={handleAddGoal}>
              <Icon name="plus" size={16} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  addButtonText: { fontSize: 13, fontWeight: "600" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  summaryDivider: { width: 1, height: 32 },
  goalsList: { gap: 8 },
  goalCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  goalContent: { flex: 1, gap: 6 },
  goalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  goalTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  progressContainer: { gap: 4 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500" },
  goalFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: "600" },
  deadlineText: { fontSize: 11, fontWeight: "500" },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  viewAllButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  addGoalButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
