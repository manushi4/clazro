"use client";

import { DrawerMenuItem } from "@/types/drawer.types";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Trash2, Eye, EyeOff } from "lucide-react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

type Props = {
  items: DrawerMenuItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  onReorder: (items: DrawerMenuItem[]) => void;
  onDelete: (itemId: string) => void;
  onAdd: () => void;
  onToggleEnabled: (itemId: string, enabled: boolean) => void;
};

// Icon helper
const getIcon = (name: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    home: Icons.Home,
    "book-open": Icons.BookOpen,
    calendar: Icons.Calendar,
    "bar-chart-2": Icons.BarChart2,
    settings: Icons.Settings,
    users: Icons.Users,
    bell: Icons.Bell,
    "log-out": Icons.LogOut,
    star: Icons.Star,
    heart: Icons.Heart,
    circle: Icons.Circle,
    "message-circle": Icons.MessageCircle,
    "file-text": Icons.FileText,
    download: Icons.Download,
    trophy: Icons.Trophy,
    gift: Icons.Gift,
    "help-circle": Icons.HelpCircle,
    share: Icons.Share2,
    "credit-card": Icons.CreditCard,
    clipboard: Icons.Clipboard,
    "user-check": Icons.UserCheck,
    "user-plus": Icons.UserPlus,
    "check-square": Icons.CheckSquare,
    minus: Icons.Minus,
    "chevron-right": Icons.ChevronRight,
    "folder-open": Icons.FolderOpen,
  };
  return iconMap[name] || Icons.Circle;
};

// Sortable Item Component
const SortableMenuItem: React.FC<{
  item: DrawerMenuItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}> = ({ item, isSelected, onSelect, onDelete, onToggleEnabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = getIcon(item.icon);

  // Type-specific styling
  const getTypeLabel = () => {
    switch (item.item_type) {
      case "divider":
        return { label: "Divider", color: "bg-gray-100 text-gray-500" };
      case "section_header":
        return { label: "Section", color: "bg-blue-100 text-blue-600" };
      case "action":
        return { label: "Action", color: "bg-orange-100 text-orange-600" };
      case "expandable":
        return { label: "Expandable", color: "bg-purple-100 text-purple-600" };
      default:
        return { label: "Link", color: "bg-green-100 text-green-600" };
    }
  };

  const typeInfo = getTypeLabel();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white border rounded-lg transition-all ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${
        isSelected
          ? "border-primary-500 ring-2 ring-primary-100"
          : "border-gray-200 hover:border-gray-300"
      } ${!item.enabled ? "opacity-60" : ""}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          item.item_type === "divider" ? "bg-gray-100" : "bg-gray-100"
        }`}
      >
        <IconComponent
          size={16}
          style={{ color: item.icon_color || "#6B7280" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="font-medium text-sm text-gray-800 truncate">
            {item.label_en || "(No label)"}
          </span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${typeInfo.color}`}
          >
            {typeInfo.label}
          </span>
        </div>
        {item.route && (
          <p className="text-xs text-gray-400 truncate">{item.route}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled(!item.enabled);
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title={item.enabled ? "Hide" : "Show"}
        >
          {item.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const MenuItemList: React.FC<Props> = ({
  items,
  selectedItemId,
  onSelect,
  onReorder,
  onDelete,
  onAdd,
  onToggleEnabled,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.item_id === active.id);
      const newIndex = items.findIndex((i) => i.item_id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order_index: index + 1,
        })
      );
      onReorder(reordered);
    }
  };

  const activeItem = items.find((i) => i.item_id === activeId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-900">
          Menu Items ({items.length})
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icons.Menu size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No menu items yet</p>
            <p className="text-xs mt-1">Click Add Item to get started</p>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.item_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableMenuItem
                    key={item.item_id}
                    item={item}
                    isSelected={selectedItemId === item.item_id}
                    onSelect={() => onSelect(item.item_id)}
                    onDelete={() => onDelete(item.item_id)}
                    onToggleEnabled={(enabled) =>
                      onToggleEnabled(item.item_id, enabled)
                    }
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeItem && (
                <div className="bg-white border-2 border-primary-500 rounded-lg p-3 shadow-lg">
                  <span className="font-medium text-sm">
                    {activeItem.label_en}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};
