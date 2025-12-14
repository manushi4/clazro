import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'ChapterDetailScreen'>;

type ChapterTab = 'learn' | 'practice' | 'tests' | 'doubts';
type ChapterLevel = 'easy' | 'medium' | 'hard';
type ResourceType = 'video' | 'note' | 'pdf' | 'example';

type ChapterOverview = {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  unitTitle: string;
  level: ChapterLevel;
  masteryPercent: number;
  completedConcepts: number;
  totalConcepts: number;
  estimatedTime: string;
};

type ChapterResource = {
  id: string;
  chapterId: string;
  title: string;
  type: ResourceType;
  duration?: string;
  isCompleted: boolean;
};

type PracticeSet = {
  id: string;
  chapterId: string;
  title: string;
  questionCount: number;
  difficulty: ChapterLevel;
  estimatedTime: string;
  completionPercent: number;
};

type ChapterTest = {
  id: string;
  chapterId: string;
  title: string;
  totalMarks: number;
  status: 'upcoming' | 'completed' | 'not_started';
  scheduledAt?: string;
  scorePercent?: number;
};

type ChapterDoubt = {
  id: string;
  chapterId: string;
  snippet: string;
  subjectName: string;
  status: 'pending' | 'answered';
  updatedAt: string;
};

const MOCK_CHAPTER_OVERVIEWS: Record<string, ChapterOverview> = {
  ALGEBRA_LINEAR_EQUATIONS: {
    id: 'ALGEBRA_LINEAR_EQUATIONS',
    title: 'Linear Equations in One Variable',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    unitTitle: 'Algebra',
    level: 'medium',
    masteryPercent: 62,
    completedConcepts: 8,
    totalConcepts: 13,
    estimatedTime: '2h 30m',
  },
  PHYSICS_NEWTON_LAWS: {
    id: 'PHYSICS_NEWTON_LAWS',
    title: 'Newton’s Laws of Motion',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    unitTitle: 'Mechanics',
    level: 'hard',
    masteryPercent: 48,
    completedConcepts: 5,
    totalConcepts: 12,
    estimatedTime: '3h 05m',
  },
};

const MOCK_CHAPTER_RESOURCES: Record<string, ChapterResource[]> = {
  ALGEBRA_LINEAR_EQUATIONS: [
    { id: 'res-1', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Intro to Linear Equations', type: 'video', duration: '12:30', isCompleted: true },
    { id: 'res-2', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Formula Sheet PDF', type: 'pdf', isCompleted: false },
    { id: 'res-3', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Worked Examples', type: 'note', isCompleted: false },
  ],
  PHYSICS_NEWTON_LAWS: [
    { id: 'res-4', chapterId: 'PHYSICS_NEWTON_LAWS', title: 'Newton’s Laws Explained', type: 'video', duration: '15:10', isCompleted: false },
    { id: 'res-5', chapterId: 'PHYSICS_NEWTON_LAWS', title: 'Practice Problems PDF', type: 'pdf', isCompleted: false },
  ],
};

const MOCK_PRACTICE_SETS: Record<string, PracticeSet[]> = {
  ALGEBRA_LINEAR_EQUATIONS: [
    { id: 'prac-1', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Fundamentals Set', questionCount: 15, difficulty: 'easy', estimatedTime: '20m', completionPercent: 60 },
    { id: 'prac-2', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Mixed Practice', questionCount: 20, difficulty: 'medium', estimatedTime: '30m', completionPercent: 35 },
  ],
  PHYSICS_NEWTON_LAWS: [
    { id: 'prac-3', chapterId: 'PHYSICS_NEWTON_LAWS', title: 'Forces & Free Body Diagrams', questionCount: 10, difficulty: 'medium', estimatedTime: '25m', completionPercent: 20 },
  ],
};

const MOCK_CHAPTER_TESTS: Record<string, ChapterTest[]> = {
  ALGEBRA_LINEAR_EQUATIONS: [
    { id: 'test-1', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Algebra Checkpoint', totalMarks: 20, status: 'completed', scorePercent: 78 },
    { id: 'test-2', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', title: 'Algebra Quiz (Upcoming)', totalMarks: 15, status: 'upcoming', scheduledAt: 'Tomorrow 5:00 PM' },
  ],
  PHYSICS_NEWTON_LAWS: [
    { id: 'test-3', chapterId: 'PHYSICS_NEWTON_LAWS', title: 'Newton Laws Drill', totalMarks: 25, status: 'not_started' },
  ],
};

const MOCK_CHAPTER_DOUBTS: Record<string, ChapterDoubt[]> = {
  ALGEBRA_LINEAR_EQUATIONS: [
    { id: 'doubt-1', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', snippet: 'How to isolate the variable when there are fractions?', subjectName: 'Math', status: 'answered', updatedAt: '2h ago' },
    { id: 'doubt-2', chapterId: 'ALGEBRA_LINEAR_EQUATIONS', snippet: 'Need another example for word problems.', subjectName: 'Math', status: 'pending', updatedAt: '1d ago' },
  ],
  PHYSICS_NEWTON_LAWS: [
    { id: 'doubt-3', chapterId: 'PHYSICS_NEWTON_LAWS', snippet: 'Confused about friction vs. net force.', subjectName: 'Physics', status: 'pending', updatedAt: '3h ago' },
  ],
};

// TODO: Replace with Supabase-backed chapter data fetching once schema is ready.
function useChapterData(chapterId: string) {
  const fallbackId = MOCK_CHAPTER_OVERVIEWS[chapterId] ? chapterId : 'ALGEBRA_LINEAR_EQUATIONS';
  const overview = MOCK_CHAPTER_OVERVIEWS[fallbackId] ?? MOCK_CHAPTER_OVERVIEWS.ALGEBRA_LINEAR_EQUATIONS;
  const resources = MOCK_CHAPTER_RESOURCES[fallbackId] ?? [];
  const practiceSets = MOCK_PRACTICE_SETS[fallbackId] ?? [];
  const tests = MOCK_CHAPTER_TESTS[fallbackId] ?? [];
  const doubts = MOCK_CHAPTER_DOUBTS[fallbackId] ?? [];

  return {
    overview,
    resources,
    practiceSets,
    tests,
    doubts,
  };
}

const difficultyLabel = (level: ChapterLevel) => {
  if (level === 'easy') return 'Easy';
  if (level === 'hard') return 'Hard';
  return 'Medium';
};

const resourceEmoji = (type: ResourceType) => {
  switch (type) {
    case 'video':
      return '🎬';
    case 'note':
      return '📝';
    case 'pdf':
      return '📄';
    case 'example':
      return '💡';
    default:
      return '📘';
  }
};

const statusPill = (status: ChapterTest['status']) => {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'completed') return 'Completed';
  return 'Not started';
};

const doubtStatusLabel = (status: ChapterDoubt['status']) => (status === 'answered' ? 'Answered' : 'Pending');

const TabChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <Chip label={label} variant="filter" selected={active} onPress={onPress} />
);

export default function ChapterDetailScreen({ route, navigation }: Props) {
  const chapterId = route.params?.chapterId || 'ALGEBRA_LINEAR_EQUATIONS';
  const { overview, resources, practiceSets, tests, doubts } = useChapterData(chapterId);
  const [activeTab, setActiveTab] = useState<ChapterTab>('learn');

  useEffect(() => {
    trackScreenView('ChapterDetailScreen', { chapterId });
  }, [chapterId]);

  const masteryColor = '#2563EB';

  const toggleTab = (tab: ChapterTab) => {
    setActiveTab(tab);
    trackAction('chapter_tab_change', 'ChapterDetailScreen', { tab, chapterId });
  };

  const renderProgressBar = (percent: number, height = 8) => (
    <View style={[styles.progressBar, { height }]}> 
      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: masteryColor }]} />
    </View>
  );

  const LearnTab = () => (
    <ScrollView contentContainerStyle={styles.tabInner} showsVerticalScrollIndicator={false}>
      {resources.length === 0 && (
        <Card style={styles.sectionCard}>
          <T variant="body" color="textSecondary">
            No learning resources yet for this chapter.
          </T>
        </Card>
      )}
      {resources.map((res) => (
        <TouchableOpacity
          key={res.id}
          onPress={() => {
            trackAction('open_resource', 'ChapterDetailScreen', { resourceId: res.id, chapterId });
            navigation.navigate('ResourceDetailScreen', { resourceId: res.id });
          }}
          style={styles.touchable}
        >
          <Card style={styles.sectionCard}>
            <Row style={styles.sectionHeaderRow}>
              <T variant="subtitle" weight="bold">
                {res.title}
              </T>
              <Chip label={`${resourceEmoji(res.type)} ${res.type.toUpperCase()}`} variant="assist" />
            </Row>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              {res.duration ? `${res.duration} · ` : ''}{res.isCompleted ? 'Completed' : 'Not started'}
            </T>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const PracticeTab = () => (
    <ScrollView contentContainerStyle={styles.tabInner} showsVerticalScrollIndicator={false}>
      <Card style={[styles.sectionCard, styles.aiCard]}>
        <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
          AI practice for this chapter
        </T>
        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
          Get a custom set of questions based on your current level.
        </T>
        <Chip label="Recommended" variant="assist" />
        <TouchableOpacity
          onPress={() => {
            trackAction('start_ai_practice', 'ChapterDetailScreen', { chapterId });
            navigation.navigate('NewEnhancedAIStudy', { chapterId, mode: 'practice' });
          }}
          style={styles.primaryButton}
        >
          <T variant="body" weight="bold" color="onPrimary">
            Start AI practice
          </T>
        </TouchableOpacity>
      </Card>

      {practiceSets.length === 0 && (
        <Card style={styles.sectionCard}>
          <T variant="body" color="textSecondary">
            No fixed practice sets yet. Try AI practice.
          </T>
        </Card>
      )}

      {practiceSets.map((set) => (
        <TouchableOpacity
          key={set.id}
          onPress={() => {
            trackAction('open_practice_set', 'ChapterDetailScreen', { practiceSetId: set.id, chapterId });
            Alert.alert('Practice Set', 'Navigation to practice set coming soon.');
          }}
          style={styles.touchable}
        >
          <Card style={styles.sectionCard}>
            <Row style={styles.sectionHeaderRow}>
              <T variant="subtitle" weight="bold">
                {set.title}
              </T>
              <Chip label={difficultyLabel(set.difficulty)} variant="assist" />
            </Row>
            <T variant="caption" color="textSecondary">
              {set.questionCount} questions · {set.estimatedTime}
            </T>
            {renderProgressBar(set.completionPercent, 6)}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const TestsTab = () => (
    <ScrollView contentContainerStyle={styles.tabInner} showsVerticalScrollIndicator={false}>
      {tests.length === 0 && (
        <Card style={styles.sectionCard}>
          <T variant="body" color="textSecondary">
            No tests linked to this chapter yet.
          </T>
        </Card>
      )}
      {tests.map((test) => (
        <TouchableOpacity
          key={test.id}
          onPress={() => {
            if (test.status === 'completed') {
              trackAction('open_chapter_test_review', 'ChapterDetailScreen', { testId: test.id, chapterId });
              navigation.navigate('TestReviewScreen', { testId: test.id, attemptId: 'mockAttemptId' });
            } else {
              trackAction('open_chapter_test', 'ChapterDetailScreen', { testId: test.id, chapterId });
              navigation.navigate('TestAttemptScreen', { testId: test.id, mode: 'practice' });
            }
          }}
          style={styles.touchable}
        >
          <Card style={styles.sectionCard}>
            <Row style={styles.sectionHeaderRow}>
              <T variant="subtitle" weight="bold">
                {test.title}
              </T>
              <Chip label={statusPill(test.status)} variant="assist" />
            </Row>
            {test.scheduledAt ? (
              <T variant="caption" color="textSecondary">
                Scheduled: {test.scheduledAt}
              </T>
            ) : null}
            {test.status === 'completed' && typeof test.scorePercent === 'number' ? (
              <T variant="caption" color="textSecondary">
                Score: {test.scorePercent}%
              </T>
            ) : (
              <T variant="caption" color="textSecondary">
                Marks: {test.totalMarks}
              </T>
            )}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const DoubtsTab = () => (
    <ScrollView contentContainerStyle={styles.tabInner} showsVerticalScrollIndicator={false}>
      <Card style={[styles.sectionCard, styles.aiCard]}>
        <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
          Ask a doubt for this chapter
        </T>
        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
          Attach a photo of the question or type it out.
        </T>
        <TouchableOpacity
          onPress={() => {
            trackAction('ask_chapter_doubt', 'ChapterDetailScreen', { chapterId });
            navigation.navigate('NewDoubtSubmission', { chapterId });
          }}
          style={styles.primaryButton}
        >
          <T variant="body" weight="bold" color="onPrimary">
            Ask doubt
          </T>
        </TouchableOpacity>
      </Card>

      {doubts.length === 0 && (
        <Card style={styles.sectionCard}>
          <T variant="body" color="textSecondary">
            No doubts asked for this chapter yet.
          </T>
        </Card>
      )}

      {doubts.map((doubt) => (
        <TouchableOpacity
          key={doubt.id}
          onPress={() => {
            trackAction('open_chapter_doubt', 'ChapterDetailScreen', { doubtId: doubt.id, chapterId });
            navigation.navigate('DoubtDetailScreen', { doubtId: doubt.id });
          }}
          style={styles.touchable}
        >
          <Card style={styles.sectionCard}>
            <Row style={styles.sectionHeaderRow}>
              <T variant="body" weight="bold">
                {doubt.snippet}
              </T>
              <Chip label={doubtStatusLabel(doubt.status)} variant="assist" />
            </Row>
            <T variant="caption" color="textSecondary">
              {doubt.subjectName} · {doubt.updatedAt}
            </T>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <BaseScreen backgroundColor={Colors.background} scrollable={false} contentContainerStyle={styles.baseContent}>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.lg }} showsVerticalScrollIndicator={false}>
          <Card style={styles.headerCard}>
            <Row style={styles.headerTitleRow}>
              <View style={{ flex: 1 }}>
                <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                  {overview.title}
                </T>
                <T variant="caption" color="textSecondary">
                  {overview.subjectName} · {overview.unitTitle}
                </T>
              </View>
              <Chip label={`${overview.masteryPercent}% mastered`} variant="assist" />
            </Row>
            <Row style={{ marginBottom: Spacing.sm }}>
              <Chip label={`${overview.completedConcepts}/${overview.totalConcepts} concepts`} variant="assist" />
              <Chip label={difficultyLabel(overview.level)} variant="assist" />
              <Chip label={`Est. ${overview.estimatedTime}`} variant="assist" />
            </Row>
            {renderProgressBar(overview.masteryPercent, 8)}
          </Card>

          <Row style={styles.tabsRow}>
            <TabChip label="Learn" active={activeTab === 'learn'} onPress={() => toggleTab('learn')} />
            <TabChip label="Practice" active={activeTab === 'practice'} onPress={() => toggleTab('practice')} />
            <TabChip label="Tests" active={activeTab === 'tests'} onPress={() => toggleTab('tests')} />
            <TabChip label="Doubts" active={activeTab === 'doubts'} onPress={() => toggleTab('doubts')} />
          </Row>

          <View style={styles.tabContentContainer}>
            {activeTab === 'learn' && <LearnTab />}
            {activeTab === 'practice' && <PracticeTab />}
            {activeTab === 'tests' && <TestsTab />}
            {activeTab === 'doubts' && <DoubtsTab />}
          </View>
        </ScrollView>
      </BaseScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  baseContent: {
    paddingHorizontal: Spacing.base,
  },
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  headerTitleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tabContentContainer: {
    flex: 1,
  },
  tabInner: {
    paddingBottom: Spacing.xl,
  },
  sectionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.resting,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  aiCard: {
    backgroundColor: '#EAF2FD',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  touchable: {
    marginBottom: Spacing.sm,
  },
});
