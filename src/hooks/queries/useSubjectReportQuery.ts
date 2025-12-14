/**
 * useSubjectReportQuery - Query hook for subject report screen
 * 
 * Used by: SubjectReportScreen (Fixed screen)
 * Data: Subject grades, test scores, assignments, attendance, teacher feedback
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type SubjectGrade = {
  id: string;
  term: string;
  term_en: string;
  term_hi?: string;
  grade: string;
  percentage: number;
  credits: number;
  grade_points: number;
};

export type SubjectTestScore = {
  id: string;
  title_en: string;
  title_hi?: string;
  type: 'unit_test' | 'mid_term' | 'final' | 'quiz' | 'practical';
  date: string;
  score: number;
  max_score: number;
  percentage: number;
  class_average?: number;
  rank?: number;
};

export type SubjectAssignmentScore = {
  id: string;
  title_en: string;
  title_hi?: string;
  type: 'homework' | 'project' | 'lab' | 'presentation';
  submitted_date?: string;
  score: number;
  max_score: number;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  feedback_en?: string;
  feedback_hi?: string;
};

export type SubjectAttendance = {
  total_classes: number;
  attended: number;
  percentage: number;
  excused: number;
  unexcused: number;
};

export type TeacherRemark = {
  id: string;
  date: string;
  remark_en: string;
  remark_hi?: string;
  type: 'positive' | 'improvement' | 'general';
  teacher_name: string;
};

export type SubjectReportData = {
  id: string;
  title_en: string;
  title_hi?: string;
  icon?: string;
  color?: string;
  // Overall performance
  overall_grade: string;
  overall_percentage: number;
  class_rank?: number;
  total_students?: number;
  // Term-wise grades
  grades: SubjectGrade[];
  // Test scores
  test_scores: SubjectTestScore[];
  // Assignment scores
  assignment_scores: SubjectAssignmentScore[];
  // Attendance
  attendance: SubjectAttendance;
  // Teacher remarks
  teacher_remarks: TeacherRemark[];
  // Summary stats
  tests_taken: number;
  assignments_completed: number;
  average_test_score: number;
  average_assignment_score: number;
};


// Mock data for development/fallback
const MOCK_REPORTS: Record<string, SubjectReportData> = {
  'math': {
    id: 'math',
    title_en: 'Mathematics',
    title_hi: 'गणित',
    icon: 'calculator',
    color: '#4CAF50',
    overall_grade: 'A',
    overall_percentage: 85,
    class_rank: 5,
    total_students: 45,
    grades: [
      { id: 'g1', term: 'Term 1', term_en: 'Term 1', term_hi: 'सत्र 1', grade: 'A', percentage: 88, credits: 4, grade_points: 9 },
      { id: 'g2', term: 'Term 2', term_en: 'Term 2', term_hi: 'सत्र 2', grade: 'A-', percentage: 82, credits: 4, grade_points: 8.5 },
    ],
    test_scores: [
      { id: 't1', title_en: 'Unit Test 1 - Algebra', title_hi: 'इकाई परीक्षा 1 - बीजगणित', type: 'unit_test', date: '2024-09-15', score: 42, max_score: 50, percentage: 84, class_average: 72, rank: 4 },
      { id: 't2', title_en: 'Mid Term Exam', title_hi: 'मध्यावधि परीक्षा', type: 'mid_term', date: '2024-10-20', score: 78, max_score: 100, percentage: 78, class_average: 68, rank: 8 },
      { id: 't3', title_en: 'Unit Test 2 - Geometry', title_hi: 'इकाई परीक्षा 2 - ज्यामिति', type: 'unit_test', date: '2024-11-10', score: 45, max_score: 50, percentage: 90, class_average: 75, rank: 3 },
      { id: 't4', title_en: 'Quiz - Trigonometry', title_hi: 'प्रश्नोत्तरी - त्रिकोणमिति', type: 'quiz', date: '2024-11-25', score: 18, max_score: 20, percentage: 90, class_average: 78 },
    ],
    assignment_scores: [
      { id: 'a1', title_en: 'Algebra Practice Set', title_hi: 'बीजगणित अभ्यास सेट', type: 'homework', submitted_date: '2024-09-10', score: 9, max_score: 10, status: 'graded' },
      { id: 'a2', title_en: 'Geometry Project', title_hi: 'ज्यामिति प्रोजेक्ट', type: 'project', submitted_date: '2024-10-15', score: 45, max_score: 50, status: 'graded', feedback_en: 'Excellent work on the 3D models!', feedback_hi: '3D मॉडल पर उत्कृष्ट कार्य!' },
      { id: 'a3', title_en: 'Trigonometry Worksheet', title_hi: 'त्रिकोणमिति वर्कशीट', type: 'homework', submitted_date: '2024-11-20', score: 8, max_score: 10, status: 'graded' },
    ],
    attendance: {
      total_classes: 48,
      attended: 45,
      percentage: 93.75,
      excused: 2,
      unexcused: 1,
    },
    teacher_remarks: [
      { id: 'r1', date: '2024-11-28', remark_en: 'Shows excellent problem-solving skills. Keep up the good work!', remark_hi: 'उत्कृष्ट समस्या-समाधान कौशल दिखाता है। अच्छा काम जारी रखें!', type: 'positive', teacher_name: 'Dr. Sharma' },
      { id: 'r2', date: '2024-10-25', remark_en: 'Needs to focus more on word problems. Practice recommended.', remark_hi: 'शब्द समस्याओं पर अधिक ध्यान देने की जरूरत है। अभ्यास की सिफारिश।', type: 'improvement', teacher_name: 'Dr. Sharma' },
    ],
    tests_taken: 4,
    assignments_completed: 3,
    average_test_score: 85.5,
    average_assignment_score: 88.6,
  },
  'physics': {
    id: 'physics',
    title_en: 'Physics',
    title_hi: 'भौतिकी',
    icon: 'atom',
    color: '#2196F3',
    overall_grade: 'B+',
    overall_percentage: 78,
    class_rank: 12,
    total_students: 45,
    grades: [
      { id: 'g1', term: 'Term 1', term_en: 'Term 1', term_hi: 'सत्र 1', grade: 'B+', percentage: 80, credits: 4, grade_points: 8 },
      { id: 'g2', term: 'Term 2', term_en: 'Term 2', term_hi: 'सत्र 2', grade: 'B', percentage: 76, credits: 4, grade_points: 7 },
    ],
    test_scores: [
      { id: 't1', title_en: 'Unit Test 1 - Mechanics', title_hi: 'इकाई परीक्षा 1 - यांत्रिकी', type: 'unit_test', date: '2024-09-18', score: 38, max_score: 50, percentage: 76, class_average: 70, rank: 10 },
      { id: 't2', title_en: 'Mid Term Exam', title_hi: 'मध्यावधि परीक्षा', type: 'mid_term', date: '2024-10-22', score: 72, max_score: 100, percentage: 72, class_average: 65, rank: 14 },
      { id: 't3', title_en: 'Practical Exam', title_hi: 'प्रायोगिक परीक्षा', type: 'practical', date: '2024-11-15', score: 42, max_score: 50, percentage: 84, class_average: 78, rank: 8 },
    ],
    assignment_scores: [
      { id: 'a1', title_en: 'Lab Report - Pendulum', title_hi: 'प्रयोगशाला रिपोर्ट - पेंडुलम', type: 'lab', submitted_date: '2024-09-20', score: 18, max_score: 20, status: 'graded' },
      { id: 'a2', title_en: 'Physics Project', title_hi: 'भौतिकी प्रोजेक्ट', type: 'project', submitted_date: '2024-10-28', score: 40, max_score: 50, status: 'graded' },
    ],
    attendance: {
      total_classes: 42,
      attended: 38,
      percentage: 90.48,
      excused: 3,
      unexcused: 1,
    },
    teacher_remarks: [
      { id: 'r1', date: '2024-11-20', remark_en: 'Good practical skills. Theory needs more attention.', remark_hi: 'अच्छे प्रायोगिक कौशल। सिद्धांत पर अधिक ध्यान देने की जरूरत।', type: 'general', teacher_name: 'Prof. Verma' },
    ],
    tests_taken: 3,
    assignments_completed: 2,
    average_test_score: 77.3,
    average_assignment_score: 82.9,
  },
};

const DEFAULT_REPORT: SubjectReportData = {
  id: 'unknown',
  title_en: 'Subject',
  title_hi: 'विषय',
  overall_grade: '-',
  overall_percentage: 0,
  grades: [],
  test_scores: [],
  assignment_scores: [],
  attendance: { total_classes: 0, attended: 0, percentage: 0, excused: 0, unexcused: 0 },
  teacher_remarks: [],
  tests_taken: 0,
  assignments_completed: 0,
  average_test_score: 0,
  average_assignment_score: 0,
};

export function useSubjectReportQuery(subjectId: string | undefined, childId?: string) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['subject-report', customerId, childId || userId, subjectId],
    queryFn: async (): Promise<SubjectReportData> => {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('subject_reports')
        .select(`
          *,
          subject_grades(*),
          subject_test_scores(*),
          subject_assignment_scores(*),
          subject_attendance(*),
          teacher_remarks(*)
        `)
        .eq('customer_id', customerId)
        .eq('subject_id', subjectId)
        .eq('student_id', childId || userId)
        .single();

      if (error || !data) {
        console.warn('Using mock subject report data:', error?.message);
        return MOCK_REPORTS[subjectId] || { ...DEFAULT_REPORT, id: subjectId };
      }

      // Transform DB data to expected format
      return {
        id: data.subject_id,
        title_en: data.title_en,
        title_hi: data.title_hi,
        icon: data.icon,
        color: data.color,
        overall_grade: data.overall_grade,
        overall_percentage: data.overall_percentage,
        class_rank: data.class_rank,
        total_students: data.total_students,
        grades: data.subject_grades || [],
        test_scores: data.subject_test_scores || [],
        assignment_scores: data.subject_assignment_scores || [],
        attendance: data.subject_attendance?.[0] || DEFAULT_REPORT.attendance,
        teacher_remarks: data.teacher_remarks || [],
        tests_taken: data.tests_taken || 0,
        assignments_completed: data.assignments_completed || 0,
        average_test_score: data.average_test_score || 0,
        average_assignment_score: data.average_assignment_score || 0,
      };
    },
    enabled: !!customerId && !!subjectId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
