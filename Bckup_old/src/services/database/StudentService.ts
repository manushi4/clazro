/**
 * Student Service
 * Handles student-specific operations and data management
 * Phase 71: Comprehensive API Integration Layer
 *
 * Updated to use production backend services
 */

import supabase, { ApiResponse } from '../../lib/supabase';
import {
  Profile, Class, Assignment, Submission, Attendance, ProgressTracking,
  SubmissionInsert, SubmissionUpdate, StudentDashboardData, QueryParams
} from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';
import { cacheManager, CacheKeys, CacheDurations } from '../utils/CacheManager';

// Import backend services
import {
  getStudentDashboard,
  getStudentById,
  getUpcomingAssignments,
  getRecentGrades,
  getAttendanceSummary,
  getAttendanceByDateRange,
  getAcademicPerformance,
  getUpcomingClasses,
} from '../backend/student/studentDashboardService';

import {
  getStudentAssignments,
  getStudentSubmissions,
  submitAssignment as backendSubmitAssignment,
  getSubmissionStats,
} from '../backend/student/studentAssignmentService';

import {
  getStudentProgress,
  getSubjectWiseProgress,
} from '../backend/student/studentProgressService';

export class StudentService {
  private static instance: StudentService;

  private constructor() {}

  public static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  /**
   * Get student dashboard data
   * Now uses backend service for optimized data fetching
   */
  public async getDashboardData(studentId: string): Promise<ApiResponse<StudentDashboardData>> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.userDashboard(studentId, 'student');
      const cached = await cacheManager.get<StudentDashboardData>(cacheKey);
      if (cached) {
        return createSuccessResponse(cached);
      }

      // Use backend service to get complete dashboard data
      const dashboard = await getStudentDashboard(studentId);

      // Transform backend data to match existing StudentDashboardData type
      const dashboardData: StudentDashboardData = {
        profile: dashboard.student as any, // Student type from backend
        upcomingClasses: dashboard.upcomingClasses as any,
        pendingAssignments: dashboard.upcomingAssignments as any,
        recentSubmissions: [], // Would need to add to backend service
        unreadNotifications: [], // Would need to add to backend service
      };

      // Cache the result
      await cacheManager.set(cacheKey, dashboardData, { ttl: CacheDurations.SHORT });

      return createSuccessResponse(dashboardData);
    } catch (error) {
      return createErrorResponse(error, 'get_student_dashboard', studentId);
    }
  }

  /**
   * Get student's enrolled classes
   */
  public async getEnrolledClasses(
    studentId: string, 
    params: QueryParams = {}
  ): Promise<ApiResponse<Class[]>> {
    try {
      const { page = 1, limit = 20, sortBy = 'scheduled_at', sortOrder = 'asc' } = params;
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_teacher_id_fkey (full_name, avatar_url),
          class_enrollments!inner (enrolled_at, is_active)
        `)
        .eq('class_enrollments.student_id', studentId)
        .eq('class_enrollments.is_active', true)
        .range(offset, offset + limit - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) {
        return createErrorResponse(error, 'get_enrolled_classes', studentId);
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_enrolled_classes', studentId);
    }
  }

  /**
   * Get student's assignments
   * Now uses backend service for optimized data fetching
   */
  public async getAssignments(
    studentId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Assignment[]>> {
    try {
      const { filters = {} } = params;

      // Use backend service with filters
      const assignments = await getStudentAssignments(studentId, {
        status: filters.status as any,
        subject: filters.subject,
        assignment_type: filters.assignment_type,
      });

      return createSuccessResponse(assignments as any);
    } catch (error) {
      return createErrorResponse(error, 'get_student_assignments', studentId);
    }
  }

  /**
   * Submit assignment
   * Now uses backend service for optimized submission handling
   */
  public async submitAssignment(
    studentId: string,
    assignmentId: string,
    submissionData: {
      content?: any;
      attachments?: any;
    }
  ): Promise<ApiResponse<Submission>> {
    try {
      // Use backend service to submit assignment
      const submission = await backendSubmitAssignment({
        assignment_id: assignmentId,
        student_id: studentId,
        submission_text: submissionData.content || undefined,
        attachment_urls: submissionData.attachments || undefined,
      });

      // Invalidate related caches
      await cacheManager.invalidateByPrefix(`assignments_`);
      await cacheManager.invalidateByPrefix(`dashboard_student_${studentId}`);

      return createSuccessResponse(submission as any);
    } catch (error) {
      return createErrorResponse(error, 'submit_assignment', studentId);
    }
  }

  /**
   * Get student's submissions
   * Now uses backend service for optimized data fetching
   */
  public async getSubmissions(
    studentId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Submission[]>> {
    try {
      const { filters = {} } = params;

      // Use backend service with filters
      const submissions = await getStudentSubmissions(studentId, {
        status: filters.status as any,
        assignment_id: filters.assignment_id,
      });

      return createSuccessResponse(submissions as any);
    } catch (error) {
      return createErrorResponse(error, 'get_student_submissions', studentId);
    }
  }

  /**
   * Get student's attendance records
   * Now uses backend service for optimized data fetching
   */
  public async getAttendance(
    studentId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Attendance[]>> {
    try {
      const { filters = {} } = params;

      // Use backend service with date range
      if (filters.date_from && filters.date_to) {
        const attendance = await getAttendanceByDateRange(
          studentId,
          filters.date_from,
          filters.date_to
        );
        return createSuccessResponse(attendance as any);
      } else {
        // Get attendance summary if no date range specified
        const summary = await getAttendanceSummary(studentId);
        return createSuccessResponse([summary] as any);
      }
    } catch (error) {
      return createErrorResponse(error, 'get_student_attendance', studentId);
    }
  }

  /**
   * Get student's progress tracking data
   * Now uses backend service for optimized data fetching
   */
  public async getProgressTracking(
    studentId: string,
    subject?: string
  ): Promise<ApiResponse<ProgressTracking[]>> {
    try {
      // Use backend service to get progress
      if (subject) {
        const progress = await getStudentProgress(studentId, {
          subject_id: subject,
        });
        return createSuccessResponse([progress] as any);
      } else {
        // Get subject-wise progress
        const subjectProgress = await getSubjectWiseProgress(studentId);
        return createSuccessResponse(subjectProgress as any);
      }
    } catch (error) {
      return createErrorResponse(error, 'get_progress_tracking', studentId);
    }
  }

  /**
   * Join a class (enroll)
   */
  public async joinClass(studentId: string, classId: string): Promise<ApiResponse<void>> {
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('class_enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single();

      if (existing) {
        if (existing.is_active) {
          return createErrorResponse(
            { message: 'Already enrolled in this class' },
            'join_class',
            studentId
          );
        } else {
          // Reactivate enrollment
          const { error } = await supabase
            .from('class_enrollments')
            .update({ is_active: true, enrolled_at: new Date().toISOString() })
            .eq('id', existing.id);

          if (error) {
            return createErrorResponse(error, 'join_class', studentId);
          }
        }
      } else {
        // Create new enrollment
        const { error } = await supabase
          .from('class_enrollments')
          .insert({
            student_id: studentId,
            class_id: classId,
            enrolled_at: new Date().toISOString(),
            is_active: true,
          });

        if (error) {
          return createErrorResponse(error, 'join_class', studentId);
        }
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_student_${studentId}`);
      await cacheManager.invalidateByPrefix(`dashboard_student_${studentId}`);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'join_class', studentId);
    }
  }

  /**
   * Leave a class (unenroll)
   */
  public async leaveClass(studentId: string, classId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ is_active: false })
        .eq('student_id', studentId)
        .eq('class_id', classId);

      if (error) {
        return createErrorResponse(error, 'leave_class', studentId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`classes_student_${studentId}`);
      await cacheManager.invalidateByPrefix(`dashboard_student_${studentId}`);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'leave_class', studentId);
    }
  }

  /**
   * Get academic summary for student
   */
  public async getAcademicSummary(studentId: string): Promise<ApiResponse<{
    totalClasses: number;
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
    attendanceRate: number;
  }>> {
    try {
      // Get enrolled classes count
      const { count: totalClasses } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('is_active', true);

      // Get assignments and submissions
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          submissions (grade, status)
        `)
        .in('class_id',
          supabase
            .from('class_enrollments')
            .select('class_id')
            .eq('student_id', studentId)
            .eq('is_active', true)
        )
        .eq('status', 'published');

      // Calculate assignment stats
      const totalAssignments = assignments?.length || 0;
      const submittedAssignments = assignments?.filter(a => 
        a.submissions?.some(s => s.status === 'submitted' || s.status === 'graded')
      ) || [];
      const gradedSubmissions = submittedAssignments.filter(a =>
        a.submissions?.some(s => s.grade !== null)
      );

      const totalGrades = gradedSubmissions.reduce((sum, a) => {
        const grade = a.submissions?.find(s => s.grade !== null)?.grade || 0;
        return sum + grade;
      }, 0);

      const averageGrade = gradedSubmissions.length > 0 ? totalGrades / gradedSubmissions.length : 0;

      // Get attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      const summary = {
        totalClasses: totalClasses || 0,
        totalAssignments,
        completedAssignments: submittedAssignments.length,
        averageGrade,
        attendanceRate,
      };

      return createSuccessResponse(summary);
    } catch (error) {
      return createErrorResponse(error, 'get_academic_summary', studentId);
    }
  }
}

// Singleton instance
export const studentService = StudentService.getInstance();
export default studentService;