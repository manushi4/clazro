import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type AttendanceStats = {
  todayTotal: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  todayRate: number;
  weekAverage: number;
  monthAverage: number;
  classesMarked: number;
  classesTotal: number;
  pendingClasses: string[];
};

// Demo data
const DEMO_STATS: AttendanceStats = {
  todayTotal: 156,
  todayPresent: 142,
  todayAbsent: 10,
  todayLate: 4,
  todayRate: 91.0,
  weekAverage: 89.5,
  monthAverage: 92.3,
  classesMarked: 3,
  classesTotal: 5,
  pendingClasses: ['Class 8-A', 'Class 9-B'],
};

export function useAttendanceStatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['attendance-stats', customerId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // In production, this would fetch from Supabase:
      // const { data, error } = await supabase
      //   .from('attendance_records')
      //   .select('*')
      //   .eq('customer_id', customerId)
      //   .eq('attendance_date', new Date().toISOString().split('T')[0]);

      return DEMO_STATS;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
