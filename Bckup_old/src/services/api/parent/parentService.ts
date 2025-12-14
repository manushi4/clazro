/**
 * Parent Service Module
 *
 * This module provides API functions for parent-related operations including
 * profile management, children information, and dashboard summary.
 *
 * Updated to use production backend services
 */

import { supabase } from '../../../lib/supabase';
import { parseSupabaseError, retryWithBackoff, NotFoundError } from '../errorHandler';
import type {
  Parent,
  ParentDashboardSummary,
  ChildInfo,
  APIResponse,
} from '../../../types/supabase-parent.types';

// Import backend services
import {
  getParentDashboard as getBackendParentDashboard,
  getParentById,
  getChildrenSummary as getBackendChildrenSummary,
  getActionItems,
  getAIInsights,
  getFinancialSummary,
} from '../../backend/parent/parentDashboardService';
import {
  getFees,
  getFeeBalance,
  getPaymentHistory,
} from '../../backend/parent/parentFinancialService';

/**
 * Get parent profile by parent ID
 * Now uses backend service for optimized data fetching
 * @param parentId - Parent ID
 * @returns Promise with parent profile data
 * @throws {NotFoundError} If parent not found
 * @throws {APIError} For other errors
 */
export async function getParentProfile(parentId: string): Promise<Parent> {
  try {
    const data = await getParentById(parentId);

    if (!data) throw new NotFoundError('Parent profile not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Update parent profile
 * @param parentId - Parent ID
 * @param updates - Partial parent data to update
 * @returns Promise with updated parent profile
 * @throws {NotFoundError} If parent not found
 * @throws {ValidationError} If update data is invalid
 * @throws {APIError} For other errors
 */
export async function updateParentProfile(
  parentId: string,
  updates: Partial<Omit<Parent, 'id' | 'parent_id' | 'created_at' | 'created_by'>>
): Promise<Parent> {
  try {
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('parents')
      .update(updateData)
      .eq('parent_id', parentId)
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    if (!data) throw new NotFoundError('Parent profile not found');

    return data;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get all children associated with a parent
 * Now uses backend service with enhanced student data
 * @param parentId - Parent ID
 * @returns Promise with array of child information
 * @throws {APIError} For errors
 */
export async function getParentChildren(parentId: string): Promise<ChildInfo[]> {
  try {
    const childrenSummary = await getBackendChildrenSummary(parentId);

    // Transform backend data to match existing ChildInfo type
    return childrenSummary.map(child => ({
      ...child.student,
      academic_performance: child.academic_performance,
      attendance: child.attendance,
      pending_assignments: child.pending_assignments,
      recent_grades: child.recent_grades,
    }));
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Get parent dashboard summary with aggregated counts
 * Now uses backend service with comprehensive dashboard data
 * @param parentId - Parent ID
 * @returns Promise with dashboard summary data
 * @throws {APIError} For errors
 */
export async function getParentDashboardSummary(parentId: string): Promise<ParentDashboardSummary> {
  try {
    const dashboard = await getBackendParentDashboard(parentId);

    // Transform to match existing type structure
    return {
      parent_id: parentId,
      total_children: dashboard.children.length,
      unread_messages: dashboard.recent_communications.length,
      pending_actions: dashboard.action_items.filter(item => item.status === 'pending').length,
      active_insights: dashboard.ai_insights.length,
      critical_risks: dashboard.ai_insights.filter(insight => insight.insight_type === 'critical_risk').length,
    };
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Update parent notification preferences
 * @param parentId - Parent ID
 * @param preferences - Notification preferences to update
 * @returns Promise with updated parent profile
 * @throws {APIError} For errors
 */
export async function updateNotificationPreferences(
  parentId: string,
  preferences: {
    ai_insights_enabled?: boolean;
    weekly_report_enabled?: boolean;
    alert_notifications_enabled?: boolean;
    payment_reminder_enabled?: boolean;
    payment_reminder_days_before?: number;
    preferred_communication_method?: 'in_app' | 'email' | 'sms' | 'push';
  }
): Promise<Parent> {
  return updateParentProfile(parentId, preferences);
}

/**
 * Complete parent onboarding
 * @param parentId - Parent ID
 * @returns Promise with updated parent profile
 * @throws {APIError} For errors
 */
export async function completeOnboarding(parentId: string): Promise<Parent> {
  return updateParentProfile(parentId, {
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  });
}

/**
 * Update parent's last login timestamp
 * @param parentId - Parent ID
 * @returns Promise with updated parent profile
 * @throws {APIError} For errors
 */
export async function updateLastLogin(parentId: string): Promise<Parent> {
  return updateParentProfile(parentId, {
    last_login_at: new Date().toISOString(),
  });
}

/**
 * Check if parent exists
 * @param parentId - Parent ID
 * @returns Promise with boolean indicating if parent exists
 */
export async function parentExists(parentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('parents')
      .select('parent_id')
      .eq('parent_id', parentId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get parent profile completion percentage
 * @param parentId - Parent ID
 * @returns Promise with completion percentage (0-100)
 * @throws {APIError} For errors
 */
export async function getProfileCompletionPercentage(parentId: string): Promise<number> {
  try {
    const profile = await getParentProfile(parentId);
    return profile.profile_completion_percentage || 0;
  } catch (error) {
    throw parseSupabaseError(error);
  }
}

/**
 * Accept terms and privacy policy
 * @param parentId - Parent ID
 * @returns Promise with updated parent profile
 * @throws {APIError} For errors
 */
export async function acceptTermsAndPrivacy(parentId: string): Promise<Parent> {
  return updateParentProfile(parentId, {
    terms_accepted_at: new Date().toISOString(),
    privacy_policy_accepted_at: new Date().toISOString(),
  });
}
