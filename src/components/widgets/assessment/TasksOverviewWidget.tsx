/**
 * Tasks Overview Widget
 * Displays combined assignments and tests with counts and overdue indicators
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTasksOverviewQuery, TaskItem } from '../../../hooks/queries/useTasksOverviewQuery';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WidgetProps } from '../../../types/widget.types';

type TasksOverviewConfig = {
  maxItems?: number;
  showCounts?: boolean;
  showOverdue?: boolean;
  showDueDate?: boolean;
  showType?: boolean;
  showScore?: boolean;
  layoutStyle?: 'list' | 'cards' | 'compact';
  enableTap?: boolean;
};

export const TasksOverviewWidget: React.FC<WidgetProps> = ({
  config = {},
  onNavigate,
}) => {
  const { t } = useTranslation('dashboard');
  const { colors, borderRadius } = useAppTheme();

  const {
    maxItems = 5,
    showCounts = true,
    showOverdue = true,
    showDueDate = true,
    showType = true,
    showScore = false,
    layoutStyle = 'list',
    enableTap = true,
  } = config as TasksOverviewConfig;

  const { data, isLoading, error, refetch } = useTasksOverviewQuery(maxItems);

  const handleTaskPress = (task: TaskItem) => {
    if (enableTap && onNavigate) {
      const route = task.type === 'assignment' ? `assignment/${task.id}` : `test/${task.id}`;
      onNavigate(route);
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
        <Icon name="clipboard-alert" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t('widgets.tasksOverview.states.error')}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <AppText style={styles.retryText}>
            {t('widgets.tasksOverview.actions.retry')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.tasks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="clipboard-check" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.tasksOverview.states.empty')}
        </AppText>
      </View>
    );
  }

  const getDueDateLabel = (task: TaskItem) => {
    if (task.days_until === null) return t('widgets.tasksOverview.labels.noDue');
    if (task.is_overdue) return t('widgets.tasksOverview.labels.overdue');
    if (task.days_until === 0) return t('widgets.tasksOverview.labels.today');
    if (task.days_until === 1) return t('widgets.tasksOverview.labels.tomorrow');
    return t('widgets.tasksOverview.labels.inDays', { count: task.days_until });
  };

  const renderTask = (task: TaskItem) => {
    const isCompact = layoutStyle === 'compact';

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          { 
            backgroundColor: colors.surface,
            borderLeftColor: task.is_overdue ? colors.error : task.color,
          },
        ]}
        onPress={() => handleTaskPress(task)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${task.color}15` }]}>
          <Icon name={task.icon} size={isCompact ? 16 : 20} color={task.color} />
        </View>

        {/* Content */}
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <AppText 
              style={[styles.taskTitle, { color: colors.onSurface }]} 
              numberOfLines={isCompact ? 1 : 2}
            >
              {task.title}
            </AppText>
            {showOverdue && task.is_overdue && (
              <View style={[styles.overdueBadge, { backgroundColor: colors.errorContainer }]}>
                <Icon name="alert" size={10} color={colors.error} />
              </View>
            )}
          </View>

          {/* Meta info */}
          <View style={styles.taskMeta}>
            {/* Type badge */}
            {showType && (
              <View style={[styles.typeBadge, { backgroundColor: `${task.color}20` }]}>
                <AppText style={[styles.typeText, { color: task.color }]}>
                  {task.type === 'assignment' 
                    ? t('widgets.tasksOverview.types.assignment')
                    : t('widgets.tasksOverview.types.test')
                  }
                </AppText>
              </View>
            )}

            {/* Due date */}
            {showDueDate && (
              <View style={styles.metaItem}>
                <Icon 
                  name="calendar" 
                  size={12} 
                  color={task.is_overdue ? colors.error : colors.onSurfaceVariant} 
                />
                <AppText 
                  style={[
                    styles.metaText, 
                    { color: task.is_overdue ? colors.error : colors.onSurfaceVariant }
                  ]}
                >
                  {getDueDateLabel(task)}
                </AppText>
              </View>
            )}

            {/* Score */}
            {showScore && task.max_score && (
              <View style={styles.metaItem}>
                <Icon name="star" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {task.max_score} {t('widgets.tasksOverview.labels.points')}
                </AppText>
              </View>
            )}
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
            {t('widgets.tasksOverview.title')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.tasksOverview.subtitle', { count: data.totalCount })}
          </AppText>
        </View>
        {showOverdue && data.overdueCount > 0 && (
          <View style={[styles.overdueCounter, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={14} color={colors.error} />
            <AppText style={[styles.overdueCountText, { color: colors.error }]}>
              {data.overdueCount}
            </AppText>
          </View>
        )}
      </View>

      {/* Stats Banner */}
      {showCounts && (
        <View style={[styles.statsBanner, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Icon name="clipboard-text" size={16} color={colors.primary} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.assignmentCount}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.tasksOverview.labels.assignments')}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.statItem}>
            <Icon name="file-document-edit" size={16} color={colors.warning} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.testCount}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.tasksOverview.labels.tests')}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.statItem}>
            <Icon name="calendar-today" size={16} color={colors.success} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.dueTodayCount}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.tasksOverview.labels.dueToday')}
            </AppText>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <View style={styles.listContainer}>
        {data.tasks.map(renderTask)}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <AppText style={[styles.totalText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.tasksOverview.labels.total', { count: data.totalCount })}
        </AppText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onNavigate?.('tasks')}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t('widgets.tasksOverview.actions.viewAll')}
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
  overdueCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 10,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  listContainer: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  overdueBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMeta: {
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
    fontSize: 10,
    fontWeight: '500',
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
    height: 70,
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
