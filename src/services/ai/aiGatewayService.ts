/**
 * AI Gateway Service
 * Client-side service to call the AI Gateway Edge Function
 */

import { getSupabaseClient } from '../../lib/supabaseClient';

const supabase = getSupabaseClient();
import type {
  AIExecuteRequest,
  AIExecuteResponse,
  AIMessage,
  Role,
  AudienceProfile,
  OutputMode,
} from '../../types/ai.types';

const AI_GATEWAY_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/ai-gateway';

/**
 * Execute an AI request through the gateway
 */
export async function executeAI(
  request: Omit<AIExecuteRequest, 'tenantId' | 'userId'>
): Promise<AIExecuteResponse> {
  // Get current session for auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Get tenant and user from session
  const tenantId = session.user.user_metadata?.customer_id;
  const userId = session.user.id;

  if (!tenantId) {
    throw new Error('No tenant ID found');
  }

  const fullRequest: AIExecuteRequest = {
    ...request,
    tenantId,
    userId,
  };

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(fullRequest),
  });

  const data: AIExecuteResponse = await response.json();

  if (!response.ok) {
    throw new AIGatewayError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'AI request failed',
      data.traceId
    );
  }

  return data;
}

/**
 * Simple text completion
 */
export async function completeText(
  featureId: string,
  text: string,
  options?: {
    role?: Role;
    audienceProfile?: AudienceProfile;
    outputMode?: OutputMode;
    widgetId?: string;
  }
): Promise<string> {
  const response = await executeAI({
    featureId,
    role: options?.role || 'student',
    audienceProfile: options?.audienceProfile || 'teen',
    input: { text },
    outputMode: options?.outputMode || 'TEXT',
    widgetId: options?.widgetId,
  });

  if (response.status === 'error' || response.status === 'refused') {
    throw new AIGatewayError(
      response.error?.code || response.status,
      response.error?.message || 'Request failed',
      response.traceId
    );
  }

  return response.outputText || '';
}

/**
 * Chat completion with message history
 */
export async function chat(
  featureId: string,
  messages: AIMessage[],
  options?: {
    role?: Role;
    audienceProfile?: AudienceProfile;
    widgetId?: string;
  }
): Promise<{ response: string; traceId: string }> {
  const result = await executeAI({
    featureId,
    role: options?.role || 'student',
    audienceProfile: options?.audienceProfile || 'teen',
    input: { messages },
    outputMode: 'TEXT',
    widgetId: options?.widgetId,
  });

  if (result.status === 'error' || result.status === 'refused') {
    throw new AIGatewayError(
      result.error?.code || result.status,
      result.error?.message || 'Chat failed',
      result.traceId
    );
  }

  return {
    response: result.outputText || '',
    traceId: result.traceId,
  };
}

/**
 * JSON structured output
 */
export async function generateJSON<T = Record<string, unknown>>(
  featureId: string,
  prompt: string,
  options?: {
    role?: Role;
    audienceProfile?: AudienceProfile;
    schemaId?: string;
    widgetId?: string;
  }
): Promise<{ data: T; traceId: string }> {
  const result = await executeAI({
    featureId,
    role: options?.role || 'student',
    audienceProfile: options?.audienceProfile || 'teen',
    input: { text: prompt },
    outputMode: 'JSON',
    schemaId: options?.schemaId,
    widgetId: options?.widgetId,
  });

  if (result.status === 'error' || result.status === 'refused') {
    throw new AIGatewayError(
      result.error?.code || result.status,
      result.error?.message || 'JSON generation failed',
      result.traceId
    );
  }

  return {
    data: (result.outputJson as T) || ({} as T),
    traceId: result.traceId,
  };
}

/**
 * AI Gateway Error class
 */
export class AIGatewayError extends Error {
  code: string;
  traceId?: string;

  constructor(code: string, message: string, traceId?: string) {
    super(message);
    this.name = 'AIGatewayError';
    this.code = code;
    this.traceId = traceId;
  }

  isRateLimited(): boolean {
    return this.code === 'BUDGET_EXCEEDED' || this.code === 'RATE_LIMITED';
  }

  isServiceDisabled(): boolean {
    return this.code === 'SERVICE_DISABLED' || this.code === 'KILL_SWITCH_ACTIVE';
  }

  isNotFound(): boolean {
    return this.code === 'FEATURE_NOT_FOUND' || this.code === 'NOT_FOUND';
  }
}
