"use client";

import { LayoutSettings, DEFAULT_LAYOUT_SETTINGS } from "@/stores/configStore";
import { Layers, Box, Maximize, Square, Sun, Moon } from "lucide-react";

type Props = {
  settings: LayoutSettings;
  onUpdate: (updates: Partial<LayoutSettings>) => void;
};

export function LayoutSettingsPanel({ settings, onUpdate }: Props) {
  const currentSettings = { ...DEFAULT_LAYOUT_SETTINGS, ...settings };

  return (
    <div className="p-4 space-y-5">
      {/* Container Style */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Container Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdate({ containerStyle: "card" })}
            className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
              currentSettings.containerStyle === "card"
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex flex-col gap-1 w-full px-1">
              <div className="h-3 bg-gray-200 rounded shadow-sm" />
              <div className="h-3 bg-gray-200 rounded shadow-sm" />
              <div className="h-3 bg-gray-200 rounded shadow-sm" />
            </div>
            <span className="text-[10px] font-medium text-gray-600">Card</span>
          </button>
          <button
            onClick={() => onUpdate({ containerStyle: "flat" })}
            className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
              currentSettings.containerStyle === "flat"
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-full px-1 bg-gray-100 rounded">
              <div className="h-3 border-b border-gray-200" />
              <div className="h-3 border-b border-gray-200" />
              <div className="h-3" />
            </div>
            <span className="text-[10px] font-medium text-gray-600">Flat</span>
          </button>
          <button
            onClick={() => onUpdate({ containerStyle: "seamless", showShadow: false })}
            className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
              currentSettings.containerStyle === "seamless"
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-full px-1 bg-gray-50 rounded h-[42px] flex">
              <div className="w-[3px] bg-blue-200 rounded-l" />
              <div className="flex-1 flex flex-col justify-center gap-1 px-1">
                <div className="h-2 w-8 bg-gray-300 rounded-sm" />
                <div className="h-3 bg-transparent" />
                <div className="h-2 w-8 bg-gray-300 rounded-sm" />
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-600">Seamless</span>
          </button>
        </div>
      </div>

      {/* Gap Between Widgets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <Layers size={12} />
            Widget Gap
          </label>
          <span className="text-xs text-gray-500">{currentSettings.gap}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          step="4"
          value={currentSettings.gap}
          onChange={(e) => onUpdate({ gap: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0</span>
          <span>16</span>
          <span>32</span>
        </div>
      </div>

      {/* Content Padding */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <Maximize size={12} />
            Content Padding
          </label>
          <span className="text-xs text-gray-500">{currentSettings.padding}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          step="4"
          value={currentSettings.padding}
          onChange={(e) => onUpdate({ padding: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0</span>
          <span>16</span>
          <span>32</span>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <Square size={12} />
            Border Radius
          </label>
          <span className="text-xs text-gray-500">{currentSettings.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          step="4"
          value={currentSettings.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0</span>
          <span>12</span>
          <span>24</span>
        </div>
      </div>

      {/* Shadow Toggle */}
      <div className="flex items-center justify-between py-2">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <Box size={12} />
          Show Shadow
        </label>
        <button
          onClick={() => onUpdate({ showShadow: !currentSettings.showShadow })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            currentSettings.showShadow ? "bg-primary-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              currentSettings.showShadow ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Preview */}
      <div className="pt-3 border-t">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Preview
        </label>
        <div
          className="bg-gray-100 rounded-lg p-3"
          style={{ padding: currentSettings.padding }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: currentSettings.containerStyle === "seamless" ? 8 : currentSettings.gap }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-10 relative flex ${
                  currentSettings.containerStyle === "card"
                    ? "bg-white"
                    : currentSettings.containerStyle === "seamless"
                    ? "bg-transparent"
                    : "bg-gray-50 border-b border-gray-200 last:border-b-0"
                }`}
                style={{
                  borderRadius:
                    currentSettings.containerStyle === "card"
                      ? currentSettings.borderRadius
                      : 0,
                  boxShadow:
                    currentSettings.containerStyle === "card" && currentSettings.showShadow
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                {/* Flow connector for seamless */}
                {currentSettings.containerStyle === "seamless" && (
                  <div className="w-[3px] bg-blue-200 rounded-sm mr-2" />
                )}
                {/* Inline title for seamless */}
                {currentSettings.containerStyle === "seamless" && (
                  <div className="flex flex-col justify-center">
                    <div className="text-[8px] text-gray-400 uppercase tracking-wide">Section {i}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
