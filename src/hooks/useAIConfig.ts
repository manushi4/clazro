/**
 * AI Config Hook
 * 
 * Provides access to AI configuration for the current customer/user.
 * Follows the same pattern as usePermissions.
 */

import { useQuery } from '@tanstack/react-query';
import { useConfigStore } from '../stores/configStore';
import { useDemoUser } from './useDemoUser';
import {
  fetchFullAIConfig,
  fetchResolvedAIFeatures,
  fetchResolvedMCPTools,
  fetchResolvedAutomations,
  isAIBlocked,
} from '../services/ai';
import type { AudienceProfile, AIConfig, ResolvedAIFeature, ResolvedMCPTool, ResolvedAutomation } from '../types/ai.types';

// Default audience profile based on role
function getDefaultAudienceProfile(role: string, age?: number): AudienceProfile {
  if (role === 'parent' || role === 'teacher' || role === 'admin') {
    return 'adult';
  }
  if (age !== undefined) {
    if (age < 13) return 'kid';
    if (age < 18) return 'teen';
    return 'adult';
  }
  return 'teen'; // Default for students
}

/**
 * Hook to get full AI configuration for current user
 */
export function useAIConfig(audienceProfile?: AudienceProfile) {
  const { config } = useConfigStore();
  const { role } = useDemoUser();
  const customerId = config?.customerId;

  const effectiveProfile = audienceProfile || getDefaultAudienceProfile(role);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-config', customerId, role, effectiveProfile],
    queryFn: () => fetchFullAIConfig(customerId!, role, effectiveProfile),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    config: data as AIConfig | undefined,
    features: data?.features || [],
    providers: data?.providers || [],
    models: data?.models || [],
    tools: data?.tools || [],
    automations: data?.automations || [],
    routingRules: data?.routingRules || [],
    budgets: data?.budgets || [],
    killSwitches: data?.killSwitches || [],
    audienceProfiles: data?.audienceProfiles || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get AI features available for current user
 */
export function useAIFeatures(audienceProfile?: AudienceProfile) {
  const { config } = useConfigStore();
  const { role } = useDemoUser();
  const customerId = config?.customerId;

  const effectiveProfile = audienceProfile || getDefaultAudienceProfile(role);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-features', customerId, role, effectiveProfile],
    queryFn: () => fetchResolvedAIFeatures(customerId!, role, effectiveProfile),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    features: (data || []) as ResolvedAIFeature[],
    isLoading,
    error,
  };
}

/**
 * Hook to get a specific AI feature
 */
export function useAIFeature(featureId: string, audienceProfile?: AudienceProfile) {
  const { features, isLoading, error } = useAIFeatures(audienceProfile);
  const feature = features.find(f => f.featureId === featureId);

  return {
    feature,
    isEnabled: !!feature,
    isLoading,
    error,
  };
}

/**
 * Hook to get MCP tools available for current user
 */
export function useMCPTools(audienceProfile?: AudienceProfile) {
  const { config } = useConfigStore();
  const { role } = useDemoUser();
  const customerId = config?.customerId;

  const effectiveProfile = audienceProfile || getDefaultAudienceProfile(role);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mcp-tools', customerId, role, effectiveProfile],
    queryFn: () => fetchResolvedMCPTools(customerId!, role, effectiveProfile),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    tools: (data || []) as ResolvedMCPTool[],
    isLoading,
    error,
  };
}

/**
 * Hook to get automations available for current user
 */
export function useAutomations(audienceProfile?: AudienceProfile) {
  const { config } = useConfigStore();
  const { role } = useDemoUser();
  const customerId = config?.customerId;

  const effectiveProfile = audienceProfile || getDefaultAudienceProfile(role);

  const { data, isLoading, error } = useQuery({
    queryKey: ['automations', customerId, role, effectiveProfile],
    queryFn: () => fetchResolvedAutomations(customerId!, role, effectiveProfile),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    automations: (data || []) as ResolvedAutomation[],
    isLoading,
    error,
  };
}

/**
 * Hook to check if AI is blocked (kill switch active)
 */
export function useAIBlockStatus(featureId?: string, providerId?: string, modelId?: string) {
  const { config } = useConfigStore();
  const customerId = config?.customerId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-block-status', customerId, featureId, providerId, modelId],
    queryFn: () => isAIBlocked(customerId!, featureId, providerId, modelId),
    enabled: !!customerId,
    staleTime: 30 * 1000, // 30 seconds - check more frequently
  });

  return {
    isBlocked: data?.blocked || false,
    reason: data?.reason,
    isLoading,
    error,
  };
}
