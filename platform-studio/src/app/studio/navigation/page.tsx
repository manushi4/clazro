"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ROLES, ROLE_LABELS, Role, TabConfig } from "@/types";
import { getScreensForRole } from "@/config/screenRegistry";
import { TAB_ICONS } from "@/types/navigation.types";
import { Plus, Save, Loader2 } from "lucide-react";
import { SortableTab } from "@/components/builder/SortableTab";
import { useConfigStore } from "@/stores/configStore";
import { useSupabaseConfig } from "@/hooks/useSupabaseConfig";

export default function NavigationBuilder() {
  const {
    selectedRole,
    setSelectedRole,
    tabs,
    addTab,
    updateTab,
    deleteTab,
    setTabs,
    isDirty,
  } = useConfigStore();

  const { saveTabs, isSaving, isLoading } = useSupabaseConfig();

  const currentTabs = tabs[selectedRole];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  const screens = getScreensForRole(selectedRole);
  const maxTabs = 10;
  const minTabs = 1;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = currentTabs.findIndex((i) => i.tab_id === active.id);
      const newIndex = currentTabs.findIndex((i) => i.tab_id === over.id);
      const reordered = arrayMove(currentTabs, oldIndex, newIndex);
      setTabs(
        selectedRole,
        reordered.map((tab, index) => ({ ...tab, order_index: index + 1 }))
      );
    }
  };

  const handleAddTab = () => {
    if (currentTabs.length >= maxTabs) return;

    const newTab: TabConfig = {
      tab_id: `tab-${Date.now()}`,
      customer_id: "",
      role: selectedRole,
      label: "New Tab",
      icon: "star",
      order_index: currentTabs.length + 1,
      enabled: true,
      root_screen_id: screens[0]?.screen_id || "student-home",
    };

    addTab(selectedRole, newTab);
    setSelectedTab(newTab.tab_id);
  };

  const handleDeleteTab = (tabId: string) => {
    if (currentTabs.length <= minTabs) return;
    deleteTab(selectedRole, tabId);
    if (selectedTab === tabId) setSelectedTab(null);
  };

  const handleUpdateTab = (tabId: string, updates: Partial<TabConfig>) => {
    updateTab(selectedRole, tabId, updates);
  };

  const handleSave = async () => {
    try {
      await saveTabs(selectedRole);
      alert("Tabs saved to Supabase!");
    } catch (error) {
      console.error("Failed to save tabs:", error);
      alert("Failed to save tabs. Check console for details.");
    }
  };

  const activeTab = currentTabs.find((t) => t.tab_id === activeId);
  const selectedTabData = currentTabs.find((t) => t.tab_id === selectedTab);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Navigation Builder</h1>
          <p className="text-gray-500 mt-1">
            Configure tabs for each role (1-10 tabs supported)
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isDirty && (
            <span className="text-sm text-orange-500">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex gap-2 mb-6">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => {
              setSelectedRole(role);
              setSelectedTab(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedRole === role
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {ROLE_LABELS[role]}
            <span className="ml-2 text-xs opacity-70">
              ({tabs[role].length} tabs)
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Tab List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {ROLE_LABELS[selectedRole]} Tabs ({currentTabs.length}/{maxTabs})
            </h2>
            <button
              onClick={handleAddTab}
              disabled={currentTabs.length >= maxTabs}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Tab
            </button>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentTabs.map((t) => t.tab_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {currentTabs.map((tab) => (
                  <SortableTab
                    key={tab.tab_id}
                    tab={tab}
                    isSelected={selectedTab === tab.tab_id}
                    onSelect={() => setSelectedTab(tab.tab_id)}
                    onDelete={() => handleDeleteTab(tab.tab_id)}
                    canDelete={currentTabs.length > minTabs}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeTab && (
                <div className="bg-white border-2 border-primary-500 rounded-lg p-3 shadow-lg">
                  <span className="font-medium">{activeTab.label}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Tab Properties */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tab Properties</h2>

          {selectedTabData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedTabData.label}
                  onChange={(e) =>
                    handleUpdateTab(selectedTabData.tab_id, { label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <select
                  value={selectedTabData.icon}
                  onChange={(e) =>
                    handleUpdateTab(selectedTabData.tab_id, { icon: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {TAB_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Screen
                </label>
                <select
                  value={selectedTabData.root_screen_id}
                  onChange={(e) =>
                    handleUpdateTab(selectedTabData.tab_id, { root_screen_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {screens.map((screen) => (
                    <option key={screen.screen_id} value={screen.screen_id}>
                      {screen.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={selectedTabData.enabled}
                  onChange={(e) =>
                    handleUpdateTab(selectedTabData.tab_id, { enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">
                  Enabled
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Type
                </label>
                <select
                  value={selectedTabData.badge_type || "none"}
                  onChange={(e) =>
                    handleUpdateTab(selectedTabData.tab_id, { badge_type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="none">None</option>
                  <option value="dot">Dot</option>
                  <option value="count">Count</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a tab to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
