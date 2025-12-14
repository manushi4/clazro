import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildProgressQuery, SubjectProgress } from "../../../hooks/queries/parent/useChildProgressQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.child-progress";

export const ChildProgressWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: childrenProgress, isLoading, error } = useChildProgressQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxSubjects = (config?.maxSubjects as number) || 4;
  const showOverallProgress = config?.showOverallProgress !== false;
  const showHoursStudied = config?.showHoursStudied !== false;
  const showTestStats = config?.showTestStats !== false;
  const showProgressBar = config?.showProgressBar !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";
  const enableTap = config?.enableTap !== false;

  const getSubjectColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary || colors.primary,
      tertiary: colors.tertiary || colors.info,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  const handleSubjectPress = (subject: SubjectProgress, childId: string) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.subject_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.subject_id } });
    onNavigate?.(`subject-progress/${subject.subject_id}`, { childId });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-progress-detail");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childProgress.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.childProgress.states.error")}
        </AppText>
      </View>
    );
  }

  if (!childrenProgress || childrenProgress.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chart-line" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.childProgress.states.empty")}
        </AppText>
      </View>
    );
  }

  // For now, show first child's progress (can be extended for child selector)
  const childData = childrenProgress[0];
  const displaySubjects = childData.subjects.slice(0, maxSubjects);
  const isCompact = size === "compact";

  const renderProgressBar = (progress: number, color: string) => (
    <View style={[styles.progressBarBg, { backgroundColor: `${color}20` }]}>
      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  const renderSubjectItem = (subject: SubjectProgress, index: number) => {
    const subjectColor = getSubjectColor(subject.color);

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={subject.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={() => handleSubjectPress(subject, childData.child_user_id)}
          disabled={!enableTap}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIconWrapper, { backgroundColor: `${subjectColor}15` }]}>
            <Icon name={subject.icon} size={22} color={subjectColor} />
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(subject, "title")}
          </AppText>
          <AppText style={[styles.cardProgress, { color: subjectColor }]}>
            {subject.progress_percentage}%
          </AppText>
          {showProgressBar && renderProgressBar(subject.progress_percentage, subjectColor)}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={subject.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
          onPress={() => handleSubjectPress(subject, childData.child_user_id)}
          disabled={!enableTap}
          activeOpacity={0.7}
        >
          <Icon name={subject.icon} size={18} color={subjectColor} />
          <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(subject, "title")}
          </AppText>
          <AppText style={[styles.compactProgress, { color: subjectColor }]}>
            {subject.progress_percentage}%
          </AppText>
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={subject.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        onPress={() => handleSubjectPress(subject, childData.child_user_id)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.listIconWrapper, { backgroundColor: `${subjectColor}15` }]}>
          <Icon name={subject.icon} size={20} color={subjectColor} />
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <AppText style={[styles.listTitle, { color: colors.onSurface }]}>
              {getLocalizedField(subject, "title")}
            </AppText>
            <AppText style={[styles.listProgress, { color: subjectColor }]}>
              {subject.progress_percentage}%
            </AppText>
          </View>
          {showProgressBar && renderProgressBar(subject.progress_percentage, subjectColor)}
          {showTestStats && !isCompact && (
            <View style={styles.listStats}>
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.childProgress.chapters", { completed: subject.chapters_completed, total: subject.total_chapters })}
              </AppText>
              <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.childProgress.tests", { passed: subject.tests_passed, total: subject.total_tests })}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Progress Summary */}
      {showOverallProgress && !isCompact && (
        <View style={[styles.summaryCard, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <View style={styles.summaryMain}>
            <View style={styles.overallCircle}>
              <AppText style={[styles.overallPercent, { color: colors.primary }]}>
                {childData.overall_progress}%
              </AppText>
              <AppText style={[styles.overallLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.childProgress.overall")}
              </AppText>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Icon name="book-multiple" size={16} color={colors.info} />
                <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
                  {childData.total_subjects}
                </AppText>
                <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.childProgress.subjects")}
                </AppText>
              </View>
              {showHoursStudied && (
                <View style={styles.summaryStatItem}>
                  <Icon name="clock-outline" size={16} color={colors.success} />
                  <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
                    {childData.total_hours.toFixed(1)}h
                  </AppText>
                  <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.childProgress.studied")}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Subject List */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displaySubjects.map((subject, index) => renderSubjectItem(subject, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displaySubjects.map((subject, index) => renderSubjectItem(subject, index))}
        </View>
      )}

      {/* View All Button */}
      {childData.subjects.length > maxSubjects && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.childProgress.actions.viewAll", { count: childData.subjects.length })}
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
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  // Summary card
  summaryCard: { padding: 16, marginBottom: 4 },
  summaryMain: { flexDirection: "row", alignItems: "center", gap: 20 },
  overallCircle: { alignItems: "center" },
  overallPercent: { fontSize: 28, fontWeight: "700" },
  overallLabel: { fontSize: 11, marginTop: 2 },
  summaryStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  summaryStatItem: { alignItems: "center", gap: 4 },
  summaryStatValue: { fontSize: 16, fontWeight: "600" },
  summaryStatLabel: { fontSize: 10 },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", padding: 12, gap: 12 },
  listIconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 6 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listTitle: { fontSize: 14, fontWeight: "600" },
  listProgress: { fontSize: 14, fontWeight: "700" },
  listStats: { flexDirection: "row", gap: 12 },
  statText: { fontSize: 11 },
  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: { width: 120, padding: 14, alignItems: "center", gap: 8 },
  cardIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  cardProgress: { fontSize: 18, fontWeight: "700" },
  // Compact layout
  compactItem: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
  compactTitle: { flex: 1, fontSize: 13, fontWeight: "500" },
  compactProgress: { fontSize: 13, fontWeight: "700" },
  // Progress bar
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
