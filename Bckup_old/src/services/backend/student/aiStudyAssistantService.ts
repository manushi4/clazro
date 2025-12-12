/**
 * AI Study Assistant Service
 * Manages AI-powered study features for students
 *
 * Database Tables:
 * - study_plans
 * - learning_analytics
 * - ai_recommendations
 */

import { supabase, handleSupabaseError } from '../../../lib/supabaseClient';
import {
  StudyPlan,
  CreateStudyPlanInput,
  UpdateStudyPlanInput,
  LearningAnalytics,
  LearningStyle,
  UpdateLearningStyleInput,
  AIRecommendation,
  RecommendationFilters,
  CreateRecommendationInput,
} from '../../../types/database/student';

// ==================== STUDY PLANS ====================

/**
 * Get all study plans for a student
 * @param studentId - The student UUID
 * @returns Promise<StudyPlan[]>
 */
export async function getStudyPlans(studentId: string): Promise<StudyPlan[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getStudyPlans');
  }

  return data || [];
}

/**
 * Get a specific study plan by ID
 * @param planId - The study plan UUID
 * @returns Promise<StudyPlan | null>
 */
export async function getStudyPlanById(planId: string): Promise<StudyPlan | null> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    handleSupabaseError(error, 'getStudyPlanById');
  }

  return data;
}

/**
 * Create a new study plan
 * @param planData - Study plan creation data
 * @returns Promise<StudyPlan>
 */
export async function createStudyPlan(planData: CreateStudyPlanInput): Promise<StudyPlan> {
  const { data, error } = await supabase
    .from('study_plans')
    .insert({
      ...planData,
      progress: 0,
      status: 'active',
      ai_generated: planData.ai_generated ?? false,
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'createStudyPlan');
  }

  return data;
}

/**
 * Update a study plan
 * @param planId - The study plan UUID
 * @param updates - Fields to update
 * @returns Promise<StudyPlan>
 */
export async function updateStudyPlan(
  planId: string,
  updates: UpdateStudyPlanInput
): Promise<StudyPlan> {
  const { data, error } = await supabase
    .from('study_plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateStudyPlan');
  }

  return data;
}

/**
 * Update study plan progress
 * @param planId - The study plan UUID
 * @param progress - Progress percentage (0-100)
 * @returns Promise<StudyPlan>
 */
export async function updateStudyPlanProgress(
  planId: string,
  progress: number
): Promise<StudyPlan> {
  if (progress < 0 || progress > 100) {
    throw new Error('Progress must be between 0 and 100');
  }

  const status = progress === 100 ? 'completed' : 'active';

  const { data, error } = await supabase
    .from('study_plans')
    .update({
      progress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateStudyPlanProgress');
  }

  return data;
}

/**
 * Delete a study plan
 * @param planId - The study plan UUID
 * @returns Promise<void>
 */
export async function deleteStudyPlan(planId: string): Promise<void> {
  const { error } = await supabase.from('study_plans').delete().eq('id', planId);

  if (error) {
    handleSupabaseError(error, 'deleteStudyPlan');
  }
}

/**
 * Get active study plans for a student
 * @param studentId - The student UUID
 * @returns Promise<StudyPlan[]>
 */
export async function getActiveStudyPlans(studentId: string): Promise<StudyPlan[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getActiveStudyPlans');
  }

  return data || [];
}

// ==================== LEARNING ANALYTICS ====================

/**
 * Get learning analytics for a student
 * @param studentId - The student UUID
 * @returns Promise<LearningAnalytics | null>
 */
export async function getLearningAnalytics(studentId: string): Promise<LearningAnalytics | null> {
  const { data, error } = await supabase
    .from('learning_analytics')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    handleSupabaseError(error, 'getLearningAnalytics');
  }

  return data;
}

/**
 * Generate/Create learning analytics for a student
 * @param studentId - The student UUID
 * @param analyticsData - Optional initial analytics data
 * @returns Promise<LearningAnalytics>
 */
export async function generateLearningAnalytics(
  studentId: string,
  analyticsData?: Partial<LearningAnalytics>
): Promise<LearningAnalytics> {
  const { data, error } = await supabase
    .from('learning_analytics')
    .insert({
      student_id: studentId,
      learning_style: analyticsData?.learning_style || 'mixed',
      style_percentage: analyticsData?.style_percentage || 0,
      strengths: analyticsData?.strengths || {},
      weaknesses: analyticsData?.weaknesses || {},
      recommendations: analyticsData?.recommendations || {},
      last_analyzed: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'generateLearningAnalytics');
  }

  return data;
}

/**
 * Update learning style for a student
 * @param studentId - The student UUID
 * @param styleData - Learning style update data
 * @returns Promise<LearningAnalytics>
 */
export async function updateLearningStyle(
  studentId: string,
  styleData: UpdateLearningStyleInput
): Promise<LearningAnalytics> {
  const { data, error } = await supabase
    .from('learning_analytics')
    .update({
      ...styleData,
      last_analyzed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateLearningStyle');
  }

  return data;
}

// ==================== AI RECOMMENDATIONS ====================

/**
 * Get AI recommendations for a student
 * @param studentId - The student UUID
 * @param filters - Optional filters
 * @returns Promise<AIRecommendation[]>
 */
export async function getAIRecommendations(
  studentId: string,
  filters?: RecommendationFilters
): Promise<AIRecommendation[]> {
  let query = supabase
    .from('ai_recommendations')
    .select('*')
    .eq('student_id', studentId);

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.subject_id) {
    query = query.eq('subject_id', filters.subject_id);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.completion_status) {
    query = query.eq('completion_status', filters.completion_status);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getAIRecommendations');
  }

  return data || [];
}

/**
 * Create a new AI recommendation
 * @param recommendationData - Recommendation data
 * @returns Promise<AIRecommendation>
 */
export async function createAIRecommendation(
  recommendationData: CreateRecommendationInput
): Promise<AIRecommendation> {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .insert({
      ...recommendationData,
      completion_status: 'pending',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'createAIRecommendation');
  }

  return data;
}

/**
 * Mark a recommendation as completed
 * @param recommendationId - The recommendation UUID
 * @returns Promise<AIRecommendation>
 */
export async function markRecommendationCompleted(
  recommendationId: string
): Promise<AIRecommendation> {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .update({
      completion_status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'markRecommendationCompleted');
  }

  return data;
}

/**
 * Skip a recommendation
 * @param recommendationId - The recommendation UUID
 * @param reason - Optional reason for skipping
 * @returns Promise<void>
 */
export async function skipRecommendation(
  recommendationId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_recommendations')
    .update({
      completion_status: 'skipped',
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId);

  if (error) {
    handleSupabaseError(error, 'skipRecommendation');
  }
}

/**
 * Generate personalized recommendations for a student
 * This is a placeholder for AI-powered recommendation generation
 * In production, this would integrate with an AI service
 * @param studentId - The student UUID
 * @returns Promise<AIRecommendation[]>
 */
export async function generatePersonalizedRecommendations(
  studentId: string
): Promise<AIRecommendation[]> {
  // TODO: Implement AI-powered recommendation generation
  // For now, return active recommendations
  return getAIRecommendations(studentId, {
    status: 'active',
    completion_status: 'pending',
  });
}
