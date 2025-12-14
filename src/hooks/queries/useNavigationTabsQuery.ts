// React Query hook for fetching navigation tabs from Supabase
import { useQuery } from "@tanstack/react-query";
import { fetchNavigationTabs } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import type { Role } from "../../types/permission.types";
import type { NavigationTabConfig } from "../../types/config.types";

export function useNavigationTabsQuery(
  role: Role,
  customerId: string = DEMO_CUSTOMER_ID
) {
  return useQuery<NavigationTabConfig[], Error>({
    queryKey: ["navigation-tabs", customerId, role],
    queryFn: () => fetchNavigationTabs(customerId, role),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: !!role && !!customerId,
  });
}
