"use client";

import { useEffect, useState } from "react";
import { ROLES, ROLE_LABELS, Role } from "@/types";
import { useDrawerConfigStore } from "@/stores/drawerConfigStore";
import {
  DrawerPreview,
  DrawerSettingsPanel,
  MenuItemList,
  MenuItemEditor,
} from "@/components/drawer-builder";
import { Save, Loader2, RotateCcw, Menu } from "lucide-react";

export default function DrawerBuilder() {
  const {
    selectedRole,
    setSelectedRole,
    drawerConfigs,
    menuItems,
    updateConfig,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    loadFromSupabase,
    saveToSupabase,
    resetToDefaults,
    isDirty,
    isSaving,
    isLoading,
    error,
  } = useDrawerConfigStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  // Clear selected item when role changes
  useEffect(() => {
    setSelectedItemId(null);
  }, [selectedRole]);

  const currentConfig = drawerConfigs[selectedRole];
  const currentItems = menuItems[selectedRole];
  const selectedItem = currentItems.find((i) => i.item_id === selectedItemId);

  const handleSave = async () => {
    try {
      await saveToSupabase();
      alert("Drawer configuration saved successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save. Check console for details.");
    }
  };

  const handleReset = () => {
    if (confirm("Reset drawer settings to defaults? Menu items will be preserved.")) {
      resetToDefaults();
    }
  };

  const handleAddItem = () => {
    addMenuItem();
    // Select the newly added item
    const newItems = menuItems[selectedRole];
    if (newItems.length > 0) {
      setSelectedItemId(newItems[newItems.length - 1]?.item_id || null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Delete this menu item?")) {
      deleteMenuItem(itemId);
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    }
  };

  const handleToggleEnabled = (itemId: string, enabled: boolean) => {
    updateMenuItem(itemId, { enabled });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Menu size={24} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drawer Builder</h1>
            <p className="text-gray-500 mt-1">
              Configure the side navigation drawer for each role
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-sm text-orange-500 font-medium">
              Unsaved changes
            </span>
          )}
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex gap-2 mb-6">
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
            <span className="ml-2 text-xs opacity-70">
              ({menuItems[role].length} items)
            </span>
          </button>
        ))}
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Preview */}
        <div className="col-span-4">
          <DrawerPreview
            config={currentConfig}
            menuItems={currentItems}
            role={selectedRole}
          />
        </div>

        {/* Middle Column - Settings & Menu Items */}
        <div className="col-span-4 space-y-6">
          <DrawerSettingsPanel
            config={currentConfig}
            onUpdate={updateConfig}
          />
          <MenuItemList
            items={currentItems}
            selectedItemId={selectedItemId}
            onSelect={setSelectedItemId}
            onReorder={reorderMenuItems}
            onDelete={handleDeleteItem}
            onAdd={handleAddItem}
            onToggleEnabled={handleToggleEnabled}
          />
        </div>

        {/* Right Column - Item Editor */}
        <div className="col-span-4">
          <MenuItemEditor
            item={selectedItem || null}
            role={selectedRole}
            onUpdate={(updates) => {
              if (selectedItemId) {
                updateMenuItem(selectedItemId, updates);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
