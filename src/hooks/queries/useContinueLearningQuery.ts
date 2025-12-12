import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type ContinueLearningItemType = 'resource' | 'ai_session' | 'assignment' | 'test_review' | 'doubt' | 'lesson' | 'video';

export type ContinueLearningItem = {
  id: string;
  item_type: ContinueLearningItemType;
  item_id?: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  progress_percentage: number;
  duration_minutes?: number;
  last_accessed_at: string;
  route: string;
  time_ago: string;
};

const MOCK_DATA: ContinueLearningItem[] = [
  { id: '1', item_type: 'lesson', title: 'Quadratic Equations', subtitle: 'Chapter 4 - Mathematics', icon: 'calculator', color: '#6366F1', progress_percentage: 65, duration_minutes: 25, last_accessed_at: new Date().toISOString(), route: 'lesson/math-ch4', time_ago: '2h ago' },
  { id: '2', item_type: 'video', title: "Newton's Laws of Motion", subtitle: 'Physics - Unit 2', icon: 'play-circle', color: '#EF4444', progress_percentage: 40, duration_minutes: 18, last_accessed_at: new Date().toISOString(), route: 'video/physics-newton', time_ago: '5h ago' },
  { id: '3', item_type: 'ai_session', title: 'Chemistry Doubt Session', subtitle: 'Organic Chemistry', icon: 'robot', color: '#10B981', progress_percentage: 100, duration_minutes: 15, last_accessed_at: new Date().toISOString(), route: 'ai-tutor/session-123', time_ago: '8h ago' },
  { id: '4', item_type: 'assignment', title: 'Essay Writing Practice', subtitle: 'English - Due Tomorrow', icon: 'clipboard-text', color: '#F59E0B', progress_percentage: 30, duration_minutes: 45, last_accessed_at: new Date().toISOString(), route: 'assignment/eng-essay', time_ago: '12h ago' },
];

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}


export function useContinueLearningQuery(limit: number = 4, itemTypes?: ContinueLearningItemType[]) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['continue-learning', customerId, userId, limit, itemTypes, lang],
    queryFn: async (): Promise<ContinueLearningItem[]> => {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('continue_learning')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .limit(limit);

      if (itemTypes && itemTypes.length > 0) {
        query = query.in('item_type', itemTypes);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('Continue learning query failed, using mock data:', error);
        return MOCK_DATA.slice(0, limit);
      }

      return data.map(item => ({
        id: item.id,
        item_type: item.item_type,
        item_id: item.item_id,
        title: getLocalizedField(item, 'title', lang),
        subtitle: getLocalizedField(item, 'subtitle', lang),
        icon: item.icon,
        color: item.color,
        progress_percentage: item.progress_percentage,
        duration_minutes: item.duration_minutes,
        last_accessed_at: item.last_accessed_at,
        route: item.route,
        time_ago: getTimeAgo(item.last_accessed_at),
      }));
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    retry: isOnline ? 2 : 0,
  });
}

export function useClearContinueLearning() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();

  const clearHistory = async () => {
    const supabase = getSupabaseClient();
    await supabase
      .from('continue_learning')
      .delete()
      .eq('customer_id', customerId)
      .eq('user_id', userId);
  };

  return { clearHistory };
}
