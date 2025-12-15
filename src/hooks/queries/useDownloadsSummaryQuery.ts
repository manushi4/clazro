/**
 * Downloads Summary Query Hook
 * Fetches user downloads for the downloads summary widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type DownloadItem = {
  id: string;
  title: string;
  content_type: string;
  file_size: number;
  file_path: string;
  mime_type: string | null;
  thumbnail_url: string | null;
  downloaded_at: string;
  time_ago: string;
  icon: string;
  color: string;
};

export type DownloadsSummaryData = {
  downloads: DownloadItem[];
  totalCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  recentCount: number;
  byType: Record<string, number>;
};

// Map content types to icons
const TYPE_ICONS: Record<string, string> = {
  video: 'video',
  pdf: 'file-pdf-box',
  document: 'file-document',
  audio: 'music',
  image: 'image',
  resource: 'file',
};

// Map content types to colors
const TYPE_COLORS: Record<string, string> = {
  video: '#EF4444',
  pdf: '#F59E0B',
  document: '#3B82F6',
  audio: '#8B5CF6',
  image: '#10B981',
  resource: '#6366F1',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function useDownloadsSummaryQuery(maxItems: number = 5) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['downloads-summary', customerId, userId, maxItems, lang],
    queryFn: async (): Promise<DownloadsSummaryData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('user_downloads')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('is_available', true)
        .order('downloaded_at', { ascending: false });

      if (error) {
        console.error('Downloads query failed:', error);
        throw error;
      }

      const allDownloads = data || [];

      // Calculate total size
      const totalSize = allDownloads.reduce((sum, d) => sum + (d.file_size || 0), 0);

      // Count by type
      const byType: Record<string, number> = {};
      allDownloads.forEach(d => {
        byType[d.content_type] = (byType[d.content_type] || 0) + 1;
      });

      // Count recent (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentCount = allDownloads.filter(d => new Date(d.downloaded_at) > weekAgo).length;

      // Transform downloads
      const downloads: DownloadItem[] = allDownloads.slice(0, maxItems).map(item => ({
        id: item.id,
        title: getLocalizedField(item, 'title', lang),
        content_type: item.content_type,
        file_size: item.file_size,
        file_path: item.file_path,
        mime_type: item.mime_type,
        thumbnail_url: item.thumbnail_url,
        downloaded_at: item.downloaded_at,
        time_ago: getTimeAgo(item.downloaded_at),
        icon: TYPE_ICONS[item.content_type] || 'file',
        color: TYPE_COLORS[item.content_type] || '#6366F1',
      }));

      return {
        downloads,
        totalCount: allDownloads.length,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        recentCount,
        byType,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
