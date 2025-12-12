import { MD3_LIGHT_COLORS, MD3_DARK_COLORS } from "./colors";
import { useCustomerTheme, ExtendedTheme } from "../hooks/config/useCustomerTheme";
import { useThemeStore } from "../stores/themeStore";
import type { ThemeColors } from "../types/theme.types";
import type { 
  ElevationLevel, 
  ButtonStyle, 
  CardStyle, 
  InputStyle, 
  ChipStyle,
  ThemePreset 
} from "../types/config.types";

export type AppTheme = {
  colors: ThemeColors;
  roundness: number;
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  fontFamily: string;
  fontScale: number;
  elevation: {
    card: ElevationLevel;
    button: ElevationLevel;
  };
  // Component Styles
  componentStyles: {
    button: ButtonStyle;
    card: CardStyle;
    input: InputStyle;
    chip: ChipStyle;
  };
  // Theme Preset
  themePreset: ThemePreset;
};

const FALLBACK_THEME: AppTheme = {
  colors: MD3_LIGHT_COLORS,
  roundness: 12,
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  fontFamily: "System",
  fontScale: 1,
  elevation: {
    card: "low",
    button: "none",
  },
  componentStyles: {
    button: "filled",
    card: "elevated",
    input: "outlined",
    chip: "filled",
  },
  themePreset: "custom",
};

// Map elevation level to shadow style
export const ELEVATION_SHADOWS: Record<ElevationLevel, object> = {
  none: {},
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  high: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
};

export function useAppTheme(): AppTheme {
  const theme = useCustomerTheme();
  const { isDarkMode } = useThemeStore();
  
  // Base MD3 colors based on dark mode
  const baseColors = isDarkMode ? MD3_DARK_COLORS : MD3_LIGHT_COLORS;
  
  if (!theme) {
    return {
      ...FALLBACK_THEME,
      colors: baseColors,
    };
  }
  
  // Extract non-color properties
  const { 
    roundness, 
    borderRadiusSmall, 
    borderRadiusMedium, 
    borderRadiusLarge,
    fontFamily,
    fontScale,
    cardElevation,
    buttonElevation,
    buttonStyle,
    cardStyle,
    inputStyle,
    chipStyle,
    themePreset,
    // Light colors
    primary,
    onPrimary,
    primaryContainer,
    onPrimaryContainer,
    secondary,
    onSecondary,
    secondaryContainer,
    onSecondaryContainer,
    tertiary,
    background,
    onBackground,
    surface,
    onSurface,
    surfaceVariant,
    onSurfaceVariant,
    error,
    onError,
    success,
    warning,
    // Dark colors (from Platform Studio config)
    primaryDark,
    secondaryDark,
    backgroundDark,
    surfaceDark,
    onSurfaceDark,
    surfaceVariantDark,
    onSurfaceVariantDark,
    errorDark,
    successDark,
    warningDark,
    ...restColors 
  } = theme;
  
  // Build customer colors based on dark mode
  // In dark mode: use dark variants if available, otherwise DON'T fall back to light colors
  // This ensures dark mode actually looks dark
  const customerColors: Partial<ThemeColors> = isDarkMode
    ? {
        // Only apply dark variants if they exist - don't fall back to light colors
        ...(primaryDark && { primary: primaryDark }),
        ...(secondaryDark && { secondary: secondaryDark }),
        ...(backgroundDark && { background: backgroundDark }),
        ...(surfaceDark && { surface: surfaceDark }),
        ...(onSurfaceDark && { onSurface: onSurfaceDark }),
        ...(surfaceVariantDark && { surfaceVariant: surfaceVariantDark }),
        ...(onSurfaceVariantDark && { onSurfaceVariant: onSurfaceVariantDark }),
        ...(errorDark && { error: errorDark }),
        ...(successDark && { success: successDark }),
        ...(warningDark && { warning: warningDark }),
      }
    : {
        // Light mode - use standard colors (filter out undefined)
        ...(primary && { primary }),
        ...(onPrimary && { onPrimary }),
        ...(primaryContainer && { primaryContainer }),
        ...(onPrimaryContainer && { onPrimaryContainer }),
        ...(secondary && { secondary }),
        ...(onSecondary && { onSecondary }),
        ...(secondaryContainer && { secondaryContainer }),
        ...(onSecondaryContainer && { onSecondaryContainer }),
        ...(tertiary && { tertiary }),
        ...(background && { background }),
        ...(onBackground && { onBackground }),
        ...(surface && { surface }),
        ...(onSurface && { onSurface }),
        ...(surfaceVariant && { surfaceVariant }),
        ...(onSurfaceVariant && { onSurfaceVariant }),
        ...(error && { error }),
        ...(onError && { onError }),
        ...(success && { success }),
        ...(warning && { warning }),
      };
  
  return {
    colors: { ...baseColors, ...customerColors },
    roundness: roundness || 12,
    borderRadius: {
      small: borderRadiusSmall || 4,
      medium: borderRadiusMedium || roundness || 8,
      large: borderRadiusLarge || 16,
    },
    fontFamily: fontFamily === "System Default" ? "System" : (fontFamily || "System"),
    fontScale: fontScale || 1,
    elevation: {
      card: cardElevation || "low",
      button: buttonElevation || "none",
    },
    componentStyles: {
      button: buttonStyle || "filled",
      card: cardStyle || "elevated",
      input: inputStyle || "outlined",
      chip: chipStyle || "filled",
    },
    themePreset: themePreset || "custom",
  };
}
