"use client";

import { DrawerMenuItem, DRAWER_ACTIONS, BADGE_SOURCES } from "@/types/drawer.types";
import { Role } from "@/types";
import { getScreensForRole } from "@/config/screenRegistry";

type Props = {
  item: DrawerMenuItem | null;
  role: Role;
  onUpdate: (updates: Partial<DrawerMenuItem>) => void;
};

// Available icons
const MENU_ICONS = [
  "home",
  "book-open",
  "calendar",
  "bar-chart-2",
  "settings",
  "users",
  "bell",
  "star",
  "heart",
  "circle",
  "message-circle",
  "file-text",
  "download",
  "trophy",
  "gift",
  "help-circle",
  "share",
  "credit-card",
  "clipboard",
  "user-check",
  "user-plus",
  "check-square",
  "minus",
  "chevron-right",
  "folder-open",
  "log-out",
];

export const MenuItemEditor: React.FC<Props> = ({ item, role, onUpdate }) => {
  const screens = getScreensForRole(role);

  if (!item) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center text-gray-400">
          <p className="text-sm">Select an item to edit its properties</p>
        </div>
      </div>
    );
  }

  const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }> = ({ label, value, onChange, placeholder }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  );

  const SelectField: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }> = ({ label, value, options, onChange }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const ToggleField: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-primary-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-900">Item Properties</h2>
        <p className="text-xs text-gray-500 mt-1">ID: {item.item_id}</p>
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Item Type */}
        <SelectField
          label="Item Type"
          value={item.item_type}
          options={[
            { value: "link", label: "Navigation Link" },
            { value: "action", label: "Action (e.g., Logout)" },
            { value: "divider", label: "Divider Line" },
            { value: "section_header", label: "Section Header" },
            { value: "expandable", label: "Expandable Group" },
          ]}
          onChange={(v) => onUpdate({ item_type: v as DrawerMenuItem["item_type"] })}
        />

        {/* Labels - not for dividers */}
        {item.item_type !== "divider" && (
          <>
            <InputField
              label="Label (English)"
              value={item.label_en}
              onChange={(v) => onUpdate({ label_en: v })}
              placeholder="Enter label"
            />
            <InputField
              label="Label (Hindi)"
              value={item.label_hi || ""}
              onChange={(v) => onUpdate({ label_hi: v })}
              placeholder="Hindi translation (optional)"
            />
          </>
        )}

        {/* Icon - not for dividers */}
        {item.item_type !== "divider" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {MENU_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => onUpdate({ icon })}
                  className={`p-2 rounded text-xs flex items-center justify-center transition-colors ${
                    item.icon === icon
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  title={icon}
                >
                  {icon.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Selected: {item.icon}</p>
          </div>
        )}

        {/* Icon Color */}
        {item.item_type !== "divider" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Icon Color
            </label>
            <input
              type="color"
              value={item.icon_color || "#6B7280"}
              onChange={(e) => onUpdate({ icon_color: e.target.value })}
              className="w-full h-8 rounded border border-gray-200 cursor-pointer"
            />
          </div>
        )}

        {/* Route - for links */}
        {item.item_type === "link" && (
          <SelectField
            label="Target Screen"
            value={item.route || ""}
            options={[
              { value: "", label: "-- Select Screen --" },
              ...screens.map((s) => ({
                value: s.screen_id,
                label: s.name,
              })),
            ]}
            onChange={(v) => onUpdate({ route: v })}
          />
        )}

        {/* Action - for action type */}
        {item.item_type === "action" && (
          <SelectField
            label="Action"
            value={item.action_id || ""}
            options={[
              { value: "", label: "-- Select Action --" },
              ...DRAWER_ACTIONS.map((a) => ({
                value: a.id,
                label: a.label,
              })),
            ]}
            onChange={(v) => onUpdate({ action_id: v })}
          />
        )}

        {/* Badge - not for dividers and section headers */}
        {item.item_type !== "divider" && item.item_type !== "section_header" && (
          <>
            <SelectField
              label="Badge Type"
              value={item.badge_type}
              options={[
                { value: "none", label: "No Badge" },
                { value: "dot", label: "Dot Indicator" },
                { value: "count", label: "Count Badge" },
              ]}
              onChange={(v) =>
                onUpdate({ badge_type: v as DrawerMenuItem["badge_type"] })
              }
            />

            {item.badge_type !== "none" && (
              <>
                <SelectField
                  label="Badge Source"
                  value={item.badge_source || ""}
                  options={[
                    { value: "", label: "-- Select Source --" },
                    ...BADGE_SOURCES.map((s) => ({
                      value: s.id,
                      label: s.label,
                    })),
                  ]}
                  onChange={(v) => onUpdate({ badge_source: v })}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={item.badge_color || "#EF4444"}
                    onChange={(e) => onUpdate({ badge_color: e.target.value })}
                    className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Styling Options */}
        {item.item_type !== "divider" && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-3">
                Styling
              </p>
              <div className="space-y-3">
                <ToggleField
                  label="Highlight Item"
                  checked={item.highlight || false}
                  onChange={(checked) => onUpdate({ highlight: checked })}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={item.text_color || "#374151"}
                    onChange={(e) => onUpdate({ text_color: e.target.value })}
                    className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Visibility */}
        <div className="pt-2 border-t border-gray-100">
          <ToggleField
            label="Enabled"
            checked={item.enabled}
            onChange={(checked) => onUpdate({ enabled: checked })}
          />
        </div>
      </div>
    </div>
  );
};
