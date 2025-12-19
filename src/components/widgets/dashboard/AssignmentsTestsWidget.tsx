import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useAssignmentsTestsQuery, type AssignmentOrTest, type AssignmentItem, type TestItem } from "../../../hooks/queries/useAssignmentsTestsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { useDemoUser } from "../../../hooks/useDemoUser";

const WIDGET_ID = "assignments.pending";

type FilterType = 'all' | 'assignment' | 'test';

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
  const { userId } = useDemoUser();
  
  // Filter state
  const [filter, setFilter] = useState<FilterType>((config?.filterType as FilterType) || 'all');
  
  // Fetch combined assignments and tests with student attempt status
  const { data: items, isLoading } = useAssignmentsTestsQuery(10, filter, userId);

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Size-aware config
  const maxItems = (config?.maxItems as number) || (size === "compact" ? 2 : size === "expanded" ? 6 : 4);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showSubject = config?.showSubject !== false;
  const showDueDate = config?.showDueDate !== false;
  const showDueTime = config?.showDueTime === true || size === "expanded";
  const showPoints = config?.showPoints !== false;
  const showUrgencyBadge = config?.showUrgencyBadge !== false;
  const highlightOverdue = config?.highlightOverdue !== false;
  const highlightDueToday = config?.highlightDueToday !== false;
  const showFilter = config?.showFilter !== false;
  const showTypeBadge = config?.showTypeBadge !== false;

  // Transform data for display
  const displayItems = items?.slice(0, maxItems).map(item => {
    const isTest = item.type === 'test';
    const testItem = item as TestItem;
    const dateField = isTest ? testItem.scheduled_at : (item as AssignmentItem).due_date;
    
    return {
      id: item.id,
      type: item.type,
      title: getLocalizedField(item, 'title'),
      subject: item.subject ? getLocalizedField(item.subject, 'title') : null,
      subjectColor: item.subject?.color || colors.primary,
      dueDate: dateField ? formatDueDate(dateField, t) : t("widgets.assignments.labels.noDue", { defaultValue: "No date" }),
      dueTime: dateField ? formatDueTime(dateField) : "",
      points: item.max_score,
      status: getDueStatus(dateField),
      testType: isTest ? testItem.test_type : null,
      duration: isTest ? testItem.duration_minutes : null,
      isOnline: isTest ? testItem.is_online : false,
      attemptStatus: isTest ? testItem.attempt_status : undefined,
      attemptId: isTest ? testItem.attempt_id : undefined,
      attemptScore: isTest ? testItem.attempt_score : undefined,
      attemptPercentage: isTest ? testItem.attempt_percentage : undefined,
    };
  }) || [];

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

  const getTypeIcon = (type: string, testType?: string | null) => {
    if (type === 'test') {
      switch (testType) {
        case 'quiz': return 'help-circle';
        case 'unit_test': return 'file-document';
        case 'final': return 'school';
        case 'practice': return 'pencil';
        default: return 'clipboard-check';
      }
    }
    return 'clipboard-text';
  };

  const getTypeLabel = (type: string, testType?: string | null) => {
    if (type === 'test') {
      switch (testType) {
        case 'quiz': return t("widgets.assignments.types.quiz", { defaultValue: "Quiz" });
        case 'unit_test': return t("widgets.assignments.types.unitTest", { defaultValue: "Unit Test" });
        case 'final': return t("widgets.assignments.types.final", { defaultValue: "Final" });
        case 'practice': return t("widgets.assignments.types.practice", { defaultValue: "Practice" });
        case 'mock': return t("widgets.assignments.types.mock", { defaultValue: "Mock" });
        default: return t("widgets.assignments.types.test", { defaultValue: "Test" });
      }
    }
    return t("widgets.assignments.types.assignment", { defaultValue: "Assignment" });
  };

  const handleItemPress = (item: any, index: number) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", itemId: item.id, itemType: item.type, position: index });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { itemId: item.id, itemType: item.type } });
    
    if (item.type === 'test') {
      onNavigate?.("test-detail", { testId: item.id });
    } else {
      onNavigate?.("assignment-detail", { assignmentId: item.id });
    }
  };

  const handleTestAction = (item: any, action: 'attempt' | 'review') => {
    trackWidgetEvent(WIDGET_ID, "click", { action: `test_${action}`, itemId: item.id });
    
    if (action === 'attempt') {
      // Navigate to test attempt screen
      onNavigate?.("test-attempt", { testId: item.id });
    } else {
      // Navigate to test review screen (need attemptId)
      if (item.attemptId) {
        onNavigate?.("test-review", { testId: item.id, attemptId: item.attemptId });
      } else {
        // If no attempt yet, go to test detail
        onNavigate?.("test-detail", { testId: item.id });
      }
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    if (filter === 'test') {
      onNavigate?.("test-center");
    } else {
      onNavigate?.("assignments-home");
    }
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
  if (!displayItems?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="clipboard-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {filter === 'test' 
            ? t("widgets.assignments.states.noTests", { defaultValue: "No upcoming tests" })
            : filter === 'assignment'
            ? t("widgets.assignments.states.noAssignments", { defaultValue: "No pending assignments" })
            : t("widgets.assignments.states.empty", { defaultValue: "No pending items" })}
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

      {/* Filter tabs */}
      {showFilter && (
        <View style={styles.filterContainer}>
          {(['all', 'assignment', 'test'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                { backgroundColor: filter === f ? colors.primary : colors.surfaceVariant },
              ]}
              onPress={() => setFilter(f)}
            >
              <AppText style={[styles.filterText, { color: filter === f ? "#fff" : colors.onSurfaceVariant }]}>
                {f === 'all' ? t("widgets.assignments.filter.all", { defaultValue: "All" })
                  : f === 'assignment' ? t("widgets.assignments.filter.assignments", { defaultValue: "Assignments" })
                  : t("widgets.assignments.filter.tests", { defaultValue: "Tests" })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List layout */}
      <View style={styles.listContainer}>
        {displayItems.map((item, index) => {
          const statusColors = getStatusColor(item.status);
          const isUrgent = item.status === "overdue" || item.status === "due-today";
          const shouldHighlight = (highlightOverdue && item.status === "overdue") || (highlightDueToday && item.status === "due-today");
          const typeColor = item.type === 'test' ? colors.tertiary : colors.primary;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: colors.surfaceVariant },
                shouldHighlight && { borderLeftWidth: 3, borderLeftColor: statusColors.text },
              ]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(item, index)}
            >
              <View style={styles.itemHeader}>
                {/* Type icon */}
                <View style={[styles.typeIcon, { backgroundColor: typeColor + "20" }]}>
                  <Icon name={getTypeIcon(item.type, item.testType)} size={18} color={typeColor} />
                </View>
                
                <View style={styles.itemContent}>
                  {/* Title row */}
                  <View style={styles.titleRow}>
                    <AppText style={[styles.titleText, { color: colors.onSurface }]} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    {showUrgencyBadge && isUrgent && (
                      <View style={[styles.urgencyBadge, { backgroundColor: statusColors.bg }]}>
                        <AppText style={[styles.urgencyText, { color: statusColors.text }]}>
                          {getStatusLabel(item.status)}
                        </AppText>
                      </View>
                    )}
                  </View>
                  
                  {/* Meta row */}
                  <View style={styles.metaRow}>
                    {showTypeBadge && (
                      <View style={[styles.typeBadge, { backgroundColor: typeColor + "15" }]}>
                        <AppText style={[styles.typeText, { color: typeColor }]}>
                          {getTypeLabel(item.type, item.testType)}
                        </AppText>
                      </View>
                    )}
                    {showSubject && item.subject && (
                      <View style={[styles.subjectTag, { backgroundColor: item.subjectColor + "20" }]}>
                        <AppText style={[styles.subjectText, { color: item.subjectColor }]}>
                          {item.subject}
                        </AppText>
                      </View>
                    )}
                  </View>
                  
                  {/* Footer row */}
                  <View style={styles.footerRow}>
                    {showDueDate && (
                      <View style={styles.dueRow}>
                        <Icon name="calendar-clock" size={14} color={colors.onSurfaceVariant} />
                        <AppText style={[styles.dueText, { color: colors.onSurfaceVariant }]}>
                          {item.dueDate}{showDueTime && item.dueTime && ` at ${item.dueTime}`}
                        </AppText>
                      </View>
                    )}
                    {item.type === 'test' && item.duration && (
                      <View style={styles.durationRow}>
                        <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                        <AppText style={[styles.durationText, { color: colors.onSurfaceVariant }]}>
                          {item.duration} min
                        </AppText>
                      </View>
                    )}
                    {showPoints && (
                      <View style={styles.pointsRow}>
                        <Icon name="star" size={14} color="#F59E0B" />
                        <AppText style={[styles.pointsText, { color: colors.onSurfaceVariant }]}>
                          {item.points} pts
                        </AppText>
                      </View>
                    )}
                  </View>

                  {/* Test Action Buttons */}
                  {item.type === 'test' && (
                    <View style={styles.testActionsRow}>
                      {/* Score badge - show for any attempted test (online or offline) */}
                      {(item.attemptStatus === 'submitted' || item.attemptStatus === 'graded') && item.attemptScore !== undefined && (
                        <View style={[styles.scoreBadge, { backgroundColor: (item.attemptPercentage ?? 0) >= 50 ? '#10B98120' : '#EF444420' }]}>
                          <Icon name="check-circle" size={14} color={(item.attemptPercentage ?? 0) >= 50 ? '#10B981' : '#EF4444'} />
                          <AppText style={[styles.scoreText, { color: (item.attemptPercentage ?? 0) >= 50 ? '#10B981' : '#EF4444' }]}>
                            {item.attemptScore}/{item.points} ({item.attemptPercentage}%)
                          </AppText>
                        </View>
                      )}
                      
                      {/* Review button - show for any attempted test (online or offline) */}
                      {(item.attemptStatus === 'submitted' || item.attemptStatus === 'graded') && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
                          onPress={(e) => { e.stopPropagation(); handleTestAction(item, 'review'); }}
                        >
                          <Icon name="eye" size={14} color={colors.primary} />
                          <AppText style={[styles.actionButtonText, { color: colors.primary }]}>
                            {t("widgets.assignments.actions.review", { defaultValue: "Review" })}
                          </AppText>
                        </TouchableOpacity>
                      )}
                      
                      {/* Attempt/Continue button - only for online tests not yet submitted */}
                      {item.isOnline && item.attemptStatus !== 'submitted' && item.attemptStatus !== 'graded' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primary }]}
                          onPress={(e) => { e.stopPropagation(); handleTestAction(item, 'attempt'); }}
                        >
                          <Icon name="play" size={14} color="#fff" />
                          <AppText style={[styles.actionButtonText, { color: "#fff" }]}>
                            {item.attemptStatus === 'in_progress' 
                              ? t("widgets.assignments.actions.continue", { defaultValue: "Continue" })
                              : t("widgets.assignments.actions.attempt", { defaultValue: "Attempt" })}
                          </AppText>
                        </TouchableOpacity>
                      )}
                      
                      {/* Offline badge - only for offline tests not yet attempted */}
                      {!item.isOnline && item.attemptStatus !== 'submitted' && item.attemptStatus !== 'graded' && (
                        <View style={[styles.offlineTestBadge, { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.outline }]}>
                          <Icon name="file-document-outline" size={14} color={colors.onSurfaceVariant} />
                          <AppText style={[styles.actionButtonText, { color: colors.onSurfaceVariant }]}>
                            {t("widgets.assignments.actions.offline", { defaultValue: "Offline" })}
                          </AppText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View all button */}
      {items && items.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.assignments.actions.viewAll", { defaultValue: "View all ({{count}})", count: items.length })}
          </AppText>
          <Icon name="arrow-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContainer: { gap: 8 },
  itemCard: {
    padding: 12,
    borderRadius: 10,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  subjectTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: "600",
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueText: {
    fontSize: 11,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 11,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
  skeletonItem: {
    height: 80,
    borderRadius: 10,
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  offlineText: {
    fontSize: 10,
    fontWeight: "500",
  },
  testActionsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  offlineTestBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
});
