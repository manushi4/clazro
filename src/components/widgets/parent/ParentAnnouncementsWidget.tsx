import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSchoolAnnouncementsQuery, SchoolAnnouncement } from "../../../hooks/queries/parent/useSchoolAnnouncementsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.announcements";

export const ParentAnnouncementsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data, isLoading, error } = useSchoolAnnouncementsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = parseInt(config?.maxItems as string) || 5;
  const showPinnedFirst = config?.showPinnedFirst !== false;
  const showCategory = config?.showCategory !== false;
  const showTime = config?.showTime !== false;
  const showPriority = config?.showPriority !== false;
  const showPreview = config?.showPreview !== false;
  const showPinnedBadge = config?.showPinnedBadge !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      general: 'bullhorn',
      academic: 'school',
      event: 'calendar-star',
      holiday: 'beach',
      exam: 'file-document-edit',
      sports: 'basketball',
      cultural: 'palette',
      urgent: 'alert-circle',
    };
    return iconMap[category] || 'bullhorn';
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      general: colors.primary,
      academic: colors.success,
      event: colors.secondary,
      holiday: colors.tertiary,
      exam: colors.warning,
      sports: colors.primary,
      cultural: colors.secondary,
      urgent: colors.error,
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

    if (diffMins < 60) return t("widgets.announcements.time.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("widgets.announcements.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.announcements.time.yesterday");
    return t("widgets.announcements.time.daysAgo", { count: diffDays });
  };

  const handleAnnouncementPress = (announcement: SchoolAnnouncement) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "announcement_tap", announcementId: announcement.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_announcement_tap`, level: "info", data: { announcementId: announcement.id } });
    onNavigate?.(`announcement/${announcement.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("announcements");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.announcements.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.announcements.states.error")}
        </AppText>
      </View>
    );
  }

  if (!data || data.announcements.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="bullhorn-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.announcements.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.announcements.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // Sort announcements: pinned first if enabled
  let displayAnnouncements = [...data.announcements];
  if (showPinnedFirst) {
    displayAnnouncements.sort((a, b) => {
      if (a.is_pinned === b.is_pinned) return 0;
      return a.is_pinned ? -1 : 1;
    });
  }
  displayAnnouncements = displayAnnouncements.slice(0, maxItems);


  const renderListItem = (announcement: SchoolAnnouncement, index: number) => (
    <TouchableOpacity
      key={announcement.id}
      style={[
        styles.listItem, 
        { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        announcement.is_pinned && { borderLeftWidth: 3, borderLeftColor: colors.warning }
      ]}
      onPress={() => handleAnnouncementPress(announcement)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${getCategoryColor(announcement.category)}20` }]}>
        <Icon name={getCategoryIcon(announcement.category)} size={20} color={getCategoryColor(announcement.category)} />
      </View>
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          {showPinnedBadge && announcement.is_pinned && (
            <View style={[styles.pinnedBadge, { backgroundColor: `${colors.warning}15` }]}>
              <Icon name="pin" size={10} color={colors.warning} />
              <AppText style={[styles.pinnedText, { color: colors.warning }]}>
                {t("widgets.announcements.pinned")}
              </AppText>
            </View>
          )}
          {showTime && (
            <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
              {formatTime(announcement.published_at)}
            </AppText>
          )}
        </View>
        <AppText style={[styles.titleText, { color: colors.onSurface }]} numberOfLines={1}>
          {getLocalizedField(announcement, 'title')}
        </AppText>
        {showPreview && (
          <AppText style={[styles.previewText, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {getLocalizedField(announcement, 'content')}
          </AppText>
        )}
        <View style={styles.metaRow}>
          {showCategory && (
            <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(announcement.category)}15` }]}>
              <AppText style={[styles.categoryText, { color: getCategoryColor(announcement.category) }]}>
                {t(`widgets.announcements.categories.${announcement.category}`)}
              </AppText>
            </View>
          )}
          {showPriority && (announcement.priority === 'urgent' || announcement.priority === 'high') && (
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(announcement.priority)}15` }]}>
              <Icon name="alert" size={10} color={getPriorityColor(announcement.priority)} />
              <AppText style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
                {t(`widgets.announcements.priority.${announcement.priority}`)}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCardItem = (announcement: SchoolAnnouncement, index: number) => (
    <TouchableOpacity
      key={announcement.id}
      style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleAnnouncementPress(announcement)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {announcement.is_pinned && showPinnedBadge && (
        <View style={[styles.cardPinnedIndicator, { backgroundColor: colors.warning }]} />
      )}
      <View style={[styles.cardIconWrapper, { backgroundColor: `${getCategoryColor(announcement.category)}20` }]}>
        <Icon name={getCategoryIcon(announcement.category)} size={20} color={getCategoryColor(announcement.category)} />
      </View>
      <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
        {getLocalizedField(announcement, 'title')}
      </AppText>
      {showCategory && (
        <View style={[styles.cardCategoryBadge, { backgroundColor: `${getCategoryColor(announcement.category)}15` }]}>
          <AppText style={[styles.cardCategoryText, { color: getCategoryColor(announcement.category) }]}>
            {t(`widgets.announcements.categories.${announcement.category}`)}
          </AppText>
        </View>
      )}
      {showTime && (
        <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
          {formatTime(announcement.published_at)}
        </AppText>
      )}
    </TouchableOpacity>
  );

  const renderCompactItem = (announcement: SchoolAnnouncement, index: number) => (
    <TouchableOpacity
      key={announcement.id}
      style={[styles.compactItem, { borderBottomColor: colors.outline }]}
      onPress={() => handleAnnouncementPress(announcement)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {announcement.is_pinned && showPinnedBadge && (
        <Icon name="pin" size={12} color={colors.warning} />
      )}
      <Icon name={getCategoryIcon(announcement.category)} size={16} color={getCategoryColor(announcement.category)} />
      <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(announcement, 'title')}
      </AppText>
      {showTime && (
        <AppText style={[styles.compactTime, { color: colors.onSurfaceVariant }]}>
          {formatTime(announcement.published_at)}
        </AppText>
      )}
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Pinned Count Banner */}
      {showPinnedBadge && data.pinned_count > 0 && (
        <View style={[styles.pinnedBanner, { backgroundColor: `${colors.warning}10`, borderRadius: borderRadius.small }]}>
          <Icon name="pin" size={16} color={colors.warning} />
          <AppText style={[styles.pinnedBannerText, { color: colors.warning }]}>
            {t("widgets.announcements.pinnedCount", { count: data.pinned_count })}
          </AppText>
        </View>
      )}

      {/* Announcements List */}
      {layoutStyle === "cards" ? (
        <View style={styles.cardsContainer}>
          {displayAnnouncements.map((announcement, index) => renderCardItem(announcement, index))}
        </View>
      ) : layoutStyle === "compact" ? (
        <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          {displayAnnouncements.map((announcement, index) => renderCompactItem(announcement, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayAnnouncements.map((announcement, index) => renderListItem(announcement, index))}
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {data.total_count > maxItems && enableTap && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.announcements.actions.viewAll", { count: data.total_count })}
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
  // Pinned banner
  pinnedBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  pinnedBannerText: { fontSize: 13, fontWeight: "600" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1, gap: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pinnedBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  pinnedText: { fontSize: 10, fontWeight: "500" },
  timeText: { fontSize: 10 },
  titleText: { fontSize: 14, fontWeight: "600" },
  previewText: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: "500" },
  priorityBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  priorityText: { fontSize: 10, fontWeight: "500" },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, gap: 8, position: "relative" },
  cardPinnedIndicator: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  cardIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600" },
  cardCategoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start" },
  cardCategoryText: { fontSize: 10, fontWeight: "500" },
  cardTime: { fontSize: 10 },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactTitle: { flex: 1, fontSize: 13 },
  compactTime: { fontSize: 10 },
  // Actions
  actionsRow: { flexDirection: "row", justifyContent: "center" },
  viewAllButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
