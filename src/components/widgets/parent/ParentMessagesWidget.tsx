import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useParentMessagesQuery, ParentMessage } from "../../../hooks/queries/parent/useParentMessagesQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.messages-inbox";

export const ParentMessagesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data, isLoading, error } = useParentMessagesQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = parseInt(config?.maxItems as string) || 5;
  const showUnreadBadge = config?.showUnreadBadge !== false;
  const showCategory = config?.showCategory !== false;
  const showTime = config?.showTime !== false;
  const showPriority = config?.showPriority !== false;
  const showPreview = config?.showPreview !== false;
  const showUnreadFirst = config?.showUnreadFirst !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      general: 'email',
      academic: 'school',
      attendance: 'calendar-check',
      fees: 'currency-inr',
      behavior: 'account-alert',
      event: 'calendar-star',
    };
    return iconMap[category] || 'email';
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      general: colors.primary,
      academic: colors.success,
      attendance: colors.warning,
      fees: colors.error,
      behavior: colors.tertiary,
      event: colors.secondary,
    };
    return colorMap[category] || colors.primary;
  };

  const getPriorityColor = (priority: string): string => {
    if (priority === 'urgent') return colors.error;
    if (priority === 'high') return colors.warning;
    return colors.onSurfaceVariant;
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("widgets.messagesInbox.time.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("widgets.messagesInbox.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.messagesInbox.time.yesterday");
    return t("widgets.messagesInbox.time.daysAgo", { count: diffDays });
  };

  const handleMessagePress = (message: ParentMessage) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "message_tap", messageId: message.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_message_tap`, level: "info", data: { messageId: message.id } });
    onNavigate?.("message-detail", { messageId: message.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("messages");
  };

  const handleCompose = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "compose" });
    onNavigate?.("compose-message");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.messagesInbox.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.messagesInbox.states.error")}
        </AppText>
      </View>
    );
  }

  if (!data || data.messages.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="email-open-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.messagesInbox.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.messagesInbox.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // Sort messages: unread first if enabled
  let displayMessages = [...data.messages];
  if (showUnreadFirst) {
    displayMessages.sort((a, b) => {
      if (a.is_read === b.is_read) return 0;
      return a.is_read ? 1 : -1;
    });
  }
  displayMessages = displayMessages.slice(0, maxItems);


  const renderListItem = (message: ParentMessage, index: number) => (
    <TouchableOpacity
      key={message.id}
      style={[
        styles.listItem, 
        { backgroundColor: message.is_read ? colors.surfaceVariant : `${colors.primary}08`, borderRadius: borderRadius.medium },
        !message.is_read && { borderLeftWidth: 3, borderLeftColor: colors.primary }
      ]}
      onPress={() => handleMessagePress(message)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${getCategoryColor(message.category)}20` }]}>
        <Icon name={getCategoryIcon(message.category)} size={20} color={getCategoryColor(message.category)} />
      </View>
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <AppText style={[styles.senderName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {message.sender_name}
          </AppText>
          {showTime && (
            <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
              {formatTime(message.created_at)}
            </AppText>
          )}
        </View>
        <AppText style={[styles.subjectText, { color: colors.onSurface, fontWeight: message.is_read ? '500' : '700' }]} numberOfLines={1}>
          {getLocalizedField(message, 'subject')}
        </AppText>
        {showPreview && (
          <AppText style={[styles.previewText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {getLocalizedField(message, 'message')}
          </AppText>
        )}
        <View style={styles.metaRow}>
          {showCategory && (
            <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(message.category)}15` }]}>
              <AppText style={[styles.categoryText, { color: getCategoryColor(message.category) }]}>
                {t(`widgets.messagesInbox.categories.${message.category}`)}
              </AppText>
            </View>
          )}
          {showPriority && (message.priority === 'urgent' || message.priority === 'high') && (
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(message.priority)}15` }]}>
              <Icon name="alert" size={10} color={getPriorityColor(message.priority)} />
              <AppText style={[styles.priorityText, { color: getPriorityColor(message.priority) }]}>
                {t(`widgets.messagesInbox.priority.${message.priority}`)}
              </AppText>
            </View>
          )}
        </View>
      </View>
      {!message.is_read && showUnreadBadge && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  const renderCardItem = (message: ParentMessage, index: number) => (
    <TouchableOpacity
      key={message.id}
      style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleMessagePress(message)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {!message.is_read && (
        <View style={[styles.cardUnreadIndicator, { backgroundColor: colors.primary }]} />
      )}
      <View style={[styles.cardIconWrapper, { backgroundColor: `${getCategoryColor(message.category)}20` }]}>
        <Icon name={getCategoryIcon(message.category)} size={20} color={getCategoryColor(message.category)} />
      </View>
      <AppText style={[styles.cardSubject, { color: colors.onSurface }]} numberOfLines={2}>
        {getLocalizedField(message, 'subject')}
      </AppText>
      <AppText style={[styles.cardSender, { color: colors.onSurfaceVariant }]}>
        {message.sender_name}
      </AppText>
      {showTime && (
        <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
          {formatTime(message.created_at)}
        </AppText>
      )}
    </TouchableOpacity>
  );

  const renderCompactItem = (message: ParentMessage, index: number) => (
    <TouchableOpacity
      key={message.id}
      style={[styles.compactItem, { borderBottomColor: colors.outline }]}
      onPress={() => handleMessagePress(message)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {!message.is_read && (
        <View style={[styles.compactUnreadDot, { backgroundColor: colors.primary }]} />
      )}
      <Icon name={getCategoryIcon(message.category)} size={16} color={getCategoryColor(message.category)} />
      <AppText style={[styles.compactSubject, { color: colors.onSurface, fontWeight: message.is_read ? '400' : '600' }]} numberOfLines={1}>
        {getLocalizedField(message, 'subject')}
      </AppText>
      {showTime && (
        <AppText style={[styles.compactTime, { color: colors.onSurfaceVariant }]}>
          {formatTime(message.created_at)}
        </AppText>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Unread Count Banner */}
      {showUnreadBadge && data.unread_count > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.small }]}>
          <Icon name="email-alert" size={16} color={colors.primary} />
          <AppText style={[styles.unreadBannerText, { color: colors.primary }]}>
            {t("widgets.messagesInbox.unreadCount", { count: data.unread_count })}
          </AppText>
        </View>
      )}

      {/* Messages List */}
      {layoutStyle === "cards" ? (
        <View style={styles.cardsContainer}>
          {displayMessages.map((message, index) => renderCardItem(message, index))}
        </View>
      ) : layoutStyle === "compact" ? (
        <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          {displayMessages.map((message, index) => renderCompactItem(message, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayMessages.map((message, index) => renderListItem(message, index))}
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {data.total_count > maxItems && enableTap && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.messagesInbox.actions.viewAll", { count: data.total_count })}
            </AppText>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Loading/Error/Empty states
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySubtitle: { fontSize: 12, textAlign: "center" },
  // Unread banner
  unreadBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  unreadBannerText: { fontSize: 13, fontWeight: "600" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1, gap: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  senderName: { fontSize: 11, flex: 1 },
  timeText: { fontSize: 10 },
  subjectText: { fontSize: 14 },
  previewText: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: "500" },
  priorityBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  priorityText: { fontSize: 10, fontWeight: "500" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, gap: 8, position: "relative" },
  cardUnreadIndicator: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  cardIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardSubject: { fontSize: 13, fontWeight: "600" },
  cardSender: { fontSize: 11 },
  cardTime: { fontSize: 10 },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactUnreadDot: { width: 6, height: 6, borderRadius: 3 },
  compactSubject: { flex: 1, fontSize: 13 },
  compactTime: { fontSize: 10 },
  // Actions
  actionsRow: { flexDirection: "row", justifyContent: "center" },
  viewAllButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
