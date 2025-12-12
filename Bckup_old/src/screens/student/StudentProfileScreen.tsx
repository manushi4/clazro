import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Button, Chip, T, Row } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import type { ProfileStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

// Types
 type Props = NativeStackScreenProps<ProfileStackParamList, 'StudentProfileScreen'>;

 type StudentProfile = {
  name: string;
  grade: string;
  board: string;
  student_id?: string;
  avatar_url?: string | null;
  attendance?: number;
  subjects: string[];
  examGoals: string[];
  email?: string;
  phone?: string;
  parent_name?: string;
  goal_description?: string;
  xp?: number;
  testsTaken?: number;
 };

 // Placeholder hook
 function useStudentProfile(): { data: StudentProfile; isLoading: boolean } {
  // TODO: integrate with Supabase
  return {
    isLoading: false,
    data: {
      name: 'Rahul Sharma',
      grade: 'Class 11',
      board: 'CBSE',
      student_id: 'STU-2025-DEMO',
      attendance: 92,
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      examGoals: ['JEE'],
      email: 'student@manushi.com',
      phone: '+91 98765 43210',
      parent_name: 'Anita Sharma',
      goal_description: 'Crack JEE 2026 with a top 1% rank.',
      xp: 1200,
      testsTaken: 8,
    },
  };
 }

 const Pill: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.pill}>
    <T variant="caption" color="onPrimary">
      {label}
    </T>
  </View>
 );

 const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <View style={styles.statCard}>
    <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
      {title}
    </T>
    <T variant="headline">{value}</T>
  </View>
 );

export default function StudentProfileScreen({ navigation }: Props) {
  const { data: profile } = useStudentProfile();

  React.useEffect(() => {
    trackScreenView('StudentProfileScreen');
  }, []);

  const initials = useMemo(() => {
    return profile.name
      .split(' ')
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profile.name]);

  const attendance = profile.attendance ?? 0;
  const streak = 10;
  const testsTaken = profile.testsTaken ?? 5;
  const xp = profile.xp ?? 1000;

  const handleUpdateGoal = () => Alert.alert('Update Goal', 'Goal update coming soon');
  const handleEditLearning = () => {
    trackAction('edit_onboarding', 'StudentProfileScreen');
    navigation.navigate('EditOnboardingScreen');
  };
  const handleShareProgress = () => {
    trackAction('share_progress', 'StudentProfileScreen');
    navigation.navigate('ShareProgressReportScreen');
  };
  const handleSettings = () => navigation.navigate('SettingsScreen');
  const handleHelp = () => navigation.navigate('HelpAndSupportScreen');

  const topRightAction = () => Alert.alert('Options', 'More options coming soon');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Row style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <T style={styles.icon}>←</T>
          </TouchableOpacity>
          <T variant="headline" style={styles.topTitle}>
            Profile
          </T>
          <TouchableOpacity onPress={topRightAction} accessibilityRole="button" accessibilityLabel="More">
            <T style={styles.icon}>⋮</T>
          </TouchableOpacity>
        </Row>

        <Card style={styles.heroCard}>
          <Row style={{ alignItems: 'center' }}>
            <View style={styles.avatar}>
              <T variant="title" color="onPrimary">
                {initials || '🙂'}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T variant="title" weight="bold" style={{ marginBottom: 4 }}>
                {profile.name}
              </T>
              <T variant="body" color="textSecondary">
                {profile.grade} • {profile.board}
              </T>
              {profile.student_id ? <Pill label={profile.student_id} /> : null}
            </View>
          </Row>
        </Card>

        <Row style={styles.statsRow}>
          <StatCard title="Attendance" value={`${attendance}%`} />
          <StatCard title="Streak" value={`${streak}d`} />
          <StatCard title="Tests Taken" value={`${testsTaken}`} />
          <StatCard title="XP" value={`${xp}`} />
        </Row>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Academic Info
          </T>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Board</T>
            <T variant="body">{profile.board}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Class / Grade</T>
            <T variant="body">{profile.grade}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Subjects</T>
            <T variant="body">{profile.subjects.join(', ')}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Exam Goals</T>
            <T variant="body">{profile.examGoals.join(', ')}</T>
          </Row>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Contact Info
          </T>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Email</T>
            <T variant="body">{profile.email || 'Not provided'}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Phone</T>
            <T variant="body">{profile.phone || 'Not provided'}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>Parent</T>
            <T variant="body">{profile.parent_name || 'Not provided'}</T>
          </Row>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Study Goal
          </T>
          <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
            {profile.goal_description || 'Set a goal to personalize your plan.'}
          </T>
          <Button variant="secondary" onPress={handleUpdateGoal} style={{ alignSelf: 'flex-start' }}>
            Update Goal
          </Button>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Actions
          </T>
          <Button variant="primary" onPress={handleEditLearning} style={styles.actionButton}>
            Edit learning profile
          </Button>
          <Button variant="secondary" onPress={handleShareProgress} style={styles.actionButton}>
            📤 Share Progress Report
          </Button>
          <Button variant="outline" onPress={handleSettings} style={styles.actionButton}>
            Settings
          </Button>
          <Button variant="outline" onPress={handleHelp} style={styles.actionButton}>
            Help & Support
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  topTitle: {
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  pill: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginHorizontal: 4,
    ...Shadows.resting,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  rowItem: {
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  rowLabel: {
    color: Colors.textSecondary,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
});
