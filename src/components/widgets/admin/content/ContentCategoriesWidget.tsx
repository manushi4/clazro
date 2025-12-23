/**
 * ContentCategoriesWidget - Admin Content Categories
 *
 * Displays content categories with counts, views, and ratings.
 * Supports grid and list layouts with filtering options.
 *
 * Widget ID: content.categories
 * Category: content
 * Roles: admin, super_admin
 *
 * Phase 1: Database - Uses content_library.category column
 * Phase 2: Query Hook - useContentCategoriesQuery
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - admin.json (EN/HI)
 * Phase 5: Widget Registry - src/config/widgetRegistry.ts
 * Phase 6: Platform Studio - platform-studio/src/config/widgetRegistry.ts
 * Phase 7: Database Screen Layout - screen_layouts table
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../../theme/useAppTheme';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import {
  useContentCategoriesQuery,
  getCategoryConfig,
} from '../../../../hooks/queries/admin/useContentCategoriesQuery';
import type { WidgetProps } from '../../../../types/widget.types';
import type { CategoryStats } from '../../../../hooks/queries/admin/useContentCategoriesQuery';

type ContentCategoriesConfig = {
  maxCategories?: number;
  layoutStyle?: 'grid' | 'list';
  showCount?: boolean;
  showViews?: boolean;
  showRating?: boolean;
  showPublished?: boolean;
  showViewAll?: boolean;
  enableTap?: boolean;
  columns?: number;
};

export const ContentCategoriesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');

  const widgetConfig: ContentCategoriesConfig = {
    maxCategories: 8,
    layoutStyle: 'grid',
    showCount: true,
    showViews: true,
    showRating: true,
    showPublished: false,
    showViewAll: true,
    enableTap: true,
    columns: 2,
    ...config,
  };

  const { data, isLoading, error, refetch } = useContentCategoriesQuery();

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

  const handleCategoryPress = useCallback(
    (category: CategoryStats) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.('content-management', { category: category.category });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.('content-management', { view: 'categories' });
  }, [onNavigate]);

  // Format large numbers
  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const renderCategoryCard = (category: CategoryStats, index: number) => {
    const categoryColor = getThemeColor(category.color);
    const isGrid = widgetConfig.layoutStyle === 'grid';

    if (isGrid) {
      return (
        <TouchableOpacity
          key={category.category}
          style={[
            styles.gridCard,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
              width: `${100 / (widgetConfig.columns || 2) - 2}%`,
            },
          ]}
          onPress={() => handleCategoryPress(category)}
          disabled={!widgetConfig.enableTap}
          activeOpacity={0.7}
          accessibilityLabel={t('widgets.contentCategories.categoryHint', {
            category: category.category,
            count: category.count,
            defaultValue: `${category.category}: ${category.count} items`,
          })}
          accessibilityRole="button"
        >
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
            <Icon name={category.icon} size={24} color={categoryColor} />
          </View>
          <AppText
            style={[styles.categoryName, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {category.category}
          </AppText>
          {widgetConfig.showCount && (
            <AppText style={[styles.categoryCount, { color: categoryColor }]}>
              {category.count}
            </AppText>
          )}
          <View style={styles.categoryMeta}>
            {widgetConfig.showViews && (
              <View style={styles.metaItem}>
                <Icon name="eye" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatNumber(category.totalViews)}
                </AppText>
              </View>
            )}
            {widgetConfig.showRating && category.avgRating > 0 && (
              <View style={styles.metaItem}>
                <Icon name="star" size={12} color={colors.warning || '#FF9800'} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {category.avgRating.toFixed(1)}
                </AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // List layout
    return (
      <TouchableOpacity
        key={category.category}
        style={[
          styles.listItem,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
        onPress={() => handleCategoryPress(category)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
        accessibilityLabel={t('widgets.contentCategories.categoryHint', {
          category: category.category,
          count: category.count,
          defaultValue: `${category.category}: ${category.count} items`,
        })}
        accessibilityRole="button"
      >
        <View style={[styles.listIconContainer, { backgroundColor: `${categoryColor}20` }]}>
          <Icon name={category.icon} size={20} color={categoryColor} />
        </View>
        <View style={styles.listInfo}>
          <AppText style={[styles.listCategoryName, { color: colors.onSurface }]}>
            {category.category}
          </AppText>
          <View style={styles.listMeta}>
            {widgetConfig.showViews && (
              <View style={styles.metaItem}>
                <Icon name="eye" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {formatNumber(category.totalViews)}
                </AppText>
              </View>
            )}
            {widgetConfig.showRating && category.avgRating > 0 && (
              <View style={styles.metaItem}>
                <Icon name="star" size={12} color={colors.warning || '#FF9800'} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {category.avgRating.toFixed(1)}
                </AppText>
              </View>
            )}
            {widgetConfig.showPublished && (
              <View style={styles.metaItem}>
                <Icon name="check-circle" size={12} color={colors.success || '#4CAF50'} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {category.publishedCount}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.listCount}>
          <AppText style={[styles.listCountText, { color: categoryColor }]}>
            {category.count}
          </AppText>
          <AppText style={[styles.listCountLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentCategories.items', { defaultValue: 'items' })}
          </AppText>
        </View>
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !data?.categories?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentCategories.title', { defaultValue: 'Content Categories' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentCategories.states.loading', { defaultValue: 'Loading categories...' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !data?.categories?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentCategories.title', { defaultValue: 'Content Categories' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.contentCategories.states.error', { defaultValue: 'Failed to load categories' })}
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

  // Empty state
  if (!data?.categories?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentCategories.title', { defaultValue: 'Content Categories' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="folder-outline" size={48} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentCategories.states.empty', { defaultValue: 'No categories found' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  const displayCategories = data.categories.slice(0, widgetConfig.maxCategories);

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentCategories.title', { defaultValue: 'Content Categories' })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentCategories.summary', {
              categories: data.totalCategories,
              content: data.totalContent,
              defaultValue: `${data.totalCategories} categories, ${data.totalContent} items`,
            })}
          </AppText>
        </View>
        {widgetConfig.showViewAll && (
          <TouchableOpacity onPress={handleViewAll}>
            <AppText style={[styles.viewAll, { color: colors.primary }]}>
              {t('common:actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      {widgetConfig.layoutStyle === 'grid' ? (
        <View style={styles.gridContainer}>
          {displayCategories.map((category, index) => renderCategoryCard(category, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayCategories.map((category, index) => renderCategoryCard(category, index))}
        </View>
      )}
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    padding: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 10,
  },
  listContainer: {
    gap: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listCategoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  listMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  listCount: {
    alignItems: 'flex-end',
  },
  listCountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  listCountLabel: {
    fontSize: 10,
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

export default ContentCategoriesWidget;
