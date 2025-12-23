/**
 * AuditLogsScreen - Admin Audit Logs Dynamic Screen
 *
 * Purpose: View and search system activity logs for compliance and debugging
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation, Quick Actions widget
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Audit trail viewing with search and filtering
 * - Target role: admin, super_admin
 * - Screen ID: audit-logs
 * - Widgets needed:
 *   - admin.audit-filters (date range, user, action type filters)
 *   - admin.audit-list (paginated log entries)
 *   - admin.audit-stats (activity summary)
 *   - admin.audit-export (export logs for compliance)
 * - Tab: Audit section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Audit Logs Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'audit-logs', 'admin.audit-filters', 1, true, 'standard', '{"showDateRange": true, "showUserFilter": true, "showActionFilter": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'audit-logs', 'admin.audit-stats', 2, true, 'compact', '{"period": "today"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'audit-logs', 'admin.audit-list', 3, true, 'expanded', '{"pageSize": 20, "showDetails": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'audit-logs', 'admin.audit-export', 4, true, 'compact', '{"formats": ["csv", "json"]}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "audit-logs": { screenId: "audit-logs", component: AuditLogsScreen }
 *   - "AuditLogs": { screenId: "AuditLogs", component: AuditLogsScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["admin.audit-*"]
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Filters update log list
 * - [ ] Pagination works correctly
 * - [ ] Log details expand properly
 * - [ ] Export generates valid files
 * - [ ] Pull-to-refresh updates logs
 * - [ ] Analytics events fire (screen_view, audit_search)
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

export const AuditLogsScreen: React.FC<Props> = ({
  screenId = "audit-logs",
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
      trackEvent("audit_logs_focused", { screenId });
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

export default AuditLogsScreen;
