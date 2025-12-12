import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useParentNotificationsQuery, NotificationRecord, NotificationPriority } from "../../../hooks/queries/parent/useParentNotificationsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.notifications-preview";

export const NotificationsPreviewWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data, isLoading, error } = useParentNotificationsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options matching Platform Studio
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";
  const maxItems = (config?.maxItems as number) || 5;
  const showUnreadBadge = config?.showUnreadBadge !== false;
  const showCategory = config?.showCategory !== false;
  const showTime = config?.showTime !== false;
  const showPriority = config?.showPriority !== false;
  const showPreview = config?.showPreview !== false;
  const enableTap = config?.enableTap !== false;
  const showUnreadFirst = config?.showUnreadFirst !== false;

  const handleNotificationPress = (notification: NotificationRecord) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "notification_tap", notificationId: notification.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_notification_tap`, level: "info" });
    onNavigate?.("notification-detail", { notificationId: notification.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("notifications");
  };


  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      fees: "cash",
      school: "school",
      attendance: "calendar-check",
      results: "file-document",
      academic: "book-open-variant",
      transport: "bus",
      health: "heart-pulse",
      general: "bell",
    };
    return icons[category] || "bell";
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      fees: colors.warning,
      school: colors.primary,
      attendance: colors.info,
      results: colors.success,
      academic: colors.secondary || colors.primary,
      transport: colors.tertiary || colors.info,
      health: colors.error,
      general: colors.onSurfaceVariant,
    };
    return categoryColors[category] || colors.primary;
  };

  const getPriorityStyle = (priority: NotificationPriority) => {
    switch (priority) {
      case "high":
        return { color: colors.error, icon: "alert-circle", label: t("widgets.notificationsPreview.priority.high") };
      case "normal":
        return { color: colors.warning, icon: "alert", label: t("widgets.notificationsPreview.priority.normal") };
      default:
        return { color: colors.onSurfaceVariant, icon: "information", label: t("widgets.notificationsPreview.priority.low") };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return t("widgets.notificationsPreview.time.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("widgets.notificationsPreview.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.notificationsPreview.time.yesterday");
    return t("widgets.notificationsPreview.time.daysAgo", { count: diffDays });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.notificationsPreview.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.notificationsPreview.states.error")}
        </AppText>
      </View>
    );
  }

  let notifications = data?.notifications || [];
  
  // Sort: unread first if enabled
  if (showUnreadFirst) {
    notifications = [...notifications].sort((a, b) => {
      if (!a.is_read && b.is_read) return -1;
      if (a.is_read && !b.is_read) return 1;
      return 0;
    });
  }

  const displayNotifications = notifications.slice(0, maxItems);
  const unreadCount = data?.unread_count || 0;

  if (displayNotifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: `${colors.success}10` }]}>
        <Icon name="bell-check" size={48} color={colors.success} />
        <AppText style={[styles.emptyText, { color: colors.success }]}>
          {t("widgets.notificationsPreview.states.empty")}
        </AppText>
      </View>
    );
  }


  const renderNotificationItem = (notification: NotificationRecord, index: number) => {
    const categoryColor = getCategoryColor(notification.category);
    const priorityStyle = getPriorityStyle(notification.priority);
    const isCompact = layoutStyle === "compact" || size === "compact";

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          isCompact && styles.notificationItemCompact,
          !notification.is_read && { backgroundColor: `${colors.primary}08` },
          { backgroundColor: notification.is_read ? colors.surface : `${colors.primary}08`, borderRadius: borderRadius.medium, shadowColor: colors.shadow || "#000" },
        ]}
        onPress={() => handleNotificationPress(notification)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Left: Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
          <Icon name={getCategoryIcon(notification.category)} size={20} color={categoryColor} />
        </View>

        {/* Middle: Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <AppText 
              style={[
                styles.title, 
                { color: colors.onSurface },
                !notification.is_read && styles.titleUnread
              ]} 
              numberOfLines={1}
            >
              {notification.title}
            </AppText>
            {showUnreadBadge && !notification.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>

          {showPreview && !isCompact && (
            <AppText style={[styles.body, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {notification.body}
            </AppText>
          )}

          <View style={styles.metaRow}>
            {showCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <AppText style={[styles.categoryText, { color: categoryColor }]}>
                  {notification.category}
                </AppText>
              </View>
            )}
            {showTime && (
              <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                {formatTimeAgo(notification.sent_at)}
              </AppText>
            )}
          </View>
        </View>

        {/* Right: Priority indicator */}
        {showPriority && notification.priority === "high" && (
          <View style={styles.priorityContainer}>
            <Icon name={priorityStyle.icon} size={16} color={priorityStyle.color} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with unread count */}
      {unreadCount > 0 && (
        <View style={[styles.headerBanner, { backgroundColor: `${colors.primary}10` }]}>
          <Icon name="bell-badge" size={18} color={colors.primary} />
          <AppText style={[styles.headerText, { color: colors.primary }]}>
            {t("widgets.notificationsPreview.unreadCount", { count: unreadCount })}
          </AppText>
        </View>
      )}

      {/* Notification List */}
      <View style={styles.notificationList}>
        {displayNotifications.map((notification, index) => renderNotificationItem(notification, index))}
      </View>

      {/* View All */}
      {notifications.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.notificationsPreview.actions.viewAll", { count: notifications.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  headerBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  headerText: { fontSize: 13, fontWeight: "600" },
  notificationList: { gap: 10 },
  notificationItem: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  notificationItemCompact: { padding: 10, gap: 10 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentContainer: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "500", flex: 1 },
  titleUnread: { fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  body: { fontSize: 12, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  timeText: { fontSize: 11 },
  priorityContainer: { paddingLeft: 8 },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 40, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 16 },
  emptyText: { fontSize: 15, textAlign: "center", fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, gap: 6 },
  viewAllText: { fontSize: 14, fontWeight: "600" },
});
