/**
 * useChildWeakAreaScreenQuery - Query hook for child weak area screen
 * 
 * Used by: ChildWeakAreaScreen (Fixed screen)
 * Data: Weak topics, subject breakdown, practice suggestions, AI recommendations
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type WeakTopic = {
  id: string;
  subject_id: string;
  subject_en: string;
  subject_hi?: string;
  chapter_en: string;
  chapter_hi?: string;
  topic_en: string;
  topic_hi?: string;
  score: number;
  max_score: number;
  percentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  attempts: number;
  last_attempted?: string;
  improvement_trend: 'improving' | 'declining' | 'stable';
  practice_available: boolean;
  icon: string;
  color: string;
};

export type SubjectWeakness = {
  id: string;
  subject_en: string;
  subject_hi?: string;
  icon: string;
  color: string;
  weak_topics_count: number;
  average_score: number;
  priority: 'high' | 'medium' | 'low';
  topics: WeakTopic[];
};

export type PracticeSuggestion = {
  id: string;
  type: 'quiz' | 'video' | 'worksheet' | 'flashcards';
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  topic_id: string;
  subject_en: string;
  subject_hi?: string;
  duration_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions_count?: number;
  completed: boolean;
  icon: string;
  color: string;
};

export type AIRecommendation = {
  id: string;
  type: 'focus' | 'schedule' | 'resource' | 'strategy';
  title_en: string;
  title_hi?: string;
  description_en: string;
  description_hi?: string;
  priority: 'high' | 'medium' | 'low';
  action_label_en?: string;
  action_label_hi?: string;
  action_target?: string;
  icon: string;
  color: string;
};

export type WeakAreaSummary = {
  total_weak_topics: number;
  high_priority_count: number;
  improving_count: number;
  declining_count: number;
  average_weak_score: number;
  subjects_affected: number;
  practice_completed_today: number;
  practice_goal_today: number;
};

export type ChildWeakAreaData = {
  child: {
    id: string;
    name: string;
    avatar_url?: string;
    grade: string;
    section: string;
  };
  summary: WeakAreaSummary;
  weak_topics: WeakTopic[];
  subjects: SubjectWeakness[];
  practice_suggestions: PracticeSuggestion[];
  ai_recommendations: AIRecommendation[];
};

// Mock data for development/fallback
const MOCK_WEAK_AREA_DATA: Record<string, ChildWeakAreaData> = {
  'child-1': {
    child: {
      id: 'child-1',
      name: 'Aarav Sharma',
      avatar_url: 'https://i.pravatar.cc/150?u=child1',
      grade: '8th',
      section: 'A',
    },
    summary: {
      total_weak_topics: 8,
      high_priority_count: 3,
      improving_count: 2,
      declining_count: 1,
      average_weak_score: 45,
      subjects_affected: 4,
      practice_completed_today: 2,
      practice_goal_today: 5,
    },
    weak_topics: [
      {
        id: 'wt1', subject_id: 's1', subject_en: 'Mathematics', subject_hi: 'गणित',
        chapter_en: 'Algebra', chapter_hi: 'बीजगणित',
        topic_en: 'Quadratic Equations', topic_hi: 'द्विघात समीकरण',
        score: 35, max_score: 100, percentage: 35, difficulty: 'hard',
        attempts: 4, last_attempted: '2024-12-10', improvement_trend: 'stable',
        practice_available: true, icon: 'calculator', color: '#E53935'
      },
      {
        id: 'wt2', subject_id: 's1', subject_en: 'Mathematics', subject_hi: 'गणित',
        chapter_en: 'Geometry', chapter_hi: 'ज्यामिति',
        topic_en: 'Circle Theorems', topic_hi: 'वृत्त प्रमेय',
        score: 42, max_score: 100, percentage: 42, difficulty: 'medium',
        attempts: 3, last_attempted: '2024-12-08', improvement_trend: 'improving',
        practice_available: true, icon: 'shape-circle-plus', color: '#FB8C00'
      },
      {
        id: 'wt3', subject_id: 's2', subject_en: 'Science', subject_hi: 'विज्ञान',
        chapter_en: 'Chemistry', chapter_hi: 'रसायन विज्ञान',
        topic_en: 'Chemical Bonding', topic_hi: 'रासायनिक बंधन',
        score: 38, max_score: 100, percentage: 38, difficulty: 'hard',
        attempts: 5, last_attempted: '2024-12-09', improvement_trend: 'declining',
        practice_available: true, icon: 'atom', color: '#E53935'
      },
      {
        id: 'wt4', subject_id: 's2', subject_en: 'Science', subject_hi: 'विज्ञान',
        chapter_en: 'Physics', chapter_hi: 'भौतिकी',
        topic_en: 'Electromagnetic Waves', topic_hi: 'विद्युत चुम्बकीय तरंगें',
        score: 48, max_score: 100, percentage: 48, difficulty: 'medium',
        attempts: 2, last_attempted: '2024-12-07', improvement_trend: 'stable',
        practice_available: true, icon: 'sine-wave', color: '#FB8C00'
      },
      {
        id: 'wt5', subject_id: 's3', subject_en: 'English', subject_hi: 'अंग्रेज़ी',
        chapter_en: 'Grammar', chapter_hi: 'व्याकरण',
        topic_en: 'Reported Speech', topic_hi: 'अप्रत्यक्ष कथन',
        score: 52, max_score: 100, percentage: 52, difficulty: 'medium',
        attempts: 3, last_attempted: '2024-12-06', improvement_trend: 'improving',
        practice_available: true, icon: 'format-quote-close', color: '#43A047'
      },
    ],
    subjects: [
      {
        id: 's1', subject_en: 'Mathematics', subject_hi: 'गणित',
        icon: 'calculator', color: '#4CAF50', weak_topics_count: 2,
        average_score: 38, priority: 'high',
        topics: []
      },
      {
        id: 's2', subject_en: 'Science', subject_hi: 'विज्ञान',
        icon: 'atom', color: '#2196F3', weak_topics_count: 2,
        average_score: 43, priority: 'high',
        topics: []
      },
      {
        id: 's3', subject_en: 'English', subject_hi: 'अंग्रेज़ी',
        icon: 'book-open-variant', color: '#FF9800', weak_topics_count: 1,
        average_score: 52, priority: 'medium',
        topics: []
      },
    ],
    practice_suggestions: [
      {
        id: 'ps1', type: 'quiz', title_en: 'Quadratic Equations Quiz', title_hi: 'द्विघात समीकरण प्रश्नोत्तरी',
        description_en: 'Practice solving quadratic equations', description_hi: 'द्विघात समीकरण हल करने का अभ्यास',
        topic_id: 'wt1', subject_en: 'Mathematics', subject_hi: 'गणित',
        duration_minutes: 15, difficulty: 'medium', questions_count: 10,
        completed: false, icon: 'clipboard-check', color: '#4CAF50'
      },
      {
        id: 'ps2', type: 'video', title_en: 'Circle Theorems Explained', title_hi: 'वृत्त प्रमेय समझाया',
        description_en: 'Video lesson on circle theorems', description_hi: 'वृत्त प्रमेय पर वीडियो पाठ',
        topic_id: 'wt2', subject_en: 'Mathematics', subject_hi: 'गणित',
        duration_minutes: 12, difficulty: 'easy',
        completed: true, icon: 'play-circle', color: '#2196F3'
      },
      {
        id: 'ps3', type: 'worksheet', title_en: 'Chemical Bonding Practice', title_hi: 'रासायनिक बंधन अभ्यास',
        description_en: 'Worksheet on types of chemical bonds', description_hi: 'रासायनिक बंधों के प्रकार पर वर्कशीट',
        topic_id: 'wt3', subject_en: 'Science', subject_hi: 'विज्ञान',
        duration_minutes: 20, difficulty: 'hard', questions_count: 15,
        completed: false, icon: 'file-document', color: '#FF9800'
      },
      {
        id: 'ps4', type: 'flashcards', title_en: 'Grammar Flashcards', title_hi: 'व्याकरण फ्लैशकार्ड',
        description_en: 'Review reported speech rules', description_hi: 'अप्रत्यक्ष कथन नियमों की समीक्षा',
        topic_id: 'wt5', subject_en: 'English', subject_hi: 'अंग्रेज़ी',
        duration_minutes: 10, difficulty: 'easy',
        completed: false, icon: 'cards', color: '#9C27B0'
      },
    ],
    ai_recommendations: [
      {
        id: 'ar1', type: 'focus', title_en: 'Focus on Quadratic Equations', title_hi: 'द्विघात समीकरण पर ध्यान दें',
        description_en: 'This topic needs immediate attention. Score has been below 40% for 3 tests.',
        description_hi: 'इस विषय पर तुरंत ध्यान देने की जरूरत है। 3 परीक्षाओं में स्कोर 40% से नीचे रहा है।',
        priority: 'high', action_label_en: 'Start Practice', action_label_hi: 'अभ्यास शुरू करें',
        action_target: 'practice-wt1', icon: 'target', color: '#E53935'
      },
      {
        id: 'ar2', type: 'schedule', title_en: 'Daily 15-min Math Practice', title_hi: 'दैनिक 15 मिनट गणित अभ्यास',
        description_en: 'Consistent daily practice will help improve weak areas faster.',
        description_hi: 'नियमित दैनिक अभ्यास कमजोर क्षेत्रों को तेजी से सुधारने में मदद करेगा।',
        priority: 'medium', icon: 'calendar-clock', color: '#2196F3'
      },
      {
        id: 'ar3', type: 'resource', title_en: 'Watch Video Tutorials', title_hi: 'वीडियो ट्यूटोरियल देखें',
        description_en: 'Video explanations can help understand complex concepts better.',
        description_hi: 'वीडियो स्पष्टीकरण जटिल अवधारणाओं को बेहतर समझने में मदद कर सकते हैं।',
        priority: 'low', action_label_en: 'Browse Videos', action_label_hi: 'वीडियो ब्राउज़ करें',
        action_target: 'videos', icon: 'video', color: '#43A047'
      },
    ],
  },
};

const DEFAULT_DATA: ChildWeakAreaData = {
  child: { id: '', name: 'Child', grade: '', section: '' },
  summary: {
    total_weak_topics: 0, high_priority_count: 0, improving_count: 0,
    declining_count: 0, average_weak_score: 0, subjects_affected: 0,
    practice_completed_today: 0, practice_goal_today: 0,
  },
  weak_topics: [],
  subjects: [],
  practice_suggestions: [],
  ai_recommendations: [],
};

export function useChildWeakAreaScreenQuery(childId: string | undefined) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['child-weak-area-screen', customerId, childId],
    queryFn: async (): Promise<ChildWeakAreaData> => {
      if (!childId) {
        throw new Error('Child ID is required');
      }

      const supabase = getSupabaseClient();
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('child_weak_areas')
        .select(`
          *,
          child:children(*),
          topics:weak_topics(*),
          suggestions:practice_suggestions(*),
          recommendations:ai_recommendations(*)
        `)
        .eq('customer_id', customerId)
        .eq('child_id', childId)
        .single();

      if (error || !data) {
        console.warn('Using mock weak area data:', error?.message);
        return MOCK_WEAK_AREA_DATA[childId] || MOCK_WEAK_AREA_DATA['child-1'] || DEFAULT_DATA;
      }

      return {
        child: data.child || DEFAULT_DATA.child,
        summary: data.summary || DEFAULT_DATA.summary,
        weak_topics: data.topics || [],
        subjects: data.subjects || [],
        practice_suggestions: data.suggestions || [],
        ai_recommendations: data.recommendations || [],
      };
    },
    enabled: !!customerId && !!childId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: isOnline ? 2 : 0,
  });
}
