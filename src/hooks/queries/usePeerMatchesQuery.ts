/**
 * Peer Matches Query Hook
 * Fetches AI-generated peer matching suggestions for peer.matches widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';

export type MatchType = 'study_buddy' | 'subject_expert' | 'goal_partner' | 'mentor' | 'mentee' | 'project_partner';
export type MatchStatus = 'suggested' | 'pending' | 'connected' | 'declined' | 'blocked';

export interface PeerMatch {
  id: string;
  customerId: string;
  userId: string;
  // Peer info
  peerUserId: string;
  peerName: string;
  peerAvatarUrl: string | null;
  peerClass: string | null;
  peerSection: string | null;
  // Match details
  matchScore: number;
  matchType: MatchType;
  matchReasonEn: string;
  matchReasonHi: string | null;
  // Common interests
  commonSubjects: string[];
  commonGoals: string[];
  commonInterests: string[];
  // Peer stats
  peerXp: number;
  peerStreak: number;
  peerLevel: number;
  peerBadgesCount: number;
  // Status
  status: MatchStatus;
  isOnline: boolean;
  lastActiveAt: string | null;
  // Timestamps
  createdAt: string;
  connectedAt: string | null;
}

export interface PeerMatchesData {
  matches: PeerMatch[];
  suggestedMatches: PeerMatch[];
  connectedMatches: PeerMatch[];
  totalCount: number;
  hasMore: boolean;
}

export function usePeerMatchesQuery(limit: number = 10) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();

  return useQuery<PeerMatchesData>({
    queryKey: ['peer-matches', customerId, userId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('peer_matches')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .in('status', ['suggested', 'pending', 'connected'])
        .order('match_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const matches: PeerMatch[] = (data || []).map(match => ({
        id: match.id,
        customerId: match.customer_id,
        userId: match.user_id,
        peerUserId: match.peer_user_id,
        peerName: match.peer_name,
        peerAvatarUrl: match.peer_avatar_url,
        peerClass: match.peer_class,
        peerSection: match.peer_section,
        matchScore: match.match_score,
        matchType: match.match_type,
        matchReasonEn: match.match_reason_en,
        matchReasonHi: match.match_reason_hi,
        commonSubjects: match.common_subjects || [],
        commonGoals: match.common_goals || [],
        commonInterests: match.common_interests || [],
        peerXp: match.peer_xp || 0,
        peerStreak: match.peer_streak || 0,
        peerLevel: match.peer_level || 1,
        peerBadgesCount: match.peer_badges_count || 0,
        status: match.status,
        isOnline: match.is_online,
        lastActiveAt: match.last_active_at,
        createdAt: match.created_at,
        connectedAt: match.connected_at,
      }));

      const suggestedMatches = matches.filter(m => m.status === 'suggested' || m.status === 'pending');
      const connectedMatches = matches.filter(m => m.status === 'connected');

      return {
        matches,
        suggestedMatches,
        connectedMatches,
        totalCount: matches.length,
        hasMore: matches.length >= limit,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
