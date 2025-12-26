import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type ClassStudent = {
  id: string;
  student_id: string;
  student_name_en: string;
  student_name_hi?: string;
  roll_number: string;
  avatar_url?: string;
  attendance_rate: number;
  average_score: number;
  assignments_pending: number;
  status: 'active' | 'inactive';
  last_attendance_date?: string;
  phone?: string;
  parent_phone?: string;
};

// Demo data for development/fallback
const DEMO_CLASS_ROSTER: ClassStudent[] = [
  {
    id: '1',
    student_id: 'student-1',
    student_name_en: 'Aarav Sharma',
    student_name_hi: 'आरव शर्मा',
    roll_number: '01',
    attendance_rate: 95,
    average_score: 87,
    assignments_pending: 1,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '2',
    student_id: 'student-2',
    student_name_en: 'Priya Patel',
    student_name_hi: 'प्रिया पटेल',
    roll_number: '02',
    attendance_rate: 88,
    average_score: 92,
    assignments_pending: 0,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '3',
    student_id: 'student-3',
    student_name_en: 'Rahul Kumar',
    student_name_hi: 'राहुल कुमार',
    roll_number: '03',
    attendance_rate: 72,
    average_score: 65,
    assignments_pending: 3,
    status: 'active',
    last_attendance_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    student_id: 'student-4',
    student_name_en: 'Ananya Singh',
    student_name_hi: 'अनन्या सिंह',
    roll_number: '04',
    attendance_rate: 98,
    average_score: 94,
    assignments_pending: 0,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '5',
    student_id: 'student-5',
    student_name_en: 'Vikram Yadav',
    student_name_hi: 'विक्रम यादव',
    roll_number: '05',
    attendance_rate: 85,
    average_score: 78,
    assignments_pending: 2,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '6',
    student_id: 'student-6',
    student_name_en: 'Sneha Gupta',
    student_name_hi: 'स्नेहा गुप्ता',
    roll_number: '06',
    attendance_rate: 92,
    average_score: 88,
    assignments_pending: 1,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '7',
    student_id: 'student-7',
    student_name_en: 'Amit Verma',
    student_name_hi: 'अमित वर्मा',
    roll_number: '07',
    attendance_rate: 60,
    average_score: 55,
    assignments_pending: 4,
    status: 'active',
    last_attendance_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    student_id: 'student-8',
    student_name_en: 'Neha Joshi',
    student_name_hi: 'नेहा जोशी',
    roll_number: '08',
    attendance_rate: 90,
    average_score: 82,
    assignments_pending: 1,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '9',
    student_id: 'student-9',
    student_name_en: 'Karan Mehta',
    student_name_hi: 'करण मेहता',
    roll_number: '09',
    attendance_rate: 78,
    average_score: 71,
    assignments_pending: 2,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
  {
    id: '10',
    student_id: 'student-10',
    student_name_en: 'Pooja Mishra',
    student_name_hi: 'पूजा मिश्रा',
    roll_number: '10',
    attendance_rate: 96,
    average_score: 90,
    assignments_pending: 0,
    status: 'active',
    last_attendance_date: new Date().toISOString(),
  },
];

export function useClassRosterQuery(options: {
  classId: string;
  searchQuery?: string;
  sortBy?: 'name' | 'roll_number' | 'attendance' | 'score';
  limit?: number;
}) {
  const customerId = useCustomerId();
  const { classId, searchQuery, sortBy = 'roll_number', limit } = options;

  return useQuery({
    queryKey: ['class-roster', customerId, classId, { searchQuery, sortBy, limit }],
    queryFn: async (): Promise<ClassStudent[]> => {
      // Filter demo data based on options
      let filtered = [...DEMO_CLASS_ROSTER];

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          s =>
            s.student_name_en.toLowerCase().includes(query) ||
            s.student_name_hi?.includes(query) ||
            s.roll_number.includes(query)
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.student_name_en.localeCompare(b.student_name_en);
          case 'attendance':
            return b.attendance_rate - a.attendance_rate;
          case 'score':
            return b.average_score - a.average_score;
          case 'roll_number':
          default:
            return a.roll_number.localeCompare(b.roll_number);
        }
      });

      // Apply limit
      if (limit) {
        filtered = filtered.slice(0, limit);
      }

      return filtered;
    },
    enabled: !!customerId && !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
