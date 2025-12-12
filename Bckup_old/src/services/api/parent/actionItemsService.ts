/**
 * Action Items Service Module
 *
 * This module provides API functions for managing parent action items,
 * creating tasks, updating status, and converting recommended actions.
 */

import { supabase } from '../../supabase/client';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type {
  ParentActionItem,
  ActionItemStatus,
  CommunicationPriority,
} from '../../../types/supabase-parent.types';

/**
 * Get action items for a parent with optional filtering
 * @param parentId - Parent ID
 * @param filters - Optional filters (studentId, status, priority)
 * @returns Promise with array of action items
 * @throws {APIError} For errors
 */
export async function getActionItems(
  parentId: string,
  filters?: {
    studentId?: string;
    status?: ActionItemStatus;
    priority?: CommunicationPriority;
    activeOnly?: boolean;
  }
): Promise<ParentActionItem[]> {
  try {
    let query = supabase
      .from('parent_action_items')
      .select('*')
      .eq('parent_id', parentId)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
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
 * Get a single action item by ID
 * @param itemId - Action item ID
 * @returns Promise with action item
 * @throws {NotFoundError} If action item not found
 * @throws {APIError} For other errors
 */
export async function getActionItemById(itemId: string): Promise<ParentActionItem> {
  try {
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('parent_action_items')
        .select('*')
        .eq('id', itemId)
        .single();
    });

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Action item not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Create a new action item
 * @param parentId - Parent ID
 * @param data - Action item data
 * @returns Promise with created action item
 * @throws {APIError} For errors
 */
export async function createActionItem(
  parentId: string,
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
): Promise<ParentActionItem> {
  try {
    const now = new Date().toISOString();

    const itemData: Partial<ParentActionItem> = {
      parent_id: parentId,
      student_id: data.studentId,
      title: data.title,
      description: data.description,
      action_type: data.actionType,
      priority: data.priority || 'normal',
      due_date: data.dueDate,
      due_time: data.dueTime,
      estimated_duration_minutes: data.estimatedDurationMinutes,
      status: 'pending',
      reminder_enabled: data.reminderEnabled ?? true,
      reminder_before_days: data.reminderBeforeDays || 1,
      reminder_count: 0,
      is_recurring: false,
      is_active: true,
      tags: data.tags,
      related_links: data.relatedLinks,
      communication_id: data.communicationId,
      ai_insight_id: data.aiInsightId,
      recommended_action_id: data.recommendedActionId,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await supabase
      .from('parent_action_items')
      .insert(itemData)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!result) throw new Error('Failed to create action item');

    return result;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Update an action item
 * @param itemId - Action item ID
 * @param updates - Partial action item data to update
 * @returns Promise with updated action item
 * @throws {NotFoundError} If action item not found
 * @throws {APIError} For other errors
 */
export async function updateActionItem(
  itemId: string,
  updates: Partial<Omit<ParentActionItem, 'id' | 'parent_id' | 'created_at' | 'created_by'>>
): Promise<ParentActionItem> {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('parent_action_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Action item not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Mark an action item as completed
 * @param itemId - Action item ID
 * @param notes - Optional completion notes
 * @param proofUrl - Optional proof/evidence URL
 * @returns Promise with updated action item
 * @throws {NotFoundError} If action item not found
 * @throws {APIError} For other errors
 */
export async function completeActionItem(
  itemId: string,
  notes?: string,
  proofUrl?: string
): Promise<ParentActionItem> {
  try {
    const now = new Date().toISOString();

    const updateData: Partial<ParentActionItem> = {
      status: 'completed',
      completed_at: now,
      updated_at: now,
    };

    if (notes) {
      updateData.completion_notes = notes;
    }

    if (proofUrl) {
      updateData.completion_proof_url = proofUrl;
    }

    const { data, error } = await supabase
      .from('parent_action_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Action item not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Dismiss an action item
 * @param itemId - Action item ID
 * @param reason - Reason for dismissal
 * @returns Promise with updated action item
 * @throws {NotFoundError} If action item not found
 * @throws {APIError} For other errors
 */
export async function dismissActionItem(
  itemId: string,
  reason: string
): Promise<ParentActionItem> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('parent_action_items')
      .update({
        status: 'dismissed',
        dismissed_at: now,
        dismissal_reason: reason,
        is_active: false,
        updated_at: now,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Action item not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Create an action item from a recommended action
 * @param recommendedActionId - Recommended action ID
 * @param customDueDate - Optional custom due date (overrides recommended date)
 * @returns Promise with created action item
 * @throws {NotFoundError} If recommended action not found
 * @throws {APIError} For other errors
 */
export async function createFromRecommendation(
  recommendedActionId: string,
  customDueDate?: string
): Promise<ParentActionItem> {
  try {
    // Fetch the recommended action
    const { data: recommendation, error: fetchError } = await supabase
      .from('recommended_actions')
      .select('*')
      .eq('id', recommendedActionId)
      .single();

    if (fetchError) throw parseSupabaseError(fetchError);
    if (!recommendation) throw new NotFoundError('Recommended action not found');

    const now = new Date().toISOString();

    // Create action item from recommendation
    const itemData: Partial<ParentActionItem> = {
      parent_id: recommendation.parent_id,
      student_id: recommendation.student_id,
      recommended_action_id: recommendedActionId,
      ai_insight_id: recommendation.ai_insight_id,
      title: recommendation.title,
      description: recommendation.description,
      action_type: recommendation.action_type,
      priority: recommendation.priority,
      due_date: customDueDate || recommendation.recommended_by_date,
      estimated_duration_minutes: recommendation.estimated_duration_minutes,
      status: 'pending',
      reminder_enabled: true,
      reminder_before_days: 1,
      reminder_count: 0,
      is_recurring: false,
      is_active: true,
      related_links: recommendation.helpful_links,
      attached_files: recommendation.attached_documents,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error: insertError } = await supabase
      .from('parent_action_items')
      .insert(itemData)
      .select()
      .single();

    if (insertError) throw parseSupabaseError(insertError);
    if (!result) throw new Error('Failed to create action item from recommendation');

    // Update the recommended action to mark as acted upon
    await supabase
      .from('recommended_actions')
      .update({
        status: 'in_progress',
        started_at: now,
        action_taken: true,
        action_taken_at: now,
        updated_at: now,
      })
      .eq('id', recommendedActionId);

    return result;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}
