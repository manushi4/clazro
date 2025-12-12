/**
 * Parent API React Query Hooks
 *
 * Custom hooks for all parent-related API operations using React Query
 *
 * Features:
 * - Automatic caching and background refetching
 * - Optimistic updates for instant UI feedback
 * - Error handling with retries
 * - Type-safe query parameters and responses
 *
 * @see C:\PC\REACT_QUERY_SETUP_GUIDE.md for setup instructions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import * as parentService from '../services/api/parent/parentService';
import * as insightsService from '../services/api/parent/insightsService';
import * as communicationsService from '../services/api/parent/communicationsService';
import * as actionItemsService from '../services/api/parent/actionItemsService';
import * as financialService from '../services/api/parent/financialService';
import * as academicService from '../services/api/parent/academicService';
import {
  parentKeys,
  insightsKeys,
  communicationsKeys,
  actionItemsKeys,
  financialKeys,
  academicKeys,
} from './queryKeys';
import { queryConfigs } from '../config/queryClient';
import type {
  Parent,
  AIInsight,
  RiskFactor,
  Opportunity,
  BehaviorTrend,
  AcademicPrediction,
  RecommendedAction,
  ParentTeacherCommunication,
  ParentActionItem,
  CommunicationPriority,
  ActionItemStatus,
  AIInsightCategory,
  AIInsightSeverity,
  RiskFactorType,
  OpportunityType,
  CommunicationStatus,
} from '../types/supabase-parent.types';

// ============================================================================
// PARENT SERVICE HOOKS (6 hooks)
// ============================================================================

/**
 * Get parent profile
 */
export function useParentProfile(parentId: string) {
  return useQuery({
    queryKey: parentKeys.profile(parentId),
    queryFn: () => parentService.getParentProfile(parentId),
    ...queryConfigs.static,
    enabled: !!parentId,
  });
}

/**
 * Get parent's children
 */
export function useParentChildren(parentId: string) {
  return useQuery({
    queryKey: parentKeys.children(parentId),
    queryFn: async () => {
      const result = await parentService.getParentChildren(parentId);
      return result || [];
    },
    placeholderData: [],
    ...queryConfigs.static,
    enabled: !!parentId,
  });
}

/**
 * Get parent dashboard summary
 */
export function useParentDashboardSummary(parentId: string) {
  return useQuery({
    queryKey: parentKeys.dashboardSummary(parentId),
    queryFn: () => parentService.getParentDashboardSummary(parentId),
    staleTime: 30 * 1000, // 30 seconds (dashboard data should be fresh)
    gcTime: 5 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Update parent profile (with optimistic update)
 */
export function useUpdateParentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, updates }: { parentId: string; updates: Partial<Parent> }) =>
      parentService.updateParentProfile(parentId, updates),

    onMutate: async ({ parentId, updates }) => {
      await queryClient.cancelQueries({ queryKey: parentKeys.profile(parentId) });

      const previousProfile = queryClient.getQueryData<Parent>(parentKeys.profile(parentId));

      queryClient.setQueryData<Parent>(parentKeys.profile(parentId), (old) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousProfile };
    },

    onError: (err, { parentId }, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(parentKeys.profile(parentId), context.previousProfile);
      }
    },

    onSuccess: (data, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: parentKeys.profile(parentId) });
      queryClient.invalidateQueries({ queryKey: parentKeys.dashboardSummary(parentId) });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, preferences }: { parentId: string; preferences: any }) =>
      parentService.updateNotificationPreferences(parentId, preferences),

    onSuccess: (data, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: parentKeys.profile(parentId) });
    },
  });
}

/**
 * Complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (parentId: string) => parentService.completeOnboarding(parentId),

    onSuccess: (data, parentId) => {
      queryClient.invalidateQueries({ queryKey: parentKeys.profile(parentId) });
    },
  });
}

// ============================================================================
// INSIGHTS SERVICE HOOKS (12 hooks)
// ============================================================================

/**
 * Get AI insights with optional filters
 */
export function useAIInsights(
  parentId: string,
  filters?: {
    studentId?: string;
    category?: AIInsightCategory;
    severity?: AIInsightSeverity;
    unviewedOnly?: boolean;
  }
) {
  return useQuery({
    queryKey: insightsKeys.list(parentId, filters),
    queryFn: () => insightsService.getAIInsights(parentId, filters),
    placeholderData: [],
    ...queryConfigs.analytics,
    enabled: !!parentId,
  });
}

/**
 * Get single insight by ID
 */
export function useInsightById(insightId: string) {
  return useQuery({
    queryKey: insightsKeys.detail(insightId),
    queryFn: () => insightsService.getInsightById(insightId),
    ...queryConfigs.analytics,
    enabled: !!insightId,
  });
}

/**
 * Acknowledge insight (mark as viewed)
 */
export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insightId: string) => insightsService.acknowledgeInsight(insightId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

/**
 * Rate insight
 */
export function useRateInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      insightId,
      rating,
      feedback,
    }: {
      insightId: string;
      rating: number;
      feedback?: string;
    }) => insightsService.rateInsight(insightId, rating, feedback),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

/**
 * Get risk factors
 */
export function useRiskFactors(
  parentId: string,
  filters?: { studentId?: string; activeOnly?: boolean }
) {
  return useQuery({
    queryKey: insightsKeys.risks(parentId, filters),
    placeholderData: [],
    queryFn: () => insightsService.getRiskFactors(parentId, filters?.studentId, filters?.activeOnly),
    ...queryConfigs.analytics,
    enabled: !!parentId,
  });
}

/**
 * Acknowledge risk
 */
export function useAcknowledgeRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ riskId, comments }: { riskId: string; comments?: string }) =>
      insightsService.acknowledgeRisk(riskId, comments),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

/**
 * Get opportunities
 */
export function useOpportunities(
  parentId: string,
  filters?: { studentId?: string; status?: ActionItemStatus }
) {
  return useQuery({
    queryKey: insightsKeys.opportunities(parentId, filters),
    placeholderData: [],
    queryFn: () => insightsService.getOpportunities(parentId, filters?.studentId, filters?.status),
    ...queryConfigs.analytics,
    enabled: !!parentId,
  });
}

/**
 * Express interest in opportunity
 */
export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      opportunityId,
      interested,
      comments,
    }: {
      opportunityId: string;
      interested: boolean;
      comments?: string;
    }) => insightsService.expressInterest(opportunityId, interested, comments),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

/**
 * Get behavior trends for a student
 */
export function useBehaviorTrends(studentId: string, category?: string) {
  return useQuery({
    queryKey: insightsKeys.behaviorTrends(studentId, category),
    placeholderData: [],
    queryFn: () => insightsService.getBehaviorTrends(studentId, category),
    ...queryConfigs.analytics,
    enabled: !!studentId,
  });
}

/**
 * Get academic predictions for a student
 */
export function useAcademicPredictions(studentId: string, subject?: string) {
  return useQuery({
    queryKey: insightsKeys.academicPredictions(studentId, subject),
    placeholderData: [],
    queryFn: () => insightsService.getAcademicPredictions(studentId, subject),
    ...queryConfigs.analytics,
    enabled: !!studentId,
  });
}

/**
 * Get recommended actions
 */
export function useRecommendedActions(
  parentId: string,
  filters?: {
    studentId?: string;
    priority?: CommunicationPriority;
    status?: ActionItemStatus;
  }
) {
  return useQuery({
    queryKey: insightsKeys.recommendedActions(parentId, filters),
    placeholderData: [],
    queryFn: () => insightsService.getRecommendedActions(parentId, filters),
    ...queryConfigs.analytics,
    enabled: !!parentId,
  });
}

/**
 * Update action status
 */
export function useUpdateActionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionId,
      status,
      notes,
    }: {
      actionId: string;
      status: ActionItemStatus;
      notes?: string;
    }) => insightsService.updateActionStatus(actionId, status, notes),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

// ============================================================================
// COMMUNICATIONS SERVICE HOOKS (9 hooks)
// ============================================================================

/**
 * Get communications/messages with filters
 */
export function useCommunications(
  parentId: string,
  filters?: {
    studentId?: string;
    teacherId?: string;
    status?: CommunicationStatus;
    priority?: CommunicationPriority;
    unreadOnly?: boolean;
  }
) {
  return useQuery({
    queryKey: communicationsKeys.list(parentId, filters),
    placeholderData: [],
    queryFn: () => communicationsService.getCommunications(parentId, filters),
    ...queryConfigs.realtime, // Communications are real-time, refetch frequently
    enabled: !!parentId,
  });
}

/**
 * Get communication thread (conversation)
 */
export function useCommunicationThread(threadId: string) {
  return useQuery({
    queryKey: communicationsKeys.thread(threadId),
    queryFn: () => communicationsService.getCommunicationThread(threadId),
    ...queryConfigs.realtime,
    enabled: !!threadId,
  });
}

/**
 * Get unread message count
 */
export function useUnreadCount(parentId: string) {
  return useQuery({
    queryKey: communicationsKeys.unreadCount(parentId),
    queryFn: () => communicationsService.getUnreadCount(parentId),
    ...queryConfigs.realtime,
    enabled: !!parentId,
  });
}

/**
 * Send message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      parentId: string;
      teacherId: string;
      studentId: string;
      subject: string;
      message: string;
      priority?: CommunicationPriority;
    }) => communicationsService.sendMessage(data),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.list(variables.parentId) });
    },
  });
}

/**
 * Reply to message
 */
export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      replyText,
      senderId,
    }: {
      messageId: string;
      replyText: string;
      senderId: string;
    }) => communicationsService.replyToMessage(messageId, replyText, senderId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
    },
  });
}

/**
 * Mark message as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => communicationsService.markAsRead(messageId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
    },
  });
}

/**
 * Mark message as unread
 */
export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => communicationsService.markAsUnread(messageId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
    },
  });
}

/**
 * Archive communication
 */
export function useArchiveCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => communicationsService.archiveCommunication(messageId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
    },
  });
}

/**
 * Request meeting
 */
export function useRequestMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, proposedDates }: {
      messageId: string;
      proposedDates: Array<{ date: string; startTime: string; endTime: string; timezone?: string; }>
    }) =>
      communicationsService.requestMeeting(messageId, proposedDates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
    },
  });
}

// ============================================================================
// ACTION ITEMS SERVICE HOOKS (7 hooks)
// ============================================================================

/**
 * Get action items with filters
 */
export function useActionItems(
  parentId: string,
  filters?: {
    studentId?: string;
    status?: ActionItemStatus;
    priority?: CommunicationPriority;
    overdueOnly?: boolean;
  }
) {
  return useQuery({
    queryKey: actionItemsKeys.list(parentId, filters),
    placeholderData: [],
    queryFn: () => actionItemsService.getActionItems(parentId, filters),
    ...queryConfigs.realtime,
    enabled: !!parentId,
  });
}

/**
 * Get single action item
 */
export function useActionItemById(itemId: string) {
  return useQuery({
    queryKey: actionItemsKeys.detail(itemId),
    queryFn: () => actionItemsService.getActionItemById(itemId),
    ...queryConfigs.realtime,
    enabled: !!itemId,
  });
}

/**
 * Create action item
 */
export function useCreateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, data }: {
      parentId: string;
      data: {
        studentId: string;
        title: string;
        description?: string;
        actionType?: string;
        priority?: CommunicationPriority;
        dueDate?: string;
        dueTime?: string;
        estimatedDurationMinutes?: number;
        reminderEnabled?: boolean;
        reminderBeforeDays?: number;
        tags?: string[];
        relatedLinks?: Record<string, any>;
        communicationId?: string;
        aiInsightId?: string;
        recommendedActionId?: string;
      }
    }) =>
      actionItemsService.createActionItem(parentId, data),

    onSuccess: (data, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: actionItemsKeys.list(parentId) });
    },
  });
}

/**
 * Update action item
 */
export function useUpdateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ParentActionItem> }) =>
      actionItemsService.updateActionItem(itemId, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemsKeys.all });
    },
  });
}

/**
 * Complete action item
 */
export function useCompleteActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, notes, proofUrl }: { itemId: string; notes?: string; proofUrl?: string }) =>
      actionItemsService.completeActionItem(itemId, notes, proofUrl),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemsKeys.all });
    },
  });
}

/**
 * Dismiss action item
 */
export function useDismissActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) =>
      actionItemsService.dismissActionItem(itemId, reason),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemsKeys.all });
    },
  });
}

/**
 * Create action item from recommendation
 */
export function useCreateActionItemFromRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recommendedActionId,
      customDueDate,
    }: {
      recommendedActionId: string;
      customDueDate?: string;
    }) => actionItemsService.createFromRecommendation(recommendedActionId, customDueDate),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemsKeys.all });
      queryClient.invalidateQueries({ queryKey: insightsKeys.all });
    },
  });
}

// ============================================================================
// FINANCIAL SERVICE HOOKS (10 hooks - Phase 1 expanded)
// ============================================================================

/**
 * Get invoices for a parent
 * @param parentId - Parent UUID
 * @param status - Optional status filter ('paid', 'pending', 'overdue', 'partial', 'cancelled')
 */
export function useInvoices(
  parentId: string,
  status?: 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled'
) {
  return useQuery({
    queryKey: ['invoices', parentId, status],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          student:students(id, full_name)
        `)
        .eq('parent_id', parentId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error} = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Get invoice items (line items) for a specific invoice
 * @param invoiceId - Invoice UUID
 */
export function useInvoiceItems(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice_items', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!invoiceId,
  });
}

/**
 * Get parent financial summary (aggregated financial data from database view)
 * @param parentId - Parent UUID
 */
export function useParentFinancialSummary(parentId: string) {
  return useQuery({
    queryKey: ['parent_financial_summary', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_financial_summary')
        .select('*')
        .eq('parent_id', parentId)
        .single();

      if (error) throw error;
      return data || null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Get financial summary
 */
export function useFinancialSummary(parentId: string) {
  return useQuery({
    queryKey: financialKeys.summary(parentId),
    queryFn: () => financialService.getFinancialSummary(parentId),
    ...queryConfigs.financial,
    enabled: !!parentId,
  });
}

/**
 * Get payment history with filters
 */
export function usePaymentHistory(
  parentId: string,
  filters?: {
    studentId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    limit?: number;
  }
) {
  return useQuery({
    queryKey: financialKeys.paymentHistory(parentId, filters),
    placeholderData: [],
    queryFn: () => financialService.getPaymentHistory(parentId, filters),
    ...queryConfigs.financial,
    enabled: !!parentId,
  });
}

/**
 * Get upcoming payments
 */
export function useUpcomingPayments(parentId: string, daysAhead: number = 30) {
  return useQuery({
    queryKey: financialKeys.upcomingPayments(parentId, daysAhead),
    queryFn: () => financialService.getUpcomingPayments(parentId, daysAhead),
    ...queryConfigs.financial,
    enabled: !!parentId,
  });
}

/**
 * Get overdue payments
 */
export function useOverduePayments(parentId: string) {
  return useQuery({
    queryKey: financialKeys.overduePayments(parentId),
    queryFn: () => financialService.getOverduePayments(parentId),
    ...queryConfigs.financial,
    enabled: !!parentId,
  });
}

/**
 * Get student fees
 */
export function useStudentFees(studentId: string, status?: 'pending' | 'paid' | 'overdue' | 'waived') {
  return useQuery({
    queryKey: financialKeys.studentFees(studentId, status),
    queryFn: () => financialService.getStudentFees(studentId, status),
    ...queryConfigs.financial,
    enabled: !!studentId,
  });
}

/**
 * Get total amount due
 */
export function useTotalAmountDue(parentId: string) {
  return useQuery({
    queryKey: financialKeys.totalDue(parentId),
    queryFn: () => financialService.getTotalAmountDue(parentId),
    ...queryConfigs.financial,
    enabled: !!parentId,
  });
}

/**
 * Get payment by ID
 */
export function usePaymentById(paymentId: string) {
  return useQuery({
    queryKey: [...financialKeys.all, 'payment', paymentId],
    queryFn: () => financialService.getPaymentById(paymentId),
    ...queryConfigs.financial,
    enabled: !!paymentId,
  });
}

// ============================================================================
// ACADEMIC SERVICE HOOKS (14 hooks - Phase 1 expanded)
// ============================================================================

/**
 * Get child's academic progress (all subjects with teacher info)
 * @param studentId - Student UUID
 * @param academicYear - Optional academic year filter (default: 2024-2025)
 * @param term - Optional term filter (default: Term 1)
 */
export function useChildAcademicProgress(
  studentId: string,
  academicYear: string = '2024-2025',
  term: string = 'Term 1'
) {
  return useQuery({
    queryKey: ['academic_progress', studentId, academicYear, term],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_progress')
        .select(`
          *,
          teacher:teachers(first_name, last_name, email, phone_number, subjects)
        `)
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('term', term)
        .order('subject');

      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!studentId,
  });
}

/**
 * Get student academic summary
 */
export function useStudentAcademicSummary(
  studentId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: academicKeys.summary(studentId, startDate, endDate),
    queryFn: () => academicService.getStudentAcademicSummary(studentId, startDate, endDate),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

/**
 * Get class schedule for a student (weekly timetable)
 * @param studentId - Student UUID
 * @param academicYear - Optional academic year filter (default: 2024-2025)
 * @param term - Optional term filter (default: Term 1)
 */
export function useClassSchedule(
  studentId: string,
  academicYear: string = '2024-2025',
  term: string = 'Term 1'
) {
  return useQuery({
    queryKey: ['class_schedules', studentId, academicYear, term],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          teacher:teachers(first_name, last_name, email, phone_number, subjects)
        `)
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('term', term)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
    staleTime: 60 * 60 * 1000, // 1 hour (schedules don't change often)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!studentId,
  });
}

/**
 * Get exam schedule for a student
 * @param studentId - Student UUID
 * @param academicYear - Optional academic year filter (default: 2024-2025)
 * @param term - Optional term filter (default: Term 1)
 * @param status - Optional status filter ('upcoming', 'completed', 'cancelled')
 */
export function useExamSchedule(
  studentId: string,
  academicYear: string = '2024-2025',
  term: string = 'Term 1',
  status?: 'upcoming' | 'completed' | 'cancelled'
) {
  return useQuery({
    queryKey: ['exam_schedules', studentId, academicYear, term, status],
    queryFn: async () => {
      let query = supabase
        .from('exam_schedules')
        .select(`
          *,
          teacher:teachers(first_name, last_name, email, phone_number, subjects)
        `)
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('term', term);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('exam_date');

      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!studentId,
  });
}

/**
 * Get teachers for a specific child (all teachers teaching this student)
 * @param studentId - Student UUID
 * @param academicYear - Optional academic year filter (default: 2024-2025)
 * @param term - Optional term filter (default: Term 1)
 */
export function useChildTeachers(
  studentId: string,
  academicYear: string = '2024-2025',
  term: string = 'Term 1'
) {
  return useQuery({
    queryKey: ['child_teachers', studentId, academicYear, term],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_student_assignments')
        .select(`
          *,
          teacher:teachers(
            id,
            first_name,
            last_name,
            email,
            phone_number,
            subjects,
            department,
            designation,
            years_experience,
            qualifications,
            is_available,
            office_hours,
            preferred_contact_method,
            average_response_time_hours,
            rating,
            total_ratings
          )
        `)
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('term', term)
        .order('subject');

      if (error) throw error;

      // Extract unique teachers (in case a teacher teaches multiple subjects)
      const uniqueTeachers = data?.reduce((acc: any[], item: any) => {
        if (item.teacher && !acc.find((t: any) => t.id === item.teacher.id)) {
          acc.push({ ...item.teacher, subject: item.subject, is_primary: item.is_primary_teacher });
        }
        return acc;
      }, []);

      return uniqueTeachers || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!studentId,
  });
}

/**
 * Get attendance records
 */
export function useAttendanceRecords(
  studentId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: 'present' | 'absent' | 'late' | 'excused';
    classId?: string;
  }
) {
  return useQuery({
    queryKey: academicKeys.attendance(studentId, filters),
    queryFn: () => academicService.getAttendanceRecords(studentId, filters),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

/**
 * Get attendance stats
 */
export function useAttendanceStats(
  studentId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: academicKeys.attendanceStats(studentId, startDate, endDate),
    queryFn: () => academicService.getAttendanceStats(studentId, startDate, endDate),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

/**
 * Get grades
 */
export function useGrades(
  studentId: string,
  filters?: {
    subject?: string;
    semester?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: academicKeys.grades(studentId, filters),
    queryFn: () => academicService.getGrades(studentId, filters),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

/**
 * Get subject grade average
 */
export function useSubjectGradeAverage(
  studentId: string,
  subject: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: academicKeys.subjectGradeAverage(studentId, subject, startDate, endDate),
    queryFn: () => academicService.getSubjectGradeAverage(studentId, subject, startDate, endDate),
    ...queryConfigs.academic,
    enabled: !!studentId && !!subject,
  });
}

/**
 * Get assignments
 */
export function useAssignments(studentId: string, status?: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'overdue') {
  return useQuery({
    queryKey: academicKeys.assignments(studentId, status),
    queryFn: () => academicService.getAssignments(studentId, status),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

/**
 * Get assignment submissions
 */
export function useAssignmentSubmissions(studentId: string, assignmentId?: string) {
  return useQuery({
    queryKey: academicKeys.submissions(studentId, assignmentId),
    queryFn: () => academicService.getAssignmentSubmissions(studentId, assignmentId),
    ...queryConfigs.academic,
    enabled: !!studentId,
  });
}

// ============================================================================
// PHASE 2 HOOKS - Teacher Communication & Performance Analytics
// ============================================================================

/**
 * Get all teachers for a parent (across all their children)
 * @param parentId - Parent UUID
 */
export function useParentTeachers(parentId: string) {
  return useQuery({
    queryKey: ['parent_teachers', parentId],
    queryFn: async () => {
      // Get all children for this parent
      const { data: children, error: childrenError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', parentId);

      if (childrenError) throw childrenError;
      if (!children || children.length === 0) return [];

      const studentIds = children.map(c => c.id);

      // Get all teacher assignments for these students
      const { data: assignments, error: assignmentsError } = await supabase
        .from('teacher_student_assignments')
        .select(`
          *,
          teacher:teachers(
            id,
            first_name,
            last_name,
            email,
            phone_number,
            subjects,
            department,
            years_experience,
            average_response_time_hours,
            rating,
            is_available
          )
        `)
        .in('student_id', studentIds);

      if (assignmentsError) throw assignmentsError;

      // Extract unique teachers
      const uniqueTeachers = assignments?.reduce((acc: any[], item: any) => {
        if (item.teacher && !acc.find((t: any) => t.id === item.teacher.id)) {
          acc.push(item.teacher);
        }
        return acc;
      }, []);

      return uniqueTeachers || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Get conversations/message threads for a parent
 * Groups messages by teacher for conversation view
 * @param parentId - Parent UUID
 */
export function useConversations(parentId: string) {
  return useQuery({
    queryKey: ['conversations', parentId],
    queryFn: async () => {
      // Get all communications for this parent
      const { data: communications, error } = await supabase
        .from('parent_teacher_communications')
        .select(`
          *,
          teacher:teachers!teacher_id(
            id,
            first_name,
            last_name,
            email,
            subjects,
            department
          ),
          student:students(id, full_name)
        `)
        .eq('parent_id', parentId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group by teacher to create conversation threads
      const conversations = communications?.reduce((acc: any[], comm: any) => {
        const existingConv = acc.find(c => c.teacherId === comm.teacher_id);

        if (existingConv) {
          existingConv.messages.push(comm);
          if (comm.status !== 'read' && comm.recipient_role === 'parent') {
            existingConv.unreadCount++;
          }
          // Update last message if this one is newer
          if (new Date(comm.sent_at) > new Date(existingConv.lastMessage.sent_at)) {
            existingConv.lastMessage = comm;
          }
        } else {
          acc.push({
            id: `conv_${comm.teacher_id}`,
            teacherId: comm.teacher_id,
            teacher: comm.teacher,
            messages: [comm],
            lastMessage: comm,
            unreadCount: (comm.status !== 'read' && comm.recipient_role === 'parent') ? 1 : 0,
            isPinned: false,
            isArchived: false,
          });
        }

        return acc;
      }, []);

      return conversations || [];
    },
    staleTime: 30 * 1000, // 30 seconds (messages should be fresh)
    gcTime: 5 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Get meetings scheduled between parent and teachers
 * @param parentId - Parent UUID
 * @param status - Optional filter by meeting status
 */
export function useMeetings(
  parentId: string,
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
) {
  return useQuery({
    queryKey: ['meetings', parentId, status],
    queryFn: async () => {
      let query = supabase
        .from('parent_teacher_communications')
        .select(`
          *,
          teacher:teachers!teacher_id(
            id,
            first_name,
            last_name,
            email,
            subjects
          )
        `)
        .eq('parent_id', parentId)
        .eq('meeting_requested', true)
        .not('meeting_scheduled_at', 'is', null);

      const { data, error } = await query.order('meeting_scheduled_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!parentId,
  });
}

/**
 * Get performance metrics for Phase 2 analytics screen
 * Combines data from multiple sources to create performance metrics
 * @param studentId - Student UUID
 * @param timeframe - 'week' | 'month' | 'term' | 'year'
 */
export function usePerformanceMetrics(
  studentId: string,
  timeframe: 'week' | 'month' | 'term' | 'year' = 'month'
) {
  return useQuery({
    queryKey: ['performance_metrics', studentId, timeframe],
    queryFn: async () => {
      // Calculate date range based on timeframe
      const endDate = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'term':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get behavior trends
      const { data: behaviorTrends, error: behaviorError } = await supabase
        .from('behavior_trends')
        .select('*')
        .eq('student_id', studentId)
        .gte('period_end', startDate.toISOString().split('T')[0])
        .eq('is_active', true);

      if (behaviorError) throw behaviorError;

      // Get academic progress
      const { data: academicProgress, error: academicError } = await supabase
        .from('academic_progress')
        .select('*')
        .eq('student_id', studentId);

      if (academicError) throw academicError;

      // Transform into performance metrics format
      const metrics = [];

      // Add behavior-based metrics
      behaviorTrends?.forEach((trend: any) => {
        metrics.push({
          id: trend.id,
          metric: trend.title,
          currentValue: trend.current_score,
          previousValue: trend.baseline_score,
          trend: trend.trend_direction as 'improving' | 'stable' | 'declining',
          unit: trend.behavior_category === 'attendance' ? '%' : 'pts',
          category: 'behavioral' as const,
          benchmark: trend.baseline_score,
          percentile: Math.min(Math.round((trend.current_score / 100) * 100), 100),
        });
      });

      // Add academic metrics
      if (academicProgress && academicProgress.length > 0) {
        const avgGrade = academicProgress.reduce((sum: number, prog: any) =>
          sum + parseFloat(prog.current_grade || 0), 0) / academicProgress.length;

        metrics.push({
          id: 'academic_overall',
          metric: 'Overall Academic Performance',
          currentValue: Math.round(avgGrade),
          previousValue: Math.round(avgGrade * 0.95), // Estimate previous as 95% of current
          trend: 'improving' as const,
          unit: '%',
          category: 'academic' as const,
          benchmark: 80,
          percentile: Math.min(Math.round(avgGrade), 100),
        });
      }

      return metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    enabled: !!studentId,
  });
}

/**
 * Get comparison data for performance analytics
 * @param studentId - Student UUID
 */
export function usePerformanceComparisons(studentId: string) {
  return useQuery({
    queryKey: ['performance_comparisons', studentId],
    queryFn: async () => {
      // Get student's academic progress
      const { data: progress, error } = await supabase
        .from('academic_progress')
        .select('subject, current_grade, class_average, grade_level_average')
        .eq('student_id', studentId);

      if (error) throw error;

      // Transform into comparison format
      const comparisons = progress?.map((item: any) => ({
        category: item.subject,
        childScore: parseFloat(item.current_grade || 0),
        classAverage: parseFloat(item.class_average || 0),
        gradeAverage: parseFloat(item.grade_level_average || 0),
        nationalAverage: parseFloat(item.grade_level_average || 0) * 0.95, // Estimate national as 95% of grade level
        maxScore: 100,
      }));

      return comparisons || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!studentId,
  });
}

// ============================================================================
// PHASE 3 HOOKS - Community Engagement & Information Hub
// ============================================================================

/**
 * Get community events
 * @param status - Filter by event status (optional)
 */
export function useCommunityEvents(status?: string) {
  return useQuery({
    queryKey: ['community_events', status],
    queryFn: async () => {
      let query = supabase
        .from('community_events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, email)
        `)
        .order('event_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get community discussions/forum posts
 * @param category - Filter by category (optional)
 */
export function useCommunityDiscussions(category?: string) {
  return useQuery({
    queryKey: ['community_discussions', category],
    queryFn: async () => {
      let query = supabase
        .from('community_discussions')
        .select(`
          *,
          author:profiles!author_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get community shared resources
 * @param category - Filter by category (optional)
 */
export function useCommunityResources(category?: string) {
  return useQuery({
    queryKey: ['community_resources', category],
    queryFn: async () => {
      let query = supabase
        .from('community_resources')
        .select(`
          *,
          sharedBy:profiles!shared_by_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get volunteer opportunities
 * @param activeOnly - Show only active opportunities (default: true)
 */
export function useVolunteerOpportunities(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['volunteer_opportunities', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('volunteer_opportunities')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, email)
        `)
        .order('start_date', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get school policies
 * @param category - Filter by category (optional)
 */
export function useSchoolPolicies(category?: string) {
  return useQuery({
    queryKey: ['school_policies', category],
    queryFn: async () => {
      let query = supabase
        .from('school_policies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - policies don't change often
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get school announcements/news
 * @param includeExpired - Include expired announcements (default: false)
 */
export function useSchoolAnnouncements(includeExpired: boolean = false) {
  return useQuery({
    queryKey: ['school_announcements', includeExpired],
    queryFn: async () => {
      let query = supabase
        .from('school_announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (!includeExpired) {
        query = query.or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get important dates from academic calendar
 * @param upcoming - Show only upcoming dates (default: true)
 */
export function useImportantDates(upcoming: boolean = true) {
  return useQuery({
    queryKey: ['important_dates', upcoming],
    queryFn: async () => {
      let query = supabase
        .from('important_dates')
        .select('*')
        .order('event_date', { ascending: true });

      if (upcoming) {
        query = query.gte('event_date', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get educational resources
 * @param filters - Optional filters for grade, subject, category
 */
export function useEducationalResources(filters?: {
  grade?: string;
  subject?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['educational_resources', filters],
    queryFn: async () => {
      let query = supabase
        .from('educational_resources')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (filters?.grade && filters.grade !== 'All Grades') {
        query = query.eq('grade', filters.grade);
      }
      if (filters?.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: [],
  });
}

/**
 * Get emergency protocols
 * @param activeOnly - Show only active protocols (default: true)
 */
export function useEmergencyProtocols(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['emergency_protocols', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('emergency_protocols')
        .select('*')
        .order('priority', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - emergency protocols rarely change
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: [],
  });
}

// ============================================================================
// COMPOUND HOOKS (Multiple queries in one)
// ============================================================================

/**
 * Get all parent dashboard data in one hook
 * Useful for dashboard screens that need multiple data sources
 */
export function useParentDashboard(parentId: string) {
  const profile = useParentProfile(parentId);
  const children = useParentChildren(parentId);
  const summary = useParentDashboardSummary(parentId);
  const unreadCount = useUnreadCount(parentId);
  const overduePayments = useOverduePayments(parentId);

  return {
    profile,
    children,
    summary,
    unreadCount,
    overduePayments,
    isLoading: profile.isLoading || children.isLoading || summary.isLoading,
    isError: profile.isError || children.isError || summary.isError,
  };
}

/**
 * Get all insights data for a parent
 */
export function useAllInsights(parentId: string, studentId?: string) {
  const insights = useAIInsights(parentId, { studentId });
  const risks = useRiskFactors(parentId, { studentId, activeOnly: true });
  const opportunities = useOpportunities(parentId, { studentId });
  const recommendedActions = useRecommendedActions(parentId, { studentId });

  return {
    insights,
    risks,
    opportunities,
    recommendedActions,
    isLoading: insights.isLoading || risks.isLoading || opportunities.isLoading || recommendedActions.isLoading,
    isError: insights.isError || risks.isError || opportunities.isError || recommendedActions.isError,
  };
}
