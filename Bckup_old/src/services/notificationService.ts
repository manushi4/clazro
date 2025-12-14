/**
 * Phase 84: Notification Service with Distinct Content Types
 * Handles separate API endpoints and data flow for different notification types
 * Prevents content duplication by providing type-specific data fetching and processing
 */

import {
  StudentNotification,
  GradedNotification,
  FeedbackNotification,
  AssignmentNotification,
  NotificationType,
  NotificationFilter,
  NotificationAnalytics,
  NotificationGroup,
} from '../types/notificationTypes';

// Mock API base URL (replace with actual API endpoint)
const API_BASE_URL = 'https://api.manushi-coaching.com/v1';

class NotificationService {
  private cache: Map<string, StudentNotification[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch graded assignment notifications
   * Endpoint: /notifications/graded-assignments
   */
  async fetchGradedAssignments(studentId: string, limit = 20): Promise<GradedNotification[]> {
    const cacheKey = `graded_${studentId}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as GradedNotification[];
    }

    try {
      // Mock API call - replace with actual HTTP request
      const mockData = await this.mockGradedAssignmentsAPI(studentId, limit);
      
      // Process and transform data to ensure type safety
      const notifications: GradedNotification[] = mockData.map(item => ({
        id: item.id,
        type: 'graded_assignment',
        title: `Assignment Graded: ${item.assignmentTitle}`,
        timestamp: new Date(item.gradedDate),
        isRead: item.isRead || false,
        priority: this.calculateGradedPriority(item.percentage),
        studentId,
        assignmentId: item.assignmentId,
        grade: item.grade,
        maxGrade: item.maxGrade,
        percentage: item.percentage,
        subject: item.subject,
        assignmentTitle: item.assignmentTitle,
        teacherName: item.teacherName,
        teacherId: item.teacherId,
        teacherFeedback: item.teacherFeedback,
        gradedDate: new Date(item.gradedDate),
        submissionDate: new Date(item.submissionDate),
        classAverage: item.classAverage,
        performanceLevel: this.calculatePerformanceLevel(item.percentage, item.classAverage),
        improvementAreas: item.improvementAreas || [],
        strengths: item.strengths || [],
        nextSteps: item.nextSteps || [],
      }));

      this.updateCache(cacheKey, notifications);
      return notifications;
    } catch (error) {
      console.error('Error fetching graded assignments:', error);
      return [];
    }
  }

  /**
   * Fetch teacher feedback notifications
   * Endpoint: /notifications/teacher-feedback
   */
  async fetchTeacherFeedback(studentId: string, limit = 20): Promise<FeedbackNotification[]> {
    const cacheKey = `feedback_${studentId}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as FeedbackNotification[];
    }

    try {
      // Mock API call - replace with actual HTTP request
      const mockData = await this.mockTeacherFeedbackAPI(studentId, limit);
      
      // Process and transform data to ensure type safety
      const notifications: FeedbackNotification[] = mockData.map(item => ({
        id: item.id,
        type: 'teacher_feedback',
        title: `Feedback from ${item.teacherName}`,
        timestamp: new Date(item.timestamp),
        isRead: item.isRead || false,
        priority: item.actionRequired ? 'high' : 'medium',
        studentId,
        feedbackId: item.feedbackId,
        teacherName: item.teacherName,
        teacherId: item.teacherId,
        subject: item.subject,
        contextType: item.contextType,
        contextId: item.contextId,
        feedbackText: item.feedbackText,
        feedbackType: item.feedbackType,
        actionRequired: item.actionRequired || false,
        actionItems: item.actionItems || [],
        followUpRequired: item.followUpRequired || false,
        followUpDate: item.followUpDate ? new Date(item.followUpDate) : undefined,
        attachments: item.attachments || [],
        tags: item.tags || [],
      }));

      this.updateCache(cacheKey, notifications);
      return notifications;
    } catch (error) {
      console.error('Error fetching teacher feedback:', error);
      return [];
    }
  }

  /**
   * Fetch new assignment notifications
   * Endpoint: /notifications/new-assignments
   */
  async fetchNewAssignments(studentId: string, limit = 20): Promise<AssignmentNotification[]> {
    const cacheKey = `assignments_${studentId}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as AssignmentNotification[];
    }

    try {
      // Mock API call - replace with actual HTTP request
      const mockData = await this.mockNewAssignmentsAPI(studentId, limit);
      
      // Process and transform data to ensure type safety
      const notifications: AssignmentNotification[] = mockData.map(item => ({
        id: item.id,
        type: 'new_assignment',
        title: `New Assignment: ${item.assignmentTitle}`,
        timestamp: new Date(item.timestamp),
        isRead: item.isRead || false,
        priority: this.calculateAssignmentPriority(new Date(item.dueDate)),
        studentId,
        assignmentId: item.assignmentId,
        assignmentTitle: item.assignmentTitle,
        description: item.description,
        subject: item.subject,
        teacherName: item.teacherName,
        teacherId: item.teacherId,
        dueDate: new Date(item.dueDate),
        estimatedDuration: item.estimatedDuration,
        difficultyLevel: item.difficultyLevel,
        assignmentType: item.assignmentType,
        totalMarks: item.totalMarks,
        instructions: item.instructions || [],
        requiredMaterials: item.requiredMaterials || [],
        submissionFormat: item.submissionFormat,
        allowLateSubmission: item.allowLateSubmission || false,
        latePenalty: item.latePenalty,
        resources: item.resources || [],
        rubric: item.rubric || [],
        isGroupAssignment: item.isGroupAssignment || false,
        maxGroupSize: item.maxGroupSize,
      }));

      this.updateCache(cacheKey, notifications);
      return notifications;
    } catch (error) {
      console.error('Error fetching new assignments:', error);
      return [];
    }
  }

  /**
   * Fetch all notifications for a student with proper type differentiation
   */
  async fetchAllNotifications(studentId: string, filter?: NotificationFilter): Promise<StudentNotification[]> {
    try {
      // Fetch each type separately to ensure distinct content
      const [gradedAssignments, teacherFeedback, newAssignments] = await Promise.all([
        this.fetchGradedAssignments(studentId),
        this.fetchTeacherFeedback(studentId),
        this.fetchNewAssignments(studentId),
      ]);

      // Combine all notifications
      let allNotifications: StudentNotification[] = [
        ...gradedAssignments,
        ...teacherFeedback,
        ...newAssignments,
      ];

      // Apply filters if provided
      if (filter) {
        allNotifications = this.applyFilters(allNotifications, filter);
      }

      // Sort by timestamp (most recent first)
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return allNotifications;
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      return [];
    }
  }

  /**
   * Group notifications by type for better organization
   */
  async fetchNotificationGroups(studentId: string): Promise<NotificationGroup[]> {
    const allNotifications = await this.fetchAllNotifications(studentId);
    
    const groups: Record<NotificationType, NotificationGroup> = {
      graded_assignment: {
        type: 'graded_assignment',
        count: 0,
        notifications: [],
        hasUnread: false,
        hasUrgent: false,
      },
      teacher_feedback: {
        type: 'teacher_feedback',
        count: 0,
        notifications: [],
        hasUnread: false,
        hasUrgent: false,
      },
      new_assignment: {
        type: 'new_assignment',
        count: 0,
        notifications: [],
        hasUnread: false,
        hasUrgent: false,
      },
      announcement: {
        type: 'announcement',
        count: 0,
        notifications: [],
        hasUnread: false,
        hasUrgent: false,
      },
      reminder: {
        type: 'reminder',
        count: 0,
        notifications: [],
        hasUnread: false,
        hasUrgent: false,
      },
    };

    allNotifications.forEach(notification => {
      const group = groups[notification.type];
      if (group) {
        group.count++;
        group.notifications.push(notification);
        if (!notification.isRead) group.hasUnread = true;
        if (notification.priority === 'urgent' || notification.priority === 'high') {
          group.hasUrgent = true;
        }
      }
    });

    return Object.values(groups).filter(group => group.count > 0);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      // Mock API call - replace with actual HTTP request
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        // Update cache
        this.updateNotificationInCache(notificationId, { isRead: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(studentId: string): Promise<NotificationAnalytics> {
    const allNotifications = await this.fetchAllNotifications(studentId);
    
    const analytics: NotificationAnalytics = {
      totalNotifications: allNotifications.length,
      unreadCount: allNotifications.filter(n => !n.isRead).length,
      typeBreakdown: {
        graded_assignment: 0,
        teacher_feedback: 0,
        new_assignment: 0,
        announcement: 0,
        reminder: 0,
      },
      priorityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
      averageResponseTime: 0,
      actionCompletionRate: 0,
    };

    allNotifications.forEach(notification => {
      analytics.typeBreakdown[notification.type]++;
      analytics.priorityBreakdown[notification.priority]++;
    });

    return analytics;
  }

  // Private helper methods
  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry !== undefined && expiry > Date.now() && this.cache.has(key);
  }

  private updateCache(key: string, data: StudentNotification[]): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private updateNotificationInCache(notificationId: string, updates: Partial<StudentNotification>): void {
    this.cache.forEach((notifications, key) => {
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId ? { ...notification, ...updates } : notification
      );
      this.cache.set(key, updatedNotifications);
    });
  }

  private applyFilters(notifications: StudentNotification[], filter: NotificationFilter): StudentNotification[] {
    return notifications.filter(notification => {
      // Type filter
      if (filter.types && !filter.types.includes(notification.type)) {
        return false;
      }

      // Read status filter
      if (filter.isRead !== undefined && notification.isRead !== filter.isRead) {
        return false;
      }

      // Priority filter
      if (filter.priority && !filter.priority.includes(notification.priority)) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const timestamp = notification.timestamp.getTime();
        const start = filter.dateRange.start.getTime();
        const end = filter.dateRange.end.getTime();
        if (timestamp < start || timestamp > end) {
          return false;
        }
      }

      return true;
    });
  }

  private calculateGradedPriority(percentage: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (percentage < 40) return 'urgent';
    if (percentage < 60) return 'high';
    if (percentage < 80) return 'medium';
    return 'low';
  }

  private calculateAssignmentPriority(dueDate: Date): 'low' | 'medium' | 'high' | 'urgent' {
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();
    const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24);

    if (daysUntilDue < 1) return 'urgent';
    if (daysUntilDue < 3) return 'high';
    if (daysUntilDue < 7) return 'medium';
    return 'low';
  }

  private calculatePerformanceLevel(percentage: number, classAverage?: number): 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'satisfactory';
    return 'needs_improvement';
  }

  // Mock API methods (replace with actual API calls)
  private async mockGradedAssignmentsAPI(studentId: string, limit: number): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 'graded_1',
        assignmentId: 'assignment_123',
        grade: 85,
        maxGrade: 100,
        percentage: 85,
        subject: 'Mathematics',
        assignmentTitle: 'Algebra Practice Test',
        teacherName: 'Dr. Sharma',
        teacherId: 'teacher_001',
        teacherFeedback: 'Excellent work on quadratic equations. Need to improve on factorization.',
        gradedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        classAverage: 78,
        improvementAreas: ['Factorization techniques', 'Complex number operations'],
        strengths: ['Quadratic equations', 'Linear algebra'],
        nextSteps: ['Practice more factorization problems', 'Review complex numbers chapter'],
        isRead: false,
      },
      {
        id: 'graded_2',
        assignmentId: 'assignment_124',
        grade: 92,
        maxGrade: 100,
        percentage: 92,
        subject: 'Physics',
        assignmentTitle: 'Motion and Forces Quiz',
        teacherName: 'Prof. Patel',
        teacherId: 'teacher_002',
        teacherFeedback: 'Outstanding understanding of Newton\'s laws. Keep up the excellent work!',
        gradedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        classAverage: 81,
        strengths: ['Newton\'s laws', 'Force calculations', 'Free body diagrams'],
        isRead: false,
      },
    ];
  }

  private async mockTeacherFeedbackAPI(studentId: string, limit: number): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 'feedback_1',
        feedbackId: 'fb_001',
        teacherName: 'Dr. Sharma',
        teacherId: 'teacher_001',
        subject: 'Mathematics',
        contextType: 'assignment',
        contextId: 'assignment_123',
        feedbackText: 'Your problem-solving approach shows good logical thinking. However, I noticed you tend to rush through calculations. Please double-check your arithmetic operations.',
        feedbackType: 'constructive',
        actionRequired: true,
        actionItems: [
          'Review calculation methods for quadratic formulas',
          'Practice more problems with step-by-step solutions',
          'Schedule a doubt session for advanced topics'
        ],
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        tags: ['mathematics', 'problem-solving', 'calculations'],
        isRead: false,
      },
      {
        id: 'feedback_2',
        feedbackId: 'fb_002',
        teacherName: 'Prof. Patel',
        teacherId: 'teacher_002',
        subject: 'Physics',
        contextType: 'participation',
        feedbackText: 'Great participation in today\'s class discussion on electromagnetic waves. Your questions showed deep thinking about the concepts.',
        feedbackType: 'positive',
        actionRequired: false,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        tags: ['physics', 'participation', 'electromagnetic-waves'],
        isRead: false,
      },
    ];
  }

  private async mockNewAssignmentsAPI(studentId: string, limit: number): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        id: 'assignment_new_1',
        assignmentId: 'assignment_125',
        assignmentTitle: 'Chemical Bonding and Molecular Structure',
        description: 'Complete exercises 1-15 from Chapter 4. Focus on ionic, covalent, and metallic bonding. Include molecular geometry diagrams.',
        subject: 'Chemistry',
        teacherName: 'Dr. Gupta',
        teacherId: 'teacher_003',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        estimatedDuration: 120, // 2 hours
        difficultyLevel: 'medium',
        assignmentType: 'homework',
        totalMarks: 50,
        instructions: [
          'Read Chapter 4 completely before starting',
          'Draw all molecular structures clearly',
          'Show all working for calculation problems',
          'Use proper chemical nomenclature'
        ],
        requiredMaterials: ['Periodic table', 'Graph paper', 'Calculator'],
        submissionFormat: 'pdf',
        allowLateSubmission: true,
        latePenalty: 10, // 10% per day
        resources: [
          {
            id: 'resource_1',
            title: 'Bonding Theory Video Lecture',
            type: 'video',
            url: 'https://example.com/bonding-theory',
            description: 'Comprehensive explanation of chemical bonding theories'
          }
        ],
        isGroupAssignment: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false,
      },
      {
        id: 'assignment_new_2',
        assignmentId: 'assignment_126',
        assignmentTitle: 'Literary Analysis: Shakespeare\'s Hamlet',
        description: 'Write a 1500-word analytical essay on the theme of revenge in Hamlet. Support your arguments with textual evidence.',
        subject: 'English Literature',
        teacherName: 'Ms. Johnson',
        teacherId: 'teacher_004',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        estimatedDuration: 180, // 3 hours
        difficultyLevel: 'hard',
        assignmentType: 'project',
        totalMarks: 100,
        instructions: [
          'Use MLA format for citations',
          'Include at least 5 scholarly sources',
          'Focus on Acts 1, 3, and 5',
          'Submit through plagiarism checker'
        ],
        requiredMaterials: ['Hamlet text', 'Literary criticism sources'],
        submissionFormat: 'doc',
        allowLateSubmission: false,
        resources: [
          {
            id: 'resource_2',
            title: 'Hamlet Critical Essays Collection',
            type: 'document',
            url: 'https://example.com/hamlet-essays',
            description: 'Collection of critical essays on Hamlet themes'
          }
        ],
        rubric: [
          { criteria: 'Thesis and Argument', points: 25, description: 'Clear thesis with strong arguments' },
          { criteria: 'Textual Evidence', points: 25, description: 'Relevant quotes and analysis' },
          { criteria: 'Writing Quality', points: 25, description: 'Grammar, style, and organization' },
          { criteria: 'Research Integration', points: 25, description: 'Use of scholarly sources' }
        ],
        isGroupAssignment: false,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isRead: false,
      },
    ];
  }

  /**
   * Clear all caches (useful for logout or data refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;