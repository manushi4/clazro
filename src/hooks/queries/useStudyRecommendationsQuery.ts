/**
 * Study Recommendations Query Hook
 * Fetches AI-generated study recommendations for the ai.study-recommendations widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type RecommendationType = 'content' | 'practice' | 'revision' | 'challenge' | 'remedial' | 'enrichment';
export type ContentType = 'video' | 'article' | 'quiz' | 'practice' | 'flashcards' | 'simulation';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type StudyRecommendation = {
  id: string;
  recommendationType: RecommendationType;
  titleEn: string;
  titleHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  subject: string | null;
  topic: string | null;
  chapter: string | null;
  icon: string;
  color: string;
  priority: number;
  confidenceScore: number | null;
  reasonEn: string | null;
  reasonHi: string | null;
  estimatedTimeMinutes: number | null;
  difficulty: Difficulty | null;
  contentType: ContentType | null;
  actionRoute: string | null;
  actionLabelEn: string | null;
  actionLabelHi: string | null;
  isCompleted: boolean;
  isDismissed: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type StudyRecommendationsData = {
  recommendations: StudyRecommendation[];
  totalCount: number;
  byType: Record<RecommendationType, number>;
  byDifficulty: Record<Difficulty, number>;
  highPriorityCount: number;
};


const MOCK_DATA: StudyRecommendationsData = {
  recommendations: [
    { id: '1', recommendationType: 'content', titleEn: 'Watch Algebra Video', titleHi: 'बीजगणित वीडियो देखें', descriptionEn: 'Learn quadratic equations step by step.', descriptionHi: 'द्विघात समीकरण चरण दर चरण सीखें।', subject: 'Mathematics', topic: 'Quadratic Equations', chapter: 'Algebra', icon: 'play-circle', color: 'primary', priority: 1, confidenceScore: 0.92, reasonEn: 'Based on quiz performance', reasonHi: 'क्विज़ प्रदर्शन के आधार पर', estimatedTimeMinutes: 15, difficulty: 'medium', contentType: 'video', actionRoute: 'content/video/algebra', actionLabelEn: 'Watch Now', actionLabelHi: 'अभी देखें', isCompleted: false, isDismissed: false, expiresAt: null, createdAt: new Date().toISOString() },
    { id: '2', recommendationType: 'practice', titleEn: 'Practice Chemistry', titleHi: 'रसायन का अभ्यास करें', descriptionEn: 'Complete practice questions on organic reactions.', descriptionHi: 'कार्बनिक प्रतिक्रियाओं पर अभ्यास प्रश्न पूरे करें।', subject: 'Chemistry', topic: 'Organic Reactions', chapter: 'Organic', icon: 'pencil', color: 'warning', priority: 2, confidenceScore: 0.88, reasonEn: 'Score dropped 12%', reasonHi: 'स्कोर 12% गिरा', estimatedTimeMinutes: 20, difficulty: 'hard', contentType: 'practice', actionRoute: 'practice/chemistry', actionLabelEn: 'Start Practice', actionLabelHi: 'अभ्यास शुरू करें', isCompleted: false, isDismissed: false, expiresAt: null, createdAt: new Date().toISOString() },
  ],
  totalCount: 5,
  byType: { content: 2, practice: 1, revision: 1, challenge: 1, remedial: 0, enrichment: 0 },
  byDifficulty: { easy: 1, medium: 2, hard: 2 },
  highPriorityCount: 2,
};

export function useStudyRecommendationsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['study-recommendations', customerId, userId],
    queryFn: async (): Promise<StudyRecommendationsData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('study_recommendations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .eq('is_completed', false)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('priority', { ascending: true })
        .order('confidence_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Study recommendations query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const recommendations: StudyRecommendation[] = data.map((item: any) => ({
        id: item.id,
        recommendationType: item.recommendation_type,
        titleEn: item.title_en,
        titleHi: item.title_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        subject: item.subject,
        topic: item.topic,
        chapter: item.chapter,
        icon: item.icon || 'lightbulb',
        color: item.color || 'primary',
        priority: item.priority || 3,
        confidenceScore: item.confidence_score,
        reasonEn: item.reason_en,
        reasonHi: item.reason_hi,
        estimatedTimeMinutes: item.estimated_time_minutes,
        difficulty: item.difficulty,
        contentType: item.content_type,
        actionRoute: item.action_route,
        actionLabelEn: item.action_label_en,
        actionLabelHi: item.action_label_hi,
        isCompleted: item.is_completed || false,
        isDismissed: item.is_dismissed || false,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
      }));

      const byType: Record<RecommendationType, number> = {
        content: 0, practice: 0, revision: 0, challenge: 0, remedial: 0, enrichment: 0
      };
      const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
      let highPriorityCount = 0;

      recommendations.forEach(r => {
        byType[r.recommendationType]++;
        if (r.difficulty) byDifficulty[r.difficulty]++;
        if (r.priority <= 2) highPriorityCount++;
      });

      return {
        recommendations,
        totalCount: recommendations.length,
        byType,
        byDifficulty,
        highPriorityCount,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
