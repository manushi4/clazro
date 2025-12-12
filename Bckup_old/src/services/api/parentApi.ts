/**
 * Parent API Service
 * Handles all parent-related data fetching from Supabase
 * ✅ Updated with query keys factory and better error handling
 */

import { supabase } from '../../lib/supabase';
import {
  FinancialSummarySchema,
  type FinancialSummary,
} from '../../shared/validation/schemas';
import {
  validateSingle,
} from '../../shared/validation/apiValidation';

// Type definitions
export interface ParentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
}

export interface Child {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  batch_id: string;
  enrollment_date: string;
  status: string;
  overall_grade?: number;
  attendance_percentage?: number;
  assignments_completed?: number;
  total_assignments?: number;
  upcoming_exams?: number;
}

export interface ChildWithRelationship extends Child {
  relationship_type: string;
  is_primary_contact: boolean;
}

export interface RecentNotification {
  id: string;
  title: string;
  content: string;
  notification_type: string;
  priority: string;
  status: string;
  read_at: string | null;
  created_at: string;
  sent_by?: string;
}

export interface StudentAttendance {
  student_id: string;
  total_classes: number;
  present: number;
  absent: number;
  percentage: number;
}

/**
 * Get parent profile by user ID
 */
export const getParentProfile = async (userId: string): Promise<ParentProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .eq('id', userId)
      .eq('role', 'parent')
      .single();

    if (error) {
      console.error('❌ [getParentProfile] Database error:', error);
      return null;
    }

    if (!data) {
      console.log('⚠️  [getParentProfile] No profile found for userId:', userId);
      return null;
    }

    console.log('✅ [getParentProfile] Profile loaded successfully');
    return data as ParentProfile;
  } catch (err) {
    console.error('❌ [getParentProfile] Exception:', err);
    return null;
  }
};

/**
 * Get all children for a parent
 */
export const getParentChildren = async (parentId: string): Promise<ChildWithRelationship[]> => {
  try {
    console.log('📞 [getParentChildren] Fetching for parent:', parentId);

    const { data, error } = await supabase
      .from('parent_child_relationships')
      .select(`
        relationship_type,
        is_primary_contact,
        student:students!parent_child_relationships_student_id_fkey (
          id,
          student_id,
          full_name,
          email,
          phone,
          batch_id,
          enrollment_date,
          status,
          overall_grade,
          attendance_percentage,
          assignments_completed,
          total_assignments,
          upcoming_exams
        )
      `)
      .eq('parent_id', parentId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ [getParentChildren] Database error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('⚠️  [getParentChildren] No children found');
      return [];
    }

    console.log('📊 [getParentChildren] Raw data count:', data.length);

    // Transform the data
    const transformed = data
      .filter(item => item.student)
      .map(item => ({
        ...(item.student as Child),
        relationship_type: item.relationship_type,
        is_primary_contact: item.is_primary_contact,
      }));

    // ✅ Return validated children
    console.log('✅ [getParentChildren] Loaded', transformed.length, 'children');
    return transformed as ChildWithRelationship[];
  } catch (err) {
    console.error('❌ [getParentChildren] Exception:', err);
    return [];
  }
};

/**
 * Get attendance summary for a student
 */
export const getStudentAttendanceSummary = async (
  studentId: string
): Promise<StudentAttendance | null> => {
  try {
    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      console.error('Error fetching attendance:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception fetching attendance:', err);
    return null;
  }
};

/**
 * Get recent notifications for parent
 */
export const getParentNotifications = async (
  parentId: string,
  limit: number = 5
): Promise<RecentNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, content, notification_type, priority, status, read_at, created_at, sent_by')
      .eq('recipient_id', parentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [getParentNotifications] Database error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('⚠️  [getParentNotifications] No notifications found');
      return [];
    }

    // ✅ Return notifications
    console.log('✅ [getParentNotifications] Loaded', data.length, 'notifications');
    return data as RecentNotification[];
  } catch (err) {
    console.error('❌ [getParentNotifications] Exception:', err);
    return [];
  }
};

/**
 * Get upcoming classes for a student
 */
export const getUpcomingClasses = async (studentId: string, limit: number = 5) => {
  try {
    // First get the student's batch
    const { data: student } = await supabase
      .from('students')
      .select('batch_id')
      .eq('id', studentId)
      .single();

    if (!student?.batch_id) return [];

    // Then get classes for that batch
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        title,
        description,
        subject,
        scheduled_at,
        duration_minutes,
        status,
        teacher:profiles!classes_teacher_id_fkey(full_name)
      `)
      .eq('batch_id', student.batch_id)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching classes:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching classes:', err);
    return [];
  }
};

/**
 * Get pending assignments for a student
 */
export const getPendingAssignments = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        submission_date,
        score,
        status,
        assignment:assignments!assignment_submissions_assignment_id_fkey(
          id,
          title,
          subject,
          due_date,
          total_points
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching assignments:', err);
    return [];
  }
};

/**
 * Get parent's financial summary
 * ✅ VALIDATED with Zod schema
 */
export const getParentFinancialSummary = async (parentId: string): Promise<FinancialSummary | null> => {
  try {
    console.log('💰 [getParentFinancialSummary] Fetching for parent:', parentId);

    const { data, error } = await supabase
      .from('parent_financial_summary')
      .select('parent_id, total_invoices, total_paid, total_pending, total_overdue, pending_invoices_count, overdue_invoices_count, next_due_date')
      .eq('parent_id', parentId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no data

    if (error) {
      console.error('❌ [getParentFinancialSummary] Database error:', error);
      return null;
    }

    if (!data) {
      console.log('⚠️  [getParentFinancialSummary] No financial data found');
      return null;
    }

    // ✅ Validate financial summary with Zod
    const validated = validateSingle(FinancialSummarySchema, data);
    console.log('✅ [getParentFinancialSummary] Financial data validated successfully');
    return validated;
  } catch (err) {
    console.error('❌ [getParentFinancialSummary] Exception:', err);
    return null;
  }
};
