/**
 * Community Feed Query Hook
 * Fetches community feed posts for community.feed widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type PostType = 'post' | 'achievement' | 'question' | 'poll' | 'announcement' | 'milestone' | 'challenge';
export type AuthorRole = 'student' | 'teacher' | 'admin';
export type MediaType = 'image' | 'video' | 'link';
export type Visibility = 'public' | 'class' | 'private';

export interface CommunityPost {
  id: string;
  customerId: string;
  userId: string;
  // Content
  contentEn: string;
  contentHi: string | null;
  postType: PostType;
  // Author
  authorName: string;
  authorAvatarUrl: string | null;
  authorRole: AuthorRole;
  authorLevel: number;
  authorBadge: string | null;
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  // Media
  mediaUrl: string | null;
  mediaType: MediaType | null;
  // Achievement/milestone
  achievementType: string | null;
  achievementIcon: string | null;
  achievementColor: string | null;
  // Poll
  pollOptions: Record<string, string>[] | null;
  pollVotes: Record<string, number> | null;
  pollEndsAt: string | null;
  // Status
  isPinned: boolean;
  isFeatured: boolean;
  visibility: Visibility;
  // Timestamps
  createdAt: string;
}

export interface CommunityFeedData {
  posts: CommunityPost[];
  pinnedPosts: CommunityPost[];
  featuredPosts: CommunityPost[];
  totalCount: number;
  hasMore: boolean;
}

export function useCommunityFeedQuery(limit: number = 10) {
  const customerId = useCustomerId();

  return useQuery<CommunityFeedData>({
    queryKey: ['community-feed', customerId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('community_feed')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_approved', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const posts: CommunityPost[] = (data || []).map(post => ({
        id: post.id,
        customerId: post.customer_id,
        userId: post.user_id,
        contentEn: post.content_en,
        contentHi: post.content_hi,
        postType: post.post_type,
        authorName: post.author_name,
        authorAvatarUrl: post.author_avatar_url,
        authorRole: post.author_role,
        authorLevel: post.author_level || 1,
        authorBadge: post.author_badge,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        mediaUrl: post.media_url,
        mediaType: post.media_type,
        achievementType: post.achievement_type,
        achievementIcon: post.achievement_icon,
        achievementColor: post.achievement_color,
        pollOptions: post.poll_options,
        pollVotes: post.poll_votes,
        pollEndsAt: post.poll_ends_at,
        isPinned: post.is_pinned,
        isFeatured: post.is_featured,
        visibility: post.visibility,
        createdAt: post.created_at,
      }));

      const pinnedPosts = posts.filter(p => p.isPinned);
      const featuredPosts = posts.filter(p => p.isFeatured);

      return {
        posts,
        pinnedPosts,
        featuredPosts,
        totalCount: posts.length,
        hasMore: posts.length >= limit,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
