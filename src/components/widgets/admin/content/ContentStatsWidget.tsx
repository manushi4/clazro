import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useContentStatsQuery, ContentTypeStats, ContentStatusStats } from '../../../../hooks/queries/admin/useContentStatsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'content.stats';

// Format large numbers
const formatNumber = (value: number, abbreviate: boolean = true): string => {
  if (!abbreviate) return value.toLocaleString();
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

export const ContentStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showTypeBreakdown = config?.showTypeBreakdown !== false;
  const showStatusBreakdown = config?.showStatusBreakdown !== false;
  const showViewDetails = config?.showViewDetails !== false;
  const abbreviateNumbers = config?.abbreviateNumbers !== false;
  const maxTypes = (config?.maxTypes as number) || 4;

  const { data, isLoading, error, refetch } = useContentStatsQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
    });
  }, []);

  const handleViewDetails = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_details' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_details`,
      level: 'info',
    });
    onNavigate?.('content-management');
  };

  const handleTypePress = (type: ContentTypeStats) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'type_tap', type: type.type });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_type_tap`,
      level: 'info',
      data: { type: type.type },
    });
    onNavigate?.('content-management');
  };

  // Get color for type/status
  const getColor = (colorKey: string): string => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentStats.title', { defaultValue: 'Content Statistics' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentStats.states.loading', { defaultValue: 'Loading content stats...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentStats.title', { defaultValue: 'Content Statistics' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.contentStats.states.error', { defaultValue: 'Failed to load content stats' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => refetch()}
            accessibilityLabel={t('common:actions.retry', { defaultValue: 'Retry' })}
            accessibilityRole="button"
          >
            <AppText style={{ color: colors.primary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data || data.total === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.contentStats.title', { defaultValue: 'Content Statistics' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="file-document-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentStats.states.empty', { defaultValue: 'No content available' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('widgets.contentStats.title', { defaultValue: 'Content Statistics' })}
        </AppText>
        {showViewDetails && (
          <TouchableOpacity
            onPress={handleViewDetails}
            accessibilityLabel={t('widgets.contentStats.viewDetails', { defaultValue: 'View Details' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewDetails, { color: colors.primary }]}>
              {t('widgets.contentStats.viewDetails', { defaultValue: 'View Details' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium }]}>
        <View style={styles.summaryMain}>
          <Icon name="file-document-multiple" size={28} color={colors.primary} />
          <View style={styles.summaryText}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {formatNumber(data.total, abbreviateNumbers)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.contentStats.totalContent', { defaultValue: 'Total Content' })}
            </AppText>
          </View>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Icon name="eye" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
              {formatNumber(data.totalViews, abbreviateNumbers)}
            </AppText>
            <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.contentStats.views', { defaultValue: 'Views' })}
            </AppText>
          </View>
          <View style={styles.summaryStatItem}>
            <Icon name="star" size={16} color={colors.warning} />
            <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
              {data.avgRating.toFixed(1)}
            </AppText>
            <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.contentStats.rating', { defaultValue: 'Avg Rating' })}
            </AppText>
          </View>
          <View style={styles.summaryStatItem}>
            <Icon name="clock-plus" size={16} color={colors.success} />
            <AppText style={[styles.summaryStatValue, { color: colors.onSurface }]}>
              {data.recentCount}
            </AppText>
            <AppText style={[styles.summaryStatLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.contentStats.recent', { defaultValue: 'This Week' })}
            </AppText>
          </View>
        </View>
      </View>

      {/* Type Breakdown */}
      {showTypeBreakdown && data.byType.length > 0 && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentStats.byType', { defaultValue: 'By Type' })}
          </AppText>
          <View style={styles.typeGrid}>
            {data.byType.slice(0, maxTypes).map((type) => {
              const typeColor = getColor(type.color);
              return (
                <TouchableOpacity
                  key={type.type}
                  style={[styles.typeCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
                  onPress={() => handleTypePress(type)}
                  accessibilityLabel={t('widgets.contentStats.typeHint', {
                    type: type.label,
                    count: type.count,
                    defaultValue: `${type.label}: ${type.count} items`,
                  })}
                  accessibilityRole="button"
                >
                  <View style={[styles.typeIconContainer, { backgroundColor: `${typeColor}20` }]}>
                    <Icon name={type.icon} size={18} color={typeColor} />
                  </View>
                  <AppText style={[styles.typeCount, { color: colors.onSurface }]}>
                    {type.count}
                  </AppText>
                  <AppText style={[styles.typeLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {t(`widgets.contentStats.types.${type.type}`, { defaultValue: type.label })}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Status Breakdown */}
      {showStatusBreakdown && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.contentStats.byStatus', { defaultValue: 'By Status' })}
          </AppText>
          <View style={styles.statusRow}>
            {data.byStatus.map((status) => {
              const statusColor = getColor(status.color);
              const percentage = data.total > 0 ? Math.round((status.count / data.total) * 100) : 0;
              return (
                <View key={status.status} style={styles.statusItem}>
                  <View style={styles.statusHeader}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <AppText style={[styles.statusLabel, { color: colors.onSurfaceVariant }]}>
                      {t(`widgets.contentStats.statuses.${status.status}`, { defaultValue: status.label })}
                    </AppText>
                  </View>
                  <AppText style={[styles.statusCount, { color: colors.onSurface }]}>
                    {status.count}
                  </AppText>
                  <View style={[styles.statusBar, { backgroundColor: colors.surfaceVariant }]}>
                    <View 
                      style={[
                        styles.statusBarFill, 
                        { backgroundColor: statusColor, width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  summaryContainer: {
    padding: 12,
    marginBottom: 12,
  },
  summaryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  summaryStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryStatLabel: {
    fontSize: 10,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: '22%',
    padding: 10,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 10,
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
