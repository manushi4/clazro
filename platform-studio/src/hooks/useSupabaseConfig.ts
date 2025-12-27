"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfigStore } from "@/stores/configStore";
import {
  loadFullConfig,
  saveNavigationTabs,
  saveScreenLayout,
  saveTheme,
  saveBranding,
  triggerConfigChangeEvent,
} from "@/services/configService";
import { Role, DEFAULT_THEME, DEFAULT_BRANDING } from "@/types";

// Default customer ID as fallback
const DEFAULT_CUSTOMER_ID = process.env.NEXT_PUBLIC_DEMO_CUSTOMER_ID || "";

export function useSupabaseConfig() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousCustomerIdRef = useRef<string | null>(null);

  const {
    customerId: storeCustomerId,
    setCustomerId,
    setTabs,
    setScreenLayout,
    setLayoutSettings,
    setTheme,
    setBranding,
    markSaved,
    selectedRole,
    tabs,
    screenLayouts,
    theme,
    branding,
  } = useConfigStore();

  // Use store customerId or fallback to default
  const customerId = storeCustomerId || DEFAULT_CUSTOMER_ID;

  // Load config from Supabase
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["config", customerId],
    queryFn: () => loadFullConfig(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset initialization when customer changes
  useEffect(() => {
    if (previousCustomerIdRef.current && previousCustomerIdRef.current !== customerId) {
      setIsInitialized(false);
      // Invalidate queries for the new customer
      queryClient.invalidateQueries({ queryKey: ["config", customerId] });
    }
    previousCustomerIdRef.current = customerId;
  }, [customerId, queryClient]);

  // Initialize store from Supabase data
  useEffect(() => {
    if (data && !isInitialized) {
      setCustomerId(customerId);

      // Set tabs for all roles
      if (data.tabs) {
        (["student", "teacher", "parent", "admin"] as Role[]).forEach((role) => {
          if (data.tabs[role] && data.tabs[role].length > 0) {
            setTabs(role, data.tabs[role]);
          }
        });
      }

      // Set screen layouts for all roles
      if (data.screenLayouts) {
        (["student", "teacher", "parent", "admin"] as Role[]).forEach((role) => {
          Object.entries(data.screenLayouts[role] || {}).forEach(([screenId, layout]) => {
            if (layout.widgets && layout.widgets.length > 0) {
              setScreenLayout(role, screenId, layout.widgets);
            }
            // Also set layout settings if present
            if (layout.layoutSettings) {
              setLayoutSettings(role, screenId, layout.layoutSettings);
            }
          });
        });
      }

      // Set theme
      if (data.theme) {
        setTheme(data.theme);
      }

      // Set branding
      if (data.branding) {
        setBranding(data.branding);
      }

      markSaved();
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  // Save tabs mutation
  const saveTabsMutation = useMutation({
    mutationFn: async (role: Role) => {
      await saveNavigationTabs(customerId, role, tabs[role]);
      await triggerConfigChangeEvent(customerId, "navigation_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", customerId] });
    },
  });

  // Save screen layout mutation
  const saveScreenMutation = useMutation({
    mutationFn: async ({ role, screenId }: { role: Role; screenId: string }) => {
      const layout = screenLayouts[role][screenId];
      const widgets = layout?.widgets || [];
      const layoutSettings = layout?.layoutSettings;
      await saveScreenLayout(customerId, role, screenId, widgets, layoutSettings);
      await triggerConfigChangeEvent(customerId, "layout_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", customerId] });
    },
  });

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      await saveTheme(customerId, theme);
      await triggerConfigChangeEvent(customerId, "theme_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", customerId] });
    },
  });

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      await saveBranding(customerId, branding);
      await triggerConfigChangeEvent(customerId, "branding_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", customerId] });
    },
  });

  return {
    isLoading,
    error,
    isInitialized,
    refetch,
    customerId,
    saveTabs: (role: Role) => saveTabsMutation.mutateAsync(role),
    saveScreen: (role: Role, screenId: string) => saveScreenMutation.mutateAsync({ role, screenId }),
    saveTheme: () => saveThemeMutation.mutateAsync(),
    saveBranding: () => saveBrandingMutation.mutateAsync(),
    isSaving:
      saveTabsMutation.isPending ||
      saveScreenMutation.isPending ||
      saveThemeMutation.isPending ||
      saveBrandingMutation.isPending,
  };
}
