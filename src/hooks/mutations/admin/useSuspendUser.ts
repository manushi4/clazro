/**
 * useSuspendUser - Suspend/Unsuspend User Mutation Hook
 *
 * Provides mutations for suspending and unsuspending users:
 * - Suspend user with reason
 * - Unsuspend user
 * - Logs action to audit_logs table
 *
 * Widget ID: users.suspend-action
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type SuspendUserInput = {
  userId: string;
  reason?: string;
  duration?: 'permanent' | '7days' | '30days' | '90days';
  notifyUser?: boolean;
};

export type UnsuspendUserInput = {
  userId: string;
  reason?: string;
};

export type SuspendUserResult = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    status: string;
    suspendedAt?: string;
    suspendedUntil?: string;
  };
  error?: string;
};

type AuditLogEntry = {
  customer_id: string;
  user_id: string;
  action: 'user_suspended' | 'user_unsuspended';
  target_type: 'user';
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateSuspendUntil(duration?: string): string | null {
  if (!duration || duration === 'permanent') return null;
  
  const now = new Date();
  switch (duration) {
    case '7days':
      now.setDate(now.getDate() + 7);
      break;
    case '30days':
      now.setDate(now.getDate() + 30);
      break;
    case '90days':
      now.setDate(now.getDate() + 90);
      break;
    default:
      return null;
  }
  return now.toISOString();
}

// =============================================================================
// SUSPEND USER FUNCTION
// =============================================================================

async function suspendUser(
  customerId: string,
  adminUserId: string,
  input: SuspendUserInput
): Promise<SuspendUserResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Suspend user started',
    level: 'info',
    data: { userId: input.userId, duration: input.duration },
  });

  try {
    // Validate required fields
    if (!input.userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Check if user exists and get current status
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, display_name, email, status, is_active')
      .eq('customer_id', customerId)
      .eq('id', input.userId)
      .single();

    if (checkError || !existingUser) {
      // Demo mode - return success for demo users
      if (input.userId.match(/^[1-9]$/)) {
        return {
          success: true,
          message: 'Demo user suspended successfully',
          user: {
            id: input.userId,
            name: 'Demo User',
            status: 'suspended',
            suspendedAt: new Date().toISOString(),
            suspendedUntil: calculateSuspendUntil(input.duration) || undefined,
          },
        };
      }
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      };
    }

    // Check if already suspended
    if (existingUser.status === 'suspended') {
      return {
        success: false,
        message: 'User is already suspended',
        error: 'ALREADY_SUSPENDED',
      };
    }

    const suspendedAt = new Date().toISOString();
    const suspendedUntil = calculateSuspendUntil(input.duration);

    // Update user status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        status: 'suspended',
        is_active: false,
        suspended_at: suspendedAt,
        suspended_until: suspendedUntil,
        suspension_reason: input.reason || 'No reason provided',
        updated_at: suspendedAt,
      })
      .eq('customer_id', customerId)
      .eq('id', input.userId);

    if (updateError) throw updateError;

    // Log to audit_logs
    const auditEntry: AuditLogEntry = {
      customer_id: customerId,
      user_id: adminUserId,
      action: 'user_suspended',
      target_type: 'user',
      target_id: input.userId,
      details: {
        reason: input.reason || 'No reason provided',
        duration: input.duration || 'permanent',
        suspended_until: suspendedUntil,
        notify_user: input.notifyUser ?? false,
      },
      created_at: suspendedAt,
    };

    // Try to insert audit log (non-blocking)
    supabase
      .from('audit_logs')
      .insert(auditEntry)
      .then(({ error }) => {
        if (error) {
          console.warn('[useSuspendUser] Failed to create audit log:', error.message);
        }
      });

    const userName = existingUser.display_name || 
      [existingUser.first_name, existingUser.last_name].filter(Boolean).join(' ') ||
      existingUser.email ||
      'User';

    addBreadcrumb({
      category: 'admin',
      message: 'User suspended successfully',
      level: 'info',
      data: { userId: input.userId },
    });

    return {
      success: true,
      message: `${userName} has been suspended`,
      user: {
        id: input.userId,
        name: userName,
        status: 'suspended',
        suspendedAt,
        suspendedUntil: suspendedUntil || undefined,
      },
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'suspend_user' },
      extra: { customerId, userId: input.userId },
    });

    return {
      success: false,
      message: error.message || 'Failed to suspend user',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// UNSUSPEND USER FUNCTION
// =============================================================================

async function unsuspendUser(
  customerId: string,
  adminUserId: string,
  input: UnsuspendUserInput
): Promise<SuspendUserResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Unsuspend user started',
    level: 'info',
    data: { userId: input.userId },
  });

  try {
    if (!input.userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, display_name, email, status')
      .eq('customer_id', customerId)
      .eq('id', input.userId)
      .single();

    if (checkError || !existingUser) {
      // Demo mode
      if (input.userId.match(/^[1-9]$/)) {
        return {
          success: true,
          message: 'Demo user unsuspended successfully',
          user: {
            id: input.userId,
            name: 'Demo User',
            status: 'active',
          },
        };
      }
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      };
    }

    // Check if actually suspended
    if (existingUser.status !== 'suspended') {
      return {
        success: false,
        message: 'User is not suspended',
        error: 'NOT_SUSPENDED',
      };
    }

    const now = new Date().toISOString();

    // Update user status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        status: 'active',
        is_active: true,
        suspended_at: null,
        suspended_until: null,
        suspension_reason: null,
        updated_at: now,
      })
      .eq('customer_id', customerId)
      .eq('id', input.userId);

    if (updateError) throw updateError;

    // Log to audit_logs
    const auditEntry: AuditLogEntry = {
      customer_id: customerId,
      user_id: adminUserId,
      action: 'user_unsuspended',
      target_type: 'user',
      target_id: input.userId,
      details: {
        reason: input.reason || 'No reason provided',
      },
      created_at: now,
    };

    supabase
      .from('audit_logs')
      .insert(auditEntry)
      .then(({ error }) => {
        if (error) {
          console.warn('[useSuspendUser] Failed to create audit log:', error.message);
        }
      });

    const userName = existingUser.display_name || 
      [existingUser.first_name, existingUser.last_name].filter(Boolean).join(' ') ||
      existingUser.email ||
      'User';

    addBreadcrumb({
      category: 'admin',
      message: 'User unsuspended successfully',
      level: 'info',
      data: { userId: input.userId },
    });

    return {
      success: true,
      message: `${userName} has been unsuspended`,
      user: {
        id: input.userId,
        name: userName,
        status: 'active',
      },
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'unsuspend_user' },
      extra: { customerId, userId: input.userId },
    });

    return {
      success: false,
      message: error.message || 'Failed to unsuspend user',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// HOOKS
// =============================================================================

export function useSuspendUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (input: SuspendUserInput) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return suspendUser(customerId || '', user?.id || '', input);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        queryClient.invalidateQueries({ queryKey: ['users-list'] });
        queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Suspend user failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (input: UnsuspendUserInput) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return unsuspendUser(customerId || '', user?.id || '', input);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        queryClient.invalidateQueries({ queryKey: ['users-list'] });
        queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Unsuspend user failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}
