/**
 * TestAttemptScreen - In-test experience with questions and timer
 * Purpose: Take a test with MCQ questions, timer, and navigation
 * Design: Framer design system with clean test interface
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'TestAttemptScreen'>;

type RouteParams = {
  testId: string;
};

// Data Types
type QuestionType = 'mcq_single';

interface TestQuestion {
  id: string;
  index: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

interface TestAttemptConfig {
  id: string;
  title: string;
  totalTimeSeconds: number;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  selectedBg: '#EBF4FF',
  selectedBorder: '#2D5BFF',
  flagged: '#F59E0B',
  timerWarning: '#EF4444',
};

// Mock Data
const MOCK_TEST_CONFIG: TestAttemptConfig = {
  id: 'test_sample_math',
  title: 'Sample Math Test',
  totalTimeSeconds: 30 * 60,
};

const MOCK_TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 'q1',
    index: 1,
    text: 'If 2x + 3 = 11, what is x?',
    options: ['3', '4', '5', '6'],
    correctOptionIndex: 1,
  },
  {
    id: 'q2',
    index: 2,
    text: 'If 3x + 2 = 11, what is x?',
    options: ['2', '3', '4', '5'],
    correctOptionIndex: 2,
  },
  {
    id: 'q3',
    index: 3,
    text: 'Solve for y: 5y - 7 = 18',
    options: ['3', '4', '5', '6'],
    correctOptionIndex: 2,
  },
  {
    id: 'q4',
    index: 4,
    text: 'What is the value of (3 + 4) × 2?',
    options: ['10', '12', '14', '16'],
    correctOptionIndex: 2,
  },
];

// Custom hook for mock data
function useTestAttemptMock(testId: string) {
  return {
    config: MOCK_TEST_CONFIG,
    questions: MOCK_TEST_QUESTIONS,
  };
}

export default function TestAttemptScreen({ route, navigation }: Props) {
  const params = (route.params as RouteParams) || { testId: '' };
  const { config, questions } = useTestAttemptMock(params.testId);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(config.totalTimeSeconds);

  // Track screen view on mount
  useEffect(() => {
    trackScreenView('TestAttemptScreen', { testId: config.id });
  }, [config.id]);

  // Timer countdown
  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleSubmit();
      return;
    }
    const id = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingSeconds]);

  // Format time label
  const timeLabel = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [remainingSeconds]);

  // Check if time is running low (less than 5 minutes)
  const isTimeLow = remainingSeconds < 300;

  // Current question
  const currentQuestion = questions[currentIndex];
  const selectedOptionIndex = selectedOptions[currentQuestion?.id] ?? null;
  const isFlagged = flaggedQuestions[currentQuestion?.id] ?? false;

  // Calculate progress
  const answeredCount = Object.values(selectedOptions).filter(v => v !== null).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(v => v).length;

  // Handle option selection
  const handleSelectOption = (optionIndex: number) => {
    const q = questions[currentIndex];
    setSelectedOptions(prev => ({ ...prev, [q.id]: optionIndex }));
    trackAction('test_answer_question', 'TestAttemptScreen', {
      testId: config.id,
      questionId: q.id,
      optionIndex,
    });
  };

  // Toggle flag
  const toggleFlag = () => {
    const q = questions[currentIndex];
    setFlaggedQuestions(prev => {
      const newFlagged = !prev[q.id];
      trackAction('test_toggle_flag', 'TestAttemptScreen', {
        testId: config.id,
        questionId: q.id,
        flagged: newFlagged,
      });
      return {
        ...prev,
        [q.id]: newFlagged,
      };
    });
  };

  // Navigation
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  // Submit test
  const handleSubmit = useCallback(() => {
    trackAction('test_submit', 'TestAttemptScreen', {
      testId: config.id,
      answered: answeredCount,
      total: questions.length,
    });

    // Navigate to TestReviewScreen with answers
    navigation.replace('TestReviewScreen', {
      testId: config.id,
      answers: selectedOptions,
    } as any);
  }, [config.id, answeredCount, questions.length, selectedOptions, navigation]);

  // Confirm submit
  const confirmSubmit = () => {
    Alert.alert(
      '📤 Submit Test?',
      `You have answered ${answeredCount} out of ${questions.length} questions.\n\nAre you sure you want to submit?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: handleSubmit,
        },
      ]
    );
  };

  // Handle back button
  const handleBack = () => {
    Alert.alert(
      '⚠️ Exit Test?',
      'Your progress will be lost. Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <T>Loading test...</T>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Exit test"
        >
          <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <T variant="body" weight="bold" style={styles.headerTitle} numberOfLines={1}>
            {config.title}
          </T>
          <View style={styles.timerContainer}>
            <Icon
              name="timer"
              size={16}
              color={isTimeLow ? FRAMER_COLORS.timerWarning : FRAMER_COLORS.textSecondary}
            />
            <T
              variant="caption"
              weight="semiBold"
              style={[
                styles.timerLabel,
                isTimeLow && styles.timerLabelWarning,
              ]}
            >
              {timeLabel}
            </T>
          </View>
        </View>

        <View style={styles.headerRight}>
          <T variant="caption" style={styles.progressText}>
            {answeredCount}/{questions.length}
          </T>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Question Number */}
        <View style={styles.questionHeader}>
          <T variant="body" weight="semiBold" style={styles.questionNumber}>
            Question {currentQuestion.index} / {questions.length}
          </T>
          {isFlagged && (
            <View style={styles.flaggedBadge}>
              <Icon name="flag" size={14} color={FRAMER_COLORS.flagged} />
              <T variant="caption" weight="semiBold" style={styles.flaggedText}>
                Flagged
              </T>
            </View>
          )}
        </View>

        {/* Question Card */}
        <Card style={styles.questionCard}>
          <T variant="body" style={styles.questionText}>
            {currentQuestion.text}
          </T>
        </Card>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionRow,
                  isSelected && styles.optionRowSelected,
                ]}
                onPress={() => handleSelectOption(index)}
                accessibilityRole="radio"
                accessibilityLabel={`Option ${index + 1}: ${option}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
                <T variant="body" style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, currentIndex === 0 && styles.controlButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
          >
            <Icon
              name="chevron-left"
              size={20}
              color={currentIndex === 0 ? FRAMER_COLORS.textSecondary : FRAMER_COLORS.primary}
            />
            <T
              variant="body"
              weight="semiBold"
              style={[
                styles.controlButtonText,
                currentIndex === 0 && styles.controlButtonTextDisabled,
              ]}
            >
              Previous
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
            onPress={toggleFlag}
            accessibilityRole="button"
            accessibilityLabel={isFlagged ? 'Unflag question' : 'Flag question'}
          >
            <Icon name="flag" size={20} color={isFlagged ? FRAMER_COLORS.flagged : FRAMER_COLORS.textSecondary} />
            <T
              variant="body"
              weight="semiBold"
              style={[styles.flagButtonText, isFlagged && styles.flagButtonTextActive]}
            >
              Flag
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              currentIndex === questions.length - 1 && styles.controlButtonDisabled,
            ]}
            onPress={goToNext}
            disabled={currentIndex === questions.length - 1}
            accessibilityRole="button"
            accessibilityLabel="Next question"
          >
            <T
              variant="body"
              weight="semiBold"
              style={[
                styles.controlButtonText,
                currentIndex === questions.length - 1 && styles.controlButtonTextDisabled,
              ]}
            >
              Next
            </T>
            <Icon
              name="chevron-right"
              size={20}
              color={
                currentIndex === questions.length - 1
                  ? FRAMER_COLORS.textSecondary
                  : FRAMER_COLORS.primary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Question Navigation Grid */}
        <Card style={styles.navigationCard}>
          <T variant="body" weight="semiBold" style={styles.navigationTitle}>
            Quick Navigation
          </T>
          <View style={styles.navigationGrid}>
            {questions.map((q, index) => {
              const isAnswered = selectedOptions[q.id] !== null && selectedOptions[q.id] !== undefined;
              const isCurrent = index === currentIndex;
              const isQuestionFlagged = flaggedQuestions[q.id];

              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.navButton,
                    isAnswered && styles.navButtonAnswered,
                    isCurrent && styles.navButtonCurrent,
                  ]}
                  onPress={() => setCurrentIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to question ${q.index}`}
                >
                  <T
                    variant="caption"
                    weight="semiBold"
                    style={[
                      styles.navButtonText,
                      isAnswered && styles.navButtonTextAnswered,
                      isCurrent && styles.navButtonTextCurrent,
                    ]}
                  >
                    {q.index}
                  </T>
                  {isQuestionFlagged && (
                    <View style={styles.navButtonFlagIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={confirmSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit test"
        >
          <T variant="body" weight="bold" style={styles.submitButtonText}>
            📤 Submit Test
          </T>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
  },
  timerLabelWarning: {
    color: FRAMER_COLORS.timerWarning,
    fontWeight: '700',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
  },
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Question Header
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 15,
    color: FRAMER_COLORS.textPrimary,
  },
  flaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  flaggedText: {
    fontSize: 12,
    color: FRAMER_COLORS.flagged,
  },
  // Question Card
  questionCard: {
    padding: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: FRAMER_COLORS.textPrimary,
  },
  // Options
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionRowSelected: {
    backgroundColor: FRAMER_COLORS.selectedBg,
    borderColor: FRAMER_COLORS.selectedBorder,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: FRAMER_COLORS.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: FRAMER_COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
    color: FRAMER_COLORS.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  // Controls
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FRAMER_COLORS.primary,
    gap: 4,
  },
  controlButtonDisabled: {
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 14,
    color: FRAMER_COLORS.primary,
  },
  controlButtonTextDisabled: {
    color: FRAMER_COLORS.textSecondary,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  flagButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: FRAMER_COLORS.flagged,
  },
  flagButtonText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  flagButtonTextActive: {
    color: FRAMER_COLORS.flagged,
  },
  // Navigation Grid
  navigationCard: {
    padding: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  navigationTitle: {
    fontSize: 15,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navButtonAnswered: {
    backgroundColor: '#D1FAE5',
  },
  navButtonCurrent: {
    backgroundColor: FRAMER_COLORS.primary,
  },
  navButtonText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  navButtonTextAnswered: {
    color: '#22C55E',
    fontWeight: '700',
  },
  navButtonTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navButtonFlagIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FRAMER_COLORS.flagged,
  },
  // Submit Button
  submitButton: {
    backgroundColor: FRAMER_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: FRAMER_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
