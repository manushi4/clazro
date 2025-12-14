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

export type SubjectDetailedProgress = {
  id: string;
  title_en: string;
  title_hi?: string;
  progress_percentage: number;
  color?: string;
  icon?: string;
  chapters_completed: number;
  total_chapters: number;
  hours_studied: number;
  tests_passed: number;
  total_tests: number;
  last_activity?: string;
  chapters: ChapterProgress[];
};

// Mock data for development/fallback
const MOCK_SUBJECT_PROGRESS: SubjectDetailedProgress[] = [
  {
    id: 'math',
    title_en: 'Mathematics',
    title_hi: 'गणित',
    progress_percentage: 75,
    color: 'primary',
    icon: 'calculator',
    chapters_completed: 9,
    total_chapters: 12,
    hours_studied: 18,
    tests_passed: 4,
    total_tests: 5,
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Algebra', title_hi: 'बीजगणित', progress_percentage: 100, completed: true, total_lessons: 8, completed_lessons: 8 },
      { id: 'ch2', title_en: 'Geometry', title_hi: 'ज्यामिति', progress_percentage: 80, completed: false, total_lessons: 10, completed_lessons: 8 },
      { id: 'ch3', title_en: 'Trigonometry', title_hi: 'त्रिकोणमिति', progress_percentage: 60, completed: false, total_lessons: 6, completed_lessons: 4 },
    ],
  },
  {
    id: 'physics',
    title_en: 'Physics',
    title_hi: 'भौतिकी',
    progress_percentage: 60,
    color: 'success',
    icon: 'atom',
    chapters_completed: 6,
    total_chapters: 10,
    hours_studied: 12,
    tests_passed: 3,
    total_tests: 4,
    last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Mechanics', title_hi: 'यांत्रिकी', progress_percentage: 100, completed: true, total_lessons: 12, completed_lessons: 12 },
      { id: 'ch2', title_en: 'Thermodynamics', title_hi: 'ऊष्मागतिकी', progress_percentage: 50, completed: false, total_lessons: 8, completed_lessons: 4 },
      { id: 'ch3', title_en: 'Optics', title_hi: 'प्रकाशिकी', progress_percentage: 30, completed: false, total_lessons: 10, completed_lessons: 3 },
    ],
  },
  {
    id: 'chemistry',
    title_en: 'Chemistry',
    title_hi: 'रसायन',
    progress_percentage: 45,
    color: 'warning',
    icon: 'flask',
    chapters_completed: 4,
    total_chapters: 9,
    hours_studied: 8,
    tests_passed: 2,
    total_tests: 3,
    last_activity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Organic Chemistry', title_hi: 'कार्बनिक रसायन', progress_percentage: 70, completed: false, total_lessons: 14, completed_lessons: 10 },
      { id: 'ch2', title_en: 'Inorganic Chemistry', title_hi: 'अकार्बनिक रसायन', progress_percentage: 40, completed: false, total_lessons: 10, completed_lessons: 4 },
    ],
  },
  {
    id: 'english',
    title_en: 'English',
    title_hi: 'अंग्रेजी',
    progress_percentage: 85,
    color: 'tertiary',
    icon: 'book-open',
    chapters_completed: 8,
    total_chapters: 10,
    hours_studied: 15,
    tests_passed: 5,
    total_tests: 5,
    last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Grammar', title_hi: 'व्याकरण', progress_percentage: 100, completed: true, total_lessons: 10, completed_lessons: 10 },
      { id: 'ch2', title_en: 'Literature', title_hi: 'साहित्य', progress_percentage: 90, completed: false, total_lessons: 8, completed_lessons: 7 },
      { id: 'ch3', title_en: 'Writing', title_hi: 'लेखन', progress_percentage: 70, completed: false, total_lessons: 6, completed_lessons: 4 },
    ],
  },
  {
    id: 'biology',
    title_en: 'Biology',
    title_hi: 'जीव विज्ञान',
    progress_percentage: 55,
    color: 'info',
    icon: 'leaf',
    chapters_completed: 5,
    total_chapters: 8,
    hours_studied: 10,
    tests_passed: 2,
    total_tests: 4,
    last_activity: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    chapters: [
      { id: 'ch1', title_en: 'Cell Biology', title_hi: 'कोशिका विज्ञान', progress_percentage: 100, completed: true, total_lessons: 8, completed_lessons: 8 },
      { id: 'ch2', title_en: 'Genetics', title_hi: 'आनुवंशिकी', progress_percentage: 60, completed: false, total_lessons: 10, completed_lessons: 6 },
    ],
  },
];

export function useSubjectProgressQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['progress-subject-wise', customerId, userId],
    queryFn: async (): Promise<SubjectDetailedProgress[]> => {
      const supabase = getSupabaseClient();
      
      // Fetch subject progress with chapters from database
      const { data: subjectData, error: subjectError } = await supabase
        .from('subject_progress')
        .select(`
          id,
          subject_id,
          title_en,
          title_hi,
          progress_percentage,
          chapters_completed,
          total_chapters,
          hours_studied,
          tests_passed,
          total_tests,
          color,
          icon,
          last_activity,
          chapter_progress (
            id,
            chapter_id,
            title_en,
            title_hi,
            progress_percentage,
            completed,
            total_lessons,
            completed_lessons
          )
        `)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('last_activity', { ascending: false });

      if (subjectError) {
        console.warn('Failed to fetch subject progress from DB, using mock data:', subjectError);
        return MOCK_SUBJECT_PROGRESS;
      }

      // If no data in DB, return mock data
      if (!subjectData || subjectData.length === 0) {
        return MOCK_SUBJECT_PROGRESS;
      }

      // Transform DB data to match our type
      return subjectData.map(subject => ({
        id: subject.subject_id,
        title_en: subject.title_en,
        title_hi: subject.title_hi,
        progress_percentage: subject.progress_percentage,
        color: subject.color,
        icon: subject.icon,
        chapters_completed: subject.chapters_completed,
        total_chapters: subject.total_chapters,
        hours_studied: Number(subject.hours_studied),
        tests_passed: subject.tests_passed,
        total_tests: subject.total_tests,
        last_activity: subject.last_activity,
        chapters: (subject.chapter_progress || []).map((ch: any) => ({
          id: ch.chapter_id,
          title_en: ch.title_en,
          title_hi: ch.title_hi,
          progress_percentage: ch.progress_percentage,
          completed: ch.completed,
          total_lessons: ch.total_lessons,
          completed_lessons: ch.completed_lessons,
        })),
      }));
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes cache
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
  });
}
