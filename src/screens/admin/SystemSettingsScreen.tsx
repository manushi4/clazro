/**
 * SystemSettingsScreen - Admin System Settings Dynamic Screen
 *
 * Purpose: Configure platform-wide settings and preferences
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation, Quick Actions widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: System configuration and settings management
 * - Target role: admin, super_admin
 * - Screen ID: system-settings
 * - Widgets needed:
 *   - admin.general-settings (app name, logo, theme)
 *   - admin.notification-settings (email, push, SMS config)
 *   - admin.security-settings (2FA, password policies)
 *   - admin.integration-settings (API keys, webhooks)
 *   - admin.feature-flags (enable/disable features)
 * - Tab: Settings section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- System Settings Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'system-settings', 'admin.general-settings', 1, true, 'standard', '{"sections": ["branding", "localization"]}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'admin.notification-settings', 2, true, 'standard', '{"channels": ["email", "push", "sms"]}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'admin.security-settings', 3, true, 'standard', '{"show2FA": true, "showPasswordPolicy": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'admin.feature-flags', 4, true, 'standard', '{"showExperimental": false}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "system-settings": { screenId: "system-settings", component: SystemSettingsScreen }
 *   - "SystemSettings": { screenId: "SystemSettings", component: SystemSettingsScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["admin.*-settings", "admin.feature-*"]
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Settings widgets render correctly
 * - [ ] Changes save properly
 * - [ ] Feature flags toggle correctly
 * - [ ] Security settings enforce policies
 * - [ ] Pull-to-refresh reloads settings
 * - [ ] Analytics events fire (screen_view, setting_changed)
 */

import React, { useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { OfflineBanner } from "../../offline/OfflineBanner";

// Core Component
import { DynamicScreen } from "../../navigation/DynamicScreen";

// Auth
import { useAuthStore } from "../../stores/authStore";

// Constants
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  onFocused?: () => void;
};

// =============================================================================
// COMPONENT
// =============================================================================

export const SystemSettingsScreen: React.FC<Props> = ({
  screenId = "system-settings",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const { user } = useAuthStore();

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      trackEvent("system_settings_focused", { screenId });
      return () => {};
    }, [onFocused, trackEvent, screenId])
  );

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <OfflineBanner />
      <DynamicScreen
        screenId={screenId}
        role={role as any}
        customerId={customerId}
        userId={user?.id || "demo-admin-001"}
        onFocused={onFocused}
      />
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SystemSettingsScreen;
