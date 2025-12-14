/**
 * Audit Logging
 * Records all AI executions for compliance and analytics
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AuditLogEntry } from "./types.ts";

/**
 * Log an AI execution to the audit table
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_audit_logs").insert({
      trace_id: entry.traceId,
      customer_id: entry.tenantId,
      user_id: entry.userId,
      role: entry.role,
      audience_profile: entry.audienceProfile,
      feature_id: entry.featureId,
      widget_id: entry.widgetId,
      provider_id: entry.providerId,
      model_id: entry.modelId,
      prompt_id: entry.promptId,
      status: entry.status,
      refusal_reason: entry.refusalReason,
      tokens_in: entry.tokensIn,
      tokens_out: entry.tokensOut,
      cost_usd: entry.costUsd,
      latency_ms: entry.latencyMs,
      safety_flags: entry.safetyFlags || [],
      fallback_path: entry.fallbackPath || [],
      context_refs: {},
      tools_used: [],
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log audit:", error);
    }
  } catch (err) {
    // Don't fail the request if audit logging fails
    console.error("Audit logging error:", err);
  }
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(
  supabase: SupabaseClient,
  tenantId: string,
  options?: {
    limit?: number;
    offset?: number;
    featureId?: string;
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("ai_audit_logs")
    .select("*")
    .eq("customer_id", tenantId)
    .order("created_at", { ascending: false });

  if (options?.featureId) {
    query = query.eq("feature_id", options.featureId);
  }
  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.startDate) {
    query = query.gte("created_at", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("created_at", options.endDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }

  return (data || []).map((row) => ({
    traceId: row.trace_id,
    tenantId: row.customer_id,
    userId: row.user_id,
    role: row.role,
    audienceProfile: row.audience_profile,
    featureId: row.feature_id,
    widgetId: row.widget_id,
    providerId: row.provider_id,
    modelId: row.model_id,
    promptId: row.prompt_id,
    status: row.status,
    refusalReason: row.refusal_reason,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    costUsd: row.cost_usd,
    latencyMs: row.latency_ms,
    safetyFlags: row.safety_flags,
    fallbackPath: row.fallback_path,
  }));
}

/**
 * Get usage statistics for a tenant
 */
export async function getUsageStats(
  supabase: SupabaseClient,
  tenantId: string,
  period: "day" | "week" | "month"
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  topFeatures: Array<{ featureId: string; count: number }>;
  topModels: Array<{ modelId: string; count: number }>;
}> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const { data } = await supabase
    .from("ai_audit_logs")
    .select("*")
    .eq("customer_id", tenantId)
    .gte("created_at", startDate.toISOString());

  if (!data?.length) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      topFeatures: [],
      topModels: [],
    };
  }

  const successful = data.filter((r) => r.status === "success" || r.status === "fallback");
  const failed = data.filter((r) => r.status === "error" || r.status === "refused");

  const totalTokens = data.reduce((sum, r) => sum + (r.tokens_in || 0) + (r.tokens_out || 0), 0);
  const totalCost = data.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const avgLatency = data.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / data.length;

  // Count by feature
  const featureCounts = new Map<string, number>();
  for (const r of data) {
    if (r.feature_id) {
      featureCounts.set(r.feature_id, (featureCounts.get(r.feature_id) || 0) + 1);
    }
  }
  const topFeatures = Array.from(featureCounts.entries())
    .map(([featureId, count]) => ({ featureId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count by model
  const modelCounts = new Map<string, number>();
  for (const r of data) {
    if (r.model_id) {
      modelCounts.set(r.model_id, (modelCounts.get(r.model_id) || 0) + 1);
    }
  }
  const topModels = Array.from(modelCounts.entries())
    .map(([modelId, count]) => ({ modelId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRequests: data.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    totalTokens,
    totalCost,
    avgLatency,
    topFeatures,
    topModels,
  };
}
