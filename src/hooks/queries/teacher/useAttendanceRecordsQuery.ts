import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AttendanceRecord = {
  id: string;
  customer_id: string;
  student_user_id: string;
  class_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  reason?: string;
  marked_by?: string;
  created_at: string;
  // Joined fields
  student_name_en?: string;
  student_name_hi?: string;
  roll_number?: string;
  class_name_en?: string;
  class_name_hi?: string;
};

export type AttendanceRecordsQueryOptions = {
  classId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
  limit?: number;
};

/**
 * Query attendance records with flexible filtering
 * Can filter by class, student, date range, and status
 */
export function useAttendanceRecordsQuery(options: AttendanceRecordsQueryOptions = {}) {
  const customerId = useCustomerId();
  const { classId, studentId, dateFrom, dateTo, status, limit = 100 } = options;

  return useQuery({
    queryKey: ['attendance-records', customerId, { classId, studentId, dateFrom, dateTo, status, limit }],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('customer_id', customerId)
        .order('attendance_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (studentId) {
        query = query.eq('student_user_id', studentId);
      }

      if (dateFrom) {
        query = query.gte('attendance_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('attendance_date', dateTo);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AttendanceRecord[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query attendance records for a specific date
 */
export function useAttendanceByDateQuery(date: string, classId?: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['attendance-by-date', customerId, date, classId],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('customer_id', customerId)
        .eq('attendance_date', date);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AttendanceRecord[];
    },
    enabled: !!customerId && !!date,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Query attendance summary for a student
 */
export function useStudentAttendanceSummaryQuery(studentId: string, dateFrom?: string, dateTo?: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['student-attendance-summary', customerId, studentId, { dateFrom, dateTo }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('attendance_records')
        .select('status')
        .eq('customer_id', customerId)
        .eq('student_user_id', studentId);

      if (dateFrom) {
        query = query.gte('attendance_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('attendance_date', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records = data || [];
      const summary = {
        total: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        late: records.filter(r => r.status === 'late').length,
        excused: records.filter(r => r.status === 'excused').length,
        rate: 0,
      };

      summary.rate = summary.total > 0
        ? Math.round(((summary.present + summary.late) / summary.total) * 100)
        : 0;

      return summary;
    },
    enabled: !!customerId && !!studentId,
    staleTime: 1000 * 60 * 5,
  });
}
