/**
 * FinanceReportsScreen - Dynamic Screen (Admin)
 *
 * Purpose: Finance reports dashboard that renders report widgets from screen_layouts
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets
 * Accessible from: Admin Finance Tab, Finance Dashboard navigation, Quick Actions
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Generate, view, and export financial reports with charts
 * - Target role: admin, super_admin
 * - Screen ID: finance-reports
 * - Widgets rendered from screen_layouts:
 *   - finance.revenue-summary (period overview with revenue metrics)
 *   - finance.expense-summary (expense tracking with category breakdown)
 *   - finance.net-profit (profit analysis with margin calculation)
 *   - finance.monthly-chart (trend visualization - line chart)
 *   - finance.category-breakdown (pie chart for revenue/expense categories)
 *   - finance.collection-rate (fee collection efficiency metrics)
 *   - finance.transactions (recent transactions list)
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- Delete existing entries for clean setup
 * DELETE FROM screen_layouts WHERE screen_id = 'finance-reports';
 *
 * -- Insert widget configurations for finance-reports screen
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.revenue-summary', 1, true, 'standard',
 *    '{"showTrend": true, "showBreakdown": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.expense-summary', 2, true, 'standard',
 *    '{"showTrend": true, "showCategories": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.net-profit', 3, true, 'standard',
 *    '{"showMargin": true, "showComparison": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.monthly-chart', 4, true, 'expanded',
 *    '{"months": 6, "showLegend": true, "showGrid": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.category-breakdown', 5, true, 'standard',
 *    '{"showPercentages": true, "showLegend": true, "type": "revenue"}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.collection-rate', 6, true, 'standard',
 *    '{"showProgressBar": true, "showAmounts": true, "thresholdGood": 80}'::jsonb),
 *   ('demo-customer-id', 'admin', 'finance-reports', 'finance.transactions', 7, true, 'standard',
 *    '{"maxItems": 5, "showStatus": true, "showCategory": true}'::jsonb);
 *
 * -- Also add for super_admin role
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.revenue-summary', 1, true, 'standard',
 *    '{"showTrend": true, "showBreakdown": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.expense-summary', 2, true, 'standard',
 *    '{"showTrend": true, "showCategories": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.net-profit', 3, true, 'standard',
 *    '{"showMargin": true, "showComparison": true, "defaultPeriod": "month"}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.monthly-chart', 4, true, 'expanded',
 *    '{"months": 6, "showLegend": true, "showGrid": true}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.category-breakdown', 5, true, 'standard',
 *    '{"showPercentages": true, "showLegend": true, "type": "revenue"}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.collection-rate', 6, true, 'standard',
 *    '{"showProgressBar": true, "showAmounts": true, "thresholdGood": 80}'::jsonb),
 *   ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.transactions', 7, true, 'standard',
 *    '{"maxItems": 5, "showStatus": true, "showCategory": true}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts as "finance-reports" and "FinanceReports"
 * - Registered in DynamicTabNavigator.tsx COMMON_SCREENS
 * - Accessible from finance-dashboard, admin-home quick actions
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["finance.*"]
 * - Supports drag-drop widget configuration
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [x] Widgets render in correct order from screen_layouts
 * - [x] Widget configs (custom_props) applied correctly
 * - [x] Pull-to-refresh works via DynamicScreen
 * - [x] Offline mode shows cached data
 * - [x] Navigation from widgets works (finance-reports detail views)
 * - [x] Analytics events fire (screen_view, widget interactions)
 * - [x] Error boundary catches widget errors
 * - [x] Loading/empty/error states handled
 */

import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

// UI Components
import { AppText } from "../../../ui/components/AppText";

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

export const FinanceReportsScreen: React.FC<Props> = ({
  screenId = "finance-reports",
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

  // Track screen view on mount
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  // Track focus events
  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      trackEvent("finance_reports_focused", { screenId });
      return () => {};
    }, [onFocused, trackEvent, screenId])
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    trackEvent("finance_reports_back", { screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  // Render DynamicScreen which loads widgets from screen_layouts table
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Offline indicator */}
      <OfflineBanner />
      
      {/* Header with back button */}
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
          {t("admin:screens.financeReports.title", { defaultValue: "Finance Reports" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Dynamic content from screen_layouts - renders finance widgets */}
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

export default FinanceReportsScreen;
