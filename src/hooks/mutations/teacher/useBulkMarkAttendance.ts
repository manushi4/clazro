import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import type { AttendanceStatus } from '../../queries/teacher/useAttendanceQuery';

export type BulkAttendanceRecord = {
  classId: string;
  date: string;
  studentId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  reason?: string;
};

export type BulkMarkAttendancePayload = {
  records: BulkAttendanceRecord[];
};

export type BulkMarkAttendanceResult = {
  success: boolean;
  totalRecords: number;
  insertedRecords: number;
  failedRecords: number;
  errors: string[];
};

/**
 * Bulk mark attendance for multiple classes/dates/students at once
 * Useful for:
 * - Marking all students present in a class
 * - Importing attendance from external sources
 * - Catching up on missed days
 */
export function useBulkMarkAttendance() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkMarkAttendancePayload): Promise<BulkMarkAttendanceResult> => {
      const supabase = getSupabaseClient();
      const errors: string[] = [];
      let insertedCount = 0;

      // Prepare records for insert
      const records = payload.records.map(r => ({
        customer_id: customerId,
        class_id: r.classId,
        attendance_date: r.date,
        student_user_id: r.studentId,
        status: r.status,
        check_in_time: r.checkInTime || null,
        reason: r.reason || null,
      }));

      // Group by class_id and date for efficient deletion
      const groupedRecords = new Map<string, typeof records>();
      records.forEach(r => {
        const key = `${r.class_id}-${r.attendance_date}`;
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, []);
        }
        groupedRecords.get(key)!.push(r);
      });

      // Delete existing records for each class/date combination
      for (const [key, groupRecords] of groupedRecords) {
        const [classId, date] = key.split('-');
        const studentIds = groupRecords.map(r => r.student_user_id);

        const { error: deleteError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('customer_id', customerId)
          .eq('class_id', classId)
          .eq('attendance_date', date)
          .in('student_user_id', studentIds);

        if (deleteError) {
          errors.push(`Failed to clear existing records for ${key}: ${deleteError.message}`);
        }
      }

      // Insert all records in batches of 100
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { data, error: insertError } = await supabase
          .from('attendance_records')
          .insert(batch)
          .select();

        if (insertError) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${insertError.message}`);
        } else {
          insertedCount += data?.length || 0;
        }
      }

      return {
        success: errors.length === 0,
        totalRecords: records.length,
        insertedRecords: insertedCount,
        failedRecords: records.length - insertedCount,
        errors,
      };
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

/**
 * Mark all students in a class as present
 */
export function useMarkAllPresent() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classId: string;
      date: string;
      studentIds: string[];
    }) => {
      const supabase = getSupabaseClient();
      const { classId, date, studentIds } = params;

      // Delete existing records
      await supabase
        .from('attendance_records')
        .delete()
        .eq('customer_id', customerId)
        .eq('class_id', classId)
        .eq('attendance_date', date);

      // Insert all as present
      const records = studentIds.map(studentId => ({
        customer_id: customerId,
        class_id: classId,
        attendance_date: date,
        student_user_id: studentId,
        status: 'present' as AttendanceStatus,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(records)
        .select();

      if (error) throw error;

      return {
        success: true,
        markedPresent: data?.length || studentIds.length,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['class-attendance', customerId, variables.classId, variables.date],
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
}

/**
 * Quick mark single student attendance
 */
export function useQuickMarkAttendance() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classId: string;
      date: string;
      studentId: string;
      status: AttendanceStatus;
      reason?: string;
    }) => {
      const supabase = getSupabaseClient();
      const { classId, date, studentId, status, reason } = params;

      // Upsert single record
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          customer_id: customerId,
          class_id: classId,
          attendance_date: date,
          student_user_id: studentId,
          status,
          reason: reason || null,
        }, {
          onConflict: 'customer_id,class_id,attendance_date,student_user_id',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['class-attendance', customerId, variables.classId, variables.date],
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    },
  });
}
