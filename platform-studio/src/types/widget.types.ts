import { Role } from "./customer.types";

// Widget identification
export type WidgetId = string;

export type WidgetCategory =
  | "schedule"
  | "study"
  | "assessment"
  | "doubts"
  | "progress"
  | "social"
  | "ai"
  | "communication"
  | "automation"
  | "rewards"
  | "profile"
  | "notifications"
  | "actions"
  | "activity"
  | "content"
  | "analytics"
  | "media"
  | "fees"
  | "payroll"
  | "academic";

export type WidgetSize = "compact" | "standard" | "expanded";

export const WIDGET_SIZES: WidgetSize[] = ["compact", "standard", "expanded"];

// Widget metadata (for registry)
export type WidgetMetadata = {
  id: WidgetId;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  allowedRoles: Role[];
  allowedScreenTypes: ScreenType[];
  supportedSizes: WidgetSize[];
  defaultSize: WidgetSize;
  requiredFeatureId?: string;
  requiredPermissions?: string[];
  previewComponent?: string;
};

export type ScreenType = "dashboard" | "hub" | "list" | "detail" | "any";
