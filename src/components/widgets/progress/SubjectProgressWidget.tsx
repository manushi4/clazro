/**
 * Subject Progress Widget (progress.subject-wise)
 * 
 * Shows detailed progress breakdown by subject with chapters
 * Supports list, cards, and grid layouts
 * Follows WIDGET_DEVELOPMENT_GUIDE.md patterns
 */

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
import { useSubjectProgressQuery, type SubjectDetailedProgress } from "../../../hooks/queries/useSubjectProgressQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "progress.subject-wise";

const ProgressBar: React.FC<{ progress: number; color: string; bgColor: string; height?: number }> = ({
  progress,
  color,
  bgColor,
  height = 6,
}) => (
  <View style={[styles.progressBarBg, { backgroundColor: bgColor, height }]}>
    <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color, height }]} />
  </View>
);

export const SubjectProgressWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();

  // Fetch subject progress data
  const { data: subjects, isLoading, error, refetch } = useSubjectProgressQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Resolve colors from theme
  const getColor = (colorKey: string | undefined) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey || 'primary'] || colors.primary;
  };

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const maxSubjects = (config?.maxSubjects as number) || (size === "compact" ? 3 : size === "expanded" ? 8 : 5);
  const showChapters = config?.showChapters !== false && size !== "compact";
  const showStats = config?.showStats !== false;
  const showProgressBar = config?.showProgressBar !== false;
  const showPercentage = config?.showPercentage !== false;
  const showLastActivity = config?.showLastActivity !== false && size === "expanded";
  const sortBy = (config?.sortBy as string) || "progress";
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll !== false;

  // Handle navigation
  const handleSubjectPress = (subject: SubjectDetailedProgress) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.id } });
    onNavigate?.(`progress/${subject.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("progress");
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.subjectProgress.states.loading")}
        </AppText>
      </View>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.onSurface }]}>
          {t("widgets.subjectProgress.states.error")}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
          activeOpacity={0.7}
        >
          <AppText style={[styles.retryButtonText, { color: colors.onPrimary }]}>
            {t("widgets.subjectProgress.actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Empty state
  if (!subjects || !subjects.length) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Icon name="book-open-variant" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.subjectProgress.states.empty")}
        </AppText>
      </View>
    );
  }

  // Sort subjects
  const sortedSubjects = [...subjects]
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getLocalizedField(a, 'title').localeCompare(getLocalizedField(b, 'title'));
        case "recent":
          return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime();
        case "progress":
        default:
          return b.progress_percentage - a.progress_percentage;
      }
    })
    .slice(0, maxSubjects);

  // Format relative time
  const formatLastActivity = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return t("widgets.subjectProgress.labels.justNow");
    if (diffHours < 24) return t("widgets.subjectProgress.labels.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t("widgets.subjectProgress.labels.daysAgo", { count: diffDays });
  };

  // Render subject item for list layout
  const renderListItem = (subject: SubjectDetailedProgress) => {
    const subjectColor = getColor(subject.color);
    const subjectName = getLocalizedField(subject, 'title');

    return (
      <TouchableOpacity
        key={subject.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => enableTap && handleSubjectPress(subject)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={styles.listHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: `${subjectColor}20` }]}>
            <Icon name={subject.icon || "book"} size={18} color={subjectColor} />
          </View>
          <View style={styles.listHeaderText}>
            <AppText style={[styles.subjectName, { color: colors.onSurface }]}>{subjectName}</AppText>
            {showStats && (
              <AppText style={[styles.subjectStats, { color: colors.onSurfaceVariant }]}>
                {subject.chapters_completed}/{subject.total_chapters} {t("widgets.subjectProgress.labels.chapters")}
              </AppText>
            )}
          </View>
          {showPercentage && (
            <AppText style={[styles.percentageText, { color: subjectColor }]}>
              {subject.progress_percentage}%
            </AppText>
          )}
        </View>
        {showProgressBar && (
          <ProgressBar
            progress={subject.progress_percentage}
            color={subjectColor}
            bgColor={`${colors.outline}30`}
          />
        )}
        {showLastActivity && subject.last_activity && (
          <AppText style={[styles.lastActivity, { color: colors.onSurfaceVariant }]}>
            {t("widgets.subjectProgress.labels.lastStudied")}: {formatLastActivity(subject.last_activity)}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  // Render subject card for cards layout
  const renderCardItem = (subject: SubjectDetailedProgress) => {
    const subjectColor = getColor(subject.color);
    const subjectName = getLocalizedField(subject, 'title');

    return (
      <TouchableOpacity
        key={subject.id}
        style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => enableTap && handleSubjectPress(subject)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.cardCircle, { borderColor: subjectColor }]}>
          <AppText style={[styles.cardPercent, { color: subjectColor }]}>
            {subject.progress_percentage}%
          </AppText>
        </View>
        <AppText style={[styles.cardName, { color: colors.onSurface }]} numberOfLines={1}>
          {subjectName}
        </AppText>
        {showStats && (
          <AppText style={[styles.cardStats, { color: colors.onSurfaceVariant }]}>
            {subject.chapters_completed}/{subject.total_chapters}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  // Render subject for grid layout
  const renderGridItem = (subject: SubjectDetailedProgress) => {
    const subjectColor = getColor(subject.color);
    const subjectName = getLocalizedField(subject, 'title');

    return (
      <TouchableOpacity
        key={subject.id}
        style={[styles.gridItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => enableTap && handleSubjectPress(subject)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={styles.gridHeader}>
          <Icon name={subject.icon || "book"} size={16} color={subjectColor} />
          {showPercentage && (
            <AppText style={[styles.gridPercent, { color: subjectColor }]}>
              {subject.progress_percentage}%
            </AppText>
          )}
        </View>
        <AppText style={[styles.gridName, { color: colors.onSurface }]} numberOfLines={1}>
          {subjectName}
        </AppText>
        {showProgressBar && (
          <ProgressBar
            progress={subject.progress_percentage}
            color={subjectColor}
            bgColor={`${colors.outline}30`}
            height={4}
          />
        )}
        {showStats && (
          <AppText style={[styles.gridStats, { color: colors.onSurfaceVariant }]}>
            {subject.chapters_completed}/{subject.total_chapters} {t("widgets.subjectProgress.labels.ch")}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  // 4. Success state - render content
  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline")}
          </AppText>
        </View>
      )}

      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {sortedSubjects.map(renderCardItem)}
        </ScrollView>
      )}

      {/* Grid layout - 2 columns */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {sortedSubjects.map(renderGridItem)}
        </View>
      )}

      {/* Default list layout */}
      {(layoutStyle === "list" || !["cards", "grid"].includes(layoutStyle)) && (
        <View style={styles.listContainer}>
          {sortedSubjects.map(renderListItem)}
        </View>
      )}

      {/* View All button */}
      {showViewAll && subjects.length > maxSubjects && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
          onPress={handleViewAll}
          activeOpacity={0.7}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.subjectProgress.actions.viewAll", { count: subjects.length })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { gap: 12 },
  // Loading state
  loadingContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { fontSize: 13, marginTop: 8 },
  // Error state
  errorContainer: { alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 14, textAlign: "center", marginVertical: 8 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryButtonText: { fontSize: 13, fontWeight: "600" },
  // Empty state
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 8 },
  // Offline badge
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  // Layout containers
  listContainer: { gap: 10 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // List item
  listItem: { padding: 14, borderRadius: 12, gap: 10 },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  listHeaderText: { flex: 1 },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  subjectName: { fontSize: 14, fontWeight: "600" },
  subjectStats: { fontSize: 12, marginTop: 2 },
  percentageText: { fontSize: 16, fontWeight: "700" },
  lastActivity: { fontSize: 11, marginTop: 4 },
  // Card item
  cardItem: { width: 110, padding: 14, borderRadius: 14, alignItems: "center", gap: 8 },
  cardCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  cardPercent: { fontSize: 15, fontWeight: "700" },
  cardName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  cardStats: { fontSize: 10 },
  // Grid item
  gridItem: { width: "48%", padding: 12, borderRadius: 12, gap: 6 },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridName: { fontSize: 13, fontWeight: "600" },
  gridPercent: { fontSize: 13, fontWeight: "700" },
  gridStats: { fontSize: 10, marginTop: 2 },
  // Progress bar
  progressBarBg: { borderRadius: 3, overflow: "hidden" },
  progressBarFill: { borderRadius: 3 },
  // View all button
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
