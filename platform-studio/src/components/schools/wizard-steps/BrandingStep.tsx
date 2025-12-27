"use client";

type BrandingStepProps = {
  data: {
    app_name?: string;
    logo_url?: string;
    primary_color?: string;
  };
  updateData: (updates: any) => void;
};

export function BrandingStep({ data, updateData }: BrandingStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Optionally customize branding (you can change these later).
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          App Name (optional)
        </label>
        <input
          type="text"
          value={data.app_name || ""}
          onChange={(e) => updateData({ app_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., DPS Learning App"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use default "Learning App"
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL (optional)
        </label>
        <input
          type="url"
          value={data.logo_url || ""}
          onChange={(e) => updateData({ logo_url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="https://example.com/logo.png"
        />
        <p className="text-xs text-gray-500 mt-1">
          Full URL to your school logo image
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Color (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={data.primary_color || "#6750A4"}
            onChange={(e) => updateData({ primary_color: e.target.value })}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={data.primary_color || "#6750A4"}
            onChange={(e) => updateData({ primary_color: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="#6750A4"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Main color used throughout the app
        </p>
      </div>
    </div>
  );
}
