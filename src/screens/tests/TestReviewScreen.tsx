/**
 * TestReviewScreen - Fixed Screen
 *
 * Purpose: Review test answers after submission showing correct/incorrect answers
 * Type: Fixed (not widget-based)
 * Accessible from: TestResultScreen
 * Roles: student
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
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

// Data Hooks
import { useTestAttemptQuery } from "../../hooks/queries/useTestAttemptQuery";
import { useTestQuestionsQuery, TestQuestion } from "../../hooks/queries/useTestQuestionsQuery";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

export const TestReviewScreen: React.FC<Props> = ({
  screenId = "test-review",
  role,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  const attemptId = route.params?.attemptId;
  const testId = route.params?.testId;

  // === DATA ===
  const { data: attempt, isLoading: attemptLoading } = useTestAttemptQuery(attemptId);
  const { data: questions, isLoading: questionsLoading } = useTestQuestionsQuery(
    testId || attempt?.test_id
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const isLoading = attemptLoading || questionsLoading;
  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;

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
  const studentAnswer = useMemo(() => {
    if (!attempt?.answers || !currentQuestion) return null;
    const found = attempt.answers.find((a) => a.questionId === currentQuestion.id);
    return found?.answer || null;
  }, [attempt, currentQuestion]);

  const isCorrect = useMemo(() => {
    if (!studentAnswer || !currentQuestion?.correct_answer) return false;
    return studentAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
  }, [studentAnswer, currentQuestion]);

  const stats = useMemo(() => {
    if (!attempt?.answers || !questions) return { correct: 0, incorrect: 0, unanswered: 0 };
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const ans = attempt.answers?.find((a) => a.questionId === q.id);
      if (!ans?.answer) {
        unanswered++;
      } else if (ans.answer.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return { correct, incorrect, unanswered };
  }, [attempt, questions]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("review_back_pressed", { attemptId });
    navigation.goBack();
  }, [navigation, trackEvent, attemptId]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleJumpToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const getQuestionStatus = (question: TestQuestion) => {
    const ans = attempt?.answers?.find((a) => a.questionId === question.id);
    if (!ans?.answer) return "unanswered";
    if (ans.answer.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim()) {
      return "correct";
    }
    return "incorrect";
  };

  const questionText = getLocalizedField(currentQuestion, "question") || currentQuestion?.question_en;
  const explanationText = getLocalizedField(currentQuestion, "explanation") || currentQuestion?.explanation_en;

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

  if (!questions || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("testReview.title", { defaultValue: "Review Answers" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="clipboard-alert" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("testReview.noQuestions", { defaultValue: "No questions to review" })}
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
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("testReview.title", { defaultValue: "Review Answers" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={16} color="#16A34A" />
          <AppText style={[styles.statText, { color: "#16A34A" }]}>
            {stats.correct} {t("testReview.correct", { defaultValue: "Correct" })}
          </AppText>
        </View>
        <View style={styles.statItem}>
          <Icon name="close-circle" size={16} color={colors.error} />
          <AppText style={[styles.statText, { color: colors.error }]}>
            {stats.incorrect} {t("testReview.incorrect", { defaultValue: "Incorrect" })}
          </AppText>
        </View>
        <View style={styles.statItem}>
          <Icon name="help-circle" size={16} color={colors.onSurfaceVariant} />
          <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
            {stats.unanswered} {t("testReview.skipped", { defaultValue: "Skipped" })}
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <View
            style={[
              styles.questionBadge,
              {
                backgroundColor: isCorrect
                  ? "#DCFCE7"
                  : studentAnswer
                  ? "#FEE2E2"
                  : colors.surfaceVariant,
              },
            ]}
          >
            <Icon
              name={isCorrect ? "check" : studentAnswer ? "close" : "help"}
              size={16}
              color={isCorrect ? "#16A34A" : studentAnswer ? colors.error : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.questionNumber,
                {
                  color: isCorrect
                    ? "#16A34A"
                    : studentAnswer
                    ? colors.error
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              {t("testReview.question", { defaultValue: "Question" })} {currentIndex + 1}
            </AppText>
          </View>
          {currentQuestion?.marks && (
            <AppText style={[styles.marksText, { color: colors.onSurfaceVariant }]}>
              {currentQuestion.marks} {t("testReview.marks", { defaultValue: "marks" })}
            </AppText>
          )}
        </View>

        {/* Question Text */}
        <AppCard style={styles.questionCard}>
          <AppText style={[styles.questionText, { color: colors.onSurface }]}>
            {questionText}
          </AppText>
        </AppCard>

        {/* Options */}
        {currentQuestion?.options && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option: any, index: number) => {
              // Handle both object format {id, text_en} and simple string format
              const optionId = typeof option === 'object' ? option.id : option;
              const optionText = typeof option === 'object' 
                ? (option.text_en || option.id)
                : option;
              const isStudentAnswer = studentAnswer === optionId;
              const isCorrectAnswer = currentQuestion.correct_answer === optionId;

              let bgColor = colors.surface;
              let borderColor = colors.outlineVariant;
              let iconName: string | null = null;
              let iconColor = colors.onSurface;

              if (isCorrectAnswer) {
                bgColor = "#DCFCE7";
                borderColor = "#16A34A";
                iconName = "check-circle";
                iconColor = "#16A34A";
              } else if (isStudentAnswer && !isCorrectAnswer) {
                bgColor = "#FEE2E2";
                borderColor = colors.error;
                iconName = "close-circle";
                iconColor = colors.error;
              }

              return (
                <View
                  key={optionId || index}
                  style={[
                    styles.optionButton,
                    { backgroundColor: bgColor, borderColor },
                  ]}
                >
                  {iconName ? (
                    <Icon name={iconName} size={22} color={iconColor} />
                  ) : (
                    <View style={[styles.optionIndicator, { borderColor: colors.outline }]} />
                  )}
                  <AppText
                    style={[
                      styles.optionText,
                      {
                        color: isCorrectAnswer
                          ? "#16A34A"
                          : isStudentAnswer
                          ? colors.error
                          : colors.onSurface,
                      },
                    ]}
                  >
                    {optionText}
                  </AppText>
                  {isStudentAnswer && (
                    <AppText style={[styles.yourAnswerLabel, { color: colors.onSurfaceVariant }]}>
                      {t("testReview.yourAnswer", { defaultValue: "Your answer" })}
                    </AppText>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Explanation */}
        {explanationText && (
          <AppCard style={[styles.explanationCard, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.explanationHeader}>
              <Icon name="lightbulb-outline" size={18} color={colors.primary} />
              <AppText style={[styles.explanationTitle, { color: colors.primary }]}>
                {t("testReview.explanation", { defaultValue: "Explanation" })}
              </AppText>
            </View>
            <AppText style={[styles.explanationText, { color: colors.onPrimaryContainer }]}>
              {explanationText}
            </AppText>
          </AppCard>
        )}
      </ScrollView>

      {/* Question Navigator */}
      <View style={[styles.navigatorContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionNav}>
          {questions.map((q, index) => {
            const status = getQuestionStatus(q);
            const isCurrent = index === currentIndex;
            let bgColor = colors.surfaceVariant;
            let textColor = colors.onSurfaceVariant;

            if (status === "correct") {
              bgColor = "#DCFCE7";
              textColor = "#16A34A";
            } else if (status === "incorrect") {
              bgColor = "#FEE2E2";
              textColor = colors.error;
            }

            return (
              <TouchableOpacity
                key={q.id}
                style={[
                  styles.navDot,
                  {
                    backgroundColor: bgColor,
                    borderColor: isCurrent ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => handleJumpToQuestion(index)}
              >
                <AppText style={[styles.navDotText, { color: textColor }]}>
                  {index + 1}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.navButtons, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor:
                currentIndex === 0 ? colors.surfaceVariant : colors.primaryContainer,
            },
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Icon
            name="chevron-left"
            size={24}
            color={currentIndex === 0 ? colors.onSurfaceVariant : colors.primary}
          />
          <AppText
            style={[
              styles.navButtonText,
              { color: currentIndex === 0 ? colors.onSurfaceVariant : colors.primary },
            ]}
          >
            {t("testReview.previous", { defaultValue: "Previous" })}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor:
                currentIndex === totalQuestions - 1
                  ? colors.surfaceVariant
                  : colors.primaryContainer,
            },
          ]}
          onPress={handleNext}
          disabled={currentIndex === totalQuestions - 1}
        >
          <AppText
            style={[
              styles.navButtonText,
              {
                color:
                  currentIndex === totalQuestions - 1
                    ? colors.onSurfaceVariant
                    : colors.primary,
              },
            ]}
          >
            {t("testReview.next", { defaultValue: "Next" })}
          </AppText>
          <Icon
            name="chevron-right"
            size={24}
            color={
              currentIndex === totalQuestions - 1 ? colors.onSurfaceVariant : colors.primary
            }
          />
        </TouchableOpacity>
      </View>
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
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  questionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  questionNumber: { fontSize: 14, fontWeight: "600" },
  marksText: { fontSize: 14 },
  questionCard: { padding: 16 },
  questionText: { fontSize: 16, lineHeight: 24 },
  optionsContainer: { gap: 12 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  yourAnswerLabel: { fontSize: 11, fontStyle: "italic" },
  explanationCard: { padding: 16 },
  explanationHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  explanationTitle: { fontSize: 14, fontWeight: "600" },
  explanationText: { fontSize: 14, lineHeight: 22 },
  navigatorContainer: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  questionNav: { paddingHorizontal: 16 },
  navDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 2,
  },
  navDotText: { fontSize: 14, fontWeight: "600" },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  navButtonText: { fontSize: 15, fontWeight: "600" },
});

export default TestReviewScreen;
