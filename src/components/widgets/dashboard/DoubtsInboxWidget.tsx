import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "doubts.inbox";

const MOCK_DOUBTS = [
  { id: "1", subject: "Mathematics", question: "How to solve quadratic equations?", time: "2h ago", status: "pending", unread: true },
  { id: "2", subject: "Physics", question: "Explain Newton's third law", time: "5h ago", status: "answered", unread: false },
  { id: "3", subject: "Chemistry", question: "What is the difference between ionic and covalent bonds?", time: "1d ago", status: "pending", unread: true },
];

// Subject colors will be resolved from theme in component

export const DoubtsInboxWidget: React.FC<WidgetProps> = ({ 
  config, 
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  
  // Subject colors from theme
  const SUBJECT_COLORS: Record<string, string> = {
    Mathematics: colors.primary,
    Physics: colors.success,
    Chemistry: colors.warning,
    English: colors.tertiary,
  };
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const isLoading = false;
  const error = null;

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const maxItems = (config?.maxItems as number) || (size === "compact" ? 2 : 3);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showSubject = config?.showSubject !== false;
  const showTime = config?.showTime !== false;
  const showPreview = config?.showPreview !== false && size !== "compact";
  const previewLength = (config?.previewLength as number) || 50;
  const showStatus = config?.showStatus !== false;
  const showUnreadCount = config?.showUnreadCount !== false;
  const highlightUnread = config?.highlightUnread !== false;
  const showAskNew = config?.showAskNew !== false;
  const showViewAll = config?.showViewAll !== false;

  const doubtsData = MOCK_DOUBTS;
  const unreadCount = doubtsData.filter((d) => d.unread).length;

  const handleItemPress = (doubt: any, index: number) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", itemId: doubt.id, position: index });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { doubtId: doubt.id } });
    onNavigate?.(`doubt/${doubt.id}`);
  };

  const handleAskNew = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "ask_new" });
    onNavigate?.("ask-doubt");
  };
  
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("doubts");
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.surfaceVariant }]} />
        ))}
      </View>
    );
  }

  if (!doubtsData?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chat-question-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.doubtsInbox.states.empty", { defaultValue: "No doubts yet" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>Offline</AppText>
        </View>
      )}

      {showUnreadCount && unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <AppText style={styles.unreadText}>{unreadCount} unread</AppText>
        </View>
      )}

      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {doubtsData.slice(0, maxItems).map((doubt, index) => {
            const subjectColor = SUBJECT_COLORS[doubt.subject] || colors.primary;
            return (
              <TouchableOpacity
                key={doubt.id}
                style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }, highlightUnread && doubt.unread && { borderWidth: 2, borderColor: colors.primary }]}
                onPress={() => handleItemPress(doubt, index)}
              >
                {showSubject && (
                  <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                    <AppText style={[styles.subjectText, { color: subjectColor }]}>{doubt.subject}</AppText>
                  </View>
                )}
                {showPreview && (
                  <AppText style={[styles.cardQuestion, { color: colors.onSurface }]} numberOfLines={3}>
                    {doubt.question}
                  </AppText>
                )}
                {showStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: doubt.status === "answered" ? "#ECFDF5" : "#FEF3C7" }]}>
                    <AppText style={[styles.statusText, { color: doubt.status === "answered" ? "#059669" : "#D97706" }]}>
                      {doubt.status === "answered" ? "Answered" : "Pending"}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Grid layout - 2 columns */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {doubtsData.slice(0, maxItems).map((doubt, index) => {
            const subjectColor = SUBJECT_COLORS[doubt.subject] || colors.primary;
            return (
              <TouchableOpacity
                key={doubt.id}
                style={[styles.gridItem, { backgroundColor: colors.surfaceVariant }, highlightUnread && doubt.unread && { borderWidth: 1, borderColor: colors.primary }]}
                onPress={() => handleItemPress(doubt, index)}
              >
                {showSubject && (
                  <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                    <AppText style={[styles.gridSubjectText, { color: subjectColor }]}>{doubt.subject}</AppText>
                  </View>
                )}
                {showPreview && (
                  <AppText style={[styles.gridQuestion, { color: colors.onSurface }]} numberOfLines={2}>
                    {doubt.question}
                  </AppText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Default list layout */}
      {(layoutStyle === "list" || !["cards", "grid"].includes(layoutStyle)) && (
        <View style={styles.listContainer}>
          {doubtsData.slice(0, maxItems).map((doubt, index) => {
            const subjectColor = SUBJECT_COLORS[doubt.subject] || colors.primary;
            return (
              <TouchableOpacity
                key={doubt.id}
                style={[styles.doubtItem, { backgroundColor: colors.surfaceVariant }, highlightUnread && doubt.unread && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
                onPress={() => handleItemPress(doubt, index)}
              >
                {showSubject && (
                  <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                    <AppText style={[styles.subjectText, { color: subjectColor }]}>{doubt.subject}</AppText>
                  </View>
                )}
                {showPreview && (
                  <AppText style={[styles.questionText, { color: colors.onSurface }]} numberOfLines={2}>
                    {doubt.question.length > previewLength ? doubt.question.slice(0, previewLength) + "..." : doubt.question}
                  </AppText>
                )}
                <View style={styles.footerRow}>
                  {showTime && (
                    <View style={styles.timeRow}>
                      <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>{doubt.time}</AppText>
                    </View>
                  )}
                  {showStatus && (
                    <View style={[styles.statusBadge, { backgroundColor: doubt.status === "answered" ? "#ECFDF5" : "#FEF3C7" }]}>
                      <AppText style={[styles.statusText, { color: doubt.status === "answered" ? "#059669" : "#D97706" }]}>
                        {doubt.status === "answered" ? "Answered" : "Pending"}
                      </AppText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.actionsRow}>
        {showAskNew && (
          <TouchableOpacity style={[styles.askButton, { backgroundColor: colors.primary }]} onPress={handleAskNew}>
            <Icon name="plus" size={16} color="#fff" />
            <AppText style={styles.askButtonText}>Ask New</AppText>
          </TouchableOpacity>
        )}
        {showViewAll && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>View All</AppText>
            <Icon name="arrow-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Layout containers
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // List item
  doubtItem: { padding: 12, borderRadius: 10, gap: 8 },
  // Card item
  cardItem: { width: 160, borderRadius: 12, padding: 14, gap: 8 },
  cardQuestion: { fontSize: 12, lineHeight: 16 },
  // Grid item
  gridItem: { width: "48%", padding: 10, borderRadius: 10, gap: 6 },
  gridSubjectText: { fontSize: 10, fontWeight: "600" },
  gridQuestion: { fontSize: 11, lineHeight: 14 },
  // Common
  subjectTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { fontSize: 11, fontWeight: "600" },
  questionText: { fontSize: 13, lineHeight: 18 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "600" },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  askButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  askButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  unreadBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  skeletonItem: { height: 80, borderRadius: 10 },
  emptyContainer: { alignItems: "center", padding: 20, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  offlineText: { fontSize: 10, fontWeight: "500" },
});
