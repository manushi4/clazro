import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type SubjectProgress = {
  id: string;
  title_en: string;
  title_hi?: string;
  progress_percentage: number;
  color?: string;
};

export type ProgressData = {
  overall_percentage: number;
  chapters_completed: number;
  total_chapters: number;
  hours_studied: number;
  tests_passed: number;
  total_tests: number;
  assignments_done: number;
  total_assignments: number;
  subjects: SubjectProgress[];
};

// Mock data for development
const MOCK_PROGRESS_DATA: ProgressData = {
  overall_percentage: 66,
  chapters_completed: 12,
  total_chapters: 20,
  hours_studied: 24,
  tests_passed: 8,
  total_tests: 10,
  assignments_done: 5,
  total_assignments: 8,
  subjects: [
    { id: 'math', title_en: 'Mathematics', title_hi: 'गणित', progress_percentage: 75, color: 'primary' },
    { id: 'physics', title_en: 'Physics', title_hi: 'भौतिकी', progress_percentage: 60, color: 'success' },
    { id: 'chemistry', title_en: 'Chemistry', title_hi: 'रसायन', progress_percentage: 45, color: 'warning' },
    { id: 'english', title_en: 'English', title_hi: 'अंग्रेजी', progress_percentage: 85, color: 'tertiary' },
  ],
};

export function useProgressQuery() {
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['progress-snapshot', userId],
    queryFn: async (): Promise<ProgressData> => {
      // Return mock data in development or when backend not ready
      if (__DEV__ || !isOnline) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_PROGRESS_DATA;
      }

      const supabase = getSupabaseClient();
      
      // Fetch student progress from database
      const { data, error } = await supabase
        .rpc('get_student_progress', { p_user_id: userId });

      if (error) throw error;
      return data || MOCK_PROGRESS_DATA;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes cache
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
  });
}
