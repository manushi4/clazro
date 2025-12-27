import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type AtRiskStudent = {
  id: string;
  customer_id: string;
  student_id: string;
  teacher_id?: string;
  student_name_en: string;
  student_name_hi?: string;
  class_name: string;
  section?: string;
  roll_number?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  primary_concern_en: string;
  primary_concern_hi?: string;
  secondary_concerns?: string[];
  attendance_rate?: number;
  assignment_completion_rate?: number;
  average_score?: number;
  recent_trend: 'improving' | 'stable' | 'declining';
  last_intervention_date?: string;
  intervention_notes?: string;
  follow_up_date?: string;
  status: 'active' | 'resolved' | 'monitoring';
  created_at: string;
  updated_at: string;
};

// Demo data for development/fallback
const DEMO_AT_RISK_STUDENTS: AtRiskStudent[] = [
  // Class 10-A
  {
    id: '1',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-1',
    student_name_en: 'Rahul Sharma',
    student_name_hi: 'राहुल शर्मा',
    class_name: 'Class 10',
    section: 'A',
    roll_number: '15',
    risk_level: 'high',
    risk_score: 75,
    primary_concern_en: 'Low attendance and declining test scores',
    primary_concern_hi: 'कम उपस्थिति और घटते परीक्षा अंक',
    secondary_concerns: ['Missing assignments', 'Lack of class participation'],
    attendance_rate: 62,
    assignment_completion_rate: 45,
    average_score: 48,
    recent_trend: 'declining',
    follow_up_date: '2024-12-28',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-4',
    student_name_en: 'Sneha Gupta',
    student_name_hi: 'स्नेहा गुप्ता',
    class_name: 'Class 10',
    section: 'A',
    roll_number: '31',
    risk_level: 'low',
    risk_score: 35,
    primary_concern_en: 'Recent drop in Science performance',
    primary_concern_hi: 'विज्ञान में हालिया प्रदर्शन में गिरावट',
    attendance_rate: 92,
    assignment_completion_rate: 88,
    average_score: 65,
    recent_trend: 'improving',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-8',
    student_name_en: 'Ravi Verma',
    student_name_hi: 'रवि वर्मा',
    class_name: 'Class 10',
    section: 'A',
    roll_number: '12',
    risk_level: 'medium',
    risk_score: 52,
    primary_concern_en: 'Inconsistent homework submission',
    primary_concern_hi: 'असंगत होमवर्क जमा करना',
    attendance_rate: 78,
    assignment_completion_rate: 55,
    average_score: 61,
    recent_trend: 'stable',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Class 10-B
  {
    id: '2',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-2',
    student_name_en: 'Priya Patel',
    student_name_hi: 'प्रिया पटेल',
    class_name: 'Class 10',
    section: 'B',
    roll_number: '22',
    risk_level: 'medium',
    risk_score: 55,
    primary_concern_en: 'Struggling with Mathematics concepts',
    primary_concern_hi: 'गणित की अवधारणाओं में कठिनाई',
    secondary_concerns: ['Low quiz scores in Math'],
    attendance_rate: 85,
    assignment_completion_rate: 70,
    average_score: 58,
    recent_trend: 'stable',
    follow_up_date: '2024-12-30',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-9',
    student_name_en: 'Ananya Singh',
    student_name_hi: 'अनन्या सिंह',
    class_name: 'Class 10',
    section: 'B',
    roll_number: '05',
    risk_level: 'high',
    risk_score: 70,
    primary_concern_en: 'Frequent absences due to health issues',
    primary_concern_hi: 'स्वास्थ्य समस्याओं के कारण बार-बार अनुपस्थिति',
    attendance_rate: 58,
    assignment_completion_rate: 60,
    average_score: 52,
    recent_trend: 'declining',
    follow_up_date: '2024-12-27',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Class 9-A
  {
    id: '3',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-3',
    student_name_en: 'Amit Kumar',
    student_name_hi: 'अमित कुमार',
    class_name: 'Class 9',
    section: 'A',
    roll_number: '08',
    risk_level: 'critical',
    risk_score: 88,
    primary_concern_en: 'Extended absence and family issues',
    primary_concern_hi: 'लंबी अनुपस्थिति और पारिवारिक समस्याएं',
    secondary_concerns: ['No assignment submissions', 'Missed all recent tests'],
    attendance_rate: 35,
    assignment_completion_rate: 20,
    average_score: 32,
    recent_trend: 'declining',
    last_intervention_date: '2024-12-15',
    intervention_notes: 'Called parents, scheduled counseling session',
    follow_up_date: '2024-12-26',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-5',
    student_name_en: 'Vikram Yadav',
    student_name_hi: 'विक्रम यादव',
    class_name: 'Class 9',
    section: 'A',
    roll_number: '18',
    risk_level: 'medium',
    risk_score: 50,
    primary_concern_en: 'Poor performance in English',
    primary_concern_hi: 'अंग्रेजी में खराब प्रदर्शन',
    attendance_rate: 80,
    assignment_completion_rate: 65,
    average_score: 55,
    recent_trend: 'improving',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Class 9-B
  {
    id: '6',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-6',
    student_name_en: 'Neha Joshi',
    student_name_hi: 'नेहा जोशी',
    class_name: 'Class 9',
    section: 'B',
    roll_number: '25',
    risk_level: 'high',
    risk_score: 72,
    primary_concern_en: 'Behavioral issues affecting studies',
    primary_concern_hi: 'व्यवहार संबंधी समस्याएं पढ़ाई को प्रभावित कर रही हैं',
    attendance_rate: 70,
    assignment_completion_rate: 40,
    average_score: 45,
    recent_trend: 'stable',
    follow_up_date: '2024-12-29',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-10',
    student_name_en: 'Karan Mehta',
    student_name_hi: 'करण मेहता',
    class_name: 'Class 9',
    section: 'B',
    roll_number: '14',
    risk_level: 'critical',
    risk_score: 85,
    primary_concern_en: 'Severe learning difficulties identified',
    primary_concern_hi: 'गंभीर सीखने की कठिनाइयों की पहचान',
    attendance_rate: 45,
    assignment_completion_rate: 25,
    average_score: 38,
    recent_trend: 'declining',
    last_intervention_date: '2024-12-20',
    follow_up_date: '2024-12-25',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Class 8-A
  {
    id: '7',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    student_id: 'student-7',
    student_name_en: 'Pooja Mishra',
    student_name_hi: 'पूजा मिश्रा',
    class_name: 'Class 8',
    section: 'A',
    roll_number: '09',
    risk_level: 'low',
    risk_score: 38,
    primary_concern_en: 'Slightly below average in Science',
    primary_concern_hi: 'विज्ञान में औसत से थोड़ा नीचे',
    attendance_rate: 88,
    assignment_completion_rate: 82,
    average_score: 62,
    recent_trend: 'improving',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useAtRiskStudentsQuery(options?: {
  limit?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'monitoring';
}) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const riskLevel = options?.riskLevel;
  const status = options?.status || 'active';

  return useQuery({
    queryKey: ['at-risk-students', customerId, { limit, riskLevel, status }],
    queryFn: async () => {
      // Filter demo data based on options
      let filtered = DEMO_AT_RISK_STUDENTS.filter(s => s.status === status);

      if (riskLevel) {
        filtered = filtered.filter(s => s.risk_level === riskLevel);
      }

      // Sort by risk score (highest first)
      filtered.sort((a, b) => b.risk_score - a.risk_score);

      return filtered.slice(0, limit) as AtRiskStudent[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
