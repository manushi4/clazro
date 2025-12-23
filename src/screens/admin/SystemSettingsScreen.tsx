/**
 * SystemSettingsScreen - Admin System Settings Dynamic Screen
 *
 * Purpose: Configure platform-wide settings and preferences
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation tabs, Quick Actions widget, admin-home
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: System configuration and settings management
 * - Target role: admin, super_admin
 * - Screen ID: system-settings
 * - Widgets rendered from screen_layouts:
 *   - settings.account (user account settings)
 *   - settings.notifications (notification preferences)
 *   - settings.appearance (theme, display settings)
 *   - settings.about (app info, version)
 *   - settings.logout (sign out action)
 * - Tab: Settings section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Delete existing entries for clean setup
 * DELETE FROM screen_layouts WHERE screen_id = 'system-settings';
 *
 * -- Insert widget configurations for admin role
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'system-settings', 'settings.account', 1, true, 'standard',
 *    '{"showAvatar": true, "showEmail": true, "showRole": true, "enableEdit": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'settings.notifications', 2, true, 'standard',
 *    '{"showPush": true, "showEmail": true, "showSMS": true, "showInApp": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'settings.appearance', 3, true, 'standard',
 *    '{"showTheme": true, "showLanguage": true, "showFontSize": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'settings.about', 4, true, 'compact',
 *    '{"showVersion": true, "showBuildNumber": true, "showSupport": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'system-settings', 'settings.logout', 5, true, 'compact',
 *    '{"showConfirmation": true}'::jsonb);
 *
 * -- Also add for super_admin role
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'super_admin', 'system-settings', 'settings.account', 1, true, 'standard',
 *    '{"showAvatar": true, "showEmail": true, "showRole": true, "enableEdit": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'system-settings', 'settings.notifications', 2, true, 'standard',
 *    '{"showPush": true, "showEmail": true, "showSMS": true, "showInApp": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'system-settings', 'settings.appearance', 3, true, 'standard',
 *    '{"showTheme": true, "showLanguage": true, "showFontSize": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'system-settings', 'settings.about', 4, true, 'compact',
 *    '{"showVersion": true, "showBuildNumber": true, "showSupport": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'system-settings', 'settings.logout', 5, true, 'compact',
 *    '{"showConfirmation": true}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts as "system-settings" and "SystemSettings"
 * - Registered in DynamicTabNavigator.tsx as admin tab root screen
 * - Accessible from admin-home quick actions
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["settings.*"]
 * - Supports drag-drop widget configuration
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [x] Settings widgets render correctly
 * - [x] Account settings show user info
 * - [x] Notification toggles work
 * - [x] Appearance changes apply immediately
 * - [x] Pull-to-refresh reloads settings
 * - [x] Offline mode shows cached settings
 * - [x] Analytics events fire (screen_view, setting_changed)
 */

import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

// UI Components
import { AppText } from "../../ui/components/AppText";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  onFocused?: () => void;
  /** If true, shows header with back button (for non-tab navigation) */
  showHeader?: boolean;
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
  showHeader = false,
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
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("system_settings_back", { screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Offline indicator */}
      <OfflineBanner />

      {/* Optional header for non-tab navigation */}
      {showHeader && (
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityLabel={t("common:actions.back", { defaultValue: "Go back" })}
            accessibilityRole="button"
          >
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:screens.systemSettings.title", { defaultValue: "System Settings" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
      )}

      {/* Dynamic content from screen_layouts - renders settings widgets */}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 44, // Accessibility: minimum touch target
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32, // Balance the back button
  },
});

export default SystemSettingsScreen;
