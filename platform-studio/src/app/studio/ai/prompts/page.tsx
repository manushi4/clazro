"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchPromptDefinitions,
  fetchCustomerPrompts,
  saveCustomerPrompt,
} from "@/services/aiConfigService";
import type { PromptDefinition, CustomerPrompt } from "@/types/ai.types";
import { FileText, ChevronLeft, Loader2, Edit, Eye, Check, X } from "lucide-react";

export default function PromptsPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<PromptDefinition[]>([]);
  const [customerPrompts, setCustomerPrompts] = useState<CustomerPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([fetchPromptDefinitions(), fetchCustomerPrompts(customerId)])
      .then(([defs, prompts]) => {
        setDefinitions(defs);
        setCustomerPrompts(prompts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getCustomerPrompt = (promptId: string) =>
    customerPrompts.find((p) => p.prompt_id === promptId);

  const handleTogglePrompt = async (def: PromptDefinition) => {
    if (!customerId) return;
    setSaving(def.prompt_id);
    try {
      const existing = getCustomerPrompt(def.prompt_id);
      if (existing) {
        await saveCustomerPrompt({ ...existing, is_enabled: !existing.is_enabled });
        setCustomerPrompts((prev) =>
          prev.map((p) =>
            p.prompt_id === def.prompt_id ? { ...p, is_enabled: !p.is_enabled } : p
          )
        );
      } else {
        const newPrompt: CustomerPrompt = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          prompt_id: def.prompt_id,
          variables_override: [],
          config: {},
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerPrompt(newPrompt);
        setCustomerPrompts((prev) => [...prev, newPrompt]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleStartEdit = (def: PromptDefinition) => {
    const customerPrompt = getCustomerPrompt(def.prompt_id);
    setEditingPrompt(def.prompt_id);
    setEditValue(customerPrompt?.system_prompt_override || def.system_prompt);
  };

  const handleSaveEdit = async (def: PromptDefinition) => {
    if (!customerId) return;
    setSaving(def.prompt_id);
    try {
      const existing = getCustomerPrompt(def.prompt_id);
      const override = editValue !== def.system_prompt ? editValue : undefined;
      if (existing) {
        await saveCustomerPrompt({ ...existing, system_prompt_override: override });
        setCustomerPrompts((prev) =>
          prev.map((p) =>
            p.prompt_id === def.prompt_id ? { ...p, system_prompt_override: override } : p
          )
        );
      } else {
        const newPrompt: CustomerPrompt = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          prompt_id: def.prompt_id,
          system_prompt_override: override,
          variables_override: [],
          config: {},
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerPrompt(newPrompt);
        setCustomerPrompts((prev) => [...prev, newPrompt]);
      }
      setEditingPrompt(null);
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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Prompts</h1>
            <p className="text-sm text-gray-500">System prompts and templates</p>
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
      ) : (
        <div className="space-y-4">
          {definitions.map((def) => {
            const customerPrompt = getCustomerPrompt(def.prompt_id);
            const isEnabled = customerPrompt?.is_enabled ?? false;
            const hasOverride = !!customerPrompt?.system_prompt_override;
            const isEditing = editingPrompt === def.prompt_id;

            return (
              <div
                key={def.id}
                className={`bg-white border rounded-xl overflow-hidden ${
                  isEnabled ? "border-indigo-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{def.name}</span>
                      {hasOverride && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                          Customized
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {def.category} • v{def.version} • {def.target_features.join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => (isEditing ? setEditingPrompt(null) : handleStartEdit(def))}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                      {isEditing ? <X size={18} /> : <Edit size={18} />}
                    </button>
                    <button
                      onClick={() => handleTogglePrompt(def)}
                      disabled={saving === def.prompt_id}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        isEnabled ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          isEnabled ? "left-5" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="p-4">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setEditValue(def.system_prompt)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Reset to Default
                      </button>
                      <button
                        onClick={() => handleSaveEdit(def)}
                        disabled={saving === def.prompt_id}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                      >
                        {saving === def.prompt_id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                      {customerPrompt?.system_prompt_override || def.system_prompt}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
