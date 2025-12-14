/**
 * Parent API Services - Main Export Module
 *
 * This module serves as the central export point for all parent-related API services.
 * Import from this file to access all parent services in your application.
 *
 * @example
 * ```typescript
 * import { parentAPI } from '@/services/api/parent';
 *
 * // Use parent services
 * const profile = await parentAPI.parent.getParentProfile(parentId);
 * const insights = await parentAPI.insights.getAIInsights(parentId);
 * const messages = await parentAPI.communications.getCommunications(parentId);
 * ```
 */

// ============================================================================
// PARENT PROFILE & DASHBOARD
// ============================================================================
export {
  getParentProfile,
  updateParentProfile,
  getParentChildren,
  getParentDashboardSummary,
  updateNotificationPreferences,
  completeOnboarding,
  updateLastLogin,
  parentExists,
  getProfileCompletionPercentage,
  acceptTermsAndPrivacy,
} from './parentService';

// ============================================================================
// AI INSIGHTS & ANALYTICS
// ============================================================================
export {
  // AI Insights
  getAIInsights,
  getInsightById,
  acknowledgeInsight,
  rateInsight,
  // Risk Factors
  getRiskFactors,
  acknowledgeRisk,
  // Opportunities
  getOpportunities,
  expressInterest,
  // Behavior Trends
  getBehaviorTrends,
  // Academic Predictions
  getAcademicPredictions,
  // Recommended Actions
  getRecommendedActions,
  updateActionStatus,
} from './insightsService';

// ============================================================================
// COMMUNICATIONS
// ============================================================================
export {
  getCommunications,
  getCommunicationThread,
  sendMessage,
  replyToMessage,
  markAsRead,
  markAsUnread,
  archiveCommunication,
  getUnreadCount,
  requestMeeting,
} from './communicationsService';

// ============================================================================
// ACTION ITEMS
// ============================================================================
export {
  getActionItems,
  getActionItemById,
  createActionItem,
  updateActionItem,
  completeActionItem,
  dismissActionItem,
  createFromRecommendation,
} from './actionItemsService';

// ============================================================================
// FINANCIAL
// ============================================================================
export {
  getFinancialSummary,
  getPaymentHistory,
  getUpcomingPayments,
  getPaymentById,
  getStudentFees,
} from './financialService';

// Export additional financial functions
export { getOverduePayments, getTotalAmountDue } from './financialService';

// Export financial types
export type { Payment, StudentFee } from './financialService';

// ============================================================================
// ACADEMIC
// ============================================================================
export {
  getStudentAcademicSummary,
  getAttendanceRecords,
  getGrades,
  getAssignments,
  getAssignmentSubmissions,
} from './academicService';

// Export additional academic functions
export { getAttendanceStats, getSubjectGradeAverage } from './academicService';

// Export academic types
export type {
  AttendanceRecord,
  Grade,
  Assignment,
  AssignmentSubmission,
} from './academicService';

// ============================================================================
// ORGANIZED API OBJECT
// ============================================================================

/**
 * Organized parent API services grouped by functionality
 * This provides a cleaner import structure for the entire parent module
 */
export const parentAPI = {
  // Parent profile and dashboard
  parent: {
    getProfile: async (parentId: string) => (await import('./parentService')).getParentProfile(parentId),
    updateProfile: async (parentId: string, updates: any) => (await import('./parentService')).updateParentProfile(parentId, updates),
    getChildren: async (parentId: string) => (await import('./parentService')).getParentChildren(parentId),
    getDashboardSummary: async (parentId: string) => (await import('./parentService')).getParentDashboardSummary(parentId),
    updateNotificationPreferences: async (parentId: string, preferences: any) => (await import('./parentService')).updateNotificationPreferences(parentId, preferences),
    completeOnboarding: async (parentId: string) => (await import('./parentService')).completeOnboarding(parentId),
    updateLastLogin: async (parentId: string) => (await import('./parentService')).updateLastLogin(parentId),
    exists: async (parentId: string) => (await import('./parentService')).parentExists(parentId),
    getCompletionPercentage: async (parentId: string) => (await import('./parentService')).getProfileCompletionPercentage(parentId),
    acceptTermsAndPrivacy: async (parentId: string) => (await import('./parentService')).acceptTermsAndPrivacy(parentId),
  },

  // AI Insights and analytics
  insights: {
    getAIInsights: async (parentId: string, filters?: any) => (await import('./insightsService')).getAIInsights(parentId, filters),
    getInsightById: async (insightId: string) => (await import('./insightsService')).getInsightById(insightId),
    acknowledgeInsight: async (insightId: string) => (await import('./insightsService')).acknowledgeInsight(insightId),
    rateInsight: async (insightId: string, rating: number, feedback?: string) => (await import('./insightsService')).rateInsight(insightId, rating, feedback),
    getRiskFactors: async (parentId: string, studentId?: string, activeOnly?: boolean) => (await import('./insightsService')).getRiskFactors(parentId, studentId, activeOnly),
    acknowledgeRisk: async (riskId: string, comments?: string) => (await import('./insightsService')).acknowledgeRisk(riskId, comments),
    getOpportunities: async (parentId: string, studentId?: string, status?: any) => (await import('./insightsService')).getOpportunities(parentId, studentId, status),
    expressInterest: async (opportunityId: string, interested: boolean, comments?: string) => (await import('./insightsService')).expressInterest(opportunityId, interested, comments),
    getBehaviorTrends: async (studentId: string, category?: string) => (await import('./insightsService')).getBehaviorTrends(studentId, category),
    getAcademicPredictions: async (studentId: string, subject?: string) => (await import('./insightsService')).getAcademicPredictions(studentId, subject),
    getRecommendedActions: async (parentId: string, filters?: any) => (await import('./insightsService')).getRecommendedActions(parentId, filters),
    updateActionStatus: async (actionId: string, status: any, notes?: string) => (await import('./insightsService')).updateActionStatus(actionId, status, notes),
  },

  // Communications
  communications: {
    getAll: async (parentId: string, filters?: any) => (await import('./communicationsService')).getCommunications(parentId, filters),
    getThread: async (threadId: string) => (await import('./communicationsService')).getCommunicationThread(threadId),
    send: async (data: any) => (await import('./communicationsService')).sendMessage(data),
    reply: async (messageId: string, replyText: string, senderId: string) => (await import('./communicationsService')).replyToMessage(messageId, replyText, senderId),
    markAsRead: async (messageId: string) => (await import('./communicationsService')).markAsRead(messageId),
    markAsUnread: async (messageId: string) => (await import('./communicationsService')).markAsUnread(messageId),
    archive: async (messageId: string) => (await import('./communicationsService')).archiveCommunication(messageId),
    getUnreadCount: async (parentId: string) => (await import('./communicationsService')).getUnreadCount(parentId),
    requestMeeting: async (messageId: string, proposedDates: any[]) => (await import('./communicationsService')).requestMeeting(messageId, proposedDates),
  },

  // Action Items
  actions: {
    getAll: async (parentId: string, filters?: any) => (await import('./actionItemsService')).getActionItems(parentId, filters),
    getById: async (itemId: string) => (await import('./actionItemsService')).getActionItemById(itemId),
    create: async (parentId: string, data: any) => (await import('./actionItemsService')).createActionItem(parentId, data),
    update: async (itemId: string, updates: any) => (await import('./actionItemsService')).updateActionItem(itemId, updates),
    complete: async (itemId: string, notes?: string, proofUrl?: string) => (await import('./actionItemsService')).completeActionItem(itemId, notes, proofUrl),
    dismiss: async (itemId: string, reason: string) => (await import('./actionItemsService')).dismissActionItem(itemId, reason),
    createFromRecommendation: async (recommendedActionId: string, customDueDate?: string) => (await import('./actionItemsService')).createFromRecommendation(recommendedActionId, customDueDate),
  },

  // Financial
  financial: {
    getSummary: async (parentId: string) => (await import('./financialService')).getFinancialSummary(parentId),
    getPaymentHistory: async (parentId: string, filters?: any) => (await import('./financialService')).getPaymentHistory(parentId, filters),
    getUpcomingPayments: async (parentId: string, daysAhead?: number) => (await import('./financialService')).getUpcomingPayments(parentId, daysAhead),
    getPaymentById: async (paymentId: string) => (await import('./financialService')).getPaymentById(paymentId),
    getStudentFees: async (studentId: string, status?: any) => (await import('./financialService')).getStudentFees(studentId, status),
    getOverduePayments: async (parentId: string) => (await import('./financialService')).getOverduePayments(parentId),
    getTotalAmountDue: async (parentId: string) => (await import('./financialService')).getTotalAmountDue(parentId),
  },

  // Academic
  academic: {
    getSummary: async (studentId: string, startDate?: string, endDate?: string) => (await import('./academicService')).getStudentAcademicSummary(studentId, startDate, endDate),
    getAttendance: async (studentId: string, filters?: any) => (await import('./academicService')).getAttendanceRecords(studentId, filters),
    getGrades: async (studentId: string, filters?: any) => (await import('./academicService')).getGrades(studentId, filters),
    getAssignments: async (studentId: string, status?: any) => (await import('./academicService')).getAssignments(studentId, status),
    getSubmissions: async (studentId: string, assignmentId?: string) => (await import('./academicService')).getAssignmentSubmissions(studentId, assignmentId),
    getAttendanceStats: async (studentId: string, startDate?: string, endDate?: string) => (await import('./academicService')).getAttendanceStats(studentId, startDate, endDate),
    getSubjectAverage: async (studentId: string, subject: string, startDate?: string, endDate?: string) => (await import('./academicService')).getSubjectGradeAverage(studentId, subject, startDate, endDate),
  },
};

/**
 * Default export - organized API object
 */
export default parentAPI;
