/**
 * ChildWeakAreaScreen - Fixed Screen
 *
 * Purpose: Display detailed weak areas for a child with practice recommendations
 * Type: Fixed (not widget-based)
 * Accessible from: child-detail, child-progress-detail, child-weak-areas-detail
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

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
  useChildWeakAreaScreenQuery,
  WeakTopic,
  SubjectWeakness,
  PracticeSuggestion,
  AIRecommendation,
} from "../../hooks/queries/useChildWeakAreaScreenQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  high: '#E53935',
  medium: '#FB8C00',
  low: '#43A047',
};

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#43A047',
  medium: '#FB8C00',
  hard: '#E53935',
};

// Trend icons
const TREND_ICONS: Record<string, string> = {
  improving: 'trending-up',
  declining: 'trending-down',
  stable: 'minus',
};

// Practice type icons
const PRACTICE_ICONS: Record<string, string> = {
  quiz: 'clipboard-check',
  video: 'play-circle',
  worksheet: 'file-document',
  flashcards: 'cards',
};

export const ChildWeakAreaScreen: React.FC<Props> = ({
  screenId = "child-weak-area",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const childId = route.params?.childId || route.params?.id || 'child-1';

  // === DATA ===
  const { data, isLoading, error, refetch } = useChildWeakAreaScreenQuery(childId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'practice' | 'recommendations'>('overview');

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { childId },
    });
  }, [screenId, childId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(t("offline.title"), t("offline.refreshDisabled"));
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleTopicPress = useCallback((topic: WeakTopic) => {
    trackEvent("weak_topic_pressed", { topicId: topic.id, childId });
    if (topic.practice_available) {
      Alert.alert(
        t("childWeakArea.practiceTitle", { defaultValue: "Start Practice" }),
        t("childWeakArea.practiceMessage", { defaultValue: "Practice mode coming soon!" })
      );
    }
  }, [trackEvent, childId, t]);

  const handleSubjectPress = useCallback((subject: SubjectWeakness) => {
    trackEvent("subject_pressed", { subjectId: subject.id, childId });
    navigation.navigate("subject-report", { subjectId: subject.id, childId });
  }, [navigation, trackEvent, childId]);

  const handlePracticePress = useCallback((practice: PracticeSuggestion) => {
    trackEvent("practice_pressed", { practiceId: practice.id, type: practice.type });
    Alert.alert(
      getLocalizedField(practice, 'title'),
      t("childWeakArea.practiceMessage", { defaultValue: "Practice mode coming soon!" })
    );
  }, [trackEvent, t]);

  const handleRecommendationAction = useCallback((rec: AIRecommendation) => {
    trackEvent("recommendation_action", { recId: rec.id, type: rec.type });
    if (rec.action_target) {
      Alert.alert(
        getLocalizedField(rec, 'title'),
        t("childWeakArea.actionMessage", { defaultValue: "Feature coming soon!" })
      );
    }
  }, [trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const getScoreColor = (percentage: number) => {
    if (percentage >= 60) return colors.warning;
    if (percentage >= 40) return colors.error;
    return '#B71C1C';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return colors.success;
      case 'declining': return colors.error;
      default: return colors.onSurfaceVariant;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // === LOADING STATE ===
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

  // === ERROR STATE ===
  if (error || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("childWeakArea.title", { defaultValue: "Weak Areas" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("childWeakArea.notFound", { defaultValue: "Data not found" })}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {t("childWeakArea.title", { defaultValue: "Weak Areas" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['overview', 'subjects', 'practice', 'recommendations'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setSelectedTab(tab)}
          >
            <AppText style={[styles.tabText, { color: selectedTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
              {t(`childWeakArea.tabs.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
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
            {/* Summary Card */}
            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIcon, { backgroundColor: `${colors.error}15` }]}>
                  <Icon name="alert-circle" size={28} color={colors.error} />
                </View>
                <View style={styles.summaryInfo}>
                  <AppText style={[styles.summaryTitle, { color: colors.onSurface }]}>
                    {data.summary.total_weak_topics} {t("childWeakArea.weakTopics", { defaultValue: "Weak Topics" })}
                  </AppText>
                  <AppText style={[styles.summarySubtitle, { color: colors.onSurfaceVariant }]}>
                    {t("childWeakArea.across", { defaultValue: "across" })} {data.summary.subjects_affected} {t("childWeakArea.subjects", { defaultValue: "subjects" })}
                  </AppText>
                </View>
                <View style={[styles.avgScoreBadge, { backgroundColor: `${getScoreColor(data.summary.average_weak_score)}20` }]}>
                  <AppText style={[styles.avgScoreText, { color: getScoreColor(data.summary.average_weak_score) }]}>
                    {data.summary.average_weak_score}%
                  </AppText>
                  <AppText style={[styles.avgScoreLabel, { color: colors.onSurfaceVariant }]}>
                    {t("childWeakArea.avgScore", { defaultValue: "Avg" })}
                  </AppText>
                </View>
              </View>

              {/* Stats Row */}
              <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant }]}>
                <View style={styles.statItem}>
                  <Icon name="alert" size={18} color={PRIORITY_COLORS.high} />
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.summary.high_priority_count}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {t("childWeakArea.highPriority", { defaultValue: "High Priority" })}
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Icon name="trending-up" size={18} color={colors.success} />
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.summary.improving_count}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {t("childWeakArea.improving", { defaultValue: "Improving" })}
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Icon name="trending-down" size={18} color={colors.error} />
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.summary.declining_count}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {t("childWeakArea.declining", { defaultValue: "Declining" })}
                  </AppText>
                </View>
              </View>

              {/* Practice Progress */}
              <View style={[styles.practiceProgress, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="target" size={20} color={colors.primary} />
                <View style={styles.practiceProgressInfo}>
                  <AppText style={[styles.practiceProgressText, { color: colors.onSurface }]}>
                    {t("childWeakArea.todayProgress", { defaultValue: "Today's Practice" })}
                  </AppText>
                  <AppText style={[styles.practiceProgressValue, { color: colors.primary }]}>
                    {data.summary.practice_completed_today}/{data.summary.practice_goal_today}
                  </AppText>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.outline }]}>
                  <View style={[styles.progressFill, { 
                    backgroundColor: colors.primary,
                    width: `${Math.min((data.summary.practice_completed_today / data.summary.practice_goal_today) * 100, 100)}%`
                  }]} />
                </View>
              </View>
            </AppCard>

            {/* Weak Topics List */}
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("childWeakArea.allTopics", { defaultValue: "All Weak Topics" })}
            </AppText>
            {data.weak_topics.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={48} color={colors.success} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childWeakArea.noWeakTopics", { defaultValue: "No weak topics found!" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.topicsCard}>
                {data.weak_topics.map((topic, index) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleTopicPress(topic)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.topicIcon, { backgroundColor: `${topic.color}20` }]}>
                      <Icon name={topic.icon} size={20} color={topic.color} />
                    </View>
                    <View style={styles.topicInfo}>
                      <AppText style={[styles.topicName, { color: colors.onSurface }]}>
                        {getLocalizedField(topic, 'topic')}
                      </AppText>
                      <AppText style={[styles.topicMeta, { color: colors.onSurfaceVariant }]}>
                        {getLocalizedField(topic, 'subject')} • {getLocalizedField(topic, 'chapter')}
                      </AppText>
                      <View style={styles.topicTags}>
                        <View style={[styles.difficultyTag, { backgroundColor: `${DIFFICULTY_COLORS[topic.difficulty]}20` }]}>
                          <AppText style={[styles.tagText, { color: DIFFICULTY_COLORS[topic.difficulty] }]}>
                            {t(`childWeakArea.difficulty.${topic.difficulty}`, { defaultValue: topic.difficulty })}
                          </AppText>
                        </View>
                        <View style={styles.trendTag}>
                          <Icon name={TREND_ICONS[topic.improvement_trend]} size={12} color={getTrendColor(topic.improvement_trend)} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.topicRight}>
                      <AppText style={[styles.topicScore, { color: getScoreColor(topic.percentage) }]}>
                        {topic.percentage}%
                      </AppText>
                      <AppText style={[styles.topicAttempts, { color: colors.onSurfaceVariant }]}>
                        {topic.attempts} {t("childWeakArea.attempts", { defaultValue: "attempts" })}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'subjects' && (
          <>
            {data.subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="book-open-variant" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childWeakArea.noSubjects", { defaultValue: "No subjects with weak areas" })}
                </AppText>
              </View>
            ) : (
              data.subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  activeOpacity={0.7}
                  onPress={() => handleSubjectPress(subject)}
                >
                  <AppCard style={styles.subjectCard}>
                    <View style={styles.subjectHeader}>
                      <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}20` }]}>
                        <Icon name={subject.icon} size={24} color={subject.color} />
                      </View>
                      <View style={styles.subjectInfo}>
                        <AppText style={[styles.subjectName, { color: colors.onSurface }]}>
                          {getLocalizedField(subject, 'subject')}
                        </AppText>
                        <AppText style={[styles.subjectMeta, { color: colors.onSurfaceVariant }]}>
                          {subject.weak_topics_count} {t("childWeakArea.weakTopics", { defaultValue: "weak topics" })}
                        </AppText>
                      </View>
                      <View style={styles.subjectRight}>
                        <View style={[styles.priorityBadge, { backgroundColor: `${PRIORITY_COLORS[subject.priority]}20` }]}>
                          <AppText style={[styles.priorityText, { color: PRIORITY_COLORS[subject.priority] }]}>
                            {t(`childWeakArea.priority.${subject.priority}`, { defaultValue: subject.priority })}
                          </AppText>
                        </View>
                        <AppText style={[styles.subjectScore, { color: getScoreColor(subject.average_score) }]}>
                          {subject.average_score}%
                        </AppText>
                      </View>
                    </View>
                  </AppCard>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {selectedTab === 'practice' && (
          <>
            {data.practice_suggestions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-check-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childWeakArea.noPractice", { defaultValue: "No practice suggestions" })}
                </AppText>
              </View>
            ) : (
              data.practice_suggestions.map((practice) => (
                <TouchableOpacity
                  key={practice.id}
                  activeOpacity={0.7}
                  onPress={() => handlePracticePress(practice)}
                >
                  <AppCard style={[styles.practiceCard, practice.completed && { opacity: 0.6 }]}>
                    <View style={styles.practiceHeader}>
                      <View style={[styles.practiceIcon, { backgroundColor: `${practice.color}20` }]}>
                        <Icon name={PRACTICE_ICONS[practice.type] || practice.icon} size={22} color={practice.color} />
                      </View>
                      <View style={styles.practiceInfo}>
                        <AppText style={[styles.practiceTitle, { color: colors.onSurface }]}>
                          {getLocalizedField(practice, 'title')}
                        </AppText>
                        <AppText style={[styles.practiceMeta, { color: colors.onSurfaceVariant }]}>
                          {getLocalizedField(practice, 'subject')} • {practice.duration_minutes} {t("childWeakArea.mins", { defaultValue: "mins" })}
                        </AppText>
                        {practice.description_en && (
                          <AppText style={[styles.practiceDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                            {getLocalizedField(practice, 'description')}
                          </AppText>
                        )}
                      </View>
                      {practice.completed ? (
                        <Icon name="check-circle" size={24} color={colors.success} />
                      ) : (
                        <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
                      )}
                    </View>
                    <View style={styles.practiceTags}>
                      <View style={[styles.typeTag, { backgroundColor: colors.surfaceVariant }]}>
                        <AppText style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
                          {t(`childWeakArea.type.${practice.type}`, { defaultValue: practice.type })}
                        </AppText>
                      </View>
                      <View style={[styles.difficultyTag, { backgroundColor: `${DIFFICULTY_COLORS[practice.difficulty]}20` }]}>
                        <AppText style={[styles.tagText, { color: DIFFICULTY_COLORS[practice.difficulty] }]}>
                          {t(`childWeakArea.difficulty.${practice.difficulty}`, { defaultValue: practice.difficulty })}
                        </AppText>
                      </View>
                      {practice.questions_count && (
                        <View style={[styles.questionsTag, { backgroundColor: colors.surfaceVariant }]}>
                          <AppText style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
                            {practice.questions_count} {t("childWeakArea.questions", { defaultValue: "Q" })}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </AppCard>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {selectedTab === 'recommendations' && (
          <>
            {data.ai_recommendations.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="lightbulb-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childWeakArea.noRecommendations", { defaultValue: "No recommendations yet" })}
                </AppText>
              </View>
            ) : (
              data.ai_recommendations.map((rec) => (
                <AppCard key={rec.id} style={styles.recCard}>
                  <View style={styles.recHeader}>
                    <View style={[styles.recIcon, { backgroundColor: `${rec.color}20` }]}>
                      <Icon name={rec.icon} size={22} color={rec.color} />
                    </View>
                    <View style={styles.recInfo}>
                      <View style={styles.recTitleRow}>
                        <AppText style={[styles.recTitle, { color: colors.onSurface }]}>
                          {getLocalizedField(rec, 'title')}
                        </AppText>
                        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[rec.priority] }]} />
                      </View>
                      <AppText style={[styles.recDesc, { color: colors.onSurfaceVariant }]}>
                        {getLocalizedField(rec, 'description')}
                      </AppText>
                    </View>
                  </View>
                  {rec.action_label_en && (
                    <TouchableOpacity
                      style={[styles.recAction, { backgroundColor: `${rec.color}15` }]}
                      onPress={() => handleRecommendationAction(rec)}
                    >
                      <AppText style={[styles.recActionText, { color: rec.color }]}>
                        {getLocalizedField(rec, 'action_label')}
                      </AppText>
                      <Icon name="arrow-right" size={16} color={rec.color} />
                    </TouchableOpacity>
                  )}
                </AppCard>
              ))
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center", marginHorizontal: 8 },
  headerRight: { width: 32 },
  // Tab Bar
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 11, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Summary Card
  summaryCard: { padding: 16 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  summaryIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  summaryInfo: { flex: 1 },
  summaryTitle: { fontSize: 18, fontWeight: "700" },
  summarySubtitle: { fontSize: 13, marginTop: 2 },
  avgScoreBadge: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  avgScoreText: { fontSize: 18, fontWeight: "700" },
  avgScoreLabel: { fontSize: 10, marginTop: 2 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 14, marginTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 10, textAlign: "center" },
  practiceProgress: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, marginTop: 14 },
  practiceProgressInfo: { flex: 1 },
  practiceProgressText: { fontSize: 13, fontWeight: "500" },
  practiceProgressValue: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  progressBar: { width: 60, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  // Section Title
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  // Topics Card
  topicsCard: { padding: 0, overflow: "hidden" },
  topicItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  topicIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 14, fontWeight: "600" },
  topicMeta: { fontSize: 11, marginTop: 2 },
  topicTags: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  difficultyTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  trendTag: { padding: 4 },
  tagText: { fontSize: 10, fontWeight: "500" },
  topicRight: { alignItems: "flex-end" },
  topicScore: { fontSize: 16, fontWeight: "700" },
  topicAttempts: { fontSize: 10, marginTop: 2 },
  // Subject Card
  subjectCard: { padding: 16 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  subjectIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: "600" },
  subjectMeta: { fontSize: 12, marginTop: 2 },
  subjectRight: { alignItems: "flex-end", gap: 6 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  subjectScore: { fontSize: 16, fontWeight: "700" },
  // Practice Card
  practiceCard: { padding: 14 },
  practiceHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  practiceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  practiceInfo: { flex: 1 },
  practiceTitle: { fontSize: 14, fontWeight: "600" },
  practiceMeta: { fontSize: 11, marginTop: 2 },
  practiceDesc: { fontSize: 12, marginTop: 6, lineHeight: 16 },
  practiceTags: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  questionsTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  // Recommendation Card
  recCard: { padding: 14 },
  recHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  recIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  recInfo: { flex: 1 },
  recTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  recTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  recDesc: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  recAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  recActionText: { fontSize: 13, fontWeight: "600" },
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  bottomSpacer: { height: 20 },
});

export default ChildWeakAreaScreen;
