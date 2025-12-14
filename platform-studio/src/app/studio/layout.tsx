"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfigStore } from "@/stores/configStore";
import { ROLE_LABELS } from "@/types";
import {
  LayoutDashboard,
  Palette,
  Navigation,
  Layers,
  Settings,
  Bug,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  Circle,
  Bell,
  Bot,
} from "lucide-react";

const sidebarItems = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio/navigation", label: "Navigation", icon: Navigation },
  { href: "/studio/screens", label: "Screens", icon: Layers },
  { href: "/studio/theme", label: "Theme", icon: Palette },
  { href: "/studio/branding", label: "Branding", icon: FileText },
  { href: "/studio/ai", label: "AI Config", icon: Bot },
  { href: "/studio/notifications", label: "Notifications", icon: Bell },
  { href: "/studio/versions", label: "Versions", icon: History },
  { href: "/studio/debug", label: "Debug", icon: Bug },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { selectedRole, isDirty, tabs, screenLayouts } = useConfigStore();

  // Calculate stats
  const currentTabs = tabs[selectedRole];
  const currentScreens = screenLayouts[selectedRole];
  const totalWidgets = Object.values(currentScreens).reduce(
    (sum, screen) => sum + (screen.widgets?.length || 0),
    0
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary-600">
                Platform Studio
              </span>
              {isDirty && (
                <Circle size={8} className="fill-orange-500 text-orange-500" />
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Current Role Indicator */}
        {!collapsed && (
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Current Role</div>
            <div className="font-medium text-gray-900">
              {ROLE_LABELS[selectedRole]}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentTabs.length} tabs • {totalWidgets} widgets
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-auto">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/studio" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Status Footer */}
        {!collapsed && (
          <div className="p-4 border-t text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span
                className={`flex items-center gap-1 ${
                  isDirty ? "text-orange-500" : "text-green-500"
                }`}
              >
                <Circle
                  size={6}
                  className={isDirty ? "fill-orange-500" : "fill-green-500"}
                />
                {isDirty ? "Unsaved" : "Saved"}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
