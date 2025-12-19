/**
 * Study Groups Widget (study.groups)
 * Displays study groups the user belongs to or can join
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useStudyGroupsQuery, StudyGroup, GroupType } from "../../../hooks/queries/useStudyGroupsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "study.groups";

export const StudyGroupsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  const maxItems = (config?.maxItems as number) || 5;
  const { data, isLoading, error, refetch } = useStudyGroupsQuery(maxItems);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showMemberCount = config?.showMemberCount !== false;
  const showSubject = config?.showSubject !== false;
  const showNextMeeting = config?.showNextMeeting !== false;
  const showGroupType = config?.showGroupType !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;
  const filterType = (config?.filterType as string) || "all";
  const showMyGroupsOnly = config?.showMyGroupsOnly === true;


  // Group type icons and colors
  const getGroupTypeConfig = (type: GroupType) => {
    const configs: Record<GroupType, { icon: string; color: string; label: string }> = {
      study: { icon: "book-open-variant", color: colors.primary, label: t("widgets.studyGroups.types.study", "Study") },
      project: { icon: "clipboard-text", color: colors.tertiary, label: t("widgets.studyGroups.types.project", "Project") },
      exam_prep: { icon: "school", color: colors.warning, label: t("widgets.studyGroups.types.examPrep", "Exam Prep") },
      homework: { icon: "pencil", color: colors.info, label: t("widgets.studyGroups.types.homework", "Homework") },
      discussion: { icon: "forum", color: colors.secondary, label: t("widgets.studyGroups.types.discussion", "Discussion") },
      tutoring: { icon: "account-star", color: colors.success, label: t("widgets.studyGroups.types.tutoring", "Tutoring") },
    };
    return configs[type] || configs.study;
  };

  const getColorFromKey = (colorKey: string) => {
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

  const getGroupName = (group: StudyGroup) => {
    return getLocalizedField({ name_en: group.nameEn, name_hi: group.nameHi }, 'name');
  };

  const getGroupDescription = (group: StudyGroup) => {
    return getLocalizedField({ description_en: group.descriptionEn, description_hi: group.descriptionHi }, 'description');
  };

  const getSubjectName = (group: StudyGroup) => {
    if (!group.subjectNameEn) return null;
    return getLocalizedField({ subject_name_en: group.subjectNameEn, subject_name_hi: group.subjectNameHi }, 'subject_name');
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("widgets.studyGroups.time.justNow", "Just now");
    if (diffMins < 60) return t("widgets.studyGroups.time.minutesAgo", "{{count}}m ago", { count: diffMins });
    if (diffHours < 24) return t("widgets.studyGroups.time.hoursAgo", "{{count}}h ago", { count: diffHours });
    return t("widgets.studyGroups.time.daysAgo", "{{count}}d ago", { count: diffDays });
  };

  const formatNextMeeting = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return null; // Past meeting
    if (diffHours < 1) return t("widgets.studyGroups.meeting.soon", "Soon");
    if (diffHours < 24) return t("widgets.studyGroups.meeting.inHours", "In {{count}}h", { count: diffHours });
    return t("widgets.studyGroups.meeting.inDays", "In {{count}}d", { count: diffDays });
  };

  const handleGroupPress = (group: StudyGroup) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "group_tap", groupId: group.id, groupType: group.groupType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_group_tap`, level: "info", data: { groupId: group.id } });
    onNavigate?.("study-group", { groupId: group.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("study-groups");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyGroups.states.loading", "Loading groups...")}
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
          {t("widgets.studyGroups.states.error", "Couldn't load groups")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.studyGroups.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.groups.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="account-group" size={32} color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyGroups.states.empty", "No study groups yet")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.studyGroups.states.emptyHint", "Join or create a group to study together!")}
        </AppText>
      </View>
    );
  }


  // Filter groups
  let displayGroups = showMyGroupsOnly ? data.myGroups : data.groups;
  if (filterType !== "all") {
    displayGroups = displayGroups.filter(g => g.groupType === filterType);
  }

  const renderGroup = (group: StudyGroup, index: number) => {
    const typeConfig = getGroupTypeConfig(group.groupType);
    const groupColor = getColorFromKey(group.colorKey);
    const nextMeeting = formatNextMeeting(group.nextMeetingAt);
    const subjectName = getSubjectName(group);
    const isMember = group.userRole !== null;

    return (
      <TouchableOpacity
        key={group.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handleGroupPress(group)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Group icon */}
        <View style={[styles.groupIcon, { backgroundColor: `${groupColor}20` }]}>
          <Icon name={group.iconName} size={compactMode ? 20 : 24} color={groupColor} />
        </View>

        {/* Group info */}
        <View style={styles.groupInfo}>
          <View style={styles.nameRow}>
            <AppText style={[styles.groupName, { color: colors.onSurface }]} numberOfLines={1}>
              {getGroupName(group)}
            </AppText>
            {isMember && (
              <View style={[styles.memberBadge, { backgroundColor: `${colors.success}15` }]}>
                <Icon name="check-circle" size={10} color={colors.success} />
                {!compactMode && (
                  <AppText style={[styles.memberBadgeText, { color: colors.success }]}>
                    {t("widgets.studyGroups.labels.joined", "Joined")}
                  </AppText>
                )}
              </View>
            )}
          </View>

          {/* Subject and type */}
          <View style={styles.metaRow}>
            {showSubject && subjectName && (
              <View style={[styles.subjectTag, { backgroundColor: `${groupColor}15` }]}>
                <AppText style={[styles.subjectText, { color: groupColor }]} numberOfLines={1}>
                  {subjectName}
                </AppText>
              </View>
            )}
            {showGroupType && (
              <View style={[styles.typeTag, { backgroundColor: `${typeConfig.color}15` }]}>
                <Icon name={typeConfig.icon} size={10} color={typeConfig.color} />
                {!compactMode && (
                  <AppText style={[styles.typeText, { color: typeConfig.color }]}>
                    {typeConfig.label}
                  </AppText>
                )}
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {showMemberCount && (
              <View style={styles.statItem}>
                <Icon name="account-multiple" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                  {group.memberCount}/{group.maxMembers}
                </AppText>
              </View>
            )}
            {showNextMeeting && nextMeeting && (
              <View style={styles.statItem}>
                <Icon name="calendar-clock" size={12} color={colors.info} />
                <AppText style={[styles.statText, { color: colors.info }]}>
                  {nextMeeting}
                </AppText>
              </View>
            )}
            {!compactMode && (
              <View style={styles.statItem}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(group.lastActivityAt)}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        {enableTap && (
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Summary */}
      {!compactMode && data.myGroups.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.small }]}>
          <Icon name="account-group" size={16} color={colors.primary} />
          <AppText style={[styles.summaryText, { color: colors.primary }]}>
            {t("widgets.studyGroups.labels.myGroups", "{{count}} groups joined", { count: data.myGroups.length })}
          </AppText>
        </View>
      )}

      {/* Groups */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayGroups.map((group, index) => renderGroup(group, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayGroups.map((group, index) => renderGroup(group, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && data.hasMore && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <Icon name="account-group" size={16} color={colors.primary} />
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.studyGroups.actions.viewAll", "View All Groups")}
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
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  
  // Summary
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  
  // Layout containers
  listContainer: { gap: 10 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  
  // List item
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  
  // Card item
  cardItem: { width: 240, padding: 12, gap: 10 },
  
  // Group icon
  groupIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  
  // Group info
  groupInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupName: { fontSize: 14, fontWeight: "600", flex: 1 },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  memberBadgeText: { fontSize: 9, fontWeight: "500" },
  
  // Meta row
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  subjectTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  subjectText: { fontSize: 10, fontWeight: "500" },
  typeTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: "500" },
  
  // Stats row
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 11 },
  
  // View All
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
