/**
 * Weak Topic Alerts Query Hook
 * Fetches AI-generated weak topic alerts for the ai.weak-topic-alerts widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type AlertType = 'declining' | 'critical' | 'stagnant' | 'opportunity' | 'urgent' | 'improvement';

export type WeakTopicAlert = {
  id: string;
  alertType: AlertType;
  titleEn: string;
  titleHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  topic: string;
  subject: string | null;
  chapter: string | null;
  icon: string;
  color: string;
  severity: number;
  currentScore: number | null;
  previousScore: number | null;
  targetScore: number | null;
  scoreChange: number | null;
  daysSincePractice: number | null;
  recommendedActions: string[];
  actionRoute: string | null;
  actionLabelEn: string | null;
  actionLabelHi: string | null;
  isDismissed: boolean;
  createdAt: string;
};

export type WeakTopicAlertsData = {
  alerts: WeakTopicAlert[];
  totalCount: number;
  criticalCount: number;
  urgentCount: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<number, number>;
};

const MOCK_DATA: WeakTopicAlertsData = {
  alerts: [
    { id: '1', alertType: 'declining', titleEn: 'Algebra Declining', titleHi: 'बीजगणित में गिरावट', descriptionEn: 'Your algebra scores dropped 15%.', descriptionHi: 'आपके बीजगणित अंक 15% गिरे।', topic: 'Quadratic Equations', subject: 'Mathematics', chapter: 'Algebra', icon: 'trending-down', color: 'error', severity: 4, currentScore: 65, previousScore: 80, targetScore: 85, scoreChange: -15, daysSincePractice: 5, recommendedActions: ['Practice daily', 'Watch tutorials'], actionRoute: 'practice/mathematics', actionLabelEn: 'Practice', actionLabelHi: 'अभ्यास', isDismissed: false, createdAt: new Date().toISOString() },
    { id: '2', alertType: 'critical', titleEn: 'Chemistry Critical', titleHi: 'रसायन गंभीर', descriptionEn: 'Organic chemistry below 40%.', descriptionHi: 'कार्बनिक रसायन 40% से नीचे।', topic: 'Organic Reactions', subject: 'Chemistry', chapter: 'Organic', icon: 'alert-octagon', color: 'error', severity: 5, currentScore: 38, previousScore: 42, targetScore: 70, scoreChange: -4, daysSincePractice: 12, recommendedActions: ['Get tutoring', 'Practice tests'], actionRoute: 'practice/chemistry', actionLabelEn: 'Get Help', actionLabelHi: 'मदद लें', isDismissed: false, createdAt: new Date().toISOString() },
  ],
  totalCount: 5,
  criticalCount: 1,
  urgentCount: 1,
  byType: { declining: 1, critical: 1, stagnant: 1, opportunity: 1, urgent: 1, improvement: 0 },
  bySeverity: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2 },
};

export function useWeakTopicAlertsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['weak-topic-alerts', customerId, userId],
    queryFn: async (): Promise<WeakTopicAlertsData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('weak_topic_alerts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Weak topic alerts query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const alerts: WeakTopicAlert[] = data.map((item: any) => ({
        id: item.id,
        alertType: item.alert_type,
        titleEn: item.title_en,
        titleHi: item.title_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        topic: item.topic,
        subject: item.subject,
        chapter: item.chapter,
        icon: item.icon || 'alert-circle',
        color: item.color || 'warning',
        severity: item.severity || 1,
        currentScore: item.current_score,
        previousScore: item.previous_score,
        targetScore: item.target_score,
        scoreChange: item.score_change,
        daysSincePractice: item.days_since_practice,
        recommendedActions: item.recommended_actions || [],
        actionRoute: item.action_route,
        actionLabelEn: item.action_label_en,
        actionLabelHi: item.action_label_hi,
        isDismissed: item.is_dismissed || false,
        createdAt: item.created_at,
      }));

      const criticalCount = alerts.filter(a => a.alertType === 'critical').length;
      const urgentCount = alerts.filter(a => a.alertType === 'urgent').length;
      const byType: Record<AlertType, number> = {
        declining: 0, critical: 0, stagnant: 0, opportunity: 0, urgent: 0, improvement: 0
      };
      const bySeverity: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      alerts.forEach(a => {
        byType[a.alertType]++;
        bySeverity[a.severity]++;
      });

      return {
        alerts,
        totalCount: alerts.length,
        criticalCount,
        urgentCount,
        byType,
        bySeverity,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
