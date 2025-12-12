"use client";

import { useEffect, useState } from "react";
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

const DEMO_CUSTOMER_ID = process.env.NEXT_PUBLIC_DEMO_CUSTOMER_ID || "";

export function useSupabaseConfig() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    setCustomerId,
    setTabs,
    setScreenLayout,
    setTheme,
    setBranding,
    markSaved,
    selectedRole,
    tabs,
    screenLayouts,
    theme,
    branding,
  } = useConfigStore();

  // Load config from Supabase
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["config", DEMO_CUSTOMER_ID],
    queryFn: () => loadFullConfig(DEMO_CUSTOMER_ID),
    enabled: !!DEMO_CUSTOMER_ID,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize store from Supabase data
  useEffect(() => {
    if (data && !isInitialized) {
      setCustomerId(DEMO_CUSTOMER_ID);

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
      await saveNavigationTabs(DEMO_CUSTOMER_ID, role, tabs[role]);
      await triggerConfigChangeEvent(DEMO_CUSTOMER_ID, "navigation_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", DEMO_CUSTOMER_ID] });
    },
  });

  // Save screen layout mutation
  const saveScreenMutation = useMutation({
    mutationFn: async ({ role, screenId }: { role: Role; screenId: string }) => {
      const widgets = screenLayouts[role][screenId]?.widgets || [];
      await saveScreenLayout(DEMO_CUSTOMER_ID, role, screenId, widgets);
      await triggerConfigChangeEvent(DEMO_CUSTOMER_ID, "layout_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", DEMO_CUSTOMER_ID] });
    },
  });

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      await saveTheme(DEMO_CUSTOMER_ID, theme);
      await triggerConfigChangeEvent(DEMO_CUSTOMER_ID, "theme_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", DEMO_CUSTOMER_ID] });
    },
  });

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      await saveBranding(DEMO_CUSTOMER_ID, branding);
      await triggerConfigChangeEvent(DEMO_CUSTOMER_ID, "branding_updated");
    },
    onSuccess: () => {
      markSaved();
      queryClient.invalidateQueries({ queryKey: ["config", DEMO_CUSTOMER_ID] });
    },
  });

  return {
    isLoading,
    error,
    isInitialized,
    refetch,
    customerId: DEMO_CUSTOMER_ID,
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
