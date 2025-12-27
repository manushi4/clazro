// React Query hook for fetching customer branding from Supabase
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerBranding } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import { CustomerBranding, DEFAULT_BRANDING } from "../../types/branding.types";

export function useCustomerBrandingQuery(customerId: string = DEMO_CUSTOMER_ID) {
  return useQuery<CustomerBranding, Error>({
    queryKey: ["customer-branding", customerId],
    queryFn: async () => {
      const branding = await fetchCustomerBranding(customerId);
      return branding || DEFAULT_BRANDING;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 10 minutes for faster branding updates)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    enabled: !!customerId,
    refetchOnWindowFocus: true, // Refetch branding when app comes to foreground
    refetchOnMount: true, // Always check for latest branding on mount
  });
}
