/**
 * Teacher Dashboard Service
 * Provides dashboard data and statistics for teachers
 *
 * Database Tables:
 * - teachers
 * - assignments
 * - assignment_submissions
 * - live_sessions
 * - attendance
 * - teacher_performance_summary (view)
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import {
  TeacherDashboard,
  Teacher,
  TeacherStats,
  LiveSession,
  AssignmentSubmission,
  StudentAtRisk,
  Activity,
  TeacherPerformance,
} from '../../../types/database/teacher';

// ==================== DASHBOARD ====================

/**
 * Get complete dashboard data for a teacher
 * @param teacherId - The teacher UUID
 * @returns Promise<TeacherDashboard>
 */
export async function getTeacherDashboard(teacherId: string): Promise<TeacherDashboard> {
  const [teacher, stats, upcomingClasses, pendingGrading, studentsAtRisk, recentActivity] =
    await Promise.all([
      getTeacherById(teacherId),
      getTeacherStats(teacherId),
      getUpcomingClasses(teacherId, 5),
      getPendingGrading(teacherId, 10),
      getStudentAtRiskList(teacherId),
      getRecentActivity(teacherId, 10),
    ]);

  if (!teacher) {
    throw new Error(`Teacher with ID ${teacherId} not found`);
  }

  return {
    teacher,
    stats,
    upcomingClasses,
    pendingGrading,
    studentsAtRisk,
    recentActivity,
  };
}

// ==================== TEACHER INFO ====================

/**
 * Get teacher by ID
 * @param teacherId - The teacher UUID
 * @returns Promise<Teacher | null>
 */
export async function getTeacherById(teacherId: string): Promise<Teacher | null> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error, 'getTeacherById');
  }

  return data;
}

// ==================== STATISTICS ====================

/**
 * Get teacher statistics
 * @param teacherId - The teacher UUID
 * @returns Promise<TeacherStats>
 */
export async function getTeacherStats(teacherId: string): Promise<TeacherStats> {
  const [assignments, sessions, pendingGrading, avgAttendance] = await Promise.all([
    getTotalAssignments(teacherId),
    getTotalSessions(teacherId),
    getPendingGradingCount(teacherId),
    getAverageClassAttendance(teacherId),
  ]);

  return {
    total_students: 0, // Would need class enrollment data
    total_assignments: assignments,
    pending_grading: pendingGrading,
    average_class_attendance: avgAttendance,
    total_sessions: sessions,
    average_rating: undefined,
  };
}

async function getTotalAssignments(teacherId: string): Promise<number> {
  const { count, error } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);

  if (error) {
    handleSupabaseError(error, 'getTotalAssignments');
  }

  return count || 0;
}

async function getTotalSessions(teacherId: string): Promise<number> {
  const { count, error } = await supabase
    .from('live_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);

  if (error) {
    handleSupabaseError(error, 'getTotalSessions');
  }

  return count || 0;
}

async function getPendingGradingCount(teacherId: string): Promise<number> {
  // Get all teacher's assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('status', 'published');

  if (assignmentsError) {
    handleSupabaseError(assignmentsError, 'getPendingGradingCount');
  }

  if (!assignments || assignments.length === 0) {
    return 0;
  }

  // Count pending submissions
  const { count, error: submissionsError } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .in(
      'assignment_id',
      assignments.map((a) => a.id)
    )
    .eq('status', 'submitted');

  if (submissionsError) {
    handleSupabaseError(submissionsError, 'getPendingGradingCount - submissions');
  }

  return count || 0;
}

async function getAverageClassAttendance(teacherId: string): Promise<number> {
  // Get teacher's sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('live_sessions')
    .select('class_id')
    .eq('teacher_id', teacherId)
    .eq('status', 'ended');

  if (sessionsError || !sessions || sessions.length === 0) {
    return 0;
  }

  // Get unique class IDs
  const classIds = [...new Set(sessions.map((s) => s.class_id))];

  // Calculate average attendance across all classes
  const attendancePromises = classIds.map(async (classId) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('class_id', classId);

    if (error || !data || data.length === 0) return 0;

    const presentCount = data.filter((a) => a.status === 'present' || a.status === 'late').length;
    return (presentCount / data.length) * 100;
  });

  const attendanceRates = await Promise.all(attendancePromises);
  const avgRate =
    attendanceRates.length > 0
      ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
      : 0;

  return Math.round(avgRate * 100) / 100;
}

// ==================== UPCOMING CLASSES ====================

/**
 * Get upcoming live classes for a teacher
 * @param teacherId - The teacher UUID
 * @param days - Number of days to look ahead
 * @returns Promise<LiveSession[]>
 */
export async function getUpcomingClasses(
  teacherId: string,
  days: number = 7
): Promise<LiveSession[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('teacher_id', teacherId)
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_start_at', new Date().toISOString())
    .lte('scheduled_start_at', futureDate.toISOString())
    .order('scheduled_start_at', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getUpcomingClasses');
  }

  return data || [];
}

// ==================== PENDING GRADING ====================

/**
 * Get pending assignment submissions that need grading
 * @param teacherId - The teacher UUID
 * @param limit - Maximum number of submissions to return
 * @returns Promise<AssignmentSubmission[]>
 */
export async function getPendingGrading(
  teacherId: string,
  limit: number = 20
): Promise<AssignmentSubmission[]> {
  // Get teacher's published assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('status', 'published');

  if (assignmentsError) {
    handleSupabaseError(assignmentsError, 'getPendingGrading');
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Get ungraded submissions
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .in(
      'assignment_id',
      assignments.map((a) => a.id)
    )
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getPendingGrading - submissions');
  }

  return data || [];
}

// ==================== STUDENTS AT RISK ====================

/**
 * Get list of students at risk (low attendance or poor performance)
 * @param teacherId - The teacher UUID
 * @returns Promise<StudentAtRisk[]>
 */
export async function getStudentAtRiskList(teacherId: string): Promise<StudentAtRisk[]> {
  // Get attendance alerts for teacher's classes
  const { data: alerts, error } = await supabase
    .from('attendance_alerts')
    .select('*, students(*)')
    .eq('teacher_id', teacherId)
    .eq('is_resolved', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getStudentAtRiskList');
  }

  if (!alerts || alerts.length === 0) {
    return [];
  }

  return alerts.map((alert: any) => ({
    student_id: alert.student_id,
    student_name: alert.students?.full_name || 'Unknown',
    risk_type: alert.alert_type,
    severity: alert.severity,
    reason: alert.message,
    suggested_action: getSuggestedAction(alert.alert_type, alert.severity),
  }));
}

function getSuggestedAction(alertType: string, severity: string): string {
  const actions: Record<string, Record<string, string>> = {
    low_attendance: {
      critical: 'Contact parent immediately and schedule intervention meeting',
      high: 'Send warning notice to parent',
      medium: 'Monitor closely and send reminder',
      low: 'Encourage consistent attendance',
    },
    consecutive_absences: {
      critical: 'Immediate parent contact required',
      high: 'Schedule parent-teacher meeting',
      medium: 'Send attendance notice',
      low: 'Follow up with student',
    },
  };

  return actions[alertType]?.[severity] || 'Monitor and take appropriate action';
}

// ==================== RECENT ACTIVITY ====================

/**
 * Get recent activity for a teacher
 * @param teacherId - The teacher UUID
 * @param limit - Maximum number of activities to return
 * @returns Promise<Activity[]>
 */
export async function getRecentActivity(
  teacherId: string,
  limit: number = 10
): Promise<Activity[]> {
  // Get recent user activities
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('user_id')
    .eq('id', teacherId)
    .single();

  if (teacherError || !teacher) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_activities')
    .select('*')
    .eq('user_id', teacher.user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Table might not exist or user has no activities
    return [];
  }

  return (
    data?.map((activity) => ({
      id: activity.id,
      type: activity.activity_type,
      description: activity.description || activity.activity_type,
      timestamp: activity.created_at,
      metadata: activity.metadata,
    })) || []
  );
}

// ==================== TEACHER PERFORMANCE ====================

/**
 * Get teacher performance summary
 * Uses the teacher_performance_summary view
 * @param teacherId - The teacher UUID
 * @returns Promise<TeacherPerformance>
 */
export async function getTeacherPerformance(teacherId: string): Promise<TeacherPerformance> {
  const { data, error } = await supabase
    .from('teacher_performance_summary')
    .select('*')
    .eq('teacher_id', teacherId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No performance data yet
      return {
        teacher_id: teacherId,
        total_assignments: 0,
        average_grading_time_hours: 0,
        total_sessions: 0,
        average_attendance_percentage: 0,
        completion_rate: 0,
      };
    }
    handleSupabaseError(error, 'getTeacherPerformance');
  }

  return data;
}
