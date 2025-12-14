/**
 * Assignment Service
 * Handles assignments, submissions, and grading
 * Phase 71: Comprehensive API Integration Layer
 */

import supabase, { ApiResponse } from '../../lib/supabase';
import {
  Assignment, AssignmentInsert, AssignmentUpdate,
  Submission, SubmissionInsert, SubmissionUpdate,
  QueryParams, Profile
} from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';
import { ValidationHelper, ValidationSchemas } from '../utils/ValidationHelper';
import { cacheManager, CacheKeys, CacheDurations } from '../utils/CacheManager';

export class AssignmentService {
  private static instance: AssignmentService;

  private constructor() {}

  public static getInstance(): AssignmentService {
    if (!AssignmentService.instance) {
      AssignmentService.instance = new AssignmentService();
    }
    return AssignmentService.instance;
  }

  /**
   * Create a new assignment
   */
  public async createAssignment(
    teacherId: string,
    assignmentData: Omit<AssignmentInsert, 'teacher_id'>
  ): Promise<ApiResponse<Assignment>> {
    try {
      // Validate assignment data
      const validationResult = ValidationHelper.validateObject(
        assignmentData,
        ValidationSchemas.assignment
      );
      if (!validationResult.isValid) {
        return createErrorResponse(
          { message: validationResult.errors.join(', ') },
          'create_assignment',
          teacherId
        );
      }

      const newAssignment: AssignmentInsert = {
        ...assignmentData,
        teacher_id: teacherId,
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('assignments')
        .insert(newAssignment)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'create_assignment', teacherId);
      }

      // Invalidate related caches
      await cacheManager.invalidateByPrefix(`assignments_class_${assignmentData.class_id}`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'create_assignment', teacherId);
    }
  }

  /**
   * Update assignment
   */
  public async updateAssignment(
    assignmentId: string,
    updates: AssignmentUpdate,
    teacherId: string
  ): Promise<ApiResponse<Assignment>> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('teacher_id', teacherId) // Ensure teacher can only update their own assignments
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'update_assignment', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`assignments_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'update_assignment', teacherId);
    }
  }

  /**
   * Publish assignment (make it available to students)
   */
  public async publishAssignment(
    assignmentId: string,
    teacherId: string
  ): Promise<ApiResponse<Assignment>> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'publish_assignment', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`assignments_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'publish_assignment', teacherId);
    }
  }

  /**
   * Get assignments by class
   */
  public async getAssignmentsByClass(
    classId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Assignment[]>> {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      const offset = (page - 1) * limit;

      // Check cache
      const cacheKey = CacheKeys.assignments(classId);
      if (page === 1 && !Object.keys(filters).length) {
        const cached = await cacheManager.get<Assignment[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      let query = supabase
        .from('assignments')
        .select(`
          *,
          classes (title, subject),
          profiles!assignments_teacher_id_fkey (full_name),
          submissions (count)
        `)
        .eq('class_id', classId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.due_after) {
        query = query.gte('due_date', filters.due_after);
      }
      if (filters.due_before) {
        query = query.lte('due_date', filters.due_before);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_assignments_by_class', undefined);
      }

      // Cache first page of unfiltered results
      if (page === 1 && !Object.keys(filters).length && data) {
        await cacheManager.set(cacheKey, data, { ttl: CacheDurations.MEDIUM });
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_assignments_by_class', undefined);
    }
  }

  /**
   * Get assignment by ID with submissions
   */
  public async getAssignmentById(
    assignmentId: string
  ): Promise<ApiResponse<Assignment & {
    submissions: (Submission & { student: Profile })[];
    submissionStats: {
      total: number;
      submitted: number;
      graded: number;
      pending: number;
    };
  }>> {
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          classes (title, subject),
          profiles!assignments_teacher_id_fkey (full_name, avatar_url)
        `)
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        return createErrorResponse(assignmentError, 'get_assignment_by_id', undefined);
      }

      // Get submissions with student info
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!submissions_student_id_fkey (*)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        return createErrorResponse(submissionsError, 'get_assignment_by_id', undefined);
      }

      // Calculate submission stats
      const submissionStats = {
        total: submissions?.length || 0,
        submitted: submissions?.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0,
        graded: submissions?.filter(s => s.status === 'graded').length || 0,
        pending: submissions?.filter(s => s.status === 'pending').length || 0,
      };

      const result = {
        ...assignment,
        submissions: submissions?.map(s => ({
          ...s,
          student: s.profiles as Profile,
        })) || [],
        submissionStats,
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'get_assignment_by_id', undefined);
    }
  }

  /**
   * Get assignments by teacher
   */
  public async getAssignmentsByTeacher(
    teacherId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<Assignment[]>> {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('assignments')
        .select(`
          *,
          classes (title, subject),
          submissions (count)
        `)
        .eq('teacher_id', teacherId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.class_id) {
        query = query.eq('class_id', filters.class_id);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_assignments_by_teacher', teacherId);
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      return createErrorResponse(error, 'get_assignments_by_teacher', teacherId);
    }
  }

  /**
   * Grade submission
   */
  public async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    graderId: string
  ): Promise<ApiResponse<Submission>> {
    try {
      // Validate grade
      if (grade < 0 || grade > 100) {
        return createErrorResponse(
          { message: 'Grade must be between 0 and 100' },
          'grade_submission',
          graderId
        );
      }

      const { data, error } = await supabase
        .from('submissions')
        .update({
          grade,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: graderId,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'grade_submission', graderId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`submissions_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'grade_submission', graderId);
    }
  }

  /**
   * Get submissions for assignment
   */
  public async getSubmissionsForAssignment(
    assignmentId: string,
    params: QueryParams = {}
  ): Promise<ApiResponse<(Submission & { student: Profile })[]>> {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('submissions')
        .select(`
          *,
          profiles!submissions_student_id_fkey (*)
        `)
        .eq('assignment_id', assignmentId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('submitted_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_submissions_for_assignment', undefined);
      }

      const submissionsWithStudents = data?.map(submission => ({
        ...submission,
        student: submission.profiles as Profile,
      })) || [];

      return createSuccessResponse(submissionsWithStudents);
    } catch (error) {
      return createErrorResponse(error, 'get_submissions_for_assignment', undefined);
    }
  }

  /**
   * Get pending grading for teacher
   */
  public async getPendingGrading(
    teacherId: string,
    limit: number = 20
  ): Promise<ApiResponse<(Submission & {
    assignment: Assignment;
    student: Profile;
  })[]>> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments!inner (*),
          profiles!submissions_student_id_fkey (*)
        `)
        .eq('assignments.teacher_id', teacherId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })
        .limit(limit);

      if (error) {
        return createErrorResponse(error, 'get_pending_grading', teacherId);
      }

      const pendingSubmissions = data?.map(submission => ({
        ...submission,
        assignment: submission.assignments as Assignment,
        student: submission.profiles as Profile,
      })) || [];

      return createSuccessResponse(pendingSubmissions);
    } catch (error) {
      return createErrorResponse(error, 'get_pending_grading', teacherId);
    }
  }

  /**
   * Get assignment statistics for teacher
   */
  public async getAssignmentStats(
    teacherId: string
  ): Promise<ApiResponse<{
    totalAssignments: number;
    publishedAssignments: number;
    draftAssignments: number;
    pendingSubmissions: number;
    totalSubmissions: number;
    averageGrade: number;
  }>> {
    try {
      // Get assignment counts
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, status')
        .eq('teacher_id', teacherId);

      const totalAssignments = assignments?.length || 0;
      const publishedAssignments = assignments?.filter(a => a.status === 'published').length || 0;
      const draftAssignments = assignments?.filter(a => a.status === 'draft').length || 0;

      // Get submission stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          status,
          grade,
          assignments!inner (teacher_id)
        `)
        .eq('assignments.teacher_id', teacherId);

      const totalSubmissions = submissions?.length || 0;
      const pendingSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0;

      // Calculate average grade
      const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
      const totalGrades = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
      const averageGrade = gradedSubmissions.length > 0 ? totalGrades / gradedSubmissions.length : 0;

      const stats = {
        totalAssignments,
        publishedAssignments,
        draftAssignments,
        pendingSubmissions,
        totalSubmissions,
        averageGrade,
      };

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(error, 'get_assignment_stats', teacherId);
    }
  }

  /**
   * Delete assignment
   */
  public async deleteAssignment(
    assignmentId: string,
    teacherId: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('teacher_id', teacherId);

      if (error) {
        return createErrorResponse(error, 'delete_assignment', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`assignments_`);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'delete_assignment', teacherId);
    }
  }

  /**
   * Archive assignment
   */
  public async archiveAssignment(
    assignmentId: string,
    teacherId: string
  ): Promise<ApiResponse<Assignment>> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'archive_assignment', teacherId);
      }

      // Invalidate caches
      await cacheManager.invalidateByPrefix(`assignments_`);

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'archive_assignment', teacherId);
    }
  }

  /**
   * Get student's submission for assignment
   */
  public async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<ApiResponse<Submission | null>> {
    try {
      const cacheKey = CacheKeys.submissions(assignmentId, studentId);
      
      // Check cache
      const cached = await cacheManager.get<Submission>(cacheKey);
      if (cached) {
        return createSuccessResponse(cached);
      }

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) {
        return createErrorResponse(error, 'get_student_submission', studentId);
      }

      // Cache the result
      if (data) {
        await cacheManager.set(cacheKey, data, { ttl: CacheDurations.SHORT });
      }

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'get_student_submission', studentId);
    }
  }
}

// Singleton instance
export const assignmentService = AssignmentService.getInstance();
export default assignmentService;