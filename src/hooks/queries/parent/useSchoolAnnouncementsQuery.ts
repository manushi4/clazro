import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type SchoolAnnouncement = {
  id: string;
  title_en: string;
  title_hi: string | null;
  content_en: string;
  content_hi: string | null;
  category: 'general' | 'academic' | 'event' | 'holiday' | 'exam' | 'sports' | 'cultural' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  attachment_url: string | null;
  published_at: string;
};

export type AnnouncementsData = {
  announcements: SchoolAnnouncement[];
  pinned_count: number;
  total_count: number;
};

export function useSchoolAnnouncementsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['school-announcements', customerId],
    queryFn: async (): Promise<AnnouncementsData> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useSchoolAnnouncementsQuery] customerId:', customerId);
      }

      // Fetch announcements for the customer that target parents
      const { data, error } = await supabase
        .from('school_announcements')
        .select('*')
        .eq('customer_id', customerId)
        .contains('target_roles', ['parent'])
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) {
        if (__DEV__) console.log('[useSchoolAnnouncementsQuery] error:', error);
        throw error;
      }

      const announcements: SchoolAnnouncement[] = (data || []).map(item => ({
        id: item.id,
        title_en: item.title_en,
        title_hi: item.title_hi,
        content_en: item.content_en,
        content_hi: item.content_hi,
        category: item.category,
        priority: item.priority,
        is_pinned: item.is_pinned,
        attachment_url: item.attachment_url,
        published_at: item.published_at,
      }));

      const pinnedCount = announcements.filter(a => a.is_pinned).length;

      return {
        announcements,
        pinned_count: pinnedCount,
        total_count: announcements.length,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
