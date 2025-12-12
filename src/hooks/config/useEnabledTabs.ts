import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigationConfig } from "./useNavigationConfig";
import { fetchNavigationTabs } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import type { Role } from "../../types/permission.types";
import type { NavigationTabConfig } from "../../types/config.types";

/**
 * Hook to get enabled tabs for a role.
 * Fetches from Supabase first, falls back to local config if no data.
 */
export function useEnabledTabs(role: Role, customerId: string = DEMO_CUSTOMER_ID) {
  // Fetch from Supabase directly (inline to avoid circular dependency)
  const { data: supabaseTabs } = useQuery<NavigationTabConfig[], Error>({
    queryKey: ["navigation-tabs", customerId, role],
    queryFn: () => fetchNavigationTabs(customerId, role),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: !!role && !!customerId,
  });
  
  // Fallback to local config
  const nav = useNavigationConfig(role);
  const localTabs = nav.tabs;

  // Use Supabase tabs if available, otherwise use local config
  const tabs = useMemo(() => {
    if (supabaseTabs && supabaseTabs.length > 0) {
      return supabaseTabs;
    }
    return localTabs;
  }, [supabaseTabs, localTabs]);

  return tabs;
}
