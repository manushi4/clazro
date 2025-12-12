/**
 * Academic Service Module
 *
 * This module provides API functions for academic-related operations including
 * attendance records, grades, assignments, and academic summaries.
 */

import { supabase } from '../../supabase/client';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type { StudentAcademicSummary } from '../../../types/supabase-parent.types';

/**
 * Attendance record interface
 */
export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Grade record interface
 */
export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  class_id?: string;
  assignment_id?: string;
  exam_id?: string;
  grade_type: 'assignment' | 'test' | 'exam' | 'project' | 'participation' | 'final';
  score: number;
  max_score: number;
  percentage?: number;
  letter_grade?: string;
  grade_date: string;
  teacher_id?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Assignment interface
 */
export interface Assignment {
  id: string;
  class_id: string;
  subject: string;
  title: string;
  description?: string;
  assignment_type: string;
  total_points: number;
  due_date: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'overdue';
  teacher_id?: string;
  instructions?: string;
  attachments?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Assignment submission interface
 */
export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  score?: number;
  feedback?: string;
  attachments?: Record<string, any>;
  graded_by?: string;
  graded_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get student academic summary with aggregated statistics
 * @param studentId - Student ID
 * @param startDate - Optional start date for the period
 * @param endDate - Optional end date for the period
 * @returns Promise with academic summary
 * @throws {APIError} For errors
 */
export async function getStudentAcademicSummary(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudentAcademicSummary> {
  try {
    // Set default date range if not provided (current academic year)
    const defaultStartDate = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const defaultEndDate = endDate || new Date().toISOString();

    const { data, error } = await retryWithBackoff(async () => {
      return await supabase.rpc('get_student_academic_summary', {
        p_student_id: studentId,
        p_start_date: defaultStartDate,
        p_end_date: defaultEndDate,
      });
    });

    if (error) throw parseSupabaseError(error);

    // Return default values if no data
    if (!data || data.length === 0) {
      return {
        student_id: studentId,
        period_start: defaultStartDate,
        period_end: defaultEndDate,
        attendance_rate: null,
        total_classes: 0,
        classes_present: 0,
        average_grade: null,
      };
    }

    return data[0];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get attendance records for a student
 * @param studentId - Student ID
 * @param filters - Optional filters (startDate, endDate, status)
 * @returns Promise with array of attendance records
 * @throws {APIError} For errors
 */
export async function getAttendanceRecords(
  studentId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: 'present' | 'absent' | 'late' | 'excused';
    classId?: string;
  }
): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get grades for a student
 * @param studentId - Student ID
 * @param filters - Optional filters (subject, startDate, endDate, gradeType)
 * @returns Promise with array of grades
 * @throws {APIError} For errors
 */
export async function getGrades(
  studentId: string,
  filters?: {
    subject?: string;
    startDate?: string;
    endDate?: string;
    gradeType?: 'assignment' | 'test' | 'exam' | 'project' | 'participation' | 'final';
    classId?: string;
  }
): Promise<Grade[]> {
  try {
    let query = supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('grade_date', { ascending: false });

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }

    if (filters?.startDate) {
      query = query.gte('grade_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('grade_date', filters.endDate);
    }

    if (filters?.gradeType) {
      query = query.eq('grade_type', filters.gradeType);
    }

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get assignments for a student
 * @param studentId - Student ID
 * @param status - Optional status filter
 * @returns Promise with array of assignments
 * @throws {APIError} For errors
 */
export async function getAssignments(
  studentId: string,
  status?: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'overdue'
): Promise<Assignment[]> {
  try {
    // First, get the student's classes
    const { data: studentClasses, error: classError } = await supabase
      .from('student_enrollments')
      .select('class_id')
      .eq('student_id', studentId);

    if (classError) throw parseSupabaseError(classError);

    if (!studentClasses || studentClasses.length === 0) {
      return [];
    }

    const classIds = studentClasses.map(sc => sc.class_id);

    let query = supabase
      .from('assignments')
      .select('*')
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get assignment submissions for a student
 * @param studentId - Student ID
 * @param assignmentId - Optional assignment ID filter
 * @returns Promise with array of assignment submissions
 * @throws {APIError} For errors
 */
export async function getAssignmentSubmissions(
  studentId: string,
  assignmentId?: string
): Promise<AssignmentSubmission[]> {
  try {
    let query = supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submission_date', { ascending: false });

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get attendance statistics for a student
 * @param studentId - Student ID
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Promise with attendance statistics
 * @throws {APIError} For errors
 */
export async function getAttendanceStats(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}> {
  try {
    const records = await getAttendanceRecords(studentId, { startDate, endDate });

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
      attendanceRate: 0,
    };

    // Calculate attendance rate (present + excused / total)
    if (stats.total > 0) {
      stats.attendanceRate = ((stats.present + stats.excused) / stats.total) * 100;
    }

    return stats;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get grade average for a student by subject
 * @param studentId - Student ID
 * @param subject - Subject name
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Promise with average grade
 * @throws {APIError} For errors
 */
export async function getSubjectGradeAverage(
  studentId: string,
  subject: string,
  startDate?: string,
  endDate?: string
): Promise<number | null> {
  try {
    const grades = await getGrades(studentId, { subject, startDate, endDate });

    if (grades.length === 0) return null;

    // Calculate weighted average based on percentage
    const totalPercentage = grades.reduce((sum, grade) => {
      const percentage = grade.percentage || (grade.score / grade.max_score) * 100;
      return sum + percentage;
    }, 0);

    return totalPercentage / grades.length;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}
