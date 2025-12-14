/**
 * useChildStatsScreenQuery - Query hook for child stats screen
 * 
 * Used by: ChildStatsScreen (Fixed screen)
 * Data: Child info, performance stats, attendance, tests, subjects
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type ChildBasicInfo = {
  id: string;
  name: string;
  avatar_url?: string;
  grade: string;
  section: string;
  roll_number?: string;
  school_name?: string;
};

export type PerformanceStat = {
  label_en: string;
  label_hi?: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
};

export type AttendanceSummary = {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  streak: number;
};

export type RecentTest = {
  id: string;
  subject_en: string;
  subject_hi?: string;
  title_en: string;
  title_hi?: string;
  date: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  class_average?: number;
};

export type SubjectScore = {
  id: string;
  subject_en: string;
  subject_hi?: string;
  icon: string;
  color: string;
  current_score: number;
  previous_score?: number;
  tests_taken: number;
  assignments_completed: number;
  trend: 'up' | 'down' | 'stable';
};

export type ActivityItem = {
  id: string;
  type: 'test' | 'assignment' | 'attendance' | 'achievement' | 'remark';
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  date: string;
  icon: string;
  color: string;
};

export type ChildStatsData = {
  child: ChildBasicInfo;
  stats: PerformanceStat[];
  attendance: AttendanceSummary;
  recent_tests: RecentTest[];
  subject_scores: SubjectScore[];
  recent_activities: ActivityItem[];
  overall_grade: string;
  overall_percentage: number;
  class_rank?: number;
  total_students?: number;
};


// Mock data for development/fallback
const MOCK_CHILD_STATS: Record<string, ChildStatsData> = {
  'child-1': {
    child: {
      id: 'child-1',
      name: 'Aarav Sharma',
      avatar_url: 'https://i.pravatar.cc/150?u=child1',
      grade: '8th',
      section: 'A',
      roll_number: '15',
      school_name: 'Delhi Public School',
    },
    stats: [
      { label_en: 'Overall Score', label_hi: 'समग्र स्कोर', value: '85%', change: 5, changeType: 'positive', icon: 'percent', color: '#4CAF50' },
      { label_en: 'Class Rank', label_hi: 'कक्षा रैंक', value: '5/45', change: 2, changeType: 'positive', icon: 'trophy', color: '#FF9800' },
      { label_en: 'Attendance', label_hi: 'उपस्थिति', value: '94%', change: -1, changeType: 'negative', icon: 'calendar-check', color: '#2196F3' },
      { label_en: 'Assignments', label_hi: 'असाइनमेंट', value: '12/15', change: 0, changeType: 'neutral', icon: 'clipboard-check', color: '#9C27B0' },
    ],
    attendance: {
      total_days: 120,
      present: 113,
      absent: 5,
      late: 2,
      percentage: 94.2,
      streak: 15,
    },
    recent_tests: [
      { id: 't1', subject_en: 'Mathematics', subject_hi: 'गणित', title_en: 'Unit Test 3', title_hi: 'इकाई परीक्षा 3', date: '2024-12-10', score: 42, max_score: 50, percentage: 84, grade: 'A', class_average: 72 },
      { id: 't2', subject_en: 'Science', subject_hi: 'विज्ञान', title_en: 'Mid Term', title_hi: 'मध्यावधि', date: '2024-12-05', score: 78, max_score: 100, percentage: 78, grade: 'B+', class_average: 68 },
      { id: 't3', subject_en: 'English', subject_hi: 'अंग्रेज़ी', title_en: 'Grammar Quiz', title_hi: 'व्याकरण प्रश्नोत्तरी', date: '2024-12-01', score: 18, max_score: 20, percentage: 90, grade: 'A+', class_average: 75 },
    ],
    subject_scores: [
      { id: 's1', subject_en: 'Mathematics', subject_hi: 'गणित', icon: 'calculator', color: '#4CAF50', current_score: 85, previous_score: 80, tests_taken: 5, assignments_completed: 12, trend: 'up' },
      { id: 's2', subject_en: 'Science', subject_hi: 'विज्ञान', icon: 'atom', color: '#2196F3', current_score: 78, previous_score: 82, tests_taken: 4, assignments_completed: 10, trend: 'down' },
      { id: 's3', subject_en: 'English', subject_hi: 'अंग्रेज़ी', icon: 'book-open-variant', color: '#FF9800', current_score: 88, previous_score: 85, tests_taken: 4, assignments_completed: 8, trend: 'up' },
      { id: 's4', subject_en: 'Hindi', subject_hi: 'हिंदी', icon: 'translate', color: '#9C27B0', current_score: 82, previous_score: 82, tests_taken: 3, assignments_completed: 7, trend: 'stable' },
      { id: 's5', subject_en: 'Social Studies', subject_hi: 'सामाजिक विज्ञान', icon: 'earth', color: '#795548', current_score: 80, previous_score: 75, tests_taken: 3, assignments_completed: 6, trend: 'up' },
    ],
    recent_activities: [
      { id: 'a1', type: 'test', title_en: 'Scored 84% in Math Test', title_hi: 'गणित परीक्षा में 84% अंक', date: '2024-12-10', icon: 'clipboard-check', color: '#4CAF50' },
      { id: 'a2', type: 'achievement', title_en: 'Won Science Quiz Competition', title_hi: 'विज्ञान प्रश्नोत्तरी प्रतियोगिता जीती', date: '2024-12-08', icon: 'trophy', color: '#FF9800' },
      { id: 'a3', type: 'assignment', title_en: 'Submitted English Essay', title_hi: 'अंग्रेजी निबंध जमा किया', date: '2024-12-07', icon: 'file-document', color: '#2196F3' },
      { id: 'a4', type: 'remark', title_en: 'Teacher praised class participation', title_hi: 'शिक्षक ने कक्षा भागीदारी की प्रशंसा की', date: '2024-12-05', icon: 'star', color: '#9C27B0' },
    ],
    overall_grade: 'A',
    overall_percentage: 85,
    class_rank: 5,
    total_students: 45,
  },
};

const DEFAULT_STATS: ChildStatsData = {
  child: { id: '', name: 'Child', grade: '', section: '' },
  stats: [],
  attendance: { total_days: 0, present: 0, absent: 0, late: 0, percentage: 0, streak: 0 },
  recent_tests: [],
  subject_scores: [],
  recent_activities: [],
  overall_grade: '-',
  overall_percentage: 0,
};

export function useChildStatsScreenQuery(childId: string | undefined) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['child-stats-screen', customerId, childId],
    queryFn: async (): Promise<ChildStatsData> => {
      if (!childId) {
        throw new Error('Child ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('child_stats')
        .select(`
          *,
          child:children(*),
          attendance:child_attendance(*),
          tests:child_tests(*),
          subjects:child_subjects(*)
        `)
        .eq('customer_id', customerId)
        .eq('child_id', childId)
        .single();

      if (error || !data) {
        console.warn('Using mock child stats data:', error?.message);
        return MOCK_CHILD_STATS[childId] || MOCK_CHILD_STATS['child-1'] || DEFAULT_STATS;
      }

      // Transform DB data to expected format
      return {
        child: data.child || DEFAULT_STATS.child,
        stats: data.stats || [],
        attendance: data.attendance?.[0] || DEFAULT_STATS.attendance,
        recent_tests: data.tests || [],
        subject_scores: data.subjects || [],
        recent_activities: data.activities || [],
        overall_grade: data.overall_grade || '-',
        overall_percentage: data.overall_percentage || 0,
        class_rank: data.class_rank,
        total_students: data.total_students,
      };
    },
    enabled: !!customerId && !!childId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
