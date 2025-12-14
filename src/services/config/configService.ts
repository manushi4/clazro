// Config Service - Fetches configuration from Supabase
import { getSupabaseClient } from "../../lib/supabaseClient";
import type { Role } from "../../types/permission.types";
import type { CustomerBranding } from "../../types/branding.types";
import type { ScreenWidgetConfig } from "../../types/config.types";

// Component styles type
export type ComponentStyles = {
  buttonStyle: 'filled' | 'outlined' | 'text';
  inputStyle: 'outlined' | 'filled' | 'underlined';
  cardStyle: 'elevated' | 'outlined' | 'filled';
  chipStyle: 'filled' | 'outlined';
};

// Theme config type (matches customer_themes table)
export type ThemeConfig = {
  // Light mode colors
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor: string;
  textColor?: string;
  errorColor?: string;
  successColor?: string;
  warningColor?: string;
  infoColor?: string;
  // Dark mode colors
  primaryColorDark?: string;
  secondaryColorDark?: string;
  accentColorDark?: string;
  backgroundColorDark?: string;
  surfaceColorDark?: string;
  textColorDark?: string;
  errorColorDark?: string;
  successColorDark?: string;
  warningColorDark?: string;
  darkModeEnabled?: boolean;
  // Other settings
  fontFamily?: string;
  roundness?: number;
  cardElevation?: string;
  preset?: string;
  componentStyles?: ComponentStyles;
  status?: string;
};

function getSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not initialized");
  return supabase;
}

// ============ CUSTOMERS ============

export async function fetchCustomer(customerId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data;
}

// ============ NAVIGATION TABS ============

export async function fetchNavigationTabs(customerId: string, role: Role) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("navigation_tabs")
    .select("*")
    .eq("customer_id", customerId)
    .eq("role", role)
    .eq("enabled", true)
    .order("order_index");

  if (error) throw error;

  return (data || []).map((tab: any) => ({
    tabId: tab.tab_id,
    role: tab.role,
    label: tab.label,
    labelKey: tab.label_key,
    icon: tab.icon,
    orderIndex: tab.order_index,
    enabled: tab.enabled,
    initialRoute: tab.root_screen_id,
    badgeType: tab.badge_type,
    badgeSource: tab.badge_source,
    requiresOnline: tab.requires_online,
    requiredPermission: tab.required_permission,
    requiredFeature: tab.required_feature,
  }));
}

// ============ SCREEN LAYOUTS ============

// Default widget layouts for different screen types
// Supports multiple screen ID formats: "home.dashboard", "student-home", "home", etc.
const DEFAULT_SCREEN_LAYOUTS: Record<string, ScreenWidgetConfig[]> = {
  // Home/Dashboard screens
  "home": [
    { widgetId: "hero.greeting", position: 1, size: "standard", enabled: true, customProps: {} },
    { widgetId: "schedule.today", position: 2, size: "standard", enabled: true, customProps: { maxItems: 3 } },
    { widgetId: "actions.quick", position: 3, size: "standard", enabled: true, customProps: { columns: "2" } },
    { widgetId: "assignments.upcoming", position: 4, size: "standard", enabled: true, customProps: { maxItems: 3 } },
  ],
  // Study/Library screens
  "study": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "study" } },
    { widgetId: "progress.snapshot", position: 2, size: "standard", enabled: true, customProps: {} },
    { widgetId: "actions.quick", position: 3, size: "standard", enabled: true, customProps: { columns: "2", category: "study" } },
  ],
  // Ask/Doubts screens
  "ask": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "doubts" } },
    { widgetId: "doubts.inbox", position: 2, size: "expanded", enabled: true, customProps: { maxItems: 5 } },
    { widgetId: "actions.quick", position: 3, size: "compact", enabled: true, customProps: { columns: "1", category: "doubts" } },
  ],
  "doubts": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "doubts" } },
    { widgetId: "doubts.inbox", position: 2, size: "expanded", enabled: true, customProps: { maxItems: 5 } },
    { widgetId: "actions.quick", position: 3, size: "compact", enabled: true, customProps: { columns: "1", category: "doubts" } },
  ],
  // Progress/Analytics screens
  "progress": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "progress" } },
    { widgetId: "progress.snapshot", position: 2, size: "expanded", enabled: true, customProps: { showDetails: true } },
    { widgetId: "assignments.upcoming", position: 3, size: "standard", enabled: true, customProps: { maxItems: 5 } },
  ],
  "analytics": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "progress" } },
    { widgetId: "progress.snapshot", position: 2, size: "expanded", enabled: true, customProps: { showDetails: true } },
    { widgetId: "assignments.upcoming", position: 3, size: "standard", enabled: true, customProps: { maxItems: 5 } },
  ],
  // Profile screens
  "profile": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "profile" } },
    { widgetId: "progress.snapshot", position: 2, size: "compact", enabled: true, customProps: {} },
  ],
  // Library screens
  "library": [
    { widgetId: "hero.greeting", position: 1, size: "compact", enabled: true, customProps: { variant: "study" } },
    { widgetId: "progress.snapshot", position: 2, size: "standard", enabled: true, customProps: {} },
    { widgetId: "actions.quick", position: 3, size: "standard", enabled: true, customProps: { columns: "2", category: "study" } },
  ],
  // Dashboard (alias for home)
  "dashboard": [
    { widgetId: "hero.greeting", position: 1, size: "standard", enabled: true, customProps: {} },
    { widgetId: "schedule.today", position: 2, size: "standard", enabled: true, customProps: { maxItems: 3 } },
    { widgetId: "actions.quick", position: 3, size: "standard", enabled: true, customProps: { columns: "2" } },
    { widgetId: "assignments.upcoming", position: 4, size: "standard", enabled: true, customProps: { maxItems: 3 } },
  ],
};

// Get fallback layout based on screen ID
// Handles multiple formats: "home.dashboard", "student-home", "ask.doubts", etc.
function getFallbackLayout(screenId: string): ScreenWidgetConfig[] {
  // Try exact match first
  if (DEFAULT_SCREEN_LAYOUTS[screenId]) {
    return DEFAULT_SCREEN_LAYOUTS[screenId];
  }

  // Extract key part from different formats
  let key = screenId;
  
  // Handle "home.dashboard" format -> extract first part "home"
  if (screenId.includes(".")) {
    key = screenId.split(".")[0];
  }
  // Handle "student-home" format -> extract last part "home"
  else if (screenId.includes("-")) {
    key = screenId.split("-").pop() || screenId;
  }

  // Return matching layout or default home layout
  return DEFAULT_SCREEN_LAYOUTS[key] || DEFAULT_SCREEN_LAYOUTS["home"] || [];
}

export async function fetchScreenLayout(
  customerId: string,
  role: Role,
  screenId: string
): Promise<ScreenWidgetConfig[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("screen_layouts")
    .select("*")
    .eq("customer_id", customerId)
    .eq("role", role)
    .eq("screen_id", screenId)
    .eq("enabled", true)
    .order("position");

  if (error) throw error;

  const layouts = (data || []).map((row: any) => ({
    widgetId: row.widget_id,
    position: row.position,
    size: row.size || "standard",
    enabled: row.enabled,
    gridColumn: row.grid_column,
    gridRow: row.grid_row,
    customProps: row.custom_props || {},
    visibilityRules: row.visibility_rules || [],
  }));

  // Return database layouts if available, otherwise use fallback
  if (layouts.length > 0) {
    return layouts;
  }

  return getFallbackLayout(screenId);
}

export async function fetchAllScreenLayouts(customerId: string, role: Role) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("screen_layouts")
    .select("*")
    .eq("customer_id", customerId)
    .eq("role", role)
    .eq("enabled", true)
    .order("position");

  if (error) throw error;

  // Group by screen_id
  const layouts: Record<string, ScreenWidgetConfig[]> = {};

  (data || []).forEach((row: any) => {
    const screenId = row.screen_id;
    if (!layouts[screenId]) {
      layouts[screenId] = [];
    }
    layouts[screenId].push({
      widgetId: row.widget_id,
      position: row.position,
      size: row.size || "standard",
      enabled: row.enabled,
      gridColumn: row.grid_column,
      gridRow: row.grid_row,
      customProps: row.custom_props || {},
      visibilityRules: row.visibility_rules || [],
    });
  });

  return layouts;
}

// ============ THEME ============

// Default component styles
const DEFAULT_COMPONENT_STYLES: ComponentStyles = {
  buttonStyle: 'filled',
  inputStyle: 'outlined',
  cardStyle: 'elevated',
  chipStyle: 'filled',
};

export async function fetchCustomerTheme(customerId: string): Promise<ThemeConfig | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("customer_themes")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    // Light mode colors
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    accentColor: data.accent_color,
    backgroundColor: data.background_color,
    surfaceColor: data.surface_color,
    textColor: data.text_color,
    errorColor: data.error_color,
    successColor: data.success_color || '#4CAF50',
    warningColor: data.warning_color || '#FF9800',
    infoColor: data.info_color || '#2196F3',
    // Dark mode colors
    primaryColorDark: data.primary_color_dark,
    secondaryColorDark: data.secondary_color_dark,
    accentColorDark: data.accent_color_dark,
    backgroundColorDark: data.background_color_dark,
    surfaceColorDark: data.surface_color_dark,
    textColorDark: data.text_color_dark,
    errorColorDark: data.error_color_dark,
    successColorDark: data.success_color_dark,
    warningColorDark: data.warning_color_dark,
    darkModeEnabled: data.dark_mode_enabled !== false,
    // Other settings
    fontFamily: data.font_family,
    roundness: data.roundness,
    cardElevation: data.card_elevation,
    preset: data.preset || 'custom',
    componentStyles: data.component_styles || DEFAULT_COMPONENT_STYLES,
    status: data.status,
  };
}

// ============ BRANDING ============

export async function fetchCustomerBranding(customerId: string): Promise<CustomerBranding | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("customer_branding")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    appName: data.app_name || "Learning App",
    appTagline: data.app_tagline,
    logoUrl: data.logo_url,
    logoSmallUrl: data.logo_small_url,
    logoDarkUrl: data.logo_dark_url,
    splashImageUrl: data.splash_image_url,
    loginHeroUrl: data.login_hero_url,
    faviconUrl: data.favicon_url,
    aiTutorName: data.ai_tutor_name || "AI Tutor",
    doubtSectionName: data.doubt_section_name || "Ask Doubts",
    assignmentName: data.assignment_name || "Assignment",
    testName: data.test_name || "Test",
    liveClassName: data.live_class_name || "Live Class",
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
    whatsappNumber: data.whatsapp_number,
    helpCenterUrl: data.help_center_url,
    termsUrl: data.terms_url,
    privacyUrl: data.privacy_url,
    refundUrl: data.refund_url,
    textOverrides: data.text_overrides || {},
  };
}

// ============ FEATURES ============

export async function fetchCustomerFeatures(customerId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("customer_features")
    .select("*")
    .eq("customer_id", customerId);

  if (error) throw error;

  return (data || []).map((f: any) => ({
    featureId: f.feature_id,
    enabled: f.enabled && !f.emergency_disabled,
    config: f.config || {},
  }));
}

// ============ FULL CONFIG LOAD ============

export async function fetchFullCustomerConfig(customerId: string, role: Role) {
  const [customer, tabs, layouts, theme, branding, features] = await Promise.all([
    fetchCustomer(customerId),
    fetchNavigationTabs(customerId, role),
    fetchAllScreenLayouts(customerId, role),
    fetchCustomerTheme(customerId),
    fetchCustomerBranding(customerId),
    fetchCustomerFeatures(customerId),
  ]);

  return {
    customer,
    tabs,
    layouts,
    theme,
    branding,
    features,
  };
}
