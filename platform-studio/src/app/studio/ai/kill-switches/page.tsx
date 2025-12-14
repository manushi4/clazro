"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import { fetchKillSwitches, toggleKillSwitch } from "@/services/aiConfigService";
import type { AIKillSwitch, KillSwitchType } from "@/types/ai.types";
import {
  AlertTriangle,
  ChevronLeft,
  Loader2,
  Power,
  PowerOff,
  Shield,
  Server,
  Cpu,
  Wrench,
  Zap,
  Sparkles,
  Globe,
} from "lucide-react";

const SWITCH_TYPES: { type: KillSwitchType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "global", label: "Global AI", icon: Globe, description: "Disable ALL AI features system-wide" },
  { type: "tenant", label: "Tenant AI", icon: Shield, description: "Disable AI for specific customer" },
  { type: "feature", label: "Feature", icon: Sparkles, description: "Disable specific AI feature" },
  { type: "provider", label: "Provider", icon: Server, description: "Disable specific AI provider" },
  { type: "model", label: "Model", icon: Cpu, description: "Disable specific AI model" },
  { type: "tool", label: "Tool", icon: Wrench, description: "Disable specific MCP tool" },
  { type: "automation", label: "Automation", icon: Zap, description: "Disable specific automation" },
];

export default function KillSwitchesPage() {
  const { customerId } = useConfigStore();
  const [switches, setSwitches] = useState<AIKillSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ type: KillSwitchType; refId: string | null; activate: boolean } | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchKillSwitches()
      .then(setSwitches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    if (!showConfirm) return;
    const key = `${showConfirm.type}-${showConfirm.refId || "global"}`;
    setToggling(key);
    try {
      await toggleKillSwitch(showConfirm.type, showConfirm.refId, showConfirm.activate, reason);
      const updated = await fetchKillSwitches();
      setSwitches(updated);
      setShowConfirm(null);
      setReason("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const getSwitch = (type: KillSwitchType, refId?: string) =>
    switches.find((s) => s.switch_type === type && s.reference_id === (refId || null));

  const globalSwitch = getSwitch("global");


  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kill Switches</h1>
            <p className="text-sm text-gray-500">Emergency controls to disable AI features</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          {error}
        </div>
      )}

      {/* Global Kill Switch - Prominent */}
      <div className={`mb-6 p-6 rounded-xl border-2 ${globalSwitch?.is_active ? "bg-red-50 border-red-300" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${globalSwitch?.is_active ? "bg-red-200" : "bg-gray-100"}`}>
              <Globe size={28} className={globalSwitch?.is_active ? "text-red-600" : "text-gray-600"} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Global AI Kill Switch</h2>
              <p className="text-sm text-gray-500">
                {globalSwitch?.is_active
                  ? `ACTIVE - All AI disabled. Reason: ${globalSwitch.reason || "No reason provided"}`
                  : "Disable ALL AI features across the entire system"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm({ type: "global", refId: null, activate: !globalSwitch?.is_active })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              globalSwitch?.is_active
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {globalSwitch?.is_active ? (
              <>
                <Power size={18} /> Re-enable AI
              </>
            ) : (
              <>
                <PowerOff size={18} /> Kill All AI
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Active Kill Switches</h3>
          {switches.filter((s) => s.is_active && s.switch_type !== "global").length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-500 text-center">
              No active kill switches (other than global)
            </div>
          ) : (
            <div className="space-y-2">
              {switches
                .filter((s) => s.is_active && s.switch_type !== "global")
                .map((sw) => {
                  const typeInfo = SWITCH_TYPES.find((t) => t.type === sw.switch_type);
                  const Icon = typeInfo?.icon || AlertTriangle;
                  return (
                    <div
                      key={sw.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="text-red-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {typeInfo?.label}: {sw.reference_id || "All"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sw.reason || "No reason"} • {new Date(sw.activated_at || "").toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowConfirm({ type: sw.switch_type, refId: sw.reference_id || null, activate: false })}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Re-enable
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <h3 className="font-medium text-gray-700 mt-6">Switch Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {SWITCH_TYPES.filter((t) => t.type !== "global").map((typeInfo) => {
              const Icon = typeInfo.icon;
              return (
                <div
                  key={typeInfo.type}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-gray-600" />
                    <span className="font-medium text-gray-900">{typeInfo.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{typeInfo.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showConfirm.activate ? "Activate Kill Switch?" : "Deactivate Kill Switch?"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showConfirm.activate
                ? "This will immediately disable the selected AI functionality."
                : "This will re-enable the selected AI functionality."}
            </p>
            {showConfirm.activate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you activating this kill switch?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggle}
                disabled={!!toggling}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  showConfirm.activate ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggling ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
