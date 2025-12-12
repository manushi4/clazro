/**
 * TaskHubScreen - Unified Task Center
 * Purpose: Single hub for all actionable work: assignments, tests, AI study plans, self tasks
 * Design: Complete Framer design system with colors, typography, spacing, shadows, icons, animations
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { supabase } from '../../lib/supabase';

interface Props {
  navigation: any;
}

type TaskType = 'assignment' | 'test' | 'ai_plan' | 'other';
type TaskStatus = 'pending' | 'in_progress' | 'upcoming' | 'completed';
type FilterType = 'all' | 'assignment' | 'test' | 'ai_plan' | 'other';

interface Task {
  id: string;
  student_id: string;
  title: string;
  type: TaskType;
  subject: string | null;
  status: TaskStatus;
  due_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  // Type-specific colors
  assignmentColor: '#2D5BFF',  // Blue
  testColor: '#F59E0B',        // Amber
  aiPlanColor: '#22C55E',      // Green
  otherColor: '#6B7280',       // Gray
  // Status colors
  pendingColor: '#F59E0B',     // Amber
  inProgressColor: '#2D5BFF',  // Blue
  upcomingColor: '#6B7280',    // Gray
  completedColor: '#22C55E',   // Green
  overdueColor: '#EF4444',     // Red
};

// Type icons and labels
const TYPE_ICONS: Record<TaskType, string> = {
  assignment: 'book',
  test: 'science',
  ai_plan: 'auto-awesome',
  other: 'check-circle',
};

const TYPE_LABELS: Record<TaskType, string> = {
  assignment: 'Assignment',
  test: 'Test',
  ai_plan: 'AI Plan',
  other: 'Personal',
};

const TYPE_COLORS: Record<TaskType, string> = {
  assignment: FRAMER_COLORS.assignmentColor,
  test: FRAMER_COLORS.testColor,
  ai_plan: FRAMER_COLORS.aiPlanColor,
  other: FRAMER_COLORS.otherColor,
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: FRAMER_COLORS.pendingColor,
  in_progress: FRAMER_COLORS.inProgressColor,
  upcoming: FRAMER_COLORS.upcomingColor,
  completed: FRAMER_COLORS.completedColor,
};

// Icon Container Component (Framer style)
const IconContainer = ({ iconName, color = FRAMER_COLORS.primary, size = 40 }: { iconName: string; color?: string; size?: number }) => (
  <View style={[styles.iconContainer, { backgroundColor: `${color}26`, width: size, height: size, borderRadius: size / 3.2 }]}>
    <Icon name={iconName} size={size * 0.5} color={color} />
  </View>
);

// Status Pill Component
const StatusPill = ({ status, isOverdue }: { status: TaskStatus; isOverdue: boolean }) => {
  const color = isOverdue ? FRAMER_COLORS.overdueColor : STATUS_COLORS[status];
  const label = isOverdue ? 'Overdue' : STATUS_LABELS[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: `${color}26` }]}>
      <T style={StyleSheet.flatten([styles.statusPillText, { color }])}>{label}</T>
    </View>
  );
};

export default function TaskHubScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    trackScreenView('TaskHubScreen');
  }, []);

  // Fetch tasks
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as Task[];
    },
  });

  // Calculate overview counts
  const overview = useMemo(() => {
    if (!tasks) return { assignmentsDue: 0, upcomingTests: 0, aiPlansActive: 0, overdue: 0, dueToday: 0 };

    const now = new Date();
    const today = now.toDateString();

    const assignmentsDue = tasks.filter(t => t.type === 'assignment' && t.status !== 'completed').length;
    const upcomingTests = tasks.filter(t => t.type === 'test' && t.status === 'upcoming').length;
    const aiPlansActive = tasks.filter(t => t.type === 'ai_plan' && t.status === 'in_progress').length;

    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < now;
    }).length;

    const dueToday = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date).toDateString() === today;
    }).length;

    return { assignmentsDue, upcomingTests, aiPlansActive, overdue, dueToday };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (activeFilter === 'all') return tasks;
    return tasks.filter(t => t.type === activeFilter);
  }, [tasks, activeFilter]);

  // Format due date
  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const now = new Date();
    const today = now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today) return 'Due today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Due tomorrow';
    if (date < now) return 'Overdue';

    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Check if task is overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  // Handle task press
  const handleTaskPress = (task: Task) => {
    trackAction('open_task', 'TaskHubScreen', { taskId: task.id, type: task.type });
    navigation.navigate('TaskDetailScreen', { taskId: task.id });
  };

  return (
    <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.container}>
          {/* Hero / Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
            <T style={styles.heroTitle}>Task hub</T>
            <T style={styles.heroSubtitle}>All your assignments, tests and AI tasks in one place.</T>
          </Animated.View>

          {/* Overview Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.overviewCard}>
            <T style={styles.overviewTitle}>Overview</T>

            <View style={styles.overviewList}>
              <Row style={styles.overviewItem}>
                <Icon name="book" size={18} color={FRAMER_COLORS.textSecondary} />
                <T style={styles.overviewText}>Assignments due: <T style={styles.overviewBold}>{overview.assignmentsDue}</T></T>
              </Row>
              <Row style={styles.overviewItem}>
                <Icon name="science" size={18} color={FRAMER_COLORS.textSecondary} />
                <T style={styles.overviewText}>Upcoming tests: <T style={styles.overviewBold}>{overview.upcomingTests}</T></T>
              </Row>
              <Row style={styles.overviewItem}>
                <Icon name="auto-awesome" size={18} color={FRAMER_COLORS.textSecondary} />
                <T style={styles.overviewText}>AI plans active: <T style={styles.overviewBold}>{overview.aiPlansActive}</T></T>
              </Row>
            </View>

            {/* Mini chips */}
            {(overview.overdue > 0 || overview.dueToday > 0) && (
              <Row style={styles.miniChipsRow}>
                {overview.overdue > 0 && (
                  <View style={[styles.miniChip, { backgroundColor: `${FRAMER_COLORS.overdueColor}26` }]}>
                    <T style={StyleSheet.flatten([styles.miniChipText, { color: FRAMER_COLORS.overdueColor }])}>Overdue {overview.overdue}</T>
                  </View>
                )}
                {overview.dueToday > 0 && (
                  <View style={[styles.miniChip, { backgroundColor: `${FRAMER_COLORS.primary}26` }]}>
                    <T style={StyleSheet.flatten([styles.miniChipText, { color: FRAMER_COLORS.primary }])}>Due today {overview.dueToday}</T>
                  </View>
                )}
              </Row>
            )}
          </Animated.View>

          {/* Filter Row */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'assignment', 'test', 'ai_plan', 'other'] as FilterType[]).map((filter) => {
                const count = filter === 'all' ? filteredTasks.length : tasks?.filter(t => t.type === filter).length || 0;
                const label = filter === 'all' ? 'All' : TYPE_LABELS[filter as TaskType];

                return (
                  <Pressable
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => {
                      setActiveFilter(filter);
                      trackAction('filter_tasks', 'TaskHubScreen', { filter });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${label}`}
                  >
                    <T style={StyleSheet.flatten([styles.filterText, activeFilter === filter && styles.filterTextActive])}>
                      {label} ({count})
                    </T>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Task List */}
          <View style={styles.taskList}>
            {filteredTasks.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.emptyState}>
                <Icon name="check-circle-outline" size={64} color={FRAMER_COLORS.textTertiary} />
                <T style={styles.emptyTitle}>No tasks found</T>
                <T style={styles.emptyText}>
                  {activeFilter === 'all'
                    ? 'You have no tasks at the moment.'
                    : `No ${TYPE_LABELS[activeFilter as TaskType].toLowerCase()} tasks.`}
                </T>
              </Animated.View>
            ) : (
              filteredTasks.map((task, idx) => (
                <Animated.View key={task.id} entering={FadeInUp.delay(300 + idx * 80).springify().stiffness(120).damping(15)}>
                  <Pressable
                    style={styles.taskCard}
                    onPress={() => handleTaskPress(task)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${task.title}`}
                  >
                    <Row style={styles.taskCardRow}>
                      {/* Icon */}
                      <IconContainer iconName={TYPE_ICONS[task.type]} color={TYPE_COLORS[task.type]} size={40} />

                      {/* Content */}
                      <View style={styles.taskCardContent}>
                        {/* Title */}
                        <T style={styles.taskTitle} numberOfLines={1}>{task.title}</T>

                        {/* Type + Subject */}
                        <T style={styles.taskSecondary} numberOfLines={1}>
                          {TYPE_LABELS[task.type]} {task.subject && `• ${task.subject}`}
                        </T>

                        {/* Meta */}
                        <T style={styles.taskMeta} numberOfLines={1}>
                          {task.type === 'ai_plan' && task.metadata?.next_session
                            ? `Next session: ${task.metadata.next_session}`
                            : formatDueDate(task.due_date)}
                        </T>

                        {/* Status Pill */}
                        <StatusPill status={task.status} isOverdue={isOverdue(task)} />
                      </View>
                    </Row>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Hero Section
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 22,
  },
  // Overview Card
  overviewCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  overviewList: {
    gap: 8,
  },
  overviewItem: {
    gap: 10,
    alignItems: 'center',
  },
  overviewText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  overviewBold: {
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  miniChipsRow: {
    marginTop: 12,
    gap: 8,
  },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  miniChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Filter Row
  filterScroll: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: FRAMER_COLORS.chipBg,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  filterTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  // Task List
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardRow: {
    gap: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
  },
  taskSecondary: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  taskMeta: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
  },
});
