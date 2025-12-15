"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import { fetchCustomerBudgets, saveCustomerBudget } from "@/services/aiConfigService";
import type { CustomerAIBudget, BudgetType } from "@/types/ai.types";
import { DollarSign, ChevronLeft, Loader2, Save, AlertTriangle, TrendingUp } from "lucide-react";

const BUDGET_TYPES: { type: BudgetType; label: string; description: string }[] = [
  { type: "tenant", label: "Tenant Budget", description: "Overall budget for this customer" },
  { type: "feature", label: "Feature Budget", description: "Budget per AI feature" },
  { type: "user", label: "User Budget", description: "Budget per user" },
  { type: "model", label: "Model Budget", description: "Budget per model" },
];

export default function BudgetsPage() {
  const { customerId } = useConfigStore();
  const [budgets, setBudgets] = useState<CustomerAIBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<CustomerAIBudget | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    fetchCustomerBudgets(customerId)
      .then(setBudgets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getTenantBudget = () => budgets.find((b) => b.budget_type === "tenant");

  const handleCreateTenantBudget = () => {
    if (!customerId) return;
    const newBudget: CustomerAIBudget = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      budget_type: "tenant",
      daily_limit_usd: 10,
      monthly_limit_usd: 100,
      daily_token_limit: 100000,
      monthly_token_limit: 1000000,
      current_daily_spend: 0,
      current_monthly_spend: 0,
      current_daily_tokens: 0,
      current_monthly_tokens: 0,
      action_on_limit: "notify",
      last_daily_reset: new Date().toISOString(),
      last_monthly_reset: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingBudget(newBudget);
  };

  const handleSaveBudget = async () => {
    if (!editingBudget || !customerId) return;
    setSaving(editingBudget.id);
    try {
      const saved = await saveCustomerBudget(editingBudget);
      setBudgets((prev) => {
        const exists = prev.find((b) => b.id === editingBudget.id);
        if (exists) {
          return prev.map((b) => (b.id === editingBudget.id ? saved : b));
        }
        return [...prev, saved];
      });
      setEditingBudget(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const tenantBudget = getTenantBudget();
  const dailyUsagePercent = tenantBudget?.daily_limit_usd
    ? (tenantBudget.current_daily_spend / tenantBudget.daily_limit_usd) * 100
    : 0;
  const monthlyUsagePercent = tenantBudget?.monthly_limit_usd
    ? (tenantBudget.current_monthly_spend / tenantBudget.monthly_limit_usd) * 100
    : 0;

  if (!customerId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Please select a customer first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DollarSign size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Budgets</h1>
            <p className="text-sm text-gray-500">Cost limits and usage tracking</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : !tenantBudget ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No budget configured for this customer</p>
          <button
            onClick={handleCreateTenantBudget}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Set Up Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Daily Usage</span>
                <span className="text-sm font-medium">
                  ${tenantBudget.current_daily_spend.toFixed(2)} / ${tenantBudget.daily_limit_usd}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dailyUsagePercent > 80 ? "bg-red-500" : dailyUsagePercent > 50 ? "bg-yellow-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{dailyUsagePercent.toFixed(1)}% used</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Monthly Usage</span>
                <span className="text-sm font-medium">
                  ${tenantBudget.current_monthly_spend.toFixed(2)} / ${tenantBudget.monthly_limit_usd}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    monthlyUsagePercent > 80 ? "bg-red-500" : monthlyUsagePercent > 50 ? "bg-yellow-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(monthlyUsagePercent, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{monthlyUsagePercent.toFixed(1)}% used</div>
            </div>
          </div>

          {/* Budget Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-medium text-gray-900 mb-4">Budget Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Daily Limit (USD)</label>
                <div className="text-lg font-medium">${tenantBudget.daily_limit_usd}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Monthly Limit (USD)</label>
                <div className="text-lg font-medium">${tenantBudget.monthly_limit_usd}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Daily Token Limit</label>
                <div className="text-lg font-medium">{(tenantBudget.daily_token_limit || 0).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Monthly Token Limit</label>
                <div className="text-lg font-medium">{(tenantBudget.monthly_token_limit || 0).toLocaleString()}</div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-500 mb-1">Action on Limit</label>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    tenantBudget.action_on_limit === "deny"
                      ? "bg-red-50 text-red-600"
                      : tenantBudget.action_on_limit === "degrade"
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {tenantBudget.action_on_limit === "deny" && <AlertTriangle size={14} />}
                  {tenantBudget.action_on_limit.charAt(0).toUpperCase() + tenantBudget.action_on_limit.slice(1)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditingBudget(tenantBudget)}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit Budget
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit ($)</label>
                  <input
                    type="number"
                    value={editingBudget.daily_limit_usd || ""}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, daily_limit_usd: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit ($)</label>
                  <input
                    type="number"
                    value={editingBudget.monthly_limit_usd || ""}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, monthly_limit_usd: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action on Limit</label>
                <select
                  value={editingBudget.action_on_limit}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      action_on_limit: e.target.value as "deny" | "degrade" | "notify",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="notify">Notify Only</option>
                  <option value="degrade">Degrade (use cheaper models)</option>
                  <option value="deny">Deny Requests</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingBudget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                disabled={!!saving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
