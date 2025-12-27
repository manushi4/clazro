import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ThemeService } from "../../services/config/themeService";
import { useConfigStore } from "../../stores/configStore";
import { generateThemeFromConfig } from "../../theme/themeGenerator";
import { fetchCustomerTheme } from "../../services/config/configService";
import { DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";
import type { ThemeColors } from "../../types/theme.types";
import type { 
  ThemeConfig, 
  ElevationLevel, 
  FontFamily,
  ButtonStyle,
  CardStyle,
  InputStyle,
  ChipStyle,
  ThemePreset,
} from "../../types/config.types";

// Extended theme type that includes colors and all theme properties
export type ExtendedTheme = ThemeColors & {
  roundness?: number;
  borderRadiusSmall?: number;
  borderRadiusMedium?: number;
  borderRadiusLarge?: number;
  fontFamily?: FontFamily;
  fontScale?: number;
  cardElevation?: ElevationLevel;
  buttonElevation?: ElevationLevel;
  // Component Styles
  buttonStyle?: ButtonStyle;
  cardStyle?: CardStyle;
  inputStyle?: InputStyle;
  chipStyle?: ChipStyle;
  // Theme Preset
  themePreset?: ThemePreset;
  // Dark Mode Colors
  primaryDark?: string;
  secondaryDark?: string;
  backgroundDark?: string;
  surfaceDark?: string;
  onSurfaceDark?: string;
  surfaceVariantDark?: string;
  onSurfaceVariantDark?: string;
  errorDark?: string;
  successDark?: string;
  warningDark?: string;
  darkModeEnabled?: boolean;
};

/**
 * Hook to get customer theme.
 * Fetches from Supabase first, falls back to local config.
 */
export function useCustomerTheme(customerId: string = DEMO_CUSTOMER_ID): ExtendedTheme | null {
  // Fetch from Supabase
  const { data: supabaseTheme } = useQuery({
    queryKey: ["customer-theme", customerId],
    queryFn: () => fetchCustomerTheme(customerId),
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes for faster theme updates)
    gcTime: 30 * 60 * 1000,
    retry: 2,
    enabled: !!customerId,
    refetchOnWindowFocus: true, // Refetch theme when app comes to foreground
    refetchOnMount: true, // Always check for latest theme on mount
  });

  // Fallback to local config store
  const config = useConfigStore((state) => state.config);
  const localTheme = config ? ThemeService.getTheme(config) : null;

  // Merge theme data
  const theme = useMemo(() => {
    // Prefer Supabase theme if available
    const themeConfig = supabaseTheme || localTheme;
    if (!themeConfig) return null;

    // Generate base colors
    const colors = generateThemeFromConfig(themeConfig as ThemeConfig);

    // Return extended theme with all properties
    return {
      ...colors,
      roundness: (themeConfig as any).roundness || 12,
      borderRadiusSmall: (themeConfig as any).borderRadiusSmall || 4,
      borderRadiusMedium: (themeConfig as any).borderRadiusMedium || 8,
      borderRadiusLarge: (themeConfig as any).borderRadiusLarge || 16,
      fontFamily: (themeConfig as any).fontFamily || "System Default",
      fontScale: (themeConfig as any).fontScale || 1,
      cardElevation: (themeConfig as any).cardElevation || "low",
      buttonElevation: (themeConfig as any).buttonElevation || "none",
      // Component Styles
      buttonStyle: (themeConfig as any).buttonStyle || "filled",
      cardStyle: (themeConfig as any).cardStyle || "elevated",
      inputStyle: (themeConfig as any).inputStyle || "outlined",
      chipStyle: (themeConfig as any).chipStyle || "filled",
      // Theme Preset
      themePreset: (themeConfig as any).themePreset || "custom",
      // Dark Mode Colors
      primaryDark: (themeConfig as any).primaryColorDark,
      secondaryDark: (themeConfig as any).secondaryColorDark,
      backgroundDark: (themeConfig as any).backgroundColorDark,
      surfaceDark: (themeConfig as any).surfaceColorDark,
      onSurfaceDark: (themeConfig as any).textColorDark,
      surfaceVariantDark: (themeConfig as any).surfaceColorDark, // Use surface as variant fallback
      onSurfaceVariantDark: (themeConfig as any).textSecondaryColorDark,
      errorDark: (themeConfig as any).errorColorDark,
      successDark: (themeConfig as any).successColorDark,
      warningDark: (themeConfig as any).warningColorDark,
      darkModeEnabled: (themeConfig as any).darkModeEnabled !== false,
    } as ExtendedTheme;
  }, [supabaseTheme, localTheme]);

  return theme;
}
