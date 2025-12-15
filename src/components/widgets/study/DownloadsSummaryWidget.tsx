/**
 * Downloads Summary Widget
 * Displays downloaded content summary with storage used and recent downloads
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useDownloadsSummaryQuery, DownloadItem } from '../../../hooks/queries/useDownloadsSummaryQuery';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';

type DownloadsSummaryConfig = {
  maxItems?: number;
  showStorage?: boolean;
  showRecent?: boolean;
  showTypeBreakdown?: boolean;
  showFileSize?: boolean;
  layoutStyle?: 'list' | 'cards' | 'compact';
  enableTap?: boolean;
};

export const DownloadsSummaryWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();

  const {
    maxItems = 5,
    showStorage = true,
    showRecent = true,
    showTypeBreakdown = false,
    showFileSize = true,
    layoutStyle = 'list',
    enableTap = true,
  } = config as DownloadsSummaryConfig;

  const { data, isLoading, error, refetch } = useDownloadsSummaryQuery(maxItems);

  const handleDownloadPress = (download: DownloadItem) => {
    if (enableTap && onNavigate) {
      onNavigate(`download/${download.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <View style={[styles.skeletonHeader, { backgroundColor: colors.outline }]} />
        <View style={styles.skeletonList}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.outline }]} />
          ))}
        </View>
      </View>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="download-off" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t('widgets.downloadsSummary.states.error')}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.downloadsSummary.actions.retry')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.downloads.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="download" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.downloadsSummary.states.empty')}
        </AppText>
      </View>
    );
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderDownload = (download: DownloadItem) => {
    const isCompact = layoutStyle === 'compact';

    return (
      <TouchableOpacity
        key={download.id}
        style={[
          styles.downloadItem,
          { backgroundColor: colors.surface },
        ]}
        onPress={() => handleDownloadPress(download)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${download.color}15` }]}>
          <Icon name={download.icon} size={isCompact ? 16 : 20} color={download.color} />
        </View>

        {/* Content */}
        <View style={styles.downloadContent}>
          <AppText 
            style={[styles.downloadTitle, { color: colors.onSurface }]} 
            numberOfLines={isCompact ? 1 : 2}
          >
            {download.title}
          </AppText>

          {/* Meta info */}
          <View style={styles.downloadMeta}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: `${download.color}20` }]}>
              <AppText style={[styles.typeText, { color: download.color }]}>
                {download.content_type.toUpperCase()}
              </AppText>
            </View>

            {/* File size */}
            {showFileSize && (
              <View style={styles.metaItem}>
                <Icon name="harddisk" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatSize(download.file_size)}
                </AppText>
              </View>
            )}

            {/* Time ago */}
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
              <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                {download.time_ago}
              </AppText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.downloadsSummary.title')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.downloadsSummary.subtitle', { count: data.totalCount })}
          </AppText>
        </View>
        {showRecent && data.recentCount > 0 && (
          <View style={[styles.recentBadge, { backgroundColor: colors.primaryContainer }]}>
            <Icon name="clock-outline" size={14} color={colors.primary} />
            <AppText style={[styles.recentText, { color: colors.primary }]}>
              {data.recentCount} {t('widgets.downloadsSummary.labels.recent')}
            </AppText>
          </View>
        )}
      </View>

      {/* Storage Banner */}
      {showStorage && (
        <View style={[styles.storageBanner, { backgroundColor: colors.surface }]}>
          <View style={styles.storageItem}>
            <Icon name="folder-download" size={20} color={colors.primary} />
            <View style={styles.storageInfo}>
              <AppText style={[styles.storageValue, { color: colors.onSurface }]}>
                {data.totalCount}
              </AppText>
              <AppText style={[styles.storageLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.downloadsSummary.labels.files')}
              </AppText>
            </View>
          </View>
          <View style={[styles.storageDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.storageItem}>
            <Icon name="harddisk" size={20} color={colors.warning} />
            <View style={styles.storageInfo}>
              <AppText style={[styles.storageValue, { color: colors.onSurface }]}>
                {data.totalSizeFormatted}
              </AppText>
              <AppText style={[styles.storageLabel, { color: colors.onSurfaceVariant }]}>
                {t('widgets.downloadsSummary.labels.storage')}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Type Breakdown */}
      {showTypeBreakdown && Object.keys(data.byType).length > 0 && (
        <View style={[styles.typeBreakdown, { backgroundColor: colors.surface }]}>
          {Object.entries(data.byType).map(([type, count]) => (
            <View key={type} style={styles.typeItem}>
              <Icon 
                name={type === 'video' ? 'video' : type === 'pdf' ? 'file-pdf-box' : 'file-document'} 
                size={14} 
                color={colors.onSurfaceVariant} 
              />
              <AppText style={[styles.typeCount, { color: colors.onSurfaceVariant }]}>
                {count} {type}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* Downloads List */}
      <View style={styles.listContainer}>
        {data.downloads.map(renderDownload)}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <AppText style={[styles.totalText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.downloadsSummary.labels.total', { count: data.totalCount })}
        </AppText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onNavigate?.('downloads')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.downloadsSummary.actions.viewAll')}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  recentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  storageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 10,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageInfo: {
    alignItems: 'flex-start',
  },
  storageValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  storageLabel: {
    fontSize: 10,
  },
  storageDivider: {
    width: 1,
    height: 30,
  },
  typeBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 10,
    borderRadius: 8,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeCount: {
    fontSize: 11,
  },
  listContainer: {
    gap: 8,
  },
  downloadItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadContent: {
    flex: 1,
    gap: 4,
  },
  downloadTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  downloadMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalText: {
    fontSize: 12,
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Skeleton styles
  skeletonHeader: {
    height: 40,
    borderRadius: 8,
    opacity: 0.3,
  },
  skeletonList: {
    gap: 8,
    marginTop: 12,
  },
  skeletonItem: {
    height: 60,
    borderRadius: 10,
    opacity: 0.3,
  },
  // Error/Empty styles
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
