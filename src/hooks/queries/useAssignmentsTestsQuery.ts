/**
 * Assignments & Tests Combined Query Hook
 * Fetches both assignments and tests with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import type { Subject } from './useSubjectsQuery';

export type AssignmentItem = {
  id: string;
  type: 'assignment';
  title_en: string;
  title_hi: string | null;
  due_date: string | null;
  max_score: number;
  status: string;
  subject?: Subject;
};

export type TestItem = {
  id: string;
  type: 'test';
  title_en: string;
  title_hi: string | null;
  scheduled_at: string | null;
  max_score: number;
  duration_minutes: number;
  test_type: string;
  status: string;
  is_online: boolean;
  subject?: Subject;
  // Student attempt info
  attempt_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  attempt_id?: string;
  attempt_score?: number;
  attempt_percentage?: number;
};

export type AssignmentOrTest = AssignmentItem | TestItem;

// Fallback mock data
const FALLBACK_DATA: AssignmentOrTest[] = [
  {
    id: "mock-assignment-1",
    type: "assignment",
    title_en: "Math Problem Set 5",
    title_hi: "गणित प्रश्न सेट 5",
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    max_score: 100,
    status: "published",
    subject: { id: "mock-sub-1", title_en: "Mathematics", title_hi: "गणित", color: "#6366F1" } as Subject,
  },
  {
    id: "mock-test-1",
    type: "test",
    title_en: "Physics Quiz",
    title_hi: "भौतिकी प्रश्नोत्तरी",
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    max_score: 50,
    duration_minutes: 30,
    test_type: "quiz",
    status: "upcoming",
    is_online: true,
    subject: { id: "mock-sub-2", title_en: "Physics", title_hi: "भौतिकी", color: "#10B981" } as Subject,
  },
  {
    id: "mock-assignment-2",
    type: "assignment",
    title_en: "English Essay",
    title_hi: "अंग्रेजी निबंध",
    due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    max_score: 50,
    status: "published",
    subject: { id: "mock-sub-3", title_en: "English", title_hi: "अंग्रेजी", color: "#EC4899" } as Subject,
  },
  {
    id: "mock-test-2",
    type: "test",
    title_en: "Chemistry Unit Test",
    title_hi: "रसायन विज्ञान इकाई परीक्षा",
    scheduled_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    max_score: 100,
    duration_minutes: 60,
    test_type: "unit_test",
    status: "upcoming",
    is_online: false,
    subject: { id: "mock-sub-4", title_en: "Chemistry", title_hi: "रसायन विज्ञान", color: "#F59E0B" } as Subject,
  },
];

async function fetchAssignmentsAndTests(
  customerId: string,
  limit: number = 10,
  filterType?: 'all' | 'assignment' | 'test',
  studentId?: string
): Promise<AssignmentOrTest[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const results: AssignmentOrTest[] = [];

  // Fetch assignments if not filtering to tests only
  if (filterType !== 'test') {
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        id,
        title_en,
        title_hi,
        due_date,
        max_score,
        status,
        subject:subjects(id, title_en, title_hi, color, icon)
      `)
      .eq('customer_id', customerId)
      .eq('status', 'published')
      .gte('due_date', now)
      .order('due_date', { ascending: true })
      .limit(limit);

    if (!assignmentError && assignments) {
      results.push(...assignments.map((a: any) => ({
        ...a,
        type: 'assignment' as const,
        subject: Array.isArray(a.subject) ? a.subject[0] : a.subject,
      })));
    }
  }

  // Fetch tests if not filtering to assignments only
  if (filterType !== 'assignment') {
    const { data: tests, error: testError } = await supabase
      .from('tests')
      .select(`
        id,
        title_en,
        title_hi,
        scheduled_at,
        max_score,
        duration_minutes,
        test_type,
        status,
        is_online,
        subject:subjects(id, title_en, title_hi, color, icon)
      `)
      .eq('customer_id', customerId)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (!testError && tests) {
      // Fetch student attempts for these tests if studentId provided
      let attemptsMap: Record<string, any> = {};
      if (studentId && tests.length > 0) {
        const testIds = tests.map((t: any) => t.id);
        const { data: attempts } = await supabase
          .from('test_attempts')
          .select('id, test_id, status, score, percentage')
          .eq('student_id', studentId)
          .in('test_id', testIds);
        
        if (attempts) {
          attempts.forEach((a: any) => {
            attemptsMap[a.test_id] = a;
          });
        }
      }

      results.push(...tests.map((t: any) => {
        const attempt = attemptsMap[t.id];
        return {
          ...t,
          type: 'test' as const,
          is_online: t.is_online ?? true,
          subject: Array.isArray(t.subject) ? t.subject[0] : t.subject,
          attempt_status: attempt?.status || 'not_started',
          attempt_id: attempt?.id,
          attempt_score: attempt?.score,
          attempt_percentage: attempt?.percentage,
        };
      }));
    }
  }

  // Sort combined results by date
  results.sort((a, b) => {
    const dateA = a.type === 'assignment' ? (a as AssignmentItem).due_date : (a as TestItem).scheduled_at;
    const dateB = b.type === 'assignment' ? (b as AssignmentItem).due_date : (b as TestItem).scheduled_at;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Return fallback if no results
  if (results.length === 0) {
    return FALLBACK_DATA.slice(0, limit);
  }

  return results.slice(0, limit);
}

export function useAssignmentsTestsQuery(
  limit: number = 10,
  filterType?: 'all' | 'assignment' | 'test',
  studentId?: string
) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['assignments-tests', customerId, limit, filterType, studentId],
    queryFn: () => fetchAssignmentsAndTests(customerId, limit, filterType, studentId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
}
