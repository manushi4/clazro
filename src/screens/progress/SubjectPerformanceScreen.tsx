/**
 * SubjectPerformanceScreen - Fixed Screen
 *
 * Purpose: Display detailed performance analytics for a specific subject
 * Type: Fixed (not widget-based)
 * Accessible from: performance-detail, child-progress-detail, subject widgets
 * Roles: parent
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import {
  useSubjectPerformanceQuery,
  TestPerformance,
  SkillAnalysis,
  AIInsight,
} from "../../hooks/queries/useSubjectPerformanceQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Subject icon mapping
const SUBJECT_ICONS: Record<string, string> = {
  calculator: "calculator-variant",
  atom: "atom",
  flask: "flask",
  "book-open": "book-open-variant",
  leaf: "leaf",
  globe: "earth",
  default: "book-education",
};

// Test type icons
const TEST_TYPE_ICONS: Record<string, string> = {
  quiz: "clipboard-text-outline",
  test: "clipboard-check",
  exam: "school",
};

// Insight type config
const INSIGHT_CONFIG: Record<string, { icon: string; color: string }> = {
  strength: { icon: "arm-flex", color: "#4CAF50" },
  weakness: { icon: "alert-circle", color: "#FF9800" },
  recommendation: { icon: "lightbulb-on", color: "#2196F3" },
  prediction: { icon: "chart-timeline-variant", color: "#9C27B0" },
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");


export const SubjectPerformanceScreen: React.FC<Props> = ({
  screenId = "subject-performance",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const subjectId = route.params?.subjectId || route.params?.id;
  const childId = route.params?.childId;

  // === DATA ===
  const { data: performance, isLoading, error, refetch } = useSubjectPerformanceQuery(subjectId, childId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tests' | 'insights'>('overview');

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { subjectId, childId },
    });
  }, [screenId, subjectId, childId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.refreshDisabled", { defaultValue: "Cannot refresh while offline" })
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleTestPress = useCallback((test: TestPerformance) => {
    trackEvent("test_detail_pressed", { testId: test.id, subjectId });
    // Navigate to test detail if available
  }, [trackEvent, subjectId]);

  const handleInsightAction = useCallback((insight: AIInsight) => {
    trackEvent("insight_action_pressed", { insightId: insight.id, type: insight.type });
    Alert.alert(
      getLocalizedField(insight, "title"),
      getLocalizedField(insight, "description")
    );
  }, [trackEvent]);

  // === HELPER FUNCTIONS ===
  const getSubjectIcon = (icon?: string) => SUBJECT_ICONS[icon || "default"] || SUBJECT_ICONS.default;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return { icon: 'trending-up', color: colors.success };
      case 'down': return { icon: 'trending-down', color: colors.error };
      default: return { icon: 'minus', color: colors.onSurfaceVariant };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !performance) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("subjectPerformance.title", { defaultValue: "Performance" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("subjectPerformance.notFound", { defaultValue: "Performance data not found" })}
          </AppText>
          <AppButton label={t("actions.goBack", { defaultValue: "Go Back" })} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(performance, "title");
  const trendInfo = getTrendIcon(performance.scoreTrend);

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {title} {t("subjectPerformance.performance", { defaultValue: "Performance" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['overview', 'tests', 'insights'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setSelectedTab(tab)}
          >
            <AppText style={[styles.tabText, { color: selectedTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
              {t(`subjectPerformance.tabs.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {selectedTab === 'overview' && (
          <>
            {/* Score Card */}
            <AppCard style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Icon name={getSubjectIcon(performance.icon)} size={28} color={colors.primary} />
                </View>
                <View style={styles.scoreMain}>
                  <View style={styles.scoreRow}>
                    <AppText style={[styles.currentScore, { color: colors.onSurface }]}>
                      {performance.currentScore}%
                    </AppText>
                    <View style={[styles.trendBadge, { backgroundColor: `${trendInfo.color}15` }]}>
                      <Icon name={trendInfo.icon} size={16} color={trendInfo.color} />
                      <AppText style={[styles.trendText, { color: trendInfo.color }]}>
                        {performance.currentScore - performance.previousScore > 0 ? '+' : ''}
                        {performance.currentScore - performance.previousScore}%
                      </AppText>
                    </View>
                  </View>
                  <AppText style={[styles.scoreLabel, { color: colors.onSurfaceVariant }]}>
                    {t("subjectPerformance.currentScore", { defaultValue: "Current Score" })}
                  </AppText>
                </View>
              </View>
            </AppCard>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="trophy" size={22} color={colors.warning} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>#{performance.classRank}</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectPerformance.classRank", { defaultValue: "Class Rank" })}
                </AppText>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="percent" size={22} color={colors.primary} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{performance.percentile}th</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectPerformance.percentile", { defaultValue: "Percentile" })}
                </AppText>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="account-group" size={22} color={colors.tertiary} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{performance.classAverage}%</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectPerformance.classAvg", { defaultValue: "Class Avg" })}
                </AppText>
              </View>
            </View>

            {/* Performance Trend Chart (Simple Bar) */}
            <AppCard style={styles.chartCard}>
              <View style={styles.sectionHeader}>
                <Icon name="chart-line" size={20} color={colors.primary} />
                <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  {t("subjectPerformance.trendTitle", { defaultValue: "Performance Trend" })}
                </AppText>
              </View>
              <View style={styles.chartContainer}>
                {performance.trends.map((trend, index) => (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <View style={[styles.bar, styles.classBar, { height: `${trend.classAverage}%`, backgroundColor: colors.outlineVariant }]} />
                      <View style={[styles.bar, styles.scoreBar, { height: `${trend.score}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>{trend.period.split(' ')[1]}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
                    {t("subjectPerformance.yourScore", { defaultValue: "Your Score" })}
                  </AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.outlineVariant }]} />
                  <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
                    {t("subjectPerformance.classAverage", { defaultValue: "Class Average" })}
                  </AppText>
                </View>
              </View>
            </AppCard>

            {/* Skills Analysis */}
            {performance.skills.length > 0 && (
              <AppCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="brain" size={20} color={colors.primary} />
                  <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {t("subjectPerformance.skillsTitle", { defaultValue: "Skills Analysis" })}
                  </AppText>
                </View>
                {performance.skills.map((skill, index) => {
                  const skillTrend = getTrendIcon(skill.trend);
                  return (
                    <View key={skill.id} style={[styles.skillItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}>
                      <View style={styles.skillInfo}>
                        <AppText style={[styles.skillName, { color: colors.onSurface }]}>
                          {getLocalizedField(skill, "skill")}
                        </AppText>
                        <View style={[styles.skillBar, { backgroundColor: colors.surfaceVariant }]}>
                          <View style={[styles.skillFill, { width: `${skill.score}%`, backgroundColor: getScoreColor(skill.score) }]} />
                        </View>
                      </View>
                      <View style={styles.skillScore}>
                        <AppText style={[styles.skillValue, { color: getScoreColor(skill.score) }]}>{skill.score}%</AppText>
                        <Icon name={skillTrend.icon} size={16} color={skillTrend.color} />
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            )}
          </>
        )}


        {selectedTab === 'tests' && (
          <>
            {performance.tests.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-text-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectPerformance.noTests", { defaultValue: "No tests taken yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="clipboard-list" size={20} color={colors.primary} />
                  <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {t("subjectPerformance.testHistory", { defaultValue: "Test History" })}
                  </AppText>
                </View>
                {performance.tests.map((test, index) => (
                  <TouchableOpacity
                    key={test.id}
                    style={[styles.testItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleTestPress(test)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.testIcon, { backgroundColor: `${getScoreColor(test.percentage)}15` }]}>
                      <Icon name={TEST_TYPE_ICONS[test.type] || "clipboard-text"} size={20} color={getScoreColor(test.percentage)} />
                    </View>
                    <View style={styles.testInfo}>
                      <AppText style={[styles.testTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(test, "title")}
                      </AppText>
                      <View style={styles.testMeta}>
                        <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>
                          {formatDate(test.date)}
                        </AppText>
                        <View style={[styles.testTypeBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <AppText style={[styles.testTypeText, { color: colors.onSurfaceVariant }]}>
                            {test.type.toUpperCase()}
                          </AppText>
                        </View>
                        {test.rank && (
                          <AppText style={[styles.testRank, { color: colors.onSurfaceVariant }]}>
                            #{test.rank}/{test.totalStudents}
                          </AppText>
                        )}
                      </View>
                    </View>
                    <View style={styles.testScore}>
                      <AppText style={[styles.testScoreValue, { color: getScoreColor(test.percentage) }]}>
                        {test.percentage}%
                      </AppText>
                      <AppText style={[styles.testScoreRaw, { color: colors.onSurfaceVariant }]}>
                        {test.score}/{test.maxScore}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'insights' && (
          <>
            {performance.insights.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="lightbulb-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectPerformance.noInsights", { defaultValue: "No insights available yet" })}
                </AppText>
              </View>
            ) : (
              <>
                {performance.insights.map((insight) => {
                  const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.recommendation;
                  return (
                    <AppCard key={insight.id} style={styles.insightCard}>
                      <View style={styles.insightHeader}>
                        <View style={[styles.insightIcon, { backgroundColor: `${config.color}15` }]}>
                          <Icon name={config.icon} size={22} color={config.color} />
                        </View>
                        <View style={styles.insightInfo}>
                          <View style={styles.insightTitleRow}>
                            <AppText style={[styles.insightTitle, { color: colors.onSurface }]}>
                              {getLocalizedField(insight, "title")}
                            </AppText>
                            {insight.priority === 'high' && (
                              <View style={[styles.priorityBadge, { backgroundColor: colors.errorContainer }]}>
                                <AppText style={[styles.priorityText, { color: colors.error }]}>
                                  {t("subjectPerformance.highPriority", { defaultValue: "High" })}
                                </AppText>
                              </View>
                            )}
                          </View>
                          <AppText style={[styles.insightType, { color: config.color }]}>
                            {t(`subjectPerformance.insightType.${insight.type}`, { defaultValue: insight.type })}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={[styles.insightDesc, { color: colors.onSurfaceVariant }]}>
                        {getLocalizedField(insight, "description")}
                      </AppText>
                      {insight.actionable && (
                        <TouchableOpacity
                          style={[styles.insightAction, { backgroundColor: `${config.color}15` }]}
                          onPress={() => handleInsightAction(insight)}
                        >
                          <AppText style={[styles.insightActionText, { color: config.color }]}>
                            {t("subjectPerformance.takeAction", { defaultValue: "Take Action" })}
                          </AppText>
                          <Icon name="chevron-right" size={18} color={config.color} />
                        </TouchableOpacity>
                      )}
                    </AppCard>
                  );
                })}
              </>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  // Tab Bar
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Score Card
  scoreCard: { padding: 16 },
  scoreHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  subjectIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  scoreMain: { flex: 1 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  currentScore: { fontSize: 32, fontWeight: "700" },
  trendBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  trendText: { fontSize: 13, fontWeight: "600" },
  scoreLabel: { fontSize: 13, marginTop: 2 },
  // Stats Grid
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, textTransform: "uppercase", textAlign: "center" },
  // Chart Card
  chartCard: { padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  chartContainer: { flexDirection: "row", justifyContent: "space-between", height: 120, paddingHorizontal: 8 },
  barColumn: { alignItems: "center", flex: 1 },
  barWrapper: { flex: 1, width: 24, justifyContent: "flex-end", position: "relative" },
  bar: { width: "100%", borderRadius: 4, position: "absolute", bottom: 0 },
  classBar: { opacity: 0.5 },
  scoreBar: {},
  barLabel: { fontSize: 10, marginTop: 6 },
  chartLegend: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  // Section Card
  sectionCard: { padding: 0, overflow: "hidden" },
  // Skill Item
  skillItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  skillBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: 3 },
  skillScore: { flexDirection: "row", alignItems: "center", gap: 6 },
  skillValue: { fontSize: 14, fontWeight: "600" },
  // Test Item
  testItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  testIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 14, fontWeight: "500" },
  testMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  testDate: { fontSize: 12 },
  testTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  testTypeText: { fontSize: 9, fontWeight: "600" },
  testRank: { fontSize: 12 },
  testScore: { alignItems: "flex-end" },
  testScoreValue: { fontSize: 16, fontWeight: "700" },
  testScoreRaw: { fontSize: 11, marginTop: 2 },
  // Insight Card
  insightCard: { padding: 16 },
  insightHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  insightIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  insightInfo: { flex: 1 },
  insightTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  insightTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: "600" },
  insightType: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  insightDesc: { fontSize: 13, lineHeight: 19 },
  insightAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, marginTop: 12, gap: 4 },
  insightActionText: { fontSize: 14, fontWeight: "600" },
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },
  bottomSpacer: { height: 32 },
});

export default SubjectPerformanceScreen;
