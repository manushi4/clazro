/**
 * Recent Viewed Widget (recent.viewed)
 * Shows recently viewed content like videos, lessons, notes, assignments
 * Follows Widget Development Guide phases 1-7
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useRecentViewedQuery, type RecentViewedItem } from "../../../hooks/queries/useRecentViewedQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "recent.viewed";

export const RecentViewedWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useRecentViewedQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const maxItems = (config?.maxItems as number) || (size === "compact" ? 3 : 5);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showProgress = config?.showProgress !== false;
  const showIcon = config?.showIcon !== false;
  const showType = config?.showType !== false;
  const showTimeAgo = config?.showTimeAgo !== false;
  const enableTap = config?.enableTap !== false;

  // Color mapping using theme colors
  const getItemColor = (colorKey: string) => {
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

  // Content type icons
  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      video: "play-circle",
      lesson: "book-open-page-variant",
      note: "note-text",
      assignment: "clipboard-text",
      test: "file-document-edit",
      resource: "file-document",
    };
    return iconMap[type] || "file-document";
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("widgets.recentViewed.labels.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("widgets.recentViewed.labels.hoursAgo", { count: diffHours });
    return t("widgets.recentViewed.labels.daysAgo", { count: diffDays });
  };

  // Event handlers
  const handleItemPress = (item: RecentViewedItem) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", contentType: item.content_type, contentId: item.content_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { contentType: item.content_type } });
    onNavigate?.(item.route);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("history");
  };

  const handleClearHistory = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "clear_history" });
    // Could implement clear history functionality
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.recentViewed.states.loading")}
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
          {t("widgets.recentViewed.states.error")}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
          onPress={() => refetch()}
        >
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.recentViewed.actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="history" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.recentViewed.states.empty")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.recentViewed.states.emptyHint")}
        </AppText>
      </View>
    );
  }

  const displayItems = data.slice(0, maxItems);

  // Render item
  const renderItem = (item: RecentViewedItem, index: number) => {
    const itemColor = getItemColor(item.color);
    const typeIcon = showIcon ? (item.icon || getTypeIcon(item.content_type)) : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          layoutStyle === "grid" ? styles.gridItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        ]}
        onPress={enableTap ? () => handleItemPress(item) : undefined}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Icon */}
        {typeIcon && (
          <View style={[styles.iconContainer, { backgroundColor: `${itemColor}15` }]}>
            <Icon name={typeIcon} size={layoutStyle === "grid" ? 20 : 18} color={itemColor} />
          </View>
        )}

        {/* Content */}
        <View style={layoutStyle === "grid" ? styles.gridContent : styles.listContent}>
          <AppText 
            style={[layoutStyle === "grid" ? styles.gridTitle : styles.listTitle, { color: colors.onSurface }]} 
            numberOfLines={layoutStyle === "grid" ? 2 : 1}
          >
            {getLocalizedField(item, "title")}
          </AppText>

          <View style={styles.metaRow}>
            {showType && (
              <View style={[styles.typeBadge, { backgroundColor: `${itemColor}15` }]}>
                <AppText style={[styles.typeText, { color: itemColor }]}>
                  {t(`widgets.recentViewed.types.${item.content_type}`)}
                </AppText>
              </View>
            )}
            {showTimeAgo && (
              <AppText style={[styles.timeAgo, { color: colors.onSurfaceVariant }]}>
                {formatTimeAgo(item.viewed_at)}
              </AppText>
            )}
          </View>

          {/* Progress bar */}
          {showProgress && item.progress_percent > 0 && item.progress_percent < 100 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBg, { backgroundColor: colors.outline }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { backgroundColor: itemColor, width: `${item.progress_percent}%` }
                  ]} 
                />
              </View>
              <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                {item.progress_percent}%
              </AppText>
            </View>
          )}

          {/* Completed badge */}
          {showProgress && item.progress_percent === 100 && (
            <View style={styles.completedRow}>
              <Icon name="check-circle" size={12} color={colors.success} />
              <AppText style={[styles.completedText, { color: colors.success }]}>
                {t("widgets.recentViewed.labels.completed")}
              </AppText>
            </View>
          )}
        </View>

        {/* Chevron for list */}
        {layoutStyle === "list" && (
          <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={14} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline")}
          </AppText>
        </View>
      )}

      {/* List Layout */}
      {layoutStyle === "list" && (
        <View style={styles.listContainer}>
          {displayItems.map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* Grid Layout */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {displayItems.map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* Cards Layout - Horizontal Scroll */}
      {layoutStyle === "cards" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayItems.map((item, index) => {
            const itemColor = getItemColor(item.color);
            const typeIcon = item.icon || getTypeIcon(item.content_type);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
                onPress={enableTap ? () => handleItemPress(item) : undefined}
                disabled={!enableTap}
                activeOpacity={0.7}
              >
                {showIcon && (
                  <View style={[styles.cardIconContainer, { backgroundColor: `${itemColor}15` }]}>
                    <Icon name={typeIcon} size={24} color={itemColor} />
                  </View>
                )}
                <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {getLocalizedField(item, "title")}
                </AppText>
                {showType && (
                  <AppText style={[styles.cardType, { color: colors.onSurfaceVariant }]}>
                    {t(`widgets.recentViewed.types.${item.content_type}`)}
                  </AppText>
                )}
                {showProgress && item.progress_percent > 0 && (
                  <View style={[styles.cardProgressBg, { backgroundColor: colors.outline }]}>
                    <View 
                      style={[styles.cardProgressFill, { backgroundColor: itemColor, width: `${item.progress_percent}%` }]} 
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* View All Button */}
      {enableTap && data.length > maxItems && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
          onPress={handleViewAll}
          activeOpacity={0.7}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.recentViewed.actions.viewAll", { count: data.length })}
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

  // Offline indicator
  offlineBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  offlineText: { fontSize: 11 },

  // List layout
  listContainer: { gap: 8 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  listContent: { flex: 1, gap: 4 },
  listTitle: { fontSize: 14, fontWeight: "600" },

  // Grid layout
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "48%", padding: 12, gap: 8 },
  gridContent: { gap: 4 },
  gridTitle: { fontSize: 12, fontWeight: "600" },

  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: { width: 130, padding: 12, gap: 8, alignItems: "center" },
  cardIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  cardType: { fontSize: 9 },
  cardProgressBg: { width: "100%", height: 3, borderRadius: 2, marginTop: 4 },
  cardProgressFill: { height: "100%", borderRadius: 2 },

  // Common
  iconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: "500" },
  timeAgo: { fontSize: 10 },

  // Progress
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  progressBg: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, width: 28 },

  // Completed
  completedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  completedText: { fontSize: 10, fontWeight: "500" },

  // View all button
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
