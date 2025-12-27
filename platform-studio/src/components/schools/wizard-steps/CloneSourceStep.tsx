"use client";

import { Building2, Sparkles } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type CloneSourceStepProps = {
  data: {
    cloneFrom: string | null;
  };
  updateData: (updates: any) => void;
  schools: Customer[];
};

export function CloneSourceStep({ data, updateData, schools }: CloneSourceStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Choose a school to copy configuration from, or start with defaults.
      </p>

      {/* Default Option */}
      <button
        type="button"
        onClick={() => updateData({ cloneFrom: "default" })}
        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
          data.cloneFrom === "default"
            ? "border-primary-500 bg-primary-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-primary-600 mt-1" />
          <div>
            <div className="font-medium text-gray-900">Default Configuration</div>
            <div className="text-sm text-gray-500 mt-1">
              Start with standard navigation, theme, and branding settings
            </div>
          </div>
        </div>
      </button>

      {/* Existing Schools */}
      {schools.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Clone from existing school:</p>
          {schools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => updateData({ cloneFrom: school.id })}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                data.cloneFrom === school.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 size={20} className="text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">{school.name}</div>
                  <div className="text-sm text-gray-500">{school.slug}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
