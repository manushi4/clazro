/**
 * Phase 84: Student Dashboard Content Deduplication
 * Notification Type Interfaces and Templates
 * Addressing Issue #9: Distinct content for graded assignments, teacher feedback, and new assignments
 */

export type NotificationType = 'graded_assignment' | 'teacher_feedback' | 'new_assignment' | 'announcement' | 'reminder';

export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentId: string;
}

// Graded Assignment Notification - Shows grade results and performance
export interface GradedNotification extends BaseNotification {
  type: 'graded_assignment';
  assignmentId: string;
  grade: number | string;
  maxGrade: number;
  percentage: number;
  subject: string;
  assignmentTitle: string;
  teacherName: string;
  teacherId: string;
  teacherFeedback?: string;
  gradedDate: Date;
  submissionDate: Date;
  classAverage?: number;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  improvementAreas?: string[];
  strengths?: string[];
  nextSteps?: string[];
}

// Teacher Feedback Notification - Shows detailed feedback and suggestions
export interface FeedbackNotification extends BaseNotification {
  type: 'teacher_feedback';
  feedbackId: string;
  teacherName: string;
  teacherId: string;
  subject: string;
  contextType: 'assignment' | 'participation' | 'behavior' | 'progress' | 'general';
  contextId?: string; // Related assignment/activity ID
  feedbackText: string;
  feedbackType: 'positive' | 'constructive' | 'concern' | 'suggestion';
  actionRequired: boolean;
  actionItems?: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments?: {
    id: string;
    name: string;
    type: 'document' | 'image' | 'audio' | 'video';
    url: string;
  }[];
  tags?: string[];
}

// New Assignment Notification - Shows assignment details and requirements
export interface AssignmentNotification extends BaseNotification {
  type: 'new_assignment';
  assignmentId: string;
  assignmentTitle: string;
  description: string;
  subject: string;
  teacherName: string;
  teacherId: string;
  dueDate: Date;
  estimatedDuration: number; // in minutes
  difficultyLevel: 'easy' | 'medium' | 'hard';
  assignmentType: 'homework' | 'project' | 'quiz' | 'exam' | 'presentation' | 'lab';
  totalMarks: number;
  instructions: string[];
  requiredMaterials?: string[];
  submissionFormat: 'pdf' | 'doc' | 'image' | 'video' | 'audio' | 'link' | 'multiple';
  allowLateSubmission: boolean;
  latePenalty?: number; // percentage
  resources?: {
    id: string;
    title: string;
    type: 'link' | 'document' | 'video';
    url: string;
    description?: string;
  }[];
  rubric?: {
    criteria: string;
    points: number;
    description: string;
  }[];
  isGroupAssignment: boolean;
  maxGroupSize?: number;
}

// Union type for all notifications
export type StudentNotification = GradedNotification | FeedbackNotification | AssignmentNotification;

// Notification display templates
export interface NotificationTemplate {
  icon: string;
  iconColor: string;
  backgroundColor: string;
  titleTemplate: string;
  subtitleTemplate: string;
  contentTemplate: string;
  actionButtonText?: string;
  urgencyIndicator?: boolean;
}

// Template configurations for each notification type
export const NotificationTemplates: Record<NotificationType, NotificationTemplate> = {
  graded_assignment: {
    icon: 'grade',
    iconColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
    titleTemplate: 'Assignment Graded: {assignmentTitle}',
    subtitleTemplate: '{grade}/{maxGrade} ({percentage}%) - {performanceLevel}',
    contentTemplate: 'Grade: {grade}/{maxGrade} in {subject} by {teacherName}',
    actionButtonText: 'View Details',
    urgencyIndicator: false,
  },
  teacher_feedback: {
    icon: 'feedback',
    iconColor: '#2196F3',
    backgroundColor: '#E3F2FD',
    titleTemplate: 'Feedback from {teacherName}',
    subtitleTemplate: '{subject} - {feedbackType} feedback',
    contentTemplate: '{feedbackText}',
    actionButtonText: 'View Feedback',
    urgencyIndicator: true,
  },
  new_assignment: {
    icon: 'assignment',
    iconColor: '#FF9800',
    backgroundColor: '#FFF3E0',
    titleTemplate: 'New Assignment: {assignmentTitle}',
    subtitleTemplate: 'Due: {dueDate} - {subject}',
    contentTemplate: '{description} - Due {dueDate}',
    actionButtonText: 'Start Assignment',
    urgencyIndicator: false,
  },
  announcement: {
    icon: 'announcement',
    iconColor: '#9C27B0',
    backgroundColor: '#F3E5F5',
    titleTemplate: '{title}',
    subtitleTemplate: 'Announcement',
    contentTemplate: '{content}',
    actionButtonText: 'Read More',
    urgencyIndicator: false,
  },
  reminder: {
    icon: 'schedule',
    iconColor: '#FF5722',
    backgroundColor: '#FBE9E7',
    titleTemplate: 'Reminder: {title}',
    subtitleTemplate: '{reminderTime}',
    contentTemplate: '{description}',
    actionButtonText: 'Mark Complete',
    urgencyIndicator: true,
  },
};

// Content rendering helpers
export interface NotificationContentRenderer {
  renderTitle: (notification: StudentNotification) => string;
  renderSubtitle: (notification: StudentNotification) => string;
  renderContent: (notification: StudentNotification) => string;
  renderActionButton: (notification: StudentNotification) => string;
  getTemplate: (type: NotificationType) => NotificationTemplate;
}

// Priority color mapping
export const PriorityColors = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  urgent: '#E91E63',
};

// Status indicators
export interface NotificationStatus {
  isNew: boolean;
  isUrgent: boolean;
  requiresAction: boolean;
  hasDeadline: boolean;
  isOverdue: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: (notificationId: string) => Promise<void>;
}

// Notification grouping and filtering
export interface NotificationGroup {
  type: NotificationType;
  count: number;
  notifications: StudentNotification[];
  hasUnread: boolean;
  hasUrgent: boolean;
}

export interface NotificationFilter {
  types?: NotificationType[];
  isRead?: boolean;
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  subjects?: string[];
  teachers?: string[];
}

// Analytics and tracking
export interface NotificationAnalytics {
  totalNotifications: number;
  unreadCount: number;
  typeBreakdown: Record<NotificationType, number>;
  priorityBreakdown: Record<string, number>;
  averageResponseTime: number; // in minutes
  actionCompletionRate: number; // percentage
}

export default {
  NotificationTemplates,
  PriorityColors,
};
