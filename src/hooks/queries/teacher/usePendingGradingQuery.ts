import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type PendingGradingItem = {
  id: string;
  customer_id: string;
  teacher_id: string;
  title_en: string;
  title_hi?: string;
  type: 'assignment' | 'test' | 'quiz' | 'project';
  class_name: string;
  subject: string;
  total_submissions: number;
  graded_count: number;
  due_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
};

// Demo data for development/fallback
const DEMO_PENDING_GRADING: PendingGradingItem[] = [
  {
    id: '1',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'teacher-1',
    title_en: 'Chapter 5 Assignment',
    title_hi: 'अध्याय 5 असाइनमेंट',
    type: 'assignment',
    class_name: 'Class 10-A',
    subject: 'Mathematics',
    total_submissions: 32,
    graded_count: 12,
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    priority: 'urgent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'teacher-1',
    title_en: 'Mid-Term Test',
    title_hi: 'मध्यावधि परीक्षा',
    type: 'test',
    class_name: 'Class 9-B',
    subject: 'Physics',
    total_submissions: 28,
    graded_count: 0,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'teacher-1',
    title_en: 'Weekly Quiz',
    title_hi: 'साप्ताहिक प्रश्नोत्तरी',
    type: 'quiz',
    class_name: 'Class 10-A',
    subject: 'Mathematics',
    total_submissions: 30,
    graded_count: 25,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'teacher-1',
    title_en: 'Science Project',
    title_hi: 'विज्ञान परियोजना',
    type: 'project',
    class_name: 'Class 8-C',
    subject: 'Science',
    total_submissions: 24,
    graded_count: 10,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    priority: 'low',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    customer_id: '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    teacher_id: 'teacher-1',
    title_en: 'Grammar Exercise',
    title_hi: 'व्याकरण अभ्यास',
    type: 'assignment',
    class_name: 'Class 9-A',
    subject: 'English',
    total_submissions: 35,
    graded_count: 20,
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function usePendingGradingQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 5;

  return useQuery({
    queryKey: ['pending-grading', customerId, { limit }],
    queryFn: async (): Promise<PendingGradingItem[]> => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('pending_grading')
          .select('*')
          .eq('customer_id', customerId)
          .order('priority', { ascending: false })
          .order('due_date', { ascending: true })
          .limit(limit);

        if (error) {
          console.warn('Supabase error, using demo data:', error.message);
          return DEMO_PENDING_GRADING.slice(0, limit);
        }

        return (data || []) as PendingGradingItem[];
      } catch (err) {
        console.warn('Failed to fetch pending grading, using demo data:', err);
        return DEMO_PENDING_GRADING.slice(0, limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: DEMO_PENDING_GRADING.slice(0, limit),
  });
}
