"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/configStore";
import { fetchAIConfigSummary } from "@/services/aiConfigService";
import type { AIConfigSummary } from "@/types/ai.types";
import {
  Bot,
  Sparkles,
  Server,
  Cpu,
  Wrench,
  Zap,
  Shield,
  DollarSign,
  FileText,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";

const aiSections = [
  {
    href: "/studio/ai/features",
    label: "AI Features",
    description: "Enable/disable AI features per role",
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    href: "/studio/ai/providers",
    label: "Providers",
    description: "Configure AI providers & API keys",
    icon: Server,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    href: "/studio/ai/models",
    label: "Models",
    description: "Enable models & set defaults",
    icon: Cpu,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    href: "/studio/ai/tools",
    label: "MCP Tools",
    description: "Configure external tools & connectors",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    href: "/studio/ai/automations",
    label: "Automations",
    description: "Manage automated workflows",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    href: "/studio/ai/prompts",
    label: "Prompts",
    description: "System prompts & templates",
    icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    href: "/studio/ai/routing",
    label: "Routing Rules",
    description: "Model selection & fallback rules",
    icon: Shield,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    href: "/studio/ai/budgets",
    label: "Budgets",
    description: "Cost limits & usage tracking",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    href: "/studio/ai/kill-switches",
    label: "Kill Switches",
    description: "Emergency controls",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    href: "/studio/ai/audit",
    label: "Audit Logs",
    description: "View AI execution history",
    icon: FileText,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
];

export default function AIConfigPage() {
  const { customerId } = useConfigStore();
  const [summary, setSummary] = useState<AIConfigSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    fetchAIConfigSummary(customerId)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

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
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Bot size={28} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
          <p className="text-gray-500">
            Manage AI features, providers, models, and automations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          {error}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Features"
            value={`${summary.enabledFeatures}/${summary.totalFeatures}`}
            icon={Sparkles}
            color="purple"
          />
          <SummaryCard
            label="Providers"
            value={`${summary.enabledProviders}/${summary.totalProviders}`}
            icon={Server}
            color="blue"
          />
          <SummaryCard
            label="Models"
            value={`${summary.enabledModels}/${summary.totalModels}`}
            icon={Cpu}
            color="green"
          />
          <SummaryCard
            label="Tools"
            value={`${summary.enabledTools}/${summary.totalTools}`}
            icon={Wrench}
            color="orange"
          />
          <SummaryCard
            label="Automations"
            value={`${summary.enabledAutomations}/${summary.totalAutomations}`}
            icon={Zap}
            color="yellow"
          />
          <SummaryCard
            label="Kill Switches"
            value={summary.activeKillSwitches.toString()}
            icon={AlertTriangle}
            color={summary.activeKillSwitches > 0 ? "red" : "gray"}
          />
          <SummaryCard
            label="Budget Used"
            value={`${summary.budgetUsagePercent.toFixed(0)}%`}
            icon={DollarSign}
            color={summary.budgetUsagePercent > 80 ? "red" : "emerald"}
          />
        </div>
      ) : null}

      {/* Section Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className={`p-3 rounded-lg ${section.bg}`}>
                <Icon size={24} className={section.color} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{section.label}</div>
                <div className="text-sm text-gray-500">{section.description}</div>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
    red: { bg: "bg-red-50", text: "text-red-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    gray: { bg: "bg-gray-50", text: "text-gray-600" },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.bg}`}>
          <Icon size={16} className={colors.text} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
