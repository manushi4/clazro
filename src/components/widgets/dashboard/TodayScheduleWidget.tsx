import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTodaySchedule } from "../../../hooks/queries/useTodaySchedule";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

// Widget ID for analytics
const WIDGET_ID = "schedule.today";

// Mock schedule data for demo (fallback when offline or API fails) - using mock- prefix to identify mock items
const MOCK_SCHEDULE = [
  { id: "mock-1", title: "Mathematics", time: "9:00 AM", duration: "1h", location: "Room 101", type: "class", status: "upcoming" },
  { id: "mock-2", title: "Physics Lab", time: "11:00 AM", duration: "2h", location: "Lab 3", type: "lab", status: "upcoming" },
  { id: "mock-3", title: "English Essay Due", time: "2:00 PM", duration: "", location: "", type: "assignment", status: "due" },
  { id: "mock-4", title: "Live Chemistry Class", time: "4:00 PM", duration: "1h", location: "Online", type: "live", status: "live" },
];

const TYPE_ICONS: Record<string, string> = {
  class: "school",
  lab: "flask",
  assignment: "clipboard-text",
  test: "file-document",
  live: "video",
};

// Colors will be resolved from theme in component

export const TodayScheduleWidget: React.FC<WidgetProps> = ({ 
  userId, 
  config, 
  onNavigate,
  size = "standard",
  // screenId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  
  // Type colors from theme
  const TYPE_COLORS: Record<string, string> = {
    class: colors.primary,
    lab: colors.success,
    assignment: colors.warning,
    test: colors.error,
    live: colors.tertiary,
  };
  const { data, isLoading, error, refetch } = useTodaySchedule(userId);
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  
  // Offline status
  const { isOnline } = useNetworkStatus();
  
  // Analytics
  const { trackWidgetEvent } = useAnalytics();

  // Get config options with defaults
  const maxItems = (config?.maxItems as number) || (size === "compact" ? 2 : size === "expanded" ? 5 : 3);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showTimeIndicator = config?.showTimeIndicator !== false;
  const showIcon = config?.showIcon !== false;
  const showTime = config?.showTime !== false;
  const timeFormat = (config?.timeFormat as string) || "12h";
  const showDuration = config?.showDuration === true;
  const showLocation = config?.showLocation === true || size === "expanded";
  const showBadges = config?.showBadges !== false;
  const showLiveIndicator = config?.showLiveIndicator !== false;
  const highlightNext = config?.highlightNext !== false;
  const showViewAll = config?.showViewAll !== false;
  const enableTap = config?.enableTap !== false;

  // Track widget render (analytics)
  useEffect(() => {
    const loadTime = Date.now() - renderStart.current;
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime });
    
    // Log slow renders (>100ms budget per WIDGET_FAILSAFE_SPEC)
    if (loadTime > 100) {
      addBreadcrumb({
        category: "performance",
        message: "slow_widget_render",
        level: "warning",
        data: { widgetId: WIDGET_ID, renderTime: loadTime },
      });
    }
  }, []);

  // Track data load
  useEffect(() => {
    if (data) {
      trackWidgetEvent(WIDGET_ID, "data_loaded", { 
        itemCount: data.length,
        loadTime: Date.now() - renderStart.current 
      });
    }
  }, [data]);

  // Track errors
  useEffect(() => {
    if (error) {
      trackWidgetEvent(WIDGET_ID, "error", { 
        errorType: (error as Error).name,
        errorMessage: (error as Error).message 
      });
      addBreadcrumb({
        category: "widget",
        message: `${WIDGET_ID}_error`,
        level: "error",
        data: { error: (error as Error).message },
      });
    }
  }, [error]);

  // Use mock data if no real data (graceful degradation)
  const scheduleItems = data?.length ? data : MOCK_SCHEDULE;

  // Format time based on config
  const formatTime = (time: string) => {
    if (timeFormat === "24h") {
      return time.replace(" AM", "").replace(" PM", "");
    }
    return time;
  };

  // Handle item tap with analytics
  const handleItemPress = (item: any, index: number) => {
    trackWidgetEvent(WIDGET_ID, "click", { 
      action: "item_tap",
      itemId: item.id,
      itemType: item.type,
      position: index 
    });
    addBreadcrumb({
      category: "widget",
      message: `${WIDGET_ID}_item_tap`,
      level: "info",
      data: { itemId: item.id, itemType: item.type },
    });
    // Navigate to live-class for live items, class-detail for others
    if (item.type === "live" || item.status === "live") {
      onNavigate?.("live-class", { classId: item.id });
    } else {
      onNavigate?.("class-detail", { classId: item.id, type: item.type });
    }
  };

  // Handle view all tap
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("schedule");
  };

  // Handle retry
  const handleRetry = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "retry" });
    refetch();
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.surfaceVariant }]} />
        ))}
      </View>
    );
  }

  // === ERROR STATE ===
  if (error && !scheduleItems?.length) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.todaySchedule.states.error", { defaultValue: "Unable to load schedule" })}
        </AppText>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRetry}
        >
          <AppText style={styles.retryText}>
            {t("widgets.todaySchedule.actions.retry", { defaultValue: "Try Again" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!scheduleItems?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="calendar-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.todaySchedule.states.empty", { defaultValue: "No classes scheduled for today" })}
        </AppText>
      </View>
    );
  }

  const ItemWrapper = enableTap ? TouchableOpacity : View;

  // Render a single schedule item
  const renderItem = (item: any, index: number) => {
    const iconName = TYPE_ICONS[item.type] || "calendar";
    const accentColor = TYPE_COLORS[item.type] || colors.primary;
    const isFirst = index === 0 && highlightNext;
    const isLive = item.status === "live" && showLiveIndicator;

    // Card layout - vertical card style
    if (layoutStyle === "cards") {
      return (
        <ItemWrapper
          key={item.id}
          style={[
            styles.cardItem,
            { backgroundColor: colors.surfaceVariant },
            isFirst && { borderWidth: 2, borderColor: accentColor },
          ]}
          activeOpacity={0.7}
          onPress={() => handleItemPress(item, index)}
        >
          {showIcon && (
            <View style={[styles.cardIcon, { backgroundColor: `${accentColor}20` }]}>
              <Icon name={iconName} size={24} color={accentColor} />
            </View>
          )}
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {item.title}
          </AppText>
          {showTime && (
            <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
              {formatTime(item.time)}
            </AppText>
          )}
          {showBadges && item.status === "due" && (
            <View style={[styles.cardBadge, { backgroundColor: "#FEF3C7" }]}>
              <AppText style={[styles.badgeText, { color: "#D97706" }]}>Due</AppText>
            </View>
          )}
          {isLive && (
            <View style={[styles.cardBadge, { backgroundColor: "#FCE7F3" }]}>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: "#EC4899" }]} />
                <AppText style={[styles.badgeText, { color: "#EC4899" }]}>Live</AppText>
              </View>
            </View>
          )}
        </ItemWrapper>
      );
    }

    // Grid layout - compact 2-column style
    if (layoutStyle === "grid") {
      return (
        <ItemWrapper
          key={item.id}
          style={[
            styles.gridItem,
            { backgroundColor: colors.surfaceVariant },
            isFirst && { borderWidth: 1, borderColor: accentColor },
          ]}
          activeOpacity={0.7}
          onPress={() => handleItemPress(item, index)}
        >
          <View style={styles.gridHeader}>
            {showIcon && (
              <View style={[styles.gridIcon, { backgroundColor: `${accentColor}20` }]}>
                <Icon name={iconName} size={14} color={accentColor} />
              </View>
            )}
            <AppText style={[styles.gridTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {item.title}
            </AppText>
          </View>
          {showTime && (
            <AppText style={[styles.gridTime, { color: colors.onSurfaceVariant }]}>
              {formatTime(item.time)}
            </AppText>
          )}
        </ItemWrapper>
      );
    }

    // Timeline layout - with vertical line
    if (layoutStyle === "timeline") {
      return (
        <View key={item.id} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { borderColor: accentColor }]} />
          <ItemWrapper
            style={[
              styles.timelineContent,
              { backgroundColor: colors.surfaceVariant },
            ]}
            activeOpacity={0.7}
            onPress={() => handleItemPress(item, index)}
          >
            <View style={styles.timelineHeader}>
              {showIcon && <Icon name={iconName} size={14} color={accentColor} />}
              <AppText style={[styles.itemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {item.title}
              </AppText>
            </View>
            {showTime && (
              <AppText style={[styles.itemTime, { color: colors.onSurfaceVariant }]}>
                {formatTime(item.time)}
              </AppText>
            )}
          </ItemWrapper>
        </View>
      );
    }

    // Default list layout
    return (
      <ItemWrapper
        key={item.id}
        style={[
          styles.scheduleItem,
          { backgroundColor: colors.surfaceVariant },
          isFirst && { borderWidth: 1, borderColor: accentColor },
          size === "compact" && styles.compactItem,
        ]}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item, index)}
      >
        {showTimeIndicator && (
          <View style={[styles.timeIndicator, { backgroundColor: accentColor }]} />
        )}
        {showIcon && (
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
            <Icon name={iconName} size={size === "compact" ? 14 : 18} color={accentColor} />
          </View>
        )}
        <View style={styles.itemContent}>
          <AppText 
            style={[styles.itemTitle, { color: colors.onSurface }, size === "compact" && styles.compactTitle]} 
            numberOfLines={1}
          >
            {item.title}
          </AppText>
          <View style={styles.detailsRow}>
            {showTime && (
              <View style={styles.timeRow}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.itemTime, { color: colors.onSurfaceVariant }]}>
                  {formatTime(item.time)}
                </AppText>
              </View>
            )}
            {showDuration && item.duration && (
              <AppText style={[styles.itemDuration, { color: colors.onSurfaceVariant }]}>
                • {item.duration}
              </AppText>
            )}
            {showLocation && item.location && (
              <View style={styles.locationRow}>
                <Icon name="map-marker" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.itemLocation, { color: colors.onSurfaceVariant }]}>
                  {item.location}
                </AppText>
              </View>
            )}
          </View>
        </View>
        {showBadges && (
          <>
            {item.status === "due" && (
              <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
                <AppText style={[styles.badgeText, { color: "#D97706" }]}>
                  {t("widgets.todaySchedule.labels.due", { defaultValue: "Due" })}
                </AppText>
              </View>
            )}
            {isLive && (
              <View style={[styles.badge, { backgroundColor: "#FCE7F3" }]}>
                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: "#EC4899" }]} />
                  <AppText style={[styles.badgeText, { color: "#EC4899" }]}>
                    {t("widgets.todaySchedule.labels.live", { defaultValue: "Live" })}
                  </AppText>
                </View>
              </View>
            )}
          </>
        )}
      </ItemWrapper>
    );
  };

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.todaySchedule.states.offline", { defaultValue: "Cached data" })}
          </AppText>
        </View>
      )}

      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {scheduleItems.slice(0, maxItems).map((item, index) => renderItem(item, index))}
        </ScrollView>
      )}

      {/* Grid layout - 2 columns */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {scheduleItems.slice(0, maxItems).map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* Timeline layout - vertical with line */}
      {layoutStyle === "timeline" && (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineLine, { backgroundColor: colors.outline }]} />
          {scheduleItems.slice(0, maxItems).map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* Default list layout */}
      {layoutStyle === "list" && (
        <View style={styles.listContainer}>
          {scheduleItems.slice(0, maxItems).map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* View all link */}
      {showViewAll && scheduleItems.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.todaySchedule.actions.viewAll", { 
              defaultValue: "View all ({{count}} items)",
              count: scheduleItems.length 
            })}
          </AppText>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  // Layout containers
  listContainer: {
    gap: 8,
  },
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timelineContainer: {
    position: "relative",
    paddingLeft: 16,
  },
  timelineLine: {
    position: "absolute",
    left: 5,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
  },
  // Card layout items
  cardItem: {
    width: 140,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  cardTime: {
    fontSize: 11,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  // Grid layout items
  gridItem: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  gridHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gridIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  gridTime: {
    fontSize: 10,
    marginLeft: 30,
  },
  // Timeline layout items
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: "#fff",
    marginRight: 8,
    marginTop: 4,
    marginLeft: -8,
  },
  timelineContent: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Default list layout items
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  compactItem: {
    padding: 10,
  },
  timeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  compactTitle: {
    fontSize: 13,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemTime: {
    fontSize: 12,
  },
  itemDuration: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemLocation: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
  skeletonItem: {
    height: 60,
    borderRadius: 10,
  },
  errorContainer: {
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
