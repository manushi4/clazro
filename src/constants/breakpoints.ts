/**
 * Responsive Breakpoints
 * Used for web layout adaptations
 */

export const BREAKPOINTS = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  xxl: 1536, // Extra large
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const LAYOUT_MODES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
} as const;

export type LayoutMode = typeof LAYOUT_MODES[keyof typeof LAYOUT_MODES];

/**
 * Get layout mode from window width
 */
export const getLayoutMode = (width: number): LayoutMode => {
  if (width >= BREAKPOINTS.lg) return 'desktop';
  if (width >= BREAKPOINTS.md) return 'tablet';
  return 'mobile';
};

/**
 * Grid columns for different layout modes
 */
export const GRID_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
} as const;

/**
 * Container max widths
 */
export const CONTAINER_MAX_WIDTH = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1200,
  full: '100%',
} as const;

/**
 * Sidebar widths
 */
export const SIDEBAR_WIDTH = {
  collapsed: 64,
  expanded: 260,
} as const;

/**
 * Top navbar height
 */
export const NAVBAR_HEIGHT = 64;
