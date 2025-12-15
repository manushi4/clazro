/**
 * Budget Management
 * Checks and records AI usage against budget limits
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ResolvedConfig, UsageInfo } from "./types.ts";

interface BudgetCheckResult {
  exceeded: boolean;
  action: "deny" | "degrade" | "notify";
  remainingDaily?: number;
  remainingMonthly?: number;
}

export async function checkBudget(
  supabase: SupabaseClient,
  tenantId: string,
  config: ResolvedConfig
): Promise<BudgetCheckResult> {
  // Get tenant budget
  const { data: budget } = await supabase
    .from("customer_ai_budgets")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("budget_type", "tenant")
    .single();

  if (!budget) {
    // No budget configured = unlimited
    return { exceeded: false, action: "notify" };
  }

  // Check if we need to reset counters
  const now = new Date();
  const lastDailyReset = new Date(budget.last_daily_reset);
  const lastMonthlyReset = new Date(budget.last_monthly_reset);

  let currentDailySpend = budget.current_daily_spend;
  let currentMonthlySpend = budget.current_monthly_spend;

  // Reset daily if new day
  if (now.toDateString() !== lastDailyReset.toDateString()) {
    currentDailySpend = 0;
    await supabase
      .from("customer_ai_budgets")
      .update({
        current_daily_spend: 0,
        current_daily_tokens: 0,
        last_daily_reset: now.toISOString(),
      })
      .eq("id", budget.id);
  }

  // Reset monthly if new month
  if (now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear()) {
    currentMonthlySpend = 0;
    await supabase
      .from("customer_ai_budgets")
      .update({
        current_monthly_spend: 0,
        current_monthly_tokens: 0,
        last_monthly_reset: now.toISOString(),
      })
      .eq("id", budget.id);
  }

  // Check limits
  const dailyExceeded = budget.daily_limit_usd && currentDailySpend >= budget.daily_limit_usd;
  const monthlyExceeded = budget.monthly_limit_usd && currentMonthlySpend >= budget.monthly_limit_usd;

  if (dailyExceeded || monthlyExceeded) {
    return {
      exceeded: true,
      action: budget.action_on_limit || "notify",
      remainingDaily: Math.max(0, (budget.daily_limit_usd || 0) - currentDailySpend),
      remainingMonthly: Math.max(0, (budget.monthly_limit_usd || 0) - currentMonthlySpend),
    };
  }

  return {
    exceeded: false,
    action: "notify",
    remainingDaily: (budget.daily_limit_usd || 0) - currentDailySpend,
    remainingMonthly: (budget.monthly_limit_usd || 0) - currentMonthlySpend,
  };
}

export async function recordUsage(
  supabase: SupabaseClient,
  tenantId: string,
  usage: UsageInfo
): Promise<void> {
  // Update tenant budget
  const { data: budget } = await supabase
    .from("customer_ai_budgets")
    .select("id, current_daily_spend, current_monthly_spend, current_daily_tokens, current_monthly_tokens")
    .eq("customer_id", tenantId)
    .eq("budget_type", "tenant")
    .single();

  if (budget) {
    await supabase
      .from("customer_ai_budgets")
      .update({
        current_daily_spend: (budget.current_daily_spend || 0) + usage.costUsd,
        current_monthly_spend: (budget.current_monthly_spend || 0) + usage.costUsd,
        current_daily_tokens: (budget.current_daily_tokens || 0) + usage.tokensIn + usage.tokensOut,
        current_monthly_tokens: (budget.current_monthly_tokens || 0) + usage.tokensIn + usage.tokensOut,
        updated_at: new Date().toISOString(),
      })
      .eq("id", budget.id);
  }
}

/**
 * Get budget summary for a tenant
 */
export async function getBudgetSummary(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyPercent: number;
  monthlyPercent: number;
}> {
  const { data: budget } = await supabase
    .from("customer_ai_budgets")
    .select("*")
    .eq("customer_id", tenantId)
    .eq("budget_type", "tenant")
    .single();

  if (!budget) {
    return {
      dailyUsed: 0,
      dailyLimit: 0,
      monthlyUsed: 0,
      monthlyLimit: 0,
      dailyPercent: 0,
      monthlyPercent: 0,
    };
  }

  return {
    dailyUsed: budget.current_daily_spend || 0,
    dailyLimit: budget.daily_limit_usd || 0,
    monthlyUsed: budget.current_monthly_spend || 0,
    monthlyLimit: budget.monthly_limit_usd || 0,
    dailyPercent: budget.daily_limit_usd
      ? ((budget.current_daily_spend || 0) / budget.daily_limit_usd) * 100
      : 0,
    monthlyPercent: budget.monthly_limit_usd
      ? ((budget.current_monthly_spend || 0) / budget.monthly_limit_usd) * 100
      : 0,
  };
}
