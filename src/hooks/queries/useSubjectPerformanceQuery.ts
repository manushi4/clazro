/**
 * useSubjectPerformanceQuery - Query hook for subject performance analytics
 * 
 * Used by: SubjectPerformanceScreen (Fixed screen)
 * Data: Performance trends, test history, AI insights, comparison analytics
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type PerformanceTrend = {
  period: string;
  score: number;
  classAverage: number;
};

export type TestPerformance = {
  id: string;
  title_en: string;
  title_hi?: string;
  type: 'quiz' | 'test' | 'exam';
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  duration: number; // minutes
  rank?: number;
  totalStudents?: number;
  passed: boolean;
};

export type SkillAnalysis = {
  id: string;
  skill_en: string;
  skill_hi?: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  recommendation_en?: string;
  recommendation_hi?: string;
};

export type AIInsight = {
  id: string;
  type: 'strength' | 'weakness' | 'recommendation' | 'prediction';
  title_en: string;
  title_hi?: string;
  description_en: string;
  description_hi?: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
};

export type SubjectPerformance = {
  id: string;
  subjectId: string;
  title_en: string;
  title_hi?: string;
  icon?: string;
  color?: string;
  // Overall stats
  currentScore: number;
  previousScore: number;
  scoreTrend: 'up' | 'down' | 'stable';
  classRank: number;
  totalStudents: number;
  percentile: number;
  classAverage: number;
  // Performance trends
  trends: PerformanceTrend[];
  // Test history
  tests: TestPerformance[];
  // Skill analysis
  skills: SkillAnalysis[];
  // AI insights
  insights: AIInsight[];
};


// Mock data for development/fallback
const MOCK_PERFORMANCE: Record<string, SubjectPerformance> = {
  'math': {
    id: 'perf-math',
    subjectId: 'math',
    title_en: 'Mathematics',
    title_hi: 'गणित',
    icon: 'calculator',
    color: 'primary',
    currentScore: 82,
    previousScore: 75,
    scoreTrend: 'up',
    classRank: 5,
    totalStudents: 45,
    percentile: 89,
    classAverage: 72,
    trends: [
      { period: 'Week 1', score: 70, classAverage: 68 },
      { period: 'Week 2', score: 72, classAverage: 70 },
      { period: 'Week 3', score: 75, classAverage: 71 },
      { period: 'Week 4', score: 78, classAverage: 72 },
      { period: 'Week 5', score: 80, classAverage: 71 },
      { period: 'Week 6', score: 82, classAverage: 72 },
    ],
    tests: [
      { id: 't1', title_en: 'Algebra Final', title_hi: 'बीजगणित अंतिम', type: 'exam', score: 88, maxScore: 100, percentage: 88, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 90, rank: 3, totalStudents: 45, passed: true },
      { id: 't2', title_en: 'Geometry Quiz', title_hi: 'ज्यामिति प्रश्नोत्तरी', type: 'quiz', score: 18, maxScore: 20, percentage: 90, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), duration: 20, rank: 2, totalStudents: 45, passed: true },
      { id: 't3', title_en: 'Trigonometry Test', title_hi: 'त्रिकोणमिति परीक्षा', type: 'test', score: 35, maxScore: 50, percentage: 70, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), duration: 45, rank: 12, totalStudents: 45, passed: true },
      { id: 't4', title_en: 'Mid-Term Exam', title_hi: 'मध्यावधि परीक्षा', type: 'exam', score: 78, maxScore: 100, percentage: 78, date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), duration: 120, rank: 8, totalStudents: 45, passed: true },
    ],
    skills: [
      { id: 's1', skill_en: 'Problem Solving', skill_hi: 'समस्या समाधान', score: 85, trend: 'up', recommendation_en: 'Keep practicing complex problems', recommendation_hi: 'जटिल समस्याओं का अभ्यास जारी रखें' },
      { id: 's2', skill_en: 'Algebraic Manipulation', skill_hi: 'बीजगणितीय हेरफेर', score: 90, trend: 'stable', recommendation_en: 'Excellent! Try advanced topics', recommendation_hi: 'उत्कृष्ट! उन्नत विषयों का प्रयास करें' },
      { id: 's3', skill_en: 'Geometric Reasoning', skill_hi: 'ज्यामितीय तर्क', score: 75, trend: 'up', recommendation_en: 'Focus on theorem applications', recommendation_hi: 'प्रमेय अनुप्रयोगों पर ध्यान दें' },
      { id: 's4', skill_en: 'Trigonometric Functions', skill_hi: 'त्रिकोणमितीय फलन', score: 65, trend: 'down', recommendation_en: 'Review basic identities', recommendation_hi: 'मूल सर्वसमिकाओं की समीक्षा करें' },
    ],
    insights: [
      { id: 'i1', type: 'strength', title_en: 'Strong in Algebra', title_hi: 'बीजगणित में मजबूत', description_en: 'Consistently scoring above 85% in algebraic topics', description_hi: 'बीजगणितीय विषयों में लगातार 85% से ऊपर स्कोर', priority: 'medium', actionable: false },
      { id: 'i2', type: 'weakness', title_en: 'Trigonometry Needs Work', title_hi: 'त्रिकोणमिति में सुधार की जरूरत', description_en: 'Scores dropping in trigonometry. Focus on identities and applications.', description_hi: 'त्रिकोणमिति में स्कोर गिर रहे हैं। सर्वसमिकाओं और अनुप्रयोगों पर ध्यान दें।', priority: 'high', actionable: true },
      { id: 'i3', type: 'prediction', title_en: 'Expected Final Score: 85%', title_hi: 'अपेक्षित अंतिम स्कोर: 85%', description_en: 'Based on current trajectory, expected to score 85% in finals', description_hi: 'वर्तमान प्रगति के आधार पर, फाइनल में 85% स्कोर की उम्मीद', priority: 'medium', actionable: false },
      { id: 'i4', type: 'recommendation', title_en: 'Practice More Word Problems', title_hi: 'अधिक शब्द समस्याओं का अभ्यास करें', description_en: 'Spend 30 mins daily on word problems to improve application skills', description_hi: 'अनुप्रयोग कौशल में सुधार के लिए प्रतिदिन 30 मिनट शब्द समस्याओं पर बिताएं', priority: 'high', actionable: true },
    ],
  },
  'physics': {
    id: 'perf-physics',
    subjectId: 'physics',
    title_en: 'Physics',
    title_hi: 'भौतिकी',
    icon: 'atom',
    color: 'success',
    currentScore: 75,
    previousScore: 72,
    scoreTrend: 'up',
    classRank: 10,
    totalStudents: 45,
    percentile: 78,
    classAverage: 70,
    trends: [
      { period: 'Week 1', score: 68, classAverage: 66 },
      { period: 'Week 2', score: 70, classAverage: 68 },
      { period: 'Week 3', score: 72, classAverage: 69 },
      { period: 'Week 4', score: 73, classAverage: 70 },
      { period: 'Week 5', score: 74, classAverage: 70 },
      { period: 'Week 6', score: 75, classAverage: 70 },
    ],
    tests: [
      { id: 't1', title_en: 'Mechanics Test', title_hi: 'यांत्रिकी परीक्षा', type: 'test', score: 40, maxScore: 50, percentage: 80, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), duration: 60, rank: 8, totalStudents: 45, passed: true },
      { id: 't2', title_en: 'Thermodynamics Quiz', title_hi: 'ऊष्मागतिकी प्रश्नोत्तरी', type: 'quiz', score: 14, maxScore: 20, percentage: 70, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), duration: 20, rank: 15, totalStudents: 45, passed: true },
    ],
    skills: [
      { id: 's1', skill_en: 'Mechanics', skill_hi: 'यांत्रिकी', score: 80, trend: 'up' },
      { id: 's2', skill_en: 'Thermodynamics', skill_hi: 'ऊष्मागतिकी', score: 68, trend: 'stable' },
      { id: 's3', skill_en: 'Optics', skill_hi: 'प्रकाशिकी', score: 72, trend: 'up' },
    ],
    insights: [
      { id: 'i1', type: 'strength', title_en: 'Good at Mechanics', title_hi: 'यांत्रिकी में अच्छा', description_en: 'Strong understanding of motion and forces', description_hi: 'गति और बलों की अच्छी समझ', priority: 'medium', actionable: false },
      { id: 'i2', type: 'recommendation', title_en: 'Focus on Thermodynamics', title_hi: 'ऊष्मागतिकी पर ध्यान दें', description_en: 'Review heat transfer concepts and practice numerical problems', description_hi: 'ऊष्मा स्थानांतरण अवधारणाओं की समीक्षा करें और संख्यात्मक समस्याओं का अभ्यास करें', priority: 'high', actionable: true },
    ],
  },
};

const DEFAULT_PERFORMANCE: SubjectPerformance = {
  id: 'unknown',
  subjectId: 'unknown',
  title_en: 'Subject',
  title_hi: 'विषय',
  currentScore: 0,
  previousScore: 0,
  scoreTrend: 'stable',
  classRank: 0,
  totalStudents: 0,
  percentile: 0,
  classAverage: 0,
  trends: [],
  tests: [],
  skills: [],
  insights: [],
};

export function useSubjectPerformanceQuery(subjectId: string | undefined, childId?: string) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['subject-performance', customerId, childId || userId, subjectId],
    queryFn: async (): Promise<SubjectPerformance> => {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('subject_performance')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', childId || userId)
        .eq('subject_id', subjectId)
        .single();

      if (error || !data) {
        console.warn('Using mock performance data:', error?.message);
        return MOCK_PERFORMANCE[subjectId] || { ...DEFAULT_PERFORMANCE, subjectId };
      }

      // Merge DB data with mock structure
      const mockData = MOCK_PERFORMANCE[subjectId] || DEFAULT_PERFORMANCE;
      return {
        ...mockData,
        ...data,
        subjectId: data.subject_id || subjectId,
      };
    },
    enabled: !!customerId && !!subjectId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
