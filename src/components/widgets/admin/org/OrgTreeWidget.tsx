/**
 * OrgTreeWidget - Admin Organization Tree
 *
 * Displays hierarchical organization structure with:
 * - Organizations (root level)
 * - Departments (under organizations)
 * - Classes (under departments)
 * - Batches (under classes)
 *
 * Widget ID: org.tree
 * Category: organization
 * Roles: admin, super_admin
 *
 * Phase 1: Database - organizations table
 * Phase 2: Query Hook - useOrgTreeQuery
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../../theme/useAppTheme';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import {
  useOrgTreeQuery,
  ORG_TYPE_CONFIG,
} from '../../../../hooks/queries/admin/useOrgTreeQuery';
import type { WidgetProps } from '../../../../types/widget.types';
import type { OrgNode, OrgNodeType } from '../../../../hooks/queries/admin/useOrgTreeQuery';

type OrgTreeConfig = {
  maxDepth?: number;
  showMemberCount?: boolean;
  showDescription?: boolean;
  showStats?: boolean;
  expandedByDefault?: boolean;
  enableTap?: boolean;
  showViewAll?: boolean;
  compactMode?: boolean;
};

export const OrgTreeWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');

  const widgetConfig: OrgTreeConfig = {
    maxDepth: 4,
    showMemberCount: true,
    showDescription: false,
    showStats: true,
    expandedByDefault: true,
    enableTap: true,
    showViewAll: true,
    compactMode: false,
    ...config,
  };

  const { data, isLoading, error, refetch } = useOrgTreeQuery();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Initialize expanded state based on config
  React.useEffect(() => {
    if (widgetConfig.expandedByDefault && data?.tree) {
      const allIds = new Set<string>();
      const collectIds = (nodes: OrgNode[]) => {
        nodes.forEach((node) => {
          allIds.add(node.id);
          collectIds(node.children);
        });
      };
      collectIds(data.tree);
      setExpandedNodes(allIds);
    }
  }, [data?.tree, widgetConfig.expandedByDefault]);

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

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodePress = useCallback(
    (node: OrgNode) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.('org-detail', { orgId: node.id, type: node.type });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.('org-management');
  }, [onNavigate]);

  const renderNode = (node: OrgNode, depth: number = 0): React.ReactNode => {
    if (depth >= (widgetConfig.maxDepth || 4)) return null;

    const typeConfig = ORG_TYPE_CONFIG[node.type];
    const nodeColor = getThemeColor(typeConfig.color);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentWidth = depth * 20;

    return (
      <View key={node.id}>
        <TouchableOpacity
          style={[
            styles.nodeRow,
            { paddingLeft: 12 + indentWidth },
            depth === 0 && styles.rootNode,
          ]}
          onPress={() => handleNodePress(node)}
          disabled={!widgetConfig.enableTap}
          activeOpacity={0.7}
          accessibilityLabel={t('widgets.orgTree.nodeHint', {
            name: node.name,
            type: typeConfig.label,
            count: node.memberCount,
            defaultValue: `${node.name} - ${typeConfig.label} with ${node.memberCount} members`,
          })}
          accessibilityRole="button"
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpand(node.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandPlaceholder} />
          )}

          {/* Type Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${nodeColor}20` }]}>
            <Icon name={typeConfig.icon} size={18} color={nodeColor} />
          </View>

          {/* Node Info */}
          <View style={styles.nodeInfo}>
            <AppText
              style={[
                styles.nodeName,
                { color: colors.onSurface },
                depth === 0 && styles.rootNodeName,
              ]}
              numberOfLines={1}
            >
              {node.name}
            </AppText>
            {widgetConfig.showDescription && node.description && (
              <AppText
                style={[styles.nodeDescription, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {node.description}
              </AppText>
            )}
          </View>

          {/* Member Count */}
          {widgetConfig.showMemberCount && (
            <View style={styles.memberCount}>
              <Icon name="account-multiple" size={14} color={colors.onSurfaceVariant} />
              <AppText style={[styles.memberCountText, { color: colors.onSurfaceVariant }]}>
                {node.memberCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Children */}
        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading && !data?.tree?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.orgTree.title', { defaultValue: 'Organization Structure' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.orgTree.states.loading', { defaultValue: 'Loading organization...' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !data?.tree?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.orgTree.title', { defaultValue: 'Organization Structure' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.orgTree.states.error', { defaultValue: 'Failed to load organization' })}
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
  if (!data?.tree?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.orgTree.title', { defaultValue: 'Organization Structure' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="sitemap" size={48} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.orgTree.states.empty', { defaultValue: 'No organizations found' })}
          </AppText>
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
            {t('widgets.orgTree.title', { defaultValue: 'Organization Structure' })}
          </AppText>
          {widgetConfig.showStats && data && (
            <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {t('widgets.orgTree.summary', {
                orgs: data.totalOrganizations,
                depts: data.totalDepartments,
                classes: data.totalClasses,
                defaultValue: `${data.totalOrganizations} orgs, ${data.totalDepartments} depts, ${data.totalClasses} classes`,
              })}
            </AppText>
          )}
        </View>
        {widgetConfig.showViewAll && (
          <TouchableOpacity onPress={handleViewAll}>
            <AppText style={[styles.viewAll, { color: colors.primary }]}>
              {t('common:actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Tree */}
      <View style={styles.treeContainer}>
        {data.tree.map((node) => renderNode(node, 0))}
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
  treeContainer: {
    gap: 4,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 12,
    gap: 8,
  },
  rootNode: {
    paddingVertical: 12,
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandPlaceholder: {
    width: 24,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  rootNodeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  nodeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
  },
  childrenContainer: {
    marginLeft: 0,
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

export default OrgTreeWidget;
