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
import { useProgressQuery, type SubjectProgress } from "../../../hooks/queries/useProgressQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "progress.snapshot";

const ProgressBar: React.FC<{ progress: number; color: string; bgColor: string }> = ({
  progress,
  color,
  bgColor,
}) => (
  <View style={[styles.progressBarBg, { backgroundColor: bgColor }]}>
    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
  </View>
);

export const ProgressSnapshotWidget: React.FC<WidgetProps> = ({ 
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Fetch progress data using query hook
  const { data: progressData, isLoading, error, refetch } = useProgressQuery();

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

  // Build subjects with theme colors
  const subjects = (progressData?.subjects || []).map(item => ({
    ...item,
    name: getLocalizedField(item, 'title'),
    progress: item.progress_percentage,
    color: getColor(item.color),
  }));

  // Size-aware config
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showOverallCircle = config?.showOverallCircle !== false;
  const showPercentage = config?.showPercentage !== false;
  const showChaptersCompleted = config?.showChaptersCompleted !== false && size !== "compact";
  const showHoursStudied = config?.showHoursStudied !== false && size !== "compact";
  const showTestsPassed = config?.showTestsPassed !== false && size !== "compact";
  const showAssignments = config?.showAssignments === true || size === "expanded";
  const showSubjectsConfig = config?.showSubjects !== false && size !== "compact";
  const maxSubjects = (config?.maxSubjects as number) || (size === "compact" ? 2 : size === "expanded" ? 6 : 4);
  const showSubjectPercentage = config?.showSubjectPercentage !== false;
  const overallProgress = progressData?.overall_percentage || 0;

  const visibleStats = [showChaptersCompleted, showHoursStudied, showTestsPassed, showAssignments].filter(Boolean).length;

  const handleSubjectPress = (subject: { id: string; name: string }) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.id } });
    onNavigate?.(`progress/${subject.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("progress");
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.progressSnapshot.states.loading")}
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
          {t("widgets.progressSnapshot.states.error")}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
          activeOpacity={0.7}
        >
          <AppText style={[styles.retryButtonText, { color: colors.onPrimary }]}>
            {t("widgets.progressSnapshot.actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Empty state
  if (!progressData || !subjects.length) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Icon name="chart-line" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.progressSnapshot.states.empty")}
        </AppText>
      </View>
    );
  }

  // 4. Success state - render content
  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>Cached</AppText>
        </View>
      )}

      {/* Overall progress section */}
      <View style={styles.overallSection}>
        {showOverallCircle && (
          <TouchableOpacity 
            style={[styles.progressCircle, { borderColor: colors.primary }]}
            onPress={handleViewAll}
          >
            {showPercentage && (
              <AppText style={[styles.progressValue, { color: colors.primary }]}>
                {overallProgress}%
              </AppText>
            )}
            <AppText style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.progressSnapshot.labels.overall")}
            </AppText>
          </TouchableOpacity>
        )}

        {visibleStats > 0 && (
          <View style={styles.statsColumn}>
            {showChaptersCompleted && (
              <View style={styles.statRow}>
                <Icon name="book-check" size={18} color={colors.success} />
                <AppText style={[styles.statText, { color: colors.onSurface }]}>
                  {progressData.chapters_completed} {t("widgets.progressSnapshot.labels.chapters")}
                </AppText>
              </View>
            )}
            {showHoursStudied && (
              <View style={styles.statRow}>
                <Icon name="clock-check" size={18} color={colors.primary} />
                <AppText style={[styles.statText, { color: colors.onSurface }]}>
                  {progressData.hours_studied} {t("widgets.progressSnapshot.labels.hours")}
                </AppText>
              </View>
            )}
            {showTestsPassed && (
              <View style={styles.statRow}>
                <Icon name="trophy" size={18} color={colors.warning} />
                <AppText style={[styles.statText, { color: colors.onSurface }]}>
                  {progressData.tests_passed} {t("widgets.progressSnapshot.labels.tests")}
                </AppText>
              </View>
            )}
            {showAssignments && (
              <View style={styles.statRow}>
                <Icon name="clipboard-check" size={18} color={colors.tertiary} />
                <AppText style={[styles.statText, { color: colors.onSurface }]}>
                  {progressData.assignments_done} {t("widgets.progressSnapshot.labels.assignments")}
                </AppText>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Subject-wise progress */}
      {showSubjectsConfig && subjects.length > 0 && (
        <View style={styles.subjectsSection}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("widgets.progressSnapshot.labels.subjectProgress")}
          </AppText>
          
          {/* Cards layout - horizontal scroll */}
          {layoutStyle === "cards" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
              {subjects.slice(0, maxSubjects).map((subject) => (
                <TouchableOpacity 
                  key={subject.id} 
                  style={[styles.subjectCard, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => handleSubjectPress(subject)}
                >
                  <View style={[styles.cardCircle, { borderColor: subject.color }]}>
                    <AppText style={[styles.cardPercent, { color: subject.color }]}>{subject.progress}%</AppText>
                  </View>
                  <AppText style={[styles.cardName, { color: colors.onSurface }]} numberOfLines={1}>{subject.name}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Grid layout - 2 columns */}
          {layoutStyle === "grid" && (
            <View style={styles.gridContainer}>
              {subjects.slice(0, maxSubjects).map((subject) => (
                <TouchableOpacity 
                  key={subject.id} 
                  style={[styles.gridItem, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => handleSubjectPress(subject)}
                >
                  <View style={styles.gridHeader}>
                    <AppText style={[styles.gridName, { color: colors.onSurface }]} numberOfLines={1}>{subject.name}</AppText>
                    <AppText style={[styles.gridPercent, { color: subject.color }]}>{subject.progress}%</AppText>
                  </View>
                  <ProgressBar progress={subject.progress} color={subject.color} bgColor={colors.outline + "30"} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Default list layout */}
          {(layoutStyle === "list" || !["cards", "grid"].includes(layoutStyle)) && (
            <View style={styles.listContainer}>
              {subjects.slice(0, maxSubjects).map((subject) => (
                <TouchableOpacity 
                  key={subject.id} 
                  style={styles.subjectRow}
                  onPress={() => handleSubjectPress(subject)}
                >
                  <View style={styles.subjectInfo}>
                    <AppText style={[styles.subjectName, { color: colors.onSurface }]}>{subject.name}</AppText>
                    {showSubjectPercentage && (
                      <AppText style={[styles.subjectPercent, { color: subject.color }]}>{subject.progress}%</AppText>
                    )}
                  </View>
                  <ProgressBar progress={subject.progress} color={subject.color} bgColor={colors.surfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 20 },
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
  // Overall section
  overallSection: { flexDirection: "row", alignItems: "center", gap: 20 },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  progressValue: { fontSize: 22, fontWeight: "700" },
  progressLabel: { fontSize: 11 },
  statsColumn: { flex: 1, gap: 8 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statText: { fontSize: 13 },
  subjectsSection: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  // Layout containers
  listContainer: { gap: 12 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // List item
  subjectRow: { gap: 6 },
  subjectInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectName: { fontSize: 13, fontWeight: "500" },
  subjectPercent: { fontSize: 13, fontWeight: "600" },
  // Card item
  subjectCard: { width: 100, padding: 12, borderRadius: 12, alignItems: "center", gap: 8 },
  cardCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  cardPercent: { fontSize: 14, fontWeight: "700" },
  cardName: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  // Grid item
  gridItem: { width: "48%", padding: 10, borderRadius: 10, gap: 6 },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridName: { fontSize: 12, fontWeight: "500", flex: 1 },
  gridPercent: { fontSize: 12, fontWeight: "600" },
  // Common
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
});
