/**
 * AdminDashboardScreen - Admin Dashboard Dynamic Screen
 *
 * Purpose: Main admin dashboard showing system overview, stats, alerts, and quick actions
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation tab, login success redirect
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Admin dashboard with system overview and management tools
 * - Target role: admin, super_admin
 * - Screen ID: admin-home
 * - Widgets needed:
 *   - admin.hero-card (greeting + quick stats)
 *   - admin.stats-grid (users, revenue, alerts overview)
 *   - admin.system-health (uptime, CPU, memory)
 *   - admin.alerts (critical/warning/info alerts)
 *   - admin.quick-actions (add user, reports, settings, audit)
 *   - admin.recent-activity (latest admin actions)
 * - Tab: Home tab for admin role
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - navigation_tabs: admin role, home tab, initial_route: admin-home
 * - screen_layouts: 6 widget entries for admin-home screen
 * - RLS: admin role can read screen_layouts where role = 'admin'
 *
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Admin Dashboard Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.hero-card', 1, true, 'standard', '{"showQuickStats": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.stats-grid', 2, true, 'standard', '{"columns": 2}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.system-health', 3, true, 'standard', '{"showDetailsLink": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.alerts', 4, true, 'standard', '{"maxItems": 5, "showViewAll": true, "showAcknowledge": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.quick-actions', 5, true, 'standard', '{}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-home', 'admin.recent-activity', 6, true, 'standard', '{"maxItems": 5}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "admin-home": { screenId: "admin-home", component: DynamicScreen }
 *   - "AdminHome": { screenId: "AdminHome", component: DynamicScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["admin.*", "profile.*", "actions.*"]
 * - Drag-drop widget configuration enabled
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Widgets render in correct order (1-6)
 * - [ ] Widget configs (custom_props) applied correctly
 * - [ ] Pull-to-refresh works
 * - [ ] Offline mode shows cached data
 * - [ ] Navigation from widgets works (users-management, finance-dashboard, etc.)
 * - [ ] Analytics events fire (screen_view)
 * - [ ] Role check: only admin/super_admin can access
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
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

export const AdminDashboardScreen: React.FC<Props> = ({
  screenId = "admin-home",
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
  const { user, impersonating } = useAuthStore();

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    // Track screen view
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  // Handle focus
  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      
      // Track dashboard focus for analytics
      trackEvent("admin_dashboard_focused", {
        screenId,
        isImpersonating: !!impersonating,
      });

      return () => {};
    }, [onFocused, trackEvent, screenId, impersonating])
  );

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Impersonation Banner */}
      {impersonating && (
        <View
          style={[
            styles.impersonationBanner,
            { backgroundColor: colors.tertiaryContainer },
          ]}
        >
          <View style={styles.impersonationContent}>
            <View style={styles.impersonationText}>
              <View
                style={[
                  styles.impersonationDot,
                  { backgroundColor: colors.tertiary },
                ]}
              />
              <View>
                <View style={styles.impersonationLabel}>
                  {/* Using View instead of AppText for inline styling */}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Dynamic Screen - Renders widgets from screen_layouts */}
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
  impersonationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  impersonationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  impersonationText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  impersonationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  impersonationLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AdminDashboardScreen;
