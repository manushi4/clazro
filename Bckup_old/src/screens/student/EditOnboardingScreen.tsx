import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Chip, T, Card, Row } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import type { ProfileStackParamList } from '../../types/navigation';
import { trackScreenView } from '../../utils/navigationAnalytics';

// Types
 type Props = NativeStackScreenProps<ProfileStackParamList, 'EditOnboardingScreen'>;
 type StudySlot = 'Morning' | 'Afternoon' | 'Evening';
 type OnboardingProfile = {
  board: string;
  grade: string;
  subjects: string[];
  examGoals: string[];
  confidence: Record<string, number>;
  dailyStudyTime: string;
  timeSlot: StudySlot | '';
};

// Mock options
 const BOARD_OPTIONS = [
  { id: 'cbse', label: 'CBSE' },
  { id: 'icse', label: 'ICSE' },
  { id: 'state', label: 'State Board' },
  { id: 'ib', label: 'IB' },
];
 const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
 const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'History', 'Geography', 'Economics'];
 const EXAM_GOALS = ['Boards', 'NEET', 'JEE', 'CUET', 'Other'];
 const STUDY_TIME_OPTIONS = ['30 mins', '60 mins', '90 mins', '3+ hours'];

// Placeholder hooks + update
 function useStudentProfile() {
  // TODO: integrate with Supabase
  const mock: OnboardingProfile = useMemo(
    () => ({
      board: 'cbse',
      grade: 'Class 11',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      examGoals: ['JEE'],
      confidence: { Mathematics: 3, Physics: 4, Chemistry: 3 },
      dailyStudyTime: '60 mins',
      timeSlot: 'Evening',
    }),
    []
  );
  return { data: mock, isLoading: false };
 }

 async function updateStudentProfile(_profile: OnboardingProfile) {
  // TODO: integrate with Supabase
  return new Promise((resolve) => setTimeout(resolve, 400));
 }

// Shared UI bits
 const OptionCard: React.FC<{ label: string; selected: boolean; onPress: () => void; description?: string }> = ({
  label,
  selected,
  onPress,
  description,
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.optionCard, selected && styles.optionCardSelected]} activeOpacity={0.9}>
    <T variant="subtitle" style={styles.optionTitle}>
      {label}
    </T>
    {description ? (
      <T variant="caption" color="textSecondary">
        {description}
      </T>
    ) : null}
  </TouchableOpacity>
 );

 const SubjectChip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <View style={styles.chipItem}>
    <Chip label={label} selected={selected} variant="filter" onPress={onPress} />
  </View>
 );

 const GoalCard: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.goalCard, selected && styles.goalCardSelected]} activeOpacity={0.9}>
    <T variant="subtitle" style={{ color: selected ? Colors.primary : Colors.textPrimary }}>
      {label}
    </T>
  </TouchableOpacity>
 );

 const SliderDots: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <Row style={styles.sliderRow}>
    {[1, 2, 3, 4, 5].map((v) => (
      <TouchableOpacity
        key={v}
        style={[
          styles.sliderDot,
          v <= value ? styles.sliderDotActive : styles.sliderDotInactive,
          v === value && styles.sliderDotCurrent,
        ]}
        onPress={() => onChange(v)}
        activeOpacity={0.9}
      />
    ))}
  </Row>
 );

export default function EditOnboardingScreen({ navigation }: Props) {
  const { data: initialProfile, isLoading } = useStudentProfile();
  const [profile, setProfile] = useState<OnboardingProfile>(
    initialProfile || {
      board: '',
      grade: '',
      subjects: [],
      examGoals: [],
      confidence: {},
      dailyStudyTime: '',
      timeSlot: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState<boolean>(!!initialProfile);

  useEffect(() => {
    trackScreenView('EditOnboardingScreen');
  }, []);

  useEffect(() => {
    if (initialProfile && !hydrated) {
      setProfile(initialProfile);
      setHydrated(true);
    }
  }, [initialProfile, hydrated]);

  const setBoard = (board: string) => setProfile((prev) => ({ ...prev, board }));
  const setGrade = (grade: string) => setProfile((prev) => ({ ...prev, grade }));
  const toggleSubject = (subject: string) =>
    setProfile((prev) => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      const confidence = { ...prev.confidence };
      if (!subjects.includes(subject)) {
        delete confidence[subject];
      } else if (!confidence[subject]) {
        confidence[subject] = 3;
      }
      return { ...prev, subjects, confidence };
    });
  const toggleGoal = (goal: string) =>
    setProfile((prev) => {
      const examGoals = prev.examGoals.includes(goal)
        ? prev.examGoals.filter((g) => g !== goal)
        : [...prev.examGoals, goal];
      return { ...prev, examGoals };
    });
  const setConfidence = (subject: string, level: number) =>
    setProfile((prev) => ({ ...prev, confidence: { ...prev.confidence, [subject]: level } }));
  const setDailyStudyTime = (time: string) => setProfile((prev) => ({ ...prev, dailyStudyTime: time }));
  const setTimeSlot = (slot: StudySlot) => setProfile((prev) => ({ ...prev, timeSlot: slot }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudentProfile(profile);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const ready = useMemo(
    () =>
      Boolean(
        profile.board &&
          profile.grade &&
          profile.subjects.length &&
          profile.examGoals.length &&
          profile.dailyStudyTime &&
          profile.timeSlot
      ),
    [profile]
  );

  if (isLoading && !initialProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={Colors.primary} />
          <T variant="body" style={{ marginTop: Spacing.sm }}>
            Loading profile...
          </T>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Card style={styles.topBar}>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
            <T style={styles.icon}>←</T>
          </TouchableOpacity>
          <T variant="headline" style={styles.topTitle}>
            Edit Onboarding
          </T>
          <View style={{ width: 24 }} />
        </Row>
      </Card>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Board & Class
          </T>
          <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
            Select your board
          </T>
          <View style={styles.optionGrid}>
            {BOARD_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                label={opt.label}
                selected={profile.board === opt.id}
                onPress={() => setBoard(opt.id)}
              />
            ))}
          </View>
          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}>
            Choose your class / grade
          </T>
          <View style={styles.chipWrap}>
            {CLASS_OPTIONS.map((grade) => (
              <SubjectChip key={grade} label={grade} selected={profile.grade === grade} onPress={() => setGrade(grade)} />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Subjects
          </T>
          <View style={styles.chipWrap}>
            {SUBJECT_OPTIONS.map((subject) => (
              <SubjectChip
                key={subject}
                label={subject}
                selected={profile.subjects.includes(subject)}
                onPress={() => toggleSubject(subject)}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Exam goals
          </T>
          <View style={styles.goalGrid}>
            {EXAM_GOALS.map((goal) => (
              <GoalCard key={goal} label={goal} selected={profile.examGoals.includes(goal)} onPress={() => toggleGoal(goal)} />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Confidence per subject
          </T>
          {profile.subjects.length === 0 ? (
            <T variant="body" color="textSecondary">
              Select at least one subject to rate confidence.
            </T>
          ) : (
            profile.subjects.map((subject) => (
              <View key={subject} style={styles.confidenceRow}>
                <Row style={styles.confidenceHeader}>
                  <T variant="body" style={styles.confidenceLabel}>
                    {subject}
                  </T>
                  <T variant="meta" color="textSecondary">
                    Level {profile.confidence[subject] || 3}/5
                  </T>
                </Row>
                <SliderDots value={profile.confidence[subject] || 3} onChange={(v) => setConfidence(subject, v)} />
              </View>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Study preferences
          </T>
          <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
            Daily available time
          </T>
          <View style={styles.optionGrid}>
            {STUDY_TIME_OPTIONS.map((slot) => (
              <OptionCard
                key={slot}
                label={slot}
                selected={profile.dailyStudyTime === slot}
                onPress={() => setDailyStudyTime(slot)}
              />
            ))}
          </View>
          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}>
            Preferred time slot
          </T>
          <View style={styles.chipWrap}>
            {(['Morning', 'Afternoon', 'Evening'] as StudySlot[]).map((slot) => (
              <SubjectChip key={slot} label={slot} selected={profile.timeSlot === slot} onPress={() => setTimeSlot(slot)} />
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footerBar}>
        <Button variant="outline" onPress={() => navigation.goBack()} style={styles.footerButton}>
          Cancel
        </Button>
        <Button variant="primary" onPress={handleSave} disabled={!ready} loading={saving} style={styles.footerButton}>
          Save changes
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    margin: Spacing.base,
    ...Shadows.resting,
  },
  topTitle: {
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.resting,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipItem: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  optionGrid: {
    flexDirection: 'column',
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  optionTitle: {
    marginBottom: Spacing.xs,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  goalCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  confidenceRow: {
    marginBottom: Spacing.md,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  confidenceLabel: {
    color: Colors.textPrimary,
  },
  sliderRow: {
    alignItems: 'center',
  },
  sliderDot: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  sliderDotInactive: {
    backgroundColor: Colors.surface,
  },
  sliderDotActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  sliderDotCurrent: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerButton: {
    flex: 1,
  },
});
