import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type MediaType = 'image' | 'video' | 'carousel' | 'youtube' | 'lottie';

export type MediaItem = {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: string;
  ctaUrl?: string;
  duration?: number; // For carousel auto-advance
};

export type MediaBannerData = {
  id: string;
  name: string;
  items: MediaItem[];
  aspectRatio: '16:9' | '4:3' | '1:1' | '21:9' | '9:16';
  autoPlay: boolean;
  loop: boolean;
  showIndicators: boolean;
  showControls: boolean;
  overlayGradient: boolean;
  borderRadius: number;
};

type UseMediaBannerOptions = {
  bannerId?: string;
  slot?: string; // e.g., "dashboard-top", "profile-header", "promo-1"
  fallbackItems?: MediaItem[];
};

// Default placeholder banner data
const DEFAULT_BANNER_DATA: MediaBannerData = {
  id: 'default',
  name: 'Default Banner',
  items: [
    {
      id: '1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
      title: 'Welcome to Learning',
      subtitle: 'Start your journey today',
      ctaText: 'Get Started',
      ctaAction: 'navigate',
      ctaUrl: 'dashboard',
    },
  ],
  aspectRatio: '16:9',
  autoPlay: true,
  loop: true,
  showIndicators: true,
  showControls: true,
  overlayGradient: true,
  borderRadius: 12,
};

export function useMediaBannerQuery(options?: UseMediaBannerOptions) {
  const customerId = useCustomerId();
  const bannerId = options?.bannerId;
  const slot = options?.slot;
  const fallbackItems = options?.fallbackItems;

  return useQuery({
    queryKey: ['media-banner', customerId, bannerId, slot, fallbackItems?.length],
    queryFn: async (): Promise<MediaBannerData> => {
      // If fallback items provided directly via config, use them
      if (fallbackItems && fallbackItems.length > 0) {
        return {
          ...DEFAULT_BANNER_DATA,
          id: 'config-banner',
          name: 'Configured Banner',
          items: fallbackItems,
        };
      }

      // If no bannerId or slot specified, return default placeholder
      if (!bannerId && !slot) {
        return DEFAULT_BANNER_DATA;
      }

      // Only try database if we have customerId
      if (!customerId) {
        return DEFAULT_BANNER_DATA;
      }

      const supabase = getSupabaseClient();

      try {
        // Try to fetch from media_banners table
        let query = supabase
          .from('media_banners')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true);

        if (bannerId) {
          query = query.eq('id', bannerId);
        } else if (slot) {
          query = query.eq('slot', slot);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          return DEFAULT_BANNER_DATA;
        }

        return {
          id: data.id,
          name: data.name,
          items: data.items?.length > 0 ? data.items : DEFAULT_BANNER_DATA.items,
          aspectRatio: data.aspect_ratio || '16:9',
          autoPlay: data.auto_play ?? true,
          loop: data.loop ?? true,
          showIndicators: data.show_indicators ?? true,
          showControls: data.show_controls ?? true,
          overlayGradient: data.overlay_gradient ?? true,
          borderRadius: data.border_radius ?? 12,
        };
      } catch {
        // Return default placeholder data on error
        return DEFAULT_BANNER_DATA;
      }
    },
    // Always enabled
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Helper to extract YouTube video ID
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to get YouTube thumbnail
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
