/**
 * ContentListWidget - Admin Content List
 *
 * Displays a filterable, sortable list of content items with search,
 * type filter, and status filter capabilities.
 *
 * Widget ID: content.list
 * Category: list
 * Roles: admin, super_admin
 *
 * Phase 1: Database Setup - Uses content_library table
 * Phase 2: Query Hook - useContentListQuery
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - admin.json (EN/HI)
 * Phase 5: Widget Registry - src/config/widgetRegistry.ts
 * Phase 6: Platform Studio - platform-studio/src/config/widgetRegistry.ts
 * Phase 7: Database Screen Layout - screen_layouts table
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../../theme/useAppTheme';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import {
  useContentListQuery,
  CONTENT_TYPE_CONFIG,
  CONTENT_STATUS_CONFIG,
  formatViewCount,
  formatDuration,
} from '../../../../hooks/queries/admin/useContentListQuery';
import type { WidgetProps } from '../../../../types/widget.types';
import type {
  ContentListItem,
  ContentType,
  ContentStatus,
} from '../../../../hooks/queries/admin/useContentListQuery';

type ContentListConfig = {
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showTypeFilter?: boolean;
  showStatusFilter?: boolean;
  showViews?: boolean;
  showRating?: boolean;
  showDuration?: boolean;
  showCategory?: boolean;
  enableTap?: boolean;
  defaultTypeFilter?: ContentType | null;
  defaultStatusFilter?: ContentStatus | null;
};

export const ContentListWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');

  const widgetConfig: ContentListConfig = {
    maxItems: 10,
    showSearch: true,
    showFilters: true,
    showTypeFilter: true,
    showStatusFilter: true,
    showViews: true,
    showRating: true,
    showDuration: true,
    showCategory: true,
    enableTap: true,
    defaultTypeFilter: null,
    defaultStatusFilter: null,
    ...config,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | null>(
    widgetConfig.defaultTypeFilter || null
  );
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | null>(
    widgetConfig.defaultStatusFilter || null
  );

  // Fetch real data from database
  const { data: content, isLoading, error, refetch } = useContentListQuery({
    search: searchQuery,
    contentType: selectedType,
    status: selectedStatus,
    limit: widgetConfig.maxItems,
  });

  // Get color from theme
  const getThemeColor = useCallback(
    (colorKey: string): string => {
      const colorMap: Record<string, string> = {
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary || '#9C27B0',
        success: colors.success || '#4CAF50',
        warning: colors.warning || '#FF9800',
        error: colors.error,
      };
      return colorMap[colorKey] || colors.primary;
    },
    [colors]
  );

  const handleContentPress = useCallback(
    (item: ContentListItem) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.('content-detail', { contentId: item.id });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.('content-management', { view: 'all' });
  }, [onNavigate]);

  const renderFilterChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
    color?: string
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected
            ? color || colors.primary
            : colors.surfaceVariant,
          borderRadius: borderRadius.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppText
        style={[
          styles.filterChipText,
          { color: selected ? '#FFFFFF' : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );

  const renderContentItem = ({ item }: { item: ContentListItem }) => {
    const typeConfig = CONTENT_TYPE_CONFIG[item.content_type];
    const statusConfig = CONTENT_STATUS_CONFIG[item.status];
    const typeColor = getThemeColor(typeConfig.color);
    const statusColor = getThemeColor(statusConfig.color);

    return (
      <TouchableOpacity
        style={[
          styles.contentItem,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
        onPress={() => handleContentPress(item)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
          <Icon name={typeConfig.icon} size={20} color={typeColor} />
        </View>

        <View style={styles.contentInfo}>
          <AppText
            style={[styles.contentTitle, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {item.title}
          </AppText>
          {widgetConfig.showCategory && item.category && (
            <AppText
              style={[styles.contentCategory, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {item.category}
            </AppText>
          )}
          <View style={styles.contentMeta}>
            {widgetConfig.showViews && (
              <View style={styles.metaItem}>
                <Icon name="eye" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatViewCount(item.view_count)}
                </AppText>
              </View>
            )}
            {widgetConfig.showRating && item.rating > 0 && (
              <View style={styles.metaItem}>
                <Icon name="star" size={12} color={colors.warning || '#FF9800'} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {item.rating.toFixed(1)}
                </AppText>
              </View>
            )}
            {widgetConfig.showDuration && item.duration_minutes && (
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatDuration(item.duration_minutes)}
                </AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentStatus}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <AppText style={[styles.statusBadgeText, { color: statusColor }]}>
              {t(`widgets.contentList.statuses.${item.status}`, {
                defaultValue: statusConfig.label,
              })}
            </AppText>
          </View>
        </View>

        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !content?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentList.title', { defaultValue: 'Content Library' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentList.states.loading', { defaultValue: 'Loading content...' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !content?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentList.title', { defaultValue: 'Content Library' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.contentList.states.error', { defaultValue: 'Failed to load content' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <AppText style={styles.retryButtonText}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.contentList.title', { defaultValue: 'Content Library' })}
        </AppText>
        <TouchableOpacity onPress={handleViewAll}>
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.viewAll', { defaultValue: 'View All' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {widgetConfig.showSearch && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t('widgets.contentList.searchPlaceholder', {
              defaultValue: 'Search content...',
            })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Type Filters */}
      {widgetConfig.showFilters && widgetConfig.showTypeFilter && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            {renderFilterChip(
              t('widgets.contentList.allTypes', { defaultValue: 'All' }),
              selectedType === null,
              () => setSelectedType(null)
            )}
            {(['course', 'lesson', 'video', 'quiz'] as ContentType[]).map((type) =>
              renderFilterChip(
                t(`widgets.contentList.types.${type}`, {
                  defaultValue: CONTENT_TYPE_CONFIG[type].label,
                }),
                selectedType === type,
                () => setSelectedType(selectedType === type ? null : type),
                getThemeColor(CONTENT_TYPE_CONFIG[type].color)
              )
            )}
          </View>
        </View>
      )}

      {/* Status Filters */}
      {widgetConfig.showFilters && widgetConfig.showStatusFilter && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            {renderFilterChip(
              t('widgets.contentList.allStatuses', { defaultValue: 'All Status' }),
              selectedStatus === null,
              () => setSelectedStatus(null)
            )}
            {(['published', 'draft', 'review'] as ContentStatus[]).map((status) =>
              renderFilterChip(
                t(`widgets.contentList.statuses.${status}`, {
                  defaultValue: CONTENT_STATUS_CONFIG[status].label,
                }),
                selectedStatus === status,
                () => setSelectedStatus(selectedStatus === status ? null : status),
                getThemeColor(CONTENT_STATUS_CONFIG[status].color)
              )
            )}
          </View>
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={content || []}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-document-outline" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t('widgets.contentList.noContent', { defaultValue: 'No content found' })}
            </AppText>
          </View>
        }
      />
    </AppCard>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  contentMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  contentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default ContentListWidget;
