import { DEFAULT_CONFIG, DEFAULT_PERMISSIONS, SAFE_MODE_CONFIG } from "../../config/defaultConfig";
import type { CustomerConfig, NavigationConfig, ThemeConfig } from "../../types/config.types";
import type { FeatureToggle } from "../../types/feature.types";
import type { PermissionSet, Role } from "../../types/permission.types";
import type { DashboardConfig, WidgetLayoutItem } from "../../types/widget.types";
import { DEFAULT_BRANDING } from "../../types/branding.types";
import { validateCustomerConfig } from "../../validation/configSchemas";
import { getSupabaseClient, DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import { saveCustomerConfigToCache } from "../../offline/configCache";
import { captureException, addBreadcrumb } from "../../error/sentry";
import { EXPECTED_CONFIG_VERSION, isVersionMismatch } from "./versioning";

export const CustomerConfigService = {
  async loadConfigForCustomer(
    customerSlug: string,
    role: Role = "student",
    userId?: string | null
  ): Promise<CustomerConfig> {
    try {
      const supabase = getSupabaseClient();

      // If Supabase isn't configured, fall back to local defaults
      if (!supabase) {
        return validateCustomerConfig(DEFAULT_CONFIG);
      }

      // Use demo customer ID for now (can be replaced with slug lookup later)
      const customerId = DEMO_CUSTOMER_ID;

      // Fetch customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError || !customer) {
        console.warn("[Config] Customer not found, using DEFAULT_CONFIG", customerError);
        addBreadcrumb({ category: "config", message: "customer_not_found", level: "warning", data: { customerSlug } });
        return validateCustomerConfig(DEFAULT_CONFIG);
      }

      // Fetch navigation tabs
      const { data: tabs } = await supabase
        .from("navigation_tabs")
        .select("*")
        .eq("customer_id", customerId)
        .eq("role", role)
        .eq("enabled", true)
        .order("order_index");

      // Fetch screen layouts for dashboard
      const { data: layouts } = await supabase
        .from("screen_layouts")
        .select("*")
        .eq("customer_id", customerId)
        .eq("role", role)
        .eq("enabled", true)
        .order("position");

      // Fetch theme
      const { data: theme } = await supabase
        .from("customer_themes")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      // Build navigation config
      const mappedTabs = (tabs || []).map((tab: any) => ({
        tabId: tab.tab_id,
        role: tab.role,
        label: tab.label,
        icon: tab.icon,
        initialRoute: tab.root_screen_id,
        orderIndex: tab.order_index,
        enabled: tab.enabled,
        featureId: tab.required_feature,
        requiredPermissions: tab.required_permission ? [tab.required_permission] : undefined,
      }));

      // Generate screens from tabs - each tab needs at least its root screen
      const screens = mappedTabs.map((tab: any, index: number) => ({
        screenId: tab.initialRoute,
        tabId: tab.tabId,
        orderIndex: index,
        enabled: true,
        featureId: tab.featureId,
        requiredPermissions: tab.requiredPermissions,
      }));

      const navigation: NavigationConfig = {
        tabs: mappedTabs,
        screens,
      };

      // Build dashboard config from layouts
      const dashboardWidgets: WidgetLayoutItem[] = (layouts || [])
        .filter((l: any) => l.screen_id === "student-home" || l.screen_id === "teacher-home")
        .map((l: any) => ({
          widgetId: l.widget_id,
          orderIndex: l.position,
          enabled: l.enabled,
          customProps: l.custom_props,
        }));

      // Build theme config
      const themeConfig: ThemeConfig = theme ? {
        primaryColor: theme.primary_color,
        secondaryColor: theme.secondary_color,
        surfaceColor: theme.surface_color,
        logoUrl: theme.logo_url,
        roundness: theme.roundness,
        status: theme.status,
        defaultLanguage: "en",
      } : DEFAULT_CONFIG.theme;

      const customerConfig: CustomerConfig = {
        customer: {
          id: customer.id,
          name: customer.name,
          slug: customer.slug,
          status: customer.status,
        },
        features: DEFAULT_CONFIG.features, // Use default features for now
        navigation: navigation.tabs.length > 0 ? navigation : DEFAULT_CONFIG.navigation,
        dashboard: dashboardWidgets.length > 0 
          ? [{ role, layout: dashboardWidgets }]
          : DEFAULT_CONFIG.dashboard,
        theme: themeConfig,
        branding: DEFAULT_BRANDING,
        permissions: DEFAULT_PERMISSIONS,
        version: 1,
      };

      const validated = validateCustomerConfig(customerConfig);
      
      // Cache successful config for offline use
      try {
        await saveCustomerConfigToCache(customerSlug, validated);
      } catch {
        // ignore cache failure
      }
      
      return validated;
    } catch (error) {
      console.error("[Config] Failed to load config, falling back to DEFAULT_CONFIG", error);
      captureException(error, { scope: "config", customerSlug, role, userId });
      // Return DEFAULT_CONFIG instead of SAFE_MODE_CONFIG for better UX
      return validateCustomerConfig(DEFAULT_CONFIG);
    }
  },
};
