"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TabConfig } from "@/types";
import { GripVertical, Trash2 } from "lucide-react";

type SortableTabProps = {
  tab: TabConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canDelete: boolean;
};

export function SortableTab({
  tab,
  isSelected,
  onSelect,
  onDelete,
  canDelete,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.tab_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${!tab.enabled ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} className="text-gray-400" />
      </button>

      {/* Tab info */}
      <div className="flex-1">
        <div className="font-medium text-gray-900">{tab.label}</div>
        <div className="text-xs text-gray-500">
          {tab.icon} • {tab.root_screen_id}
        </div>
      </div>

      {/* Order badge */}
      <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium text-gray-600">
        {tab.order_index}
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
