"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { WidgetMetadata, WidgetCategory } from "@/types";
import { WIDGET_CATEGORIES } from "@/config/widgetRegistry";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

type WidgetPaletteProps = {
  widgets: WidgetMetadata[];
  usedWidgetIds: string[];
};

export function WidgetPalette({ widgets, usedWidgetIds }: WidgetPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "schedule",
    "study",
  ]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const widgetsByCategory = WIDGET_CATEGORIES.map((cat) => ({
    ...cat,
    widgets: widgets.filter((w) => w.category === cat.id),
  })).filter((cat) => cat.widgets.length > 0);

  return (
    <div className="w-64 border-r bg-white overflow-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Widgets</h3>
        <p className="text-xs text-gray-500 mt-1">Drag to add to screen</p>
      </div>

      <div className="p-2">
        {widgetsByCategory.map((category) => (
          <div key={category.id} className="mb-2">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {expandedCategories.includes(category.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {category.label}
              <span className="ml-auto text-xs text-gray-400">
                {category.widgets.length}
              </span>
            </button>

            {expandedCategories.includes(category.id) && (
              <div className="ml-4 space-y-1">
                {category.widgets.map((widget) => (
                  <DraggableWidget
                    key={widget.id}
                    widget={widget}
                    isUsed={usedWidgetIds.includes(widget.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableWidget({
  widget,
  isUsed,
}: {
  widget: WidgetMetadata;
  isUsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    data: { fromPalette: true, widget },
    disabled: isUsed,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        isUsed
          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
          : isDragging
          ? "bg-primary-100 text-primary-700"
          : "bg-white border border-gray-200 text-gray-700 hover:border-primary-300 cursor-grab"
      }`}
    >
      <span className="flex-1 truncate">{widget.name}</span>
      {isUsed && <Check size={14} className="text-green-500" />}
    </div>
  );
}
