/**
 * Assignments Service
 * Handles all assignment and submission-related operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
type Submission = Database['public']['Tables']['assignment_submissions']['Row'];
type SubmissionInsert = Database['public']['Tables']['assignment_submissions']['Insert'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface AssignmentWithSubmission extends Assignment {
  submission?: Submission | null;
}

/**
 * Get all assignments for a class
 */
export const getAssignmentsByClass = async (
  classId: string
): Promise<ServiceResponse<Assignment[]>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .eq('status', 'published')
      .order('due_date', { ascending: true });

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
 * Get assignments for a student with their submission status
 */
export const getStudentAssignments = async (
  studentId: string
): Promise<ServiceResponse<AssignmentWithSubmission[]>> => {
  try {
    // First get student's batch to find their classes
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('batch_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.batch_id) {
      return { data: null, error: 'Student batch not found', success: false };
    }

    // Get all classes for the batch
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('batch_id', student.batch_id);

    if (classesError) {
      return { data: null, error: classesError.message, success: false };
    }

    const classIds = classes?.map(c => c.id) || [];

    if (classIds.length === 0) {
      return { data: [], error: null, success: true };
    }

    // Get all assignments for these classes
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .in('class_id', classIds)
      .eq('status', 'published')
      .order('due_date', { ascending: true });

    if (assignmentsError) {
      return { data: null, error: assignmentsError.message, success: false };
    }

    // Get submissions for these assignments
    const assignmentIds = assignments?.map(a => a.id) || [];
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('student_id', studentId);

    // Merge assignments with submissions
    const assignmentsWithSubmissions: AssignmentWithSubmission[] = (assignments || []).map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.id);
      return {
        ...assignment,
        submission: submission || null,
      };
    });

    return { data: assignmentsWithSubmissions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get assignments created by a teacher
 */
export const getTeacherAssignments = async (
  teacherId: string
): Promise<ServiceResponse<Assignment[]>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

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
 * Get a single assignment by ID
 */
export const getAssignmentById = async (
  assignmentId: string
): Promise<ServiceResponse<Assignment>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
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
 * Create a new assignment (Teacher only)
 */
export const createAssignment = async (
  assignmentData: AssignmentInsert
): Promise<ServiceResponse<Assignment>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
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
 * Update an assignment
 */
export const updateAssignment = async (
  assignmentId: string,
  updates: Partial<AssignmentInsert>
): Promise<ServiceResponse<Assignment>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId)
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
 * Submit an assignment (Student)
 */
export const submitAssignment = async (
  submissionData: SubmissionInsert
): Promise<ServiceResponse<Submission>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submissionData)
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
 * Update a submission
 */
export const updateSubmission = async (
  submissionId: string,
  updates: Partial<SubmissionInsert>
): Promise<ServiceResponse<Submission>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update(updates)
      .eq('id', submissionId)
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
 * Get submissions for an assignment (Teacher)
 */
export const getAssignmentSubmissions = async (
  assignmentId: string
): Promise<ServiceResponse<Submission[]>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submission_date', { ascending: false });

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
 * Grade a submission (Teacher)
 */
export const gradeSubmission = async (
  submissionId: string,
  score: number,
  feedback: string,
  gradedBy: string
): Promise<ServiceResponse<Submission>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        score,
        feedback,
        graded_by: gradedBy,
        graded_at: new Date().toISOString(),
        status: 'graded',
      })
      .eq('id', submissionId)
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
 * Get pending (unsubmitted) assignments for a student
 */
export const getPendingAssignments = async (
  studentId: string
): Promise<ServiceResponse<AssignmentWithSubmission[]>> => {
  try {
    const result = await getStudentAssignments(studentId);

    if (!result.success || !result.data) {
      return result;
    }

    // Filter to only pending (not submitted) assignments
    const pending = result.data.filter(a => !a.submission);

    return { data: pending, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get overdue assignments for a student
 */
export const getOverdueAssignments = async (
  studentId: string
): Promise<ServiceResponse<AssignmentWithSubmission[]>> => {
  try {
    const result = await getStudentAssignments(studentId);

    if (!result.success || !result.data) {
      return result;
    }

    const now = new Date();
    // Filter to overdue (past due date and not submitted)
    const overdue = result.data.filter(a =>
      !a.submission && new Date(a.due_date) < now
    );

    return { data: overdue, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get student's submission for a specific assignment
 */
export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<ServiceResponse<Submission>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || null, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Delete an assignment (Teacher)
 */
export const deleteAssignment = async (
  assignmentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
