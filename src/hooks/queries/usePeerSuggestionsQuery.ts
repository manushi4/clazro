/**
 * Peer Suggestions Query Hook
 * Fetches suggested peers for the suggestions.peers widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type PeerSuggestion = {
  id: string;
  suggestedUserId: string;
  name: string;
  nameHi: string | null;
  className: string | null;
  avatarUrl: string | null;
  matchScore: number;
  matchReasons: string[];
  mutualSubjects: string[];
  mutualConnections: number;
  isOnline: boolean;
  lastActiveAt: string | null;
  suggestionType: 'classmate' | 'study_buddy' | 'recommended' | 'mutual_friend';
  status: 'pending' | 'accepted' | 'dismissed';
};

export type PeerSuggestionsData = {
  suggestions: PeerSuggestion[];
  totalCount: number;
  onlineCount: number;
};

const MOCK_DATA: PeerSuggestionsData = {
  suggestions: [
    { id: '1', suggestedUserId: 'u1', name: 'Ananya Gupta', nameHi: 'अनन्या गुप्ता', className: 'Class 10-A', avatarUrl: null, matchScore: 92, matchReasons: ['Same class', 'Similar subjects'], mutualSubjects: ['Mathematics', 'Physics'], mutualConnections: 3, isOnline: true, lastActiveAt: new Date().toISOString(), suggestionType: 'classmate', status: 'pending' },
    { id: '2', suggestedUserId: 'u2', name: 'Vikram Singh', nameHi: 'विक्रम सिंह', className: 'Class 10-B', avatarUrl: null, matchScore: 85, matchReasons: ['Similar study pattern'], mutualSubjects: ['Mathematics'], mutualConnections: 2, isOnline: false, lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), suggestionType: 'study_buddy', status: 'pending' },
    { id: '3', suggestedUserId: 'u3', name: 'Priya Sharma', nameHi: 'प्रिया शर्मा', className: 'Class 10-A', avatarUrl: null, matchScore: 78, matchReasons: ['Active learner'], mutualSubjects: ['Physics', 'Biology'], mutualConnections: 1, isOnline: true, lastActiveAt: new Date().toISOString(), suggestionType: 'classmate', status: 'pending' },
  ],
  totalCount: 5,
  onlineCount: 2,
};

export function usePeerSuggestionsQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['peer-suggestions', customerId, userId],
    queryFn: async (): Promise<PeerSuggestionsData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('peer_suggestions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('match_score', { ascending: false })
        .order('is_online', { ascending: false });

      if (error) {
        console.warn('Peer suggestions query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const suggestions: PeerSuggestion[] = data.map((item: any) => ({
        id: item.id,
        suggestedUserId: item.suggested_user_id,
        name: item.suggested_user_name,
        nameHi: item.suggested_user_name_hi,
        className: item.suggested_user_class,
        avatarUrl: item.suggested_user_avatar_url,
        matchScore: item.match_score || 0,
        matchReasons: item.match_reasons || [],
        mutualSubjects: item.mutual_subjects || [],
        mutualConnections: item.mutual_connections || 0,
        isOnline: item.is_online || false,
        lastActiveAt: item.last_active_at,
        suggestionType: item.suggestion_type,
        status: item.status,
      }));

      const onlineCount = suggestions.filter(s => s.isOnline).length;

      return {
        suggestions,
        totalCount: suggestions.length,
        onlineCount,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: isOnline ? 2 : 0,
  });
}
