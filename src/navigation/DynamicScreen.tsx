// DynamicScreen - Renders widgets from Supabase screen_layouts config
import React, { useEffect, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Alert } from "react-native";
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
import { DEFAULT_LAYOUT_SETTINGS } from "../services/config/configService";
import { usePermissions } from "../hooks/config/usePermissions";
import { useFeatures } from "../hooks/config/useFeatures";
import { useNetworkStatus } from "../offline/networkStore";
import { checkVisibilityRules } from "../utils/checkVisibilityRules";
import { DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
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

  // Handle widget navigation actions
  const handleWidgetNavigate = useCallback((route: string, params?: Record<string, any>) => {
    trackWidgetEvent("navigation", "click", { route, ...params });
    
    // Direct navigation - all routes should be registered in routeRegistry
    if (route) {
      if (__DEV__) {
        console.log(`[DynamicScreen] Navigating to: ${route}`, params);
      }
      try {
        navigation.navigate(route, params);
      } catch (e) {
        console.warn(`[DynamicScreen] Navigation failed for route: ${route}`, e);
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
    data: layoutData,
    isLoading: layoutLoading,
    error: layoutError,
    refetch: refetchLayout,
  } = useScreenLayoutQuery(screenId, role, customerId);

  // Extract widgets and layout settings
  const widgets = layoutData?.widgets;
  const layoutSettings = layoutData?.layoutSettings || DEFAULT_LAYOUT_SETTINGS;

  // Debug: log layout settings
  React.useEffect(() => {
    if (__DEV__ && layoutData) {
      console.log(`[DynamicScreen] Layout settings for ${screenId}:`, layoutSettings);
    }
  }, [screenId, layoutData, layoutSettings]);

  // Debug logging in dev mode - only log once per screen
  const hasLoggedRef = React.useRef<string>('');
  useEffect(() => {
    if (__DEV__ && widgets && hasLoggedRef.current !== screenId) {
      hasLoggedRef.current = screenId;
      console.log(`[DynamicScreen] screenId=${screenId}, role=${role}, widgets=`, widgets?.length ?? 0);
      if (widgets.length > 0) {
        console.log(`[DynamicScreen] Widget IDs:`, widgets.map(w => w.widgetId).join(', '));
      }
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

  // Track focus events - use ref to avoid dependency on onFocused changing
  const onFocusedRef = React.useRef(onFocused);
  onFocusedRef.current = onFocused;

  useFocusEffect(
    React.useCallback(() => {
      onFocusedRef.current?.();
      return () => {};
    }, [])
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
          <AppText
            style={[styles.retryButton, { color: colors.primary }]}
            onPress={() => refetchLayout()}
          >
            {t("actions.retry", { defaultValue: "Tap to retry" })}
          </AppText>
        </View>
      </View>
    );
  }

  // Empty state
  if (!enabledWidgets || enabledWidgets.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t("screens.empty", { defaultValue: "No content configured for this screen" })}
          </AppText>
        </View>
      </View>
    );
  }

  // For seamless style, use subtle section spacing (8px) for flow feel
  const effectiveGap = layoutSettings.containerStyle === "seamless" ? 8 : layoutSettings.gap;

  // Render widgets
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { padding: layoutSettings.padding, gap: effectiveGap }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={layoutLoading}
          onRefresh={refetchLayout}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {enabledWidgets.map((widgetConfig: ScreenWidgetConfig) => {
        const entry = getWidgetEntry(widgetConfig.widgetId);

        // Widget not found in registry
        if (!entry) {
          return (
            <View
              key={widgetConfig.widgetId}
              style={[
                styles.missingWidget,
                { backgroundColor: colors.errorContainer, borderRadius: roundness },
              ]}
            >
              <AppText style={[styles.missingText, { color: colors.onErrorContainer }]}>
                Widget not found: {widgetConfig.widgetId}
              </AppText>
            </View>
          );
        }

        const { component: WidgetComponent, metadata } = entry;

        // Check role access
        if (metadata.roles && !metadata.roles.includes(role)) {
          return null;
        }

        // Check feature dependency (skip in dev for easier debugging)
        // TODO: Re-enable strict feature checking in production
        // if (metadata.featureId && !enabledFeatureIds.includes(metadata.featureId)) {
        //   return null;
        // }

        // Check permissions
        if (
          metadata.requiredPermissions &&
          metadata.requiredPermissions.some((code) => !hasPermission(code))
        ) {
          return null;
        }

        // Check online requirement
        if (metadata.requiresOnline && !isOnline) {
          return (
            <View
              key={widgetConfig.widgetId}
              style={[
                styles.offlineWidget,
                { borderColor: colors.outline, borderRadius: roundness },
              ]}
            >
              <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
                {metadata.name || widgetConfig.widgetId} requires internet connection
              </AppText>
            </View>
          );
        }

        return (
          <WidgetErrorBoundary
            key={widgetConfig.widgetId}
            colors={{
              error: colors.error,
              errorContainer: colors.errorContainer,
              onErrorContainer: colors.onErrorContainer,
            }}
            roundness={roundness}
          >
            <WidgetContainer
              metadata={metadata}
              size={widgetConfig.size}
              customProps={widgetConfig.customProps}
              layoutSettings={layoutSettings}
            >
              <WidgetComponent
                customerId={customerId}
                userId={userId}
                role={role}
                config={widgetConfig.customProps || {}}
                branding={branding || DEFAULT_BRANDING}
                theme={theme}
                onNavigate={handleWidgetNavigate}
              />
            </WidgetContainer>
          </WidgetErrorBoundary>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    // padding and gap now applied dynamically from layoutSettings
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  retryButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  missingWidget: {
    padding: 12,
    marginBottom: 8,
  },
  missingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  offlineWidget: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  offlineText: {
    fontSize: 13,
  },
});
