/**
 * SubjectDetailScreen - Detailed subject performance with grade trends
 *
 * Features:
 * - Overall subject grade and performance summary
 * - All assessments/exams with scores and grades
 * - Study materials for the subject
 * - Teacher notes and recommendations
 * - Grade trend visualization
 * - Sort by date or score
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button, Spacer } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { ProgressBar } from 'react-native-paper';
import { Share } from 'react-native';

type Props = NativeStackScreenProps<ParentStackParamList, 'SubjectDetail'>;

type SortType = 'date' | 'score';

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
  exam_date: string | null;
  created_at: string;
}

interface StudentProgress {
  id: string;
  student_id: string;
  subject_code: string;
  attendance_percentage: number | null;
  average_score: number | null;
  completed_assignments: number;
  total_assignments: number;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendations: string | null;
  last_updated: string;
}

interface StudyMaterial {
  id: string;
  title: string;
  subject_code: string | null;
  type: string;
  file_size: string | null;
  file_url: string | null;
  author: string | null;
  rating: number | null;
  downloads_count: number;
  upload_date: string;
}

const SubjectDetailScreen: React.FC<Props> = ({ route }) => {
  const { studentId, subject } = route.params;
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackScreenView('SubjectDetail', { from: 'AcademicsDetail', studentId, subject });
  }, [studentId, subject]);

  // Query 1: Fetch grades from gradebook
  const {
    data: grades = [],
    isLoading: loadingGrades,
    error: gradesError,
    refetch: refetchGrades,
  } = useQuery({
    queryKey: ['grades', studentId, subject],
    queryFn: async () => {
      console.log(`🔍 [SubjectDetail] Fetching grades for student ${studentId}, subject ${subject}`);
      const { data, error } = await supabase
        .from('gradebook')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject_code', subject)
        .order('exam_date', { ascending: false });

      if (error) {
        console.error('❌ [SubjectDetail] Grades error:', error);
        throw error;
      }

      console.log('✅ [SubjectDetail] Loaded', data?.length || 0, 'grades');
      return (data || []) as GradeRecord[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query 2: Fetch student progress
  const {
    data: progress,
    isLoading: loadingProgress,
  } = useQuery({
    queryKey: ['progress', studentId, subject],
    queryFn: async () => {
      console.log(`🔍 [SubjectDetail] Fetching progress for student ${studentId}, subject ${subject}`);
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject_code', subject)
        .maybeSingle();

      if (error) {
        console.error('❌ [SubjectDetail] Progress error:', error);
        throw error;
      }

      console.log('✅ [SubjectDetail] Progress loaded:', data ? 'Found' : 'Not found');
      return data as StudentProgress | null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Query 3: Fetch study materials
  const {
    data: materials = [],
    isLoading: loadingMaterials,
  } = useQuery({
    queryKey: ['study_materials', subject],
    queryFn: async () => {
      console.log(`🔍 [SubjectDetail] Fetching study materials for subject ${subject}`);
      const { data, error } = await supabase
        .from('study_materials')
        .select('id, title, subject_code, type, file_size, file_url, author, rating, downloads_count, upload_date')
        .eq('subject_code', subject)
        .eq('is_published', true)
        .order('upload_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ [SubjectDetail] Materials error:', error);
        throw error;
      }

      console.log('✅ [SubjectDetail] Loaded', data?.length || 0, 'materials');
      return (data || []) as StudyMaterial[];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Calculations
  const overallAverage = useMemo(() => {
    if (!grades || grades.length === 0) return 0;
    const total = grades.reduce((sum, g) => sum + (g.percentage ?? 0), 0);
    return total / grades.length;
  }, [grades]);

  const gradeLetter = useMemo(() => {
    if (overallAverage >= 90) return 'A+';
    if (overallAverage >= 80) return 'A';
    if (overallAverage >= 70) return 'B';
    if (overallAverage >= 60) return 'C';
    if (overallAverage >= 50) return 'D';
    return 'F';
  }, [overallAverage]);

  const stats = useMemo(() => {
    if (!grades || grades.length === 0) {
      return {
        totalAssessments: 0,
        average: 0,
        highest: null,
        lowest: null,
      };
    }

    const highest = grades.reduce((max, g) =>
      (g.percentage ?? 0) > (max.percentage ?? 0) ? g : max
    );
    const lowest = grades.reduce((min, g) =>
      (g.percentage ?? 0) < (min.percentage ?? 0) ? g : min
    );

    return {
      totalAssessments: grades.length,
      average: overallAverage,
      highest,
      lowest,
    };
  }, [grades, overallAverage]);



  const sortedGrades = useMemo(() => {
    const sorted = [...grades];
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const dateA = a.exam_date ? new Date(a.exam_date).getTime() : 0;
        const dateB = b.exam_date ? new Date(b.exam_date).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    } else {
      sorted.sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0)); // Highest first
    }
    return sorted;
  }, [grades, sortBy]);

  // Calculate performance trend
  const performanceTrend = useMemo(() => {
    if (grades.length < 2) return null;

    const recentGrades = sortedGrades.slice(0, 6).reverse(); // Last 6 assessments
    const chartData = {
      labels: recentGrades.map((_g, i) => `#${i + 1}`),
      datasets: [{
        data: recentGrades.map(g => g.percentage || 0),
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
        strokeWidth: 2
      }]
    };

    // Calculate trend direction
    const firstHalf = recentGrades.slice(0, Math.floor(recentGrades.length / 2));
    const secondHalf = recentGrades.slice(Math.floor(recentGrades.length / 2));
    const firstAvg = firstHalf.reduce((sum, g) => sum + (g.percentage || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, g) => sum + (g.percentage || 0), 0) / secondHalf.length;

    const trendDirection = secondAvg > firstAvg + 5 ? 'improving' :
                          secondAvg < firstAvg - 5 ? 'declining' : 'stable';

    return { chartData, trendDirection };
  }, [grades, sortedGrades]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 70) return Colors.success;
    if (percentage >= 50) return Colors.warning;
    return Colors.error;
  };

  const getSubjectColor = (subjectCode: string) => {
    const colors: Record<string, string> = {
      'MATH': Colors.primary,
      'PHYS': '#2196F3',
      'CHEM': '#9C27B0',
      'BIO': '#4CAF50',
      'ENG': '#FF9800',
      'CS': '#00BCD4',
    };
    return colors[subjectCode] || Colors.primary;
  };


  // Get full subject name (since we now use full names, just return as-is)
  const getFullSubjectName = (subjectCode: string): string => {
    return subjectCode; // Already full name like "English", "Mathematics"
  };

  const toggleSection = (section: string) => {
    trackAction('expand_section', 'SubjectDetail', { section });
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };


  const handleShareReport = async () => {
    try {
      const report = `📊 Academic Report - ${getFullSubjectName(subject)}

Overall Grade: ${gradeLetter} (${(overallAverage ?? 0).toFixed(1)}%)
Total Assessments: ${stats.totalAssessments}
Average Score: ${(stats.average ?? 0).toFixed(1)}%
Highest: ${stats.highest ? (stats.highest.percentage ?? 0).toFixed(0) : '-'}%
Lowest: ${stats.lowest ? (stats.lowest.percentage ?? 0).toFixed(0) : '-'}%

Recent Assessments:
${sortedGrades.slice(0, 5).map(g =>
  `• ${g.exam_name}: ${g.obtained_marks}/${g.max_marks} (${(g.percentage || 0).toFixed(1)}%)`
).join('\n')}

Generated from Manushi Coaching App`;

      await Share.share({
        message: report,
        title: `Academic Report - ${getFullSubjectName(subject)}`,
      });
      trackAction('share_report', 'SubjectDetail', { subject });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };


  const handleSortChange = (sort: SortType) => {
    trackAction('sort_grades', 'SubjectDetail', { sortBy: sort });
    setSortBy(sort);
  };

  const isLoading = loadingGrades || loadingProgress || loadingMaterials;
  const error = gradesError;

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load subject details' : null}
      empty={!isLoading && grades.length === 0}
      emptyBody="No assessments found for this subject yet."
      onRetry={refetchGrades}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Section 1: Subject Header */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV>
              <View>
                <View style={{ backgroundColor: getSubjectColor(subject) + '20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: Spacing.xs }}>
                  <T variant="caption" style={{ color: getSubjectColor(subject), fontWeight: '600' }}>
                    {subject}
                  </T>
                </View>
                <T variant="title" weight="bold" style={{ marginTop: Spacing.xs }}>
                  {getFullSubjectName(subject)}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="display" style={{ fontSize: 36, color: getPerformanceColor(overallAverage), fontWeight: 'bold' }}>
                  {gradeLetter}
                </T>
                <T variant="caption" color="textSecondary">
                  {(overallAverage ?? 0).toFixed(1)}% overall
                </T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Section 2: Performance Stats Summary */}
        <Card variant="elevated">
          <CardContent>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>
              Performance Summary
            </T>
            <Row spaceBetween>
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.xs }}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.primary }}>
                  {stats.totalAssessments}
                </T>
                <T variant="caption" color="textSecondary">Total Exams</T>
              </View>
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.xs }}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: getPerformanceColor(stats.average) }}>
                  {(stats.average ?? 0).toFixed(0)}%
                </T>
                <T variant="caption" color="textSecondary">Average</T>
              </View>
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.xs }}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.success }}>
                  {stats.highest ? (stats.highest.percentage ?? 0).toFixed(0) : '-'}%
                </T>
                <T variant="caption" color="textSecondary">Highest</T>
              </View>
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.xs }}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.error }}>
                  {stats.lowest ? (stats.lowest.percentage ?? 0).toFixed(0) : '-'}%
                </T>
                <T variant="caption" color="textSecondary">Lowest</T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* NEW SECTION 2A: Performance Trend & Attendance */}
        {(performanceTrend || progress) && (
          <Card variant="elevated">
            <CardContent>
              <Row spaceBetween centerV style={{ marginBottom: Spacing.md }}>
                <T variant="body" weight="semiBold">Performance Insights</T>
                {performanceTrend && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <T variant="caption" style={{ color:
                      performanceTrend.trendDirection === 'improving' ? Colors.success :
                      performanceTrend.trendDirection === 'declining' ? Colors.error :
                      Colors.warning
                    }}>
                      {performanceTrend.trendDirection === 'improving' ? '📈 Improving' :
                       performanceTrend.trendDirection === 'declining' ? '📉 Needs Attention' :
                       '➡️  Stable'}
                    </T>
                  </View>
                )}
              </Row>

              {/* Attendance if available */}
              {progress?.attendance_percentage !== null && progress?.attendance_percentage !== undefined && (
                <View style={{ marginBottom: Spacing.md }}>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="caption" color="textSecondary">Attendance</T>
                    <T variant="caption" weight="semiBold">{Math.round(progress?.attendance_percentage)}%</T>
                  </Row>
                  <ProgressBar
                    progress={progress?.attendance_percentage / 100}
                    color={progress?.attendance_percentage >= 75 ? Colors.success : Colors.warning}
                    style={{ height: 6, borderRadius: 3 }}
                  />
                </View>
              )}

              {/* Assignment completion if available */}
              {progress?.completed_assignments !== null && progress?.total_assignments !== null && (
                <View>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="caption" color="textSecondary">Assignments Completed</T>
                    <T variant="caption" weight="semiBold">
                      {progress?.completed_assignments} / {progress?.total_assignments}
                    </T>
                  </Row>
                  <ProgressBar
                    progress={(progress?.completed_assignments || 0) / (progress?.total_assignments || 1)}
                    color={Colors.primary}
                    style={{ height: 6, borderRadius: 3 }}
                  />
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* NEW SECTION 2B: Recent Activity Timeline */}
        {sortedGrades.length > 0 && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>
                Recent Activity (Last 3 Assessments)
              </T>
              <Col gap="sm">
                {sortedGrades.slice(0, 3).map((grade, index) => (
                  <View key={grade.id} style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <View style={{ alignItems: 'center', width: 50 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: getPerformanceColor(grade.percentage ?? 0) + '20',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <T variant="caption" weight="bold" style={{ color: getPerformanceColor(grade.percentage ?? 0) }}>
                          {grade.grade || 'N/A'}
                        </T>
                      </View>
                      {index < 2 && <View style={{ width: 2, height: 20, backgroundColor: Colors.surfaceVariant, marginTop: 4 }} />}
                    </View>
                    <View style={{ flex: 1, paddingTop: 8 }}>
                      <T variant="body" weight="semiBold" style={{ fontSize: 14 }}>{grade.exam_name}</T>
                      <T variant="caption" color="textSecondary">
                        {(grade.percentage ?? 0).toFixed(0)}% • {grade.exam_date ? new Date(grade.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                      </T>
                    </View>
                  </View>
                ))}
              </Col>
            </CardContent>
          </Card>
        )}

        {/* NEW SECTION 2C: Quick Actions */}
        <Card variant="elevated">
          <CardContent>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>Quick Actions</T>
            <Row style={{ gap: Spacing.xs }}>
              <Button
                variant="primary"
                onPress={() => {
                  trackAction('view_upcoming_exams', 'SubjectDetail', { subject });
                  safeNavigate('UpcomingExams', { studentId });
                }}
                style={{ flex: 1 }}
              >
                📅 Upcoming Exams
              </Button>
              <Button
                variant="outline"
                onPress={handleShareReport}
                style={{ flex: 1 }}
              >
                📤 Share Report
              </Button>
            </Row>
          </CardContent>
        </Card>


        {/* Section 3: Sort Controls */}
        {grades.length > 0 && (
          <>
            <Row style={{ gap: Spacing.xs }}>
              <T variant="body" weight="semiBold">Sort by:</T>
              <Button
                variant={sortBy === 'date' ? 'primary' : 'outline'}
                onPress={() => handleSortChange('date')}
                style={{ flex: 1 }}
              >
                Date
              </Button>
              <Button
                variant={sortBy === 'score' ? 'primary' : 'outline'}
                onPress={() => handleSortChange('score')}
                style={{ flex: 1 }}
              >
                Score
              </Button>
            </Row>
          </>
        )}

        {/* Section 4: All Assessments List */}
        <T variant="body" weight="semiBold">
          All Assessments ({sortedGrades.length})
        </T>
        {sortedGrades.length > 0 ? (
          <Col gap="sm">
            {sortedGrades.map(grade => (
              <Card key={grade.id} variant="elevated">
                <CardContent>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <View style={{ flex: 1 }}>
                      <T variant="body" weight="semiBold">{grade.exam_name}</T>
                      <T variant="caption" color="textSecondary">
                        {grade.exam_date ? new Date(grade.exam_date).toLocaleDateString() : 'No date'}
                      </T>
                    </View>
                    <Badge
                      variant={
                        grade.exam_type === 'final' ? 'error' :
                        grade.exam_type === 'midterm' ? 'warning' :
                        'info'
                      }
                      label={grade.exam_type.toUpperCase()}
                    />
                  </Row>

                  <Row spaceBetween centerV style={{ marginTop: Spacing.sm }}>
                    <View>
                      <T variant="display" weight="bold" style={{ fontSize: 24, color: getPerformanceColor(grade.percentage ?? 0) }}>
                        {grade.obtained_marks} / {grade.max_marks}
                      </T>
                      <T variant="caption" color="textSecondary">
                        {(grade.percentage ?? 0).toFixed(1)}% • Grade: {grade.grade || 'N/A'}
                      </T>
                    </View>
                  </Row>

                  <ProgressBar
                    progress={(grade.percentage ?? 0) / 100}
                    color={getPerformanceColor(grade.percentage ?? 0)}
                    style={{ height: 8, borderRadius: 4, marginTop: Spacing.sm }}
                  />

                  {grade.remarks && (
                    <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.background, borderRadius: 8 }}>
                      <T variant="caption" color="textSecondary">{grade.remarks}</T>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </Col>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary">
                  No assessments found
                </T>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Section 5: Study Materials */}
        {materials.length > 0 && (
          <>
            <Spacer size="md" />
            <T variant="body" weight="semiBold">Study Materials ({materials.length})</T>
            <Col gap="sm">
              {materials.map(material => (
                <Card key={material.id} variant="elevated">
                  <CardContent>
                    <Row spaceBetween centerV>
                      <View style={{ flex: 1 }}>
                        <T variant="body" weight="semiBold">{material.title}</T>
                        <T variant="caption" color="textSecondary">
                          {material.type.toUpperCase()} • {material.file_size || 'Size unknown'}
                        </T>
                        {material.author && (
                          <T variant="caption" color="textSecondary">
                            By {material.author}
                          </T>
                        )}
                        <Row style={{ marginTop: Spacing.xs, gap: Spacing.md }}>
                          {material.rating !== null && (
                            <T variant="caption" color="textSecondary">
                              ⭐ {material.rating.toFixed(1)}
                            </T>
                          )}
                          <T variant="caption" color="textSecondary">
                            📥 {material.downloads_count} downloads
                          </T>
                        </Row>
                      </View>
                    </Row>
                  </CardContent>
                </Card>
              ))}
            </Col>
          </>
        )}

        {/* Section 6: Teacher Notes & Recommendations */}
        {progress && (progress.strengths || progress.weaknesses || progress.recommendations) && (
          <>
            <Spacer size="md" />
            <Card variant="elevated">
              <CardContent>
                <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>
                  Teacher Notes
                </T>

                {progress.strengths && progress.strengths.length > 0 && (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Button
                      variant="outline"
                      onPress={() => toggleSection('strengths')}
                      style={{ marginBottom: Spacing.xs }}
                    >
                      {expandedSections.has('strengths') ? '▼ Hide' : '▶ Show'} Strengths
                    </Button>
                    {expandedSections.has('strengths') && (
                      <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.success + '10', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: Colors.success }}>
                        {progress.strengths.map((strength, index) => (
                          <T key={index} variant="body" style={{ marginBottom: Spacing.xs }}>
                            • {strength}
                          </T>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {progress.weaknesses && progress.weaknesses.length > 0 && (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Button
                      variant="outline"
                      onPress={() => toggleSection('weaknesses')}
                      style={{ marginBottom: Spacing.xs }}
                    >
                      {expandedSections.has('weaknesses') ? '▼ Hide' : '▶ Show'} Areas for Improvement
                    </Button>
                    {expandedSections.has('weaknesses') && (
                      <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.warning + '10', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: Colors.warning }}>
                        {progress.weaknesses.map((weakness, index) => (
                          <T key={index} variant="body" style={{ marginBottom: Spacing.xs }}>
                            • {weakness}
                          </T>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {progress.recommendations && (
                  <View>
                    <Button
                      variant="outline"
                      onPress={() => toggleSection('recommendations')}
                      style={{ marginBottom: Spacing.xs }}
                    >
                      {expandedSections.has('recommendations') ? '▼ Hide' : '▶ Show'} Recommendations
                    </Button>
                    {expandedSections.has('recommendations') && (
                      <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.primary + '10', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary }}>
                        <T variant="body">{progress.recommendations}</T>
                      </View>
                    )}
                  </View>
                )}

                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.md }}>
                  Last updated: {new Date(progress.last_updated).toLocaleDateString()}
                </T>
              </CardContent>
            </Card>
          </>
        )}
      </Col>
    </BaseScreen>
  );
};

export default SubjectDetailScreen;
