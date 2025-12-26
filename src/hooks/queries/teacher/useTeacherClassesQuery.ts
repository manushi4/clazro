import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type TeacherClass = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  section: string;
  student_count: number;
  schedule_time?: string;
  room?: string;
};

// Demo data for when database is empty
const DEMO_CLASSES: TeacherClass[] = [
  {
    id: 'demo-1',
    name: 'Class 10-A',
    subject: 'Mathematics',
    grade: '10',
    section: 'A',
    student_count: 32,
    schedule_time: '09:00 AM',
    room: 'Room 101',
  },
  {
    id: 'demo-2',
    name: 'Class 10-B',
    subject: 'Mathematics',
    grade: '10',
    section: 'B',
    student_count: 30,
    schedule_time: '10:00 AM',
    room: 'Room 102',
  },
  {
    id: 'demo-3',
    name: 'Class 9-A',
    subject: 'Mathematics',
    grade: '9',
    section: 'A',
    student_count: 35,
    schedule_time: '11:30 AM',
    room: 'Room 103',
  },
  {
    id: 'demo-4',
    name: 'Class 9-B',
    subject: 'Mathematics',
    grade: '9',
    section: 'B',
    student_count: 28,
    schedule_time: '01:00 PM',
    room: 'Room 104',
  },
  {
    id: 'demo-5',
    name: 'Class 8-A',
    subject: 'Mathematics',
    grade: '8',
    section: 'A',
    student_count: 31,
    schedule_time: '02:30 PM',
    room: 'Room 105',
  },
];

export function useTeacherClassesQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['teacher-classes', customerId],
    queryFn: async (): Promise<TeacherClass[]> => {
      const supabase = getSupabaseClient();

      try {
        // Try to get teacher classes from database
        const { data: classes, error } = await supabase
          .from('teacher_classes')
          .select(`
            id,
            class:classes (
              id,
              name,
              grade,
              section,
              room
            ),
            subject:subjects (
              id,
              name
            )
          `)
          .eq('customer_id', customerId);

        if (error) {
          console.warn('[useTeacherClassesQuery] Query error:', error);
          return DEMO_CLASSES;
        }

        if (!classes || classes.length === 0) {
          console.log('[useTeacherClassesQuery] No classes found, using demo data');
          return DEMO_CLASSES;
        }

        // Transform the data
        const transformedClasses: TeacherClass[] = await Promise.all(
          classes.map(async (tc: any) => {
            // Get student count for this class
            const { count } = await supabase
              .from('student_classes')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', tc.class?.id);

            return {
              id: tc.id,
              name: `${tc.class?.name || 'Class'} ${tc.class?.grade || ''}-${tc.class?.section || ''}`,
              subject: tc.subject?.name || 'Subject',
              grade: tc.class?.grade || '',
              section: tc.class?.section || '',
              student_count: count || 0,
              room: tc.class?.room,
            };
          })
        );

        return transformedClasses;
      } catch (error) {
        console.warn('[useTeacherClassesQuery] Database query failed, using demo data:', error);
        return DEMO_CLASSES;
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: DEMO_CLASSES,
  });
}
