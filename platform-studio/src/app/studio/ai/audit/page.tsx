"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import { fetchAuditLogs } from "@/services/aiConfigService";
import type { AIAuditEntry } from "@/types/ai.types";
import {
  FileText,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react";

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  refused: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  error: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
  fallback: { icon: RefreshCw, color: "text-yellow-600", bg: "bg-yellow-50" },
};

export default function AuditLogsPage() {
  const { customerId } = useConfigStore();
  const [logs, setLogs] = useState<AIAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    fetchAuditLogs(customerId, { limit })
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId, limit]);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/studio/ai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Audit Logs</h1>
              <p className="text-sm text-gray-500">View AI execution history and usage</p>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter size={16} />
          <span className="text-sm">Filter</span>
        </button>
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
      ) : logs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Feature</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Tokens</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.error;
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{log.feature_id || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{log.model_id || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{log.role}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {log.tokens_in && log.tokens_out
                        ? `${log.tokens_in}/${log.tokens_out}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {log.cost_usd ? `$${log.cost_usd.toFixed(4)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {log.latency_ms ? `${log.latency_ms}ms` : "-"}
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
