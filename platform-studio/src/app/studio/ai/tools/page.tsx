"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchMCPToolDefinitions,
  fetchCustomerMCPTools,
  saveCustomerMCPTool,
} from "@/services/aiConfigService";
import type { MCPToolDefinition, CustomerMCPTool, AudienceProfile } from "@/types/ai.types";
import type { Role } from "@/types/customer.types";
import { Wrench, ChevronLeft, Loader2, Shield, AlertTriangle, Check } from "lucide-react";

const ROLES: Role[] = ["student", "teacher", "parent", "admin"];
const RISK_COLORS = {
  low: { bg: "bg-green-50", text: "text-green-600" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-600" },
  high: { bg: "bg-orange-50", text: "text-orange-600" },
  critical: { bg: "bg-red-50", text: "text-red-600" },
};

export default function MCPToolsPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<MCPToolDefinition[]>([]);
  const [customerTools, setCustomerTools] = useState<CustomerMCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([fetchMCPToolDefinitions(), fetchCustomerMCPTools(customerId)])
      .then(([defs, tools]) => {
        setDefinitions(defs);
        setCustomerTools(tools);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const getCustomerTool = (toolId: string) =>
    customerTools.find((t) => t.tool_id === toolId);

  const handleToggleTool = async (def: MCPToolDefinition) => {
    if (!customerId) return;
    setSaving(def.tool_id);
    try {
      const existing = getCustomerTool(def.tool_id);
      if (existing) {
        await saveCustomerMCPTool({ ...existing, is_enabled: !existing.is_enabled });
        setCustomerTools((prev) =>
          prev.map((t) => (t.tool_id === def.tool_id ? { ...t, is_enabled: !t.is_enabled } : t))
        );
      } else {
        const newTool: CustomerMCPTool = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          tool_id: def.tool_id,
          enabled_roles: ROLES,
          enabled_profiles: ["kid", "teen", "adult", "coaching"],
          allowed_actions: def.actions.map((a) => a.action_id),
          oauth_credentials: {},
          config: {},
          requires_approval: def.requires_approval,
          approval_roles: ["admin"],
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerMCPTool(newTool);
        setCustomerTools((prev) => [...prev, newTool]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleRoleToggle = async (def: MCPToolDefinition, role: Role) => {
    if (!customerId) return;
    const existing = getCustomerTool(def.tool_id);
    if (!existing) return;

    setSaving(def.tool_id);
    try {
      const newRoles = existing.enabled_roles.includes(role)
        ? existing.enabled_roles.filter((r) => r !== role)
        : [...existing.enabled_roles, role];
      await saveCustomerMCPTool({ ...existing, enabled_roles: newRoles });
      setCustomerTools((prev) =>
        prev.map((t) => (t.tool_id === def.tool_id ? { ...t, enabled_roles: newRoles } : t))
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
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wrench size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MCP Tools</h1>
            <p className="text-sm text-gray-500">Configure external tools and connectors</p>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tool</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Risk</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Approval</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Enabled</th>
                {ROLES.map((role) => (
                  <th key={role} className="text-center px-2 py-3 font-medium text-gray-600 capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {definitions.map((def) => {
                const customerTool = getCustomerTool(def.tool_id);
                const isEnabled = customerTool?.is_enabled ?? false;
                const riskConfig = RISK_COLORS[def.risk_level];

                return (
                  <tr key={def.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{def.name}</div>
                      <div className="text-xs text-gray-500">
                        {def.category} • {def.actions.length} actions
                      </div>
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${riskConfig.bg} ${riskConfig.text}`}>
                        {def.risk_level}
                      </span>
                    </td>
                    <td className="text-center px-2 py-3">
                      {def.requires_approval ? (
                        <Shield size={16} className="mx-auto text-orange-500" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={() => handleToggleTool(def)}
                        disabled={saving === def.tool_id}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          isEnabled ? "bg-orange-600" : "bg-gray-300"
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
                      const hasRole = customerTool?.enabled_roles?.includes(role) ?? false;
                      return (
                        <td key={role} className="text-center px-2 py-3">
                          <button
                            onClick={() => handleRoleToggle(def, role)}
                            disabled={!isEnabled || saving === def.tool_id}
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
