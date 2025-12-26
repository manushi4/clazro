import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type PendingClass = {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  subject?: string;
  scheduleTime?: string;
};

export function usePendingClassesQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['pending-classes', customerId],
    queryFn: async () => {
      // Demo data - in production, this would query classes not marked today
      const demoClasses: PendingClass[] = [
        {
          id: 'class-1',
          name: 'Class 10',
          section: 'A',
          studentCount: 42,
          subject: 'Mathematics',
          scheduleTime: '09:00 AM',
        },
        {
          id: 'class-2',
          name: 'Class 9',
          section: 'B',
          studentCount: 38,
          subject: 'Science',
          scheduleTime: '10:30 AM',
        },
        {
          id: 'class-3',
          name: 'Class 8',
          section: 'A',
          studentCount: 45,
          subject: 'English',
          scheduleTime: '12:00 PM',
        },
      ];

      return demoClasses;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
