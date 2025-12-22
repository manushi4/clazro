/**
 * useImpersonationMutation - Mutation hooks for impersonation actions
 *
 * Phase 3: Mutation Hooks (per SCREEN_DEVELOPMENT_GUIDE.md)
 *
 * Features:
 * - Start impersonation (logs to audit_logs)
 * - End impersonation (logs to audit_logs)
 * - Optimistic updates
 * - Error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';
import { useAuthStore } from '../../../stores/authStore';

// =============================================================================
// TYPES
// =============================================================================

export type StartImpersonationParams = {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  targetUserEmail: string;
};

export type ImpersonationResult = {
  success: boolean;
  message: string;
};

// =============================================================================
// START IMPERSONATION MUTATION
// =============================================================================

export function useStartImpersonationMutation() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();
  const { user, setImpersonating } = useAuthStore();

  return useMutation({
    mutationFn: async (params: StartImpersonationParams): Promise<ImpersonationResult> => {
      const supabase = getSupabaseClient();

      // Log impersonation start to audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          customer_id: customerId,
          user_id: user?.id,
          action: 'impersonation_started',
          entity_type: 'user',
          entity_id: params.targetUserId,
          details: {
            target_user_name: params.targetUserName,
            target_user_role: params.targetUserRole,
            target_user_email: params.targetUserEmail,
            admin_user_id: user?.id,
            admin_user_name: user?.full_name || user?.email,
          },
          ip_address: null,
          user_agent: 'Mobile App',
        });

      if (auditError) {
        console.warn('[useStartImpersonationMutation] Failed to log audit:', auditError);
        // Don't fail the mutation, just log the warning
      }

      // Set impersonation state in auth store
      setImpersonating({
        userId: params.targetUserId,
        name: params.targetUserName,
        role: params.targetUserRole,
        email: params.targetUserEmail,
        originalAdminId: user?.id || '',
        originalAdminName: user?.full_name || user?.email || '',
        startedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Now impersonating ${params.targetUserName}`,
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// =============================================================================
// END IMPERSONATION MUTATION
// =============================================================================

export function useEndImpersonationMutation() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();
  const { user, impersonating, clearImpersonating } = useAuthStore();

  return useMutation({
    mutationFn: async (): Promise<ImpersonationResult> => {
      const supabase = getSupabaseClient();

      if (!impersonating) {
        return {
          success: false,
          message: 'Not currently impersonating anyone',
        };
      }

      // Log impersonation end to audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          customer_id: customerId,
          user_id: impersonating.originalAdminId,
          action: 'impersonation_ended',
          entity_type: 'user',
          entity_id: impersonating.userId,
          details: {
            target_user_name: impersonating.name,
            target_user_role: impersonating.role,
            admin_user_id: impersonating.originalAdminId,
            admin_user_name: impersonating.originalAdminName,
            duration_seconds: impersonating.startedAt
              ? Math.floor((Date.now() - new Date(impersonating.startedAt).getTime()) / 1000)
              : null,
          },
          ip_address: null,
          user_agent: 'Mobile App',
        });

      if (auditError) {
        console.warn('[useEndImpersonationMutation] Failed to log audit:', auditError);
      }

      // Clear impersonation state
      clearImpersonating();

      return {
        success: true,
        message: 'Impersonation ended',
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
