/**
 * UserDetailScreen - User Detail Dynamic Screen
 *
 * Purpose: Admin screen for viewing detailed user information, activity, and performing user actions
 * Type: Dynamic (widget-based) - Uses DynamicScreen to render widgets from screen_layouts
 * Accessible from: UserManagementScreen user list, user search results
 *
 * ============================================================================
 * PHASE 1: PLANNING ✓
 * ============================================================================
 * - Screen purpose: View detailed user profile, activity, and perform actions (edit, suspend, impersonate)
 * - Target role: admin, super_admin
 * - Screen ID: users-detail
 * - Route params: userId (required)
 * - Widgets needed:
 *   - profile.card (user avatar, name, role, status)
 *   - profile.stats (user statistics - XP, streak, badges)
 *   - profile.activity (recent user activity timeline)
 *   - admin.quick-actions (edit, suspend, impersonate, reset password)
 * - Navigation: Back to users-management, forward to edit-user, impersonation
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - screen_layouts: 4 widget entries for users-detail screen
 * - RLS: admin role can read screen_layouts where role = 'admin'
 *
 * SQL for screen_layouts (run in Supabase):
 * ```sql
 * -- User Detail Screen Widgets
 * INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
 * VALUES
 *   ('demo-customer-id', 'admin', 'users-detail', 'profile.card', 1, true, 'standard', '{"showEditButton": true, "showRole": true, "showStatus": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-detail', 'profile.stats', 2, true, 'standard', '{"showXP": true, "showStreak": true, "showBadges": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-detail', 'admin.user-actions', 3, true, 'standard', '{"showEdit": true, "showSuspend": true, "showImpersonate": true, "showResetPassword": true}'::jsonb),
 *   ('demo-customer-id', 'admin', 'users-detail', 'profile.activity', 4, true, 'expanded', '{"maxItems": 10, "showViewAll": true}'::jsonb);
 * ```
 *
 * ============================================================================
 * PHASE 3: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts:
 *   - "users-detail": { screenId: "users-detail", component: UserDetailScreen }
 *   - "UsersDetail": { screenId: "UsersDetail", component: UserDetailScreen }
 *
 * ============================================================================
 * PHASE 4: PLATFORM STUDIO INTEGRATION ✓
 * ============================================================================
 * - Screen added to Platform Studio screenRegistry
 * - allowedWidgets: ["profile.*", "admin.*", "users.*"]
 * - Drag-drop widget configuration enabled
 *
 * ============================================================================
 * PHASE 5: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Widgets render in correct order (1-4)
 * - [ ] Widget configs (custom_props) applied correctly
 * - [ ] User data loads correctly from userId param
 * - [ ] Pull-to-refresh works
 * - [ ] Offline mode shows cached data
 * - [ ] Edit user navigation works
 * - [ ] Suspend user action works
 * - [ ] Impersonate user action works
 * - [ ] Reset password action works
 * - [ ] Back navigation works
 * - [ ] Analytics events fire (screen_view, user_detail_viewed)
 * - [ ] Role check: only admin/super_admin can access
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
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
  route?: any;
  onFocused?: () => void;
};

type RouteParams = {
  userId?: string;
  userName?: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

export const UserDetailScreen: React.FC<Props> = ({
  screenId = "users-detail",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();
  const { user } = useAuthStore();

  // Get route params
  const params = (route?.params || {}) as RouteParams;
  const userId = params.userId;
  const userName = params.userName;

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
      data: { role, customerId, userId },
    });

    // Track user detail viewed
    if (userId) {
      trackEvent("user_detail_viewed", {
        screenId,
        targetUserId: userId,
      });
    }
  }, [screenId, role, customerId, userId, trackScreenView, trackEvent]);

  // Handle focus
  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      return () => {};
    }, [onFocused])
  );

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("user_detail_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleImpersonate = useCallback(() => {
    trackEvent("user_detail_impersonate_pressed", { userId });
    navigation.navigate("user-impersonation", {
      userId,
      userName,
    });
  }, [navigation, trackEvent, userId, userName]);

  // ===========================================================================
  // RENDER - No userId provided
  // ===========================================================================
  if (!userId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.errorContainer}>
          <Icon name="account-alert" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:userDetail.noUserSelected", {
              defaultValue: "No user selected. Please select a user from the list.",
            })}
          </AppText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <AppText style={styles.backButtonText}>
              {t("common:actions.goBack", { defaultValue: "Go Back" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackButton}
          accessibilityLabel={t("common:actions.goBack", { defaultValue: "Go back" })}
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {userName ||
              t("admin:userDetail.title", { defaultValue: "User Details" })}
          </AppText>
          <AppText
            style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}
          >
            {t("admin:userDetail.subtitle", {
              defaultValue: "View and manage user",
            })}
          </AppText>
        </View>

        <View style={styles.headerRight}>
          {/* Impersonate Button */}
          <TouchableOpacity
            onPress={handleImpersonate}
            style={styles.headerActionButton}
            accessibilityLabel={t("admin:userDetail.actions.impersonate", { defaultValue: "Impersonate user" })}
            accessibilityRole="button"
          >
            <Icon name="account-switch" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Screen - Renders widgets from screen_layouts */}
      {/* Pass userId to widgets via customProps override */}
      <DynamicScreen
        screenId={screenId}
        role={role as any}
        customerId={customerId}
        userId={userId}
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40, // Balance the back button
  },
  headerActionButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default UserDetailScreen;
