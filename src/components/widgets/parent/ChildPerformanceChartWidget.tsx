import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildPerformanceQuery, SubjectScore, WeeklyProgress } from "../../../hooks/queries/parent/useChildPerformanceQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "parent.performance-chart";

export const ChildPerformanceChartWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: performanceData, isLoading, error } = useChildPerformanceQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const chartType = (config?.chartType as "bar" | "progress" | "both") || "bar";
  const showSubjectScores = config?.showSubjectScores !== false;
  const showWeeklyProgress = config?.showWeeklyProgress !== false;
  const showAverageScore = config?.showAverageScore !== false;
  const showBestScore = config?.showBestScore !== false;
  const maxSubjects = parseInt(config?.maxSubjects as string) || 5;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "stacked" | "tabs" | "compact") || "stacked";

  const handleSubjectPress = (subject: string) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subject });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subject } });
    onNavigate?.(`subject-performance/${subject}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("performance-detail");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.performanceChart.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.performanceChart.states.error")}
        </AppText>
      </View>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="chart-line" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.performanceChart.states.empty")}
        </AppText>
      </View>
    );
  }

  const data = performanceData[0];
  const isCompact = size === "compact" || compactMode;

  // Subject colors using theme
  const getSubjectColor = (index: number): string => {
    const subjectColors = [colors.primary, colors.success, colors.warning, colors.error, colors.info];
    return subjectColors[index % subjectColors.length];
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const renderScoreSummary = () => (
    <View style={[styles.summaryContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
      {showAverageScore && (
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: getScoreColor(data.average_score) }]}>
            {data.average_score.toFixed(1)}%
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.performanceChart.averageScore")}
          </AppText>
        </View>
      )}
      {showBestScore && (
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.success }]}>
            {data.best_score.toFixed(0)}%
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.performanceChart.bestScore")}
          </AppText>
        </View>
      )}
    </View>
  );

  const renderSubjectBar = (item: SubjectScore, index: number) => {
    const barColor = getSubjectColor(index);
    const barWidth = `${Math.min(item.score, 100)}%`;

    return (
      <TouchableOpacity
        key={item.subject}
        style={styles.barItem}
        onPress={() => handleSubjectPress(item.subject)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={styles.barLabelRow}>
          <AppText style={[styles.barLabel, { color: colors.onSurface }]} numberOfLines={1}>
            {item.subject}
          </AppText>
          <AppText style={[styles.barValue, { color: getScoreColor(item.score) }]}>
            {item.score}%
          </AppText>
        </View>
        <View style={[styles.barTrack, { backgroundColor: colors.outline }]}>
          <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubjectProgress = (item: SubjectScore, index: number) => {
    const progressColor = getSubjectColor(index);
    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset = circumference - (item.score / 100) * circumference;

    return (
      <TouchableOpacity
        key={item.subject}
        style={[styles.progressItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        onPress={() => handleSubjectPress(item.subject)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={styles.progressCircleContainer}>
          <View style={[styles.progressCircle, { borderColor: colors.outline }]}>
            <AppText style={[styles.progressValue, { color: getScoreColor(item.score) }]}>
              {item.score}
            </AppText>
          </View>
        </View>
        <AppText style={[styles.progressLabel, { color: colors.onSurface }]} numberOfLines={1}>
          {item.subject}
        </AppText>
      </TouchableOpacity>
    );
  };

  const renderWeeklyProgress = () => {
    if (!data.weekly_progress || data.weekly_progress.length === 0) return null;

    const maxXP = Math.max(...data.weekly_progress.map(w => w.xp), 1);

    return (
      <View style={styles.weeklyContainer}>
        <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
          {t("widgets.performanceChart.weeklyProgress")}
        </AppText>
        <View style={styles.weeklyBars}>
          {data.weekly_progress.map((week, index) => {
            const barHeight = (week.xp / maxXP) * 60;
            return (
              <View key={week.week} style={styles.weeklyBarItem}>
                <View style={[styles.weeklyBarTrack, { backgroundColor: colors.outline }]}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: barHeight, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <AppText style={[styles.weeklyLabel, { color: colors.onSurfaceVariant }]}>
                  {week.week}
                </AppText>
                <AppText style={[styles.weeklyXP, { color: colors.onSurface }]}>
                  {week.xp}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const subjectsToShow = data.subject_scores.slice(0, maxSubjects);

  return (
    <View style={styles.container}>
      {/* Score Summary */}
      {(showAverageScore || showBestScore) && renderScoreSummary()}

      {/* Subject Scores */}
      {showSubjectScores && subjectsToShow.length > 0 && (
        <View style={styles.subjectsContainer}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("widgets.performanceChart.subjectScores")}
          </AppText>
          {chartType === "bar" || chartType === "both" ? (
            <View style={styles.barsContainer}>
              {subjectsToShow.map((item, index) => renderSubjectBar(item, index))}
            </View>
          ) : (
            <View style={styles.progressGrid}>
              {subjectsToShow.map((item, index) => renderSubjectProgress(item, index))}
            </View>
          )}
        </View>
      )}

      {/* Weekly Progress */}
      {showWeeklyProgress && renderWeeklyProgress()}

      {/* View All Button */}
      {enableTap && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.performanceChart.actions.viewAll")}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  // Loading/Error/Empty states
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  // Summary
  summaryContainer: { flexDirection: "row", justifyContent: "space-around", padding: 16 },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 12 },
  // Section
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  subjectsContainer: { gap: 8 },
  // Bar chart
  barsContainer: { gap: 12 },
  barItem: { gap: 6 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  barLabel: { fontSize: 13, fontWeight: "500", flex: 1 },
  barValue: { fontSize: 13, fontWeight: "700" },
  barTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  // Progress circles
  progressGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  progressItem: { width: "30%", padding: 12, alignItems: "center", gap: 8 },
  progressCircleContainer: { alignItems: "center", justifyContent: "center" },
  progressCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  progressValue: { fontSize: 14, fontWeight: "700" },
  progressLabel: { fontSize: 11, textAlign: "center" },
  // Weekly progress
  weeklyContainer: { gap: 8 },
  weeklyBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 100 },
  weeklyBarItem: { alignItems: "center", flex: 1, gap: 4 },
  weeklyBarTrack: { width: 24, height: 60, borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  weeklyBarFill: { width: "100%", borderRadius: 4 },
  weeklyLabel: { fontSize: 10 },
  weeklyXP: { fontSize: 10, fontWeight: "600" },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
