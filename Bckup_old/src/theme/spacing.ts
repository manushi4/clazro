/**
 * Material Design 3 Spacing System
 * Consistent spacing and sizing values
 */

// Spacing scale (8dp base unit)
export const Spacing = {
  XS: 4,    // Extra small - 4dp
  SM: 8,    // Small - 8dp
  MD: 16,   // Medium - 16dp
  LG: 24,   // Large - 24dp
  XL: 32,   // Extra large - 32dp
  XXL: 48,  // Extra extra large - 48dp
  XXXL: 64, // Extra extra extra large - 64dp
};

// Border radius values
export const BorderRadius = {
  XS: 4,    // Extra small radius
  SM: 8,    // Small radius
  MD: 12,   // Medium radius
  LG: 16,   // Large radius
  XL: 20,   // Extra large radius
  XXL: 28,  // Extra extra large radius
  FULL: 9999, // Fully rounded
};

// Elevation (shadow depth)
export const Elevation = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 4,
  HIGHEST: 8,
  // Backward compatibility aliases
  Level1: 1,
  Level2: 2,
  Level3: 4,
  Level4: 8,
};

// Icon sizes
export const IconSize = {
  XS: 16,
  SM: 20,
  MD: 24,
  LG: 32,
  XL: 48,
  XXL: 64,
};

// Touch target sizes (Material Design minimum)
export const TouchTarget = {
  MIN: 48,  // Minimum touch target size
  SMALL: 40,
  MEDIUM: 48,
  LARGE: 56,
};

// Container sizes
export const Container = {
  MAX_WIDTH: 1200,  // Maximum content width
  PADDING: Spacing.MD,
  MARGIN: Spacing.MD,
};

// Screen breakpoints
export const Breakpoints = {
  MOBILE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
};

export default {
  Spacing,
  BorderRadius,
  Elevation,
  IconSize,
  TouchTarget,
  Container,
  Breakpoints,
};
