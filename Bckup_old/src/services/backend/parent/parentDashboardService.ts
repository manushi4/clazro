/**
 * Parent Dashboard Service
 * Provides dashboard data for parents
 *
 * Database Tables:
 * - parents
 * - parent_child_relationships
 * - students
 * - parent_action_items
 * - ai_insights
 * - financial_summary_by_parent (view)
 * - student_academic_performance (view)
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import {
  ParentDashboard,
  Parent,
  ChildSummary,
  ParentActionItem,
  AIInsight,
  FinancialSummary,
  ActionItemFilters,
} from '../../../types/database/parent';

// ==================== DASHBOARD ====================

/**
 * Get complete dashboard data for a parent
 * @param parentId - The parent UUID
 * @returns Promise<ParentDashboard>
 */
export async function getParentDashboard(parentId: string): Promise<ParentDashboard> {
  const [parent, children, actionItems, aiInsights, financialSummary] = await Promise.all([
    getParentById(parentId),
    getChildrenSummary(parentId),
    getActionItems(parentId, { status: 'pending' }),
    getAIInsights(parentId),
    getFinancialSummary(parentId),
  ]);

  if (!parent) {
    throw new Error(`Parent with ID ${parentId} not found`);
  }

  return {
    parent,
    children,
    action_items: actionItems,
    ai_insights: aiInsights,
    financial_summary: financialSummary,
    recent_communications: [], // Would fetch from communications table
  };
}

// ==================== PARENT INFO ====================

/**
 * Get parent by ID
 * @param parentId - The parent UUID
 * @returns Promise<Parent | null>
 */
export async function getParentById(parentId: string): Promise<Parent | null> {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', parentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error, 'getParentById');
  }

  return data;
}

// ==================== CHILDREN SUMMARY ====================

/**
 * Get summary of all children for a parent
 * @param parentId - The parent UUID
 * @returns Promise<ChildSummary[]>
 */
export async function getChildrenSummary(parentId: string): Promise<ChildSummary[]> {
  // Get parent-child relationships
  const { data: relationships, error: relError } = await supabase
    .from('parent_child_relationships')
    .select('student_id')
    .eq('parent_id', parentId);

  if (relError) {
    handleSupabaseError(relError, 'getChildrenSummary - relationships');
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  // Get detailed info for each child
  const childPromises = relationships.map(async (rel) => {
    const [student, performance, attendance, pendingAssignments, recentGrades] = await Promise.all(
      [
        getStudentInfo(rel.student_id),
        getStudentPerformance(rel.student_id),
        getStudentAttendance(rel.student_id),
        getPendingAssignmentCount(rel.student_id),
        getRecentGrades(rel.student_id, 5),
      ]
    );

    return {
      student,
      academic_performance: performance,
      attendance,
      pending_assignments: pendingAssignments,
      recent_grades: recentGrades,
    };
  });

  return Promise.all(childPromises);
}

async function getStudentInfo(studentId: string): Promise<any> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
}

async function getStudentPerformance(studentId: string): Promise<any> {
  const { data, error } = await supabase
    .from('student_academic_performance')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        student_id: studentId,
        average_exam_percentage: 0,
        attendance_percentage: 0,
        overall_performance: 'Needs Improvement',
      };
    }
    console.error('Error fetching performance:', error);
    return null;
  }

  return data;
}

async function getStudentAttendance(studentId: string): Promise<any> {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        student_id: studentId,
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        attendance_percentage: 0,
      };
    }
    console.error('Error fetching attendance:', error);
    return null;
  }

  return data;
}

async function getPendingAssignmentCount(studentId: string): Promise<number> {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student?.class_id) {
    return 0;
  }

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id')
    .eq('class_id', student.class_id)
    .eq('status', 'published')
    .gte('due_date', new Date().toISOString());

  if (error || !assignments) {
    return 0;
  }

  const { data: submissions, error: subError } = await supabase
    .from('assignment_submissions')
    .select('assignment_id')
    .eq('student_id', studentId)
    .in(
      'assignment_id',
      assignments.map((a) => a.id)
    );

  if (subError) {
    return 0;
  }

  const submittedIds = new Set(submissions?.map((s) => s.assignment_id) || []);
  return assignments.filter((a) => !submittedIds.has(a.id)).length;
}

async function getRecentGrades(studentId: string, limit: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('gradebook')
    .select('*')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching grades:', error);
    return [];
  }

  return data || [];
}

// ==================== ACTION ITEMS ====================

/**
 * Get action items for a parent
 * @param parentId - The parent UUID
 * @param filters - Optional filters
 * @returns Promise<ParentActionItem[]>
 */
export async function getActionItems(
  parentId: string,
  filters?: ActionItemFilters
): Promise<ParentActionItem[]> {
  let query = supabase
    .from('parent_action_items')
    .select('*')
    .eq('parent_id', parentId)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (filters?.action_type) {
    query = query.eq('action_type', filters.action_type);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getActionItems');
  }

  return data || [];
}

// ==================== AI INSIGHTS ====================

/**
 * Get AI insights for a parent
 * @param parentId - The parent UUID
 * @param studentId - Optional student filter
 * @returns Promise<AIInsight[]>
 */
export async function getAIInsights(
  parentId: string,
  studentId?: string
): Promise<AIInsight[]> {
  let query = supabase
    .from('ai_insights')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getAIInsights');
  }

  return data || [];
}

// ==================== FINANCIAL SUMMARY ====================

/**
 * Get financial summary for a parent
 * Uses the financial_summary_by_parent view
 * @param parentId - The parent UUID
 * @returns Promise<FinancialSummary>
 */
export async function getFinancialSummary(parentId: string): Promise<FinancialSummary> {
  const { data, error } = await supabase
    .from('financial_summary_by_parent')
    .select('*')
    .eq('parent_id', parentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        parent_id: parentId,
        total_fees_all_children: 0,
        total_paid: 0,
        total_outstanding: 0,
        overdue_amount: 0,
      };
    }
    handleSupabaseError(error, 'getFinancialSummary');
  }

  // Return data or fallback to empty summary if null
  return data || {
    parent_id: parentId,
    total_fees_all_children: 0,
    total_paid: 0,
    total_outstanding: 0,
    overdue_amount: 0,
  };
}
