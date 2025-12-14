// Hook for accessing customer branding (white-label support)
import { useCustomerBrandingQuery } from "../queries/useCustomerBrandingQuery";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import { CustomerBranding, DEFAULT_BRANDING } from "../../types/branding.types";

export function useCustomerBranding(customerId: string = DEMO_CUSTOMER_ID): CustomerBranding {
  const { data, isLoading, error } = useCustomerBrandingQuery(customerId);
  
  // Return branding data or default
  return data || DEFAULT_BRANDING;
}

export function useCustomerBrandingWithStatus(customerId: string = DEMO_CUSTOMER_ID) {
  const { data, isLoading, error } = useCustomerBrandingQuery(customerId);
  
  return {
    branding: data || DEFAULT_BRANDING,
    isLoading,
    error,
  };
}
