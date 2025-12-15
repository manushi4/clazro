"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchCustomerRoutingRules,
  fetchAIModelDefinitions,
  saveCustomerRoutingRule,
  deleteCustomerRoutingRule,
} from "@/services/aiConfigService";
import type { CustomerAIRoutingRule, AIModelDefinition } from "@/types/ai.types";
import { Shield, ChevronLeft, Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";

export default function RoutingRulesPage() {
  const { customerId } = useConfigStore();
  const [rules, setRules] = useState<CustomerAIRoutingRule[]>([]);
  const [models, setModels] = useState<AIModelDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<CustomerAIRoutingRule | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([fetchCustomerRoutingRules(customerId), fetchAIModelDefinitions()])
      .then(([r, m]) => {
        setRules(r);
        setModels(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleAddRule = () => {
    if (!customerId) return;
    const newRule: CustomerAIRoutingRule = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      rule_name: "New Rule",
      priority: rules.length + 1,
      feature_ids: [],
      profile_ids: [],
      roles: [],
      primary_model_id: models[0]?.model_id || "",
      fallback_model_ids: [],
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingRule(newRule);
  };

  const handleSaveRule = async () => {
    if (!editingRule || !customerId) return;
    setSaving(editingRule.id);
    try {
      const saved = await saveCustomerRoutingRule(editingRule);
      setRules((prev) => {
        const exists = prev.find((r) => r.id === editingRule.id);
        if (exists) {
          return prev.map((r) => (r.id === editingRule.id ? saved : r));
        }
        return [...prev, saved];
      });
      setEditingRule(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Delete this routing rule?")) return;
    setSaving(ruleId);
    try {
      await deleteCustomerRoutingRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Shield size={20} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Routing Rules</h1>
              <p className="text-sm text-gray-500">Model selection and fallback rules</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : rules.length === 0 && !editingRule ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No routing rules configured</p>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white border rounded-xl p-4 ${
                rule.is_enabled ? "border-teal-200" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{rule.rule_name}</div>
                    <div className="text-xs text-gray-500">
                      Priority: {rule.priority} • Primary: {rule.primary_model_id} •{" "}
                      {rule.fallback_model_ids.length} fallbacks
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={saving === rule.id}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {rules.find((r) => r.id === editingRule.id) ? "Edit Rule" : "New Rule"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={editingRule.rule_name}
                  onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Model</label>
                <select
                  value={editingRule.primary_model_id}
                  onChange={(e) => setEditingRule({ ...editingRule, primary_model_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {models.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={editingRule.is_enabled}
                  onChange={(e) => setEditingRule({ ...editingRule, is_enabled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">
                  Enabled
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRule(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!!saving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
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
