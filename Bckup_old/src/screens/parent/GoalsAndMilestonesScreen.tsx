/**
 * GoalsAndMilestonesScreen - PHASE 3C: Goals & Milestones Tracking
 *
 * Displays comprehensive goals and milestones with:
 * - Active goals by category (academic, behavioral, social, extracurricular)
 * - Progress tracking with percentages
 * - Target dates and days remaining
 * - Completed goals history
 * - Category-wise filtering
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView } from '../../utils/navigationAnalytics';
import { ProgressBar } from 'react-native-paper';

type Props = NativeStackScreenProps<ParentStackParamList, 'GoalsAndMilestones'>;

type CategoryFilter = 'all' | 'academic' | 'behavioral' | 'social' | 'extracurricular';

interface Milestone {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  target_date: string | null;
  completed_date: string | null;
  created_by: string | null;
  created_at: string;
}

const GoalsAndMilestonesScreen: React.FC<Props> = ({ route }) => {
  const { childId, childName } = route.params;
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    trackScreenView('GoalsAndMilestones', { from: 'ChildDetail', childId });
  }, [childId]);

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['milestones', childId],
    queryFn: async () => {
      console.log('🎯 [GoalsAndMilestones] Fetching milestones...');
      const { data, error } = await supabase
        .from('student_milestones')
        .select('*')
        .eq('student_id', childId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [GoalsAndMilestones] Error fetching milestones:', error);
        throw error;
      }

      console.log('✅ [GoalsAndMilestones] Loaded', data?.length || 0, 'milestones');
      return data as Milestone[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    if (categoryFilter === 'all') return milestones;
    return milestones.filter(m => m.category === categoryFilter);
  }, [milestones, categoryFilter]);

  // Separate active and completed
  const activeMilestones = useMemo(
    () => filteredMilestones.filter(m => m.status !== 'completed'),
    [filteredMilestones]
  );

  const completedMilestones = useMemo(
    () => filteredMilestones.filter(m => m.status === 'completed'),
    [filteredMilestones]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'completed').length;
    const inProgress = milestones.filter(m => m.status === 'in-progress').length;
    const pending = milestones.filter(m => m.status === 'pending').length;

    return { total, completed, inProgress, pending };
  }, [milestones]);

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return Colors.primary;
      case 'behavioral': return Colors.success;
      case 'social': return Colors.accent;
      case 'extracurricular': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return '📚';
      case 'behavioral': return '⭐';
      case 'social': return '👥';
      case 'extracurricular': return '🎨';
      default: return '🎯';
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'info';
    }
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load goals data' : null}
      empty={!isLoading && milestones.length === 0}
      emptyBody="No goals or milestones set for this student yet"
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header Section */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
              🎯 Goals & Milestones
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Track goals and achievements for {childName || 'student'}
            </T>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total Goals</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.success }}>
                  {stats.completed}
                </T>
                <T variant="caption" color="textSecondary">Completed</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.info }}>
                  {stats.inProgress}
                </T>
                <T variant="caption" color="textSecondary">In Progress</T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Category Filters */}
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
                setCategoryFilter(value as CategoryFilter);
                trackAction('filter_category', 'GoalsAndMilestones', { category: value });
              },
            },
          ]}
          activeFilters={[
            categoryFilter !== 'all' && { label: categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1), variant: 'info' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setCategoryFilter('all');
            trackAction('clear_filters', 'GoalsAndMilestones');
          }}
        />

        {/* Active Goals */}
        {activeMilestones.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
              Active Goals ({activeMilestones.length})
            </T>
            <Col gap="sm">
              {activeMilestones.map(milestone => {
                const daysRemaining = getDaysRemaining(milestone.target_date);
                const categoryColor = getCategoryColor(milestone.category);
                const categoryIcon = getCategoryIcon(milestone.category);

                return (
                  <Card key={milestone.id} variant="elevated">
                    <CardContent>
                      <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                        <Row centerV style={{ flex: 1 }}>
                          <T variant="title" style={{ fontSize: 24, marginRight: Spacing.xs }}>
                            {categoryIcon}
                          </T>
                          <T variant="body" weight="semiBold" style={{ flex: 1 }}>
                            {milestone.title}
                          </T>
                        </Row>
                        <Badge
                          variant={getStatusVariant(milestone.status)}
                          label={milestone.status.replace('-', ' ')}
                        />
                      </Row>

                      {milestone.description && (
                        <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
                          {milestone.description}
                        </T>
                      )}

                      {/* Progress Bar */}
                      <View style={{ marginVertical: Spacing.sm }}>
                        <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                          <T variant="caption" color="textSecondary">Progress</T>
                          <T variant="body" weight="semiBold" style={{ color: categoryColor }}>
                            {milestone.progress}%
                          </T>
                        </Row>
                        <ProgressBar
                          progress={milestone.progress / 100}
                          color={categoryColor}
                          style={{ height: 8, borderRadius: 4 }}
                        />
                      </View>

                      {/* Footer Info */}
                      <Row spaceBetween centerV>
                        <Badge
                          variant="default"
                          label={milestone.category}
                          style={{ backgroundColor: categoryColor + '20' }}
                        />
                        {daysRemaining !== null && (
                          <T variant="caption" color={daysRemaining < 7 ? 'error' : 'textSecondary'}>
                            {daysRemaining > 0
                              ? `${daysRemaining} days remaining`
                              : daysRemaining === 0
                              ? 'Due today'
                              : `${Math.abs(daysRemaining)} days overdue`
                            }
                          </T>
                        )}
                      </Row>
                    </CardContent>
                  </Card>
                );
              })}
            </Col>
          </View>
        )}

        {/* Completed Goals */}
        {completedMilestones.length > 0 && (
          <View>
            <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
              ✅ Completed Goals ({completedMilestones.length})
            </T>
            <Col gap="sm">
              {completedMilestones.map(milestone => {
                const categoryColor = getCategoryColor(milestone.category);
                const categoryIcon = getCategoryIcon(milestone.category);

                return (
                  <Card key={milestone.id} variant="outlined">
                    <CardContent>
                      <Row spaceBetween centerV>
                        <Row centerV style={{ flex: 1 }}>
                          <T variant="title" style={{ fontSize: 20, marginRight: Spacing.xs }}>
                            {categoryIcon}
                          </T>
                          <Col flex={1}>
                            <T variant="body" weight="semiBold" style={{ color: Colors.success }}>
                              {milestone.title}
                            </T>
                            {milestone.completed_date && (
                              <T variant="caption" color="textSecondary">
                                Completed on {new Date(milestone.completed_date).toLocaleDateString()}
                              </T>
                            )}
                          </Col>
                        </Row>
                        <T variant="title" style={{ fontSize: 24 }}>✓</T>
                      </Row>
                    </CardContent>
                  </Card>
                );
              })}
            </Col>
          </View>
        )}

        {/* Empty State for Filter */}
        {filteredMilestones.length === 0 && milestones.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary">
                  No {categoryFilter === 'all' ? '' : categoryFilter} goals found
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

export default GoalsAndMilestonesScreen;
