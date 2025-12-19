/**
 * TestAttemptScreen - Fixed Screen
 *
 * Purpose: Allow students to take tests with questions, timer, and submission
 * Type: Fixed (not widget-based)
 * Accessible from: TestDetailScreen
 * Roles: student
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  BackHandler,
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

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useTestDetailQuery } from "../../hooks/queries/useTestDetailQuery";
import { useTestQuestionsQuery, TestQuestion } from "../../hooks/queries/useTestQuestionsQuery";
import {
  useStartTestAttempt,
  useSubmitTestAttempt,
  useSaveTestProgress,
  TestAttemptAnswer,
} from "../../hooks/queries/useTestAttemptMutation";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

// User context
import { useDemoUser } from "../../hooks/useDemoUser";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

export const TestAttemptScreen: React.FC<Props> = ({
  screenId = "test-attempt",
  role,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { userId } = useDemoUser();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  // Get params - use userId from useDemoUser as studentId
  const testId = route.params?.testId;
  const studentId = route.params?.studentId || userId;

  // === DATA ===
  const { data: test, isLoading: testLoading } = useTestDetailQuery(testId);
  const { data: questions, isLoading: questionsLoading } = useTestQuestionsQuery(testId);
  const startAttempt = useStartTestAttempt();
  const submitAttempt = useSubmitTestAttempt();
  const saveProgress = useSaveTestProgress();

  // === STATE ===
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const isLoading = testLoading || questionsLoading;
  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { testId },
    });
  }, [screenId, testId]);

  // Start attempt when screen loads
  useEffect(() => {
    if (testId && studentId && !attemptId) {
      startAttempt.mutate(
        { testId, studentId },
        {
          onSuccess: (data) => {
            setAttemptId(data.id);
            // Restore answers if resuming
            if (data.answers && Array.isArray(data.answers)) {
              const restored = new Map<string, string>();
              data.answers.forEach((a: TestAttemptAnswer) => {
                if (a.answer) restored.set(a.questionId, a.answer);
              });
              setAnswers(restored);
            }
          },
          onError: (error) => {
            Alert.alert(
              t("errors.title", { defaultValue: "Error" }),
              t("testAttempt.startError", { defaultValue: "Failed to start test" })
            );
            navigation.goBack();
          },
        }
      );
    }
  }, [testId, studentId]);

  // Initialize timer
  useEffect(() => {
    if (test?.duration_minutes) {
      setTimeRemaining(test.duration_minutes * 60);
    }
  }, [test]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining > 0]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!attemptId) return;

    autoSaveRef.current = setInterval(() => {
      const answerArray: TestAttemptAnswer[] = Array.from(answers.entries()).map(
        ([questionId, answer]) => ({ questionId, answer })
      );
      saveProgress.mutate({ attemptId, answers: answerArray });
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [attemptId, answers]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleExitConfirm();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    handleExitConfirm();
  }, []);

  const handleExitConfirm = useCallback(() => {
    Alert.alert(
      t("testAttempt.exitTitle", { defaultValue: "Exit Test?" }),
      t("testAttempt.exitMessage", { defaultValue: "Your progress will be saved. You can resume later." }),
      [
        { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("testAttempt.exit", { defaultValue: "Exit" }),
          style: "destructive",
          onPress: () => {
            // Save progress before exit
            if (attemptId) {
              const answerArray: TestAttemptAnswer[] = Array.from(answers.entries()).map(
                ([questionId, answer]) => ({ questionId, answer })
              );
              saveProgress.mutate({ attemptId, answers: answerArray });
            }
            navigation.goBack();
          },
        },
      ]
    );
  }, [attemptId, answers, navigation, t]);

  const handleSelectAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, answer);
      return newMap;
    });
    trackEvent("answer_selected", { testId, questionId });
  }, [testId, trackEvent]);

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

  const handleAutoSubmit = useCallback(() => {
    Alert.alert(
      t("testAttempt.timeUp", { defaultValue: "Time's Up!" }),
      t("testAttempt.autoSubmitMessage", { defaultValue: "Your test will be submitted automatically." }),
      [{ text: t("actions.ok", { defaultValue: "OK" }), onPress: () => handleSubmit(true) }]
    );
  }, []);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attemptId || !questions) return;

    const unanswered = questions.filter((q) => !answers.has(q.id)).length;

    if (!isAutoSubmit && unanswered > 0) {
      Alert.alert(
        t("testAttempt.submitTitle", { defaultValue: "Submit Test?" }),
        t("testAttempt.unansweredMessage", {
          defaultValue: "You have {{count}} unanswered questions. Submit anyway?",
          count: unanswered,
        }),
        [
          { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          { text: t("testAttempt.submit", { defaultValue: "Submit" }), onPress: () => doSubmit() },
        ]
      );
    } else if (!isAutoSubmit) {
      Alert.alert(
        t("testAttempt.submitTitle", { defaultValue: "Submit Test?" }),
        t("testAttempt.submitConfirm", { defaultValue: "Are you sure you want to submit?" }),
        [
          { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          { text: t("testAttempt.submit", { defaultValue: "Submit" }), onPress: () => doSubmit() },
        ]
      );
    } else {
      doSubmit();
    }
  }, [attemptId, questions, answers, t]);

  const doSubmit = useCallback(async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const answerArray: TestAttemptAnswer[] = Array.from(answers.entries()).map(
      ([questionId, answer]) => ({ questionId, answer })
    );

    submitAttempt.mutate(
      { attemptId, answers: answerArray, timeSpentSeconds: timeSpent },
      {
        onSuccess: (result) => {
          trackEvent("test_submitted", {
            testId,
            score: result.score,
            percentage: result.percentage,
            isPassed: result.is_passed,
          });
          // Navigate to results
          navigation.replace("test-result", {
            attemptId: result.id,
            testId,
            score: result.score,
            totalMarks: result.total_marks,
            percentage: result.percentage,
            isPassed: result.is_passed,
          });
        },
        onError: () => {
          setIsSubmitting(false);
          Alert.alert(
            t("errors.title", { defaultValue: "Error" }),
            t("testAttempt.submitError", { defaultValue: "Failed to submit test. Please try again." })
          );
        },
      }
    );
  }, [attemptId, answers, startTime, testId, navigation, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 60) return colors.error;
    if (timeRemaining <= 300) return "#F59E0B";
    return colors.onSurface;
  };

  const answeredCount = answers.size;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // === LOADING STATE ===
  if (isLoading || startAttempt.isPending) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("testAttempt.loading", { defaultValue: "Loading test..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (!test || !questions || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("testAttempt.title", { defaultValue: "Test" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="clipboard-alert" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("testAttempt.noQuestions", { defaultValue: "No questions available" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={() => navigation.goBack()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const questionText = getLocalizedField(currentQuestion, "question") || currentQuestion?.question_en;

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header with Timer */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Icon name="clock-outline" size={20} color={getTimerColor()} />
          <AppText style={[styles.timerText, { color: getTimerColor() }]}>
            {formatTime(timeRemaining)}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => handleSubmit(false)}
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          disabled={isSubmitting}
        >
          <AppText style={[styles.submitButtonText, { color: colors.onPrimary }]}>
            {t("testAttempt.submit", { defaultValue: "Submit" })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]}
          />
        </View>
        <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
          {answeredCount}/{totalQuestions} {t("testAttempt.answered", { defaultValue: "answered" })}
        </AppText>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Question Number & Type */}
        <View style={styles.questionHeader}>
          <View style={[styles.questionBadge, { backgroundColor: colors.primaryContainer }]}>
            <AppText style={[styles.questionNumber, { color: colors.primary }]}>
              {t("testAttempt.question", { defaultValue: "Question" })} {currentIndex + 1}
            </AppText>
          </View>
          {currentQuestion?.marks && (
            <AppText style={[styles.marksText, { color: colors.onSurfaceVariant }]}>
              {currentQuestion.marks} {t("testAttempt.marks", { defaultValue: "marks" })}
            </AppText>
          )}
        </View>

        {/* Question Text */}
        <AppCard style={styles.questionCard}>
          <AppText style={[styles.questionText, { color: colors.onSurface }]}>
            {questionText}
          </AppText>
        </AppCard>

        {/* Options for MCQ/True-False */}
        {(currentQuestion?.question_type === "mcq" ||
          currentQuestion?.question_type === "true_false") &&
          currentQuestion?.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option: any, index: number) => {
                // Handle both object format {id, text_en} and simple string format
                const optionId = typeof option === 'object' ? option.id : option;
                const optionText = typeof option === 'object' 
                  ? (i18n.language === 'hi' && option.text_hi ? option.text_hi : option.text_en)
                  : option;
                const isSelected = answers.get(currentQuestion.id) === optionId;
                return (
                  <TouchableOpacity
                    key={optionId || index}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.outlineVariant,
                      },
                    ]}
                    onPress={() => handleSelectAnswer(currentQuestion.id, optionId)}
                  >
                    <View
                      style={[
                        styles.optionIndicator,
                        {
                          backgroundColor: isSelected ? colors.primary : "transparent",
                          borderColor: isSelected ? colors.primary : colors.outline,
                        },
                      ]}
                    >
                      {isSelected && <Icon name="check" size={14} color={colors.onPrimary} />}
                    </View>
                    <AppText
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.primary : colors.onSurface },
                      ]}
                    >
                      {optionText}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
      </ScrollView>

      {/* Question Navigator */}
      <View style={[styles.navigatorContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionNav}>
          {questions.map((q, index) => {
            const isAnswered = answers.has(q.id);
            const isCurrent = index === currentIndex;
            return (
              <TouchableOpacity
                key={q.id}
                style={[
                  styles.navDot,
                  {
                    backgroundColor: isCurrent
                      ? colors.primary
                      : isAnswered
                      ? colors.primaryContainer
                      : colors.surfaceVariant,
                    borderColor: isCurrent ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => handleJumpToQuestion(index)}
              >
                <AppText
                  style={[
                    styles.navDotText,
                    {
                      color: isCurrent
                        ? colors.onPrimary
                        : isAnswered
                        ? colors.primary
                        : colors.onSurfaceVariant,
                    },
                  ]}
                >
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
            { backgroundColor: currentIndex === 0 ? colors.surfaceVariant : colors.primaryContainer },
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
            {t("testAttempt.previous", { defaultValue: "Previous" })}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor:
                currentIndex === totalQuestions - 1 ? colors.surfaceVariant : colors.primaryContainer,
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
                  currentIndex === totalQuestions - 1 ? colors.onSurfaceVariant : colors.primary,
              },
            ]}
          >
            {t("testAttempt.next", { defaultValue: "Next" })}
          </AppText>
          <Icon
            name="chevron-right"
            size={24}
            color={currentIndex === totalQuestions - 1 ? colors.onSurfaceVariant : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Submitting Overlay */}
      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <View style={[styles.submittingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.submittingText, { color: colors.onSurface }]}>
              {t("testAttempt.submitting", { defaultValue: "Submitting your test..." })}
            </AppText>
          </View>
        </View>
      )}
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
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 32,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  marksText: {
    fontSize: 14,
  },
  questionCard: {
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  navigatorContainer: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  questionNav: {
    paddingHorizontal: 16,
  },
  navDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 2,
  },
  navDotText: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  navButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  submittingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
  },
  submittingText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default TestAttemptScreen;
