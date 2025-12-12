/**
 * Class Service  
 * Handles class management, scheduling, and attendance
 * Phase 71: Comprehensive API Integration Layer
 */

import supabase, { ApiResponse } from '../../lib/supabase';
import {
  Class, ClassInsert, ClassUpdate, Attendance, AttendanceInsert,
  QueryParams, Profile
} from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';
import { ValidationHelper, ValidationSchemas } from '../utils/ValidationHelper';
import { cacheManager, CacheKeys, CacheDurations } from '../utils/CacheManager';

export class ClassService {
  private static instance: ClassService;

  private constructor() {}

  public static getInstance(): ClassService {
    if (!ClassService.instance) {
      ClassService.instance = new ClassService();
    }
    return ClassService.instance;
  }

  /**
   * Create a new class
   */
  public async createClass(
    teacherId: string,
    classData: Omit<ClassInsert, 'teacher_id'>
  ): Promise<ApiResponse<Class>> {
    try {
      // Validate class data
      const validationResult = ValidationHelper.validateObject(classData, ValidationSchemas.class);
      if (!validationResult.isValid) {
        return createErrorResponse(
          { message: validationResult.errors.join(', ') },
          'create_class',
          teacherId
        );
      }

      const newClass: ClassInsert = {
        ...classData,
        teacher_id: teacherId,
        status: 'scheduled',
      };

      const { data, error } = await supabase
        .from('classes')
        .insert(newClass)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'create_class', teacherId);
      }

      // Invalidate related caches
      await cacheManager.invalidateByPrefix(`classes_teacher_${teacherId}`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'create_class', teacherId);
    }
  }

  /**
   * Update class
   */
  public async updateClass(
    classId: string,
    updates: ClassUpdate,
    teacherId: string
  ): Promise<ApiResponse<Class>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId) // Ensure teacher can only update their own classes
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'update_class', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'update_class', teacherId);
    }
  }

  /**
   * Get classes by teacher
   */
  public async getClassesByTeacher(
    teacherId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Class[]>> {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      const offset = (page - 1) * limit;

      // Check cache
      const cacheKey = CacheKeys.classList(teacherId);
      if (page === 1 && !Object.keys(filters).length) {
        const cached = await cacheManager.get<Class[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      let query = supabase
        .from('classes')
        .select(`
          *,
          class_enrollments (count)
        `)
        .eq('teacher_id', teacherId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.date_from) {
        query = query.gte('scheduled_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('scheduled_at', filters.date_to);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('scheduled_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_classes_by_teacher', teacherId);
      }

      // Cache first page of unfiltered results
      if (page === 1 && !Object.keys(filters).length && data) {
        await cacheManager.set(cacheKey, data, { ttl: CacheDurations.MEDIUM });
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_classes_by_teacher', teacherId);
    }
  }

  /**
   * Get class by ID with enrolled students
   */
  public async getClassById(classId: string): Promise<ApiResponse<Class & {
    enrolledStudents: Profile[];
    attendanceCount: number;
  }>> {
    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_teacher_id_fkey (full_name, avatar_url)
        `)
        .eq('id', classId)
        .single();

      if (classError) {
        return createErrorResponse(classError, 'get_class_by_id', undefined);
      }

      // Get enrolled students
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select(`
          profiles (*)
        `)
        .eq('class_id', classId)
        .eq('is_active', true);

      if (enrollmentsError) {
        return createErrorResponse(enrollmentsError, 'get_class_by_id', undefined);
      }

      // Get attendance count for this class
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      const result = {
        ...classData,
        enrolledStudents: enrollments?.map(e => e.profiles).filter(Boolean) as Profile[] || [],
        attendanceCount: attendanceCount || 0,
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'get_class_by_id', undefined);
    }
  }

  /**
   * Start class (change status to ongoing)
   */
  public async startClass(classId: string, teacherId: string): Promise<ApiResponse<Class>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          status: 'ongoing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'start_class', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'start_class', teacherId);
    }
  }

  /**
   * End class (change status to completed)
   */
  public async endClass(classId: string, teacherId: string): Promise<ApiResponse<Class>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'end_class', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'end_class', teacherId);
    }
  }

  /**
   * Record student attendance
   */
  public async recordAttendance(
    classId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ): Promise<ApiResponse<Attendance>> {
    try {
      const attendanceData: AttendanceInsert = {
        class_id: classId,
        student_id: studentId,
        status,
        notes: notes || null,
        joined_at: status === 'present' || status === 'late' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert(attendanceData)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'record_attendance', studentId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`attendance_class_${classId}`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'record_attendance', studentId);
    }
  }

  /**
   * Get class attendance
   */
  public async getClassAttendance(classId: string): Promise<ApiResponse<(Attendance & {
    student: Profile;
  })[]>> {
    try {
      // Check cache
      const cacheKey = CacheKeys.attendance(classId);
      const cached = await cacheManager.get<(Attendance & { student: Profile })[]>(cacheKey);
      if (cached) {
        return createSuccessResponse(cached);
      }

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_student_id_fkey (*)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_class_attendance', undefined);
      }

      const attendanceWithStudents = data?.map(record => ({
        ...record,
        student: record.profiles as Profile,
      })) || [];

      // Cache the result
      await cacheManager.set(cacheKey, attendanceWithStudents, { ttl: CacheDurations.SHORT });

      return createSuccessResponse(attendanceWithStudents);
    } catch (error) {
      return createErrorResponse(error, 'get_class_attendance', undefined);
    }
  }

  /**
   * Get upcoming classes for all users
   */
  public async getUpcomingClasses(
    userId: string,
    userRole: 'teacher' | 'student',
    limit: number = 10
  ): Promise<ApiResponse<Class[]>> {
    try {
      let query;

      if (userRole === 'teacher') {
        query = supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', userId)
          .gte('scheduled_at', new Date().toISOString())
          .in('status', ['scheduled', 'ongoing']);
      } else {
        query = supabase
          .from('classes')
          .select(`
            *,
            profiles!classes_teacher_id_fkey (full_name)
          `)
          .gte('scheduled_at', new Date().toISOString())
          .in('status', ['scheduled', 'ongoing'])
          .in('id',
            supabase
              .from('class_enrollments')
              .select('class_id')
              .eq('student_id', userId)
              .eq('is_active', true)
          );
      }

      const { data, error } = await query
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) {
        return createErrorResponse(error, 'get_upcoming_classes', userId);
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_upcoming_classes', userId);
    }
  }

  /**
   * Get class analytics for teacher
   */
  public async getClassAnalytics(
    teacherId: string,
    classId?: string
  ): Promise<ApiResponse<{
    totalStudents: number;
    averageAttendance: number;
    completedClasses: number;
    upcomingClasses: number;
    attendanceByClass: { classId: string; className: string; attendanceRate: number }[];
  }>> {
    try {
      let classFilter = supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId);

      if (classId) {
        classFilter = classFilter.eq('id', classId);
      }

      // Get total enrolled students
      const { count: totalStudents } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classFilter)
        .eq('is_active', true);

      // Get class counts
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, title, status')
        .eq('teacher_id', teacherId);

      if (classesError) {
        return createErrorResponse(classesError, 'get_class_analytics', teacherId);
      }

      const completedClasses = classes?.filter(c => c.status === 'completed').length || 0;
      const upcomingClasses = classes?.filter(c => c.status === 'scheduled').length || 0;

      // Get attendance data for each class
      const attendanceByClass = await Promise.all(
        (classes || []).map(async (classItem) => {
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('status')
            .eq('class_id', classItem.id);

          const totalRecords = attendanceData?.length || 0;
          const presentRecords = attendanceData?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

          return {
            classId: classItem.id,
            className: classItem.title,
            attendanceRate,
          };
        })
      );

      const totalAttendanceRate = attendanceByClass.reduce((sum, item) => sum + item.attendanceRate, 0);
      const averageAttendance = attendanceByClass.length > 0 ? totalAttendanceRate / attendanceByClass.length : 0;

      const analytics = {
        totalStudents: totalStudents || 0,
        averageAttendance,
        completedClasses,
        upcomingClasses,
        attendanceByClass,
      };

      return createSuccessResponse(analytics);
    } catch (error) {
      return createErrorResponse(error, 'get_class_analytics', teacherId);
    }
  }

  /**
   * Cancel class
   */
  public async cancelClass(classId: string, teacherId: string): Promise<ApiResponse<Class>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'cancel_class', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'cancel_class', teacherId);
    }
  }

  /**
   * Get class enrollment statistics
   */
  public async getEnrollmentStats(classId: string): Promise<ApiResponse<{
    totalEnrolled: number;
    activeEnrolled: number;
    recentEnrollments: Profile[];
  }>> {
    try {
      // Get total and active enrollments
      const { count: totalEnrolled } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      const { count: activeEnrolled } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('is_active', true);

      // Get recent enrollments
      const { data: recentEnrollments, error } = await supabase
        .from('class_enrollments')
        .select(`
          enrolled_at,
          profiles (*)
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false })
        .limit(5);

      if (error) {
        return createErrorResponse(error, 'get_enrollment_stats', undefined);
      }

      const stats = {
        totalEnrolled: totalEnrolled || 0,
        activeEnrolled: activeEnrolled || 0,
        recentEnrollments: recentEnrollments?.map(e => e.profiles).filter(Boolean) as Profile[] || [],
      };

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(error, 'get_enrollment_stats', undefined);
    }
  }
}

// Singleton instance
export const classService = ClassService.getInstance();
export default classService;