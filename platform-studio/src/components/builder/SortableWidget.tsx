"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ScreenWidgetConfig, WidgetMetadata } from "@/types";
import { GripVertical, Trash2, Settings } from "lucide-react";

type SortableWidgetProps = {
  widget: ScreenWidgetConfig;
  metadata?: WidgetMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

export function SortableWidget({
  widget,
  metadata,
  isSelected,
  onSelect,
  onDelete,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.widget_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sizeStyles = {
    compact: "min-h-[60px]",
    standard: "min-h-[100px]",
    expanded: "min-h-[160px]",
  };

  if (!metadata) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Unknown widget: {widget.widget_id}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 transition-colors ${
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${!widget.enabled ? "opacity-50" : ""} ${sizeStyles[widget.size]}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} className="text-gray-400" />
        </button>

        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
          {metadata.name}
        </span>

        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
          {widget.size}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Preview area */}
      <div className="p-3 flex items-center justify-center text-gray-400 text-xs">
        {metadata.description}
      </div>
    </div>
  );
}
