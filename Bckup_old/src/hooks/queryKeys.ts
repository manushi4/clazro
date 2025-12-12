/**
 * Query Key Factory
 *
 * Centralized query key management following TanStack Query best practices
 *
 * Benefits:
 * - Type-safe query key generation
 * - Easy cache invalidation (invalidate all parent queries, or specific ones)
 * - Consistent naming convention
 * - Avoids key collisions
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

import type {
  AIInsightCategory,
  AIInsightSeverity,
  RiskFactorType,
  OpportunityType,
  ActionItemStatus,
  CommunicationStatus,
  CommunicationPriority,
} from '../types/supabase-parent.types';

/**
 * Parent Query Keys
 *
 * Hierarchical structure:
 * ['parent'] - Base key for all parent queries
 * ['parent', 'profile', parentId] - Specific parent profile
 * ['parent', 'children', parentId] - Children list for specific parent
 * etc.
 */
export const parentKeys = {
  all: ['parent'] as const,

  // Parent Profile
  profile: (parentId: string) => [...parentKeys.all, 'profile', parentId] as const,

  // Children
  children: (parentId: string) => [...parentKeys.all, 'children', parentId] as const,

  // Dashboard Summary
  dashboardSummary: (parentId: string) => [...parentKeys.all, 'dashboard-summary', parentId] as const,
};

/**
 * AI Insights Query Keys
 */
export const insightsKeys = {
  all: ['insights'] as const,

  // AI Insights
  list: (parentId: string, filters?: {
    studentId?: string;
    category?: AIInsightCategory;
    severity?: AIInsightSeverity;
    unviewedOnly?: boolean;
  }) => [...insightsKeys.all, 'list', parentId, filters] as const,

  detail: (insightId: string) => [...insightsKeys.all, 'detail', insightId] as const,

  // Risk Factors
  risks: (parentId: string, filters?: {
    studentId?: string;
    activeOnly?: boolean;
  }) => [...insightsKeys.all, 'risks', parentId, filters] as const,

  // Opportunities
  opportunities: (parentId: string, filters?: {
    studentId?: string;
    status?: ActionItemStatus;
  }) => [...insightsKeys.all, 'opportunities', parentId, filters] as const,

  // Behavior Trends
  behaviorTrends: (studentId: string, category?: string) =>
    [...insightsKeys.all, 'behavior-trends', studentId, category] as const,

  // Academic Predictions
  academicPredictions: (studentId: string, subject?: string) =>
    [...insightsKeys.all, 'academic-predictions', studentId, subject] as const,

  // Recommended Actions
  recommendedActions: (parentId: string, filters?: {
    studentId?: string;
    priority?: CommunicationPriority;
    status?: ActionItemStatus;
  }) => [...insightsKeys.all, 'recommended-actions', parentId, filters] as const,
};

/**
 * Communications Query Keys
 */
export const communicationsKeys = {
  all: ['communications'] as const,

  // Message List
  list: (parentId: string, filters?: {
    studentId?: string;
    teacherId?: string;
    status?: CommunicationStatus;
    priority?: CommunicationPriority;
    unreadOnly?: boolean;
  }) => [...communicationsKeys.all, 'list', parentId, filters] as const,

  // Message Thread
  thread: (threadId: string) => [...communicationsKeys.all, 'thread', threadId] as const,

  // Unread Count
  unreadCount: (parentId: string) => [...communicationsKeys.all, 'unread-count', parentId] as const,
};

/**
 * Action Items Query Keys
 */
export const actionItemsKeys = {
  all: ['action-items'] as const,

  // Action Items List
  list: (parentId: string, filters?: {
    studentId?: string;
    status?: ActionItemStatus;
    priority?: CommunicationPriority;
    overdueOnly?: boolean;
  }) => [...actionItemsKeys.all, 'list', parentId, filters] as const,

  // Single Action Item
  detail: (itemId: string) => [...actionItemsKeys.all, 'detail', itemId] as const,
};

/**
 * Financial Query Keys
 */
export const financialKeys = {
  all: ['financial'] as const,

  // Financial Summary
  summary: (parentId: string) => [...financialKeys.all, 'summary', parentId] as const,

  // Payment History
  paymentHistory: (parentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => [...financialKeys.all, 'payment-history', parentId, filters] as const,

  // Upcoming Payments
  upcomingPayments: (parentId: string, daysAhead?: number) =>
    [...financialKeys.all, 'upcoming-payments', parentId, daysAhead] as const,

  // Overdue Payments
  overduePayments: (parentId: string) => [...financialKeys.all, 'overdue-payments', parentId] as const,

  // Student Fees
  studentFees: (studentId: string, status?: string) =>
    [...financialKeys.all, 'student-fees', studentId, status] as const,

  // Total Amount Due
  totalDue: (parentId: string) => [...financialKeys.all, 'total-due', parentId] as const,
};

/**
 * Academic Query Keys
 */
export const academicKeys = {
  all: ['academic'] as const,

  // Student Academic Summary
  summary: (studentId: string, startDate?: string, endDate?: string) =>
    [...academicKeys.all, 'summary', studentId, startDate, endDate] as const,

  // Attendance Records
  attendance: (studentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => [...academicKeys.all, 'attendance', studentId, filters] as const,

  // Attendance Stats
  attendanceStats: (studentId: string, startDate?: string, endDate?: string) =>
    [...academicKeys.all, 'attendance-stats', studentId, startDate, endDate] as const,

  // Grades
  grades: (studentId: string, filters?: {
    subject?: string;
    semester?: string;
    startDate?: string;
    endDate?: string;
  }) => [...academicKeys.all, 'grades', studentId, filters] as const,

  // Subject Grade Average
  subjectGradeAverage: (studentId: string, subject: string, startDate?: string, endDate?: string) =>
    [...academicKeys.all, 'subject-grade-average', studentId, subject, startDate, endDate] as const,

  // Assignments
  assignments: (studentId: string, status?: string) =>
    [...academicKeys.all, 'assignments', studentId, status] as const,

  // Assignment Submissions
  submissions: (studentId: string, assignmentId?: string) =>
    [...academicKeys.all, 'submissions', studentId, assignmentId] as const,
};

/**
 * Helper function to invalidate all parent-related queries
 *
 * Usage:
 * ```ts
 * queryClient.invalidateQueries({ queryKey: invalidateAllParentQueries() });
 * ```
 */
export const invalidateAllParentQueries = () => ({
  predicate: (query: any) => {
    const key = query.queryKey[0];
    return ['parent', 'insights', 'communications', 'action-items', 'financial', 'academic'].includes(key);
  },
});
