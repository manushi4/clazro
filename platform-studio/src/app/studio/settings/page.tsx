"use client";

import { useState } from "react";
import { Save, RefreshCw, Trash2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const [autoSave, setAutoSave] = useState(true);
  const [previewDevice, setPreviewDevice] = useState("iphone-14");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure Platform Studio preferences</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Editor Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Editor Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Auto-save drafts</div>
                <div className="text-sm text-gray-500">
                  Automatically save changes every 5 seconds
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Preview Device
              </label>
              <select
                value={previewDevice}
                onChange={(e) => setPreviewDevice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="iphone-14">iPhone 14</option>
                <option value="iphone-14-pro">iPhone 14 Pro</option>
                <option value="pixel-7">Pixel 7</option>
                <option value="samsung-s23">Samsung S23</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            Danger Zone
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Reset to defaults</div>
                <div className="text-sm text-gray-500">
                  Reset all configuration to default values
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                Reset
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Discard all drafts</div>
                <div className="text-sm text-gray-500">
                  Discard all unpublished changes
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
