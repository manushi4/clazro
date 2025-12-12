import { FeatureId, FeatureToggle } from "./feature.types";
import { DashboardConfig, WidgetId } from "./widget.types";
import { PermissionCode, PermissionSet, Role } from "./permission.types";
import { CustomerBranding } from "./branding.types";

export type CustomerStatus = "active" | "suspended" | "pending";

// Widget size variants
export type WidgetSize = "compact" | "standard" | "expanded";

// Visibility rule for conditional widget display
export type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: string;
  value: any;
};

// Widget configuration for a screen layout
export type ScreenWidgetConfig = {
  widgetId: WidgetId;
  position: number;
  size: WidgetSize;
  enabled: boolean;
  gridColumn?: number;
  gridRow?: number;
  customProps?: Record<string, unknown>;
  visibilityRules?: VisibilityRule[];
};

// Screen layout configuration
export type ScreenLayoutConfig = {
  screenId: string;
  customerId: string;
  role: Role;
  widgets: ScreenWidgetConfig[];
};

export type Customer = {
  id: string;
  name: string;
  slug: string;
  status?: CustomerStatus;
};

export type TabId = string;

export type ScreenId = string;

export type NavigationTabConfig = {
  tabId: TabId;
  role: Role;
  label: string;
  icon?: string;
  initialRoute: ScreenId;
  orderIndex: number;
  enabled: boolean;
  featureId?: FeatureId;
  requiredPermissions?: PermissionCode[];
};

export type NavigationScreenConfig = {
  screenId: ScreenId;
  tabId: TabId;
  orderIndex: number;
  enabled: boolean;
  featureId?: FeatureId;
  requiredPermissions?: PermissionCode[];
};

export type NavigationConfig = {
  tabs: NavigationTabConfig[];
  screens: NavigationScreenConfig[];
};

export type ThemeStatus = "active" | "draft";

// Font family options
export type FontFamily = "Inter" | "System Default" | "Roboto" | "Poppins" | "Open Sans";

// Elevation/Shadow levels
export type ElevationLevel = "none" | "low" | "medium" | "high";

// Component style types
export type ButtonStyle = "filled" | "outlined" | "tonal" | "text";
export type CardStyle = "elevated" | "outlined" | "flat";
export type InputStyle = "outlined" | "filled";
export type ChipStyle = "filled" | "outlined";

// Theme preset names
export type ThemePreset = 
  | "modern_blue" 
  | "classic_gray" 
  | "vibrant" 
  | "minimal" 
  | "dark_pro" 
  | "soft_pastel" 
  | "corporate" 
  | "custom";

// Theme mode options
export type ThemeMode = "system" | "light" | "dark";

export type ThemeConfig = {
  // Light Mode Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor: string;
  textColor?: string;
  textSecondaryColor?: string;
  errorColor?: string;
  successColor?: string;
  warningColor?: string;
  infoColor?: string;
  // Dark Mode Colors
  primaryColorDark?: string;
  secondaryColorDark?: string;
  accentColorDark?: string;
  backgroundColorDark?: string;
  surfaceColorDark?: string;
  textColorDark?: string;
  textSecondaryColorDark?: string;
  errorColorDark?: string;
  successColorDark?: string;
  warningColorDark?: string;
  // Dark Mode Settings
  darkModeEnabled?: boolean;
  // Typography
  fontFamily?: FontFamily;
  fontScale?: number;
  // Border Radius
  borderRadiusSmall?: number;
  borderRadiusMedium?: number;
  borderRadiusLarge?: number;
  roundness?: number; // Legacy
  // Elevation
  cardElevation?: ElevationLevel;
  buttonElevation?: ElevationLevel;
  // Component Styles
  buttonStyle?: ButtonStyle;
  cardStyle?: CardStyle;
  inputStyle?: InputStyle;
  chipStyle?: ChipStyle;
  // Theme Preset
  themePreset?: ThemePreset;
  // Other
  logoUrl?: string;
  status?: ThemeStatus;
  defaultLanguage?: string;
};

export type CustomerConfig = {
  customer: Customer;
  features: FeatureToggle[];
  navigation: NavigationConfig;
  dashboard: DashboardConfig[];
  theme: ThemeConfig;
  branding: CustomerBranding;
  permissions: PermissionSet[];
  version?: number;
  updatedAt?: string;
};
