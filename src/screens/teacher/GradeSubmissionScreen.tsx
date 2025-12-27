import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Text, TextInput, Button, Chip, Divider, Snackbar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubmissionDetailQuery } from '../../hooks/queries/teacher';
import { useGradeSubmission, useReturnSubmission } from '../../hooks/mutations/teacher';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { AppText } from '../../ui/components/AppText';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { useNetworkStatus } from '../../offline/networkStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'GradeSubmission'>;

const QUICK_FEEDBACK = [
  { key: 'excellent', icon: 'star' },
  { key: 'good', icon: 'thumb-up' },
  { key: 'average', icon: 'check' },
  { key: 'needsWork', icon: 'alert' },
  { key: 'incomplete', icon: 'close' },
];

export const GradeSubmissionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const isOnline = useNetworkStatus((s) => s.isOnline);
  const submissionId = route.params?.submissionId;

  // Form state
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [feedback, setFeedback] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Fetch submission details using dedicated query hook
  const { data: submission, isLoading, error, refetch, isRefetching } = useSubmissionDetailQuery(submissionId);

  // Mutations
  const gradeSubmission = useGradeSubmission();
  const returnSubmission = useReturnSubmission();

  // Initialize form with existing data
  useEffect(() => {
    if (submission) {
      setMaxScore(submission.assignment?.max_score || submission.max_score || 100);
      if (submission.score !== null && submission.score !== undefined) {
        setScore(submission.score);
      }
      if (submission.feedback_en) {
        setFeedback(submission.feedback_en);
      }
    }
  }, [submission]);

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const getGradeLetter = useCallback((pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  }, []);

  const getGradeColor = useCallback((pct: number) => {
    if (pct >= 80) return colors.success || '#4CAF50';
    if (pct >= 60) return colors.primary;
    if (pct >= 40) return colors.warning || '#FF9800';
    return colors.error;
  }, [colors]);

  const handleQuickFeedback = (key: string) => {
    const feedbackText = t(`screens.gradeSubmission.quickFeedback.${key}`, {
      defaultValue: getFallbackFeedback(key)
    });
    setFeedback(prev => prev ? `${prev}\n${feedbackText}` : feedbackText);
  };

  const getFallbackFeedback = (key: string) => {
    const fallbacks: Record<string, string> = {
      excellent: 'Excellent work! Keep it up.',
      good: 'Good effort. Minor improvements needed.',
      average: 'Satisfactory. Review the concepts again.',
      needsWork: 'Needs improvement. Please revise.',
      incomplete: 'Incomplete submission. Please resubmit.',
    };
    return fallbacks[key] || '';
  };

  const handleSubmitGrade = async () => {
    if (!isOnline) {
      setSnackbarMessage(t('common:errors.offline', { defaultValue: 'No internet connection' }));
      setSnackbarVisible(true);
      return;
    }

    try {
      await gradeSubmission.mutateAsync({
        submissionId,
        score,
        maxScore,
        feedback_en: feedback || undefined,
        grade_letter: getGradeLetter(percentage),
      });

      setSnackbarMessage(t('screens.gradeSubmission.messages.gradeSuccess', { defaultValue: 'Grade submitted successfully!' }));
      setSnackbarVisible(true);

      setTimeout(() => navigation.goBack(), 1000);
    } catch (err) {
      setSnackbarMessage(t('screens.gradeSubmission.messages.gradeFailed', { defaultValue: 'Failed to submit grade' }));
      setSnackbarVisible(true);
    }
  };

  const handleReturn = async (requiresResubmit: boolean) => {
    if (!isOnline) {
      setSnackbarMessage(t('common:errors.offline', { defaultValue: 'No internet connection' }));
      setSnackbarVisible(true);
      return;
    }

    try {
      await returnSubmission.mutateAsync({
        submissionId,
        feedback_en: feedback || undefined,
        requiresResubmit,
      });

      const message = requiresResubmit
        ? t('screens.gradeSubmission.messages.returnedResubmit', { defaultValue: 'Returned for resubmission' })
        : t('screens.gradeSubmission.messages.returned', { defaultValue: 'Returned to student' });

      setSnackbarMessage(message);
      setSnackbarVisible(true);

      setTimeout(() => navigation.goBack(), 1000);
    } catch (err) {
      setSnackbarMessage(t('screens.gradeSubmission.messages.returnFailed', { defaultValue: 'Failed to return submission' }));
      setSnackbarVisible(true);
    }
  };

  // Get student display name
  const getStudentName = () => {
    if (submission?.student) {
      const { first_name, last_name } = submission.student;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
    }
    // Fallback to student ID
    return t('screens.gradeSubmission.labels.student', {
      defaultValue: 'Student',
      id: submission?.student_user_id?.split('-')[1] || '1'
    });
  };

  // ==================== 1. LOADING STATE ====================
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('screens.gradeSubmission.states.loading', { defaultValue: 'Loading submission...' })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== 2. ERROR STATE ====================
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t('common:errors.title', { defaultValue: 'Error' })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t('screens.gradeSubmission.states.error', { defaultValue: 'Failed to load submission' })}
          </AppText>
          <Button mode="contained" onPress={() => refetch()} style={styles.retryBtn}>
            {t('common:actions.retry', { defaultValue: 'Retry' })}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== 3. EMPTY STATE ====================
  if (!submission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Icon name="file-document-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('screens.gradeSubmission.states.empty', { defaultValue: 'Submission not found' })}
          </AppText>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.retryBtn}>
            {t('common:actions.goBack', { defaultValue: 'Go Back' })}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== 4. SUCCESS STATE ====================
  const gradeLetter = getGradeLetter(percentage);
  const gradeColor = getGradeColor(percentage);
  const assignmentTitle = getLocalizedField(submission.assignment, 'title') ||
    t('screens.gradeSubmission.labels.assignment', { defaultValue: 'Assignment' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('screens.gradeSubmission.title', { defaultValue: 'Grade Submission' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
          }
        >
          {/* Student Info */}
          <View style={[styles.studentCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
              <Icon name="account" size={28} color={colors.primary} />
            </View>
            <View style={styles.studentInfo}>
              <Text style={[styles.studentName, { color: colors.onSurface }]}>
                {getStudentName()}
              </Text>
              <Text style={[styles.assignmentName, { color: colors.onSurfaceVariant }]}>
                {assignmentTitle}
              </Text>
              <View style={styles.statusRow}>
                {submission.is_late && (
                  <Chip icon="clock-alert" mode="flat" style={{ backgroundColor: `${colors.warning || '#FF9800'}20` }}>
                    <Text style={{ color: colors.warning || '#FF9800' }}>
                      {t('screens.gradeSubmission.labels.late', { defaultValue: 'Late' })}
                    </Text>
                  </Chip>
                )}
                <Text style={[styles.submittedDate, { color: colors.onSurfaceVariant }]}>
                  {t('screens.gradeSubmission.labels.submitted', { defaultValue: 'Submitted' })}: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Score Section */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('screens.gradeSubmission.sections.score', { defaultValue: 'Score' })}
          </Text>

          <View style={[styles.scoreCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
            {/* Grade Circle */}
            <View style={[styles.gradeCircle, { backgroundColor: `${gradeColor}20`, borderColor: gradeColor }]}>
              <Text style={[styles.gradeLetter, { color: gradeColor }]}>{gradeLetter}</Text>
              <Text style={[styles.gradePercent, { color: gradeColor }]}>{percentage}%</Text>
            </View>

            {/* Score Input */}
            <View style={styles.scoreInputRow}>
              <TextInput
                mode="outlined"
                label={t('screens.gradeSubmission.form.score', { defaultValue: 'Score' })}
                value={String(score)}
                onChangeText={(val) => setScore(parseInt(val) || 0)}
                keyboardType="numeric"
                style={styles.scoreInput}
              />
              <Text style={[styles.scoreDivider, { color: colors.onSurfaceVariant }]}>/</Text>
              <TextInput
                mode="outlined"
                label={t('screens.gradeSubmission.form.max', { defaultValue: 'Max' })}
                value={String(maxScore)}
                onChangeText={(val) => setMaxScore(parseInt(val) || 100)}
                keyboardType="numeric"
                style={styles.scoreInput}
                disabled
              />
            </View>

            {/* Quick Score Buttons */}
            <View style={styles.quickScores}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  onPress={() => setScore(Math.round((pct / 100) * maxScore))}
                  style={[
                    styles.quickScoreBtn,
                    {
                      backgroundColor: score === Math.round((pct / 100) * maxScore) ? colors.primary : colors.surface,
                      borderColor: colors.outline,
                    }
                  ]}
                >
                  <Text style={{ color: score === Math.round((pct / 100) * maxScore) ? colors.onPrimary : colors.onSurface }}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Feedback Section */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('screens.gradeSubmission.sections.feedback', { defaultValue: 'Feedback' })}
          </Text>

          {/* Quick Feedback */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFeedbackScroll}>
            {QUICK_FEEDBACK.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleQuickFeedback(item.key)}
                style={[styles.quickFeedbackBtn, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
              >
                <Icon name={item.icon} size={16} color={colors.primary} />
                <Text style={[styles.quickFeedbackText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {t(`screens.gradeSubmission.quickFeedback.${item.key}Short`, {
                    defaultValue: item.key.charAt(0).toUpperCase() + item.key.slice(1)
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            mode="outlined"
            label={t('screens.gradeSubmission.form.feedback', { defaultValue: 'Add feedback (optional)' })}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
          />

          <View style={styles.spacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actions, { borderTopColor: colors.outline }]}>
          <Button
            mode="outlined"
            onPress={() => handleReturn(true)}
            loading={returnSubmission.isPending}
            disabled={gradeSubmission.isPending || !isOnline}
            icon="undo"
            style={styles.actionBtn}
            textColor={colors.warning || '#FF9800'}
          >
            {t('screens.gradeSubmission.actions.return', { defaultValue: 'Return' })}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmitGrade}
            loading={gradeSubmission.isPending}
            disabled={returnSubmission.isPending || !isOnline}
            icon="check"
            style={[styles.actionBtn, { flex: 2 }]}
          >
            {t('screens.gradeSubmission.actions.submit', { defaultValue: 'Submit Grade' })}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  errorMessage: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, marginTop: 16, textAlign: 'center' },
  retryBtn: { marginTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600' },
  assignmentName: { fontSize: 13, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  submittedDate: { fontSize: 12 },
  divider: { marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  scoreCard: { padding: 16, alignItems: 'center' },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gradeLetter: { fontSize: 28, fontWeight: '700' },
  gradePercent: { fontSize: 14, fontWeight: '500' },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  scoreInput: { width: 80 },
  scoreDivider: { fontSize: 24 },
  quickScores: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  quickScoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickFeedbackScroll: { marginBottom: 12 },
  quickFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  quickFeedbackText: { fontSize: 12 },
  feedbackInput: { marginBottom: 16 },
  spacer: { height: 100 },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: { flex: 1 },
});

export default GradeSubmissionScreen;
