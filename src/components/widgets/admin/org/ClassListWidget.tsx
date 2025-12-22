/**
 * ClassListWidget - Admin Class List
 *
 * Displays list of classes with:
 * - Search and filter capabilities
 * - Member count display
 * - Parent department info
 * - Active/inactive status
 *
 * Widget ID: org.class-list
 * Category: organization
 * Roles: admin, super_admin
 *
 * Phase 1: Database - organizations table (type='class')
 * Phase 2: Query Hook - useClassListQuery
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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../../theme/useAppTheme';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import { useClassListQuery } from '../../../../hooks/queries/admin/useClassListQuery';
import type { WidgetProps } from '../../../../types/widget.types';
import type { ClassItem } from '../../../../hooks/queries/admin/useClassListQuery';

type ClassListConfig = {
  maxItems?: number;
  showSearch?: boolean;
  showMemberCount?: boolean;
  showDepartment?: boolean;
  showDescription?: boolean;
  showStatus?: boolean;
  showViewAll?: boolean;
  compactMode?: boolean;
  enableTap?: boolean;
  filterActive?: boolean;
};

export const ClassListWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');

  const widgetConfig: ClassListConfig = {
    maxItems: 5,
    showSearch: true,
    showMemberCount: true,
    showDepartment: true,
    showDescription: false,
    showStatus: true,
    showViewAll: true,
    compactMode: false,
    enableTap: true,
    filterActive: undefined,
    ...config,
  };

  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useClassListQuery({
    search: searchQuery,
    isActive: widgetConfig.filterActive,
    limit: widgetConfig.maxItems,
  });

  const handleClassPress = useCallback(
    (classItem: ClassItem) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.('class-detail', { classId: classItem.id });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.('class-management');
  }, [onNavigate]);

  const handleAddClass = useCallback(() => {
    onNavigate?.('class-create');
  }, [onNavigate]);

  const renderClassItem = (classItem: ClassItem) => {
    return (
      <TouchableOpacity
        key={classItem.id}
        style={[
          styles.classItem,
          { backgroundColor: colors.surfaceVariant },
          widgetConfig.compactMode && styles.classItemCompact,
        ]}
        onPress={() => handleClassPress(classItem)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
        accessibilityLabel={t('widgets.classList.classHint', {
          name: classItem.name,
          members: classItem.memberCount,
          department: classItem.parentName || 'N/A',
          defaultValue: `${classItem.name} - ${classItem.memberCount} members - ${classItem.parentName || 'No department'}`,
        })}
        accessibilityRole="button"
      >
        {/* Class Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.tertiary || '#9C27B0'}20` }]}>
          <Icon name="google-classroom" size={20} color={colors.tertiary || '#9C27B0'} />
        </View>

        {/* Class Info */}
        <View style={styles.classInfo}>
          <View style={styles.classHeader}>
            <AppText
              style={[styles.className, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {classItem.name}
            </AppText>
            {widgetConfig.showStatus && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: classItem.isActive
                      ? `${colors.success || '#4CAF50'}20`
                      : `${colors.error}20`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: classItem.isActive
                        ? colors.success || '#4CAF50'
                        : colors.error,
                    },
                  ]}
                />
                <AppText
                  style={[
                    styles.statusText,
                    {
                      color: classItem.isActive
                        ? colors.success || '#4CAF50'
                        : colors.error,
                    },
                  ]}
                >
                  {classItem.isActive
                    ? t('widgets.classList.statuses.active', { defaultValue: 'Active' })
                    : t('widgets.classList.statuses.inactive', { defaultValue: 'Inactive' })}
                </AppText>
              </View>
            )}
          </View>

          {widgetConfig.showDepartment && classItem.parentName && (
            <View style={styles.departmentRow}>
              <Icon name="office-building" size={12} color={colors.onSurfaceVariant} />
              <AppText
                style={[styles.departmentText, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {classItem.parentName}
              </AppText>
            </View>
          )}

          {widgetConfig.showDescription && classItem.description && (
            <AppText
              style={[styles.descriptionText, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {classItem.description}
            </AppText>
          )}
        </View>

        {/* Member Count */}
        {widgetConfig.showMemberCount && (
          <View style={styles.memberCount}>
            <Icon name="account-multiple" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.memberCountText, { color: colors.onSurfaceVariant }]}>
              {classItem.memberCount}
            </AppText>
          </View>
        )}

        {/* Chevron */}
        {widgetConfig.enableTap && (
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !data?.classes?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.classList.title', { defaultValue: 'Classes' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.classList.states.loading', { defaultValue: 'Loading classes...' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !data?.classes?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.classList.title', { defaultValue: 'Classes' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.classList.states.error', { defaultValue: 'Failed to load classes' })}
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
  if (!data?.classes?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.classList.title', { defaultValue: 'Classes' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="google-classroom" size={48} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.classList.states.empty', { defaultValue: 'No classes found' })}
          </AppText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddClass}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
            <AppText style={styles.addButtonText}>
              {t('widgets.classList.actions.addClass', { defaultValue: 'Add Class' })}
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
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.classList.title', { defaultValue: 'Classes' })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.classList.summary', {
              total: data.totalCount,
              active: data.activeCount,
              defaultValue: `${data.totalCount} total, ${data.activeCount} active`,
            })}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addIconButton, { backgroundColor: `${colors.primary}20` }]}
            onPress={handleAddClass}
            accessibilityLabel={t('widgets.classList.actions.addClass', { defaultValue: 'Add Class' })}
          >
            <Icon name="plus" size={20} color={colors.primary} />
          </TouchableOpacity>
          {widgetConfig.showViewAll && (
            <TouchableOpacity onPress={handleViewAll}>
              <AppText style={[styles.viewAll, { color: colors.primary }]}>
                {t('common:actions.viewAll', { defaultValue: 'View All' })}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search */}
      {widgetConfig.showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t('widgets.classList.searchPlaceholder', { defaultValue: 'Search classes...' })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel={t('widgets.classList.searchPlaceholder', { defaultValue: 'Search classes' })}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Class List */}
      <View style={styles.listContainer}>
        {data.classes.map(renderClassItem)}
      </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  listContainer: {
    gap: 8,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  classItemCompact: {
    padding: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  departmentText: {
    fontSize: 12,
  },
  descriptionText: {
    fontSize: 12,
    marginTop: 2,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 13,
    fontWeight: '500',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClassListWidget;
