/**
 * useSubjectAnalyticsQuery - Subject Analytics Data Hook
 * 
 * Fetches detailed analytics for a specific subject including:
 * - Subject info and mastery
 * - Performance metrics
 * - Topic breakdown
 * - Recent tests
 * - Practice stats
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export type SubjectAnalytics = {
  subject: {
    id: string;
    name: string;
    code: string;
    color: string;
    icon: string;
    mastery: number;
    totalChapters: number;
  };
  averageScore: number;
  scoreTrend: number;
  testsCompleted: number;
  studyTimeHours: number;
  doubtsResolved: number;
  practiceSessions: number;
  topics: {
    id: string;
    name: string;
    mastery: number;
  }[];
  recentTests: {
    id: string;
    title: string;
    score: number;
    totalMarks: number;
    dateLabel: string;
  }[];
};

// Mock data for development
function getMockSubjectAnalytics(subjectId: string): SubjectAnalytics {
  const subjectMap: Record<string, { name: string; code: string; color: string; icon: string }> = {
    'math-001': { name: 'Mathematics', code: 'MATH', color: '#2D5BFF', icon: 'calculator-variant' },
    'phys-001': { name: 'Physics', code: 'PHYS', color: '#9C27B0', icon: 'atom' },
    'chem-001': { name: 'Chemistry', code: 'CHEM', color: '#4CAF50', icon: 'flask' },
    'bio-001': { name: 'Biology', code: 'BIO', color: '#FF9800', icon: 'leaf' },
    'eng-001': { name: 'English', code: 'ENG', color: '#E91E63', icon: 'book-open-variant' },
  };

  const subjectInfo = subjectMap[subjectId] || subjectMap['math-001'];

  return {
    subject: {
      id: subjectId,
      name: subjectInfo.name,
      code: subjectInfo.code,
      color: subjectInfo.color,
      icon: subjectInfo.icon,
      mastery: 72,
      totalChapters: 12,
    },
    averageScore: 78,
    scoreTrend: 5,
    testsCompleted: 8,
    studyTimeHours: 24,
    doubtsResolved: 15,
    practiceSessions: 12,
    topics: [
      { id: 't1', name: 'Linear Equations', mastery: 85 },
      { id: 't2', name: 'Quadratic Equations', mastery: 72 },
      { id: 't3', name: 'Polynomials', mastery: 68 },
      { id: 't4', name: 'Trigonometry', mastery: 55 },
      { id: 't5', name: 'Coordinate Geometry', mastery: 78 },
      { id: 't6', name: 'Statistics', mastery: 82 },
    ],
    recentTests: [
      {
        id: 'test1',
        title: 'Chapter 5 - Quadratics Test',
        score: 42,
        totalMarks: 50,
        dateLabel: '3 days ago',
      },
      {
        id: 'test2',
        title: 'Mid-term Practice Test',
        score: 78,
        totalMarks: 100,
        dateLabel: '1 week ago',
      },
      {
        id: 'test3',
        title: 'Linear Equations Quiz',
        score: 18,
        totalMarks: 20,
        dateLabel: '2 weeks ago',
      },
    ],
  };
}

export function useSubjectAnalyticsQuery(subjectId?: string) {
  const customerId = useCustomerId();
  const effectiveSubjectId = subjectId || 'math-001';

  return useQuery({
    queryKey: ['subject-analytics', effectiveSubjectId, customerId],
    queryFn: async (): Promise<SubjectAnalytics> => {
      const supabase = getSupabaseClient();

      try {
        // Try to fetch from Supabase RPC
        const { data, error } = await supabase
          .rpc('get_subject_analytics', {
            p_subject_id: effectiveSubjectId,
            p_user_id: DEMO_USER_ID,
          });

        if (error) {
          console.warn('Subject analytics RPC failed, using mock data:', error.message);
          return getMockSubjectAnalytics(effectiveSubjectId);
        }

        if (data) {
          return data as SubjectAnalytics;
        }

        return getMockSubjectAnalytics(effectiveSubjectId);
      } catch (err) {
        console.warn('Subject analytics fetch failed, using mock data:', err);
        return getMockSubjectAnalytics(effectiveSubjectId);
      }
    },
    enabled: !!effectiveSubjectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export default useSubjectAnalyticsQuery;
