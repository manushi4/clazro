import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Button, Chip, T, Card, Row } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import type { ProfileStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ProfileStackParamList, 'StudentOnboardingFlow'> & {
  isFirstTime?: boolean;
  onComplete?: () => void;
};

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

const BOARD_OPTIONS = [
  { id: 'cbse', label: 'CBSE', description: 'Central Board' },
  { id: 'icse', label: 'ICSE', description: 'Council Board' },
  { id: 'state', label: 'State Board', description: 'Regional syllabus' },
  { id: 'ib', label: 'IB', description: 'International Baccalaureate' },
];

const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science',
  'History',
  'Geography',
  'Economics',
];

const EXAM_GOALS = ['Boards', 'NEET', 'JEE', 'CUET', 'Other'];

const STUDY_TIME_OPTIONS = ['30 mins', '60 mins', '90 mins', '3+ hours'];

async function saveStudentProfile(_profile: OnboardingProfile) {
  // TODO: integrate with Supabase
  return new Promise((resolve) => setTimeout(resolve, 500));
}

const StepHeader: React.FC<{ step: number; total: number; title: string; subtitle: string }> = ({
  step,
  total,
  title,
  subtitle,
}) => (
  <View style={styles.stepHeader}>
    <View style={styles.stepMeta}>
      <T variant="meta" color="textSecondary">
        Step {step} of {total}
      </T>
      <T variant="meta" color="textSecondary">
        {title}
      </T>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
    </View>
    <T variant="title" style={styles.stepTitle}>
      {title}
    </T>
    <T variant="body" color="textSecondary" style={styles.stepSubtitle}>
      {subtitle}
    </T>
  </View>
);

const OptionCard: React.FC<{
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, description, selected, onPress }) => (
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
  <TouchableOpacity
    onPress={onPress}
    style={[styles.goalCard, selected && styles.goalCardSelected]}
    activeOpacity={0.9}
  >
    <T variant="subtitle" style={{ color: selected ? Colors.primary : Colors.textPrimary }}>
      {label}
    </T>
  </TouchableOpacity>
);

const SliderDots: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => (
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

export default function StudentOnboardingFlow({ navigation, isFirstTime = false, onComplete }: Props) {
  const totalSteps = 7;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>({
    board: '',
    grade: '',
    subjects: [],
    examGoals: [],
    confidence: {},
    dailyStudyTime: '',
    timeSlot: '',
  });

  useEffect(() => {
    trackScreenView('StudentOnboardingFlow', { isFirstTime });
  }, [isFirstTime]);

  const stepTitles = [
    'Welcome aboard',
    'Board & Class',
    'Choose subjects',
    'Exam goals',
    'Confidence check',
    'Study preferences',
    'Summary',
  ];

  const stepDescriptions = [
    'We will tailor your learning plan to your goals.',
    'Pick your board and class to personalize content.',
    'Tell us the subjects you study.',
    'Select exam tracks you are targeting.',
    'Rate confidence per subject to balance practice.',
    'Choose how long and when you prefer to study.',
    'Review your choices before we start.',
  ];

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return Boolean(profile.board && profile.grade);
      case 3:
        return profile.subjects.length > 0;
      case 4:
        return profile.examGoals.length > 0;
      case 5:
        return profile.subjects.every((subject) => profile.confidence[subject]);
      case 6:
        return Boolean(profile.dailyStudyTime && profile.timeSlot);
      default:
        return true;
    }
  }, [step, profile]);

  const isProfileComplete = useMemo(
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
      const exists = prev.examGoals.includes(goal);
      const examGoals = exists ? prev.examGoals.filter((g) => g !== goal) : [...prev.examGoals, goal];
      return { ...prev, examGoals };
    });

  const setConfidence = (subject: string, level: number) =>
    setProfile((prev) => ({ ...prev, confidence: { ...prev.confidence, [subject]: level } }));

  const setDailyStudyTime = (time: string) => setProfile((prev) => ({ ...prev, dailyStudyTime: time }));
  const setTimeSlot = (slot: StudySlot) => setProfile((prev) => ({ ...prev, timeSlot: slot }));

  const handleNext = () => {
    if (!canProceed) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSkip = () => {
    if (isFirstTime) {
      Alert.alert(
        'Skip Profile Setup?',
        'Completing your profile helps us personalize your learning experience with relevant study materials, practice problems, and progress tracking.',
        [
          { text: 'Complete Now', style: 'cancel' },
          {
            text: 'Skip for Now',
            style: 'destructive',
            onPress: () => {
              trackAction('onboarding_skipped', 'StudentOnboardingFlow', { step });
              if (onComplete) {
                onComplete();
              }
            },
          },
        ]
      );
    } else {
      // If not first time, just go back
      navigation.goBack();
    }
  };

  const handleFinish = async () => {
    if (!isProfileComplete) return;
    setSaving(true);
    try {
      await saveStudentProfile(profile);
      trackAction('onboarding_completed', 'StudentOnboardingFlow', { isFirstTime });

      // If onComplete callback is provided (first-time flow), use it
      if (onComplete) {
        onComplete();
      } else {
        // Otherwise, navigate back to profile (when accessed from Profile tab)
        navigation.navigate('StudentProfileScreen');
      }
    } finally {
      setSaving(false);
    }
  };

  const boardLabel = useMemo(
    () => BOARD_OPTIONS.find((b) => b.id === profile.board)?.label || 'Not selected',
    [profile.board]
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Card style={styles.heroCard}>
              <T variant="headline" style={styles.heroTitle} color={Colors.onPrimary}>
                Welcome to your personalized study journey
              </T>
              <T variant="body" color={Colors.onPrimary} style={styles.heroSubtitle}>
                We’ll capture your board, subjects, goals, and study rhythm to tailor your plan.
              </T>
              <Button variant="secondary" size="lg" onPress={handleNext} style={styles.heroButton}>
                Get started
              </Button>
            </Card>
            <Card style={styles.card}>
              <T variant="subtitle" style={styles.cardTitle}>
                What we’ll set up
              </T>
              {['Board, class, and exam focus', 'Subjects with confidence levels', 'Daily time & preferred slot'].map(
                (item) => (
                  <Row key={item} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <T variant="body" color="textSecondary">
                      {item}
                    </T>
                  </Row>
                )
              )}
            </Card>
          </>
        );
      case 2:
        return (
          <>
            <Card style={styles.card}>
              <T variant="subtitle" style={styles.cardTitle}>
                Select your board
              </T>
              <View style={styles.optionGrid}>
                {BOARD_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    description={opt.description}
                    selected={profile.board === opt.id}
                    onPress={() => setBoard(opt.id)}
                  />
                ))}
              </View>
            </Card>
            <Card style={styles.card}>
              <T variant="subtitle" style={styles.cardTitle}>
                Choose your class / grade
              </T>
              <View style={styles.chipWrap}>
                {CLASS_OPTIONS.map((grade) => (
                  <SubjectChip key={grade} label={grade} selected={profile.grade === grade} onPress={() => setGrade(grade)} />
                ))}
              </View>
            </Card>
          </>
        );
      case 3:
        return (
          <Card style={styles.card}>
            <T variant="subtitle" style={styles.cardTitle}>
              Which subjects are you focusing on?
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
        );
      case 4:
        return (
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
        );
      case 5:
        return (
          <Card style={styles.card}>
            <T variant="subtitle" style={styles.cardTitle}>
              Confidence per subject
            </T>
            {profile.subjects.length === 0 ? (
              <T variant="body" color="textSecondary">
                Add at least one subject to rate confidence.
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
        );
      case 6:
        return (
          <>
            <Card style={styles.card}>
              <T variant="subtitle" style={styles.cardTitle}>
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
            </Card>
            <Card style={styles.card}>
              <T variant="subtitle" style={styles.cardTitle}>
                Preferred time slot
              </T>
              <View style={styles.chipWrap}>
                {(['Morning', 'Afternoon', 'Evening'] as StudySlot[]).map((slot) => (
                  <SubjectChip key={slot} label={slot} selected={profile.timeSlot === slot} onPress={() => setTimeSlot(slot)} />
                ))}
              </View>
            </Card>
          </>
        );
      case 7:
      default:
        return (
          <Card style={styles.card}>
            <T variant="subtitle" style={styles.cardTitle}>
              Summary
            </T>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Board
              </T>
              <T variant="body">{boardLabel}</T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Class
              </T>
              <T variant="body">{profile.grade || 'Not selected'}</T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Subjects
              </T>
              <T variant="body">{profile.subjects.length ? profile.subjects.join(', ') : 'Not selected'}</T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Exam goals
              </T>
              <T variant="body">{profile.examGoals.length ? profile.examGoals.join(', ') : 'Not selected'}</T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Confidence
              </T>
              <T variant="body">
                {profile.subjects.length
                  ? profile.subjects.map((s) => `${s}: ${profile.confidence[s] || 3}/5`).join(' • ')
                  : 'Not provided'}
              </T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Daily study time
              </T>
              <T variant="body">{profile.dailyStudyTime || 'Not set'}</T>
            </View>
            <View style={styles.summaryRow}>
              <T variant="label" color="textSecondary">
                Preferred slot
              </T>
              <T variant="body">{profile.timeSlot || 'Not set'}</T>
            </View>
          </Card>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BaseScreen backgroundColor={Colors.background} contentContainerStyle={styles.baseContent}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          <StepHeader
            step={step}
            total={totalSteps}
            title={stepTitles[step - 1]}
            subtitle={stepDescriptions[step - 1]}
          />

          {renderStep()}

          <View style={styles.footer}>
            {step > 1 && (
              <Button variant="outline" onPress={handleBack} style={[styles.footerButton, styles.footerButtonSpacer]}>
                Back
              </Button>
            )}
            {step < totalSteps && (
              <Button onPress={handleNext} disabled={!canProceed} style={styles.footerButton}>
                Next
              </Button>
            )}
            {step === totalSteps && (
              <Button onPress={handleFinish} disabled={!isProfileComplete} loading={saving} style={styles.footerButton}>
                Finish
              </Button>
            )}
          </View>

          {/* Skip button for first-time users */}
          {isFirstTime && (
            <View style={styles.skipContainer}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <T variant="caption" color="textSecondary" style={styles.skipText}>
                  Skip for now
                </T>
              </TouchableOpacity>
            </View>
          )}
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
    paddingBottom: Spacing['2xl'],
  },
  stepHeader: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.resting,
  },
  stepMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  stepTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.hover,
  },
  heroTitle: {
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    marginBottom: Spacing.lg,
  },
  heroButton: {
    alignSelf: 'flex-start',
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipItem: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonSpacer: {
    marginRight: Spacing.sm,
  },
  skipContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    textDecorationLine: 'underline',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onPrimary,
    marginRight: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
});
