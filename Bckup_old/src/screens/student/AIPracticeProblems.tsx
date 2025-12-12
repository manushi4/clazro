/**
 * AIPracticeProblems - Premium Minimal Design
 * Purpose: AI-generated practice problems for self-study
 * Used in: StudentNavigator (AssignmentsStack) - from NewAIStudyScreen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui/surfaces/Card';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'AIPracticeProblems'>;

interface PracticeProblem {
  id: string;
  subject: string;
  topic: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attempted: boolean;
}

export default function AIPracticeProblems({ navigation }: Props) {
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  React.useEffect(() => {
    trackScreenView('AIPracticeProblems');
  }, []);

  // Fetch practice problems from database
  const { data: problems, isLoading, error, refetch } = useQuery({
    queryKey: ['practice-problems', user?.id, selectedDifficulty],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      let query = supabase
        .from('practice_problems')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(prob => ({
        id: prob.id,
        subject: prob.subject || 'General',
        topic: prob.topic || 'Practice',
        question: prob.question || 'Question not available',
        difficulty: prob.difficulty || 'medium',
        attempted: prob.attempted || false,
      })) as PracticeProblem[];
    },
    enabled: !!user?.id,
  });

  const difficultyOptions = [
    { id: 'all', label: 'All', value: null },
    { id: 'easy', label: 'Easy', value: 'easy' },
    { id: 'medium', label: 'Medium', value: 'medium' },
    { id: 'hard', label: 'Hard', value: 'hard' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleProblemPress = (problem: PracticeProblem) => {
    trackAction('start_practice_problem', 'AIPracticeProblems', {
      problemId: problem.id,
      difficulty: problem.difficulty,
    });

    navigation.navigate('PracticeProblemDetail', { problemId: problem.id });
  };

  const handleGenerateNew = () => {
    trackAction('generate_problems', 'AIPracticeProblems', {
      difficulty: selectedDifficulty || 'all',
    });

    Alert.alert(
      '✨ AI Problem Generation',
      'AI-powered problem generation launching soon!\n\n🚀 Coming features:\n✓ Auto-generate problems by topic\n✓ Adaptive difficulty levels\n✓ Personalized to your weak areas\n✓ Instant problem creation\n\nCurrent options:\n\n📚 Practice with existing problems above\n🔄 Refresh to see new teacher-added problems\n📝 Request specific topics via "Submit Doubt"',
      [
        { text: 'Got it' },
        { text: 'Refresh List', onPress: () => refetch() }
      ]
    );
  };

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error ? 'Failed to load practice problems' : null}
      empty={!problems || problems.length === 0}
      emptyMessage="No practice problems available. Generate new ones!"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <T variant="h2" weight="bold">
            Practice Problems
          </T>
          <T variant="body" style={styles.subtitle}>
            Improve your skills with AI-generated questions
          </T>
        </Card>

        {/* Difficulty Filter */}
        <Card style={styles.filterCard}>
          <T variant="caption" style={styles.filterLabel}>
            Difficulty Level
          </T>
          <View style={styles.filterButtons}>
            {difficultyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterButton,
                  selectedDifficulty === option.value && styles.filterButtonActive,
                ]}
                onPress={() => {
                  trackAction('filter_difficulty', 'AIPracticeProblems', { difficulty: option.value });
                  setSelectedDifficulty(option.value);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${option.label}`}
              >
                <T
                  variant="caption"
                  weight="semiBold"
                  style={selectedDifficulty === option.value && styles.filterTextActive}
                >
                  {option.label}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateNew}
          accessibilityRole="button"
          accessibilityLabel="Generate new practice problems"
        >
          <T variant="body" weight="semiBold" style={styles.generateText}>
            ✨ Generate New Problems
          </T>
        </TouchableOpacity>

        {/* Problems List */}
        {problems && problems.length > 0 && (
          <View style={styles.problemsList}>
            {problems.map((problem) => (
              <TouchableOpacity
                key={problem.id}
                onPress={() => handleProblemPress(problem)}
                accessibilityRole="button"
                accessibilityLabel={`Practice problem: ${problem.topic}`}
              >
                <Card style={styles.problemCard}>
                  <View style={styles.problemHeader}>
                    <View style={styles.problemMeta}>
                      <T variant="caption" weight="semiBold" style={styles.subject}>
                        {problem.subject}
                      </T>
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(problem.difficulty) + '20' },
                        ]}
                      >
                        <T
                          variant="caption"
                          style={{ color: getDifficultyColor(problem.difficulty) }}
                        >
                          {problem.difficulty.toUpperCase()}
                        </T>
                      </View>
                    </View>
                    {problem.attempted && (
                      <T variant="body">✅</T>
                    )}
                  </View>
                  <T variant="body" weight="semiBold" style={styles.topic}>
                    {problem.topic}
                  </T>
                  <T variant="caption" style={styles.question} numberOfLines={2}>
                    {problem.question}
                  </T>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,

  },
  subtitle: {
    color: '#6B7280',
  },
  filterCard: {
    padding: 16,
    marginBottom: 16,

  },
  filterLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButtons: {
    flexDirection: 'row',

  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  generateButton: {
    padding: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateText: {
    color: '#FFFFFF',
  },
  problemsList: {

    marginBottom: 32,
  },
  problemCard: {
    padding: 16,

  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  problemMeta: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  subject: {
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topic: {
    marginBottom: 4,
  },
  question: {
    color: '#6B7280',
    lineHeight: 18,
  },
});
