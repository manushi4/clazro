"use client";

import { DrawerConfig } from "@/types/drawer.types";
import {
  Settings,
  Maximize,
  Palette,
  Play,
  User,
  Footprints,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

type Props = {
  config: DrawerConfig;
  onUpdate: (updates: Partial<DrawerConfig>) => void;
};

type SectionKey = "position" | "dimensions" | "appearance" | "animation" | "header" | "footer" | "behavior";

export const DrawerSettingsPanel: React.FC<Props> = ({ config, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<SectionKey[]>([
    "position",
    "dimensions",
    "appearance",
  ]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const Section: React.FC<{
    id: SectionKey;
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }> = ({ id, icon, title, children }) => {
    const isExpanded = expandedSections.includes(id);

    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-gray-700">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>
        {isExpanded && <div className="px-4 pb-4 space-y-4">{children}</div>}
      </div>
    );
  };

  const InputField: React.FC<{
    label: string;
    type?: "text" | "number";
    value: string | number;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    suffix?: string;
  }> = ({ label, type = "text", value, onChange, min, max, suffix }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>
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
        value={value}
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

  const SliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    suffix?: string;
  }> = ({ label, value, min, max, onChange, suffix = "" }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs text-gray-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
      />
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
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings size={18} />
          Drawer Settings
        </h2>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {/* Enable/Disable */}
        <div className="p-4 border-b border-gray-100">
          <ToggleField
            label="Enable Drawer"
            checked={config.enabled}
            onChange={(checked) => onUpdate({ enabled: checked })}
          />
        </div>

        {/* Position & Trigger */}
        <Section
          id="position"
          icon={<Smartphone size={16} />}
          title="Position & Trigger"
        >
          <SelectField
            label="Position"
            value={config.position}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onUpdate({ position: v as "left" | "right" })}
          />
          <SelectField
            label="Trigger Type"
            value={config.trigger_type}
            options={[
              { value: "hamburger", label: "Hamburger Menu Only" },
              { value: "swipe", label: "Swipe Only" },
              { value: "both", label: "Both" },
            ]}
            onChange={(v) =>
              onUpdate({ trigger_type: v as "hamburger" | "swipe" | "both" })
            }
          />
          <SliderField
            label="Swipe Edge Width"
            value={config.swipe_edge_width}
            min={10}
            max={50}
            suffix="px"
            onChange={(v) => onUpdate({ swipe_edge_width: v })}
          />
        </Section>

        {/* Dimensions */}
        <Section
          id="dimensions"
          icon={<Maximize size={16} />}
          title="Dimensions"
        >
          <SliderField
            label="Width"
            value={config.width_percentage}
            min={50}
            max={100}
            suffix="%"
            onChange={(v) => onUpdate({ width_percentage: v })}
          />
          <InputField
            label="Max Width"
            type="number"
            value={config.width_max_px}
            min={200}
            max={500}
            suffix="px"
            onChange={(v) => onUpdate({ width_max_px: Number(v) })}
          />
        </Section>

        {/* Appearance */}
        <Section
          id="appearance"
          icon={<Palette size={16} />}
          title="Appearance"
        >
          <SelectField
            label="Background Style"
            value={config.background_style}
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
              { value: "blur", label: "Blur" },
            ]}
            onChange={(v) =>
              onUpdate({ background_style: v as "solid" | "gradient" | "blur" })
            }
          />
          <SliderField
            label="Background Opacity"
            value={config.background_opacity}
            min={50}
            max={100}
            suffix="%"
            onChange={(v) => onUpdate({ background_opacity: v })}
          />
          <SliderField
            label="Overlay Opacity"
            value={config.overlay_opacity}
            min={0}
            max={80}
            suffix="%"
            onChange={(v) => onUpdate({ overlay_opacity: v })}
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Overlay Color
            </label>
            <input
              type="color"
              value={config.overlay_color}
              onChange={(e) => onUpdate({ overlay_color: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
          </div>
          <SliderField
            label="Border Radius"
            value={config.border_radius}
            min={0}
            max={24}
            suffix="px"
            onChange={(v) => onUpdate({ border_radius: v })}
          />
          <ToggleField
            label="Shadow"
            checked={config.shadow_enabled}
            onChange={(checked) => onUpdate({ shadow_enabled: checked })}
          />
          {config.shadow_enabled && (
            <SliderField
              label="Shadow Opacity"
              value={config.shadow_opacity}
              min={10}
              max={60}
              suffix="%"
              onChange={(v) => onUpdate({ shadow_opacity: v })}
            />
          )}
        </Section>

        {/* Animation */}
        <Section id="animation" icon={<Play size={16} />} title="Animation">
          <SelectField
            label="Animation Type"
            value={config.animation_type}
            options={[
              { value: "slide", label: "Slide" },
              { value: "push", label: "Push (Content Shifts)" },
              { value: "reveal", label: "Reveal (Content Slides)" },
              { value: "fade", label: "Fade" },
            ]}
            onChange={(v) =>
              onUpdate({ animation_type: v as "slide" | "push" | "reveal" | "fade" })
            }
          />
          <SliderField
            label="Duration"
            value={config.animation_duration}
            min={150}
            max={500}
            suffix="ms"
            onChange={(v) => onUpdate({ animation_duration: v })}
          />
        </Section>

        {/* Header */}
        <Section id="header" icon={<User size={16} />} title="Header">
          <SelectField
            label="Header Style"
            value={config.header_style}
            options={[
              { value: "avatar", label: "Avatar with User Info" },
              { value: "logo", label: "App Logo" },
              { value: "compact", label: "Compact" },
              { value: "none", label: "No Header" },
            ]}
            onChange={(v) =>
              onUpdate({ header_style: v as "avatar" | "logo" | "compact" | "none" })
            }
          />
          {config.header_style !== "none" && (
            <>
              <SelectField
                label="Header Background"
                value={config.header_background_style}
                options={[
                  { value: "gradient", label: "Gradient" },
                  { value: "solid", label: "Solid Color" },
                  { value: "image", label: "Image" },
                  { value: "none", label: "Transparent" },
                ]}
                onChange={(v) =>
                  onUpdate({
                    header_background_style: v as "gradient" | "solid" | "image" | "none",
                  })
                }
              />
              <SliderField
                label="Header Height"
                value={config.header_height}
                min={100}
                max={250}
                suffix="px"
                onChange={(v) => onUpdate({ header_height: v })}
              />
              <ToggleField
                label="Show Role"
                checked={config.header_show_role}
                onChange={(checked) => onUpdate({ header_show_role: checked })}
              />
              <ToggleField
                label="Show Email"
                checked={config.header_show_email}
                onChange={(checked) => onUpdate({ header_show_email: checked })}
              />
            </>
          )}
        </Section>

        {/* Footer */}
        <Section id="footer" icon={<Footprints size={16} />} title="Footer">
          <ToggleField
            label="Enable Footer"
            checked={config.footer_enabled}
            onChange={(checked) => onUpdate({ footer_enabled: checked })}
          />
          {config.footer_enabled && (
            <>
              <ToggleField
                label="Show Logout Button"
                checked={config.footer_show_logout}
                onChange={(checked) =>
                  onUpdate({ footer_show_logout: checked })
                }
              />
              <ToggleField
                label="Show App Version"
                checked={config.footer_show_version}
                onChange={(checked) =>
                  onUpdate({ footer_show_version: checked })
                }
              />
            </>
          )}
        </Section>

        {/* Behavior */}
        <Section id="behavior" icon={<Settings size={16} />} title="Behavior">
          <ToggleField
            label="Close on Item Select"
            checked={config.close_on_select}
            onChange={(checked) => onUpdate({ close_on_select: checked })}
          />
          <ToggleField
            label="Haptic Feedback"
            checked={config.haptic_feedback}
            onChange={(checked) => onUpdate({ haptic_feedback: checked })}
          />
        </Section>
      </div>
    </div>
  );
};
