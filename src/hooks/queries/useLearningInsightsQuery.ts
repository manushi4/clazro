/**
 * Learning Insights Query Hook
 * Fetches AI-generated learning insights for the ai.learning-insights widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type InsightType = 'strength' | 'weakness' | 'recommendation' | 'trend' | 'achievement' | 'alert';

export type LearningInsight = {
  id: string;
  insightType: InsightType;
  titleEn: string;
  titleHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  subject: string | null;
  icon: string;
  color: string;
  priority: number;
  metricValue: number | null;
  metricLabel: string | null;
  actionRoute: string | null;
  actionLabelEn: string | null;
  actionLabelHi: string | null;
  isRead: boolean;
  createdAt: string;
};

export type LearningInsightsData = {
  insights: LearningInsight[];
  totalCount: number;
  unreadCount: number;
  byType: Record<InsightType, number>;
};

const MOCK_DATA: LearningInsightsData = {
  insights: [
    { id: '1', insightType: 'strength', titleEn: 'Strong in Algebra', titleHi: 'बीजगणित में मजबूत', descriptionEn: 'You scored 92% in recent algebra tests.', descriptionHi: 'आपने हाल के बीजगणित परीक्षणों में 92% अंक प्राप्त किए।', subject: 'Mathematics', icon: 'star', color: 'success', priority: 1, metricValue: 92, metricLabel: '%', actionRoute: 'subject/mathematics', actionLabelEn: 'View Progress', actionLabelHi: 'प्रगति देखें', isRead: false, createdAt: new Date().toISOString() },
    { id: '2', insightType: 'weakness', titleEn: 'Focus on Organic Chemistry', titleHi: 'कार्बनिक रसायन पर ध्यान दें', descriptionEn: 'Your scores in organic chemistry are below average.', descriptionHi: 'कार्बनिक रसायन में आपके अंक औसत से कम हैं।', subject: 'Chemistry', icon: 'alert-circle', color: 'warning', priority: 2, metricValue: 58, metricLabel: '%', actionRoute: 'practice/chemistry', actionLabelEn: 'Start Practice', actionLabelHi: 'अभ्यास शुरू करें', isRead: false, createdAt: new Date().toISOString() },
    { id: '3', insightType: 'recommendation', titleEn: 'Try AI Practice for Physics', titleHi: 'भौतिकी के लिए AI अभ्यास आज़माएं', descriptionEn: 'AI-generated practice questions can help improve your scores.', descriptionHi: 'AI-जनित अभ्यास प्रश्न आपके अंकों को बेहतर बनाने में मदद कर सकते हैं।', subject: 'Physics', icon: 'robot', color: 'primary', priority: 3, metricValue: null, metricLabel: null, actionRoute: 'ai-practice', actionLabelEn: 'Try Now', actionLabelHi: 'अभी आज़माएं', isRead: false, createdAt: new Date().toISOString() },
  ],
  totalCount: 5,
  unreadCount: 3,
  byType: { strength: 1, weakness: 1, recommendation: 1, trend: 1, achievement: 1, alert: 0 },
};

export function useLearningInsightsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['learning-insights', customerId, userId],
    queryFn: async (): Promise<LearningInsightsData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('learning_insights')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Learning insights query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const insights: LearningInsight[] = data.map((item: any) => ({
        id: item.id,
        insightType: item.insight_type,
        titleEn: item.title_en,
        titleHi: item.title_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        subject: item.subject,
        icon: item.icon || 'lightbulb-outline',
        color: item.color || 'primary',
        priority: item.priority || 0,
        metricValue: item.metric_value,
        metricLabel: item.metric_label,
        actionRoute: item.action_route,
        actionLabelEn: item.action_label_en,
        actionLabelHi: item.action_label_hi,
        isRead: item.is_read || false,
        createdAt: item.created_at,
      }));

      const unreadCount = insights.filter(i => !i.isRead).length;
      const byType: Record<InsightType, number> = {
        strength: 0, weakness: 0, recommendation: 0, trend: 0, achievement: 0, alert: 0
      };
      insights.forEach(i => { byType[i.insightType]++; });

      return {
        insights,
        totalCount: insights.length,
        unreadCount,
        byType,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
