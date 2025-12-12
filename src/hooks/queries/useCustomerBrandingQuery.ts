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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    enabled: !!customerId,
  });
}
