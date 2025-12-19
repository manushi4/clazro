# 👩‍🏫 TEACHER PHASE 1 - DEMO-READY IMPLEMENTATION GUIDE

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Teacher Role - Phase 1 (Demo Ready)
> **Sprints:** 8 Sprints
> **Total:** 4 Fixed Screens, 13 Dynamic Screens, 24 Widgets

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Sprint 1: Foundation + Auth](#2-sprint-1-foundation--auth)
3. [Sprint 2: Dashboard Core](#3-sprint-2-dashboard-core)
4. [Sprint 3: Class Management](#4-sprint-3-class-management)
5. [Sprint 4: Attendance System](#5-sprint-4-attendance-system)
6. [Sprint 5: Assignment & Grading](#6-sprint-5-assignment--grading)
7. [Sprint 6: Student Detail + Analytics](#7-sprint-6-student-detail--analytics)
8. [Sprint 7: Communication](#8-sprint-7-communication)
9. [Sprint 8: Profile + Polish](#9-sprint-8-profile--polish)
10. [Database Schema](#10-database-schema)
11. [Platform Studio Config](#11-platform-studio-config)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. OVERVIEW

### 1.1 Phase 1 Scope Summary

| Component | Count |
|-----------|-------|
| Fixed Screens | 4 |
| Dynamic Screens | 13 |
| Widgets | 24 |
| Query Hooks | 12 |
| Mutation Hooks | 6 |
| DB Tables | 8 |

### 1.2 File Structure

```
src/
├── screens/teacher/
│   ├── index.ts
│   ├── LoginTeacherScreen.tsx        # Sprint 1
│   ├── OnboardingTeacherScreen.tsx   # Sprint 1
│   ├── TeacherDashboardScreen.tsx    # Sprint 2
│   ├── ClassHubScreen.tsx            # Sprint 3
│   ├── ClassDetailScreen.tsx         # Sprint 3
│   ├── ClassRosterScreen.tsx         # Sprint 3
│   ├── AttendanceMarkScreen.tsx      # Sprint 4
│   ├── AttendanceReportsScreen.tsx   # Sprint 4
│   ├── GradingHubScreen.tsx          # Sprint 5
│   ├── AssignmentCreateScreen.tsx    # Sprint 5
│   ├── GradeSubmissionScreen.tsx     # Sprint 5
│   ├── StudentDetailTeacherScreen.tsx # Sprint 6
│   ├── AnalyticsHomeScreen.tsx       # Sprint 6
│   ├── CommunicationHubScreen.tsx    # Sprint 7
│   ├── ProfileTeacherScreen.tsx      # Sprint 8
│   └── NotificationsTeacherScreen.tsx # Sprint 8
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
│   └── ParentContactsWidget.tsx      # Sprint 7
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
│   └── useTeacherMessagesQuery.ts    # Sprint 7
└── hooks/mutations/teacher/
    ├── index.ts
    ├── useTeacherAuth.ts             # Sprint 1
    ├── useMarkAttendance.ts          # Sprint 4
    ├── useBulkMarkAttendance.ts      # Sprint 4
    ├── useCreateAssignment.ts        # Sprint 5
    ├── useGradeSubmission.ts         # Sprint 5
    └── useSendMessage.ts             # Sprint 7
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

### 2.2 LoginTeacherScreen.tsx

```typescript
// src/screens/teacher/LoginTeacherScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useBranding } from '@/context/BrandingContext';
import { useTeacherAuth } from '@/hooks/mutations/teacher';

export const LoginTeacherScreen: React.FC = ({ navigation }) => {
  const theme = useAppTheme();
  const { branding } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useTeacherAuth();

  const handleLogin = () => {
    login({ email, password }, {
      onSuccess: (data) => {
        if (data.isFirstLogin) {
          navigation.replace('onboarding-teacher');
        } else {
          navigation.replace('teacher-home');
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.card} elevation={2}>
        {branding?.logoUrl && (
          <Image source={{ uri: branding.logoUrl }} style={styles.logo} />
        )}
        <Text variant="headlineMedium" style={styles.title}>
          Teacher Login
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {branding?.appName || 'EduPlatform'}
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isPending}
          disabled={isPending || !email || !password}
          style={styles.button}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('forgot-password')}
          style={styles.forgotButton}
        >
          Forgot Password?
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 16 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  input: { marginBottom: 16 },
  error: { marginBottom: 16, textAlign: 'center' },
  button: { marginTop: 8 },
  forgotButton: { marginTop: 16 },
});
```

### 2.3 OnboardingTeacherScreen.tsx

```typescript
// src/screens/teacher/OnboardingTeacherScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ProgressBar, Surface, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';

type OnboardingStep = 'welcome' | 'classes' | 'features' | 'complete';

export const OnboardingTeacherScreen: React.FC = ({ navigation }) => {
  const theme = useAppTheme();
  const [step, setStep] = useState<OnboardingStep>('welcome');

  const steps: OnboardingStep[] = ['welcome', 'classes', 'features', 'complete'];
  const currentIndex = steps.indexOf(step);
  const progress = (currentIndex + 1) / steps.length;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    } else {
      navigation.replace('teacher-home');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Icon name="hand-wave" size={80} color={theme.colors.primary} />
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Welcome, Teacher!
            </Text>
            <Text variant="bodyLarge" style={styles.stepDescription}>
              Let's get you set up to manage your classes effectively.
            </Text>
          </View>
        );
      case 'classes':
        return (
          <View style={styles.stepContent}>
            <Icon name="google-classroom" size={80} color={theme.colors.primary} />
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Your Classes
            </Text>
            <Text variant="bodyLarge" style={styles.stepDescription}>
              You've been assigned to the following classes. You can manage attendance, assignments, and grades for each.
            </Text>
            <View style={styles.classChips}>
              <Chip style={styles.chip}>Class 10-A</Chip>
              <Chip style={styles.chip}>Class 10-B</Chip>
              <Chip style={styles.chip}>Class 9-A</Chip>
            </View>
          </View>
        );
      case 'features':
        return (
          <View style={styles.stepContent}>
            <Icon name="star-four-points" size={80} color={theme.colors.primary} />
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Key Features
            </Text>
            <View style={styles.featureList}>
              <FeatureItem icon="clipboard-check" text="Mark attendance quickly" />
              <FeatureItem icon="file-document-edit" text="Create assignments & tests" />
              <FeatureItem icon="chart-line" text="Track student progress" />
              <FeatureItem icon="message" text="Communicate with parents" />
            </View>
          </View>
        );
      case 'complete':
        return (
          <View style={styles.stepContent}>
            <Icon name="check-circle" size={80} color="#4CAF50" />
            <Text variant="headlineMedium" style={styles.stepTitle}>
              You're All Set!
            </Text>
            <Text variant="bodyLarge" style={styles.stepDescription}>
              Start managing your classes and helping students succeed.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProgressBar progress={progress} style={styles.progressBar} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStep()}
      </ScrollView>
      <View style={styles.footer}>
        <Button mode="contained" onPress={handleNext} style={styles.nextButton}>
          {step === 'complete' ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.featureItem}>
      <Icon name={icon} size={24} color={theme.colors.primary} />
      <Text variant="bodyMedium" style={styles.featureText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { margin: 16 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  stepContent: { alignItems: 'center' },
  stepTitle: { marginTop: 24, marginBottom: 12, textAlign: 'center' },
  stepDescription: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 16 },
  classChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24, gap: 8 },
  chip: { marginBottom: 8 },
  featureList: { marginTop: 24, width: '100%' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  featureText: { flex: 1 },
  footer: { padding: 16 },
  nextButton: { width: '100%' },
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
| Dynamic Screen | `class-hub` | 🔲 |
| Dynamic Screen | `class-detail` | 🔲 |
| Dynamic Screen | `class-roster` | 🔲 |
| Widget | `class.cards` | 🔲 |
| Widget | `class.roster` | 🔲 |
| Widget | `class.stats` | 🔲 |
| Widget | `class.recent-activity` | 🔲 |
| Hook | `useTeacherClassesQuery` | 🔲 |
| Hook | `useClassRosterQuery` | 🔲 |
| Hook | `useClassStatsQuery` | 🔲 |

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
| Dynamic Screen | `attendance-mark` | 🔲 |
| Dynamic Screen | `attendance-reports` | 🔲 |
| Widget | `attendance.today-summary` | 🔲 |
| Widget | `attendance.quick-mark` | 🔲 |
| Widget | `attendance.alerts` | 🔲 |
| Widget | `attendance.trends` | 🔲 |
| Hook | `useAttendanceRecordsQuery` | 🔲 |
| Hook | `useMarkAttendance` | 🔲 |
| Hook | `useBulkMarkAttendance` | 🔲 |
| DB Table | `attendance_records` | 🔲 |
| DB Table | `attendance_alerts` | 🔲 |


### 5.2 TodayAttendanceWidget.tsx

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
| Dynamic Screen | `assignment-create` | 🔲 |
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

### 6.7 Sprint 5 Checkpoint

✅ **Test Criteria:**
- [ ] Grading hub shows pending submissions
- [ ] Can create new assignment with all fields
- [ ] Assignment appears in class after creation
- [ ] Can grade individual submission
- [ ] Score and feedback save correctly
- [ ] Grading stats update after grading
- [ ] Recently graded shows latest grades


---

## 7. SPRINT 6: STUDENT DETAIL + ANALYTICS

### 7.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `student-detail-teacher` | 🔲 |
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

### 7.6 Sprint 6 Checkpoint

✅ **Test Criteria:**
- [ ] Student detail shows complete profile
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

## 10. DATABASE SCHEMA

### 10.1 Core Tables for Phase 1

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

### 10.2 RLS Policies

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
```


---

## 11. PLATFORM STUDIO CONFIG

### 11.1 Screen Registry Additions

```typescript
// platform-studio/src/config/screenRegistry.ts
export const TEACHER_SCREENS = {
  // Phase 1 Screens
  'teacher-home': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.hero-card', 'teacher.stats-grid', 'teacher.upcoming-classes', 'teacher.pending-grading', 'teacher.at-risk-students', 'teacher.quick-actions'],
  },
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
  'grading-hub': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['grading.stats', 'grading.pending-list', 'grading.recent', 'grading.rubric-templates'],
  },
  'attendance-mark': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['attendance.quick-mark', 'attendance.today-summary'],
  },
  'attendance-reports': {
    type: 'dynamic',
    customization: 'medium',
    allowed_roles: ['teacher'],
    default_widgets: ['attendance.today-summary', 'attendance.trends', 'attendance.alerts'],
  },
  'analytics-home': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['analytics.class-performance', 'analytics.student-comparison', 'analytics.trends'],
  },
  'communication-hub': {
    type: 'dynamic',
    customization: 'full',
    allowed_roles: ['teacher'],
    default_widgets: ['teacher.messages-inbox', 'teacher.announcements', 'teacher.parent-contacts'],
  },
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
};
```

### 11.2 Widget Registry Additions

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
};
```

### 11.3 Navigation Config

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

## 12. TESTING CHECKLIST

### 12.1 Sprint-by-Sprint Testing

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

### 12.2 Cross-Cutting Tests

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

### 12.3 Demo Scenarios

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

---

## 📊 PHASE 1 SUMMARY

| Metric | Count |
|--------|-------|
| **Fixed Screens** | 4 |
| **Dynamic Screens** | 13 |
| **Widgets** | 24 |
| **Query Hooks** | 12 |
| **Mutation Hooks** | 6 |
| **DB Tables** | 8 |
| **Sprints** | 8 |

**Phase 1 delivers a complete demo-ready Teacher app with:**
- Full authentication flow
- Dashboard with key metrics
- Class management
- Attendance marking
- Assignment creation and grading
- Student analytics
- Parent communication
- Profile management

**Phase 2 (Later) will add:**
- Live Class System (WebRTC)
- AI Teaching Insights
- Voice Assessment
- Professional Development
- Automation Engine