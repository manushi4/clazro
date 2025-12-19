import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Linking, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useLiveClassQuery } from "../../../hooks/queries/useLiveClassQuery";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useBranding } from "../../../context/BrandingContext";
import { getLocalizedField } from "../../../utils/getLocalizedField";

// Widget ID for analytics
const WIDGET_ID = "live.class";

export const LiveClassWidget: React.FC<WidgetProps> = ({
  userId,
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { data, isLoading, error, refetch } = useLiveClassQuery(userId);
  const { t, i18n } = useTranslation("dashboard");
  const branding = useBranding();
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();

  // Get branding for live class name
  const liveClassName = branding?.liveClassName || t("widgets.liveClass.defaultName", { defaultValue: "Live Class" });

  // Config options with defaults
  const showParticipants = config?.showParticipants !== false;
  const showJoinButton = config?.showJoinButton !== false;
  const showTeacher = config?.showTeacher !== false;
  const showSubject = config?.showSubject !== false;
  const showCountdown = config?.showCountdown !== false;
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll !== false;
  const maxItems = (config?.maxItems as number) || (size === "compact" ? 1 : size === "expanded" ? 3 : 2);
  const layoutStyle = (config?.layoutStyle as string) || "list"; // "list" | "cards"

  // Track widget render
  useEffect(() => {
    const loadTime = Date.now() - renderStart.current;
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime });
    if (loadTime > 100) {
      addBreadcrumb({
        category: "performance",
        message: "slow_widget_render",
        level: "warning",
        data: { widgetId: WIDGET_ID, renderTime: loadTime },
      });
    }
  }, []);

  // Track errors
  useEffect(() => {
    if (error) {
      trackWidgetEvent(WIDGET_ID, "error", {
        errorType: (error as Error).name,
        errorMessage: (error as Error).message,
      });
    }
  }, [error]);

  // Handle join class
  const handleJoinClass = async (meetingUrl: string | undefined, classId: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "join_class", classId });
    addBreadcrumb({
      category: "widget",
      message: `${WIDGET_ID}_join_class`,
      level: "info",
      data: { classId },
    });
    
    if (meetingUrl) {
      try {
        await Linking.openURL(meetingUrl);
      } catch (err) {
        onNavigate?.("live-class", { classId });
      }
    } else {
      onNavigate?.("live-class", { classId });
    }
  };

  // Handle card tap
  const handleCardPress = (classId: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "card_tap", classId });
    onNavigate?.("live-class", { classId });
  };

  // Handle view all
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("live-classes-list", {});
  };

  // Calculate time until class
  const getTimeUntil = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return { text: t("widgets.liveClass.labels.now", { defaultValue: "Now" }), isLive: true };
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return { 
        text: t("widgets.liveClass.labels.inMinutes", { defaultValue: "In {{count}} min", count: diffMins }), 
        isLive: false 
      };
    }
    
    const diffHours = Math.floor(diffMins / 60);
    return { 
      text: t("widgets.liveClass.labels.inHours", { defaultValue: "In {{count}} hr", count: diffHours }), 
      isLive: false 
    };
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === "hi" ? "hi-IN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={[styles.skeletonHeader, { backgroundColor: colors.outline }]} />
        <View style={[styles.skeletonBody, { backgroundColor: colors.outline }]} />
        <View style={[styles.skeletonButton, { backgroundColor: colors.outline }]} />
      </View>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="video-off" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.liveClass.states.error", { defaultValue: "Unable to load live classes" })}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t("widgets.liveClass.actions.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="video-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.liveClass.states.empty", { defaultValue: "No live classes scheduled" })}
        </AppText>
      </View>
    );
  }

  const displayClasses = data.slice(0, maxItems);
  const hasMore = data.length > maxItems;

  // Render a single class item
  const renderClassItem = (liveClass: any, index: number) => {
    const timeInfo = getTimeUntil(liveClass.start_time);
    const title = getLocalizedField(liveClass, "title", i18n.language);
    const subjectTitle = liveClass.subject ? getLocalizedField(liveClass.subject, "title", i18n.language) : null;
    const isFirst = index === 0;

    const CardWrapper = enableTap ? TouchableOpacity : View;

    return (
      <CardWrapper
        key={liveClass.id}
        style={[
          styles.classItem,
          { backgroundColor: colors.surface, borderRadius: borderRadius.small },
          timeInfo.isLive && { borderWidth: 2, borderColor: colors.tertiary },
          isFirst && layoutStyle === "list" && { marginTop: 0 },
        ]}
        activeOpacity={0.8}
        onPress={() => handleCardPress(liveClass.id)}
      >
        {/* Live indicator */}
        {timeInfo.isLive && (
          <View style={[styles.liveBadgeSmall, { backgroundColor: colors.tertiary }]}>
            <View style={styles.liveDotSmall} />
            <AppText style={styles.liveTextSmall}>LIVE</AppText>
          </View>
        )}

        <View style={styles.classItemContent}>
          <View style={[styles.iconContainerSmall, { backgroundColor: `${colors.tertiary}20` }]}>
            <Icon name="video" size={16} color={colors.tertiary} />
          </View>
          
          <View style={styles.classItemInfo}>
            <AppText style={[styles.classItemTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {title}
            </AppText>
            <View style={styles.classItemMeta}>
              <AppText style={[styles.classItemTime, { color: colors.onSurfaceVariant }]}>
                {formatTime(liveClass.start_time)}
              </AppText>
              {showSubject && subjectTitle && (
                <>
                  <AppText style={[styles.metaSeparator, { color: colors.onSurfaceVariant }]}>•</AppText>
                  <AppText style={[styles.classItemSubject, { color: colors.primary }]} numberOfLines={1}>
                    {subjectTitle}
                  </AppText>
                </>
              )}
            </View>
            {showTeacher && liveClass.teacher_name && (
              <View style={styles.teacherRow}>
                <Icon name="account" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.teacherText, { color: colors.onSurfaceVariant }]}>
                  {liveClass.teacher_name}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.classItemActions}>
            {showCountdown && (
              <View style={[styles.timeBadgeSmall, { backgroundColor: timeInfo.isLive ? colors.tertiary : colors.primaryContainer }]}>
                <AppText style={[styles.timeBadgeText, { color: timeInfo.isLive ? "#fff" : colors.primary }]}>
                  {timeInfo.text}
                </AppText>
              </View>
            )}
            {showJoinButton && (
              <TouchableOpacity
                style={[styles.joinButtonSmall, { backgroundColor: timeInfo.isLive ? colors.tertiary : colors.primary }]}
                onPress={() => handleJoinClass(liveClass.meeting_url, liveClass.id)}
              >
                <Icon name={timeInfo.isLive ? "video" : "arrow-right"} size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CardWrapper>
    );
  };

  // Cards layout - horizontal scroll
  if (layoutStyle === "cards") {
    return (
      <View style={styles.widgetContainer}>
        {/* Header */}
        <View style={styles.widgetHeader}>
          <View style={styles.widgetTitleRow}>
            <Icon name="video" size={18} color={colors.tertiary} />
            <AppText style={[styles.widgetTitle, { color: colors.onSurface }]}>
              {t("widgets.liveClass.title", { defaultValue: "Live Classes" })}
            </AppText>
          </View>
          {showViewAll && (
            <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
              <AppText style={[styles.viewAllText, { color: colors.primary }]}>
                {t("widgets.liveClass.actions.viewAll", { defaultValue: "View All" })}
              </AppText>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal scroll cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayClasses.map((liveClass, index) => renderClassItem(liveClass, index))}
          {hasMore && (
            <TouchableOpacity
              style={[styles.moreCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
              onPress={handleViewAll}
            >
              <Icon name="plus-circle" size={24} color={colors.primary} />
              <AppText style={[styles.moreText, { color: colors.primary }]}>
                +{data.length - maxItems} more
              </AppText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // Default list layout
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surface }]}>
          <Icon name="cloud-off-outline" size={10} color={colors.onSurfaceVariant} />
        </View>
      )}

      {/* Header */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.tertiary}20` }]}>
            <Icon name="video" size={20} color={colors.tertiary} />
          </View>
          <View>
            <AppText style={[styles.listTitle, { color: colors.onSurface }]}>
              {t("widgets.liveClass.title", { defaultValue: "Live Classes" })}
            </AppText>
            <AppText style={[styles.listSubtitle, { color: colors.onSurfaceVariant }]}>
              {t("widgets.liveClass.subtitle", { defaultValue: "{{count}} scheduled today", count: data.length })}
            </AppText>
          </View>
        </View>
        {showViewAll && (
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButtonCompact}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.liveClass.actions.viewAll", { defaultValue: "View All" })}
            </AppText>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Class list */}
      <View style={styles.classList}>
        {displayClasses.map((liveClass, index) => renderClassItem(liveClass, index))}
      </View>

      {/* Show more indicator */}
      {hasMore && !showViewAll && (
        <TouchableOpacity onPress={handleViewAll} style={styles.showMoreButton}>
          <AppText style={[styles.showMoreText, { color: colors.primary }]}>
            {t("widgets.liveClass.actions.showMore", { defaultValue: "+{{count}} more classes", count: data.length - maxItems })}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    gap: 12,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  widgetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  container: {
    padding: 16,
    gap: 12,
    position: "relative",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  listSubtitle: {
    fontSize: 12,
  },
  classList: {
    gap: 8,
  },
  classItem: {
    padding: 12,
    position: "relative",
    minWidth: 280,
  },
  classItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  classItemInfo: {
    flex: 1,
    gap: 2,
  },
  classItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  classItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classItemTime: {
    fontSize: 12,
  },
  metaSeparator: {
    fontSize: 12,
  },
  classItemSubject: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  teacherText: {
    fontSize: 11,
  },
  classItemActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  timeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  joinButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadgeSmall: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#fff",
  },
  liveTextSmall: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  moreCard: {
    width: 100,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllButtonCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "500",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    padding: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  skeletonHeader: {
    height: 40,
    borderRadius: 8,
    opacity: 0.3,
  },
  skeletonBody: {
    height: 20,
    borderRadius: 4,
    width: "60%",
    opacity: 0.3,
  },
  skeletonButton: {
    height: 44,
    borderRadius: 10,
    opacity: 0.3,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
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
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
});
