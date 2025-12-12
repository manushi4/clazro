/**
 * Drawer (Modal Side Navigation) Tokens
 * Adjusted for safe area - 65% width instead of 80%
 *
 * Direction: Slides in from left, exits to left
 * Width: 65% of screen width (max 320dp for safety)
 * Header: 64dp
 * Rows: 56dp (≥48dp tap target)
 */

import { Dimensions } from 'react-native';

export const Drawer = {
  /**
   * Calculate drawer width based on screen width
   * Formula: 65% of screen width (max 320dp)
   */
  widthRule(screenWidthDp: number): number {
    const percentage = 0.65; // 65% instead of 80%
    const maxWidth = 320; // Reduced from 360dp
    const calculatedWidth = screenWidthDp * percentage;
    return Math.min(maxWidth, Math.max(240, calculatedWidth));
  },

  /**
   * Get current drawer width for device
   */
  getWidth(): number {
    const { width } = Dimensions.get('window');
    return this.widthRule(width);
  },

  // Dimensions
  headerHeight: 64,       // Account area height
  rowHeight: 56,          // List item height (≥48dp tap target)
  paddingX: 16,           // Left/right padding
  iconGap: 12,            // Gap between icon and label
  radius: 12,             // Border radius for cards/active indicators
  elevation: 1,           // Shadow elevation

  // Colors (exact from spec)
  colors: {
    bg: '#F8FAFC',        // surfaceAlt - drawer background
    text: '#0F172A',      // Primary text
    text2: '#475569',     // Secondary text (meta)
    divider: '#E2E8F0',   // Divider @ 0.8 opacity
    activeTint: '#2563EB', // Primary color for active items
    scrim: 'rgba(15,23,42,0.32)', // Scrim overlay (text @ 32%)
  },

  // State layers (ripples/overlays)
  state: {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12,
    dragged: 0.16,
  },

  // Motion
  motionMs: 250,          // Animation duration (MD3 standard)

  // Typography
  typography: {
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    meta: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },

  // Icon sizes
  iconSize: {
    leading: 24,          // Leading icon (24-32dp)
    trailing: 20,         // Trailing chevron (20-24dp)
  },

  // Hit slop for small touch targets
  hitSlop: {
    all: 8,               // Add 8dp all around if visuals < 48dp
  },
};

export default Drawer;
