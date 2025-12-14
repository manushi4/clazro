/**
 * useSubjectDetailQuery - Query hook for single subject progress detail
 * 
 * Used by: SubjectProgressScreen (Fixed screen)
 * Data: Subject progress with chapters, tests, weak areas
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type ChapterProgress = {
  id: string;
  title_en: string;
  title_hi?: string;
  progress_percentage: number;
  completed: boolean;
  total_lessons: number;
  completed_lessons: number;
};

export type TestResult = {
  id: string;
  title_en: string;
  title_hi?: string;
  score: number;
  max_score: number;
  percentage: number;
  date: string;
  passed: boolean;
};

export type WeakTopic = {
  id: string;
  title_en: string;
  title_hi?: string;
  chapter_en: string;
  chapter_hi?: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type SubjectDetail = {
  id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  progress_percentage: number;
  color?: string;
  icon?: string;
  chapters_completed: number;
  total_chapters: number;
  hours_studied: number;
  tests_passed: number;
  total_tests: number;
  average_score: number;
  last_activity?: string;
  chapters: ChapterProgress[];
  recent_tests: TestResult[];
  weak_topics: WeakTopic[];
};

// Mock data for development/fallback
const MOCK_SUBJECT_DETAILS: Record<string, SubjectDetail> = {
  'math': {
    id: 'math',
    title_en: 'Mathematics',
    title_hi: 'गणित',
    description_en: 'Complete mathematics curriculum including algebra, geometry, and trigonometry',
    description_hi: 'बीजगणित, ज्यामिति और त्रिकोणमिति सहित पूर्ण गणित पाठ्यक्रम',
    progress_percentage: 75,
    color: 'primary',
    icon: 'calculator',
    chapters_completed: 9,
    total_chapters: 12,
    hours_studied: 18,
    tests_passed: 4,
    total_tests: 5,
    average_score: 82,
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Algebra Basics', title_hi: 'बीजगणित मूल बातें', progress_percentage: 100, completed: true, total_lessons: 8, completed_lessons: 8 },
      { id: 'ch2', title_en: 'Linear Equations', title_hi: 'रैखिक समीकरण', progress_percentage: 100, completed: true, total_lessons: 6, completed_lessons: 6 },
      { id: 'ch3', title_en: 'Quadratic Equations', title_hi: 'द्विघात समीकरण', progress_percentage: 100, completed: true, total_lessons: 8, completed_lessons: 8 },
      { id: 'ch4', title_en: 'Geometry Fundamentals', title_hi: 'ज्यामिति मूल बातें', progress_percentage: 80, completed: false, total_lessons: 10, completed_lessons: 8 },
      { id: 'ch5', title_en: 'Triangles', title_hi: 'त्रिभुज', progress_percentage: 60, completed: false, total_lessons: 8, completed_lessons: 5 },
      { id: 'ch6', title_en: 'Trigonometry', title_hi: 'त्रिकोणमिति', progress_percentage: 40, completed: false, total_lessons: 10, completed_lessons: 4 },
    ],
    recent_tests: [
      { id: 't1', title_en: 'Algebra Test', title_hi: 'बीजगणित परीक्षा', score: 45, max_score: 50, percentage: 90, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), passed: true },
      { id: 't2', title_en: 'Geometry Quiz', title_hi: 'ज्यामिति प्रश्नोत्तरी', score: 38, max_score: 50, percentage: 76, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), passed: true },
      { id: 't3', title_en: 'Mid-Term Exam', title_hi: 'मध्यावधि परीक्षा', score: 82, max_score: 100, percentage: 82, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), passed: true },
    ],
    weak_topics: [
      { id: 'w1', title_en: 'Trigonometric Identities', title_hi: 'त्रिकोणमितीय सर्वसमिकाएं', chapter_en: 'Trigonometry', chapter_hi: 'त्रिकोणमिति', score: 45, difficulty: 'hard' },
      { id: 'w2', title_en: 'Circle Theorems', title_hi: 'वृत्त प्रमेय', chapter_en: 'Geometry', chapter_hi: 'ज्यामिति', score: 52, difficulty: 'medium' },
    ],
  },
  'physics': {
    id: 'physics',
    title_en: 'Physics',
    title_hi: 'भौतिकी',
    description_en: 'Comprehensive physics course covering mechanics, thermodynamics, and optics',
    description_hi: 'यांत्रिकी, ऊष्मागतिकी और प्रकाशिकी को कवर करने वाला व्यापक भौतिकी पाठ्यक्रम',
    progress_percentage: 60,
    color: 'success',
    icon: 'atom',
    chapters_completed: 6,
    total_chapters: 10,
    hours_studied: 12,
    tests_passed: 3,
    total_tests: 4,
    average_score: 75,
    last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Motion & Kinematics', title_hi: 'गति और गतिकी', progress_percentage: 100, completed: true, total_lessons: 12, completed_lessons: 12 },
      { id: 'ch2', title_en: 'Laws of Motion', title_hi: 'गति के नियम', progress_percentage: 100, completed: true, total_lessons: 10, completed_lessons: 10 },
      { id: 'ch3', title_en: 'Work & Energy', title_hi: 'कार्य और ऊर्जा', progress_percentage: 70, completed: false, total_lessons: 8, completed_lessons: 6 },
      { id: 'ch4', title_en: 'Thermodynamics', title_hi: 'ऊष्मागतिकी', progress_percentage: 50, completed: false, total_lessons: 10, completed_lessons: 5 },
      { id: 'ch5', title_en: 'Optics', title_hi: 'प्रकाशिकी', progress_percentage: 30, completed: false, total_lessons: 8, completed_lessons: 2 },
    ],
    recent_tests: [
      { id: 't1', title_en: 'Mechanics Test', title_hi: 'यांत्रिकी परीक्षा', score: 40, max_score: 50, percentage: 80, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), passed: true },
      { id: 't2', title_en: 'Energy Quiz', title_hi: 'ऊर्जा प्रश्नोत्तरी', score: 35, max_score: 50, percentage: 70, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), passed: true },
    ],
    weak_topics: [
      { id: 'w1', title_en: 'Thermodynamic Processes', title_hi: 'ऊष्मागतिक प्रक्रियाएं', chapter_en: 'Thermodynamics', chapter_hi: 'ऊष्मागतिकी', score: 40, difficulty: 'hard' },
      { id: 'w2', title_en: 'Lens Formula', title_hi: 'लेंस सूत्र', chapter_en: 'Optics', chapter_hi: 'प्रकाशिकी', score: 48, difficulty: 'medium' },
    ],
  },
};

// Default fallback for unknown subjects
const DEFAULT_SUBJECT: SubjectDetail = {
  id: 'unknown',
  title_en: 'Subject',
  title_hi: 'विषय',
  progress_percentage: 0,
  chapters_completed: 0,
  total_chapters: 0,
  hours_studied: 0,
  tests_passed: 0,
  total_tests: 0,
  average_score: 0,
  chapters: [],
  recent_tests: [],
  weak_topics: [],
};

export function useSubjectDetailQuery(subjectId: string | undefined) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['subject-detail', customerId, userId, subjectId],
    queryFn: async (): Promise<SubjectDetail> => {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('subject_progress')
        .select(`
          id,
          subject_id,
          title_en,
          title_hi,
          description_en,
          description_hi,
          progress_percentage,
          chapters_completed,
          total_chapters,
          hours_studied,
          tests_passed,
          total_tests,
          average_score,
          color,
          icon,
          last_activity
        `)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('subject_id', subjectId)
        .single();

      if (error || !data) {
        console.warn('Failed to fetch subject detail from DB, using mock data:', error);
        // Return mock data if available
        return MOCK_SUBJECT_DETAILS[subjectId] || { ...DEFAULT_SUBJECT, id: subjectId };
      }

      // For now, return mock data with DB overrides
      const mockData = MOCK_SUBJECT_DETAILS[subjectId] || DEFAULT_SUBJECT;
      
      return {
        ...mockData,
        id: data.subject_id || subjectId,
        title_en: data.title_en || mockData.title_en,
        title_hi: data.title_hi || mockData.title_hi,
        description_en: data.description_en,
        description_hi: data.description_hi,
        progress_percentage: data.progress_percentage ?? mockData.progress_percentage,
        chapters_completed: data.chapters_completed ?? mockData.chapters_completed,
        total_chapters: data.total_chapters ?? mockData.total_chapters,
        hours_studied: Number(data.hours_studied) || mockData.hours_studied,
        tests_passed: data.tests_passed ?? mockData.tests_passed,
        total_tests: data.total_tests ?? mockData.total_tests,
        average_score: data.average_score ?? mockData.average_score,
        color: data.color || mockData.color,
        icon: data.icon || mockData.icon,
        last_activity: data.last_activity || mockData.last_activity,
      };
    },
    enabled: !!userId && !!customerId && !!subjectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes cache
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
  });
}
