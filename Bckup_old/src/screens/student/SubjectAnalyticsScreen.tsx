/**
 * SubjectAnalyticsScreen - Deep stats for one subject
 * Purpose: Show detailed analytics for a specific subject including mastery, topics, tests, and practice
 * Design: Framer design system with comprehensive subject breakdown
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'SubjectAnalyticsScreen'>;

type RouteParams = {
  subjectCode: string; // 'MATH', 'PHYS', etc.
};

// Data Types
interface SubjectOverview {
  subjectCode: string;
  subjectName: string;
  masteryPercent: number;
  avgTestPercent: number;
  assignmentsDoneLabel: string; // "5 / 6"
}

interface TopicAnalytics {
  id: string;
  topicName: string;
  masteryPercent: number;
}

interface SubjectTestItem {
  id: string;
  title: string;
  scorePercent: number;
  dateLabel: string;
}

interface SubjectPracticeStats {
  doubtsResolved: number;
  sessionsCount: number;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  progressBg: '#E5E7EB',
};

// Mock Data
const MOCK_SUBJECT_OVERVIEW: SubjectOverview = {
  subjectCode: 'MATH',
  subjectName: 'Mathematics',
  masteryPercent: 72,
  avgTestPercent: 78,
  assignmentsDoneLabel: '5 / 6',
};

const MOCK_TOPIC_ANALYTICS: TopicAnalytics[] = [
  { id: 't1', topicName: 'Linear equations', masteryPercent: 80 },
  { id: 't2', topicName: 'Quadratics', masteryPercent: 65 },
  { id: 't3', topicName: 'Graphs', masteryPercent: 50 },
];

const MOCK_SUBJECT_TESTS: SubjectTestItem[] = [
  {
    id: 'test1',
    title: 'Sample Math Test',
    scorePercent: 80,
    dateLabel: '3 days ago',
  },
  {
    id: 'test2',
    title: 'Algebra chapter test',
    scorePercent: 72,
    dateLabel: '2 weeks ago',
  },
];

const MOCK_PRACTICE_STATS: SubjectPracticeStats = {
  doubtsResolved: 6,
  sessionsCount: 4,
};

// Hook
function useSubjectAnalyticsMock(subjectCode: string) {
  // TODO: connect to global analytics from Supabase
  return {
    overview: MOCK_SUBJECT_OVERVIEW,
    topics: MOCK_TOPIC_ANALYTICS,
    tests: MOCK_SUBJECT_TESTS,
    practice: MOCK_PRACTICE_STATS,
  };
}

export default function SubjectAnalyticsScreen({ route, navigation }: Props) {
  const params = route.params as RouteParams;
  const subjectCode = params?.subjectCode || 'MATH';

  const { overview, topics, tests, practice } = useSubjectAnalyticsMock(subjectCode);

  useEffect(() => {
    trackScreenView('SubjectAnalyticsScreen', { subjectCode });
  }, [subjectCode]);

  const weakTopics = useMemo(
    () => topics.filter((t) => t.masteryPercent < 70),
    [topics]
  );

  const handlePracticeWithAI = useCallback(() => {
    trackAction('practice_weak_topics_subject', 'SubjectAnalyticsScreen', {
      subjectCode,
      weakTopics: weakTopics.map((t) => t.topicName),
    });
    // @ts-expect-error - Student routes not yet in ParentStackParamList
    safeNavigate('NewEnhancedAIStudy', {
      suggestedTopics: weakTopics.map((t) => t.topicName).join(', '),
      subjectCode,
    });
  }, [subjectCode, weakTopics]);

  const handleTestTap = useCallback(
    (testId: string) => {
      trackAction('view_test_from_subject_analytics', 'SubjectAnalyticsScreen', {
        testId,
        subjectCode,
      });
      navigation.navigate('TestReviewScreen', { testId } as any);
    },
    [subjectCode, navigation]
  );

  const getMasteryColor = (percent: number) => {
    if (percent >= 80) return FRAMER_COLORS.success;
    if (percent >= 60) return FRAMER_COLORS.warning;
    return FRAMER_COLORS.danger;
  };

  const renderProgressBar = (percent: number) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percent}%`,
                backgroundColor: getMasteryColor(percent),
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
            {overview.subjectName} analytics
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <Card style={styles.overviewCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Overview
          </T>

          <View style={styles.statRow}>
            <T variant="body" style={styles.statLabel}>
              Mastery
            </T>
            <T variant="title" weight="bold" style={[styles.statValue, { color: getMasteryColor(overview.masteryPercent) }]}>
              {overview.masteryPercent}%
            </T>
          </View>
          {renderProgressBar(overview.masteryPercent)}

          <View style={styles.statsGrid}>
            <View style={styles.gridItem}>
              <T variant="caption" color="textSecondary">
                Avg test score
              </T>
              <T variant="title" weight="bold" style={styles.gridValue}>
                {overview.avgTestPercent}%
              </T>
            </View>
            <View style={styles.gridItem}>
              <T variant="caption" color="textSecondary">
                Assignments done
              </T>
              <T variant="title" weight="bold" style={styles.gridValue}>
                {overview.assignmentsDoneLabel}
              </T>
            </View>
          </View>
        </Card>

        {/* Topic Analytics Card */}
        <Card style={styles.topicCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Topic breakdown
          </T>

          {topics.map((topic) => (
            <View key={topic.id} style={styles.topicRow}>
              <View style={styles.topicHeader}>
                <T variant="body" style={styles.topicName}>
                  {topic.topicName}
                </T>
                <T variant="body" weight="bold" style={[styles.topicPercent, { color: getMasteryColor(topic.masteryPercent) }]}>
                  {topic.masteryPercent}%
                </T>
              </View>
              {renderProgressBar(topic.masteryPercent)}
            </View>
          ))}
        </Card>

        {/* Tests Card */}
        <Card style={styles.testsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Tests & quizzes
          </T>

          {tests.length === 0 && (
            <T variant="body" color="textSecondary" style={styles.emptyText}>
              No tests yet
            </T>
          )}

          {tests.map((test) => (
            <TouchableOpacity
              key={test.id}
              style={styles.testItem}
              onPress={() => handleTestTap(test.id)}
              accessibilityRole="button"
              accessibilityLabel={`View ${test.title} test result`}
            >
              <View style={styles.testInfo}>
                <T variant="body" weight="semiBold" style={styles.testTitle}>
                  {test.title}
                </T>
                <T variant="caption" color="textSecondary">
                  {test.dateLabel}
                </T>
              </View>
              <View style={styles.testScore}>
                <T variant="body" weight="bold" style={[styles.testScoreText, { color: getMasteryColor(test.scorePercent) }]}>
                  {test.scorePercent}%
                </T>
                <Icon name="chevron-right" size={20} color={FRAMER_COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Practice Card */}
        <Card style={styles.practiceCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Doubts & practice
          </T>

          <View style={styles.practiceStats}>
            <View style={styles.practiceStatRow}>
              <Icon name="help-outline" size={20} color={FRAMER_COLORS.primary} />
              <T variant="body" style={styles.practiceStatText}>
                Doubts resolved: {practice.doubtsResolved}
              </T>
            </View>
            <View style={styles.practiceStatRow}>
              <Icon name="psychology" size={20} color={FRAMER_COLORS.primary} />
              <T variant="body" style={styles.practiceStatText}>
                Practice sessions: {practice.sessionsCount}
              </T>
            </View>
          </View>

          <Button
            variant="primary"
            onPress={handlePracticeWithAI}
            style={styles.practiceButton}
            disabled={weakTopics.length === 0}
          >
            {weakTopics.length > 0 ? 'Practice weak topics with AI' : 'All topics mastered!'}
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
  overviewCard: {
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  statValue: {
    fontSize: 28,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 16,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  gridValue: {
    fontSize: 20,
    color: FRAMER_COLORS.textPrimary,
    marginTop: 4,
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
  topicRow: {
    marginBottom: 20,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  topicPercent: {
    fontSize: 14,
  },
  testsCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  testScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testScoreText: {
    fontSize: 16,
  },
  practiceCard: {
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
  practiceStats: {
    marginBottom: 16,
  },
  practiceStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  practiceStatText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  practiceButton: {
    marginTop: 8,
  },
});
