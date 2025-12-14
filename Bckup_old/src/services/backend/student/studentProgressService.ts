/**
 * Student Progress Service
 * Tracks and analyzes student academic progress
 *
 * Database Tables:
 * - students
 * - gradebook
 * - assignment_submissions
 * - attendance
 * - student_academic_performance (view)
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import { StudentProgress, ProgressFilters } from '../../../types/database/student';

// ==================== PROGRESS TRACKING ====================

/**
 * Get overall progress for a student
 * @param studentId - The student UUID
 * @param filters - Optional filters (subject, date range)
 * @returns Promise<StudentProgress>
 */
export async function getStudentProgress(
  studentId: string,
  filters?: ProgressFilters
): Promise<StudentProgress> {
  const [assignmentProgress, gradeAverage, attendanceRate] = await Promise.all([
    getAssignmentProgress(studentId, filters),
    getAverageGrade(studentId, filters),
    getAttendanceRate(studentId, filters),
  ]);

  // Calculate improvement (comparing current period to previous period)
  const improvement = await calculateImprovement(studentId, filters);

  return {
    student_id: studentId,
    subject_id: filters?.subject_id,
    assignments_completed: assignmentProgress.completed,
    assignments_total: assignmentProgress.total,
    average_score: gradeAverage,
    attendance_rate: attendanceRate,
    improvement_percentage: improvement,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Get assignment completion progress
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<{total: number, completed: number}>
 */
async function getAssignmentProgress(
  studentId: string,
  filters?: ProgressFilters
): Promise<{ total: number; completed: number }> {
  // Get student's class_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student?.class_id) {
    return { total: 0, completed: 0 };
  }

  // Build assignment query
  let assignmentQuery = supabase
    .from('assignments')
    .select('id, subject')
    .eq('class_id', student.class_id)
    .eq('status', 'published');

  if (filters?.subject_id) {
    assignmentQuery = assignmentQuery.eq('subject', filters.subject_id);
  }

  if (filters?.start_date) {
    assignmentQuery = assignmentQuery.gte('created_at', filters.start_date);
  }

  if (filters?.end_date) {
    assignmentQuery = assignmentQuery.lte('created_at', filters.end_date);
  }

  const { data: assignments, error: assignmentsError } = await assignmentQuery;

  if (assignmentsError) {
    handleSupabaseError(assignmentsError, 'getAssignmentProgress - assignments');
  }

  if (!assignments || assignments.length === 0) {
    return { total: 0, completed: 0 };
  }

  // Get completed assignments (submissions)
  const { data: submissions, error: submissionsError } = await supabase
    .from('assignment_submissions')
    .select('assignment_id')
    .eq('student_id', studentId)
    .in(
      'assignment_id',
      assignments.map((a) => a.id)
    )
    .in('status', ['submitted', 'graded']);

  if (submissionsError) {
    handleSupabaseError(submissionsError, 'getAssignmentProgress - submissions');
  }

  return {
    total: assignments.length,
    completed: submissions?.length || 0,
  };
}

/**
 * Get average grade/score for a student
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<number>
 */
async function getAverageGrade(studentId: string, filters?: ProgressFilters): Promise<number> {
  let query = supabase.from('gradebook').select('percentage').eq('student_id', studentId);

  if (filters?.subject_id) {
    query = query.eq('subject_code', filters.subject_id);
  }

  if (filters?.start_date) {
    query = query.gte('exam_date', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('exam_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getAverageGrade');
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const sum = data.reduce((acc, curr) => acc + curr.percentage, 0);
  return Math.round((sum / data.length) * 100) / 100;
}

/**
 * Get attendance rate for a student
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<number>
 */
async function getAttendanceRate(studentId: string, filters?: ProgressFilters): Promise<number> {
  let query = supabase.from('attendance').select('status').eq('student_id', studentId);

  if (filters?.start_date) {
    query = query.gte('date', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getAttendanceRate');
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const presentCount = data.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = (presentCount / data.length) * 100;

  return Math.round(attendanceRate * 100) / 100;
}

/**
 * Calculate improvement percentage (current vs previous period)
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<number>
 */
async function calculateImprovement(
  studentId: string,
  filters?: ProgressFilters
): Promise<number> {
  // If no date range specified, compare last 30 days to previous 30 days
  const endDate = filters?.end_date ? new Date(filters.end_date) : new Date();
  const startDate = filters?.start_date
    ? new Date(filters.start_date)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const periodLength = endDate.getTime() - startDate.getTime();

  // Current period average
  const currentAverage = await getAverageGrade(studentId, {
    subject_id: filters?.subject_id,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  // Previous period average
  const previousStartDate = new Date(startDate.getTime() - periodLength);
  const previousAverage = await getAverageGrade(studentId, {
    subject_id: filters?.subject_id,
    start_date: previousStartDate.toISOString(),
    end_date: startDate.toISOString(),
  });

  if (previousAverage === 0) {
    return 0; // No previous data to compare
  }

  const improvement = ((currentAverage - previousAverage) / previousAverage) * 100;
  return Math.round(improvement * 100) / 100;
}

// ==================== SUBJECT-WISE PROGRESS ====================

/**
 * Get progress breakdown by subject
 * @param studentId - The student UUID
 * @returns Promise<SubjectProgress[]>
 */
export async function getSubjectWiseProgress(studentId: string): Promise<
  Array<{
    subject_code: string;
    subject_name?: string;
    average_score: number;
    total_exams: number;
    attendance_rate: number;
    progress_trend: 'improving' | 'declining' | 'stable';
  }>
> {
  // Get all subjects the student has grades for
  const { data: grades, error } = await supabase
    .from('gradebook')
    .select('subject_code, percentage, exam_date')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getSubjectWiseProgress');
  }

  if (!grades || grades.length === 0) {
    return [];
  }

  // Group by subject
  const subjectMap = new Map<
    string,
    { scores: number[]; dates: string[]; total: number }
  >();

  grades.forEach((grade) => {
    if (!subjectMap.has(grade.subject_code)) {
      subjectMap.set(grade.subject_code, { scores: [], dates: [], total: 0 });
    }
    const subject = subjectMap.get(grade.subject_code)!;
    subject.scores.push(grade.percentage);
    subject.dates.push(grade.exam_date);
    subject.total += 1;
  });

  // Calculate progress for each subject
  const result = [];
  for (const [subjectCode, data] of subjectMap.entries()) {
    const average = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

    // Determine trend (compare first half to second half)
    const midpoint = Math.floor(data.scores.length / 2);
    const firstHalfAvg =
      data.scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint || 0;
    const secondHalfAvg =
      data.scores.slice(midpoint).reduce((a, b) => a + b, 0) / (data.scores.length - midpoint) ||
      0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';

    result.push({
      subject_code: subjectCode,
      average_score: Math.round(average * 100) / 100,
      total_exams: data.total,
      attendance_rate: 0, // Would need subject-specific attendance
      progress_trend: trend,
    });
  }

  return result;
}

// ==================== WEEKLY/MONTHLY PROGRESS ====================

/**
 * Get progress over time (weekly or monthly breakdown)
 * @param studentId - The student UUID
 * @param period - 'weekly' | 'monthly'
 * @param count - Number of periods to retrieve
 * @returns Promise<ProgressTimelineData[]>
 */
export async function getProgressTimeline(
  studentId: string,
  period: 'weekly' | 'monthly',
  count: number = 12
): Promise<
  Array<{
    period_label: string;
    start_date: string;
    end_date: string;
    average_score: number;
    attendance_rate: number;
    assignments_completed: number;
  }>
> {
  const result = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    let startDate: Date, endDate: Date, label: string;

    if (period === 'weekly') {
      endDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = `Week ${i + 1}`;
    } else {
      endDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      label = endDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    const [averageScore, attendanceRate, assignmentProgress] = await Promise.all([
      getAverageGrade(studentId, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
      getAttendanceRate(studentId, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
      getAssignmentProgress(studentId, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
    ]);

    result.unshift({
      period_label: label,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      average_score: averageScore,
      attendance_rate: attendanceRate,
      assignments_completed: assignmentProgress.completed,
    });
  }

  return result;
}

// ==================== PERFORMANCE PREDICTIONS ====================

/**
 * Predict future performance based on current trends
 * This is a simple linear prediction - in production would use ML models
 * @param studentId - The student UUID
 * @returns Promise<PredictionData>
 */
export async function predictPerformance(studentId: string): Promise<{
  predicted_average: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
}> {
  // Get last 10 grades
  const { data: recentGrades, error } = await supabase
    .from('gradebook')
    .select('percentage, exam_date')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: true })
    .limit(10);

  if (error) {
    handleSupabaseError(error, 'predictPerformance');
  }

  if (!recentGrades || recentGrades.length < 3) {
    return {
      predicted_average: 0,
      confidence: 'low',
      recommendation: 'Insufficient data for prediction',
    };
  }

  // Simple linear regression
  const scores = recentGrades.map((g) => g.percentage);
  const n = scores.length;
  const avg = scores.reduce((a, b) => a + b, 0) / n;

  // Calculate trend
  let sumXY = 0,
    sumX = 0,
    sumX2 = 0;
  scores.forEach((score, i) => {
    sumXY += i * score;
    sumX += i;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * avg * n) / (n * sumX2 - sumX * sumX);
  const predicted = avg + slope * (n + 1);

  // Determine confidence based on score variance
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / n;
  const confidence = variance < 25 ? 'high' : variance < 100 ? 'medium' : 'low';

  // Generate recommendation
  let recommendation = '';
  if (predicted >= 90) {
    recommendation = 'Excellent trajectory! Keep up the great work.';
  } else if (predicted >= 75) {
    recommendation = 'Good progress. Focus on maintaining consistency.';
  } else if (predicted >= 60) {
    recommendation = 'Satisfactory. Consider extra practice in weaker areas.';
  } else {
    recommendation = 'Needs improvement. Recommend additional tutoring and study support.';
  }

  return {
    predicted_average: Math.round(predicted * 100) / 100,
    confidence,
    recommendation,
  };
}
