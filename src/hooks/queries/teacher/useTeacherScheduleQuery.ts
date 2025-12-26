import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type TeacherScheduleEntry = {
  id: string;
  customer_id: string;
  teacher_id: string;
  class_name: string;
  class_id?: string;
  subject_en: string;
  subject_hi?: string;
  grade?: string;
  section?: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  room?: string;
  is_active: boolean;
};

// Demo data for when database is empty or unavailable
const DEMO_SCHEDULE: TeacherScheduleEntry[] = [
  {
    id: 'demo-1',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'demo-teacher',
    class_name: 'Class 10-A',
    subject_en: 'Mathematics',
    subject_hi: 'गणित',
    grade: '10',
    section: 'A',
    start_time: '09:00',
    end_time: '09:45',
    day_of_week: new Date().getDay(),
    room: 'Room 101',
    is_active: true,
  },
  {
    id: 'demo-2',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'demo-teacher',
    class_name: 'Class 10-B',
    subject_en: 'Mathematics',
    subject_hi: 'गणित',
    grade: '10',
    section: 'B',
    start_time: '10:00',
    end_time: '10:45',
    day_of_week: new Date().getDay(),
    room: 'Room 102',
    is_active: true,
  },
  {
    id: 'demo-3',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'demo-teacher',
    class_name: 'Class 9-A',
    subject_en: 'Mathematics',
    subject_hi: 'गणित',
    grade: '9',
    section: 'A',
    start_time: '11:30',
    end_time: '12:15',
    day_of_week: new Date().getDay(),
    room: 'Room 103',
    is_active: true,
  },
  {
    id: 'demo-4',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'demo-teacher',
    class_name: 'Class 9-B',
    subject_en: 'Mathematics',
    subject_hi: 'गणित',
    grade: '9',
    section: 'B',
    start_time: '13:00',
    end_time: '13:45',
    day_of_week: new Date().getDay(),
    room: 'Room 104',
    is_active: true,
  },
  {
    id: 'demo-5',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'demo-teacher',
    class_name: 'Class 8-A',
    subject_en: 'Mathematics',
    subject_hi: 'गणित',
    grade: '8',
    section: 'A',
    start_time: '14:30',
    end_time: '15:15',
    day_of_week: new Date().getDay(),
    room: 'Room 105',
    is_active: true,
  },
];

export function useTeacherScheduleQuery(options?: { limit?: number; todayOnly?: boolean }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const todayOnly = options?.todayOnly !== false;

  return useQuery({
    queryKey: ['teacher-schedule', customerId, { limit, todayOnly }],
    queryFn: async (): Promise<TeacherScheduleEntry[]> => {
      const supabase = getSupabaseClient();
      const today = new Date().getDay();

      try {
        let query = supabase
          .from('teacher_schedule')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true)
          .order('start_time', { ascending: true })
          .limit(limit);

        if (todayOnly) {
          query = query.eq('day_of_week', today);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('[useTeacherScheduleQuery] Query error:', error);
          return filterDemoData(todayOnly, today, limit);
        }

        if (!data || data.length === 0) {
          console.log('[useTeacherScheduleQuery] No data, using demo');
          return filterDemoData(todayOnly, today, limit);
        }

        return data as TeacherScheduleEntry[];
      } catch (error) {
        console.warn('[useTeacherScheduleQuery] Failed, using demo:', error);
        return filterDemoData(todayOnly, today, limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: filterDemoData(todayOnly, new Date().getDay(), limit),
  });
}

function filterDemoData(todayOnly: boolean, today: number, limit: number): TeacherScheduleEntry[] {
  const filtered = todayOnly
    ? DEMO_SCHEDULE.filter(s => s.day_of_week === today)
    : DEMO_SCHEDULE;
  return filtered.slice(0, limit);
}
