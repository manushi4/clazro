/**
 * PracticeProblemDetail - Premium Minimal Design
 * Purpose: Detailed view for solving AI-generated practice problems
 * Design: Material Design with problem display, answer input, and solution reveal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'PracticeProblemDetail'>;

interface PracticeProblem {
  id: string;
  subject: string;
  topic: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attempted: boolean;
  correct_answer?: string;
  explanation?: string;
  hints?: string[];
}

export default function PracticeProblemDetail({ route, navigation }: Props) {
  const { user } = useAuth();
  const { problemId } = route.params || {};
  const queryClient = useQueryClient();

  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    trackScreenView('PracticeProblemDetail', { problemId });
  }, [problemId]);

  // Fetch problem details
  const { data: problem, isLoading } = useQuery({
    queryKey: ['practice-problem-detail', problemId],
    queryFn: async () => {
      if (!problemId) throw new Error('No problem ID');

      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        subject: data.subject || 'General',
        topic: data.topic || 'Practice',
        question: data.question || 'Question not available',
        difficulty: data.difficulty || 'medium',
        attempted: data.attempted || false,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        hints: data.hints || [],
      } as PracticeProblem;
    },
    enabled: !!problemId,
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !problemId) throw new Error('Missing user or problem ID');

      const { error } = await supabase
        .from('practice_problems')
        .update({
          attempted: true,
          user_answer: userAnswer,
          attempted_at: new Date().toISOString(),
        })
        .eq('id', problemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-problems'] });
      queryClient.invalidateQueries({ queryKey: ['practice-problem-detail', problemId] });
      setShowSolution(true);
      trackAction('submit_practice_answer', 'PracticeProblemDetail', {
        problemId,
        answerLength: userAnswer.length,
      });
    },
    onError: (error) => {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      Alert.alert('Empty Answer', 'Please enter your answer before submitting.');
      return;
    }

    trackAction('submit_answer_attempt', 'PracticeProblemDetail', { problemId });
    submitAnswerMutation.mutate();
  };

  const handleShowHint = () => {
    trackAction('show_hint', 'PracticeProblemDetail', {
      problemId,
      hintIndex: currentHintIndex,
    });
    setShowHints(true);
  };

  const handleNextHint = () => {
    if (problem?.hints && currentHintIndex < problem.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const handleRevealSolution = () => {
    trackAction('reveal_solution', 'PracticeProblemDetail', { problemId });
    Alert.alert(
      'Reveal Solution?',
      'Are you sure you want to see the solution? This will mark the problem as attempted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal',
          style: 'destructive',
          onPress: () => setShowSolution(true),
        },
      ]
    );
  };

  const handleTryAnother = () => {
    trackAction('try_another_problem', 'PracticeProblemDetail');
    navigation.goBack();
  };

  if (isLoading || !problem) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <View style={styles.loadingContainer}>
          <T variant="body" style={styles.loadingText}>Loading problem...</T>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T style={styles.backIcon}>←</T>
        </TouchableOpacity>
        <T variant="h2" weight="bold" style={styles.headerTitle}>Practice Problem</T>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Problem Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <T variant="caption" style={styles.infoLabel}>Subject</T>
                <T variant="body" weight="semiBold" style={styles.infoValue}>{problem.subject}</T>
              </View>
              <View style={styles.infoItem}>
                <T variant="caption" style={styles.infoLabel}>Topic</T>
                <T variant="body" weight="semiBold" style={styles.infoValue}>{problem.topic}</T>
              </View>
              <View style={styles.infoItem}>
                <T variant="caption" style={styles.infoLabel}>Difficulty</T>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(problem.difficulty) },
                  ]}
                >
                  <T style={styles.difficultyText}>
                    {problem.difficulty.toUpperCase()}
                  </T>
                </View>
              </View>
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <T variant="h3" weight="bold" style={styles.sectionTitle}>Question</T>
            <T variant="body" style={styles.questionText}>{problem.question}</T>
          </View>

          {/* Hints Section */}
          {problem.hints && problem.hints.length > 0 && !showSolution && (
            <View style={styles.hintsCard}>
              {!showHints ? (
                <TouchableOpacity
                  style={styles.hintButton}
                  onPress={handleShowHint}
                  accessibilityRole="button"
                >
                  <T style={styles.hintButtonIcon}>💡</T>
                  <T variant="body" weight="semiBold" style={styles.hintButtonText}>
                    Show Hints
                  </T>
                </TouchableOpacity>
              ) : (
                <View>
                  <T variant="h3" weight="bold" style={styles.sectionTitle}>
                    Hint {currentHintIndex + 1} of {problem.hints.length}
                  </T>
                  <View style={styles.hintContent}>
                    <T variant="body" style={styles.hintText}>
                      {problem.hints[currentHintIndex]}
                    </T>
                  </View>
                  {currentHintIndex < problem.hints.length - 1 && (
                    <TouchableOpacity
                      style={styles.nextHintButton}
                      onPress={handleNextHint}
                    >
                      <T variant="body" weight="semiBold" style={styles.nextHintText}>
                        Next Hint →
                      </T>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Answer Input */}
          {!showSolution && (
            <View style={styles.answerCard}>
              <T variant="h3" weight="bold" style={styles.sectionTitle}>Your Answer</T>
              <TextInput
                style={styles.answerInput}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.revealButton}
                  onPress={handleRevealSolution}
                  accessibilityRole="button"
                >
                  <T variant="body" style={styles.revealButtonText}>Reveal Solution</T>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submitAnswerMutation.isPending && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitAnswerMutation.isPending}
                  accessibilityRole="button"
                >
                  <T variant="body" weight="bold" style={styles.submitButtonText}>
                    {submitAnswerMutation.isPending ? 'Submitting...' : 'Submit Answer'}
                  </T>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Solution Section */}
          {showSolution && problem.correct_answer && (
            <View style={styles.solutionCard}>
              <T variant="h3" weight="bold" style={styles.sectionTitle}>✓ Correct Answer</T>
              <T variant="body" weight="semiBold" style={styles.solutionText}>
                {problem.correct_answer}
              </T>

              {problem.explanation && (
                <>
                  <T variant="h3" weight="bold" style={[styles.sectionTitle, { marginTop: 24 }]}>
                    Explanation
                  </T>
                  <T variant="body" style={styles.explanationText}>
                    {problem.explanation}
                  </T>
                </>
              )}

              <TouchableOpacity
                style={styles.tryAnotherButton}
                onPress={handleTryAnother}
                accessibilityRole="button"
              >
                <T variant="body" weight="bold" style={styles.tryAnotherButtonText}>
                  Try Another Problem
                </T>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#4A90E2',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  hintsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  hintButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  hintButtonText: {
    fontSize: 16,
    color: '#92400E',
  },
  hintContent: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  hintText: {
    fontSize: 15,
    color: '#78350F',
    lineHeight: 22,
  },
  nextHintButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  nextHintText: {
    fontSize: 14,
    color: '#92400E',
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revealButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  solutionCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  solutionText: {
    fontSize: 16,
    color: '#065F46',
    lineHeight: 24,
  },
  explanationText: {
    fontSize: 15,
    color: '#047857',
    lineHeight: 22,
  },
  tryAnotherButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  tryAnotherButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
