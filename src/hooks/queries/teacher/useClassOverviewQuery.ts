import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type AtRiskStudent = {
  id: string;
  student_id: string;
  name_en: string;
  name_hi?: string;
  roll_number: string;
  avatar_url?: string;
  attendance_rate: number;
  average_score: number;
  assignments_pending: number;
  risk_reason: 'low_attendance' | 'low_score' | 'both';
};

export type ClassOverviewItem = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  section: string;
  total_students: number;
  avg_attendance: number;
  avg_score: number;
  at_risk_count: number;
  at_risk_students: AtRiskStudent[];
};

// Demo data with at-risk students per class
const DEMO_CLASS_OVERVIEW: ClassOverviewItem[] = [
  {
    id: 'demo-1',
    name: 'Class 10-A',
    subject: 'Mathematics',
    grade: '10',
    section: 'A',
    total_students: 32,
    avg_attendance: 87.5,
    avg_score: 76.4,
    at_risk_count: 3,
    at_risk_students: [
      {
        id: 'ar-1',
        student_id: 'student-3',
        name_en: 'Rahul Kumar',
        name_hi: 'राहुल कुमार',
        roll_number: '03',
        attendance_rate: 68,
        average_score: 52,
        assignments_pending: 4,
        risk_reason: 'both',
      },
      {
        id: 'ar-2',
        student_id: 'student-7',
        name_en: 'Amit Verma',
        name_hi: 'अमित वर्मा',
        roll_number: '07',
        attendance_rate: 58,
        average_score: 61,
        assignments_pending: 3,
        risk_reason: 'low_attendance',
      },
      {
        id: 'ar-3',
        student_id: 'student-12',
        name_en: 'Deepak Singh',
        name_hi: 'दीपक सिंह',
        roll_number: '12',
        attendance_rate: 82,
        average_score: 48,
        assignments_pending: 5,
        risk_reason: 'low_score',
      },
    ],
  },
  {
    id: 'demo-2',
    name: 'Class 10-B',
    subject: 'Mathematics',
    grade: '10',
    section: 'B',
    total_students: 30,
    avg_attendance: 90.0,
    avg_score: 78.2,
    at_risk_count: 2,
    at_risk_students: [
      {
        id: 'ar-4',
        student_id: 'student-15',
        name_en: 'Suresh Yadav',
        name_hi: 'सुरेश यादव',
        roll_number: '15',
        attendance_rate: 72,
        average_score: 65,
        assignments_pending: 2,
        risk_reason: 'low_attendance',
      },
      {
        id: 'ar-5',
        student_id: 'student-22',
        name_en: 'Kavita Sharma',
        name_hi: 'कविता शर्मा',
        roll_number: '22',
        attendance_rate: 85,
        average_score: 55,
        assignments_pending: 3,
        risk_reason: 'low_score',
      },
    ],
  },
  {
    id: 'demo-3',
    name: 'Class 9-A',
    subject: 'Mathematics',
    grade: '9',
    section: 'A',
    total_students: 35,
    avg_attendance: 91.4,
    avg_score: 74.1,
    at_risk_count: 4,
    at_risk_students: [
      {
        id: 'ar-6',
        student_id: 'student-8',
        name_en: 'Ravi Gupta',
        name_hi: 'रवि गुप्ता',
        roll_number: '08',
        attendance_rate: 65,
        average_score: 58,
        assignments_pending: 4,
        risk_reason: 'both',
      },
      {
        id: 'ar-7',
        student_id: 'student-14',
        name_en: 'Mohan Patel',
        name_hi: 'मोहन पटेल',
        roll_number: '14',
        attendance_rate: 70,
        average_score: 62,
        assignments_pending: 3,
        risk_reason: 'low_attendance',
      },
      {
        id: 'ar-8',
        student_id: 'student-21',
        name_en: 'Sunita Devi',
        name_hi: 'सुनीता देवी',
        roll_number: '21',
        attendance_rate: 88,
        average_score: 51,
        assignments_pending: 5,
        risk_reason: 'low_score',
      },
      {
        id: 'ar-9',
        student_id: 'student-29',
        name_en: 'Anil Kumar',
        name_hi: 'अनिल कुमार',
        roll_number: '29',
        attendance_rate: 75,
        average_score: 60,
        assignments_pending: 2,
        risk_reason: 'low_attendance',
      },
    ],
  },
  {
    id: 'demo-4',
    name: 'Class 9-B',
    subject: 'Mathematics',
    grade: '9',
    section: 'B',
    total_students: 28,
    avg_attendance: 89.3,
    avg_score: 72.8,
    at_risk_count: 5,
    at_risk_students: [
      {
        id: 'ar-10',
        student_id: 'student-5',
        name_en: 'Ramesh Verma',
        name_hi: 'रमेश वर्मा',
        roll_number: '05',
        attendance_rate: 62,
        average_score: 55,
        assignments_pending: 4,
        risk_reason: 'both',
      },
      {
        id: 'ar-11',
        student_id: 'student-11',
        name_en: 'Geeta Rani',
        name_hi: 'गीता रानी',
        roll_number: '11',
        attendance_rate: 78,
        average_score: 48,
        assignments_pending: 6,
        risk_reason: 'low_score',
      },
      {
        id: 'ar-12',
        student_id: 'student-16',
        name_en: 'Vikas Joshi',
        name_hi: 'विकास जोशी',
        roll_number: '16',
        attendance_rate: 68,
        average_score: 63,
        assignments_pending: 3,
        risk_reason: 'low_attendance',
      },
      {
        id: 'ar-13',
        student_id: 'student-20',
        name_en: 'Neelam Singh',
        name_hi: 'नीलम सिंह',
        roll_number: '20',
        attendance_rate: 82,
        average_score: 52,
        assignments_pending: 4,
        risk_reason: 'low_score',
      },
      {
        id: 'ar-14',
        student_id: 'student-25',
        name_en: 'Rajesh Yadav',
        name_hi: 'राजेश यादव',
        roll_number: '25',
        attendance_rate: 55,
        average_score: 58,
        assignments_pending: 5,
        risk_reason: 'both',
      },
    ],
  },
  {
    id: 'demo-5',
    name: 'Class 8-A',
    subject: 'Mathematics',
    grade: '8',
    section: 'A',
    total_students: 31,
    avg_attendance: 93.5,
    avg_score: 80.5,
    at_risk_count: 1,
    at_risk_students: [
      {
        id: 'ar-15',
        student_id: 'student-18',
        name_en: 'Prakash Mehra',
        name_hi: 'प्रकाश मेहरा',
        roll_number: '18',
        attendance_rate: 72,
        average_score: 68,
        assignments_pending: 2,
        risk_reason: 'low_attendance',
      },
    ],
  },
];

export function useClassOverviewQuery(options?: {
  maxStudentsPerClass?: number;
  attendanceThreshold?: number;
  scoreThreshold?: number;
}) {
  const customerId = useCustomerId();
  const maxStudentsPerClass = options?.maxStudentsPerClass || 3;
  const attendanceThreshold = options?.attendanceThreshold || 75;
  const scoreThreshold = options?.scoreThreshold || 60;

  return useQuery({
    queryKey: ['class-overview', customerId, { maxStudentsPerClass, attendanceThreshold, scoreThreshold }],
    queryFn: async (): Promise<ClassOverviewItem[]> => {
      // Filter at-risk students per class based on thresholds
      const filteredData = DEMO_CLASS_OVERVIEW.map(cls => ({
        ...cls,
        at_risk_students: cls.at_risk_students
          .filter(s => s.attendance_rate < attendanceThreshold || s.average_score < scoreThreshold)
          .slice(0, maxStudentsPerClass),
      }));

      return filteredData;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
