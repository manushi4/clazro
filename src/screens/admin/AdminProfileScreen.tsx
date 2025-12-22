/**
 * AdminProfileScreen - Admin Profile Dynamic Screen
 *
 * Purpose: Admin user profile with account info and activity log
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: Admin navigation, Profile icon
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: Admin profile management and activity viewing
 * - Target role: admin, super_admin
 * - Screen ID: admin-profile
 * - Widgets needed:
 *   - admin.profile-card (avatar, name, role, stats)
 *   - profile.activity (recent admin activities)
 *   - profile.settings-link (quick settings access)
 * - Tab: Profile section in admin navigation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'admin-profile', 'admin.profile-card', 1, true, 'standard', '{}'::jsonb),
 *   ('demo-customer-id', 'admin', 'admin-profile', 'profile.activity', 2, true, 'expanded', '{"maxItems": 10}'::jsonb);
 * ```
 */

import React, { useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { DynamicScreen } from "../../navigation/DynamicScreen";
import { useAuthStore } from "../../stores/authStore";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  onFocused?: () => void;
};


export const AdminProfileScreen: React.FC<Props> = ({
  screenId = "admin-profile",
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
      trackEvent("admin_profile_focused", { screenId });
      return () => {};
    }, [onFocused, trackEvent, screenId])
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AdminProfileScreen;
