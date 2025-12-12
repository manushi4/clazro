import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useDemoUser } from '../../useDemoUser';
import { useChildrenQuery } from './useChildrenQuery';
import { getLocalizedField } from '../../../utils/getLocalizedField';
import i18n from '../../../i18n';

export type WeakArea = {
  id: string;
  topic_name: string;
  subject_name: string;
  subject_code: string;
  mastery_percentage: number;
  attempts: number;
  last_attempted?: string;
  recommended_action: 'practice' | 'review' | 'watch_video' | 'ask_doubt';
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
};

export type ChildWeakAreasData = {
  child_user_id: string;
  child_name: string;
  areas: WeakArea[];
  total_weak_areas: number;
  critical_count: number; // Areas below 30%
};

export function useChildWeakAreasQuery(limit: number = 4) {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();
  const { data: children } = useChildrenQuery();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['parent-child-weak-areas', customerId, parentUserId, limit, lang],
    queryFn: async (): Promise<ChildWeakAreasData[]> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useChildWeakAreasQuery] customerId:', customerId, 'children:', children?.length);
      }

      if (!children || children.length === 0) return [];

      const childWeakAreasData: ChildWeakAreasData[] = [];

      for (const child of children) {
        const { data, error } = await supabase
          .from('student_weak_areas')
          .select(`
            *,
            subjects:subject_id(title_en, title_hi, code, icon, color)
          `)
          .eq('customer_id', customerId)
          .eq('user_id', child.child_user_id)
          .lt('mastery_percentage', 50)
          .order('mastery_percentage', { ascending: true })
          .limit(limit);

        if (error) {
          if (__DEV__) console.log('[useChildWeakAreasQuery] error:', error);
          continue;
        }

        const areas: WeakArea[] = (data || []).map(item => ({
          id: item.id,
          topic_name: getLocalizedField(item, 'topic_name', lang) || item.topic_name,
          subject_name: item.subjects ? getLocalizedField(item.subjects, 'title', lang) : 'Unknown',
          subject_code: item.subjects?.code || '',
          mastery_percentage: parseFloat(item.mastery_percentage) || 0,
          attempts: item.attempts || 0,
          last_attempted: item.last_attempted,
          recommended_action: item.recommended_action || 'practice',
          difficulty: item.difficulty || 'medium',
          icon: item.subjects?.icon || 'book-outline',
          color: item.subjects?.color || '#6366F1',
        }));

        const criticalCount = areas.filter(a => a.mastery_percentage < 30).length;

        childWeakAreasData.push({
          child_user_id: child.child_user_id,
          child_name: child.child_name,
          areas,
          total_weak_areas: areas.length,
          critical_count: criticalCount,
        });
      }

      return childWeakAreasData;
    },
    enabled: !!customerId && !!parentUserId && !!children && children.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
