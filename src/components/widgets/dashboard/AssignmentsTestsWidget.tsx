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
import { usePendingAssignmentsQuery } from "../../../hooks/queries/useAssignmentsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "assignments.pending";

// Fallback mock data when database is empty
const FALLBACK_ASSIGNMENTS = [
  { id: "1", title_en: "Math Problem Set 5", title_hi: "गणित प्रश्न सेट 5", subject: { title_en: "Mathematics", title_hi: "गणित", color: "#6366F1" }, dueDate: "Today", dueTime: "5:00 PM", points: 100, progress: 60, status: "due-today" },
  { id: "2", title_en: "Physics Lab Report", title_hi: "भौतिकी प्रयोगशाला रिपोर्ट", subject: { title_en: "Physics", title_hi: "भौतिकी", color: "#10B981" }, dueDate: "Tomorrow", dueTime: "11:59 PM", points: 50, progress: 0, status: "upcoming" },
];

// Helper functions for date formatting
function formatDueDate(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return t("widgets.assignments.labels.today", { defaultValue: "Today" });
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return t("widgets.assignments.labels.tomorrow", { defaultValue: "Tomorrow" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDueTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getDueStatus(dateStr: string | null): string {
  if (!dateStr) return "upcoming";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(date);
  dueDay.setHours(0, 0, 0, 0);
  
  if (date < new Date()) return "overdue";
  if (dueDay.getTime() === today.getTime()) return "due-today";
  return "upcoming";
}

export const AssignmentsTestsWidget: React.FC<WidgetProps> = ({ 
  config, 
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Fetch assignments from database
  const { data: dbAssignments, isLoading } = usePendingAssignmentsQuery(5);

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Size-aware config
  const maxItems = (config?.maxItems as number) || (size === "compact" ? 2 : size === "expanded" ? 5 : 3);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showSubject = config?.showSubject !== false;
  const showDueDate = config?.showDueDate !== false;
  const showDueTime = config?.showDueTime === true || size === "expanded";
  const showProgress = config?.showProgress === true || size === "expanded";
  const showPoints = config?.showPoints !== false;
  const showUrgencyBadge = config?.showUrgencyBadge !== false;
  const highlightOverdue = config?.highlightOverdue !== false;
  const highlightDueToday = config?.highlightDueToday !== false;

  // Transform database data or use fallback
  const assignmentsData = (dbAssignments && dbAssignments.length > 0)
    ? dbAssignments.map(a => ({
        id: a.id,
        title: getLocalizedField(a, 'title'),
        subject: getLocalizedField(a.subject, 'title'),
        subjectColor: a.subject?.color || colors.primary,
        dueDate: a.due_date ? formatDueDate(a.due_date, t) : t("widgets.assignments.labels.noDue", { defaultValue: "No due date" }),
        dueTime: a.due_date ? formatDueTime(a.due_date) : "",
        points: a.max_score,
        progress: 0,
        status: getDueStatus(a.due_date),
      }))
    : FALLBACK_ASSIGNMENTS.map(a => ({
        id: a.id,
        title: getLocalizedField(a, 'title'),
        subject: getLocalizedField(a.subject, 'title'),
        subjectColor: a.subject?.color || colors.primary,
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        points: a.points,
        progress: a.progress,
        status: a.status,
      }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return { bg: "#FEE2E2", text: "#DC2626" };
      case "due-today": return { bg: "#FEF3C7", text: "#D97706" };
      default: return { bg: "#E0E7FF", text: "#4F46E5" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overdue": return t("widgets.assignments.labels.overdue", { defaultValue: "Overdue" });
      case "due-today": return t("widgets.assignments.labels.dueToday", { defaultValue: "Due Today" });
      default: return t("widgets.assignments.labels.upcoming", { defaultValue: "Upcoming" });
    }
  };

  const handleItemPress = (assignment: any, index: number) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", itemId: assignment.id, position: index });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { assignmentId: assignment.id } });
    onNavigate?.(`assignment/${assignment.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("assignments");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.surfaceVariant }]} />
        ))}
      </View>
    );
  }

  // Empty state
  if (!assignmentsData?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="clipboard-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.assignments.states.empty", { defaultValue: "No pending assignments" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>Offline</AppText>
        </View>
      )}

      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {assignmentsData.slice(0, maxItems).map((assignment, index) => {
            const subjectColor = assignment.subjectColor || colors.primary;
            const statusColors = getStatusColor(assignment.status);
            const isUrgent = assignment.status === "overdue" || assignment.status === "due-today";
            return (
              <TouchableOpacity
                key={assignment.id}
                style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }, isUrgent && { borderWidth: 2, borderColor: statusColors.text }]}
                activeOpacity={0.7}
                onPress={() => handleItemPress(assignment, index)}
              >
                {showUrgencyBadge && isUrgent && (
                  <View style={[styles.urgencyBadge, { backgroundColor: statusColors.bg }]}>
                    <AppText style={[styles.urgencyText, { color: statusColors.text }]}>{getStatusLabel(assignment.status)}</AppText>
                  </View>
                )}
                <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>{assignment.title}</AppText>
                {showSubject && (
                  <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                    <AppText style={[styles.cardSubjectText, { color: subjectColor }]}>{assignment.subject}</AppText>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  {showDueDate && <AppText style={[styles.cardDue, { color: colors.onSurfaceVariant }]}>📅 {assignment.dueDate}</AppText>}
                  {showPoints && <AppText style={[styles.cardPoints, { color: colors.onSurfaceVariant }]}>⭐ {assignment.points}</AppText>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Grid layout - 2 columns */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {assignmentsData.slice(0, maxItems).map((assignment, index) => {
            const subjectColor = assignment.subjectColor || colors.primary;
            const statusColors = getStatusColor(assignment.status);
            const isUrgent = assignment.status === "overdue" || assignment.status === "due-today";
            return (
              <TouchableOpacity
                key={assignment.id}
                style={[styles.gridItem, { backgroundColor: colors.surfaceVariant }, isUrgent && { borderWidth: 1, borderColor: statusColors.text }]}
                activeOpacity={0.7}
                onPress={() => handleItemPress(assignment, index)}
              >
                <AppText style={[styles.gridTitle, { color: colors.onSurface }]} numberOfLines={1}>{assignment.title}</AppText>
                {showSubject && (
                  <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                    <AppText style={[styles.gridSubjectText, { color: subjectColor }]}>{assignment.subject}</AppText>
                  </View>
                )}
                {showDueDate && <AppText style={[styles.gridDue, { color: colors.onSurfaceVariant }]}>📅 {assignment.dueDate}</AppText>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Timeline layout */}
      {layoutStyle === "timeline" && (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineLine, { backgroundColor: colors.outline }]} />
          {assignmentsData.slice(0, maxItems).map((assignment, index) => {
            const subjectColor = assignment.subjectColor || colors.primary;
            return (
              <View key={assignment.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { borderColor: subjectColor }]} />
                <TouchableOpacity
                  style={[styles.timelineContent, { backgroundColor: colors.surfaceVariant }]}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(assignment, index)}
                >
                  <AppText style={[styles.titleText, { color: colors.onSurface }]} numberOfLines={1}>{assignment.title}</AppText>
                  <View style={styles.timelineFooter}>
                    {showSubject && (
                      <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                        <AppText style={[styles.gridSubjectText, { color: subjectColor }]}>{assignment.subject}</AppText>
                      </View>
                    )}
                    {showDueDate && <AppText style={[styles.gridDue, { color: colors.onSurfaceVariant }]}>{assignment.dueDate}</AppText>}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Default list layout */}
      {(layoutStyle === "list" || !["cards", "grid", "timeline"].includes(layoutStyle)) && (
        <View style={styles.listContainer}>
          {assignmentsData.slice(0, maxItems).map((assignment, index) => {
            const subjectColor = assignment.subjectColor || colors.primary;
            const statusColors = getStatusColor(assignment.status);
            const isUrgent = assignment.status === "overdue" || assignment.status === "due-today";
            const shouldHighlight = (highlightOverdue && assignment.status === "overdue") || (highlightDueToday && assignment.status === "due-today");
            return (
              <TouchableOpacity
                key={assignment.id}
                style={[styles.assignmentItem, { backgroundColor: colors.surfaceVariant }, size === "compact" && styles.compactItem, shouldHighlight && { borderLeftWidth: 3, borderLeftColor: statusColors.text }]}
                activeOpacity={0.7}
                onPress={() => handleItemPress(assignment, index)}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleSection}>
                    <AppText style={[styles.titleText, { color: colors.onSurface }, size === "compact" && styles.compactTitle]} numberOfLines={1}>{assignment.title}</AppText>
                    {showSubject && (
                      <View style={[styles.subjectTag, { backgroundColor: subjectColor + "20" }]}>
                        <AppText style={[styles.subjectText, { color: subjectColor }]}>{assignment.subject}</AppText>
                      </View>
                    )}
                  </View>
                  {showUrgencyBadge && isUrgent && (
                    <View style={[styles.urgencyBadge, { backgroundColor: statusColors.bg }]}>
                      <AppText style={[styles.urgencyText, { color: statusColors.text }]}>{getStatusLabel(assignment.status)}</AppText>
                    </View>
                  )}
                </View>
                {showProgress && (
                  <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: colors.outline + "30" }]}>
                      <View style={[styles.progressFill, { width: `${assignment.progress}%`, backgroundColor: subjectColor }]} />
                    </View>
                    <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>{assignment.progress}%</AppText>
                  </View>
                )}
                <View style={styles.footerRow}>
                  {showDueDate && (
                    <View style={styles.dueRow}>
                      <Icon name="calendar-clock" size={14} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.dueText, { color: colors.onSurfaceVariant }]}>{assignment.dueDate}{showDueTime && assignment.dueTime && ` at ${assignment.dueTime}`}</AppText>
                    </View>
                  )}
                  {showPoints && (
                    <View style={styles.pointsRow}>
                      <Icon name="star" size={14} color="#F59E0B" />
                      <AppText style={[styles.pointsText, { color: colors.onSurfaceVariant }]}>{assignment.points} pts</AppText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {assignmentsData.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.assignments.actions.viewAll", { defaultValue: "View all ({{count}})", count: assignmentsData.length })}
          </AppText>
          <Icon name="arrow-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Layout containers
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timelineContainer: { position: "relative", paddingLeft: 16 },
  timelineLine: { position: "absolute", left: 5, top: 8, bottom: 8, width: 2, borderRadius: 1 },
  // List item
  assignmentItem: { padding: 12, borderRadius: 10, gap: 10 },
  compactItem: { padding: 10, gap: 8 },
  // Card item
  cardItem: { width: 160, borderRadius: 12, padding: 14, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "600" },
  cardSubjectText: { fontSize: 10, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  cardDue: { fontSize: 10 },
  cardPoints: { fontSize: 10 },
  // Grid item
  gridItem: { width: "48%", padding: 10, borderRadius: 10, gap: 6 },
  gridTitle: { fontSize: 12, fontWeight: "600" },
  gridSubjectText: { fontSize: 10, fontWeight: "600" },
  gridDue: { fontSize: 10 },
  // Timeline item
  timelineItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: "#fff", marginRight: 8, marginTop: 4, marginLeft: -8 },
  timelineContent: { flex: 1, padding: 10, borderRadius: 8 },
  timelineFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  // Common
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  titleSection: { flex: 1, gap: 6 },
  titleText: { fontSize: 14, fontWeight: "600" },
  compactTitle: { fontSize: 13 },
  subjectTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { fontSize: 11, fontWeight: "600" },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  urgencyText: { fontSize: 10, fontWeight: "600" },
  progressSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500", width: 32, textAlign: "right" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dueText: { fontSize: 12 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pointsText: { fontSize: 12, fontWeight: "500" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  skeletonItem: { height: 90, borderRadius: 10 },
  emptyContainer: { alignItems: "center", padding: 20, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
});
