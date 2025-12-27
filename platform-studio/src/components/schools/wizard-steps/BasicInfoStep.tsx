"use client";

import { useState, useEffect } from "react";
import { validateSlugAvailability } from "@/services/configService";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type BasicInfoStepProps = {
  data: {
    name: string;
    slug: string;
    subscription_tier: string;
  };
  updateData: (updates: any) => void;
};

export function BasicInfoStep({ data, updateData }: BasicInfoStepProps) {
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (data.slug.length >= 3) {
      setSlugStatus("checking");
      const timer = setTimeout(async () => {
        try {
          const isAvailable = await validateSlugAvailability(data.slug);
          setSlugStatus(isAvailable ? "available" : "taken");
        } catch (error) {
          console.error("Slug validation error:", error);
          setSlugStatus("idle");
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSlugStatus("idle");
    }
  }, [data.slug]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          School Name *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => {
            const newName = e.target.value;
            updateData({ name: newName });
            if (!data.slug || data.slug === generateSlug(data.name)) {
              updateData({ slug: generateSlug(newName) });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., Delhi Public School"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug * (URL identifier)
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.slug}
            onChange={(e) => updateData({ slug: generateSlug(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., dps-school"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {slugStatus === "checking" && <Loader2 size={16} className="animate-spin text-gray-400" />}
            {slugStatus === "available" && <CheckCircle size={16} className="text-green-500" />}
            {slugStatus === "taken" && <XCircle size={16} className="text-red-500" />}
          </div>
        </div>
        {slugStatus === "taken" && (
          <p className="text-sm text-red-500 mt-1">This slug is already taken</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Only lowercase letters, numbers, and hyphens. Min 3 characters.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subscription Tier
        </label>
        <select
          value={data.subscription_tier}
          onChange={(e) => updateData({ subscription_tier: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
    </div>
  );
}
