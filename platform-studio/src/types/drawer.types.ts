/**
 * Drawer Types for Platform Studio
 */

import { Role } from "./customer.types";

// Position & Trigger
export type DrawerPosition = "left" | "right";
export type DrawerTrigger = "hamburger" | "swipe" | "both";

// Animation
export type DrawerAnimation = "slide" | "push" | "reveal" | "fade";

// Appearance
export type DrawerBackgroundStyle = "solid" | "gradient" | "blur";
export type DrawerHeaderStyle = "avatar" | "logo" | "compact" | "none";
export type DrawerHeaderBgStyle = "solid" | "gradient" | "image" | "none";

// Menu Items
export type DrawerMenuItemType =
  | "link"
  | "action"
  | "divider"
  | "section_header"
  | "expandable";

export type DrawerBadgeType = "none" | "dot" | "count";

/**
 * Drawer configuration
 */
export type DrawerConfig = {
  id: string;
  customer_id: string;
  role: Role;
  enabled: boolean;

  // Position & Behavior
  position: DrawerPosition;
  trigger_type: DrawerTrigger;
  swipe_edge_width: number;

  // Dimensions
  width_percentage: number;
  width_max_px: number;

  // Appearance
  background_style: DrawerBackgroundStyle;
  background_opacity: number;
  overlay_opacity: number;
  overlay_color: string;
  border_radius: number;
  shadow_enabled: boolean;
  shadow_opacity: number;

  // Animation
  animation_type: DrawerAnimation;
  animation_duration: number;

  // Header
  header_style: DrawerHeaderStyle;
  header_show_role: boolean;
  header_show_email: boolean;
  header_background_style: DrawerHeaderBgStyle;
  header_height: number;

  // Footer
  footer_enabled: boolean;
  footer_show_version: boolean;
  footer_show_logout: boolean;

  // Behavior
  close_on_select: boolean;
  haptic_feedback: boolean;
};

/**
 * Drawer menu item
 */
export type DrawerMenuItem = {
  id: string;
  customer_id: string;
  role: Role;
  item_id: string;

  // Display
  label_en: string;
  label_hi?: string;
  icon: string;
  icon_color?: string;

  // Type
  item_type: DrawerMenuItemType;

  // Navigation
  route?: string;
  route_params?: Record<string, unknown>;

  // Action
  action_id?: string;

  // Expandable
  parent_item_id?: string;
  expanded_by_default?: boolean;

  // Badge
  badge_type: DrawerBadgeType;
  badge_source?: string;
  badge_color?: string;

  // Visibility
  order_index: number;
  enabled: boolean;

  // Styling
  highlight?: boolean;
  text_color?: string;
};

/**
 * Default drawer configuration
 */
export const DEFAULT_DRAWER_CONFIG: Omit<DrawerConfig, "id" | "customer_id" | "role"> = {
  enabled: true,
  position: "left",
  trigger_type: "both",
  swipe_edge_width: 20,
  width_percentage: 80,
  width_max_px: 320,
  background_style: "solid",
  background_opacity: 100,
  overlay_opacity: 50,
  overlay_color: "#000000",
  border_radius: 0,
  shadow_enabled: true,
  shadow_opacity: 30,
  animation_type: "slide",
  animation_duration: 300,
  header_style: "avatar",
  header_show_role: true,
  header_show_email: false,
  header_background_style: "gradient",
  header_height: 180,
  footer_enabled: true,
  footer_show_version: true,
  footer_show_logout: true,
  close_on_select: true,
  haptic_feedback: true,
};

/**
 * Available drawer actions
 */
export const DRAWER_ACTIONS = [
  { id: "logout", label: "Logout", icon: "log-out" },
  { id: "switch_role", label: "Switch Role", icon: "users" },
  { id: "share_app", label: "Share App", icon: "share-2" },
  { id: "rate_app", label: "Rate App", icon: "star" },
  { id: "contact_support", label: "Contact Support", icon: "headphones" },
] as const;

/**
 * Available badge sources
 */
export const BADGE_SOURCES = [
  { id: "notifications_unread", label: "Unread Notifications" },
  { id: "calendar_events_today", label: "Today's Events" },
  { id: "pending_leaves", label: "Pending Leaves" },
  { id: "pending_approvals", label: "Pending Approvals" },
  { id: "new_messages", label: "New Messages" },
  { id: "pending_fees", label: "Pending Fees" },
  { id: "downloads_count", label: "Downloads" },
  { id: "new_achievements", label: "New Achievements" },
] as const;
