/**
 * Analytics Snapshot Widget (analytics.snapshot)
 * Displays weekly analytics overview with study time, assignments, tests, and trends
 */
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useAnalyticsSnapshotQuery, SubjectSnapshot } from "../../../hooks/queries/useAnalyticsSnapshotQuery";

const WIDGET_ID = "analytics.snapshot";

type MetricItem = {
  key: string;
  icon: string;
  label: string;
  value: string;
  trend?: number;
  color: string;
};

export const AnalyticsSnapshotWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useAnalyticsSnapshotQuery();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showThisWeek = config?.showThisWeek !== false;
  const showSubjects = config?.showSubjects !== false;
  const showStreak = config?.showStreak !== false;
  const showTrends = config?.showTrends !== false;
  const showRecommendations = config?.showRecommendations !== false;
  const maxSubjects = (config?.maxSubjects as number) || 3;
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("global-analytics");
  };

  const handleSubjectPress = (subject: SubjectSnapshot) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subject: subject.subjectCode });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subject: subject.subjectCode } });
    setSelectedSubject(selectedSubject === subject.subjectId ? null : subject.subjectId);
  };

  const handleSubjectDetails = (subject: SubjectSnapshot) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_details", subject: subject.subjectCode });
    onNavigate?.(`subject-analytics/${subject.subjectId}`);
  };

  // Format helpers
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
  };

  const formatTrend = (mins: number) => {
    if (mins === 0) return null;
    const sign = mins > 0 ? "+" : "";
    if (Math.abs(mins) < 60) return `${sign}${mins}m`;
    const hrs = Math.floor(Math.abs(mins) / 60);
    return `${sign}${mins > 0 ? "" : "-"}${hrs}h`;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.analyticsSnapshot.states.loading", "Loading analytics...")}
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
          {t("widgets.analyticsSnapshot.states.error", "Couldn't load analytics")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.analyticsSnapshot.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="chart-line" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.analyticsSnapshot.states.empty", "No analytics data yet")}
        </AppText>
      </View>
    );
  }

  // Build metrics
  const metrics: MetricItem[] = [
    {
      key: "studyTime",
      icon: "clock-outline",
      label: t("widgets.analyticsSnapshot.labels.studyTime", "Study time"),
      value: formatTime(data.thisWeek.studyTimeMinutes),
      trend: showTrends ? data.thisWeek.studyTimeTrend : undefined,
      color: colors.info,
    },
    {
      key: "assignments",
      icon: "file-document-check-outline",
      label: t("widgets.analyticsSnapshot.labels.assignments", "Assignments"),
      value: `${data.thisWeek.assignmentsDone}/${data.thisWeek.assignmentsTotal}`,
      color: colors.success,
    },
    {
      key: "tests",
      icon: "clipboard-check-outline",
      label: t("widgets.analyticsSnapshot.labels.tests", "Tests"),
      value: `${data.thisWeek.testsPassed}/${data.thisWeek.testsAttempted}`,
      color: colors.warning,
    },
  ];

  const selectedSubjectData = data.subjects.find(s => s.subjectId === selectedSubject);

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* This Week Overview */}
      {showThisWeek && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("widgets.analyticsSnapshot.sections.thisWeek", "This week")}
          </AppText>
          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <View key={metric.key} style={[styles.metricCard, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                  <Icon name={metric.icon} size={18} color={metric.color} />
                </View>
                <AppText style={[styles.metricValue, { color: colors.onSurface }]}>{metric.value}</AppText>
                <AppText style={[styles.metricLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {metric.label}
                </AppText>
                {metric.trend !== undefined && metric.trend !== 0 && (
                  <View style={[styles.trendBadge, { backgroundColor: metric.trend > 0 ? `${colors.success}20` : `${colors.error}20` }]}>
                    <Icon name={metric.trend > 0 ? "trending-up" : "trending-down"} size={10} color={metric.trend > 0 ? colors.success : colors.error} />
                    <AppText style={[styles.trendText, { color: metric.trend > 0 ? colors.success : colors.error }]}>
                      {formatTrend(metric.trend)}
                    </AppText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Subject Filters */}
      {showSubjects && data.subjects.length > 0 && !compactMode && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("widgets.analyticsSnapshot.sections.subjects", "By subject")}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
            {data.subjects.slice(0, maxSubjects).map((subject) => (
              <TouchableOpacity
                key={subject.subjectId}
                style={[
                  styles.subjectChip,
                  { backgroundColor: selectedSubject === subject.subjectId ? subject.color : colors.surfaceVariant },
                ]}
                onPress={() => handleSubjectPress(subject)}
                activeOpacity={0.7}
              >
                <Icon
                  name={subject.icon}
                  size={14}
                  color={selectedSubject === subject.subjectId ? "#FFFFFF" : subject.color}
                />
                <AppText
                  style={[
                    styles.subjectChipText,
                    { color: selectedSubject === subject.subjectId ? "#FFFFFF" : colors.onSurface },
                  ]}
                >
                  {subject.subjectCode}
                </AppText>
                <AppText
                  style={[
                    styles.subjectMastery,
                    { color: selectedSubject === subject.subjectId ? "#FFFFFF" : colors.onSurfaceVariant },
                  ]}
                >
                  {subject.mastery}%
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Subject Details */}
          {selectedSubjectData && (
            <View style={[styles.subjectDetails, { backgroundColor: colors.surfaceVariant }]}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: `${selectedSubjectData.color}20` }]}>
                  <Icon name={selectedSubjectData.icon} size={20} color={selectedSubjectData.color} />
                </View>
                <AppText style={[styles.subjectName, { color: colors.onSurface }]}>
                  {selectedSubjectData.subjectName}
                </AppText>
              </View>
              <View style={styles.subjectStats}>
                <View style={styles.subjectStat}>
                  <AppText style={[styles.subjectStatValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.averageTestScore}%
                  </AppText>
                  <AppText style={[styles.subjectStatLabel, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.analyticsSnapshot.labels.avgScore", "Avg Score")}
                  </AppText>
                </View>
                <View style={styles.subjectStat}>
                  <AppText style={[styles.subjectStatValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.completedTopics}/{selectedSubjectData.totalTopics}
                  </AppText>
                  <AppText style={[styles.subjectStatLabel, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.analyticsSnapshot.labels.topics", "Topics")}
                  </AppText>
                </View>
                <View style={styles.subjectStat}>
                  <AppText style={[styles.subjectStatValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.doubtsResolved}
                  </AppText>
                  <AppText style={[styles.subjectStatLabel, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.analyticsSnapshot.labels.doubts", "Doubts")}
                  </AppText>
                </View>
              </View>
              {enableTap && (
                <TouchableOpacity
                  style={[styles.detailsButton, { borderColor: selectedSubjectData.color }]}
                  onPress={() => handleSubjectDetails(selectedSubjectData)}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.detailsButtonText, { color: selectedSubjectData.color }]}>
                    {t("widgets.analyticsSnapshot.actions.viewDetails", "View Details")}
                  </AppText>
                  <Icon name="chevron-right" size={16} color={selectedSubjectData.color} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Streak & Focus */}
      {showStreak && !compactMode && (
        <View style={styles.section}>
          <View style={styles.streakRow}>
            <View style={[styles.streakCard, { backgroundColor: colors.surfaceVariant }]}>
              <Icon name="fire" size={20} color={colors.warning} />
              <AppText style={[styles.streakValue, { color: colors.onSurface }]}>
                {data.streakFocus.studyStreak}
              </AppText>
              <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.analyticsSnapshot.labels.streak", "day streak")}
              </AppText>
            </View>
            <View style={[styles.streakCard, { backgroundColor: colors.surfaceVariant }]}>
              <Icon name="timer-outline" size={20} color={colors.info} />
              <AppText style={[styles.streakValue, { color: colors.onSurface }]}>
                {data.streakFocus.averageFocusMinutes}m
              </AppText>
              <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.analyticsSnapshot.labels.avgFocus", "avg focus")}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Recommendations */}
      {showRecommendations && data.recommendations.length > 0 && !compactMode && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("widgets.analyticsSnapshot.sections.suggestions", "Suggestions")}
          </AppText>
          {data.recommendations.slice(0, 2).map((rec, idx) => (
            <View key={idx} style={styles.recommendationRow}>
              <Icon name="arrow-right" size={14} color={colors.primary} />
              <AppText style={[styles.recommendationText, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                {rec}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* View All Button */}
      {enableTap && !compactMode && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.analyticsSnapshot.actions.viewAll", "View Full Analytics")}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  metricsRow: { flexDirection: "row", gap: 8 },
  metricCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center", gap: 4 },
  metricIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 16, fontWeight: "700" },
  metricLabel: { fontSize: 10, textAlign: "center" },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  trendText: { fontSize: 9, fontWeight: "600" },
  subjectScroll: { marginHorizontal: -4 },
  subjectChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4 },
  subjectChipText: { fontSize: 12, fontWeight: "600" },
  subjectMastery: { fontSize: 11 },
  subjectDetails: { padding: 14, borderRadius: 12, marginTop: 8, gap: 12 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  subjectName: { fontSize: 15, fontWeight: "600" },
  subjectStats: { flexDirection: "row", justifyContent: "space-around" },
  subjectStat: { alignItems: "center", gap: 2 },
  subjectStatValue: { fontSize: 16, fontWeight: "700" },
  subjectStatLabel: { fontSize: 10 },
  detailsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  detailsButtonText: { fontSize: 13, fontWeight: "600" },
  streakRow: { flexDirection: "row", gap: 8 },
  streakCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12 },
  streakValue: { fontSize: 18, fontWeight: "700" },
  streakLabel: { fontSize: 11 },
  recommendationRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 4 },
  recommendationText: { flex: 1, fontSize: 12, lineHeight: 18 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
