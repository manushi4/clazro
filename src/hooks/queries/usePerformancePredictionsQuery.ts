/**
 * Performance Predictions Query Hook
 * Fetches AI-generated performance predictions for the ai.performance-predictions widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type PredictionType = 'exam_score' | 'subject_grade' | 'improvement' | 'risk' | 'milestone' | 'trend';

export type PerformancePrediction = {
  id: string;
  predictionType: PredictionType;
  titleEn: string;
  titleHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  subject: string | null;
  icon: string;
  color: string;
  confidenceScore: number;
  predictedValue: number | null;
  predictedLabel: string | null;
  currentValue: number | null;
  targetValue: number | null;
  predictionDate: string | null;
  factors: string[];
  recommendations: string[];
  actionRoute: string | null;
  actionLabelEn: string | null;
  actionLabelHi: string | null;
  isPositive: boolean;
  createdAt: string;
};

export type PerformancePredictionsData = {
  predictions: PerformancePrediction[];
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  byType: Record<PredictionType, number>;
};

const MOCK_DATA: PerformancePredictionsData = {
  predictions: [
    { id: '1', predictionType: 'exam_score', titleEn: 'Math Exam Prediction', titleHi: 'गणित परीक्षा भविष्यवाणी', descriptionEn: 'You are likely to score 85% in the upcoming math exam.', descriptionHi: 'आप आगामी गणित परीक्षा में 85% अंक प्राप्त करने की संभावना है।', subject: 'Mathematics', icon: 'calculator-variant', color: 'success', confidenceScore: 0.85, predictedValue: 85, predictedLabel: '85%', currentValue: 80, targetValue: 90, predictionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), factors: ['Strong algebra skills', 'Consistent practice'], recommendations: ['Review geometry'], actionRoute: 'practice/mathematics', actionLabelEn: 'Practice', actionLabelHi: 'अभ्यास', isPositive: true, createdAt: new Date().toISOString() },
    { id: '2', predictionType: 'risk', titleEn: 'Chemistry Risk Alert', titleHi: 'रसायन जोखिम चेतावनी', descriptionEn: 'Your chemistry scores need attention.', descriptionHi: 'आपके रसायन अंकों पर ध्यान देने की जरूरत है।', subject: 'Chemistry', icon: 'alert-circle', color: 'error', confidenceScore: 0.78, predictedValue: 60, predictedLabel: '60%', currentValue: 55, targetValue: 75, predictionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), factors: ['Weak in organic chemistry'], recommendations: ['Watch tutorials', 'Practice more'], actionRoute: 'practice/chemistry', actionLabelEn: 'Get Help', actionLabelHi: 'मदद लें', isPositive: false, createdAt: new Date().toISOString() },
  ],
  totalCount: 5,
  positiveCount: 3,
  negativeCount: 2,
  byType: { exam_score: 1, subject_grade: 1, improvement: 1, risk: 1, milestone: 1, trend: 0 },
};

export function usePerformancePredictionsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['performance-predictions', customerId, userId],
    queryFn: async (): Promise<PerformancePredictionsData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('performance_predictions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('confidence_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Performance predictions query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const predictions: PerformancePrediction[] = data.map((item: any) => ({
        id: item.id,
        predictionType: item.prediction_type,
        titleEn: item.title_en,
        titleHi: item.title_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        subject: item.subject,
        icon: item.icon || 'chart-line',
        color: item.color || 'primary',
        confidenceScore: item.confidence_score || 0,
        predictedValue: item.predicted_value,
        predictedLabel: item.predicted_label,
        currentValue: item.current_value,
        targetValue: item.target_value,
        predictionDate: item.prediction_date,
        factors: item.factors || [],
        recommendations: item.recommendations || [],
        actionRoute: item.action_route,
        actionLabelEn: item.action_label_en,
        actionLabelHi: item.action_label_hi,
        isPositive: item.is_positive ?? true,
        createdAt: item.created_at,
      }));

      const positiveCount = predictions.filter(p => p.isPositive).length;
      const negativeCount = predictions.filter(p => !p.isPositive).length;
      const byType: Record<PredictionType, number> = {
        exam_score: 0, subject_grade: 0, improvement: 0, risk: 0, milestone: 0, trend: 0
      };
      predictions.forEach(p => { byType[p.predictionType]++; });

      return {
        predictions,
        totalCount: predictions.length,
        positiveCount,
        negativeCount,
        byType,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
