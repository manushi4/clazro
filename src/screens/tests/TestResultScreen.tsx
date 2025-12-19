/**
 * TestResultScreen - Fixed Screen
 *
 * Purpose: Display test results after submission with score, pass/fail, and review option
 * Type: Fixed (not widget-based)
 * Accessible from: TestAttemptScreen (after submission)
 * Roles: student
 */

import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme
import { useAppTheme } from "../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useTestAttemptQuery } from "../../hooks/queries/useTestAttemptQuery";
import { useTestQuestionsQuery } from "../../hooks/queries/useTestQuestionsQuery";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

export const TestResultScreen: React.FC<Props> = ({
  screenId = "test-result",
  role,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  // Get params (can come from navigation or route)
  const attemptId = route.params?.attemptId;
  const testId = route.params?.testId;
  const passedScore = route.params?.score;
  const passedPercentage = route.params?.percentage;
  const passedIsPassed = route.params?.isPassed;

  // === DATA ===
  const { data: attempt, isLoading } = useTestAttemptQuery(attemptId);
  const { data: questions } = useTestQuestionsQuery(testId || attempt?.test_id);

  // Use passed params or fetched data
  const score = passedScore ?? attempt?.score ?? 0;
  const totalMarks = attempt?.total_marks ?? attempt?.test?.max_score ?? 100;
  const percentage = passedPercentage ?? attempt?.percentage ?? 0;
  const isPassed = passedIsPassed ?? attempt?.is_passed ?? false;
  const showAnswers = attempt?.test?.show_answers_after ?? false;

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { attemptId, testId },
    });
  }, [screenId, attemptId, testId]);

  // === COMPUTED VALUES ===
  const correctAnswers = useMemo(() => {
    if (!attempt?.answers || !questions) return 0;
    let correct = 0;
    questions.forEach((q) => {
      const studentAnswer = attempt.answers?.find((a) => a.questionId === q.id);
      if (studentAnswer?.answer && q.correct_answer) {
        if (studentAnswer.answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
          correct++;
        }
      }
    });
    return correct;
  }, [attempt, questions]);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("result_back_pressed", { attemptId });
    // Go back to test center, not test detail
    navigation.navigate("test-center");
  }, [navigation, trackEvent, attemptId]);

  const handleReviewAnswers = useCallback(() => {
    trackEvent("review_answers_pressed", { attemptId, testId });
    navigation.navigate("test-review", {
      attemptId,
      testId: testId || attempt?.test_id,
    });
  }, [navigation, trackEvent, attemptId, testId, attempt]);

  const handleRetakeTest = useCallback(() => {
    trackEvent("retake_test_pressed", { testId });
    navigation.navigate("test-detail", { testId: testId || attempt?.test_id });
  }, [navigation, trackEvent, testId, attempt]);

  const testTitle = attempt?.test
    ? getLocalizedField(attempt.test, "title") || attempt.test.title_en
    : t("testResult.test", { defaultValue: "Test" });

  const subjectName = attempt?.test?.subject
    ? getLocalizedField(attempt.test.subject, "title") || attempt.test.subject.title_en
    : null;

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

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("testResult.title", { defaultValue: "Test Result" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Result Card */}
        <View
          style={[
            styles.resultCard,
            { backgroundColor: isPassed ? "#DCFCE7" : "#FEE2E2" },
          ]}
        >
          <View
            style={[
              styles.resultIconContainer,
              { backgroundColor: isPassed ? "#16A34A" : colors.error },
            ]}
          >
            <Icon
              name={isPassed ? "check-circle" : "close-circle"}
              size={48}
              color="#FFFFFF"
            />
          </View>
          <AppText
            style={[
              styles.resultStatus,
              { color: isPassed ? "#16A34A" : colors.error },
            ]}
          >
            {isPassed
              ? t("testResult.passed", { defaultValue: "Passed!" })
              : t("testResult.failed", { defaultValue: "Not Passed" })}
          </AppText>
          <AppText style={[styles.testTitle, { color: colors.onSurface }]}>
            {testTitle}
          </AppText>
          {subjectName && (
            <AppText style={[styles.subjectName, { color: colors.onSurfaceVariant }]}>
              {subjectName}
            </AppText>
          )}
        </View>

        {/* Score Circle */}
        <AppCard style={styles.scoreCard}>
          <View style={styles.scoreCircleContainer}>
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor: isPassed ? "#16A34A" : colors.error,
                },
              ]}
            >
              <AppText
                style={[
                  styles.scorePercentage,
                  { color: isPassed ? "#16A34A" : colors.error },
                ]}
              >
                {percentage}%
              </AppText>
              <AppText style={[styles.scoreLabel, { color: colors.onSurfaceVariant }]}>
                {t("testResult.score", { defaultValue: "Score" })}
              </AppText>
            </View>
          </View>

          {/* Score Details */}
          <View style={styles.scoreDetails}>
            <View style={styles.scoreDetailItem}>
              <Icon name="check-circle" size={20} color="#16A34A" />
              <AppText style={[styles.scoreDetailValue, { color: colors.onSurface }]}>
                {score}/{totalMarks}
              </AppText>
              <AppText style={[styles.scoreDetailLabel, { color: colors.onSurfaceVariant }]}>
                {t("testResult.marks", { defaultValue: "Marks" })}
              </AppText>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.scoreDetailItem}>
              <Icon name="help-circle" size={20} color={colors.primary} />
              <AppText style={[styles.scoreDetailValue, { color: colors.onSurface }]}>
                {correctAnswers}/{questions?.length || 0}
              </AppText>
              <AppText style={[styles.scoreDetailLabel, { color: colors.onSurfaceVariant }]}>
                {t("testResult.correct", { defaultValue: "Correct" })}
              </AppText>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.scoreDetailItem}>
              <Icon name="clock-outline" size={20} color="#F59E0B" />
              <AppText style={[styles.scoreDetailValue, { color: colors.onSurface }]}>
                {formatTime(attempt?.time_spent_seconds ?? null)}
              </AppText>
              <AppText style={[styles.scoreDetailLabel, { color: colors.onSurfaceVariant }]}>
                {t("testResult.time", { defaultValue: "Time" })}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Passing Info */}
        <AppCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
              {t("testResult.passingScore", { defaultValue: "Passing Score" })}
            </AppText>
            <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
              {attempt?.test?.passing_score || 40}%
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
              {t("testResult.yourScore", { defaultValue: "Your Score" })}
            </AppText>
            <AppText
              style={[
                styles.infoValue,
                { color: isPassed ? "#16A34A" : colors.error },
              ]}
            >
              {percentage}%
            </AppText>
          </View>
        </AppCard>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {showAnswers && (
            <AppButton
              label={t("testResult.reviewAnswers", { defaultValue: "Review Answers" })}
              onPress={handleReviewAnswers}
              variant="outline"
              icon="eye"
            />
          )}
          <AppButton
            label={t("testResult.backToTests", { defaultValue: "Back to Tests" })}
            onPress={handleBack}
            variant="primary"
            icon="clipboard-list"
          />
        </View>

        {/* Encouragement Message */}
        <AppCard
          style={[
            styles.messageCard,
            { backgroundColor: isPassed ? colors.primaryContainer : colors.surfaceVariant },
          ]}
        >
          <Icon
            name={isPassed ? "party-popper" : "lightbulb-outline"}
            size={24}
            color={isPassed ? colors.primary : colors.onSurfaceVariant}
          />
          <AppText
            style={[
              styles.messageText,
              { color: isPassed ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            {isPassed
              ? t("testResult.congratsMessage", {
                  defaultValue: "Great job! Keep up the excellent work!",
                })
              : t("testResult.encourageMessage", {
                  defaultValue: "Don't give up! Review the material and try again.",
                })}
          </AppText>
        </AppCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  resultCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  resultStatus: {
    fontSize: 28,
    fontWeight: "700",
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  subjectName: {
    fontSize: 14,
  },
  scoreCard: {
    padding: 20,
    alignItems: "center",
  },
  scoreCircleContainer: {
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: "700",
  },
  scoreLabel: {
    fontSize: 12,
  },
  scoreDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  scoreDetailItem: {
    alignItems: "center",
    gap: 4,
  },
  scoreDetailValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  scoreDetailLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 50,
  },
  infoCard: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default TestResultScreen;
