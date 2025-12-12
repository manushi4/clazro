/**
 * NewProgressDetailScreen - Premium Minimal Design
 * Purpose: Display student progress with grades and performance metrics
 * Used in: StudentNavigator (PerformanceStack)
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui/surfaces/Card';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewProgressDetailScreen'>;

interface ProgressData {
  overall_grade: number;
  attendance_rate: number;
  assignments_completed: number;
  assignments_total: number;
  subjects: Array<{
    name: string;
    average_grade: number;
    assignments_completed: number;
    assignments_total: number;
  }>;
  recent_grades: Array<{
    assignment_title: string;
    subject: string;
    grade: number;
    total_points: number;
    graded_at: string;
  }>;
}

export default function NewProgressDetailScreen({ navigation }: Props) {
  const { user } = useAuth();

  // Track screen view
  React.useEffect(() => {
    trackScreenView('NewProgressDetailScreen');
  }, []);

  // Fetch progress data
  const { data: progress, isLoading, error, refetch } = useQuery({
    queryKey: ['student-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      // Fetch all submissions with grades
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments(title, subject, total_points, due_date)
        `)
        .eq('student_id', user.id)
        .eq('status', 'graded')
        .not('grade', 'is', null)
        .order('graded_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Calculate overall statistics
      const totalSubmissions = submissions?.length || 0;
      const totalGrade = submissions?.reduce((sum, sub) => sum + (sub.grade || 0), 0) || 0;
      const totalPoints = submissions?.reduce(
        (sum, sub) => sum + ((sub.assignments as any)?.total_points || 0),
        0
      ) || 0;

      const overallGrade = totalPoints > 0 ? (totalGrade / totalPoints) * 100 : 0;

      // Fetch attendance (count attended classes)
      const { data: classes, error: classesError } = await supabase
        .from('class_sessions')
        .select('id, status, attended')
        .eq('student_id', user.id);

      if (classesError) throw classesError;

      const totalClasses = classes?.length || 0;
      const attendedClasses = classes?.filter(c => c.attended === true).length || 0;
      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      // Fetch total assignments
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      // Group by subject
      const subjectMap = new Map<string, { grades: number[]; total: number }>();

      submissions?.forEach(sub => {
        const assignment = sub.assignments as any;
        const subject = assignment?.subject || 'Unknown';

        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { grades: [], total: 0 });
        }

        const subjectData = subjectMap.get(subject)!;
        const percentage = assignment.total_points > 0
          ? ((sub.grade || 0) / assignment.total_points) * 100
          : 0;
        subjectData.grades.push(percentage);
        subjectData.total++;
      });

      const subjects = Array.from(subjectMap.entries()).map(([name, data]) => ({
        name,
        average_grade: data.grades.reduce((sum, g) => sum + g, 0) / data.grades.length,
        assignments_completed: data.total,
        assignments_total: data.total, // Simplified
      }));

      // Recent grades
      const recentGrades = submissions?.slice(0, 5).map(sub => ({
        assignment_title: (sub.assignments as any)?.title || 'Untitled',
        subject: (sub.assignments as any)?.subject || 'Unknown',
        grade: sub.grade || 0,
        total_points: (sub.assignments as any)?.total_points || 0,
        graded_at: sub.graded_at || sub.submitted_at || '',
      })) || [];

      return {
        overall_grade: overallGrade,
        attendance_rate: attendanceRate,
        assignments_completed: totalSubmissions,
        assignments_total: assignmentsCount || 0,
        subjects,
        recent_grades: recentGrades,
      } as ProgressData;
    },
    enabled: !!user?.id,
  });

  // Get grade color
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return '#10B981'; // Green
    if (grade >= 80) return '#3B82F6'; // Blue
    if (grade >= 70) return '#F59E0B'; // Amber
    if (grade >= 60) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get grade letter
  const getGradeLetter = (grade: number): string => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  // FEATURE: Share Progress
  const handleShareProgress = async () => {
    if (!progress) return;

    trackAction('share_progress', 'NewProgressDetailScreen');

    const message = `📊 My Academic Progress Report

🎓 Overall Grade: ${getGradeLetter(progress.overall_grade)} (${progress.overall_grade.toFixed(1)}%)
📚 Assignments Completed: ${progress.assignments_completed}/${progress.assignments_total}
📅 Attendance Rate: ${progress.attendance_rate.toFixed(1)}%

Subject Performance:
${progress.subjects.map(s => `• ${s.name}: ${getGradeLetter(s.average_grade)} (${s.average_grade.toFixed(1)}%)`).join('\n')}

Recent Grades:
${progress.recent_grades.slice(0, 3).map(g => `• ${g.assignment_title}: ${g.grade}/${g.total_points}`).join('\n')}

Keep learning! 🚀`;

    try {
      await Share.share({
        message,
        title: 'My Progress Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share progress report');
    }
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load progress data' : null}
      empty={!progress}
      emptyMessage="No progress data available"
      onRefresh={() => {
        trackAction('refresh_progress', 'NewProgressDetailScreen');
        refetch();
      }}
    >
      {progress && (
        <View style={styles.container}>
          {/* Overall Stats */}
          <Card style={styles.overallCard}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Overall Performance
            </T>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statCircle,
                    { backgroundColor: getGradeColor(progress.overall_grade) },
                  ]}
                >
                  <T variant="h1" weight="bold" style={styles.statValue}>
                    {getGradeLetter(progress.overall_grade)}
                  </T>
                </View>
                <T variant="caption" style={styles.statLabel}>
                  Overall Grade
                </T>
                <T variant="body" weight="semiBold" style={styles.statPercentage}>
                  {progress.overall_grade.toFixed(1)}%
                </T>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: '#3B82F6' }]}>
                  <T variant="h1" weight="bold" style={styles.statValue}>
                    {progress.attendance_rate.toFixed(0)}
                  </T>
                </View>
                <T variant="caption" style={styles.statLabel}>
                  Attendance
                </T>
                <T variant="body" weight="semiBold" style={styles.statPercentage}>
                  {progress.attendance_rate.toFixed(1)}%
                </T>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: '#10B981' }]}>
                  <T variant="h1" weight="bold" style={styles.statValue}>
                    {progress.assignments_completed}
                  </T>
                </View>
                <T variant="caption" style={styles.statLabel}>
                  Completed
                </T>
                <T variant="body" weight="semiBold" style={styles.statPercentage}>
                  of {progress.assignments_total}
                </T>
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareProgress}
              accessibilityRole="button"
              accessibilityLabel="Share progress report"
            >
              <T variant="body" weight="semiBold" style={styles.shareButtonText}>
                📤 Share Progress
              </T>
            </TouchableOpacity>
          </Card>

          {/* Subject Performance */}
          <Card style={styles.subjectsCard}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Subject Performance
            </T>

            {progress.subjects.length > 0 ? (
              <View style={styles.subjectsList}>
                {progress.subjects.map((subject, index) => (
                  <View key={index} style={styles.subjectItem}>
                    <View style={styles.subjectInfo}>
                      <T variant="body" weight="semiBold">
                        {subject.name}
                      </T>
                      <T variant="caption" style={styles.subjectStats}>
                        {subject.assignments_completed} of {subject.assignments_total} assignments
                      </T>
                    </View>
                    <View style={styles.subjectGrade}>
                      <T
                        variant="h3"
                        weight="bold"
                        style={{ color: getGradeColor(subject.average_grade) }}
                      >
                        {getGradeLetter(subject.average_grade)}
                      </T>
                      <T variant="caption" style={styles.subjectPercentage}>
                        {subject.average_grade.toFixed(1)}%
                      </T>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <T variant="body" style={styles.emptyText}>
                No subject data available
              </T>
            )}
          </Card>

          {/* Recent Grades */}
          <Card style={styles.gradesCard}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Recent Grades
            </T>

            {progress.recent_grades.length > 0 ? (
              <View style={styles.gradesList}>
                {progress.recent_grades.map((grade, index) => (
                  <View key={index} style={styles.gradeItem}>
                    <View style={styles.gradeInfo}>
                      <T variant="body" weight="semiBold" numberOfLines={1}>
                        {grade.assignment_title}
                      </T>
                      <T variant="caption" style={styles.gradeSubject}>
                        {grade.subject} • {new Date(grade.graded_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </T>
                    </View>
                    <View style={styles.gradeScore}>
                      <T variant="body" weight="bold">
                        {grade.grade}/{grade.total_points}
                      </T>
                      <T
                        variant="caption"
                        style={{
                          color: getGradeColor((grade.grade / grade.total_points) * 100),
                          fontWeight: '600',
                        }}
                      >
                        {((grade.grade / grade.total_points) * 100).toFixed(0)}%
                      </T>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <T variant="body" style={styles.emptyText}>
                No graded assignments yet
              </T>
            )}
          </Card>
        </View>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  overallCard: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 32,
  },
  statLabel: {
    color: '#6B7280',
  },
  statPercentage: {
    color: '#111827',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
  },
  subjectsCard: {
    padding: 16,
    gap: 12,
  },
  subjectsList: {
    gap: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  subjectInfo: {
    flex: 1,
    gap: 4,
  },
  subjectStats: {
    color: '#6B7280',
  },
  subjectGrade: {
    alignItems: 'center',
    gap: 2,
  },
  subjectPercentage: {
    color: '#6B7280',
  },
  gradesCard: {
    padding: 16,
    gap: 12,
  },
  gradesList: {
    gap: 12,
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  gradeInfo: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  gradeSubject: {
    color: '#6B7280',
  },
  gradeScore: {
    alignItems: 'flex-end',
    gap: 2,
  },
  emptyText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
