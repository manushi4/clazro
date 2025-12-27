import { getSupabase } from "@/lib/supabase/client";
import { TabConfig, ScreenWidgetConfig, ThemeConfig, CustomerBranding, Role } from "@/types";
import { LayoutSettings, DEFAULT_LAYOUT_SETTINGS } from "@/stores/configStore";

const supabase = getSupabase();

// ============ CUSTOMERS ============

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function fetchCustomerBySlug(slug: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

// ============ NAVIGATION TABS ============

export async function fetchNavigationTabs(customerId: string, role: Role): Promise<TabConfig[]> {
  const { data, error } = await supabase
    .from("navigation_tabs")
    .select("*")
    .eq("customer_id", customerId)
    .eq("role", role)
    .order("order_index");

  if (error) throw error;
  return data || [];
}

export async function fetchAllNavigationTabs(customerId: string): Promise<Record<Role, TabConfig[]>> {
  const { data, error } = await supabase
    .from("navigation_tabs")
    .select("*")
    .eq("customer_id", customerId)
    .order("order_index");

  if (error) throw error;

  const result: Record<Role, TabConfig[]> = {
    student: [],
    teacher: [],
    parent: [],
    admin: [],
  };

  (data || []).forEach((tab: any) => {
    result[tab.role as Role].push(tab);
  });

  return result;
}

export async function saveNavigationTabs(customerId: string, role: Role, tabs: TabConfig[]) {
  // Delete existing tabs for this role
  await supabase
    .from("navigation_tabs")
    .delete()
    .eq("customer_id", customerId)
    .eq("role", role);

  // Insert new tabs
  const tabsToInsert = tabs.map((tab, index) => ({
    customer_id: customerId,
    role,
    tab_id: tab.tab_id,
    label: tab.label,
    label_key: tab.label_key,
    icon: tab.icon,
    order_index: index + 1,
    enabled: tab.enabled,
    root_screen_id: tab.root_screen_id,
    badge_type: tab.badge_type || "none",
    badge_source: tab.badge_source,
    requires_online: tab.requires_online,
    required_permission: tab.required_permission,
    required_feature: tab.required_feature,
  }));

  const { error } = await supabase.from("navigation_tabs").insert(tabsToInsert);
  if (error) throw error;
}

// ============ SCREEN LAYOUTS ============

export async function fetchScreenLayout(
  customerId: string,
  role: Role,
  screenId: string
): Promise<ScreenWidgetConfig[]> {
  const { data, error } = await supabase
    .from("screen_layouts")
    .select("*")
    .eq("customer_id", customerId)
    .eq("role", role)
    .eq("screen_id", screenId)
    .order("position");

  if (error) throw error;
  return (data || []).map((row: any) => ({
    widget_id: row.widget_id,
    position: row.position,
    size: row.size,
    enabled: row.enabled,
    grid_column: row.grid_column,
    grid_row: row.grid_row,
    custom_props: row.custom_props,
    visibility_rules: row.visibility_rules,
  }));
}

export async function fetchAllScreenLayouts(
  customerId: string
): Promise<Record<Role, Record<string, { screen_id: string; widgets: ScreenWidgetConfig[]; layoutSettings?: LayoutSettings }>>> {
  const { data, error } = await supabase
    .from("screen_layouts")
    .select("*")
    .eq("customer_id", customerId)
    .order("position");

  if (error) throw error;

  const result: Record<Role, Record<string, { screen_id: string; widgets: ScreenWidgetConfig[]; layoutSettings?: LayoutSettings }>> = {
    student: {},
    teacher: {},
    parent: {},
    admin: {},
  };

  (data || []).forEach((row: any) => {
    const role = row.role as Role;
    const screenId = row.screen_id;

    if (!result[role][screenId]) {
      result[role][screenId] = {
        screen_id: screenId,
        widgets: [],
        // Get layoutSettings from the first row (they should all be the same for a screen)
        layoutSettings: row.layout_settings || DEFAULT_LAYOUT_SETTINGS,
      };
    }

    result[role][screenId].widgets.push({
      widget_id: row.widget_id,
      position: row.position,
      size: row.size,
      enabled: row.enabled,
      grid_column: row.grid_column,
      grid_row: row.grid_row,
      custom_props: row.custom_props,
      visibility_rules: row.visibility_rules,
    });
  });

  return result;
}

export async function saveScreenLayout(
  customerId: string,
  role: Role,
  screenId: string,
  widgets: ScreenWidgetConfig[],
  layoutSettings?: LayoutSettings
) {
  // Delete existing widgets for this screen
  await supabase
    .from("screen_layouts")
    .delete()
    .eq("customer_id", customerId)
    .eq("role", role)
    .eq("screen_id", screenId);

  if (widgets.length === 0) return;

  // Insert new widgets with layout settings
  const widgetsToInsert = widgets.map((widget, index) => ({
    customer_id: customerId,
    role,
    screen_id: screenId,
    widget_id: widget.widget_id,
    position: index + 1,
    size: widget.size,
    enabled: widget.enabled,
    grid_column: widget.grid_column,
    grid_row: widget.grid_row,
    custom_props: widget.custom_props || {},
    visibility_rules: widget.visibility_rules || [],
    layout_settings: layoutSettings || DEFAULT_LAYOUT_SETTINGS,
  }));

  const { error } = await supabase.from("screen_layouts").insert(widgetsToInsert);
  if (error) throw error;
}

// ============ THEME ============

export async function fetchTheme(customerId: string): Promise<Omit<ThemeConfig, "customer_id"> | null> {
  const { data, error } = await supabase
    .from("customer_themes")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    // Light Mode Colors
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    accent_color: data.accent_color,
    background_color: data.background_color,
    surface_color: data.surface_color,
    text_color: data.text_color,
    text_secondary_color: data.text_secondary_color,
    error_color: data.error_color,
    success_color: data.success_color,
    warning_color: data.warning_color,
    // Dark Mode Colors
    primary_color_dark: data.primary_color_dark,
    secondary_color_dark: data.secondary_color_dark,
    accent_color_dark: data.accent_color_dark,
    background_color_dark: data.background_color_dark,
    surface_color_dark: data.surface_color_dark,
    text_color_dark: data.text_color_dark,
    text_secondary_color_dark: data.text_secondary_color_dark,
    error_color_dark: data.error_color_dark,
    success_color_dark: data.success_color_dark,
    warning_color_dark: data.warning_color_dark,
    // Dark Mode Settings
    dark_mode_enabled: data.dark_mode_enabled !== false,
    // Typography
    font_family: data.font_family,
    font_scale: data.font_scale,
    // Border Radius
    border_radius_small: data.border_radius_small,
    border_radius_medium: data.border_radius_medium,
    border_radius_large: data.border_radius_large,
    roundness: data.roundness,
    // Elevation
    card_elevation: data.card_elevation,
    button_elevation: data.button_elevation,
    // Component Styles
    button_style: data.button_style,
    card_style: data.card_style,
    input_style: data.input_style,
    chip_style: data.chip_style,
    // Theme Preset
    theme_preset: data.theme_preset,
    // Status
    status: data.status,
  };
}

export async function saveTheme(customerId: string, theme: Omit<ThemeConfig, "customer_id">) {
  const { error } = await supabase
    .from("customer_themes")
    .upsert(
      {
        customer_id: customerId,
        ...theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" }
    );

  if (error) throw error;
}

// ============ BRANDING ============

export async function fetchBranding(customerId: string): Promise<Omit<CustomerBranding, "customer_id"> | null> {
  const { data, error } = await supabase
    .from("customer_branding")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    app_name: data.app_name,
    app_tagline: data.app_tagline,
    logo_url: data.logo_url,
    logo_small_url: data.logo_small_url,
    logo_dark_url: data.logo_dark_url,
    splash_image_url: data.splash_image_url,
    login_hero_url: data.login_hero_url,
    favicon_url: data.favicon_url,
    ai_tutor_name: data.ai_tutor_name,
    doubt_section_name: data.doubt_section_name,
    assignment_name: data.assignment_name,
    test_name: data.test_name,
    live_class_name: data.live_class_name,
    support_email: data.support_email,
    support_phone: data.support_phone,
    whatsapp_number: data.whatsapp_number,
    help_center_url: data.help_center_url,
    terms_url: data.terms_url,
    privacy_url: data.privacy_url,
    refund_url: data.refund_url,
    text_overrides: data.text_overrides || {},
  };
}

export async function saveBranding(customerId: string, branding: Omit<CustomerBranding, "customer_id">) {
  const { error } = await supabase
    .from("customer_branding")
    .upsert(
      {
        customer_id: customerId,
        ...branding,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" }
    );

  if (error) throw error;
}

// ============ LOAD ALL CONFIG ============

export async function loadFullConfig(customerId: string) {
  const [tabs, screenLayouts, theme, branding] = await Promise.all([
    fetchAllNavigationTabs(customerId),
    fetchAllScreenLayouts(customerId),
    fetchTheme(customerId),
    fetchBranding(customerId),
  ]);

  return { tabs, screenLayouts, theme, branding };
}

// ============ CUSTOMER MANAGEMENT ============

export async function validateSlugAvailability(slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data === null;
}

export async function createCustomer(customerData: {
  name: string;
  slug: string;
  subscription_tier?: string;
  status?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: customerData.name,
      slug: customerData.slug,
      subscription_tier: customerData.subscription_tier || "free",
      status: customerData.status || "active",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function cloneCustomerConfig(
  sourceCustomerId: string,
  targetCustomerId: string,
  overrides?: {
    branding?: Partial<Omit<CustomerBranding, "customer_id">>;
    theme?: Partial<Omit<ThemeConfig, "customer_id">>;
  }
): Promise<void> {
  const sourceConfig = await loadFullConfig(sourceCustomerId);

  await Promise.all([
    ...(["student", "teacher", "parent", "admin"] as Role[]).map((role) =>
      saveNavigationTabs(targetCustomerId, role, sourceConfig.tabs[role] || [])
    ),
    saveTheme(targetCustomerId, {
      ...sourceConfig.theme!,
      ...overrides?.theme,
    }),
    saveBranding(targetCustomerId, {
      ...sourceConfig.branding!,
      ...overrides?.branding,
    }),
  ]);

  const screenLayoutPromises: Promise<void>[] = [];
  (["student", "teacher", "parent", "admin"] as Role[]).forEach((role) => {
    Object.entries(sourceConfig.screenLayouts[role] || {}).forEach(
      ([screenId, layout]) => {
        screenLayoutPromises.push(
          saveScreenLayout(
            targetCustomerId,
            role,
            screenId,
            layout.widgets,
            layout.layoutSettings
          )
        );
      }
    );
  });

  await Promise.all(screenLayoutPromises);
}

export async function initializeDefaultConfig(
  customerId: string,
  branding?: Partial<Omit<CustomerBranding, "customer_id">>
): Promise<void> {
  const DEFAULT_BRANDING: Omit<CustomerBranding, "customer_id"> = {
    app_name: "Learning App",
    app_tagline: "Learn Smarter",
    ai_tutor_name: "AI Tutor",
    doubt_section_name: "Ask Doubts",
    assignment_name: "Assignment",
    test_name: "Test",
    live_class_name: "Live Class",
    text_overrides: {},
  };

  const DEFAULT_THEME: Omit<ThemeConfig, "customer_id"> = {
    primary_color: "#6750A4",
    secondary_color: "#958DA5",
    accent_color: "#7C4DFF",
    background_color: "#FFFBFE",
    surface_color: "#FFFFFF",
    text_color: "#1C1B1F",
    text_secondary_color: "#49454F",
    error_color: "#B3261E",
    success_color: "#2E7D32",
    warning_color: "#ED6C02",
    primary_color_dark: "#D0BCFF",
    secondary_color_dark: "#CCC2DC",
    accent_color_dark: "#9575FF",
    background_color_dark: "#1C1B1F",
    surface_color_dark: "#2B2930",
    text_color_dark: "#E6E1E5",
    text_secondary_color_dark: "#CAC4D0",
    error_color_dark: "#F2B8B5",
    success_color_dark: "#81C784",
    warning_color_dark: "#FFB74D",
    dark_mode_enabled: true,
    font_family: "Inter",
    font_scale: 1.0,
    border_radius_small: 8,
    border_radius_medium: 12,
    border_radius_large: 16,
    roundness: 12,
    card_elevation: 2,
    button_elevation: 1,
    button_style: "filled",
    card_style: "elevated",
    input_style: "outlined",
    chip_style: "filled",
    theme_preset: "default",
    status: "active",
  };

  await Promise.all([
    saveTheme(customerId, DEFAULT_THEME),
    saveBranding(customerId, { ...DEFAULT_BRANDING, ...branding }),
  ]);
}

export async function createCustomerWithConfig(params: {
  name: string;
  slug: string;
  subscription_tier?: string;
  cloneFrom?: string;
  branding?: Partial<Omit<CustomerBranding, "customer_id">>;
  theme?: Partial<Omit<ThemeConfig, "customer_id">>;
}): Promise<string> {
  const isAvailable = await validateSlugAvailability(params.slug);
  if (!isAvailable) {
    throw new Error(`Slug "${params.slug}" is already taken`);
  }

  const customerId = await createCustomer({
    name: params.name,
    slug: params.slug,
    subscription_tier: params.subscription_tier,
  });

  try {
    if (params.cloneFrom) {
      await cloneCustomerConfig(params.cloneFrom, customerId, {
        branding: params.branding,
        theme: params.theme,
      });
    } else {
      await initializeDefaultConfig(customerId, params.branding);
    }

    await triggerConfigChangeEvent(customerId, "customer_created");

    return customerId;
  } catch (error) {
    await supabase.from("customers").delete().eq("id", customerId);
    throw error;
  }
}

// ============ PUBLISH ============

export async function triggerConfigChangeEvent(customerId: string, eventType: string, version?: number) {
  const { error } = await supabase.from("config_change_events").insert({
    customer_id: customerId,
    event_type: eventType,
    version,
  });

  if (error) throw error;
}

export async function createPublishJob(customerId: string, version: number) {
  const jobId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabase.from("publish_jobs").insert({
    id: jobId,
    customer_id: customerId,
    status: "publishing",
    started_at: new Date().toISOString(),
    version,
  });

  if (error) throw error;
  return jobId;
}

export async function completePublishJob(jobId: string, status: "published" | "failed", error?: string) {
  const { error: updateError } = await supabase
    .from("publish_jobs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      error,
    })
    .eq("id", jobId);

  if (updateError) throw updateError;
}

export async function fetchPublishHistory(customerId: string) {
  const { data, error } = await supabase
    .from("publish_jobs")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}
