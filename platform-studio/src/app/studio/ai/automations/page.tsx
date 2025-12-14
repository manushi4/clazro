"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import {
  fetchAutomationDefinitions,
  createAutomationDefinition,
  updateAutomationDefinition,
  deleteAutomationDefinition,
  fetchCustomerAutomations,
  saveCustomerAutomation,
} from "@/services/aiConfigService";
import type { AutomationDefinition, CustomerAutomation, AutomationStep, RiskLevel } from "@/types/ai.types";
import type { Role } from "@/types/customer.types";
import {
  Zap,
  ChevronLeft,
  Loader2,
  Clock,
  Calendar,
  MousePointer,
  Webhook,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

const ROLES: Role[] = ["student", "teacher", "parent", "admin"];
const TRIGGER_TYPES = ["event", "schedule", "manual", "condition", "webhook"] as const;
const CATEGORIES = ["notification", "workflow", "integration", "ai", "data", "custom"] as const;
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  event: Zap,
  schedule: Calendar,
  manual: MousePointer,
  condition: Clock,
  webhook: Webhook,
};

type EditingAutomation = {
  id?: string;
  automation_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  steps: AutomationStep[];
  default_config: Record<string, unknown>;
  risk_level: RiskLevel;
  requires_approval: boolean;
  is_active: boolean;
};

const emptyAutomation: EditingAutomation = {
  automation_id: "",
  name: "",
  description: "",
  category: "integration",
  icon: "zap",
  trigger_type: "webhook",
  trigger_config: {},
  steps: [],
  default_config: {},
  risk_level: "low",
  requires_approval: false,
  is_active: true,
};

export default function AutomationsPage() {
  const { customerId } = useConfigStore();
  const [definitions, setDefinitions] = useState<AutomationDefinition[]>([]);
  const [customerAutomations, setCustomerAutomations] = useState<CustomerAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingAutomation | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const defs = await fetchAutomationDefinitions();
      setDefinitions(defs);
      if (customerId) {
        const automations = await fetchCustomerAutomations(customerId);
        setCustomerAutomations(automations);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerAutomation = (automationId: string) =>
    customerAutomations.find((a) => a.automation_id === automationId);

  const handleToggleDefinition = async (def: AutomationDefinition) => {
    setSaving(def.id);
    try {
      await updateAutomationDefinition(def.id, { is_active: !def.is_active });
      setDefinitions((prev) =>
        prev.map((d) => (d.id === def.id ? { ...d, is_active: !d.is_active } : d))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleCustomerAutomation = async (def: AutomationDefinition) => {
    if (!customerId) return;
    setSaving(def.id);
    try {
      const existing = getCustomerAutomation(def.automation_id);
      if (existing) {
        await saveCustomerAutomation({ ...existing, is_enabled: !existing.is_enabled });
        setCustomerAutomations((prev) =>
          prev.map((a) => a.automation_id === def.automation_id ? { ...a, is_enabled: !a.is_enabled } : a)
        );
      } else {
        const newAutomation: CustomerAutomation = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          automation_id: def.automation_id,
          enabled_roles: ROLES,
          enabled_profiles: ["kid", "teen", "adult", "coaching"],
          trigger_overrides: {},
          step_overrides: {},
          config: {},
          requires_approval: def.requires_approval,
          approval_roles: ["admin"],
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCustomerAutomation(newAutomation);
        setCustomerAutomations((prev) => [...prev, newAutomation]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleRoleToggle = async (def: AutomationDefinition, role: Role) => {
    if (!customerId) return;
    const existing = getCustomerAutomation(def.automation_id);
    if (!existing) return;
    setSaving(def.id);
    try {
      const newRoles = existing.enabled_roles.includes(role)
        ? existing.enabled_roles.filter((r) => r !== role)
        : [...existing.enabled_roles, role];
      await saveCustomerAutomation({ ...existing, enabled_roles: newRoles });
      setCustomerAutomations((prev) =>
        prev.map((a) => a.automation_id === def.automation_id ? { ...a, enabled_roles: newRoles } : a)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = () => {
    setEditing({ ...emptyAutomation, automation_id: `automation_${Date.now()}` });
    setShowForm(true);
  };

  const handleEdit = (def: AutomationDefinition) => {
    setEditing({
      id: def.id,
      automation_id: def.automation_id,
      name: def.name,
      description: def.description || "",
      category: def.category,
      icon: def.icon || "zap",
      trigger_type: def.trigger_type,
      trigger_config: def.trigger_config || {},
      steps: def.steps || [],
      default_config: def.default_config || {},
      risk_level: def.risk_level,
      requires_approval: def.requires_approval,
      is_active: def.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setFormSaving(true);
    try {
      const payload = {
        automation_id: editing.automation_id,
        name: editing.name,
        description: editing.description,
        category: editing.category,
        icon: editing.icon,
        trigger_type: editing.trigger_type,
        trigger_config: editing.trigger_config,
        steps: editing.steps,
        default_config: editing.default_config,
        risk_level: editing.risk_level,
        requires_approval: editing.requires_approval,
        is_active: editing.is_active,
      };
      if (editing.id) {
        const updated = await updateAutomationDefinition(editing.id, payload);
        setDefinitions((prev) => prev.map((d) => (d.id === editing.id ? updated : d)));
      } else {
        const created = await createAutomationDefinition(payload as any);
        setDefinitions((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(id);
    try {
      await deleteAutomationDefinition(id);
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap size={20} className="text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Automation Definitions</h1>
              <p className="text-sm text-gray-500">Manage global automation workflows (n8n, webhooks, etc.)</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus size={18} />
          Add Automation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{editing.id ? "Edit Automation" : "Create Automation"}</h2>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Automation ID</label>
                  <input type="text" value={editing.automation_id}
                    onChange={(e) => setEditing({ ...editing, automation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g., n8n_test_webhook" disabled={!!editing.id} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g., N8N Test Webhook" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  rows={2} placeholder="Describe what this automation does..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                  <select value={editing.trigger_type}
                    onChange={(e) => setEditing({ ...editing, trigger_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                    {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select value={editing.risk_level}
                    onChange={(e) => setEditing({ ...editing, risk_level: e.target.value as RiskLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                    {RISK_LEVELS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Config (JSON)</label>
                <textarea value={JSON.stringify(editing.trigger_config, null, 2)}
                  onChange={(e) => { try { setEditing({ ...editing, trigger_config: JSON.parse(e.target.value) }); } catch {} }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-yellow-500"
                  rows={3} placeholder='{"event": "user_action"}' />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steps (JSON Array) - Include webhook URL in action_config</label>
                <textarea value={JSON.stringify(editing.steps, null, 2)}
                  onChange={(e) => { try { setEditing({ ...editing, steps: JSON.parse(e.target.value) }); } catch {} }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-yellow-500"
                  rows={5} placeholder='[{"step_id": "1", "action_type": "webhook", "action_config": {"url": "https://..."}}]' />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.requires_approval}
                    onChange={(e) => setEditing({ ...editing, requires_approval: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                  <span className="text-sm text-gray-700">Requires Approval</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={handleCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={formSaving || !editing.name || !editing.automation_id}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
                {formSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editing.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Delete Automation?</h3>
            <p className="text-gray-600 mb-4">This will permanently delete this automation definition.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : definitions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <Zap size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Automations Yet</h3>
          <p className="text-gray-500 mb-4">Create your first automation to connect with n8n or other webhooks.</p>
          <button onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            <Plus size={18} /> Add Automation
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Automation</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Category</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Trigger</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Steps</th>
                <th className="text-center px-2 py-3 font-medium text-gray-600">Active</th>
                {customerId && (
                  <>
                    <th className="text-center px-2 py-3 font-medium text-gray-600">Customer</th>
                    {ROLES.map((role) => (
                      <th key={role} className="text-center px-2 py-3 font-medium text-gray-600 capitalize">{role}</th>
                    ))}
                  </>
                )}
                <th className="text-center px-2 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {definitions.map((def) => {
                const customerAutomation = getCustomerAutomation(def.automation_id);
                const isCustomerEnabled = customerAutomation?.is_enabled ?? false;
                const TriggerIcon = TRIGGER_ICONS[def.trigger_type] || Zap;
                return (
                  <tr key={def.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{def.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{def.description || def.automation_id}</div>
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">{def.category}</span>
                    </td>
                    <td className="text-center px-2 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <TriggerIcon size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-600 capitalize">{def.trigger_type}</span>
                      </div>
                    </td>
                    <td className="text-center px-2 py-3 text-gray-600">{def.steps?.length || 0}</td>
                    <td className="text-center px-2 py-3">
                      <button onClick={() => handleToggleDefinition(def)} disabled={saving === def.id}
                        className={`w-10 h-6 rounded-full transition-colors relative ${def.is_active ? "bg-green-600" : "bg-gray-300"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${def.is_active ? "left-5" : "left-1"}`} />
                      </button>
                    </td>

                    {customerId && (
                      <>
                        <td className="text-center px-2 py-3">
                          <button onClick={() => handleToggleCustomerAutomation(def)}
                            disabled={saving === def.id || !def.is_active}
                            className={`w-10 h-6 rounded-full transition-colors relative ${
                              !def.is_active ? "bg-gray-200 cursor-not-allowed" : isCustomerEnabled ? "bg-yellow-600" : "bg-gray-300"
                            }`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isCustomerEnabled ? "left-5" : "left-1"}`} />
                          </button>
                        </td>
                        {ROLES.map((role) => {
                          const hasRole = customerAutomation?.enabled_roles?.includes(role) ?? false;
                          return (
                            <td key={role} className="text-center px-2 py-3">
                              <button onClick={() => handleRoleToggle(def, role)}
                                disabled={!isCustomerEnabled || saving === def.id}
                                className={`w-6 h-6 rounded border transition-colors ${
                                  !isCustomerEnabled ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                                    : hasRole ? "bg-green-100 border-green-300 text-green-600" : "bg-gray-100 border-gray-300 text-gray-400"
                                }`}>
                                {hasRole ? <Check size={14} className="mx-auto" /> : null}
                              </button>
                            </td>
                          );
                        })}
                      </>
                    )}
                    <td className="text-center px-2 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(def)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(def.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
