import React from "react";
import { StatusBar, StyleSheet, View, useColorScheme, ActivityIndicator } from "react-native";
import { useAppTheme } from "../theme/useAppTheme";
import { useCustomerConfig } from "../hooks/config/useCustomerConfig";
import { useConfigStore } from "../stores/configStore";
import { useDemoUser } from "../hooks/useDemoUser";
import { DynamicTabNavigator } from "../navigation";
import { useTranslation } from "react-i18next";
import { useInit } from "../hooks/useInit";
import { useBackgroundSync } from "../hooks/useBackgroundSync";
import { useConfigSubscription } from "../hooks/useConfigSubscription";
import { useLanguageChangeInvalidation } from "../hooks/useLanguageChangeInvalidation";
import { AppText } from "../ui/components/AppText";
import { useBranding } from "../context/BrandingContext";
import { DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
import { DevRoleSwitcher } from "../components/dev/DevRoleSwitcher";

/**
 * Main app content - rendered inside all providers.
 * Shows the tab navigator as the main UI.
 */
export const AppContent: React.FC = () => {
  const { customerSlug, userId, role } = useDemoUser();
  const { isInitialized, isLoading, error } = useConfigStore();
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");
  const initReady = useInit();
  const branding = useBranding();
  const colorScheme = useColorScheme();
  
  useBackgroundSync();
  useCustomerConfig(customerSlug, role, userId);
  useConfigSubscription(DEMO_CUSTOMER_ID); // Real-time sync with Platform Studio
  useLanguageChangeInvalidation(); // Invalidate content queries on language change

  const statusBarStyle = colorScheme === "dark" ? "light-content" : "dark-content";

  // Loading state
  if (!initReady || isLoading || !isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="body" style={[styles.loadingText, { color: colors.onBackground }]}>
          {branding?.appName || t("app.loading", { defaultValue: "Loading..." })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={statusBarStyle} />
        <AppText variant="title" style={[styles.errorTitle, { color: colors.error }]}>
          {t("status.error", { defaultValue: "Something went wrong" })}
        </AppText>
        <AppText variant="body" style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
          {error}
        </AppText>
      </View>
    );
  }

  // Main app - Tab Navigator takes full screen
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={statusBarStyle} />
      <DynamicTabNavigator role={role} />
      {__DEV__ && <DevRoleSwitcher />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
  },
});
