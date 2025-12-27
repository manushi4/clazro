/**
 * Drawer/Sidebar Types
 * Config-driven drawer navigation system
 */

// Position & Trigger
export type DrawerPosition = 'left' | 'right';
export type DrawerTrigger = 'hamburger' | 'swipe' | 'both';

// Animation
export type DrawerAnimation = 'slide' | 'push' | 'reveal' | 'fade';

// Appearance
export type DrawerBackgroundStyle = 'solid' | 'gradient' | 'blur';
export type DrawerHeaderStyle = 'avatar' | 'logo' | 'compact' | 'none';
export type DrawerHeaderBgStyle = 'solid' | 'gradient' | 'image' | 'none';

// Menu Items
export type DrawerMenuItemType =
  | 'link'
  | 'action'
  | 'divider'
  | 'section_header'
  | 'expandable';

export type DrawerBadgeType = 'none' | 'dot' | 'count';

// Action IDs
export type DrawerActionId =
  | 'logout'
  | 'switch_role'
  | 'share_app'
  | 'rate_app'
  | 'contact_support';

/**
 * Main drawer configuration
 */
export type DrawerConfig = {
  id: string;
  customer_id: string;
  role: string;
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

  // Timestamps
  created_at?: string;
  updated_at?: string;
};

/**
 * Drawer menu item
 */
export type DrawerMenuItem = {
  id: string;
  customer_id: string;
  role: string;
  item_id: string;

  // Display
  label_en: string;
  label_hi?: string;
  icon: string;
  icon_color?: string;

  // Type
  item_type: DrawerMenuItemType;

  // Navigation (for type='link')
  route?: string;
  route_params?: Record<string, unknown>;

  // Action (for type='action')
  action_id?: DrawerActionId;

  // Expandable (for type='expandable')
  parent_item_id?: string;
  expanded_by_default?: boolean;

  // Badge
  badge_type: DrawerBadgeType;
  badge_source?: string;
  badge_color?: string;

  // Visibility
  order_index: number;
  enabled: boolean;
  visibility_rules?: VisibilityRule;

  // Styling
  highlight?: boolean;
  text_color?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
};

/**
 * Visibility rules for conditional display
 */
export type VisibilityRule =
  | FeatureVisibilityRule
  | RoleVisibilityRule
  | ConditionVisibilityRule;

export type FeatureVisibilityRule = {
  type: 'feature';
  featureId: string;
  operator: 'enabled' | 'disabled';
};

export type RoleVisibilityRule = {
  type: 'role';
  roles: string[];
  operator: 'includes' | 'excludes';
};

export type ConditionVisibilityRule = {
  type: 'condition';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
    value: unknown;
  }>;
  logic?: 'and' | 'or';
};

/**
 * Combined drawer data from query
 */
export type DrawerConfigData = {
  config: DrawerConfig;
  menuItems: DrawerMenuItem[];
};

/**
 * Default drawer configuration
 */
export const DEFAULT_DRAWER_CONFIG: Omit<DrawerConfig, 'id' | 'customer_id' | 'role'> = {
  enabled: true,
  position: 'left',
  trigger_type: 'both',
  swipe_edge_width: 20,
  width_percentage: 80,
  width_max_px: 320,
  background_style: 'solid',
  background_opacity: 100,
  overlay_opacity: 50,
  overlay_color: '#000000',
  border_radius: 0,
  shadow_enabled: true,
  shadow_opacity: 30,
  animation_type: 'slide',
  animation_duration: 300,
  header_style: 'avatar',
  header_show_role: true,
  header_show_email: false,
  header_background_style: 'gradient',
  header_height: 180,
  footer_enabled: true,
  footer_show_version: true,
  footer_show_logout: true,
  close_on_select: true,
  haptic_feedback: true,
};
