import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useChildrenAttendanceQuery,
  ChildAttendanceSummary,
  AttendanceStatus,
} from "../../../hooks/queries/parent/useChildrenAttendanceQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.attendance-summary";

export const AttendanceSummaryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  // Fetch attendance data
  const { data: childrenAttendance, isLoading, error } = useChildrenAttendanceQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults (matching Platform Studio)
  const layoutStyle = (config?.layoutStyle as "cards" | "list" | "compact") || "cards";
  const showTodayStatus = config?.showTodayStatus !== false;
  const showWeekSummary = config?.showWeekSummary !== false;
  const showMonthStats = config?.showMonthStats !== false;
  const showPercentage = config?.showPercentage !== false;
  const showCheckInTime = config?.showCheckInTime === true;
  const showRecentDays = config?.showRecentDays === true;
  const maxRecentDays = (config?.maxRecentDays as number) || 5;
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll === true;

  // Handle child card tap
  const handleChildPress = (child: ChildAttendanceSummary) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "child_tap", childId: child.child_user_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_child_tap`, level: "info" });
    onNavigate?.("child-attendance", { childId: child.child_user_id });
  };

  // Handle view all tap
  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("attendance-overview");
  };

  // Get status color and icon
  const getStatusStyle = (status: AttendanceStatus | null) => {
    switch (status) {
      case "present":
        return { color: colors.success, icon: "check-circle", label: t("widgets.attendanceSummary.status.present") };
      case "absent":
        return { color: colors.error, icon: "close-circle", label: t("widgets.attendanceSummary.status.absent") };
      case "late":
        return { color: colors.warning, icon: "clock-alert", label: t("widgets.attendanceSummary.status.late") };
      case "excused":
        return { color: colors.tertiary, icon: "calendar-check", label: t("widgets.attendanceSummary.status.excused") };
      case "half_day":
        return { color: colors.info, icon: "clock-outline", label: t("widgets.attendanceSummary.status.halfDay") };
      default:
        return { color: colors.onSurfaceVariant, icon: "minus-circle", label: t("widgets.attendanceSummary.status.notMarked") };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.attendanceSummary.states.loading")}
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
          {t("widgets.attendanceSummary.states.error")}
        </AppText>
      </View>
    );
  }

  // Empty state
  if (!childrenAttendance || childrenAttendance.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="calendar-blank" size={48} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.attendanceSummary.states.empty")}
        </AppText>
      </View>
    );
  }


  // Render week day indicator
  const renderWeekDays = (child: ChildAttendanceSummary) => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const recentRecords = child.recent_records.slice(0, 7);
    
    return (
      <View style={styles.weekDaysRow}>
        {days.slice(0, maxRecentDays).map((day, index) => {
          const record = recentRecords[index];
          const statusStyle = record ? getStatusStyle(record.status) : getStatusStyle(null);
          return (
            <View key={index} style={styles.dayItem}>
              <AppText style={[styles.dayLabel, { color: colors.onSurfaceVariant }]}>{day}</AppText>
              <View style={[styles.dayDot, { backgroundColor: statusStyle.color }]}>
                <Icon name={statusStyle.icon} size={12} color="#FFFFFF" />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Render stat item
  const renderStat = (value: number, label: string, color: string) => (
    <View style={styles.statItem}>
      <AppText style={[styles.statValue, { color }]}>{value}</AppText>
      <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</AppText>
    </View>
  );

  // Render child attendance card
  const renderChildCard = (child: ChildAttendanceSummary, index: number) => {
    const todayStyle = getStatusStyle(child.today_status);
    const isCompact = layoutStyle === "compact" || size === "compact";

    return (
      <TouchableOpacity
        key={child.child_user_id}
        style={[
          styles.childCard,
          isCompact && styles.childCardCompact,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.large,
            shadowColor: colors.shadow || "#000",
          },
        ]}
        onPress={() => handleChildPress(child)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Header with child name and today's status */}
        <View style={styles.cardHeader}>
          <View style={styles.childInfo}>
            <AppText style={[styles.childName, { color: colors.onSurface }]} numberOfLines={1}>
              {child.child_name}
            </AppText>
            {child.class_name && (
              <View style={styles.classRow}>
                <Icon name="school" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.className, { color: colors.onSurfaceVariant }]}>
                  {child.class_name}{child.section ? ` • ${child.section}` : ""}
                </AppText>
              </View>
            )}
          </View>

          {/* Today's Status Badge */}
          {showTodayStatus && (
            <View style={[styles.statusBadge, { backgroundColor: `${todayStyle.color}15` }]}>
              <Icon name={todayStyle.icon} size={18} color={todayStyle.color} />
              {!isCompact && (
                <AppText style={[styles.statusText, { color: todayStyle.color }]}>
                  {todayStyle.label}
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* Check-in time */}
        {showCheckInTime && child.today_check_in && (
          <View style={styles.checkInRow}>
            <Icon name="clock-check-outline" size={14} color={colors.success} />
            <AppText style={[styles.checkInText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.attendanceSummary.checkIn")}: {child.today_check_in}
            </AppText>
          </View>
        )}

        {/* Week Summary */}
        {showWeekSummary && !isCompact && (
          <View style={[styles.weekSummary, { backgroundColor: `${colors.primary}08` }]}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("widgets.attendanceSummary.thisWeek")}
            </AppText>
            <View style={styles.statsRow}>
              {renderStat(child.this_week.present, t("widgets.attendanceSummary.stats.present"), colors.success)}
              {renderStat(child.this_week.absent, t("widgets.attendanceSummary.stats.absent"), colors.error)}
              {renderStat(child.this_week.late, t("widgets.attendanceSummary.stats.late"), colors.warning)}
            </View>
          </View>
        )}

        {/* Month Stats with Percentage */}
        {showMonthStats && !isCompact && (
          <View style={styles.monthStats}>
            <View style={styles.monthHeader}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("widgets.attendanceSummary.thisMonth")}
              </AppText>
              {showPercentage && (
                <View style={[styles.percentageBadge, { backgroundColor: `${colors.success}15` }]}>
                  <AppText style={[styles.percentageText, { color: colors.success }]}>
                    {child.this_month.attendance_percentage}%
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.success,
                    width: `${child.this_month.attendance_percentage}%`,
                  },
                ]}
              />
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]} />
            </View>
            <AppText style={[styles.monthDetail, { color: colors.onSurfaceVariant }]}>
              {t("widgets.attendanceSummary.daysAttended", {
                attended: child.this_month.present + child.this_month.late + child.this_month.half_day,
                total: child.this_month.total_days,
              })}
            </AppText>
          </View>
        )}

        {/* Recent Days Indicator */}
        {showRecentDays && !isCompact && renderWeekDays(child)}

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
      {/* Children List */}
      <View style={styles.childrenContainer}>
        {childrenAttendance.map((child, index) => renderChildCard(child, index))}
      </View>

      {/* View All Button */}
      {showViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
          onPress={handleViewAll}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.attendanceSummary.actions.viewAll")}
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
  childCard: {
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  childCardCompact: {
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  className: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  checkInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkInText: {
    fontSize: 12,
  },
  weekSummary: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  monthStats: {
    gap: 8,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  progressBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 3,
    zIndex: 1,
  },
  monthDetail: {
    fontSize: 12,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  dayItem: {
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
