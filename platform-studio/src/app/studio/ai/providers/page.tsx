"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchAIProviderDefinitions,
  fetchCustomerAIProviders,
  saveCustomerAIProvider,
} from "@/services/aiConfigService";
import type { AIProviderDefinition, CustomerAIProvider } from "@/types/ai.types";
import {
  Server,
  ChevronLeft,
  Loader2,
  Check,
  Key,
  Zap,
  Cloud,
} from "lucide-react";

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  openai: Cloud,
  anthropic: Zap,
  google: Cloud,
  aws: Cloud,
};

export default function AIProvidersPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<AIProviderDefinition[]>([]);
  const [customerProviders, setCustomerProviders] = useState<CustomerAIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetchAIProviderDefinitions(),
      fetchCustomerAIProviders(customerId),
    ])
      .then(([defs, providers]) => {
        setDefinitions(defs);
        setCustomerProviders(providers);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getCustomerProvider = (providerId: string) =>
    customerProviders.find((p) => p.provider_id === providerId);

  const handleToggleProvider = async (def: AIProviderDefinition) => {
    if (!customerId) return;
    setSaving(def.provider_id);
    try {
      const existing = getCustomerProvider(def.provider_id);
      if (existing) {
        await saveCustomerAIProvider({
          ...existing,
          is_enabled: !existing.is_enabled,
        });
        setCustomerProviders((prev) =>
          prev.map((p) =>
            p.provider_id === def.provider_id ? { ...p, is_enabled: !p.is_enabled } : p
          )
        );
      } else {
        const newProvider: CustomerAIProvider = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          provider_id: def.provider_id,
          enabled_models: [],
          routing_priority: 1,
          config: {},
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerAIProvider(newProvider);
        setCustomerProviders((prev) => [...prev, newProvider]);
      }
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Providers</h1>
            <p className="text-sm text-gray-500">Configure AI providers and API keys</p>
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
        <div className="grid gap-4">
          {definitions.map((def) => {
            const customerProvider = getCustomerProvider(def.provider_id);
            const isEnabled = customerProvider?.is_enabled ?? false;
            const Icon = PROVIDER_ICONS[def.provider_id] || Server;

            return (
              <div
                key={def.id}
                className={`p-4 bg-white border rounded-xl ${
                  isEnabled ? "border-blue-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${isEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Icon size={24} className={isEnabled ? "text-blue-600" : "text-gray-400"} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{def.name}</div>
                      <div className="text-sm text-gray-500">{def.description}</div>
                      <div className="flex gap-2 mt-1">
                        {def.supports_streaming && (
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded">Streaming</span>
                        )}
                        {def.supports_tools && (
                          <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded">Tools</span>
                        )}
                        {def.supports_json_mode && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">JSON Mode</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Key size={14} />
                        <span>{customerProvider?.api_key_ref ? "Key set" : "No key"}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleToggleProvider(def)}
                      disabled={saving === def.provider_id}
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        isEnabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          isEnabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
