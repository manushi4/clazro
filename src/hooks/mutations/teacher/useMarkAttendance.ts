import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import type { AttendanceStatus } from '../../queries/teacher/useAttendanceQuery';

// Re-export types for consumers
export type { AttendanceStatus };

export type MarkAttendancePayload = {
  classId: string;
  date: string; // ISO date string YYYY-MM-DD
  records: Array<{
    student_id: string;
    status: AttendanceStatus;
    check_in_time?: string;
    reason?: string;
  }>;
};

export type MarkAttendanceResult = {
  success: boolean;
  recordsUpdated: number;
  message: string;
};

export function useMarkAttendance() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MarkAttendancePayload): Promise<MarkAttendanceResult> => {
      const supabase = getSupabaseClient();

      // Prepare records for upsert
      const records = payload.records.map(r => ({
        customer_id: customerId,
        class_id: payload.classId,
        attendance_date: payload.date,
        student_user_id: r.student_id,
        status: r.status,
        check_in_time: r.check_in_time || null,
        reason: r.reason || null,
      }));

      // First, delete existing records for this class/date
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('customer_id', customerId)
        .eq('class_id', payload.classId)
        .eq('attendance_date', payload.date);

      if (deleteError) {
        console.error('[useMarkAttendance] Delete error:', deleteError);
        throw new Error(`Failed to update attendance: ${deleteError.message}`);
      }

      // Insert new records
      const { data, error: insertError } = await supabase
        .from('attendance_records')
        .insert(records)
        .select();

      if (insertError) {
        console.error('[useMarkAttendance] Insert error:', insertError);
        throw new Error(`Failed to save attendance: ${insertError.message}`);
      }

      return {
        success: true,
        recordsUpdated: data?.length || payload.records.length,
        message: `Attendance marked for ${payload.records.length} students`,
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['class-attendance', customerId, variables.classId, variables.date],
      });
      queryClient.invalidateQueries({
        queryKey: ['teacher-dashboard'],
      });
      queryClient.invalidateQueries({
        queryKey: ['class-stats'],
      });
    },
  });
}

// Offline queue for attendance marking
export type OfflineAttendanceRecord = MarkAttendancePayload & {
  id: string;
  timestamp: number;
  synced: boolean;
};
