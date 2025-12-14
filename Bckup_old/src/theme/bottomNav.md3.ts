/**
 * Bottom Navigation - MD3 Canonical Specification
 * Exact spec for Material Design 3 bottom navigation bar
 *
 * Constraints:
 * - 3-5 destinations (hard cap 5)
 * - Container height: 80dp (MD3 canonical)
 * - Labels: always visible (13sp/18/500)
 * - Active indicator: rounded pill behind active item
 * - Elevation: 1dp rest → 3dp scrolled
 */

import { Platform } from 'react-native';

export const BottomNavMD3 = {
  // Container
  height: 80,                        // MD3 canonical height

  // Item specs
  item: {
    icon: 24,                        // Visual icon size
    minTarget: 48,                   // Min tap target (48x48dp)
    label: {
      size: 13,                      // 13sp
      weight: '500' as const,        // Medium weight
      lineHeight: 18,                // 18sp line height
    },
    gapIconLabel: 8,                 // Gap between icon and label
  },

  // Active indicator (pill)
  indicator: {
    height: 32,                      // 32-36dp acceptable (using 32)
    paddingX: 12,                    // Horizontal padding around content
    radius: 12,                      // Border radius (match drawer)
    fill: {
      kind: 'primary-tonal' as const,
      alpha: 0.12,                   // 12% of primary color
    },
  },

  // Elevation
  elevation: {
    rest: 1,                         // At rest
    scrolled: 3,                     // On scroll (optional)
  },

  // Colors (exact from spec)
  colors: {
    container: '#FFFFFF',            // Surface
    active: '#2563EB',               // Primary (active icon/label)
    inactive: '#475569',             // onSurfaceVariant (inactive icon/label)
    dividerTop: '#E2E8F0',           // Optional 1dp hairline at top
  },

  // State layers (ripples)
  rippleAlpha: {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12,
    dragged: 0.16,
  },

  // Motion
  motionMs: 250,                     // Standard easing (selection transition)

  // Insets
  insets: {
    bottomMin: 16,                   // Minimum bottom padding
    horizontal: 16,                  // Horizontal padding
  },
};

/**
 * Calculate bottom padding with safe area
 * Formula: max(16dp, safeBottom)
 */
export function bottomPaddingWithSafeArea(safeBottom: number): number {
  return Math.max(BottomNavMD3.insets.bottomMin, safeBottom);
}

/**
 * Get active indicator background color (primary @ 12%)
 */
export function getIndicatorColor(): string {
  const alpha = Math.round(BottomNavMD3.indicator.fill.alpha * 255).toString(16).padStart(2, '0');
  return `${BottomNavMD3.colors.active}${alpha}`;
}

export default BottomNavMD3;
