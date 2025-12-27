import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type RecentAttendanceRecord = {
  id: string;
  class_id: string;
  class_name_en: string;
  class_name_hi?: string;
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
  marked_at: string;
  marked_by_name: string;
};

// Demo data
const DEMO_RECENT: RecentAttendanceRecord[] = [
  {
    id: 'rec-1',
    class_id: 'class-1',
    class_name_en: 'Class 10-A',
    class_name_hi: 'कक्षा 10-A',
    date: new Date().toISOString().split('T')[0],
    total_students: 35,
    present: 32,
    absent: 2,
    late: 1,
    rate: 91.4,
    marked_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    marked_by_name: 'You',
  },
  {
    id: 'rec-2',
    class_id: 'class-2',
    class_name_en: 'Class 9-B',
    class_name_hi: 'कक्षा 9-B',
    date: new Date().toISOString().split('T')[0],
    total_students: 38,
    present: 35,
    absent: 3,
    late: 0,
    rate: 92.1,
    marked_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    marked_by_name: 'You',
  },
  {
    id: 'rec-3',
    class_id: 'class-3',
    class_name_en: 'Class 8-C',
    class_name_hi: 'कक्षा 8-C',
    date: new Date().toISOString().split('T')[0],
    total_students: 40,
    present: 38,
    absent: 1,
    late: 1,
    rate: 95.0,
    marked_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    marked_by_name: 'You',
  },
  {
    id: 'rec-4',
    class_id: 'class-1',
    class_name_en: 'Class 10-A',
    class_name_hi: 'कक्षा 10-A',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_students: 35,
    present: 33,
    absent: 1,
    late: 1,
    rate: 94.3,
    marked_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    marked_by_name: 'You',
  },
];

export function useRecentAttendanceQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['recent-attendance', customerId, { limit }],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));

      // In production, this would fetch from Supabase:
      // const { data, error } = await supabase
      //   .from('attendance_records')
      //   .select(`
      //     *,
      //     classes(name_en, name_hi)
      //   `)
      //   .eq('customer_id', customerId)
      //   .order('marked_at', { ascending: false })
      //   .limit(limit);

      return DEMO_RECENT.slice(0, limit);
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Helper to get relative time
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}
