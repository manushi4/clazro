/**
 * AdminDashboardScreen - Web Version
 *
 * Enhanced admin dashboard with web-specific layout:
 * - Breadcrumb navigation
 * - Quick stats bar
 * - Multi-column widget grid
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { AppText } from "../../ui/components/AppText";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { OfflineBanner } from "../../offline/OfflineBanner";

// Core Component
import { DynamicScreen } from "../../navigation/DynamicScreen";

// Admin Components
import { WebAdminLayout } from "../../components/admin/WebAdminLayout";
import { QuickStats, StatItem } from "../../components/admin/QuickStats";

// Auth
import { useAuthStore } from "../../stores/authStore";

// Hooks
import { useAdminStatsQuery } from "../../hooks/queries/admin/useAdminStatsQuery";

// Constants
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  onFocused?: () => void;
};

export const AdminDashboardScreen: React.FC<Props> = ({
  screenId = "admin-home",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  onFocused,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const { user, impersonating } = useAuthStore();

  // Fetch quick stats
  const { data: statsData } = useAdminStatsQuery(customerId);

  // Build quick stats items
  const quickStats: StatItem[] = [
    {
      id: 'total-users',
      label: t('admin:dashboard.stats.totalUsers', { defaultValue: 'Total Users' }),
      value: statsData?.totalUsers?.toLocaleString() ?? '-',
      icon: 'account-group',
      color: colors.primary,
      change: statsData?.userChange ? {
        value: statsData.userChange,
        type: statsData.userChange > 0 ? 'increase' : statsData.userChange < 0 ? 'decrease' : 'neutral',
      } : undefined,
      onPress: () => navigation.navigate('users-management'),
    },
    {
      id: 'revenue',
      label: t('admin:dashboard.stats.revenue', { defaultValue: 'Revenue' }),
      value: statsData?.revenue ? `${statsData.revenue.toLocaleString('en-IN')}` : '-',
      icon: 'currency-inr',
      color: colors.success || '#4CAF50',
      change: statsData?.revenueChange ? {
        value: statsData.revenueChange,
        type: statsData.revenueChange > 0 ? 'increase' : statsData.revenueChange < 0 ? 'decrease' : 'neutral',
      } : undefined,
      onPress: () => navigation.navigate('finance-dashboard'),
    },
    {
      id: 'active-classes',
      label: t('admin:dashboard.stats.activeClasses', { defaultValue: 'Active Classes' }),
      value: statsData?.activeClasses?.toString() ?? '-',
      icon: 'school',
      color: colors.tertiary || '#9C27B0',
      onPress: () => navigation.navigate('academic-dashboard'),
    },
    {
      id: 'pending-alerts',
      label: t('admin:dashboard.stats.pendingAlerts', { defaultValue: 'Pending Alerts' }),
      value: statsData?.pendingAlerts?.toString() ?? '-',
      icon: 'bell-alert',
      color: statsData?.pendingAlerts && statsData.pendingAlerts > 0 ? colors.warning : colors.onSurfaceVariant,
      onPress: () => navigation.navigate('admin-alerts'),
    },
  ];

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

  // Handle focus
  useFocusEffect(
    useCallback(() => {
      onFocused?.();
      trackEvent("admin_dashboard_focused", {
        screenId,
        isImpersonating: !!impersonating,
      });
      return () => {};
    }, [onFocused, trackEvent, screenId, impersonating])
  );

  // Action buttons
  const actions = (
    <>
      <Pressable
        style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => navigation.navigate('admin-settings')}
      >
        <Icon name="cog" size={20} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable
        style={[styles.actionButton, styles.primaryAction, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('users-create')}
      >
        <Icon name="plus" size={20} color="#FFFFFF" />
        <AppText style={styles.actionButtonText}>Add User</AppText>
      </Pressable>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Impersonation Banner */}
      {impersonating && (
        <View style={[styles.impersonationBanner, { backgroundColor: colors.tertiaryContainer }]}>
          <View style={styles.impersonationContent}>
            <Icon name="account-switch" size={18} color={colors.tertiary} />
            <AppText style={[styles.impersonationText, { color: colors.onTertiaryContainer }]}>
              Viewing as impersonated user
            </AppText>
          </View>
        </View>
      )}

      <WebAdminLayout
        title={t('admin:dashboard.title', { defaultValue: 'Admin Dashboard' })}
        subtitle={t('admin:dashboard.subtitle', { defaultValue: 'Overview of your coaching platform' })}
        breadcrumbs={[
          { label: 'Home', route: 'admin-home' },
          { label: 'Dashboard' },
        ]}
        actions={actions}
        headerContent={
          <QuickStats stats={quickStats} style={styles.quickStats} />
        }
      >
        {/* Dynamic Screen - Renders widgets from screen_layouts */}
        <DynamicScreen
          screenId={screenId}
          role={role as any}
          customerId={customerId}
          userId={user?.id || "demo-admin-001"}
          onFocused={onFocused}
        />
      </WebAdminLayout>
    </View>
  );
};

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
    gap: 8,
  },
  impersonationText: {
    fontSize: 13,
  },
  quickStats: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  primaryAction: {},
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;
