/**
 * Student Assignment Service
 * Manage assignment submissions and viewing for students
 *
 * Database Tables:
 * - assignments
 * - assignment_submissions
 * - assignment_questions
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import { Assignment, AssignmentSubmission } from '../../../types/database/student';

// ==================== ASSIGNMENT VIEWING ====================

/**
 * Get assignment details by ID
 * @param assignmentId - The assignment UUID
 * @returns Promise<Assignment | null>
 */
export async function getAssignmentById(assignmentId: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error, 'getAssignmentById');
  }

  return data;
}

/**
 * Get all assignments for a student's class
 * @param studentId - The student UUID
 * @param filters - Optional filters (status, subject)
 * @returns Promise<Assignment[]>
 */
export async function getStudentAssignments(
  studentId: string,
  filters?: {
    status?: 'draft' | 'published' | 'archived';
    subject?: string;
    assignment_type?: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  }
): Promise<Assignment[]> {
  // Get student's class_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student?.class_id) {
    return [];
  }

  let query = supabase
    .from('assignments')
    .select('*')
    .eq('class_id', student.class_id)
    .order('due_date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters?.assignment_type) {
    query = query.eq('assignment_type', filters.assignment_type);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getStudentAssignments');
  }

  return data || [];
}

/**
 * Get assignment questions
 * @param assignmentId - The assignment UUID
 * @returns Promise<AssignmentQuestion[]>
 */
export async function getAssignmentQuestions(assignmentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('assignment_questions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('question_number', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getAssignmentQuestions');
  }

  return data || [];
}

// ==================== SUBMISSIONS ====================

/**
 * Get student's submission for an assignment
 * @param assignmentId - The assignment UUID
 * @param studentId - The student UUID
 * @returns Promise<AssignmentSubmission | null>
 */
export async function getSubmission(
  assignmentId: string,
  studentId: string
): Promise<AssignmentSubmission | null> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No submission yet
    }
    handleSupabaseError(error, 'getSubmission');
  }

  return data;
}

/**
 * Get all submissions by a student
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<AssignmentSubmission[]>
 */
export async function getStudentSubmissions(
  studentId: string,
  filters?: {
    status?: 'pending' | 'submitted' | 'graded' | 'late';
    assignment_id?: string;
  }
): Promise<AssignmentSubmission[]> {
  let query = supabase
    .from('assignment_submissions')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.assignment_id) {
    query = query.eq('assignment_id', filters.assignment_id);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getStudentSubmissions');
  }

  return data || [];
}

/**
 * Submit an assignment
 * @param submissionData - Submission data
 * @returns Promise<AssignmentSubmission>
 */
export async function submitAssignment(submissionData: {
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  attachment_urls?: string[];
}): Promise<AssignmentSubmission> {
  // Check if assignment exists and is published
  const assignment = await getAssignmentById(submissionData.assignment_id);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.status !== 'published') {
    throw new Error('Assignment is not published');
  }

  // Check if already submitted
  const existingSubmission = await getSubmission(
    submissionData.assignment_id,
    submissionData.student_id
  );

  if (existingSubmission) {
    throw new Error('Assignment already submitted. Use updateSubmission to modify.');
  }

  // Determine if submission is late
  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isLate = now > dueDate;

  const { data, error } = await supabase
    .from('assignment_submissions')
    .insert({
      ...submissionData,
      submitted_at: new Date().toISOString(),
      status: isLate ? 'late' : 'submitted',
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'submitAssignment');
  }

  return data;
}

/**
 * Update an existing submission (before grading)
 * @param submissionId - The submission UUID
 * @param updates - Fields to update
 * @returns Promise<AssignmentSubmission>
 */
export async function updateSubmission(
  submissionId: string,
  updates: {
    submission_text?: string;
    attachment_urls?: string[];
  }
): Promise<AssignmentSubmission> {
  // Check if submission exists and is not graded
  const { data: existing, error: checkError } = await supabase
    .from('assignment_submissions')
    .select('status')
    .eq('id', submissionId)
    .single();

  if (checkError) {
    handleSupabaseError(checkError, 'updateSubmission - check');
  }

  if (existing.status === 'graded') {
    throw new Error('Cannot update a graded submission');
  }

  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateSubmission');
  }

  return data;
}

/**
 * Delete a submission (only if not graded)
 * @param submissionId - The submission UUID
 * @returns Promise<void>
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  // Check if submission is graded
  const { data: existing, error: checkError } = await supabase
    .from('assignment_submissions')
    .select('status')
    .eq('id', submissionId)
    .single();

  if (checkError) {
    handleSupabaseError(checkError, 'deleteSubmission - check');
  }

  if (existing.status === 'graded') {
    throw new Error('Cannot delete a graded submission');
  }

  const { error } = await supabase.from('assignment_submissions').delete().eq('id', submissionId);

  if (error) {
    handleSupabaseError(error, 'deleteSubmission');
  }
}

// ==================== ASSIGNMENT ANALYTICS ====================

/**
 * Get submission statistics for a student
 * @param studentId - The student UUID
 * @returns Promise<SubmissionStats>
 */
export async function getSubmissionStats(studentId: string): Promise<{
  total_assignments: number;
  submitted: number;
  graded: number;
  pending: number;
  late_submissions: number;
  average_score: number;
  on_time_percentage: number;
}> {
  const submissions = await getStudentSubmissions(studentId);

  const total = submissions.length;
  const submitted = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded')
    .length;
  const graded = submissions.filter((s) => s.status === 'graded').length;
  const pending = submissions.filter((s) => s.status === 'pending').length;
  const late = submissions.filter((s) => s.status === 'late').length;

  const gradedSubmissions = submissions.filter((s) => s.score !== null && s.score !== undefined);
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
      : 0;

  const onTimePercentage = total > 0 ? ((total - late) / total) * 100 : 100;

  return {
    total_assignments: total,
    submitted,
    graded,
    pending,
    late_submissions: late,
    average_score: Math.round(averageScore * 100) / 100,
    on_time_percentage: Math.round(onTimePercentage * 100) / 100,
  };
}

/**
 * Check if assignment is overdue
 * @param assignmentId - The assignment UUID
 * @returns Promise<boolean>
 */
export async function isAssignmentOverdue(assignmentId: string): Promise<boolean> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const dueDate = new Date(assignment.due_date);
  const now = new Date();

  return now > dueDate;
}

/**
 * Get upcoming assignment deadlines
 * @param studentId - The student UUID
 * @param days - Number of days to look ahead (default: 7)
 * @returns Promise<Assignment[]>
 */
export async function getUpcomingDeadlines(
  studentId: string,
  days: number = 7
): Promise<Assignment[]> {
  // Get student's class
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student?.class_id) {
    return [];
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', student.class_id)
    .eq('status', 'published')
    .gte('due_date', now.toISOString())
    .lte('due_date', futureDate.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getUpcomingDeadlines');
  }

  // Filter out already submitted assignments
  if (!data || data.length === 0) {
    return [];
  }

  const submissions = await getStudentSubmissions(studentId);
  const submittedIds = new Set(submissions.map((s) => s.assignment_id));

  return data.filter((a) => !submittedIds.has(a.id));
}

/**
 * Get overdue assignments (not submitted)
 * @param studentId - The student UUID
 * @returns Promise<Assignment[]>
 */
export async function getOverdueAssignments(studentId: string): Promise<Assignment[]> {
  // Get student's class
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student?.class_id) {
    return [];
  }

  const now = new Date();

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', student.class_id)
    .eq('status', 'published')
    .lt('due_date', now.toISOString())
    .order('due_date', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getOverdueAssignments');
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter out already submitted assignments
  const submissions = await getStudentSubmissions(studentId);
  const submittedIds = new Set(submissions.map((s) => s.assignment_id));

  return data.filter((a) => !submittedIds.has(a.id));
}
