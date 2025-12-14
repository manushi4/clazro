"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchAIFeatureDefinitions,
  fetchCustomerAIFeatures,
  saveCustomerAIFeature,
  deleteCustomerAIFeature,
} from "@/services/aiConfigService";
import type { AIFeatureDefinition, CustomerAIFeature, AudienceProfile } from "@/types/ai.types";
import type { Role } from "@/types/customer.types";
import {
  Sparkles,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  X,
  Settings,
} from "lucide-react";

const ROLES: Role[] = ["student", "teacher", "parent", "admin"];
const PROFILES: AudienceProfile[] = ["kid", "teen", "adult", "coaching"];

export default function AIFeaturesPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<AIFeatureDefinition[]>([]);
  const [customerFeatures, setCustomerFeatures] = useState<CustomerAIFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetchAIFeatureDefinitions(),
      fetchCustomerAIFeatures(customerId),
    ])
      .then(([defs, features]) => {
        setDefinitions(defs);
        setCustomerFeatures(features);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getCustomerFeature = (featureId: string) =>
    customerFeatures.find((f) => f.feature_id === featureId);

  const handleToggleFeature = async (def: AIFeatureDefinition) => {
    if (!customerId) return;
    setSaving(def.feature_id);
    try {
      const existing = getCustomerFeature(def.feature_id);
      if (existing) {
        await saveCustomerAIFeature({
          ...existing,
          is_enabled: !existing.is_enabled,
        });
        setCustomerFeatures((prev) =>
          prev.map((f) =>
            f.feature_id === def.feature_id ? { ...f, is_enabled: !f.is_enabled } : f
          )
        );
      } else {
        const newFeature: CustomerAIFeature = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          feature_id: def.feature_id,
          enabled_roles: ROLES,
          enabled_profiles: PROFILES,
          allowed_tools: [],
          config: {},
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerAIFeature(newFeature);
        setCustomerFeatures((prev) => [...prev, newFeature]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };


  const handleRoleToggle = async (def: AIFeatureDefinition, role: Role) => {
    if (!customerId) return;
    const existing = getCustomerFeature(def.feature_id);
    if (!existing) return;

    setSaving(def.feature_id);
    try {
      const newRoles = existing.enabled_roles.includes(role)
        ? existing.enabled_roles.filter((r) => r !== role)
        : [...existing.enabled_roles, role];

      await saveCustomerAIFeature({
        ...existing,
        enabled_roles: newRoles,
      });
      setCustomerFeatures((prev) =>
        prev.map((f) =>
          f.feature_id === def.feature_id ? { ...f, enabled_roles: newRoles } : f
        )
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/studio/ai"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Features</h1>
            <p className="text-sm text-gray-500">
              Enable AI features and configure per-role access
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Feature
                </th>
                <th className="text-center px-2 py-3 text-sm font-medium text-gray-600">
                  Enabled
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="text-center px-2 py-3 text-sm font-medium text-gray-600 capitalize"
                  >
                    {role}
                  </th>
                ))}
                <th className="text-center px-2 py-3 text-sm font-medium text-gray-600">
                  Config
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {definitions.map((def) => {
                const customerFeature = getCustomerFeature(def.feature_id);
                const isEnabled = customerFeature?.is_enabled ?? false;
                const isSaving = saving === def.feature_id;

                return (
                  <tr key={def.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{def.name}</div>
                      <div className="text-xs text-gray-500">
                        {def.capability_class} • {def.category}
                      </div>
                    </td>
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={() => handleToggleFeature(def)}
                        disabled={isSaving}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          isEnabled ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isEnabled ? "left-5" : "left-1"
                          }`}
                        />
                      </button>
                    </td>
                    {ROLES.map((role) => {
                      const hasRole = customerFeature?.enabled_roles?.includes(role) ?? false;
                      return (
                        <td key={role} className="text-center px-2 py-3">
                          <button
                            onClick={() => handleRoleToggle(def, role)}
                            disabled={!isEnabled || isSaving}
                            className={`w-6 h-6 rounded border transition-colors ${
                              !isEnabled
                                ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                                : hasRole
                                ? "bg-green-100 border-green-300 text-green-600"
                                : "bg-gray-100 border-gray-300 text-gray-400"
                            }`}
                          >
                            {hasRole ? <Check size={14} className="mx-auto" /> : null}
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center px-2 py-3">
                      <button
                        disabled={!isEnabled}
                        className={`p-1.5 rounded transition-colors ${
                          isEnabled
                            ? "hover:bg-gray-100 text-gray-600"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Settings size={16} />
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
