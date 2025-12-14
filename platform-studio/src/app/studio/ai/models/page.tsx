"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchAIModelDefinitions,
  fetchCustomerAIModels,
  saveCustomerAIModel,
} from "@/services/aiConfigService";
import type { AIModelDefinition, CustomerAIModel, AudienceProfile } from "@/types/ai.types";
import type { Role } from "@/types/customer.types";
import { Cpu, ChevronLeft, Loader2, Check, Star, Eye, Wrench } from "lucide-react";

const ROLES: Role[] = ["student", "teacher", "parent", "admin"];
const TIER_COLORS = {
  cheap: { bg: "bg-green-50", text: "text-green-600", label: "Economy" },
  standard: { bg: "bg-blue-50", text: "text-blue-600", label: "Standard" },
  premium: { bg: "bg-purple-50", text: "text-purple-600", label: "Premium" },
};

export default function AIModelsPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<AIModelDefinition[]>([]);
  const [customerModels, setCustomerModels] = useState<CustomerAIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([fetchAIModelDefinitions(), fetchCustomerAIModels(customerId)])
      .then(([defs, models]) => {
        setDefinitions(defs);
        setCustomerModels(models);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getCustomerModel = (modelId: string) =>
    customerModels.find((m) => m.model_id === modelId);

  const handleToggleModel = async (def: AIModelDefinition) => {
    if (!customerId) return;
    setSaving(def.model_id);
    try {
      const existing = getCustomerModel(def.model_id);
      if (existing) {
        await saveCustomerAIModel({ ...existing, is_enabled: !existing.is_enabled });
        setCustomerModels((prev) =>
          prev.map((m) => (m.model_id === def.model_id ? { ...m, is_enabled: !m.is_enabled } : m))
        );
      } else {
        const newModel: CustomerAIModel = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          model_id: def.model_id,
          allowed_features: [],
          allowed_roles: ROLES,
          allowed_profiles: ["kid", "teen", "adult", "coaching"],
          config: {},
          is_enabled: true,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerAIModel(newModel);
        setCustomerModels((prev) => [...prev, newModel]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleSetDefault = async (def: AIModelDefinition) => {
    if (!customerId) return;
    setSaving(def.model_id);
    try {
      // Unset other defaults
      for (const m of customerModels.filter((m) => m.is_default)) {
        await saveCustomerAIModel({ ...m, is_default: false });
      }
      const existing = getCustomerModel(def.model_id);
      if (existing) {
        await saveCustomerAIModel({ ...existing, is_default: true, is_enabled: true });
      }
      setCustomerModels((prev) =>
        prev.map((m) => ({
          ...m,
          is_default: m.model_id === def.model_id,
          is_enabled: m.model_id === def.model_id ? true : m.is_enabled,
        }))
      );
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Cpu size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Models</h1>
            <p className="text-sm text-gray-500">Enable models and set defaults</p>
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Tier</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Context</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Features</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Enabled</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {definitions.map((def) => {
                const customerModel = getCustomerModel(def.model_id);
                const isEnabled = customerModel?.is_enabled ?? false;
                const isDefault = customerModel?.is_default ?? false;
                const tierConfig = TIER_COLORS[def.tier];

                return (
                  <tr key={def.id} className={`hover:bg-gray-50 ${def.is_deprecated ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{def.name}</div>
                      <div className="text-xs text-gray-500">{def.provider_id}</div>
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${tierConfig.bg} ${tierConfig.text}`}>
                        {tierConfig.label}
                      </span>
                    </td>
                    <td className="text-center px-2 py-3 text-gray-600">
                      {(def.context_window / 1000).toFixed(0)}K
                    </td>
                    <td className="text-center px-2 py-3">
                      <div className="flex justify-center gap-1">
                        {def.supports_vision && (
                          <span title="Vision" className="p-1 bg-blue-50 rounded">
                            <Eye size={12} className="text-blue-600" />
                          </span>
                        )}
                        {def.supports_tools && (
                          <span title="Tools" className="p-1 bg-purple-50 rounded">
                            <Wrench size={12} className="text-purple-600" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={() => handleToggleModel(def)}
                        disabled={saving === def.model_id || def.is_deprecated}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          isEnabled ? "bg-green-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isEnabled ? "left-5" : "left-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={() => handleSetDefault(def)}
                        disabled={saving === def.model_id || !isEnabled}
                        className={`p-1.5 rounded transition-colors ${
                          isDefault
                            ? "bg-yellow-100 text-yellow-600"
                            : isEnabled
                            ? "hover:bg-gray-100 text-gray-400"
                            : "text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <Star size={16} fill={isDefault ? "currentColor" : "none"} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
