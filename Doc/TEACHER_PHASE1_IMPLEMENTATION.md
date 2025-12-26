# TEACHER PHASE 1 - DEMO-READY IMPLEMENTATION GUIDE

> **Version:** 2.1.0
> **Date:** December 2024
> **Scope:** Teacher Role - Phase 1 (Demo Ready for Funding Pitch)
> **Sprints:** 9 Sprints
> **Total:** 11 Fixed Screens, 13 Dynamic Screens, 32 Widgets

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Sprint 1: Foundation + Auth](#2-sprint-1-foundation--auth)
3. [Sprint 2: Dashboard Core](#3-sprint-2-dashboard-core)
4. [Sprint 3: Class Management](#4-sprint-3-class-management)
5. [Sprint 4: Attendance System](#5-sprint-4-attendance-system)
6. [Sprint 5: Assignment & Grading](#6-sprint-5-assignment--grading)
7. [Sprint 6: Student Detail + Analytics](#7-sprint-6-student-detail--analytics)
8. [Sprint 7: Communication](#8-sprint-7-communication)
9. [Sprint 8: Profile + Polish](#9-sprint-8-profile--polish)
10. [Sprint 9: Demo Showcase Features](#10-sprint-9-demo-showcase-features)
11. [Database Schema](#11-database-schema)
12. [Platform Studio Config](#12-platform-studio-config)
13. [Testing Checklist](#13-testing-checklist)

---

## 1. OVERVIEW

### 1.1 Phase 1 Scope Summary

| Component | Count |
|-----------|-------|
| Fixed Screens | 11 |
| Dynamic Screens | 13 |
| Widgets | 32 |
| Query Hooks | 16 |
| Mutation Hooks | 9 |
| DB Tables | 12 |

### 1.2 Demo Priority Features

**Target Audience:** Coaching heads, school institutes, and teachers for funding pitch

| Priority | Feature | Wow Factor | Sprint |
|----------|---------|------------|--------|
| P0 | Dashboard Home | Hero + Stats + Quick Actions | Sprint 2 |
| P0 | Today's Schedule | Visual timetable with class details | Sprint 2 |
| P0 | Take Attendance | Quick mark attendance flow | Sprint 4 |
| P1 | Grading Hub | Pending assignments + quick review | Sprint 5 |
| P1 | At-Risk Alerts | AI-flagged students needing attention | Sprint 6 |
| P1 | Doubts Inbox | Answer student questions with AI suggestions | Sprint 9 |
| P2 | Teacher Calendar | Monthly view with classes/exams/meetings | Sprint 9 |
| P2 | Substitute Finder | Mark leave + find replacement teacher | Sprint 9 |
| P2 | Student Overview | Performance at a glance | Sprint 6 |
| P2 | My Classes | Class list with student rosters | Sprint 3 |

### 1.3 File Structure

```
src/
├── screens/teacher/
│   ├── index.ts
│   │
│   │   # === FIXED SCREENS (11) ===
│   ├── LoginTeacherScreen.tsx        # Sprint 1 - Fixed (auth form)
│   ├── OnboardingTeacherScreen.tsx   # Sprint 1 - Fixed (wizard)
│   ├── AttendanceMarkScreen.tsx      # Sprint 4 - Fixed (bulk marking form)
│   ├── AssignmentCreateScreen.tsx    # Sprint 5 - Fixed (complex form)
│   ├── AssignmentDetailScreen.tsx    # Sprint 5 - Fixed (view/edit)
│   ├── GradeSubmissionScreen.tsx     # Sprint 5 - Fixed (grading form)
│   ├── StudentDetailTeacherScreen.tsx # Sprint 6 - Fixed (profile + actions)
│   ├── DoubtAnswerScreen.tsx         # Sprint 9 - Fixed (AI-assisted form)
│   ├── LeaveRequestCreateScreen.tsx  # Sprint 9 - Fixed (date picker + form)
│   ├── CalendarEventCreateScreen.tsx # Sprint 9 - Fixed (event form)
│   ├── SubstituteFinderScreen.tsx    # Sprint 9 - Fixed (search + request)
│   │
│   │   # === DYNAMIC SCREENS (13) ===
│   ├── TeacherDashboardScreen.tsx    # Sprint 2 - Dynamic (widget-based)
│   ├── ClassHubScreen.tsx            # Sprint 3 - Dynamic (widget-based)
│   ├── ClassDetailScreen.tsx         # Sprint 3 - Dynamic (widget-based)
│   ├── ClassRosterScreen.tsx         # Sprint 3 - Dynamic (widget-based)
│   ├── AttendanceReportsScreen.tsx   # Sprint 4 - Dynamic (widget-based)
│   ├── GradingHubScreen.tsx          # Sprint 5 - Dynamic (widget-based)
│   ├── AnalyticsHomeScreen.tsx       # Sprint 6 - Dynamic (widget-based)
│   ├── CommunicationHubScreen.tsx    # Sprint 7 - Dynamic (widget-based)
│   ├── ProfileTeacherScreen.tsx      # Sprint 8 - Dynamic (widget-based)
│   ├── NotificationsTeacherScreen.tsx # Sprint 8 - Dynamic (widget-based)
│   ├── DoubtsInboxScreen.tsx         # Sprint 9 - Dynamic (widget-based)
│   ├── TeacherCalendarScreen.tsx     # Sprint 9 - Dynamic (widget-based)
│   └── LeaveHistoryScreen.tsx        # Sprint 9 - Dynamic (widget-based)
├── components/widgets/teacher/
│   ├── index.ts
│   ├── TeacherHeroWidget.tsx         # Sprint 2
│   ├── TeacherStatsWidget.tsx        # Sprint 2
│   ├── UpcomingClassesWidget.tsx     # Sprint 2
│   ├── PendingGradingWidget.tsx      # Sprint 2
│   ├── AtRiskStudentsWidget.tsx      # Sprint 2
│   ├── TeacherQuickActionsWidget.tsx # Sprint 2
│   ├── ClassCardsWidget.tsx          # Sprint 3
│   ├── ClassRosterWidget.tsx         # Sprint 3
│   ├── ClassStatsWidget.tsx          # Sprint 3
│   ├── ClassActivityWidget.tsx       # Sprint 3
│   ├── TodayAttendanceWidget.tsx     # Sprint 4
│   ├── AttendanceQuickMarkWidget.tsx # Sprint 4
│   ├── AttendanceAlertsWidget.tsx    # Sprint 4
│   ├── AttendanceTrendsWidget.tsx    # Sprint 4
│   ├── PendingSubmissionsWidget.tsx  # Sprint 5
│   ├── RecentGradesWidget.tsx        # Sprint 5
│   ├── GradingStatsWidget.tsx        # Sprint 5
│   ├── RubricTemplatesWidget.tsx     # Sprint 5
│   ├── ClassPerformanceWidget.tsx    # Sprint 6
│   ├── StudentComparisonWidget.tsx   # Sprint 6
│   ├── PerformanceTrendsWidget.tsx   # Sprint 6
│   ├── MessagesInboxWidget.tsx       # Sprint 7
│   ├── AnnouncementsWidget.tsx       # Sprint 7
│   ├── ParentContactsWidget.tsx      # Sprint 7
│   ├── DoubtsInboxWidget.tsx         # Sprint 9 - Demo Showcase
│   ├── DoubtDetailWidget.tsx         # Sprint 9 - Demo Showcase
│   ├── TeacherCalendarWidget.tsx     # Sprint 9 - Demo Showcase
│   ├── CalendarEventsWidget.tsx      # Sprint 9 - Demo Showcase
│   ├── SubstituteRequestWidget.tsx   # Sprint 9 - Demo Showcase
│   ├── AvailableSubstitutesWidget.tsx # Sprint 9 - Demo Showcase
│   ├── LeaveRequestWidget.tsx        # Sprint 9 - Demo Showcase
│   └── AIInsightsWidget.tsx          # Sprint 9 - Demo Showcase
├── hooks/queries/teacher/
│   ├── index.ts
│   ├── useTeacherDashboardQuery.ts   # Sprint 2
│   ├── usePendingGradingQuery.ts     # Sprint 2
│   ├── useAtRiskStudentsQuery.ts     # Sprint 2
│   ├── useTeacherClassesQuery.ts     # Sprint 3
│   ├── useClassRosterQuery.ts        # Sprint 3
│   ├── useClassStatsQuery.ts         # Sprint 3
│   ├── useAttendanceRecordsQuery.ts  # Sprint 4
│   ├── useTeacherAssignmentsQuery.ts # Sprint 5
│   ├── useStudentProgressQuery.ts    # Sprint 6
│   ├── useTeacherAnalyticsQuery.ts   # Sprint 6
│   ├── useClassAnalyticsQuery.ts     # Sprint 6
│   ├── useTeacherMessagesQuery.ts    # Sprint 7
│   ├── useDoubtsInboxQuery.ts        # Sprint 9 - Demo Showcase
│   ├── useTeacherCalendarQuery.ts    # Sprint 9 - Demo Showcase
│   ├── useAvailableSubstitutesQuery.ts # Sprint 9 - Demo Showcase
│   └── useLeaveRequestsQuery.ts      # Sprint 9 - Demo Showcase
└── hooks/mutations/teacher/
    ├── index.ts
    ├── useTeacherAuth.ts             # Sprint 1
    ├── useMarkAttendance.ts          # Sprint 4
    ├── useBulkMarkAttendance.ts      # Sprint 4
    ├── useCreateAssignment.ts        # Sprint 5
    ├── useGradeSubmission.ts         # Sprint 5
    ├── useSendMessage.ts             # Sprint 7
    ├── useAnswerDoubt.ts             # Sprint 9 - Demo Showcase
    ├── useRequestSubstitute.ts       # Sprint 9 - Demo Showcase
    └── useCreateLeaveRequest.ts      # Sprint 9 - Demo Showcase
```

---

## 2. SPRINT 1: FOUNDATION + AUTH

### 2.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `login-teacher` | 🔲 |
| Fixed Screen | `onboarding-teacher` | 🔲 |
| Hook | `useTeacherAuth` | 🔲 |
| DB Table | `teachers` | 🔲 |
| DB Table | `teacher_classes` | 🔲 |

### 2.2 LoginTeacherScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/LoginTeacherScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Checkbox,
  Divider,
  IconButton,
  Snackbar,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useBranding } from '@/context/BrandingContext';
import { useTeacherAuth } from '@/hooks/mutations/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type FormErrors = {
  email?: string;
  password?: string;
};

export const LoginTeacherScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { t } = useTranslation('auth');
  const { branding } = useBranding();
  const { mutate: login, isPending, error: authError } = useTeacherAuth();

  // === ANIMATION ===
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // === STATE ===
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(true);

  // === REFS ===
  const passwordRef = useRef<any>(null);

  // === EFFECTS ===
  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Check biometric availability
    checkBiometricAuth();

    // Load saved credentials
    loadSavedCredentials();
  }, []);

  const checkBiometricAuth = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const savedToken = await AsyncStorage.getItem('biometric_token');
      setBiometricAvailable(compatible && enrolled && !!savedToken);
    } catch (error) {
      console.log('Biometric check failed:', error);
    } finally {
      setIsCheckingBiometric(false);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
      }
    } catch (error) {
      console.log('Failed to load credentials:', error);
    }
  };

  // === VALIDATION ===
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired', { defaultValue: 'Email is required' });
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('validation.emailInvalid', { defaultValue: 'Please enter a valid email' });
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired', { defaultValue: 'Password is required' });
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.passwordLength', { defaultValue: 'Password must be at least 6 characters' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === HANDLERS ===
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    // Save email if remember me is checked
    if (formData.rememberMe) {
      await AsyncStorage.setItem('saved_email', formData.email);
    } else {
      await AsyncStorage.removeItem('saved_email');
    }

    login(
      { email: formData.email, password: formData.password },
      {
        onSuccess: (data) => {
          if (data.isFirstLogin) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'onboarding-teacher' as never }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'teacher-home' as never }],
            });
          }
        },
        onError: (error) => {
          setSnackbar({
            visible: true,
            message: error.message || t('errors.loginFailed', { defaultValue: 'Login failed. Please try again.' }),
          });
        },
      }
    );
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('biometric.prompt', { defaultValue: 'Authenticate to login' }),
        cancelLabel: t('common.cancel', { defaultValue: 'Cancel' }),
        fallbackLabel: t('biometric.usePassword', { defaultValue: 'Use Password' }),
      });

      if (result.success) {
        const savedToken = await AsyncStorage.getItem('biometric_token');
        if (savedToken) {
          // Use saved token for authentication
          login(
            { biometricToken: savedToken },
            {
              onSuccess: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'teacher-home' as never }],
                });
              },
              onError: () => {
                setSnackbar({
                  visible: true,
                  message: t('errors.biometricFailed', { defaultValue: 'Biometric login failed' }),
                });
              },
            }
          );
        }
      }
    } catch (error) {
      setSnackbar({
        visible: true,
        message: t('errors.biometricError', { defaultValue: 'Biometric authentication error' }),
      });
    }
  };

  // === RENDER ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo & Title */}
            <View style={styles.headerSection}>
              {branding?.logoUrl ? (
                <Image source={{ uri: branding.logoUrl }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Icon name="school" size={48} color="white" />
                </View>
              )}
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                {t('login.teacherTitle', { defaultValue: 'Teacher Login' })}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {branding?.appName || 'EduPlatform'}
              </Text>
            </View>

            {/* Login Form */}
            <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
              {/* Email Input */}
              <TextInput
                mode="outlined"
                label={t('login.email', { defaultValue: 'Email' })}
                value={formData.email}
                onChangeText={(v) => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                left={<TextInput.Icon icon="email-outline" />}
                onSubmitEditing={() => passwordRef.current?.focus()}
                returnKeyType="next"
                style={styles.input}
              />
              {errors.email && <HelperText type="error">{errors.email}</HelperText>}

              {/* Password Input */}
              <TextInput
                ref={passwordRef}
                mode="outlined"
                label={t('login.password', { defaultValue: 'Password' })}
                value={formData.password}
                onChangeText={(v) => updateField('password', v)}
                secureTextEntry={!showPassword}
                error={!!errors.password}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                style={styles.input}
              />
              {errors.password && <HelperText type="error">{errors.password}</HelperText>}

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => updateField('rememberMe', !formData.rememberMe)}
                >
                  <Checkbox
                    status={formData.rememberMe ? 'checked' : 'unchecked'}
                    onPress={() => updateField('rememberMe', !formData.rememberMe)}
                  />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                    {t('login.rememberMe', { defaultValue: 'Remember me' })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('forgot-password' as never)}>
                  <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                    {t('login.forgotPassword', { defaultValue: 'Forgot Password?' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {authError && (
                <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
                  <Icon name="alert-circle" size={20} color={theme.colors.error} />
                  <Text variant="bodySmall" style={{ color: theme.colors.error, flex: 1 }}>
                    {authError.message || t('errors.invalidCredentials', { defaultValue: 'Invalid email or password' })}
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isPending}
                disabled={isPending}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
              >
                {t('login.signIn', { defaultValue: 'Sign In' })}
              </Button>

              {/* Biometric Login */}
              {biometricAvailable && !isCheckingBiometric && (
                <>
                  <Divider style={styles.divider} />
                  <TouchableOpacity
                    style={[styles.biometricButton, { borderColor: theme.colors.outline }]}
                    onPress={handleBiometricLogin}
                  >
                    <Icon name="fingerprint" size={28} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {t('login.useBiometric', { defaultValue: 'Login with Fingerprint' })}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </Surface>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('login.needHelp', { defaultValue: 'Need help?' })}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('support' as never)}>
                <Text variant="bodySmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                  {t('login.contactSupport', { defaultValue: 'Contact Support' })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Version Info */}
            <Text variant="labelSmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
              v1.0.0
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={3000}
          action={{
            label: t('common.dismiss', { defaultValue: 'Dismiss' }),
            onPress: () => setSnackbar({ ...snackbar, visible: false }),
          }}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 100, height: 100, marginBottom: 16 },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontWeight: 'bold', textAlign: 'center' },
  subtitle: { marginTop: 4, textAlign: 'center' },
  formCard: { borderRadius: 16, padding: 24 },
  input: { marginBottom: 4 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -8 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  loginButton: { borderRadius: 8 },
  loginButtonContent: { paddingVertical: 8 },
  divider: { marginVertical: 20 },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  helpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.5,
  },
});
```

### 2.3 OnboardingTeacherScreen.tsx

```typescript
// src/screens/teacher/OnboardingTeacherScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
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
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useTeacherClassesQuery } from '@/hooks/queries/teacher/useTeacherClassesQuery';
import { useAuthStore } from '@/stores/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

export const OnboardingTeacherScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status === 'granted');
    return status === 'granted';
  };

  // === ANIMATION HELPERS ===
  const animateTransition = useCallback((direction: 'next' | 'back') => {
    const multiplier = direction === 'next' ? -1 : 1;

    // Fade out and slide
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
      // Reset position for incoming content
      slideAnim.setValue(-multiplier * 50);

      // Fade in and slide to center
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
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 50, 100, 50]);
    }

    // Scale bounce
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

    // Celebration particles
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
      // Save preferences
      await AsyncStorage.setItem('@teacher_notification_prefs', JSON.stringify(notificationPrefs));
      await AsyncStorage.setItem('@teacher_teaching_prefs', JSON.stringify(teachingPrefs));
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');

      // Navigate to home
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

      {/* Quick stats preview */}
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
        {/* Grading Scale */}
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

      {/* Quick start tips */}
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
      {/* Header with progress and skip */}
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

      {/* Animated content */}
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

      {/* Footer with action button */}
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
```

### 2.4 useTeacherAuth Hook

```typescript
// src/hooks/mutations/teacher/useTeacherAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type LoginCredentials = {
  email: string;
  password: string;
};

export const useTeacherAuth = () => {
  const queryClient = useQueryClient();
  const { setUser, setSession } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Verify teacher role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'teacher') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Teacher account required.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Account is inactive. Contact administrator.');
      }

      // 3. Get teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*, teacher_classes(class_id)')
        .eq('user_id', authData.user.id)
        .single();

      if (teacherError) throw teacherError;

      // 4. Check if first login
      const isFirstLogin = !teacher.last_login;

      // 5. Update last login
      await supabase
        .from('teachers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', teacher.id);

      return { 
        user: authData.user, 
        session: authData.session, 
        teacher,
        isFirstLogin 
      };
    },
    onSuccess: (data) => {
      setUser(data.user);
      setSession(data.session);
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    },
  });
};
```

### 2.5 Sprint 1 Checkpoint

✅ **Test Criteria:**
- [ ] Teacher can access login screen
- [ ] Invalid credentials show error
- [ ] Non-teacher users are rejected
- [ ] Inactive accounts are blocked
- [ ] First-time login shows onboarding
- [ ] Returning users go to dashboard
- [ ] Onboarding completes successfully

---

## 3. SPRINT 2: DASHBOARD CORE

### 3.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `teacher-home` | 🔲 |
| Widget | `teacher.hero-card` | 🔲 |
| Widget | `teacher.stats-grid` | 🔲 |
| Widget | `teacher.upcoming-classes` | 🔲 |
| Widget | `teacher.pending-grading` | 🔲 |
| Widget | `teacher.at-risk-students` | 🔲 |
| Widget | `teacher.quick-actions` | 🔲 |
| Hook | `useTeacherDashboardQuery` | 🔲 |
| Hook | `usePendingGradingQuery` | 🔲 |
| Hook | `useAtRiskStudentsQuery` | 🔲 |

### 3.2 TeacherHeroWidget.tsx

```typescript
// src/components/widgets/teacher/TeacherHeroWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Badge, IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useBranding } from '@/context/BrandingContext';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherDashboardQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const TeacherHeroWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { branding } = useBranding();
  const { user } = useAuthStore();
  const { data } = useTeacherDashboardQuery();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <WidgetContainer>
      <Surface style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={56}
              label={data?.teacherName?.substring(0, 2).toUpperCase() || 'T'}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.textContainer}>
              <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                {getGreeting()}, {data?.teacherName?.split(' ')[0] || 'Teacher'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
                {data?.todayClasses || 0} classes today
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="bell-outline"
              size={24}
              onPress={() => onNavigate?.('notifications-teacher')}
            />
            {(data?.unreadNotifications || 0) > 0 && (
              <Badge style={styles.badge}>{data?.unreadNotifications}</Badge>
            )}
          </View>
        </View>

        {config?.showTodayStats && (
          <View style={styles.todayStats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {data?.pendingGrading || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                To Grade
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {data?.todayAttendance || 0}%
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                Attendance
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {data?.atRiskCount || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                At Risk
              </Text>
            </View>
          </View>
        )}
      </Surface>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textContainer: { marginLeft: 12, flex: 1 },
  actions: { position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4 },
  todayStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  statItem: { alignItems: 'center' },
});
```

### 3.3 TeacherStatsWidget.tsx

```typescript
// src/components/widgets/teacher/TeacherStatsWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherDashboardQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const TeacherStatsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useTeacherDashboardQuery();

  const stats = [
    { id: 'classes', label: 'Classes', value: data?.totalClasses || 0, icon: 'google-classroom', color: theme.colors.primary, route: 'class-hub' },
    { id: 'students', label: 'Students', value: data?.totalStudents || 0, icon: 'account-group', color: '#9C27B0', route: 'class-hub' },
    { id: 'pending', label: 'To Grade', value: data?.pendingGrading || 0, icon: 'clipboard-check', color: '#FF9800', route: 'grading-hub' },
    { id: 'attendance', label: 'Attendance', value: `${data?.avgAttendance || 0}%`, icon: 'calendar-check', color: '#4CAF50', route: 'attendance-mark' },
  ];

  return (
    <WidgetContainer title="Overview" isLoading={isLoading}>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={styles.statCard}
            onPress={() => onNavigate?.(stat.route)}
          >
            <Surface style={styles.cardSurface} elevation={1}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text variant="headlineSmall" style={styles.value}>
                {stat.value}
              </Text>
              <Text variant="bodySmall" style={styles.label}>
                {stat.label}
              </Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: { width: '48%' },
  cardSurface: { padding: 16, borderRadius: 12, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  value: { fontWeight: 'bold', marginBottom: 2 },
  label: { opacity: 0.7 },
});
```

### 3.4 UpcomingClassesWidget.tsx

```typescript
// src/components/widgets/teacher/UpcomingClassesWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Chip, Button, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherDashboardQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { format, isToday, differenceInMinutes } from 'date-fns';

type UpcomingClass = {
  id: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  studentCount: number;
  isLive: boolean;
  meetingLink?: string;
};

export const UpcomingClassesWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data } = useTeacherDashboardQuery();

  const getTimeStatus = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = differenceInMinutes(start, now);

    if (diff < 0) return { text: 'Started', color: '#4CAF50' };
    if (diff <= 15) return { text: `In ${diff} min`, color: '#FF9800' };
    return { text: format(start, 'h:mm a'), color: theme.colors.outline };
  };

  const renderClass = ({ item }: { item: UpcomingClass }) => {
    const timeStatus = getTimeStatus(item.startTime);

    return (
      <TouchableOpacity
        style={styles.classItem}
        onPress={() => onNavigate?.('class-detail', { classId: item.id })}
      >
        <View style={styles.timeColumn}>
          <Text variant="titleMedium" style={{ color: timeStatus.color }}>
            {timeStatus.text}
          </Text>
          {item.isLive && (
            <Chip compact style={styles.liveChip} textStyle={{ color: 'white', fontSize: 10 }}>
              LIVE
            </Chip>
          )}
        </View>

        <View style={styles.classInfo}>
          <Text variant="titleSmall" numberOfLines={1}>
            {item.className}
          </Text>
          <Text variant="bodySmall" style={styles.subject}>
            {item.subject}
          </Text>
          <View style={styles.studentCount}>
            <Icon name="account-group" size={14} color={theme.colors.outline} />
            <Text variant="labelSmall" style={styles.countText}>
              {item.studentCount} students
            </Text>
          </View>
        </View>

        {item.isLive && item.meetingLink && (
          <Button
            mode="contained"
            compact
            onPress={() => onNavigate?.('live-class-host', { sessionId: item.id })}
          >
            Join
          </Button>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <WidgetContainer
      title="Upcoming Classes"
      action={
        config?.showViewAll && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => onNavigate?.('schedule-screen')}
          >
            View All
          </Text>
        )
      }
    >
      <FlatList
        data={(data?.upcomingClasses || []).slice(0, config?.maxItems || 3)}
        renderItem={renderClass}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No classes scheduled</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  classItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  timeColumn: { width: 70, alignItems: 'center' },
  liveChip: { backgroundColor: '#4CAF50', marginTop: 4 },
  classInfo: { flex: 1 },
  subject: { opacity: 0.7, marginTop: 2 },
  studentCount: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  countText: { opacity: 0.6 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 3.5 PendingGradingWidget.tsx

```typescript
// src/components/widgets/teacher/PendingGradingWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { usePendingGradingQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Submission = {
  id: string;
  studentName: string;
  studentAvatar?: string;
  assignmentTitle: string;
  className: string;
  submittedAt: string;
  isLate: boolean;
  daysOverdue?: number;
};

export const PendingGradingWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: submissions, isLoading } = usePendingGradingQuery({
    limit: config?.maxItems || 5,
  });

  const renderSubmission = ({ item }: { item: Submission }) => (
    <TouchableOpacity
      style={styles.submissionItem}
      onPress={() => onNavigate?.('grade-submission', { submissionId: item.id })}
    >
      <Avatar.Text
        size={40}
        label={item.studentName.substring(0, 2).toUpperCase()}
        style={{ backgroundColor: theme.colors.primaryContainer }}
      />
      <View style={styles.submissionInfo}>
        <Text variant="titleSmall" numberOfLines={1}>
          {item.studentName}
        </Text>
        <Text variant="bodySmall" style={styles.assignmentTitle} numberOfLines={1}>
          {item.assignmentTitle}
        </Text>
        <Text variant="labelSmall" style={styles.className}>
          {item.className}
        </Text>
      </View>
      <View style={styles.submissionMeta}>
        {item.isLate && (
          <Chip
            compact
            style={[styles.lateChip, { backgroundColor: theme.colors.errorContainer }]}
            textStyle={{ color: theme.colors.error, fontSize: 10 }}
          >
            Late
          </Chip>
        )}
        <Text variant="labelSmall" style={styles.timeText}>
          {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Pending Grading"
      isLoading={isLoading}
      action={
        config?.showViewAll && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => onNavigate?.('grading-hub')}
          >
            View All
          </Text>
        )
      }
    >
      <FlatList
        data={submissions || []}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle-outline" size={48} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.emptyText}>All caught up!</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  submissionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  submissionInfo: { flex: 1 },
  assignmentTitle: { opacity: 0.7, marginTop: 2 },
  className: { opacity: 0.5, marginTop: 2 },
  submissionMeta: { alignItems: 'flex-end' },
  lateChip: { marginBottom: 4 },
  timeText: { opacity: 0.6 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 3.6 AtRiskStudentsWidget.tsx

```typescript
// src/components/widgets/teacher/AtRiskStudentsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAtRiskStudentsQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type AtRiskStudent = {
  id: string;
  name: string;
  className: string;
  riskType: 'attendance' | 'performance' | 'behavior';
  severity: 'critical' | 'high' | 'medium';
  metric: string;
  suggestedAction: string;
};

export const AtRiskStudentsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: students, isLoading } = useAtRiskStudentsQuery({
    limit: config?.maxItems || 5,
  });

  const severityColors = {
    critical: theme.colors.error,
    high: '#FF9800',
    medium: '#FFC107',
  };

  const riskIcons = {
    attendance: 'calendar-alert',
    performance: 'chart-line-variant',
    behavior: 'alert-circle',
  };

  const renderStudent = ({ item }: { item: AtRiskStudent }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => onNavigate?.('student-detail-teacher', { studentId: item.id })}
    >
      <View style={[styles.severityBar, { backgroundColor: severityColors[item.severity] }]} />
      <Avatar.Text
        size={40}
        label={item.name.substring(0, 2).toUpperCase()}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      />
      <View style={styles.studentInfo}>
        <Text variant="titleSmall" numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.riskInfo}>
          <Icon name={riskIcons[item.riskType]} size={14} color={severityColors[item.severity]} />
          <Text variant="bodySmall" style={{ color: severityColors[item.severity] }}>
            {item.metric}
          </Text>
        </View>
        <Text variant="labelSmall" style={styles.className}>
          {item.className}
        </Text>
      </View>
      {config?.showContactParent && (
        <IconButton
          icon="phone"
          size={20}
          onPress={() => onNavigate?.('contact-parent', { studentId: item.id })}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Students Needing Attention"
      isLoading={isLoading}
      action={
        config?.showViewAll && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => onNavigate?.('at-risk-list')}
          >
            View All
          </Text>
        )
      }
    >
      <FlatList
        data={students || []}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="emoticon-happy-outline" size={48} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.emptyText}>All students on track!</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  severityBar: { width: 4, height: '100%', borderRadius: 2 },
  studentInfo: { flex: 1 },
  riskInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  className: { opacity: 0.5, marginTop: 2 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 3.7 TeacherQuickActionsWidget.tsx

```typescript
// src/components/widgets/teacher/TeacherQuickActionsWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const TeacherQuickActionsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  const actions = [
    { id: 'attendance', label: 'Mark Attendance', icon: 'calendar-check', color: '#4CAF50', route: 'attendance-mark' },
    { id: 'assignment', label: 'New Assignment', icon: 'file-document-edit', color: theme.colors.primary, route: 'assignment-create' },
    { id: 'grade', label: 'Grade Work', icon: 'clipboard-check', color: '#FF9800', route: 'grading-hub' },
    { id: 'message', label: 'Send Message', icon: 'message', color: '#9C27B0', route: 'communication-hub' },
  ];

  return (
    <WidgetContainer title="Quick Actions">
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => onNavigate?.(action.route)}
          >
            <Surface style={[styles.iconSurface, { backgroundColor: action.color + '15' }]} elevation={0}>
              <Icon name={action.icon} size={28} color={action.color} />
            </Surface>
            <Text variant="labelMedium" style={styles.actionLabel}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '23%', alignItems: 'center', marginBottom: 8 },
  iconSurface: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { textAlign: 'center' },
});
```

### 3.8 useTeacherDashboardQuery Hook

```typescript
// src/hooks/queries/teacher/useTeacherDashboardQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useTeacherDashboardQuery = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['teacher', 'dashboard', user?.id],
    queryFn: async () => {
      // Get teacher record
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, full_name')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Get assigned classes
      const { data: classes } = await supabase
        .from('teacher_classes')
        .select('class_id, classes(id, name, student_count)')
        .eq('teacher_id', teacher.id)
        .eq('status', 'active');

      const classIds = classes?.map(c => c.class_id) || [];
      const totalStudents = classes?.reduce((sum, c) => sum + (c.classes?.student_count || 0), 0) || 0;

      // Get pending grading count
      const { count: pendingGrading } = await supabase
        .from('assignment_submissions')
        .select('id', { count: 'exact' })
        .eq('status', 'submitted')
        .in('assignment_id', 
          supabase.from('assignments').select('id').eq('teacher_id', teacher.id)
        );

      // Get today's classes
      const today = new Date().toISOString().split('T')[0];
      const { data: todayClasses } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('teacher_id', teacher.id)
        .gte('scheduled_start_at', `${today}T00:00:00`)
        .lte('scheduled_start_at', `${today}T23:59:59`)
        .order('scheduled_start_at');

      // Get at-risk students count
      const { count: atRiskCount } = await supabase
        .from('attendance_alerts')
        .select('id', { count: 'exact' })
        .eq('teacher_id', teacher.id)
        .eq('is_resolved', false);

      // Get average attendance
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('status')
        .in('class_id', classIds)
        .gte('attendance_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const avgAttendance = attendanceData?.length ? Math.round((presentCount / attendanceData.length) * 100) : 0;

      return {
        teacherName: teacher.full_name,
        totalClasses: classIds.length,
        totalStudents,
        pendingGrading: pendingGrading || 0,
        todayClasses: todayClasses?.length || 0,
        upcomingClasses: todayClasses || [],
        atRiskCount: atRiskCount || 0,
        avgAttendance,
        todayAttendance: avgAttendance,
        unreadNotifications: 3, // Placeholder
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });
};
```

### 3.9 Sprint 2 Checkpoint

✅ **Test Criteria:**
- [ ] Dashboard loads with all 6 widgets
- [ ] Hero card shows greeting and today's stats
- [ ] Stats grid shows classes, students, pending, attendance
- [ ] Upcoming classes shows today's schedule
- [ ] Pending grading shows submissions to grade
- [ ] At-risk students shows alerts
- [ ] Quick actions navigate correctly

---

## 4. SPRINT 3: CLASS MANAGEMENT

### 4.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `class-hub` | Done |
| Dynamic Screen | `class-detail` | 🔲 |
| Dynamic Screen | `class-roster` | 🔲 |
| Widget | `class.cards` | Done |
| Widget | `class.roster` | Done |
| Widget | `class.stats` | Done |
| Widget | `class.recentActivity` | Done |
| Hook | `useTeacherClassesQuery` | Done |
| Hook | `useClassRosterQuery` | Done |
| Hook | `useClassStatsQuery` | Done |

### 4.2 ClassCardsWidget.tsx

```typescript
// src/components/widgets/teacher/ClassCardsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherClassesQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type ClassItem = {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  todayAttendance: number;
  pendingWork: number;
  nextSession?: string;
};

export const ClassCardsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: classes, isLoading } = useTeacherClassesQuery();

  const renderClass = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() => onNavigate?.('class-detail', { classId: item.id })}
    >
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" numberOfLines={1}>{item.name}</Text>
          {item.pendingWork > 0 && (
            <Chip compact style={styles.pendingChip}>{item.pendingWork}</Chip>
          )}
        </View>
        
        <Text variant="bodySmall" style={styles.subject}>{item.subject}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="account-group" size={16} color={theme.colors.outline} />
            <Text variant="labelSmall">{item.studentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="calendar-check" size={16} color="#4CAF50" />
            <Text variant="labelSmall">{item.todayAttendance}%</Text>
          </View>
        </View>

        {config?.showTodayAttendance && (
          <ProgressBar
            progress={item.todayAttendance / 100}
            color={item.todayAttendance >= 75 ? '#4CAF50' : '#FF9800'}
            style={styles.progressBar}
          />
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('attendance-mark', { classId: item.id })}
          >
            <Icon name="clipboard-check" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('class-roster', { classId: item.id })}
          >
            <Icon name="account-multiple" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer title="My Classes" isLoading={isLoading}>
      <FlatList
        data={classes || []}
        renderItem={renderClass}
        keyExtractor={(item) => item.id}
        horizontal={config?.layoutStyle === 'cards'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="school-outline" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No classes assigned</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 4 },
  cardWrapper: { width: 180, marginRight: 12 },
  card: { padding: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingChip: { backgroundColor: '#FF9800', height: 20 },
  subject: { opacity: 0.7, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressBar: { height: 4, borderRadius: 2, marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  actionButton: { padding: 8 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 4.3 ClassRosterWidget.tsx

```typescript
// src/components/widgets/teacher/ClassRosterWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Searchbar, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useClassRosterQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl?: string;
  attendanceRate: number;
  averageScore: number;
  isAtRisk: boolean;
};

export const ClassRosterWidget: React.FC<TeacherWidgetProps> = ({ config, classId, onNavigate }) => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { data: students, isLoading } = useClassRosterQuery(classId);

  const filteredStudents = students?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.includes(searchQuery)
  );

  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => onNavigate?.('student-detail-teacher', { studentId: item.id })}
    >
      <Avatar.Text
        size={40}
        label={item.name.substring(0, 2).toUpperCase()}
        style={{ backgroundColor: item.isAtRisk ? theme.colors.errorContainer : theme.colors.primaryContainer }}
      />
      <View style={styles.studentInfo}>
        <View style={styles.nameRow}>
          <Text variant="titleSmall">{item.name}</Text>
          {item.isAtRisk && (
            <Icon name="alert-circle" size={16} color={theme.colors.error} />
          )}
        </View>
        <Text variant="bodySmall" style={styles.rollNumber}>Roll: {item.rollNumber}</Text>
        <View style={styles.metricsRow}>
          <Chip compact icon="calendar-check" style={styles.metricChip}>
            {item.attendanceRate}%
          </Chip>
          <Chip compact icon="chart-line" style={styles.metricChip}>
            {item.averageScore}%
          </Chip>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.outline} />
    </TouchableOpacity>
  );

  return (
    <WidgetContainer title="Class Roster" isLoading={isLoading}>
      {config?.showSearch && (
        <Searchbar
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      )}
      <FlatList
        data={filteredStudents || []}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={styles.emptyText}>No students found</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  searchBar: { marginBottom: 12 },
  studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  studentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rollNumber: { opacity: 0.6, marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metricChip: { height: 24 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { opacity: 0.6 },
});
```

### 4.4 ClassStatsWidget.tsx

```typescript
// src/components/widgets/teacher/ClassStatsWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useClassStatsQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const ClassStatsWidget: React.FC<TeacherWidgetProps> = ({ config, classId }) => {
  const theme = useAppTheme();
  const { data: stats, isLoading } = useClassStatsQuery(classId);

  const statItems = [
    { label: 'Students', value: stats?.totalStudents || 0, icon: 'account-group', color: theme.colors.primary },
    { label: 'Avg Attendance', value: `${stats?.avgAttendance || 0}%`, icon: 'calendar-check', color: '#4CAF50' },
    { label: 'Avg Score', value: `${stats?.avgScore || 0}%`, icon: 'chart-line', color: '#FF9800' },
    { label: 'At Risk', value: stats?.atRiskCount || 0, icon: 'alert-circle', color: theme.colors.error },
  ];

  return (
    <WidgetContainer title="Class Statistics" isLoading={isLoading}>
      <View style={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <Surface key={index} style={styles.statCard} elevation={0}>
            <Icon name={stat.icon} size={24} color={stat.color} />
            <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{stat.label}</Text>
          </Surface>
        ))}
      </View>

      {config?.showPerformanceBreakdown && (
        <View style={styles.breakdown}>
          <Text variant="titleSmall" style={styles.breakdownTitle}>Performance Distribution</Text>
          <View style={styles.barRow}>
            <Text variant="labelSmall" style={styles.barLabel}>Excellent (90%+)</Text>
            <ProgressBar progress={(stats?.excellentCount || 0) / (stats?.totalStudents || 1)} color="#4CAF50" style={styles.bar} />
            <Text variant="labelSmall">{stats?.excellentCount || 0}</Text>
          </View>
          <View style={styles.barRow}>
            <Text variant="labelSmall" style={styles.barLabel}>Good (70-89%)</Text>
            <ProgressBar progress={(stats?.goodCount || 0) / (stats?.totalStudents || 1)} color="#2196F3" style={styles.bar} />
            <Text variant="labelSmall">{stats?.goodCount || 0}</Text>
          </View>
          <View style={styles.barRow}>
            <Text variant="labelSmall" style={styles.barLabel}>Average (50-69%)</Text>
            <ProgressBar progress={(stats?.averageCount || 0) / (stats?.totalStudents || 1)} color="#FF9800" style={styles.bar} />
            <Text variant="labelSmall">{stats?.averageCount || 0}</Text>
          </View>
          <View style={styles.barRow}>
            <Text variant="labelSmall" style={styles.barLabel}>Needs Help (&lt;50%)</Text>
            <ProgressBar progress={(stats?.needsHelpCount || 0) / (stats?.totalStudents || 1)} color={theme.colors.error} style={styles.bar} />
            <Text variant="labelSmall">{stats?.needsHelpCount || 0}</Text>
          </View>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  statCard: { width: '48%', padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  statValue: { fontWeight: 'bold', marginTop: 4 },
  statLabel: { opacity: 0.6 },
  breakdown: { marginTop: 16 },
  breakdownTitle: { marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barLabel: { width: 100, opacity: 0.7 },
  bar: { flex: 1, height: 8, borderRadius: 4 },
});
```

### 4.5 ClassActivityWidget.tsx

```typescript
// src/components/widgets/teacher/ClassActivityWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Activity = {
  id: string;
  type: 'submission' | 'attendance' | 'grade' | 'message';
  title: string;
  description: string;
  studentName?: string;
  timestamp: string;
};

export const ClassActivityWidget: React.FC<TeacherWidgetProps> = ({ config, classId }) => {
  const theme = useAppTheme();

  // Mock data - replace with actual query
  const activities: Activity[] = [
    { id: '1', type: 'submission', title: 'Assignment Submitted', description: 'Math Homework Ch.5', studentName: 'Rahul S.', timestamp: new Date().toISOString() },
    { id: '2', type: 'attendance', title: 'Attendance Marked', description: '28/30 present', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', type: 'grade', title: 'Grades Published', description: 'Science Quiz', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ];

  const activityIcons = {
    submission: { icon: 'file-document', color: theme.colors.primary },
    attendance: { icon: 'calendar-check', color: '#4CAF50' },
    grade: { icon: 'clipboard-check', color: '#FF9800' },
    message: { icon: 'message', color: '#9C27B0' },
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const iconConfig = activityIcons[item.type];
    return (
      <View style={styles.activityItem}>
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
          <Icon name={iconConfig.icon} size={20} color={iconConfig.color} />
        </View>
        <View style={styles.activityInfo}>
          <Text variant="titleSmall">{item.title}</Text>
          <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
          {item.studentName && (
            <Text variant="labelSmall" style={styles.studentName}>by {item.studentName}</Text>
          )}
        </View>
        <Text variant="labelSmall" style={styles.timestamp}>
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </Text>
      </View>
    );
  };

  return (
    <WidgetContainer title="Recent Activity">
      <FlatList
        data={activities.slice(0, config?.maxItems || 5)}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1 },
  description: { opacity: 0.7, marginTop: 2 },
  studentName: { opacity: 0.5, marginTop: 2 },
  timestamp: { opacity: 0.5 },
  divider: { marginVertical: 4 },
});
```

### 4.6 useTeacherClassesQuery Hook

```typescript
// src/hooks/queries/teacher/useTeacherClassesQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useTeacherClassesQuery = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['teacher', 'classes', user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { data: teacherClasses } = await supabase
        .from('teacher_classes')
        .select(`
          class_id,
          subject_id,
          classes (
            id, name, student_count,
            subjects (name_en)
          )
        `)
        .eq('teacher_id', teacher.id)
        .eq('status', 'active');

      const today = new Date().toISOString().split('T')[0];

      return Promise.all(
        (teacherClasses || []).map(async (tc) => {
          // Get today's attendance
          const { count: presentCount } = await supabase
            .from('attendance_records')
            .select('id', { count: 'exact' })
            .eq('class_id', tc.class_id)
            .eq('attendance_date', today)
            .eq('status', 'present');

          // Get pending submissions
          const { count: pendingWork } = await supabase
            .from('assignment_submissions')
            .select('id', { count: 'exact' })
            .eq('status', 'submitted')
            .in('assignment_id',
              supabase.from('assignments').select('id').eq('class_id', tc.class_id)
            );

          const studentCount = tc.classes?.student_count || 0;
          const todayAttendance = studentCount > 0 ? Math.round((presentCount || 0) / studentCount * 100) : 0;

          return {
            id: tc.class_id,
            name: tc.classes?.name || '',
            subject: tc.classes?.subjects?.name_en || '',
            studentCount,
            todayAttendance,
            pendingWork: pendingWork || 0,
          };
        })
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });
};
```

### 4.7 useClassRosterQuery Hook

```typescript
// src/hooks/queries/teacher/useClassRosterQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useClassRosterQuery = (classId: string) => {
  return useQuery({
    queryKey: ['class', 'roster', classId],
    queryFn: async () => {
      const { data: students } = await supabase
        .from('class_students')
        .select(`
          student_id,
          roll_number,
          user_profiles!inner (
            id, full_name, avatar_url
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      return Promise.all(
        (students || []).map(async (s) => {
          // Get attendance rate (last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('student_id', s.student_id)
            .eq('class_id', classId)
            .gte('attendance_date', thirtyDaysAgo);

          const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = attendance?.length ? Math.round((presentCount / attendance.length) * 100) : 0;

          // Get average score
          const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('percentage')
            .eq('student_id', s.student_id)
            .not('percentage', 'is', null);

          const avgScore = submissions?.length
            ? Math.round(submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / submissions.length)
            : 0;

          // Check if at risk
          const isAtRisk = attendanceRate < 75 || avgScore < 50;

          return {
            id: s.student_id,
            name: s.user_profiles?.full_name || '',
            rollNumber: s.roll_number || '',
            avatarUrl: s.user_profiles?.avatar_url,
            attendanceRate,
            averageScore: avgScore,
            isAtRisk,
          };
        })
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!classId,
  });
};
```

### 4.8 Sprint 3 Checkpoint

✅ **Test Criteria:**
- [ ] Class Hub shows all assigned classes
- [ ] Class cards display student count and attendance
- [ ] Tapping class navigates to detail
- [ ] Class roster shows all students
- [ ] Search filters students correctly
- [ ] Class stats show performance breakdown
- [ ] Recent activity shows latest events


---

## 5. SPRINT 4: ATTENDANCE SYSTEM

### 5.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `attendance-mark` | |
| Dynamic Screen | `attendance-reports` | |
| Widget | `attendance.today-summary` | |
| Widget | `attendance.quick-mark` | |
| Widget | `attendance.alerts` | |
| Widget | `attendance.trends` | |
| Hook | `useAttendanceRecordsQuery` | |
| Hook | `useMarkAttendance` | |
| Hook | `useBulkMarkAttendance` | |
| DB Table | `attendance_records` | |
| DB Table | `attendance_alerts` | |


### 5.2 AttendanceMarkScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/AttendanceMarkScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Button, Searchbar, SegmentedButtons, Surface, Divider, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherClassesQuery, useClassRosterQuery } from '@/hooks/queries/teacher';
import { useBulkMarkAttendance } from '@/hooks/mutations/teacher';
import { useTranslation } from 'react-i18next';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

type StudentAttendance = {
  studentId: string;
  status: AttendanceStatus;
};

export const AttendanceMarkScreen: React.FC = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');
  const preselectedClassId = route?.params?.classId;

  // State
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClassId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Queries
  const { data: classes } = useTeacherClassesQuery();
  const { data: students, isLoading: loadingStudents } = useClassRosterQuery(selectedClassId);
  const { mutate: submitAttendance, isPending: submitting } = useBulkMarkAttendance();

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery)
    );
  }, [students, searchQuery]);

  // Status colors and icons
  const statusConfig = {
    present: { icon: 'check-circle', color: '#4CAF50', label: 'P' },
    absent: { icon: 'close-circle', color: theme.colors.error, label: 'A' },
    late: { icon: 'clock-alert', color: '#FF9800', label: 'L' },
    excused: { icon: 'account-check', color: '#9C27B0', label: 'E' },
  };

  // Mark individual student
  const markStudent = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // Bulk actions
  const markAllAs = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students?.forEach(s => { newAttendance[s.id] = status; });
    setAttendance(newAttendance);
  };

  // Submit attendance
  const handleSubmit = () => {
    if (!selectedClassId) return;

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
      classId: selectedClassId,
      date: new Date().toISOString().split('T')[0],
    }));

    submitAttendance(records, {
      onSuccess: () => {
        setSnackbarMessage('Attendance saved successfully');
        setSnackbarVisible(true);
        setTimeout(() => navigation.goBack(), 1500);
      },
      onError: (error) => {
        setSnackbarMessage('Failed to save attendance');
        setSnackbarVisible(true);
      },
    });
  };

  // Calculate summary
  const summary = useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter(v => v === 'present').length,
      absent: values.filter(v => v === 'absent').length,
      late: values.filter(v => v === 'late').length,
      excused: values.filter(v => v === 'excused').length,
      total: students?.length || 0,
      marked: values.length,
    };
  }, [attendance, students]);

  // Render student row
  const renderStudent = ({ item, index }: { item: any; index: number }) => {
    const status = attendance[item.id];
    return (
      <View style={styles.studentRow}>
        <Text variant="bodyMedium" style={styles.rollNumber}>{item.rollNumber || index + 1}</Text>
        <Avatar.Text
          size={40}
          label={item.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: status ? statusConfig[status].color + '30' : theme.colors.surfaceVariant }}
        />
        <View style={styles.studentInfo}>
          <Text variant="titleSmall" numberOfLines={1}>{item.name}</Text>
          {item.isAtRisk && (
            <Chip compact icon="alert" style={styles.atRiskChip}>At Risk</Chip>
          )}
        </View>
        <View style={styles.statusButtons}>
          {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                status === s && { backgroundColor: statusConfig[s].color },
              ]}
              onPress={() => markStudent(item.id, s)}
            >
              <Text
                style={[
                  styles.statusLabel,
                  { color: status === s ? 'white' : statusConfig[s].color },
                ]}
              >
                {statusConfig[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Class Selector */}
      <Surface style={styles.classSelector} elevation={1}>
        <Text variant="labelMedium" style={styles.sectionLabel}>Select Class</Text>
        <FlatList
          data={classes || []}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={selectedClassId === item.id}
              onPress={() => setSelectedClassId(item.id)}
              style={styles.classChip}
            >
              {item.name}
            </Chip>
          )}
          contentContainerStyle={styles.classChipList}
        />
      </Surface>

      {selectedClassId && (
        <>
          {/* Search and Bulk Actions */}
          <View style={styles.toolbarRow}>
            <Searchbar
              placeholder="Search students..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
            />
          </View>

          <View style={styles.bulkActionsRow}>
            <Text variant="labelMedium">Quick Mark:</Text>
            <Button mode="contained-tonal" compact onPress={() => markAllAs('present')} style={styles.bulkBtn}>
              All Present
            </Button>
            <Button mode="outlined" compact onPress={() => markAllAs('absent')} style={styles.bulkBtn}>
              All Absent
            </Button>
          </View>

          {/* Summary Bar */}
          <Surface style={styles.summaryBar} elevation={0}>
            <View style={styles.summaryItem}>
              <Text variant="titleMedium" style={{ color: '#4CAF50' }}>{summary.present}</Text>
              <Text variant="labelSmall">Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleMedium" style={{ color: theme.colors.error }}>{summary.absent}</Text>
              <Text variant="labelSmall">Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleMedium" style={{ color: '#FF9800' }}>{summary.late}</Text>
              <Text variant="labelSmall">Late</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleMedium" style={{ color: '#9C27B0' }}>{summary.excused}</Text>
              <Text variant="labelSmall">Excused</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleMedium">{summary.marked}/{summary.total}</Text>
              <Text variant="labelSmall">Marked</Text>
            </View>
          </Surface>

          {/* Student List */}
          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="account-group-outline" size={48} color={theme.colors.outline} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {loadingStudents ? 'Loading students...' : 'No students found'}
                </Text>
              </View>
            }
          />

          {/* Submit Button */}
          <Surface style={styles.submitBar} elevation={2}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={summary.marked === 0 || submitting}
              style={styles.submitButton}
              icon="check"
            >
              Save Attendance ({summary.marked}/{summary.total})
            </Button>
          </Surface>
        </>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  classSelector: { padding: 16 },
  sectionLabel: { marginBottom: 8, opacity: 0.7 },
  classChipList: { gap: 8 },
  classChip: { marginRight: 8 },
  toolbarRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: { marginBottom: 8 },
  bulkActionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  bulkBtn: { marginLeft: 4 },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, marginHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  summaryItem: { alignItems: 'center' },
  listContent: { paddingBottom: 100 },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rollNumber: { width: 28, textAlign: 'center', opacity: 0.6 },
  studentInfo: { flex: 1 },
  atRiskChip: { alignSelf: 'flex-start', marginTop: 4, height: 20, backgroundColor: '#FF980020' },
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd' },
  statusLabel: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyText: { marginTop: 12, opacity: 0.6 },
  submitBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  submitButton: { width: '100%' },
});
```

### 5.3 TodayAttendanceWidget.tsx

```typescript
// src/components/widgets/teacher/TodayAttendanceWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const TodayAttendanceWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  // Mock data - replace with actual query
  const stats = {
    totalStudents: 120,
    present: 108,
    absent: 8,
    late: 4,
    classesMarked: 3,
    totalClasses: 5,
  };

  const attendanceRate = Math.round((stats.present / stats.totalStudents) * 100);

  return (
    <WidgetContainer title="Today's Attendance">
      <View style={styles.summaryRow}>
        <Surface style={[styles.mainStat, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <Text variant="displaySmall" style={{ color: theme.colors.primary }}>{attendanceRate}%</Text>
          <Text variant="labelMedium" style={{ color: theme.colors.primary }}>Overall</Text>
        </Surface>
        <View style={styles.breakdownColumn}>
          <View style={styles.breakdownItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text variant="titleMedium">{stats.present}</Text>
            <Text variant="labelSmall" style={styles.label}>Present</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Icon name="close-circle" size={20} color={theme.colors.error} />
            <Text variant="titleMedium">{stats.absent}</Text>
            <Text variant="labelSmall" style={styles.label}>Absent</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Icon name="clock-alert" size={20} color="#FF9800" />
            <Text variant="titleMedium">{stats.late}</Text>
            <Text variant="labelSmall" style={styles.label}>Late</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text variant="labelMedium">Classes Marked: {stats.classesMarked}/{stats.totalClasses}</Text>
        <ProgressBar progress={stats.classesMarked / stats.totalClasses} style={styles.progressBar} />
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 16 },
  mainStat: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  breakdownColumn: { flex: 1, justifyContent: 'space-between' },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { opacity: 0.6 },
  progressSection: { marginTop: 16 },
  progressBar: { height: 8, borderRadius: 4, marginTop: 8 },
});
```


### 5.3 AttendanceQuickMarkWidget.tsx

```typescript
// src/components/widgets/teacher/AttendanceQuickMarkWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Button, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useClassRosterQuery } from '@/hooks/queries/teacher';
import { useBulkMarkAttendance } from '@/hooks/mutations/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export const AttendanceQuickMarkWidget: React.FC<TeacherWidgetProps> = ({ config, classId }) => {
  const theme = useAppTheme();
  const { data: students } = useClassRosterQuery(classId);
  const { mutate: bulkMark, isPending } = useBulkMarkAttendance();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const markStudent = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    students?.forEach(s => { allPresent[s.id] = 'present'; });
    setAttendance(allPresent);
  };

  const handleSubmit = () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
      classId,
      date: new Date().toISOString().split('T')[0],
    }));
    bulkMark(records);
  };

  const statusColors = {
    present: '#4CAF50',
    absent: theme.colors.error,
    late: '#FF9800',
    excused: '#9C27B0',
  };

  const renderStudent = ({ item }: { item: any }) => {
    const status = attendance[item.id];
    return (
      <View style={styles.studentRow}>
        <Avatar.Text size={36} label={item.name.substring(0, 2).toUpperCase()} />
        <Text variant="bodyMedium" style={styles.studentName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.statusButtons}>
          {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, status === s && { backgroundColor: statusColors[s] }]}
              onPress={() => markStudent(item.id, s)}
            >
              <Icon
                name={s === 'present' ? 'check' : s === 'absent' ? 'close' : 'clock'}
                size={18}
                color={status === s ? 'white' : statusColors[s]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const markedCount = Object.keys(attendance).length;
  const totalCount = students?.length || 0;

  return (
    <WidgetContainer title="Quick Mark Attendance">
      <View style={styles.header}>
        <Chip icon="account-group">{markedCount}/{totalCount} marked</Chip>
        <Button mode="text" onPress={markAllPresent}>Mark All Present</Button>
      </View>

      <FlatList
        data={students || []}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.list}
        scrollEnabled={false}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isPending}
        disabled={markedCount === 0 || isPending}
        style={styles.submitButton}
      >
        Submit Attendance
      </Button>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  list: { maxHeight: 300 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  studentName: { flex: 1 },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  submitButton: { marginTop: 16 },
});
```


### 5.4 AttendanceAlertsWidget.tsx

```typescript
// src/components/widgets/teacher/AttendanceAlertsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type Alert = {
  id: string;
  studentName: string;
  alertType: 'low_attendance' | 'consecutive_absences' | 'pattern_detected';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  currentValue: number;
  threshold: number;
};

export const AttendanceAlertsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  const alerts: Alert[] = [
    { id: '1', studentName: 'Priya M.', alertType: 'low_attendance', severity: 'critical', message: 'Attendance below 60%', currentValue: 58, threshold: 75 },
    { id: '2', studentName: 'Amit K.', alertType: 'consecutive_absences', severity: 'high', message: '5 consecutive absences', currentValue: 5, threshold: 3 },
    { id: '3', studentName: 'Sneha R.', alertType: 'pattern_detected', severity: 'medium', message: 'Frequent Monday absences', currentValue: 4, threshold: 3 },
  ];

  const severityColors = { critical: theme.colors.error, high: '#FF9800', medium: '#FFC107' };
  const alertIcons = { low_attendance: 'chart-line-variant', consecutive_absences: 'calendar-remove', pattern_detected: 'chart-timeline-variant' };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => onNavigate?.('student-detail-teacher', { studentId: item.id })}
    >
      <View style={[styles.severityBar, { backgroundColor: severityColors[item.severity] }]} />
      <Icon name={alertIcons[item.alertType]} size={24} color={severityColors[item.severity]} />
      <View style={styles.alertInfo}>
        <Text variant="titleSmall">{item.studentName}</Text>
        <Text variant="bodySmall" style={styles.message}>{item.message}</Text>
      </View>
      <IconButton icon="phone" size={20} onPress={() => onNavigate?.('contact-parent', { studentId: item.id })} />
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Attendance Alerts"
      action={<Chip compact icon="alert">{alerts.length}</Chip>}
    >
      <FlatList
        data={alerts.slice(0, config?.maxItems || 5)}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.emptyText}>No alerts</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  alertItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  severityBar: { width: 4, height: 40, borderRadius: 2 },
  alertInfo: { flex: 1 },
  message: { opacity: 0.7, marginTop: 2 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```


### 5.5 useBulkMarkAttendance Hook

```typescript
// src/hooks/mutations/teacher/useBulkMarkAttendance.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type AttendanceRecord = {
  studentId: string;
  classId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  date: string;
};

export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (records: AttendanceRecord[]) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const attendanceData = records.map(r => ({
        customer_id: teacher.customer_id,
        student_id: r.studentId,
        class_id: r.classId,
        attendance_date: r.date,
        status: r.status,
        marked_by: teacher.id,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(attendanceData, {
          onConflict: 'customer_id,student_id,class_id,attendance_date',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
};
```

### 5.6 Sprint 4 Checkpoint

✅ **Test Criteria:**
- [ ] Attendance mark screen loads with student list
- [ ] Can mark individual students present/absent/late
- [ ] Mark all present works correctly
- [ ] Submit saves attendance to database
- [ ] Today's summary shows correct counts
- [ ] Alerts display students with low attendance
- [ ] Tapping alert navigates to student detail


---

## 6. SPRINT 5: ASSIGNMENT & GRADING

### 6.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `grading-hub` | 🔲 |
| Fixed Screen | `assignment-create` | 🔲 |
| Fixed Screen | `assignment-detail` | 🔲 |
| Fixed Screen | `grade-submission` | 🔲 |
| Widget | `grading.pending-list` | 🔲 |
| Widget | `grading.recent` | 🔲 |
| Widget | `grading.stats` | 🔲 |
| Widget | `grading.rubric-templates` | 🔲 |
| Hook | `useTeacherAssignmentsQuery` | 🔲 |
| Hook | `useCreateAssignment` | 🔲 |
| Hook | `useGradeSubmission` | 🔲 |
| DB Table | `assignments` | 🔲 |
| DB Table | `assignment_submissions` | 🔲 |


### 6.2 PendingSubmissionsWidget.tsx

```typescript
// src/components/widgets/teacher/PendingSubmissionsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Divider, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { usePendingGradingQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

export const PendingSubmissionsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: submissions, isLoading } = usePendingGradingQuery({ limit: config?.maxItems || 10 });

  const groupedByAssignment = submissions?.reduce((acc, sub) => {
    if (!acc[sub.assignmentTitle]) {
      acc[sub.assignmentTitle] = { title: sub.assignmentTitle, className: sub.className, submissions: [] };
    }
    acc[sub.assignmentTitle].submissions.push(sub);
    return acc;
  }, {} as Record<string, any>) || {};

  const renderGroup = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => onNavigate?.('assignment-detail-teacher', { assignmentId: item.submissions[0].assignmentId })}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text variant="titleSmall" numberOfLines={1}>{item.title}</Text>
          <Text variant="bodySmall" style={styles.className}>{item.className}</Text>
        </View>
        <Badge size={24}>{item.submissions.length}</Badge>
      </View>
      <View style={styles.avatarRow}>
        {item.submissions.slice(0, 5).map((sub: any, idx: number) => (
          <Avatar.Text
            key={sub.id}
            size={28}
            label={sub.studentName.substring(0, 2).toUpperCase()}
            style={[styles.avatar, { marginLeft: idx > 0 ? -8 : 0 }]}
          />
        ))}
        {item.submissions.length > 5 && (
          <Text variant="labelSmall" style={styles.moreText}>+{item.submissions.length - 5}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Pending Submissions"
      isLoading={isLoading}
      action={
        <Text variant="labelMedium" style={{ color: theme.colors.primary }} onPress={() => onNavigate?.('grading-hub')}>
          View All
        </Text>
      }
    >
      <FlatList
        data={Object.values(groupedByAssignment)}
        renderItem={renderGroup}
        keyExtractor={(item) => item.title}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.emptyText}>All caught up!</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  groupItem: { paddingVertical: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupInfo: { flex: 1 },
  className: { opacity: 0.6, marginTop: 2 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avatar: { borderWidth: 2, borderColor: 'white' },
  moreText: { marginLeft: 8, opacity: 0.6 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```


### 6.3 RecentGradesWidget.tsx

```typescript
// src/components/widgets/teacher/RecentGradesWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type GradedItem = {
  id: string;
  studentName: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradedAt: string;
};

export const RecentGradesWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  const recentGrades: GradedItem[] = [
    { id: '1', studentName: 'Rahul S.', assignmentTitle: 'Math Quiz Ch.5', score: 85, maxScore: 100, gradedAt: new Date().toISOString() },
    { id: '2', studentName: 'Priya M.', assignmentTitle: 'Math Quiz Ch.5', score: 92, maxScore: 100, gradedAt: new Date(Date.now() - 1800000).toISOString() },
    { id: '3', studentName: 'Amit K.', assignmentTitle: 'Science Project', score: 78, maxScore: 100, gradedAt: new Date(Date.now() - 3600000).toISOString() },
  ];

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#2196F3';
    if (percentage >= 50) return '#FF9800';
    return theme.colors.error;
  };

  const renderGrade = ({ item }: { item: GradedItem }) => {
    const percentage = Math.round((item.score / item.maxScore) * 100);
    return (
      <TouchableOpacity
        style={styles.gradeItem}
        onPress={() => onNavigate?.('submission-detail', { submissionId: item.id })}
      >
        <Avatar.Text size={40} label={item.studentName.substring(0, 2).toUpperCase()} />
        <View style={styles.gradeInfo}>
          <Text variant="titleSmall">{item.studentName}</Text>
          <Text variant="bodySmall" style={styles.assignment}>{item.assignmentTitle}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text variant="titleMedium" style={{ color: getScoreColor(percentage) }}>
            {item.score}/{item.maxScore}
          </Text>
          <Text variant="labelSmall" style={styles.timeText}>
            {formatDistanceToNow(new Date(item.gradedAt), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <WidgetContainer title="Recently Graded">
      <FlatList
        data={recentGrades.slice(0, config?.maxItems || 5)}
        renderItem={renderGrade}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  gradeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  gradeInfo: { flex: 1 },
  assignment: { opacity: 0.6, marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  timeText: { opacity: 0.5, marginTop: 2 },
});
```


### 6.4 GradingStatsWidget.tsx

```typescript
// src/components/widgets/teacher/GradingStatsWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const GradingStatsWidget: React.FC<TeacherWidgetProps> = ({ config }) => {
  const theme = useAppTheme();

  const stats = {
    totalAssignments: 12,
    pendingGrading: 28,
    gradedThisWeek: 45,
    avgTurnaround: 2.3,
    classAverage: 76,
  };

  return (
    <WidgetContainer title="Grading Overview">
      <View style={styles.statsRow}>
        <Surface style={[styles.statCard, { backgroundColor: '#FF980020' }]} elevation={0}>
          <Icon name="clipboard-clock" size={24} color="#FF9800" />
          <Text variant="headlineSmall" style={styles.statValue}>{stats.pendingGrading}</Text>
          <Text variant="labelSmall" style={styles.statLabel}>Pending</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#4CAF5020' }]} elevation={0}>
          <Icon name="clipboard-check" size={24} color="#4CAF50" />
          <Text variant="headlineSmall" style={styles.statValue}>{stats.gradedThisWeek}</Text>
          <Text variant="labelSmall" style={styles.statLabel}>This Week</Text>
        </Surface>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <Text variant="bodyMedium">Avg. Turnaround</Text>
          <Text variant="titleSmall">{stats.avgTurnaround} days</Text>
        </View>
        <View style={styles.metricRow}>
          <Text variant="bodyMedium">Class Average</Text>
          <Text variant="titleSmall" style={{ color: stats.classAverage >= 70 ? '#4CAF50' : '#FF9800' }}>
            {stats.classAverage}%
          </Text>
        </View>
        <ProgressBar progress={stats.classAverage / 100} color={stats.classAverage >= 70 ? '#4CAF50' : '#FF9800'} style={styles.progressBar} />
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontWeight: 'bold', marginTop: 8 },
  statLabel: { opacity: 0.6 },
  metricsSection: { marginTop: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
});
```


### 6.5 useCreateAssignment Hook

```typescript
// src/hooks/mutations/teacher/useCreateAssignment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type AssignmentData = {
  title: string;
  description?: string;
  classId: string;
  subjectId?: string;
  dueDate: string;
  totalPoints: number;
  attachments?: string[];
  rubricId?: string;
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: AssignmentData) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { data: assignment, error } = await supabase
        .from('assignments')
        .insert({
          customer_id: teacher.customer_id,
          teacher_id: teacher.id,
          class_id: data.classId,
          subject_id: data.subjectId,
          title_en: data.title,
          description_en: data.description,
          due_date: data.dueDate,
          total_points: data.totalPoints,
          attachment_urls: data.attachments || [],
          rubric_id: data.rubricId,
          status: 'published',
        })
        .select()
        .single();

      if (error) throw error;
      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
};
```

### 6.6 useGradeSubmission Hook

```typescript
// src/hooks/mutations/teacher/useGradeSubmission.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type GradeData = {
  submissionId: string;
  score: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: GradeData) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Get assignment total points
      const { data: submission } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, assignments(total_points)')
        .eq('id', data.submissionId)
        .single();

      const totalPoints = submission?.assignments?.total_points || 100;
      const percentage = (data.score / totalPoints) * 100;

      const { data: updated, error } = await supabase
        .from('assignment_submissions')
        .update({
          score: data.score,
          percentage,
          feedback: data.feedback,
          rubric_scores: data.rubricScores,
          graded_by: teacher.id,
          graded_at: new Date().toISOString(),
          status: 'graded',
        })
        .eq('id', data.submissionId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'grading'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
};
```

### 6.7 AssignmentCreateScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/AssignmentCreateScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Surface,
  Divider,
  SegmentedButtons,
  Switch,
  HelperText,
  Snackbar,
  Portal,
  Modal,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useTeacherClassesQuery } from '@/hooks/queries/teacher';
import { useCreateAssignment } from '@/hooks/mutations/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';

type AssignmentType = 'homework' | 'quiz' | 'project' | 'exam';

type FormData = {
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  type: AssignmentType;
  totalPoints: number;
  dueDate: Date;
  dueTime: Date;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  instructions: string;
  attachments: string[];
  rubricEnabled: boolean;
  rubricItems: { criteria: string; points: number }[];
};

export const AssignmentCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  // Pre-selected class from route params
  const preSelectedClassId = (route.params as any)?.classId;

  // === DATA HOOKS ===
  const { data: classes = [] } = useTeacherClassesQuery();
  const createMutation = useCreateAssignment();

  // === FORM STATE ===
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    classId: preSelectedClassId || '',
    subjectId: '',
    type: 'homework',
    totalPoints: 100,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    dueTime: new Date(),
    allowLateSubmission: true,
    latePenaltyPercent: 10,
    instructions: '',
    attachments: [],
    rubricEnabled: false,
    rubricItems: [{ criteria: '', points: 0 }],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // === ASSIGNMENT TYPES ===
  const assignmentTypes: { value: AssignmentType; label: string; icon: string }[] = [
    { value: 'homework', label: 'Homework', icon: 'book-open-variant' },
    { value: 'quiz', label: 'Quiz', icon: 'head-question' },
    { value: 'project', label: 'Project', icon: 'folder-star' },
    { value: 'exam', label: 'Exam', icon: 'file-document-edit' },
  ];

  // === HANDLERS ===
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.classId) newErrors.classId = 'Please select a class';
    if (formData.totalPoints < 1) newErrors.totalPoints = 'Points must be at least 1';
    if (formData.dueDate < new Date()) newErrors.dueDate = 'Due date must be in the future';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        type: formData.type,
        totalPoints: formData.totalPoints,
        dueDate: formData.dueDate.toISOString(),
        allowLateSubmission: formData.allowLateSubmission,
        latePenaltyPercent: formData.latePenaltyPercent,
        instructions: formData.instructions,
        rubric: formData.rubricEnabled ? formData.rubricItems : undefined,
      });

      setSnackbar({ visible: true, message: 'Assignment created successfully!' });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to create assignment' });
    }
  };

  const addRubricItem = () => {
    setFormData(prev => ({
      ...prev,
      rubricItems: [...prev.rubricItems, { criteria: '', points: 0 }],
    }));
  };

  const updateRubricItem = (index: number, field: 'criteria' | 'points', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      rubricItems: prev.rubricItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeRubricItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rubricItems: prev.rubricItems.filter((_, i) => i !== index),
    }));
  };

  // === RENDER ===
  const selectedClass = classes.find(c => c.id === formData.classId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            Create Assignment
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info Section */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              mode="outlined"
              label="Assignment Title *"
              value={formData.title}
              onChangeText={(v) => updateField('title', v)}
              error={!!errors.title}
              style={styles.input}
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}

            <TextInput
              mode="outlined"
              label="Description"
              value={formData.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            {/* Class Selector */}
            <Text variant="labelMedium" style={styles.fieldLabel}>Class *</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: errors.classId ? theme.colors.error : theme.colors.outline }]}
              onPress={() => setShowClassPicker(true)}
            >
              <Icon name="school" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={{ flex: 1, color: selectedClass ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select a class'}
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            {errors.classId && <HelperText type="error">{errors.classId}</HelperText>}
          </Surface>

          {/* Assignment Type */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Assignment Type</Text>
            <View style={styles.typeGrid}>
              {assignmentTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    {
                      borderColor: formData.type === type.value ? theme.colors.primary : theme.colors.outline,
                      backgroundColor: formData.type === type.value ? `${theme.colors.primary}15` : 'transparent',
                    },
                  ]}
                  onPress={() => updateField('type', type.value)}
                >
                  <Icon
                    name={type.icon}
                    size={28}
                    color={formData.type === type.value ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="labelMedium"
                    style={{ color: formData.type === type.value ? theme.colors.primary : theme.colors.onSurface }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>

          {/* Points & Due Date */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Scoring & Deadline</Text>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  mode="outlined"
                  label="Total Points *"
                  value={String(formData.totalPoints)}
                  onChangeText={(v) => updateField('totalPoints', parseInt(v) || 0)}
                  keyboardType="numeric"
                  error={!!errors.totalPoints}
                />
              </View>
              <View style={styles.halfWidth}>
                <TouchableOpacity
                  style={[styles.selector, { borderColor: theme.colors.outline }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar" size={20} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.onSurface }}>
                    {formData.dueDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon name="clock-alert" size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium">Allow Late Submission</Text>
              </View>
              <Switch
                value={formData.allowLateSubmission}
                onValueChange={(v) => updateField('allowLateSubmission', v)}
              />
            </View>

            {formData.allowLateSubmission && (
              <View style={styles.penaltyRow}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Penalty per day late:
                </Text>
                <TextInput
                  mode="outlined"
                  dense
                  value={String(formData.latePenaltyPercent)}
                  onChangeText={(v) => updateField('latePenaltyPercent', parseInt(v) || 0)}
                  keyboardType="numeric"
                  style={styles.penaltyInput}
                  right={<TextInput.Affix text="%" />}
                />
              </View>
            )}
          </Surface>

          {/* Instructions */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Instructions</Text>
            <TextInput
              mode="outlined"
              label="Detailed Instructions"
              value={formData.instructions}
              onChangeText={(v) => updateField('instructions', v)}
              multiline
              numberOfLines={5}
              placeholder="Enter step-by-step instructions for students..."
            />
          </Surface>

          {/* Rubric Section */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon name="format-list-checks" size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium">Grading Rubric</Text>
              </View>
              <Switch
                value={formData.rubricEnabled}
                onValueChange={(v) => updateField('rubricEnabled', v)}
              />
            </View>

            {formData.rubricEnabled && (
              <View style={styles.rubricContainer}>
                {formData.rubricItems.map((item, index) => (
                  <View key={index} style={styles.rubricItem}>
                    <View style={styles.rubricCriteria}>
                      <TextInput
                        mode="outlined"
                        dense
                        label="Criteria"
                        value={item.criteria}
                        onChangeText={(v) => updateRubricItem(index, 'criteria', v)}
                        style={styles.flex}
                      />
                      <TextInput
                        mode="outlined"
                        dense
                        label="Points"
                        value={String(item.points)}
                        onChangeText={(v) => updateRubricItem(index, 'points', parseInt(v) || 0)}
                        keyboardType="numeric"
                        style={styles.rubricPoints}
                      />
                      {formData.rubricItems.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeRubricItem(index)}
                          style={styles.removeButton}
                        >
                          <Icon name="close-circle" size={24} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <Button
                  mode="outlined"
                  icon="plus"
                  onPress={addRubricItem}
                  style={styles.addRubricButton}
                >
                  Add Criteria
                </Button>
              </View>
            )}
          </Surface>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Create Assignment
          </Button>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dueDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) updateField('dueDate', date);
            }}
          />
        )}

        {/* Class Picker Modal */}
        <Portal>
          <Modal
            visible={showClassPicker}
            onDismiss={() => setShowClassPicker(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="titleMedium" style={styles.modalTitle}>Select Class</Text>
            <ScrollView style={styles.classList}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classItem,
                    formData.classId === cls.id && { backgroundColor: `${theme.colors.primary}15` },
                  ]}
                  onPress={() => {
                    updateField('classId', cls.id);
                    setShowClassPicker(false);
                  }}
                >
                  <Icon
                    name="school"
                    size={24}
                    color={formData.classId === cls.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <View style={styles.classInfo}>
                    <Text variant="bodyLarge">{cls.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Section {cls.section} - {cls.studentCount} students
                    </Text>
                  </View>
                  {formData.classId === cls.id && (
                    <Icon name="check" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Modal>
        </Portal>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  backButton: { marginRight: 16 },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { marginBottom: 8, marginTop: 4 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  divider: { marginVertical: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  penaltyInput: { width: 80 },
  rubricContainer: { marginTop: 16 },
  rubricItem: { marginBottom: 12 },
  rubricCriteria: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rubricPoints: { width: 80 },
  removeButton: { padding: 4 },
  addRubricButton: { marginTop: 8 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: { borderRadius: 8 },
  submitButtonContent: { paddingVertical: 8 },
  modal: { margin: 20, borderRadius: 12, padding: 16, maxHeight: '70%' },
  modalTitle: { marginBottom: 16 },
  classList: { maxHeight: 400 },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  classInfo: { flex: 1 },
});
```


### 6.8 GradeSubmissionScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/GradeSubmissionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Surface,
  Chip,
  Divider,
  ProgressBar,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useSubmissionDetailQuery } from '@/hooks/queries/teacher';
import { useGradeSubmission } from '@/hooks/mutations/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';

type RubricScore = {
  criteriaId: string;
  criteriaName: string;
  maxPoints: number;
  awardedPoints: number;
};

export const GradeSubmissionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  const { submissionId } = route.params as { submissionId: string };

  // === DATA ===
  const { data: submission, isLoading } = useSubmissionDetailQuery(submissionId);
  const gradeMutation = useGradeSubmission();

  // === FORM STATE ===
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([]);
  const [showRubric, setShowRubric] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Initialize form with existing data
  useEffect(() => {
    if (submission) {
      if (submission.score) setScore(String(submission.score));
      if (submission.feedback) setFeedback(submission.feedback);
      if (submission.assignment?.rubric) {
        setRubricScores(
          submission.assignment.rubric.map((r: any) => ({
            criteriaId: r.id,
            criteriaName: r.criteria,
            maxPoints: r.points,
            awardedPoints: submission.rubricScores?.[r.id] || 0,
          }))
        );
        setShowRubric(true);
      }
    }
  }, [submission]);

  // === SCORE CALCULATIONS ===
  const totalPoints = submission?.assignment?.totalPoints || 100;
  const scoreNum = parseInt(score) || 0;
  const percentage = Math.round((scoreNum / totalPoints) * 100);

  const rubricTotal = rubricScores.reduce((sum, r) => sum + r.awardedPoints, 0);
  const rubricMax = rubricScores.reduce((sum, r) => sum + r.maxPoints, 0);

  // === GRADE COLOR ===
  const getGradeColor = (pct: number) => {
    if (pct >= 90) return '#4CAF50';
    if (pct >= 75) return '#2196F3';
    if (pct >= 60) return '#FF9800';
    return theme.colors.error;
  };

  // === HANDLERS ===
  const updateRubricScore = (criteriaId: string, points: number) => {
    setRubricScores(prev =>
      prev.map(r => r.criteriaId === criteriaId ? { ...r, awardedPoints: points } : r)
    );
  };

  const applyRubricToScore = () => {
    setScore(String(rubricTotal));
  };

  const handleSubmit = async () => {
    if (!score || scoreNum < 0 || scoreNum > totalPoints) {
      setSnackbar({ visible: true, message: `Score must be between 0 and ${totalPoints}` });
      return;
    }

    try {
      const rubricData = showRubric
        ? rubricScores.reduce((acc, r) => ({ ...acc, [r.criteriaId]: r.awardedPoints }), {})
        : undefined;

      await gradeMutation.mutateAsync({
        submissionId,
        score: scoreNum,
        feedback: feedback.trim() || undefined,
        rubricScores: rubricData,
      });

      setSnackbar({ visible: true, message: 'Grade saved successfully!' });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to save grade' });
    }
  };

  // === LOADING ===
  if (isLoading || !submission) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text>Loading submission...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            Grade Submission
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Student Info Card */}
          <Surface style={[styles.studentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.studentRow}>
              <Avatar.Text
                size={48}
                label={submission.student.name.substring(0, 2).toUpperCase()}
              />
              <View style={styles.studentInfo}>
                <Text variant="titleMedium">{submission.student.name}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {submission.student.rollNumber} - {submission.class.name}
                </Text>
              </View>
              <Chip
                compact
                mode="outlined"
                style={{ borderColor: submission.isLate ? theme.colors.error : '#4CAF50' }}
              >
                {submission.isLate ? 'Late' : 'On Time'}
              </Chip>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.assignmentInfo}>
              <Icon name="file-document" size={20} color={theme.colors.primary} />
              <View style={styles.assignmentText}>
                <Text variant="titleSmall">{submission.assignment.title}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Surface>

          {/* Submission Content */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Submission</Text>
            {submission.content && (
              <View style={[styles.contentBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="bodyMedium">{submission.content}</Text>
              </View>
            )}
            {submission.attachments?.length > 0 && (
              <View style={styles.attachments}>
                {submission.attachments.map((att: any, idx: number) => (
                  <TouchableOpacity key={idx} style={styles.attachmentItem}>
                    <Icon name="file" size={20} color={theme.colors.primary} />
                    <Text variant="bodySmall" numberOfLines={1}>{att.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Surface>

          {/* Rubric Grading (if enabled) */}
          {showRubric && rubricScores.length > 0 && (
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.rubricHeader}>
                <Text variant="titleMedium">Rubric</Text>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                  {rubricTotal} / {rubricMax} pts
                </Text>
              </View>

              {rubricScores.map((rubric) => (
                <View key={rubric.criteriaId} style={styles.rubricItem}>
                  <View style={styles.rubricRow}>
                    <Text variant="bodyMedium" style={styles.flex}>{rubric.criteriaName}</Text>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      / {rubric.maxPoints}
                    </Text>
                  </View>
                  <View style={styles.pointsRow}>
                    {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                      const points = Math.round(rubric.maxPoints * fraction);
                      const isSelected = rubric.awardedPoints === points;
                      return (
                        <TouchableOpacity
                          key={fraction}
                          style={[
                            styles.pointButton,
                            {
                              backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                              borderColor: theme.colors.outline,
                            },
                          ]}
                          onPress={() => updateRubricScore(rubric.criteriaId, points)}
                        >
                          <Text
                            variant="labelMedium"
                            style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }}
                          >
                            {points}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <Button
                mode="outlined"
                onPress={applyRubricToScore}
                style={styles.applyButton}
              >
                Apply Rubric Score ({rubricTotal} pts)
              </Button>
            </Surface>
          )}

          {/* Score Input */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Final Score</Text>

            <View style={styles.scoreRow}>
              <TextInput
                mode="outlined"
                label="Score"
                value={score}
                onChangeText={setScore}
                keyboardType="numeric"
                style={styles.scoreInput}
                right={<TextInput.Affix text={`/ ${totalPoints}`} />}
              />
              <View style={[styles.percentageBox, { backgroundColor: getGradeColor(percentage) }]}>
                <Text variant="headlineSmall" style={{ color: 'white', fontWeight: 'bold' }}>
                  {percentage}%
                </Text>
              </View>
            </View>

            <ProgressBar
              progress={percentage / 100}
              color={getGradeColor(percentage)}
              style={styles.progressBar}
            />

            {/* Quick Score Buttons */}
            <View style={styles.quickScores}>
              {[100, 90, 80, 70, 60, 50].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.quickButton, { borderColor: theme.colors.outline }]}
                  onPress={() => setScore(String(Math.round(totalPoints * pct / 100)))}
                >
                  <Text variant="labelSmall">{pct}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>

          {/* Feedback */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Feedback</Text>
            <TextInput
              mode="outlined"
              label="Written Feedback (Optional)"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              placeholder="Provide constructive feedback for the student..."
            />

            {/* Quick Feedback Chips */}
            <View style={styles.quickFeedback}>
              {['Great work!', 'Needs improvement', 'Review instructions', 'See me after class'].map((text) => (
                <Chip
                  key={text}
                  compact
                  onPress={() => setFeedback(prev => prev ? `${prev} ${text}` : text)}
                  style={styles.feedbackChip}
                >
                  {text}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Submit Bar */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.bottomSummary}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {submission.student.name}
            </Text>
            <Text variant="titleMedium" style={{ color: getGradeColor(percentage) }}>
              {score || '0'} / {totalPoints} ({percentage}%)
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={gradeMutation.isPending}
            disabled={gradeMutation.isPending || !score}
            style={styles.submitButton}
          >
            Save Grade
          </Button>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  backButton: { marginRight: 16 },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 16 },
  studentCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentInfo: { flex: 1 },
  divider: { marginVertical: 12 },
  assignmentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignmentText: { flex: 1 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  contentBox: { padding: 12, borderRadius: 8 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rubricItem: { marginBottom: 16 },
  rubricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pointsRow: { flexDirection: 'row', gap: 8 },
  pointButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  applyButton: { marginTop: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreInput: { flex: 1 },
  percentageBox: {
    width: 80,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressBar: { height: 8, borderRadius: 4, marginTop: 16 },
  quickScores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  quickFeedback: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  feedbackChip: { marginBottom: 4 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 16,
  },
  bottomSummary: { flex: 1 },
  submitButton: { borderRadius: 8 },
});
```


### 6.9 Sprint 5 Checkpoint

**Test Criteria:**
- [ ] Grading hub shows pending submissions
- [ ] Can create new assignment with all fields
- [ ] Assignment type selection works correctly
- [ ] Class selector populates with teacher's classes
- [ ] Due date picker works correctly
- [ ] Rubric builder adds/removes criteria
- [ ] Can grade individual submission
- [ ] Rubric scoring calculates correctly
- [ ] Quick score buttons work
- [ ] Score and feedback save correctly
- [ ] Grading stats update after grading
- [ ] Recently graded shows latest grades


---

## 7. SPRINT 6: STUDENT DETAIL + ANALYTICS

### 7.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `student-detail-teacher` | 🔲 |
| Dynamic Screen | `analytics-home` | 🔲 |
| Widget | `analytics.class-performance` | 🔲 |
| Widget | `analytics.student-comparison` | 🔲 |
| Widget | `analytics.trends` | 🔲 |
| Hook | `useStudentProgressQuery` | 🔲 |
| Hook | `useTeacherAnalyticsQuery` | 🔲 |
| Hook | `useClassAnalyticsQuery` | 🔲 |


### 7.2 ClassPerformanceWidget.tsx

```typescript
// src/components/widgets/teacher/ClassPerformanceWidget.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { useClassAnalyticsQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const ClassPerformanceWidget: React.FC<TeacherWidgetProps> = ({ config, classId }) => {
  const theme = useAppTheme();
  const [period, setPeriod] = React.useState('month');
  const { data: analytics, isLoading } = useClassAnalyticsQuery(classId, period);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: () => theme.colors.onSurface,
    style: { borderRadius: 16 },
  };

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <WidgetContainer title="Class Performance" isLoading={isLoading}>
      <SegmentedButtons
        value={period}
        onValueChange={setPeriod}
        buttons={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'term', label: 'Term' },
        ]}
        style={styles.segmentedButtons}
      />

      {analytics?.trendData && (
        <LineChart
          data={{
            labels: analytics.trendData.labels,
            datasets: [{ data: analytics.trendData.values }],
          }}
          width={screenWidth}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      )}

      <View style={styles.summaryRow}>
        <Surface style={styles.summaryCard} elevation={0}>
          <Text variant="headlineSmall" style={{ color: '#4CAF50' }}>{analytics?.avgScore || 0}%</Text>
          <Text variant="labelSmall">Avg Score</Text>
        </Surface>
        <Surface style={styles.summaryCard} elevation={0}>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>{analytics?.improvement || 0}%</Text>
          <Text variant="labelSmall">Improvement</Text>
        </Surface>
        <Surface style={styles.summaryCard} elevation={0}>
          <Text variant="headlineSmall" style={{ color: '#FF9800' }}>{analytics?.atRisk || 0}</Text>
          <Text variant="labelSmall">At Risk</Text>
        </Surface>
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  segmentedButtons: { marginBottom: 16 },
  chart: { borderRadius: 16, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryCard: { flex: 1, padding: 12, marginHorizontal: 4, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
});
```


### 7.3 StudentComparisonWidget.tsx

```typescript
// src/components/widgets/teacher/StudentComparisonWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, ProgressBar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type StudentRanking = {
  id: string;
  name: string;
  rank: number;
  score: number;
  trend: 'up' | 'down' | 'same';
  change: number;
};

export const StudentComparisonWidget: React.FC<TeacherWidgetProps> = ({ config, classId, onNavigate }) => {
  const theme = useAppTheme();

  const rankings: StudentRanking[] = [
    { id: '1', name: 'Priya M.', rank: 1, score: 94, trend: 'up', change: 2 },
    { id: '2', name: 'Rahul S.', rank: 2, score: 91, trend: 'same', change: 0 },
    { id: '3', name: 'Sneha R.', rank: 3, score: 88, trend: 'up', change: 1 },
    { id: '4', name: 'Amit K.', rank: 4, score: 85, trend: 'down', change: -2 },
    { id: '5', name: 'Neha P.', rank: 5, score: 82, trend: 'up', change: 3 },
  ];

  const trendIcons = { up: 'trending-up', down: 'trending-down', same: 'minus' };
  const trendColors = { up: '#4CAF50', down: theme.colors.error, same: theme.colors.outline };

  const renderStudent = ({ item }: { item: StudentRanking }) => (
    <View style={styles.studentRow}>
      <Text variant="titleMedium" style={styles.rank}>#{item.rank}</Text>
      <Avatar.Text size={36} label={item.name.substring(0, 2).toUpperCase()} />
      <View style={styles.studentInfo}>
        <Text variant="titleSmall">{item.name}</Text>
        <ProgressBar progress={item.score / 100} color={theme.colors.primary} style={styles.progressBar} />
      </View>
      <View style={styles.scoreSection}>
        <Text variant="titleMedium">{item.score}%</Text>
        <View style={styles.trendRow}>
          <Icon name={trendIcons[item.trend]} size={14} color={trendColors[item.trend]} />
          {item.change !== 0 && (
            <Text variant="labelSmall" style={{ color: trendColors[item.trend] }}>
              {item.change > 0 ? '+' : ''}{item.change}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <WidgetContainer
      title="Top Performers"
      action={<Chip compact icon="trophy">Leaderboard</Chip>}
    >
      <FlatList
        data={rankings.slice(0, config?.maxItems || 5)}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rank: { width: 30 },
  studentInfo: { flex: 1 },
  progressBar: { height: 6, borderRadius: 3, marginTop: 4 },
  scoreSection: { alignItems: 'flex-end' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
```


### 7.4 PerformanceTrendsWidget.tsx

```typescript
// src/components/widgets/teacher/PerformanceTrendsWidget.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

export const PerformanceTrendsWidget: React.FC<TeacherWidgetProps> = ({ config, classId }) => {
  const theme = useAppTheme();
  const screenWidth = Dimensions.get('window').width - 64;

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [72, 75, 73, 78, 82, 85], color: () => '#4CAF50', strokeWidth: 2 },
      { data: [68, 70, 72, 74, 76, 78], color: () => '#2196F3', strokeWidth: 2 },
    ],
    legend: ['Class Avg', 'School Avg'],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: () => theme.colors.onSurface,
    propsForDots: { r: '4', strokeWidth: '2' },
  };

  return (
    <WidgetContainer title="Performance Trends">
      <View style={styles.legendRow}>
        <Chip compact style={{ backgroundColor: '#4CAF5020' }} textStyle={{ color: '#4CAF50' }}>Class Avg</Chip>
        <Chip compact style={{ backgroundColor: '#2196F320' }} textStyle={{ color: '#2196F3' }}>School Avg</Chip>
      </View>

      <LineChart
        data={trendData}
        width={screenWidth}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
      />

      <View style={styles.insightRow}>
        <Text variant="bodySmall" style={styles.insight}>
          📈 Class performance improved by 13% over 6 months
        </Text>
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  legendRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chart: { borderRadius: 16, marginVertical: 8 },
  insightRow: { marginTop: 8 },
  insight: { opacity: 0.7 },
});
```

### 7.5 useClassAnalyticsQuery Hook

```typescript
// src/hooks/queries/teacher/useClassAnalyticsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useClassAnalyticsQuery = (classId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['class', 'analytics', classId, period],
    queryFn: async () => {
      // Get submissions for the class
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('percentage, graded_at')
        .eq('status', 'graded')
        .in('assignment_id',
          supabase.from('assignments').select('id').eq('class_id', classId)
        )
        .order('graded_at', { ascending: true });

      // Calculate average score
      const avgScore = submissions?.length
        ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
        : 0;

      // Generate trend data (simplified)
      const labels = period === 'week' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        : ['W1', 'W2', 'W3', 'W4'];
      const values = labels.map(() => Math.floor(Math.random() * 20) + 70);

      // Get at-risk count
      const { count: atRisk } = await supabase
        .from('attendance_alerts')
        .select('id', { count: 'exact' })
        .eq('class_id', classId)
        .eq('is_resolved', false);

      return {
        avgScore,
        improvement: 5, // Placeholder
        atRisk: atRisk || 0,
        trendData: { labels, values },
      };
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!classId,
  });
};
```

### 7.6 StudentDetailTeacherScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/StudentDetailTeacherScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import {
  Text,
  Avatar,
  Surface,
  Chip,
  Button,
  Divider,
  ProgressBar,
  FAB,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useStudentDetailQuery, useStudentProgressQuery } from '@/hooks/queries/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';

type QuickAction = {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: () => void;
};

export const StudentDetailTeacherScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  const { studentId } = route.params as { studentId: string };

  // === DATA ===
  const { data: student, isLoading } = useStudentDetailQuery(studentId);
  const { data: progress } = useStudentProgressQuery(studentId);

  // === STATE ===
  const [showActions, setShowActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance'>('overview');

  // === QUICK ACTIONS ===
  const quickActions: QuickAction[] = [
    {
      id: 'message',
      icon: 'message-text',
      label: 'Send Message',
      color: theme.colors.primary,
      action: () => navigation.navigate('compose-message' as never, { recipientId: studentId } as never),
    },
    {
      id: 'call-parent',
      icon: 'phone',
      label: 'Call Parent',
      color: '#4CAF50',
      action: () => student?.parentPhone && Linking.openURL(`tel:${student.parentPhone}`),
    },
    {
      id: 'add-note',
      icon: 'note-plus',
      label: 'Add Note',
      color: '#FF9800',
      action: () => navigation.navigate('add-student-note' as never, { studentId } as never),
    },
    {
      id: 'flag-risk',
      icon: 'flag',
      label: 'Flag At-Risk',
      color: theme.colors.error,
      action: () => navigation.navigate('flag-student' as never, { studentId } as never),
    },
  ];

  // === CHART CONFIG ===
  const screenWidth = Dimensions.get('window').width - 48;
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: () => theme.colors.onSurface,
    style: { borderRadius: 16 },
  };

  // === STATUS HELPERS ===
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#2196F3';
      case 'needs-attention': return '#FF9800';
      case 'at-risk': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 75) return '#FF9800';
    return theme.colors.error;
  };

  // === LOADING ===
  if (isLoading || !student) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text>Loading student details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Avatar.Image
            size={80}
            source={{ uri: student.avatarUrl }}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.studentName}>{student.name}</Text>
          <View style={styles.badgeRow}>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: getStatusColor(student.status) }]}
              textStyle={styles.statusText}
            >
              {student.status.replace('-', ' ').toUpperCase()}
            </Chip>
            <Text style={styles.classText}>Class {student.class} - Roll #{student.rollNumber}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="percent" size={24} color={theme.colors.primary} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            {student.avgScore}%
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Avg Score
          </Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="calendar-check" size={24} color={getAttendanceColor(student.attendanceRate)} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            {student.attendanceRate}%
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Attendance
          </Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="trophy" size={24} color="#FF9800" />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            #{student.rank}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Class Rank
          </Text>
        </Surface>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['overview', 'grades', 'attendance'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              variant="labelLarge"
              style={{ color: activeTab === tab ? theme.colors.primary : theme.colors.onSurfaceVariant }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <>
            {/* Performance Trend */}
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Performance Trend</Text>
              {progress?.trendData && (
                <LineChart
                  data={{
                    labels: progress.trendData.labels,
                    datasets: [{ data: progress.trendData.values }],
                  }}
                  width={screenWidth}
                  height={160}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              )}
            </Surface>

            {/* Subject Breakdown */}
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Subject Performance</Text>
              {student.subjects?.map((subject: any) => (
                <View key={subject.id} style={styles.subjectRow}>
                  <View style={styles.subjectInfo}>
                    <Text variant="bodyMedium">{subject.name}</Text>
                    <ProgressBar
                      progress={subject.score / 100}
                      color={getStatusColor(subject.score >= 75 ? 'good' : 'needs-attention')}
                      style={styles.subjectProgress}
                    />
                  </View>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                    {subject.score}%
                  </Text>
                </View>
              ))}
            </Surface>

            {/* Recent Activity */}
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
              {student.recentActivity?.map((activity: any, idx: number) => (
                <View key={idx} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Icon name={activity.icon} size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text variant="bodyMedium">{activity.description}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {activity.date}
                    </Text>
                  </View>
                </View>
              ))}
            </Surface>

            {/* Parent Info */}
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Parent/Guardian</Text>
              <View style={styles.parentRow}>
                <Avatar.Icon size={48} icon="account" />
                <View style={styles.parentInfo}>
                  <Text variant="titleSmall">{student.parentName}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {student.parentRelation}
                  </Text>
                </View>
                <View style={styles.parentActions}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: `${theme.colors.primary}15` }]}
                    onPress={() => Linking.openURL(`tel:${student.parentPhone}`)}
                  >
                    <Icon name="phone" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: `${theme.colors.primary}15` }]}
                    onPress={() => Linking.openURL(`mailto:${student.parentEmail}`)}
                  >
                    <Icon name="email" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Surface>
          </>
        )}

        {activeTab === 'grades' && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Assignment Grades</Text>
            {student.grades?.map((grade: any) => (
              <TouchableOpacity
                key={grade.id}
                style={styles.gradeItem}
                onPress={() => navigation.navigate('submission-detail' as never, { submissionId: grade.submissionId } as never)}
              >
                <View style={styles.gradeInfo}>
                  <Text variant="bodyMedium">{grade.assignmentTitle}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {grade.subject} - {grade.date}
                  </Text>
                </View>
                <View style={styles.gradeScore}>
                  <Text
                    variant="titleMedium"
                    style={{ color: getStatusColor(grade.score >= 75 ? 'good' : 'needs-attention') }}
                  >
                    {grade.score}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Surface>
        )}

        {activeTab === 'attendance' && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.attendanceSummary}>
              <View style={styles.attendanceStat}>
                <Text variant="headlineMedium" style={{ color: '#4CAF50' }}>{student.presentDays}</Text>
                <Text variant="labelSmall">Present</Text>
              </View>
              <View style={styles.attendanceStat}>
                <Text variant="headlineMedium" style={{ color: theme.colors.error }}>{student.absentDays}</Text>
                <Text variant="labelSmall">Absent</Text>
              </View>
              <View style={styles.attendanceStat}>
                <Text variant="headlineMedium" style={{ color: '#FF9800' }}>{student.lateDays}</Text>
                <Text variant="labelSmall">Late</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Absences</Text>
            {student.absences?.map((absence: any, idx: number) => (
              <View key={idx} style={styles.absenceItem}>
                <Icon name="calendar-remove" size={20} color={theme.colors.error} />
                <View style={styles.absenceInfo}>
                  <Text variant="bodyMedium">{absence.date}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {absence.reason || 'No reason provided'}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* Spacer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB for Quick Actions */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowActions(true)}
      />

      {/* Quick Actions Modal */}
      <Portal>
        <Modal
          visible={showActions}
          onDismiss={() => setShowActions(false)}
          contentContainerStyle={[styles.actionsModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                action.action();
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text variant="bodyLarge">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { marginBottom: 16 },
  headerContent: { alignItems: 'center' },
  avatar: { marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  studentName: { color: 'white', fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  statusChip: { borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  classText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -40 },
  statCard: { flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 12, alignItems: 'center', gap: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 16 },
  chart: { borderRadius: 12, marginHorizontal: -8 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subjectInfo: { flex: 1, marginRight: 16 },
  subjectProgress: { height: 6, borderRadius: 3, marginTop: 4 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityInfo: { flex: 1 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parentInfo: { flex: 1 },
  parentActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gradeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  gradeInfo: { flex: 1 },
  gradeScore: { marginLeft: 16 },
  attendanceSummary: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  attendanceStat: { alignItems: 'center' },
  divider: { marginVertical: 16 },
  absenceItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  absenceInfo: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  actionsModal: { margin: 20, borderRadius: 12, padding: 16 },
  modalTitle: { marginBottom: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
```


### 7.7 Sprint 6 Checkpoint

**Test Criteria:**
- [ ] Student detail shows complete profile
- [ ] Student avatar and name display correctly
- [ ] Status chip shows correct status color
- [ ] Stats row shows avg score, attendance, rank
- [ ] Tab switching works (Overview/Grades/Attendance)
- [ ] Performance trend chart renders
- [ ] Subject breakdown shows progress bars
- [ ] Parent contact buttons work (call/email)
- [ ] Quick actions FAB opens modal
- [ ] Analytics home loads with all widgets
- [ ] Class performance chart renders correctly
- [ ] Period selector changes data
- [ ] Student comparison shows rankings
- [ ] Trends widget shows historical data
- [ ] At-risk count is accurate


---

## 8. SPRINT 7: COMMUNICATION

### 8.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `communication-hub` | 🔲 |
| Widget | `teacher.messages-inbox` | 🔲 |
| Widget | `teacher.announcements` | 🔲 |
| Widget | `teacher.parent-contacts` | 🔲 |
| Hook | `useTeacherMessagesQuery` | 🔲 |
| Hook | `useSendMessage` | 🔲 |


### 8.2 MessagesInboxWidget.tsx

```typescript
// src/components/widgets/teacher/MessagesInboxWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Badge, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherMessagesQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: string;
  senderName: string;
  senderRole: 'parent' | 'student' | 'admin';
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  studentName?: string;
};

export const MessagesInboxWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: messages, isLoading } = useTeacherMessagesQuery({ limit: config?.maxItems || 5 });

  const roleIcons = { parent: 'account-child', student: 'school', admin: 'shield-account' };
  const roleColors = { parent: '#9C27B0', student: theme.colors.primary, admin: '#FF9800' };

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.messageItem, !item.isRead && styles.unreadItem]}
      onPress={() => onNavigate?.('message-detail', { messageId: item.id })}
    >
      <View style={styles.avatarContainer}>
        <Avatar.Text size={44} label={item.senderName.substring(0, 2).toUpperCase()} />
        <View style={[styles.roleBadge, { backgroundColor: roleColors[item.senderRole] }]}>
          <Icon name={roleIcons[item.senderRole]} size={12} color="white" />
        </View>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.headerRow}>
          <Text variant="titleSmall" style={!item.isRead && styles.unreadText}>{item.senderName}</Text>
          <Text variant="labelSmall" style={styles.timestamp}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </Text>
        </View>
        {item.studentName && (
          <Text variant="labelSmall" style={styles.studentName}>Re: {item.studentName}</Text>
        )}
        <Text variant="bodySmall" style={styles.preview} numberOfLines={1}>{item.preview}</Text>
      </View>
      {!item.isRead && <Badge size={8} style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = messages?.filter(m => !m.isRead).length || 0;

  return (
    <WidgetContainer
      title="Messages"
      isLoading={isLoading}
      action={unreadCount > 0 && <Badge>{unreadCount}</Badge>}
    >
      <FlatList
        data={messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="email-outline" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No messages</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  messageItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  unreadItem: { backgroundColor: 'rgba(33, 150, 243, 0.05)' },
  avatarContainer: { position: 'relative' },
  roleBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  messageContent: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadText: { fontWeight: 'bold' },
  timestamp: { opacity: 0.5 },
  studentName: { opacity: 0.6, marginTop: 2 },
  preview: { opacity: 0.7, marginTop: 4 },
  unreadDot: { backgroundColor: '#2196F3' },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```


### 8.3 AnnouncementsWidget.tsx

```typescript
// src/components/widgets/teacher/AnnouncementsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Chip, IconButton, Divider, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { format } from 'date-fns';

type Announcement = {
  id: string;
  title: string;
  targetClass: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  viewCount: number;
};

export const AnnouncementsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  const announcements: Announcement[] = [
    { id: '1', title: 'Parent-Teacher Meeting', targetClass: 'Class 10-A', priority: 'high', publishedAt: new Date().toISOString(), viewCount: 24 },
    { id: '2', title: 'Holiday Notice', targetClass: 'All Classes', priority: 'normal', publishedAt: new Date(Date.now() - 86400000).toISOString(), viewCount: 45 },
    { id: '3', title: 'Exam Schedule Released', targetClass: 'Class 10-A, 10-B', priority: 'urgent', publishedAt: new Date(Date.now() - 172800000).toISOString(), viewCount: 38 },
  ];

  const priorityColors = { low: theme.colors.outline, normal: theme.colors.primary, high: '#FF9800', urgent: theme.colors.error };

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={styles.announcementItem}
      onPress={() => onNavigate?.('announcement-detail', { announcementId: item.id })}
    >
      <View style={[styles.priorityBar, { backgroundColor: priorityColors[item.priority] }]} />
      <View style={styles.announcementContent}>
        <Text variant="titleSmall" numberOfLines={1}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Chip compact icon="account-group" style={styles.targetChip}>{item.targetClass}</Chip>
          <Text variant="labelSmall" style={styles.date}>
            {format(new Date(item.publishedAt), 'MMM d')}
          </Text>
        </View>
      </View>
      <View style={styles.viewCount}>
        <Icon name="eye" size={14} color={theme.colors.outline} />
        <Text variant="labelSmall" style={styles.countText}>{item.viewCount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="My Announcements"
      action={
        <IconButton icon="plus" size={20} onPress={() => onNavigate?.('announcement-create')} />
      }
    >
      <FlatList
        data={announcements.slice(0, config?.maxItems || 5)}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  announcementItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  priorityBar: { width: 4, height: 40, borderRadius: 2 },
  announcementContent: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  targetChip: { height: 24 },
  date: { opacity: 0.5 },
  viewCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { opacity: 0.5 },
});
```


### 8.4 ParentContactsWidget.tsx

```typescript
// src/components/widgets/teacher/ParentContactsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Text, Avatar, IconButton, Divider, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type ParentContact = {
  id: string;
  parentName: string;
  studentName: string;
  className: string;
  phone: string;
  email: string;
  lastContact?: string;
};

export const ParentContactsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const contacts: ParentContact[] = [
    { id: '1', parentName: 'Mrs. Sharma', studentName: 'Rahul S.', className: '10-A', phone: '+91 98765 43210', email: 'sharma@email.com', lastContact: '2 days ago' },
    { id: '2', parentName: 'Mr. Patel', studentName: 'Priya P.', className: '10-A', phone: '+91 98765 43211', email: 'patel@email.com' },
    { id: '3', parentName: 'Mrs. Kumar', studentName: 'Amit K.', className: '10-B', phone: '+91 98765 43212', email: 'kumar@email.com', lastContact: '1 week ago' },
  ];

  const filteredContacts = contacts.filter(c =>
    c.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (parentId: string) => {
    onNavigate?.('compose-message', { recipientId: parentId, recipientType: 'parent' });
  };

  const renderContact = ({ item }: { item: ParentContact }) => (
    <View style={styles.contactItem}>
      <Avatar.Text size={44} label={item.parentName.substring(0, 2).toUpperCase()} />
      <View style={styles.contactInfo}>
        <Text variant="titleSmall">{item.parentName}</Text>
        <Text variant="bodySmall" style={styles.studentInfo}>Parent of {item.studentName} ({item.className})</Text>
        {item.lastContact && (
          <Text variant="labelSmall" style={styles.lastContact}>Last contact: {item.lastContact}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <IconButton icon="phone" size={20} onPress={() => handleCall(item.phone)} />
        <IconButton icon="message" size={20} onPress={() => handleMessage(item.id)} />
      </View>
    </View>
  );

  return (
    <WidgetContainer title="Parent Contacts">
      {config?.showSearch && (
        <Searchbar
          placeholder="Search parents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      )}
      <FlatList
        data={filteredContacts.slice(0, config?.maxItems || 5)}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  searchBar: { marginBottom: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  contactInfo: { flex: 1 },
  studentInfo: { opacity: 0.7, marginTop: 2 },
  lastContact: { opacity: 0.5, marginTop: 2 },
  actions: { flexDirection: 'row' },
});
```

### 8.5 useSendMessage Hook

```typescript
// src/hooks/mutations/teacher/useSendMessage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type MessageData = {
  recipientId: string;
  recipientRole: 'parent' | 'student' | 'admin';
  subject?: string;
  content: string;
  relatedStudentId?: string;
  attachments?: string[];
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: MessageData) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { data: message, error } = await supabase
        .from('teacher_messages')
        .insert({
          customer_id: teacher.customer_id,
          sender_id: teacher.id,
          sender_role: 'teacher',
          recipient_id: data.recipientId,
          recipient_role: data.recipientRole,
          subject: data.subject,
          content: data.content,
          related_student_id: data.relatedStudentId,
          attachments: data.attachments || [],
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'messages'] });
    },
  });
};
```

### 8.6 Sprint 7 Checkpoint

✅ **Test Criteria:**
- [ ] Communication hub loads with all widgets
- [ ] Messages inbox shows recent messages
- [ ] Unread messages are highlighted
- [ ] Can compose and send new message
- [ ] Announcements list shows teacher's announcements
- [ ] Can create new announcement
- [ ] Parent contacts show phone and message options
- [ ] Call button opens phone dialer


---

## 9. SPRINT 8: PROFILE + POLISH

### 9.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `profile-teacher` | 🔲 |
| Dynamic Screen | `notifications-teacher` | 🔲 |
| Widget | `teacher.profile-card` | 🔲 |
| Widget | `teacher.profile-stats` | 🔲 |
| Polish | Error states for all widgets | 🔲 |
| Polish | Loading skeletons | 🔲 |
| Polish | Empty states | 🔲 |


### 9.2 ProfileTeacherScreen.tsx

```typescript
// src/screens/teacher/ProfileTeacherScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Avatar, Surface, Button, List, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useBranding } from '@/context/BrandingContext';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherDashboardQuery } from '@/hooks/queries/teacher';

export const ProfileTeacherScreen: React.FC = ({ navigation }) => {
  const theme = useAppTheme();
  const { branding } = useBranding();
  const { user, signOut } = useAuthStore();
  const { data } = useTeacherDashboardQuery();

  const menuItems = [
    { icon: 'account-edit', title: 'Edit Profile', route: 'edit-profile' },
    { icon: 'bell-outline', title: 'Notifications', route: 'notifications-teacher' },
    { icon: 'cog-outline', title: 'Settings', route: 'settings-teacher' },
    { icon: 'help-circle-outline', title: 'Help & Support', route: 'help-support' },
    { icon: 'information-outline', title: 'About', route: 'about' },
  ];

  const stats = [
    { label: 'Classes', value: data?.totalClasses || 0 },
    { label: 'Students', value: data?.totalStudents || 0 },
    { label: 'Assignments', value: 24 },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.profileCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
        <Avatar.Text
          size={80}
          label={data?.teacherName?.substring(0, 2).toUpperCase() || 'T'}
          style={{ backgroundColor: theme.colors.primary }}
        />
        <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onPrimaryContainer }]}>
          {data?.teacherName || 'Teacher'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
          {user?.email}
        </Text>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {stat.value}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Surface>

      <Surface style={styles.menuCard} elevation={1}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.route}>
            <List.Item
              title={item.title}
              left={(props) => <List.Icon {...props} icon={item.icon} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate(item.route)}
            />
            {index < menuItems.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Surface>

      <Button
        mode="outlined"
        icon="logout"
        onPress={signOut}
        style={styles.logoutButton}
        textColor={theme.colors.error}
      >
        Sign Out
      </Button>

      <Text variant="labelSmall" style={styles.version}>
        {branding?.appName || 'EduPlatform'} v1.0.0
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { padding: 24, alignItems: 'center', margin: 16, borderRadius: 16 },
  name: { marginTop: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  statItem: { alignItems: 'center' },
  menuCard: { margin: 16, borderRadius: 12, overflow: 'hidden' },
  logoutButton: { margin: 16, borderColor: 'transparent' },
  version: { textAlign: 'center', opacity: 0.5, marginBottom: 24 },
});
```


### 9.3 NotificationsTeacherScreen.tsx

```typescript
// src/screens/teacher/NotificationsTeacherScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Chip, Divider, IconButton, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  type: 'submission' | 'attendance' | 'message' | 'system';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  actionParams?: Record<string, any>;
};

export const NotificationsTeacherScreen: React.FC = ({ navigation }) => {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<string>('all');

  const notifications: Notification[] = [
    { id: '1', type: 'submission', title: 'New Submission', body: 'Rahul S. submitted Math Homework', timestamp: new Date().toISOString(), isRead: false, actionRoute: 'submission-detail' },
    { id: '2', type: 'attendance', title: 'Attendance Alert', body: 'Priya M. has low attendance (58%)', timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: false, actionRoute: 'student-detail-teacher' },
    { id: '3', type: 'message', title: 'New Message', body: 'Mrs. Sharma sent you a message', timestamp: new Date(Date.now() - 7200000).toISOString(), isRead: true, actionRoute: 'message-detail' },
    { id: '4', type: 'system', title: 'System Update', body: 'New features available in grading', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: true },
  ];

  const typeConfig = {
    submission: { icon: 'file-document', color: theme.colors.primary },
    attendance: { icon: 'calendar-alert', color: '#FF9800' },
    message: { icon: 'message', color: '#9C27B0' },
    system: { icon: 'information', color: theme.colors.outline },
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = typeConfig[item.type];
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => item.actionRoute && navigation.navigate(item.actionRoute, item.actionParams)}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Icon name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.content}>
          <Text variant="titleSmall" style={!item.isRead && styles.unreadText}>{item.title}</Text>
          <Text variant="bodySmall" style={styles.body}>{item.body}</Text>
          <Text variant="labelSmall" style={styles.timestamp}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        {['all', 'submission', 'attendance', 'message'].map(f => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.filterChip}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={64} color={theme.colors.outline} />
            <Text variant="bodyLarge" style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: 'row', padding: 16, gap: 8 },
  filterChip: { marginRight: 4 },
  listContent: { paddingBottom: 24 },
  notificationItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  unreadItem: { backgroundColor: 'rgba(33, 150, 243, 0.05)' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  unreadText: { fontWeight: 'bold' },
  body: { opacity: 0.7, marginTop: 2 },
  timestamp: { opacity: 0.5, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3' },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyText: { marginTop: 16, opacity: 0.6 },
});
```

### 9.4 Sprint 8 Checkpoint

✅ **Test Criteria:**
- [ ] Profile screen shows teacher info and stats
- [ ] Menu items navigate correctly
- [ ] Sign out works and clears session
- [ ] Notifications screen loads with filters
- [ ] Filter chips work correctly
- [ ] Tapping notification navigates to detail
- [ ] Unread notifications are highlighted
- [ ] All widgets have proper loading states
- [ ] All widgets have proper empty states
- [ ] All widgets have proper error states


---

## 10. SPRINT 9: DEMO SHOWCASE FEATURES

> **Purpose:** High-impact features for demo to coaching heads, school institutes, and teachers for funding pitch. These features showcase AI capabilities and modern teaching workflow innovation.

### 10.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `doubts-inbox` | 🔲 |
| Dynamic Screen | `teacher-calendar` | 🔲 |
| Dynamic Screen | `leave-history` | 🔲 |
| Fixed Screen | `doubt-answer` | 🔲 |
| Fixed Screen | `leave-request-create` | 🔲 |
| Fixed Screen | `calendar-event-create` | 🔲 |
| Fixed Screen | `substitute-finder` | 🔲 |
| Widget | `teacher.doubts-inbox` | 🔲 |
| Widget | `teacher.doubt-detail` | 🔲 |
| Widget | `teacher.calendar` | 🔲 |
| Widget | `teacher.calendar-events` | 🔲 |
| Widget | `teacher.substitute-manager` | DONE (combined substitute-request + available-substitutes) |
| Widget | `teacher.leave-request` | DONE |
| Widget | `teacher.ai-insights` | DONE |
| Hook | `useDoubtsInboxQuery` | DONE (as `useTeacherDoubtsQuery`) |
| Hook | `useTeacherCalendarQuery` | DONE |
| Hook | `useAvailableSubstitutesQuery` | DONE (as `useSubstituteQuery`) |
| Hook | `useLeaveRequestsQuery` | DONE (as `useLeaveRequestQuery`) |
| Hook | `useAnswerDoubt` | DONE |
| Hook | `useRequestSubstitute` | DONE |
| Hook | `useCreateLeaveRequest` | DONE |
| DB Table | `teacher_doubts` | DONE (renamed from student_doubts) |
| DB Table | `teacher_leave_requests` | DONE (renamed from teacher_leaves) |
| DB Table | `substitute_requests` | DONE |
| DB Table | `teacher_calendar_events` | DONE (renamed from calendar_events) |
| DB Table | `teacher_ai_insights` | DONE |

---

### 10.2 DoubtsInboxWidget.tsx

```typescript
// src/components/widgets/teacher/DoubtsInboxWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Badge, Divider, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useDoubtsInboxQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Doubt = {
  id: string;
  studentName: string;
  studentAvatar?: string;
  className: string;
  subject: string;
  question: string;
  attachmentUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'answered';
  createdAt: string;
  aiSuggestion?: string;
};

export const DoubtsInboxWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: doubts, isLoading } = useDoubtsInboxQuery({ limit: config?.maxItems || 5 });

  const priorityColors = {
    low: theme.colors.outline,
    normal: theme.colors.primary,
    high: '#FF9800',
    urgent: theme.colors.error,
  };

  const statusIcons = {
    pending: 'clock-outline',
    in_progress: 'progress-clock',
    answered: 'check-circle',
  };

  const renderDoubt = ({ item }: { item: Doubt }) => (
    <TouchableOpacity
      style={styles.doubtItem}
      onPress={() => onNavigate?.('doubt-detail', { doubtId: item.id })}
    >
      <View style={[styles.priorityBar, { backgroundColor: priorityColors[item.priority] }]} />
      <Avatar.Text
        size={40}
        label={item.studentName.substring(0, 2).toUpperCase()}
        style={{ backgroundColor: theme.colors.primaryContainer }}
      />
      <View style={styles.doubtContent}>
        <View style={styles.headerRow}>
          <Text variant="titleSmall" numberOfLines={1}>{item.studentName}</Text>
          <Chip compact style={styles.subjectChip}>{item.subject}</Chip>
        </View>
        <Text variant="bodySmall" style={styles.question} numberOfLines={2}>
          {item.question}
        </Text>
        <View style={styles.metaRow}>
          <Text variant="labelSmall" style={styles.className}>{item.className}</Text>
          <Text variant="labelSmall" style={styles.timestamp}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
        {item.aiSuggestion && (
          <View style={[styles.aiSuggestionBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Icon name="robot" size={12} color={theme.colors.primary} />
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>AI suggestion available</Text>
          </View>
        )}
      </View>
      <Icon name={statusIcons[item.status]} size={20} color={priorityColors[item.priority]} />
    </TouchableOpacity>
  );

  const pendingCount = doubts?.filter(d => d.status === 'pending').length || 0;

  return (
    <WidgetContainer
      title="Student Doubts"
      isLoading={isLoading}
      action={pendingCount > 0 && <Badge style={{ backgroundColor: theme.colors.error }}>{pendingCount}</Badge>}
    >
      <FlatList
        data={doubts || []}
        renderItem={renderDoubt}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat-question-outline" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No pending doubts</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  doubtItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  priorityBar: { width: 4, height: '100%', borderRadius: 2, minHeight: 60 },
  doubtContent: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subjectChip: { height: 22 },
  question: { opacity: 0.8, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  className: { opacity: 0.6 },
  timestamp: { opacity: 0.5 },
  aiSuggestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```


### 10.3 DoubtDetailWidget.tsx

```typescript
// src/components/widgets/teacher/DoubtDetailWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Avatar, Surface, TextInput, Button, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAnswerDoubt } from '@/hooks/mutations/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type DoubtDetail = {
  id: string;
  studentName: string;
  className: string;
  subject: string;
  topic: string;
  question: string;
  attachmentUrl?: string;
  createdAt: string;
  aiSuggestion?: {
    answer: string;
    confidence: number;
    sources: string[];
  };
};

export const DoubtDetailWidget: React.FC<TeacherWidgetProps & { doubt: DoubtDetail }> = ({ doubt, onNavigate }) => {
  const theme = useAppTheme();
  const [answer, setAnswer] = useState('');
  const [useAiSuggestion, setUseAiSuggestion] = useState(false);
  const { mutate: submitAnswer, isPending } = useAnswerDoubt();

  const handleUseAiSuggestion = () => {
    if (doubt.aiSuggestion) {
      setAnswer(doubt.aiSuggestion.answer);
      setUseAiSuggestion(true);
    }
  };

  const handleSubmit = () => {
    submitAnswer({
      doubtId: doubt.id,
      answer,
      usedAiSuggestion: useAiSuggestion,
    }, {
      onSuccess: () => onNavigate?.('doubts-inbox'),
    });
  };

  return (
    <WidgetContainer title="Answer Doubt">
      <ScrollView style={styles.container}>
        {/* Student Info */}
        <View style={styles.studentRow}>
          <Avatar.Text size={48} label={doubt.studentName.substring(0, 2).toUpperCase()} />
          <View style={styles.studentInfo}>
            <Text variant="titleMedium">{doubt.studentName}</Text>
            <View style={styles.metaRow}>
              <Chip compact icon="school">{doubt.className}</Chip>
              <Chip compact icon="book">{doubt.subject}</Chip>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Question */}
        <View style={styles.questionSection}>
          <Text variant="labelMedium" style={styles.sectionLabel}>Question</Text>
          <Surface style={styles.questionCard} elevation={0}>
            <Text variant="titleSmall">{doubt.topic}</Text>
            <Text variant="bodyMedium" style={styles.questionText}>{doubt.question}</Text>
            {doubt.attachmentUrl && (
              <Image source={{ uri: doubt.attachmentUrl }} style={styles.attachment} />
            )}
          </Surface>
        </View>

        {/* AI Suggestion */}
        {doubt.aiSuggestion && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <Icon name="robot" size={20} color={theme.colors.primary} />
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>AI Suggested Answer</Text>
              </View>
              <Chip compact style={[styles.confidenceChip, { backgroundColor: `${theme.colors.primary}15` }]}>
                {Math.round(doubt.aiSuggestion.confidence * 100)}% confident
              </Chip>
            </View>
            <Surface style={[styles.aiCard, { backgroundColor: `${theme.colors.primary}08` }]} elevation={0}>
              <Text variant="bodyMedium">{doubt.aiSuggestion.answer}</Text>
              <View style={styles.sourcesRow}>
                <Text variant="labelSmall" style={styles.sourcesLabel}>Sources:</Text>
                {doubt.aiSuggestion.sources.map((source, idx) => (
                  <Chip key={idx} compact style={styles.sourceChip}>{source}</Chip>
                ))}
              </View>
            </Surface>
            <Button
              mode="outlined"
              icon="content-copy"
              onPress={handleUseAiSuggestion}
              style={styles.useAiButton}
            >
              Use AI Suggestion
            </Button>
          </View>
        )}

        {/* Answer Input */}
        <View style={styles.answerSection}>
          <Text variant="labelMedium" style={styles.sectionLabel}>Your Answer</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your answer here..."
            style={styles.answerInput}
          />
          {useAiSuggestion && (
            <View style={styles.aiUsedBadge}>
              <Icon name="robot" size={14} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Based on AI suggestion</Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isPending}
          disabled={!answer.trim() || isPending}
          style={styles.submitButton}
        >
          Send Answer
        </Button>
      </ScrollView>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  divider: { marginVertical: 16 },
  questionSection: { marginBottom: 16 },
  sectionLabel: { marginBottom: 8, opacity: 0.7 },
  questionCard: { padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  questionText: { marginTop: 8, lineHeight: 22 },
  attachment: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  aiSection: { marginBottom: 16 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceChip: { height: 24 },
  aiCard: { padding: 16, borderRadius: 12 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  sourcesLabel: { opacity: 0.6 },
  sourceChip: { height: 22 },
  useAiButton: { marginTop: 12 },
  answerSection: { marginBottom: 16 },
  answerInput: { minHeight: 120 },
  aiUsedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  submitButton: { marginBottom: 24 },
});
```


### 10.4 TeacherCalendarWidget.tsx

```typescript
// src/components/widgets/teacher/TeacherCalendarWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTeacherCalendarQuery } from '@/hooks/queries/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

type CalendarEvent = {
  id: string;
  date: string;
  type: 'class' | 'exam' | 'meeting' | 'holiday' | 'deadline';
  title: string;
  time?: string;
  className?: string;
};

export const TeacherCalendarWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events, isLoading } = useTeacherCalendarQuery({
    startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
  });

  const eventColors = {
    class: theme.colors.primary,
    exam: '#FF9800',
    meeting: '#9C27B0',
    holiday: '#4CAF50',
    deadline: theme.colors.error,
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events?.filter(e => isSameDay(new Date(e.date), date)) || [];
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const renderDay = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const dayIsToday = isToday(date);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayCell,
          isSelected && { backgroundColor: theme.colors.primaryContainer },
          dayIsToday && styles.todayCell,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          variant="bodyMedium"
          style={[
            styles.dayText,
            dayIsToday && { color: theme.colors.primary, fontWeight: 'bold' },
            isSelected && { color: theme.colors.onPrimaryContainer },
          ]}
        >
          {format(date, 'd')}
        </Text>
        {dayEvents.length > 0 && (
          <View style={styles.eventDots}>
            {dayEvents.slice(0, 3).map((event, idx) => (
              <View
                key={idx}
                style={[styles.eventDot, { backgroundColor: eventColors[event.type] }]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <WidgetContainer
      title="Calendar"
      isLoading={isLoading}
      action={
        <TouchableOpacity onPress={() => onNavigate?.('teacher-calendar')}>
          <Icon name="arrow-expand" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      }
    >
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Icon name="chevron-left" size={28} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text variant="titleMedium">{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Icon name="chevron-right" size={28} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} variant="labelSmall" style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.dayCell} />
        ))}
        {days.map(renderDay)}
      </View>

      {/* Selected Date Events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <Text variant="labelMedium" style={styles.eventsLabel}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          {selectedDateEvents.map(event => (
            <Surface key={event.id} style={styles.eventCard} elevation={0}>
              <View style={[styles.eventIndicator, { backgroundColor: eventColors[event.type] }]} />
              <View style={styles.eventInfo}>
                <Text variant="titleSmall">{event.title}</Text>
                {event.time && <Text variant="bodySmall" style={styles.eventTime}>{event.time}</Text>}
                {event.className && <Chip compact style={styles.classChip}>{event.className}</Chip>}
              </View>
            </Surface>
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(eventColors).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text variant="labelSmall" style={styles.legendText}>{type}</Text>
          </View>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekdayText: { width: 40, textAlign: 'center', opacity: 0.6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  todayCell: { borderWidth: 2, borderColor: '#2196F3', borderRadius: 8 },
  dayText: { fontSize: 14 },
  eventDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventDot: { width: 4, height: 4, borderRadius: 2 },
  eventsSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  eventsLabel: { marginBottom: 8, opacity: 0.7 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.03)' },
  eventIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTime: { opacity: 0.6, marginTop: 2 },
  classChip: { alignSelf: 'flex-start', marginTop: 6, height: 22 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { opacity: 0.7, textTransform: 'capitalize' },
});
```


### 10.5 SubstituteRequestWidget.tsx

```typescript
// src/components/widgets/teacher/SubstituteRequestWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Surface, Button, Chip, Divider, SegmentedButtons, RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAvailableSubstitutesQuery, useLeaveRequestsQuery } from '@/hooks/queries/teacher';
import { useRequestSubstitute, useCreateLeaveRequest } from '@/hooks/mutations/teacher';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';
import { format } from 'date-fns';

type SubstituteTeacher = {
  id: string;
  name: string;
  department: string;
  subjects: string[];
  availableSlots: string[];
  rating: number;
  distance?: number;
};

type LeaveRequest = {
  id: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  substituteId?: string;
  substituteName?: string;
};

export const SubstituteRequestWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const [view, setView] = useState<'request' | 'history'>('request');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { data: substitutes, isLoading: loadingSubstitutes } = useAvailableSubstitutesQuery({
    date: selectedDate,
    subject: selectedClass,
  });

  const { data: leaveRequests, isLoading: loadingRequests } = useLeaveRequestsQuery();
  const { mutate: requestSubstitute, isPending: requesting } = useRequestSubstitute();
  const { mutate: createLeave, isPending: creatingLeave } = useCreateLeaveRequest();

  const statusColors = {
    pending: '#FF9800',
    approved: '#4CAF50',
    rejected: theme.colors.error,
  };

  const handleSubmitRequest = () => {
    if (!selectedDate || !selectedSubstitute) return;
    requestSubstitute({
      date: selectedDate,
      substituteId: selectedSubstitute,
      reason,
    });
  };

  const renderSubstitute = ({ item }: { item: SubstituteTeacher }) => (
    <TouchableOpacity
      style={[
        styles.substituteCard,
        selectedSubstitute === item.id && { borderColor: theme.colors.primary, borderWidth: 2 },
      ]}
      onPress={() => setSelectedSubstitute(item.id)}
    >
      <RadioButton
        value={item.id}
        status={selectedSubstitute === item.id ? 'checked' : 'unchecked'}
        onPress={() => setSelectedSubstitute(item.id)}
      />
      <Avatar.Text size={44} label={item.name.substring(0, 2).toUpperCase()} />
      <View style={styles.substituteInfo}>
        <Text variant="titleSmall">{item.name}</Text>
        <Text variant="bodySmall" style={styles.department}>{item.department}</Text>
        <View style={styles.subjectsRow}>
          {item.subjects.slice(0, 2).map((subject, idx) => (
            <Chip key={idx} compact style={styles.subjectChip}>{subject}</Chip>
          ))}
        </View>
      </View>
      <View style={styles.ratingSection}>
        <View style={styles.ratingRow}>
          <Icon name="star" size={16} color="#FFB300" />
          <Text variant="labelMedium">{item.rating.toFixed(1)}</Text>
        </View>
        <Text variant="labelSmall" style={styles.slotsText}>
          {item.availableSlots.length} slots free
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderLeaveRequest = ({ item }: { item: LeaveRequest }) => (
    <Surface style={styles.requestCard} elevation={0}>
      <View style={styles.requestHeader}>
        <Text variant="titleSmall">{format(new Date(item.date), 'EEE, MMM d')}</Text>
        <Chip
          compact
          style={{ backgroundColor: `${statusColors[item.status]}20` }}
          textStyle={{ color: statusColors[item.status] }}
        >
          {item.status}
        </Chip>
      </View>
      <Text variant="bodySmall" style={styles.reason}>{item.reason}</Text>
      {item.substituteName && (
        <View style={styles.substituteRow}>
          <Icon name="account-switch" size={16} color={theme.colors.outline} />
          <Text variant="labelSmall" style={styles.substituteText}>
            Substitute: {item.substituteName}
          </Text>
        </View>
      )}
    </Surface>
  );

  return (
    <WidgetContainer title="Substitute Finder" isLoading={loadingSubstitutes || loadingRequests}>
      <SegmentedButtons
        value={view}
        onValueChange={(v) => setView(v as 'request' | 'history')}
        buttons={[
          { value: 'request', label: 'Request Leave' },
          { value: 'history', label: 'My Requests' },
        ]}
        style={styles.segmentedButtons}
      />

      {view === 'request' ? (
        <View style={styles.requestForm}>
          {/* Date Selection */}
          <View style={styles.formSection}>
            <Text variant="labelMedium" style={styles.formLabel}>Select Date</Text>
            {/* Date picker would go here - simplified for demo */}
            <Surface style={styles.dateCard} elevation={0}>
              <Icon name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</Text>
            </Surface>
          </View>

          {/* Available Substitutes */}
          <View style={styles.formSection}>
            <Text variant="labelMedium" style={styles.formLabel}>Available Substitutes</Text>
            <FlatList
              data={substitutes || []}
              renderItem={renderSubstitute}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="account-search" size={40} color={theme.colors.outline} />
                  <Text variant="bodySmall" style={styles.emptyText}>No substitutes available</Text>
                </View>
              }
            />
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmitRequest}
            loading={requesting}
            disabled={!selectedSubstitute || requesting}
            style={styles.submitButton}
            icon="send"
          >
            Request Substitute
          </Button>
        </View>
      ) : (
        <FlatList
          data={leaveRequests || []}
          renderItem={renderLeaveRequest}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-check" size={48} color={theme.colors.outline} />
              <Text variant="bodyMedium" style={styles.emptyText}>No leave requests yet</Text>
            </View>
          }
        />
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  segmentedButtons: { marginBottom: 16 },
  requestForm: {},
  formSection: { marginBottom: 16 },
  formLabel: { marginBottom: 8, opacity: 0.7 },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  substituteCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.03)', gap: 8 },
  substituteInfo: { flex: 1 },
  department: { opacity: 0.6, marginTop: 2 },
  subjectsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  subjectChip: { height: 22 },
  ratingSection: { alignItems: 'flex-end' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  slotsText: { opacity: 0.6, marginTop: 4 },
  submitButton: { marginTop: 8 },
  requestCard: { padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reason: { opacity: 0.7, marginTop: 8 },
  substituteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  substituteText: { opacity: 0.6 },
  separator: { height: 8 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```


### 10.6 AIInsightsWidget.tsx

```typescript
// src/components/widgets/teacher/AIInsightsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Button, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type AIInsight = {
  id: string;
  type: 'at_risk' | 'performance_drop' | 'attendance_pattern' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  affectedStudents?: number;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
};

export const AIInsightsWidget: React.FC<TeacherWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  // Mock AI insights - would come from backend AI analysis
  const insights: AIInsight[] = [
    {
      id: '1',
      type: 'at_risk',
      title: '3 Students Need Attention',
      description: 'Based on attendance and performance patterns, 3 students in Class 10-A may be at risk of falling behind.',
      severity: 'critical',
      affectedStudents: 3,
      confidence: 0.89,
      actionable: true,
      suggestedAction: 'Schedule parent meetings for these students',
    },
    {
      id: '2',
      type: 'attendance_pattern',
      title: 'Monday Absence Pattern Detected',
      description: '5 students show consistent Monday absences over the past month. This may indicate scheduling conflicts.',
      severity: 'warning',
      affectedStudents: 5,
      confidence: 0.82,
      actionable: true,
      suggestedAction: 'Review Monday schedules with affected students',
    },
    {
      id: '3',
      type: 'improvement',
      title: 'Class 10-B Performance Up 12%',
      description: 'Overall class performance has improved significantly since implementing the new teaching strategy.',
      severity: 'success',
      confidence: 0.95,
      actionable: false,
    },
    {
      id: '4',
      type: 'recommendation',
      title: 'Consider Topic Review',
      description: '68% of students struggled with Chapter 5 concepts. A review session could help reinforce understanding.',
      severity: 'info',
      confidence: 0.78,
      actionable: true,
      suggestedAction: 'Schedule a review session for Chapter 5',
    },
  ];

  const severityConfig = {
    info: { icon: 'information', color: theme.colors.primary, bg: `${theme.colors.primary}15` },
    warning: { icon: 'alert', color: '#FF9800', bg: '#FF980015' },
    critical: { icon: 'alert-circle', color: theme.colors.error, bg: `${theme.colors.error}15` },
    success: { icon: 'check-circle', color: '#4CAF50', bg: '#4CAF5015' },
  };

  const renderInsight = ({ item }: { item: AIInsight }) => {
    const config = severityConfig[item.severity];
    return (
      <Surface style={[styles.insightCard, { backgroundColor: config.bg }]} elevation={0}>
        <View style={styles.insightHeader}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Icon name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.insightTitleSection}>
            <Text variant="titleSmall">{item.title}</Text>
            <View style={styles.confidenceRow}>
              <Icon name="robot" size={12} color={theme.colors.outline} />
              <Text variant="labelSmall" style={styles.confidenceText}>
                {Math.round(item.confidence * 100)}% confidence
              </Text>
            </View>
          </View>
          {item.affectedStudents && (
            <Chip compact icon="account-group">{item.affectedStudents}</Chip>
          )}
        </View>

        <Text variant="bodySmall" style={styles.description}>{item.description}</Text>

        {item.actionable && item.suggestedAction && (
          <View style={styles.actionSection}>
            <View style={styles.suggestedAction}>
              <Icon name="lightbulb-outline" size={16} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {item.suggestedAction}
              </Text>
            </View>
            <Button
              mode="contained-tonal"
              compact
              onPress={() => onNavigate?.('insight-action', { insightId: item.id })}
            >
              Take Action
            </Button>
          </View>
        )}
      </Surface>
    );
  };

  return (
    <WidgetContainer
      title="AI Insights"
      action={
        <View style={styles.headerAction}>
          <Icon name="robot" size={18} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary }}>Powered by AI</Text>
        </View>
      }
    >
      <FlatList
        data={insights.slice(0, config?.maxItems || 4)}
        renderItem={renderInsight}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => onNavigate?.('ai-insights-all')}
      >
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>View All Insights</Text>
        <Icon name="arrow-right" size={18} color={theme.colors.primary} />
      </TouchableOpacity>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightCard: { padding: 16, borderRadius: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  insightTitleSection: { flex: 1 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  confidenceText: { opacity: 0.6 },
  description: { marginTop: 12, lineHeight: 20, opacity: 0.8 },
  actionSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  suggestedAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  separator: { height: 12 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
});
```


### 10.7 useDoubtsInboxQuery Hook

```typescript
// src/hooks/queries/teacher/useDoubtsInboxQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useDoubtsInboxQuery = (options?: { limit?: number; status?: string }) => {
  const { user } = useAuthStore();
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['teacher', 'doubts', user?.id, { limit, status: options?.status }],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Get doubts from classes this teacher teaches
      const { data: teacherClasses } = await supabase
        .from('teacher_classes')
        .select('class_id, subject_id')
        .eq('teacher_id', teacher.id)
        .eq('status', 'active');

      const classIds = teacherClasses?.map(tc => tc.class_id) || [];

      let query = supabase
        .from('student_doubts')
        .select(`
          id,
          question,
          attachment_url,
          priority,
          status,
          ai_suggestion,
          created_at,
          student:user_profiles!student_id(full_name, avatar_url),
          class:classes!class_id(name),
          subject:subjects!subject_id(name_en)
        `)
        .eq('customer_id', teacher.customer_id)
        .in('class_id', classIds)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(d => ({
        id: d.id,
        studentName: d.student?.full_name || 'Unknown',
        studentAvatar: d.student?.avatar_url,
        className: d.class?.name || '',
        subject: d.subject?.name_en || '',
        question: d.question,
        attachmentUrl: d.attachment_url,
        priority: d.priority,
        status: d.status,
        createdAt: d.created_at,
        aiSuggestion: d.ai_suggestion,
      })) || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });
};
```


### 10.8 useTeacherCalendarQuery Hook

```typescript
// src/hooks/queries/teacher/useTeacherCalendarQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useTeacherCalendarQuery = (options?: { startDate?: string; endDate?: string }) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['teacher', 'calendar', user?.id, options?.startDate, options?.endDate],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Get calendar events (classes, exams, meetings, holidays)
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          id,
          event_date,
          event_type,
          title_en,
          start_time,
          end_time,
          class:classes!class_id(name)
        `)
        .eq('customer_id', teacher.customer_id)
        .or(`teacher_id.eq.${teacher.id},teacher_id.is.null`)
        .gte('event_date', options?.startDate || new Date().toISOString().split('T')[0])
        .lte('event_date', options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;

      return events?.map(e => ({
        id: e.id,
        date: e.event_date,
        type: e.event_type,
        title: e.title_en,
        time: e.start_time ? `${e.start_time} - ${e.end_time}` : undefined,
        className: e.class?.name,
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });
};
```


### 10.9 useAvailableSubstitutesQuery Hook

```typescript
// src/hooks/queries/teacher/useAvailableSubstitutesQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useAvailableSubstitutesQuery = (options?: { date?: string; subject?: string }) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['teacher', 'substitutes', options?.date, options?.subject],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Get other teachers who are available on the given date
      const { data: availableTeachers, error } = await supabase
        .from('teachers')
        .select(`
          id,
          full_name,
          department,
          subject_specialization,
          substitute_rating
        `)
        .eq('customer_id', teacher.customer_id)
        .eq('status', 'active')
        .neq('id', teacher.id);

      if (error) throw error;

      // Check for conflicts with leave requests for each teacher
      const teachersWithAvailability = await Promise.all(
        (availableTeachers || []).map(async (t) => {
          const { count: leaveCount } = await supabase
            .from('teacher_leaves')
            .select('id', { count: 'exact' })
            .eq('teacher_id', t.id)
            .eq('leave_date', options?.date || new Date().toISOString().split('T')[0])
            .eq('status', 'approved');

          // If teacher has approved leave, they're not available
          if (leaveCount && leaveCount > 0) return null;

          return {
            id: t.id,
            name: t.full_name,
            department: t.department || 'General',
            subjects: t.subject_specialization ? [t.subject_specialization] : [],
            availableSlots: ['Period 1', 'Period 3', 'Period 5'], // Would come from schedule
            rating: t.substitute_rating || 4.0,
          };
        })
      );

      return teachersWithAvailability.filter(Boolean);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });
};
```


### 10.10 useAnswerDoubt Hook

```typescript
// src/hooks/mutations/teacher/useAnswerDoubt.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type AnswerData = {
  doubtId: string;
  answer: string;
  usedAiSuggestion?: boolean;
};

export const useAnswerDoubt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: AnswerData) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { data: updated, error } = await supabase
        .from('student_doubts')
        .update({
          answer: data.answer,
          answered_by: teacher.id,
          answered_at: new Date().toISOString(),
          used_ai_suggestion: data.usedAiSuggestion || false,
          status: 'answered',
        })
        .eq('id', data.doubtId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'doubts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
};
```


### 10.11 useRequestSubstitute Hook

```typescript
// src/hooks/mutations/teacher/useRequestSubstitute.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type SubstituteRequest = {
  date: string;
  substituteId: string;
  reason?: string;
  classIds?: string[];
};

export const useRequestSubstitute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: SubstituteRequest) => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, customer_id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      // Create leave request
      const { data: leaveRequest, error: leaveError } = await supabase
        .from('teacher_leaves')
        .insert({
          customer_id: teacher.customer_id,
          teacher_id: teacher.id,
          leave_date: data.date,
          reason: data.reason || 'Personal',
          status: 'pending',
        })
        .select()
        .single();

      if (leaveError) throw leaveError;

      // Create substitute request
      const { data: subRequest, error: subError } = await supabase
        .from('substitute_requests')
        .insert({
          customer_id: teacher.customer_id,
          requesting_teacher_id: teacher.id,
          substitute_teacher_id: data.substituteId,
          leave_id: leaveRequest.id,
          request_date: data.date,
          status: 'pending',
        })
        .select()
        .single();

      if (subError) throw subError;
      return { leaveRequest, subRequest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'substitutes'] });
    },
  });
};
```


### 10.12 DoubtAnswerScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/DoubtAnswerScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Surface,
  Chip,
  Divider,
  IconButton,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useDoubtDetailQuery } from '@/hooks/queries/teacher';
import { useAnswerDoubt } from '@/hooks/mutations/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';

export const DoubtAnswerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  const { doubtId } = route.params as { doubtId: string };

  // === DATA ===
  const { data: doubt, isLoading } = useDoubtDetailQuery(doubtId);
  const answerMutation = useAnswerDoubt();

  // === STATE ===
  const [answer, setAnswer] = useState('');
  const [useAiSuggestion, setUseAiSuggestion] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // === HANDLERS ===
  const applyAiSuggestion = () => {
    if (doubt?.aiSuggestion?.text) {
      setAnswer(doubt.aiSuggestion.text);
      setUseAiSuggestion(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setSnackbar({ visible: true, message: 'Please enter an answer' });
      return;
    }

    try {
      await answerMutation.mutateAsync({
        doubtId,
        answer: answer.trim(),
        usedAiSuggestion: useAiSuggestion,
      });

      setSnackbar({ visible: true, message: 'Answer submitted successfully!' });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to submit answer' });
    }
  };

  // === CONFIDENCE COLOR ===
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#4CAF50';
    if (confidence >= 70) return '#2196F3';
    if (confidence >= 50) return '#FF9800';
    return theme.colors.error;
  };

  // === LOADING ===
  if (isLoading || !doubt) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading doubt...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, flex: 1 }}>
            Answer Doubt
          </Text>
          <Chip compact mode="outlined" style={{ borderColor: theme.colors.primary }}>
            {doubt.subject}
          </Chip>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Student Info */}
          <Surface style={[styles.studentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.studentRow}>
              <Avatar.Text
                size={48}
                label={doubt.studentName.substring(0, 2).toUpperCase()}
              />
              <View style={styles.studentInfo}>
                <Text variant="titleMedium">{doubt.studentName}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {doubt.className} - Asked {formatDistanceToNow(new Date(doubt.createdAt), { addSuffix: true })}
                </Text>
              </View>
              <Chip
                compact
                style={{
                  backgroundColor: doubt.priority === 'high'
                    ? theme.colors.errorContainer
                    : doubt.priority === 'medium'
                    ? '#FFF3E0'
                    : theme.colors.surfaceVariant
                }}
              >
                {doubt.priority}
              </Chip>
            </View>
          </Surface>

          {/* Question */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Question</Text>
            <View style={[styles.questionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="help-circle" size={20} color={theme.colors.primary} style={styles.questionIcon} />
              <Text variant="bodyLarge" style={{ flex: 1 }}>{doubt.question}</Text>
            </View>
            {doubt.attachmentUrl && (
              <TouchableOpacity style={styles.attachmentRow}>
                <Icon name="image" size={20} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>View Attachment</Text>
              </TouchableOpacity>
            )}
          </Surface>

          {/* AI Suggestion */}
          {doubt.aiSuggestion && (
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.aiHeader}>
                <View style={styles.aiTitleRow}>
                  <Icon name="robot" size={20} color={theme.colors.primary} />
                  <Text variant="titleMedium">AI Suggestion</Text>
                </View>
                <Chip
                  compact
                  style={{ backgroundColor: getConfidenceColor(doubt.aiSuggestion.confidence) }}
                  textStyle={{ color: 'white', fontSize: 10 }}
                >
                  {doubt.aiSuggestion.confidence}% confident
                </Chip>
              </View>

              <View style={[styles.aiBox, { borderColor: theme.colors.primary }]}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {doubt.aiSuggestion.text}
                </Text>
              </View>

              <Button
                mode="outlined"
                icon="content-copy"
                onPress={applyAiSuggestion}
                style={styles.useAiButton}
              >
                Use This Suggestion
              </Button>

              {doubt.aiSuggestion.sources && (
                <View style={styles.sourcesRow}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Sources:
                  </Text>
                  {doubt.aiSuggestion.sources.map((source: string, idx: number) => (
                    <Chip key={idx} compact style={styles.sourceChip}>
                      {source}
                    </Chip>
                  ))}
                </View>
              )}
            </Surface>
          )}

          {/* Your Answer */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Your Answer</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={6}
              value={answer}
              onChangeText={(text) => {
                setAnswer(text);
                setUseAiSuggestion(false);
              }}
              placeholder="Type your answer here..."
              style={styles.answerInput}
            />

            {/* Quick Response Chips */}
            <Text variant="labelMedium" style={styles.quickLabel}>Quick Responses:</Text>
            <View style={styles.quickResponses}>
              {[
                'Good question! Let me explain...',
                'This is a common confusion. The key point is...',
                'Please refer to Chapter X for more details.',
                'Let\'s solve this step by step:',
              ].map((text, idx) => (
                <Chip
                  key={idx}
                  compact
                  onPress={() => setAnswer(prev => prev ? `${prev}\n\n${text}` : text)}
                  style={styles.quickChip}
                >
                  {text.substring(0, 30)}...
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={answerMutation.isPending}
            disabled={answerMutation.isPending || !answer.trim()}
            style={styles.submitButton}
            icon="send"
          >
            Submit Answer
          </Button>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: { marginRight: 8 },
  content: { flex: 1, padding: 16 },
  studentCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentInfo: { flex: 1 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  questionBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  questionIcon: { marginTop: 2 },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  useAiButton: { marginTop: 12 },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  sourceChip: { height: 24 },
  answerInput: { minHeight: 120 },
  quickLabel: { marginTop: 12, marginBottom: 8 },
  quickResponses: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { marginBottom: 4 },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: { flex: 1 },
  submitButton: { flex: 2 },
});
```


### 10.13 LeaveRequestCreateScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/LeaveRequestCreateScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Chip,
  RadioButton,
  Switch,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useCreateLeaveRequest } from '@/hooks/mutations/teacher';
import { useTeacherClassesQuery } from '@/hooks/queries/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';

type LeaveType = 'sick' | 'personal' | 'emergency' | 'planned';

type FormData = {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  reason: string;
  needSubstitute: boolean;
  selectedClasses: string[];
  notes: string;
};

export const LeaveRequestCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  // === DATA ===
  const { data: classes = [] } = useTeacherClassesQuery();
  const createMutation = useCreateLeaveRequest();

  // === FORM STATE ===
  const [formData, setFormData] = useState<FormData>({
    leaveType: 'planned',
    startDate: new Date(),
    endDate: new Date(),
    isHalfDay: false,
    reason: '',
    needSubstitute: true,
    selectedClasses: [],
    notes: '',
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // === LEAVE TYPES ===
  const leaveTypes: { value: LeaveType; label: string; icon: string; color: string }[] = [
    { value: 'sick', label: 'Sick Leave', icon: 'hospital-box', color: theme.colors.error },
    { value: 'personal', label: 'Personal', icon: 'account', color: theme.colors.primary },
    { value: 'emergency', label: 'Emergency', icon: 'alert-circle', color: '#FF9800' },
    { value: 'planned', label: 'Planned', icon: 'calendar-check', color: '#4CAF50' },
  ];

  // === HANDLERS ===
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(id => id !== classId)
        : [...prev.selectedClasses, classId],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';
    if (formData.endDate < formData.startDate) newErrors.endDate = 'End date must be after start date';
    if (formData.needSubstitute && formData.selectedClasses.length === 0) {
      newErrors.selectedClasses = 'Select at least one class for substitute';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createMutation.mutateAsync({
        leaveType: formData.leaveType,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        isHalfDay: formData.isHalfDay,
        reason: formData.reason,
        needSubstitute: formData.needSubstitute,
        classIds: formData.selectedClasses,
        notes: formData.notes,
      });

      setSnackbar({ visible: true, message: 'Leave request submitted!' });
      setTimeout(() => {
        if (formData.needSubstitute) {
          navigation.navigate('substitute-finder' as never, {
            startDate: formData.startDate.toISOString(),
            classIds: formData.selectedClasses,
          } as never);
        } else {
          navigation.goBack();
        }
      }, 1500);
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to submit request' });
    }
  };

  // === CALCULATIONS ===
  const dayCount = Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const selectedLeaveType = leaveTypes.find(t => t.value === formData.leaveType);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            Request Leave
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Leave Type */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Leave Type</Text>
            <View style={styles.typeGrid}>
              {leaveTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    {
                      borderColor: formData.leaveType === type.value ? type.color : theme.colors.outline,
                      backgroundColor: formData.leaveType === type.value ? `${type.color}15` : 'transparent',
                    },
                  ]}
                  onPress={() => updateField('leaveType', type.value)}
                >
                  <Icon
                    name={type.icon}
                    size={28}
                    color={formData.leaveType === type.value ? type.color : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="labelMedium"
                    style={{ color: formData.leaveType === type.value ? type.color : theme.colors.onSurface }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>

          {/* Date Selection */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Duration</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text variant="labelMedium" style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.dateSelector, { borderColor: theme.colors.outline }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Icon name="calendar" size={20} color={theme.colors.primary} />
                  <Text variant="bodyMedium">{formData.startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateColumn}>
                <Text variant="labelMedium" style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={[styles.dateSelector, { borderColor: errors.endDate ? theme.colors.error : theme.colors.outline }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Icon name="calendar" size={20} color={theme.colors.primary} />
                  <Text variant="bodyMedium">{formData.endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.endDate && <HelperText type="error">{errors.endDate}</HelperText>}

            <View style={styles.summaryRow}>
              <View style={[styles.summaryBadge, { backgroundColor: selectedLeaveType?.color }]}>
                <Text variant="headlineSmall" style={{ color: 'white', fontWeight: 'bold' }}>
                  {formData.isHalfDay ? '0.5' : dayCount}
                </Text>
                <Text variant="labelSmall" style={{ color: 'white' }}>
                  {dayCount === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Half Day</Text>
              <Switch
                value={formData.isHalfDay}
                onValueChange={(v) => updateField('isHalfDay', v)}
                disabled={dayCount > 1}
              />
            </View>
          </Surface>

          {/* Reason */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Reason</Text>
            <TextInput
              mode="outlined"
              label="Reason for leave *"
              value={formData.reason}
              onChangeText={(v) => updateField('reason', v)}
              multiline
              numberOfLines={3}
              error={!!errors.reason}
            />
            {errors.reason && <HelperText type="error">{errors.reason}</HelperText>}

            {/* Quick Reasons */}
            <View style={styles.quickReasons}>
              {['Medical appointment', 'Family event', 'Personal work', 'Not feeling well'].map((text) => (
                <Chip
                  key={text}
                  compact
                  onPress={() => updateField('reason', text)}
                  style={styles.reasonChip}
                >
                  {text}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Substitute Request */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon name="account-switch" size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium">Need Substitute?</Text>
              </View>
              <Switch
                value={formData.needSubstitute}
                onValueChange={(v) => updateField('needSubstitute', v)}
              />
            </View>

            {formData.needSubstitute && (
              <>
                <Text variant="labelMedium" style={styles.classLabel}>
                  Select classes needing coverage: *
                </Text>
                <View style={styles.classGrid}>
                  {classes.map((cls) => (
                    <Chip
                      key={cls.id}
                      selected={formData.selectedClasses.includes(cls.id)}
                      onPress={() => toggleClass(cls.id)}
                      style={styles.classChip}
                      showSelectedCheck
                    >
                      {cls.name} - {cls.section}
                    </Chip>
                  ))}
                </View>
                {errors.selectedClasses && (
                  <HelperText type="error">{errors.selectedClasses}</HelperText>
                )}
              </>
            )}
          </Surface>

          {/* Additional Notes */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              mode="outlined"
              label="Notes (Optional)"
              value={formData.notes}
              onChangeText={(v) => updateField('notes', v)}
              multiline
              numberOfLines={2}
              placeholder="Any additional information for admin..."
            />
          </Surface>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon={formData.needSubstitute ? 'arrow-right' : 'check'}
          >
            {formData.needSubstitute ? 'Continue to Find Substitute' : 'Submit Request'}
          </Button>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) {
                updateField('startDate', date);
                if (date > formData.endDate) updateField('endDate', date);
              }
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={formData.endDate}
            mode="date"
            display="default"
            minimumDate={formData.startDate}
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) updateField('endDate', date);
            }}
          />
        )}

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 16 },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  dateRow: { flexDirection: 'row', gap: 16 },
  dateColumn: { flex: 1 },
  dateLabel: { marginBottom: 8 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  summaryRow: { alignItems: 'center', marginTop: 16 },
  summaryBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  reasonChip: { marginBottom: 4 },
  classLabel: { marginTop: 16, marginBottom: 8 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classChip: { marginBottom: 4 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: { borderRadius: 8 },
  submitButtonContent: { paddingVertical: 8 },
});
```


### 10.14 CalendarEventCreateScreen.tsx (Fixed Screen)

```typescript
// src/screens/teacher/CalendarEventCreateScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Chip,
  Switch,
  Snackbar,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useCreateCalendarEvent } from '@/hooks/mutations/teacher';
import { useTeacherClassesQuery } from '@/hooks/queries/teacher';
import { SafeAreaView } from 'react-native-safe-area-context';

type EventType = 'class' | 'exam' | 'meeting' | 'deadline' | 'other';

type FormData = {
  title: string;
  eventType: EventType;
  date: Date;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  description: string;
  classId: string;
  isRecurring: boolean;
  recurringPattern: 'daily' | 'weekly' | 'monthly';
  reminder: number; // minutes before
  color: string;
};

export const CalendarEventCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { t } = useTranslation('teacher');

  // Pre-selected date from route
  const preSelectedDate = (route.params as any)?.date
    ? new Date((route.params as any).date)
    : new Date();

  // === DATA ===
  const { data: classes = [] } = useTeacherClassesQuery();
  const createMutation = useCreateCalendarEvent();

  // === EVENT TYPES ===
  const eventTypes: { value: EventType; label: string; icon: string; color: string }[] = [
    { value: 'class', label: 'Class', icon: 'school', color: '#2196F3' },
    { value: 'exam', label: 'Exam', icon: 'file-document-edit', color: '#F44336' },
    { value: 'meeting', label: 'Meeting', icon: 'account-group', color: '#9C27B0' },
    { value: 'deadline', label: 'Deadline', icon: 'clock-alert', color: '#FF9800' },
    { value: 'other', label: 'Other', icon: 'calendar', color: '#607D8B' },
  ];

  const reminderOptions = [
    { value: 0, label: 'None' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 1440, label: '1 day' },
  ];

  // === FORM STATE ===
  const [formData, setFormData] = useState<FormData>({
    title: '',
    eventType: 'class',
    date: preSelectedDate,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    isAllDay: false,
    description: '',
    classId: '',
    isRecurring: false,
    recurringPattern: 'weekly',
    reminder: 15,
    color: '#2196F3',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // === HANDLERS ===
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Update color based on event type
    if (field === 'eventType') {
      const type = eventTypes.find(t => t.value === value);
      if (type) setFormData(prev => ({ ...prev, color: type.color }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.isAllDay && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createMutation.mutateAsync({
        title: formData.title,
        eventType: formData.eventType,
        date: formData.date.toISOString(),
        startTime: formData.isAllDay ? null : formData.startTime.toISOString(),
        endTime: formData.isAllDay ? null : formData.endTime.toISOString(),
        isAllDay: formData.isAllDay,
        description: formData.description,
        classId: formData.classId || null,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
        reminder: formData.reminder,
        color: formData.color,
      });

      setSnackbar({ visible: true, message: 'Event created successfully!' });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to create event' });
    }
  };

  // === HELPERS ===
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectedEventType = eventTypes.find(t => t.value === formData.eventType);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            New Event
          </Text>
          <View style={[styles.colorIndicator, { backgroundColor: formData.color }]} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              mode="outlined"
              label="Event Title *"
              value={formData.title}
              onChangeText={(v) => updateField('title', v)}
              error={!!errors.title}
              left={<TextInput.Icon icon={selectedEventType?.icon || 'calendar'} />}
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}
          </Surface>

          {/* Event Type */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Event Type</Text>
            <View style={styles.typeRow}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: formData.eventType === type.value ? type.color : 'transparent',
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => updateField('eventType', type.value)}
                >
                  <Icon
                    name={type.icon}
                    size={16}
                    color={formData.eventType === type.value ? 'white' : type.color}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: formData.eventType === type.value ? 'white' : type.color }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>

          {/* Date & Time */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Date & Time</Text>

            {/* Date Picker */}
            <TouchableOpacity
              style={[styles.dateSelector, { borderColor: theme.colors.outline }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={{ flex: 1 }}>
                {formData.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            {/* All Day Toggle */}
            <View style={styles.switchRow}>
              <Text variant="bodyMedium">All Day</Text>
              <Switch
                value={formData.isAllDay}
                onValueChange={(v) => updateField('isAllDay', v)}
              />
            </View>

            {/* Time Pickers */}
            {!formData.isAllDay && (
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={[styles.timeSelector, { borderColor: theme.colors.outline }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Icon name="clock-start" size={20} color={theme.colors.primary} />
                  <View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Start</Text>
                    <Text variant="bodyMedium">{formatTime(formData.startTime)}</Text>
                  </View>
                </TouchableOpacity>

                <Icon name="arrow-right" size={20} color={theme.colors.onSurfaceVariant} />

                <TouchableOpacity
                  style={[styles.timeSelector, { borderColor: errors.endTime ? theme.colors.error : theme.colors.outline }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Icon name="clock-end" size={20} color={theme.colors.primary} />
                  <View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>End</Text>
                    <Text variant="bodyMedium">{formatTime(formData.endTime)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            {errors.endTime && <HelperText type="error">{errors.endTime}</HelperText>}
          </Surface>

          {/* Recurring */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon name="repeat" size={20} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium">Recurring Event</Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(v) => updateField('isRecurring', v)}
              />
            </View>

            {formData.isRecurring && (
              <SegmentedButtons
                value={formData.recurringPattern}
                onValueChange={(v) => updateField('recurringPattern', v as any)}
                buttons={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
                style={styles.segmented}
              />
            )}
          </Surface>

          {/* Class Association */}
          {(formData.eventType === 'class' || formData.eventType === 'exam') && (
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Associate with Class</Text>
              <View style={styles.classGrid}>
                {classes.map((cls) => (
                  <Chip
                    key={cls.id}
                    selected={formData.classId === cls.id}
                    onPress={() => updateField('classId', formData.classId === cls.id ? '' : cls.id)}
                    style={styles.classChip}
                    showSelectedCheck
                  >
                    {cls.name} - {cls.section}
                  </Chip>
                ))}
              </View>
            </Surface>
          )}

          {/* Reminder */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Reminder</Text>
            <View style={styles.reminderRow}>
              {reminderOptions.map((option) => (
                <Chip
                  key={option.value}
                  selected={formData.reminder === option.value}
                  onPress={() => updateField('reminder', option.value)}
                  style={styles.reminderChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Description */}
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
            <TextInput
              mode="outlined"
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={3}
            />
          </Surface>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={[styles.submitButton, { backgroundColor: formData.color }]}
            contentStyle={styles.submitButtonContent}
            icon="calendar-plus"
          >
            Create Event
          </Button>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) updateField('date', date);
            }}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={formData.startTime}
            mode="time"
            display="default"
            onChange={(event, time) => {
              setShowStartTimePicker(false);
              if (time) updateField('startTime', time);
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={formData.endTime}
            mode="time"
            display="default"
            onChange={(event, time) => {
              setShowEndTimePicker(false);
              if (time) updateField('endTime', time);
            }}
          />
        )}

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 16 },
  colorIndicator: { width: 24, height: 24, borderRadius: 12 },
  content: { flex: 1, padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  timeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  segmented: { marginTop: 12 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classChip: { marginBottom: 4 },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reminderChip: { marginBottom: 4 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: { borderRadius: 8 },
  submitButtonContent: { paddingVertical: 8 },
});
```


### 10.15 Sprint 9 Checkpoint

**Test Criteria:**
- [ ] Doubts Inbox shows pending student questions
- [ ] AI suggestions display with confidence level
- [ ] DoubtAnswerScreen loads with student info and question
- [ ] AI suggestion can be applied to answer field
- [ ] Quick responses work correctly
- [ ] Answer submission saves and navigates back
- [ ] Teacher Calendar displays monthly view correctly
- [ ] Calendar events show with correct type colors
- [ ] CalendarEventCreateScreen opens from calendar
- [ ] Event type selection changes color indicator
- [ ] Date and time pickers work correctly
- [ ] Recurring event options display when enabled
- [ ] LeaveRequestCreateScreen shows all leave types
- [ ] Date range selection calculates correct day count
- [ ] Half-day option works for single-day leave
- [ ] Class selection for substitute appears when enabled
- [ ] Substitute Finder shows available teachers
- [ ] Can request substitute for a specific date
- [ ] Leave request status updates correctly
- [ ] AI Insights show actionable recommendations
- [ ] All demo features work in offline mode (cached data)

---

## 11. DATABASE SCHEMA

### 11.1 Core Tables for Phase 1

```sql
-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  employee_id TEXT,
  department TEXT,
  subject_specialization TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  profile_picture_url TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, user_id)
);

-- Teacher-Class assignments
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  is_class_teacher BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, teacher_id, class_id, subject_id)
);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  assignment_type TEXT DEFAULT 'homework',
  due_date TIMESTAMPTZ NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 100,
  attachment_urls JSONB DEFAULT '[]',
  rubric_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assignment submissions
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  submission_text TEXT,
  attachment_urls JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  percentage DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES teachers(id),
  graded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late', 'graded', 'returned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Attendance records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID REFERENCES classes(id),
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day')),
  marked_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, student_id, class_id, attendance_date)
);

-- Attendance alerts
CREATE TABLE attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_attendance', 'consecutive_absences', 'pattern_detected')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher messages
CREATE TABLE teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_role TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  related_student_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher announcements
CREATE TABLE teacher_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('class', 'all_classes', 'specific_students', 'parents')),
  title_en TEXT NOT NULL,
  content_en TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.2 Sprint 9 Demo Feature Tables

```sql
-- Student Doubts (for Doubts Inbox feature)
CREATE TABLE student_doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  topic TEXT,
  question TEXT NOT NULL,
  attachment_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'answered', 'closed')),
  ai_suggestion JSONB,  -- { answer: string, confidence: number, sources: string[] }
  answer TEXT,
  answered_by UUID REFERENCES teachers(id),
  answered_at TIMESTAMPTZ,
  used_ai_suggestion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_student_doubts_class ON student_doubts(class_id);
CREATE INDEX idx_student_doubts_status ON student_doubts(status);

-- Teacher Leaves (for Substitute Finder feature)
CREATE TABLE teacher_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  leave_date DATE NOT NULL,
  leave_type TEXT DEFAULT 'casual' CHECK (leave_type IN ('casual', 'sick', 'earned', 'emergency', 'other')),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, teacher_id, leave_date)
);

-- Substitute Requests (for Substitute Finder feature)
CREATE TABLE substitute_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  requesting_teacher_id UUID NOT NULL REFERENCES teachers(id),
  substitute_teacher_id UUID NOT NULL REFERENCES teachers(id),
  leave_id UUID REFERENCES teacher_leaves(id),
  request_date DATE NOT NULL,
  periods JSONB DEFAULT '[]',  -- Array of period numbers
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Calendar Events (for Teacher Calendar feature)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID REFERENCES teachers(id),  -- NULL for school-wide events
  class_id UUID REFERENCES classes(id),
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'exam', 'meeting', 'holiday', 'deadline', 'event')),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX idx_calendar_events_teacher ON calendar_events(teacher_id);

-- Add substitute_rating to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS substitute_rating DECIMAL(3,2) DEFAULT 4.0;
```

### 11.3 RLS Policies

```sql
-- Teachers can only see their own data
CREATE POLICY "Teachers see own data" ON teachers
  FOR SELECT USING (user_id = auth.uid());

-- Teachers can only see their assigned classes
CREATE POLICY "Teachers see assigned classes" ON teacher_classes
  FOR SELECT USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Teachers can manage their own assignments
CREATE POLICY "Teachers manage own assignments" ON assignments
  FOR ALL USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Teachers can see submissions for their assignments
CREATE POLICY "Teachers see submissions" ON assignment_submissions
  FOR SELECT USING (assignment_id IN (SELECT id FROM assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

-- Teachers can mark attendance for their classes
CREATE POLICY "Teachers mark attendance" ON attendance_records
  FOR ALL USING (class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

-- Sprint 9: RLS for Demo Features

-- Teachers can see doubts from their classes
CREATE POLICY "Teachers see class doubts" ON student_doubts
  FOR SELECT USING (class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

-- Teachers can answer doubts for their classes
CREATE POLICY "Teachers answer doubts" ON student_doubts
  FOR UPDATE USING (class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

-- Teachers can manage their own leaves
CREATE POLICY "Teachers manage own leaves" ON teacher_leaves
  FOR ALL USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Teachers can see substitute requests they're involved in
CREATE POLICY "Teachers see substitute requests" ON substitute_requests
  FOR SELECT USING (
    requesting_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    OR substitute_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- Teachers can create substitute requests
CREATE POLICY "Teachers create substitute requests" ON substitute_requests
  FOR INSERT WITH CHECK (requesting_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Teachers can see their calendar events and school-wide events
CREATE POLICY "Teachers see calendar events" ON calendar_events
  FOR SELECT USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    OR teacher_id IS NULL
  );
```


---

## 12. PLATFORM STUDIO CONFIG

### 12.1 Screen Registry Additions

```typescript
// platform-studio/src/config/screenRegistry.ts
export const TEACHER_SCREENS = {
  // ============================================
  // DYNAMIC SCREENS (13) - Widget-based layouts
  // ============================================

  // Sprint 2: Dashboard Core
  'teacher-home': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.hero-card', 'teacher.stats-grid', 'teacher.upcoming-classes', 'teacher.pending-grading', 'teacher.at-risk-students', 'teacher.quick-actions'],
  },

  // Sprint 3: Class Management
  'class-hub': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['class.cards', 'class.stats', 'class.recent-activity'],
  },
  'class-detail': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['class.roster', 'class.stats', 'class.recent-activity'],
  },
  'class-roster': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['class.roster-list', 'class.roster-stats'],
  },

  // Sprint 4: Attendance
  'attendance-reports': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['attendance.today-summary', 'attendance.trends', 'attendance.alerts'],
  },

  // Sprint 5: Grading
  'grading-hub': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['grading.stats', 'grading.pending-list', 'grading.recent', 'grading.rubric-templates'],
  },

  // Sprint 6: Analytics
  'analytics-home': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['analytics.class-performance', 'analytics.student-comparison', 'analytics.trends'],
  },

  // Sprint 7: Communication
  'communication-hub': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.messages-inbox', 'teacher.announcements', 'teacher.parent-contacts'],
  },

  // Sprint 8: Profile
  'profile-teacher': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
  },
  'notifications-teacher': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
  },

  // Sprint 9: Demo Showcase
  'doubts-inbox': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.doubts-inbox', 'teacher.ai-insights'],
  },
  'teacher-calendar': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.calendar', 'teacher.calendar-events'],
  },
  'leave-history': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.leave-history', 'teacher.leave-stats'],
  },

  // ============================================
  // FIXED SCREENS (11) - Custom components
  // ============================================

  // Sprint 1: Auth
  'login-teacher': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'LoginTeacherScreen',
  },
  'onboarding-teacher': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'OnboardingTeacherScreen',
  },

  // Sprint 4: Attendance
  'attendance-mark': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'AttendanceMarkScreen',
  },

  // Sprint 5: Assignments & Grading
  'assignment-create': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'AssignmentCreateScreen',
  },
  'assignment-detail': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'AssignmentDetailScreen',
  },
  'grade-submission': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'GradeSubmissionScreen',
  },

  // Sprint 6: Student Detail
  'student-detail-teacher': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'StudentDetailTeacherScreen',
  },

  // Sprint 9: Demo Showcase
  'doubt-answer': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'DoubtAnswerScreen',
  },
  'leave-request-create': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'LeaveRequestCreateScreen',
  },
  'calendar-event-create': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'CalendarEventCreateScreen',
  },
  'substitute-finder': {
    type: 'fixed',
    customization: 'none',
    allowed_roles: ['teacher'],
    component: 'SubstituteFinderScreen',
  },
};
```

### 12.2 Widget Registry Additions

```typescript
// platform-studio/src/config/widgetRegistry.ts
export const TEACHER_WIDGETS = {
  // Dashboard Widgets
  'teacher.hero-card': {
    name: 'Teacher Hero Card',
    category: 'profile',
    component: 'TeacherHeroWidget',
    defaultConfig: { greetingStyle: 'detailed', showTodayStats: true },
  },
  'teacher.stats-grid': {
    name: 'Teacher Stats Grid',
    category: 'stats',
    component: 'TeacherStatsWidget',
    defaultConfig: { columns: 2, showTrend: true },
  },
  'teacher.upcoming-classes': {
    name: 'Upcoming Classes',
    category: 'schedule',
    component: 'UpcomingClassesWidget',
    defaultConfig: { maxItems: 3, layoutStyle: 'list' },
  },
  'teacher.pending-grading': {
    name: 'Pending Grading',
    category: 'grading',
    component: 'PendingGradingWidget',
    defaultConfig: { maxItems: 5, showViewAll: true },
  },
  'teacher.at-risk-students': {
    name: 'At-Risk Students',
    category: 'alerts',
    component: 'AtRiskStudentsWidget',
    defaultConfig: { maxItems: 5, showContactParent: true },
  },
  'teacher.quick-actions': {
    name: 'Quick Actions',
    category: 'actions',
    component: 'TeacherQuickActionsWidget',
    defaultConfig: { columns: 4 },
  },
  // Class Widgets
  'class.cards': {
    name: 'Class Cards',
    category: 'classes',
    component: 'ClassCardsWidget',
    defaultConfig: { layoutStyle: 'cards', showTodayAttendance: true },
  },
  'class.roster': {
    name: 'Class Roster',
    category: 'classes',
    component: 'ClassRosterWidget',
    defaultConfig: { showSearch: true },
  },
  'class.stats': {
    name: 'Class Stats',
    category: 'stats',
    component: 'ClassStatsWidget',
    defaultConfig: { showPerformanceBreakdown: true },
  },
  'class.recent-activity': {
    name: 'Recent Activity',
    category: 'activity',
    component: 'ClassActivityWidget',
    defaultConfig: { maxItems: 5 },
  },
  // Attendance Widgets
  'attendance.today-summary': {
    name: 'Today Attendance',
    category: 'attendance',
    component: 'TodayAttendanceWidget',
  },
  'attendance.quick-mark': {
    name: 'Quick Mark',
    category: 'attendance',
    component: 'AttendanceQuickMarkWidget',
  },
  'attendance.alerts': {
    name: 'Attendance Alerts',
    category: 'alerts',
    component: 'AttendanceAlertsWidget',
    defaultConfig: { maxItems: 5 },
  },
  // Grading Widgets
  'grading.pending-list': {
    name: 'Pending Submissions',
    category: 'grading',
    component: 'PendingSubmissionsWidget',
    defaultConfig: { maxItems: 10 },
  },
  'grading.recent': {
    name: 'Recent Grades',
    category: 'grading',
    component: 'RecentGradesWidget',
    defaultConfig: { maxItems: 5 },
  },
  'grading.stats': {
    name: 'Grading Stats',
    category: 'stats',
    component: 'GradingStatsWidget',
  },
  // Analytics Widgets
  'analytics.class-performance': {
    name: 'Class Performance',
    category: 'analytics',
    component: 'ClassPerformanceWidget',
  },
  'analytics.student-comparison': {
    name: 'Student Comparison',
    category: 'analytics',
    component: 'StudentComparisonWidget',
    defaultConfig: { maxItems: 5 },
  },
  'analytics.trends': {
    name: 'Performance Trends',
    category: 'analytics',
    component: 'PerformanceTrendsWidget',
  },
  // Communication Widgets
  'teacher.messages-inbox': {
    name: 'Messages Inbox',
    category: 'communication',
    component: 'MessagesInboxWidget',
    defaultConfig: { maxItems: 5 },
  },
  'teacher.announcements': {
    name: 'Announcements',
    category: 'communication',
    component: 'AnnouncementsWidget',
    defaultConfig: { maxItems: 5 },
  },
  'teacher.parent-contacts': {
    name: 'Parent Contacts',
    category: 'communication',
    component: 'ParentContactsWidget',
    defaultConfig: { showSearch: true, maxItems: 5 },
  },

  // Sprint 9: Demo Showcase Widgets
  'teacher.doubts-inbox': {
    name: 'Student Doubts Inbox',
    category: 'doubts',
    component: 'DoubtsInboxWidget',
    defaultConfig: { maxItems: 5, showAiSuggestion: true },
  },
  'teacher.doubt-detail': {
    name: 'Doubt Detail',
    category: 'doubts',
    component: 'DoubtDetailWidget',
    defaultConfig: { showAiSuggestion: true },
  },
  'teacher.calendar': {
    name: 'Teacher Calendar',
    category: 'schedule',
    component: 'TeacherCalendarWidget',
    defaultConfig: { defaultView: 'month', showLegend: true },
  },
  'teacher.calendar-events': {
    name: 'Calendar Events',
    category: 'schedule',
    component: 'CalendarEventsWidget',
    defaultConfig: { maxItems: 5, showTime: true },
  },
  'teacher.substitute-request': {
    name: 'Substitute Request',
    category: 'leave',
    component: 'SubstituteRequestWidget',
  },
  'teacher.available-substitutes': {
    name: 'Available Substitutes',
    category: 'leave',
    component: 'AvailableSubstitutesWidget',
    defaultConfig: { showRating: true, maxItems: 5 },
  },
  'teacher.leave-request': {
    name: 'Leave Request',
    category: 'leave',
    component: 'LeaveRequestWidget',
  },
  'teacher.ai-insights': {
    name: 'AI Insights',
    category: 'ai',
    component: 'AIInsightsWidget',
    defaultConfig: { maxItems: 4, showActions: true },
  },
};
```

### 12.3 Navigation Config

```typescript
// Default teacher navigation tabs
export const TEACHER_NAVIGATION = {
  tabs: [
    { id: 'home', label: 'Home', icon: 'home', rootScreen: 'teacher-home', order: 1 },
    { id: 'classes', label: 'Classes', icon: 'school', rootScreen: 'class-hub', order: 2 },
    { id: 'grading', label: 'Grading', icon: 'clipboard-check', rootScreen: 'grading-hub', order: 3, badge: 'pending_count' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar', rootScreen: 'schedule-screen', order: 4 },
    { id: 'profile', label: 'Me', icon: 'account', rootScreen: 'profile-teacher', order: 5 },
  ],
};
```


---

## 13. TESTING CHECKLIST

### 13.1 Sprint-by-Sprint Testing

#### Sprint 1: Foundation + Auth
- [ ] Teacher login with valid credentials
- [ ] Teacher login with invalid credentials shows error
- [ ] Non-teacher users are rejected
- [ ] Inactive accounts are blocked
- [ ] First-time login shows onboarding
- [ ] Returning users go directly to dashboard
- [ ] Onboarding flow completes successfully
- [ ] Session persists after app restart

#### Sprint 2: Dashboard Core
- [ ] Dashboard loads with all 6 widgets
- [ ] Hero card shows correct greeting based on time
- [ ] Stats grid shows accurate counts
- [ ] Upcoming classes shows today's schedule
- [ ] Pending grading shows correct submissions
- [ ] At-risk students shows alerts
- [ ] Quick actions navigate correctly
- [ ] Pull-to-refresh updates data

#### Sprint 3: Class Management
- [ ] Class hub shows all assigned classes
- [ ] Class cards display correct student count
- [ ] Class cards show today's attendance percentage
- [ ] Tapping class navigates to detail
- [ ] Class roster shows all students
- [ ] Search filters students correctly
- [ ] Class stats show performance breakdown
- [ ] Recent activity shows latest events

#### Sprint 4: Attendance System
- [ ] Attendance mark screen loads with student list
- [ ] Can mark individual students present/absent/late
- [ ] Mark all present works correctly
- [ ] Submit saves attendance to database
- [ ] Today's summary shows correct counts
- [ ] Alerts display students with low attendance
- [ ] Tapping alert navigates to student detail
- [ ] Attendance persists after navigation

#### Sprint 5: Assignment & Grading
- [ ] Grading hub shows pending submissions
- [ ] Can create new assignment with all fields
- [ ] Assignment appears in class after creation
- [ ] Can grade individual submission
- [ ] Score and feedback save correctly
- [ ] Grading stats update after grading
- [ ] Recently graded shows latest grades
- [ ] Due date validation works

#### Sprint 6: Student Detail + Analytics
- [ ] Student detail shows complete profile
- [ ] Analytics home loads with all widgets
- [ ] Class performance chart renders correctly
- [ ] Period selector changes data
- [ ] Student comparison shows rankings
- [ ] Trends widget shows historical data
- [ ] At-risk count is accurate
- [ ] Export report generates file

#### Sprint 7: Communication
- [ ] Communication hub loads with all widgets
- [ ] Messages inbox shows recent messages
- [ ] Unread messages are highlighted
- [ ] Can compose and send new message
- [ ] Announcements list shows teacher's announcements
- [ ] Can create new announcement
- [ ] Parent contacts show phone and message options
- [ ] Call button opens phone dialer

#### Sprint 8: Profile + Polish
- [ ] Profile screen shows teacher info and stats
- [ ] Menu items navigate correctly
- [ ] Sign out works and clears session
- [ ] Notifications screen loads with filters
- [ ] Filter chips work correctly
- [ ] Tapping notification navigates to detail
- [ ] Unread notifications are highlighted
- [ ] All widgets have proper loading states
- [ ] All widgets have proper empty states
- [ ] All widgets have proper error states

#### Sprint 9: Demo Showcase Features
- [ ] Doubts Inbox shows pending student questions
- [ ] Doubts display with priority indicators (urgent/high/normal/low)
- [ ] AI suggestions show with confidence percentage
- [ ] Can use AI suggestion to populate answer
- [ ] Can edit AI suggestion before sending
- [ ] Answer submission updates doubt status
- [ ] Teacher Calendar displays monthly view correctly
- [ ] Calendar events show with correct type colors
- [ ] Can navigate between months
- [ ] Clicking date shows events for that day
- [ ] Substitute Finder shows available teachers
- [ ] Available substitutes show rating and free slots
- [ ] Can request substitute for a specific date
- [ ] Leave request status updates correctly
- [ ] AI Insights show actionable recommendations
- [ ] Insights display severity (critical/warning/info/success)
- [ ] Can take action on actionable insights
- [ ] All demo features work with cached data (offline)

### 13.2 Cross-Cutting Tests

#### Offline Support
- [ ] App shows offline indicator when disconnected
- [ ] Cached data displays when offline
- [ ] Attendance marking queues when offline
- [ ] Queued actions sync when back online

#### Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] List scrolling is smooth (60fps)
- [ ] No memory leaks on navigation
- [ ] Images load progressively

#### Accessibility
- [ ] All interactive elements have labels
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader navigation works
- [ ] Touch targets are 44x44 minimum

#### Branding
- [ ] Customer logo displays correctly
- [ ] Theme colors apply throughout
- [ ] Custom section names display
- [ ] Welcome message shows if configured

### 13.3 Demo Scenarios

1. **Teacher Login Flow**
   - Login → Onboarding (first time) → Dashboard

2. **Daily Attendance Flow**
   - Dashboard → Class Hub → Select Class → Mark Attendance → Submit

3. **Grading Flow**
   - Dashboard → Pending Grading → Select Submission → Grade → Submit

4. **Communication Flow**
   - Dashboard → Communication Hub → Compose Message → Send

5. **Analytics Review**
   - Dashboard → Analytics → View Class Performance → Compare Students

6. **AI-Powered Doubt Resolution (Demo Highlight)**
   - Dashboard → Doubts Inbox → Select Doubt → View AI Suggestion → Use/Edit Suggestion → Send Answer

7. **Substitute Request Flow (Demo Highlight)**
   - Profile → Request Leave → Select Date → View Available Substitutes → Request Substitute → Confirmation

8. **Calendar Management (Demo Highlight)**
   - Dashboard → Calendar Widget → Browse Months → View Events → Navigate to Event Detail

9. **At-Risk Student Intervention (Demo Highlight)**
   - Dashboard → AI Insights → View At-Risk Alert → Take Action → Contact Parent

---

## PHASE 1 SUMMARY

| Metric | Count |
|--------|-------|
| **Fixed Screens** | 11 |
| **Dynamic Screens** | 13 |
| **Widgets** | 32 |
| **Query Hooks** | 16 |
| **Mutation Hooks** | 9 |
| **DB Tables** | 12 |
| **Sprints** | 9 |

**Phase 1 delivers a complete demo-ready Teacher app with:**

**Fixed Screens (11):**
| Sprint | Screen | Purpose |
|--------|--------|---------|
| Sprint 1 | LoginTeacherScreen | Authentication form |
| Sprint 1 | OnboardingTeacherScreen | First-time setup wizard |
| Sprint 4 | AttendanceMarkScreen | Bulk attendance marking |
| Sprint 5 | AssignmentCreateScreen | Create new assignments |
| Sprint 5 | AssignmentDetailScreen | View/edit assignment |
| Sprint 5 | GradeSubmissionScreen | Grade student submissions |
| Sprint 6 | StudentDetailTeacherScreen | Student profile with actions |
| Sprint 9 | DoubtAnswerScreen | AI-assisted answer form |
| Sprint 9 | LeaveRequestCreateScreen | Leave application form |
| Sprint 9 | CalendarEventCreateScreen | Create calendar events |
| Sprint 9 | SubstituteFinderScreen | Find replacement teachers |

**Dynamic Screens (13):**
| Sprint | Screen | Widget Count |
|--------|--------|--------------|
| Sprint 2 | TeacherDashboardScreen | 6 widgets |
| Sprint 3 | ClassHubScreen | 3 widgets |
| Sprint 3 | ClassDetailScreen | 3 widgets |
| Sprint 3 | ClassRosterScreen | 2 widgets |
| Sprint 4 | AttendanceReportsScreen | 3 widgets |
| Sprint 5 | GradingHubScreen | 4 widgets |
| Sprint 6 | AnalyticsHomeScreen | 3 widgets |
| Sprint 7 | CommunicationHubScreen | 3 widgets |
| Sprint 8 | ProfileTeacherScreen | 2 widgets |
| Sprint 8 | NotificationsTeacherScreen | 2 widgets |
| Sprint 9 | DoubtsInboxScreen | 2 widgets |
| Sprint 9 | TeacherCalendarScreen | 2 widgets |
| Sprint 9 | LeaveHistoryScreen | 2 widgets |

**Core Features:**
- Full authentication flow with onboarding
- Dashboard with key metrics and quick actions
- Class management with student rosters
- Attendance marking with bulk actions and alerts
- Assignment creation with rubric builder
- Grading with quick scores and rubric scoring
- Student analytics with performance trends
- Parent communication hub
- Profile management and notifications

**Demo Showcase Features (Sprint 9):**
- AI-Powered Doubts Inbox with smart suggestions
- Doubt Answer Screen with AI suggestion integration
- Teacher Calendar with event creation
- Leave Request with substitute finder flow
- AI Insights with actionable recommendations

**Phase 2 (Later) will add:**
- Live Class System (WebRTC)
- Advanced AI Teaching Insights
- Voice Assessment
- Professional Development
- Automation Engine