import { Role } from "./customer.types";

export type TabId = string;

export type TabConfig = {
  id?: string;
  tab_id: TabId;
  customer_id: string;
  role: Role;
  label: string;
  label_key?: string;
  icon: string;
  order_index: number;
  enabled: boolean;
  root_screen_id: string;
  badge_type?: "none" | "count" | "dot";
  badge_source?: string;
  requires_online?: boolean;
  required_permission?: string;
  required_feature?: string;
};

export type NavigationConfig = {
  customer_id: string;
  role: Role;
  tabs: TabConfig[];
};

// Available icons for tabs
export const TAB_ICONS = [
  "home",
  "calendar",
  "library",
  "school",
  "help",
  "trending-up",
  "person",
  "people",
  "assignment",
  "quiz",
  "chat",
  "notifications",
  "settings",
  "star",
  "bookmark",
] as const;

export type TabIcon = (typeof TAB_ICONS)[number];
