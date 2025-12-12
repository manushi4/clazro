// Branding Context - Provides white-label branding to entire app
import React, { createContext, useContext, ReactNode } from "react";
import { useCustomerBrandingQuery } from "../hooks/queries/useCustomerBrandingQuery";
import { CustomerBranding, DEFAULT_BRANDING } from "../types/branding.types";
import { DEMO_CUSTOMER_ID } from "../lib/supabaseClient";

type BrandingContextType = {
  branding: CustomerBranding;
  isLoading: boolean;
  error: Error | null;
};

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  error: null,
});

type BrandingProviderProps = {
  customerId?: string;
  children: ReactNode;
};

export function BrandingProvider({ 
  customerId = DEMO_CUSTOMER_ID, 
  children 
}: BrandingProviderProps) {
  const { data, isLoading, error } = useCustomerBrandingQuery(customerId);

  const value: BrandingContextType = {
    branding: data || DEFAULT_BRANDING,
    isLoading,
    error: error || null,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): CustomerBranding {
  const context = useContext(BrandingContext);
  return context.branding;
}

export function useBrandingContext(): BrandingContextType {
  return useContext(BrandingContext);
}
