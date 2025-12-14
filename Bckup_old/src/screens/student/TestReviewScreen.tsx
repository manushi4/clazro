/**
 * TestReviewScreen - Post-test breakdown with score, topics, and question review
 * Purpose: Show test results with detailed analysis and next steps
 * Design: Framer design system with comprehensive review interface
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'TestReviewScreen'>;

type RouteParams = {
  testId: string;
  answers?: Record<string, number | null>;
};

// Data Types
interface TestReviewSummary {
  testId: string;
  title: string;
  scoreLabel: string;
  correctCount: number;
  incorrectCount: number;
  timeTakenLabel: string;
}

interface TopicBreakdownItem {
  id: string;
  topicName: string;
  correct: number;
  total: number;
}

interface ReviewedQuestion {
  id: string;
  index: number;
  text: string;
  yourAnswerLabel: string;
  correctAnswerLabel: string;
  isCorrect: boolean;
  explanation?: string;
  topicName: string;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  correct: '#22C55E',
  incorrect: '#EF4444',
  progressBg: '#E5E7EB',
  weakTopicBg: '#FEF3C7',
};

// Mock Data
const MOCK_TEST_REVIEW_SUMMARY: TestReviewSummary = {
  testId: 'test_sample_math',
  title: 'Sample Math Test',
  scoreLabel: '8 / 10 (80%)',
  correctCount: 8,
  incorrectCount: 2,
  timeTakenLabel: '24 min',
};

const MOCK_TOPIC_BREAKDOWN: TopicBreakdownItem[] = [
  { id: 't1', topicName: 'Linear equations', correct: 3, total: 4 },
  { id: 't2', topicName: 'Quadratics', correct: 2, total: 3 },
  { id: 't3', topicName: 'Others', correct: 3, total: 3 },
];

const MOCK_REVIEWED_QUESTIONS: ReviewedQuestion[] = [
  {
    id: 'q1',
    index: 1,
    text: 'If 2x + 3 = 11, what is x?',
    yourAnswerLabel: '4',
    correctAnswerLabel: '4',
    isCorrect: true,
    explanation: 'Subtract 3 from both sides to get 2x = 8, then divide by 2 to get x = 4.',
    topicName: 'Linear equations',
  },
  {
    id: 'q2',
    index: 2,
    text: 'If 3x + 2 = 11, what is x?',
    yourAnswerLabel: '2',
    correctAnswerLabel: '3',
    isCorrect: false,
    explanation: 'Subtract 2 to get 3x = 9, then divide by 3 to get x = 3.',
    topicName: 'Linear equations',
  },
  {
    id: 'q3',
    index: 3,
    text: 'Solve: x² - 5x + 6 = 0',
    yourAnswerLabel: 'x = 2, 3',
    correctAnswerLabel: 'x = 2, 3',
    isCorrect: true,
    explanation: 'Factor to (x-2)(x-3) = 0, so x = 2 or x = 3.',
    topicName: 'Quadratics',
  },
  {
    id: 'q4',
    index: 4,
    text: 'What is the discriminant of x² + 4x + 4 = 0?',
    yourAnswerLabel: '4',
    correctAnswerLabel: '0',
    isCorrect: false,
    explanation: 'Discriminant = b² - 4ac = 16 - 16 = 0.',
    topicName: 'Quadratics',
  },
  {
    id: 'q5',
    index: 5,
    text: 'Simplify: 2(3x + 4)',
    yourAnswerLabel: '6x + 8',
    correctAnswerLabel: '6x + 8',
    isCorrect: true,
    explanation: 'Distribute: 2 × 3x = 6x, 2 × 4 = 8.',
    topicName: 'Linear equations',
  },
  {
    id: 'q6',
    index: 6,
    text: 'Expand: (x + 2)²',
    yourAnswerLabel: 'x² + 4x + 4',
    correctAnswerLabel: 'x² + 4x + 4',
    isCorrect: true,
    explanation: '(x + 2)² = x² + 2(x)(2) + 2² = x² + 4x + 4.',
    topicName: 'Quadratics',
  },
  {
    id: 'q7',
    index: 7,
    text: 'If 5x - 7 = 13, what is x?',
    yourAnswerLabel: '4',
    correctAnswerLabel: '4',
    isCorrect: true,
    explanation: 'Add 7 to both sides: 5x = 20, then divide by 5: x = 4.',
    topicName: 'Linear equations',
  },
  {
    id: 'q8',
    index: 8,
    text: 'What is 15% of 200?',
    yourAnswerLabel: '30',
    correctAnswerLabel: '30',
    isCorrect: true,
    explanation: '15% = 0.15, so 0.15 × 200 = 30.',
    topicName: 'Others',
  },
  {
    id: 'q9',
    index: 9,
    text: 'Convert 0.75 to a fraction',
    yourAnswerLabel: '3/4',
    correctAnswerLabel: '3/4',
    isCorrect: true,
    explanation: '0.75 = 75/100 = 3/4 (simplified).',
    topicName: 'Others',
  },
  {
    id: 'q10',
    index: 10,
    text: 'What is the LCM of 4 and 6?',
    yourAnswerLabel: '12',
    correctAnswerLabel: '12',
    isCorrect: true,
    explanation: 'Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... LCM = 12.',
    topicName: 'Others',
  },
];

// Hook
function useTestReviewMock(testId: string) {
  // TODO: Hook real test result from Supabase
  return {
    summary: MOCK_TEST_REVIEW_SUMMARY,
    topics: MOCK_TOPIC_BREAKDOWN,
    questions: MOCK_REVIEWED_QUESTIONS,
  };
}

export default function TestReviewScreen({ route, navigation }: Props) {
  const params = route.params as RouteParams;
  const testId = params?.testId || 'test_sample_math';

  const { summary, topics, questions } = useTestReviewMock(testId);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trackScreenView('TestReviewScreen', { testId });
  }, [testId]);

  const weakTopics = useMemo(
    () => topics.filter((t) => t.total > 0 && t.correct / t.total < 0.7),
    [topics]
  );

  const toggleExplanation = useCallback((questionId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }, []);

  const handlePracticeWithAI = useCallback(() => {
    trackAction('practice_weak_topics', 'TestReviewScreen', {
      testId,
      weakTopics: weakTopics.map((t) => t.topicName),
    });
    // @ts-expect-error - Student routes not yet in ParentStackParamList
    safeNavigate('NewEnhancedAIStudy', {
      suggestedTopics: weakTopics.map((t) => t.topicName).join(', '),
    });
  }, [testId, weakTopics]);

  const handleBackToTests = useCallback(() => {
    trackAction('back_to_tests', 'TestReviewScreen', { testId });
    navigation.navigate('TestCenterScreen');
  }, [testId, navigation]);

  const renderTopicProgress = (correct: number, total: number) => {
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: percentage >= 70 ? FRAMER_COLORS.correct : FRAMER_COLORS.incorrect,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <T variant="title" weight="bold" style={styles.headerTitle}>
            Test review
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <T variant="subtitle" weight="bold" style={styles.summaryTitle}>
            {summary.title}
          </T>
          <T variant="hero" weight="bold" style={styles.scoreLabel}>
            {summary.scoreLabel}
          </T>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={20} color={FRAMER_COLORS.correct} />
              <T variant="body" style={styles.statText}>
                Correct: {summary.correctCount}
              </T>
            </View>
            <View style={styles.statItem}>
              <Icon name="cancel" size={20} color={FRAMER_COLORS.incorrect} />
              <T variant="body" style={styles.statText}>
                Incorrect: {summary.incorrectCount}
              </T>
            </View>
          </View>
          <T variant="caption" color="textSecondary" style={styles.timeTaken}>
            Time taken: {summary.timeTakenLabel}
          </T>
        </Card>

        {/* Topic Breakdown Card */}
        <Card style={styles.topicCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Topic breakdown
          </T>
          {topics.map((topic) => (
            <View key={topic.id} style={styles.topicRow}>
              <View style={styles.topicInfo}>
                <T variant="body" style={styles.topicName}>
                  {topic.topicName}
                </T>
                <T variant="caption" color="textSecondary">
                  {topic.correct}/{topic.total} correct
                </T>
              </View>
              {renderTopicProgress(topic.correct, topic.total)}
            </View>
          ))}
        </Card>

        {/* Weak Topics Alert (if any) */}
        {weakTopics.length > 0 && (
          <Card style={styles.weakTopicsCard}>
            <View style={styles.weakTopicsHeader}>
              <Icon name="lightbulb-outline" size={24} color="#F59E0B" />
              <T variant="subtitle" weight="bold" style={styles.weakTopicsTitle}>
                Areas to improve
              </T>
            </View>
            {weakTopics.map((topic) => (
              <T key={topic.id} variant="body" style={styles.weakTopicItem}>
                • {topic.topicName} ({topic.correct}/{topic.total})
              </T>
            ))}
          </Card>
        )}

        {/* Questions Card */}
        <Card style={styles.questionsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Questions
          </T>

          {questions.map((q) => (
            <View key={q.id} style={styles.questionReviewCard}>
              <T variant="body" weight="semiBold" style={styles.questionText}>
                Q{q.index}. {q.text}
              </T>

              <View style={styles.answerRow}>
                <Icon
                  name={q.isCorrect ? 'check-circle' : 'cancel'}
                  size={20}
                  color={q.isCorrect ? FRAMER_COLORS.correct : FRAMER_COLORS.incorrect}
                />
                <T
                  variant="body"
                  style={[
                    styles.answerText,
                    { color: q.isCorrect ? FRAMER_COLORS.correct : FRAMER_COLORS.incorrect },
                  ]}
                >
                  Your answer: {q.yourAnswerLabel}
                </T>
              </View>

              {!q.isCorrect && (
                <View style={styles.answerRow}>
                  <Icon name="check" size={20} color={FRAMER_COLORS.correct} />
                  <T variant="body" style={[styles.answerText, { color: FRAMER_COLORS.correct }]}>
                    Correct answer: {q.correctAnswerLabel}
                  </T>
                </View>
              )}

              {q.explanation && (
                <>
                  <TouchableOpacity
                    style={styles.explanationButton}
                    onPress={() => toggleExplanation(q.id)}
                  >
                    <Icon
                      name={expandedQuestions[q.id] ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={FRAMER_COLORS.primary}
                    />
                    <T variant="caption" style={styles.explanationButtonText}>
                      {expandedQuestions[q.id] ? 'Hide explanation' : 'Show explanation'}
                    </T>
                  </TouchableOpacity>

                  {expandedQuestions[q.id] && (
                    <View style={styles.explanationBox}>
                      <T variant="body" style={styles.explanationText}>
                        {q.explanation}
                      </T>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </Card>

        {/* Next Steps CTA */}
        <Card style={styles.ctaCard}>
          <T variant="subtitle" weight="bold" style={styles.ctaTitle}>
            Next steps
          </T>
          <T variant="body" color="textSecondary" style={styles.ctaDescription}>
            Continue improving your understanding with AI-powered practice
          </T>

          <Button
            variant="primary"
            onPress={handlePracticeWithAI}
            style={styles.ctaButton}
            disabled={weakTopics.length === 0}
          >
            {weakTopics.length > 0 ? 'Practice weak topics with AI' : 'All topics mastered!'}
          </Button>

          <Button variant="outline" onPress={handleBackToTests} style={styles.ctaButton}>
            Back to tests
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 36,
    color: FRAMER_COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  timeTaken: {
    fontSize: 12,
    textAlign: 'center',
  },
  topicCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  topicRow: {
    marginBottom: 16,
  },
  topicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: FRAMER_COLORS.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  weakTopicsCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.weakTopicBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weakTopicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  weakTopicsTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
  },
  weakTopicItem: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  questionsCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questionReviewCard: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  explanationButtonText: {
    fontSize: 12,
    color: FRAMER_COLORS.primary,
  },
  explanationBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  explanationText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  ctaCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  ctaButton: {
    marginBottom: 12,
  },
});
