/**
 * AI Gateway Edge Function
 * 
 * Main entry point for all AI requests. Handles:
 * - Request validation & authentication
 * - Config resolution (feature, model, prompt)
 * - Kill switch checks
 * - Budget enforcement
 * - Provider routing with fallback
 * - Audit logging
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveConfig } from "./config-resolver.ts";
import { checkKillSwitches } from "./kill-switch.ts";
import { checkBudget, recordUsage } from "./budget.ts";
import { executeWithProvider } from "./provider-executor.ts";
import { logAudit } from "./audit.ts";
import { validateRequest, sanitizeInput } from "./safety.ts";
import type { AIExecuteRequest, AIExecuteResponse } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  try {
    // Parse request
    const body: AIExecuteRequest = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate request structure
    const validationResult = validateRequest(body);
    if (!validationResult.valid) {
      return jsonResponse({
        traceId,
        status: "error",
        safetyFlags: [],
        error: { code: "INVALID_REQUEST", message: validationResult.error },
      }, 400);
    }

    // Check global and tenant kill switches
    const killSwitchResult = await checkKillSwitches(supabase, body.tenantId, body.featureId);
    if (killSwitchResult.blocked) {
      await logAudit(supabase, {
        traceId,
        ...body,
        status: "refused",
        refusalReason: killSwitchResult.reason,
        latencyMs: Date.now() - startTime,
      });
      return jsonResponse({
        traceId,
        status: "refused",
        safetyFlags: ["KILL_SWITCH_ACTIVE"],
        error: { code: "SERVICE_DISABLED", message: killSwitchResult.reason },
      }, 503);
    }

    // Resolve configuration (feature, model, prompt, routing)
    const config = await resolveConfig(supabase, body);
    if (!config.feature) {
      return jsonResponse({
        traceId,
        status: "error",
        safetyFlags: [],
        error: { code: "FEATURE_NOT_FOUND", message: `Feature ${body.featureId} not found or disabled` },
      }, 404);
    }

    // Check budget
    const budgetResult = await checkBudget(supabase, body.tenantId, config);
    if (budgetResult.exceeded && budgetResult.action === "deny") {
      await logAudit(supabase, {
        traceId,
        ...body,
        status: "refused",
        refusalReason: "Budget exceeded",
        latencyMs: Date.now() - startTime,
      });
      return jsonResponse({
        traceId,
        status: "refused",
        safetyFlags: ["BUDGET_EXCEEDED"],
        error: { code: "BUDGET_EXCEEDED", message: "AI budget limit reached" },
      }, 429);
    }

    // Sanitize input for safety
    const sanitizedInput = sanitizeInput(body.input, config.audienceProfile);

    // Execute with provider (handles fallback)
    const result = await executeWithProvider(supabase, {
      ...body,
      input: sanitizedInput,
      config,
      traceId,
    });

    // Record usage for budget tracking
    if (result.usage) {
      await recordUsage(supabase, body.tenantId, result.usage);
    }

    // Log audit
    await logAudit(supabase, {
      traceId,
      ...body,
      providerId: result.provider,
      modelId: result.model,
      promptId: config.prompt?.prompt_id,
      status: result.status,
      tokensIn: result.usage?.tokensIn,
      tokensOut: result.usage?.tokensOut,
      costUsd: result.usage?.costUsd,
      latencyMs: Date.now() - startTime,
      safetyFlags: result.safetyFlags,
      fallbackPath: result.fallbackPath,
    });

    const response: AIExecuteResponse = {
      traceId,
      status: result.status,
      outputText: result.outputText,
      outputJson: result.outputJson,
      safetyFlags: result.safetyFlags,
      provider: result.provider,
      model: result.model,
      fallbackPath: result.fallbackPath,
      usage: result.usage,
    };

    return jsonResponse(response, 200);

  } catch (error) {
    console.error("AI Gateway error:", error);
    
    return jsonResponse({
      traceId,
      status: "error",
      safetyFlags: [],
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    }, 500);
  }
});

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
