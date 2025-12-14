"use client";

import { useConfigStore } from "@/stores/configStore";
import { useSupabaseConfig } from "@/hooks/useSupabaseConfig";
import { 
  ThemeConfig, 
  FONT_FAMILIES, 
  ELEVATION_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  CARD_STYLE_OPTIONS,
  INPUT_STYLE_OPTIONS,
  CHIP_STYLE_OPTIONS,
  THEME_PRESETS,
  FontFamily,
  ElevationLevel,
  ButtonStyle,
  CardStyle,
  InputStyle,
  ChipStyle,
  ThemePreset,
} from "@/types";
import { Save, RotateCcw, Loader2, Palette, Type, Square, Layers, Sparkles, Component, Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function ThemeEditor() {
  const { theme, setTheme, isDirty } = useConfigStore();
  const { saveTheme: saveThemeToSupabase, isSaving } = useSupabaseConfig();

  const handleColorChange = (key: keyof ThemeConfig, value: string) => {
    setTheme({ [key]: value });
  };

  const handleSave = async () => {
    try {
      await saveThemeToSupabase();
      alert("Theme saved to Supabase!");
    } catch (error) {
      console.error("Failed to save theme:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  const handleReset = () => {
    if (confirm("Reset theme to defaults?")) {
      setTheme({
        primary_color: "#6750A4",
        secondary_color: "#958DA5",
        accent_color: "#7C4DFF",
        background_color: "#FFFBFE",
        surface_color: "#FFFFFF",
        text_color: "#1C1B1F",
        text_secondary_color: "#49454F",
        error_color: "#B3261E",
        success_color: "#2E7D32",
        warning_color: "#ED6C02",
        font_family: "Inter",
        font_scale: 1,
        border_radius_small: 4,
        border_radius_medium: 8,
        border_radius_large: 16,
        roundness: 12,
        card_elevation: "low",
        button_elevation: "none",
        button_style: "filled",
        card_style: "elevated",
        input_style: "outlined",
        chip_style: "filled",
        theme_preset: "custom",
      });
    }
  };

  // Get shadow style from elevation
  const getShadow = (elevation: ElevationLevel | undefined) => {
    const opt = ELEVATION_OPTIONS.find(e => e.value === elevation);
    return opt?.shadow || "none";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Editor</h1>
          <p className="text-gray-500 mt-1">
            Customize colors, typography, and styling
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-sm text-orange-500">Unsaved changes</span>}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Quick Start - Theme Presets</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setTheme({ ...preset.config, theme_preset: preset.value })}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                theme.theme_preset === preset.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div 
                className="w-full h-8 rounded mb-2 flex gap-1"
              >
                <div 
                  className="flex-1 rounded-l"
                  style={{ backgroundColor: preset.config.primary_color }}
                />
                <div 
                  className="flex-1 rounded-r"
                  style={{ backgroundColor: preset.config.secondary_color }}
                />
              </div>
              <div className="text-xs font-medium text-gray-900">{preset.label}</div>
              <div className="text-[10px] text-gray-500">{preset.description}</div>
            </button>
          ))}
          <button
            onClick={() => setTheme({ theme_preset: "custom" })}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              theme.theme_preset === "custom" || !theme.theme_preset
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-full h-8 rounded mb-2 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Custom</span>
            </div>
            <div className="text-xs font-medium text-gray-900">Custom</div>
            <div className="text-[10px] text-gray-500">Your own settings</div>
          </button>
        </div>
      </div>

      {/* Component Styles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Component size={18} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Component Styles</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Button Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
            <select
              value={theme.button_style || "filled"}
              onChange={(e) => setTheme({ button_style: e.target.value as ButtonStyle, theme_preset: "custom" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {BUTTON_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {BUTTON_STYLE_OPTIONS.find(o => o.value === (theme.button_style || "filled"))?.description}
            </p>
          </div>

          {/* Card Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cards</label>
            <select
              value={theme.card_style || "elevated"}
              onChange={(e) => setTheme({ card_style: e.target.value as CardStyle, theme_preset: "custom" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {CARD_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {CARD_STYLE_OPTIONS.find(o => o.value === (theme.card_style || "elevated"))?.description}
            </p>
          </div>

          {/* Input Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inputs</label>
            <select
              value={theme.input_style || "outlined"}
              onChange={(e) => setTheme({ input_style: e.target.value as InputStyle, theme_preset: "custom" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {INPUT_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {INPUT_STYLE_OPTIONS.find(o => o.value === (theme.input_style || "outlined"))?.description}
            </p>
          </div>

          {/* Chip Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chips/Tags</label>
            <select
              value={theme.chip_style || "filled"}
              onChange={(e) => setTheme({ chip_style: e.target.value as ChipStyle, theme_preset: "custom" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {CHIP_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {CHIP_STYLE_OPTIONS.find(o => o.value === (theme.chip_style || "filled"))?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={18} className="text-primary-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Dark Mode Support</h2>
              <p className="text-sm text-gray-500">Allow users to switch to dark theme</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={theme.dark_mode_enabled !== false}
              onChange={(e) => setTheme({ dark_mode_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Light Mode Colors */}
        <div className="space-y-6">
          {/* Light Mode Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-900">Light Mode Colors</h2>
            </div>

            <div className="space-y-4">
              <ColorPicker
                label="Primary"
                description="Main brand color"
                value={theme.primary_color}
                onChange={(v) => handleColorChange("primary_color", v)}
              />
              <ColorPicker
                label="Secondary"
                description="Supporting color"
                value={theme.secondary_color}
                onChange={(v) => handleColorChange("secondary_color", v)}
              />
              <ColorPicker
                label="Background"
                description="App background"
                value={theme.background_color}
                onChange={(v) => handleColorChange("background_color", v)}
              />
              <ColorPicker
                label="Surface"
                description="Cards & containers"
                value={theme.surface_color}
                onChange={(v) => handleColorChange("surface_color", v)}
              />
              <ColorPicker
                label="Text"
                description="Primary text"
                value={theme.text_color}
                onChange={(v) => handleColorChange("text_color", v)}
              />
              <ColorPicker
                label="Text Secondary"
                description="Secondary text"
                value={theme.text_secondary_color || "#49454F"}
                onChange={(v) => handleColorChange("text_secondary_color", v)}
              />
            </div>
          </div>

          {/* Status Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Status Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Error"
                description="Error states"
                value={theme.error_color || "#B3261E"}
                onChange={(v) => handleColorChange("error_color", v)}
              />
              <ColorPicker
                label="Success"
                description="Success states"
                value={theme.success_color || "#2E7D32"}
                onChange={(v) => handleColorChange("success_color", v)}
              />
              <ColorPicker
                label="Warning"
                description="Warning states"
                value={theme.warning_color || "#ED6C02"}
                onChange={(v) => handleColorChange("warning_color", v)}
              />
            </div>
          </div>

          {/* Dark Mode Colors */}
          {theme.dark_mode_enabled !== false && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Moon size={18} className="text-purple-400" />
                <h2 className="font-semibold text-white">Dark Mode Colors</h2>
              </div>
              <div className="space-y-4">
                <ColorPicker
                  label="Primary"
                  description="Main brand color (dark)"
                  value={theme.primary_color_dark || "#D0BCFF"}
                  onChange={(v) => handleColorChange("primary_color_dark", v)}
                  dark
                />
                <ColorPicker
                  label="Secondary"
                  description="Supporting color (dark)"
                  value={theme.secondary_color_dark || "#CCC2DC"}
                  onChange={(v) => handleColorChange("secondary_color_dark", v)}
                  dark
                />
                <ColorPicker
                  label="Background"
                  description="App background (dark)"
                  value={theme.background_color_dark || "#1C1B1F"}
                  onChange={(v) => handleColorChange("background_color_dark", v)}
                  dark
                />
                <ColorPicker
                  label="Surface"
                  description="Cards & containers (dark)"
                  value={theme.surface_color_dark || "#1C1B1F"}
                  onChange={(v) => handleColorChange("surface_color_dark", v)}
                  dark
                />
                <ColorPicker
                  label="Text"
                  description="Primary text (dark)"
                  value={theme.text_color_dark || "#E6E1E5"}
                  onChange={(v) => handleColorChange("text_color_dark", v)}
                  dark
                />
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Typography & Radius */}
        <div className="space-y-6">
          {/* Typography */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type size={18} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Typography</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={theme.font_family || "Inter"}
                  onChange={(e) => setTheme({ font_family: e.target.value as FontFamily })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Scale: {(theme.font_scale || 1).toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={theme.font_scale || 1}
                  onChange={(e) => setTheme({ font_scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.8x</span>
                  <span>1.0x</span>
                  <span>1.5x</span>
                </div>
              </div>

              {/* Font Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <p 
                  className="text-lg font-semibold" 
                  style={{ 
                    fontFamily: theme.font_family === "System Default" ? "system-ui" : theme.font_family,
                    fontSize: `${18 * (theme.font_scale || 1)}px`
                  }}
                >
                  Heading Text
                </p>
                <p 
                  className="text-sm text-gray-600"
                  style={{ 
                    fontFamily: theme.font_family === "System Default" ? "system-ui" : theme.font_family,
                    fontSize: `${14 * (theme.font_scale || 1)}px`
                  }}
                >
                  Body text example with the selected font.
                </p>
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Square size={18} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Border Radius</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Small: {theme.border_radius_small || 4}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={theme.border_radius_small || 4}
                  onChange={(e) => setTheme({ border_radius_small: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium: {theme.border_radius_medium || 8}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={theme.border_radius_medium || 8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTheme({ border_radius_medium: val, roundness: val });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Large: {theme.border_radius_large || 16}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={theme.border_radius_large || 16}
                  onChange={(e) => setTheme({ border_radius_large: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Radius Preview */}
              <div className="flex gap-3 mt-4">
                <div className="text-center">
                  <div 
                    className="w-12 h-12 bg-primary-100 border-2 border-primary-300"
                    style={{ borderRadius: `${theme.border_radius_small || 4}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">Small</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 bg-primary-100 border-2 border-primary-300"
                    style={{ borderRadius: `${theme.border_radius_medium || 8}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">Medium</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 bg-primary-100 border-2 border-primary-300"
                    style={{ borderRadius: `${theme.border_radius_large || 16}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">Large</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elevation / Shadows */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Elevation / Shadows</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Elevation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ELEVATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme({ card_elevation: opt.value })}
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        theme.card_elevation === opt.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Elevation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ELEVATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme({ button_elevation: opt.value })}
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        theme.button_elevation === opt.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shadow Preview */}
              <div className="flex gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {ELEVATION_OPTIONS.map((opt) => (
                  <div key={opt.value} className="text-center">
                    <div 
                      className="w-14 h-14 bg-white rounded-lg"
                      style={{ boxShadow: opt.shadow }}
                    />
                    <span className="text-xs text-gray-500 mt-1">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Live Preview</h2>

          <div
            className="p-4 rounded-xl min-h-[500px]"
            style={{ backgroundColor: theme.background_color }}
          >
            {/* Header Preview */}
            <div 
              className="p-3 mb-4"
              style={{ 
                backgroundColor: theme.primary_color,
                borderRadius: `${theme.border_radius_medium || 8}px`
              }}
            >
              <span className="text-white font-semibold">App Header</span>
            </div>

            {/* Card Preview */}
            <div
              className="p-4 mb-4"
              style={{
                backgroundColor: theme.surface_color,
                borderRadius: `${theme.border_radius_large || 16}px`,
                boxShadow: getShadow(theme.card_elevation),
              }}
            >
              <div 
                className="font-semibold mb-2" 
                style={{ 
                  color: theme.text_color,
                  fontFamily: theme.font_family === "System Default" ? "system-ui" : theme.font_family,
                  fontSize: `${16 * (theme.font_scale || 1)}px`
                }}
              >
                Card Title
              </div>
              <div 
                className="text-sm mb-3" 
                style={{ 
                  color: theme.text_secondary_color || theme.text_color + "99",
                  fontFamily: theme.font_family === "System Default" ? "system-ui" : theme.font_family,
                  fontSize: `${14 * (theme.font_scale || 1)}px`
                }}
              >
                This is sample card content showing how text appears.
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 text-white text-sm font-medium"
                  style={{
                    backgroundColor: theme.primary_color,
                    borderRadius: `${theme.border_radius_small || 4}px`,
                    boxShadow: getShadow(theme.button_elevation),
                  }}
                >
                  Primary
                </button>
                <button
                  className="px-3 py-1.5 text-sm font-medium"
                  style={{
                    backgroundColor: theme.secondary_color,
                    color: theme.text_color,
                    borderRadius: `${theme.border_radius_small || 4}px`,
                  }}
                >
                  Secondary
                </button>
              </div>
            </div>

            {/* Status Colors Preview */}
            <div className="flex gap-2 mb-4">
              <div 
                className="px-3 py-1 text-xs text-white rounded-full"
                style={{ backgroundColor: theme.success_color || "#2E7D32" }}
              >
                Success
              </div>
              <div 
                className="px-3 py-1 text-xs text-white rounded-full"
                style={{ backgroundColor: theme.warning_color || "#ED6C02" }}
              >
                Warning
              </div>
              <div 
                className="px-3 py-1 text-xs text-white rounded-full"
                style={{ backgroundColor: theme.error_color || "#B3261E" }}
              >
                Error
              </div>
            </div>

            {/* Input Preview */}
            <div
              className="p-3 border mb-4"
              style={{
                borderRadius: `${theme.border_radius_medium || 8}px`,
                borderColor: theme.text_color + "30",
                backgroundColor: theme.surface_color,
              }}
            >
              <span style={{ color: theme.text_secondary_color || theme.text_color + "60" }}>
                Input placeholder...
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex flex-wrap gap-2">
              <ColorSwatch color={theme.primary_color} label="Primary" />
              <ColorSwatch color={theme.secondary_color} label="Secondary" />
              <ColorSwatch color={theme.surface_color} label="Surface" border />
              <ColorSwatch color={theme.text_color} label="Text" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  description,
  value,
  onChange,
  dark = false,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
      />
      <div className="flex-1">
        <div className={`text-sm font-medium ${dark ? "text-gray-200" : "text-gray-700"}`}>{label}</div>
        {description && (
          <div className={`text-xs ${dark ? "text-gray-400" : "text-gray-400"}`}>{description}</div>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs w-20 px-2 py-1 border rounded text-center ${dark ? "bg-gray-800 border-gray-600 text-gray-300" : "text-gray-500"}`}
      />
    </div>
  );
}

function ColorSwatch({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`w-10 h-10 rounded-lg ${border ? "border border-gray-200" : ""}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
