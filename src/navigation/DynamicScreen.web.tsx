/**
 * DynamicScreen - Web Version with Multi-Column Layout
 * Renders widgets from Supabase screen_layouts config in responsive grid
 */

import React, { useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAppTheme } from "../theme/useAppTheme";
import { useAnalytics } from "../hooks/useAnalytics";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { AppText } from "../ui/components/AppText";
import { useScreenLayoutQuery } from "../hooks/queries/useScreenLayoutQuery";
import { useCustomerBrandingQuery } from "../hooks/queries/useCustomerBrandingQuery";
import { useCustomerThemeQuery } from "../hooks/queries/useCustomerThemeQuery";
import { getWidgetEntry } from "../config/widgetRegistry";
import { WidgetContainer } from "../components/widgets/base/WidgetContainer";
import { WidgetErrorBoundary } from "../components/widgets/base/WidgetErrorBoundary";
import { usePermissions } from "../hooks/config/usePermissions";
import { useFeatures } from "../hooks/config/useFeatures";
import { useNetworkStatus } from "../offline/networkStore";
import { checkVisibilityRules } from "../utils/checkVisibilityRules";
import { DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
import { useResponsiveContext } from "../context/ResponsiveContext";
import { ResponsiveContainer } from "../components/layout/ResponsiveContainer";
import type { Role } from "../types/permission.types";
import type { ScreenWidgetConfig } from "../types/config.types";
import { DEFAULT_BRANDING } from "../types/branding.types";

type Props = {
  screenId: string;
  role?: Role;
  customerId?: string;
  userId?: string;
  onFocused?: () => void;
};

// Get widget column span based on size
const getWidgetSpan = (size: string, isDesktop: boolean, isTablet: boolean): number => {
  if (!isDesktop && !isTablet) return 4; // Full width on mobile

  switch (size) {
    case 'expanded':
      return isDesktop ? 4 : 4; // Full width
    case 'standard':
      return isDesktop ? 2 : 2; // Half width
    case 'compact':
      return isDesktop ? 1 : 2; // Quarter on desktop, half on tablet
    default:
      return isDesktop ? 2 : 4;
  }
};

export const DynamicScreen: React.FC<Props> = ({
  screenId,
  role = "student",
  customerId = DEMO_CUSTOMER_ID,
  userId = "demo-student-001",
  onFocused,
}) => {
  const { colors, roundness } = useAppTheme();
  const { trackScreenView, trackWidgetEvent } = useAnalytics();
  const { t } = useTranslation("common");
  const { isOnline } = useNetworkStatus();
  const { has: hasPermission, permissions } = usePermissions(role);
  const features = useFeatures();
  const navigation = useNavigation<any>();
  const { isDesktop, isTablet, isMobile } = useResponsiveContext();

  const [refreshing, setRefreshing] = React.useState(false);

  // Handle widget navigation actions
  const handleWidgetNavigate = useCallback((route: string, params?: Record<string, any>) => {
    trackWidgetEvent("navigation", "click", { route, ...params });

    if (route) {
      if (__DEV__) {
        console.log(`[DynamicScreen.web] Navigating to: ${route}`, params);
      }
      try {
        navigation.navigate(route, params);
      } catch (e) {
        console.warn(`[DynamicScreen.web] Navigation failed for route: ${route}`, e);
        Alert.alert(
          "Navigation Error",
          `Unable to navigate to ${route}. Please try again.`,
          [{ text: "OK" }]
        );
      }
    }
  }, [navigation, trackWidgetEvent]);

  // Fetch screen layout from Supabase
  const {
    data: widgets,
    isLoading: layoutLoading,
    error: layoutError,
    refetch: refetchLayout,
  } = useScreenLayoutQuery(screenId, role, customerId);

  // Debug logging
  useEffect(() => {
    if (__DEV__) {
      console.log(`[DynamicScreen.web] screenId=${screenId}, role=${role}, widgets=`, widgets?.length ?? 0);
    }
  }, [screenId, role, widgets]);

  // Fetch branding
  const { data: branding } = useCustomerBrandingQuery(customerId);

  // Fetch theme
  const { data: theme } = useCustomerThemeQuery(customerId);

  // Track screen view
  useEffect(() => {
    trackScreenView(screenId);
  }, [screenId, trackScreenView]);

  useFocusEffect(
    React.useCallback(() => {
      onFocused?.();
      return () => {};
    }, [onFocused])
  );

  // Build visibility context
  const enabledFeatureIds = useMemo(
    () => features.filter((f) => f.enabled).map((f) => f.featureId),
    [features]
  );

  const visibilityContext = useMemo(
    () => ({
      permissions: permissions || [],
      enabledFeatures: enabledFeatureIds,
      isOnline,
    }),
    [permissions, enabledFeatureIds, isOnline]
  );

  // Filter and sort widgets
  const enabledWidgets = useMemo(() => {
    if (!widgets) return [];

    return widgets
      .filter((w) => w.enabled)
      .filter((w) => checkVisibilityRules(w.visibilityRules, visibilityContext))
      .sort((a, b) => a.position - b.position);
  }, [widgets, visibilityContext]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchLayout();
    setRefreshing(false);
  }, [refetchLayout]);

  // Loading state
  if (layoutLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (layoutError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("errors.load_failed", { defaultValue: "Failed to load screen" })}
          </AppText>
        </View>
      </View>
    );
  }

  // Empty state
  if (!enabledWidgets.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t("status.no_content", { defaultValue: "No content available" })}
          </AppText>
        </View>
      </View>
    );
  }

  // Render widgets in responsive grid
  return (
    <ResponsiveContainer
      maxWidth="xl"
      padding={isDesktop ? 24 : 16}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={styles.gridContainer}>
        {enabledWidgets.map((widgetConfig) => {
          const entry = getWidgetEntry(widgetConfig.widgetId);
          if (!entry) {
            if (__DEV__) {
              console.warn(`[DynamicScreen.web] Widget not found: ${widgetConfig.widgetId}`);
            }
            return null;
          }

          const WidgetComponent = entry.component;
          const widgetSize = widgetConfig.size || entry.defaultSize || 'standard';
          const span = getWidgetSpan(widgetSize, isDesktop, isTablet);

          // Calculate width based on span (4-column grid)
          const widthPercent = isMobile ? '100%' : `${(span / 4) * 100}%`;

          return (
            <View
              key={widgetConfig.id}
              style={[
                styles.widgetWrapper,
                {
                  width: widthPercent,
                  padding: isDesktop ? 8 : 6,
                },
              ]}
            >
              <WidgetErrorBoundary widgetId={widgetConfig.widgetId}>
                <WidgetContainer
                  title={widgetConfig.customProps?.title || entry.title}
                  subtitle={widgetConfig.customProps?.subtitle}
                  icon={widgetConfig.customProps?.icon || entry.icon}
                  size={widgetSize as any}
                  accentColor={widgetConfig.customProps?.accentColor}
                  onPress={
                    entry.navigateTo
                      ? () => handleWidgetNavigate(entry.navigateTo!, widgetConfig.customProps)
                      : undefined
                  }
                >
                  <WidgetComponent
                    customerId={customerId}
                    userId={userId}
                    role={role}
                    config={widgetConfig.customProps}
                    branding={branding ?? DEFAULT_BRANDING}
                    theme={theme}
                    onNavigate={handleWidgetNavigate}
                  />
                </WidgetContainer>
              </WidgetErrorBoundary>
            </View>
          );
        })}
      </View>
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  widgetWrapper: {
    minWidth: 0,
  },
});

export default DynamicScreen;
