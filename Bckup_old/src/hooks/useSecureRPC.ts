/**
 * Secure RPC Client Hook - Sprint 0
 *
 * Purpose: Type-safe client for calling secure-write-rpc Edge Function
 * - All write operations must go through this RPC
 * - Automatic correlation ID tracking
 * - Built-in error handling
 * - TypeScript safety for actions/payloads
 *
 * Usage:
 * ```typescript
 * const { suspendUser, deleteUser, isLoading, error } = useSecureRPC();
 *
 * const handleSuspend = async (userId: string, reason: string) => {
 *   const result = await suspendUser(userId, reason);
 *   if (result) {
 *     console.log('User suspended:', result.correlationId);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SecureWriteRequest {
  action: string;
  targetId: string;
  payload?: Record<string, any>;
  reason?: string;
}

interface SecureWriteResponse {
  success: boolean;
  correlationId: string;
  result?: any;
}

interface SecureWriteError {
  error: string;
  message?: string;
}

// ============================================================================
// BASE RPC FUNCTION
// ============================================================================

async function executeSecureRPC(request: SecureWriteRequest): Promise<SecureWriteResponse> {
  console.log(`[RPC Client] Executing ${request.action} on ${request.targetId}`);

  const { data, error } = await supabase.functions.invoke<SecureWriteResponse | SecureWriteError>(
    'secure-write-rpc',
    {
      body: request,
    }
  );

  if (error) {
    console.error('[RPC Client] Error:', error);
    throw new Error(error.message || 'RPC call failed');
  }

  if (data && 'error' in data) {
    console.error('[RPC Client] Server error:', data.error);
    throw new Error(data.message || data.error);
  }

  if (!data || !data.success) {
    throw new Error('Invalid response from RPC');
  }

  console.log('[RPC Client] Success:', data.correlationId);
  return data;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSecureRPC() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * User Management Actions
   */

  const suspendUser = useCallback(async (userId: string, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'suspend_user',
        targetId: userId,
        payload: { reason },
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  const unsuspendUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'unsuspend_user',
        targetId: userId,
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'delete_user',
        targetId: userId,
        payload: { reason },
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Support Ticket Actions
   */

  const assignTicket = useCallback(async (ticketId: string, assignedTo: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'assign_ticket',
        targetId: ticketId,
        payload: { assignedTo },
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  const resolveTicket = useCallback(async (ticketId: string, notes: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'resolve_ticket',
        targetId: ticketId,
        payload: { notes },
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Financial Actions
   */

  const recordPayment = useCallback(
    async (paymentId: string, amount: number, studentId: string, paymentMethod: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await executeSecureRPC({
          action: 'record_payment',
          targetId: paymentId,
          payload: { amount, studentId, paymentMethod },
        });

        setIsLoading(false);
        return result;
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  /**
   * System Settings Actions
   */

  const updateSetting = useCallback(async (settingKey: string, value: any, updatedBy: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action: 'update_setting',
        targetId: settingKey,
        payload: { value, updatedBy },
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Generic RPC call (for custom actions)
   */

  const executeAction = useCallback(async (action: string, targetId: string, payload?: any, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeSecureRPC({
        action,
        targetId,
        payload,
        reason,
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    error,

    // User Management
    suspendUser,
    unsuspendUser,
    deleteUser,

    // Support Tickets
    assignTicket,
    resolveTicket,

    // Financial
    recordPayment,

    // System Settings
    updateSetting,

    // Generic
    executeAction,
  };
}

/**
 * MIGRATION GUIDE: Replacing Direct Supabase Writes
 *
 * BEFORE (Direct write - will be blocked by RLS):
 * ```typescript
 * const { error } = await supabase
 *   .from('profiles')
 *   .update({ is_active: false })
 *   .eq('id', userId);
 * ```
 *
 * AFTER (Secure RPC - passes RLS + audits):
 * ```typescript
 * const { suspendUser } = useSecureRPC();
 * const result = await suspendUser(userId, 'Violation of terms');
 * ```
 *
 * BENEFITS:
 * - ✅ Permission checking before execution
 * - ✅ Automatic audit logging with correlation ID
 * - ✅ Type-safe action calls
 * - ✅ Centralized error handling
 * - ✅ Works with RLS (no more "new row violates RLS" errors)
 */
