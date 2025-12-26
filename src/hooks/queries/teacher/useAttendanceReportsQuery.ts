import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

// Trends data - attendance over time
export type AttendanceTrendPoint = {
  date: string;
  rate: number;
  present: number;
  absent: number;
  total: number;
};

// Class comparison data
export type ClassAttendanceData = {
  class_id: string;
  class_name_en: string;
  class_name_hi?: string;
  total_students: number;
  average_rate: number;
  today_rate: number;
  trend: 'up' | 'down' | 'stable';
};

// Low attendance student
export type LowAttendanceStudent = {
  student_id: string;
  student_name_en: string;
  student_name_hi?: string;
  roll_number: string;
  class_name_en: string;
  class_name_hi?: string;
  attendance_rate: number;
  days_absent: number;
  last_present: string;
  parent_phone?: string;
};

export type AttendanceReportsData = {
  trends: AttendanceTrendPoint[];
  classComparison: ClassAttendanceData[];
  lowAttendanceStudents: LowAttendanceStudent[];
  summary: {
    overallRate: number;
    totalStudents: number;
    lowAttendanceCount: number;
    perfectAttendanceCount: number;
  };
};

// Demo data
const generateTrendsData = (): AttendanceTrendPoint[] => {
  const data: AttendanceTrendPoint[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const rate = 85 + Math.random() * 12;
    const total = 156;
    const present = Math.round((rate / 100) * total);

    data.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(rate * 10) / 10,
      present,
      absent: total - present,
      total,
    });
  }
  return data;
};

const DEMO_CLASS_COMPARISON: ClassAttendanceData[] = [
  { class_id: 'c1', class_name_en: 'Class 10-A', class_name_hi: 'कक्षा 10-A', total_students: 35, average_rate: 94.2, today_rate: 91.4, trend: 'stable' },
  { class_id: 'c2', class_name_en: 'Class 9-B', class_name_hi: 'कक्षा 9-B', total_students: 38, average_rate: 91.5, today_rate: 92.1, trend: 'up' },
  { class_id: 'c3', class_name_en: 'Class 8-C', class_name_hi: 'कक्षा 8-C', total_students: 40, average_rate: 88.3, today_rate: 85.0, trend: 'down' },
  { class_id: 'c4', class_name_en: 'Class 7-A', class_name_hi: 'कक्षा 7-A', total_students: 42, average_rate: 92.1, today_rate: 95.2, trend: 'up' },
  { class_id: 'c5', class_name_en: 'Class 6-B', class_name_hi: 'कक्षा 6-B', total_students: 36, average_rate: 89.8, today_rate: 88.9, trend: 'stable' },
];

const DEMO_LOW_ATTENDANCE: LowAttendanceStudent[] = [
  { student_id: 's1', student_name_en: 'Rahul Kumar', student_name_hi: 'राहुल कुमार', roll_number: '03', class_name_en: 'Class 10-A', class_name_hi: 'कक्षा 10-A', attendance_rate: 62.5, days_absent: 15, last_present: '2024-12-20', parent_phone: '+91 98765 43210' },
  { student_id: 's2', student_name_en: 'Priya Singh', student_name_hi: 'प्रिया सिंह', roll_number: '12', class_name_en: 'Class 8-C', class_name_hi: 'कक्षा 8-C', attendance_rate: 68.0, days_absent: 12, last_present: '2024-12-22', parent_phone: '+91 87654 32109' },
  { student_id: 's3', student_name_en: 'Amit Verma', student_name_hi: 'अमित वर्मा', roll_number: '07', class_name_en: 'Class 9-B', class_name_hi: 'कक्षा 9-B', attendance_rate: 71.2, days_absent: 10, last_present: '2024-12-23', parent_phone: '+91 76543 21098' },
  { student_id: 's4', student_name_en: 'Sneha Gupta', student_name_hi: 'स्नेहा गुप्ता', roll_number: '18', class_name_en: 'Class 6-B', class_name_hi: 'कक्षा 6-B', attendance_rate: 73.5, days_absent: 9, last_present: '2024-12-24' },
  { student_id: 's5', student_name_en: 'Vikram Yadav', student_name_hi: 'विक्रम यादव', roll_number: '05', class_name_en: 'Class 7-A', class_name_hi: 'कक्षा 7-A', attendance_rate: 74.0, days_absent: 8, last_present: '2024-12-23', parent_phone: '+91 65432 10987' },
];

export function useAttendanceReportsQuery(options?: {
  dateRange?: 'week' | 'month' | 'quarter';
  threshold?: number;
}) {
  const customerId = useCustomerId();
  const dateRange = options?.dateRange || 'month';
  const threshold = options?.threshold || 75;

  return useQuery({
    queryKey: ['attendance-reports', customerId, { dateRange, threshold }],
    queryFn: async (): Promise<AttendanceReportsData> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const trends = generateTrendsData();
      const lowAttendanceStudents = DEMO_LOW_ATTENDANCE.filter(s => s.attendance_rate < threshold);

      return {
        trends,
        classComparison: DEMO_CLASS_COMPARISON,
        lowAttendanceStudents,
        summary: {
          overallRate: 91.2,
          totalStudents: 191,
          lowAttendanceCount: lowAttendanceStudents.length,
          perfectAttendanceCount: 45,
        },
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
