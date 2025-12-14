/**
 * Insights Service Module
 *
 * This module provides API functions for AI insights, risk factors, opportunities,
 * behavior trends, academic predictions, and recommended actions.
 */

import { supabase } from '../../supabase/client';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type {
  AIInsight,
  RiskFactor,
  Opportunity,
  BehaviorTrend,
  AcademicPrediction,
  RecommendedAction,
  AIInsightCategory,
  AIInsightSeverity,
  ActionItemStatus,
} from '../../../types/supabase-parent.types';

// ============================================================================
// AI INSIGHTS
// ============================================================================

/**
 * Get AI insights for a parent with optional filtering
 * @param parentId - Parent ID
 * @param filters - Optional filters (studentId, category, severity)
 * @returns Promise with array of AI insights
 * @throws {APIError} For errors
 */
export async function getAIInsights(
  parentId: string,
  filters?: {
    studentId?: string;
    category?: AIInsightCategory;
    severity?: AIInsightSeverity;
    unviewedOnly?: boolean;
    requiresAction?: boolean;
  }
): Promise<AIInsight[]> {
  try {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.category) {
      query = query.eq('insight_category', filters.category);
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.unviewedOnly) {
      query = query.eq('viewed_by_parent', false);
    }

    if (filters?.requiresAction) {
      query = query.eq('requires_action', true);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get a single AI insight by ID
 * @param insightId - AI Insight ID
 * @returns Promise with AI insight
 * @throws {NotFoundError} If insight not found
 * @throws {APIError} For other errors
 */
export async function getInsightById(insightId: string): Promise<AIInsight> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('ai_insights')
        .select('*')
        .eq('id', insightId)
        .single();
    });

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('AI insight not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Mark an AI insight as viewed/acknowledged
 * @param insightId - AI Insight ID
 * @returns Promise with updated AI insight
 * @throws {NotFoundError} If insight not found
 * @throws {APIError} For other errors
 */
export async function acknowledgeInsight(insightId: string): Promise<AIInsight> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('ai_insights')
      .update({
        viewed_by_parent: true,
        viewed_at: now,
        parent_acknowledged: true,
        parent_acknowledged_at: now,
        updated_at: now,
      })
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('AI insight not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Rate an AI insight and provide feedback
 * @param insightId - AI Insight ID
 * @param rating - Rating (1-5)
 * @param feedback - Optional text feedback
 * @returns Promise with updated AI insight
 * @throws {NotFoundError} If insight not found
 * @throws {APIError} For other errors
 */
export async function rateInsight(
  insightId: string,
  rating: number,
  feedback?: string
): Promise<AIInsight> {
  try {
    // Validate rating range
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updateData: Partial<AIInsight> = {
      parent_rating: rating,
      updated_at: new Date().toISOString(),
    };

    if (feedback) {
      updateData.parent_feedback = feedback;
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .update(updateData)
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('AI insight not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// RISK FACTORS
// ============================================================================

/**
 * Get risk factors for a parent
 * @param parentId - Parent ID
 * @param studentId - Optional student ID filter
 * @param activeOnly - Only return active/unresolved risks
 * @returns Promise with array of risk factors
 * @throws {APIError} For errors
 */
export async function getRiskFactors(
  parentId: string,
  studentId?: string,
  activeOnly: boolean = true
): Promise<RiskFactor[]> {
  try {
    let query = supabase
      .from('risk_factors')
      .select('*')
      .eq('parent_id', parentId)
      .order('risk_score', { ascending: false })
      .order('last_detected_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true).eq('is_resolved', false);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Acknowledge a risk factor
 * @param riskId - Risk Factor ID
 * @param comments - Optional parent comments
 * @returns Promise with updated risk factor
 * @throws {NotFoundError} If risk not found
 * @throws {APIError} For other errors
 */
export async function acknowledgeRisk(
  riskId: string,
  comments?: string
): Promise<RiskFactor> {
  try {
    const now = new Date().toISOString();

    const updateData: Partial<RiskFactor> = {
      parent_acknowledged: true,
      parent_acknowledged_at: now,
      updated_at: now,
    };

    if (comments) {
      updateData.parent_comments = comments;
    }

    const { data, error } = await supabase
      .from('risk_factors')
      .update(updateData)
      .eq('id', riskId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Risk factor not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// OPPORTUNITIES
// ============================================================================

/**
 * Get opportunities for a parent
 * @param parentId - Parent ID
 * @param studentId - Optional student ID filter
 * @param status - Optional status filter
 * @returns Promise with array of opportunities
 * @throws {APIError} For errors
 */
export async function getOpportunities(
  parentId: string,
  studentId?: string,
  status?: ActionItemStatus
): Promise<Opportunity[]> {
  try {
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('opportunity_score', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Express interest in an opportunity
 * @param opportunityId - Opportunity ID
 * @param interested - Whether parent is interested
 * @param comments - Optional parent comments
 * @returns Promise with updated opportunity
 * @throws {NotFoundError} If opportunity not found
 * @throws {APIError} For other errors
 */
export async function expressInterest(
  opportunityId: string,
  interested: boolean,
  comments?: string
): Promise<Opportunity> {
  try {
    const now = new Date().toISOString();

    const updateData: Partial<Opportunity> = {
      parent_interested: interested,
      parent_interested_at: now,
      updated_at: now,
    };

    if (comments) {
      updateData.parent_comments = comments;
    }

    if (interested) {
      updateData.status = 'in_progress';
      updateData.pursued = true;
      updateData.pursued_at = now;
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Opportunity not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// BEHAVIOR TRENDS
// ============================================================================

/**
 * Get behavior trends for a student
 * @param studentId - Student ID
 * @param category - Optional behavior category filter
 * @returns Promise with array of behavior trends
 * @throws {APIError} For errors
 */
export async function getBehaviorTrends(
  studentId: string,
  category?: string
): Promise<BehaviorTrend[]> {
  try {
    let query = supabase
      .from('behavior_trends')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('period_end', { ascending: false });

    if (category) {
      query = query.eq('behavior_category', category);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// ACADEMIC PREDICTIONS
// ============================================================================

/**
 * Get academic predictions for a student
 * @param studentId - Student ID
 * @param subject - Optional subject filter
 * @returns Promise with array of academic predictions
 * @throws {APIError} For errors
 */
export async function getAcademicPredictions(
  studentId: string,
  subject?: string
): Promise<AcademicPrediction[]> {
  try {
    let query = supabase
      .from('academic_predictions')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .eq('is_outdated', false)
      .order('prediction_date', { ascending: false });

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

// ============================================================================
// RECOMMENDED ACTIONS
// ============================================================================

/**
 * Get recommended actions for a parent
 * @param parentId - Parent ID
 * @param filters - Optional filters (studentId, priority, status)
 * @returns Promise with array of recommended actions
 * @throws {APIError} For errors
 */
export async function getRecommendedActions(
  parentId: string,
  filters?: {
    studentId?: string;
    priority?: 'urgent' | 'high' | 'normal' | 'low';
    status?: ActionItemStatus;
    activeOnly?: boolean;
  }
): Promise<RecommendedAction[]> {
  try {
    let query = supabase
      .from('recommended_actions')
      .select('*')
      .eq('parent_id', parentId)
      .order('priority', { ascending: true })
      .order('recommended_by_date', { ascending: true });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await retryWithBackoff(async () => query);

    if (error) throw parseSupabaseError(error);

    return data || [];
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Update the status of a recommended action
 * @param actionId - Recommended Action ID
 * @param status - New status
 * @param notes - Optional notes
 * @returns Promise with updated recommended action
 * @throws {NotFoundError} If action not found
 * @throws {APIError} For other errors
 */
export async function updateActionStatus(
  actionId: string,
  status: ActionItemStatus,
  notes?: string
): Promise<RecommendedAction> {
  try {
    const now = new Date().toISOString();

    const updateData: Partial<RecommendedAction> = {
      status,
      updated_at: now,
    };

    if (notes) {
      updateData.action_notes = notes;
    }

    // Update specific fields based on status
    if (status === 'in_progress') {
      updateData.started_at = now;
      updateData.action_taken = true;
      updateData.action_taken_at = now;
    } else if (status === 'completed') {
      updateData.completed_at = now;
      updateData.action_taken = true;
      updateData.action_taken_at = updateData.action_taken_at || now;
    } else if (status === 'dismissed') {
      updateData.dismissed_at = now;
      if (notes) {
        updateData.dismissal_reason = notes;
      }
    }

    const { data, error } = await supabase
      .from('recommended_actions')
      .update(updateData)
      .eq('id', actionId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Recommended action not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}
