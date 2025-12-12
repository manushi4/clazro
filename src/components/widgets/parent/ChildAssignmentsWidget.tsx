import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildAssignmentsQuery, ChildAssignment } from "../../../hooks/queries/parent/useChildAssignmentsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.assignments-pending";

export const ChildAssignmentsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: assignments, isLoading, error } = useChildAssignmentsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = parseInt(config?.maxItems as string) || 5;
  const showSubject = config?.showSubject !== false;
  const showDueDate = config?.showDueDate !== false;
  const showPoints = config?.showPoints !== false;
  const showType = config?.showType !== false;
  const showOverdueBadge = config?.showOverdueBadge !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'homework': return 'book-open-variant';
      case 'project': return 'folder-star';
      case 'quiz': return 'help-circle';
      case 'test': return 'file-document-check';
      default: return 'clipboard-text';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'homework': return colors.primary;
      case 'project': return colors.tertiary || colors.info;
      case 'quiz': return colors.warning;
      case 'test': return colors.error;
      default: return colors.primary;
    }
  };

  const formatDueDate = (assignment: ChildAssignment): string => {
    if (assignment.is_overdue) {
      const days = Math.abs(assignment.days_until_due);
      return t("widgets.assignmentsPending.labels.daysOverdue", { days });
    }
    if (assignment.days_until_due === 0) {
      return t("widgets.assignmentsPending.labels.dueToday");
    }
    if (assignment.days_until_due === 1) {
      return t("widgets.assignmentsPending.labels.dueTomorrow");
    }
    return t("widgets.assignmentsPending.labels.dueInDays", { days: assignment.days_until_due });
  };

  const handleAssignmentPress = (assignment: ChildAssignment) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "assignment_tap", assignmentId: assignment.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_assignment_tap`, level: "info", data: { assignmentId: assignment.id } });
    onNavigate?.(`assignment-detail/${assignment.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-assignments");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.assignmentsPending.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.assignmentsPending.states.error")}
        </AppText>
      </View>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="clipboard-check" size={40} color={colors.success} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.assignmentsPending.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.assignmentsPending.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const isCompact = size === "compact" || compactMode;
  const displayAssignments = assignments.slice(0, maxItems);
  const overdueCount = assignments.filter(a => a.is_overdue).length;


  const renderListItem = (assignment: ChildAssignment, index: number) => {
    const typeColor = getTypeColor(assignment.assignment_type);

    return (
      <TouchableOpacity
        key={`${assignment.id}-${assignment.child_user_id}`}
        style={[
          styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          assignment.is_overdue && { borderLeftWidth: 3, borderLeftColor: colors.error },
        ]}
        onPress={() => handleAssignmentPress(assignment)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${typeColor}15` }]}>
          <Icon name={getTypeIcon(assignment.assignment_type)} size={20} color={typeColor} />
        </View>
        <View style={styles.contentWrapper}>
          <View style={styles.titleRow}>
            <AppText style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(assignment, 'title')}
            </AppText>
            {showOverdueBadge && assignment.is_overdue && (
              <View style={[styles.overdueBadge, { backgroundColor: colors.errorContainer }]}>
                <AppText style={[styles.overdueBadgeText, { color: colors.error }]}>
                  {t("widgets.assignmentsPending.labels.overdue")}
                </AppText>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            {showSubject && (
              <View style={styles.metaItem}>
                <Icon name="book-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {assignment.subject_name}
                </AppText>
              </View>
            )}
            {showDueDate && (
              <View style={styles.metaItem}>
                <Icon 
                  name="clock-outline" 
                  size={12} 
                  color={assignment.is_overdue ? colors.error : colors.onSurfaceVariant} 
                />
                <AppText 
                  style={[
                    styles.metaText, 
                    { color: assignment.is_overdue ? colors.error : colors.onSurfaceVariant }
                  ]}
                >
                  {formatDueDate(assignment)}
                </AppText>
              </View>
            )}
            {showPoints && (
              <View style={styles.metaItem}>
                <Icon name="star-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {assignment.max_score} pts
                </AppText>
              </View>
            )}
          </View>
        </View>
        {enableTap && (
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  const renderCardItem = (assignment: ChildAssignment, index: number) => {
    const typeColor = getTypeColor(assignment.assignment_type);

    return (
      <TouchableOpacity
        key={`${assignment.id}-${assignment.child_user_id}`}
        style={[
          styles.cardItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          assignment.is_overdue && { borderTopWidth: 3, borderTopColor: colors.error },
        ]}
        onPress={() => handleAssignmentPress(assignment)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIconWrapper, { backgroundColor: `${typeColor}15` }]}>
          <Icon name={getTypeIcon(assignment.assignment_type)} size={24} color={typeColor} />
        </View>
        <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
          {getLocalizedField(assignment, 'title')}
        </AppText>
        {showSubject && (
          <AppText style={[styles.cardSubject, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {assignment.subject_name}
          </AppText>
        )}
        <View style={[styles.cardDueBadge, { backgroundColor: assignment.is_overdue ? colors.errorContainer : `${colors.primary}15` }]}>
          <AppText style={[styles.cardDueText, { color: assignment.is_overdue ? colors.error : colors.primary }]}>
            {formatDueDate(assignment)}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompactItem = (assignment: ChildAssignment, index: number) => {
    const typeColor = getTypeColor(assignment.assignment_type);

    return (
      <TouchableOpacity
        key={`${assignment.id}-${assignment.child_user_id}`}
        style={[styles.compactItem, { borderBottomColor: colors.outline }]}
        onPress={() => handleAssignmentPress(assignment)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <Icon name={getTypeIcon(assignment.assignment_type)} size={16} color={typeColor} />
        <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {getLocalizedField(assignment, 'title')}
        </AppText>
        <AppText 
          style={[
            styles.compactDue, 
            { color: assignment.is_overdue ? colors.error : colors.onSurfaceVariant }
          ]}
        >
          {formatDueDate(assignment)}
        </AppText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overdue Alert Banner */}
      {overdueCount > 0 && showOverdueBadge && (
        <View style={[styles.alertBanner, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.small }]}>
          <Icon name="alert" size={16} color={colors.error} />
          <AppText style={[styles.alertText, { color: colors.error }]}>
            {t("widgets.assignmentsPending.overdueCount", { count: overdueCount })}
          </AppText>
        </View>
      )}

      {/* Assignments List */}
      {layoutStyle === "cards" ? (
        <View style={styles.cardsContainer}>
          {displayAssignments.map((assignment, index) => renderCardItem(assignment, index))}
        </View>
      ) : layoutStyle === "compact" ? (
        <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          {displayAssignments.map((assignment, index) => renderCompactItem(assignment, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayAssignments.map((assignment, index) => renderListItem(assignment, index))}
        </View>
      )}

      {/* View All Button */}
      {assignments.length > maxItems && enableTap && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.assignmentsPending.actions.viewAll", { count: assignments.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
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
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  // Alert banner
  alertBanner: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  alertText: { fontSize: 13, fontWeight: "500" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 14, fontWeight: "600", flex: 1 },
  overdueBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  overdueBadgeText: { fontSize: 10, fontWeight: "600" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, alignItems: "center", gap: 8 },
  cardIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  cardSubject: { fontSize: 11, textAlign: "center" },
  cardDueBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  cardDueText: { fontSize: 10, fontWeight: "600" },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactTitle: { flex: 1, fontSize: 13 },
  compactDue: { fontSize: 11 },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
