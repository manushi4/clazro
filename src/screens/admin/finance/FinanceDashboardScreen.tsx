/**
 * FinanceDashboardScreen - Dynamic Screen (Admin)
 *
 * Purpose: Financial overview dashboard that renders finance widgets from screen_layouts
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets
 * Accessible from: Admin Finance Tab, Quick Actions widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Financial dashboard with revenue/expense tracking
 * - Target role: admin, super_admin
 * - Screen ID: finance-dashboard
 * - Widgets rendered from screen_layouts:
 *   - admin.revenue-summary
 *   - admin.expense-summary
 *   - admin.net-profit
 *   - admin.monthly-chart
 *   - admin.transactions
 *   - admin.pending-payments
 *   - admin.collection-rate
 *   - admin.category-breakdown
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size)
 * VALUES
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.revenue-summary', 1, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.expense-summary', 2, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.net-profit', 3, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.collection-rate', 4, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.monthly-chart', 5, true, 'expanded'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.category-breakdown', 6, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.transactions', 7, true, 'standard'),
 *   ('demo-customer-id', 'admin', 'finance-dashboard', 'admin.pending-payments', 8, true, 'standard');
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts as "finance-dashboard"
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen available in Platform Studio for widget configuration
 * - allowedWidgets: ["admin.revenue-*", "admin.expense-*", "admin.net-*", 
 *                    "admin.transactions", "admin.monthly-*", "admin.pending-*",
 *                    "admin.collection-*", "admin.category-*"]
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Widgets render in correct order from screen_layouts
 * - [ ] Widget configs (custom_props) applied correctly
 * - [ ] Pull-to-refresh works
 * - [ ] Offline mode shows cached data
 * - [ ] Navigation from widgets works
 * - [ ] Analytics events fire (screen_view)
 */

import React, { useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Theme
import { useAppTheme } from "../../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

// Offline Support
import { OfflineBanner } from "../../../offline/OfflineBanner";

// Core Component - renders widgets from screen_layouts
import { DynamicScreen } from "../../../navigation/DynamicScreen";

// Auth
import { useAuthStore } from "../../../stores/authStore";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

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

export const FinanceDashboardScreen: React.FC<Props> = ({
  screenId = "finance-dashboard",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  onFocused,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const { user } = useAuthStore();

  // Track screen view
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  // Track focus
  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      trackEvent("finance_dashboard_focused", { screenId });
      return () => {};
    }, [onFocused, trackEvent, screenId])
  );

  // Render DynamicScreen which loads widgets from screen_layouts table
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

export default FinanceDashboardScreen;
