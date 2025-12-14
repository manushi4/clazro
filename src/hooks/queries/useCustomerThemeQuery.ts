// React Query hook for fetching customer theme from Supabase
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerTheme, ThemeConfig } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";

// Default theme fallback
const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#6750A4",
  secondaryColor: "#958DA5",
  accentColor: "#7C4DFF",
  backgroundColor: "#FFFBFE",
  surfaceColor: "#FFFFFF",
  textColor: "#1C1B1F",
  errorColor: "#B3261E",
  successColor: "#4CAF50",
  warningColor: "#FF9800",
  infoColor: "#2196F3",
  fontFamily: "Inter",
  roundness: 12,
  cardElevation: "low",
  preset: "custom",
  componentStyles: {
    buttonStyle: "filled",
    inputStyle: "outlined",
    cardStyle: "elevated",
    chipStyle: "filled",
  },
};

export function useCustomerThemeQuery(customerId: string = DEMO_CUSTOMER_ID) {
  return useQuery<ThemeConfig, Error>({
    queryKey: ["customer-theme", customerId],
    queryFn: async () => {
      const theme = await fetchCustomerTheme(customerId);
      return theme || DEFAULT_THEME;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    enabled: !!customerId,
  });
}

export { DEFAULT_THEME };
