import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
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
  const handleJoinClass = async (meetingUrl: string, classId: string) => {
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
        // Fallback to navigation
        onNavigate?.(`live-class/${classId}`);
      }
    } else {
      onNavigate?.(`live-class/${classId}`);
    }
  };

  // Handle card tap
  const handleCardPress = (classId: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "card_tap", classId });
    onNavigate?.(`class/${classId}`);
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

  // Empty state - no live classes
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

  // Get the next/current live class
  const liveClass = data[0];
  const timeInfo = getTimeUntil(liveClass.start_time);
  const title = getLocalizedField(liveClass, "title", i18n.language);
  const subjectTitle = liveClass.subject ? getLocalizedField(liveClass.subject, "title", i18n.language) : null;

  const CardWrapper = enableTap ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.container,
        { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        timeInfo.isLive && { borderWidth: 2, borderColor: colors.tertiary },
      ]}
      activeOpacity={0.8}
      onPress={() => handleCardPress(liveClass.id)}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surface }]}>
          <Icon name="cloud-off-outline" size={10} color={colors.onSurfaceVariant} />
        </View>
      )}

      {/* Live indicator */}
      {timeInfo.isLive && (
        <View style={[styles.liveBadge, { backgroundColor: colors.tertiary }]}>
          <View style={styles.liveDot} />
          <AppText style={styles.liveText}>LIVE</AppText>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.tertiary}20` }]}>
          <Icon name="video" size={20} color={colors.tertiary} />
        </View>
        <View style={styles.headerText}>
          <AppText style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </AppText>
          {showSubject && subjectTitle && (
            <AppText style={[styles.subject, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {subjectTitle}
            </AppText>
          )}
        </View>
        {showCountdown && (
          <View style={[styles.timeBadge, { backgroundColor: timeInfo.isLive ? colors.tertiary : colors.primary }]}>
            <AppText style={styles.timeText}>{timeInfo.text}</AppText>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {showTeacher && liveClass.teacher_name && (
          <View style={styles.detailRow}>
            <Icon name="account" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
              {liveClass.teacher_name}
            </AppText>
          </View>
        )}
        {showParticipants && liveClass.participants_count !== undefined && (
          <View style={styles.detailRow}>
            <Icon name="account-group" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.liveClass.labels.participants", { 
                defaultValue: "{{count}} joined", 
                count: liveClass.participants_count 
              })}
            </AppText>
          </View>
        )}
      </View>

      {/* Join button */}
      {showJoinButton && (
        <TouchableOpacity
          style={[
            styles.joinButton,
            { backgroundColor: timeInfo.isLive ? colors.tertiary : colors.primary },
          ]}
          onPress={() => handleJoinClass(liveClass.meeting_url, liveClass.id)}
        >
          <Icon name={timeInfo.isLive ? "video" : "video-outline"} size={18} color="#fff" />
          <AppText style={styles.joinText}>
            {timeInfo.isLive
              ? t("widgets.liveClass.actions.joinNow", { defaultValue: "Join Now" })
              : t("widgets.liveClass.actions.joinClass", { defaultValue: `Join ${liveClassName}` })}
          </AppText>
        </TouchableOpacity>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subject: {
    fontSize: 12,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  details: {
    flexDirection: "row",
    gap: 16,
    paddingLeft: 52,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  joinText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  liveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  offlineBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    padding: 4,
    borderRadius: 10,
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
