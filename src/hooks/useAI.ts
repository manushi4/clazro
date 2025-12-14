/**
 * useAI Hook
 * 
 * React hook for executing AI requests with loading/error state management
 */

import { useState, useCallback } from 'react';
import { useAIFeatureAccess } from './useAIPermission';
import {
  completeText,
  chat,
  generateJSON,
  AIGatewayError,
} from '../services/ai/aiGatewayService';
import type {
  AIExecuteResponse,
  AIMessage,
  AudienceProfile,
  Role,
} from '../types/ai.types';

interface UseAIOptions {
  featureId: string;
  widgetId?: string;
  audienceProfile?: AudienceProfile;
  role?: Role;
}

interface UseAIState {
  loading: boolean;
  error: AIGatewayError | null;
  response: AIExecuteResponse | null;
  traceId: string | null;
}

interface UseAIReturn extends UseAIState {
  complete: (text: string) => Promise<string | null>;
  chatWithHistory: (messages: AIMessage[]) => Promise<string | null>;
  generateStructured: <T>(prompt: string, schemaId?: string) => Promise<T | null>;
  reset: () => void;
  hasPermission: boolean;
  isDisabled: boolean;
}

export function useAI(options: UseAIOptions): UseAIReturn {
  const { featureId, widgetId, audienceProfile = 'teen', role = 'student' } = options;
  const { hasPermission, isFeatureEnabled, isLoading: configLoading } = useAIFeatureAccess(featureId, audienceProfile);

  const [state, setState] = useState<UseAIState>({
    loading: false,
    error: null,
    response: null,
    traceId: null,
  });

  const isDisabled = !hasPermission || !isFeatureEnabled || configLoading;

  const complete = useCallback(
    async (text: string): Promise<string | null> => {
      if (isDisabled) {
        setState((s) => ({
          ...s,
          error: new AIGatewayError('PERMISSION_DENIED', 'AI feature not available'),
        }));
        return null;
      }

      setState({ loading: true, error: null, response: null, traceId: null });

      try {
        const result = await completeText(featureId, text, {
          role,
          audienceProfile,
          widgetId,
        });
        setState({ loading: false, error: null, response: null, traceId: null });
        return result;
      } catch (err) {
        const error = err instanceof AIGatewayError ? err : new AIGatewayError('UNKNOWN', String(err));
        setState({ loading: false, error, response: null, traceId: error.traceId || null });
        return null;
      }
    },
    [featureId, role, audienceProfile, widgetId, isDisabled]
  );

  const chatWithHistory = useCallback(
    async (messages: AIMessage[]): Promise<string | null> => {
      if (isDisabled) {
        setState((s) => ({
          ...s,
          error: new AIGatewayError('PERMISSION_DENIED', 'AI feature not available'),
        }));
        return null;
      }

      setState({ loading: true, error: null, response: null, traceId: null });

      try {
        const result = await chat(featureId, messages, {
          role,
          audienceProfile,
          widgetId,
        });
        setState({ loading: false, error: null, response: null, traceId: result.traceId });
        return result.response;
      } catch (err) {
        const error = err instanceof AIGatewayError ? err : new AIGatewayError('UNKNOWN', String(err));
        setState({ loading: false, error, response: null, traceId: error.traceId || null });
        return null;
      }
    },
    [featureId, role, audienceProfile, widgetId, isDisabled]
  );

  const generateStructured = useCallback(
    async <T>(prompt: string, schemaId?: string): Promise<T | null> => {
      if (isDisabled) {
        setState((s) => ({
          ...s,
          error: new AIGatewayError('PERMISSION_DENIED', 'AI feature not available'),
        }));
        return null;
      }

      setState({ loading: true, error: null, response: null, traceId: null });

      try {
        const result = await generateJSON<T>(featureId, prompt, {
          role,
          audienceProfile,
          schemaId,
          widgetId,
        });
        setState({ loading: false, error: null, response: null, traceId: result.traceId });
        return result.data;
      } catch (err) {
        const error = err instanceof AIGatewayError ? err : new AIGatewayError('UNKNOWN', String(err));
        setState({ loading: false, error, response: null, traceId: error.traceId || null });
        return null;
      }
    },
    [featureId, role, audienceProfile, widgetId, isDisabled]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, response: null, traceId: null });
  }, []);

  return {
    ...state,
    complete,
    chatWithHistory,
    generateStructured,
    reset,
    hasPermission,
    isDisabled,
  };
}

/**
 * Simple hook for one-off AI completions
 */
export function useAICompletion(featureId: string, role: Role = 'student') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(
    async (text: string, audienceProfile: AudienceProfile = 'teen'): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await completeText(featureId, text, { role, audienceProfile });
        setLoading(false);
        return result;
      } catch (err) {
        const message = err instanceof AIGatewayError ? err.message : 'AI request failed';
        setError(message);
        setLoading(false);
        return null;
      }
    },
    [featureId, role]
  );

  return { complete, loading, error };
}
