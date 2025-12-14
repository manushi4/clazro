/**
 * Design Tokens - Centralized Theme System
 * Sprint 1 - Days 3-4: UI Shell
 *
 * Purpose: Single source of truth for all design tokens
 * - Colors (light & dark themes)
 * - Spacing & sizing
 * - Typography
 * - Elevation & shadows
 * - Border radius
 * - Breakpoints
 *
 * Usage:
 * ```typescript
 * import { tokens } from '@/theme/tokens';
 *
 * // Colors
 * backgroundColor: tokens.colors.light.Primary
 *
 * // Spacing
 * padding: tokens.spacing.MD
 *
 * // Typography
 * ...tokens.typography.titleLarge
 * ```
 */

import { LightTheme, DarkTheme, SemanticColors } from './colors';
import { Spacing, BorderRadius, Elevation, IconSize, TouchTarget, Container, Breakpoints } from './spacing';
import { Typography, FontFamily } from './typography';

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colorTokens = {
  light: LightTheme,
  dark: DarkTheme,
  semantic: SemanticColors,
};

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacingTokens = {
  // Base spacing (8dp scale)
  xs: Spacing.XS,    // 4dp
  sm: Spacing.SM,    // 8dp
  md: Spacing.MD,    // 16dp
  lg: Spacing.LG,    // 24dp
  xl: Spacing.XL,    // 32dp
  xxl: Spacing.XXL,  // 48dp
  xxxl: Spacing.XXXL, // 64dp

  // Semantic spacing
  gutter: Spacing.MD, // Default gutter (16dp)
  section: Spacing.XL, // Section spacing (32dp)
  component: Spacing.SM, // Component internal spacing (8dp)
};

// ============================================================================
// SIZING TOKENS
// ============================================================================

export const sizingTokens = {
  // Icon sizes
  icon: {
    xs: IconSize.XS,   // 16dp
    sm: IconSize.SM,   // 20dp
    md: IconSize.MD,   // 24dp
    lg: IconSize.LG,   // 32dp
    xl: IconSize.XL,   // 48dp
    xxl: IconSize.XXL, // 64dp
  },

  // Touch targets
  touch: {
    min: TouchTarget.MIN,    // 48dp (minimum)
    small: TouchTarget.SMALL,  // 40dp
    medium: TouchTarget.MEDIUM, // 48dp
    large: TouchTarget.LARGE,  // 56dp
  },

  // Container
  container: {
    maxWidth: Container.MAX_WIDTH,
    padding: Container.PADDING,
    margin: Container.MARGIN,
  },
};

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const radiusTokens = {
  xs: BorderRadius.XS,   // 4dp
  sm: BorderRadius.SM,   // 8dp
  md: BorderRadius.MD,   // 12dp
  lg: BorderRadius.LG,   // 16dp
  xl: BorderRadius.XL,   // 20dp
  xxl: BorderRadius.XXL, // 28dp
  full: BorderRadius.FULL, // 9999 (fully rounded)

  // Semantic radius
  button: BorderRadius.LG,    // 16dp
  card: BorderRadius.MD,      // 12dp
  input: BorderRadius.SM,     // 8dp
  chip: BorderRadius.FULL,    // Fully rounded
  sheet: BorderRadius.XXL,    // 28dp (bottom sheets)
};

// ============================================================================
// ELEVATION TOKENS (Shadows)
// ============================================================================

export const elevationTokens = {
  none: Elevation.NONE,    // 0
  low: Elevation.LOW,      // 1
  medium: Elevation.MEDIUM, // 2
  high: Elevation.HIGH,    // 4
  highest: Elevation.HIGHEST, // 8

  // Semantic elevation
  card: Elevation.LOW,      // Cards: 1
  button: Elevation.LOW,    // Buttons: 1
  fab: Elevation.MEDIUM,    // FAB: 2
  modal: Elevation.HIGH,    // Modals: 4
  drawer: Elevation.HIGH,   // Drawers: 4
  appBar: Elevation.MEDIUM, // App bar: 2
};

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typographyTokens = {
  // Display (large, prominent text)
  displayLarge: Typography.displayLarge,
  displayMedium: Typography.displayMedium,
  displaySmall: Typography.displaySmall,

  // Headline (section titles)
  headlineLarge: Typography.headlineLarge,
  headlineMedium: Typography.headlineMedium,
  headlineSmall: Typography.headlineSmall,

  // Title (subsections, cards)
  titleLarge: Typography.titleLarge,
  titleMedium: Typography.titleMedium,
  titleSmall: Typography.titleSmall,

  // Label (buttons, tabs, chips)
  labelLarge: Typography.labelLarge,
  labelMedium: Typography.labelMedium,
  labelSmall: Typography.labelSmall,

  // Body (content text)
  bodyLarge: Typography.bodyLarge,
  bodyMedium: Typography.bodyMedium,
  bodySmall: Typography.bodySmall,

  // Font families
  fontFamily: FontFamily,
};

// ============================================================================
// BREAKPOINT TOKENS
// ============================================================================

export const breakpointTokens = {
  mobile: Breakpoints.MOBILE,   // 0
  tablet: Breakpoints.TABLET,   // 768
  desktop: Breakpoints.DESKTOP, // 1024
  wide: Breakpoints.WIDE,       // 1440
};

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animationTokens = {
  // Duration (milliseconds)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Easing curves
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },
};

// ============================================================================
// OPACITY TOKENS
// ============================================================================

export const opacityTokens = {
  disabled: 0.38,
  inactive: 0.5,
  pressed: 0.12,
  hover: 0.08,
  focus: 0.12,
  selected: 0.08,
  divider: 0.12,
};

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  drawer: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  toast: 1090,
};

// ============================================================================
// COMBINED TOKENS EXPORT
// ============================================================================

export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  sizing: sizingTokens,
  radius: radiusTokens,
  elevation: elevationTokens,
  typography: typographyTokens,
  breakpoints: breakpointTokens,
  animation: animationTokens,
  opacity: opacityTokens,
  zIndex: zIndexTokens,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get spacing value by multiplier
 * @example getSpacing(2) // 16dp (2 * 8dp)
 */
export const getSpacing = (multiplier: number): number => {
  return Spacing.SM * multiplier;
};

/**
 * Get elevation shadow style for React Native
 */
export const getElevation = (level: number) => {
  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: level,
    },
    shadowOpacity: 0.1 + (level * 0.02),
    shadowRadius: level * 2,
    elevation: level,
  };
};

/**
 * Get responsive value based on breakpoint
 */
export const getResponsiveValue = <T,>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T => {
  // In React Native, we'll need to check dimensions
  // For now, return mobile value
  return mobile;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorTheme = typeof LightTheme;
export type Spacing = typeof spacingTokens;
export type Typography = typeof typographyTokens;
export type Tokens = typeof tokens;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default tokens;

/**
 * USAGE EXAMPLES:
 *
 * 1. Import tokens:
 * ```typescript
 * import { tokens } from '@/theme/tokens';
 * // or
 * import tokens from '@/theme/tokens';
 * ```
 *
 * 2. Use in styles:
 * ```typescript
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: tokens.colors.light.Surface,
 *     padding: tokens.spacing.md,
 *     borderRadius: tokens.radius.card,
 *     ...tokens.elevation.card,
 *   },
 *   title: {
 *     ...tokens.typography.titleLarge,
 *     color: tokens.colors.light.OnSurface,
 *     marginBottom: tokens.spacing.sm,
 *   },
 *   button: {
 *     height: tokens.sizing.touch.medium,
 *     borderRadius: tokens.radius.button,
 *     paddingHorizontal: tokens.spacing.lg,
 *   },
 * });
 * ```
 *
 * 3. Use utility functions:
 * ```typescript
 * import { getSpacing, getElevation } from '@/theme/tokens';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: getSpacing(2), // 16dp
 *     ...getElevation(2), // Medium elevation
 *   },
 * });
 * ```
 *
 * 4. Theme switching:
 * ```typescript
 * const { theme } = useTheme(); // 'light' | 'dark'
 * const colors = tokens.colors[theme];
 *
 * <View style={{ backgroundColor: colors.Surface }} />
 * ```
 */
