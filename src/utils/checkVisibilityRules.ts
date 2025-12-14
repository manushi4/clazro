// Utility to check widget visibility rules
import type { VisibilityRule } from "../types/config.types";

type VisibilityContext = {
  permissions: string[];
  enabledFeatures: string[];
  isOnline: boolean;
};

export function checkVisibilityRules(
  rules: VisibilityRule[] | undefined | null | Record<string, unknown>,
  context: VisibilityContext
): boolean {
  // Handle null, undefined, empty object, or non-array inputs
  if (!rules || !Array.isArray(rules) || rules.length === 0) return true;

  return rules.every((rule) => {
    switch (rule.type) {
      case "permission":
        // Check if user has required permission
        return context.permissions.includes(rule.value);

      case "feature":
        // Check if feature is enabled
        if (rule.condition === "enabled") {
          return context.enabledFeatures.includes(rule.value);
        }
        if (rule.condition === "disabled") {
          return !context.enabledFeatures.includes(rule.value);
        }
        return true;

      case "online":
        // Check online status
        if (rule.condition === "required") {
          return context.isOnline;
        }
        return true;

      case "time":
        // Time-based visibility (e.g., show only during certain hours)
        // Not implemented yet
        return true;

      case "custom":
        // Custom visibility logic
        // Not implemented yet
        return true;

      default:
        return true;
    }
  });
}
