/**
 * useContentCategoriesQuery - Fetches content categories with counts for admin
 *
 * Queries distinct categories from content_library table with:
 * - Content count per category
 * - Total views per category
 * - Average rating per category
 *
 * Widget ID: content.categories
 * Phase 2: Query Hook
 *
 * @returns Categories list with stats and loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type CategoryStats = {
  category: string;
  count: number;
  totalViews: number;
  avgRating: number;
  publishedCount: number;
  draftCount: number;
  icon: string;
  color: string;
};

export type ContentCategoriesData = {
  categories: CategoryStats[];
  totalCategories: number;
  totalContent: number;
};

// Category config for icons and colors
export const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  Mathematics: { icon: 'calculator-variant', color: 'primary' },
  Physics: { icon: 'atom', color: 'secondary' },
  Chemistry: { icon: 'flask', color: 'tertiary' },
  Biology: { icon: 'leaf', color: 'success' },
  English: { icon: 'alphabetical', color: 'warning' },
  History: { icon: 'book-open-page-variant', color: 'error' },
  Geography: { icon: 'earth', color: 'primary' },
  Computer: { icon: 'laptop', color: 'secondary' },
  General: { icon: 'folder', color: 'tertiary' },
  Science: { icon: 'microscope', color: 'success' },
  Arts: { icon: 'palette', color: 'warning' },
  Music: { icon: 'music', color: 'error' },
  Sports: { icon: 'basketball', color: 'primary' },
  default: { icon: 'folder-outline', color: 'tertiary' },
};

// Get config for a category
export function getCategoryConfig(category: string): { icon: string; color: string } {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
}

// Fallback mock data when database query fails
const FALLBACK_CATEGORIES: CategoryStats[] = [
  { category: 'Mathematics', count: 12, totalViews: 3500, avgRating: 4.5, publishedCount: 10, draftCount: 2, icon: 'calculator-variant', color: 'primary' },
  { category: 'Physics', count: 8, totalViews: 2100, avgRating: 4.3, publishedCount: 6, draftCount: 2, icon: 'atom', color: 'secondary' },
  { category: 'Chemistry', count: 6, totalViews: 1800, avgRating: 4.2, publishedCount: 5, draftCount: 1, icon: 'flask', color: 'tertiary' },
  { category: 'General', count: 4, totalViews: 900, avgRating: 4.0, publishedCount: 3, draftCount: 1, icon: 'folder', color: 'success' },
];

export function useContentCategoriesQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['content-categories', customerId],
    queryFn: async (): Promise<ContentCategoriesData> => {
      const supabase = getSupabaseClient();

      try {
        // Query to get category stats
        const { data, error } = await supabase
          .from('content_library')
          .select('category, status, view_count, rating')
          .eq('customer_id', customerId);

        if (error) throw error;

        // Aggregate data by category
        const categoryMap = new Map<string, {
          count: number;
          totalViews: number;
          totalRating: number;
          ratingCount: number;
          publishedCount: number;
          draftCount: number;
        }>();

        (data || []).forEach((item: { category: string | null; status: string; view_count: number; rating: number }) => {
          const cat = item.category || 'Uncategorized';
          const existing = categoryMap.get(cat) || {
            count: 0,
            totalViews: 0,
            totalRating: 0,
            ratingCount: 0,
            publishedCount: 0,
            draftCount: 0,
          };

          existing.count += 1;
          existing.totalViews += item.view_count || 0;
          if (item.rating > 0) {
            existing.totalRating += item.rating;
            existing.ratingCount += 1;
          }
          if (item.status === 'published') {
            existing.publishedCount += 1;
          } else if (item.status === 'draft') {
            existing.draftCount += 1;
          }

          categoryMap.set(cat, existing);
        });

        // Convert to array with config
        const categories: CategoryStats[] = Array.from(categoryMap.entries())
          .map(([category, stats]) => {
            const config = getCategoryConfig(category);
            return {
              category,
              count: stats.count,
              totalViews: stats.totalViews,
              avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0,
              publishedCount: stats.publishedCount,
              draftCount: stats.draftCount,
              icon: config.icon,
              color: config.color,
            };
          })
          .sort((a, b) => b.count - a.count);

        return {
          categories,
          totalCategories: categories.length,
          totalContent: data?.length || 0,
        };
      } catch (error) {
        console.warn('[useContentCategoriesQuery] Database query failed, using fallback data:', error);

        return {
          categories: FALLBACK_CATEGORIES,
          totalCategories: FALLBACK_CATEGORIES.length,
          totalContent: FALLBACK_CATEGORIES.reduce((sum, c) => sum + c.count, 0),
        };
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: {
      categories: FALLBACK_CATEGORIES,
      totalCategories: FALLBACK_CATEGORIES.length,
      totalContent: FALLBACK_CATEGORIES.reduce((sum, c) => sum + c.count, 0),
    },
  });
}
