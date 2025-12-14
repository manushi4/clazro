"use client";

import { ROLES, ROLE_LABELS, Role } from "@/types";
import { useConfigStore } from "@/stores/configStore";
import {
  LayoutDashboard,
  Navigation,
  Layers,
  Palette,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function StudioDashboard() {
  const {
    selectedRole,
    setSelectedRole,
    tabs,
    screenLayouts,
    theme,
    branding,
    isDirty,
  } = useConfigStore();

  const currentTabs = tabs[selectedRole];
  const currentScreens = screenLayouts[selectedRole];

  // Count total widgets across all screens for current role
  const totalWidgets = Object.values(currentScreens).reduce(
    (sum, screen) => sum + (screen.widgets?.length || 0),
    0
  );

  // Count configured screens (screens with at least 1 widget)
  const configuredScreens = Object.values(currentScreens).filter(
    (screen) => screen.widgets && screen.widgets.length > 0
  ).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Studio</h1>
          <p className="text-gray-500 mt-1">
            Configure your mobile app experience
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isDirty && (
            <span className="text-sm text-orange-500 flex items-center gap-1">
              <AlertCircle size={14} />
              Unsaved changes
            </span>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Upload size={18} />
            Publish Changes
          </button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configure for Role
        </label>
        <div className="flex gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRole === role
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Navigation className="text-blue-500" />}
          label="Tabs"
          value={currentTabs.length.toString()}
          detail={`${currentTabs.filter((t) => t.enabled).length} enabled`}
          status="configured"
        />
        <StatCard
          icon={<Layers className="text-green-500" />}
          label="Screens"
          value={configuredScreens.toString()}
          detail={`${Object.keys(currentScreens).length} total`}
          status={configuredScreens > 0 ? "configured" : "pending"}
        />
        <StatCard
          icon={<LayoutDashboard className="text-purple-500" />}
          label="Widgets"
          value={totalWidgets.toString()}
          detail="across all screens"
          status={totalWidgets > 0 ? "configured" : "pending"}
        />
        <StatCard
          icon={<Palette className="text-orange-500" />}
          label="Theme"
          value="Custom"
          detail={theme.primary_color}
          status="configured"
        />
      </div>

      {/* Branding Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Branding</h2>
          <Link
            href="/studio/branding"
            className="text-sm text-primary-600 hover:underline"
          >
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">App Name</div>
            <div className="font-medium">{branding.app_name}</div>
          </div>
          <div>
            <div className="text-gray-500">AI Tutor</div>
            <div className="font-medium">{branding.ai_tutor_name}</div>
          </div>
          <div>
            <div className="text-gray-500">Doubts</div>
            <div className="font-medium">{branding.doubt_section_name}</div>
          </div>
          <div>
            <div className="text-gray-500">Tests</div>
            <div className="font-medium">{branding.test_name}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-6">
        <QuickActionCard
          title="Navigation Builder"
          description={`Configure ${currentTabs.length} tabs for ${ROLE_LABELS[selectedRole]}`}
          href="/studio/navigation"
          icon={<Navigation size={24} />}
        />
        <QuickActionCard
          title="Screen Builder"
          description={`${totalWidgets} widgets across ${configuredScreens} screens`}
          href="/studio/screens"
          icon={<Layers size={24} />}
        />
        <QuickActionCard
          title="Theme Editor"
          description="Customize colors, fonts, and styling"
          href="/studio/theme"
          icon={<Palette size={24} />}
        />
        <QuickActionCard
          title="Branding"
          description="Configure logos, names, and text"
          href="/studio/branding"
          icon={<FileText size={24} />}
        />
      </div>

      {/* Role Summary */}
      <h2 className="font-semibold text-gray-900 mt-8 mb-4">All Roles Summary</h2>
      <div className="grid grid-cols-4 gap-4">
        {ROLES.map((role) => {
          const roleTabs = tabs[role];
          const roleScreens = screenLayouts[role];
          const roleWidgets = Object.values(roleScreens).reduce(
            (sum, s) => sum + (s.widgets?.length || 0),
            0
          );

          return (
            <div
              key={role}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                selectedRole === role
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="font-medium text-gray-900 mb-2">
                {ROLE_LABELS[role]}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>{roleTabs.length} tabs</div>
                <div>{roleWidgets} widgets</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  status: "configured" | "pending" | "error";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        {icon}
        {status === "configured" && (
          <CheckCircle size={16} className="text-green-500" />
        )}
        {status === "pending" && (
          <AlertCircle size={16} className="text-yellow-500" />
        )}
        {status === "error" && (
          <AlertCircle size={16} className="text-red-500" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {detail && <div className="text-xs text-gray-400 mt-1">{detail}</div>}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
