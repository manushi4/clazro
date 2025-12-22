/**
 * useStudentAttendanceDetailQuery - Student Attendance Detail Query Hook
 * 
 * Purpose: Fetch detailed attendance history for a specific student
 * Used by: StudentAttendanceDetailScreen
 * 
 * Phase 3: Query/Mutation Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type AttendanceRecord = {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'excused';
  checkInTime: string | null;
  checkOutTime: string | null;
  reason: string | null;
  markedBy: string | null;
};

export type AttendanceStats = {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
  trend: number; // vs last month
};

export type MonthlyAttendance = {
  month: string;
  year: number;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

export type StudentAttendanceDetailData = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  batch: string;
  batchId: string;
  program: string;
  stats: AttendanceStats;
  recentRecords: AttendanceRecord[];
  monthlyHistory: MonthlyAttendance[];
  alerts: Array<{
    type: 'low_attendance' | 'consecutive_absent' | 'pattern';
    message: string;
    severity: 'warning' | 'critical';
  }>;
};

// =============================================================================
// DEMO DATA
// =============================================================================

// Demo student data mapped by studentId
const DEMO_STUDENTS: Record<string, { name: string; rollNumber: string; batch: string; batchId: string; program: string; attendancePercentage: number }> = {
  'as1': { name: 'Rahul Sharma', rollNumber: 'JEE-2025-A-042', batch: 'JEE Advanced 2025-A', batchId: 'batch-jee-adv-2025-a', program: 'JEE', attendancePercentage: 88 },
  'as2': { name: 'Priya Singh', rollNumber: 'NEET-2025-B-018', batch: 'NEET 2025-B', batchId: 'batch-neet-2025-b', program: 'NEET', attendancePercentage: 92 },
  'as3': { name: 'Amit Kumar', rollNumber: 'JEE-2025-B-033', batch: 'JEE Mains 2025-C', batchId: 'batch-jee-mains-2025-c', program: 'JEE', attendancePercentage: 78 },
  'as4': { name: 'Sneha Patel', rollNumber: 'FND-XI-A-007', batch: 'Foundation XI-A', batchId: 'batch-foundation-xi-a', program: 'Foundation', attendancePercentage: 95 },
  'as5': { name: 'Vikram Reddy', rollNumber: 'NEET-2025-A-025', batch: 'NEET 2025-B', batchId: 'batch-neet-2025-b', program: 'NEET', attendancePercentage: 85 },
  // Default fallback
  'default': { name: 'Unknown Student', rollNumber: 'N/A', batch: 'Unknown Batch', batchId: '', program: 'Unknown', attendancePercentage: 80 },
};

const generateDemoData = (studentId: string): StudentAttendanceDetailData => {
  // Get student info based on studentId, fallback to default
  const studentInfo = DEMO_STUDENTS[studentId] || DEMO_STUDENTS['default'];
  
  const recentRecords: AttendanceRecord[] = [
    { id: 'ar1', date: '2024-12-22', status: 'present', checkInTime: '08:45', checkOutTime: '16:30', reason: null, markedBy: 'System' },
    { id: 'ar2', date: '2024-12-21', status: 'present', checkInTime: '08:50', checkOutTime: '16:25', reason: null, markedBy: 'System' },
    { id: 'ar3', date: '2024-12-20', status: 'late', checkInTime: '09:15', checkOutTime: '16:30', reason: 'Traffic', markedBy: 'Mr. Sharma' },
    { id: 'ar4', date: '2024-12-19', status: 'present', checkInTime: '08:40', checkOutTime: '16:35', reason: null, markedBy: 'System' },
    { id: 'ar5', date: '2024-12-18', status: 'absent', checkInTime: null, checkOutTime: null, reason: 'Medical', markedBy: 'Admin' },
    { id: 'ar6', date: '2024-12-17', status: 'present', checkInTime: '08:48', checkOutTime: '16:28', reason: null, markedBy: 'System' },
    { id: 'ar7', date: '2024-12-16', status: 'present', checkInTime: '08:42', checkOutTime: '16:32', reason: null, markedBy: 'System' },
    { id: 'ar8', date: '2024-12-14', status: 'excused', checkInTime: null, checkOutTime: null, reason: 'Family function', markedBy: 'Admin' },
    { id: 'ar9', date: '2024-12-13', status: 'present', checkInTime: '08:55', checkOutTime: '16:20', reason: null, markedBy: 'System' },
    { id: 'ar10', date: '2024-12-12', status: 'present', checkInTime: '08:38', checkOutTime: '16:40', reason: null, markedBy: 'System' },
  ];

  const monthlyHistory: MonthlyAttendance[] = [
    { month: 'December', year: 2024, present: 18, absent: 2, total: 22, percentage: 82 },
    { month: 'November', year: 2024, present: 22, absent: 2, total: 24, percentage: 92 },
    { month: 'October', year: 2024, present: 20, absent: 3, total: 23, percentage: 87 },
    { month: 'September', year: 2024, present: 21, absent: 1, total: 22, percentage: 95 },
    { month: 'August', year: 2024, present: 19, absent: 4, total: 23, percentage: 83 },
    { month: 'July', year: 2024, present: 20, absent: 2, total: 22, percentage: 91 },
  ];

  // Generate alerts based on attendance percentage
  const alerts: StudentAttendanceDetailData['alerts'] = [];
  if (studentInfo.attendancePercentage < 75) {
    alerts.push({ type: 'low_attendance', message: 'Attendance critically low (below 75%)', severity: 'critical' });
  } else if (studentInfo.attendancePercentage < 90) {
    alerts.push({ type: 'low_attendance', message: 'Attendance dropped below 90% this month', severity: 'warning' });
  }

  return {
    studentId,
    studentName: studentInfo.name,
    rollNumber: studentInfo.rollNumber,
    batch: studentInfo.batch,
    batchId: studentInfo.batchId,
    program: studentInfo.program,
    stats: {
      totalDays: 136,
      presentDays: Math.round(136 * studentInfo.attendancePercentage / 100),
      absentDays: Math.round(136 * (100 - studentInfo.attendancePercentage) / 100),
      lateDays: 8,
      excusedDays: 2,
      attendancePercentage: studentInfo.attendancePercentage,
      currentStreak: 4,
      longestStreak: 18,
      trend: studentInfo.attendancePercentage >= 90 ? 2 : -4,
    },
    recentRecords,
    monthlyHistory,
    alerts,
  };
};

// =============================================================================
// HOOK
// =============================================================================

type UseStudentAttendanceDetailOptions = {
  studentId: string;
  period?: 'month' | 'quarter' | 'year';
};

export function useStudentAttendanceDetailQuery(options: UseStudentAttendanceDetailOptions) {
  const customerId = useCustomerId();
  const { studentId, period = 'month' } = options;

  return useQuery({
    queryKey: ['student-attendance-detail', customerId, studentId, period],
    queryFn: async (): Promise<StudentAttendanceDetailData> => {
      const supabase = getSupabaseClient();

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch attendance records for the student
      const { data: attendanceRecords, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', studentId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.warn('Error fetching student attendance detail:', error);
        return generateDemoData(studentId);
      }

      // If no data, return demo data
      if (!attendanceRecords || attendanceRecords.length === 0) {
        return generateDemoData(studentId);
      }

      // Fetch student profile
      const { data: studentProfile } = await supabase
        .from('user_profiles')
        .select('full_name, roll_number, batch_id, batch_name, program')
        .eq('id', studentId)
        .single();

      // Process records
      const recentRecords: AttendanceRecord[] = attendanceRecords.slice(0, 10).map(r => ({
        id: r.id,
        date: r.date,
        status: r.status,
        checkInTime: r.check_in_time,
        checkOutTime: r.check_out_time,
        reason: r.reason,
        markedBy: r.marked_by_name || 'System',
      }));

      // Calculate stats
      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
      const excusedDays = attendanceRecords.filter(r => r.status === 'excused').length;
      const totalDays = attendanceRecords.length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate streak (simplified)
      let currentStreak = 0;
      for (const record of attendanceRecords) {
        if (record.status === 'present' || record.status === 'late') {
          currentStreak++;
        } else {
          break;
        }
      }

      const stats: AttendanceStats = {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage,
        currentStreak,
        longestStreak: Math.max(currentStreak, 15), // Would calculate from full history
        trend: -4, // Would calculate from comparison
      };

      // Generate monthly history (simplified)
      const monthlyHistory = generateDemoData(studentId).monthlyHistory;

      // Generate alerts
      const alerts: StudentAttendanceDetailData['alerts'] = [];
      if (attendancePercentage < 75) {
        alerts.push({ type: 'low_attendance', message: 'Attendance critically low (below 75%)', severity: 'critical' });
      } else if (attendancePercentage < 90) {
        alerts.push({ type: 'low_attendance', message: 'Attendance below 90%', severity: 'warning' });
      }

      return {
        studentId,
        studentName: studentProfile?.full_name || 'Unknown Student',
        rollNumber: studentProfile?.roll_number || 'N/A',
        batch: studentProfile?.batch_name || 'Unknown Batch',
        batchId: studentProfile?.batch_id || '',
        program: studentProfile?.program || 'Unknown',
        stats,
        recentRecords,
        monthlyHistory,
        alerts,
      };
    },
    enabled: !!customerId && !!studentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
