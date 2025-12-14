"use client";

import { useConfigStore } from "@/stores/configStore";
import { useSupabaseConfig } from "@/hooks/useSupabaseConfig";
import { CustomerBranding } from "@/types";
import { Save, Image, Loader2 } from "lucide-react";

export default function BrandingEditor() {
  const { branding, setBranding, isDirty } = useConfigStore();
  const { saveBranding: saveBrandingToSupabase, isSaving } = useSupabaseConfig();

  const handleChange = (key: keyof CustomerBranding, value: string) => {
    setBranding({ [key]: value });
  };

  const handleSave = async () => {
    try {
      await saveBrandingToSupabase();
      alert("Branding saved to Supabase!");
    } catch (error) {
      console.error("Failed to save branding:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="text-gray-500 mt-1">
            Configure white-label settings (applies to all roles)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-sm text-orange-500">Unsaved</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Branding"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* App Identity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">App Identity</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Name
              </label>
              <input
                type="text"
                value={branding.app_name}
                onChange={(e) => handleChange("app_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="My Learning App"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Tagline
              </label>
              <input
                type="text"
                value={branding.app_tagline || ""}
                onChange={(e) => handleChange("app_tagline", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Learn Smarter, Not Harder"
              />
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Logos</h2>

          <div className="grid grid-cols-2 gap-4">
            <LogoUpload label="Main Logo" />
            <LogoUpload label="Small Logo" />
            <LogoUpload label="Dark Mode Logo" />
            <LogoUpload label="Splash Image" />
          </div>
        </div>

        {/* Feature Naming */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Feature Naming</h2>
          <p className="text-sm text-gray-500 mb-4">
            Customize how features are named in your app
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Tutor Name
              </label>
              <input
                type="text"
                value={branding.ai_tutor_name}
                onChange={(e) => handleChange("ai_tutor_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="AI Tutor"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "Ask Guru", "Study Buddy"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doubts Section Name
              </label>
              <input
                type="text"
                value={branding.doubt_section_name}
                onChange={(e) => handleChange("doubt_section_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ask Doubts"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "Get Help", "Questions"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Name
              </label>
              <input
                type="text"
                value={branding.assignment_name}
                onChange={(e) => handleChange("assignment_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Assignment"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "Homework", "Task"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name
              </label>
              <input
                type="text"
                value={branding.test_name}
                onChange={(e) => handleChange("test_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Test"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "Quiz", "Assessment"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Live Class Name
              </label>
              <input
                type="text"
                value={branding.live_class_name}
                onChange={(e) => handleChange("live_class_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Live Class"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "Online Session", "Virtual Room"</p>
            </div>
          </div>
        </div>

        {/* Contact & Legal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact & Legal</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={branding.support_email || ""}
                onChange={(e) => handleChange("support_email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="support@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Phone
              </label>
              <input
                type="tel"
                value={branding.support_phone || ""}
                onChange={(e) => handleChange("support_phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={branding.whatsapp_number || ""}
                onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms of Service URL
              </label>
              <input
                type="url"
                value={branding.terms_url || ""}
                onChange={(e) => handleChange("terms_url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com/terms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={branding.privacy_url || ""}
                onChange={(e) => handleChange("privacy_url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com/privacy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoUpload({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 cursor-pointer transition-colors">
      <Image size={24} className="mx-auto text-gray-400 mb-2" />
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-500 mt-1">Click to upload</div>
    </div>
  );
}
