/**
 * Comparison Details Screen - Fixed (Custom Component)
 *
 * Purpose: Display detailed comparison analytics between child and class/school averages
 * Type: Fixed (not widget-based)
 * Accessible from: comparison-analytics screen, performance-detail screen
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";
import { getLocalizedField } from "../../utils/getLocalizedField";
import {
  useComparisonDetailsQuery,
  ComparisonMetric,
  SubjectComparison,
} from "../../hooks/queries/useComparisonDetailsQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type TabType = "overview" | "subjects" | "metrics";

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  up: { icon: "trending-up", color: "#10B981" },
  down: { icon: "trending-down", color: "#EF4444" },
  stable: { icon: "minus", color: "#F59E0B" },
};

export const ComparisonDetailsScreen: React.FC<Props> = ({
  screenId = "comparison-details",
  role,
  navigation: navProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const childId = route.params?.childId;
  const { data, isLoading, error, refetch } = useComparisonDetailsQuery(childId);

  useEffect(() => {
    trackScreenView(screenId);
  }, [screenId, trackScreenView]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) return;
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      trackEvent("tab_changed", { screen: screenId, tab });
    },
    [trackEvent, screenId]
  );

  const getScoreColor = (score: number, average: number) => {
    if (score >= average + 10) return "#10B981";
    if (score >= average) return "#F59E0B";
    return "#EF4444";
  };

  const getDifferenceText = (value: number, average: number) => {
    const diff = value - average;
    if (diff > 0) return `+${diff.toFixed(1)}`;
    return diff.toFixed(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading")}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("comparisonDetails.title")}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("comparisonDetails.notFound")}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const period = getLocalizedField(data, "period");

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Overall Score Card */}
      <AppCard style={styles.overallCard}>
        <View style={styles.overallHeader}>
          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <AppText style={[styles.scoreValue, { color: colors.primary }]}>
              {data.overall_score.toFixed(1)}
            </AppText>
            <AppText style={[styles.scoreLabel, { color: colors.onSurfaceVariant }]}>
              {t("comparisonDetails.overall")}
            </AppText>
          </View>
          <View style={styles.overallInfo}>
            <AppText style={[styles.childName, { color: colors.onSurface }]}>
              {data.child_name}
            </AppText>
            <AppText style={[styles.className, { color: colors.onSurfaceVariant }]}>
              {data.class_name}
            </AppText>
            <View style={styles.rankBadge}>
              <Icon name="trophy" size={14} color="#F59E0B" />
              <AppText style={[styles.rankText, { color: colors.onSurface }]}>
                {t("comparisonDetails.rank")} #{data.overall_rank} / {data.total_students}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>

      {/* Comparison Bars */}
      <AppCard style={styles.comparisonCard}>
        <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
          {t("comparisonDetails.overallComparison")}
        </AppText>

        {/* Child Score */}
        <View style={styles.barRow}>
          <View style={styles.barLabelRow}>
            <Icon name="account" size={16} color={colors.primary} />
            <AppText style={[styles.barLabel, { color: colors.onSurface }]}>
              {t("comparisonDetails.yourChild")}
            </AppText>
            <AppText style={[styles.barValue, { color: colors.primary }]}>
              {data.overall_score.toFixed(1)}%
            </AppText>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[styles.barFill, { width: `${data.overall_score}%`, backgroundColor: colors.primary }]}
            />
          </View>
        </View>

        {/* Class Average */}
        <View style={styles.barRow}>
          <View style={styles.barLabelRow}>
            <Icon name="account-group" size={16} color="#F59E0B" />
            <AppText style={[styles.barLabel, { color: colors.onSurface }]}>
              {t("comparisonDetails.classAverage")}
            </AppText>
            <AppText style={[styles.barValue, { color: "#F59E0B" }]}>
              {data.overall_class_avg.toFixed(1)}%
            </AppText>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.barFill, { width: `${data.overall_class_avg}%`, backgroundColor: "#F59E0B" }]} />
          </View>
        </View>

        {/* School Average */}
        <View style={styles.barRow}>
          <View style={styles.barLabelRow}>
            <Icon name="school" size={16} color="#6B7280" />
            <AppText style={[styles.barLabel, { color: colors.onSurface }]}>
              {t("comparisonDetails.schoolAverage")}
            </AppText>
            <AppText style={[styles.barValue, { color: "#6B7280" }]}>
              {data.overall_school_avg.toFixed(1)}%
            </AppText>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.barFill, { width: `${data.overall_school_avg}%`, backgroundColor: "#6B7280" }]} />
          </View>
        </View>
      </AppCard>

      {/* Percentile Card */}
      <AppCard style={[styles.percentileCard, { backgroundColor: colors.primaryContainer }]}>
        <View style={styles.percentileContent}>
          <Icon name="chart-arc" size={32} color={colors.primary} />
          <View style={styles.percentileInfo}>
            <AppText style={[styles.percentileValue, { color: colors.primary }]}>
              {data.overall_percentile}th {t("comparisonDetails.percentile")}
            </AppText>
            <AppText style={[styles.percentileDesc, { color: colors.onPrimaryContainer }]}>
              {t("comparisonDetails.percentileDesc", { percentile: data.overall_percentile })}
            </AppText>
          </View>
        </View>
      </AppCard>

      {/* Period Info */}
      <View style={styles.periodRow}>
        <Icon name="calendar" size={16} color={colors.onSurfaceVariant} />
        <AppText style={[styles.periodText, { color: colors.onSurfaceVariant }]}>{period}</AppText>
      </View>
    </View>
  );

  const renderSubjectsTab = () => (
    <View style={styles.tabContent}>
      {data.subjects.map((subject: SubjectComparison) => {
        const subjectName = getLocalizedField(subject, "subject_name");
        const scoreColor = getScoreColor(subject.child_score, subject.class_average);
        const trendInfo = TREND_ICONS[subject.trend];

        return (
          <AppCard key={subject.id} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <AppText style={[styles.subjectName, { color: colors.onSurface }]}>{subjectName}</AppText>
              <View style={styles.trendBadge}>
                <Icon name={trendInfo.icon} size={14} color={trendInfo.color} />
              </View>
            </View>

            <View style={styles.subjectScores}>
              <View style={styles.scoreItem}>
                <AppText style={[styles.scoreItemValue, { color: scoreColor }]}>
                  {subject.child_score}%
                </AppText>
                <AppText style={[styles.scoreItemLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.score")}
                </AppText>
              </View>
              <View style={styles.scoreItem}>
                <AppText style={[styles.scoreItemValue, { color: colors.onSurface }]}>
                  {subject.class_average}%
                </AppText>
                <AppText style={[styles.scoreItemLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.classAvg")}
                </AppText>
              </View>
              <View style={styles.scoreItem}>
                <AppText style={[styles.scoreItemValue, { color: colors.onSurface }]}>
                  #{subject.rank_in_class}
                </AppText>
                <AppText style={[styles.scoreItemLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.rank")}
                </AppText>
              </View>
            </View>

            <View style={styles.subjectDiff}>
              <AppText
                style={[
                  styles.diffText,
                  { color: subject.child_score >= subject.class_average ? "#10B981" : "#EF4444" },
                ]}
              >
                {getDifferenceText(subject.child_score, subject.class_average)}{" "}
                {t("comparisonDetails.vsClass")}
              </AppText>
              <AppText style={[styles.percentileSmall, { color: colors.onSurfaceVariant }]}>
                {subject.percentile}th {t("comparisonDetails.percentile")}
              </AppText>
            </View>
          </AppCard>
        );
      })}
    </View>
  );

  const renderMetricsTab = () => (
    <View style={styles.tabContent}>
      {data.metrics.map((metric: ComparisonMetric) => {
        const metricName = getLocalizedField(metric, "metric_name");
        const scoreColor = getScoreColor(metric.child_value, metric.class_average);
        const trendInfo = TREND_ICONS[metric.trend];

        return (
          <AppCard key={metric.id} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <AppText style={[styles.metricName, { color: colors.onSurface }]}>{metricName}</AppText>
              <View style={[styles.trendBadgeSmall, { backgroundColor: trendInfo.color + "20" }]}>
                <Icon name={trendInfo.icon} size={12} color={trendInfo.color} />
                <AppText style={[styles.changeText, { color: trendInfo.color }]}>
                  {metric.change_percent > 0 ? "+" : ""}
                  {metric.change_percent}%
                </AppText>
              </View>
            </View>

            <View style={styles.metricBars}>
              {/* Child */}
              <View style={styles.metricBarRow}>
                <AppText style={[styles.metricBarLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.child")}
                </AppText>
                <View style={[styles.metricBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[styles.metricBarFill, { width: `${metric.child_value}%`, backgroundColor: scoreColor }]}
                  />
                </View>
                <AppText style={[styles.metricBarValue, { color: scoreColor }]}>{metric.child_value}%</AppText>
              </View>

              {/* Class */}
              <View style={styles.metricBarRow}>
                <AppText style={[styles.metricBarLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.class")}
                </AppText>
                <View style={[styles.metricBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[styles.metricBarFill, { width: `${metric.class_average}%`, backgroundColor: "#F59E0B" }]}
                  />
                </View>
                <AppText style={[styles.metricBarValue, { color: "#F59E0B" }]}>{metric.class_average}%</AppText>
              </View>

              {/* School */}
              <View style={styles.metricBarRow}>
                <AppText style={[styles.metricBarLabel, { color: colors.onSurfaceVariant }]}>
                  {t("comparisonDetails.school")}
                </AppText>
                <View style={[styles.metricBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[styles.metricBarFill, { width: `${metric.school_average}%`, backgroundColor: "#6B7280" }]}
                  />
                </View>
                <AppText style={[styles.metricBarValue, { color: "#6B7280" }]}>{metric.school_average}%</AppText>
              </View>
            </View>
          </AppCard>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("comparisonDetails.title")}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(["overview", "subjects", "metrics"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => handleTabChange(tab)}
          >
            <AppText
              style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.onSurfaceVariant }]}
            >
              {t(`comparisonDetails.tabs.${tab}`)}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "subjects" && renderSubjectsTab()}
        {activeTab === "metrics" && renderMetricsTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  tabContent: { gap: 16 },

  // Overview Tab
  overallCard: { padding: 16 },
  overallHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: { fontSize: 22, fontWeight: "700" },
  scoreLabel: { fontSize: 10, marginTop: 2 },
  overallInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  className: { fontSize: 14, marginBottom: 8 },
  rankBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  rankText: { fontSize: 14, fontWeight: "500" },

  comparisonCard: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 16 },
  barRow: { marginBottom: 16 },
  barLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  barLabel: { flex: 1, fontSize: 13 },
  barValue: { fontSize: 13, fontWeight: "600" },
  barBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },

  percentileCard: { padding: 16 },
  percentileContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  percentileInfo: { flex: 1 },
  percentileValue: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  percentileDesc: { fontSize: 13 },

  periodRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 },
  periodText: { fontSize: 12 },

  // Subjects Tab
  subjectCard: { padding: 16 },
  subjectHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  subjectName: { fontSize: 16, fontWeight: "600" },
  trendBadge: { padding: 4 },
  subjectScores: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  scoreItem: { alignItems: "center" },
  scoreItemValue: { fontSize: 18, fontWeight: "700" },
  scoreItemLabel: { fontSize: 11, marginTop: 2 },
  subjectDiff: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  diffText: { fontSize: 13, fontWeight: "500" },
  percentileSmall: { fontSize: 12 },

  // Metrics Tab
  metricCard: { padding: 16 },
  metricHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  metricName: { fontSize: 15, fontWeight: "600", flex: 1 },
  trendBadgeSmall: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  changeText: { fontSize: 11, fontWeight: "600" },
  metricBars: { gap: 8 },
  metricBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricBarLabel: { width: 50, fontSize: 11 },
  metricBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  metricBarFill: { height: "100%", borderRadius: 3 },
  metricBarValue: { width: 40, fontSize: 11, fontWeight: "600", textAlign: "right" },
});

export default ComparisonDetailsScreen;
