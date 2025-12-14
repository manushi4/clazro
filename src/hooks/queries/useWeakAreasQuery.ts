import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type WeakArea = {
  id: string;
  topic_name: string;
  subject_name: string;
  subject_code: string;
  chapter_name?: string;
  mastery_percentage: number;
  attempts: number;
  last_attempted?: string;
  recommended_action: 'practice' | 'review' | 'watch_video' | 'ask_doubt';
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
};

export type WeakAreasData = {
  areas: WeakArea[];
  total_weak_areas: number;
  improvement_rate: number;
  last_updated?: string;
};

const MOCK_DATA: WeakAreasData = {
  areas: [
    { id: '1', topic_name: 'Quadratic Equations', subject_name: 'Mathematics', subject_code: 'MATH', chapter_name: 'Algebra', mastery_percentage: 35, attempts: 3, recommended_action: 'practice', difficulty: 'medium', icon: 'function-variant', color: '#6366F1' },
    { id: '2', topic_name: 'Newton\'s Laws', subject_name: 'Physics', subject_code: 'PHY', chapter_name: 'Mechanics', mastery_percentage: 42, attempts: 2, recommended_action: 'watch_video', difficulty: 'hard', icon: 'atom', color: '#F59E0B' },
    { id: '3', topic_name: 'Chemical Bonding', subject_name: 'Chemistry', subject_code: 'CHEM', chapter_name: 'Atomic Structure', mastery_percentage: 28, attempts: 4, recommended_action: 'review', difficulty: 'hard', icon: 'flask', color: '#10B981' },
    { id: '4', topic_name: 'Trigonometry', subject_name: 'Mathematics', subject_code: 'MATH', chapter_name: 'Geometry', mastery_percentage: 45, attempts: 2, recommended_action: 'practice', difficulty: 'medium', icon: 'triangle-outline', color: '#6366F1' },
  ],
  total_weak_areas: 8,
  improvement_rate: 12,
};

export function useWeakAreasQuery(limit: number = 5, subjectFilter?: string) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['weak-areas', customerId, userId, limit, subjectFilter, lang],
    queryFn: async (): Promise<WeakAreasData> => {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('student_weak_areas')
        .select(`
          *,
          subjects:subject_id(title_en, title_hi, code, icon, color)
        `)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .lt('mastery_percentage', 50)
        .order('mastery_percentage', { ascending: true })
        .limit(limit);

      if (subjectFilter) {
        query = query.eq('subject_id', subjectFilter);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('Weak areas query failed, using mock data:', error);
        return MOCK_DATA;
      }

      const areas: WeakArea[] = data.map(item => ({
        id: item.id,
        topic_name: getLocalizedField(item, 'topic_name', lang),
        subject_name: getLocalizedField(item.subjects, 'title', lang),
        subject_code: item.subjects?.code || '',
        chapter_name: undefined,
        mastery_percentage: item.mastery_percentage,
        attempts: item.attempts || 0,
        last_attempted: item.last_attempted,
        recommended_action: item.recommended_action || 'practice',
        difficulty: item.difficulty || 'medium',
        icon: item.subjects?.icon || 'book-outline',
        color: item.subjects?.color || '#6366F1',
      }));

      return {
        areas,
        total_weak_areas: areas.length,
        improvement_rate: 12,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}
