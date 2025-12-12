/**
 * Student API Hooks
 * React Query hooks for student-related data fetching and mutations
 *
 * This module provides hooks for:
 * - Student dashboard and profile data
 * - Assignment viewing and submissions
 * - Academic progress tracking
 * - AI study assistant features
 *
 * All hooks use React Query for automatic caching, background refetching,
 * and optimistic updates.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';

// Import backend services
import {
  getStudentDashboard,
  getStudentById,
  getUpcomingAssignments,
  getPendingAssignmentCount,
  getRecentGrades,
  getAttendanceSummary,
  getAttendanceByDateRange,
  getAcademicPerformance,
  getUpcomingClasses,
  getPastClassRecordings,
  getStudentStats,
} from '../../services/backend/student/studentDashboardService';

import {
  getAssignmentById,
  getStudentAssignments,
  getAssignmentQuestions,
  getSubmission,
  getStudentSubmissions,
  submitAssignment,
  updateSubmission,
  deleteSubmission,
  getSubmissionStats,
  isAssignmentOverdue,
  getUpcomingDeadlines,
  getOverdueAssignments,
} from '../../services/backend/student/studentAssignmentService';

import {
  getStudentProgress,
  getSubjectWiseProgress,
  getProgressTimeline,
  predictPerformance,
} from '../../services/backend/student/studentProgressService';

import {
  getStudyPlans,
  getStudyPlanById,
  createStudyPlan,
  updateStudyPlan,
  updateStudyPlanProgress,
  deleteStudyPlan,
  getActiveStudyPlans,
  getLearningAnalytics,
  generateLearningAnalytics,
  updateLearningStyle,
  getAIRecommendations,
  createAIRecommendation,
  markRecommendationCompleted,
  skipRecommendation,
  generatePersonalizedRecommendations,
} from '../../services/backend/student/aiStudyAssistantService';

import type {
  StudentDashboard,
  Student,
  Assignment,
  Grade,
  AttendanceSummary,
  AcademicPerformance,
  LiveSession,
  AssignmentSubmission,
  StudentProgress,
  ProgressFilters,
  StudyPlan,
  CreateStudyPlanInput,
  UpdateStudyPlanInput,
  LearningAnalytics,
  UpdateLearningStyleInput,
  AIRecommendation,
  RecommendationFilters,
  CreateRecommendationInput,
} from '../../types/database/student';

// ==================== DASHBOARD HOOKS ====================

/**
 * Hook to fetch complete student dashboard data
 * Includes: profile, attendance, assignments, grades, classes, AI insights
 *
 * @param studentId - The student UUID
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with dashboard data
 */
export function useStudentDashboard(
  studentId: string,
  enabled: boolean = true
): UseQueryResult<StudentDashboard, Error> {
  return useQuery({
    queryKey: ['studentDashboard', studentId],
    queryFn: () => getStudentDashboard(studentId),
    enabled: enabled && !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch student profile by ID
 *
 * @param studentId - The student UUID
 * @returns Query result with student profile
 */
export function useStudent(studentId: string): UseQueryResult<Student | null, Error> {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudentById(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch student statistics summary
 *
 * @param studentId - The student UUID
 * @returns Query result with student stats
 */
export function useStudentStats(studentId: string): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['studentStats', studentId],
    queryFn: () => getStudentStats(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== ASSIGNMENT HOOKS ====================

/**
 * Hook to fetch upcoming assignments for a student
 *
 * @param studentId - The student UUID
 * @param limit - Maximum number of assignments to return
 * @returns Query result with upcoming assignments
 */
export function useUpcomingAssignments(
  studentId: string,
  limit: number = 10
): UseQueryResult<Assignment[], Error> {
  return useQuery({
    queryKey: ['upcomingAssignments', studentId, limit],
    queryFn: () => getUpcomingAssignments(studentId, limit),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all assignments for a student's class
 *
 * @param studentId - The student UUID
 * @param filters - Optional filters (status, subject, type)
 * @returns Query result with assignments
 */
export function useStudentAssignments(
  studentId: string,
  filters?: {
    status?: 'draft' | 'published' | 'archived';
    subject?: string;
    assignment_type?: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  }
): UseQueryResult<Assignment[], Error> {
  return useQuery({
    queryKey: ['studentAssignments', studentId, filters],
    queryFn: () => getStudentAssignments(studentId, filters),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a specific assignment by ID
 *
 * @param assignmentId - The assignment UUID
 * @returns Query result with assignment details
 */
export function useAssignment(assignmentId: string): UseQueryResult<Assignment | null, Error> {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignmentById(assignmentId),
    enabled: !!assignmentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch assignment questions
 *
 * @param assignmentId - The assignment UUID
 * @returns Query result with assignment questions
 */
export function useAssignmentQuestions(assignmentId: string): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['assignmentQuestions', assignmentId],
    queryFn: () => getAssignmentQuestions(assignmentId),
    enabled: !!assignmentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch pending assignment count
 *
 * @param studentId - The student UUID
 * @returns Query result with pending count
 */
export function usePendingAssignmentCount(studentId: string): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ['pendingAssignmentCount', studentId],
    queryFn: () => getPendingAssignmentCount(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch upcoming assignment deadlines
 *
 * @param studentId - The student UUID
 * @param days - Number of days to look ahead (default: 7)
 * @returns Query result with upcoming deadlines
 */
export function useUpcomingDeadlines(
  studentId: string,
  days: number = 7
): UseQueryResult<Assignment[], Error> {
  return useQuery({
    queryKey: ['upcomingDeadlines', studentId, days],
    queryFn: () => getUpcomingDeadlines(studentId, days),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch overdue assignments (not submitted)
 *
 * @param studentId - The student UUID
 * @returns Query result with overdue assignments
 */
export function useOverdueAssignments(studentId: string): UseQueryResult<Assignment[], Error> {
  return useQuery({
    queryKey: ['overdueAssignments', studentId],
    queryFn: () => getOverdueAssignments(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== SUBMISSION HOOKS ====================

/**
 * Hook to fetch student's submission for a specific assignment
 *
 * @param assignmentId - The assignment UUID
 * @param studentId - The student UUID
 * @returns Query result with submission data
 */
export function useSubmission(
  assignmentId: string,
  studentId: string
): UseQueryResult<AssignmentSubmission | null, Error> {
  return useQuery({
    queryKey: ['submission', assignmentId, studentId],
    queryFn: () => getSubmission(assignmentId, studentId),
    enabled: !!assignmentId && !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all submissions by a student
 *
 * @param studentId - The student UUID
 * @param filters - Optional filters (status, assignment_id)
 * @returns Query result with submissions
 */
export function useStudentSubmissions(
  studentId: string,
  filters?: {
    status?: 'pending' | 'submitted' | 'graded' | 'late';
    assignment_id?: string;
  }
): UseQueryResult<AssignmentSubmission[], Error> {
  return useQuery({
    queryKey: ['studentSubmissions', studentId, filters],
    queryFn: () => getStudentSubmissions(studentId, filters),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch submission statistics for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with submission stats
 */
export function useSubmissionStats(studentId: string): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['submissionStats', studentId],
    queryFn: () => getSubmissionStats(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation hook to submit an assignment
 * Automatically invalidates related queries on success
 */
export function useSubmitAssignment(): UseMutationResult<
  AssignmentSubmission,
  Error,
  {
    assignment_id: string;
    student_id: string;
    submission_text?: string;
    attachment_urls?: string[];
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAssignment,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submission', variables.assignment_id, variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['submissionStats', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['pendingAssignmentCount', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeadlines', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['overdueAssignments', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.student_id] });
    },
  });
}

/**
 * Mutation hook to update an existing submission
 * Automatically invalidates related queries on success
 */
export function useUpdateSubmission(): UseMutationResult<
  AssignmentSubmission,
  Error,
  {
    submissionId: string;
    studentId: string;
    updates: {
      submission_text?: string;
      attachment_urls?: string[];
    };
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, updates }) => updateSubmission(submissionId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission'] });
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to delete a submission
 * Automatically invalidates related queries on success
 */
export function useDeleteSubmission(): UseMutationResult<
  void,
  Error,
  { submissionId: string; studentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId }) => deleteSubmission(submissionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission'] });
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['submissionStats', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

// ==================== GRADES & ATTENDANCE HOOKS ====================

/**
 * Hook to fetch recent grades for a student
 *
 * @param studentId - The student UUID
 * @param limit - Maximum number of grades to return
 * @returns Query result with recent grades
 */
export function useRecentGrades(
  studentId: string,
  limit: number = 10
): UseQueryResult<Grade[], Error> {
  return useQuery({
    queryKey: ['recentGrades', studentId, limit],
    queryFn: () => getRecentGrades(studentId, limit),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch attendance summary for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with attendance summary
 */
export function useAttendanceSummary(studentId: string): UseQueryResult<AttendanceSummary, Error> {
  return useQuery({
    queryKey: ['attendanceSummary', studentId],
    queryFn: () => getAttendanceSummary(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch attendance records for a date range
 *
 * @param studentId - The student UUID
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Query result with attendance records
 */
export function useAttendanceByDateRange(
  studentId: string,
  startDate: string,
  endDate: string
): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['attendanceByDateRange', studentId, startDate, endDate],
    queryFn: () => getAttendanceByDateRange(studentId, startDate, endDate),
    enabled: !!studentId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch academic performance summary
 *
 * @param studentId - The student UUID
 * @returns Query result with academic performance
 */
export function useAcademicPerformance(studentId: string): UseQueryResult<AcademicPerformance, Error> {
  return useQuery({
    queryKey: ['academicPerformance', studentId],
    queryFn: () => getAcademicPerformance(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== LIVE CLASSES HOOKS ====================

/**
 * Hook to fetch upcoming live classes
 *
 * @param studentId - The student UUID
 * @param limit - Maximum number of classes to return
 * @returns Query result with upcoming classes
 */
export function useUpcomingClasses(
  studentId: string,
  limit: number = 5
): UseQueryResult<LiveSession[], Error> {
  return useQuery({
    queryKey: ['upcomingClasses', studentId, limit],
    queryFn: () => getUpcomingClasses(studentId, limit),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch past class recordings
 *
 * @param studentId - The student UUID
 * @param limit - Maximum number of recordings to return
 * @returns Query result with past class recordings
 */
export function usePastClassRecordings(
  studentId: string,
  limit: number = 10
): UseQueryResult<LiveSession[], Error> {
  return useQuery({
    queryKey: ['pastClassRecordings', studentId, limit],
    queryFn: () => getPastClassRecordings(studentId, limit),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== PROGRESS TRACKING HOOKS ====================

/**
 * Hook to fetch overall student progress
 *
 * @param studentId - The student UUID
 * @param filters - Optional filters (subject, date range)
 * @returns Query result with student progress
 */
export function useStudentProgress(
  studentId: string,
  filters?: ProgressFilters
): UseQueryResult<StudentProgress, Error> {
  return useQuery({
    queryKey: ['studentProgress', studentId, filters],
    queryFn: () => getStudentProgress(studentId, filters),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch subject-wise progress breakdown
 *
 * @param studentId - The student UUID
 * @returns Query result with subject-wise progress
 */
export function useSubjectWiseProgress(studentId: string): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['subjectWiseProgress', studentId],
    queryFn: () => getSubjectWiseProgress(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch progress over time (weekly/monthly)
 *
 * @param studentId - The student UUID
 * @param period - 'weekly' | 'monthly'
 * @param count - Number of periods to retrieve
 * @returns Query result with progress timeline
 */
export function useProgressTimeline(
  studentId: string,
  period: 'weekly' | 'monthly',
  count: number = 12
): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['progressTimeline', studentId, period, count],
    queryFn: () => getProgressTimeline(studentId, period, count),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch performance prediction
 *
 * @param studentId - The student UUID
 * @returns Query result with performance prediction
 */
export function usePerformancePrediction(studentId: string): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['performancePrediction', studentId],
    queryFn: () => predictPerformance(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// ==================== AI STUDY ASSISTANT HOOKS ====================

/**
 * Hook to fetch all study plans for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with study plans
 */
export function useStudyPlans(studentId: string): UseQueryResult<StudyPlan[], Error> {
  return useQuery({
    queryKey: ['studyPlans', studentId],
    queryFn: () => getStudyPlans(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch active study plans for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with active study plans
 */
export function useActiveStudyPlans(studentId: string): UseQueryResult<StudyPlan[], Error> {
  return useQuery({
    queryKey: ['activeStudyPlans', studentId],
    queryFn: () => getActiveStudyPlans(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a specific study plan by ID
 *
 * @param planId - The study plan UUID
 * @returns Query result with study plan
 */
export function useStudyPlan(planId: string): UseQueryResult<StudyPlan | null, Error> {
  return useQuery({
    queryKey: ['studyPlan', planId],
    queryFn: () => getStudyPlanById(planId),
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation hook to create a new study plan
 */
export function useCreateStudyPlan(): UseMutationResult<
  StudyPlan,
  Error,
  CreateStudyPlanInput & { studentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, ...planData }) => createStudyPlan(planData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['activeStudyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to update a study plan
 */
export function useUpdateStudyPlan(): UseMutationResult<
  StudyPlan,
  Error,
  { planId: string; studentId: string; updates: UpdateStudyPlanInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, updates }) => updateStudyPlan(planId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['studyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['activeStudyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to update study plan progress
 */
export function useUpdateStudyPlanProgress(): UseMutationResult<
  StudyPlan,
  Error,
  { planId: string; studentId: string; progress: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, progress }) => updateStudyPlanProgress(planId, progress),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['studyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['activeStudyPlans', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to delete a study plan
 */
export function useDeleteStudyPlan(): UseMutationResult<
  void,
  Error,
  { planId: string; studentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }) => deleteStudyPlan(planId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['activeStudyPlans', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Hook to fetch learning analytics for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with learning analytics
 */
export function useLearningAnalytics(studentId: string): UseQueryResult<LearningAnalytics | null, Error> {
  return useQuery({
    queryKey: ['learningAnalytics', studentId],
    queryFn: () => getLearningAnalytics(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Mutation hook to generate/create learning analytics
 */
export function useGenerateLearningAnalytics(): UseMutationResult<
  LearningAnalytics,
  Error,
  { studentId: string; analyticsData?: Partial<LearningAnalytics> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, analyticsData }) => generateLearningAnalytics(studentId, analyticsData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learningAnalytics', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to update learning style
 */
export function useUpdateLearningStyle(): UseMutationResult<
  LearningAnalytics,
  Error,
  { studentId: string; styleData: UpdateLearningStyleInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, styleData }) => updateLearningStyle(studentId, styleData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learningAnalytics', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Hook to fetch AI recommendations for a student
 *
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Query result with AI recommendations
 */
export function useAIRecommendations(
  studentId: string,
  filters?: RecommendationFilters
): UseQueryResult<AIRecommendation[], Error> {
  return useQuery({
    queryKey: ['aiRecommendations', studentId, filters],
    queryFn: () => getAIRecommendations(studentId, filters),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch personalized recommendations for a student
 *
 * @param studentId - The student UUID
 * @returns Query result with personalized recommendations
 */
export function usePersonalizedRecommendations(studentId: string): UseQueryResult<AIRecommendation[], Error> {
  return useQuery({
    queryKey: ['personalizedRecommendations', studentId],
    queryFn: () => generatePersonalizedRecommendations(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Mutation hook to create an AI recommendation
 */
export function useCreateAIRecommendation(): UseMutationResult<
  AIRecommendation,
  Error,
  CreateRecommendationInput & { studentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, ...recommendationData }) => createAIRecommendation(recommendationData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['personalizedRecommendations', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to mark a recommendation as completed
 */
export function useMarkRecommendationCompleted(): UseMutationResult<
  AIRecommendation,
  Error,
  { recommendationId: string; studentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId }) => markRecommendationCompleted(recommendationId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['personalizedRecommendations', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard', variables.studentId] });
    },
  });
}

/**
 * Mutation hook to skip a recommendation
 */
export function useSkipRecommendation(): UseMutationResult<
  void,
  Error,
  { recommendationId: string; studentId: string; reason?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, reason }) => skipRecommendation(recommendationId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['personalizedRecommendations', variables.studentId] });
    },
  });
}

// ==================== SUMMARY ====================

/**
 * Total hooks created: 40+
 *
 * Dashboard Hooks (3):
 * - useStudentDashboard
 * - useStudent
 * - useStudentStats
 *
 * Assignment Hooks (7):
 * - useUpcomingAssignments
 * - useStudentAssignments
 * - useAssignment
 * - useAssignmentQuestions
 * - usePendingAssignmentCount
 * - useUpcomingDeadlines
 * - useOverdueAssignments
 *
 * Submission Hooks (6):
 * - useSubmission
 * - useStudentSubmissions
 * - useSubmissionStats
 * - useSubmitAssignment (mutation)
 * - useUpdateSubmission (mutation)
 * - useDeleteSubmission (mutation)
 *
 * Grades & Attendance Hooks (4):
 * - useRecentGrades
 * - useAttendanceSummary
 * - useAttendanceByDateRange
 * - useAcademicPerformance
 *
 * Live Classes Hooks (2):
 * - useUpcomingClasses
 * - usePastClassRecordings
 *
 * Progress Tracking Hooks (4):
 * - useStudentProgress
 * - useSubjectWiseProgress
 * - useProgressTimeline
 * - usePerformancePrediction
 *
 * AI Study Assistant Hooks (14):
 * - useStudyPlans
 * - useActiveStudyPlans
 * - useStudyPlan
 * - useCreateStudyPlan (mutation)
 * - useUpdateStudyPlan (mutation)
 * - useUpdateStudyPlanProgress (mutation)
 * - useDeleteStudyPlan (mutation)
 * - useLearningAnalytics
 * - useGenerateLearningAnalytics (mutation)
 * - useUpdateLearningStyle (mutation)
 * - useAIRecommendations
 * - usePersonalizedRecommendations
 * - useCreateAIRecommendation (mutation)
 * - useMarkRecommendationCompleted (mutation)
 * - useSkipRecommendation (mutation)
 */
