/**
 * AI Audit Service
 * 
 * Handles logging AI executions and tracking usage.
 */

import { getSupabaseClient } from '../../lib/supabaseClient';
import type { Role } from '../../types/permission.types';
import type { AudienceProfile, AIExecutionStatus, AIAuditEntry } from '../../types/ai.types';

function getSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');
  return supabase;
}

// Generate a unique trace ID
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Log AI execution
export async function logAIExecution(params: {
  traceId: string;
  customerId: string;
  userId: string;
  role: Role;
  audienceProfile?: AudienceProfile;
  featureId?: string;
  widgetId?: string;
  inputHash?: string;
  contextRefs?: Record<string, string>;
  providerId?: string;
  modelId?: string;
  promptId?: string;
  toolsUsed?: string[];
  status: AIExecutionStatus;
  refusalReason?: string;
  safetyFlags?: string[];
  fallbackPath?: string[];
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  latencyMs?: number;
}): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('ai_audit_logs')
    .insert({
      trace_id: params.traceId,
      customer_id: params.customerId,
      user_id: params.userId,
      role: params.role,
      audience_profile: params.audienceProfile,
      feature_id: params.featureId,
      widget_id: params.widgetId,
      input_hash: params.inputHash,
      context_refs: params.contextRefs || {},
      provider_id: params.providerId,
      model_id: params.modelId,
      prompt_id: params.promptId,
      tools_used: params.toolsUsed || [],
      status: params.status,
      refusal_reason: params.refusalReason,
      safety_flags: params.safetyFlags || [],
      fallback_path: params.fallbackPath,
      tokens_in: params.tokensIn,
      tokens_out: params.tokensOut,
      cost_usd: params.costUsd,
      latency_ms: params.latencyMs,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Update budget after AI execution
export async function updateBudgetUsage(
  customerId: string,
  tokensUsed: number,
  costUsd: number
): Promise<void> {
  const supabase = getSupabase();

  // Update tenant budget
  await supabase
    .from('customer_ai_budgets')
    .update({
      current_daily_spend: supabase.rpc('increment', { x: costUsd }),
      current_monthly_spend: supabase.rpc('increment', { x: costUsd }),
      current_daily_tokens: supabase.rpc('increment', { x: tokensUsed }),
      current_monthly_tokens: supabase.rpc('increment', { x: tokensUsed }),
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', customerId)
    .eq('budget_type', 'tenant');
}

// Get AI usage stats for a customer
export async function getAIUsageStats(
  customerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byFeature: Record<string, { requests: number; tokens: number; cost: number }>;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byStatus: Record<string, number>;
}> {
  const supabase = getSupabase();

  let query = supabase
    .from('ai_audit_logs')
    .select('*')
    .eq('customer_id', customerId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  const logs = data || [];
  const byFeature: Record<string, { requests: number; tokens: number; cost: number }> = {};
  const byModel: Record<string, { requests: number; tokens: number; cost: number }> = {};
  const byStatus: Record<string, number> = {};

  let totalRequests = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const log of logs) {
    totalRequests++;
    const tokens = (log.tokens_in || 0) + (log.tokens_out || 0);
    const cost = log.cost_usd || 0;
    totalTokens += tokens;
    totalCost += cost;

    // By feature
    if (log.feature_id) {
      if (!byFeature[log.feature_id]) {
        byFeature[log.feature_id] = { requests: 0, tokens: 0, cost: 0 };
      }
      byFeature[log.feature_id].requests++;
      byFeature[log.feature_id].tokens += tokens;
      byFeature[log.feature_id].cost += cost;
    }

    // By model
    if (log.model_id) {
      if (!byModel[log.model_id]) {
        byModel[log.model_id] = { requests: 0, tokens: 0, cost: 0 };
      }
      byModel[log.model_id].requests++;
      byModel[log.model_id].tokens += tokens;
      byModel[log.model_id].cost += cost;
    }

    // By status
    byStatus[log.status] = (byStatus[log.status] || 0) + 1;
  }

  return {
    totalRequests,
    totalTokens,
    totalCost,
    byFeature,
    byModel,
    byStatus,
  };
}

// Get recent audit logs
export async function getRecentAuditLogs(
  customerId: string,
  limit: number = 50
): Promise<AIAuditEntry[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('ai_audit_logs')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    traceId: row.trace_id,
    customerId: row.customer_id,
    userId: row.user_id,
    role: row.role,
    audienceProfile: row.audience_profile,
    featureId: row.feature_id,
    widgetId: row.widget_id,
    inputHash: row.input_hash,
    contextRefs: row.context_refs || {},
    providerId: row.provider_id,
    modelId: row.model_id,
    promptId: row.prompt_id,
    toolsUsed: row.tools_used || [],
    status: row.status,
    refusalReason: row.refusal_reason,
    safetyFlags: row.safety_flags || [],
    fallbackPath: row.fallback_path,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    costUsd: row.cost_usd,
    latencyMs: row.latency_ms,
    createdAt: row.created_at,
  }));
}
