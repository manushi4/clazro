/**
 * SubjectProgressScreen - Fixed Screen
 *
 * Purpose: Display detailed progress for a specific subject including chapters, tests, and weak areas
 * Type: Fixed (not widget-based)
 * Accessible from: child-progress-detail, subject-progress widget
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
import { useSubjectDetailQuery, ChapterProgress, TestResult, WeakTopic } from "../../hooks/queries/useSubjectDetailQuery";

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
  music: "music",
  palette: "palette",
  default: "book-education",
};

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#E8F5E9", text: "#2E7D32" },
  medium: { bg: "#FFF3E0", text: "#E65100" },
  hard: { bg: "#FFEBEE", text: "#C62828" },
};

export const SubjectProgressScreen: React.FC<Props> = ({
  screenId = "subject-progress",
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

  // Get subject ID from route params
  const subjectId = route.params?.subjectId || route.params?.id;

  // === DATA ===
  const { data: subject, isLoading, error, refetch } = useSubjectDetailQuery(subjectId);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { subjectId },
    });
  }, [screenId, subjectId]);

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

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const handlePracticeWeakTopic = useCallback((topic: WeakTopic) => {
    trackEvent("practice_weak_topic", { topicId: topic.id, subjectId });
    Alert.alert(
      t("subjectProgress.practiceTitle", { defaultValue: "Practice Topic" }),
      t("subjectProgress.practiceMessage", { defaultValue: "Practice mode coming soon!" })
    );
  }, [trackEvent, subjectId, t]);

  // === HELPER FUNCTIONS ===
  const getSubjectIcon = (icon?: string) => {
    return SUBJECT_ICONS[icon || "default"] || SUBJECT_ICONS.default;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 50) return colors.warning;
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
  if (error || !subject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("subjectProgress.title", { defaultValue: "Subject Progress" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("subjectProgress.notFound", { defaultValue: "Subject not found" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(subject, "title");
  const description = getLocalizedField(subject, "description");

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {title}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Subject Header Card */}
        <AppCard style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <View style={[styles.subjectIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name={getSubjectIcon(subject.icon)} size={32} color={colors.primary} />
            </View>
            <View style={styles.subjectInfo}>
              <AppText style={[styles.subjectTitle, { color: colors.onSurface }]}>
                {title}
              </AppText>
              {description && (
                <AppText style={[styles.subjectDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                  {description}
                </AppText>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <AppText style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
                {t("subjectProgress.overallProgress", { defaultValue: "Overall Progress" })}
              </AppText>
              <AppText style={[styles.progressValue, { color: getProgressColor(subject.progress_percentage) }]}>
                {subject.progress_percentage}%
              </AppText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: getProgressColor(subject.progress_percentage),
                    width: `${subject.progress_percentage}%`,
                  },
                ]}
              />
            </View>
          </View>
        </AppCard>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="book-check" size={24} color={colors.primary} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {subject.chapters_completed}/{subject.total_chapters}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("subjectProgress.chapters", { defaultValue: "Chapters" })}
            </AppText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="clock-outline" size={24} color={colors.tertiary} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {formatHours(subject.hours_studied)}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("subjectProgress.studied", { defaultValue: "Studied" })}
            </AppText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="clipboard-check" size={24} color={colors.success} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {subject.tests_passed}/{subject.total_tests}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("subjectProgress.testsPassed", { defaultValue: "Tests Passed" })}
            </AppText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="percent" size={24} color={colors.warning} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {subject.average_score}%
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("subjectProgress.avgScore", { defaultValue: "Avg Score" })}
            </AppText>
          </View>
        </View>

        {/* Chapters Section */}
        <AppCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="format-list-numbered" size={20} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("subjectProgress.chaptersTitle", { defaultValue: "Chapters" })}
            </AppText>
          </View>

          {subject.chapters.map((chapter, index) => (
            <TouchableOpacity
              key={chapter.id}
              style={[styles.chapterItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
              onPress={() => toggleChapter(chapter.id)}
              activeOpacity={0.7}
            >
              <View style={styles.chapterMain}>
                <View style={[
                  styles.chapterStatus,
                  { backgroundColor: chapter.completed ? colors.success : colors.surfaceVariant }
                ]}>
                  <Icon
                    name={chapter.completed ? "check" : "book-open-page-variant"}
                    size={16}
                    color={chapter.completed ? "#fff" : colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.chapterInfo}>
                  <AppText style={[styles.chapterTitle, { color: colors.onSurface }]}>
                    {getLocalizedField(chapter, "title")}
                  </AppText>
                  <AppText style={[styles.chapterMeta, { color: colors.onSurfaceVariant }]}>
                    {chapter.completed_lessons}/{chapter.total_lessons} {t("subjectProgress.lessons", { defaultValue: "lessons" })}
                  </AppText>
                </View>
                <View style={styles.chapterProgress}>
                  <AppText style={[styles.chapterPercent, { color: getProgressColor(chapter.progress_percentage) }]}>
                    {chapter.progress_percentage}%
                  </AppText>
                  <Icon
                    name={expandedChapters.has(chapter.id) ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </View>
              </View>

              {expandedChapters.has(chapter.id) && (
                <View style={[styles.chapterExpanded, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={[styles.miniProgressBar, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        {
                          backgroundColor: getProgressColor(chapter.progress_percentage),
                          width: `${chapter.progress_percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </AppCard>

        {/* Recent Tests Section */}
        {subject.recent_tests.length > 0 && (
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="clipboard-text" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("subjectProgress.recentTests", { defaultValue: "Recent Tests" })}
              </AppText>
            </View>

            {subject.recent_tests.map((test, index) => (
              <View
                key={test.id}
                style={[styles.testItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
              >
                <View style={[
                  styles.testStatus,
                  { backgroundColor: test.passed ? `${colors.success}20` : `${colors.error}20` }
                ]}>
                  <Icon
                    name={test.passed ? "check-circle" : "close-circle"}
                    size={20}
                    color={test.passed ? colors.success : colors.error}
                  />
                </View>
                <View style={styles.testInfo}>
                  <AppText style={[styles.testTitle, { color: colors.onSurface }]}>
                    {getLocalizedField(test, "title")}
                  </AppText>
                  <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>
                    {formatDate(test.date)}
                  </AppText>
                </View>
                <View style={styles.testScore}>
                  <AppText style={[styles.testScoreValue, { color: test.passed ? colors.success : colors.error }]}>
                    {test.score}/{test.max_score}
                  </AppText>
                  <AppText style={[styles.testPercent, { color: colors.onSurfaceVariant }]}>
                    {test.percentage}%
                  </AppText>
                </View>
              </View>
            ))}
          </AppCard>
        )}

        {/* Weak Topics Section */}
        {subject.weak_topics.length > 0 && (
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="alert-circle" size={20} color={colors.warning} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("subjectProgress.weakTopics", { defaultValue: "Areas to Improve" })}
              </AppText>
            </View>

            {subject.weak_topics.map((topic, index) => {
              const difficultyStyle = DIFFICULTY_COLORS[topic.difficulty] || DIFFICULTY_COLORS.medium;
              return (
                <View
                  key={topic.id}
                  style={[styles.weakItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                >
                  <View style={styles.weakInfo}>
                    <AppText style={[styles.weakTitle, { color: colors.onSurface }]}>
                      {getLocalizedField(topic, "title")}
                    </AppText>
                    <View style={styles.weakMeta}>
                      <AppText style={[styles.weakChapter, { color: colors.onSurfaceVariant }]}>
                        {getLocalizedField(topic, "chapter")}
                      </AppText>
                      <View style={[styles.difficultyBadge, { backgroundColor: difficultyStyle.bg }]}>
                        <AppText style={[styles.difficultyText, { color: difficultyStyle.text }]}>
                          {t(`subjectProgress.difficulty.${topic.difficulty}`, { defaultValue: topic.difficulty })}
                        </AppText>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.practiceButton, { backgroundColor: `${colors.primary}15` }]}
                    onPress={() => handlePracticeWeakTopic(topic)}
                  >
                    <Icon name="play" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </AppCard>
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Subject Card
  subjectCard: { padding: 16 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  subjectIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectTitle: { fontSize: 20, fontWeight: "700" },
  subjectDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  progressSection: { marginTop: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 16, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", padding: 14, borderRadius: 12, alignItems: "center", gap: 6 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, textTransform: "uppercase" },
  // Section Card
  sectionCard: { padding: 0, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  // Chapter Item
  chapterItem: { paddingHorizontal: 16, paddingVertical: 12 },
  chapterMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  chapterStatus: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 14, fontWeight: "500" },
  chapterMeta: { fontSize: 12, marginTop: 2 },
  chapterProgress: { alignItems: "flex-end", gap: 2 },
  chapterPercent: { fontSize: 14, fontWeight: "600" },
  chapterExpanded: { marginTop: 10, padding: 10, borderRadius: 8 },
  miniProgressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  miniProgressFill: { height: "100%", borderRadius: 3 },
  // Test Item
  testItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  testStatus: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 14, fontWeight: "500" },
  testDate: { fontSize: 12, marginTop: 2 },
  testScore: { alignItems: "flex-end" },
  testScoreValue: { fontSize: 15, fontWeight: "600" },
  testPercent: { fontSize: 12, marginTop: 2 },
  // Weak Topic Item
  weakItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  weakInfo: { flex: 1 },
  weakTitle: { fontSize: 14, fontWeight: "500" },
  weakMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  weakChapter: { fontSize: 12 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  difficultyText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  practiceButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bottomSpacer: { height: 32 },
});

export default SubjectProgressScreen;
