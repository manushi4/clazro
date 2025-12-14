/**
 * useSubjectDetailScreenQuery - Query hook for subject detail screen
 * 
 * Used by: SubjectDetailScreen (Fixed screen)
 * Data: Subject info, chapters, assignments, resources, teacher info
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type SubjectChapter = {
  id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  order_index: number;
  total_lessons: number;
  completed_lessons: number;
  duration_minutes: number;
  is_locked: boolean;
};

export type SubjectAssignment = {
  id: string;
  title_en: string;
  title_hi?: string;
  type: 'homework' | 'project' | 'quiz' | 'test';
  due_date: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  max_score?: number;
};

export type SubjectResource = {
  id: string;
  title_en: string;
  title_hi?: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url?: string;
  size?: string;
};

export type SubjectTeacher = {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
};

export type SubjectDetailData = {
  id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon?: string;
  color?: string;
  // Progress
  progress_percentage: number;
  chapters_completed: number;
  total_chapters: number;
  hours_studied: number;
  // Stats
  average_score: number;
  assignments_pending: number;
  tests_upcoming: number;
  // Related data
  chapters: SubjectChapter[];
  assignments: SubjectAssignment[];
  resources: SubjectResource[];
  teacher?: SubjectTeacher;
  // Schedule
  next_class?: {
    date: string;
    time: string;
    topic_en?: string;
    topic_hi?: string;
  };
};


// Mock data for development/fallback
const MOCK_SUBJECTS: Record<string, SubjectDetailData> = {
  'math': {
    id: 'math',
    title_en: 'Mathematics',
    title_hi: 'गणित',
    description_en: 'Algebra, Geometry, Trigonometry, and Calculus fundamentals',
    description_hi: 'बीजगणित, ज्यामिति, त्रिकोणमिति और कैलकुलस की मूल बातें',
    icon: 'calculator',
    color: '#4CAF50',
    progress_percentage: 72,
    chapters_completed: 8,
    total_chapters: 12,
    hours_studied: 45.5,
    average_score: 82,
    assignments_pending: 2,
    tests_upcoming: 1,
    chapters: [
      { id: 'ch1', title_en: 'Algebra Basics', title_hi: 'बीजगणित मूल बातें', order_index: 1, total_lessons: 8, completed_lessons: 8, duration_minutes: 120, is_locked: false },
      { id: 'ch2', title_en: 'Linear Equations', title_hi: 'रैखिक समीकरण', order_index: 2, total_lessons: 10, completed_lessons: 10, duration_minutes: 150, is_locked: false },
      { id: 'ch3', title_en: 'Quadratic Equations', title_hi: 'द्विघात समीकरण', order_index: 3, total_lessons: 12, completed_lessons: 8, duration_minutes: 180, is_locked: false },
      { id: 'ch4', title_en: 'Geometry Fundamentals', title_hi: 'ज्यामिति मूल बातें', order_index: 4, total_lessons: 10, completed_lessons: 6, duration_minutes: 140, is_locked: false },
      { id: 'ch5', title_en: 'Trigonometry', title_hi: 'त्रिकोणमिति', order_index: 5, total_lessons: 14, completed_lessons: 0, duration_minutes: 200, is_locked: true },
    ],
    assignments: [
      { id: 'a1', title_en: 'Quadratic Equations Practice', title_hi: 'द्विघात समीकरण अभ्यास', type: 'homework', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
      { id: 'a2', title_en: 'Geometry Worksheet', title_hi: 'ज्यामिति वर्कशीट', type: 'homework', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
      { id: 'a3', title_en: 'Algebra Quiz', title_hi: 'बीजगणित प्रश्नोत्तरी', type: 'quiz', due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'graded', score: 18, max_score: 20 },
    ],
    resources: [
      { id: 'r1', title_en: 'Formula Sheet', title_hi: 'सूत्र पत्रक', type: 'pdf', size: '2.5 MB' },
      { id: 'r2', title_en: 'Video: Quadratic Equations', title_hi: 'वीडियो: द्विघात समीकरण', type: 'video', size: '45 min' },
      { id: 'r3', title_en: 'Practice Problems', title_hi: 'अभ्यास समस्याएं', type: 'document', size: '1.2 MB' },
    ],
    teacher: {
      id: 't1',
      name: 'Dr. Sharma',
      avatar_url: 'https://i.pravatar.cc/150?u=teacher1',
      email: 'sharma@school.edu',
    },
    next_class: {
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00 AM',
      topic_en: 'Quadratic Formula Applications',
      topic_hi: 'द्विघात सूत्र अनुप्रयोग',
    },
  },
  'physics': {
    id: 'physics',
    title_en: 'Physics',
    title_hi: 'भौतिकी',
    description_en: 'Mechanics, Thermodynamics, Optics, and Modern Physics',
    description_hi: 'यांत्रिकी, ऊष्मागतिकी, प्रकाशिकी और आधुनिक भौतिकी',
    icon: 'atom',
    color: '#2196F3',
    progress_percentage: 58,
    chapters_completed: 5,
    total_chapters: 10,
    hours_studied: 32.0,
    average_score: 75,
    assignments_pending: 1,
    tests_upcoming: 0,
    chapters: [
      { id: 'ch1', title_en: 'Motion & Kinematics', title_hi: 'गति और गतिकी', order_index: 1, total_lessons: 10, completed_lessons: 10, duration_minutes: 150, is_locked: false },
      { id: 'ch2', title_en: 'Laws of Motion', title_hi: 'गति के नियम', order_index: 2, total_lessons: 12, completed_lessons: 12, duration_minutes: 180, is_locked: false },
      { id: 'ch3', title_en: 'Work & Energy', title_hi: 'कार्य और ऊर्जा', order_index: 3, total_lessons: 8, completed_lessons: 4, duration_minutes: 120, is_locked: false },
    ],
    assignments: [
      { id: 'a1', title_en: 'Energy Conservation Problems', title_hi: 'ऊर्जा संरक्षण समस्याएं', type: 'homework', due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
    ],
    resources: [
      { id: 'r1', title_en: 'Physics Formulas', title_hi: 'भौतिकी सूत्र', type: 'pdf', size: '3.1 MB' },
      { id: 'r2', title_en: 'Lab Manual', title_hi: 'प्रयोगशाला मैनुअल', type: 'document', size: '5.2 MB' },
    ],
    teacher: {
      id: 't2',
      name: 'Prof. Verma',
      avatar_url: 'https://i.pravatar.cc/150?u=teacher2',
    },
  },
};

const DEFAULT_SUBJECT: SubjectDetailData = {
  id: 'unknown',
  title_en: 'Subject',
  title_hi: 'विषय',
  progress_percentage: 0,
  chapters_completed: 0,
  total_chapters: 0,
  hours_studied: 0,
  average_score: 0,
  assignments_pending: 0,
  tests_upcoming: 0,
  chapters: [],
  assignments: [],
  resources: [],
};

export function useSubjectDetailScreenQuery(subjectId: string | undefined, childId?: string) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['subject-detail-screen', customerId, childId || userId, subjectId],
    queryFn: async (): Promise<SubjectDetailData> => {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          subject_chapters(*),
          subject_assignments(*),
          subject_resources(*)
        `)
        .eq('customer_id', customerId)
        .eq('id', subjectId)
        .single();

      if (error || !data) {
        console.warn('Using mock subject detail data:', error?.message);
        return MOCK_SUBJECTS[subjectId] || { ...DEFAULT_SUBJECT, id: subjectId };
      }

      // Transform DB data to expected format
      return {
        id: data.id,
        title_en: data.title_en || data.name,
        title_hi: data.title_hi,
        description_en: data.description_en,
        description_hi: data.description_hi,
        icon: data.icon,
        color: data.color,
        progress_percentage: data.progress_percentage || 0,
        chapters_completed: data.chapters_completed || 0,
        total_chapters: data.total_chapters || 0,
        hours_studied: data.hours_studied || 0,
        average_score: data.average_score || 0,
        assignments_pending: data.assignments_pending || 0,
        tests_upcoming: data.tests_upcoming || 0,
        chapters: data.subject_chapters || [],
        assignments: data.subject_assignments || [],
        resources: data.subject_resources || [],
        teacher: data.teacher,
        next_class: data.next_class,
      };
    },
    enabled: !!customerId && !!subjectId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
