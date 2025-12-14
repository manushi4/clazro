/**
 * Theme Creation Utility
 * Creates a theme by merging brand colors, spacing, radii, typography
 *
 * Usage:
 * const myTheme = createTheme({
 *   colors: { primary: '#2563EB' },
 *   spacing: { base: 16 },
 * });
 */

import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../theme/designSystem';

export interface Theme {
  colors: typeof Colors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof BorderRadius;
  shadows: typeof Shadows;
  layout: typeof Layout;
}

export interface ThemeOverrides {
  colors?: Partial<typeof Colors>;
  typography?: Partial<typeof Typography>;
  spacing?: Partial<typeof Spacing>;
  radius?: Partial<typeof BorderRadius>;
  shadows?: Partial<typeof Shadows>;
  layout?: Partial<typeof Layout>;
}

/**
 * Create a theme by merging overrides with defaults
 */
export const createTheme = (overrides?: ThemeOverrides): Theme => {
  return {
    colors: { ...Colors, ...overrides?.colors },
    typography: { ...Typography, ...overrides?.typography },
    spacing: { ...Spacing, ...overrides?.spacing },
    radius: { ...BorderRadius, ...overrides?.radius },
    shadows: { ...Shadows, ...overrides?.shadows },
    layout: { ...Layout, ...overrides?.layout },
  };
};

/**
 * Default theme
 */
export const defaultTheme = createTheme();

/**
 * Example: Teal theme variant
 */
export const tealTheme = createTheme({
  colors: {
    primary: '#14B8A6',
    primaryLight: '#5EEAD4',
    primaryDark: '#0F766E',
    primaryContainer: '#CCFBF1',
  },
});
