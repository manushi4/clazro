"use client";

import { Building2, Link2, CreditCard, Copy, Palette } from "lucide-react";
import { ReactNode } from "react";

type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type ReviewStepProps = {
  data: {
    name: string;
    slug: string;
    subscription_tier: string;
    cloneFrom: string | null;
    app_name?: string;
    logo_url?: string;
    primary_color?: string;
  };
  schools: Customer[];
};

export function ReviewStep({ data, schools }: ReviewStepProps) {
  const sourceSchool = schools.find((s) => s.id === data.cloneFrom);

  return (
    <div className="space-y-6">
      <p className="text-gray-600 mb-4">
        Review your settings before creating the school.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <SummaryRow icon={<Building2 size={16} />} label="School Name" value={data.name} />
        <SummaryRow icon={<Link2 size={16} />} label="Slug" value={data.slug} />
        <SummaryRow icon={<CreditCard size={16} />} label="Subscription" value={data.subscription_tier} />
        <SummaryRow
          icon={<Copy size={16} />}
          label="Clone Source"
          value={data.cloneFrom === "default" ? "Default Configuration" : sourceSchool?.name || "Unknown"}
        />
        {data.app_name && (
          <SummaryRow icon={<Palette size={16} />} label="App Name" value={data.app_name} />
        )}
        {data.logo_url && (
          <SummaryRow icon={<Palette size={16} />} label="Logo URL" value={data.logo_url} />
        )}
        {data.primary_color && (
          <SummaryRow
            icon={<Palette size={16} />}
            label="Primary Color"
            value={
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: data.primary_color }}
                />
                {data.primary_color}
              </div>
            }
          />
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Creating a school will initialize all configuration tables.
          This process may take a few seconds.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}
