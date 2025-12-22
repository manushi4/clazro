/**
 * UserManagementScreen - User Management Dynamic Screen
 *
 * Purpose: Admin screen for managing all platform users - view, search, filter, and perform actions
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin dashboard quick actions, navigation tab, admin.stats-grid widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: User management with search, filters, bulk actions, and user list
 * - Target role: admin, super_admin
 * - Screen ID: users-management
 * - Widgets needed:
 *   - users.overview-stats (total, active, pending, suspended counts)
 *   - users.list (searchable, filterable user list)
 *   - users.pending-approvals (users awaiting approval)
 *   - users.role-distribution (pie chart of users by role)
 *   - users.bulk-actions (import, export, bulk approve, etc.)
 *   - users.recent-registrations (newly registered users)
 * - Tab: Accessible from admin-home quick actions and navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - screen_layouts: 6 widget entries for users-management screen
 * - RLS: admin role can read screen_layouts where role = 'admin'
 *
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- User Management Screen Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'users-management', 'users.overview-stats', 1, true, 'standard', '{}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-management', 'users.list', 2, true, 'expanded', '{"showSearchBar": true, "showBulkSelect": true, "maxItems": 10, "showViewAll": false}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-management', 'users.pending-approvals', 3, true, 'standard', '{"maxItems": 5}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-management', 'users.role-distribution', 4, true, 'standard', '{}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-management', 'users.bulk-actions', 5, true, 'standard', '{}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-management', 'users.recent-registrations', 6, true, 'standard', '{"maxItems": 5}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "users-management": { screenId: "users-management", component: UserManagementScreen }
 *   - "UsersManagement": { screenId: "UsersManagement", component: UserManagementScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["users.*", "admin.*", "actions.*"]
 * - Drag-drop widget configuration enabled
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Widgets render in correct order (1-6)
 * - [ ] Widget configs (custom_props) applied correctly
 * - [ ] Pull-to-refresh works
 * - [ ] Offline mode shows cached data
 * - [ ] Navigation to user detail works
 * - [ ] Search and filter functionality works
 * - [ ] Bulk actions work (approve, suspend, export)
 * - [ ] Analytics events fire (screen_view)
 * - [ ] Role check: only admin/super_admin can access
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
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

// UI Components
import { AppText } from "../../ui/components/AppText";

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

export const UserManagementScreen: React.FC<Props> = ({
  screenId = "users-management",
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

      // Track user management screen focus
      trackEvent("user_management_focused", {
        screenId,
      });

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
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.headerLeft}>
          <Icon
            name="account-group"
            size={24}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <View>
            <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
              {t("admin:screens.userManagement.title", {
                defaultValue: "User Management",
              })}
            </AppText>
            <AppText
              style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}
            >
              {t("admin:screens.userManagement.subtitle", {
                defaultValue: "Manage all platform users",
              })}
            </AppText>
          </View>
        </View>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default UserManagementScreen;
