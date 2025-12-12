/**
 * Attendance Service
 * Handles all attendance-related operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Attendance = Database['public']['Tables']['attendance']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Mark attendance for a student
 */
export const markAttendance = async (
  attendanceData: AttendanceInsert
): Promise<ServiceResponse<Attendance>> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get attendance for a student
 */
export const getStudentAttendance = async (
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get attendance for a class
 */
export const getClassAttendance = async (
  classId: string,
  date: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get attendance percentage for a student
 */
export const getAttendancePercentage = async (
  studentId: string,
  subjectCode?: string
): Promise<ServiceResponse<number>> => {
  try {
    let query = supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    if (!data || data.length === 0) {
      return { data: 0, error: null, success: true };
    }

    const totalClasses = data.length;
    const presentClasses = data.filter(a => a.status === 'present' || a.status === 'late').length;
    const percentage = (presentClasses / totalClasses) * 100;

    return { data: Math.round(percentage * 10) / 10, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Bulk mark attendance for multiple students
 */
export const bulkMarkAttendance = async (
  attendanceRecords: AttendanceInsert[]
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceRecords)
      .select();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
