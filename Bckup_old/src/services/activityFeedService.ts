/**
 * Activity Feed Service
 * Handles student activity tracking and feed aggregation
 *
 * NOTE: Currently using mock data. Will integrate with Supabase once the following
 * database tables are created:
 * - student_activities (comprehensive activity tracking)
 * - notifications (system notifications)
 * - social_activities (study groups, peer interactions)
 *
 * This service aggregates data from multiple sources (assignments, achievements,
 * classes, etc.) to provide a unified activity feed.
 */

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ==================== INTERFACES ====================

export interface Activity {
  id: string;
  type: 'submission' | 'grade' | 'participation' | 'achievement' | 'social' | 'deadline' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'completed' | 'pending' | 'overdue';
  subject?: string;
  score?: number;
  maxScore?: number;
  actionRequired?: boolean;
  relatedItems?: string[];
}

export interface ActivityFilters {
  type?: Activity['type'];
  priority?: Activity['priority'];
  status?: Activity['status'];
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActivityStats {
  todayCount: number;
  pendingActions: number;
  achievementsCount: number;
  submissionsCount: number;
  gradesCount: number;
}

// ==================== MOCK DATA ====================

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'grade',
    title: 'Mathematics Assignment Graded',
    description: 'Your Calculus Problem Set has been graded. Excellent work on integration techniques!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    priority: 'high',
    subject: 'Mathematics',
    score: 94,
    maxScore: 100,
    status: 'completed',
  },
  {
    id: '2',
    type: 'deadline',
    title: 'Physics Lab Report Due Soon',
    description: 'Your Electromagnetic Waves lab report is due in 2 hours. Submit before the deadline.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    priority: 'high',
    subject: 'Physics',
    actionRequired: true,
    status: 'pending',
  },
  {
    id: '3',
    type: 'achievement',
    title: 'New Achievement Unlocked',
    description: 'Congratulations! You earned the "Math Master" badge for consistent high performance.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    priority: 'medium',
    status: 'completed',
  },
  {
    id: '4',
    type: 'participation',
    title: 'Active in Biology Class',
    description: "Great participation in today's discussion on cellular respiration. Keep it up!",
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    priority: 'medium',
    subject: 'Biology',
    status: 'completed',
  },
  {
    id: '5',
    type: 'submission',
    title: 'Chemistry Assignment Submitted',
    description: 'Your Organic Chemistry problem set has been successfully submitted.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    priority: 'low',
    subject: 'Chemistry',
    status: 'completed',
  },
  {
    id: '6',
    type: 'social',
    title: 'Study Group Invitation',
    description: 'Sarah invited you to join the Physics study group for the upcoming exam.',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 1.25 days ago
    priority: 'medium',
    actionRequired: true,
    status: 'pending',
  },
  {
    id: '7',
    type: 'announcement',
    title: 'Class Schedule Update',
    description: "Tomorrow's Mathematics class has been moved from 10:00 AM to 2:00 PM.",
    timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(), // 1.3 days ago
    priority: 'high',
    subject: 'Mathematics',
  },
  {
    id: '8',
    type: 'grade',
    title: 'Quiz Score Available',
    description: 'Your Biology quiz on photosynthesis has been graded.',
    timestamp: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(), // 1.4 days ago
    priority: 'medium',
    subject: 'Biology',
    score: 87,
    maxScore: 100,
    status: 'completed',
  },
  {
    id: '9',
    type: 'submission',
    title: 'Late Submission Warning',
    description: 'Your Physics assignment was submitted 30 minutes after the deadline.',
    timestamp: new Date(Date.now() - 37 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
    priority: 'high',
    subject: 'Physics',
    status: 'overdue',
  },
  {
    id: '10',
    type: 'achievement',
    title: 'Perfect Attendance Streak',
    description: "You've maintained perfect attendance for 30 days! Keep up the excellent commitment.",
    timestamp: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(), // 1.6 days ago
    priority: 'medium',
    status: 'completed',
  },
  {
    id: '11',
    type: 'grade',
    title: 'English Essay Graded',
    description: 'Your essay on "The Impact of Technology" received excellent feedback.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    priority: 'medium',
    subject: 'English',
    score: 92,
    maxScore: 100,
    status: 'completed',
  },
  {
    id: '12',
    type: 'submission',
    title: 'History Assignment Submitted',
    description: 'Your assignment on "Ancient Civilizations" has been submitted successfully.',
    timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 2.08 days ago
    priority: 'low',
    subject: 'History',
    status: 'completed',
  },
];

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get all activities for a student with optional filtering
 */
export const getActivities = async (
  studentId: string,
  filters?: ActivityFilters
): Promise<ServiceResponse<Activity[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredActivities = [...mockActivities];

    // Apply filters
    if (filters) {
      if (filters.type) {
        filteredActivities = filteredActivities.filter(a => a.type === filters.type);
      }
      if (filters.priority) {
        filteredActivities = filteredActivities.filter(a => a.priority === filters.priority);
      }
      if (filters.status) {
        filteredActivities = filteredActivities.filter(a => a.status === filters.status);
      }
      if (filters.subject) {
        filteredActivities = filteredActivities.filter(a => a.subject === filters.subject);
      }
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredActivities = filteredActivities.filter(
          a => new Date(a.timestamp) >= fromDate
        );
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filteredActivities = filteredActivities.filter(
          a => new Date(a.timestamp) <= toDate
        );
      }
    }

    // Sort by timestamp (most recent first)
    filteredActivities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { data: filteredActivities, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get recent activities (last 7 days)
 */
export const getRecentActivities = async (
  studentId: string,
  limit: number = 20
): Promise<ServiceResponse<Activity[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentActivities = mockActivities
      .filter(a => new Date(a.timestamp) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return { data: recentActivities, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get activities that require action
 */
export const getActionRequiredActivities = async (
  studentId: string
): Promise<ServiceResponse<Activity[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const actionRequiredActivities = mockActivities
      .filter(a => a.actionRequired === true)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { data: actionRequiredActivities, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (
  studentId: string
): Promise<ServiceResponse<ActivityStats>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActivities = mockActivities.filter(a => {
      const activityDate = new Date(a.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === today.getTime();
    });

    const pendingActions = mockActivities.filter(a => a.actionRequired === true);
    const achievements = mockActivities.filter(a => a.type === 'achievement');
    const submissions = mockActivities.filter(a => a.type === 'submission');
    const grades = mockActivities.filter(a => a.type === 'grade');

    const stats: ActivityStats = {
      todayCount: todayActivities.length,
      pendingActions: pendingActions.length,
      achievementsCount: achievements.length,
      submissionsCount: submissions.length,
      gradesCount: grades.length,
    };

    return { data: stats, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get activities by type
 */
export const getActivitiesByType = async (
  studentId: string,
  type: Activity['type']
): Promise<ServiceResponse<Activity[]>> => {
  return getActivities(studentId, { type });
};

/**
 * Get activities by subject
 */
export const getActivitiesBySubject = async (
  studentId: string,
  subject: string
): Promise<ServiceResponse<Activity[]>> => {
  return getActivities(studentId, { subject });
};

/**
 * Get a single activity by ID
 */
export const getActivityById = async (
  activityId: string
): Promise<ServiceResponse<Activity>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const activity = mockActivities.find(a => a.id === activityId);

    if (!activity) {
      return { data: null, error: 'Activity not found', success: false };
    }

    return { data: activity, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Mark an activity as read/acknowledged
 */
export const markActivityAsRead = async (
  activityId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const activity = mockActivities.find(a => a.id === activityId);

    if (!activity) {
      return { data: null, error: 'Activity not found', success: false };
    }

    // In a real implementation, this would update the database
    // For now, we just return success
    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Dismiss/remove an activity from the feed
 */
export const dismissActivity = async (
  activityId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const activityIndex = mockActivities.findIndex(a => a.id === activityId);

    if (activityIndex === -1) {
      return { data: null, error: 'Activity not found', success: false };
    }

    // In a real implementation, this would update the database
    // For mock data, we'll just return success without actually removing
    // (to keep the mock data intact for demos)
    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get comprehensive activity feed with stats
 */
export const getActivityFeed = async (
  studentId: string,
  filters?: ActivityFilters
): Promise<ServiceResponse<{
  activities: Activity[];
  stats: ActivityStats;
}>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const [activitiesResult, statsResult] = await Promise.all([
      getActivities(studentId, filters),
      getActivityStats(studentId),
    ]);

    if (!activitiesResult.success || !statsResult.success) {
      return {
        data: null,
        error: 'Failed to load activity feed',
        success: false,
      };
    }

    return {
      data: {
        activities: activitiesResult.data!,
        stats: statsResult.data!,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
