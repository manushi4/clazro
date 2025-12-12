/**
 * TaskDetailScreen - Task Details View
 * Purpose: Display complete details for a specific task with actions
 * Design: Complete Framer design system with type-specific layouts
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { supabase } from '../../lib/supabase';

type TaskType = 'assignment' | 'test' | 'ai_plan' | 'other';
type TaskStatus = 'pending' | 'in_progress' | 'upcoming' | 'completed';

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

interface Props {
  route: {
    params: {
      taskId: string;
    };
  };
  navigation: any;
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  // Type-specific colors
  assignmentColor: '#2D5BFF',
  testColor: '#F59E0B',
  aiPlanColor: '#22C55E',
  otherColor: '#6B7280',
  // Status colors
  pendingColor: '#F59E0B',
  inProgressColor: '#2D5BFF',
  upcomingColor: '#6B7280',
  completedColor: '#22C55E',
  overdueColor: '#EF4444',
};

const TYPE_ICONS: Record<TaskType, string> = {
  assignment: 'book',
  test: 'science',
  ai_plan: 'auto-awesome',
  other: 'check-circle',
};

const TYPE_LABELS: Record<TaskType, string> = {
  assignment: 'Assignment',
  test: 'Test',
  ai_plan: 'AI Study Plan',
  other: 'Personal Task',
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

// Icon Container Component
const IconContainer = ({ iconName, color, size = 48 }: { iconName: string; color: string; size?: number }) => (
  <View style={[styles.iconContainer, { backgroundColor: `${color}26`, width: size, height: size, borderRadius: size / 3.2 }]}>
    <Icon name={iconName} size={size * 0.5} color={color} />
  </View>
);

// Info Chip Component
const InfoChip = ({ icon, label }: { icon: string; label: string }) => (
  <Row style={styles.infoChip}>
    <Icon name={icon} size={16} color={FRAMER_COLORS.textSecondary} />
    <T style={styles.infoChipText}>{label}</T>
  </Row>
);

// Action Button Component
const ActionButton = ({ icon, label, onPress, variant = 'default', delay = 0 }: {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  delay?: number;
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: FRAMER_COLORS.primary };
      case 'danger':
        return { backgroundColor: FRAMER_COLORS.overdueColor };
      default:
        return { backgroundColor: FRAMER_COLORS.cardBg, borderWidth: 1, borderColor: '#E5E7EB' };
    }
  };

  const getTextColor = () => {
    return variant === 'default' ? FRAMER_COLORS.textPrimary : '#FFFFFF';
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().stiffness(120).damping(15)} style={{ flex: 1 }}>
      <Pressable
        style={[styles.actionButton, getButtonStyle()]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Icon name={icon} size={20} color={getTextColor()} />
        <T style={[styles.actionButtonText, { color: getTextColor() }]}>{label}</T>
      </Pressable>
    </Animated.View>
  );
};

export default function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;

  useEffect(() => {
    trackScreenView('TaskDetailScreen');
  }, []);

  // Fetch task details
  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data as Task;
    },
  });

  // Check if overdue
  const isOverdue = (task: Task | undefined): boolean => {
    if (!task?.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle actions
  const handleMarkComplete = () => {
    trackAction('mark_complete', 'TaskDetailScreen', { taskId });
    // TODO: Update task status to completed
  };

  const handleMarkInProgress = () => {
    trackAction('mark_in_progress', 'TaskDetailScreen', { taskId });
    // TODO: Update task status to in_progress
  };

  const handleDelete = () => {
    trackAction('delete_task', 'TaskDetailScreen', { taskId });
    // TODO: Delete task and navigate back
  };

  const handleEdit = () => {
    trackAction('edit_task', 'TaskDetailScreen', { taskId });
    // TODO: Navigate to edit screen
  };

  if (!task) {
    return (
      <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
        <View />
      </BaseScreen>
    );
  }

  const taskColor = TYPE_COLORS[task.type];
  const statusColor = isOverdue(task) ? FRAMER_COLORS.overdueColor : STATUS_COLORS[task.status];

  return (
    <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.container}>
          {/* Header with Icon */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                trackAction('back', 'TaskDetailScreen');
                navigation.goBack();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
            </Pressable>

            <View style={styles.headerIconContainer}>
              <IconContainer iconName={TYPE_ICONS[task.type]} color={taskColor} size={64} />
            </View>
          </Animated.View>

          {/* Title Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.titleCard}>
            <T style={styles.taskTitle}>{task.title}</T>
            <T style={styles.taskType}>{TYPE_LABELS[task.type]}{task.subject && ` • ${task.subject}`}</T>

            {/* Status Pill */}
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}26` }]}>
              <T style={StyleSheet.flatten([styles.statusPillText, { color: statusColor }])}>
                {isOverdue(task) ? 'Overdue' : STATUS_LABELS[task.status]}
              </T>
            </View>
          </Animated.View>

          {/* Details Card */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.detailsCard}>
            <T style={styles.sectionTitle}>Details</T>

            <View style={styles.detailsGrid}>
              <InfoChip icon="event" label={formatDate(task.due_date)} />
              <InfoChip icon="label" label={STATUS_LABELS[task.status]} />
              <InfoChip icon="category" label={TYPE_LABELS[task.type]} />
              {task.subject && <InfoChip icon="book" label={task.subject} />}
            </View>

            {/* AI Plan specific details */}
            {task.type === 'ai_plan' && task.metadata?.next_session && (
              <View style={styles.aiPlanSection}>
                <View style={styles.divider} />
                <T style={styles.aiPlanLabel}>Next Session</T>
                <T style={styles.aiPlanValue}>{task.metadata.next_session}</T>
                {task.metadata.sessions_completed && task.metadata.total_sessions && (
                  <T style={styles.aiPlanProgress}>
                    Progress: {task.metadata.sessions_completed}/{task.metadata.total_sessions} sessions completed
                  </T>
                )}
              </View>
            )}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.actionsCard}>
            <T style={styles.sectionTitle}>Quick Actions</T>

            <Row style={styles.actionsRow}>
              {task.status !== 'completed' && (
                <ActionButton
                  icon="check-circle"
                  label="Mark Complete"
                  onPress={handleMarkComplete}
                  variant="primary"
                  delay={350}
                />
              )}
              {task.status === 'pending' && (
                <ActionButton
                  icon="play-circle-filled"
                  label="Start Task"
                  onPress={handleMarkInProgress}
                  variant="default"
                  delay={400}
                />
              )}
            </Row>

            <Row style={styles.actionsRow}>
              <ActionButton
                icon="edit"
                label="Edit"
                onPress={handleEdit}
                variant="default"
                delay={450}
              />
              <ActionButton
                icon="delete"
                label="Delete"
                onPress={handleDelete}
                variant="danger"
                delay={500}
              />
            </Row>
          </Animated.View>

          {/* Metadata Footer */}
          <Animated.View entering={FadeInUp.delay(550).springify().stiffness(120).damping(15)} style={styles.metadataSection}>
            <T style={styles.metadataText}>
              Created: {new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </T>
            <T style={styles.metadataText}>
              Updated: {new Date(task.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </T>
          </Animated.View>
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
  // Header
  headerSection: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Title Card
  titleCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 32,
  },
  taskType: {
    fontSize: 16,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Details Card
  detailsCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  infoChip: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoChipText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  aiPlanSection: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  aiPlanLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FRAMER_COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiPlanValue: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  aiPlanProgress: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  // Actions Card
  actionsCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionsRow: {
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Metadata
  metadataSection: {
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
  },
});
