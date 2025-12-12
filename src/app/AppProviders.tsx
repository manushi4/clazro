import React, { PropsWithChildren, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { NetworkProvider } from "../offline/networkStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { ensureOnlineManager, queryClient } from "../lib/queryClient";
import { useDemoUser } from "../hooks/useDemoUser";
import { AnalyticsService } from "../analytics/AnalyticsService";
import { initSentry, setUserContext, setTags } from "../error/sentry";
import { BrandingProvider } from "../context/BrandingContext";
import { GlobalErrorBoundary } from "../error/GlobalErrorBoundary";
import { DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
import { useThemeStore } from "../stores/themeStore";
import { initMutationQueue } from "../offline/mutationQueue";
import { initMutationHandlers } from "../offline/mutationHandlers";
import { NavigationTracker } from "../navigation/NavigationTracker";

// Inner component that can use hooks requiring QueryClient
const AppProvidersInner: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, customerSlug, role } = useDemoUser();
  const { isDarkMode, loadPersistedTheme } = useThemeStore();
  
  // Load persisted theme on mount
  useEffect(() => {
    loadPersistedTheme();
  }, [loadPersistedTheme]);
  
  // Set analytics and error tracking context
  AnalyticsService.setContext({ userId, customerId: customerSlug, role });
  setUserContext({ id: userId, customerId: customerSlug, role });

  // Select Paper theme based on dark mode
  const paperTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <GlobalErrorBoundary>
      <BrandingProvider customerId={DEMO_CUSTOMER_ID}>
        <PaperProvider theme={paperTheme}>
          <NavigationTracker>
            <NavigationContainer>
              {children}
            </NavigationContainer>
          </NavigationTracker>
        </PaperProvider>
      </BrandingProvider>
    </GlobalErrorBoundary>
  );
};

export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize services that don't need React Query
  ensureOnlineManager();
  initSentry();
  setTags({ environment: process.env.SENTRY_ENV || process.env.NODE_ENV || "development" });

  // Initialize offline mutation queue
  useEffect(() => {
    initMutationHandlers();
    initMutationQueue();
  }, []);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <NetworkProvider>
          <QueryClientProvider client={queryClient}>
            <AppProvidersInner>{children}</AppProvidersInner>
          </QueryClientProvider>
        </NetworkProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
};
