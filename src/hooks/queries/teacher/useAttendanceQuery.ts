import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type StudentAttendance = {
  student_id: string;
  student_name_en: string;
  student_name_hi?: string;
  roll_number: string;
  avatar_url?: string;
  status: AttendanceStatus;
  check_in_time?: string;
  reason?: string;
  parent_phone?: string;
};

export type AttendanceRecord = {
  id: string;
  student_user_id: string;
  status: AttendanceStatus;
  check_in_time?: string;
  reason?: string;
};

// Demo students data
const DEMO_STUDENTS: StudentAttendance[] = [
  { student_id: 'student-1', student_name_en: 'Aarav Sharma', student_name_hi: 'आरव शर्मा', roll_number: '01', status: 'present' },
  { student_id: 'student-2', student_name_en: 'Priya Patel', student_name_hi: 'प्रिया पटेल', roll_number: '02', status: 'present' },
  { student_id: 'student-3', student_name_en: 'Rahul Kumar', student_name_hi: 'राहुल कुमार', roll_number: '03', status: 'present' },
  { student_id: 'student-4', student_name_en: 'Ananya Singh', student_name_hi: 'अनन्या सिंह', roll_number: '04', status: 'present' },
  { student_id: 'student-5', student_name_en: 'Vikram Yadav', student_name_hi: 'विक्रम यादव', roll_number: '05', status: 'present' },
  { student_id: 'student-6', student_name_en: 'Sneha Gupta', student_name_hi: 'स्नेहा गुप्ता', roll_number: '06', status: 'present' },
  { student_id: 'student-7', student_name_en: 'Amit Verma', student_name_hi: 'अमित वर्मा', roll_number: '07', status: 'present' },
  { student_id: 'student-8', student_name_en: 'Neha Joshi', student_name_hi: 'नेहा जोशी', roll_number: '08', status: 'present' },
  { student_id: 'student-9', student_name_en: 'Karan Mehta', student_name_hi: 'करण मेहता', roll_number: '09', status: 'present' },
  { student_id: 'student-10', student_name_en: 'Pooja Mishra', student_name_hi: 'पूजा मिश्रा', roll_number: '10', status: 'present' },
  { student_id: 'student-11', student_name_en: 'Ravi Tiwari', student_name_hi: 'रवि तिवारी', roll_number: '11', status: 'present' },
  { student_id: 'student-12', student_name_en: 'Kavita Reddy', student_name_hi: 'कविता रेड्डी', roll_number: '12', status: 'present' },
  { student_id: 'student-13', student_name_en: 'Sanjay Nair', student_name_hi: 'संजय नायर', roll_number: '13', status: 'present' },
  { student_id: 'student-14', student_name_en: 'Meera Iyer', student_name_hi: 'मीरा अय्यर', roll_number: '14', status: 'present' },
  { student_id: 'student-15', student_name_en: 'Deepak Jha', student_name_hi: 'दीपक झा', roll_number: '15', status: 'present' },
  { student_id: 'student-16', student_name_en: 'Anjali Saxena', student_name_hi: 'अंजलि सक्सेना', roll_number: '16', status: 'present' },
  { student_id: 'student-17', student_name_en: 'Vishal Pandey', student_name_hi: 'विशाल पांडे', roll_number: '17', status: 'present' },
  { student_id: 'student-18', student_name_en: 'Swati Agarwal', student_name_hi: 'स्वाति अग्रवाल', roll_number: '18', status: 'present' },
  { student_id: 'student-19', student_name_en: 'Nikhil Sharma', student_name_hi: 'निखिल शर्मा', roll_number: '19', status: 'present' },
  { student_id: 'student-20', student_name_en: 'Ritika Bansal', student_name_hi: 'रितिका बंसल', roll_number: '20', status: 'present' },
  { student_id: 'student-21', student_name_en: 'Ajay Chauhan', student_name_hi: 'अजय चौहान', roll_number: '21', status: 'present' },
  { student_id: 'student-22', student_name_en: 'Divya Kapoor', student_name_hi: 'दिव्या कपूर', roll_number: '22', status: 'present' },
  { student_id: 'student-23', student_name_en: 'Rohit Singh', student_name_hi: 'रोहित सिंह', roll_number: '23', status: 'present' },
  { student_id: 'student-24', student_name_en: 'Nisha Verma', student_name_hi: 'निशा वर्मा', roll_number: '24', status: 'present' },
  { student_id: 'student-25', student_name_en: 'Manish Dubey', student_name_hi: 'मनीष दुबे', roll_number: '25', status: 'present' },
  { student_id: 'student-26', student_name_en: 'Preeti Malhotra', student_name_hi: 'प्रीति मल्होत्रा', roll_number: '26', status: 'present' },
  { student_id: 'student-27', student_name_en: 'Suresh Rao', student_name_hi: 'सुरेश राव', roll_number: '27', status: 'present' },
  { student_id: 'student-28', student_name_en: 'Geeta Pillai', student_name_hi: 'गीता पिल्लई', roll_number: '28', status: 'present' },
  { student_id: 'student-29', student_name_en: 'Pankaj Mishra', student_name_hi: 'पंकज मिश्रा', roll_number: '29', status: 'present' },
  { student_id: 'student-30', student_name_en: 'Shweta Kulkarni', student_name_hi: 'श्वेता कुलकर्णी', roll_number: '30', status: 'present' },
];

export function useClassAttendanceQuery(options: {
  classId: string;
  date: string; // ISO date string YYYY-MM-DD
}) {
  const customerId = useCustomerId();
  const { classId, date } = options;

  return useQuery({
    queryKey: ['class-attendance', customerId, classId, date],
    queryFn: async (): Promise<StudentAttendance[]> => {
      // Return demo data with all students marked as present by default
      // In production, this would fetch from Supabase and merge with existing records
      return DEMO_STUDENTS.map(s => ({ ...s, status: 'present' as AttendanceStatus }));
    },
    enabled: !!customerId && !!classId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Get attendance summary stats
export function getAttendanceSummary(students: StudentAttendance[]) {
  const summary = {
    total: students.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  };

  students.forEach(s => {
    if (s.status === 'present') summary.present++;
    else if (s.status === 'absent') summary.absent++;
    else if (s.status === 'late') summary.late++;
    else if (s.status === 'excused') summary.excused++;
  });

  summary.percentage = summary.total > 0
    ? Math.round(((summary.present + summary.late) / summary.total) * 100)
    : 0;

  return summary;
}
