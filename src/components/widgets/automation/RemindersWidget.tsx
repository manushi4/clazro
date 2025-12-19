/**
 * Reminders Widget (automation.reminders)
 * Displays upcoming reminders and scheduled tasks
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useRemindersQuery, Reminder, ReminderType } from "../../../hooks/queries/useRemindersQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "automation.reminders";

export const RemindersWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useRemindersQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showTime = config?.showTime !== false;
  const showAction = config?.showAction !== false;
  const showRepeat = config?.showRepeat !== false;
  const showPriority = config?.showPriority !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const filterType = config?.filterType as ReminderType | "all" | undefined;
  const showOverdue = config?.showOverdue !== false;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";


  // Color mapping using theme colors
  const getReminderColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  const getTypeIcon = (type: ReminderType) => {
    const icons: Record<ReminderType, string> = {
      study: "book-open-page-variant",
      assignment: "clipboard-text-outline",
      test: "file-document-outline",
      revision: "refresh",
      break: "coffee-outline",
      goal: "flag-checkered",
      custom: "bell-outline",
    };
    return icons[type] || "bell-outline";
  };

  const getRepeatLabel = (repeatType: string | null) => {
    if (!repeatType || repeatType === "none") return null;
    const labels: Record<string, string> = {
      daily: t("widgets.reminders.repeat.daily", "Daily"),
      weekly: t("widgets.reminders.repeat.weekly", "Weekly"),
      monthly: t("widgets.reminders.repeat.monthly", "Monthly"),
      custom: t("widgets.reminders.repeat.custom", "Custom"),
    };
    return labels[repeatType] || null;
  };

  const formatTimeUntil = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) return t("widgets.reminders.time.overdueMinutes", "{{count}}m overdue", { count: absMins });
      const absHours = Math.abs(diffHours);
      if (absHours < 24) return t("widgets.reminders.time.overdueHours", "{{count}}h overdue", { count: absHours });
      return t("widgets.reminders.time.overdueDays", "{{count}}d overdue", { count: Math.abs(diffDays) });
    }

    if (diffMins < 60) return t("widgets.reminders.time.inMinutes", "In {{count}} min", { count: diffMins });
    if (diffHours < 24) return t("widgets.reminders.time.inHours", "In {{count}} hr", { count: diffHours });
    if (diffDays === 1) return t("widgets.reminders.time.tomorrow", "Tomorrow");
    return t("widgets.reminders.time.inDays", "In {{count}} days", { count: diffDays });
  };

  const isOverdue = (scheduledAt: string) => new Date(scheduledAt) < new Date();

  const getLocalizedTitle = (reminder: Reminder) => {
    return getLocalizedField({ title_en: reminder.titleEn, title_hi: reminder.titleHi }, 'title');
  };

  const getLocalizedDescription = (reminder: Reminder) => {
    return getLocalizedField({ description_en: reminder.descriptionEn, description_hi: reminder.descriptionHi }, 'description');
  };

  const getLocalizedActionLabel = (reminder: Reminder) => {
    return getLocalizedField({ action_label_en: reminder.actionLabelEn, action_label_hi: reminder.actionLabelHi }, 'action_label');
  };

  const handleReminderPress = (reminder: Reminder) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "reminder_tap", reminderId: reminder.id, type: reminder.reminderType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_reminder_tap`, level: "info", data: { reminderId: reminder.id } });
    if (reminder.actionRoute) {
      onNavigate?.(reminder.actionRoute);
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("reminders");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.reminders.states.loading", "Loading reminders...")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>
          {t("widgets.reminders.states.error", "Couldn't load reminders")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.reminders.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.reminders.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="bell-check" size={32} color={colors.success} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.reminders.states.empty", "No reminders")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.reminders.states.emptyHint", "You're all caught up!")}
        </AppText>
      </View>
    );
  }


  // Filter reminders
  let filteredReminders = data.reminders;
  if (filterType && filterType !== "all") {
    filteredReminders = filteredReminders.filter(r => r.reminderType === filterType);
  }
  if (!showOverdue) {
    filteredReminders = filteredReminders.filter(r => !isOverdue(r.scheduledAt));
  }
  const displayReminders = filteredReminders.slice(0, maxItems);

  const renderReminderItem = (reminder: Reminder, index: number) => {
    const reminderColor = getReminderColor(reminder.color);
    const overdue = isOverdue(reminder.scheduledAt);

    return (
      <TouchableOpacity
        key={reminder.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          overdue && { borderLeftWidth: 3, borderLeftColor: colors.error },
          reminder.priority <= 2 && !overdue && { borderLeftWidth: 3, borderLeftColor: reminderColor }
        ]}
        onPress={() => handleReminderPress(reminder)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${overdue ? colors.error : reminderColor}15` }]}>
          <Icon name={reminder.icon || getTypeIcon(reminder.reminderType)} size={layoutStyle === "cards" ? 24 : 20} color={overdue ? colors.error : reminderColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "cards" ? styles.cardContent : styles.listContent}>
          <View style={styles.titleRow}>
            <AppText style={[styles.reminderTitle, { color: colors.onSurface }]} numberOfLines={layoutStyle === "cards" ? 2 : 1}>
              {getLocalizedTitle(reminder)}
            </AppText>
            {showPriority && reminder.priority <= 2 && (
              <View style={[styles.priorityBadge, { backgroundColor: `${reminderColor}15` }]}>
                <Icon name="star" size={10} color={reminderColor} />
              </View>
            )}
          </View>

          {showTime && (
            <View style={styles.timeRow}>
              <Icon name={overdue ? "alert-circle" : "clock-outline"} size={12} color={overdue ? colors.error : colors.onSurfaceVariant} />
              <AppText style={[styles.timeText, { color: overdue ? colors.error : colors.onSurfaceVariant }]}>
                {formatTimeUntil(reminder.scheduledAt)}
              </AppText>
              {showRepeat && reminder.repeatType && reminder.repeatType !== "none" && (
                <>
                  <Icon name="repeat" size={10} color={colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
                  <AppText style={[styles.repeatText, { color: colors.onSurfaceVariant }]}>
                    {getRepeatLabel(reminder.repeatType)}
                  </AppText>
                </>
              )}
            </View>
          )}

          {showDescription && !compactMode && layoutStyle !== "cards" && reminder.descriptionEn && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedDescription(reminder)}
            </AppText>
          )}
        </View>

        {/* Action button */}
        {showAction && reminder.actionRoute && !compactMode && layoutStyle !== "cards" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: overdue ? colors.error : reminderColor }]}
            onPress={() => handleReminderPress(reminder)}
            activeOpacity={0.7}
          >
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {getLocalizedActionLabel(reminder) || t("widgets.reminders.actions.view", "View")}
            </AppText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Summary banner */}
      {!compactMode && data.overdueCount > 0 && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.error}10`, borderRadius: borderRadius.medium }]}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <AppText style={[styles.summaryText, { color: colors.error }]}>
            {t("widgets.reminders.labels.overdue", "{{count}} overdue reminders", { count: data.overdueCount })}
          </AppText>
        </View>
      )}

      {/* Reminders list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayReminders.map((reminder, index) => renderReminderItem(reminder, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayReminders.map((reminder, index) => renderReminderItem(reminder, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && filteredReminders.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.reminders.actions.viewAll", "View All ({{count}})", { count: data.totalCount })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  emptyHint: { fontSize: 11, marginTop: 4, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  summaryBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, position: "relative" },
  cardItem: { width: 150, padding: 14, alignItems: "center", gap: 8, position: "relative" },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 4 },
  cardContent: { alignItems: "center", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reminderTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  priorityBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 11 },
  repeatText: { fontSize: 10 },
  description: { fontSize: 11, lineHeight: 16 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
