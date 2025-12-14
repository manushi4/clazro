import { Role } from "./customer.types";
import { WidgetId, WidgetSize } from "./widget.types";

export type ScreenId = string;

export type ScreenType = "dashboard" | "hub" | "list" | "detail" | "custom";

export type ScreenLayout = "vertical" | "grid" | "masonry";

// Screen definition (global reference)
export type ScreenDefinition = {
  screen_id: ScreenId;
  name: string;
  screen_type: ScreenType;
  allowed_roles: Role[];
  default_layout: ScreenLayout;
  scrollable: boolean;
  pull_to_refresh: boolean;
  header_visible: boolean;
};

// Widget placement on screen (per customer)
export type ScreenWidgetConfig = {
  id?: string;
  widget_id: WidgetId;
  position: number;
  size: WidgetSize;
  enabled: boolean;
  grid_column?: number;
  grid_row?: number;
  custom_props?: Record<string, unknown>;
  visibility_rules?: VisibilityRule[];
};

export type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: string;
  value: unknown;
};

// Screen layout config (per customer + role + screen)
export type ScreenLayoutConfig = {
  customer_id: string;
  role: Role;
  screen_id: ScreenId;
  widgets: ScreenWidgetConfig[];
};
