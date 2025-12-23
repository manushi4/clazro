import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type ContentType = 'course' | 'lesson' | 'resource' | 'assessment' | 'video' | 'document' | 'quiz';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'review';

export type ContentTypeStats = {
  type: ContentType;
  label: string;
  count: number;
  icon: string;
  color: string;
};

export type ContentStatusStats = {
  status: ContentStatus;
  label: string;
  count: number;
  color: string;
};

export type ContentStats = {
  total: number;
  totalViews: number;
  avgRating: number;
  byType: ContentTypeStats[];
  byStatus: ContentStatusStats[];
  recentCount: number; // Added in last 7 days
  topCategory: string;
};

const TYPE_CONFIG: Record<ContentType, { label: string; icon: string; color: string }> = {
  course: { label: 'Courses', icon: 'school', color: 'primary' },
  lesson: { label: 'Lessons', icon: 'book-open-variant', color: 'secondary' },
  resource: { label: 'Resources', icon: 'file-document-multiple', color: 'tertiary' },
  assessment: { label: 'Assessments', icon: 'clipboard-check', color: 'success' },
  video: { label: 'Videos', icon: 'video', color: 'warning' },
  document: { label: 'Documents', icon: 'file-document', color: 'error' },
  quiz: { label: 'Quizzes', icon: 'help-circle', color: 'primary' },
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'warning' },
  published: { label: 'Published', color: 'success' },
  archived: { label: 'Archived', color: 'error' },
  review: { label: 'In Review', color: 'tertiary' },
};

export function useContentStatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['content-stats', customerId],
    queryFn: async (): Promise<ContentStats> => {
      const supabase = getSupabaseClient();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch all content for the customer
      const { data: content, error } = await supabase
        .from('content_library')
        .select('id, content_type, status, view_count, rating, rating_count, category, created_at')
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error fetching content stats:', error);
        throw error;
      }

      const items = content || [];
      const total = items.length;

      // Calculate total views
      const totalViews = items.reduce((sum, item) => sum + (item.view_count || 0), 0);

      // Calculate average rating (weighted by rating_count)
      const ratedItems = items.filter(item => item.rating_count > 0);
      const totalRatingWeight = ratedItems.reduce((sum, item) => sum + item.rating_count, 0);
      const weightedRatingSum = ratedItems.reduce((sum, item) => sum + (item.rating * item.rating_count), 0);
      const avgRating = totalRatingWeight > 0 ? Math.round((weightedRatingSum / totalRatingWeight) * 10) / 10 : 0;

      // Count by type
      const typeCounts: Record<string, number> = {};
      items.forEach(item => {
        typeCounts[item.content_type] = (typeCounts[item.content_type] || 0) + 1;
      });

      const byType: ContentTypeStats[] = Object.entries(TYPE_CONFIG).map(([type, config]) => ({
        type: type as ContentType,
        label: config.label,
        count: typeCounts[type] || 0,
        icon: config.icon,
        color: config.color,
      })).filter(item => item.count > 0);

      // Count by status
      const statusCounts: Record<string, number> = {};
      items.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });

      const byStatus: ContentStatusStats[] = Object.entries(STATUS_CONFIG).map(([status, config]) => ({
        status: status as ContentStatus,
        label: config.label,
        count: statusCounts[status] || 0,
        color: config.color,
      }));

      // Count recent items (last 7 days)
      const recentCount = items.filter(item => 
        new Date(item.created_at) >= sevenDaysAgo
      ).length;

      // Find top category
      const categoryCounts: Record<string, number> = {};
      items.forEach(item => {
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      });
      const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

      return {
        total,
        totalViews,
        avgRating,
        byType,
        byStatus,
        recentCount,
        topCategory,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
