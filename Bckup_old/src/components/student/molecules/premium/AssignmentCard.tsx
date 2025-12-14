/**
 * AssignmentCard Component - Premium Minimal Design
 * Purpose: Display assignment cards with due dates and grades
 * Used in: NewStudentDashboard, NewAssignmentDetailScreen
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Card, Badge, T } from '../../../../ui';

interface AssignmentCardProps {
  title: string;
  subject: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  maxGrade?: number;
  onPress: () => void;
  accessibilityLabel: string;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  title,
  subject,
  dueDate,
  status,
  grade,
  maxGrade = 100,
  onPress,
  accessibilityLabel,
}) => {
  const getPriorityConfig = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const assignmentDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (assignmentDate.getTime() === today.getTime()) {
      return { icon: '🔴', text: 'Due Today', color: '#EF4444' as const };
    } else if (assignmentDate.getTime() === tomorrow.getTime()) {
      return { icon: '🟡', text: 'Due Tomorrow', color: '#F59E0B' as const };
    } else {
      return { icon: '⚪', text: 'Later', color: '#9CA3AF' as const };
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', variant: 'warning' as const };
      case 'submitted':
        return { text: 'Submitted', variant: 'info' as const };
      case 'graded':
        return { text: 'Graded', variant: 'success' as const };
    }
  };

  const priorityConfig = getPriorityConfig();
  const statusBadge = getStatusBadge();

  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view assignment details"
      style={styles.container}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Priority Indicator */}
          <View style={styles.header}>
            <View style={styles.priorityContainer}>
              <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
              <T variant="caption" weight="semiBold" style={{ color: priorityConfig.color }}>
                {priorityConfig.text}
              </T>
            </View>
            <Badge variant={statusBadge.variant} label={statusBadge.text} />
          </View>

          {/* Assignment Info */}
          <T variant="body" weight="semiBold" style={styles.title} numberOfLines={2}>
            {title}
          </T>
          <T variant="caption" style={styles.subject} numberOfLines={1}>
            {subject}
          </T>

          {/* Due Date or Grade */}
          <View style={styles.footer}>
            {status === 'graded' && grade !== undefined ? (
              <View style={styles.gradeContainer}>
                <T variant="body" weight="bold" style={styles.grade}>
                  {grade}/{maxGrade}
                </T>
                <T variant="caption" style={styles.gradeLabel}>
                  Grade
                </T>
              </View>
            ) : (
              <T variant="caption" style={styles.dueDate}>
                Due: {formattedDueDate}
              </T>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    minWidth: 160,
    width: 160,
  },
  card: {
    padding: 0,
    height: '100%',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginTop: 4,
  },
  subject: {
    color: '#6B7280',
  },
  footer: {
    marginTop: 4,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  grade: {
    color: '#10B981',
    fontSize: 18,
  },
  gradeLabel: {
    color: '#6B7280',
  },
  dueDate: {
    color: '#9CA3AF',
  },
});
