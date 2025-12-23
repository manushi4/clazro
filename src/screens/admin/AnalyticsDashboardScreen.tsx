/**
 * AnalyticsDashboardScreen - Dynamic Screen (Admin)
 *
 * Purpose: Platform analytics dashboard with KPIs, trends, engagement, and growth metrics
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation tabs, Quick Actions widget, admin-home
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Comprehensive analytics dashboard for platform insights
 * - Target role: admin, super_admin
 * - Screen ID: analytics-dashboard
 * - Widgets rendered from screen_layouts:
 *   - analytics.kpi-grid (key performance indicators grid)
 *   - analytics.trends (metrics over time - line charts)
 *   - analytics.engagement (DAU, WAU, session metrics, retention)
 *   - analytics.growth (user growth, revenue growth, targets)
 *   - analytics.comparisons (period-over-period comparisons)
 * - Tab: Analytics tab in admin bottom navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Delete existing entries for clean setup
 * DELETE FROM screen_layouts WHERE screen_id = 'analytics-dashboard';
 *
 * -- Insert widget configurations for admin role
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.kpi-grid', 1, true, 'standard',
 *    '{"columns": 2, "showTrend": true, "showGrowth": true, "limit": 6}'::jsonb),
 *   ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.trends', 2, true, 'expanded',
 *    '{"metrics": ["users", "revenue", "engagement"], "period": "month", "showLegend": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.engagement', 3, true, 'standard',
 *    '{"showDAU": true, "showWAU": true, "showRetention": true, "showRoleBreakdown": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.growth', 4, true, 'standard',
 *    '{"showTargets": true, "showTrendChart": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.comparisons', 5, true, 'standard',
 *    '{"periods": ["week", "month", "quarter"], "showChange": true}'::jsonb);
 *
 * -- Also add for super_admin role
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.kpi-grid', 1, true, 'standard',
 *    '{"columns": 2, "showTrend": true, "showGrowth": true, "limit": 6}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.trends', 2, true, 'expanded',
 *    '{"metrics": ["users", "revenue", "engagement"], "period": "month", "showLegend": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.engagement', 3, true, 'standard',
 *    '{"showDAU": true, "showWAU": true, "showRetention": true, "showRoleBreakdown": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.growth', 4, true, 'standard',
 *    '{"showTargets": true, "showTrendChart": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.comparisons', 5, true, 'standard',
 *    '{"periods": ["week", "month", "quarter"], "showChange": true}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts as "analytics-dashboard" and "AnalyticsDashboard"
 * - Tab root screen in admin navigation (Analytics tab)
 * - Accessible from admin-home quick actions
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["analytics.*"]
 * - Supports drag-drop widget configuration
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [x] KPI grid shows key metrics with trends
 * - [x] Trends widget displays line charts correctly
 * - [x] Engagement metrics (DAU, WAU, retention) are accurate
 * - [x] Growth targets display with progress indicators
 * - [x] Period comparisons calculate properly
 * - [x] Pull-to-refresh updates all widgets
 * - [x] Offline mode shows cached data
 * - [x] Analytics events fire (screen_view)
 * - [x] Navigation from widgets works
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

// Core Component - renders widgets from screen_layouts
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

export const AnalyticsDashboardScreen: React.FC<Props> = ({
  screenId = "analytics-dashboard",
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
      trackEvent("analytics_dashboard_focused", { screenId });
      return () => {};
    }, [onFocused, trackEvent, screenId])
  );

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("analytics_dashboard_back", { screenId });
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
            {t("admin:screens.analyticsDashboard.title", { defaultValue: "Analytics" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
      )}

      {/* Dynamic content from screen_layouts - renders analytics widgets */}
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

export default AnalyticsDashboardScreen;
