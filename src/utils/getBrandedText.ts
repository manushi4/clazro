// Utility to get branded text with fallback to i18n
import type { CustomerBranding } from "../types/branding.types";

/**
 * Get branded text with fallback chain:
 * 1. Check textOverrides in branding
 * 2. Check specific branding field (e.g., aiTutorName)
 * 3. Fall back to provided default
 */
export function getBrandedText(
  key: string,
  branding: CustomerBranding,
  fallback: string
): string {
  // First check textOverrides
  if (branding.textOverrides && branding.textOverrides[key]) {
    return branding.textOverrides[key];
  }

  // Check specific branding fields
  const brandingFields: Record<string, keyof CustomerBranding> = {
    "ai_tutor": "aiTutorName",
    "doubts": "doubtSectionName",
    "assignment": "assignmentName",
    "test": "testName",
    "live_class": "liveClassName",
    "app_name": "appName",
    "app_tagline": "appTagline",
  };

  const fieldKey = brandingFields[key];
  if (fieldKey && branding[fieldKey]) {
    return branding[fieldKey] as string;
  }

  return fallback;
}

/**
 * Get feature name from branding
 */
export function getFeatureName(
  feature: "ai_tutor" | "doubts" | "assignment" | "test" | "live_class",
  branding: CustomerBranding
): string {
  const defaults: Record<string, string> = {
    ai_tutor: "AI Tutor",
    doubts: "Ask Doubts",
    assignment: "Assignment",
    test: "Test",
    live_class: "Live Class",
  };

  return getBrandedText(feature, branding, defaults[feature]);
}
