"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ROLES, ROLE_LABELS, Role, ScreenWidgetConfig } from "@/types";
import { getScreensForRole } from "@/config/screenRegistry";
import { getWidgetsForRole, widgetRegistry } from "@/config/widgetRegistry";
import { SortableWidget } from "@/components/builder/SortableWidget";
import { WidgetPalette } from "@/components/builder/WidgetPalette";
import { DevicePreview } from "@/components/preview/DevicePreview";
import { useConfigStore } from "@/stores/configStore";
import { useSupabaseConfig } from "@/hooks/useSupabaseConfig";
import { Eye, Save, Loader2, Settings } from "lucide-react";
import { WidgetPropertiesPanel } from "@/components/builder/WidgetPropertiesPanel";

export default function ScreenBuilder() {
  const {
    selectedRole,
    setSelectedRole,
    screenLayouts,
    tabs,
    setScreenLayout,
    theme,
    branding,
    isDirty,
  } = useConfigStore();

  const { saveScreen, isSaving } = useSupabaseConfig();

  // Get the first tab's root screen as default
  const currentTabs = tabs[selectedRole];
  const defaultScreen = currentTabs[0]?.root_screen_id || "student-home";

  const [selectedScreen, setSelectedScreen] = useState(defaultScreen);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Update selected screen when role changes
  useEffect(() => {
    const firstTab = tabs[selectedRole][0];
    if (firstTab) {
      setSelectedScreen(firstTab.root_screen_id);
    }
    setSelectedWidget(null);
  }, [selectedRole, tabs]);

  const screens = getScreensForRole(selectedRole);
  const availableWidgets = getWidgetsForRole(selectedRole);

  // Get current widgets from store
  const currentWidgets = screenLayouts[selectedRole][selectedScreen]?.widgets || [];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const isFromPalette = active.data.current?.fromPalette;
    const isDropOnCanvas = over.id === "canvas-drop-zone";

    if (isFromPalette) {
      // Dropping from palette - either on canvas or on existing widget
      if (isDropOnCanvas || currentWidgets.some((w) => w.widget_id === over.id)) {
        const widgetId = active.id as string;
        const existingWidget = currentWidgets.find((w) => w.widget_id === widgetId);
        if (existingWidget) return;

        const metadata = widgetRegistry[widgetId];
        if (!metadata) return;

        const newWidget: ScreenWidgetConfig = {
          widget_id: widgetId,
          position: currentWidgets.length + 1,
          size: metadata.defaultSize,
          enabled: true,
        };

        setScreenLayout(selectedRole, selectedScreen, [...currentWidgets, newWidget]);
        setSelectedWidget(widgetId);
      }
    } else if (over && active.id !== over.id && !isDropOnCanvas) {
      // Reordering existing widgets
      const oldIndex = currentWidgets.findIndex((i) => i.widget_id === active.id);
      const newIndex = currentWidgets.findIndex((i) => i.widget_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentWidgets, oldIndex, newIndex);
        setScreenLayout(
          selectedRole,
          selectedScreen,
          reordered.map((w, index) => ({ ...w, position: index + 1 }))
        );
      }
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    setScreenLayout(
      selectedRole,
      selectedScreen,
      currentWidgets.filter((w) => w.widget_id !== widgetId)
    );
    if (selectedWidget === widgetId) setSelectedWidget(null);
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<ScreenWidgetConfig>) => {
    setScreenLayout(
      selectedRole,
      selectedScreen,
      currentWidgets.map((w) => (w.widget_id === widgetId ? { ...w, ...updates } : w))
    );
  };

  const handleSave = async () => {
    try {
      await saveScreen(selectedRole, selectedScreen);
      alert("Screen layout saved to Supabase!");
    } catch (error) {
      console.error("Failed to save screen layout:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  const selectedWidgetData = currentWidgets.find((w) => w.widget_id === selectedWidget);
  const selectedWidgetMeta = selectedWidget ? widgetRegistry[selectedWidget] : null;

  // Get screens that are used as root screens in tabs
  const tabScreens = currentTabs.map((t) => t.root_screen_id);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Screen Builder</h1>
            <p className="text-sm text-gray-500">Drag widgets to build screens</p>
          </div>

          {/* Role selector */}
          <div className="flex gap-1 ml-8">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  selectedRole === role
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>

          {/* Screen selector - only show screens from tabs */}
          <select
            value={selectedScreen}
            onChange={(e) => {
              setSelectedScreen(e.target.value);
              setSelectedWidget(null);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {screens
              .filter((s) => tabScreens.includes(s.screen_id))
              .map((screen) => (
                <option key={screen.screen_id} value={screen.screen_id}>
                  {screen.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-sm text-orange-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Widget Palette */}
          <WidgetPalette
            widgets={availableWidgets}
            usedWidgetIds={currentWidgets.map((w) => w.widget_id)}
          />

          {/* Canvas */}
          <div className="flex-1 p-6 overflow-auto bg-gray-50">
            <div className="max-w-md mx-auto">
              <div className="mb-4 text-center">
                <span className="text-sm font-medium text-gray-600">
                  {screens.find((s) => s.screen_id === selectedScreen)?.name || selectedScreen}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({currentWidgets.length} widgets)
                </span>
              </div>

              <DroppableCanvas
                widgets={currentWidgets}
                selectedWidget={selectedWidget}
                onSelectWidget={setSelectedWidget}
                onDeleteWidget={handleDeleteWidget}
              />
            </div>
          </div>

          {/* Right Panel - Properties + Preview side by side */}
          <div className="flex border-l">
            {/* Properties Panel - always visible when widget selected */}
            {selectedWidgetData && selectedWidgetMeta && (
              <div className="w-72 border-r bg-white overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Widget Properties</span>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <WidgetPropertiesPanel
                    widget={selectedWidgetData}
                    metadata={selectedWidgetMeta}
                    onUpdate={(updates) => handleUpdateWidget(selectedWidgetData.widget_id, updates)}
                  />
                </div>
              </div>
            )}

            {/* Preview Panel - always visible */}
            <div className="w-80 bg-white overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Real-time
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <DevicePreview
                  widgets={currentWidgets}
                  tabs={currentTabs}
                  theme={theme}
                  branding={branding}
                  selectedScreen={selectedScreen}
                />
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId && widgetRegistry[activeId] && (
              <div className="bg-white border-2 border-primary-500 rounded-lg p-3 shadow-lg">
                <span className="font-medium">{widgetRegistry[activeId].name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}


// Droppable canvas component that accepts widgets from palette
function DroppableCanvas({
  widgets,
  selectedWidget,
  onSelectWidget,
  onDeleteWidget,
}: {
  widgets: ScreenWidgetConfig[];
  selectedWidget: string | null;
  onSelectWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-xl border-2 border-dashed min-h-[600px] p-4 transition-colors ${
        isOver ? "border-primary-500 bg-primary-50" : "border-gray-300"
      }`}
    >
      <SortableContext
        items={widgets.map((w) => w.widget_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {widgets.map((widget) => (
            <SortableWidget
              key={widget.widget_id}
              widget={widget}
              metadata={widgetRegistry[widget.widget_id]}
              isSelected={selectedWidget === widget.widget_id}
              onSelect={() => onSelectWidget(widget.widget_id)}
              onDelete={() => onDeleteWidget(widget.widget_id)}
            />
          ))}
        </div>
      </SortableContext>

      {widgets.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-400 py-20">
          {isOver ? "Drop widget here!" : "Drag widgets here from the palette"}
        </div>
      )}
    </div>
  );
}
