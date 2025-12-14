/**
 * Student Dashboard Service
 * Provides dashboard data and statistics for students
 *
 * Database Tables:
 * - students
 * - assignments
 * - assignment_submissions
 * - attendance
 * - gradebook
 * - live_sessions
 * - student_academic_performance (view)
 * - attendance_summary (view)
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import {
  StudentDashboard,
  Student,
  Assignment,
  Grade,
  AttendanceSummary,
  AcademicPerformance,
  LiveSession,
  AIRecommendation,
  StudyPlan,
} from '../../../types/database/student';
import { getAIRecommendations } from './aiStudyAssistantService';
import { getActiveStudyPlans } from './aiStudyAssistantService';

// ==================== DASHBOARD ====================

/**
 * Get complete dashboard data for a student
 * @param studentId - The student UUID
 * @returns Promise<StudentDashboard>
 */
export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  // Fetch all data in parallel
  const [
    student,
    attendance,
    upcomingAssignments,
    recentGrades,
    upcomingClasses,
    academicPerformance,
    aiRecommendations,
    studyPlans,
  ] = await Promise.all([
    getStudentById(studentId),
    getAttendanceSummary(studentId),
    getUpcomingAssignments(studentId, 5),
    getRecentGrades(studentId, 10),
    getUpcomingClasses(studentId, 5),
    getAcademicPerformance(studentId),
    getAIRecommendations(studentId, { status: 'active', completion_status: 'pending' }),
    getActiveStudyPlans(studentId),
  ]);

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }

  // Count pending assignments
  const pendingAssignments = await getPendingAssignmentCount(studentId);

  return {
    student,
    attendance,
    upcomingAssignments,
    recentGrades,
    upcomingClasses,
    academicPerformance,
    pendingActions: pendingAssignments,
    aiRecommendations,
    studyPlans,
  };
}

// ==================== STUDENT INFO ====================

/**
 * Get student by ID
 * @param studentId - The student UUID
 * @returns Promise<Student | null>
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error, 'getStudentById');
  }

  return data;
}

// ==================== ASSIGNMENTS ====================

/**
 * Get upcoming assignments for a student
 * @param studentId - The student UUID
 * @param limit - Maximum number of assignments to return
 * @returns Promise<Assignment[]>
 */
export async function getUpcomingAssignments(
  studentId: string,
  limit: number = 10
): Promise<Assignment[]> {
  // Get student's class_id first
  const student = await getStudentById(studentId);
  if (!student || !student.class_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', student.class_id)
    .eq('status', 'published')
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getUpcomingAssignments');
  }

  return data || [];
}

/**
 * Get count of pending assignments (not yet submitted)
 * @param studentId - The student UUID
 * @returns Promise<number>
 */
export async function getPendingAssignmentCount(studentId: string): Promise<number> {
  // Get student's class_id
  const student = await getStudentById(studentId);
  if (!student || !student.class_id) {
    return 0;
  }

  // Get all published assignments for the class
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id')
    .eq('class_id', student.class_id)
    .eq('status', 'published')
    .gte('due_date', new Date().toISOString());

  if (assignmentsError) {
    handleSupabaseError(assignmentsError, 'getPendingAssignmentCount');
  }

  if (!assignments || assignments.length === 0) {
    return 0;
  }

  // Get student's submissions
  const { data: submissions, error: submissionsError } = await supabase
    .from('assignment_submissions')
    .select('assignment_id')
    .eq('student_id', studentId)
    .in(
      'assignment_id',
      assignments.map((a) => a.id)
    );

  if (submissionsError) {
    handleSupabaseError(submissionsError, 'getPendingAssignmentCount - submissions');
  }

  const submittedIds = new Set(submissions?.map((s) => s.assignment_id) || []);
  const pendingCount = assignments.filter((a) => !submittedIds.has(a.id)).length;

  return pendingCount;
}

// ==================== GRADES ====================

/**
 * Get recent grades for a student
 * @param studentId - The student UUID
 * @param limit - Maximum number of grades to return
 * @returns Promise<Grade[]>
 */
export async function getRecentGrades(studentId: string, limit: number = 10): Promise<Grade[]> {
  const { data, error } = await supabase
    .from('gradebook')
    .select('*')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getRecentGrades');
  }

  return data || [];
}

// ==================== ATTENDANCE ====================

/**
 * Get attendance summary for a student
 * Uses the attendance_summary view
 * @param studentId - The student UUID
 * @returns Promise<AttendanceSummary>
 */
export async function getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No attendance data yet, return empty summary
      return {
        student_id: studentId,
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        excused_days: 0,
        attendance_percentage: 0,
      };
    }
    handleSupabaseError(error, 'getAttendanceSummary');
  }

  return data;
}

/**
 * Get attendance records for a specific date range
 * @param studentId - The student UUID
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Promise<Attendance[]>
 */
export async function getAttendanceByDateRange(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getAttendanceByDateRange');
  }

  return data || [];
}

// ==================== ACADEMIC PERFORMANCE ====================

/**
 * Get academic performance summary for a student
 * Uses the student_academic_performance view
 * @param studentId - The student UUID
 * @returns Promise<AcademicPerformance>
 */
export async function getAcademicPerformance(studentId: string): Promise<AcademicPerformance> {
  const { data, error } = await supabase
    .from('student_academic_performance')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No performance data yet
      const student = await getStudentById(studentId);
      return {
        student_id: studentId,
        student_code: student?.student_id || '',
        full_name: student?.full_name || '',
        average_exam_percentage: 0,
        attendance_percentage: 0,
        overall_performance: 'Needs Improvement',
      };
    }
    handleSupabaseError(error, 'getAcademicPerformance');
  }

  return data;
}

// ==================== LIVE CLASSES ====================

/**
 * Get upcoming live classes for a student
 * @param studentId - The student UUID
 * @param limit - Maximum number of classes to return
 * @returns Promise<LiveSession[]>
 */
export async function getUpcomingClasses(
  studentId: string,
  limit: number = 5
): Promise<LiveSession[]> {
  // Get student's class_id
  const student = await getStudentById(studentId);
  if (!student || !student.class_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('class_id', student.class_id)
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_start_at', new Date().toISOString())
    .order('scheduled_start_at', { ascending: true })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getUpcomingClasses');
  }

  return data || [];
}

/**
 * Get past live class recordings for a student
 * @param studentId - The student UUID
 * @param limit - Maximum number of recordings to return
 * @returns Promise<LiveSession[]>
 */
export async function getPastClassRecordings(
  studentId: string,
  limit: number = 10
): Promise<LiveSession[]> {
  const student = await getStudentById(studentId);
  if (!student || !student.class_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('class_id', student.class_id)
    .eq('status', 'ended')
    .eq('is_recorded', true)
    .not('recording_url', 'is', null)
    .order('actual_end_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getPastClassRecordings');
  }

  return data || [];
}

// ==================== STATISTICS ====================

/**
 * Get student statistics summary
 * @param studentId - The student UUID
 * @returns Promise<object>
 */
export async function getStudentStats(studentId: string): Promise<{
  totalAssignments: number;
  completedAssignments: number;
  averageScore: number;
  attendanceRate: number;
  totalClasses: number;
}> {
  const [upcomingAssignments, recentGrades, attendance] = await Promise.all([
    getUpcomingAssignments(studentId, 100),
    getRecentGrades(studentId, 100),
    getAttendanceSummary(studentId),
  ]);

  const averageScore =
    recentGrades.length > 0
      ? recentGrades.reduce((sum, grade) => sum + grade.percentage, 0) / recentGrades.length
      : 0;

  return {
    totalAssignments: upcomingAssignments.length,
    completedAssignments: 0, // Would need submission data
    averageScore: Math.round(averageScore * 100) / 100,
    attendanceRate: attendance.attendance_percentage,
    totalClasses: attendance.total_days,
  };
}
