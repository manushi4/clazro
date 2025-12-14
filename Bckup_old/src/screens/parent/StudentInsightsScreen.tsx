/**
 * StudentInsightsScreen - PHASE 3D: AI-Generated Insights & Recommendations
 *
 * Displays AI-generated insights with:
 * - Priority insights (top 3 by priority)
 * - Category-wise insights (strengths, concerns, recommendations, trends)
 * - Actionable suggestions
 * - Supporting metrics from data sources
 * - Visual indicators by type and priority
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ParentStackParamList, 'StudentInsights'>;

type InsightType = 'strength' | 'concern' | 'recommendation' | 'trend';
type CategoryType = 'all' | 'academic' | 'behavioral' | 'social';

interface Insight {
  id: string;
  student_id: string;
  insight_type: InsightType;
  category: string;
  title: string;
  content: string;
  icon: string | null;
  priority: number;
  actionable: boolean;
  suggested_actions: string[] | null;
  data_source: any;
  created_at: string;
  expires_at: string | null;
  is_read: boolean;
}

const StudentInsightsScreen: React.FC<Props> = ({ route }) => {
  const { childId, childName } = route.params;
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  useEffect(() => {
    trackScreenView('StudentInsights', { from: 'ChildDetail', childId });
  }, [childId]);

  // Fetch insights
  const {
    data: insights = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['studentInsights', childId],
    queryFn: async () => {
      console.log('💡 [StudentInsights] Fetching insights...');
      const { data, error } = await supabase
        .from('student_insights')
        .select('*')
        .eq('student_id', childId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [StudentInsights] Error fetching insights:', error);
        throw error;
      }

      console.log('✅ [StudentInsights] Loaded', data?.length || 0, 'insights');
      return data as Insight[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (categoryFilter === 'all') return insights;
    return insights.filter(i => i.category === categoryFilter);
  }, [insights, categoryFilter]);

  // Priority insights (top 3 by priority)
  const priorityInsights = useMemo(
    () => filteredInsights.filter(i => i.priority >= 4).slice(0, 3),
    [filteredInsights]
  );

  // Group by type
  const strengthInsights = useMemo(
    () => filteredInsights.filter(i => i.insight_type === 'strength'),
    [filteredInsights]
  );

  const concernInsights = useMemo(
    () => filteredInsights.filter(i => i.insight_type === 'concern'),
    [filteredInsights]
  );

  const recommendationInsights = useMemo(
    () => filteredInsights.filter(i => i.insight_type === 'recommendation'),
    [filteredInsights]
  );

  const trendInsights = useMemo(
    () => filteredInsights.filter(i => i.insight_type === 'trend'),
    [filteredInsights]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = insights.length;
    const actionable = insights.filter(i => i.actionable).length;
    const highPriority = insights.filter(i => i.priority >= 4).length;
    const unread = insights.filter(i => !i.is_read).length;

    return { total, actionable, highPriority, unread };
  }, [insights]);

  // Get type color
  const getTypeColor = (type: InsightType) => {
    switch (type) {
      case 'strength':
        return Colors.success;
      case 'concern':
        return Colors.warning;
      case 'recommendation':
        return Colors.primary;
      case 'trend':
        return Colors.info;
      default:
        return Colors.textSecondary;
    }
  };

  // Get type icon
  const getTypeIcon = (type: InsightType, customIcon?: string | null) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'strength':
        return '🌟';
      case 'concern':
        return '⚠️';
      case 'recommendation':
        return '💡';
      case 'trend':
        return '📈';
      default:
        return '💬';
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: number): 'success' | 'warning' | 'error' | 'info' => {
    if (priority === 5) return 'error';
    if (priority === 4) return 'warning';
    if (priority === 3) return 'info';
    return 'success';
  };

  // Render insight card
  const renderInsightCard = (insight: Insight) => {
    const isExpanded = expandedInsightId === insight.id;
    const typeColor = getTypeColor(insight.insight_type);
    const typeIcon = getTypeIcon(insight.insight_type, insight.icon);

    return (
      <Card key={insight.id} variant="elevated">
        <CardContent>
          <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
            <Row centerV style={{ flex: 1 }}>
              <T variant="title" style={{ fontSize: 24, marginRight: Spacing.xs }}>
                {typeIcon}
              </T>
              <T variant="body" weight="semiBold" style={{ flex: 1 }}>
                {insight.title}
              </T>
            </Row>
            <Badge
              variant={getPriorityVariant(insight.priority)}
              label={`P${insight.priority}`}
            />
          </Row>

          <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
            {insight.content}
          </T>

          {/* Category & Type Badges */}
          <Row style={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
            <Badge
              variant="default"
              label={insight.category}
              style={{ backgroundColor: Colors.primaryLight }}
            />
            <Badge
              variant="default"
              label={insight.insight_type}
              style={{ backgroundColor: typeColor + '20' }}
            />
            {insight.actionable && (
              <Badge variant="info" label="Actionable" />
            )}
          </Row>

          {/* Suggested Actions (if actionable) */}
          {insight.actionable && insight.suggested_actions && insight.suggested_actions.length > 0 && (
            <View style={{ marginTop: Spacing.sm }}>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                💼 Suggested Actions:
              </T>
              <Col gap="xs">
                {insight.suggested_actions.map((action, index) => (
                  <Row key={index} style={{ alignItems: 'flex-start' }}>
                    <T variant="body" color="primary" style={{ marginRight: Spacing.xs }}>
                      •
                    </T>
                    <T variant="body" color="textSecondary" style={{ flex: 1 }}>
                      {action}
                    </T>
                  </Row>
                ))}
              </Col>
            </View>
          )}

          {/* Data Source (expandable) */}
          {insight.data_source && (
            <View style={{ marginTop: Spacing.sm }}>
              <Button
                variant="text"
                onPress={() => setExpandedInsightId(isExpanded ? null : insight.id)}
              >
                {isExpanded ? '▼ Hide Details' : '▶ Show Supporting Data'}
              </Button>
              {isExpanded && (
                <View
                  style={{
                    marginTop: Spacing.xs,
                    padding: Spacing.sm,
                    backgroundColor: Colors.surface,
                    borderRadius: 8,
                  }}
                >
                  <T variant="caption" color="textSecondary" style={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(insight.data_source, null, 2)}
                  </T>
                </View>
              )}
            </View>
          )}

          {/* Timestamp */}
          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.sm }}>
            Generated {new Date(insight.created_at).toLocaleDateString()}
          </T>
        </CardContent>
      </Card>
    );
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load insights data' : null}
      empty={!isLoading && insights.length === 0}
      emptyBody="No insights available for this student yet"
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header Section */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
              💡 AI Insights & Recommendations
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Personalized insights for {childName || 'student'}
            </T>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">
                  Total Insights
                </T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.warning }}>
                  {stats.highPriority}
                </T>
                <T variant="caption" color="textSecondary">
                  High Priority
                </T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.info }}>
                  {stats.actionable}
                </T>
                <T variant="caption" color="textSecondary">
                  Actionable
                </T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Category',
              value: categoryFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'academic', label: 'Academic' },
                { value: 'behavioral', label: 'Behavioral' },
                { value: 'social', label: 'Social' },
              ],
              onChange: (value) => {
                setCategoryFilter(value as CategoryType);
                trackAction('filter_category', 'StudentInsights', { category: value });
              },
            },
          ]}
          activeFilters={[
            categoryFilter !== 'all' && { label: categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1), variant: 'info' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setCategoryFilter('all');
            trackAction('clear_filters', 'StudentInsights');
          }}
        />

        {/* Priority Insights */}
        {priorityInsights.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
              🔥 Priority Insights ({priorityInsights.length})
            </T>
            <Col gap="sm">{priorityInsights.map(renderInsightCard)}</Col>
          </View>
        )}

        {/* Strengths */}
        {strengthInsights.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
              🌟 Strengths ({strengthInsights.length})
            </T>
            <Col gap="sm">{strengthInsights.map(renderInsightCard)}</Col>
          </View>
        )}

        {/* Concerns */}
        {concernInsights.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
              ⚠️ Areas of Concern ({concernInsights.length})
            </T>
            <Col gap="sm">{concernInsights.map(renderInsightCard)}</Col>
          </View>
        )}

        {/* Recommendations */}
        {recommendationInsights.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
              💡 Recommendations ({recommendationInsights.length})
            </T>
            <Col gap="sm">{recommendationInsights.map(renderInsightCard)}</Col>
          </View>
        )}

        {/* Trends */}
        {trendInsights.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
              📈 Trends ({trendInsights.length})
            </T>
            <Col gap="sm">{trendInsights.map(renderInsightCard)}</Col>
          </View>
        )}

        {/* Empty State for Filter */}
        {filteredInsights.length === 0 && insights.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary">
                  No {categoryFilter === 'all' ? '' : categoryFilter} insights found
                </T>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});

export default StudentInsightsScreen;
