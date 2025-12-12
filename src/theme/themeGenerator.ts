import type { ThemeConfig } from "../types/config.types";
import type { ThemeColors } from "../types/theme.types";
import { MD3_LIGHT_COLORS } from "./colors";

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0").toUpperCase()}`;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - percent)));
  const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0").toUpperCase()}`;
}

export function generateThemeFromConfig(config: ThemeConfig): ThemeColors {
  const surface = config.surfaceColor || MD3_LIGHT_COLORS.surface;
  const primary = config.primaryColor || MD3_LIGHT_COLORS.primary;
  
  // Generate surfaceVariant from surface (slightly darker/tinted)
  // If surface is white (#FFFFFF), make surfaceVariant a light gray (#F5F5F5)
  const surfaceVariant = surface.toUpperCase() === "#FFFFFF" 
    ? "#F5F5F5" 
    : darkenColor(surface, 0.05);
  
  // Generate primaryContainer from primary (lighter version)
  const primaryContainer = lightenColor(primary, 0.85);
  
  return {
    ...MD3_LIGHT_COLORS,
    primary,
    onPrimary: MD3_LIGHT_COLORS.onPrimary,
    primaryContainer,
    onPrimaryContainer: darkenColor(primary, 0.3),
    secondary: config.secondaryColor || MD3_LIGHT_COLORS.secondary,
    tertiary: config.accentColor || MD3_LIGHT_COLORS.tertiary,
    surface,
    surfaceVariant,
    background: config.backgroundColor || MD3_LIGHT_COLORS.background,
    onSurface: config.textColor || MD3_LIGHT_COLORS.onSurface,
    onSurfaceVariant: config.textSecondaryColor || MD3_LIGHT_COLORS.onSurfaceVariant,
    onBackground: config.textColor || MD3_LIGHT_COLORS.onBackground,
    error: config.errorColor || MD3_LIGHT_COLORS.error,
    success: config.successColor || MD3_LIGHT_COLORS.success,
    warning: config.warningColor || MD3_LIGHT_COLORS.warning,
    info: config.infoColor || MD3_LIGHT_COLORS.info,
  };
}
