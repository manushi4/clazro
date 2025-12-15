/**
 * Tasks Overview Query Hook
 * Fetches combined assignments and tests for task overview widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type TaskItem = {
  id: string;
  title: string;
  type: 'assignment' | 'test';
  subject_id: string | null;
  due_date: string | null;
  max_score: number | null;
  status: string;
  is_overdue: boolean;
  days_until: number | null;
  icon: string;
  color: string;
};

export type TasksOverviewData = {
  tasks: TaskItem[];
  totalCount: number;
  assignmentCount: number;
  testCount: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
};

// Map task types to icons
const TYPE_ICONS: Record<string, string> = {
  assignment: 'clipboard-text',
  test: 'file-document-edit',
};

// Map task types to colors
const TYPE_COLORS: Record<string, string> = {
  assignment: '#6366F1',
  test: '#F59E0B',
};

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function useTasksOverviewQuery(maxItems: number = 10) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['tasks-overview', customerId, maxItems, lang],
    queryFn: async (): Promise<TasksOverviewData> => {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['active', 'pending'])
        .order('due_date', { ascending: true });

      if (assignmentsError) {
        console.warn('Assignments query failed:', assignmentsError);
      }

      // Fetch tests
      const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['active', 'scheduled'])
        .order('scheduled_at', { ascending: true });

      if (testsError) {
        console.warn('Tests query failed:', testsError);
      }

      // Transform assignments
      const assignmentTasks: TaskItem[] = (assignments || []).map(item => {
        const daysUntil = getDaysUntil(item.due_date);
        return {
          id: item.id,
          title: getLocalizedField(item, 'title', lang),
          type: 'assignment',
          subject_id: item.subject_id,
          due_date: item.due_date,
          max_score: item.max_score,
          status: item.status,
          is_overdue: daysUntil !== null && daysUntil < 0,
          days_until: daysUntil,
          icon: TYPE_ICONS.assignment,
          color: TYPE_COLORS.assignment,
        };
      });

      // Transform tests
      const testTasks: TaskItem[] = (tests || []).map(item => {
        const daysUntil = getDaysUntil(item.scheduled_at);
        return {
          id: item.id,
          title: getLocalizedField(item, 'title', lang),
          type: 'test',
          subject_id: item.subject_id,
          due_date: item.scheduled_at,
          max_score: item.max_score,
          status: item.status,
          is_overdue: daysUntil !== null && daysUntil < 0,
          days_until: daysUntil,
          icon: TYPE_ICONS.test,
          color: TYPE_COLORS.test,
        };
      });

      // Combine and sort by due date
      const allTasks = [...assignmentTasks, ...testTasks].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      // Calculate counts
      const overdueCount = allTasks.filter(t => t.is_overdue).length;
      const dueTodayCount = allTasks.filter(t => t.days_until === 0).length;
      const dueThisWeekCount = allTasks.filter(t => t.days_until !== null && t.days_until >= 0 && t.days_until <= 7).length;

      return {
        tasks: allTasks.slice(0, maxItems),
        totalCount: allTasks.length,
        assignmentCount: assignmentTasks.length,
        testCount: testTasks.length,
        overdueCount,
        dueTodayCount,
        dueThisWeekCount,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
