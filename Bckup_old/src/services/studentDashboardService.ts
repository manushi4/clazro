/**
 * Student Dashboard Service
 * Aggregates data from multiple services for the student dashboard
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { getStudentClasses, getTodayClasses } from './classesService';
import { getStudentAssignments } from './assignmentsService';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Class = Database['public']['Tables']['classes']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DashboardData {
  todayClasses: Class[];
  upcomingAssignments: Assignment[];
  recentNotifications: Notification[];
  studentProfile: Profile | null;
}

export interface ProgressData {
  subject: string;
  progress: number;
  totalClasses: number;
  attendedClasses: number;
  color: string;
}

/**
 * Get comprehensive dashboard data for a student
 */
export const getStudentDashboardData = async (
  studentId: string
): Promise<ServiceResponse<DashboardData>> => {
  try {
    // Fetch all data in parallel for better performance
    const [
      profileResult,
      classesResult,
      assignmentsResult,
      notificationsResult
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single(),
      getTodayClasses(studentId),
      getStudentAssignments(studentId),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Extract data
    const studentProfile = profileResult.data;
    const todayClasses = classesResult.data || [];
    const upcomingAssignments = assignmentsResult.data || [];
    const recentNotifications = notificationsResult.data || [];

    return {
      data: {
        todayClasses,
        upcomingAssignments,
        recentNotifications,
        studentProfile
      },
      error: null,
      success: true
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get student progress data by subject
 */
export const getStudentProgress = async (
  studentId: string
): Promise<ServiceResponse<ProgressData[]>> => {
  try {
    // Get student's batch to find their subjects
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('batch_id, subjects')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return { data: null, error: 'Student not found', success: false };
    }

    // Get all classes for the student's subjects
    const subjects = student.subjects || [];
    const progressData: ProgressData[] = [];

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      // Get total classes for this subject
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('subject', subject)
        .eq('batch_id', student.batch_id);

      const totalClasses = classes?.length || 0;
      const attendedClasses = Math.floor(totalClasses * (0.7 + Math.random() * 0.3)); // Simulated attendance
      const progress = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      progressData.push({
        subject,
        progress: Math.round(progress),
        totalClasses,
        attendedClasses,
        color: colors[i % colors.length]
      });
    }

    return { data: progressData, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (
  studentId: string,
  callback: (notification: Notification) => void
) => {
  const channel = supabase
    .channel(`notifications:${studentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${studentId}`
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (
  notificationId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
