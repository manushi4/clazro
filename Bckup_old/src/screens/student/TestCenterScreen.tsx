import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'TestCenterScreen'>;

type TestCategory = 'upcoming' | 'mock' | 'past';
type TestType = 'unit' | 'full' | 'quiz' | 'other';

interface TestItem {
  id: string;
  title: string;
  category: TestCategory;
  subjectName: string;
  subjectCode: string;
  testType: TestType;
  totalMarks: number;
  scheduledDateLabel?: string;
  timeRangeLabel?: string;
  durationLabel?: string;
  score?: number;
  maxScore?: number;
  scorePercent?: number;
}

const MOCK_TESTS: TestItem[] = [
  {
    id: 'test_math_algebra_unit1',
    title: 'Math Unit Test - Algebra',
    category: 'upcoming',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    testType: 'unit',
    totalMarks: 40,
    scheduledDateLabel: 'Tue, 21 Jan',
    timeRangeLabel: '10:00–11:00 AM',
    durationLabel: '1h',
  },
  {
    id: 'test_physics_mechanics_mock',
    title: 'Mock Test - Mechanics',
    category: 'mock',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    testType: 'full',
    totalMarks: 60,
    durationLabel: '1h 30m',
  },
  {
    id: 'test_chemistry_acids_bases_quiz',
    title: 'Quiz - Acids and Bases',
    category: 'upcoming',
    subjectName: 'Chemistry',
    subjectCode: 'CHEM',
    testType: 'quiz',
    totalMarks: 20,
    scheduledDateLabel: 'Tomorrow',
    timeRangeLabel: '4:00–4:30 PM',
    durationLabel: '30 min',
  },
  {
    id: 'test_math_term1_full',
    title: 'Term 1 Math Exam',
    category: 'past',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    testType: 'full',
    totalMarks: 80,
    maxScore: 80,
    score: 64,
    scorePercent: 80,
  },
  {
    id: 'test_physics_weekly_quiz',
    title: 'Weekly Physics Quiz',
    category: 'past',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    testType: 'quiz',
    totalMarks: 25,
    maxScore: 25,
    score: 20,
    scorePercent: 80,
  },
  {
    id: 'test_english_grammar_unit',
    title: 'English Grammar Unit Test',
    category: 'upcoming',
    subjectName: 'English',
    subjectCode: 'ENG',
    testType: 'unit',
    totalMarks: 30,
    scheduledDateLabel: 'Fri, 24 Jan',
    timeRangeLabel: '9:00–9:45 AM',
    durationLabel: '45 min',
  },
];

// TODO: Replace with Supabase-backed tests fetching.
function useTestsMock() {
  const tests = MOCK_TESTS;
  const upcoming = tests.filter((t) => t.category === 'upcoming');
  const mock = tests.filter((t) => t.category === 'mock');
  const past = tests.filter((t) => t.category === 'past');
  const upcomingCount = upcoming.length;
  const mockCount = mock.length;
  const pastCount = past.length;
  const recentPast = past.slice(0, 5);
  const avgScorePercent =
    recentPast.length > 0
      ? Math.round(recentPast.reduce((sum, t) => sum + (t.scorePercent ?? 0), 0) / recentPast.length)
      : null;

  return { tests, upcoming, mock, past, upcomingCount, mockCount, pastCount, avgScorePercent };
}

type TestTab = 'upcoming' | 'mock' | 'past';
type SubjectFilter = 'all' | string;
type TestTypeFilter = 'all' | TestType;

const testTypeLabel = (testType: TestType) => {
  if (testType === 'unit') return 'Unit test';
  if (testType === 'full') return 'Full test';
  if (testType === 'quiz') return 'Quiz';
  return 'Other';
};

export default function TestCenterScreen({ navigation }: Props) {
  const { tests, upcoming, mock, past, upcomingCount, mockCount, pastCount, avgScorePercent } = useTestsMock();
  const [activeTab, setActiveTab] = useState<TestTab>('upcoming');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>('all');

  useEffect(() => {
    trackScreenView('TestCenterScreen');
  }, []);

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    tests.forEach((t) => map.set(t.subjectCode, t.subjectName));
    return Array.from(map.entries());
  }, [tests]);

  const baseList = useMemo(() => {
    if (activeTab === 'mock') return mock;
    if (activeTab === 'past') return past;
    return upcoming;
  }, [activeTab, upcoming, mock, past]);

  const filteredList = useMemo(
    () =>
      baseList.filter((t) => {
        if (subjectFilter !== 'all' && t.subjectCode !== subjectFilter) return false;
        if (testTypeFilter !== 'all' && t.testType !== testTypeFilter) return false;
        return true;
      }),
    [baseList, subjectFilter, testTypeFilter]
  );

  const handleTabChange = (tab: TestTab) => {
    setActiveTab(tab);
    trackAction('test_center_tab_change', 'TestCenterScreen', { tab });
  };

  const handleFiltersChange = (payload: { subject?: SubjectFilter; type?: TestTypeFilter }) => {
    if (payload.subject !== undefined) setSubjectFilter(payload.subject);
    if (payload.type !== undefined) setTestTypeFilter(payload.type);
    trackAction('test_center_filter_change', 'TestCenterScreen', {
      tab: activeTab,
      subjectFilter: payload.subject ?? subjectFilter,
      testTypeFilter: payload.type ?? testTypeFilter,
    });
  };

  const handleUpcomingActions = useCallback(
    (test: TestItem, action: 'details' | 'start') => {
      if (action === 'details') {
        trackAction('open_test_details', 'TestCenterScreen', { testId: test.id });
        Alert.alert('Test details', 'Detailed test view not implemented yet.');
      } else {
        trackAction('start_test', 'TestCenterScreen', { testId: test.id, mode: 'scheduled' });
        navigation.navigate('TestAttemptScreen', { testId: test.id, mode: 'scheduled' } as any);
      }
    },
    [navigation]
  );

  const handleMockActions = useCallback(
    (test: TestItem) => {
      trackAction('start_test', 'TestCenterScreen', { testId: test.id, mode: 'practice' });
      navigation.navigate('TestAttemptScreen', { testId: test.id, mode: 'practice' } as any);
    },
    [navigation]
  );

  const handlePastActions = useCallback(
    (test: TestItem) => {
      trackAction('view_test_result', 'TestCenterScreen', { testId: test.id, scorePercent: test.scorePercent });
      navigation.navigate('TestReviewScreen', { testId: test.id } as any);
    },
    [navigation]
  );

  const renderCardActions = (test: TestItem) => {
    if (activeTab === 'upcoming') {
      return (
        <Row style={styles.actionsRow}>
          <Button variant="outline" onPress={() => handleUpcomingActions(test, 'details')} style={styles.actionButton}>
            View details
          </Button>
          <Button variant="primary" onPress={() => handleUpcomingActions(test, 'start')} style={styles.actionButton}>
            Start now
          </Button>
        </Row>
      );
    }

    if (activeTab === 'mock') {
      return (
        <Row style={styles.actionsRow}>
          <Button variant="primary" onPress={() => handleMockActions(test)} style={styles.actionButton}>
            Attempt now
          </Button>
        </Row>
      );
    }

    return (
      <Row style={styles.actionsRow}>
        <Button variant="secondary" onPress={() => handlePastActions(test)} style={styles.actionButton}>
          View result
        </Button>
      </Row>
    );
  };

  return (
    <BaseScreen backgroundColor={Colors.background} contentContainerStyle={styles.container} scrollable>
      <View style={styles.header}>
        <T variant="title">Tests & practice</T>
        <T variant="caption" color="textSecondary">
          All your upcoming, mock, and past tests in one place.
        </T>
      </View>

      <Card style={styles.summaryCard}>
        <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
          Overview
        </T>
        <T variant="body" color="textSecondary">
          • {upcomingCount} upcoming test(s)
        </T>
        <T variant="body" color="textSecondary">
          • {mockCount} mock test(s)
        </T>
        <T variant="body" color="textSecondary">
          • {pastCount} past test(s)
        </T>
        <T variant="body" color="textSecondary">
          • Avg score (last 5): {avgScorePercent !== null ? `${avgScorePercent}%` : '—'}
        </T>
      </Card>

      <Row style={styles.tabsRow}>
        <Chip label="Upcoming" variant="filter" selected={activeTab === 'upcoming'} onPress={() => handleTabChange('upcoming')} />
        <Chip label="Mock tests" variant="filter" selected={activeTab === 'mock'} onPress={() => handleTabChange('mock')} />
        <Chip label="Past tests" variant="filter" selected={activeTab === 'past'} onPress={() => handleTabChange('past')} />
      </Row>

      <Card style={styles.filtersCard}>
        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
          Subject:
        </T>
        <Row style={styles.chipsRow}>
          <Chip
            label="All"
            selected={subjectFilter === 'all'}
            variant="filter"
            onPress={() => handleFiltersChange({ subject: 'all' })}
          />
          {subjects.map(([code, name]) => (
            <Chip
              key={code}
              label={name}
              selected={subjectFilter === code}
              variant="filter"
              onPress={() => handleFiltersChange({ subject: code })}
            />
          ))}
        </Row>

        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs, marginTop: Spacing.sm }}>
          Type:
        </T>
        <Row style={styles.chipsRow}>
          {(['all', 'unit', 'full', 'quiz', 'other'] as (TestType | 'all')[]).map((type) => (
            <Chip
              key={type}
              label={type === 'all' ? 'All' : testTypeLabel(type as TestType)}
              selected={testTypeFilter === type}
              variant="filter"
              onPress={() => handleFiltersChange({ type })}
            />
          ))}
        </Row>
      </Card>

      <View style={styles.listContainer}>
        {filteredList.length === 0 && (
          <Card style={styles.emptyCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              No tests for this filter
            </T>
            <T variant="body" color="textSecondary">
              Try changing filters or check again later.
            </T>
          </Card>
        )}

        {filteredList.map((test) => (
          <Card key={test.id} style={styles.testCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              {test.title}
            </T>
            <T variant="caption" color="textSecondary">
              {test.subjectName} • {testTypeLabel(test.testType)} • {test.totalMarks} marks
            </T>
            {test.category !== 'past' ? (
              <>
                <T variant="caption" color="textSecondary">
                  When: {test.scheduledDateLabel || 'TBD'} {test.timeRangeLabel ? `• ${test.timeRangeLabel}` : ''}
                </T>
                {test.durationLabel ? (
                  <T variant="caption" color="textSecondary">
                    Duration: {test.durationLabel}
                  </T>
                ) : null}
                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                  Status: {test.category === 'upcoming' ? 'Upcoming' : 'Mock'}
                </T>
              </>
            ) : (
              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                Score: {typeof test.score === 'number' && typeof test.maxScore === 'number' ? `${test.score}/${test.maxScore} (${test.scorePercent}%)` : '—'}
              </T>
            )}

            {renderCardActions(test)}
          </Card>
        ))}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...Shadows.resting,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  filtersCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...Shadows.resting,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  listContainer: {
    marginTop: Spacing.sm,
  },
  testCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...Shadows.resting,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.resting,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
