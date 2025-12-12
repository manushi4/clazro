/**
 * UpcomingExamsScreen - View all upcoming assessments and exam schedule
 *
 * Features:
 * - Upcoming exams list with countdown timers
 * - Filter by exam type (quiz, test, midterm, final, assignment)
 * - Filter by subject
 * - Past exams section with results
 * - Color-coded urgency (green/yellow/orange/red)
 * - Sort by date
 * - Study preparation status
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { ProgressBar } from 'react-native-paper';

type Props = NativeStackScreenProps<ParentStackParamList, 'UpcomingExams'>;

type ExamType = 'all' | 'quiz' | 'test' | 'midterm' | 'final' | 'assignment';

interface GradeRecord {
  id: string;
  student_id: string;
  subject_code: string;
  batch_id: string;
  exam_type: string;
  exam_name: string;
  max_marks: number;
  obtained_marks: number;
  percentage: number | null;
  grade: string | null;
  remarks: string | null;
  exam_date: string | null;  // DATE type
  created_at: string;
}

const UpcomingExamsScreen: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params || {};
  const [examTypeFilter, setExamTypeFilter] = useState<ExamType>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showPastExams, setShowPastExams] = useState(false);

  useEffect(() => {
    trackScreenView('UpcomingExams', { from: 'AcademicsDetail', studentId });
  }, [studentId]);

  // Fetch upcoming exams (exam_date >= today)
  const {
    data: upcomingExams = [],
    isLoading: loadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ['upcoming_exams', studentId],
    queryFn: async () => {
      console.log(`🔍 [UpcomingExams] Fetching upcoming exams for student ${studentId}`);
      const today = new Date().toISOString().split('T')[0];
      console.log(`📅 [UpcomingExams] Today's date: ${today}`);

      const { data, error } = await supabase
        .from('gradebook')
        .select('*')
        .eq('student_id', studentId)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true });

      if (error) {
        console.error('❌ [UpcomingExams] Upcoming exams error:', error);
        throw error;
      }

      console.log('✅ [UpcomingExams] Loaded', data?.length || 0, 'upcoming exams');
      if (data && data.length > 0) {
        console.log('📋 [UpcomingExams] First exam:', data[0].exam_name, 'on', data[0].exam_date);
      } else {
        console.log('⚠️ [UpcomingExams] No upcoming exams found. Query: student_id =', studentId, ', exam_date >=', today);
      }
      return (data || []) as GradeRecord[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!studentId,
  });

  // Fetch past exams (exam_date < today)
  const {
    data: pastExams = [],
    isLoading: loadingPast,
  } = useQuery({
    queryKey: ['past_exams', studentId],
    queryFn: async () => {
      console.log(`🔍 [UpcomingExams] Fetching past exams for student ${studentId}`);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('gradebook')
        .select('*')
        .eq('student_id', studentId)
        .lt('exam_date', today)
        .order('exam_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ [UpcomingExams] Past exams error:', error);
        throw error;
      }

      console.log('✅ [UpcomingExams] Loaded', data?.length || 0, 'past exams');
      return (data || []) as GradeRecord[];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!studentId && showPastExams,
  });

  // Get unique subjects for filtering
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(upcomingExams.map(e => e.subject_code));
    return ['all', ...Array.from(uniqueSubjects).sort()];
  }, [upcomingExams]);

  // Helper: Calculate days remaining
  const getDaysRemaining = (examDate: string | null): number | null => {
    if (!examDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(examDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter exams by type and subject
  const filteredExams = useMemo(() => {
    let filtered = upcomingExams;

    // Filter by exam type
    if (examTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.exam_type === examTypeFilter);
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(e => e.subject_code === subjectFilter);
    }

    return filtered;
  }, [upcomingExams, examTypeFilter, subjectFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalUpcoming = upcomingExams.length;
    const totalPast = pastExams.length;

    // Count exams by urgency
    const thisWeek = upcomingExams.filter(e => {
      if (!e.exam_date) return false;
      const daysRemaining = getDaysRemaining(e.exam_date);
      return daysRemaining !== null && daysRemaining <= 7;
    }).length;

    const thisMonth = upcomingExams.filter(e => {
      if (!e.exam_date) return false;
      const daysRemaining = getDaysRemaining(e.exam_date);
      return daysRemaining !== null && daysRemaining <= 30;
    }).length;

    // Next exam
    const nextExam = upcomingExams[0] || null; // Already sorted by date ascending

    return {
      totalUpcoming,
      totalPast,
      thisWeek,
      thisMonth,
      nextExam,
    };
  }, [upcomingExams, pastExams]);

  // Helper: Get urgency color based on days remaining
  const getUrgencyColor = (daysRemaining: number | null): string => {
    if (daysRemaining === null) return Colors.textSecondary;
    if (daysRemaining === 0) return Colors.error; // Today
    if (daysRemaining < 0) return Colors.error; // Overdue
    if (daysRemaining <= 2) return '#FF9800'; // Orange - 1-2 days
    if (daysRemaining <= 6) return '#FFC107'; // Yellow - 3-6 days
    return Colors.success; // Green - 7+ days
  };

  // Helper: Format countdown text
  const getCountdownText = (examDate: string | null): string => {
    if (!examDate) return 'Date not set';
    const daysRemaining = getDaysRemaining(examDate);
    if (daysRemaining === null) return 'Date not set';
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days ago`;
    if (daysRemaining === 0) return 'Exam today!';
    if (daysRemaining === 1) return 'Exam tomorrow';
    return `In ${daysRemaining} days`;
  };

  // Helper: Get exam type badge color
  const getExamTypeBadgeColor = (examType: string): string => {
    const colors: { [key: string]: string } = {
      quiz: '#4CAF50',
      test: '#2196F3',
      midterm: '#FF9800',
      final: '#F44336',
      assignment: '#9C27B0',
    };
    return colors[examType] || Colors.primary;
  };

  // Helper: Get subject color (consistent with SubjectDetailScreen)
  const getSubjectColor = (subject: string): string => {
    const colors: { [key: string]: string } = {
      Mathematics: '#FF6B6B',
      'Math': '#FF6B6B',
      English: '#4ECDC4',
      Science: '#95E1D3',
      'Social Studies': '#FFD93D',
      'Social Science': '#FFD93D',
      Hindi: '#F38181',
      Computer: '#AA96DA',
    };
    return colors[subject] || Colors.primary;
  };

  const isLoading = loadingUpcoming || (showPastExams && loadingPast);
  const error = upcomingError;

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load exams' : null}
      empty={!isLoading && upcomingExams.length === 0}
      emptyBody={studentId ? "No upcoming exams scheduled. Great! 🎉" : "Please select a student to view exams"}
      onRetry={refetchUpcoming}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header Card with Summary Stats */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Upcoming Exams
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              View and prepare for upcoming assessments
            </T>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.sm }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.primary }}>
                  {stats.totalUpcoming}
                </T>
                <T variant="caption" color="textSecondary">Upcoming</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: '#FFC107' }}>
                  {stats.thisWeek}
                </T>
                <T variant="caption" color="textSecondary">This Week</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: '#4CAF50' }}>
                  {stats.thisMonth}
                </T>
                <T variant="caption" color="textSecondary">This Month</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.textSecondary }}>
                  {stats.totalPast}
                </T>
                <T variant="caption" color="textSecondary">Completed</T>
              </View>
            </Row>

            {/* Next Exam Highlight */}
            {stats.nextExam && (
              <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 8 }}>
                <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                  Next Exam:
                </T>
                <Row spaceBetween centerV>
                  <T variant="body" weight="semiBold">
                    {stats.nextExam.exam_name}
                  </T>
                  <View style={{ backgroundColor: getUrgencyColor(getDaysRemaining(stats.nextExam.exam_date)), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <T variant="caption" style={{ color: '#FFFFFF' }}>
                      {getCountdownText(stats.nextExam.exam_date)}
                    </T>
                  </View>
                </Row>
                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                  {stats.nextExam.subject_code} • {stats.nextExam.exam_type}
                </T>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Filter Controls */}
        {upcomingExams.length > 0 && (
          <FilterDropdowns
            filters={[
              {
                label: 'Type',
                value: examTypeFilter,
                options: [
                  { value: 'all', label: 'All Types' },
                  { value: 'quiz', label: 'Quiz' },
                  { value: 'test', label: 'Test' },
                  { value: 'midterm', label: 'Midterm' },
                  { value: 'final', label: 'Final' },
                  { value: 'assignment', label: 'Assignment' },
                ],
                onChange: (value) => {
                  trackAction('filter_exam_type', 'UpcomingExams', { type: value });
                  setExamTypeFilter(value as ExamType);
                },
              },
              ...(subjects.length > 2 ? [{
                label: 'Subject',
                value: subjectFilter,
                options: subjects.map(s => ({ value: s, label: s === 'all' ? 'All Subjects' : s })),
                onChange: (value) => {
                  trackAction('filter_subject', 'UpcomingExams', { subject: value });
                  setSubjectFilter(value);
                },
              }] : []),
            ]}
            activeFilters={[
              examTypeFilter !== 'all' && { label: examTypeFilter.charAt(0).toUpperCase() + examTypeFilter.slice(1), variant: 'info' as const },
              subjectFilter !== 'all' && { label: subjectFilter, variant: 'success' as const },
            ].filter(Boolean) as any}
            onClearAll={() => {
              setExamTypeFilter('all');
              setSubjectFilter('all');
              trackAction('clear_filters', 'UpcomingExams');
            }}
          />
        )}

        {/* Upcoming Exams List */}
        {filteredExams.length > 0 ? (
          <Col gap="sm">
            {filteredExams.map(exam => {
              const daysRemaining = getDaysRemaining(exam.exam_date);
              const urgencyColor = getUrgencyColor(daysRemaining);
              const countdownText = getCountdownText(exam.exam_date);

              return (
                <Card key={exam.id} variant="elevated">
                  <CardContent>
                    {/* Header Row */}
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <Row centerV gap="xs">
                        <View style={{ backgroundColor: getExamTypeBadgeColor(exam.exam_type), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <T variant="caption" style={{ color: '#FFFFFF' }}>
                            {exam.exam_type || 'Exam'}
                          </T>
                        </View>
                        <View style={{ backgroundColor: getSubjectColor(exam.subject_code), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <T variant="caption" style={{ color: '#FFFFFF' }}>
                            {exam.subject_code}
                          </T>
                        </View>
                      </Row>
                      <View style={{ backgroundColor: urgencyColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                        <T variant="caption" style={{ color: '#FFFFFF' }}>
                          {countdownText}
                        </T>
                      </View>
                    </Row>

                    {/* Exam Name */}
                    <T variant="body" weight="bold" style={{ fontSize: 16, marginBottom: Spacing.xs }}>
                      {exam.exam_name}
                    </T>

                    {/* Details Row */}
                    <Row spaceBetween style={{ marginBottom: Spacing.sm }}>
                      <Col gap="xs">
                        <T variant="caption" color="textSecondary">
                          📅 Date: {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Not set'}
                        </T>
                        <T variant="caption" color="textSecondary">
                          📊 Max Marks: {exam.max_marks}
                        </T>
                      </Col>
                    </Row>

                    {/* Progress Bar - Days Remaining Visual */}
                    {daysRemaining !== null && daysRemaining >= 0 && (
                      <View style={{ marginBottom: Spacing.sm }}>
                        <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                          Time Remaining:
                        </T>
                        <ProgressBar
                          progress={daysRemaining >= 30 ? 1 : (30 - daysRemaining) / 30}
                          color={urgencyColor}
                          style={{ height: 6, borderRadius: 3 }}
                        />
                      </View>
                    )}

                    {/* Actions */}
                    <Row style={{ gap: Spacing.xs }}>
                      <Button
                        variant="primary"
                        onPress={() => {
                          trackAction('view_subject_from_exam', 'UpcomingExams', {
                            subject: exam.subject_code,
                            studentId
                          });
                          safeNavigate('SubjectDetail', {
                            studentId: studentId!,
                            subject: exam.subject_code,
                          });
                        }}
                        style={{ flex: 1 }}
                      >
                        View Subject
                      </Button>
                    </Row>

                    {/* Remarks if available */}
                    {exam.remarks && (
                      <View style={{ marginTop: Spacing.sm, padding: Spacing.xs, backgroundColor: Colors.surface, borderRadius: 4 }}>
                        <T variant="caption" color="textSecondary">
                          💡 Note: {exam.remarks}
                        </T>
                      </View>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Col>
        ) : (
          upcomingExams.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                  <T variant="body" color="textSecondary">
                    No {examTypeFilter === 'all' ? '' : examTypeFilter} exams found
                    {subjectFilter !== 'all' ? ` for ${subjectFilter}` : ''}
                  </T>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setExamTypeFilter('all');
                      setSubjectFilter('all');
                    }}
                    style={{ marginTop: Spacing.sm }}
                  >
                    Clear Filters
                  </Button>
                </View>
              </CardContent>
            </Card>
          )
        )}

        {/* Past Exams Section (Toggle) */}
        {stats.totalPast > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Row spaceBetween centerV>
                <T variant="body" weight="semiBold">
                  Past Exams ({stats.totalPast})
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    trackAction('toggle_past_exams', 'UpcomingExams', { show: !showPastExams });
                    setShowPastExams(!showPastExams);
                  }}
                >
                  {showPastExams ? '▼ Hide' : '▶ Show'}
                </Button>
              </Row>

              {/* Past Exams List */}
              {showPastExams && pastExams.length > 0 && (
                <Col gap="sm" style={{ marginTop: Spacing.md }}>
                  {pastExams.map(exam => (
                    <View
                      key={exam.id}
                      style={{
                        padding: Spacing.sm,
                        backgroundColor: Colors.surface,
                        borderRadius: 8,
                        borderLeftWidth: 4,
                        borderLeftColor: exam.percentage && exam.percentage >= 40 ? Colors.success : Colors.error,
                      }}
                    >
                      <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                        <T variant="body" weight="semiBold" style={{ flex: 1 }}>
                          {exam.exam_name}
                        </T>
                        <View style={{ backgroundColor: exam.percentage && exam.percentage >= 40 ? Colors.success : Colors.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <T variant="caption" style={{ color: '#FFFFFF' }}>
                            {exam.grade || 'N/A'}
                          </T>
                        </View>
                      </Row>

                      <Row spaceBetween>
                        <Col gap="xs">
                          <T variant="caption" color="textSecondary">
                            {exam.subject_code} • {exam.exam_type}
                          </T>
                          <T variant="caption" color="textSecondary">
                            📅 {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Date not set'}
                          </T>
                        </Col>
                        <Col gap="xs" style={{ alignItems: 'flex-end' }}>
                          <T variant="body" weight="bold" style={{ fontSize: 16 }}>
                            {exam.obtained_marks} / {exam.max_marks}
                          </T>
                          <T variant="caption" color="textSecondary">
                            {(exam.percentage ?? 0).toFixed(1)}%
                          </T>
                        </Col>
                      </Row>
                    </View>
                  ))}
                </Col>
              )}
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});

export default UpcomingExamsScreen;
