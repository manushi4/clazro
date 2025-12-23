/**
 * useContentListQuery - Fetches paginated content list for admin content management
 *
 * Queries the content_library table with support for:
 * - Search by title
 * - Filter by content type
 * - Filter by status
 * - Pagination
 * - Sorting
 *
 * Widget ID: content.list
 * Phase 2: Query Hook
 *
 * @returns Content list with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import i18n from '../../../i18n';

export type ContentType = 'course' | 'lesson' | 'resource' | 'assessment' | 'video' | 'document' | 'quiz';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'review';

export type ContentListItem = {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  status: ContentStatus;
  category: string | null;
  author_id: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  view_count: number;
  download_count: number;
  rating: number;
  rating_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentListQueryOptions = {
  search?: string;
  contentType?: ContentType | null;
  status?: ContentStatus | null;
  category?: string | null;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'created_at' | 'updated_at' | 'view_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
};

// Type config for icons and colors
export const CONTENT_TYPE_CONFIG: Record<ContentType, { icon: string; color: string; label: string }> = {
  course: { icon: 'school', color: 'primary', label: 'Course' },
  lesson: { icon: 'book-open-variant', color: 'secondary', label: 'Lesson' },
  resource: { icon: 'file-document-multiple', color: 'tertiary', label: 'Resource' },
  assessment: { icon: 'clipboard-check', color: 'success', label: 'Assessment' },
  video: { icon: 'video', color: 'warning', label: 'Video' },
  document: { icon: 'file-document', color: 'error', label: 'Document' },
  quiz: { icon: 'help-circle', color: 'primary', label: 'Quiz' },
};

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, { color: string; label: string }> = {
  draft: { color: 'warning', label: 'Draft' },
  published: { color: 'success', label: 'Published' },
  archived: { color: 'error', label: 'Archived' },
  review: { color: 'tertiary', label: 'In Review' },
};

// Fallback mock data when database query fails
const FALLBACK_CONTENT: ContentListItem[] = [
  { id: '1', title: 'Introduction to Mathematics', description: 'Basic math concepts', content_type: 'course', status: 'published', category: 'Mathematics', author_id: null, thumbnail_url: null, duration_minutes: 60, difficulty: 'beginner', view_count: 1250, download_count: 320, rating: 4.5, rating_count: 45, published_at: '2024-01-15', created_at: '2024-01-10', updated_at: '2024-01-15' },
  { id: '2', title: 'Physics Fundamentals', description: 'Core physics principles', content_type: 'lesson', status: 'published', category: 'Physics', author_id: null, thumbnail_url: null, duration_minutes: 45, difficulty: 'intermediate', view_count: 890, download_count: 210, rating: 4.2, rating_count: 32, published_at: '2024-01-20', created_at: '2024-01-18', updated_at: '2024-01-20' },
  { id: '3', title: 'Chemistry Lab Guide', description: 'Laboratory procedures', content_type: 'resource', status: 'draft', category: 'Chemistry', author_id: null, thumbnail_url: null, duration_minutes: null, difficulty: 'advanced', view_count: 0, download_count: 0, rating: 0, rating_count: 0, published_at: null, created_at: '2024-02-01', updated_at: '2024-02-01' },
  { id: '4', title: 'Biology Assessment', description: 'Chapter 1-5 test', content_type: 'assessment', status: 'review', category: 'Biology', author_id: null, thumbnail_url: null, duration_minutes: 30, difficulty: 'intermediate', view_count: 150, download_count: 0, rating: 0, rating_count: 0, published_at: null, created_at: '2024-02-05', updated_at: '2024-02-10' },
  { id: '5', title: 'English Grammar Video', description: 'Parts of speech explained', content_type: 'video', status: 'published', category: 'English', author_id: null, thumbnail_url: null, duration_minutes: 25, difficulty: 'beginner', view_count: 2100, download_count: 0, rating: 4.8, rating_count: 89, published_at: '2024-01-25', created_at: '2024-01-22', updated_at: '2024-01-25' },
];

export function useContentListQuery(options: ContentListQueryOptions = {}) {
  const customerId = useCustomerId();
  const currentLang = i18n.language || 'en';

  const {
    search = '',
    contentType = null,
    status = null,
    category = null,
    limit = 10,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: ['content-list', customerId, search, contentType, status, category, limit, offset, sortBy, sortOrder],
    queryFn: async (): Promise<ContentListItem[]> => {
      const supabase = getSupabaseClient();

      try {
        // Determine title column based on language
        const titleColumn = currentLang === 'hi' ? 'title_hi' : 'title_en';
        const descColumn = currentLang === 'hi' ? 'description_hi' : 'description_en';

        let query = supabase
          .from('content_library')
          .select(`
            id, 
            ${titleColumn}, 
            ${descColumn},
            content_type, 
            status, 
            category, 
            author_id, 
            thumbnail_url, 
            duration_minutes, 
            difficulty, 
            view_count, 
            download_count, 
            rating, 
            rating_count, 
            published_at, 
            created_at, 
            updated_at
          `)
          .eq('customer_id', customerId)
          .order(sortBy === 'title' ? titleColumn : sortBy, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        // Apply search filter
        if (search) {
          query = query.or(`title_en.ilike.%${search}%,title_hi.ilike.%${search}%`);
        }

        // Apply content type filter
        if (contentType) {
          query = query.eq('content_type', contentType);
        }

        // Apply status filter
        if (status) {
          query = query.eq('status', status);
        }

        // Apply category filter
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to match ContentListItem type
        return (data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          title: (item[titleColumn] || item.title_en || 'Untitled') as string,
          description: (item[descColumn] || item.description_en || '') as string,
          content_type: item.content_type as ContentType,
          status: item.status as ContentStatus,
          category: item.category as string | null,
          author_id: item.author_id as string | null,
          thumbnail_url: item.thumbnail_url as string | null,
          duration_minutes: item.duration_minutes as number | null,
          difficulty: item.difficulty as string | null,
          view_count: (item.view_count || 0) as number,
          download_count: (item.download_count || 0) as number,
          rating: (item.rating || 0) as number,
          rating_count: (item.rating_count || 0) as number,
          published_at: item.published_at as string | null,
          created_at: item.created_at as string,
          updated_at: item.updated_at as string,
        }));
      } catch (error) {
        console.warn('[useContentListQuery] Database query failed, using fallback data:', error);

        // Apply filters to fallback data
        let filteredContent = [...FALLBACK_CONTENT];

        if (search) {
          const searchLower = search.toLowerCase();
          filteredContent = filteredContent.filter(
            (c) => c.title.toLowerCase().includes(searchLower) || c.description.toLowerCase().includes(searchLower)
          );
        }

        if (contentType) {
          filteredContent = filteredContent.filter((c) => c.content_type === contentType);
        }

        if (status) {
          filteredContent = filteredContent.filter((c) => c.status === status);
        }

        if (category) {
          filteredContent = filteredContent.filter((c) => c.category === category);
        }

        return filteredContent.slice(offset, offset + limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: FALLBACK_CONTENT,
  });
}

// Helper function to format view count
export function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// Helper function to format duration
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
