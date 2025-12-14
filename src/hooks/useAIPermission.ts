/**
 * AI Permission Hook
 * 
 * Provides hooks for checking AI-specific permissions.
 * Combines role-based permissions with AI feature access.
 */

import { useMemo, useCallback } from 'react';
import { usePermissions } from './usePermissions';
import { useAIFeatures, useAIBlockStatus } from './useAIConfig';
import { AI_PERMISSIONS, type AIPermissionCode, type AudienceProfile } from '../types/ai.types';

/**
 * Check if user has a specific AI permission
 */
export function useHasAIPermission(permission: AIPermissionCode): boolean {
  const { permissions } = usePermissions();
  return permissions.includes(permission);
}

/**
 * Check if user can use AI chat
 */
export function useCanUseAIChat(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.CHAT_USE);
}

/**
 * Check if user can use AI summaries
 */
export function useCanUseAISummary(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.SUMMARY_USE);
}

/**
 * Check if user can use AI copilot
 */
export function useCanUseAICopilot(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.COPILOT_USE);
}

/**
 * Check if user can use AI tools
 */
export function useCanUseAITools(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.TOOLS_USE);
}

/**
 * Check if user can trigger automations
 */
export function useCanTriggerAutomation(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.AUTOMATION_TRIGGER);
}

/**
 * Check if user can view AI config (admin)
 */
export function useCanViewAIConfig(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.CONFIG_VIEW);
}

/**
 * Check if user can manage AI config (admin)
 */
export function useCanManageAIConfig(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.CONFIG_MANAGE);
}

/**
 * Check if user can view AI budget (admin)
 */
export function useCanViewAIBudget(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.BUDGET_VIEW);
}

/**
 * Check if user can view AI audit logs (admin)
 */
export function useCanViewAIAudit(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.AUDIT_VIEW);
}

/**
 * Check if user can manage kill switches (admin)
 */
export function useCanManageKillSwitch(): boolean {
  return useHasAIPermission(AI_PERMISSIONS.KILLSWITCH_MANAGE);
}

/**
 * Comprehensive AI access check for a specific feature
 * Combines permission check, feature enablement, and kill switch status
 */
export function useAIFeatureAccess(featureId: string, audienceProfile?: AudienceProfile) {
  const { permissions } = usePermissions();
  const { features, isLoading: featuresLoading } = useAIFeatures(audienceProfile);
  const { isBlocked, reason: blockReason, isLoading: blockLoading } = useAIBlockStatus(featureId);

  const feature = useMemo(() => {
    return features.find(f => f.featureId === featureId);
  }, [features, featureId]);

  // Map feature to required permission
  const requiredPermission = useMemo(() => {
    if (!feature) return null;
    switch (feature.category) {
      case 'chat':
        return AI_PERMISSIONS.CHAT_USE;
      case 'generation':
        return AI_PERMISSIONS.SUMMARY_USE;
      case 'copilot':
        return AI_PERMISSIONS.COPILOT_USE;
      default:
        return AI_PERMISSIONS.CHAT_USE;
    }
  }, [feature]);

  const hasPermission = requiredPermission ? permissions.includes(requiredPermission) : false;
  const isFeatureEnabled = !!feature;

  const canAccess = hasPermission && isFeatureEnabled && !isBlocked;

  const accessDeniedReason = useMemo(() => {
    if (isBlocked) return blockReason || 'AI is currently disabled';
    if (!hasPermission) return 'You do not have permission to use this feature';
    if (!isFeatureEnabled) return 'This feature is not enabled for your account';
    return null;
  }, [isBlocked, blockReason, hasPermission, isFeatureEnabled]);

  return {
    canAccess,
    feature,
    hasPermission,
    isFeatureEnabled,
    isBlocked,
    accessDeniedReason,
    isLoading: featuresLoading || blockLoading,
  };
}

/**
 * Get all AI permissions for current user
 */
export function useAIPermissions() {
  const { permissions, role, isLoading } = usePermissions();

  const aiPermissions = useMemo(() => {
    return Object.values(AI_PERMISSIONS).filter(p => permissions.includes(p));
  }, [permissions]);

  const hasAIPermission = useCallback(
    (permission: AIPermissionCode): boolean => {
      return aiPermissions.includes(permission);
    },
    [aiPermissions]
  );

  const hasAnyAIPermission = useCallback(
    (requiredPermissions: AIPermissionCode[]): boolean => {
      return requiredPermissions.some(p => aiPermissions.includes(p));
    },
    [aiPermissions]
  );

  const hasAllAIPermissions = useCallback(
    (requiredPermissions: AIPermissionCode[]): boolean => {
      return requiredPermissions.every(p => aiPermissions.includes(p));
    },
    [aiPermissions]
  );

  return {
    role,
    aiPermissions,
    hasAIPermission,
    hasAnyAIPermission,
    hasAllAIPermissions,
    canChat: aiPermissions.includes(AI_PERMISSIONS.CHAT_USE),
    canSummarize: aiPermissions.includes(AI_PERMISSIONS.SUMMARY_USE),
    canUseCopilot: aiPermissions.includes(AI_PERMISSIONS.COPILOT_USE),
    canUseTools: aiPermissions.includes(AI_PERMISSIONS.TOOLS_USE),
    canTriggerAutomation: aiPermissions.includes(AI_PERMISSIONS.AUTOMATION_TRIGGER),
    canViewConfig: aiPermissions.includes(AI_PERMISSIONS.CONFIG_VIEW),
    canManageConfig: aiPermissions.includes(AI_PERMISSIONS.CONFIG_MANAGE),
    canViewBudget: aiPermissions.includes(AI_PERMISSIONS.BUDGET_VIEW),
    canViewAudit: aiPermissions.includes(AI_PERMISSIONS.AUDIT_VIEW),
    canManageKillSwitch: aiPermissions.includes(AI_PERMISSIONS.KILLSWITCH_MANAGE),
    isLoading,
  };
}
