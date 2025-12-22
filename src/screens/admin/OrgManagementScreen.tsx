/**
 * OrgManagementScreen - Admin Organization Management Dynamic Screen
 *
 * Purpose: Manage organization structure including departments, classes, and batches
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation, Quick Actions widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Organization hierarchy management
 * - Target role: admin, super_admin
 * - Screen ID: org-management
 * - Widgets needed:
 *   - admin.org-tree (hierarchical org structure view)
 *   - admin.class-list (classes with student counts)
 *   - admin.quick-create (create org/dept/class/batch)
 *   - admin.org-stats (organization statistics)
 * - Tab: Organization section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Organization Management Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'org-management', 'admin.org-tree', 1, true, 'expanded', '{"expandable": true, "showCounts": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'org-management', 'admin.class-list', 2, true, 'standard', '{"showSearch": true, "showFilters": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'org-management', 'admin.quick-create', 3, true, 'standard', '{"types": ["organization", "department", "class", "batch"]}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "org-management": { screenId: "org-management", component: OrgManagementScreen }
 *   - "OrgManagement": { screenId: "OrgManagement", component: OrgManagementScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["admin.org-*", "admin.class-*", "admin.quick-*"]
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Org tree displays hierarchy correctly
 * - [ ] Class list is searchable
 * - [ ] Quick create forms work
 * - [ ] Node expansion/collapse works
 * - [ ] Pull-to-refresh updates data
 * - [ ] Analytics events fire (screen_view, org_action)
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

export const OrgManagementScreen: React.FC<Props> = ({
  screenId = "org-management",
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
      trackEvent("org_management_focused", { screenId });
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

export default OrgManagementScreen;
