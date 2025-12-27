// React Query hook for fetching screen layout from Supabase
import { useQuery } from "@tanstack/react-query";
import { fetchScreenLayout, ScreenLayoutResult } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import type { Role } from "../../types/permission.types";

export function useScreenLayoutQuery(
  screenId: string,
  role: Role,
  customerId: string = DEMO_CUSTOMER_ID
) {
  return useQuery<ScreenLayoutResult, Error>({
    queryKey: ["screen-layout", customerId, role, screenId],
    queryFn: () => fetchScreenLayout(customerId, role, screenId),
    staleTime: 5 * 1000, // 5 seconds - faster refresh for development
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
    enabled: !!screenId && !!role && !!customerId,
  });
}
