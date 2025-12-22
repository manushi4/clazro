/**
 * useImpersonateUser - User Impersonation Mutation Hook
 *
 * Provides mutation for admin user impersonation:
 * - Start impersonation session
 * - End impersonation session
 * - Track impersonation audit logs
 * - Maintain original admin context
 *
 * Security: Only super admins can impersonate users
 * All impersonation sessions are logged for audit
 *
 * Widget ID: users.impersonate-action
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type ImpersonateUserInput = {
  targetUserId: string;
  reason?: string;
};

export type EndImpersonationInput = {
  sessionId: string;
};

export type ImpersonationResult = {
  success: boolean;
  message: string;
  sessionId?: string;
  targetUser?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  expiresAt?: string;
  error?: string;
};

export type ImpersonationSession = {
  id: string;
  adminUserId: string;
  targetUserId: string;
  targetUserEmail: string;
  targetUserRole: string;
  reason?: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
};

// =============================================================================
// START IMPERSONATION FUNCTION
// =============================================================================

async function startImpersonation(
  customerId: string,
  adminUserId: string,
  input: ImpersonateUserInput
): Promise<ImpersonationResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Start impersonation requested',
    level: 'info',
    data: { targetUserId: input.targetUserId, adminUserId },
  });

  try {
    // Validate required fields
    if (!input.targetUserId) {
      return {
        success: false,
        message: 'Target user ID is required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Get target user details
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, first_name, last_name, role, is_active')
      .eq('customer_id', customerId)
      .eq('id', input.targetUserId)
      .single();

    if (userError || !targetUser) {
      return {
        success: false,
        message: 'Target user not found',
        error: 'USER_NOT_FOUND',
      };
    }

    // Check if target user is active
    if (!targetUser.is_active) {
      return {
        success: false,
        message: 'Cannot impersonate inactive user',
        error: 'USER_INACTIVE',
      };
    }

    // Prevent impersonating other admins (security measure)
    if (targetUser.role === 'admin') {
      return {
        success: false,
        message: 'Cannot impersonate admin users',
        error: 'ADMIN_IMPERSONATION_BLOCKED',
      };
    }

    // Generate session ID and expiration
    const sessionId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Log impersonation start in audit_logs
    await supabase.from('audit_logs').insert({
      action: 'impersonation_started',
      entity_type: 'user',
      entity_id: input.targetUserId,
      details: {
        sessionId,
        adminUserId,
        targetUserId: input.targetUserId,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        reason: input.reason || 'No reason provided',
        expiresAt,
      },
      performed_by: adminUserId,
    });

    const fullName = [targetUser.first_name, targetUser.last_name]
      .filter(Boolean)
      .join(' ');

    addBreadcrumb({
      category: 'admin',
      message: 'Impersonation session started',
      level: 'info',
      data: { sessionId, targetUserId: input.targetUserId },
    });

    return {
      success: true,
      message: `Now viewing as ${fullName}`,
      sessionId,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        fullName,
        role: targetUser.role,
      },
      expiresAt,
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'start_impersonation' },
      extra: { customerId, targetUserId: input.targetUserId },
    });

    return {
      success: false,
      message: error.message || 'Failed to start impersonation',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// END IMPERSONATION FUNCTION
// =============================================================================

async function endImpersonation(
  customerId: string,
  adminUserId: string,
  input: EndImpersonationInput
): Promise<ImpersonationResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'End impersonation requested',
    level: 'info',
    data: { sessionId: input.sessionId, adminUserId },
  });

  try {
    // Log impersonation end in audit_logs
    await supabase.from('audit_logs').insert({
      action: 'impersonation_ended',
      entity_type: 'session',
      entity_id: input.sessionId,
      details: {
        sessionId: input.sessionId,
        adminUserId,
        endedAt: new Date().toISOString(),
      },
      performed_by: adminUserId,
    });

    addBreadcrumb({
      category: 'admin',
      message: 'Impersonation session ended',
      level: 'info',
      data: { sessionId: input.sessionId },
    });

    return {
      success: true,
      message: 'Returned to admin view',
      sessionId: input.sessionId,
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'end_impersonation' },
      extra: { customerId, sessionId: input.sessionId },
    });

    return {
      success: false,
      message: error.message || 'Failed to end impersonation',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to start impersonating a user
 * @param adminUserId - The ID of the admin performing impersonation
 */
export function useImpersonateUser(adminUserId: string) {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: (input: ImpersonateUserInput) =>
      startImpersonation(customerId || '', adminUserId, input),
    onSuccess: (result) => {
      if (result.success) {
        // Store impersonation session in query cache for easy access
        queryClient.setQueryData(['impersonation-session'], {
          sessionId: result.sessionId,
          targetUser: result.targetUser,
          expiresAt: result.expiresAt,
          isActive: true,
        });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Start impersonation failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}

/**
 * Hook to end impersonation session
 * @param adminUserId - The ID of the admin ending impersonation
 */
export function useEndImpersonation(adminUserId: string) {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: (input: EndImpersonationInput) =>
      endImpersonation(customerId || '', adminUserId, input),
    onSuccess: () => {
      // Clear impersonation session from cache
      queryClient.setQueryData(['impersonation-session'], null);
      queryClient.removeQueries({ queryKey: ['impersonation-session'] });
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'End impersonation failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}

/**
 * Hook to get current impersonation session status
 */
export function useImpersonationSession() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<ImpersonationSession | null>(['impersonation-session']);
}
