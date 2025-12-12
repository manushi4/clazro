import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildrenQuery, LinkedChild } from "../../../hooks/queries/parent/useChildrenQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.children-overview";

export const ChildrenOverviewWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  // Fetch children data
  const { data: children, isLoading, error } = useChildrenQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults (matching Platform Studio WidgetPropertiesPanel)
  const layoutStyle = (config?.layoutStyle as "cards" | "list" | "grid") || "cards";
  const showAvatar = config?.showAvatar !== false;
  const showClass = config?.showClass !== false;
  const showAttendanceToday = config?.showAttendanceToday !== false;
  const showQuickStats = config?.showQuickStats !== false && size !== "compact";
  // Individual stat toggles from Platform Studio
  const showAttendanceStat = config?.showAttendanceStat !== false;
  const showAssignmentsStat = config?.showAssignmentsStat !== false;
  const showStreakStat = config?.showStreakStat !== false;
  const showTestsStat = config?.showTestsStat === true; // default false
  const showXPStat = config?.showXPStat === true; // default false
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll === true;

  // Handle child card tap
  const handleChildPress = (child: LinkedChild) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "child_tap", childId: child.child_user_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_child_tap`, level: "info" });
    onNavigate?.("child-detail", { childId: child.child_user_id });
  };

  // Handle view all tap
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("children-overview");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childrenOverview.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.childrenOverview.states.error")}
        </AppText>
      </View>
    );
  }

  // Empty state
  if (!children || children.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="account-child-outline" size={48} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childrenOverview.states.empty")}
        </AppText>
      </View>
    );
  }

  // Get attendance status color and icon
  const getAttendanceStatus = (status: LinkedChild['attendance_today']) => {
    switch (status) {
      case 'present':
        return { color: colors.success, icon: 'check-circle', label: t("widgets.childrenOverview.attendance.present") };
      case 'absent':
        return { color: colors.error, icon: 'close-circle', label: t("widgets.childrenOverview.attendance.absent") };
      case 'late':
        return { color: colors.warning, icon: 'clock-alert', label: t("widgets.childrenOverview.attendance.late") };
      case 'holiday':
        return { color: colors.tertiary, icon: 'calendar-star', label: t("widgets.childrenOverview.attendance.holiday") };
      default:
        return { color: colors.onSurfaceVariant, icon: 'minus-circle', label: t("widgets.childrenOverview.attendance.unknown") };
    }
  };

  // Render stat item
  const renderStat = (icon: string, value: string | number, label: string, color: string) => (
    <View style={styles.statItem} key={label}>
      <Icon name={icon} size={14} color={color} />
      <AppText style={[styles.statValue, { color: colors.onSurface }]}>{value}</AppText>
      <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</AppText>
    </View>
  );

  // Get avatar color based on index
  const getAvatarColor = (index: number) => {
    const avatarColors = [
      colors.primary,
      colors.tertiary,
      colors.success,
      '#8B5CF6',
    ];
    return avatarColors[index % avatarColors.length];
  };

  // Render child card
  const renderChildCard = (child: LinkedChild, index: number) => {
    const attendanceStatus = getAttendanceStatus(child.attendance_today);
    const avatarColor = getAvatarColor(index);

    return (
      <TouchableOpacity
        key={child.id}
        style={[
          styles.childCard,
          layoutStyle === "list" && styles.childCardList,
          { 
            backgroundColor: colors.surface, 
            borderRadius: borderRadius.large,
            shadowColor: colors.shadow || '#000',
          }
        ]}
        onPress={() => handleChildPress(child)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Top Section with Avatar and Info */}
        <View style={styles.cardHeader}>
          {/* Avatar */}
          {showAvatar && (
            <View
              style={[
                styles.avatar, 
                layoutStyle === "list" && styles.avatarSmall,
                { backgroundColor: avatarColor }
              ]}
            >
              {child.child_avatar_url ? (
                <Image source={{ uri: child.child_avatar_url }} style={styles.avatarImage} />
              ) : (
                <AppText style={styles.avatarText}>
                  {child.child_name.charAt(0).toUpperCase()}
                </AppText>
              )}
            </View>
          )}

          {/* Child Info */}
          <View style={styles.childInfo}>
            <AppText style={[styles.childName, { color: colors.onSurface }]} numberOfLines={1}>
              {child.child_name}
            </AppText>
            {showClass && (
              <View style={styles.classRow}>
                <Icon name="school" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.childClass, { color: colors.onSurfaceVariant }]}>
                  {child.class_name}{child.section ? ` • Section ${child.section}` : ''}
                </AppText>
              </View>
            )}
          </View>

          {/* Today's Attendance Badge */}
          {showAttendanceToday && child.attendance_today && (
            <View style={[styles.attendanceBadge, { backgroundColor: `${attendanceStatus.color}15` }]}>
              <Icon name={attendanceStatus.icon} size={16} color={attendanceStatus.color} />
              {layoutStyle !== "grid" && (
                <AppText style={[styles.attendanceText, { color: attendanceStatus.color }]}>
                  {attendanceStatus.label}
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* Quick Stats */}
        {showQuickStats && layoutStyle === "cards" && (
          <View style={[styles.statsRow, { backgroundColor: `${colors.primary}08` }]}>
            {showAttendanceStat && renderStat(
              "calendar-check",
              `${child.attendance_percentage || 0}%`,
              t("widgets.childrenOverview.stats.attendance"),
              colors.success
            )}
            {showAssignmentsStat && renderStat(
              "clipboard-text",
              child.pending_assignments || 0,
              t("widgets.childrenOverview.stats.pending"),
              child.pending_assignments && child.pending_assignments > 0 ? colors.warning : colors.success
            )}
            {showTestsStat && renderStat(
              "file-document",
              child.upcoming_tests || 0,
              t("widgets.childrenOverview.stats.tests"),
              colors.info
            )}
            {showStreakStat && renderStat(
              "fire",
              child.current_streak || 0,
              t("widgets.childrenOverview.stats.streak"),
              '#F97316'
            )}
            {showXPStat && renderStat(
              "star",
              child.total_xp || 0,
              t("widgets.childrenOverview.stats.xp"),
              '#EAB308'
            )}
          </View>
        )}

        {/* Tap indicator */}
        {enableTap && (
          <View style={styles.tapIndicator}>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Children List/Grid */}
      <View style={[
        styles.childrenContainer,
        layoutStyle === "grid" && styles.gridContainer
      ]}>
        {children.map((child, index) => renderChildCard(child, index))}
      </View>

      {/* View All Button */}
      {showViewAll && children.length > 3 && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
          onPress={handleViewAll}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.childrenOverview.actions.viewAll", { count: children.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  childrenContainer: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  childCard: {
    padding: 16,
    gap: 12,
    // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 3,
  },
  childCardList: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  childInfo: {
    flex: 1,
    gap: 4,
  },
  childName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  childClass: {
    fontSize: 13,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tapIndicator: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
