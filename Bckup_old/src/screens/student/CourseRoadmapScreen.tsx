import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui';
import { Chip } from '../../ui';
import { Row } from '../../ui';
import { T } from '../../ui';
import { Button } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

// Types
 type Props = NativeStackScreenProps<any, 'CourseRoadmapScreen'>;

 interface RoadmapChapter {
  id: string;
  title: string;
  completedCount: number;
  totalCount: number;
  progress: number; // 0-100
  estimatedTime: string;
  isLocked?: boolean;
 }

 interface RoadmapUnit {
  id: string;
  title: string;
  progress: number; // 0-100
  chapters: RoadmapChapter[];
 }

 interface RoadmapSubject {
  id: string;
  name: string;
  code: string;
  color: string;
  progress: number;
  units: RoadmapUnit[];
 }

// Mock data
 const ROADMAP_SUBJECTS: RoadmapSubject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    code: 'MATH',
    color: '#2563EB',
    progress: 68,
    units: [
      {
        id: 'math-algebra',
        title: 'Algebra',
        progress: 72,
        chapters: [
          { id: 'math-alg-1', title: 'Linear Equations', completedCount: 3, totalCount: 5, progress: 60, estimatedTime: '2h 10m' },
          { id: 'math-alg-2', title: 'Quadratic Equations', completedCount: 4, totalCount: 6, progress: 67, estimatedTime: '2h 45m' },
          { id: 'math-alg-3', title: 'Polynomials', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 50m' },
          { id: 'math-alg-4', title: 'Sequences & Series', completedCount: 1, totalCount: 4, progress: 25, estimatedTime: '1h 20m', isLocked: true },
        ],
      },
      {
        id: 'math-geometry',
        title: 'Geometry',
        progress: 58,
        chapters: [
          { id: 'math-geo-1', title: 'Triangles', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 40m' },
          { id: 'math-geo-2', title: 'Circles', completedCount: 3, totalCount: 6, progress: 50, estimatedTime: '2h 05m' },
          { id: 'math-geo-3', title: 'Coordinate Geometry', completedCount: 4, totalCount: 6, progress: 67, estimatedTime: '2h 30m' },
        ],
      },
    ],
  },
  {
    id: 'phys',
    name: 'Physics',
    code: 'PHYS',
    color: '#0EA5E9',
    progress: 52,
    units: [
      {
        id: 'phys-mech',
        title: 'Mechanics',
        progress: 60,
        chapters: [
          { id: 'phys-mech-1', title: 'Kinematics', completedCount: 3, totalCount: 6, progress: 50, estimatedTime: '2h 15m' },
          { id: 'phys-mech-2', title: 'Newtonian Dynamics', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '2h 00m' },
          { id: 'phys-mech-3', title: 'Work & Energy', completedCount: 1, totalCount: 4, progress: 25, estimatedTime: '1h 30m' },
        ],
      },
      {
        id: 'phys-thermo',
        title: 'Thermodynamics',
        progress: 44,
        chapters: [
          { id: 'phys-thermo-1', title: 'Heat & Temperature', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 50m' },
          { id: 'phys-thermo-2', title: 'Laws of Thermodynamics', completedCount: 1, totalCount: 4, progress: 25, estimatedTime: '1h 40m', isLocked: true },
          { id: 'phys-thermo-3', title: 'Entropy', completedCount: 0, totalCount: 3, progress: 0, estimatedTime: '1h 15m', isLocked: true },
        ],
      },
    ],
  },
  {
    id: 'chem',
    name: 'Chemistry',
    code: 'CHEM',
    color: '#10B981',
    progress: 47,
    units: [
      {
        id: 'chem-organic',
        title: 'Organic Chemistry',
        progress: 55,
        chapters: [
          { id: 'chem-org-1', title: 'Hydrocarbons', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 55m' },
          { id: 'chem-org-2', title: 'Alcohols & Ethers', completedCount: 3, totalCount: 6, progress: 50, estimatedTime: '2h 20m' },
          { id: 'chem-org-3', title: 'Aldehydes & Ketones', completedCount: 1, totalCount: 4, progress: 25, estimatedTime: '1h 35m', isLocked: true },
        ],
      },
      {
        id: 'chem-physical',
        title: 'Physical Chemistry',
        progress: 40,
        chapters: [
          { id: 'chem-phys-1', title: 'Atomic Structure', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 45m' },
          { id: 'chem-phys-2', title: 'Chemical Kinetics', completedCount: 1, totalCount: 4, progress: 25, estimatedTime: '1h 30m' },
          { id: 'chem-phys-3', title: 'Thermochemistry', completedCount: 2, totalCount: 5, progress: 40, estimatedTime: '1h 50m' },
        ],
      },
    ],
  },
];

// TODO: Replace with Supabase-backed roadmap fetching once schema is ready.
 function useCourseRoadmap() {
  return {
    subjects: ROADMAP_SUBJECTS,
  };
 }

 export default function CourseRoadmapScreen({ navigation }: Props) {
  const { subjects } = useCourseRoadmap();
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id ?? '');
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackScreenView('CourseRoadmapScreen');
  }, []);

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) ?? subjects[0],
    [subjects, activeSubjectId]
  );

  const toggleUnit = useCallback((unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  }, []);

  const completedChaptersCount = (unit: RoadmapUnit) => unit.chapters.filter((c) => c.progress >= 100 || c.completedCount >= c.totalCount).length;
  const totalChaptersCount = (unit: RoadmapUnit) => unit.chapters.length;

  if (!activeSubject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BaseScreen scrollable={false}>
          <View style={styles.emptyState}>
            <T variant="title">No roadmap available yet</T>
            <T variant="body" color="textSecondary">
              We will load your syllabus as soon as it’s ready.
            </T>
          </View>
        </BaseScreen>
      </SafeAreaView>
    );
  }

  const handleOpenChapter = (chapterId: string) => {
    trackAction('open_chapter', 'CourseRoadmapScreen', { chapterId });
    navigation.navigate('ChapterDetailScreen', { chapterId });
  };

  const handleOpenAIStudy = () => {
    trackAction('open_ai_study_from_roadmap', 'CourseRoadmapScreen', { subject: activeSubject.name });
    navigation.navigate('NewEnhancedAIStudy', { subjectId: activeSubject.id, mode: 'dashboard' });
  };

  const subjectChipEmoji = (name: string) => {
    if (name.toLowerCase().includes('math')) return '🧮';
    if (name.toLowerCase().includes('physics')) return '🔭';
    if (name.toLowerCase().includes('chem')) return '⚗️';
    return '📘';
  };

  const renderProgressBar = (percent: number, color: string, height = 8) => (
    <View style={[styles.progressBar, { height }]}> 
      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );

  const totalCompletedChapters = activeSubject.units.reduce((sum, u) => sum + completedChaptersCount(u), 0);
  const totalChapters = activeSubject.units.reduce((sum, u) => sum + totalChaptersCount(u), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BaseScreen backgroundColor={Colors.background} contentContainerStyle={styles.baseContent} scrollable={false}>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <T variant="title" style={{ marginBottom: 4 }}>
              Course roadmap
            </T>
            <T variant="caption" color="textSecondary">
              Track your syllabus by subject.
            </T>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectChipsScroll}>
            <Row style={styles.subjectChipRow}>
              {subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  label={`${subjectChipEmoji(subject.name)} ${subject.name}`}
                  selected={subject.id === activeSubjectId}
                  variant="filter"
                  onPress={() => {
                    setActiveSubjectId(subject.id);
                    trackAction('change_subject', 'CourseRoadmapScreen', { subjectId: subject.id });
                  }}
                />
              ))}
            </Row>
          </ScrollView>

          <Card style={styles.subjectCard}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <View>
                <T variant="subtitle" weight="bold" style={{ marginBottom: 4 }}>
                  {activeSubject.name}
                </T>
                <T variant="caption" color="textSecondary">
                  Completed {totalCompletedChapters}/{totalChapters} chapters
                </T>
              </View>
              <T variant="body" weight="bold">
                {activeSubject.progress}%
              </T>
            </Row>
            {renderProgressBar(activeSubject.progress, activeSubject.color, 10)}
            <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
              Approx study time: 20–30 hours
            </T>
          </Card>

          {activeSubject.units.map((unit) => {
            const expanded = expandedUnitIds.has(unit.id);
            const unitCompleted = completedChaptersCount(unit);
            const unitTotal = totalChaptersCount(unit);
            return (
              <Card key={unit.id} style={styles.unitCard}>
                <TouchableOpacity
                  onPress={() => toggleUnit(unit.id)}
                  style={styles.unitHeader}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${unit.title}`}
                >
                  <View>
                    <T variant="body" weight="bold" style={styles.unitTitle}>
                      {unit.title}
                    </T>
                    <T variant="caption" color="textSecondary">
                      {unitCompleted}/{unitTotal} chapters complete
                    </T>
                  </View>
                  <Row style={{ alignItems: 'center' }}>
                    <T variant="meta" color="textSecondary" style={{ marginRight: Spacing.sm }}>
                      {unit.progress}%
                    </T>
                    <T style={styles.chevron}>{expanded ? '▾' : '▸'}</T>
                  </Row>
                </TouchableOpacity>
                {renderProgressBar(unit.progress, activeSubject.color, 6)}
                {expanded && (
                  <View style={{ marginTop: Spacing.sm }}>
                    {unit.chapters.map((chapter) => (
                      <TouchableOpacity
                        key={chapter.id}
                        style={styles.chapterRow}
                        onPress={() => handleOpenChapter(chapter.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open chapter ${chapter.title}`}
                      >
                        <View style={styles.chapterInfo}>
                          <Row style={{ alignItems: 'center' }}>
                            <T variant="body" style={styles.chapterTitle}>
                              {chapter.title}
                            </T>
                            {chapter.isLocked ? <T style={styles.lockIcon}>🔒</T> : null}
                          </Row>
                          <T variant="caption" color="textSecondary">
                            {chapter.completedCount}/{chapter.totalCount} tasks • {chapter.estimatedTime}
                          </T>
                          {renderProgressBar(chapter.progress, activeSubject.color, 6)}
                        </View>
                        <T variant="body" color="textSecondary">
                          ›
                        </T>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card>
            );
          })}

          <Card style={styles.bottomCtaCard}>
            <T variant="subtitle" style={{ marginBottom: Spacing.xs }}>
              Generate AI study plan for this subject
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
              Use AI to schedule this subject over the next few weeks.
            </T>
            <Button variant="primary" onPress={handleOpenAIStudy}>
              Open AI Study
            </Button>
          </Card>
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
    paddingBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  subjectChipsScroll: {
    marginBottom: Spacing.base,
  },
  subjectChipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  subjectCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  unitCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  unitTitle: {
    marginBottom: 2,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  chapterInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chapterTitle: {
    marginRight: Spacing.xs,
  },
  lockIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bottomCtaCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadows.resting,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
});
