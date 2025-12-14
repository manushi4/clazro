/**
 * Phase 84: Dynamic Content Rendering Engine
 * NotificationRenderer - Renders distinct content for each notification type
 * Solves Issue #9: Content deduplication in student dashboard
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  StudentNotification,
  GradedNotification,
  FeedbackNotification,
  AssignmentNotification,
  NotificationTemplates,
  PriorityColors,
  NotificationType,
} from '../../types/notificationTypes';
import { LightTheme } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface NotificationRendererProps {
  notification: StudentNotification;
  onPress?: (notification: StudentNotification) => void;
  onActionPress?: (notification: StudentNotification, action: string) => void;
}

const NotificationRenderer: React.FC<NotificationRendererProps> = ({
  notification,
  onPress,
  onActionPress,
}) => {
  const template = NotificationTemplates[notification.type];

  const renderGradedAssignment = (notif: GradedNotification) => {
    const getPerformanceColor = (level: string) => {
      switch (level) {
        case 'excellent': return '#4CAF50';
        case 'good': return '#8BC34A';
        case 'satisfactory': return '#FF9800';
        case 'needs_improvement': return '#F44336';
        default: return LightTheme.Outline;
      }
    };

    const getGradeDisplay = () => {
      if (typeof notif.grade === 'number') {
        return `${notif.grade}/${notif.maxGrade}`;
      }
      return `${notif.grade}`;
    };

    return (
      <View style={styles.notificationContent}>
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: template.backgroundColor }]}>
            <Icon name={template.icon} size={24} color={template.iconColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.notificationTitle}>Assignment Graded</Text>
            <Text style={styles.assignmentTitle}>{notif.assignmentTitle}</Text>
            <Text style={styles.subjectText}>{notif.subject}</Text>
          </View>
          <View style={styles.gradeContainer}>
            <Text style={[styles.gradeText, { color: getPerformanceColor(notif.performanceLevel) }]}>
              {getGradeDisplay()}
            </Text>
            <Text style={styles.percentageText}>{notif.percentage.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Performance: </Text>
            <Text style={[styles.performanceValue, { color: getPerformanceColor(notif.performanceLevel) }]}>
              {notif.performanceLevel.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          {notif.classAverage && (
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonText}>
                Class Average: {notif.classAverage}% 
                {notif.percentage > notif.classAverage ? ' (Above Average! 🎉)' : ' (Below Average)'}
              </Text>
            </View>
          )}

          <View style={styles.teacherInfo}>
            <Text style={styles.teacherText}>Graded by {notif.teacherName}</Text>
            <Text style={styles.dateText}>
              {new Date(notif.gradedDate).toLocaleDateString()}
            </Text>
          </View>

          {notif.teacherFeedback && (
            <View style={styles.feedbackPreview}>
              <Text style={styles.feedbackLabel}>Teacher Feedback:</Text>
              <Text style={styles.feedbackText} numberOfLines={2}>
                {notif.teacherFeedback}
              </Text>
            </View>
          )}

          {notif.improvementAreas && notif.improvementAreas.length > 0 && (
            <View style={styles.improvementSection}>
              <Text style={styles.improvementTitle}>Areas for Improvement:</Text>
              {notif.improvementAreas.slice(0, 2).map((area, index) => (
                <Text key={index} style={styles.improvementText}>• {area}</Text>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: template.iconColor }]}
          onPress={() => onActionPress?.(notification, 'view_details')}
        >
          <Text style={styles.actionButtonText}>View Full Report</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTeacherFeedback = (notif: FeedbackNotification) => {
    const getFeedbackIcon = (type: string) => {
      switch (type) {
        case 'positive': return 'thumb-up';
        case 'constructive': return 'lightbulb-outline';
        case 'concern': return 'warning';
        case 'suggestion': return 'tips-and-updates';
        default: return 'feedback';
      }
    };

    const getFeedbackColor = (type: string) => {
      switch (type) {
        case 'positive': return '#4CAF50';
        case 'constructive': return '#2196F3';
        case 'concern': return '#FF5722';
        case 'suggestion': return '#FF9800';
        default: return LightTheme.Primary;
      }
    };

    return (
      <View style={styles.notificationContent}>
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: template.backgroundColor }]}>
            <Icon name={getFeedbackIcon(notif.feedbackType)} size={24} color={getFeedbackColor(notif.feedbackType)} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.notificationTitle}>Teacher Feedback</Text>
            <Text style={styles.teacherName}>{notif.teacherName}</Text>
            <Text style={styles.subjectText}>{notif.subject}</Text>
          </View>
          {notif.actionRequired && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Action Required</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.feedbackTypeRow}>
            <Text style={styles.feedbackTypeLabel}>Type: </Text>
            <Text style={[styles.feedbackTypeValue, { color: getFeedbackColor(notif.feedbackType) }]}>
              {notif.feedbackType.toUpperCase()}
            </Text>
          </View>

          <View style={styles.contextInfo}>
            <Text style={styles.contextText}>
              Context: {notif.contextType.replace('_', ' ')} feedback
            </Text>
          </View>

          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackText}>{notif.feedbackText}</Text>
          </View>

          {notif.actionItems && notif.actionItems.length > 0 && (
            <View style={styles.actionItemsSection}>
              <Text style={styles.actionItemsTitle}>Action Items:</Text>
              {notif.actionItems.map((item, index) => (
                <Text key={index} style={styles.actionItemText}>• {item}</Text>
              ))}
            </View>
          )}

          {notif.followUpRequired && notif.followUpDate && (
            <View style={styles.followUpSection}>
              <Text style={styles.followUpText}>
                Follow-up by: {new Date(notif.followUpDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {notif.attachments && notif.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.attachmentsTitle}>Attachments: {notif.attachments.length} file(s)</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: notif.actionRequired ? '#FF5722' : template.iconColor }
          ]}
          onPress={() => onActionPress?.(notification, notif.actionRequired ? 'take_action' : 'view_feedback')}
        >
          <Text style={styles.actionButtonText}>
            {notif.actionRequired ? 'Take Action' : 'View Full Feedback'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNewAssignment = (notif: AssignmentNotification) => {
    const getDifficultyColor = (level: string) => {
      switch (level) {
        case 'easy': return '#4CAF50';
        case 'medium': return '#FF9800';
        case 'hard': return '#F44336';
        default: return LightTheme.Outline;
      }
    };

    const getTimeRemaining = () => {
      const now = new Date();
      const due = new Date(notif.dueDate);
      const diff = due.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) return `${days} day(s) remaining`;
      if (hours > 0) return `${hours} hour(s) remaining`;
      return 'Due soon!';
    };

    const isOverdue = new Date(notif.dueDate) < new Date();

    return (
      <View style={styles.notificationContent}>
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: template.backgroundColor }]}>
            <Icon name={template.icon} size={24} color={template.iconColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.notificationTitle}>New Assignment</Text>
            <Text style={styles.assignmentTitle}>{notif.assignmentTitle}</Text>
            <Text style={styles.subjectText}>{notif.subject}</Text>
          </View>
          <View style={styles.dueDateContainer}>
            <Text style={[styles.dueDateText, isOverdue && { color: '#F44336' }]}>
              {isOverdue ? 'OVERDUE' : getTimeRemaining()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.assignmentMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Type: </Text>
              <Text style={styles.metaValue}>{notif.assignmentType}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Difficulty: </Text>
              <Text style={[styles.metaValue, { color: getDifficultyColor(notif.difficultyLevel) }]}>
                {notif.difficultyLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.assignmentDetails}>
            <Text style={styles.descriptionText} numberOfLines={3}>
              {notif.description}
            </Text>
          </View>

          <View style={styles.assignmentInfo}>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={16} color={LightTheme.Outline} />
              <Text style={styles.infoText}>
                Est. Duration: {notif.estimatedDuration} minutes
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="grade" size={16} color={LightTheme.Outline} />
              <Text style={styles.infoText}>Total Marks: {notif.totalMarks}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="person" size={16} color={LightTheme.Outline} />
              <Text style={styles.infoText}>By {notif.teacherName}</Text>
            </View>
          </View>

          {notif.isGroupAssignment && (
            <View style={styles.groupInfo}>
              <Text style={styles.groupText}>
                👥 Group Assignment (Max {notif.maxGroupSize} members)
              </Text>
            </View>
          )}

          {notif.requiredMaterials && notif.requiredMaterials.length > 0 && (
            <View style={styles.materialsSection}>
              <Text style={styles.materialsTitle}>Required Materials:</Text>
              <Text style={styles.materialsText}>
                {notif.requiredMaterials.slice(0, 2).join(', ')}
                {notif.requiredMaterials.length > 2 ? '...' : ''}
              </Text>
            </View>
          )}

          <View style={styles.submissionInfo}>
            <Text style={styles.submissionText}>
              Submit as: {notif.submissionFormat.toUpperCase()}
            </Text>
            {!notif.allowLateSubmission && (
              <Text style={styles.strictDeadlineText}>⚠️ No late submissions</Text>
            )}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.secondaryButton]}
            onPress={() => onActionPress?.(notification, 'view_details')}
          >
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: template.iconColor, flex: 1, marginLeft: Spacing.SM }]}
            onPress={() => onActionPress?.(notification, 'start_assignment')}
          >
            <Text style={styles.actionButtonText}>Start Assignment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderNotificationContent = () => {
    switch (notification.type) {
      case 'graded_assignment':
        return renderGradedAssignment(notification as GradedNotification);
      case 'teacher_feedback':
        return renderTeacherFeedback(notification as FeedbackNotification);
      case 'new_assignment':
        return renderNewAssignment(notification as AssignmentNotification);
      default:
        return (
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Unknown notification type</Text>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadCard,
        { borderLeftColor: PriorityColors[notification.priority] }
      ]}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      {renderNotificationContent()}
      {!notification.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: LightTheme.Primary,
  },
  unreadCard: {
    elevation: 4,
    shadowOpacity: 0.15,
  },
  notificationContent: {
    padding: Spacing.MD,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  subjectText: {
    fontSize: 14,
    color: LightTheme.Outline,
  },
  gradeContainer: {
    alignItems: 'center',
    paddingLeft: Spacing.SM,
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  dueDateContainer: {
    alignItems: 'center',
    paddingLeft: Spacing.SM,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: LightTheme.Primary,
    textAlign: 'center',
  },
  urgentBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsSection: {
    marginBottom: Spacing.MD,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  performanceLabel: {
    fontSize: 14,
    color: LightTheme.OnSurface,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonRow: {
    marginBottom: Spacing.SM,
  },
  comparisonText: {
    fontSize: 12,
    color: LightTheme.Outline,
    fontStyle: 'italic',
  },
  teacherInfo: {
    marginBottom: Spacing.SM,
  },
  teacherText: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  dateText: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  feedbackPreview: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: 8,
    marginBottom: Spacing.SM,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  feedbackText: {
    fontSize: 14,
    color: LightTheme.OnSurface,
    lineHeight: 20,
  },
  improvementSection: {
    marginTop: Spacing.SM,
  },
  improvementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: Spacing.XS,
  },
  improvementText: {
    fontSize: 12,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  feedbackTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  feedbackTypeLabel: {
    fontSize: 14,
    color: LightTheme.OnSurface,
  },
  feedbackTypeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  contextInfo: {
    marginBottom: Spacing.SM,
  },
  contextText: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  feedbackContent: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: 8,
    marginBottom: Spacing.SM,
  },
  actionItemsSection: {
    marginBottom: Spacing.SM,
  },
  actionItemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5722',
    marginBottom: Spacing.XS,
  },
  actionItemText: {
    fontSize: 12,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  followUpSection: {
    backgroundColor: '#FFF3E0',
    padding: Spacing.SM,
    borderRadius: 8,
    marginBottom: Spacing.SM,
  },
  followUpText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  attachmentsSection: {
    marginBottom: Spacing.SM,
  },
  attachmentsTitle: {
    fontSize: 12,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  assignmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: LightTheme.OnSurface,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  assignmentDetails: {
    marginBottom: Spacing.SM,
  },
  descriptionText: {
    fontSize: 14,
    color: LightTheme.OnSurface,
    lineHeight: 20,
  },
  assignmentInfo: {
    marginBottom: Spacing.SM,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  infoText: {
    fontSize: 12,
    color: LightTheme.OnSurface,
    marginLeft: Spacing.XS,
  },
  groupInfo: {
    backgroundColor: '#E3F2FD',
    padding: Spacing.SM,
    borderRadius: 8,
    marginBottom: Spacing.SM,
  },
  groupText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  materialsSection: {
    marginBottom: Spacing.SM,
  },
  materialsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  materialsText: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  submissionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionText: {
    fontSize: 12,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  strictDeadlineText: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LightTheme.Primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: LightTheme.Primary,
    fontSize: 14,
    fontWeight: '600',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LightTheme.Primary,
  },
});

export default NotificationRenderer;