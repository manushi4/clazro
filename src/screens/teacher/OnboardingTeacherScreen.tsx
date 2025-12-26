import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  ProgressBar,
  Surface,
  Chip,
  Switch,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useTeacherClassesQuery } from '../../hooks/queries/teacher/useTeacherClassesQuery';
import { useAuthStore } from '../../stores/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const ONBOARDING_COMPLETE_KEY = '@teacher_onboarding_complete';

type OnboardingStep = 'welcome' | 'classes' | 'notifications' | 'features' | 'preferences' | 'complete';

type NotificationPreferences = {
  assignments: boolean;
  attendance: boolean;
  messages: boolean;
  announcements: boolean;
};

type TeachingPreferences = {
  defaultGradingScale: '100' | 'letter' | 'percentage';
  showStudentPhotos: boolean;
  enableQuickAttendance: boolean;
  dailyDigest: boolean;
};

type Props = NativeStackScreenProps<any, 'onboarding-teacher'>;

export const OnboardingTeacherScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const { user } = useAuthStore();

  // === STATE ===
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    assignments: true,
    attendance: true,
    messages: true,
    announcements: true,
  });
  const [teachingPrefs, setTeachingPrefs] = useState<TeachingPreferences>({
    defaultGradingScale: '100',
    showStudentPhotos: true,
    enableQuickAttendance: true,
    dailyDigest: false,
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // === ANIMATION ===
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  // === DATA ===
  const { data: classes, isLoading: classesLoading } = useTeacherClassesQuery();

  // === STEPS CONFIG ===
  const steps: OnboardingStep[] = ['welcome', 'classes', 'notifications', 'features', 'preferences', 'complete'];
  const currentIndex = steps.indexOf(step);
  const progress = (currentIndex + 1) / steps.length;

  // === CHECK IF ALREADY COMPLETED ===
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (completed === 'true') {
        navigation.replace('teacher-home');
      }
    };
    checkOnboarding();
  }, [navigation]);

  // === REQUEST NOTIFICATION PERMISSION ===
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.warn('Notification permission error:', error);
      return false;
    }
  };

  // === ANIMATION HELPERS ===
  const animateTransition = useCallback((direction: 'next' | 'back') => {
    const multiplier = direction === 'next' ? -1 : 1;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: multiplier * 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(-multiplier * 50);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // === CELEBRATION ANIMATION ===
  const playCelebration = useCallback(() => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 50, 100, 50]);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(celebrationAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, celebrationAnim]);

  // === NAVIGATION HANDLERS ===
  const handleNext = async () => {
    const nextIndex = currentIndex + 1;

    if (step === 'notifications') {
      await requestNotificationPermission();
    }

    if (nextIndex < steps.length) {
      animateTransition('next');
      setTimeout(() => {
        setStep(steps[nextIndex]);
        if (steps[nextIndex] === 'complete') {
          playCelebration();
        }
      }, 150);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      animateTransition('back');
      setTimeout(() => {
        setStep(steps[currentIndex - 1]);
      }, 150);
    }
  };

  const handleSkip = () => {
    animateTransition('next');
    setTimeout(() => {
      setStep('complete');
      playCelebration();
    }, 150);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await AsyncStorage.setItem('@teacher_notification_prefs', JSON.stringify(notificationPrefs));
      await AsyncStorage.setItem('@teacher_teaching_prefs', JSON.stringify(teachingPrefs));
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      navigation.replace('teacher-home');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setIsCompleting(false);
    }
  };

  // === STEP RENDERERS ===
  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
        <Icon name="hand-wave" size={60} color={colors.primary} />
      </View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.welcome.title', { defaultValue: 'Welcome, Teacher!' })}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}>
        {t('onboarding.welcome.description', {
          defaultValue: "Let's get you set up to manage your classes effectively. This will only take a minute."
        })}
      </Text>

      <Surface style={[styles.statsPreview, { backgroundColor: colors.surfaceVariant }]} elevation={0}>
        <View style={styles.statItem}>
          <Icon name="google-classroom" size={24} color={colors.primary} />
          <Text variant="titleMedium" style={{ color: colors.onSurface }}>
            {classes?.length || 0}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {t('onboarding.welcome.classes', { defaultValue: 'Classes' })}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <Icon name="account-group" size={24} color={colors.secondary} />
          <Text variant="titleMedium" style={{ color: colors.onSurface }}>
            {classes?.reduce((sum, c) => sum + (c.student_count || 0), 0) || 0}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {t('onboarding.welcome.students', { defaultValue: 'Students' })}
          </Text>
        </View>
      </Surface>
    </View>
  );

  const renderClassesStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.secondary}15` }]}>
        <Icon name="google-classroom" size={60} color={colors.secondary} />
      </View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.classes.title', { defaultValue: 'Your Classes' })}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}>
        {t('onboarding.classes.description', {
          defaultValue: "You've been assigned to the following classes. You can manage attendance, assignments, and grades for each."
        })}
      </Text>

      {classesLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.classChips}>
          {classes?.map((cls) => (
            <Chip
              key={cls.id}
              style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}
              textStyle={{ color: colors.onSurfaceVariant }}
              icon={() => <Icon name="school" size={16} color={colors.primary} />}
            >
              {cls.name} - {cls.subject}
            </Chip>
          ))}
          {(!classes || classes.length === 0) && (
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {t('onboarding.classes.noClasses', { defaultValue: 'No classes assigned yet. Contact admin.' })}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderNotificationsStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.tertiary}15` }]}>
        <Icon name="bell-ring" size={60} color={colors.tertiary} />
      </View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.notifications.title', { defaultValue: 'Stay Updated' })}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}>
        {t('onboarding.notifications.description', {
          defaultValue: 'Choose which notifications you want to receive.'
        })}
      </Text>

      <Surface style={[styles.prefsCard, { backgroundColor: colors.surface }]} elevation={1}>
        <NotificationToggle
          icon="file-document-edit"
          label={t('onboarding.notifications.assignments', { defaultValue: 'Assignment Updates' })}
          sublabel={t('onboarding.notifications.assignmentsSub', { defaultValue: 'Submissions and deadlines' })}
          value={notificationPrefs.assignments}
          onToggle={(v) => setNotificationPrefs(p => ({ ...p, assignments: v }))}
          colors={colors}
        />
        <NotificationToggle
          icon="clipboard-check"
          label={t('onboarding.notifications.attendance', { defaultValue: 'Attendance Reminders' })}
          sublabel={t('onboarding.notifications.attendanceSub', { defaultValue: 'Daily attendance prompts' })}
          value={notificationPrefs.attendance}
          onToggle={(v) => setNotificationPrefs(p => ({ ...p, attendance: v }))}
          colors={colors}
        />
        <NotificationToggle
          icon="message-text"
          label={t('onboarding.notifications.messages', { defaultValue: 'Parent Messages' })}
          sublabel={t('onboarding.notifications.messagesSub', { defaultValue: 'New messages from parents' })}
          value={notificationPrefs.messages}
          onToggle={(v) => setNotificationPrefs(p => ({ ...p, messages: v }))}
          colors={colors}
        />
        <NotificationToggle
          icon="bullhorn"
          label={t('onboarding.notifications.announcements', { defaultValue: 'School Announcements' })}
          sublabel={t('onboarding.notifications.announcementsSub', { defaultValue: 'Important updates' })}
          value={notificationPrefs.announcements}
          onToggle={(v) => setNotificationPrefs(p => ({ ...p, announcements: v }))}
          colors={colors}
          isLast
        />
      </Surface>
    </View>
  );

  const renderFeaturesStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
        <Icon name="star-four-points" size={60} color={colors.primary} />
      </View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.features.title', { defaultValue: 'Key Features' })}
      </Text>

      <View style={styles.featureList}>
        <FeatureItem
          icon="clipboard-check"
          title={t('onboarding.features.attendance', { defaultValue: 'Quick Attendance' })}
          description={t('onboarding.features.attendanceDesc', { defaultValue: 'Mark attendance in seconds with smart defaults' })}
          colors={colors}
        />
        <FeatureItem
          icon="file-document-edit"
          title={t('onboarding.features.assignments', { defaultValue: 'Assignments & Tests' })}
          description={t('onboarding.features.assignmentsDesc', { defaultValue: 'Create, grade, and track submissions easily' })}
          colors={colors}
        />
        <FeatureItem
          icon="chart-line"
          title={t('onboarding.features.progress', { defaultValue: 'Student Progress' })}
          description={t('onboarding.features.progressDesc', { defaultValue: 'Real-time analytics and performance insights' })}
          colors={colors}
        />
        <FeatureItem
          icon="robot"
          title={t('onboarding.features.ai', { defaultValue: 'AI Assistant' })}
          description={t('onboarding.features.aiDesc', { defaultValue: 'Get help answering doubts and creating content' })}
          colors={colors}
        />
      </View>
    </View>
  );

  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.secondary}15` }]}>
        <Icon name="cog" size={60} color={colors.secondary} />
      </View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.preferences.title', { defaultValue: 'Your Preferences' })}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}>
        {t('onboarding.preferences.description', {
          defaultValue: 'Customize your teaching experience. You can change these anytime in Settings.'
        })}
      </Text>

      <Surface style={[styles.prefsCard, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.prefSection}>
          <View style={styles.prefHeader}>
            <Icon name="numeric" size={20} color={colors.primary} />
            <Text variant="titleSmall" style={{ color: colors.onSurface, marginLeft: 8 }}>
              {t('onboarding.preferences.gradingScale', { defaultValue: 'Default Grading Scale' })}
            </Text>
          </View>
          <View style={styles.gradingChips}>
            {(['100', 'letter', 'percentage'] as const).map((scale) => (
              <Chip
                key={scale}
                selected={teachingPrefs.defaultGradingScale === scale}
                onPress={() => setTeachingPrefs(p => ({ ...p, defaultGradingScale: scale }))}
                style={[
                  styles.gradingChip,
                  { backgroundColor: teachingPrefs.defaultGradingScale === scale ? colors.primaryContainer : colors.surfaceVariant }
                ]}
                textStyle={{
                  color: teachingPrefs.defaultGradingScale === scale ? colors.onPrimaryContainer : colors.onSurfaceVariant
                }}
              >
                {scale === '100' ? '0-100' : scale === 'letter' ? 'A-F' : '%'}
              </Chip>
            ))}
          </View>
        </View>

        <View style={[styles.prefDivider, { backgroundColor: colors.outlineVariant }]} />

        <NotificationToggle
          icon="account-box-multiple"
          label={t('onboarding.preferences.studentPhotos', { defaultValue: 'Show Student Photos' })}
          sublabel={t('onboarding.preferences.studentPhotosSub', { defaultValue: 'Display photos in attendance and grades' })}
          value={teachingPrefs.showStudentPhotos}
          onToggle={(v) => setTeachingPrefs(p => ({ ...p, showStudentPhotos: v }))}
          colors={colors}
        />
        <NotificationToggle
          icon="lightning-bolt"
          label={t('onboarding.preferences.quickAttendance', { defaultValue: 'Quick Attendance Mode' })}
          sublabel={t('onboarding.preferences.quickAttendanceSub', { defaultValue: 'One-tap to mark present' })}
          value={teachingPrefs.enableQuickAttendance}
          onToggle={(v) => setTeachingPrefs(p => ({ ...p, enableQuickAttendance: v }))}
          colors={colors}
        />
        <NotificationToggle
          icon="email-newsletter"
          label={t('onboarding.preferences.dailyDigest', { defaultValue: 'Daily Digest Email' })}
          sublabel={t('onboarding.preferences.dailyDigestSub', { defaultValue: 'Summary of pending tasks each morning' })}
          value={teachingPrefs.dailyDigest}
          onToggle={(v) => setTeachingPrefs(p => ({ ...p, dailyDigest: v }))}
          colors={colors}
          isLast
        />
      </Surface>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <Animated.View
        style={[
          styles.iconCircle,
          { backgroundColor: `${colors.success}15`, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Icon name="check-circle" size={60} color={colors.success} />
      </Animated.View>
      <Text variant="headlineMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
        {t('onboarding.complete.title', { defaultValue: "You're All Set!" })}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}>
        {t('onboarding.complete.description', {
          defaultValue: 'Start managing your classes and helping students succeed.'
        })}
      </Text>

      <Surface style={[styles.tipsCard, { backgroundColor: colors.surfaceVariant }]} elevation={0}>
        <Text variant="titleSmall" style={{ color: colors.onSurfaceVariant, marginBottom: 12 }}>
          {t('onboarding.complete.quickStart', { defaultValue: 'Quick Start Tips' })}
        </Text>
        <TipItem
          number="1"
          text={t('onboarding.complete.tip1', { defaultValue: 'Mark attendance for your first class' })}
          colors={colors}
        />
        <TipItem
          number="2"
          text={t('onboarding.complete.tip2', { defaultValue: 'Create your first assignment' })}
          colors={colors}
        />
        <TipItem
          number="3"
          text={t('onboarding.complete.tip3', { defaultValue: 'Check student progress analytics' })}
          colors={colors}
        />
      </Surface>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'welcome': return renderWelcomeStep();
      case 'classes': return renderClassesStep();
      case 'notifications': return renderNotificationsStep();
      case 'features': return renderFeaturesStep();
      case 'preferences': return renderPreferencesStep();
      case 'complete': return renderCompleteStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {currentIndex > 0 && step !== 'complete' ? (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.onSurface}
            onPress={handleBack}
          />
        ) : (
          <View style={{ width: 48 }} />
        )}

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}
            color={colors.primary}
          />
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
            {currentIndex + 1} / {steps.length}
          </Text>
        </View>

        {step !== 'complete' && step !== 'welcome' ? (
          <Button
            mode="text"
            onPress={handleSkip}
            textColor={colors.onSurfaceVariant}
            compact
          >
            {t('onboarding.skip', { defaultValue: 'Skip' })}
          </Button>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
        <Button
          mode="contained"
          onPress={step === 'complete' ? handleComplete : handleNext}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          loading={isCompleting}
          disabled={isCompleting}
        >
          {step === 'complete'
            ? t('onboarding.getStarted', { defaultValue: 'Get Started' })
            : t('onboarding.next', { defaultValue: 'Continue' })
          }
        </Button>
      </View>
    </SafeAreaView>
  );
};

// === SUBCOMPONENTS ===

type NotificationToggleProps = {
  icon: string;
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: any;
  isLast?: boolean;
};

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  icon, label, sublabel, value, onToggle, colors, isLast
}) => (
  <View style={[styles.toggleRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }]}>
    <Icon name={icon} size={22} color={colors.primary} style={{ marginRight: 12 }} />
    <View style={styles.toggleTextContainer}>
      <Text variant="bodyMedium" style={{ color: colors.onSurface }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>{sublabel}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      color={colors.primary}
    />
  </View>
);

type FeatureItemProps = {
  icon: string;
  title: string;
  description: string;
  colors: any;
};

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colors }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
      <Icon name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.featureTextContainer}>
      <Text variant="titleSmall" style={{ color: colors.onSurface }}>{title}</Text>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>{description}</Text>
    </View>
  </View>
);

type TipItemProps = {
  number: string;
  text: string;
  colors: any;
};

const TipItem: React.FC<TipItemProps> = ({ number, text, colors }) => (
  <View style={styles.tipItem}>
    <View style={[styles.tipNumber, { backgroundColor: colors.primary }]}>
      <Text variant="labelSmall" style={{ color: colors.onPrimary }}>{number}</Text>
    </View>
    <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, flex: 1 }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepDescription: {
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  statsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 32,
  },
  classChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  prefsCard: {
    width: '100%',
    marginTop: 24,
    borderRadius: 16,
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleTextContainer: {
    flex: 1,
  },
  featureList: {
    marginTop: 24,
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
    gap: 2,
  },
  prefSection: {
    padding: 16,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prefDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  gradingChips: {
    flexDirection: 'row',
    gap: 8,
  },
  gradingChip: {
    borderRadius: 8,
  },
  tipsCard: {
    width: '100%',
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    width: '100%',
    borderRadius: 12,
  },
  nextButtonContent: {
    paddingVertical: 6,
  },
});

export default OnboardingTeacherScreen;
