/**
 * ContentManagementScreen - Admin Content Management Dynamic Screen
 *
 * Purpose: Manage platform content including courses, lessons, and resources
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation, Quick Actions widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Content library management with CRUD operations
 * - Target role: admin, super_admin
 * - Screen ID: content-management
 * - Widgets needed:
 *   - admin.content-stats (total content, views, ratings)
 *   - admin.content-list (searchable content list with filters)
 *   - admin.content-categories (category browser)
 *   - admin.content-actions (create, bulk edit, import)
 * - Tab: Content section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Content Management Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'content-management', 'admin.content-stats', 1, true, 'standard', '{"showViews": true, "showRatings": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'content-management', 'admin.content-list', 2, true, 'expanded', '{"showFilters": true, "showSearch": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'content-management', 'admin.content-categories', 3, true, 'standard', '{"collapsible": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'content-management', 'admin.content-actions', 4, true, 'compact', '{"showBulkEdit": true}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "content-management": { screenId: "content-management", component: ContentManagementScreen }
 *   - "ContentManagement": { screenId: "ContentManagement", component: ContentManagementScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["admin.content-*"]
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Content stats show accurate counts
 * - [ ] Content list is searchable and filterable
 * - [ ] Categories display correctly
 * - [ ] CRUD actions work properly
 * - [ ] Pull-to-refresh updates content list
 * - [ ] Analytics events fire (screen_view, content_action)
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

export const ContentManagementScreen: React.FC<Props> = ({
  screenId = "content-management",
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
      trackEvent("content_management_focused", { screenId });
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

export default ContentManagementScreen;
