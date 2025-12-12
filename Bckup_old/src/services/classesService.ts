/**
 * Classes Service
 * Handles all class-related operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Class = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Get all classes for a specific batch
 */
export const getClassesByBatch = async (
  batchId: string
): Promise<ServiceResponse<Class[]>> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('batch_id', batchId)
      .order('scheduled_at', { ascending: true });

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
 * Get classes for a student (based on their batch)
 */
export const getStudentClasses = async (
  studentId: string
): Promise<ServiceResponse<Class[]>> => {
  try {
    // First get student's batch
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('batch_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.batch_id) {
      return { data: null, error: 'Student batch not found', success: false };
    }

    // Get classes for that batch
    return await getClassesByBatch(student.batch_id);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get classes for a teacher
 */
export const getTeacherClasses = async (
  teacherId: string
): Promise<ServiceResponse<Class[]>> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('scheduled_at', { ascending: true });

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
 * Get upcoming classes (within next 7 days)
 */
export const getUpcomingClasses = async (
  userId: string,
  role: 'student' | 'teacher'
): Promise<ServiceResponse<Class[]>> => {
  try {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);

    let query = supabase
      .from('classes')
      .select('*')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', weekLater.toISOString())
      .order('scheduled_at', { ascending: true });

    if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    } else {
      // For student, get their batch first
      const { data: student } = await supabase
        .from('profiles')
        .select('batch_id')
        .eq('id', userId)
        .single();

      if (student?.batch_id) {
        query = query.eq('batch_id', student.batch_id);
      }
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
 * Get today's classes
 */
export const getTodayClasses = async (
  userId: string,
  role: 'student' | 'teacher'
): Promise<ServiceResponse<Class[]>> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = supabase
      .from('classes')
      .select('*')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true });

    if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    } else {
      const { data: student } = await supabase
        .from('profiles')
        .select('batch_id')
        .eq('id', userId)
        .single();

      if (student?.batch_id) {
        query = query.eq('batch_id', student.batch_id);
      }
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
 * Get a single class by ID
 */
export const getClassById = async (
  classId: string
): Promise<ServiceResponse<Class>> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
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
 * Create a new class (Teacher/Admin only)
 */
export const createClass = async (
  classData: ClassInsert
): Promise<ServiceResponse<Class>> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
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
 * Update a class
 */
export const updateClass = async (
  classId: string,
  updates: Partial<ClassInsert>
): Promise<ServiceResponse<Class>> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', classId)
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
 * Delete a class
 */
export const deleteClass = async (
  classId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get classes by date range
 */
export const getClassesByDateRange = async (
  userId: string,
  role: 'student' | 'teacher',
  startDate: Date,
  endDate: Date
): Promise<ServiceResponse<Class[]>> => {
  try {
    let query = supabase
      .from('classes')
      .select('*')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .order('scheduled_at', { ascending: true });

    if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    } else {
      const { data: student } = await supabase
        .from('profiles')
        .select('batch_id')
        .eq('id', userId)
        .single();

      if (student?.batch_id) {
        query = query.eq('batch_id', student.batch_id);
      }
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
